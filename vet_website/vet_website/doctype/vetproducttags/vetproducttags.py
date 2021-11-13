# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
from datetime import datetime as dt
from frappe.model.document import Document

class VetProductTags(Document):
	pass

@frappe.whitelist()
def get_product_tags_list(filters=None):
	default_sort = "creation desc"
	po_filters = {}
	po2_filters = {}
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
		
	if filter_json:
		search = filter_json.get('search', False)
		min_date = filter_json.get('min_date', False)
		max_date = filter_json.get('max_date', False)
		
		if search:
			po_filters.update({'label': ['in', search]})
			
		if min_date:
			po2_filters.update({'creation': ['>=', min_date]})
		if max_date:
			po2_filters.update({'creation': ['<=', max_date]})
		if min_date and max_date:
			po2_filters.update({'creation': ['between', [min_date, max_date]]})
	
	try:
		tags = frappe.get_list("VetTag", filters=po_filters, fields=["*"], order_by=default_sort)
		
		for t in tags:
			product_tags = frappe.get_list("VetProductTags", filters={'tag_id': t['name']}, fields=['parent'])
			on_hand_list = []
			pembelian_list = []
			penjualan_price = 0
			pembelian_price = 0
			on_hand_price = 0
			
			sales_list = []
			purchase_list = []
			
			for p in product_tags:
				po2_filters.update({'product': p['parent']})
				product = frappe.get_doc('VetProduct', p['parent'])
				
				quantity = frappe.get_list("VetProductQuantity", filters=po2_filters, fields=["quantity"])
				penjualan = frappe.get_list('VetCustomerInvoiceLine', filters=po2_filters, fields=['quantity', 'total', 'creation'])
				
				# sales_list += penjualan
				for p in penjualan:
					p.update({'product_uom_name': frappe.db.get_value('VetUOM', p.product_uom, 'uom_name')})
					if sales_list:
						berhasil = False
						for sl in sales_list:
							if sl.creation.strftime('%Y-%m-%d') == p.creation.strftime('%Y-%m-%d'):
								sl.quantity += p.quantity
								sl.total += p.total
								berhasil = True
						if not berhasil:
							sales_list.append(p)
					else:
						sales_list.append(p)
				
				berhasil = False
				if on_hand_list:
					for oh in on_hand_list:
						if oh['uom'] == product.uom_name:
							oh['on_hand_quantity'] = float(sum(q.quantity for q in quantity)) + oh['on_hand_quantity']
							oh['penjualan_quantity'] = float(sum(pe.quantity for pe in penjualan))
							berhasil = True
					if not berhasil:
						on_hand_list.append({
							'uom': product.uom_name,
							'on_hand_quantity': float(sum(q.quantity for q in quantity)),
							'penjualan_quantity': float(sum(pe.quantity for pe in penjualan)),
						})
				else:
					on_hand_list.append({
						'uom': product.uom_name,
						'on_hand_quantity': float(sum(q.quantity for q in quantity)),
						'penjualan_quantity': float(sum(pe.quantity for pe in penjualan))
					})
					
				
				
				pembelian = frappe.get_list('VetPurchaseProducts', filters=po2_filters, fields=['quantity', 'quantity * price as total', 'uom_name', 'creation'])
				
				# purchase_list += pembelian
				for p in pembelian:
					if purchase_list:
						berhasil = False
						for pl in purchase_list:
							if pl.creation.strftime('%Y-%m-%d') == p.creation.strftime('%Y-%m-%d'):
								pl.quantity += p.quantity
								pl.total += p.total
								berhasil = True
						if not berhasil:
							purchase_list.append(p)
					else:
						purchase_list.append(p)
				
				berhasilPembelian = False
				for pa in pembelian:
					if pembelian_list:
						for pl in pembelian_list:
							if pl['uom'] == pa['uom_name']:
								pl['quantity'] = pa['quantity'] + pl['quantity']
								berhasilPembelian = True
								
						if not berhasilPembelian:
							pembelian_list.append({
								'uom': pa['uom_name'],
								'quantity': pa['quantity'],
							})
					else:
						pembelian_list.append({
							'uom': pa['uom_name'],
							'quantity': pa['quantity'],
						})
						
				on_hand_price += float(sum(q.quantity for q in quantity)) * product.price
				penjualan_price += float(sum(pe.total for pe in penjualan))
				pembelian_price += float(sum(pe.total for pe in pembelian))
				
			t['onHandList'] = on_hand_list
			t['pembelianList'] = pembelian_list
			t['on_hand_price'] = on_hand_price
			t['penjualan_price'] = penjualan_price
			t['pembelian_price'] = pembelian_price
			t['sales_list'] = sales_list
			t['purchase_list'] = purchase_list
			
		return tags
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def delete_product_tags(data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal menghapus product tags"}
	
	for d in data_json:
		frappe.delete_doc('VetProductTags', d)
		frappe.db.commit()
		
	return {'success': True}
	
@frappe.whitelist()
def get_all_tags():
	try:
		tags = frappe.get_list('VetTag', fields=['*'])
		
		return tags
	except:
		return {'error': "Gagal menghapus product tags"}
		
@frappe.whitelist()
def create_tag(data):
	try:
		data_json = json.loads(data)
		
		new_tag = frappe.new_doc('VetTag')
		new_tag.label = data_json.get('label')
		new_tag.insert()
		frappe.db.commit()
		
		return new_tag
	except:
		return {'error': 'Gagal membuat Tag'}