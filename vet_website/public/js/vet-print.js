/**
 * vet-print.js — helper cetak & unduh PDF bersama.
 *
 * Kenapa ada file ini:
 *
 *  - Pola lama `html2pdf().….get('pdf').then(pdf => window.open(pdf.output('bloburl')))`
 *    tidak bisa diandalkan di Chrome. `window.open` dijalankan setelah render
 *    html2canvas (2-10 detik), jadi transient user activation sudah hilang dan
 *    popup diblokir. Selain itu `autoPrint()` memakai OpenAction JavaScript yang
 *    dihormati pdf.js (Firefox) tapi diabaikan PDF viewer Chrome, dan tab `blob:`
 *    tidak pernah dirender kalau setelan PDF Chrome = "Download PDFs" atau ada
 *    ekstensi PDF pihak ketiga. Efeknya: spinner yang tidak pernah selesai.
 *    `printElement()` di bawah memakai iframe tersembunyi + `window.print()`,
 *    yang tidak butuh user activation, popup, maupun PDF viewer.
 *
 *  - Tidak ada satu pun call site lama yang punya `.catch()`, jadi kegagalan apa
 *    pun meninggalkan state loading menyala selamanya. `vetPrint.run()` memaksa
 *    loading selalu direset dan errornya ditampilkan.
 */
