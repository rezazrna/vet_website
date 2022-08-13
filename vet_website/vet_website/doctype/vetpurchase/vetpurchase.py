# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
import pytz
from frappe.model.document import Document
from datetime import datetime as dt
from vet_website.vet_website.doctype.vetoperation.vetoperation import action_receive
from vet_website.vet_website.doctype.vetjournalentry.vetjournalentry import new_journal_entry
from vet_website.vet_website.doctype.vetpetowner.vetpetowner import set_owner_credit_total

class VetPurchase(Document):
	pass
@frappe.whitelist()
def get_purchase_order_list(filters=None):
	default_sort = "creation desc"
	po_filters = []
	po_or_filters = []
	filter_json = False
	unpaid_mode = False
	product_detail_name = False
	sort_filter = False
	sort_filter_reverse = False
	odd_filters = []
	page = 1
	
	def process_odd_filter(fj):
		f = fj
		if f[1] == "=":
			f[1] = "=="
		f[0] = "a.%s"%f[0]
		string = " ".join(f)
		return lambda a: eval(string)
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
		
	if filter_json:
		sort = filter_json.get('sort', False)
		product = filter_json.get('product', False)
		supplier = filter_json.get('supplier', False)
		unpaid = filter_json.get('unpaid', 0)
		filters_json = filter_json.get('filters', False)
		currentpage = filter_json.get('currentpage', False)
		search = filter_json.get('search', False)

		if currentpage:
			page = currentpage
		
		if filters_json:
			for fj in filters_json:
				if fj[0] not in ['paid', 'total']:
					po_filters.append(fj)
				else:
					odd_filters.append(fj)

		if search:
			po_or_filters.append({'name': ['like', '%'+search+'%']})
			po_or_filters.append({'supplier_name': ['like', '%'+search+'%']})
			po_or_filters.append({'status': ['like', '%'+search+'%']})
		
		if supplier:
			po_filters.append({'supplier': supplier})
		
		if sort:
			sorts = sort.split(',')
			for i,s in enumerate(sorts):
				if 'total' in s:
					sorts.pop(i)
					sort_filter = lambda o: o['total']
					s_words = s.split(' ')
					if s_words[1] == 'desc':
						sort_filter_reverse = True
			default_sort = ','.join(sorts)
		
		if product:
			purchaseproduct = frappe.get_list("VetPurchaseProducts", filters={'product': product}, fields=["parent"])
			purchase_name_map = map(lambda x: x.parent, purchaseproduct)
			po_filters.append({'name': ['in', list(purchase_name_map)]})
			product_detail_name = product
			
		if unpaid == 1:
			unpaid_mode = True
	
	try:
		purchase_search = frappe.get_list("VetPurchase", or_filters=po_or_filters, filters=po_filters, fields=["*"], order_by=default_sort, start=(page - 1) * 10, page_length= 10)
		purchase = []
		datalength = len(frappe.get_all("VetPurchase", or_filters=po_or_filters, filters=po_filters, as_list=True))
		
		for i,p in enumerate(purchase_search):
			untaxed = 0
			total = 0
			supplier = frappe.get_list("VetSupplier", filters={'name': p.supplier}, fields=["supplier_name"])
			if len(supplier) > 0:
				p['supplier'] = supplier[0]['supplier_name']
			else:
				p['supplier'] = ''
			
			purchase_products = frappe.get_list("VetPurchaseProducts", filters={'parent': p.name}, fields=["*"])
			payments = frappe.get_list("VetPurchasePay", filters={'parent': p.name}, fields=["*"])
			for pp in purchase_products:
				# product = frappe.get_list("VetProduct", filters={'name': pp.product}, fields=["price"])
				product_price = frappe.db.get_value("VetProduct", pp.product, 'price') or 0
				
				untaxed += product_price * pp.quantity
				total += pp.price * pp.quantity - ((pp.discount or 0) / 100 * (pp.price * pp.quantity))
				
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
				
		if sort_filter != False:
			purchase.sort(key=sort_filter, reverse=sort_filter_reverse)
		for fj in odd_filters:
			result_filter = process_odd_filter(fj)
			purchase = filter(result_filter, purchase)
			
		return {'purchase': purchase, 'datalength': datalength}
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_name_list(filters=None):
	po_filters = []
	po_or_filters = []
	filter_json = False
	unpaid_mode = False
	product_detail_name = False
	sort_filter = False
	sort_filter_reverse = False
	odd_filters = []
	
	def process_odd_filter(fj):
		f = fj
		if f[1] == "=":
			f[1] = "=="
		f[0] = "a.%s"%f[0]
		string = " ".join(f)
		return lambda a: eval(string)
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
		
	if filter_json:
		product = filter_json.get('product', False)
		supplier = filter_json.get('supplier', False)
		unpaid = filter_json.get('unpaid', 0)
		filters_json = filter_json.get('filters', False)
		search = filter_json.get('search', False)
		
		if filters_json:
			for fj in filters_json:
				if fj[0] not in ['paid', 'total']:
					po_filters.append(fj)
				else:
					odd_filters.append(fj)
		
		if supplier:
			po_filters.append({'supplier': supplier})
		
		if product:
			purchaseproduct = frappe.get_list("VetPurchaseProducts", filters={'product': product}, fields=["parent"])
			purchase_name_map = map(lambda x: x.parent, purchaseproduct)
			po_filters.append({'name': ['in', list(purchase_name_map)]})
			product_detail_name = product

		if search:
			po_or_filters.append({'name': ['like', '%'+search+'%']})
			po_or_filters.append({'supplier_name': ['like', '%'+search+'%']})
			po_or_filters.append({'status': ['like', '%'+search+'%']})
			
		if unpaid == 1:
			unpaid_mode = True
	
	try:
		namelist = frappe.get_all("VetPurchase", or_filters=po_or_filters, filters=po_filters, as_list=True)
			
		return list(map(lambda item: item[0], namelist))
		
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
		# create_purchase_journal_entry(purchase.name, True)
		purchase.reload()
		# owner_credit = frappe.new_doc('VetOwnerCredit')
		# owner_credit.update({
		# 	'date': dt.strftime(dt.now(), "%Y-%m-%d %H:%M:%S"),
		# 	'purchase': purchase.name,
		# 	'type': 'Cancel',
		# 	'nominal': sum((i.quantity * i.price) for i in purchase.products)
		# })
		# owner_credit.insert()
		# frappe.db.commit()
		# set_owner_credit_total(purchase.supplier, True)
		operation = frappe.get_list("VetOperation", filters={'reference': name}, fields=['name'])
		if len(operation) > 0:
			frappe.delete_doc('VetOperation', operation[0].name)
	except:
		return {'error': "Gagal menemukan purchase"}
		
	return {'success': True}
	
