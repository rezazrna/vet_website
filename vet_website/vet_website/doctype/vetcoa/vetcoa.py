# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
from datetime import datetime as dt
from dateutil.relativedelta import relativedelta as rd
from frappe.model.document import Document

class VetCoa(Document):
	pass
	
@frappe.whitelist()
def get_coa_list(filters=None, all_children=False):
	default_sort = "creation desc"
	td_filters = {}
	je_filters = {}
	filter_json = False
	limit_date = False
	min_trans_date = False
	max_trans_date = False
	search_mode = False
	dc_mode = False
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
		
	if filter_json:
		search = filter_json.get('search', False)
		sort = filter_json.get('sort', False)
		min_date = filter_json.get('min_date', False)
		max_date = filter_json.get('max_date', False)
		accounting_date = filter_json.get('accounting_date', False)
		dc = filter_json.get('dc_mode', False)
		
		if search:
			search_mode = True
			td_filters.update({'account_name': ['like', '%'+search+'%']})
			
		if sort:
			default_sort = sort
			
		if min_date:
			min_trans_date = min_date
		if max_date:
			max_trans_date = max_date
			
		if accounting_date:
			limit_date = accounting_date
		if dc:
			dc_mode = True
	
	try:
		if not search_mode:
			td_filters.update({'account_parent': ''})
		print('mulai get_list')
		coa_list = frappe.get_list("VetCoa", filters=td_filters, fields=["*"], order_by='account_code asc')
		print('selesai get_list')
		if not dc_mode:
			print('mulai get_coa_last_total')
			for c in coa_list:
				print('get_coa_last_total')
				print(c.name)
				c['total'] = get_coa_last_total(c.name, max_date=limit_date)
				print('dapat')
				print(c.name)
			print('selesai get_coa_last_total')
		else:
			for c in coa_list:
				tdc = get_coa_total_debit_credit(c.name, max_date=limit_date, no_min_date=True)
				c['total_debit'] = tdc.get('total_debit', 0)
				c['total_credit'] = tdc.get('total_credit', 0)
		# res = []
		
		# for c in coa_list:
		# 	coa = frappe.get_doc('VetCoa', c['name'])
		
		# 	res.append(coa)
		
		# list_coa = []
		
		print(all_children)
		if all_children:
			for c in coa_list:
				c['children'] = get_coa_children(c.name, max_trans_date, min_trans_date, dc_mode, True)
		
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
def get_coa_children(name, max_date=False, min_date=False, dc_mode=False, all_children=False):
	try:
		filters={'account_parent': name}
		children = frappe.get_list('VetCoa', filters=filters, fields="*", order_by="account_code asc")
		if not dc_mode:
			for c in children:
				c['total'] = get_coa_last_total(c.name, max_date=max_date)
		else:
			for c in children:
				tdc = get_coa_total_debit_credit(c.name, max_date=max_date, no_min_date=True)
				c['total_debit'] = tdc.get('total_debit', 0)
				c['total_credit'] = tdc.get('total_credit', 0)
		
		if all_children:
			for c in children:
				c['children'] = get_coa_children(c.name, max_date, min_date, dc_mode, all_children)
		return children
	except:
		return {'error': "Gagal mendapatkan children"}
		
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

