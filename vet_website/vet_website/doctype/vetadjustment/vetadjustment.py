# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
import pytz
from datetime import datetime as dt
from frappe.model.document import Document
from vet_website.vet_website.doctype.vetoperation.vetoperation import action_receive
from vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice import decrease_product_valuation
from vet_website.vet_website.doctype.vetjournalentry.vetjournalentry import new_journal_entry

class VetAdjustment(Document):
	pass

@frappe.whitelist()
def get_adjustment_list(filters=None):
	default_sort = "creation desc"
	po_filters = []
	po_or_filters = []
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
		currentpage = filter_json.get('currentpage', False)
		search = filter_json.get('search', False)

		if currentpage:
			page = currentpage
		
		if filters_json:
			for fj in filters_json:
				po_filters.append(fj)

		if search:
			po_or_filters.append({'user_name': ['like', '%'+search+'%']})
			po_or_filters.append({'warehouse_name': ['like', '%'+search+'%']})
			po_or_filters.append({'status': ['like', '%'+search+'%']})
				
		if sort:
			default_sort = sort
		
	try:
		adjustment = frappe.get_list("VetAdjustment", or_filters=po_or_filters, filters=po_filters, fields=["*"], order_by=default_sort, start=(page - 1) * 10, page_length= 10)
		datalength = len(frappe.get_all("VetAdjustment", or_filters=po_or_filters, filters=po_filters, as_list=True))
		for a in adjustment:
			inventory_details = frappe.get_list('VetAdjustmentInventoryDetails', filters={'parent': a['name']}, fields=['adjustment_value'])
			a['adjustment_value'] = sum(i.adjustment_value for i in inventory_details)
		
		return {'adjustment': adjustment, 'datalength': datalength}
		
	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()
