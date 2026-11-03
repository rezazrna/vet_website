# -*- coding: utf-8 -*-
# Penjaga request ganda (double klik / double submit) berbasis Redis.
# Sengaja fail-open: kalau Redis bermasalah, transaksi tetap jalan seperti sebelumnya.

from __future__ import unicode_literals
import frappe

LOCK_TTL = 300
REQUEST_ID_TTL = 86400


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
	return acquire_lock('req:' + request_id, ttl)


def release_request_id(request_id):
	"""Dipanggil saat transaksi gagal, supaya user bisa mencoba lagi dengan request_id yang sama."""
	if request_id:
		release_lock('req:' + request_id)


def is_error_result(result):
	if isinstance(result, dict) and result.get('error'):
		return True
	if isinstance(result, list) and result and all(isinstance(r, dict) and r.get('error') for r in result):
		return True
	return False
