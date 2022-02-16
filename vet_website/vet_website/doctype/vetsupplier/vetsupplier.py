# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
import string
import random
from datetime import datetime as dt
from frappe.utils.file_manager import save_file

from frappe.model.document import Document

class VetSupplier(Document):
	pass

@frappe.whitelist()
def get_supplier_list(filters=None):
	def process_odd_filter(fj):
		f = fj
		
		if f[1] == "=":
			f[1] = "=="
		
		f[0] = "a.%s"%f[0]
		string = " ".join(f)
		return lambda a: eval(string)
	
	default_sort = "creation desc"

	supplier_filters = []
	supplier_or_filters = []
	filter_json = False
	result_filter = lambda a: a
	odd_filters = []
	odd_sorts = []
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
				if fj[0] not in ['credit', 'debt']:
					supplier_filters.append(fj)
				else:
					odd_filters.append(fj)

		if search:
			supplier_or_filters.append({'supplier_name': ['like', '%'+search+'%']})
			supplier_or_filters.append({'address': ['like', '%'+search+'%']})
				
		if sort:
			sorts = sort.split(',')
			for i,s in enumerate(sorts):
				if 'credit' in s or 'debt' in s:
					odd_sorts.append(s)
					sorts.pop(i)
			default_sort = ','.join(sorts)
			
	try:
		supplier_list = frappe.get_list("VetSupplier", or_filters=supplier_or_filters, filters=supplier_filters, fields=["*"], order_by=default_sort, start=(page - 1) * 10, page_length= 10)
		datalength = len(frappe.get_all("VetSupplier", or_filters=supplier_or_filters, filters=supplier_filters, as_list=True))
		for sl in supplier_list:
			unpaid_purchase = []
			credit = 0
			debt = 0
			purchase = frappe.get_list("VetPurchase", fields=["*"], filters={'supplier': sl.name})
			last_credit = frappe.get_list("VetOwnerCredit", fields=["credit", "debt"], filters={'supplier': sl.name}, order_by="creation desc")
			if last_credit:
				credit = last_credit[0]['credit']
				debt = last_credit[0]['debt']
			else:
				credit = 0
				debt = 0
			print(str(last_credit) + ' ini credit')
			for p in purchase:
				purchaseproducts = frappe.get_list("VetPurchaseProducts", fields=["sum(price*quantity) as subtotal"], filters={'parent': p.name})
				purchasepay = frappe.get_list("VetPurchasePay", fields=["sum(jumlah) as paid"], filters={'parent': p.name})
				paid = purchasepay[0].paid or 0
				subtotal = purchaseproducts[0].subtotal or 0
				if paid < subtotal:
					unpaid_purchase.append(p)
						
			sl.update({'purchase_count': len(purchase), 'purchase': purchase, 'unpaid_purchase_count': len(unpaid_purchase), 'credit': credit, 'debt': debt})
		
		for os in odd_sorts:
			reverse = False
			os_words = os.split(' ')
			sort_filter = lambda o: o[os_words[0]]
			if os_words[1] == 'desc':
				reverse = True
			supplier_list.sort(key=sort_filter, reverse=reverse)
		
		for fj in odd_filters:
			result_filter = process_odd_filter(fj)
			supplier_list = filter(result_filter, supplier_list)
			
		return {'supplier': supplier_list, 'datalength': datalength}
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_name_list(filters=None):
	def process_odd_filter(fj):
		f = fj
		
		if f[1] == "=":
			f[1] = "=="
		
		f[0] = "a.%s"%f[0]
		string = " ".join(f)
		return lambda a: eval(string)

	supplier_filters = []
	filter_json = False
	result_filter = lambda a: a
	odd_filters = []
	odd_sorts = []
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
			
	if filter_json:
		filters_json = filter_json.get('filters', False)
		
		if filters_json:
			for fj in filters_json:
				if fj[0] not in ['credit', 'debt']:
					supplier_filters.append(fj)
				else:
					odd_filters.append(fj)
			
	try:
		namelist = frappe.get_all("VetSupplier", filters=supplier_filters, as_list=True)
			
		return list(map(lambda item: item[0], namelist))
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def delete_supplier(data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal menghapus supplier"}
	
	for d in data_json:
		frappe.delete_doc('VetSupplier', d)
		frappe.db.commit()
		
	return {'success': True}
	
@frappe.whitelist()
def get_supplier(name):
	try:
		supplier = frappe.get_list("VetSupplier", filters={'name': name}, fields=['*'])
		purchase = frappe.db.count("VetPurchase", {'supplier': name})
		supplier[0]['purchase_count'] = purchase
		return {'supplier': supplier[0]}
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def edit_supplier(data):
	now = dt.now()
	now_str = dt.strftime(now, "%d%m%Y%H%M%S")
	
	try:
		data_json = json.loads(data)
		
		if data_json.get('name'):
			supplier = frappe.get_doc("VetSupplier", data_json.get('name'))
			supplier.description =  data_json.get('description', supplier.description)
			supplier.supplier_name =  data_json.get('supplier_name', supplier.supplier_name)
			supplier.phone =  data_json.get('phone', supplier.phone)
			supplier.email =  data_json.get('email', supplier.email)
			supplier.address =  data_json.get('address', supplier.address)
			
			if data_json.get("dataurl"):
				filename = now_str+"-"+data_json.get("filename")
				filedoc = save_file(filename, data_json.get("dataurl"), "VetSupplier", supplier.name, decode=True, is_private=0)
				filedoc.make_thumbnail()
				supplier.update({"image": filedoc.file_url})
			
			supplier.save()
			
			frappe.db.commit()
		else:
			supplier_data = {}
			supplier_data.update(data_json)
			
			if not supplier_data.get("code", False):
				supplier_data.update({'code': ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(10))})
			
			supplier = frappe.new_doc('VetSupplier')
			supplier.update(supplier_data)
			
			if data_json.get("dataurl"):
				filename = now_str+"-"+data_json.get("filename")
				filedoc = save_file(filename, data_json.get("dataurl"), "VetSupplier", supplier.name, decode=True, is_private=0)
				filedoc.make_thumbnail()
				supplier.update({"image": filedoc.file_url})
				
			supplier.insert()
				
			frappe.db.commit()
		
		return {'supplier': supplier}
	except PermissionError as e:
		return {'error': e}