def get_coa_last_total(coa_name, max_date=False, no_min_date=False):
	
	total = 0
	coa = frappe.get_doc('VetCoa', coa_name)
	
	filters = {'account': coa.name}
	je_filters = {}
	
	if max_date:
		max_date_dt = dt.strptime(max_date, '%Y-%m-%d') - rd(days=1)
		if no_min_date:
			je_filters.update({'date': ['<', max_date]})
		else:
			if max_date_dt.day != 1:
				min_date = max_date_dt.strftime('%Y-%m-01')
			else:
				min_date = (max_date_dt-rd(months=1)).strftime('%Y-%m-01')
			je_filters.update({'date': ['between', [min_date, max_date_dt.strftime('%Y-%m-%d')]]})
			
	if je_filters:
		journal_entry_search = frappe.get_list("VetJournalEntry", filters=je_filters, fields=["name"], order_by='date desc')
		if len(journal_entry_search):
			journal_entry_names = list(j.name for j in journal_entry_search)
			filters.update({'parent': ['in', journal_entry_names]})
			
	ji_list = frappe.get_list("VetJournalItem", filters=filters, fields=['debit', 'credit', 'total', 'parent'], order_by="creation desc")
	for ji in ji_list:
		ji['date'] = frappe.db.get_value('VetJournalEntry', ji.parent, 'date')
		
	ji_list.sort(key=lambda x: x.date, reverse=True)
	if len(ji_list) != 0:
		if coa.account_type in ['Asset','Expense']:
			for ji in ji_list:
				total += ji.debit - ji.credit
		elif coa.account_type in ['Equity','Income','Liability']:
			for ji in ji_list:
				total += ji.credit - ji.debit
		# total = total + ji_list[0].total
		
	children = frappe.get_list('VetCoa', filters={'account_parent': coa.name}, fields="name", order_by="account_code asc")
	if len(children) != 0:
		total = total + sum(get_coa_last_total(c.name, max_date=max_date, no_min_date=no_min_date) for c in children)
		
	return total
	
def get_coa_total_debit_credit(name, max_date=False, no_min_date=False):
	
	total_debit = 0
	total_credit = 0
	
	coa = frappe.get_doc('VetCoa', name)
	
	journal_items_filters = {'account': coa.name}
	je_filters = {}
			
	if max_date:
		max_date_dt = dt.strptime(max_date, '%Y-%m-%d') - rd(days=1)
		if no_min_date:
			je_filters.update({'date': ['<', max_date]})
		else:
			if max_date_dt.day != 1:
				min_date = max_date_dt.strftime('%Y-%m-01')
			else:
				min_date = (max_date_dt-rd(months=1)).strftime('%Y-%m-01')
			je_filters.update({'date': ['between', [min_date, max_date_dt.strftime('%Y-%m-%d')]]})
	
	if je_filters:
		journal_entry_search = frappe.get_list("VetJournalEntry", filters=je_filters, fields=["name"], order_by='date desc')
		if len(journal_entry_search):
			journal_entry_names = list(j.name for j in journal_entry_search)
			journal_items_filters.update({'parent': ['in', journal_entry_names]})
	
	journal_items = frappe.get_list('VetJournalItem', filters=journal_items_filters, fields=['total', 'parent'], order_by="creation desc")
	
	for ji in journal_items:
		ji['date'] = frappe.db.get_value('VetJournalEntry', ji.parent, 'date')
	journal_items.sort(key=lambda x: x.date, reverse=True)
	
	if len(journal_items) != 0:
		if coa.account_type in ['Asset','Expense']:
			if '1-' in coa.account_code:
				if journal_items[0].total < 0:
					total_credit = total_credit + (-journal_items[0].total)
				else:
					total_debit = total_debit + journal_items[0].total
			else:
				total_debit = total_debit + journal_items[0].total
		elif coa.account_type in ['Equity','Income','Liability']:
			total_credit = total_credit + journal_items[0].total
	
	children = frappe.get_list('VetCoa', filters={'account_parent': coa.name}, fields="name", order_by="account_code asc")
	if len(children) != 0:
		for c in children:
			tdc = get_coa_total_debit_credit(c.name, max_date=max_date, no_min_date=no_min_date)
			total_debit = total_debit + tdc.get('total_debit', 0)
			total_credit = total_credit + tdc.get('total_credit', 0)
			
	return {
		'total_debit': total_debit,
		'total_credit': total_credit
	}
	
	
@frappe.whitelist()
def get_financial_report_data(month=False, year=False):
	now_date = dt.now().strftime('%Y-%m-%d')
	if not month:
		month = dt.now().strftime('%m')
	if not year:
		year = dt.now().strftime('%Y')
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
					date = dt.now() - rd(month=i) + rd(months=1) + rd(day=1)
				else:
					date = dt(int(year), 1, 1) - rd(month=i) + rd(months=1) + rd(day=1)
				print(date)
				limit_date = date.strftime('%Y-%m-%d')
				totals.append({'month': i, 'total': get_coa_last_total(c.name, max_date=limit_date)})
			totals.append({'month': 'Total', 'total': get_coa_last_total(c.name)})
			c['total'] = totals
		
		return coa_list
					
	except PermissionError as e:
		return {'error': e}