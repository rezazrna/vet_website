# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
from shutil import move
import frappe
import json
import pytz
from datetime import datetime as dt
from urllib.parse import unquote
from frappe.model.document import Document
from numpy import product
from vet_website.vet_website.doctype.vetjournalentry.vetjournalentry import new_journal_entry
from dateutil.relativedelta import relativedelta as rd

class VetOperation(Document):
	pass

@frappe.whitelist()
def get_operation_list(filters=None):
	default_sort = "creation desc"
	td_filters = []
	td_or_filters = []
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
		search = filter_json.get('search', False)

		if currentpage:
			page = currentpage
		
		if filters_json:
			for fj in filters_json:
				td_filters.append(fj)
		if sort:
			default_sort = sort

		if search:
			td_or_filters.append({'name': ['like', '%'+search+'%']})
			td_or_filters.append({'reference': ['like', '%'+search+'%']})
			td_or_filters.append({'from_name': ['like', '%'+search+'%']})
			td_or_filters.append({'to_name': ['like', '%'+search+'%']})
			td_or_filters.append({'status': ['like', '%'+search+'%']})
			
		if receipts:
			td_filters.append(('to', '=', unquote(receipts)))
			td_filters.append(('status', '!=', 'Done'))
			
		if delivery_orders:
			td_filters.append(('from', '=', unquote(delivery_orders)))
			td_filters.append(('status', '!=', 'Done'))
	
	try:
		operations = frappe.get_list("VetOperation", or_filters=td_or_filters, filters=td_filters, fields=["*"], order_by=default_sort, start=(page - 1) * 10, page_length= 10)
		datalength = len(frappe.get_all("VetOperation", or_filters=td_or_filters, filters=td_filters, as_list=True))
			
		return {'operation': operations,'datalength': datalength}
		
	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()
def get_name_list(filters=None):
	default_sort = "creation desc"
	td_filters = []
	td_or_filters = []
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
		search = filter_json.get('search', False)
		
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

		if search:
			td_or_filters.append({'name': ['like', '%'+search+'%']})
			td_or_filters.append({'reference': ['like', '%'+search+'%']})
			td_or_filters.append({'from_name': ['like', '%'+search+'%']})
			td_or_filters.append({'to_name': ['like', '%'+search+'%']})
			td_or_filters.append({'status': ['like', '%'+search+'%']})
	
	try:
		namelist = frappe.get_all("VetOperation", or_filters=td_or_filters, filters=td_filters, order_by=default_sort, as_list=True)
			
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
		operation = frappe.get_doc("VetOperation", d)
		moves = frappe.get_list('VetOperationMove', filters={'parent': operation.name}, fields=['*'])

		for m in moves:
			qty = m.quantity_done
			product_uom = frappe.db.get_value('VetProduct', m['product'], 'product_uom')
			if(product_uom != m['product_uom']):
				ratio = frappe.db.get_value('VetUOM', m['product_uom'], 'ratio')
				target_ratio = frappe.db.get_value('VetUOM', product_uom, 'ratio')
				qty = qty * (float(ratio or 1)/float(target_ratio or 1))
			
			if operation.get('to', False):
				product_quantity_search_from = frappe.get_list('VetProductQuantity', filters={'product': m['product'], 'gudang': operation.get('from')}, fields=['name'])
				if len(product_quantity_search_from) != 0:
					product_quantity = frappe.get_doc('VetProductQuantity', product_quantity_search_from[0].name)
					product_quantity.quantity = float(product_quantity.quantity) - float(qty)
					product_quantity.save()
					frappe.db.commit()
				else:
					product_quantity = frappe.new_doc('VetProductQuantity')
					product_quantity.product = m['product']
					product_quantity.quantity = float(-qty)
					product_quantity.gudang = operation.get('to')
					product_quantity.insert()
					frappe.db.commit()
				decrease_product_valuation(m['product'], operation.get('to'), m['product_uom'], False)
			
			if operation.get('from', False):
				product_quantity_search_to = frappe.get_list('VetProductQuantity', filters={'product': m['product'], 'gudang': operation.to}, fields=['name'])
				if len(product_quantity_search_to) != 0:
					product_quantity = frappe.get_doc('VetProductQuantity', product_quantity_search_to[0].name)
					product_quantity.quantity = float(product_quantity.quantity) + float(qty)
					product_quantity.save()
					frappe.db.commit()
				else:
					product_quantity = frappe.new_doc('VetProductQuantity')
					product_quantity.product = m['product']
					product_quantity.quantity = float(qty)
					product_quantity.gudang = operation.get('from')
					product_quantity.insert()
					frappe.db.commit()
				increase_product_valuation(operation.reference, m['product'], m['quantity'], m['product_uom'], False)
					
		frappe.delete_doc('VetOperation', d)
		frappe.db.commit()

		
	return {'success': True}

