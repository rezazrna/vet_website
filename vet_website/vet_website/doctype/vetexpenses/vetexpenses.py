# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
from frappe.model.document import Document
from vet_website.vet_website.doctype.vetjournalentry.vetjournalentry import new_journal_entry, set_journal_item_total
from vet_website.vet_website.doctype.vetoperation.vetoperation import action_receive
from vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice import decrease_product_valuation

class VetExpenses(Document):
	pass

@frappe.whitelist()
def get_expenses_list(filters=None):
	default_sort = "creation desc"
	po_filters = []
	filter_json = False
	page = 1

	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
			
	if filter_json:
		n = filter_json.get('n', False)
		sort = filter_json.get('sort', False)
		filters_json = filter_json.get('filters', False)
		currentpage = filter_json.get('currentpage', False)
		search = filter_json.get('search', False)

		if currentpage:
			page = currentpage
		
		if filters_json:
			for fj in filters_json:
				po_filters.append(fj)
		
		if search:
			po_filters.append({'expense_name': ['like', '%'+search+'%']})
		
		if n:
			po_filters.append({'name': n})
			
		if sort:
			default_sort = sort
	
	try:
		expenses = frappe.get_list("VetExpenses", filters=po_filters, fields=["*"], order_by=default_sort, start=(page - 1) * 10, page_length= 10)
		datalength = len(frappe.get_all("VetExpenses", filters=po_filters, as_list=True))
		for e in expenses:
			e['responsible'] = frappe.get_value('User', e['responsible'], 'full_name')
			journal_entry = frappe.get_list('VetJournalEntry', filters={'reference': e.name}, fields=['name'])
			if len(journal_entry) > 0:
				e['journal_entry'] = list(j.name for j in journal_entry)
			
		return {'expenses': expenses, 'datalength': datalength}
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def delete_expenses(data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal menghapus expense"}
	
	for d in data_json:
		frappe.delete_doc('VetExpenses', d)
		frappe.db.commit()
		
	return {'success': True}
	
@frappe.whitelist()
def get_expenses(name=None):
	try:
		if name == False or name == None:
			expense = {}
		else:
			expense = frappe.get_doc("VetExpenses", name)
		    
		productAll = frappe.get_list('VetProduct', fields=['*'])
		for pl in productAll:
			stock_input_account = frappe.db.get_value('VetProductCategory', pl.product_category, 'stock_input_account')
			stock_output_account = frappe.db.get_value('VetProductCategory', pl.product_category, 'stock_output_account')
			cash_account = frappe.db.get_value('VetCoa', stock_input_account, 'account_name')
			expense_account = frappe.db.get_value('VetCoa', stock_output_account, 'account_name')
			pl.update({'stockable': frappe.db.get_value('VetProductCategory', pl.product_category, 'stockable'), 'cash_account': cash_account, 'expense_account': expense_account})
		userAll = frappe.get_list('User', fields=['*'])
		# cashAccounts = frappe.get_list('VetCoa', filters={'account_code': ['like', '1-11%'], 'is_parent': 0, 'account_type': 'Asset'}, fields=['*'])
		# expenseAccounts = frappe.get_list('VetCoa', filters={'is_parent': 0, 'account_type': 'Expense'}, or_filters=[['account_code', 'like', '8-%'], ['account_code', 'like', '6-%']], fields=['*'])
		cashAccounts = frappe.get_list('VetCoa', filters={'is_parent': 0}, fields=['*'])
		expenseAccounts = frappe.get_list('VetCoa', filters={'is_parent': 0}, fields=['*'])
		warehouseAll = frappe.get_list('VetGudang', fields=['*'])
		journal_entry_names = []
		if name:
			journal_entry = frappe.get_list('VetJournalEntry', filters={'reference': expense.name}, fields=['name'])
			if len(journal_entry) > 0:
				journal_entry_names = list(j.name for j in journal_entry)
		
		res = {'expense': expense, 'productAll': productAll, 'userAll': userAll, 'cashAccounts': cashAccounts, 'expenseAccounts': expenseAccounts, 'warehouseAll': warehouseAll, 'journal_entry': journal_entry_names}
		    
		return res
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def refuse_expense(name):
	try:
		expense = frappe.get_doc('VetExpenses', name)
		expense.status = 'Refuse'
		expense.save()
	except:
		return {'error': "Gagal menemukan expense"}
		
	return {'expense': expense}
	
@frappe.whitelist()
def submit_expense(data, saveOnly=False):
	try:
		data_json = json.loads(data)
		
		if data_json.get('name') :
			update_data = {}
			fields_list = (f.fieldname for f in frappe.get_list('DocField', filters={'parent': 'VetExpenses'}, fields=['fieldname']))
			for f in fields_list:
				if data_json.get(f, False):
					update_data.update({f: data_json.get(f)})
			print(update_data)
			expense = frappe.get_doc("VetExpenses", data_json['name'])
			expense.update(update_data)
			if not saveOnly:
				expense.update({'status': 'Paid'})
			expense.save()
			
			if not saveOnly:
				product_category = frappe.db.get_value('VetProduct', expense.product, 'product_category')
				stockable = frappe.db.get_value('VetProductCategory', product_category, 'stockable')
				
				if(expense.product and stockable == 1):
					create_expense_operation(expense.name)
					decrease_product_valuation(expense.product, expense.quantity)
				create_expense_journal_items(data_json['name'])
			
		else :
			expense = frappe.new_doc("VetExpenses")
			expense.update(data_json)
			expense.insert()
				
		return {'expense': expense}

	except PermissionError as e:
		return {'error': e}

def create_expense_journal_items(expense_name):
	expense = frappe.get_doc('VetExpenses', expense_name)
	
	je_search = frappe.get_list('VetJournalEntry', filters={'reference': expense.name}, fields=['name'])
	
	if je_search:
		ji_search = frappe.get_list('VetJournalItem', filters={'parent': je_search[0]['name']}, fields=['name'])
		for i in ji_search:
			ji = frappe.get_doc('VetJournalItem', i['name'])
			if ji.account == expense.expense_account:
				ji.debit = expense.quantity * expense.price
			elif ji.account == expense.cash_account:
				ji.credit = expense.quantity * expense.price
			ji.save()
			frappe.db.commit()
			
			set_journal_item_total(ji.name, ji.account)
	else:
		expense_journal = frappe.db.get_value('VetJournal', {'journal_name': 'Expense', 'type': 'General'}, 'name')
		jis = [
			{
				'account': expense.expense_account,
				'debit': expense.quantity * expense.price,
				'credit': 0,
			},{
				'account': expense.cash_account,
				'credit': expense.quantity * expense.price,
				'debit': 0,
			}
		]
		
		je_data = {
			'journal': expense_journal,
			'period': expense.period,
			'date': expense.expense_date.strftime('%Y-%m-%d'),
			'reference': expense.name,
			'journal_items': jis
		}
		
		new_journal_entry(json.dumps(je_data))
		
		# new_je = frappe.new_doc('VetJournalEntry')
		# new_je.update(je_data)
		# new_je.insert()
		# frappe.db.commit()
		
def create_expense_operation(expense_name):
	# warehouse_list = frappe.get_list('VetGudang', fields=['name'])
	expense = frappe.get_doc("VetExpenses", expense_name)
	
	out_operation = frappe.new_doc("VetOperation")
	out_operation.update({
		'reference': expense.name,
		'from': expense.warehouse,
		'date': expense.expense_date,
		'status': 'Delivery',
		'moves': [{
			'product': expense.product,
			'quantity': expense.quantity,
			'quantity_done': expense.quantity,
			'date': expense.expense_date,
			
		}],
	})
	out_operation.insert()
	frappe.db.commit()
	out_moves = frappe.get_list('VetOperationMove', filters={'parent': out_operation.name}, fields=['name', 'product', 'product_uom', 'quantity', 'quantity_done'])
	action_receive(out_operation.name, json.dumps(out_moves))