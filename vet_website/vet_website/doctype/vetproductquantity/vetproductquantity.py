# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
from frappe.model.document import Document

class VetProductQuantity(Document):
	pass

@frappe.whitelist()
def get_quantity_list(filters=None, all_page=False, valuation=False):
	default_sort = "creation desc"
	td_filters = []
	filter_json = False
	group_by = False
	page = 1
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
		
	if filter_json:
		sort = filter_json.get('sort', False)
		filters_json = filter_json.get('filters', False)
		gudang = filter_json.get('gudang', False)
		product = filter_json.get('product', False)
		group_by_json = filter_json.get('group_by', False)
		currentpage = filter_json.get('currentpage', False)

		if currentpage:
			page = currentpage
		
		if filters_json:
			for fj in filters_json:
				td_filters.append(fj)
		if sort:
			default_sort = sort
		if gudang:
			td_filters.append({'gudang': gudang})
		if product:
			td_filters.append({'product': product})
		if group_by_json:
			group_by = group_by_json
			
	try:
		stockable_product_category = frappe.get_list("VetProductCategory", filters={'stockable': True}, fields=['name'])
		stockable_product = frappe.get_list("VetProduct", filters={'product_category': ['in', list(pc.name for pc in stockable_product_category)]}, fields=['name'])
		
		datalength = 0
		if all_page:
			product_quantity_search = frappe.get_list("VetProductQuantity", filters=td_filters, fields=["*"], order_by=default_sort, group_by=group_by)
			product_quantity = list(pqs for pqs in product_quantity_search if pqs.product in list(sp.name for sp in stockable_product))
		else:
			product_quantity_search = frappe.get_list("VetProductQuantity", filters=td_filters, fields=["*"], order_by=default_sort, group_by=group_by, start=(page - 1) * 10, page_length= 10)
			product_quantity = list(pqs for pqs in product_quantity_search if pqs.product in list(sp.name for sp in stockable_product))
			datalength = len(frappe.get_all("VetProductQuantity", filters=td_filters, as_list=True))

		for pq in product_quantity:
			product = frappe.get_doc('VetProduct', pq.product)
			if(group_by == 'product'):
				filters2 = {'product': pq.product}
				if gudang:
					filters2.update({'gudang': gudang})
				quantity_list = frappe.get_list("VetProductQuantity", filters=filters2, fields=["sum(quantity) as total_quantity"], order_by="creation desc")
				pq.update({'quantity': quantity_list[0].total_quantity, 'total_value': quantity_list[0].total_quantity*product.price})
			elif(group_by == 'gudang'):
				quantity_list = frappe.get_list("VetProductQuantity", filters={'product': pq.product, 'gudang': pq.gudang}, fields=["sum(quantity) as total_quantity"], order_by="creation desc")
				pq.update({'quantity': quantity_list[0].total_quantity, 'total_value': quantity_list[0].total_quantity*product.price})
			if valuation and product:
				purchase_list_search = frappe.get_list("VetPurchaseProducts", filters={'product': pq.product}, fields=["*"], order_by="creation desc")
				purchase_list = (pl for pl in purchase_list_search if pl.quantity_stocked)
				pq.update({'product': product, 'purchase_list': purchase_list})
				
			pq.update({'product': product})
			
		return {'product_quantity': product_quantity, 'datalength': datalength}
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_product_quantity(warehouse, product):
	quantity = frappe.db.get_value('VetProductQuantity', {'product': product, 'gudang': warehouse}, 'quantity') or 0
	return quantity