@frappe.whitelist()
def decrease_product_valuation(product, quantity, warehouse=False, uom=False, reverse=False):
	adjustment_value = 0

	gudang = frappe.get_list("VetGudang", fields=["name"])
	default_warehouse = frappe.get_list('VetGudang', filters={'is_default': '1'}, fields=['name', 'gudang_name'], limit=1)

	if not warehouse:
		if default_warehouse:
			warehouse = default_warehouse[0].name
		else:
			warehouse = gudang[0].name
	
	product_uom = uom
	if not product_uom:
		product_uom = frappe.db.get_value('VetProduct', product, 'product_uom')
		
	purchase_with_stock_search = frappe.get_list('VetPurchaseProducts', filters={'product': product}, fields=['name', 'quantity_stocked', 'product', 'product_name', 'price', 'parent'], order_by="creation asc")
	purchase_with_stock = list(p for p in purchase_with_stock_search if frappe.db.get_value('VetPurchase', p.parent, 'deliver_to') == warehouse and p.quantity_stocked)
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

@frappe.whitelist()
def increase_product_valuation(name, product, quantity, uom=False, refund_from=False):
	adjustment_value = 0
	line = []
	isOrder = 'PO' in name
	
	product_uom = uom
	if not product_uom:
		product_uom = frappe.db.get_value('VetProduct', 'product_uom')

	if refund_from:
		if isOrder:
			line = frappe.get_list('VetPosOrderProduk', filters={'parent': refund_from, 'produk': product}, fields=['*'])
		else:
			line = frappe.get_list('VetCustomerInvoiceLine', filters={'parent': refund_from, 'product': product}, fields=['*'])
	else:
		if isOrder:
			line = frappe.get_list('VetPosOrderProduk', filters={'parent': name, 'produk': product}, fields=['*'])
		else:
			line = frappe.get_list('VetCustomerInvoiceLine', filters={'parent': name, 'product': product}, fields=['*'])

	if line:
		if isOrder:
			purchase_products = frappe.get_list('VetPosOrderPurchaseProducts', filters={'order_produk_name': line[0]['name']}, fields=['*'], order_by="name desc")
		else:
			purchase_products = frappe.get_list('VetCustomerInvoicePurchaseProducts', filters={'invoice_line_name': line[0]['name']}, fields=['*'], order_by="name desc")
		
		current_quantity = float(quantity)
		current_uom = product_uom
		
		for pws in purchase_products:
			if current_quantity != 0:
				purchase_product = frappe.get_doc('VetPurchaseProducts', pws.purchase_products_name)
				
				if(purchase_product.uom != current_uom):
					ratio = frappe.db.get_value('VetUOM', current_uom, 'ratio')
					target_ratio = frappe.db.get_value('VetUOM', purchase_product.uom, 'ratio')
					current_quantity = current_quantity * (float(ratio or 1)/float(target_ratio or 1))
					current_uom = purchase_product.uom

				if float(current_quantity) >= pws.quantity:
					adjustment_value += pws.quantity * purchase_product.price
					purchase_product.quantity_stocked = purchase_product.quantity_stocked + pws.quantity
					current_quantity = float(current_quantity) - pws.quantity
					purchase_product.save()
					frappe.db.commit()
				else:
					adjustment_value += float(current_quantity) * purchase_product.price
					purchase_product.quantity_stocked = purchase_product.quantity_stocked + float(current_quantity)
					current_quantity = 0
					purchase_product.save()
					frappe.db.commit()
					
	return adjustment_value
	
@frappe.whitelist()
def new_operation(data):
	try:
		tz = pytz.timezone("Asia/Jakarta")
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
					'date': data_json.get('date', dt.now(tz).strftime('%Y-%m-%d'))
				})
				new_move.insert()
				
		if(data_json.get('is_done', False)):
			usage_operation_submit(new_operation.name, new_operation.get('from'))
		
		return new_operation
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def edit_operation(data):
	try:
		tz = pytz.timezone("Asia/Jakarta")
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
						'date': data_json.get('date', dt.now(tz).strftime('%Y-%m-%d'))
					})
					new_move.insert()
					
		if(data_json.get('is_done', False)):
			usage_operation_submit(new_operation.name, new_operation.get('from'))
		
		return new_operation
		
	except PermissionError as e:
		return {'error': e}		