window.vetPrint = (function () {
	'use strict';

	var LIB_ERROR = 'Komponen cetak gagal dimuat. Silakan muat ulang halaman (Ctrl+F5) lalu coba lagi.';
	var STYLE_TIMEOUT = 5000;

	function resolveElement(elementOrId) {
		var el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;

		if (!el) {
			throw new Error('Elemen cetak "' + elementOrId + '" tidak ditemukan di halaman ini.');
		}

		return el;
	}

	// Ketiga library ini berat (~553 KB) dan HANYA dibutuhkan tombol unduh PDF —
	// printElement() sama sekali tidak memakainya. Karena itu ketiganya tidak ikut
	// di web_include_js, melainkan dimuat saat pertama kali benar-benar dipakai.
	var LIB_FILES = [
		'/assets/vet_website/js/html2canvas.min.js',
		'/assets/vet_website/js/jspdf.min.js',
		'/assets/vet_website/js/html2pdf.js'
	];

	var libsPromise = null;

	function libsPresent() {
		return typeof html2canvas !== 'undefined'
			&& typeof jsPDF !== 'undefined'
			&& typeof html2pdf !== 'undefined';
	}

	function loadScript(src) {
		return new Promise(function (resolve, reject) {
			var script = document.createElement('script');
			script.src = src;
			// async=false menjaga urutan eksekusi; lihat catatan di ensureLibs().
			script.async = false;
			script.onload = function () { resolve(); };
			script.onerror = function () { reject(new Error(LIB_ERROR)); };
			document.head.appendChild(script);
		});
	}

	/**
	 * Pastikan html2canvas / jsPDF / html2pdf siap dipakai, memuatnya kalau perlu.
	 *
	 * Urutan pemuatan wajib berurutan, bukan paralel: UMD di html2pdf.js membaca
	 * `global.jsPDF` dan `global.html2canvas` saat file itu di-parse, jadi kalau
	 * html2pdf sempat ter-parse lebih dulu ia akan menerima `undefined`.
	 *
	 * Hasilnya di-cache di `libsPromise` supaya klik berulang tidak memuat ulang,
	 * dan direset saat gagal supaya percobaan berikutnya masih bisa berhasil.
	 */
	function ensureLibs() {
		if (libsPresent()) {
			return Promise.resolve();
		}

		if (!libsPromise) {
			libsPromise = LIB_FILES.reduce(function (chain, src) {
				return chain.then(function () { return loadScript(src); });
			}, Promise.resolve()).then(function () {
				if (!libsPresent()) {
					throw new Error(LIB_ERROR);
				}
			})['catch'](function (e) {
				libsPromise = null;
				throw e;
			});
		}

		return libsPromise;
	}

	function waitFor(nodes, timeout) {
		// Hanya <link> dan <img> yang memuat resource eksternal. <style> inline
		// tidak pernah memancarkan 'load', jadi kalau ikut ditunggu setiap cetak
		// akan tertahan sampai timeout.
		var pending = nodes.filter(function (node) {
			if (node.tagName === 'LINK') {
				return true;
			}

			return node.tagName === 'IMG' && !node.complete;
		});

		if (!pending.length) {
			return Promise.resolve();
		}

		var loaded = new Promise(function (resolve) {
			var remaining = pending.length;

			function done() {
				remaining -= 1;
				if (remaining <= 0) {
					resolve();
				}
			}

			pending.forEach(function (node) {
				node.addEventListener('load', done);
				node.addEventListener('error', done);
			});
		});

		// Jangan pernah menggantung karena satu stylesheet/gambar tidak merespons.
		var expired = new Promise(function (resolve) {
			setTimeout(resolve, timeout);
		});

		return Promise.race([loaded, expired]);
	}

	/**
	 * Tunggu sampai sebuah elemen muncul di DOM. Dipakai untuk area cetak yang
	 * dirender oleh komponen React yang mengambil datanya sendiri (mis. struk POS),
	 * menggantikan `setTimeout(..., 3000)` yang dulu dipakai untuk menebak.
	 */
	function waitForElement(elementId, timeout) {
		var limit = timeout || 15000;

		return new Promise(function (resolve, reject) {
			var started = Date.now();

			(function poll() {
				var el = document.getElementById(elementId);

				if (el) {
					resolve(el);
					return;
				}

				if (Date.now() - started >= limit) {
					reject(new Error('Data cetak belum siap. Silakan coba cetak ulang dari daftar transaksi.'));
					return;
				}

				setTimeout(poll, 100);
			})();
		});
	}

	var PX_PER_MM = 96 / 25.4;

	/**
	 * Skalakan elemen cetak agar pas selebar kertas.
	 *
	 * `zoom` dipakai lebih dulu karena ia mengubah layout, sehingga isi yang lebih
	 * panjang dari satu halaman tetap terpecah ke halaman berikutnya dengan benar.
	 * `transform: scale()` tidak mengubah kotak layout, jadi hanya dipakai sebagai
	 * cadangan untuk browser lama (Firefox < 126) — di sana isi yang melebihi satu
	 * halaman bisa terpotong.
	 */
	function applyScale(win, doc, el, k) {
		var supportsZoom = win.CSS && win.CSS.supports && win.CSS.supports('zoom', '1.5');

		if (supportsZoom) {
			el.style.zoom = k;
			return;
		}

		var rect = el.getBoundingClientRect();
		var wrapper = doc.createElement('div');
		wrapper.style.cssText = 'width:' + (rect.width * k) + 'px;'
			+ 'height:' + (rect.height * k) + 'px;'
			+ 'overflow:hidden;';

		el.parentNode.insertBefore(wrapper, el);
		wrapper.appendChild(el);
		el.style.transformOrigin = 'top left';
		el.style.transform = 'scale(' + k + ')';
	}

	/**
	 * Cetak satu elemen lewat iframe tersembunyi.
	 *
	 * Ukuran kertas selalu dinyatakan dalam milimeter, dan isi elemen diskalakan
	 * otomatis agar pas selebar kertas — itulah pengganti `transform: scale(78%)`
	 * yang dulu dipakai struk mini demi html2canvas.
	 *
	 * options:
	 *   pageWidth   - lebar kertas dalam mm (mis. 210 untuk A4, 73 untuk struk).
	 *                 Default: lebar natural elemen.
	 *   pageHeight  - tinggi kertas dalam mm, atau 'auto' agar tinggi kertas
	 *                 mengikuti panjang isi (untuk struk gulungan).
	 *   margin      - nilai untuk `@page { margin: ... }`. Default '0'.
	 *   css         - CSS tambahan yang disuntikkan ke dalam iframe.
	 *   waitTimeout - kalau diisi, tunggu elemen muncul dulu (lihat waitForElement).
	 */
	function printElement(elementOrId, options) {
		var opt = options || {};

		if (opt.waitTimeout && typeof elementOrId === 'string') {
			return waitForElement(elementOrId, opt.waitTimeout).then(function (el) {
				var next = Object.assign({}, opt);
				delete next.waitTimeout;
				return printElement(el, next);
			});
		}

		return new Promise(function (resolve, reject) {
			var source;

			try {
				source = resolveElement(elementOrId);
			} catch (e) {
				reject(e);
				return;
			}

			var autoHeight = opt.pageHeight === 'auto';
			var pageWidthMm = opt.pageWidth
				|| (source.offsetWidth || source.scrollWidth || 210) / PX_PER_MM;
			var pageHeightMm = autoHeight ? null : opt.pageHeight;
			var margin = opt.margin != undefined ? opt.margin : '0';

			var iframe = document.createElement('iframe');
			iframe.setAttribute('aria-hidden', 'true');
			// Iframe harus punya viewport yang masuk akal: dengan width/height 0
			// layout di dalamnya terjadi pada lebar nol, sehingga pengukuran untuk
			// penskalaan salah. Disembunyikan dengan digeser ke luar layar, bukan
			// dengan visibility:hidden yang bisa menunda pemuatan gambar.
			iframe.style.cssText = 'position:fixed;left:-10000px;top:0;'
				+ 'width:1200px;height:1600px;border:0;';
			document.body.appendChild(iframe);

			var cleaned = false;
			function cleanup() {
				if (cleaned) {
					return;
				}
				cleaned = true;
				if (iframe.parentNode) {
					iframe.parentNode.removeChild(iframe);
				}
			}

			function fail(e) {
				cleanup();
				reject(e instanceof Error ? e : new Error(e));
			}

			try {
				var doc = iframe.contentDocument;
				doc.open();
				doc.write('<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>');
				doc.close();

				// baseURI, bukan origin: URL relatif di dalam area cetak harus
				// diselesaikan persis seperti di halaman asalnya.
				var base = doc.createElement('base');
				base.href = document.baseURI || window.location.href;
				doc.head.appendChild(base);

				// Salin seluruh CSS halaman — elemen cetak memakai class Bootstrap
				// (mis. `#pdf.px-4`), jadi tanpa ini layoutnya hancur.
				var copied = [];
				Array.prototype.forEach.call(document.head.querySelectorAll('link[rel="stylesheet"], style'), function (node) {
					var clone = node.cloneNode(true);
					doc.head.appendChild(clone);
					copied.push(clone);
				});

				function writePageCss(heightMm) {
					pageStyle.textContent = [
						'@page { size: ' + pageWidthMm + 'mm ' + heightMm + 'mm; margin: ' + margin + '; }',
						'html, body { margin: 0; padding: 0; background: #fff; }',
						'* { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }',

						// Bootstrap 4 menyertakan aturan cetak bawaan:
						//   @media print { @page { size: a3 } body, .container { min-width: 992px !important } }
						// Body selebar 992px pada kertas A4 (793.7px) membuat Chrome
						// mengecilkan seluruh halaman ~0.80x, sehingga isi tidak pernah
						// memenuhi kertas dan tulisan mengecil. Aturan di bawah ini
						// membatalkannya — style ini disisipkan paling akhir sehingga
						// menang melawan !important milik Bootstrap.
						'@media print {',
						'  html, body {',
						'    width: ' + pageWidthMm + 'mm !important;',
						'    min-width: 0 !important;',
						'    max-width: none !important;',
						'    margin: 0 !important;',
						'    padding: 0 !important;',
						'  }',
						'  .container, .container-fluid { min-width: 0 !important; max-width: none !important; }',
						'}',

						opt.css || ''
					].join('\n');
				}

				var pageStyle = doc.createElement('style');
				// Tinggi sementara; nilai finalnya ditulis ulang setelah diukur.
				writePageCss(pageHeightMm || 297);
				doc.head.appendChild(pageStyle);

				doc.body.className = document.body.className;
				doc.body.innerHTML = source.outerHTML;

				var printed = doc.body.firstElementChild;

				if (printed) {
					// Area cetak biasanya `position-absolute` dan struk mini memakai
					// `transform: scale(78%)` supaya pas di canvas html2canvas.
					// Keduanya dinetralkan agar pengukuran memakai ukuran natural.
					printed.style.position = 'static';
					printed.style.boxShadow = 'none';
					printed.style.transform = 'none';
					printed.style.transformOrigin = 'top left';

					// min-height dipasang semata demi ukuran canvas html2canvas dan
					// selalu dibuang di sini. Pada kertas gulungan ia bikin struk
					// pendek jadi kepanjangan; pada A4 lebih halus tapi lebih parah:
					// 794px x 1.42 = 1127px, yaitu 5px lebih tinggi dari A4 (1122.5px),
					// sehingga invoice pendek pun tumpah ke halaman kedua yang kosong.
					printed.style.minHeight = '0';
					printed.style.height = 'auto';
				}

				var waitables = copied.concat(Array.prototype.slice.call(doc.body.querySelectorAll('img')));

				waitFor(waitables, STYLE_TIMEOUT).then(function () {
					var win = iframe.contentWindow;

					// PENTING: pengukuran baru sah setelah stylesheet & gambar selesai
					// dimuat. Mengukur tepat setelah innerHTML memberi 0 karena iframe
					// belum melakukan layout, dan penskalaan jadi tidak pernah jalan.
					if (printed) {
						var rect = printed.getBoundingClientRect();
						var naturalW = rect.width || printed.scrollWidth;
						var naturalH = rect.height || printed.scrollHeight;
						var targetW = pageWidthMm * PX_PER_MM;
						var k = 1;

						if (naturalW) {
							k = targetW / naturalW;

							if (k > 0 && Math.abs(k - 1) > 0.002) {
								applyScale(win, doc, printed, k);
							}
						}

						if (autoHeight) {
							// Ambil yang terbesar: penskalaan bisa mengubah pembungkusan
							// teks sehingga isi jadi lebih tinggi dari sekadar naturalH*k,
							// sementara sebagian browser melaporkan rect tanpa efek zoom.
							var scaledH = Math.max(
								naturalH * k,
								printed.getBoundingClientRect().height
							);

							// +1px agar pembulatan tidak melahirkan halaman kedua kosong.
							pageHeightMm = (Math.ceil(scaledH) + 1) / PX_PER_MM;
						}
					}

					writePageCss(pageHeightMm || 297);

					// Chrome membatalkan dialog kalau iframe dilepas terlalu cepat,
					// jadi pembersihan hanya lewat afterprint (plus jaring pengaman).
					win.onafterprint = cleanup;
					setTimeout(cleanup, 120000);

					// Beri satu frame supaya iframe selesai layout sebelum dialog
					// dibuka; tanpa ini Chrome kadang mencetak halaman kosong.
					setTimeout(function () {
						try {
							win.focus();
							win.print();
							resolve();
						} catch (e) {
							fail(e);
						}
					}, 50);
				}, fail);
			} catch (e) {
				fail(e);
			}
		});
	}

	function defaultPdfOptions(opt) {
		var merged = Object.assign({
			margin: [0, 0, 0, 0],
			pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', '.row'] }
		}, opt || {});

		// scale 3 melewati batas memori canvas Chrome di komputer RAM kecil dan
		// menghasilkan canvas kosong tanpa exception. 2 sudah cukup tajam.
		merged.html2canvas = Object.assign({ scale: 2 }, merged.html2canvas || {});

		return merged;
	}

	/**
	 * Unduh satu elemen sebagai PDF. Download tidak pernah diblokir popup
	 * blocker, jadi jalur ini aman — yang penting error tidak ditelan.
	 */
	function savePdf(elementOrId, opt) {
		return ensureLibs().then(function () {
			var source = resolveElement(elementOrId);

			return html2pdf().set(defaultPdfOptions(opt)).from(source).save();
		});
	}

	/**
	 * Unduh beberapa elemen sebagai satu PDF, satu elemen per halaman.
	 * Menggantikan blok worker manual yang sebelumnya diduplikasi di banyak
	 * halaman laporan (`div[id^="pdf-"]`).
	 */
	function savePdfMulti(elements, opt) {
		return ensureLibs().then(function () {
			var list = Array.prototype.slice.call(elements || []);

			if (!list.length) {
				throw new Error('Tidak ada data yang bisa dicetak.');
			}

			var merged = defaultPdfOptions(opt);
			var worker = html2pdf().set(merged).from(list[0]);

			if (list.length > 1) {
				worker = worker.toPdf();

				list.slice(1).forEach(function (element) {
					worker = worker
						.get('pdf')
						.then(function (pdf) { pdf.addPage(); })
						.set(merged)
						.from(element)
						.toCanvas()
						.toPdf();
				});
			}

			return worker.save();
		});
	}

	/**
	 * Jalankan sebuah promise cetak sambil menyalakan/mematikan indikator loading.
	 * Loading SELALU dimatikan, sukses maupun gagal.
	 *
	 *   vetPrint.run(vetPrint.printElement('pdf'), v => this.setState({print_loading: v}))
	 */
	function run(promise, setLoading) {
		var toggle = typeof setLoading === 'function' ? setLoading : function () {};

		toggle(true);

		return Promise.resolve(promise).then(function (result) {
			toggle(false);
			return result;
		}, function (error) {
			toggle(false);
			console.error('vetPrint:', error);
			var message = (error && error.message) || String(error);
			if (window.frappe && frappe.msgprint) {
				frappe.msgprint(message);
			} else {
				alert(message);
			}
		});
	}

	return {
		ensureLibs: ensureLibs,
		waitForElement: waitForElement,
		printElement: printElement,
		savePdf: savePdf,
		savePdfMulti: savePdfMulti,
		pdfOptions: defaultPdfOptions,
		run: run
	};
})();
