# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
from datetime import datetime as dt
from frappe.model.document import Document
from dateutil.relativedelta import relativedelta as rd

class VetJournalItem(Document):
	pass
	# def after_insert(self):
	# 	set_journal_item_total(self.name)
	
@frappe.whitelist()
def get_journal_item_list(filters=None, all_page=False, is_gl=False):
	print('is_gl')
	print(is_gl)
	default_sort = "date desc, reference desc"
	order_by = 'creation desc'
	je_filters = []
	if is_gl == '1':
		default_sort = "date asc, reference asc"
		order_by = 'creation asc'
		je_filters = [{'journal': ['!=', 'CLS']}]
	
	je_filters_if_empty = []
	je_or_filters = []
	filter_json = False
	ji_account = False
	page = 1
	min_date = False
	saldo_awal = 0
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
		
	if filter_json:
		filters_json = filter_json.get('filters', False)
		account = filter_json.get('account', False)
		currentpage = filter_json.get('currentpage', False)
		search = filter_json.get('search', False)
		journal_date = filter_json.get('journal_date', False)
		journal_min_date = filter_json.get('journal_min_date', False)
		mode = filter_json.get('mode', False)

		if currentpage:
			page = currentpage
		
		if filters_json:
			for fj in filters_json:
				je_filters.append(fj)
				je_filters_if_empty.append(fj)

		if search:
			je_or_filters.append({'reference': ['like', '%'+search+'%']})
			je_or_filters.append({'period': ['like', '%'+search+'%']})
			je_or_filters.append({'debit': ['like', '%'+search+'%']})
			je_or_filters.append({'credit': ['like', '%'+search+'%']})

		if account:
			ji_account =  account

		if journal_date:
			if mode == 'daily' or mode == 'annual':
				max_date_dt = dt.strptime(journal_date, '%Y-%m-%d')
				max_date = journal_date
			else:
				max_date_dt = dt.strptime(journal_date, '%Y-%m-%d') - rd(days=1)
				max_date = max_date_dt.strftime('%Y-%m-%d')

			if journal_min_date:
				min_date = journal_min_date
			elif mode == 'monthly':
				min_date = (max_date_dt).strftime('%Y-%m-01')
			else:
				min_date = max_date_dt.strftime('%Y-01-01')
			print('min date')
			print(min_date)
			print('max date')
			print(max_date)
			print(mode)
			je_filters.append({'date': ['between', [min_date, max_date]]})
			je_filters_if_empty.append({'date': ['<', min_date]})
	try:
		journals = []
		if not all_page:
			journals = frappe.get_list("VetJournal", fields=["name","journal_name"])
		journal_items = []
		journal_entry_search = []
		journal_items_filters = []
		if je_filters or je_or_filters:
			journal_entry_search = frappe.get_list("VetJournalEntry", or_filters=je_or_filters, filters=je_filters, fields=["name"], order_by=default_sort)
			journal_entry_names = list(map(lambda j: j.name, journal_entry_search))
			journal_items_filters.append({'parent': ['in', journal_entry_names]})
			print('journal entry names')
			print(journal_entry_names)
		# datalength = len(frappe.get_list("VetJournalEntry", or_filters=je_or_filters, filters=je_filters, as_list=True))
		# if len(journal_entry_search):
		if ji_account:
			journal_items_filters.append({'account': ji_account})
		if all_page:
			journal_items = frappe.get_list("VetJournalItem", filters=journal_items_filters, fields=["*"], order_by=order_by)
		else:
			journal_items = frappe.get_list("VetJournalItem", filters=journal_items_filters, fields=["*"], order_by=order_by, start=(page - 1) * 10, page_length= 10)
			print('journal items')
			print(journal_items)

		datalength = 0
		if not all_page:
			datalength = len(frappe.get_list("VetJournalItem", filters=journal_items_filters, as_list=True))

		if not journal_items and is_gl == '1':
			ubah_saldo = True

			if ji_account and ('4-' in ji_account or '5-' in ji_account or '6-' in ji_account or '7-' in ji_account or '8-' in ji_account) and '-01-01' in min_date:
				ubah_saldo = False

			journal_items_filters_if_empty = []
			journal_entry_search = frappe.get_list("VetJournalEntry", or_filters=je_or_filters, filters=je_filters_if_empty, fields=["name"], order_by=default_sort)
			journal_entry_names = list(map(lambda j: j.name, journal_entry_search))
			journal_items_filters_if_empty.append({'parent': ['in', journal_entry_names]})
			if ji_account:
				journal_items_filters_if_empty.append({'account': ji_account})

			journal_items = frappe.get_list("VetJournalItem", filters=journal_items_filters_if_empty, fields=["name", 'parent', 'total'], order_by="creation desc")

			for ji in journal_items:
				ji['date'] = frappe.db.get_value('VetJournalEntry', ji.parent, 'date')

			journal_items.sort(key=lambda x: x.date, reverse=True)
			if ubah_saldo:
				saldo_awal = journal_items[0]['total']
		else:
			for ji in journal_items:
				ji['period'] = frappe.db.get_value('VetJournalEntry', ji.parent, 'period')
				ji['date'] = frappe.db.get_value('VetJournalEntry', ji.parent, 'date')
				ji['keterangan'] = frappe.db.get_value('VetJournalEntry', ji.parent, 'keterangan')
				ji['reference'] = frappe.db.get_value('VetJournalEntry', ji.parent, 'reference')
				ji['account_name'] = "%s %s"%(frappe.db.get_value('VetCoa', ji.account, 'account_code'), frappe.db.get_value('VetCoa', ji.account, 'account_name'))
				ji['account_type'] = frappe.db.get_value('VetCoa', ji.account, 'account_type')
				ji['account_code'] = frappe.db.get_value('VetCoa', ji.account, 'account_code')
			reverse = True
			if is_gl == '1':
				reverse = False
			journal_items.sort(key=lambda x: x.date, reverse=reverse)

			if journal_items and is_gl == '1' and ji_account:
				# if journal_items[0]['account_code'] in ['4-', '5-', '6-', '7-', '8-']:
				# 	saldo_awal = hitung_saldo_awal_gl(min_date, ji_account)
				# elif journal_items[0]['account_code'] in ['1-']:
				# 	saldo_awal = journal_items[0]['total'] + (journal_items[0]['credit'] - journal_items[0]['debit'])
				# else:
				# 	saldo_awal = journal_items[0]['total'] + (journal_items[0]['credit'] - journal_items[0]['debit'])

				if journal_items[0]['account_type'] in ['Asset', 'Expense']:
					saldo_awal = journal_items[0]['total'] + (journal_items[0]['credit'] - journal_items[0]['debit'])
				else:
					saldo_awal = journal_items[0]['total'] + (journal_items[0]['debit'] - journal_items[0]['credit'])

		coaAll = []
		if not all_page:
			coaAll = frappe.get_list("VetCoa", fields=["name","account_name", "account_code"])

		return {'journal_items': journal_items, 'journals': journals, 'datalength': datalength, 'coaAll': coaAll, 'saldo_awal': saldo_awal}
		
	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()