@frappe.whitelist()
def usage_operation_submit(name, warehouse=False):
	operation = frappe.get_doc('VetOperation', name)
	operation.update({'status': 'Delivery'})
	operation.save()
	operation_moves = frappe.get_list('VetOperationMove', filters={'parent': operation.name}, fields=['name', 'product', 'product_uom', 'quantity', 'quantity_done'])
	for om in operation_moves:
		om['quantity_done'] = om['quantity']
	action_receive(operation.name, json.dumps(operation_moves))
	for om in operation_moves:
		decrease_product_valuation(om['product'], om['quantity'], warehouse, om['product_uom'])
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
def action_receive(name, moves, change_product_quantity=True):
	try:
		tz = pytz.timezone("Asia/Jakarta")
		data_check = frappe.get_list('VetOperation', filters={'name': name}, fields=['name'])
		if len(data_check) != 0:
			operation = frappe.get_doc('VetOperation', name)
			if operation.status == 'Delivery' and all(t['quantity'] == t['quantity_done'] for t in json.loads(moves)):
				operation.status = 'Done'
			
			operation.save()
			frappe.db.commit()
			for m in json.loads(moves):
				if all([m.get('name', False), m.get('product', False), m.get('quantity', False), m.get('quantity_done', False)]):
					move = frappe.get_doc('VetOperationMove', m.get('name', False))
					move.update({
						'quantity_done': m.get('quantity_done', False),
						'receive_date': m.get('receive_date', dt.strftime(dt.now(tz), "%Y-%m-%d %H:%M:%S")),
					})
					move.save()
					frappe.db.commit()

					if change_product_quantity:
					
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
		subtotal = subtotal + (float(p.quantity) * float(p.price))
	paid = sum(float(p.jumlah) for p in purchase.pembayaran)
	if paid >= subtotal:
		return True
	else:
		return False
		
@frappe.whitelist()
def get_stock_move_list(filters=None):
	default_sort = "creation desc"
	td_filters = []
	td_or_filters = []
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
		search = filter_json.get('search', False)

		if currentpage:
			page = currentpage
		
		if filters_json:
			for fj in filters_json:
				td_filters.append(fj)

		if search:
			td_or_filters.append({'product_name': ['like', '%'+search+'%']})
			td_or_filters.append({'quantity': ['like', '%'+search+'%']})
		
		if sort:
			default_sort = sort
		if product:
			td_filters.append({'product': product})
	
	try:
		stock_move = frappe.get_list("VetOperationMove", or_filters=td_or_filters, filters=td_filters, fields=["*"], order_by=default_sort, start=(page - 1) * 10, page_length= 10)
		datalength = len(frappe.get_all("VetOperationMove", or_filters=td_or_filters, filters=td_filters, as_list=True))
		
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
def get_kartu_stok_list(filters=None, mode=False):
	td_filters = []
	moves_filters = []
	operation_filters = [{'reference': ['not like', '%Retur%']}]
	gudang_or_filters = []
	filter_json = False
	gudang = False
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
		
	if filter_json:
		product = filter_json.get('product', False)
		gudang = filter_json.get('gudang', False)
		filters_json = filter_json.get('filters', False)
		stock_date = filter_json.get('stock_date', False)
		
		if filters_json:
			for fj in filters_json:
				td_filters.append(fj)

		if product:
			td_filters.append({'product': product})
			moves_filters.append({'product': product})

		if gudang:
			gudang_or_filters.append({'from': gudang})
			gudang_or_filters.append({'to': gudang})

		if stock_date:
			if mode == 'monthly' or mode == 'period':
				max_date_dt = dt.strptime(stock_date, '%Y-%m-%d') - rd(days=1)
			else:
				max_date_dt = dt.strptime(stock_date, '%Y-%m-%d')

			if mode == 'monthly':
				min_date = (max_date_dt).strftime('%Y-%m-01')
			else:
				min_date = max_date_dt.strftime('%Y-01-01')
			# td_filters.append({'date': ['between', [min_date, max_date_dt.strftime('%Y-%m-%d')]]})
			# moves_filters.append({'date': ['<', min_date]})
			td_filters.append({'receive_date': ['between', [min_date, max_date_dt.strftime('%Y-%m-%d')]]})
			moves_filters.append({'receive_date': ['<', min_date]})
			moves_filters.append({'receive_date': ['not in', [None, '']]})
	try:
		if gudang_or_filters or operation_filters:
			operation_names = frappe.get_list("VetOperation", or_filters=gudang_or_filters, filters=operation_filters)
			td_filters.append({'parent': ['in', list(map(lambda item: item['name'], operation_names))]})
			moves_filters.append({'parent': ['in', list(map(lambda item: item['name'], operation_names))]})
		# kartu_stok = frappe.get_list("VetOperationMove", filters=td_filters, fields=["*"], order_by="date asc")
		kartu_stok = frappe.get_list("VetOperationMove", filters=td_filters, fields=["*"], order_by="receive_date asc")
		saldo_awal = {'saldo': 0, 'masuk': 0, 'keluar': 0}
		# moves = frappe.get_list("VetOperationMove", filters=moves_filters, fields=["*"], order_by="date asc")
		moves = frappe.get_list("VetOperationMove", filters=moves_filters, fields=["*"], order_by="receive_date asc")
		if moves:
			saldo_awal = count_saldo_quantity(moves, gudang)

		saldo = saldo_awal['saldo']
		
		for k in kartu_stok:
			operation = frappe.get_doc("VetOperation", k.parent)
			k['reference'] = operation.reference
			k['from_name'] = operation.from_name
			k['to_name'] = operation.to_name
			k['from'] = operation.get('from')
			k['to'] = operation.to
			k['status'] = operation.status
			if operation.get('from', False) and (operation.get('from', False) == gudang or not gudang):
				saldo -= k.quantity_done
			elif operation.get('to', False) and (operation.get('to', False) == gudang or not gudang):
				saldo += k.quantity_done
			k['saldo'] = saldo
			
			
		return {'kartu_stok': kartu_stok, 'saldo_awal': saldo_awal['saldo']}
		
	except PermissionError as e:
		return {'error': e}

