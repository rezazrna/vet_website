# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
from datetime import datetime as dt
from frappe.model.document import Document
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
def delete_journal_entry(data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal menghapus operasi"}
	
	for d in data_json:
		frappe.delete_doc('VetJournalEntry', d)
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
			je = frappe.new_doc('VetJournalEntry')
			je.update(je_data)
			je.insert()
			frappe.db.commit()

						
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
					frappe.db.commit()
					
					set_journal_item_total(new_ji.name, new_ji.account)
					
			# post_journal_entry(je.name)
			
		else :
			je = frappe.get_doc('VetJournalEntry', data_json.get('name'))
			je_data = {}
			je_data.update(data_json)
			je_data.pop('journal_items')
			je.update(je_data)
			je.save()
			
			for s in data_json.get("journal_items"):
				if s.get('account', False):
					if s.get('name'):
						if s.get('delete') == True:
							ji = frappe.get_doc('VetJournalItem', s.get('name'))
							ji.update({
								'account': s.get('account', False),
								'debit': 0,
								'credit': 0,
							})
							ji.save()
						else:
							ji = frappe.get_doc('VetJournalItem', s.get('name'))
							if ji.account != s.get('account', False):
								ji.update({
									'debit': 0,
									'credit': 0,
								})
								ji.save()
								
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
								ji.update({
									'account': s.get('account', False),
									'debit': s.get('debit', 0),
									'credit': s.get('credit', 0),
								})
								ji.save()
						
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
		
def set_journal_item_total(name, account):
	filters = [{'account': account}]

	last_ji = frappe.get_list('VetJournalItem', filters=filters, fields=['name', 'total', 'parent'], order_by='creation desc')
	
	for lj in last_ji:
		lj['date'] = frappe.db.get_value('VetJournalEntry', lj['parent'], 'date')
		
	last_ji.sort(key=lambda x: x.date, reverse=True)
	
	index = [i for i in range(len(last_ji)) if last_ji[i]['name'] == name]
	
	for l in range(len(last_ji) + 1):
		total_add = 0
		if len(last_ji) - l <= int(index[0]):
			ji = frappe.get_doc('VetJournalItem', last_ji[len(last_ji) - l]['name'])

			account_type = frappe.db.get_value('VetCoa', ji.account, 'account_type')
			
			if account_type in ['Asset','Expense']:
				total_add = ji.debit - ji.credit
			elif account_type in ['Equity','Income','Liability']:
				total_add = ji.credit - ji.debit

			# if ('4-' in ji.account or '5-' in ji.account or '6-' in ji.account or '7-' in ji.account or '8-' in ji.account) and is_first_transaction(ji.name, ji.account, last_ji[len(last_ji) - l]['date']):
			# 	print('masuk first transaction')
			# 	print(ji.account)
			# 	ji.total = total_add

			# 	ji.save()
			# 	frappe.db.commit()
			if len(last_ji) != 0 and (len(last_ji) - 1) > (len(last_ji) - l):
				name_ji2 = last_ji[(len(last_ji) - l) + 1]['name']
				ji1_date = last_ji[len(last_ji) - l]['date']
				ji2_date = last_ji[(len(last_ji) - l) + 1]['date']
				different_year = ji1_date.strftime('%Y') != ji2_date.strftime('%Y')
				if ('4-' in ji.account or '5-' in ji.account or '6-' in ji.account or '7-' in ji.account or '8-' in ji.account) and different_year:
					print('masuk first transaction')
					print(ji.account)
					ji.total = total_add
				else:
					ji2 = frappe.get_doc('VetJournalItem', name_ji2)
					ji.total = ji2.total + total_add

				ji.save()
				frappe.db.commit()
			else:
				ji.total = total_add
				ji.save()
				frappe.db.commit()

def is_first_transaction(ji_name, account, date):
	ji_filters = [{'account': account}]

	year_dt = date.strftime('%Y'),
	year = year_dt[0]

	max_date = '{}-12-31'.format(year)
	min_date = '{}-01-01'.format(year)
	je_search = frappe.get_list('VetJournalEntry', filters={'date': ['between', [min_date, max_date]]}, fields=['name'], order_by='date asc, reference asc')
	je_names = list(map(lambda j: j.name, je_search))
	ji_filters.append({'parent': ['in', je_names]})

	first = frappe.get_list("VetJournalItem", filters=ji_filters, fields=["name"], order_by="creation asc", page_length=1)

	return first and first[0]['name'] == ji_name