def get_coa_all():
	try:
		coaAll = frappe.get_list("VetCoa", fields=["name","account_name", "account_code"])

		return {'coaAll': coaAll}
		
	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()
def delete_journal_item(data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal menghapus operasi"}
	
	for d in data_json:
		frappe.delete_doc('VetJournalItem', d)
		frappe.db.commit()
		
	return {'success': True}

# def hitung_saldo_awal_gl(min_date, account):
# 	default_sort = "date asc, reference asc"
# 	order_by = 'creation asc'

# 	max_date_dt = dt.strptime(min_date, '%Y-%m-%d') - rd(days=1)
# 	max_date = max_date_dt.strftime('%Y-%m-%d')
# 	min_date = max_date_dt.strftime('%Y-01-01')

# 	journal_items_filters = [{'account': account}]
# 	journal_entry_search = frappe.get_list("VetJournalEntry", filters={'date': ['between', [min_date, max_date]]}, fields=["name"], order_by=default_sort)
# 	journal_entry_names = list(map(lambda j: j.name, journal_entry_search))
# 	journal_items_filters.append({'parent': ['in', journal_entry_names]})
# 	print('journal entry names')
# 	print(len(journal_entry_names))

# 	journal_items = frappe.get_list("VetJournalItem", filters=journal_items_filters, fields=["*"], order_by=order_by)
# 	print('journal items')
# 	print(len(journal_items))

# 	total = 0
# 	for j in journal_items:
# 		account_type = frappe.db.get_value('VetCoa', j.account, 'account_type')
# 		if account_type in ['Asset', 'Expense']:
# 			total = total + (j.debit - j.credit)
# 		else:
# 			total = total + (j.credit - j.debit)

# 	print('total')
# 	print(total)
	
# 	return total
	
# def set_journal_item_total(name):
# 	ji = frappe.get_doc('VetJournalItem', name)
# 	last_ji = frappe.get_list('VetJournalItem', filters={'account': ji.account}, fields=['name', 'total'], order_by="creation desc")
# 	account_type = frappe.db.get_value('VetCoa', ji.account, 'account_type')
# 	total_add = 0
	
# 	if account_type in ['Asset','Expense']:
# 		total_add = ji.debit - ji.credit
# 	elif account_type in ['Equity','Income','Liability']:
# 		total_add = ji.credit - ji.debit
	
# 	if len(last_ji) != 0:
# 		total = last_ji[0].total
# 		ji.total = total + total_add
# 	else:
# 		ji.total = total_add
		
# 	ji.save()
# 	frappe.db.commit()