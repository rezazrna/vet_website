# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
from datetime import datetime as dt
from urllib.parse import unquote
from frappe.model.document import Document
from vet_website.vet_website.doctype.vetjournalentry.vetjournalentry import new_journal_entry

class VetOperation(Document):
	pass

@frappe.whitelist()
def get_operation_list(filters=None):
	default_sort = "creation desc"
	td_filters = []
	filter_json = False
	page = 1
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
		
	if filter_json:
		sort = filter_json.get('sort', False)
		filters_json = filter_json.get('filters', False)
		receipts = filter_json.get('receipts', False)
		delivery_orders = filter_json.get('delivery_orders', False)
		currentpage = filter_json.get('currentpage', False)

		if currentpage:
			page = currentpage
		
		if filters_json:
			for fj in filters_json:
				td_filters.append(fj)
		if sort:
			default_sort = sort
			
		if receipts:
			td_filters.append(('to', '=', unquote(receipts)))
			td_filters.append(('status', '!=', 'Done'))
			
		if delivery_orders:
			td_filters.append(('from', '=', unquote(delivery_orders)))
			td_filters.append(('status', '!=', 'Done'))
	
	try:
		print(td_filters)
		operations = frappe.get_list("VetOperation", filters=td_filters, fields=["*"], order_by=default_sort, start=(page - 1) * 10, page_length= 10)
		datalength = len(frappe.get_all("VetOperation", filters=td_filters, as_list=True))
		print(operations)
			
		return {'operation': operations,'datalength': datalength}
		
	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()
def get_name_list(filters=None):
	td_filters = []
	filter_json = False
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
		
	if filter_json:
		filters_json = filter_json.get('filters', False)
		receipts = filter_json.get('receipts', False)
		delivery_orders = filter_json.get('delivery_orders', False)
		
		if filters_json:
			for fj in filters_json:
				td_filters.append(fj)
			
		if receipts:
			td_filters.append(('to', '=', unquote(receipts)))
			td_filters.append(('status', '!=', 'Done'))
			
		if delivery_orders:
			td_filters.append(('from', '=', unquote(delivery_orders)))
			td_filters.append(('status', '!=', 'Done'))
	
	try:
		print(td_filters)
		namelist = frappe.get_all("VetOperation", filters=td_filters, as_list=True)
			
		return list(map(lambda item: item[0], namelist))
		
	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()
def get_operation_form(name=False):
	try:
		gudang_list = frappe.get_list("VetGudang", fields=['*'])
		product_list = frappe.get_list("VetProduct", fields=['*'])
		uom_list = frappe.get_list("VetUOM", fields=['*'])
		accounts = frappe.get_list('VetCoa', filters={'is_parent': 0}, fields=['*'])
		form_data = {'gudang_list': gudang_list, 'product_list': product_list, 'uom_list': uom_list, 'accounts': accounts}
		if name:
			operation = frappe.get_doc("VetOperation", name)
			form_data.update({'operation': operation})
			
		return form_data
		
	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()
