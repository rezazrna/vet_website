# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
from datetime import datetime as dt
from frappe.model.document import Document

class VetOperation(Document):
	pass

@frappe.whitelist()
def get_operation_list(filters=None):
	default_sort = "creation desc"
	td_filters = []
	filter_json = False
	
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
		
		if filters_json:
			for fj in filters_json:
				td_filters.append(fj)
		if sort:
			default_sort = sort
			
		if receipts:
			td_filters.append({'to': receipts, 'status': ['!=', 'Done']})
			
		if delivery_orders:
			td_filters.append({'from': delivery_orders, 'status': ['!=', 'Done']})
	
	try:
		operations = frappe.get_list("VetOperation", filters=td_filters, fields=["*"], order_by=default_sort)
			
		return operations
		
	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()
def get_operation_form(name=False):
	try:
		gudang_list = frappe.get_list("VetGudang", fields=['*'])
		product_list = frappe.get_list("VetProduct", fields=['*'])
		uom_list = frappe.get_list("VetUOM", fields=['*'])
		form_data = {'gudang_list': gudang_list, 'product_list': product_list, 'uom_list': uom_list}
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
		new_operation.insert()
		
		for m in data_json.get("moves"):
			if all([m.get('product', False), m.get('quantity', False)]):
				new_move = frappe.new_doc('VetOperationMove')
				new_move.update({
					'product': m.get('product', False),
					'quantity': m.get('quantity', False),
					'product_uom': m.get('product_uom', False),
					'parent': new_operation.name, 
					'parenttype': 'VetOperation', 
					'parentfield': 'moves',
					'date': data_json.get('date', dt.now().strftime('%Y-%m-%d'))
				})
				new_move.insert()
		
		return new_operation
		
	except PermissionError as e:
		return {'error': e}
	
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
					})
					move.save()
					frappe.db.commit()
					
					qty = float(m.get('quantity_done', False))
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
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
		
	if filter_json:
		sort = filter_json.get('sort', False)
		product = filter_json.get('product', False)
		filters_json = filter_json.get('filters', False)
		
		if filters_json:
			for fj in filters_json:
				td_filters.append(fj)
		
		if sort:
			default_sort = sort
		if product:
			td_filters.append({'product': product})
	
	try:
		stock_move = frappe.get_list("VetOperationMove", filters=td_filters, fields=["*"], order_by=default_sort)
		
		for s in stock_move:
			operation = frappe.get_doc("VetOperation", s.parent)
			s['reference'] = operation.reference
			s['from_name'] = operation.from_name
			s['to_name'] = operation.to_name
			s['status'] = operation.status
			
		return stock_move
		
	except PermissionError as e:
		return {'error': e}