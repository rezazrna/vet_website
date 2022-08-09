# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
from datetime import datetime as dt
from frappe.model.document import Document

class VetJournalItem(Document):
	pass
	# def after_insert(self):
	# 	set_journal_item_total(self.name)
	
@frappe.whitelist()
def get_journal_item_list(filters=None, all_page=False):
	default_sort = "date desc, reference desc"
	je_filters = []
	je_or_filters = []
	filter_json = False
	ji_account = False
	page = 1
	
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

		if currentpage:
			page = currentpage
		
		if filters_json:
			for fj in filters_json:
				je_filters.append(fj)

		if search:
			je_or_filters.append({'reference': ['like', '%'+search+'%']})
			je_or_filters.append({'period': ['like', '%'+search+'%']})

		if account:
			ji_account =  account
	
	try:
		journals = frappe.get_list("VetJournal", fields=["name","journal_name"])
		journal_items = []
		journal_entry_search = []
		if je_filters or je_or_filters:
			journal_entry_search = frappe.get_list("VetJournalEntry", or_filters=je_or_filters, filters=je_filters, fields=["name"], order_by=default_sort)
		# datalength = len(frappe.get_list("VetJournalEntry", or_filters=je_or_filters, filters=je_filters, as_list=True))
		# if len(journal_entry_search):
		journal_items_filters = []
		if journal_entry_search:
			journal_entry_names = list(map(lambda j: j.name, journal_entry_search))
			journal_items_filters.append({'parent': ['in', journal_entry_names]})
		if ji_account:
			journal_items_filters.append({'account': ji_account})
		if all_page:
			journal_items = frappe.get_list("VetJournalItem", filters=journal_items_filters, fields=["*"], order_by='creation desc')
		else:
			journal_items = frappe.get_list("VetJournalItem", filters=journal_items_filters, fields=["*"], order_by='creation desc', start=(page - 1) * 10, page_length= 10)
		datalength = 0
		if not all_page:
			datalength = len(frappe.get_list("VetJournalItem", filters=journal_items_filters, as_list=True))
		for ji in journal_items:
			ji['period'] = frappe.db.get_value('VetJournalEntry', ji.parent, 'period')
			ji['date'] = frappe.db.get_value('VetJournalEntry', ji.parent, 'date')
			ji['keterangan'] = frappe.db.get_value('VetJournalEntry', ji.parent, 'keterangan')
			ji['reference'] = frappe.db.get_value('VetJournalEntry', ji.parent, 'reference')
			ji['account_name'] = "%s %s"%(frappe.db.get_value('VetCoa', ji.account, 'account_code'), frappe.db.get_value('VetCoa', ji.account, 'account_name'))
			ji['account_type'] = frappe.db.get_value('VetCoa', ji.account, 'account_type')
				
		journal_items.sort(key=lambda x: x.date, reverse=True)

		return {'journal_items': journal_items, 'journals': journals, 'datalength': datalength}
		
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