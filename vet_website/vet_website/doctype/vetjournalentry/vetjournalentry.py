# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
from traceback import print_tb
import frappe
import json
from datetime import datetime as dt
from frappe.model.document import Document
from frappe.utils import cint, flt, getdate
# from vet_website.vet_website.doctype.vetjournalitem.vetjournalitem import set_journal_item_total

class VetJournalEntry(Document):
	pass
	# def after_insert(self):
	# 	for ji in self.journal_items:
	# 		print('ununu ' + ji.name)
	# 		set_journal_item_total(ji.name)
		# set_journal_item_total(self.name)
		
@frappe.whitelist()
def get_journal_entry_list(filters=None):
	default_sort = "creation desc, date desc"
	je_filters = []
	je_or_filters = []
	filter_json = False
	page = 1
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
		
	if filter_json:
		filters_json = filter_json.get('filters', False)
		reference = filter_json.get('reference', False)
		currentpage = filter_json.get('currentpage', False)
		search = filter_json.get('search', False)

		if currentpage:
			page = currentpage
		
		if filters_json:
			for fj in filters_json:
				je_filters.append(fj)

		if search:
			je_or_filters.append({'name': ['like', '%'+search+'%']})
			je_or_filters.append({'period': ['like', '%'+search+'%']})
			je_or_filters.append({'journal_name': ['like', '%'+search+'%']})
			je_or_filters.append({'reference': ['like', '%'+search+'%']})
			je_or_filters.append({'status': ['like', '%'+search+'%']})
			je_or_filters.append({'keterangan': ['like', '%'+search+'%']})
			
		if reference:
			je_filters.append({'reference': reference})
	
	try:
		journals = frappe.get_list("VetJournal", fields=["name","journal_name"])
		journal_entry_search = frappe.get_list("VetJournalEntry", or_filters=je_or_filters,  filters=je_filters, fields=["*"], order_by=default_sort, start=(page - 1) * 10, page_length= 10)
		datalength = len(frappe.get_all("VetJournalEntry", or_filters=je_or_filters, filters=je_filters, as_list=True))

		for j in journal_entry_search:
			journal_items = frappe.get_list("VetJournalItem", filters={'parent': j.name}, fields=['debit','credit'])
			j['amount'] = (sum(ji.debit for ji in journal_items) + sum(ji.credit for ji in journal_items))/2
			j['journal_name'] = frappe.db.get_value('VetJournal', j.journal, 'journal_name')
			j['show'] = False
			j['loaded'] = False
		    

		return {'journal_entries': journal_entry_search, 'journals': journals, 'datalength': datalength}
		
	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()
