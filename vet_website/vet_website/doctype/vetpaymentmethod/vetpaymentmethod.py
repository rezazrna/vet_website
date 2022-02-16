# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
from frappe.model.document import Document

class VetPaymentMethod(Document):
	pass

@frappe.whitelist()
def get_payment_method_list(filters=None):
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
		currentpage = filter_json.get('currentpage', False)
		search = filter_json.get('search', False)

		if currentpage:
			page = currentpage
		
		if filters_json:
			for fj in filters_json:
				td_filters.append(fj)
		if search:
			td_or_filters.append({'method_name': ['like', '%'+search+'%']})
			td_or_filters.append({'method_type': ['like', '%'+search+'%']})
		if sort:
			default_sort = sort
			
	try:
		pm_list = frappe.get_list("VetPaymentMethod", or_filters=td_or_filters, filters=td_filters, fields=["*"], order_by=default_sort, start=(page - 1) * 10, page_length= 10)
		datalength = len(frappe.get_all("VetPaymentMethod", or_filters=td_or_filters, filters=td_filters, as_list=True))
		
		for pm in pm_list:
			account_name = frappe.db.get_value('VetCoa', pm.account, 'account_name')
			pm.account_name = account_name
			
		# cash_and_bank_parent = frappe.get_list('VetCoa', filters={'account_code': '1-11000'}, fields=['name'])
		# account_list = frappe.get_list('VetCoa', filters={'account_parent': cash_and_bank_parent[0].name}, fields=['name', 'account_name'])
		account_list = frappe.get_list('VetCoa', fields=['name', 'account_name'])
			
		return {'list': pm_list, 'account_list': account_list, 'datalength': datalength}
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def delete_payment_method(data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal menghapus gudang"}
	
	for d in data_json:
		frappe.delete_doc('VetPaymentMethod', d)
		frappe.db.commit()
		
	return {'success': True}
	
@frappe.whitelist()
def new_payment_method(data):
	try:
		data_json = json.loads(data)
		new_doc = frappe.new_doc('VetPaymentMethod')
		new_doc.method_name = data_json.get('method_name', False)
		new_doc.account =  data_json.get('account', '')
		new_doc.method_type = data_json.get('method_type', False)
		new_doc.insert()
		
		return new_doc
		
	except PermissionError as e:
		return {'error': e}
		
		
@frappe.whitelist()
def edit_payment_method(data):
	try:
		data_json = json.loads(data)
		
		data_check = frappe.get_list('VetPaymentMethod', filters={'name': data_json.get('name', False)}, fields=['name'])
		if len(data_check) != 0:
			update_doc = frappe.get_doc('VetPaymentMethod', data_json.get('name', False))
			update_doc.update({
				'method_name': data_json.get('method_name', False),
				'account': data_json.get('account', ''),
				'method_type': data_json.get('method_type', False),
			})
			update_doc.save()

			return update_doc
		
	except PermissionError as e:
		return {'error': e}