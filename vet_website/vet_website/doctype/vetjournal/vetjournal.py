# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
from frappe.model.document import Document

class VetJournal(Document):
	pass


@frappe.whitelist()
def get_coa_form():
    return frappe.get_list('VetCoa', filters={'is_parent': 0}, fields=['*'])

@frappe.whitelist()
def get_all_journal(filters=None):
	filter_json = False
	default_sort = "journal_name asc"
	journal_filters = []
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
	
	if filter_json:
		filters_json = filter_json.get('filters', False)
		sort = filter_json.get('sort', False)
		if sort:
			default_sort = sort
		
		if filters_json:
			for fj in filters_json:
				journal_filters.append(fj)
	
	try:
		journal = frappe.get_list("VetJournal", filters=journal_filters, fields=['*'], order_by=default_sort)
		for j in journal:
			j['default_debit_account_name'] = frappe.db.get_value('VetCoa', j.default_debit_account, 'account_name')
			j['default_credit_account_name'] = frappe.db.get_value('VetCoa', j.default_credit_account, 'account_name')
		
		return journal
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def new_journal(data):
	try:
		data_json = json.loads(data)

		if data_json.get('name'):
			fields = ['code', 'journal_name', 'type', 'default_debit_account', 'default_credit_account']
			pops = []
			journal_data = {}
			journal_data.update(data_json)
			for key in journal_data.keys():
				if key not in fields:
					pops.append(key)
			for p in pops:
				journal_data.pop(p)
			
			journal = frappe.get_doc('VetJournal', data_json.get('name'))
			journal.update(journal_data)
			journal.save()
			frappe.db.commit()

			return get_all_journal()
		else:
			journal_data = {}
			journal_data.update(data_json)
			new_journal = frappe.new_doc('VetJournal')
			new_journal.update(journal_data)
			new_journal.insert()
			frappe.db.commit()
			
			return get_all_journal()
			
	except frappe.UniqueValidationError as e:
		frappe.msgprint("Jenis hewan sudah ada")
		
@frappe.whitelist()
def delete_journal(name):
	try:
		frappe.delete_doc('VetJournal', name)
		return get_all_journal()
	except frappe.LinkExistsError as e:
		frappe.msgprint("Journal sudah dipakai di dalam record lain")