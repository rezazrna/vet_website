# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
from datetime import datetime as dt
from frappe.model.document import Document

class VetUOM(Document):
	pass

@frappe.whitelist()
def get_uom_list(filters=None):
	default_sort = "creation desc"
	td_filters = {}
	filter_json = False
	uom_list = []
	page = 1
	
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
		currentpage = filter_json.get('currentpage', False)

		if currentpage:
			page = currentpage
		
		if search:
			td_filters.update({'uom_name': ['like', '%'+search+'%']})
		if sort:
			default_sort = sort
			
		if min_date:
			td_filters.update({'creation': ['>=', min_date]})
		if max_date:
			td_filters.update({'creation': ['<=', max_date]})
		if min_date and max_date:
			td_filters.update({'creation': ['between', [min_date, max_date]]})
	
	try:
		if td_filters == {}:
			td_filters.update({'unit_master': ['in', ['',False,None,'0']]})
		
		uoms = frappe.get_list("VetUOM", filters=td_filters, fields=["*"], order_by=default_sort, start=(page - 1) * 30, page_length= 30)
		datalength = len(frappe.get_all("VetUOM", filters=td_filters, as_list=True))
		for uom in uoms:
			uom_list.append(uom)
			uom_childs = frappe.get_list("VetUOM", filters={'unit_master': uom.name}, fields=["*"], order_by='ratio asc')
			uom_list = uom_list + uom_childs
			
		return {'uom_list': uom_list, 'datalength': datalength}
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def delete_uom(data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal menghapus UOM"}
	
	for d in data_json:
		frappe.delete_doc('VetUOM', d)
		frappe.db.commit()
		
	return {'success': True}
	
@frappe.whitelist()
def new_uom(data):
	try:
		data_json = json.loads(data)
		new_uom = frappe.new_doc('VetUOM')
		new_uom.uom_name = data_json.get('uom_name', False)
		new_uom.unit_master =  data_json.get('unit_master', '')
		new_uom.ratio = data_json.get('ratio', False)
		new_uom.insert()
		
		return new_uom
		
	except PermissionError as e:
		return {'error': e}
		
		
@frappe.whitelist()
def edit_uom(data):
	try:
		data_json = json.loads(data)
		
		data_check = frappe.get_list('VetUOM', filters={'name': data_json.get('name', False)}, fields=['name'])
		print(data_json)
		print(data_check)
		if len(data_check) != 0:
			update_uom = frappe.get_doc('VetUOM', data_json.get('name', False))
			update_uom.update({
				'uom_name': data_json.get('uom_name', False),
				'unit_master': data_json.get('unit_master', ''),
				'ratio': data_json.get('ratio', False),
			})
			update_uom.save()

			return update_uom
		
	except PermissionError as e:
		return {'error': e}