# -*- coding: utf-8 -*-
# Penjaga request ganda (double klik / double submit) berbasis Redis.
# Sengaja fail-open: kalau Redis bermasalah, transaksi tetap jalan seperti sebelumnya.

from __future__ import unicode_literals
import frappe

LOCK_TTL = 300
REQUEST_ID_TTL = 86400

REQUEST_PROCESSING = '__processing__'
REQUEST_DONE_PREFIX = 'done:'


def _cache_key(prefix, key):
	return frappe.cache().make_key('vet_{0}:{1}'.format(prefix, key))


def acquire_lock(key, ttl=LOCK_TTL):
	"""True kalau lock didapat. False kalau proses lain sedang memegang lock yang sama."""
	try:
		return bool(frappe.cache().set(_cache_key('lock', key), 1, nx=True, ex=ttl))
	except Exception:
		frappe.log_error(frappe.get_traceback(), 'request_guard acquire_lock')
		return True


def release_lock(key):
	try:
		frappe.cache().delete(_cache_key('lock', key))
	except Exception:
		frappe.log_error(frappe.get_traceback(), 'request_guard release_lock')


def claim_request_id(request_id, ttl=REQUEST_ID_TTL):
	"""True kalau request_id belum pernah diproses. Tanpa request_id (klien lama) selalu True."""
	if not request_id:
		return True
	try:
		return bool(frappe.cache().set(_cache_key('lock', 'req:' + request_id), REQUEST_PROCESSING, nx=True, ex=ttl))
	except Exception:
		frappe.log_error(frappe.get_traceback(), 'request_guard claim_request_id')
		return True


def release_request_id(request_id):
	"""Dipanggil saat transaksi gagal, supaya user bisa mencoba lagi dengan request_id yang sama."""
	if request_id:
		release_lock('req:' + request_id)


def mark_request_done(request_id, ref=''):
	"""Tandai request_id selesai (sudah commit). Retry dengan request_id yang sama akan dijawab
	'sudah diproses' beserta ref (mis. nama dokumen yang dibuat), bukan diproses ulang."""
	if not request_id:
		return
	try:
		frappe.cache().set(_cache_key('lock', 'req:' + request_id), REQUEST_DONE_PREFIX + (ref or ''), ex=REQUEST_ID_TTL)
	except Exception:
		frappe.log_error(frappe.get_traceback(), 'request_guard mark_request_done')


def get_request_status(request_id):
	"""(None, None) belum pernah ada, ('processing', None) sedang jalan, ('done', ref) sudah selesai."""
	if not request_id:
		return None, None
	try:
		value = frappe.cache().get(_cache_key('lock', 'req:' + request_id))
	except Exception:
		frappe.log_error(frappe.get_traceback(), 'request_guard get_request_status')
		return None, None
	if value is None:
		return None, None
	if isinstance(value, bytes):
		value = value.decode('utf-8')
	value = str(value)
	if value.startswith(REQUEST_DONE_PREFIX):
		return 'done', value[len(REQUEST_DONE_PREFIX):]
	return 'processing', None


def is_error_result(result):
	if isinstance(result, tuple):
		# (result, ref) dari fungsi yang dijalankan run_guarded
		result = result[0] if result else None
	if isinstance(result, dict) and result.get('error'):
		return True
	if isinstance(result, list) and result and all(isinstance(r, dict) and r.get('error') for r in result):
		return True
	return False


def _noop_commit(*args, **kwargs):
	pass


def run_atomic(fn, *args, **kwargs):
	"""Jalankan fn sebagai satu transaksi DB: semua perubahan tersimpan, atau tidak ada sama sekali.

	frappe.db.commit() di dalam fn (dan helper yang dipanggilnya: journal, stok, owner credit)
	ditahan sampai fn selesai, lalu commit sekali. Kalau fn raise exception atau mengembalikan
	{'error': ...}, semua perubahan di-rollback. Kalau worker mati di tengah (timeout gunicorn),
	transaksi tidak pernah di-commit sehingga MariaDB membatalkannya otomatis.

	Bisa bersarang: panggilan di dalam run_atomic lain memakai savepoint, sehingga kegagalan
	bagian dalam hanya membatalkan bagian itu dan transaksi luar yang memutuskan commit."""
	# objek Database asli, bukan LocalProxy frappe.db, karena method commit-nya di-override sementara
	db = frappe.local.db
	depth = getattr(frappe.local, 'vet_atomic_depth', 0)

	if depth:
		savepoint = 'vet_atomic_{0}'.format(depth)
		db.sql('savepoint {0}'.format(savepoint))
		frappe.local.vet_atomic_depth = depth + 1
		try:
			result = fn(*args, **kwargs)
		except Exception:
			db.sql('rollback to savepoint {0}'.format(savepoint))
			raise
		finally:
			frappe.local.vet_atomic_depth = depth
		if is_error_result(result):
			db.sql('rollback to savepoint {0}'.format(savepoint))
		return result

	# Pemanggil yang belum atomik mungkin punya perubahan belum ter-commit; simpan dulu supaya
	# rollback di bawah hanya membatalkan pekerjaan fn, bukan pekerjaan pemanggil.
	db.commit()
	frappe.local.vet_atomic_depth = 1
	db.commit = _noop_commit
	try:
		result = fn(*args, **kwargs)
	except Exception:
		_end_atomic(db)
		db.rollback()
		raise
	_end_atomic(db)

	if is_error_result(result):
		db.rollback()
		_log_error_result(fn, result)
	else:
		db.commit()
	return result


def _end_atomic(db):
	frappe.local.vet_atomic_depth = 0
	# hapus override instance, kembali ke method commit asli milik class
	db.__dict__.pop('commit', None)


def _log_error_result(fn, result):
	# Hanya error dari exception yang ditelan (except Exception as e: return {'error': e}),
	# bukan pesan validasi biasa. Dicatat sesudah rollback supaya Error Log ikut tersimpan.
	errors = result if isinstance(result, list) else [result]
	if any(isinstance(r.get('error'), Exception) for r in errors if isinstance(r, dict)):
		try:
			frappe.log_error('{0}\n\n{1}'.format(getattr(fn, '__name__', fn), result), 'run_atomic rollback')
		except Exception:
			pass


def run_guarded(lock_key, request_id, fn, *args, **kwargs):
	"""run_atomic + tolak request ganda.

	- request_id sama yang sudah sukses: dijawab {'already_processed': True, 'ref': ...}
	  tanpa diproses ulang (aman untuk retry sesudah koneksi putus).
	- request_id sama yang masih berjalan, atau lock_key sedang dipegang: ditolak, minta tunggu.
	- Gagal (rollback): request_id dilepas supaya bisa dicoba lagi.
	fn boleh mengembalikan tuple (result, ref); ref disimpan untuk jawaban retry."""
	if not claim_request_id(request_id, LOCK_TTL):
		status, ref = get_request_status(request_id)
		if status == 'done':
			return {'already_processed': True, 'ref': ref}
		return {'error': "Transaksi ini sedang diproses, mohon tunggu"}

	if lock_key and not acquire_lock(lock_key):
		release_request_id(request_id)
		return {'error': "Transaksi sedang diproses, mohon tunggu"}

	try:
		result = run_atomic(fn, *args, **kwargs)
	except Exception:
		release_request_id(request_id)
		raise
	finally:
		# lock dilepas sesudah commit, supaya request berikutnya melihat data yang sudah final
		if lock_key:
			release_lock(lock_key)

	ref = ''
	if isinstance(result, tuple):
		result, ref = result

	if is_error_result(result):
		release_request_id(request_id)
	else:
		mark_request_done(request_id, ref)
	return result