def get_name_list(filters=None):
	default_sort = "creation desc, date desc"
	je_filters = []
	je_or_filters = []
	filter_json = False
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
		
	if filter_json:
		filters_json = filter_json.get('filters', False)
		reference = filter_json.get('reference', False)
		search = filter_json.get('search', False)
		
		if filters_json:
			for fj in filters_json:
				je_filters.append(fj)

		if search:
			je_or_filters.append({'name': ['like', '%'+search+'%']})
			je_or_filters.append({'period': ['like', '%'+search+'%']})
			je_or_filters.append({'journal_name': ['like', '%'+search+'%']})
			je_or_filters.append({'reference': ['like', '%'+search+'%']})
			je_or_filters.append({'status': ['like', '%'+search+'%']})
			
		if reference:
			je_filters.append({'reference': reference})
	
	try:
		namelist = frappe.get_list("VetJournalEntry", or_filters=je_or_filters, filters=je_filters, order_by=default_sort, as_list=True)    

		return list(map(lambda item: item[0], namelist))
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def delete_journal_entry(data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal menghapus operasi"}
	
	delete_journal_entries(data_json)
	frappe.db.commit()
		
	return {'success': True}
	
@frappe.whitelist()
def get_journal_entry_form(name=False):
	try:
		account_list = frappe.get_list('VetCoa', fields=['*'])
		journal_list = frappe.get_list('VetJournal', fields=['*'])
		form_data = {'journal_list': journal_list, 'account_list': account_list}
		if name:
			je_search = frappe.get_list("VetJournalEntry", filters={'name': name}, fields=['*'])
			journal_entry = je_search[0]
			journal_entry['journal_name'] = frappe.db.get_value('VetJournal', journal_entry.journal, 'journal_name')
			journal_items = frappe.get_list('VetJournalItem', filters={'parent': journal_entry.name}, fields=['*'])
			for ji in journal_items:
				ji.account_name = frappe.db.get_value('VetCoa', ji.account, 'account_name')
				ji.account_code = frappe.db.get_value('VetCoa', ji.account, 'account_code')
			journal_entry['journal_items'] = journal_items
			form_data.update({'journal_entry': journal_entry})
			
		return form_data
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def new_journal_entry(data):
	try:
		data_json = json.loads(data)
		
		if not data_json.get('name'):
			
			je_data = {}
			je_data.update(data_json)
			je_data.update({'status': 'Posted'})
			je_data.pop('journal_items')

			# Kunci akun dulu sebelum insert item, lihat lock_accounts.
			lock_accounts([s.get('account') for s in data_json.get("journal_items")])

			# Header, semua item, dan saldo berjalannya disimpan dalam satu savepoint: kalau gagal
			# di tengah, tidak ada journal setengah jadi atau item dengan total belum dihitung.
			new_items = []
			frappe.db.sql("savepoint vet_new_journal_entry")
			try:
				je = frappe.new_doc('VetJournalEntry')
				je.update(je_data)
				je.insert()

				for s in data_json.get("journal_items"):
					if s.get('account', False):
						new_ji = frappe.new_doc('VetJournalItem')
						new_ji.update({
							'account': s.get('account', False),
							'debit': s.get('debit', 0),
							'credit': s.get('credit', 0),
							'parent': je.name,
							'parenttype': 'VetJournalEntry',
							'parentfield': 'journal_items'
						})
						new_ji.insert()
						new_items.append(new_ji)

				recomputed = set()
				for new_ji in new_items:
					if new_ji.account not in recomputed:
						recomputed.add(new_ji.account)
						set_journal_item_total(new_ji.name, new_ji.account)
			except Exception:
				frappe.db.sql("rollback to savepoint vet_new_journal_entry")
				raise

			frappe.db.commit()

			# post_journal_entry(je.name)
			
		else :
			je = frappe.get_doc('VetJournalEntry', data_json.get('name'))
			old_date = je.date
			affected = get_journal_accounts(parents=[je.name])
			lock_accounts([s.get('account') for s in data_json.get("journal_items")] + [a.account for a in affected])
			je_data = {}
			je_data.update(data_json)
			je_data.pop('journal_items')
			je.update(je_data)
			je.save()
			
			for s in data_json.get("journal_items"):
				if s.get('account', False):
					if s.get('name'):
						set_total = False
						if s.get('delete') == True:
							ji = frappe.get_doc('VetJournalItem', s.get('name'))
							ji.update({
								'account': s.get('account', False),
								'debit': 0,
								'credit': 0,
							})
							ji.save()
							set_total = True
						else:
							ji = frappe.get_doc('VetJournalItem', s.get('name'))
							if ji.account != s.get('account', False):
								ji.update({
									'debit': 0,
									'credit': 0,
								})
								ji.save()

								set_total = True
								
								new_ji = frappe.new_doc('VetJournalItem')
								new_ji.update({
									'account': s.get('account', False),
									'debit': s.get('debit', 0),
									'credit': s.get('credit', 0),
									'parent': je.name, 
									'parenttype': 'VetJournalEntry',
									'parentfield': 'journal_items'
								})
								new_ji.insert()
								
								set_journal_item_total(new_ji.name, new_ji.account)
								
							else:
								set_total = ji.debit != s.get('debit', 0) or ji.credit != s.get('credit', 0)

								ji.update({
									'account': s.get('account', False),
									'debit': s.get('debit', 0),
									'credit': s.get('credit', 0),
								})
								ji.save()

						print('set_total')
						print(set_total)
						if set_total:
							set_journal_item_total(ji.name, ji.account)
					else :
						new_ji = frappe.new_doc('VetJournalItem')
						new_ji.update({
							'account': s.get('account', False),
							'debit': s.get('debit', 0),
							'credit': s.get('credit', 0),
							'parent': je.name, 
							'parenttype': 'VetJournalEntry',
							'parentfield': 'journal_items'
						})
						new_ji.insert()
						
						set_journal_item_total(new_ji.name, new_ji.account)

			# Tanggal berubah: urutan item di semua akun journal ini ikut berubah
			if getdate(je.date) != getdate(old_date):
				for a in affected:
					a.date = min(getdate(je.date), getdate(old_date))
				recompute_accounts(affected)

			frappe.db.commit()
		
		return get_journal_entry_form(je.name)
		
	except PermissionError as e:
		return {'error': e}
		
		
@frappe.whitelist()
def post_journal_entry(name):
	try:
		data_check = frappe.get_list('VetJournalEntry', filters={'name': name}, fields=['name', 'status'])
		if len(data_check) != 0:
			je = frappe.get_doc('VetJournalEntry', name)
			# for s in je.journal_items:
			# 	ji = frappe.get_doc("VetJournalItem", s.name)
			# 	set_journal_item_total(ji.name, ji.account)
			
			if je.status == 'Unposted':
				je.status = 'Posted'
				je.save()
			return je
			
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_journal_entry_detail(name):
	try:
		journal_items = frappe.get_list('VetJournalItem', filters={'parent': name}, fields=['*'])
		for ji in journal_items:
			ji.account_name = frappe.db.get_value('VetCoa', ji.account, 'account_name')
			ji.account_code = frappe.db.get_value('VetCoa', ji.account, 'account_code')
		return journal_items
	except:
		return {'error': "Gagal mendapatkan children"}

@frappe.whitelist()
def reconcile_account(account, date):
	journal_entry_names = []

	journal_entry_search = frappe.get_list("VetJournalEntry", filters={'date': ['<=', date]}, fields=["name"], order_by='date desc, reference desc')

	if len(journal_entry_search):
		journal_entry_names = list(j.name for j in journal_entry_search)

	journal_items = []
	if journal_entry_names:
		journal_items = frappe.get_list('VetJournalItem', filters={'parent': ['in', journal_entry_names], 'account': account}, fields=['name', 'parent'])

		attach_entry_fields(journal_items, ('date',))

		journal_items.sort(key=lambda x: x.date, reverse=True)

	if not journal_items:
		journal_entry_search = frappe.get_list("VetJournalEntry", filters={'date': ['>', date]}, fields=["name"], order_by='date desc, reference desc')

		if len(journal_entry_search):
			journal_entry_names = list(j.name for j in journal_entry_search)

		journal_items = []
		if journal_entry_names:
			journal_items = frappe.get_list('VetJournalItem', filters={'parent': ['in', journal_entry_names], 'account': account}, fields=['name', 'parent'])

			attach_entry_fields(journal_items, ('date',))

			journal_items.sort(key=lambda x: x.date)

	if journal_items:
		set_journal_item_total(journal_items[0]['name'], account)
		frappe.db.commit()
		return True

	return False
		
# def set_journal_item_total(name, account, je_names=False):
# 	filters = [{'account': account}]

# 	# if je_names == False:
# 	# 	journal_entry_name = frappe.db.get_value('VetJournalItem', name, 'parent')
# 	# 	min_date = frappe.db.get_value('VetJournalEntry', journal_entry_name, 'date')
# 	# 	# print('min_date')
# 	# 	# print(min_date)
# 	# 	if min_date:
# 	# 		journal_entry_search = frappe.get_list("VetJournalEntry", filters={'date': ['>=', min_date]}, fields=["name"], order_by="date desc")
# 	# 		# print('len je search')
# 	# 		# print(len(journal_entry_search))
# 	# 		journal_entry_names = list(map(lambda j: j.name, journal_entry_search))
# 	# 		if journal_entry_names:
# 	# 			filters.append({'parent': ['in', journal_entry_names]})
# 	# elif len(je_names) > 0:
# 	# 	filters.append({'parent': ['in', je_names]})

# 	last_ji = frappe.get_list('VetJournalItem', filters=filters, fields=['name', 'total', 'parent'], order_by="creation desc")

# 	# print('len ji')
# 	# print(len(last_ji))
# 	# print([x['name'] for x in last_ji])
	
# 	for lj in last_ji:
# 		lj['date'] = frappe.db.get_value('VetJournalEntry', lj['parent'], 'date')
	
# 	# print('selesai tambah date')
		
# 	last_ji.sort(key=lambda x: x.date, reverse=True)

# 	# print('selesai sort')
# 	# print([x['name'] for x in last_ji])
	
# 	index = [i for i in range(len(last_ji)) if last_ji[i]['name'] == name]

# 	# print('index')
# 	# print(index)

# 	# if index:
# 	# 	last_ji = last_ji[-(int(index[0]) + 1):]
# 	# else:
# 	# 	last_ji = []
	
# 	for l in range(len(last_ji) + 1):
# 		total_add = 0
# 		# print('for')
# 		# print(l)
# 		# print(len(last_ji) - l)
# 		if index and len(last_ji) - l <= int(index[0]):
# 			ji = frappe.get_doc('VetJournalItem', last_ji[len(last_ji) - l]['name'])
# 			# print('ji name')
# 			# print(ji.name)

# 			account_type = frappe.db.get_value('VetCoa', ji.account, 'account_type')
			
# 			if account_type in ['Asset','Expense']:
# 				total_add = ji.debit - ji.credit
# 			elif account_type in ['Equity','Income','Liability']:
# 				total_add = ji.credit - ji.debit

# 			if len(last_ji) != 0 and (len(last_ji) - 1) > (len(last_ji) - l):
# 				ji2 = last_ji[(len(last_ji) - l) + 1]
# 				name_ji2 = ji2['name']
# 				ji1_date = last_ji[len(last_ji) - l]['date']
# 				ji2_date = ji2['date']
# 				different_year = ji1_date.strftime('%Y') != ji2_date.strftime('%Y')
# 				if ('4-' in ji.account or '5-' in ji.account or '6-' in ji.account or '7-' in ji.account or '8-' in ji.account) and different_year:
# 					# print('masuk first transaction')
# 					# print(ji.account)
# 					ji.total = total_add
# 				else:
# 					ji2 = frappe.get_doc('VetJournalItem', name_ji2)
# 					ji.total = ji2.total + total_add

# 				ji.save()
# 				frappe.db.commit()
# 			else:
# 				ji.total = total_add
# 				ji.save()
# 				frappe.db.commit()

INCOME_EXPENSE_PREFIXES = ['4-', '5-', '6-', '7-', '8-']

def lock_accounts(accounts):
	"""Kunci baris VetCoa sampai transaksi selesai (commit/rollback).

	Saldo berjalan (VetJournalItem.total) satu akun hanya boleh dihitung oleh satu transaksi
	dalam satu waktu. Panggil SEBELUM menulis atau menghapus VetJournalItem akun tersebut,
	supaya transaksi yang sedang menghitung tidak harus menunggu item yang belum di-commit
	(deadlock). Semua akun dikunci dalam satu query urut nama, supaya dua transaksi tidak
	saling mengunci silang."""
	accounts = sorted(set(a for a in accounts if a))
	if accounts:
		frappe.db.sql("select name from `tabVetCoa` where name in %s order by name for update", (tuple(accounts),))

def lock_journal_accounts(parents=None, items=None):
	"""Kunci akun dari item milik journal entry parents (atau item items).
	Mengembalikan [{account, date}] untuk recompute_accounts sesudah item diubah/dihapus."""
	affected = get_journal_accounts(parents=parents, items=items)
	lock_accounts([a.account for a in affected])
	return affected

def get_journal_accounts(parents=None, items=None):
	if parents:
		condition, values = 'ji.parent in %s', (tuple(parents),)
	elif items:
		condition, values = 'ji.name in %s', (tuple(items),)
	else:
		return []

	return frappe.db.sql("""select ji.account, min(je.date) as date
		from `tabVetJournalItem` ji
		join `tabVetJournalEntry` je on je.name = ji.parent
		where {0}
		group by ji.account""".format(condition), values, as_dict=True)

def recompute_accounts(affected):
	for a in affected:
		recompute_account_total(a.account, from_date=a.date)

def delete_journal_entries(names):
	"""Hapus journal entry beserta item-nya, lalu hitung ulang saldo berjalan akun yang terdampak."""
	names = [n for n in names if n]
	affected = lock_journal_accounts(parents=names)
	for n in names:
		frappe.delete_doc('VetJournalEntry', n)
	recompute_accounts(affected)

def set_journal_item_total(name, account):
	recompute_account_total(account, name=name)

def _account_rows(accounts, lock=False):
	"""Semua item akun-akun ini, urut per akun sesuai urutan saldo berjalan."""
	return frappe.db.sql("""select ji.name, ji.account, ji.debit, ji.credit, ji.total, je.date
		from `tabVetJournalItem` ji
		join `tabVetJournalEntry` je on je.name = ji.parent
		where ji.account in %s
		order by ji.account, je.date, ji.parent, ji.creation
		{0}""".format('lock in share mode' if lock else ''), (tuple(accounts),), as_dict=True)

def _total_rule(account):
	"""Fungsi next_total(prev, prev_total, row) untuk saldo berjalan akun ini."""
	account_type = frappe.db.get_value('VetCoa', account, 'account_type')
	# Akun pendapatan/biaya mulai dari nol tiap tahun
	reset_each_year = any(p in account for p in INCOME_EXPENSE_PREFIXES)

	def next_total(prev, prev_total, row):
		total_add = 0
		if account_type in ['Asset','Expense']:
			total_add = flt(row.debit) - flt(row.credit)
		elif account_type in ['Equity','Income','Liability']:
			total_add = flt(row.credit) - flt(row.debit)

		if not prev or (reset_each_year and prev.date.year != row.date.year):
			return total_add
		return prev_total + total_add

	return next_total

def recompute_account_total(account, name=None, from_date=None):
	"""Hitung ulang VetJournalItem.total akun mulai dari item name (atau item pertama dengan
	tanggal >= from_date) sampai item terakhir. Total item sebelumnya dipakai sebagai saldo awal.

	Tidak commit: pemanggil yang commit, supaya lock akun dipegang sampai item dan totalnya
	tersimpan bersamaan, dan tidak ada item ter-commit dengan total yang belum dihitung."""
	if not account:
		return
	lock_accounts([account])
	_clear_running_totals_cache(account)

	# Locking read membaca data ter-commit terbaru, bukan snapshot awal transaksi, jadi item
	# yang baru di-commit transaksi lain (sambil kita menunggu lock) ikut terhitung.
	rows = _account_rows([account], lock=True)

	if from_date:
		from_date = getdate(from_date)

	start = None
	for i, row in enumerate(rows):
		if (name and row.name == name) or (not name and from_date and row.date >= from_date):
			start = i
			break
	if start is None:
		return

	next_total = _total_rule(account)
	for i in range(start, len(rows)):
		row = rows[i]
		prev = rows[i - 1] if i > 0 else None
		total = next_total(prev, flt(prev.total) if prev else 0, row)

		if row.total is None or abs(total - flt(row.total)) > 0.0001:
			frappe.db.set_value('VetJournalItem', row.name, 'total', total, update_modified=False)
		row.total = total

def attach_entry_fields(journal_items, fields=('date', 'journal')):
	"""Isi field VetJournalEntry (date, journal, ...) ke tiap item lewat satu query per 1000 parent,
	bukan frappe.db.get_value per item (puluhan ribu query di laporan)."""
	parents = list(set(ji.parent for ji in journal_items if ji.parent))
	entries = {}
	for i in range(0, len(parents), 1000):
		for e in frappe.db.sql("select name, {0} from `tabVetJournalEntry` where name in %s".format(', '.join(fields)), (tuple(parents[i:i + 1000]),), as_dict=True):
			entries[e.name] = e
	for ji in journal_items:
		entry = entries.get(ji.parent) or {}
		for f in fields:
			ji[f] = entry.get(f)
	return journal_items

def items_by_account(journal_items):
	"""{account: [item, ...]} dengan urutan journal_items dipertahankan. Di-cache untuk list yang sama,
	karena laporan memanggilnya sekali per akun dengan list yang sama."""
	cache = getattr(frappe.local, 'vet_items_by_account', None)
	if not cache or cache[0] is not journal_items:
		grouped = {}
		for ji in journal_items:
			grouped.setdefault(ji.account, []).append(ji)
		cache = frappe.local.vet_items_by_account = (journal_items, grouped)
	return cache[1]

def get_running_totals(accounts):
	"""{item name: (urutan, saldo berjalan)} untuk semua item akun-akun ini, dihitung dari
	debit/credit (tidak membaca kolom total yang tersimpan). Di-cache per request."""
	cache = getattr(frappe.local, 'vet_running_totals', None)
	if cache is None:
		cache = frappe.local.vet_running_totals = {}

	missing = sorted(set(a for a in accounts if a and a not in cache))
	if missing:
		for account in missing:
			cache[account] = {}
		rules = dict((account, _total_rule(account)) for account in missing)
		prev = None
		prev_total = 0
		order = 0
		for row in _account_rows(missing):
			if not prev or prev.account != row.account:
				prev, prev_total, order = None, 0, 0
			order += 1
			prev_total = rules[row.account](prev, prev_total, row)
			cache[row.account][row.name] = (order, prev_total)
			prev = row

	result = {}
	for a in accounts:
		result.update(cache.get(a, {}))
	return result

def _clear_running_totals_cache(account):
	cache = getattr(frappe.local, 'vet_running_totals', None)
	if cache:
		cache.pop(account, None)

def apply_running_totals(journal_items):
	"""Ganti total tiap item (butuh field name dan account) dengan saldo berjalan hasil hitung,
	dan isi running_order untuk mengurutkan item satu akun di tanggal yang sama."""
	totals = get_running_totals(set(ji.account for ji in journal_items))
	for ji in journal_items:
		t = totals.get(ji.name)
		if t:
			ji['running_order'], ji['total'] = t
		else:
			ji['running_order'] = 0
	return journal_items

def journal_item_sort_key(ji):
	"""Urutan kronologis item: tanggal, lalu urutan saldo berjalan di akunnya."""
	return (ji.date, ji.get('running_order') or 0)

def repair_account_totals(dry_run=1, account=None):
	"""Perbaiki VetJournalItem.total yang sudah salah, dihitung ulang dari item pertama tiap akun.
	Jalankan manual, mulai dengan dry_run (default) untuk melihat apa yang akan berubah:

	bench --site <site> execute vet_website.vet_website.doctype.vetjournalentry.vetjournalentry.repair_account_totals
	bench --site <site> execute vet_website.vet_website.doctype.vetjournalentry.vetjournalentry.repair_account_totals --kwargs "{'dry_run': 0}"
	"""
	dry_run = cint(dry_run)
	if account:
		accounts = [account]
	else:
		accounts = [r[0] for r in frappe.db.sql("select distinct account from `tabVetJournalItem` where ifnull(account, '') != '' order by account")]

	report = []
	for acc in accounts:
		if not dry_run:
			lock_accounts([acc])
		rows = _account_rows([acc], lock=not dry_run)
		next_total = _total_rule(acc)
		wrong = []
		prev = None
		prev_total = 0
		for row in rows:
			prev_total = next_total(prev, prev_total, row)
			if row.total is None or abs(prev_total - flt(row.total)) > 0.0001:
				wrong.append((row, prev_total))
			prev = row

		if wrong:
			first, expected = wrong[0]
			report.append({
				'account': acc,
				'wrong_rows': len(wrong),
				'first_item': first.name,
				'first_date': str(first.date),
				'stored_total': flt(first.total),
				'expected_total': expected,
			})
			if not dry_run:
				for row, total in wrong:
					frappe.db.set_value('VetJournalItem', row.name, 'total', total, update_modified=False)
		if not dry_run:
			frappe.db.commit()

	for r in report:
		print('{account}: {wrong_rows} baris salah, mulai {first_date} ({first_item}) tersimpan {stored_total} seharusnya {expected_total}'.format(**r))
	print('{0} dari {1} akun {2}'.format(len(report), len(accounts), 'perlu diperbaiki (dry run, belum diubah)' if dry_run else 'diperbaiki'))
	return report