def count_saldo_quantity(moves, gudang):
	saldo = 0
	masuk = 0
	keluar = 0
	for m in moves:
		operation = frappe.get_doc("VetOperation", m.parent)
		if operation.get('from', False) and (operation.get('from', False) == gudang or not gudang):
			saldo -= m.quantity_done
			keluar += m.quantity_done
		elif operation.get('to', False) and (operation.get('to', False) == gudang or not gudang):
			saldo += m.quantity_done
			masuk += m.quantity_done

	return {'saldo': saldo, 'masuk': masuk, 'keluar': keluar}

@frappe.whitelist()
def get_product_list(product_name):
	try:
		products = frappe.get_list("VetProduct", filters={'product_name': ['like', '%'+product_name+'%']}, fields=["name", 'product_name'])
			
		return products
		
	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()
def get_gudang_list(gudang_name):
	try:
		gudang_list = frappe.get_list("VetGudang", filters={'gudang_name': ['like', '%'+gudang_name+'%']}, fields=["name", 'gudang_name'])
			
		return gudang_list
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_mutasi_persediaan_list(filters=None, mode=False, all=False):
	default_sort = "creation desc"
	td_filters = []
	moves_filters = []
	operation_filters = [{'reference': ['not like', '%Retur%']}]
	gudang_or_filters = []
	# nilai_akhir_filters = []
	product_or_filters = []
	filter_json = False
	page = 1
	gudang = False
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
		
	if filter_json:
		# product = filter_json.get('product', False)
		sort = filter_json.get('sort', False)
		search = filter_json.get('search', False)
		gudang = filter_json.get('gudang', False)
		filters_json = filter_json.get('filters', False)
		stock_date = filter_json.get('stock_date', False)
		currentpage = filter_json.get('currentpage', False)
		
		if filters_json:
			for fj in filters_json:
				td_filters.append(fj)

		# if product:
		# 	td_filters.append({'product': product})
		# 	moves_filters.append({'product': product})

		if search:
			product_or_filters.append({'product_name': ['like', '%'+search+'%']})
			product_or_filters.append({'default_code': ['like', '%'+search+'%']})

		if sort:
			default_sort = sort

		if currentpage:
			page = currentpage

		if gudang:
			gudang_or_filters.append({'from': gudang})
			gudang_or_filters.append({'to': gudang})

		if stock_date:
			if mode == 'monthly' or mode == 'period':
				max_date_dt = dt.strptime(stock_date, '%Y-%m-%d') - rd(days=1)
			else:
				max_date_dt = dt.strptime(stock_date, '%Y-%m-%d')

			if mode == 'monthly':
				min_date = (max_date_dt).strftime('%Y-%m-01')
			else:
				min_date = max_date_dt.strftime('%Y-01-01')
			# td_filters.append({'date': ['between', [min_date, max_date_dt.strftime('%Y-%m-%d')]]})
			# moves_filters.append({'date': ['<', min_date]})
			# nilai_akhir_filters.append({'date': ['<', max_date_dt.strftime('%Y-%m-%d')]})
			td_filters.append({'receive_date': ['between', [min_date, max_date_dt.strftime('%Y-%m-%d')]]})
			moves_filters.append({'receive_date': ['<', min_date]})
			moves_filters.append({'receive_date': ['not in', [None, '']]})
			# nilai_akhir_filters.append({'receive_date': ['<', max_date_dt.strftime('%Y-%m-%d')]})
			# nilai_akhir_filters.append({'receive_date': ['not in', [None, '']]})
	
	try:
		if all:
			products = frappe.get_list("VetProduct", or_filters=product_or_filters, fields=['default_code', 'product_name', 'uom_name', 'name'], order_by=default_sort)
		else: 
			products = frappe.get_list("VetProduct", or_filters=product_or_filters, fields=['default_code', 'product_name', 'uom_name', 'name'], order_by=default_sort, start=(page - 1) * 10, page_length= 10)
		datalength = len(frappe.get_all("VetProduct", or_filters=product_or_filters, as_list=True))
		if gudang_or_filters or operation_filters:
			operation_names = frappe.get_list("VetOperation", or_filters=gudang_or_filters, filters=operation_filters)
			td_filters.append({'parent': ['in', list(map(lambda item: item['name'], operation_names))]})
			moves_filters.append({'parent': ['in', list(map(lambda item: item['name'], operation_names))]})
			# nilai_akhir_filters.append({'parent': ['in', list(map(lambda item: item['name'], operation_names))]})

		for p in products:
			td_product = next((i for i,d in enumerate(td_filters) if 'product' in d), False)
			if td_product:
				td_filters[td_product] = {'product': p.name}
			else:
				td_filters.append({'product': p.name})

			moves_product = next((i for i,d in enumerate(moves_filters) if 'product' in d), False)
			if moves_product:
				moves_filters[moves_product] = {'product': p.name}
			else:
				moves_filters.append({'product': p.name})

			# nilai_akhir_product  = next((i for i,d in enumerate(nilai_akhir_filters) if 'product' in d), False)
			# if nilai_akhir_product:
			# 	nilai_akhir_filters[nilai_akhir_product] = {'product': p.name}
			# else:
			# 	nilai_akhir_filters.append({'product': p.name})

			saldo_awal = {'saldo': 0, 'masuk': 0, 'keluar': 0}
			nilai_awal = 0
			nilai_akhir = 0
			# moves = frappe.get_list("VetOperationMove", filters=moves_filters, fields=["*"], order_by="date asc")
			moves = frappe.get_list("VetOperationMove", filters=moves_filters, fields=["*"], order_by="receive_date asc")
			if moves:
				saldo_awal = count_saldo_quantity(moves, gudang)
				nilai_awal = count_nilai_awal(moves, gudang)

			p['saldo_awal'] = saldo_awal['saldo']

			saldo_akhir = {'saldo': 0, 'masuk': 0, 'keluar': 0}
			# mutasi_persediaan = frappe.get_list("VetOperationMove", filters=td_filters, fields=['*'], order_by="date asc")
			# nilai_akhir_moves = frappe.get_list("VetOperationMove", filters=nilai_akhir_filters, fields=['*'], order_by="date asc")
			mutasi_persediaan = frappe.get_list("VetOperationMove", filters=td_filters, fields=['*'], order_by="receive_date asc")
			# nilai_akhir_moves = frappe.get_list("VetOperationMove", filters=nilai_akhir_filters, fields=['*'], order_by="receive_date asc")
			if mutasi_persediaan:
				saldo_akhir = count_saldo_quantity(mutasi_persediaan, gudang)
				nilai_akhir = count_nilai_awal(moves + mutasi_persediaan, gudang)

			p['saldo_akhir'] = saldo_akhir['saldo'] + saldo_awal['saldo']
			p['masuk'] = saldo_akhir['masuk']
			p['keluar'] = saldo_akhir['keluar']
			p['nilai_awal'] = nilai_awal
			p['nilai_akhir'] = nilai_akhir		
			
		return {'mutasi_persediaan': products, 'datalength': datalength}
		
	except PermissionError as e:
		return {'error': e}

