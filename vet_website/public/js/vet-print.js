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

	/**
	 * Cetak satu elemen lewat iframe tersembunyi.
	 *
	 * options:
	 *   pageSize    - nilai untuk `@page { size: ... }`. Default: lebar elemen x auto,
	 *                 sehingga tidak ada penskalaan dan struk panjang mengalir apa adanya.
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

			var pageSize = opt.pageSize || (source.offsetWidth || source.scrollWidth) + 'px auto';
			var margin = opt.margin != undefined ? opt.margin : '0';

			var iframe = document.createElement('iframe');
			iframe.setAttribute('aria-hidden', 'true');
			iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
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

				var base = doc.createElement('base');
				base.href = window.location.origin + '/';
				doc.head.appendChild(base);

				// Salin seluruh CSS halaman — elemen cetak memakai class Bootstrap
				// (mis. `#pdf.px-4`), jadi tanpa ini layoutnya hancur.
				var copied = [];
				Array.prototype.forEach.call(document.head.querySelectorAll('link[rel="stylesheet"], style'), function (node) {
					var clone = node.cloneNode(true);
					doc.head.appendChild(clone);
					copied.push(clone);
				});

				var pageStyle = doc.createElement('style');
				pageStyle.textContent = [
					'@page { size: ' + pageSize + '; margin: ' + margin + '; }',
					'html, body { margin: 0; padding: 0; background: #fff; }',
					// Area cetak biasanya `position-absolute` dan struk mini dikecilkan
					// dengan `transform: scale(78%)` agar pas di canvas html2canvas.
					// Di jalur print native ukuran halaman sudah sesuai elemen, jadi
					// keduanya dinetralkan supaya tidak tercetak mengecil di sudut.
					'body > * { position: static !important; transform: none !important; box-shadow: none !important; }',
					'* { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }',
					opt.css || ''
				].join('\n');
				doc.head.appendChild(pageStyle);

				doc.body.className = document.body.className;
				doc.body.innerHTML = source.outerHTML;

				var waitables = copied.concat(Array.prototype.slice.call(doc.body.querySelectorAll('img')));

				waitFor(waitables, STYLE_TIMEOUT).then(function () {
					var win = iframe.contentWindow;

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