def delete_operation(data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal menghapus operasi"}
	
	for d in data_json:
		frappe.delete_doc('VetOperation', d)
		frappe.db.commit()
		
	return {'success': True}
	
@frappe.whitelist()
def new_operation(data):
	try:
		data_json = json.loads(data)
		op_data = {}
		op_data.update(data_json)
		op_data.pop('moves')
		new_operation = frappe.new_doc('VetOperation')
		new_operation.update(op_data)
		if(data_json.get('is_usage', False) and len(data_json.get('reference', '')) == 0 ):
			new_operation.update({'reference': '-'})
		new_operation.insert()
		
		for m in data_json.get("moves"):
			if all([m.get('product', False), m.get('quantity', False)]):
				new_move = frappe.new_doc('VetOperationMove')
				new_move.update({
					'product': m.get('product', False),
					'quantity': m.get('quantity', False),
					'product_uom': m.get('product_uom', False),
					'price': m.get('price', False),
					'parent': new_operation.name, 
					'parenttype': 'VetOperation', 
					'parentfield': 'moves',
					'date': data_json.get('date', dt.now().strftime('%Y-%m-%d'))
				})
				new_move.insert()
				
		if(data_json.get('is_done', False)):
			usage_operation_submit(new_operation.name)
		
		return new_operation
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def edit_operation(data):
	try:
		data_json = json.loads(data)
		op_data = {}
		op_data.update({'from': data_json.get('from'), 'date': data_json.get('date'), 'reference': data_json.get('reference', '-'), 'expense_account': data_json.get('expense_account', '-')})
		new_operation = frappe.get_doc('VetOperation', data_json.get('name'))
		new_operation.update(op_data)
		if(data_json.get('is_usage', False) and len(data_json.get('reference', '')) == 0 ):
			new_operation.update({'reference': '-'})
		new_operation.save()
		
		for m in data_json.get("moves"):
			if all([m.get('product', False), m.get('quantity', False)]):
				if(m.get('name', False)):
					if(m.get('delete', False)):
						frappe.delete_doc('VetOperationMove', m.get('name'))
					else:
						edit_move = frappe.get_doc('VetOperationMove', m.get('name'))
						edit_move.update({
							'product': m.get('product', False),
							'quantity': m.get('quantity', False),
							'product_uom': m.get('product_uom', False),
							'price': m.get('price', False),
						})
						edit_move.save()
				else:	
					new_move = frappe.new_doc('VetOperationMove')
					new_move.update({
						'product': m.get('product', False),
						'quantity': m.get('quantity', False),
						'product_uom': m.get('product_uom', False),
						'price': m.get('price', False),
						'parent': new_operation.name, 
						'parenttype': 'VetOperation', 
						'parentfield': 'moves',
						'date': data_json.get('date', dt.now().strftime('%Y-%m-%d'))
					})
					new_move.insert()
					
		if(data_json.get('is_done', False)):
			usage_operation_submit(new_operation.name)
		
		return new_operation
		
	except PermissionError as e:
		return {'error': e}		

@frappe.whitelist()
def usage_operation_submit(name):
	operation = frappe.get_doc('VetOperation', name)
	operation.update({'status': 'Delivery'})
	operation.save()
	operation_moves = frappe.get_list('VetOperationMove', filters={'parent': operation.name}, fields=['name', 'product', 'product_uom', 'quantity', 'quantity_done'])
	for om in operation_moves:
		om['quantity_done'] = om['quantity']
	action_receive(operation.name, json.dumps(operation_moves))
	for om in operation_moves:
		decrease_product_valuation(om['product'], om['quantity'])
	create_usage_operation_journal_items(name)
	
@frappe.whitelist()
def action_send(name):
	try:
		data_check = frappe.get_list('VetOperation', filters={'name': name}, fields=['name'])
		if len(data_check) != 0:
			operation = frappe.get_doc('VetOperation', name)
			if operation.status == 'Draft':
				operation.status = 'Delivery'
			operation.save()

			return operation
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def action_receive(name, moves):
	try:
		data_check = frappe.get_list('VetOperation', filters={'name': name}, fields=['name'])
		if len(data_check) != 0:
			operation = frappe.get_doc('VetOperation', name)
			if operation.status == 'Delivery' and any(t['quantity'] == t['quantity_done'] for t in json.loads(moves)):
				operation.status = 'Done'
			
			operation.save()
			frappe.db.commit()
			for m in json.loads(moves):
				if all([m.get('name', False), m.get('product', False), m.get('quantity', False), m.get('quantity_done', False)]):
					move = frappe.get_doc('VetOperationMove', m.get('name', False))
					move.update({
						'quantity_done': m.get('quantity_done', False),
						'receive_date': m.get('receive_date', dt.strftime(dt.now(), "%Y-%m-%d %H:%M:%S")),
					})
					move.save()
					frappe.db.commit()
					
					qty = float(m.get('product_quantity_add', False) or m.get('quantity_done', False))
					product_uom = frappe.db.get_value('VetProduct', move.product, 'product_uom')
					if(product_uom != move.product_uom):
						ratio = frappe.db.get_value('VetUOM', move.product_uom, 'ratio')
						target_ratio = frappe.db.get_value('VetUOM', product_uom, 'ratio')
						qty = qty * (float(ratio or 1)/float(target_ratio or 1))
					
					if operation.get('from', False):
						product_quantity_search_from = frappe.get_list('VetProductQuantity', filters={'product': move.product, 'gudang': operation.get('from')}, fields=['name'])
						if len(product_quantity_search_from) != 0:
							product_quantity = frappe.get_doc('VetProductQuantity', product_quantity_search_from[0].name)
							product_quantity.quantity = float(product_quantity.quantity) - float(qty)
							product_quantity.save()
							frappe.db.commit()
						else:
							product_quantity = frappe.new_doc('VetProductQuantity')
							product_quantity.product = move.product
							product_quantity.quantity = float(-qty)
							product_quantity.gudang = operation.get('from')
							product_quantity.insert()
							frappe.db.commit()
					
					if operation.get('to', False):
						product_quantity_search_to = frappe.get_list('VetProductQuantity', filters={'product': move.product, 'gudang': operation.to}, fields=['name'])
						if len(product_quantity_search_to) != 0:
							product_quantity = frappe.get_doc('VetProductQuantity', product_quantity_search_to[0].name)
							product_quantity.quantity = float(product_quantity.quantity) + float(qty)
							product_quantity.save()
							frappe.db.commit()
						else:
							product_quantity = frappe.new_doc('VetProductQuantity')
							product_quantity.product = move.product
							product_quantity.quantity = float(qty)
							product_quantity.gudang = operation.to
							product_quantity.insert()
							frappe.db.commit()

			operation.reload()
			purchase_name_search = frappe.db.get_value('VetPurchaseProducts', operation.reference) or False
			if purchase_name_search:
				purchase = frappe.get_doc('VetPurchase', operation.reference)
				products = frappe.get_list('VetPurchaseProducts', filters={'parent': purchase.name}, fields=['*'])
				for m in products:
					operation_moves = next((p for p in operation.moves if p.product == m.product), False)
					if operation_moves:
						m.quantity_receive = operation_moves.quantity_done
						
				receive_purchase(purchase.name, products)

			return operation
		
	except PermissionError as e:
		return {'error': e}

def receive_purchase(name, products):
	try:
		purchase = frappe.get_doc('VetPurchase', name)
		payments = frappe.get_list('VetPurchasePay', filters={'parent': purchase.name}, fields=['*'])
		
		if all(t['quantity'] == t['quantity_receive'] for t in products):
			purchase.status = 'Receive'
		
		if check_paid_purchase(name):
			purchase.status = 'Paid'	
			
		purchase.save()
		
		for p in products:
			product_purchase = frappe.get_doc('VetPurchaseProducts', p.get('name'))
			product_purchase.quantity_receive = p.get('quantity_receive')
			product_purchase.quantity_stocked = p.get('quantity_receive')
			product_purchase.save()
				
		return {'purchase': purchase}
	except PermissionError as e:
		return {'error': e}
		
def check_paid_purchase(name):
	purchase = frappe.get_doc('VetPurchase', name)
	subtotal = 0
	for p in purchase.products:
		subtotal = subtotal + (p.quantity * p.price)
	paid = sum(int(p.jumlah) for p in purchase.pembayaran)
	if paid >= subtotal:
		return True
	else:
		return False
		
@frappe.whitelist()
def get_stock_move_list(filters=None):
	default_sort = "creation desc"
	td_filters = []
	filter_json = False
	page = 1
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
		
	if filter_json:
		sort = filter_json.get('sort', False)
		product = filter_json.get('product', False)
		filters_json = filter_json.get('filters', False)
		currentpage = filter_json.get('currentpage', False)

		if currentpage:
			page = currentpage
		
		if filters_json:
			for fj in filters_json:
				td_filters.append(fj)
		
		if sort:
			default_sort = sort
		if product:
			td_filters.append({'product': product})
	
	try:
		stock_move = frappe.get_list("VetOperationMove", filters=td_filters, fields=["*"], order_by=default_sort, start=(page - 1) * 10, page_length= 10)
		datalength = len(frappe.get_all("VetOperationMove", filters=td_filters, as_list=True))
		
		for s in stock_move:
			operation = frappe.get_doc("VetOperation", s.parent)
			s['reference'] = operation.reference
			s['from_name'] = operation.from_name
			s['to_name'] = operation.to_name
			s['status'] = operation.status
			
		return {'operation': stock_move, 'datalength': datalength}
		
	except PermissionError as e:
		return {'error': e}
		
		
@frappe.whitelist()
def decrease_product_valuation(product, quantity, uom=False, reverse=False):
	adjustment_value = 0
	
	product_uom = uom
	if not product_uom:
		product_uom = frappe.db.get_value('VetProduct', 'product_uom')
		
	purchase_with_stock_search = frappe.get_list('VetPurchaseProducts', filters={'product': product}, fields=['*'], order_by="creation asc")
	purchase_with_stock = list(p for p in purchase_with_stock_search if p.quantity_stocked)
	if len(purchase_with_stock):
		
		current_quantity = float(quantity)
		current_uom = product_uom
		
		for pws in purchase_with_stock:
			if current_quantity != 0:
				purchase_product = frappe.get_doc('VetPurchaseProducts', pws.name)
				
				if(purchase_product.uom != current_uom):
					ratio = frappe.db.get_value('VetUOM', current_uom, 'ratio')
					target_ratio = frappe.db.get_value('VetUOM', purchase_product.uom, 'ratio')
					current_quantity = current_quantity * (float(ratio or 1)/float(target_ratio or 1))
					current_uom = purchase_product.uom
				
				if not reverse:
					if current_quantity >= purchase_product.quantity_stocked:
						current_quantity = float(current_quantity) - purchase_product.quantity_stocked
						adjustment_value += purchase_product.quantity_stocked * purchase_product.price
						purchase_product.quantity_stocked = 0
						purchase_product.save()
						frappe.db.commit()
					else:
						adjustment_value += float(current_quantity) * purchase_product.price
						purchase_product.quantity_stocked = purchase_product.quantity_stocked - float(current_quantity)
						current_quantity = 0
						purchase_product.save()
						frappe.db.commit()
				else:
					adjustment_value += float(current_quantity) * purchase_product.price
					purchase_product.quantity_stocked = purchase_product.quantity_stocked + float(current_quantity)
					current_quantity = 0
					purchase_product.save()
					frappe.db.commit()
					
	return adjustment_value
	
def create_usage_operation_journal_items(name):
	operation = frappe.get_doc('VetOperation', name)
	operation_moves = frappe.get_list('VetOperationMove', filters={'parent': operation.name}, fields=['name', 'product', 'product_uom', 'quantity', 'quantity_done', 'price'])
	subtotal = 0
	product_journal_items = []
	for om in operation_moves:
		current_total = om['price'] * om['quantity']
		subtotal += current_total
		product_category_name = frappe.db.get_value('VetProduct', om['product'], 'product_category')
		product_category = frappe.get_doc('VetProductCategory', product_category_name)
		same_income_ji = next((ji for ji in product_journal_items if ji.get('account') == product_category.stock_input_account), False)
		if same_income_ji:
			same_income_ji.update({
				'credit': same_income_ji.get('credit') + current_total,
			})
		else:
			product_journal_items.append({
				'account': product_category.stock_input_account,
				'credit': current_total,
			})
	
	expense_journal = frappe.db.get_value('VetJournal', {'journal_name': 'Expense', 'type': 'General'}, 'name')
	jis = [
		{
			'account': operation.expense_account,
			'debit': subtotal,
			'credit': 0,
		}
	]
	
	jis += product_journal_items
	
	je_data = {
		'journal': expense_journal,
		'period': operation.date.strftime('%m/%Y'),
		'date': operation.date.strftime('%Y-%m-%d'),
		'reference': operation.name,
		'journal_items': jis
	}
	
	new_journal_entry(json.dumps(je_data))