def count_nilai_awal(moves, gudang):
	pembelian = []
	penjualan = 0
	nilai = 0
	for m in moves:
		operation = frappe.get_doc("VetOperation", m.parent)
		if 'PO' in operation.reference and 'POSORDER' not in operation.reference and ' ' not in operation.reference:
			purchase = frappe.get_value("VetPurchase", operation.reference, as_dict=1)
			if purchase:
				products_purchase = frappe.get_list("VetPurchaseProducts", filters={'parent': purchase.name, 'product': m.product}, fields=['quantity_receive', 'price'])
				for pp in products_purchase:
					if purchase.is_refund == 1:
						pembelian.append({'purchase': purchase.name, 'quantity': -pp.quantity_receive, 'price': pp.price})
					else:
						pembelian.append({'purchase': purchase.name, 'quantity': pp.quantity_receive, 'price': pp.price})
				continue

		if 'VCI' in operation.reference and ' ' not in operation.reference:
			invoice = frappe.get_value("VetCustomerInvoice", operation.reference, as_dict=1)
			if invoice:
				if invoice.is_refund == 1 or (operation.get('to', False) and (operation.get('to', False) == gudang or not gudang)):
					penjualan -= m.quantity_done
				else:
					penjualan += m.quantity_done
				continue
		elif 'POSORDER' in operation.reference and ' ' not in operation.reference:
			order = frappe.get_value("VetPosOrder", operation.reference, as_dict=1)
			if order:
				if order.is_refund == 1 or (operation.get('to', False) and (operation.get('to', False) == gudang or not gudang)):
					penjualan -= m.quantity_done
				else:
					penjualan += m.quantity_done
				continue

		if 'VAJ' in operation.reference and ' ' not in operation.reference:
			product_adjustment = frappe.get_list("VetAdjustmentInventoryDetails", filters={'parent': operation.reference, 'product': m.product}, fields=['diff_quantity', 'adjustment_value'])
			for pa in product_adjustment:
				if float(pa.diff_quantity) > 0:
					nilai += pa.adjustment_value
				elif float(pa.diff_quantity) < 0:
					nilai -= pa.adjustment_value
			continue

		if operation.get('to', False) and (operation.get('to', False) == gudang or not gudang):
			pembelian.append({'quantity': m.quantity_done, 'price': m.price})
			continue
		
		if operation.get('from', False) and (operation.get('from', False) == gudang or not gudang):
			penjualan += m.quantity_done
			continue


	nilai += sum(float(c['price']) * float(c['quantity']) for c in pembelian)

	for pe in pembelian:
		if penjualan > 0:
			temp_penjualan = penjualan
			penjualan -= (pe['quantity'] or 0)
			if penjualan < 0:
				nilai -= (temp_penjualan * (pe['price'] or 0))
			else:
				nilai -= (pe['quantity'] or 0) * (pe['price'] or 0)

	return nilai
		
@frappe.whitelist()
def decrease_product_valuation(product, quantity, warehouse=False, uom=False, reverse=False):
	adjustment_value = 0

	gudang = frappe.get_list("VetGudang", fields=["name"])
	default_warehouse = frappe.get_list('VetGudang', filters={'is_default': '1'}, fields=['name', 'gudang_name'], limit=1)

	if not warehouse:
		if default_warehouse:
			warehouse = default_warehouse[0].name
		else:
			warehouse = gudang[0].name
	
	product_uom = uom
	if not product_uom:
		product_uom = frappe.db.get_value('VetProduct', product, 'product_uom')
		
	purchase_with_stock_search = frappe.get_list('VetPurchaseProducts', filters={'product': product}, fields=['*'], order_by="creation asc")
	purchase_with_stock = list(p for p in purchase_with_stock_search if frappe.db.get_value('VetPurchase', p.parent, 'deliver_to') == warehouse and  p.quantity_stocked)
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
		'keterangan': operation.reference,
		'journal_items': jis
	}
	
	new_journal_entry(json.dumps(je_data))