def get_name_list(filters=None):
	default_sort = "creation desc"
	po_filters = []
	po_or_filters = []
	filter_json = False
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
		
	if filter_json:
		filters_json = filter_json.get('filters', False)
		search = filter_json.get('search', False)
		
		if filters_json:
			for fj in filters_json:
				po_filters.append(fj)

		if search:
			po_or_filters.append({'user_name': ['like', '%'+search+'%']})
			po_or_filters.append({'warehouse_name': ['like', '%'+search+'%']})
			po_or_filters.append({'status': ['like', '%'+search+'%']})
		
	try:
		namelist = frappe.get_all("VetAdjustment", or_filters=po_or_filters, filters=po_filters, as_list=True)
		
		return list(map(lambda item: item[0], namelist))
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def delete_adjustment(data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal menghapus adjustment"}
	
	for d in data_json:
		frappe.delete_doc('VetAdjustment', d)
		frappe.db.commit()
		
	return {'success': True}
	
@frappe.whitelist()
def get_adjustment(name=None):
	try:
		if name != None :
			adjustment_search = frappe.get_list('VetAdjustment', filters={'name': name}, fields=['*'])
			adjustment = adjustment_search[0]
			
			inventory_details = frappe.get_list('VetAdjustmentInventoryDetails', filters={'parent': name}, fields=['*'])
			adjustment['inventory_details'] = inventory_details
			owner_full_name = frappe.db.get_value('User', adjustment.owner, 'full_name')
			adjustment['owner_full_name'] = owner_full_name
		else:
			adjustment = {'inventory_details': []}
		
		gudangAll = frappe.get_list('VetGudang', fields=['*'])
		stockable = frappe.get_list('VetProductCategory', filters={'stockable': True}, fields=['name'])
		list_category = [i['name'] for i in stockable]
		productAll = frappe.get_list('VetProduct', filters={'product_category': ['in', list_category]}, fields=['*'])
		
		res = {'adjustment': adjustment, 'gudang': gudangAll, 'productAll': productAll,}
		    
		return res
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_quantity_product(name, adjustment_name):
	try:
		adjustment = frappe.get_doc('VetAdjustment', adjustment_name)
		in_operation_search = frappe.get_list('VetOperation', filters={'to': adjustment.warehouse}, fields=['name'])
		in_operation = []
		for io in in_operation_search:
			if io.date:
				if io.date > adjustment.inventory_date:
					in_operation.append(io)
			elif io.creation:
				if io.creation >= dt.combine(adjustment.inventory_date, dt.min.time()):
					in_operation.append(io)
		
		in_moves = frappe.get_list('VetOperationMove', filters={'parent': ['in', list(map(lambda o: o.name, in_operation))], 'product': name}, fields=['quantity_done'])
		
		out_operation_search = frappe.get_list('VetOperation', filters={'from': adjustment.warehouse}, fields=['name'])
		out_operation = []
		for oo in out_operation_search:
			if oo.date:
				if oo.date > adjustment.inventory_date:
					out_operation.append(oo)
			elif oo.creation:
				if oo.creation >= dt.combine(adjustment.inventory_date, dt.min.time()):
					out_operation.append(oo)
		
		out_moves = frappe.get_list('VetOperationMove', filters={'parent': ['in', list(map(lambda o: o.name, out_operation))], 'product': name}, fields=['quantity_done'])
		
		theoretical_quantity = sum(i.quantity_done for i in in_moves) - sum(o.quantity_done for o in out_moves)
		
		quantity = frappe.get_list('VetProductQuantity', filters={'product': name, 'gudang': adjustment.warehouse}, fields=['quantity'])
		
		return sum(q.quantity for q in quantity) - theoretical_quantity
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def submit_adjustment(data):
	try:
		data_json = json.loads(data)
		
		if data_json.get('name') :
			in_operation_move = []
			out_operation_move = []
			
			for inv in data_json.get('inventory_details', []):
				move = {'product': inv.get('product'), 'quantity': inv.get('diff_quantity', 0), 'quantity_done': inv.get('diff_quantity', 0), 'date': data_json.get('inventory_date')}
				if float(inv.get('diff_quantity', 0)) > 0:
					in_operation_move.append(move)
					adjustment_value = increase_product_valuation(inv.get('product'), inv.get('diff_quantity', 0))
					inv.update({'adjustment_value': adjustment_value})
				elif float(inv.get('diff_quantity', 0)) < 0:
					move.update({'quantity': -int(inv.get('diff_quantity', 0)), 'quantity_done': -int(inv.get('diff_quantity', 0))})
					out_operation_move.append(move)
					adjustment_value = decrease_product_valuation(inv.get('product'), -int(inv.get('diff_quantity', 0)))
					inv.update({'adjustment_value': adjustment_value})
					
			data_json.update({'status': 'Done'})
			
			save = adjustment_save(data_json)
			adjustment = save.get('adjustment')
			
			if len(in_operation_move):
				in_operation = frappe.new_doc("VetOperation")
				in_operation.update({
					'reference': adjustment.name,
					'to': adjustment.warehouse,
					'date': adjustment.inventory_date,
					'status': 'Delivery',
					'moves': in_operation_move,
				})
				in_operation.insert()
				frappe.db.commit()
				in_moves = frappe.get_list('VetOperationMove', filters={'parent': in_operation.name}, fields=['name', 'product', 'product_uom', 'quantity', 'quantity_done'])
				action_receive(in_operation.name, json.dumps(in_moves))
			if len(out_operation_move):
				out_operation = frappe.new_doc("VetOperation")
				out_operation.update({
					'reference': adjustment.name,
					'from': adjustment.warehouse,
					'date': adjustment.inventory_date,
					'status': 'Delivery',
					'moves': out_operation_move,
				})
				out_operation.insert()
				frappe.db.commit()
				out_moves = frappe.get_list('VetOperationMove', filters={'parent': out_operation.name}, fields=['name', 'product', 'product_uom', 'quantity', 'quantity_done'])
				action_receive(out_operation.name, json.dumps(out_moves))
				
			frappe.db.commit()
			
			selisih_stock_account = frappe.db.get_value('VetCoa', {'account_code': '5-30004'}, 'name')
			ji_list = [{'account': selisih_stock_account, 'debit': sum(i['adjustment_value'] for i in data_json.get('inventory_details'))}]
			
			for a in data_json.get('inventory_details'):
				category = frappe.db.get_value('VetProduct', a['product'], 'product_category')
				account = frappe.db.get_value('VetProductCategory', category, 'stock_input_account')
				
				berhasil = False
				for u in ji_list:
					if u['account'] == account:
						u['credit'] += a['adjustment_value']
						berhasil = True
						
				if not berhasil:
					ji_list.append({
						'account': account,
						'credit': a['adjustment_value']
					})
			
			adjustment_journal = frappe.db.get_value('VetJournal', {'journal_name': 'Adjustment Journal', 'type': 'General'}, 'name')
			tz = pytz.timezone("Asia/Jakarta")
			je_data = {
				'journal': adjustment_journal,
				'period': dt.now(tz).strftime('%m/%Y'),
				'date': adjustment.inventory_date.strftime('%Y-%m-%d'),
				'reference': adjustment.name,
				'journal_items': ji_list
			}
			
			new_journal_entry(json.dumps(je_data))
			
			return {'adjustment': adjustment}
			
		else :
			adjustment = frappe.new_doc("VetAdjustment")
			adjustment.update(data_json)
			adjustment.insert()
				
			return {'adjustment': adjustment}

	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def save_adjustment(data):
	try:
		data_json = json.loads(data)
		adjustment = adjustment_save(data_json)

		return adjustment
		
	except PermissionError as e:
		return {'error': e}
		
def adjustment_save(data_json):
		
	inventory_details = []
	for inv in data_json.get('inventory_details'):
		if inv.get('delete', False):
			frappe.delete_doc('VetAdjustmentInventoryDetails', inv.get('name'))
		else:
			inventory_details.append(inv)
			
	data_json.update({'inventory_details': inventory_details})
	
	adjustment = frappe.get_doc("VetAdjustment", data_json.get('name'))
	adjustment.update(data_json)
	adjustment.save()
	adjustment.reload()
	frappe.db.commit()
		
	return {'adjustment': adjustment}
		
@frappe.whitelist()
def cancel_adjustment(name):
	try:
		adjustment = frappe.get_doc('VetAdjustment', name)
		adjustment.status = 'Cancel'
		adjustment.save()
	except:
		return {'error': "Gagal menemukan adjustment"}
		
	return {'success': True}
	
def increase_product_valuation(product, quantity):
	adjustment_value = 0
	# purchase_with_stock_search = frappe.get_list('VetPurchaseProducts', filters={'product': product, 'quantity_stocked': ['>', 0]}, fields=['name', 'quantity_stocked', 'product', 'product_name', 'price'], order_by="creation desc")
	purchase_with_stock_search = frappe.get_list('VetPurchaseProducts', filters={'product': product}, fields=['name', 'quantity_stocked', 'product', 'product_name', 'price'], order_by="creation desc", page_length=1)
	print('increase product valuation')
	print(quantity)
	print('purchase stok')
	print(purchase_with_stock_search)
	if len(purchase_with_stock_search):
		purchase_product = frappe.get_doc('VetPurchaseProducts', purchase_with_stock_search[0].name)
		purchase_product.quantity_stocked = purchase_product.quantity_stocked + float(quantity)
		adjustment_value += purchase_product.price * float(quantity)
		purchase_product.save()
		frappe.db.commit()
	print('adjustment value')
	print(adjustment_value)
		
	return adjustment_value