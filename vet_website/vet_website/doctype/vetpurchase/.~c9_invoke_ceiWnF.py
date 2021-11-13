# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
from frappe.model.document import Document
from datetime import datetime as dt
from vet_website.vet_website.doctype.vetoperation.vetoperation import action_receive

class VetPurchase(Document):
	pass

@frappe.whitelist()
def get_purchase_order_list(filters=None):
	default_sort = "creation desc"
	po_filters = {}
	filter_json = False
	unpaid_mode = False
	product_detail_name = False
	
	print(filters)
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
	
	print(filter_json)
		
	if filter_json:
		search = filter_json.get('search', False)
		sort = filter_json.get('sort', False)
		min_date = filter_json.get('min_date', False)
		max_date = filter_json.get('max_date', False)
		product = filter_json.get('product', False)
		supplier = filter_json.get('supplier', False)
		unpaid = filter_json.get('unpaid', 0)
		
		if search:
			suppliers = frappe.get_list("VetSupplier", filters={'supplier_name': ['like', '%'+search+'%']}, fields=['name'])
			
			names = []
			for supplier in suppliers:
				names.append(supplier.name)
				
			po_filters.update({'supplier': ['in', names]})
		if sort:
			default_sort = sort
		
		if product:
			purchaseproduct = frappe.get_list("VetPurchaseProducts", filters={'product': product}, fields=["parent"])
			purchase_name_map = map(lambda x: x.parent, purchaseproduct)
			po_filters.update({'name': ['in', list(purchase_name_map)]})
			product_detail_name = product
			
		if supplier:
			po_filters.update({'supplier': supplier})
			
		if min_date:
			po_filters.update({'order_date': ['>=', min_date]})
		if max_date:
			po_filters.update({'order_date': ['<=', max_date]})
		if min_date and max_date:
			po_filters.update({'order_date': ['between', [min_date, max_date]]})
			
		if unpaid == 1:
			unpaid_mode = True
	
	try:
		purchase_search = frappe.get_list("VetPurchase", filters=po_filters, fields=["*"], order_by=default_sort)
		purchase = []
		
		for i,p in enumerate(purchase_search):
			untaxed = 0
			total = 0
			supplier = frappe.get_list("VetSupplier", filters={'name': p.supplier}, fields=["supplier_name"])
			p['supplier'] = supplier[0]['supplier_name']
			
			purchase_products = frappe.get_list("VetPurchaseProducts", filters={'parent': p.name}, fields=["*"])
			payments = frappe.get_list("VetPurchasePay", filters={'parent': p.name}, fields=["*"])
			for pp in purchase_products:
				product = frappe.get_list("VetProduct", filters={'name': pp.product}, fields=["price"])
				
				untaxed += product[0]['price'] * pp.quantity
				total += pp.price * pp.quantity
				
			p['untaxed'] = untaxed
			p['total'] = total
			p['paid'] = sum(py.jumlah for py in payments)
			
			if product_detail_name:
				purchase_line = list(pp for pp in purchase_products if pp.product == product_detail_name)
				p['purchase_product'] = purchase_line[0]
			
			if unpaid_mode:
				paid = sum(pay.jumlah for pay in payments) or 0
				subtotal = sum(pp.quantity*pp.price for pp in purchase_products) or 0
				if paid < subtotal:
					purchase.append(p)
			else:
				purchase.append(p)
			
		return purchase
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def delete_purchase(data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal menghapus purchase"}
	
	for d in data_json:
		frappe.delete_doc('VetPurchase', d)
		frappe.db.commit()
		
	return {'success': True}
	
@frappe.whitelist()
def cancel_purchase(name):
	try:
		purchase = frappe.get_doc('VetPurchase', name)
		purchase.status = 'Cancel'
		purchase.save()
	except:
		return {'error': "Gagal menemukan purchase"}
		
	return {'success': True}
	
@frappe.whitelist()
def get_last_product_details(name):
	try:
		last_product = frappe.get_list("VetPurchaseProducts", filters={'product': name}, fields=["*"], order_by="creation desc")
		
		if last_product :
			product = last_product[0]
		
			res = {
				'product': product['product_name'],
				'uom': product['uom_name'],
				'price': product['price']
			}
		else :
			product = frappe.get_doc('VetProduct', name)
			res = {
				'product': product.product_name,
				'uom': product.uom_name
			}
		
		return res
	except:
		return {'error': "Gagal menemukan"}
	
	
@frappe.whitelist()
def get_purchase(name=None):
	try:
		if name != None :
			list_product = []
			purchase_search = frappe.get_list("VetPurchase", filters={'name': name}, fields=["*"])
			purchase = purchase_search[0]
			
			supplier = frappe.get_list('VetSupplier', filters={'name': purchase.supplier}, fields=['supplier_name'])
			gudang = frappe.get_list('VetGudang', filters={'name': purchase.deliver_to}, fields=['gudang_name'])
			purchase['supplier_name'] = supplier[0]['supplier_name']
			purchase['gudang_name'] = gudang[0]['gudang_name']
			
			purchase_products = frappe.get_list("VetPurchaseProducts", filters={'parent': name}, fields=["*"])
			for p in purchase_products:
				product = frappe.get_doc('VetProduct', p.product)
				uom = frappe.get_doc('VetUOM', p.uom)
				p['product'] = product.product_name
				p['product_id'] = product.name
				p['uom'] = uom.uom_name
				
			purchase['products'] = purchase_products
			
			purchase_pay = frappe.get_list("VetPurchasePay", filters={'parent': name}, fields=['*'], order_by="creation asc")
			purchase['pembayaran'] = purchase_pay
		else:
			purchase = {'products': [], 'pembayaran': []}
		    
		gudangAll = frappe.get_list('VetGudang', fields=['*'])
		supplierAll = frappe.get_list('VetSupplier', fields=['*'])
		productAll = frappe.get_list('VetProduct', fields=['*'])
		uomAll = frappe.get_list('VetUOM', fields=['*'])
		
		res = {'purchase_order': purchase, 'gudang': gudangAll, 'supplier': supplierAll, 'productAll': productAll, 'uomAll': uomAll}
		    
		return res
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def confirm_purchase(data):
	try:
		data_json = json.loads(data)
		
		print('data_json ' + str(data_json))
		
		if data_json.get('name') :
			purchase = frappe.get_doc("VetPurchase", data_json['name'])
			operation = frappe.get_doc("VetOperation", {'reference': data_json['name']})
			
			purchase_data = {}
			purchase_data.update(data_json)
			purchase_data.pop('name')
			purchase_data.pop('products')
			purchase_data.pop('pembayaran')
			purchase.update(purchase_data)
			if purchase.status == 'RFQ':
				check_purchase_journal()
				create_purchase_journal_entry(purchase.name)
				purchase.update({'status': 'Purchase Order'})
				operation.status =  'Delivery'
				
			purchase.save()
			operation.save()
			
			i = 0
			for p in data_json['products']:
				if p.get('name') != None:
					if p.get('delete',False):
						product_name = frappe.db.get_value('VetPurchaseProducts', p.get('name'), 'product')
						move_search = frappe.get_list('VetOperationMove', filters={'parent': operation.name, 'product': product_name}, fields=['name'])
						frappe.delete_doc('VetPurchaseProducts', p.get('name'))
						frappe.delete_doc('VetOperationMove', move_search[0].name)
					else:
						product = frappe.get_doc('VetPurchaseProducts', p.get('name'))
						product.reload()
						product_data = {}
						product_data.update(p)
						product.update(product_data)
						product.save()
						
						move_search = frappe.get_list('VetOperationMove', filters={'parent': operation.name, 'product': p['product']}, fields=['name'])
						move = frappe.get_doc('VetOperationMove', move_search[0]['name'])
						move.update({
							'product': p['product'],
							'product_uom': p['uom'],
							'quantity': p['quantity'],
						})
						move.save()
				else :
					product_data = {}
					product_data.update(p)
					product_data.update({'parent': purchase.name, 'parenttype': 'VetPurchase', 'parentfield': 'products'})
					
					product = frappe.new_doc('VetPurchaseProducts')
					product.update(product_data)
					product.insert()
					# purchase.products.append(product)
					# purchase.save()
					
					new_move = frappe.new_doc("VetOperationMove")
					new_move.update({
						'parent': operation.name,
						'parenttype': 'VetOperation',
						'parentfield': 'moves',
						'product': p['product'],
						'product_uom': p['uom'],
						'quantity': p['quantity'],
					})
					
					new_move.insert()
					# operation.moves.append(new_move)
					# operation.save()
					
				product_supplier_search = frappe.get_list('VetProductSuppliers', filters={'supplier': data_json.get('supplier'), 'parent': p.get('product')}, fields=['name'])
				if len(product_supplier_search) != 0:
					product_supplier = frappe.get_doc('VetProductSuppliers', product_supplier_search[0].name)
					product_supplier.purchase_price = p.get('price')
					product_supplier.min_quantity = 1
					product_supplier.save()
				else:
					product_supplier = frappe.new_doc('VetProductSuppliers')
					product_supplier.update({
						'supplier':  data_json.get('supplier'),
						'min_quantity': 1,
						'purchase_price': p.get('price'),
						'parent': p.get('product'),
						'parenttype': 'VetProduct',
						'parentfield': 'suppliers',
					})
					product_supplier.insert()
					
					i += 1
		else :
			purchase = frappe.new_doc("VetPurchase")
			purchase_data = {}
			purchase_data.update(data_json)
			purchase_data.pop('products')
			purchase_data.pop('pembayaran')
			purchase.update(purchase_data)
			purchase.insert()
			
			operation = frappe.new_doc("VetOperation")
			operation.update({
				'reference': purchase.name,
				'to': purchase.deliver_to,
			})
			operation.insert()
			
			for p in data_json['products']:
				product_data = {}
				product_data.update(p)
				product_data.update({'parent': purchase.name, 'parenttype': 'VetPurchase', 'parentfield': 'products'})

				new_product = frappe.new_doc("VetPurchaseProducts")
				new_product.update(product_data)

				purchase.products.append(new_product)

				purchase.save()

				new_move = frappe.new_doc("VetOperationMove")
				new_move.update({
					'parent': operation.name,
					'parenttype': 'VetOperation',
					'parentfield': 'moves',
					'product': p['product'],
					'product_uom': p['uom'],
					'quantity': p['quantity'],
				})

				operation.moves.append(new_move)
				operation.save()
				
		return {'purchase': purchase}

	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def submit_pembayaran(data):
	try:
		data_json = json.loads(data)
		
		if data_json.get('jumlah') :
			purchase = frappe.get_doc('VetPurchase', data_json.get('name'))
			pp_data = {}
			pp_data.update({'parent': purchase.name, 'parenttype': 'VetPurchase', 'parentfield': 'pembayaran'})
			
			tanggal = dt.strftime(dt.now(), "%Y-%m-%d")
			
			pay = frappe.new_doc("VetPurchasePay")
			pay.jumlah = data_json.get('jumlah')
			pay.tanggal = tanggal
			pay.update(pp_data)
			pay.insert()
			
			frappe.db.commit()
			
			purchase.pembayaran.append(pay)
			if purchase.status == 'Receive' and check_paid_purchase(purchase.name):
				purchase.status = 'Paid'
			purchase.save()
			frappe.db.commit()
			
			create_purchase_payment_journal_items(pay.name, data_json.get('jumlah'))
				
		return True

	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def receive_purchase(name, products):
	try:
		purchase = frappe.get_doc('VetPurchase', name)
		payments = frappe.get_list('VetPurchasePay', filters={'parent': purchase.name}, fields=['*'])
		
		if all(t['quantity'] == t['quantity_receive'] for t in json.loads(products)):
			purchase.status = 'Receive'
		
		if check_paid_purchase(name):
			purchase.status = 'Paid'	
			
		purchase.save()
		
		for p in json.loads(products):
			product_purchase = frappe.get_doc('VetPurchaseProducts', p.get('name'))
			product_purchase.quantity_receive = p.get('quantity_receive')
			product_purchase.quantity_stocked = p.get('quantity_receive')
			product_purchase.save()
			
			
		purchase.reload()
		operation = frappe.get_doc('VetOperation', {'reference': purchase.name})
		moves = frappe.get_list('VetOperationMove', filters={'parent': operation.name}, fields=['name', 'product', 'product_uom', 'quantity', 'quantity_done'])
		for m in moves:
			purchase_product = next((p for p in purchase.products if p.product == m.product), False)
			if purchase_product:
				m.quantity_done = purchase_product.quantity_receive
		
		action_receive(operation.name, json.dumps(moves))
				
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
	
	
def check_product_account(product_name):
	product = frappe.get_doc('VetProduct', product_name)
	product_category = frappe.get_doc('VetProductCategory', product.product_category)
	if product_category.stock_input_account and product_category.stock_output_account:
		return True
	else:
		return False
		
def check_purchase_journal():
	purchase_journal = frappe.db.get_value('VetJournal', {'journal_name': 'Purchase Journal', 'type': 'Purchase'}, 'name')
	if not purchase_journal:
		frappe.msgprint('Journal "Purchase Journal" tidak ada')
		return False
	else:
		purchase_journal_debit = frappe.db.get_value('VetJournal', {'journal_name': 'Purchase Journal', 'type': 'Purchase'}, 'default_debit_account')
		purchase_journal_credit = frappe.db.get_value('VetJournal', {'journal_name': 'Purchase Journal', 'type': 'Purchase'}, 'default_credit_account')
		if not all([purchase_journal_credit, purchase_journal_debit]):
			frappe.msgprint('Purchase Journal tidak memiliki debit account & credit account')
			return False
			
			
def create_purchase_journal_entry(purchase_name):
	purchase = frappe.get_doc('VetPurchase', purchase_name)
	purchase_journal = frappe.db.get_value('VetJournal', {'journal_name': 'Purchase Journal', 'type': 'Purchase'}, 'name')
	purchase_journal_debit = frappe.db.get_value('VetJournal', {'journal_name': 'Purchase Journal', 'type': 'Purchase'}, 'default_debit_account')
	purchase_journal_credit = frappe.db.get_value('VetJournal', {'journal_name': 'Purchase Journal', 'type': 'Purchase'}, 'default_credit_account')
	purchase_products = frappe.get_list('VetPurchaseProducts', filters={'parent': purchase.name}, fields=['*'])
	jis = []
	total = 0
	for pp in purchase_products:
		product = frappe.get_doc('VetProduct', pp.product)
		product_category = frappe.get_doc('VetProductCategory', product.product_category)
		amount = pp.quantity * pp.price
		total += amount
		journal_item_data = {
			'account': product_category.stock_input_account,
			'debit': amount,
			'credit': 0,
		}
		jis.append(journal_item_data)
		
	jis.append({
		'account': purchase_journal_credit,
		'debit': 0,
		'credit': total,
	})
	
	je_data = {
		'journal': purchase_journal,
		'period': dt.now().strftime('%m/%Y'),
		'date': dt.now().date(),
		'reference': purchase.name,
		'status': 'Posted',
		'journal_items': jis
	}
	
	new_je = frappe.new_doc('VetJournalEntry')
	new_je.update(je_data)
	new_je.insert()
	
def create_purchase_payment_journal_items(payment_name, amount):
	#create payment choose payment journal
	purchase_journal = frappe.db.get_value('VetJournal', {'journal_name': 'Purchase Journal', 'type': 'Purchase'}, 'name')
	debit_account = frappe.db.get_value('VetCoa', {'account_code': '2-11001'}, 'name')
	credit_account = frappe.db.get_value('VetCoa', {'account_code': '1-11102'}, 'name')
	jis = [
		{
			'account': debit_account,
			'debit': amount,
			'credit': 0,
		},{
			'account': credit_account,
			'credit': amount,
			'debit': 0,
		}
	]
	
	je_data = {
		'journal': purchase_journal,
		'period': dt.now().strftime('%m/%Y'),
		'date': dt.now().date(),
		'reference': payment_name,
		'status': 'Posted',
		'journal_items': jis
	}
	
	new_je = frappe.new_doc('VetJournalEntry')
	new_je.update(je_data)
	new_je.insert()
	frappe.db.commit()