@frappe.whitelist()
def get_last_product_details(name):
	try:
		last_product = frappe.get_list("VetPurchaseProducts", filters={'product': name}, fields=["*"], order_by="creation desc")
		
		if last_product :
			product = last_product[0]
			current_product = frappe.get_doc('VetProduct', name)
		
			res = {
				'product': current_product.product_name,
				'uom': product['uom_name'],
				'price': product['price'] or 0
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
			deliver_to = frappe.get_list('VetGudang', filters={'name': purchase.deliver_to}, fields=['gudang_name'])
			deliver_from = frappe.get_list('VetGudang', filters={'name': purchase.deliver_from}, fields=['gudang_name'])
			if len(supplier) > 0:
				purchase['supplier_name'] = supplier[0]['supplier_name']
			else:
				purchase['supplier_name'] = ''
			if deliver_to:
				purchase['deliver_to_name'] = deliver_to[0]['gudang_name']
			if deliver_from:
				purchase['deliver_from_name'] = deliver_from[0]['gudang_name']
			
			purchase_products = frappe.get_list("VetPurchaseProducts", filters={'parent': name}, fields=["*"], order_by="creation asc")
			for p in purchase_products:
				product = frappe.get_doc('VetProduct', p.product)
				uom = frappe.get_doc('VetUOM', p.uom)
				p['product'] = product.product_name
				p['product_id'] = product.name
				p['uom'] = uom.uom_name
				
			purchase['products'] = purchase_products
			
			purchase_pay = frappe.get_list("VetPurchasePay", filters={'parent': name}, fields=['*'], order_by="creation asc")
			purchase['pembayaran'] = purchase_pay
			
			credit = 0
			last_credit = frappe.get_list("VetOwnerCredit", fields=["credit"], filters={'supplier': purchase.supplier}, order_by="creation desc")
			if last_credit:
				credit = last_credit[0]['credit']
			purchase['total_credit'] = credit
			purchase['total_true_credit'] = get_supplier_true_credit(purchase.supplier)
			
			user_name = frappe.db.get_value('User', purchase.owner, 'full_name')
			purchase['user_name'] = user_name
			
		else:
			user_name = frappe.db.get_value('User', frappe.db.user, 'full_name')
			purchase = {'products': [], 'pembayaran': [], 'user_name': user_name}
			
		    
		# gudangAll = frappe.get_list('VetGudang', fields=['*'])
		# supplierAll = frappe.get_list('VetSupplier', fields=['*'])
		# category = frappe.get_list('VetProductCategory', filters={'stockable': True}, fields=['name'])
		# productAll = frappe.get_list('VetProduct', filters={'product_category': ['in', [i.name for i in category]]}, fields=['*'])
		# uomAll = frappe.get_list('VetUOM', fields=['*'])
		# payment_method = frappe.get_list('VetPaymentMethod', fields=['*'])
		
		gudangAll = []
		supplierAll = []
		category = []
		productAll = []
		uomAll = []
		payment_method = []
		
		res = {'purchase_order': purchase, 'gudang': gudangAll, 'supplier': supplierAll, 'productAll': productAll, 'uomAll': uomAll, 'payment_method_list': payment_method}
		    
		return res
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_purchase_after_loading():
	try:	
		    
		gudangAll = frappe.get_list('VetGudang', fields=['*'])
		supplierAll = frappe.get_list('VetSupplier', fields=['*'])
		category = frappe.get_list('VetProductCategory', filters={'stockable': True}, fields=['name'])
		productAll = frappe.get_list('VetProduct', filters={'product_category': ['in', [i.name for i in category]]}, fields=['*'])
		uomAll = frappe.get_list('VetUOM', fields=['*'])
		payment_method = frappe.get_list('VetPaymentMethod', fields=['*'])
		
		res = {'gudang': gudangAll, 'supplier': supplierAll, 'productAll': productAll, 'uomAll': uomAll, 'payment_method_list': payment_method}
		    
		return res
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def confirm_purchase(data, saveOnly=False):
	try:
		data_json = json.loads(data)
		
		if data_json.get('name') :
			purchase = frappe.get_doc("VetPurchase", data_json['name'])
			operation = frappe.get_doc("VetOperation", {'reference': data_json['name']})
			
			purchase_data = {}
			purchase_data.update(data_json)
			purchase_data.pop('name')
			purchase_data.pop('products')
			purchase_data.pop('pembayaran')
			purchase.update(purchase_data)
			if purchase.status == 'RFQ' and not saveOnly:
				if not all(check_product_account(p.get('product')) for p in data_json['products']):
					frappe.msgprint('Tidak Bisa membuat purchase karena kategori barang belum memiliki Stock Input Account dan Stock Output Account')
					return False
				check_purchase_journal()
				purchase.update({'status': 'Purchase Order'})
				operation.status =  'Delivery'
				
			purchase.save()
			operation.save()
			
			i = 0
			for p in data_json['products']:
				if p.get('name') != None:
					if p.get('delete',False):
						product_name = frappe.db.get_value('VetPurchaseProducts', p.get('name'), 'product')
						frappe.delete_doc('VetPurchaseProducts', p.get('name'))
						# move_search = frappe.get_list('VetOperationMove', filters={'parent': operation.name, 'product': product_name}, fields=['name'])
						# frappe.delete_doc('VetOperationMove', move_search[0].name)
					else:
						product = frappe.get_doc('VetPurchaseProducts', p.get('name'))
						product.reload()
						product_data = {}
						product_data.update(p)
						product.update(product_data)
						product.save()
						
						# move_search = frappe.get_list('VetOperationMove', filters={'parent': operation.name, 'product': p['product']}, fields=['name'])
						# move = frappe.get_doc('VetOperationMove', move_search[0]['name'])
						# move.update({
						# 	'product': p['product'],
						# 	'product_uom': p['uom'],
						# 	'quantity': p['quantity'],
						# })
						# move.save()
				else :
					product_data = {}
					product_data.update(p)
					product_data.update({'parent': purchase.name, 'parenttype': 'VetPurchase', 'parentfield': 'products'})
					
					product = frappe.new_doc('VetPurchaseProducts')
					product.update(product_data)
					product.insert()
					# purchase.products.append(product)
					# purchase.save()
					
					# new_move = frappe.new_doc("VetOperationMove")
					# new_move.update({
					# 	'parent': operation.name,
					# 	'parenttype': 'VetOperation',
					# 	'parentfield': 'moves',
					# 	'product': p['product'],
					# 	'product_uom': p['uom'],
					# 	'quantity': p['quantity'],
					# 	'date': purchase.order_date,
					# })
					
					# new_move.insert()
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
			
			purchase.reload()
			moves = []	
			for p in purchase.products:
				moves.append({
					'parent': operation.name,
					'parenttype': 'VetOperation',
					'parentfield': 'moves',
					'product': p.product,
					'product_uom': p.uom,
					'quantity': p.quantity,
					'date': purchase.order_date,
				})
			operation.update({'moves': moves})
			operation.save()
			
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
				'date': purchase.order_date,
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
					'date': purchase.order_date,
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
			
			subtotal = sum(p.quantity * p.price - ((p.discount or 0) / 100 * (p.quantity * p.price)) for p in purchase.products)
			paid = sum(int(p.jumlah) for p in purchase.pembayaran)
			remaining = (subtotal - purchase.potongan)- paid
			
			pp_data = {}
			pp_data.update({'parent': purchase.name, 'parenttype': 'VetPurchase', 'parentfield': 'pembayaran'})
			
			# tanggal = dt.strftime(dt.now(), "%Y-%m-%d")
			
			value = data_json.get('jumlah')
			if 'Deposit' in data_json.get('payment_method'):
				value = data_json.get('jumlah') if remaining >= data_json.get('jumlah') else remaining

			pay = frappe.new_doc("VetPurchasePay")
			pay.jumlah = value
			pay.tanggal = data_json.get('tanggal')
			pay.metode_pembayaran = data_json.get('payment_method')
			pay.update(pp_data)
			pay.insert()
			
			frappe.db.commit()
			
			purchase.pembayaran.append(pay)
			if purchase.status == 'Receive' and check_paid_purchase(purchase.name):
				purchase.status = 'Done'
			elif check_paid_purchase(purchase.name):
				purchase.status = 'Paid'
				
			purchase.save()
			frappe.db.commit()
			
			create_purchase_payment_journal_items(purchase.name, value, False, data_json.get('deposit', 0), data_json.get('payment_method'), dt.strptime(pay.tanggal, '%Y-%m-%d'))
			purchase.reload()
			
			if not data_json.get('from_owner_credit'):
				owner_credit = frappe.new_doc('VetOwnerCredit')
				owner_credit.update({
					'date': dt.strftime(dt.strptime(pay.tanggal, '%Y-%m-%d'), "%Y-%m-%d %H:%M:%S"),
					'purchase': purchase.name,
					'type': 'Payment',
					'nominal': pay.jumlah,
					'metode_pembayaran': data_json.get('payment_method')
				})
				owner_credit.insert()
				frappe.db.commit()
				set_owner_credit_total(purchase.supplier, True)
				
		return True

	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def submit_refund(data):
	try:
		tz = pytz.timezone("Asia/Jakarta")
		data_json = json.loads(data)
		
		if data_json.get('refund') :
			purchase = frappe.get_doc('VetPurchase', data_json.get('name'))
			operation = frappe.get_doc('VetOperation', {'reference': purchase.name})
			
			for t in data_json.get('products'):
				if t.get('is_delete', False):
					product_name = frappe.db.get_value('VetPurchaseProducts', t.get('name'), 'product')
					move_search = frappe.get_list('VetOperationMove', filters={'parent': operation.name, 'product': product_name}, fields=['name'])
					frappe.delete_doc('VetPurchaseProducts', t.get('name'))
					frappe.delete_doc('VetOperationMove', move_search[0].name)
				else:
					product = frappe.get_doc('VetPurchaseProducts', t.get('name'))
					product.quantity = t.get('quantity')
					product.save()
					frappe.db.commit()
					
					move_search = frappe.get_list('VetOperationMove', filters={'parent': operation.name, 'product': product.product}, fields=['name'])
					move = frappe.get_doc('VetOperationMove', move_search[0]['name'])
					move.update({
						'quantity': t.get('quantity'),
					})
					move.save()
					frappe.db.commit()
			
			purchase.reload()
			operation.reload()
			pay = frappe.new_doc("VetPurchasePay")
			pay.update({
				'jumlah': data_json.get('refund'),
				'tanggal': dt.strftime(dt.now(tz), "%Y-%m-%d"),
				'metode_pembayaran': data_json.get('metode_pembayaran'),
				'parent': purchase.name,
				'parenttype': 'VetPurchase',
				'parentfield': 'pembayaran'
			})
			pay.insert()
			purchase.pembayaran.append(pay)
			purchase.save()
			frappe.db.commit()
			
			create_purchase_payment_journal_items(purchase.name, data_json.get('refund'), True, 0, data_json.get('payment_method'), dt.strptime(pay.tanggal, '%Y-%m-%d'))
			
			if check_paid_purchase(purchase.name):
				purchase.status = 'Refund'
				purchase.save()
				
				for p in purchase.products:
					product_purchase = frappe.get_doc('VetPurchaseProducts', p.get('name'))
					product_purchase.quantity_receive = p.quantity
					product_purchase.save()
					
				purchase.reload()
				operation.reload()
				moves = frappe.get_list('VetOperationMove', filters={'parent': operation.name}, fields=['name', 'product', 'product_uom', 'quantity', 'quantity_done'])
				for m in moves:
					purchase_product = next((p for p in purchase.products if p.product == m.product), False)
					if purchase_product:
						m.quantity_done = purchase_product.quantity_receive
				
				action_receive(operation.name, json.dumps(moves))
				
			purchase.reload()
			owner_credit = frappe.new_doc('VetOwnerCredit')
			owner_credit.update({
				'date': dt.strftime(dt.now(tz), "%Y-%m-%d %H:%M:%S"),
				'purchase': purchase.name,
				'type': 'Refund',
				'nominal': pay.jumlah,
				'metode_pembayaran': data_json.get('payment_method')
			})
			owner_credit.insert()
			frappe.db.commit()
			set_owner_credit_total(purchase.supplier, True)
				
		return {'purchase': purchase}

	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def refund_purchase(name):
	try:
		tz = pytz.timezone("Asia/Jakarta")
		old_purchase = frappe.get_doc('VetPurchase', name)
		old_purchase.already_refund = True
		old_purchase.save()
		purchase = frappe.new_doc('VetPurchase')
		purchase.update({
			'refund_date': dt.now(tz).date().strftime('%Y-%m-%d'),
			'supplier': old_purchase.supplier,
			'deliver_from': old_purchase.deliver_to,
			'status': 'Draft',
			'products': old_purchase.products,
			'is_refund': True
		})
		purchase.insert()
		frappe.db.commit()
		
		operation = frappe.new_doc("VetOperation")
		operation.update({
			'reference': purchase.name,
			'from': purchase.deliver_from,
			'date': purchase.refund_date,
			'status': 'Delivery'
		})
		operation.insert()
		
		for p in purchase.products:
			new_move = frappe.new_doc("VetOperationMove")
			new_move.update({
				'parent': operation.name,
				'parenttype': 'VetOperation',
				'parentfield': 'moves',
				'product': p.product,
				'product_uom': p.uom,
				'quantity': p.quantity,
				'date': purchase.refund_date,
			})

			operation.moves.append(new_move)
			operation.save()
				
		return {'purchase': purchase}

	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()
def retur_purchase(name, products, jumlah=False, payment_method=False):
	print('########## Retur Purchase ##########')
	try:
		tz = pytz.timezone("Asia/Jakarta")
		purchase = frappe.get_doc('VetPurchase', name)
		operation = frappe.get_doc("VetOperation", {'reference': name})

		create_purchase_journal_entry(purchase.name, False, json.loads(products), True)
		
		for p in json.loads(products):
			product_purchase = frappe.get_doc('VetPurchaseProducts', p.get('name'))
			product_purchase.quantity -= p.get('quantity_retur')
			product_purchase.quantity_receive -= p.get('quantity_retur')
			product_purchase.quantity_stocked -= p.get('quantity_retur')
			product_purchase.save()
			
			move_search = frappe.get_list('VetOperationMove', filters={'parent': operation.name, 'product': product_purchase.product}, fields=['name'])
			move = frappe.get_doc('VetOperationMove', move_search[0]['name'])
			move.update({
				'quantity': p.get('quantity') - p.get('quantity_retur'),
			})
			move.save()

		purchase.reload()
		if all(t.quantity == t.quantity_receive for t in purchase.products):
			purchase.status = 'Receive'
		
		if check_paid_purchase(name):
			purchase.status = 'Paid'
			
		if all(t.quantity == t.quantity_receive for t in purchase.products) and check_paid_purchase(name):
			purchase.status = 'Done'
			
		purchase.save()
		
		purchase.reload()
		operation.reload()

		moves = frappe.get_list('VetOperationMove', filters={'parent': operation.name}, fields=['name', 'product', 'product_uom', 'quantity', 'quantity_done'])
		for m in moves:
			purchase_product = next((p for p in purchase.products if p.product == m.product), False)
			if purchase_product:
				m.quantity_done = purchase_product.quantity_receive
		
		action_receive(operation.name, json.dumps(moves))

		operation_retur = frappe.new_doc("VetOperation")
		operation_retur.update({
			'reference': purchase.name + ' Retur',
			'from': purchase.deliver_to,
			'date': dt.now(tz).date().strftime('%Y-%m-%d'),
			'status': 'Delivery'
		})
		operation_retur.insert()

		for p in json.loads(products):
			new_move = frappe.new_doc("VetOperationMove")
			new_move.update({
				'parent': operation_retur.name,
				'parenttype': 'VetOperation',
				'parentfield': 'moves',
				'product': p.get('product_id'),
				'product_uom': p.get('uom'),
				'quantity': p.get('quantity_retur'),
				'date': dt.now(tz).date().strftime('%Y-%m-%d'),
			})

			operation_retur.moves.append(new_move)
			operation_retur.save()

		operation_retur.reload()
		moves = frappe.get_list('VetOperationMove', filters={'parent': operation_retur.name}, fields=['name', 'product', 'product_uom', 'quantity', 'quantity_done'])
		for m in moves:
			retur_product = next((p for p in json.loads(products) if p.get('product_id') == m.product), False)
			if retur_product:
				m.quantity_done = retur_product.get('quantity_retur')
		
		action_receive(operation_retur.name, json.dumps(moves))

		if jumlah and payment_method:
			create_purchase_payment_journal_items(purchase.name, jumlah, True, 0, payment_method, False)

			purchase.reload()
			owner_credit = frappe.new_doc('VetOwnerCredit')
			owner_credit.update({
				'date': dt.strftime(dt.now(tz), "%Y-%m-%d %H:%M:%S"),
				'purchase': purchase.name,
				'type': 'Refund',
				'nominal': jumlah,
				'metode_pembayaran': payment_method,
			})
			owner_credit.insert()
			frappe.db.commit()
			set_owner_credit_total(purchase.supplier, True)			
				
		return {'purchase': purchase}
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def receive_purchase(name, products, receive_date):
	print('########## Receive Purchase ##########')
	try:
		# pindahin ke confirm_purchase
		create_purchase_journal_entry(name, False, json.loads(products))
		
		for p in json.loads(products):
			product_purchase = frappe.get_doc('VetPurchaseProducts', p.get('name'))
			product_purchase.quantity_receive += p.get('quantity_receive')
			product_purchase.quantity_stocked += p.get('quantity_receive')
			product_purchase.save()
			frappe.db.commit()
			
		purchase = frappe.get_doc('VetPurchase', name)
		
		if all(t.quantity == t.quantity_receive for t in purchase.products):
			purchase.status = 'Receive'
		
		if check_paid_purchase(name):
			purchase.status = 'Paid'
			
		if all(t.quantity == t.quantity_receive for t in purchase.products) and check_paid_purchase(name):
			purchase.status = 'Done'
			
		purchase.save()
		
		purchase.reload()
		
		operation = frappe.get_doc('VetOperation', {'reference': purchase.name})
		moves = frappe.get_list('VetOperationMove', filters={'parent': operation.name}, fields=['name', 'product', 'product_uom', 'quantity', 'quantity_done'])
		for m in moves:
			purchase_product = next((p for p in purchase.products if p.product == m.product), False)
			purchase_product_received = next((p for p in json.loads(products) if p.get('product_id') == m.product), False)
			m.receive_date = receive_date
			if purchase_product:
				m.quantity_done = purchase_product.quantity_receive
			if purchase_product_received:
				m.product_quantity_add = purchase_product_received.get('quantity_receive')
		
		action_receive(operation.name, json.dumps(moves))
				
		return {'purchase': purchase}
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def edit_receive_purchase(name, products, receive_date):
	print('########## Edit Receive Purchase ##########')
	try:
		purchase = frappe.get_doc('VetPurchase', name)
		operation = frappe.get_doc("VetOperation", {'reference': name})
		
		# pindahin ke confirm_purchase
		create_purchase_journal_entry(purchase.name, False, json.loads(products))
		
		purchase.reload()
		
		for p in json.loads(products):
			if p.get('quantity') != p.get('quantity_receive'):
				product_purchase = frappe.get_doc('VetPurchaseProducts', p.get('name'))
				product_purchase.quantity = p.get('quantity_receive') + p.get('quantity_stocked')
				product_purchase.quantity_receive += p.get('quantity_receive')
				product_purchase.quantity_stocked += p.get('quantity_receive')
				product_purchase.save()
				
				move_search = frappe.get_list('VetOperationMove', filters={'parent': operation.name, 'product': product_purchase.product}, fields=['name'])
				move = frappe.get_doc('VetOperationMove', move_search[0]['name'])
				move.update({
					'quantity': p.get('quantity_receive') + p.get('quantity_stocked'),
				})
				move.save()
			else:
				product_purchase = frappe.get_doc('VetPurchaseProducts', p.get('name'))
				product_purchase.quantity_receive += p.get('quantity_receive')
				product_purchase.quantity_stocked += p.get('quantity_receive')
				product_purchase.save()
				
		purchase.reload()
		if all(t.quantity == t.quantity_receive for t in purchase.products):
			purchase.status = 'Receive'
		
		if check_paid_purchase(name):
			purchase.status = 'Paid'
			
		if all(t.quantity == t.quantity_receive for t in purchase.products) and check_paid_purchase(name):
			purchase.status = 'Done'
			
		purchase.save()
		
		purchase.reload()
		operation.reload()
		
		moves = frappe.get_list('VetOperationMove', filters={'parent': operation.name}, fields=['name', 'product', 'product_uom', 'quantity', 'quantity_done'])
		for m in moves:
			purchase_product = next((p for p in purchase.products if p.product == m.product), False)
			purchase_product_received = next((p for p in json.loads(products) if p.get('product_id') == m.product), False)
			m.receive_date = receive_date
			if purchase_product:
				m.quantity_done = purchase_product.quantity_receive
			if purchase_product_received:
				m.product_quantity_add = purchase_product_received.get('quantity_receive')
		
		action_receive(operation.name, json.dumps(moves))
				
		return {'purchase': purchase}
	except PermissionError as e:
		return {'error': e}
		
def check_paid_purchase(name):
	purchase = frappe.get_doc('VetPurchase', name)
	subtotal = 0
	for p in purchase.products:
		subtotal = subtotal + (p.quantity * p.price - ((p.discount or 0) / 100 * (p.quantity * p.price)))
	paid = sum(int(p.jumlah) for p in purchase.pembayaran)
	if paid >= (subtotal - purchase.potongan):
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
			
			
def create_purchase_journal_entry(purchase_name, refund=False, products=False, retur=False):
	tz = pytz.timezone("Asia/Jakarta")
	purchase = frappe.get_doc('VetPurchase', purchase_name)
	purchase_journal = frappe.db.get_value('VetJournal', {'journal_name': 'Purchase Journal', 'type': 'Purchase'}, 'name')
	purchase_journal_debit = frappe.db.get_value('VetJournal', {'journal_name': 'Purchase Journal', 'type': 'Purchase'}, 'default_debit_account')
	purchase_journal_credit = frappe.db.get_value('VetJournal', {'journal_name': 'Purchase Journal', 'type': 'Purchase'}, 'default_credit_account')
	deposit_account = frappe.db.get_value('VetPaymentMethod', {'method_type': 'Deposit Supplier'}, 'account')
	if not deposit_account:
		deposit_account = frappe.db.get_value('VetCoa', {'account_code': '1-16204'}, 'name')
	jis = []
	total = 0
	paid = sum(i.jumlah for i in purchase.pembayaran)
	subtotal = 0
	
	for p in purchase.products:
		subtotal = subtotal + (p.quantity_receive * p.price - (p.discount or 0) / 100 * (p.quantity_receive * p.price))
	
	if products:
		purchase_products = products
	else:
		purchase_products = frappe.get_list('VetPurchaseProducts', filters={'parent': purchase.name}, fields=['*'])
	
	for pp in purchase_products:
		if products:
			category = frappe.db.get_value('VetProduct', pp['product_id'], 'product_category')
		else:
			category = frappe.db.get_value('VetProduct', pp.product, 'product_category')
		account = frappe.db.get_value('VetProductCategory', category, 'stock_input_account')
		if retur:
			amount = pp['quantity_retur'] * pp['price'] - ((pp['discount'] or 0) / 100 * (pp['quantity_retur'] * pp['price']))
		else:
			amount = pp['quantity_receive'] * pp['price'] - ((pp['discount'] or 0) / 100 * (pp['quantity_receive'] * pp['price']))
		total += amount
		
		berhasil = False
		for u in jis:
			if u['account'] == account:
				if refund or retur:
					u['credit'] += amount
					berhasil = True
				else:
					u['debit'] += amount
					berhasil = True
				
		if not berhasil:
			if refund or retur:
				jis.append({
					'account': account,
					'credit': amount
				})
			else:
				jis.append({
					'account': account,
					'debit': amount
				})
				
	if refund or retur:
		jis.append({
			'account': purchase_journal_credit,
			'debit': total,
		})
	else:
		if paid > subtotal:
			print("paid > subtotal")
			print(paid)
			print(subtotal)
			print(total)
			if (paid-subtotal) >= total:
				jis.append({
					'account': deposit_account,
					'credit': total,
				})
			else:
				jis.append({
					'account': purchase_journal_credit,
					'credit': total - (paid - subtotal),
				})
				
				jis.append({
					'account': deposit_account,
					'credit': paid - subtotal,
				})
		elif not purchase.pembayaran or purchase.first_action == 'Receive' or subtotal > paid:
			print("not purchase.pembayaran or purchase.first_action == 'Receive' or subtotal > paid")
			jis.append({
					'account': purchase_journal_credit,
					'credit': total,
				})
			
		else:
			print('else')
			jis.append({
				'account': deposit_account,
				'credit': total,
			})	
			
		if purchase.first_action != 'Pay':
			purchase.first_action = 'Receive'
			purchase.save()
			frappe.db.commit()
	
	je_data = {
		'journal': purchase_journal,
		'period': dt.now(tz).strftime('%m/%Y'),
		'date': dt.now(tz).date().strftime('%Y-%m-%d'),
		'reference': purchase.name,
		'journal_items': jis,
		'keterangan': purchase.supplier_name
	}
	
	new_journal_entry(json.dumps(je_data))
	
	if products:
		owner_credit_search = frappe.get_list('VetOwnerCredit', filters={'purchase': purchase.name, 'type': 'Purchase'}, fields=['name'])
		if len(owner_credit_search) > 0:
			owner_credit = frappe.get_doc('VetOwnerCredit', owner_credit_search[0].name)
			owner_credit.nominal = owner_credit.nominal + total
			owner_credit.save()
			frappe.db.commit()
			set_owner_credit_total(purchase.supplier, True)
		else:
			owner_credit = frappe.new_doc('VetOwnerCredit')
			owner_credit.update({
				'date': dt.strftime(dt.now(tz), "%Y-%m-%d %H:%M:%S"),
				'purchase': purchase.name,
				'type': 'Purchase',
				'nominal': total
			})
			owner_credit.insert()
			frappe.db.commit()
			set_owner_credit_total(purchase.supplier, True)
	
def create_purchase_payment_journal_items(purchase_name, amount, refund=False, deposit=0, method=False, date=False):
	tz = pytz.timezone("Asia/Jakarta")
	purchase = frappe.get_doc('VetPurchase', purchase_name)
	#create payment choose payment journal
	# purchase_journal = frappe.db.get_value('VetJournal', {'journal_name': 'Purchase Journal', 'type': 'Purchase'}, 'name')

	if refund:
		if check_refund_journal():
			purchase_journal = frappe.db.get_value('VetJournal', {'name': 'PREFUND'}, 'name')
		else:
			purchase_journal = create_refund_journal()
	else:
		if check_payment_journal():
			purchase_journal = frappe.db.get_value('VetJournal', {'name': 'PPAY'}, 'name')
		else:
			purchase_journal = create_payment_journal()

	if refund:
		debit_account = frappe.db.get_value('VetCoa', {'account_code': '1-17002'}, 'name')
	else:
		debit_account = frappe.db.get_value('VetCoa', {'account_code': '2-11001'}, 'name')

	if method:
		credit_account = frappe.db.get_value('VetPaymentMethod', {'method_name': method}, 'account')
	else:
		credit_account = frappe.db.get_value('VetCoa', {'account_code': '1-11102'}, 'name')

	deposit_account = frappe.db.get_value('VetPaymentMethod', {'method_type': 'Deposit Supplier'}, 'account')
	if not deposit_account:
		deposit_account = frappe.db.get_value('VetCoa', {'account_code': '1-16204'}, 'name')
	
	if refund:
		jis = [
			{
				'account': debit_account,
				'credit': amount,
			},
			{
				'account': credit_account,
				'debit': amount,
			}
		]
	else:
		paid = sum(i.jumlah for i in purchase.pembayaran)
		subtotal = 0 - (purchase.potongan or 0)
		for p in purchase.products:
			subtotal = subtotal + (p.quantity_receive * p.price - ((p.discount or 0) / 100 * (p.quantity_receive * p.price)))
		jis = []
		
		if float(paid) > float(subtotal):
			if deposit:
				jis.append({'account': deposit_account, 'credit': deposit})
			
			if float(subtotal) - (float(paid) - float(amount)) > 0:
				jas = [
					{'account': credit_account, 'credit': amount},
					{'account': debit_account, 'debit': float(subtotal) - (float(paid) - float(amount))},
					{'account': deposit_account, 'debit': float(paid) - float(subtotal)}
					]
			else:
				jas = [
						{'account': credit_account, 'credit': amount},
						{'account': deposit_account, 'debit': amount}
					]
			jis.extend(jas)
		elif not all(t.quantity_receive == 0 for t in purchase.products) or purchase.first_action == 'Receive' or subtotal > paid:
			if deposit:
				jis.append({'account': deposit_account, 'credit': deposit})
			
			jas = [
					{
						'account': debit_account,
						'debit': float(amount) + float(deposit),
					},{
						'account': credit_account,
						'credit': amount,
					}
				]
			jis.extend(jas)
		else:
			if deposit:
				jis.append({'account': deposit_account, 'credit': deposit})
				
			jas = [
				{
					'account': deposit_account,
					'debit': float(amount) + float(deposit),
				},{
					'account': credit_account,
					'credit': amount,
				}
			]
			jis.extend(jas)
				
		if purchase.first_action != 'Receive':
			purchase.first_action = 'Pay'
			purchase.save()
			frappe.db.commit()
	
	je_data = {
		'journal': purchase_journal,
		'period': (date or dt.now(tz)).strftime('%m/%Y'),
		'date': (date or dt.now(tz)).date().strftime('%Y-%m-%d'),
		'reference': purchase_name,
		'journal_items': jis,
		'keterangan': purchase.supplier_name
	}
	
	new_journal_entry(json.dumps(je_data))
	
def get_supplier_true_credit(supplier_name):
	def discount_value(value, discount):
		return value - (value * discount/100)
	
	credit = 0
	total_reduced_credit = 0
	
	last_credit = frappe.get_list("VetOwnerCredit", fields=["credit"], filters={'supplier': supplier_name}, order_by="creation desc")
	if last_credit:
		credit = last_credit[0]['credit']
		
	# purchase_orders = frappe.get_list("VetPurchase", fields=["name", "potongan"], filters={'supplier': supplier_name, 'status': ['in', ['Purchase Order', 'Receive', 'Paid']]}, order_by="creation desc")
	# for po in purchase_orders:
	# 	purchase_order_payments = frappe.get_list('VetPurchasePay', filters={'parent': po.name}, fields=['*'])
	# 	purchase_order_products = frappe.get_list('VetPurchaseProducts', filters={'parent': po.name}, fields=['*'])
		
	# 	paid = sum(p.jumlah for p in purchase_order_payments)
		
	# 	received_total = sum(discount_value(p.quantity_receive * p.price, p.discount) for p in purchase_order_products)
	# 	subtotal = sum(discount_value(p.quantity * p.price, p.discount) for p in purchase_order_products)
	# 	total = subtotal - po.potongan
		
	# 	reduced_credit = (paid if paid <= total else total) - received_total
	# 	reduced_credit = reduced_credit if reduced_credit > 0 else 0
	# 	total_reduced_credit += reduced_credit
		
	print(credit)
	print(total_reduced_credit)
		
	credit = credit - total_reduced_credit
	credit = credit if credit > 0 else 0
		
	return credit
	
def check_payment_journal():
	payment_journal = frappe.get_list('VetJournal', filters={'name': 'PPAY'}, fields=['name'])
	return len(payment_journal) > 0

def create_payment_journal():
	payment_journal = frappe.new_doc('VetJournal')
	payment_journal.update({
		'code': 'PPAY',
		'type': 'General',
		'journal_name': 'Purchase Payment Journal',
	})
	payment_journal.insert()
	frappe.db.commit()
	
	return payment_journal.name

def check_refund_journal():
	refund_journal = frappe.get_list('VetJournal', filters={'name': 'PREFUND'}, fields=['name'])
	return len(refund_journal) > 0

def create_refund_journal():
	refund_journal = frappe.new_doc('VetJournal')
	refund_journal.update({
		'code': 'PREFUND',
		'type': 'General',
		'journal_name': 'Purchase Refund Journal',
	})
	refund_journal.insert()
	frappe.db.commit()
	
	return refund_journal.name