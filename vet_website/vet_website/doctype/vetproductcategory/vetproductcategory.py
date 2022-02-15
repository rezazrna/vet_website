# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
from datetime import datetime as dt
from frappe.model.document import Document

class VetProductCategory(Document):
	pass

@frappe.whitelist()
def get_category_list(filters=None):
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
		search = filter_json.get('search', False)

		if currentpage:
			page = currentpage
		
		if filters_json:
			for fj in filters_json:
				td_filters.append(fj)

		if search:
			td_filters.append({'category_name': ['like', '%'+search+'%']})
		
		if sort:
			default_sort = sort
	
	try:
		product_categories = frappe.get_list("VetProductCategory", filters=td_filters, fields=["*"], order_by=default_sort, start=(page - 1) * 10, page_length= 10)
		datalength = len(frappe.get_all("VetProductCategory", filters=td_filters, as_list=True))
			
		return {'product_category': product_categories, 'datalength': datalength}
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_category_form():
	accounts = frappe.get_list('VetCoa', fields=['*'], order_by='account_code asc')
	return {'accounts': accounts}
		
@frappe.whitelist()
def delete_category(data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal menghapus kategori"}
	
	for d in data_json:
		frappe.delete_doc('VetProductCategory', d)
		frappe.db.commit()
		
	return {'success': True}
	
@frappe.whitelist()
def new_category(data):
	try:
		data_json = json.loads(data)
		new_category = frappe.new_doc('VetProductCategory')
		new_category.update(data_json)
		new_category.insert()
		
		return new_category
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def edit_category(data):
	try:
		data_json = json.loads(data)
		
		data_check = frappe.get_list('VetProductCategory', filters={'name': data_json.get('name', False)}, fields=['name'])
		if len(data_check) != 0:
			update_category = frappe.get_doc('VetProductCategory', data_json.get('name', False))
			update_category.update(data_json)
			update_category.save()

			return update_category
		
	except PermissionError as e:
		return {'error': e}