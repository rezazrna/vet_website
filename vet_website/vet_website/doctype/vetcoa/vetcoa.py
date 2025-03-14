# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
import pytz
from datetime import datetime as dt
from dateutil.relativedelta import relativedelta as rd
from frappe.model.document import Document
from vet_website.vet_website.doctype.vetjournalentry.vetjournalentry import new_journal_entry

class VetCoa(Document):
	pass

@frappe.whitelist()
def get_coa_list(filters=None, all_children=False, mode=False, is_profit_loss=False, is_balance_sheet=False):
	td_filters = {}
	je_filters = {}
	filter_json = False
	limit_date = False
	accounting_date = False
	min_trans_date = False
	max_trans_date = False
	search_mode = False
	dc_mode = False

	if is_profit_loss:
		td_filters.update({'account_code': ['in', ['4-0000', '5-0000', '6-0000', '7-0000', '8-0000']]})
		je_filters.update({'journal': ['!=', 'CLS']})

	if is_balance_sheet:
		td_filters.update({'account_code': ['in', ['1-0000', '2-0000', '3-0000']]})
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
		
	if filter_json:
		search = filter_json.get('search', False)
		min_date = filter_json.get('min_date', False)
		max_date = filter_json.get('max_date', False)
		accounting_date = filter_json.get('accounting_date', False)
		accounting_min_date = filter_json.get('accounting_min_date', False)
		dc = filter_json.get('dc_mode', False)
		
		if search:
			search_mode = True
			td_filters.update({'account_name': ['like', '%'+search+'%']})
			
		if min_date:
			min_trans_date = min_date
		if max_date:
			max_trans_date = max_date
			
		if accounting_date:
			if mode == 'monthly' or mode == 'period':
				limit_date_dt = dt.strptime(accounting_date, '%Y-%m-%d') - rd(days=1)
				limit_date = limit_date_dt.strftime('%Y-%m-%d')
			elif mode == 'annual' and is_profit_loss:
				limit_date_dt = dt.strptime(accounting_date, '%Y-%m-%d')
				limit_date = accounting_date
			else:
				limit_date = accounting_date

			if accounting_min_date:
				min_trans_date = accounting_min_date
			elif mode == 'monthly':
				min_trans_date = (limit_date_dt).strftime('%Y-%m-01')
			elif mode == 'annual' and is_profit_loss:
				min_trans_date = (limit_date_dt).strftime('%Y-01-01')

		if dc:
			dc_mode = True
	
	try:
		is_coa_list = not dc_mode and not is_profit_loss and not is_balance_sheet

		if not search_mode:
			td_filters.update({'account_parent': ''})

		coa_list = frappe.get_list("VetCoa", filters=td_filters, fields=["*"], order_by='account_code asc')

		journal_entry_names = []
		if limit_date:
			je_filters.update({'date': ['<=', limit_date]})
			if min_trans_date:
				je_filters.update({'date': ['between', [min_trans_date, limit_date]]})

			journal_entry_search = frappe.get_list("VetJournalEntry", filters=je_filters, fields=["name"], order_by='date desc, reference desc')
			if len(journal_entry_search):
				journal_entry_names = list(j.name for j in journal_entry_search)

		journal_items = []
		if journal_entry_names:
			journal_items = frappe.get_list('VetJournalItem', filters={'parent': ['in', journal_entry_names]}, fields=['total', 'account', 'parent', 'credit', 'debit'])

			for ji in journal_items:
				ji['date'] = frappe.db.get_value('VetJournalEntry', ji.parent, 'date')
				ji['journal'] = frappe.db.get_value('VetJournalEntry', ji.parent, 'journal')

			journal_items.sort(key=lambda x: x.date, reverse=True)

		if not dc_mode:
			for c in coa_list:
				total_children = get_coa_last_total_children(c.name, journal_items=journal_items, is_coa_list=is_coa_list)
				c['total'] = total_children['total']
				c['children'] = total_children['children']
		else:
			for c in coa_list:
				if journal_items:
					tdc = get_coa_total_debit_credit_children(c.name, journal_items=journal_items)
					c['total_debit'] = tdc.get('total_debit', 0)
					c['total_credit'] = tdc.get('total_credit', 0)
					c['children'] = tdc.get('children', [])
				else:
					c['total_debit'] = 0
					c['total_credit'] = 0
					c['children'] = []

		if all_children:
			if max_trans_date:
				for c in coa_list:
					c['children'] = get_coa_children(c.name, max_trans_date, min_trans_date, dc_mode, True, mode, is_coa_list)
			# else:
			# 	for c in coa_list:
			# 		c['children'] = get_coa_children(c.name, accounting_date, min_trans_date, dc_mode, True, mode)
		
		return coa_list
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def delete_coa(data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal menghapus Chart of Account"}
	
	for d in data_json:
		frappe.delete_doc('VetCoa', d)
		frappe.db.commit()
		
	return {'success': True}
	
@frappe.whitelist()
def get_parent_list():
	try:
		parent = frappe.get_list('VetCoa', filters={'is_parent': True}, fields="*")
		
		
		return parent
	except:
		return {'error': "Gagal menghapus Chart of Account"}

@frappe.whitelist()
def get_coa_children(name, max_date=False, min_date=False, dc_mode=False, all_children=False, mode=False, is_coa_list=False):
	# try:
	filters={'account_parent': name}
	children = frappe.get_list('VetCoa', filters=filters, fields="*", order_by="account_code asc")
	limit_date = False

	if mode == 'monthly' or mode == 'period':
		limit_date_dt = dt.strptime(max_date, '%Y-%m-%d') - rd(days=1)
		limit_date = limit_date_dt.strftime('%Y-%m-%d')
	elif mode == 'annual':
		limit_date_dt = dt.strptime(max_date, '%Y-%m-%d')
		limit_date = limit_date_dt.strftime('%Y-%m-%d')

	if mode == 'monthly':
		min_date = (limit_date_dt).strftime('%Y-%m-01')

	journal_entry_names = []
	if limit_date:
		je_filters = {}
		je_filters.update({'date': ['<=', limit_date]})
		if min_date:
			je_filters.update({'date': ['between', [min_date, limit_date]]})
		
		journal_entry_search = frappe.get_list("VetJournalEntry", filters=je_filters, fields=["name"], order_by='date desc, reference desc')
		if len(journal_entry_search):
			journal_entry_names = list(j.name for j in journal_entry_search)

	journal_items = []
	if journal_entry_names:
		journal_items = frappe.get_list('VetJournalItem', filters={'parent': ['in', journal_entry_names]}, fields=['total', 'account', 'parent'])

		for ji in journal_items:
			ji['date'] = frappe.db.get_value('VetJournalEntry', ji.parent, 'date')
			ji['journal'] = frappe.db.get_value('VetJournalEntry', ji.parent, 'journal')

		journal_items.sort(key=lambda x: x.date, reverse=True)
		
	if not dc_mode:
		for c in children:
			total_children = get_coa_last_total_children(c.name, journal_items=journal_items, is_coa_list=is_coa_list)
			c['total'] = total_children['total']
			c['children'] = total_children['children']
	else:
		for c in children:
			if journal_items:
				tdc = get_coa_total_debit_credit_children(c.name, journal_items=journal_items)
				c['total_debit'] = tdc.get('total_debit', 0)
				c['total_credit'] = tdc.get('total_credit', 0)
				c['chldren'] = tdc.get('children', [])
			else:
				c['total_debit'] = 0
				c['total_credit'] = 0
				c['children'] = []
	
	if all_children:
		for c in children:
			c['children'] = get_coa_children(c.name, max_date, min_date, dc_mode, all_children, mode=mode, is_coa_list=is_coa_list)
	return children
	# except:
	# 	return {'error': "Gagal mendapatkan children"}
		
@frappe.whitelist()
def new_coa(data):
	try:
		data_json = json.loads(data)
		
		coa = frappe.new_doc('VetCoa')
		coa.update(data_json)
		coa.insert()
		
		frappe.db.commit()
		
		# if data_json['account_parent']:
		# 	try:
		# 		coa = frappe.get_doc('VetCoa', data_json['account_parent'])
		# 		parenttype = 'VetCoa'
		# 	except:
		# 		coa = frappe.get_doc('VetCoaChildren', data_json['account_parent'])
		# 		parenttype = 'VetCoaChildren'
			
		# 	new_children = frappe.new_doc('VetCoaChildren')
		# 	new_children_data = {}
		# 	new_children_data.update(data_json)
		# 	new_children_data.pop('account_parent')
		# 	new_children_data.update({'parent': coa.name, 'parenttype': parenttype, 'parentfield': 'children'})
		# 	new_children.update(new_children_data)
			
		# 	coa.children.append(new_children)
		# 	coa.save()
			
		# 	frappe.db.commit()
		# else:
		# 	coa = frappe.new_doc('VetCoa')
		# 	coa_data = {}
		# 	coa_data.update(data_json)
		# 	coa_data.pop('account_parent')
		# 	coa.update(coa_data)
		# 	coa.insert()
			
		# 	frappe.db.commit()
		
		return coa
	except:
		return {'error': "Gagal menghapus Chart of Account"}
		
		
@frappe.whitelist()
def edit_coa(data):
	try:
		data_json = json.loads(data)
		
		data_check = frappe.get_list('VetCoa', filters={'name': data_json.get('name', False)}, fields=['name'])
		if len(data_check) != 0:
			update_coa = frappe.get_doc('VetCoa', data_json.get('name', False))
			update_coa.update(data_json)
			update_coa.save()
			frappe.db.commit()
			
			update_childs_account_type(update_coa.name)

			return update_coa
		
	except PermissionError as e:
		return {'error': e}
		
		
def update_childs_account_type(name):
	try:
		data_check = frappe.get_list('VetCoa', filters={'name': name}, fields=['name', 'account_type'])
		if len(data_check) != 0:
			account_type = data_check[0].account_type
			childs_account_names = frappe.get_list('VetCoa', filters={'account_parent': name}, fields=['name'])
			for c in childs_account_names:
				account = frappe.get_doc('VetCoa', c.name)
				account.account_type = account_type
				account.save()
				frappe.db.commit()
				update_childs_account_type(c.name)
				
	except PermissionError as e:
		return {'error': e}
			
			
# def get_coa_last_total(coa_name, max_date=False, no_min_date=False):
	
# 	total = 0
# 	coa = frappe.get_doc('VetCoa', coa_name)
# 	filters={'account': coa.name}
# 	if max_date:
# 		max_date_dt = dt.strptime(max_date, '%Y-%m-%d') - rd(days=1)
# 		if no_min_date:
# 			filters.update({'creation': ['<', max_date]})
# 		else:
# 			if max_date_dt.day != 1:
# 				min_date = max_date_dt.strftime('%Y-%m-01')
# 			else:
# 				min_date = (max_date_dt-rd(months=1)).strftime('%Y-%m-01')
# 			filters.update({'creation': ['between', [min_date, max_date_dt.strftime('%Y-%m-%d')]]})
# 	print(filters)
# 	ji_list = frappe.get_list("VetJournalItem", filters=filters, fields=['total'], order_by="creation desc", page_length=1)
# 	if len(ji_list) != 0:
# 		total = total + ji_list[0].total
		
# 	print(total)
		
# 	children = frappe.get_list('VetCoa', filters={'account_parent': coa.name}, fields="name", order_by="account_code asc")
# 	if len(children) != 0:
# 		total = total + sum(get_coa_last_total(c.name, max_date, no_min_date) for c in children)
		
# 	return total

def get_coa_last_total(coa_name, max_date=False, journal_items=False):
	
	total = 0
	coa = frappe.get_doc('VetCoa', coa_name)
	
	filters = {'account': coa.name}
	je_filters = {}
	ji_list = []
	journal_item = False

	if journal_items:
		ji_list = journal_items
		journal_item = next(filter(lambda item: item.account == coa_name and ((('4-' in coa_name or '5-' in coa_name or '6-' in coa_name or '7-' in coa_name or '8-' in coa_name) and item.journal != 'CLS') or ('1-' in coa_name or '2-' in coa_name or '3-' in coa_name)), journal_items), None)
	else:
		if max_date:
			max_date_dt = dt.strptime(max_date, '%Y-%m-%d') - rd(days=1)

			if max_date_dt.day != 1:
				min_date = max_date_dt.strftime('%Y-%m-01')
			else:
				min_date = (max_date_dt-rd(months=1)).strftime('%Y-%m-01')

			je_filters.update({'date': ['between', [min_date, max_date_dt.strftime('%Y-%m-%d')]]})
				
		if je_filters:
			journal_entry_search = frappe.get_list("VetJournalEntry", filters=je_filters, fields=["name"], order_by='date desc, reference desc')

			if len(journal_entry_search):
				journal_entry_names = list(j.name for j in journal_entry_search)
				filters.update({'parent': ['in', journal_entry_names]})

		
		if 'parent' in filters:
			ji_list = frappe.get_list("VetJournalItem", filters=filters, fields=['debit', 'credit', 'total', 'parent'], order_by='creation desc')
		for ji in ji_list:
			ji['date'] = frappe.db.get_value('VetJournalEntry', ji.parent, 'date')
			ji['journal'] = frappe.db.get_value('VetJournalEntry', ji.parent, 'journal')
		
		ji_list.sort(key=lambda x: x.date, reverse=True)
		if len(ji_list) > 0:
			journal_item = ji_list[0]


	# if len(ji_list) != 0:
	# 	if coa.account_type in ['Asset','Expense']:
	# 		for ji in ji_list:
	# 			if (('4-' in coa.name or '5-' in coa.name or '6-' in coa.name or '7-' in coa.name or '8-' in coa.name) and ji.journal != 'CLS') or ('1-' in coa.name or '2-' in coa.name or '3-' in coa.name):
	# 				total += ji.debit - ji.credit
	# 	elif coa.account_type in ['Equity','Income','Liability']:
	# 		for ji in ji_list:
	# 			if (('4-' in coa.name or '5-' in coa.name or '6-' in coa.name or '7-' in coa.name or '8-' in coa.name) and ji.journal != 'CLS') or ('1-' in coa.name or '2-' in coa.name or '3-' in coa.name):
	# 				total += ji.credit - ji.debit

	### Terpengaruh ###

	if journal_item:
		total = total + journal_item.total
		
	children = frappe.get_list('VetCoa', filters={'account_parent': coa.name}, fields="name", order_by="account_code asc")
	if len(children) != 0:
		total = total + sum(get_coa_last_total(c.name, max_date=max_date, journal_items=journal_items) for c in children)
		
	return total

def get_coa_last_total_children(coa_name, max_date=False, journal_items=False, is_coa_list=False):
	
	total = 0
	# coa = frappe.get_doc('VetCoa', coa_name)
	
	filters = {'account': coa_name}
	je_filters = {}
	ji_list = []
	journal_item = False

	if journal_items and len(journal_items) > 0:
		ji_list = journal_items
		journal_item = next(filter(lambda item: item.account == coa_name and ((('4-' in coa_name or '5-' in coa_name or '6-' in coa_name or '7-' in coa_name or '8-' in coa_name) and item.journal != 'CLS') or ('1-' in coa_name or '2-' in coa_name or '3-' in coa_name)), journal_items), None)
	else:
		if max_date:
			max_date_dt = dt.strptime(max_date, '%Y-%m-%d') - rd(days=1)

			if max_date_dt.day != 1:
				min_date = max_date_dt.strftime('%Y-%m-01')
			else:
				min_date = (max_date_dt-rd(months=1)).strftime('%Y-%m-01')

			je_filters.update({'date': ['between', [min_date, max_date_dt.strftime('%Y-%m-%d')]]})
		
		journal_entry_names = []
		if je_filters:
			journal_entry_search = frappe.get_list("VetJournalEntry", filters=je_filters, fields=["name"], order_by='date desc, reference desc')

			if len(journal_entry_search):
				journal_entry_names = list(j.name for j in journal_entry_search)
				filters.update({'parent': ['in', journal_entry_names]})

		
		# if 'parent' in filters:
		if journal_entry_names or is_coa_list:
			ji_list = frappe.get_list("VetJournalItem", filters=filters, fields=['debit', 'credit', 'total', 'parent'], order_by='creation desc')

		for ji in ji_list:
			ji['date'] = frappe.db.get_value('VetJournalEntry', ji.parent, 'date')
			ji['journal'] = frappe.db.get_value('VetJournalEntry', ji.parent, 'journal')
		
		ji_list.sort(key=lambda x: x.date, reverse=True)
		if len(ji_list) > 0:
			journal_item = ji_list[0]

	### Terpengaruh ###

	if is_coa_list:
		if journal_item:
			total = total + journal_item.total
	elif len(ji_list) != 0:
		account_type = frappe.db.get_value('VetCoa', coa_name, 'account_type')
		if account_type in ['Asset','Expense']:
			for ji in ji_list:
				if ji.account == coa_name and ((('4-' in coa_name or '5-' in coa_name or '6-' in coa_name or '7-' in coa_name or '8-' in coa_name) and ji.journal != 'CLS') or ('1-' in coa_name or '2-' in coa_name or '3-' in coa_name)):
					total += ji.debit - ji.credit
		elif account_type in ['Equity','Income','Liability']:
			for ji in ji_list:
				if ji.account == coa_name and ((('4-' in coa_name or '5-' in coa_name or '6-' in coa_name or '7-' in coa_name or '8-' in coa_name) and ji.journal != 'CLS') or ('1-' in coa_name or '2-' in coa_name or '3-' in coa_name)):						
					total += ji.credit - ji.debit

	# if journal_item:
	# 	total = total + journal_item.total
		
	children = frappe.get_list('VetCoa', filters={'account_parent': coa_name}, fields=["*"], order_by="account_code asc")
	for c in children:
		total_children = get_coa_last_total_children(c.name, max_date=max_date, journal_items=journal_items, is_coa_list=is_coa_list)
		c['total'] = total_children['total']
		c['children'] = total_children['children']
		total = total + c['total']
		
	return {'total': total, 'children': children}
	
def get_coa_total_debit_credit(name, journal_items=False):
	
	total_debit = 0
	total_credit = 0
	
	coa = frappe.get_doc('VetCoa', name)
	
	journal_item = False
	
	if journal_items:
		journal_item = next(filter(lambda item: item.account == name and ((('4-' in name or '5-' in name or '6-' in name or '7-' in name or '8-' in name) and item.journal != 'CLS') or ('1-' in name or '2-' in name or '3-' in name)), journal_items), None)

	### Terpengaruh ###

	if journal_item:
		if coa.account_type in ['Asset','Expense']:
			if '1-' in coa.account_code:
				if journal_item.total < 0:
					total_credit = total_credit + (-journal_item.total)
				else:
					total_debit = total_debit + journal_item.total
			else:
				total_debit = total_debit + journal_item.total
		elif coa.account_type in ['Equity','Income','Liability']:
			total_credit = total_credit + journal_item.total
	
	children = frappe.get_list('VetCoa', filters={'account_parent': coa.name}, fields="name", order_by="account_code asc")
	if len(children) != 0:
		for c in children:
			tdc = get_coa_total_debit_credit(c.name, journal_items=journal_items)
			total_debit = total_debit + tdc.get('total_debit', 0)
			total_credit = total_credit + tdc.get('total_credit', 0)
			
	return {
		'total_debit': total_debit,
		'total_credit': total_credit
	}

def get_coa_total_debit_credit_children(name, journal_items=False):
	
	total_debit = 0
	total_credit = 0
	
	coa = frappe.get_doc('VetCoa', name)
	
	journal_item = False
	
	if journal_items:
		journal_item = next(filter(lambda item: item.account == name and ((('4-' in name or '5-' in name or '6-' in name or '7-' in name or '8-' in name) and item.journal != 'CLS') or ('1-' in name or '2-' in name or '3-' in name)), journal_items), None)

	### Terpengaruh ###

	if journal_item:
		if coa.account_type in ['Asset','Expense']:
			if '1-' in coa.account_code:
				if journal_item.total < 0:
					total_credit = total_credit + (-journal_item.total)
				else:
					total_debit = total_debit + journal_item.total
			else:
				total_debit = total_debit + journal_item.total
		elif coa.account_type in ['Equity','Income','Liability']:
			total_credit = total_credit + journal_item.total
	
	children = frappe.get_list('VetCoa', filters={'account_parent': coa.name}, fields=['*'], order_by="account_code asc")
	if len(children) != 0:
		for c in children:
			tdc = get_coa_total_debit_credit_children(c.name, journal_items=journal_items)
			c['total_debit'] = tdc.get('total_debit', 0)
			c['total_credit'] = tdc.get('total_credit', 0)
			c['children'] = tdc.get('children', [])
			total_debit = total_debit + c['total_debit']
			total_credit = total_credit + c['total_credit']
			
	return {
		'total_debit': total_debit,
		'total_credit': total_credit,
		'children': children,
	}
	
	
@frappe.whitelist()
def get_financial_report_data(month=False, year=False):
	tz = pytz.timezone("Asia/Jakarta")
	now_date = dt.now(tz).strftime('%Y-%m-%d')
	if not month:
		month = dt.now(tz).strftime('%m')
	if not year:
		year = dt.now(tz).strftime('%Y')
	accounts = frappe.get_list("VetCoa", fields=["*"], order_by='account_code asc')
	# revenue_filters = {'account_parent': '', 'account_code': ['like', '4-%']}
	# revenue = frappe.get_list("VetCoa", filters=revenue_filters, fields=["*"], order_by='account_code asc')
	revenue = list((a for a in accounts if a.account_parent == None and a.account_code.find('4-') == 0))
	for r in revenue:
		last_month = dt.strptime('%s-%s'%(month, year), '%m-%Y').strftime('%Y-%m-%d')
		r['this_month'] = get_coa_last_total(r.name)
		r['last_month'] = get_coa_last_total(r.name, max_date=last_month)
		
	# piutang_filters = {'is_parent': '1', 'account_code': ['like', '1-13%']}
	# piutang = frappe.get_list("VetCoa", filters=piutang_filters, fields=["*"], order_by='account_code asc')
	piutang = list((a for a in accounts if a.is_parent == 1 and a.account_code.find('1-13') == 0))
	for p in piutang:
		last_month = dt.strptime('%s-%s'%(month, year), '%m-%Y').strftime('%Y-%m-%d')
		p['this_month'] = get_coa_last_total(p.name, max_date=now_date)
		p['last_month'] = get_coa_last_total(p.name, max_date=last_month)
		
	biaya_gaji = list((a for a in accounts if a.is_parent == 1 and a.account_code.find('6-2') == 0))
	for bg in biaya_gaji:
		last_month = dt.strptime('%s-%s'%(month, year), '%m-%Y').strftime('%Y-%m-%d')
		bg['this_month'] = get_coa_last_total(bg.name, max_date=now_date)
		bg['last_month'] = get_coa_last_total(bg.name, max_date=last_month)
	hutang_gaji = list((a for a in accounts if a.account_code == '2-12001'))
	for hg in hutang_gaji:
		last_month = dt.strptime('%s-%s'%(month, year), '%m-%Y').strftime('%Y-%m-%d')
		hg['this_month'] = get_coa_last_total(hg.name, max_date=now_date)
		hg['last_month'] = get_coa_last_total(hg.name, max_date=last_month)
		
	financial_report_data = {
		'revenue': revenue[0].this_month,
		'revenue_p': revenue[0].last_month,
		'piutang': piutang[0].this_month,
		'piutang_p': piutang[0].last_month,
		'biaya_gaji': biaya_gaji[0].this_month,
		'biaya_gaji_p': biaya_gaji[0].last_month,
		'hutang_gaji': hutang_gaji[0].this_month,
		'hutang_gaji_p': hutang_gaji[0].last_month,
	}
		
	return financial_report_data
	
@frappe.whitelist()
def get_annual_balance_sheet(name=False, year=False, get_all=False):
	try:
		tz = pytz.timezone("Asia/Jakarta")
		if not get_all:
			filters = {'account_type': ['in', ['Asset', 'Liability', 'Equity']]}
		else:
			filters = {}
		if name:
			filters.update({'account_parent': name})
		else:
			filters.update({'account_parent': ''})
			
		coa_list = frappe.get_list("VetCoa", filters=filters, fields=["*"], order_by='account_code asc')
		for c in coa_list:
			totals = []
			for i in range(1,13):
				if not year:
					date = dt.now(tz) - rd(month=i) + rd(months=1) + rd(day=1)
				else:
					date = dt(int(year), 1, 1) - rd(month=i) + rd(months=1) + rd(day=1)
				limit_date = date.strftime('%Y-%m-%d')
				totals.append({'month': i, 'total': get_coa_last_total(c.name, max_date=limit_date)})
			totals.append({'month': 'Total', 'total': get_coa_last_total(c.name)})
			c['total'] = totals
		
		return coa_list
					
	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()
def close_book(min_date, max_date):
	# try:
	journal_entry_search = frappe.get_list("VetJournalEntry", filters={'date': ['between', [min_date, max_date]]}, fields=["name"], order_by='date desc, reference desc')
	journal_entry_names = list(map(lambda j: j.name, journal_entry_search))
	if check_clearing_account():
		clearing_account = frappe.db.get_value('VetCoa', {'name': '3-99998'}, 'name')
	else:
		clearing_account = create_clearing_account()

	if check_laba_rugi_ditahan_account():
		laba_rugi_ditahan_account = frappe.db.get_value('VetCoa', {'name': '3-90000'}, 'name')
	else:
		laba_rugi_ditahan_account = create_laba_rugi_ditahan_account()

	if check_closing_journal():
		closing_journal = frappe.db.get_value('VetJournal', {'name': 'CLS'}, 'name')
	else:
		closing_journal = create_closing_journal()

	journal_date_dt = dt.strptime(max_date, '%Y-%m-%d')

	closing_je = frappe.get_list("VetJournalEntry", filters={'date': ['between', [min_date, max_date]], 'journal': closing_journal}, fields=["name"])

	for cj in closing_je:
		frappe.delete_doc('VetJournalEntry', cj['name'])
		frappe.db.commit()
	
	total_pendapatan = closing_pendapatan(journal_entry_names, clearing_account, closing_journal, journal_date_dt)
	total_hpp = closing_hpp(journal_entry_names, clearing_account, closing_journal, journal_date_dt)
	total_biaya = closing_biaya(journal_entry_names, clearing_account, closing_journal, journal_date_dt)
	total = total_pendapatan - (total_hpp + total_biaya)
	closing_clearing_account(clearing_account, laba_rugi_ditahan_account, closing_journal, total, journal_date_dt)

	return True
	# except:
	# 	return {'error': "Kesalahan Server"}

def closing_pendapatan(journal_entry_names, clearing_account, closing_journal, journal_date_dt):
	tz = pytz.timezone("Asia/Jakarta")
	jis = []
	total_credit_clearing = 0
	pendapatan_accounts = frappe.get_list("VetCoa", filters={'account_code': ['like', '4-%']}) + frappe.get_list("VetCoa", filters={'account_code': ['like', '7-%']})

	for p in pendapatan_accounts:
		journal_items = frappe.get_list("VetJournalItem", filters={'parent': ['in', journal_entry_names], 'account': p['name']}, order_by="creation desc", fields=["total", "parent"])
		for ji in journal_items:
			ji['date'] = frappe.db.get_value('VetJournalEntry', ji['parent'], 'date')

		### Terpengaruh ###
			
		journal_items.sort(key=lambda x: x['date'], reverse=True)
		if journal_items:
			jis.append({'account': p['name'], 'debit': journal_items[0]['total']})
			total_credit_clearing += journal_items[0]['total']

	if total_credit_clearing > 0:
		jis.append({'account': clearing_account, 'credit': total_credit_clearing})

	je_data = {
		'journal': closing_journal,
		'period': journal_date_dt.strftime('%m/%Y'),
		'date': journal_date_dt.strftime('%Y-%m-%d'),
		'reference': '',
		'journal_items': jis,
		'keterangan': ''
	}

	# journal_entry_search = frappe.get_list("VetJournalEntry", filters={'date': ['>=', journal_date_dt.strftime('%Y-%m-%d')]}, fields=["name"], order_by="date desc")
	# journal_entry_names = list(map(lambda j: j.name, journal_entry_search))

	new_journal_entry(json.dumps(je_data))

	return total_credit_clearing

def closing_hpp(journal_entry_names, clearing_account, closing_journal, journal_date_dt):
	tz = pytz.timezone("Asia/Jakarta")
	jis = []
	total_debit_clearing = 0
	hpp_biaya_accounts = frappe.get_list("VetCoa", filters={'account_code': ['like', '5-%']})

	for h in hpp_biaya_accounts:
		journal_items = frappe.get_list("VetJournalItem", filters={'parent': ['in', journal_entry_names], 'account': h['name']}, order_by="creation desc", fields=["total", "parent"])
		for ji in journal_items:
			ji['date'] = frappe.db.get_value('VetJournalEntry', ji['parent'], 'date')

		### Terpengaruh ###
			
		journal_items.sort(key=lambda x: x['date'], reverse=True)
		if journal_items:
			jis.append({'account': h['name'], 'credit': journal_items[0]['total']})
			total_debit_clearing += journal_items[0]['total']

	if total_debit_clearing:
		jis.append({'account': clearing_account, 'debit': total_debit_clearing})

	je_data = {
		'journal': closing_journal,
		'period': journal_date_dt.strftime('%m/%Y'),
		'date': journal_date_dt.strftime('%Y-%m-%d'),
		'reference': '',
		'journal_items': jis,
		'keterangan': ''
	}

	# journal_entry_search = frappe.get_list("VetJournalEntry", filters={'date': ['>=', journal_date_dt.strftime('%Y-%m-%d')]}, fields=["name"], order_by="date desc")
	# journal_entry_names = list(map(lambda j: j.name, journal_entry_search))

	new_journal_entry(json.dumps(je_data))

	return total_debit_clearing

def closing_biaya(journal_entry_names, clearing_account, closing_journal, journal_date_dt):
	tz = pytz.timezone("Asia/Jakarta")
	jis = []
	total_debit_clearing = 0
	hpp_biaya_accounts = frappe.get_list("VetCoa", filters={'account_code': ['like', '6-%']}) + frappe.get_list("VetCoa", filters={'account_code': ['like', '8-%']})

	for h in hpp_biaya_accounts:
		journal_items = frappe.get_list("VetJournalItem", filters={'parent': ['in', journal_entry_names], 'account': h['name']}, order_by="creation desc", fields=["total", "parent"])
		for ji in journal_items:
			ji['date'] = frappe.db.get_value('VetJournalEntry', ji['parent'], 'date')
		
		### Terpengaruh ###
			
		journal_items.sort(key=lambda x: x['date'], reverse=True)
		if journal_items:
			jis.append({'account': h['name'], 'credit': journal_items[0]['total']})
			total_debit_clearing += journal_items[0]['total']

	if total_debit_clearing:
		jis.append({'account': clearing_account, 'debit': total_debit_clearing})

	je_data = {
		'journal': closing_journal,
		'period': journal_date_dt.strftime('%m/%Y'),
		'date': journal_date_dt.strftime('%Y-%m-%d'),
		'reference': '',
		'journal_items': jis,
		'keterangan': ''
	}

	# journal_entry_search = frappe.get_list("VetJournalEntry", filters={'date': ['>=', journal_date_dt.strftime('%Y-%m-%d')]}, fields=["name"], order_by="date desc")
	# journal_entry_names = list(map(lambda j: j.name, journal_entry_search))
	
	new_journal_entry(json.dumps(je_data))

	return total_debit_clearing

def closing_clearing_account(clearing_account, laba_rugi_ditahan_account, closing_journal, total, journal_date_dt):
	tz = pytz.timezone("Asia/Jakarta")
	jis = [
		{'account': clearing_account, 'debit': total},
		{'account': laba_rugi_ditahan_account, 'credit': total}
	]

	je_data = {
		'journal': closing_journal,
		'period': journal_date_dt.strftime('%m/%Y'),
		'date': journal_date_dt.strftime('%Y-%m-%d'),
		'reference': '',
		'journal_items': jis,
		'keterangan': ''
	}

	# journal_entry_search = frappe.get_list("VetJournalEntry", filters={'date': ['>=', journal_date_dt.strftime('%Y-%m-%d')]}, fields=["name"], order_by="date desc")
	# journal_entry_names = list(map(lambda j: j.name, journal_entry_search))
	
	new_journal_entry(json.dumps(je_data))

	return True

@frappe.whitelist()
def reset_account_company_results(year):
	if check_closing_journal():
		closing_journal = frappe.db.get_value('VetJournal', {'name': 'CLS'}, 'name')
	else:
		closing_journal = create_closing_journal()

	jis = []
	or_filters = [{'account_code': ['like', '4-%']}, {'account_code': ['like', '5-%']}, {'account_code': ['like', '6-%']}, {'account_code': ['like', '7-%']}, {'account_code': ['like', '8-%']}]
	accounts = frappe.get_list('VetCoa', or_filters=or_filters, fields=['name'], order_by='creation desc')

	### Terpengaruh ###

	for a in accounts:
		jis.append({'account': a['name'], 'debit': 0, 'credit': 0, 'total': 0})

	je_data = {
		'journal': closing_journal,
		'period': '12/{}'.format(year),
		'date': '{}-12-31'.format(year),
		'reference': '',
		'journal_items': jis,
		'keterangan': ''
	}

	# print('je_data reset account')
	# print(je_data)

	# new_journal_entry(json.dumps(je_data), True)
	new_journal_entry(json.dumps(je_data))

	return True


def check_clearing_account():
	clearing_account = frappe.get_list('VetCoa', filters={'name': '3-99998'})
	return len(clearing_account) > 0

def create_clearing_account():
	clearing_account = frappe.new_doc('VetCoa')
	clearing_account.update({
		'account_code': '3-99998',
		'account_name': 'CLEARING ACCOUNT',
		'account_type': 'Equity',
		'is_parent': 0,
		'account_parent': '3-10000',
	})
	clearing_account.insert()
	frappe.db.commit()
	
	return clearing_account.name

def check_laba_rugi_ditahan_account():
	laba_rugi_ditahan_account = frappe.get_list('VetCoa', filters={'name': '3-90000'})
	return len(laba_rugi_ditahan_account) > 0

def create_laba_rugi_ditahan_account():
	laba_rugi_ditahan_account = frappe.new_doc('VetCoa')
	laba_rugi_ditahan_account.update({
		'account_code': '3-90000',
		'account_name': 'LABA / (RUGI) DITAHAN',
		'account_type': 'Equity',
		'is_parent': 0,
		'account_parent': '3-10000',
	})
	laba_rugi_ditahan_account.insert()
	frappe.db.commit()
	
	return laba_rugi_ditahan_account.name

def check_closing_journal():
	closing_journal = frappe.get_list('VetJournal', filters={'name': 'CLS'}, fields=['name'])
	return len(closing_journal) > 0

def create_closing_journal():
	closing_journal = frappe.new_doc('VetJournal')
	closing_journal.update({
		'code': 'CLS',
		'type': 'General',
		'journal_name': 'Closing Journal',
	})
	closing_journal.insert()
	frappe.db.commit()
	
	return closing_journal.name