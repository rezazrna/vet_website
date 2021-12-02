# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
from datetime import datetime as dt
from frappe.model.document import Document

class VetGudang(Document):
	pass

@frappe.whitelist()
def get_gudang_list(filters=None):
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
		currentpage = filter_json.get('currentpage', False)

		if currentpage:
			page = currentpage
		
		if filters_json:
			for fj in filters_json:
				td_filters.append(fj)
		if sort:
			default_sort = sort
			
	try:
		gudang_list = frappe.get_list("VetGudang", filters=td_filters, fields=["*"], order_by=default_sort, start=(page - 1) * 10, page_length= 10)
		datalength = len(frappe.get_all("VetGudang", filters=td_filters, as_list=True))
		
		for g in gudang_list:
			purchase_order = frappe.db.count("VetPurchase", {'deliver_to': g.name, 'status': ['in', ['Draft','RFQ','Purchase Order']]})
			operation = frappe.db.count("VetOperation", {'to': g.name, 'status': ['!=', 'Done']})
			delivery_order = frappe.db.count("VetOperation", {'from': g.name, 'status': ['!=', 'Done']})
			g['total_receipts'] = purchase_order + operation
			g['total_delivery_orders'] = delivery_order
			
		return {'gudang': gudang_list, 'datalength': datalength}
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def delete_gudang(data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal menghapus gudang"}
	
	for d in data_json:
		frappe.delete_doc('VetGudang', d)
		frappe.db.commit()
		
	return {'success': True}
	
@frappe.whitelist()
def set_default_gudang(name):
	try:
		default_gudang_name = frappe.get_list('VetGudang', filters={'is_default': '1'}, fields=['name'])
		for dg in default_gudang_name:
			default_gudang = frappe.get_doc('VetGudang', dg['name'])
			default_gudang.update({'is_default': 0})
			default_gudang.save()
		new_default_gudang = frappe.get_doc('VetGudang', name)
		new_default_gudang.update({'is_default': 1})
		new_default_gudang.save()
		return {'success': True}
	except:
		return {'error': "Gagal mengubah gudang"}
	
@frappe.whitelist()
def new_gudang(data):
	try:
		data_json = json.loads(data)
		new_gudang = frappe.new_doc('VetGudang')
		new_gudang.update(data_json)
		new_gudang.insert()
		
		return new_gudang
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def edit_gudang(data):
	try:
		data_json = json.loads(data)
		
		data_check = frappe.get_list('VetGudang', filters={'name': data_json.get('name', False)}, fields=['name'])
		if len(data_check) != 0:
			update_gudang = frappe.get_doc('VetGudang', data_json.get('name', False))
			update_gudang.update(data_json)
			update_gudang.save()

			return update_gudang
		
	except PermissionError as e:
		return {'error': e}