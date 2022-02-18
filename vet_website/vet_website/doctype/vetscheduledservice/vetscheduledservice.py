# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
from frappe.model.document import Document
from frappe.utils import data

class VetScheduledService(Document):
	pass

@frappe.whitelist()
def get_scheduled_service_list(filters=None):
	default_sort = "creation desc"
	scheduled_filters = []
	scheduled_or_filters = []
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
		pet = filter_json.get('pet', False)
		currentpage = filter_json.get('currentpage', False)
		search = filter_json.get('search', False)

		if currentpage:
			page = currentpage
		
		if filters_json:
			for fj in filters_json:
				scheduled_filters.append(fj)
		if search:
			scheduled_or_filters.append({'pet': ['like', '%'+search+'%']})
			scheduled_or_filters.append({'pet_name': ['like', '%'+search+'%']})
			scheduled_or_filters.append({'register_number': ['like', '%'+search+'%']})
			scheduled_or_filters.append({'pet_owner_name': ['like', '%'+search+'%']})
			scheduled_or_filters.append({'pet_owner_phone': ['like', '%'+search+'%']})
			scheduled_or_filters.append({'type_name': ['like', '%'+search+'%']})
			# scheduled_or_filters.append({'service': ['like', '%'+search+'%']})
			scheduled_or_filters.append({'status': ['like', '%'+search+'%']})
		if sort:
			default_sort = sort
			
		if pet:
			scheduled_filters.append({'pet': pet})
	
	try:
		scheduled = frappe.get_list("VetScheduledService", or_filters=scheduled_or_filters, filters=scheduled_filters, fields=["create_date", "pet", "pet_name", "pet_owner_name", "service", "schedule_date", "status", "register_number", "pet_owner_phone", "type_name", "name"], order_by=default_sort, start=(page - 1) * 10, page_length= 10)
		datalength = len(frappe.get_all("VetScheduledService", or_filters=scheduled_or_filters, filters=scheduled_filters, as_list=True))
		return {'scheduled': scheduled, 'datalength': datalength}
		
	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()
def delete_scheduled_service(data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal menghapus layanan berjadwal"}
	
	for d in data_json:
		frappe.delete_doc('VetScheduledService', d)
		frappe.db.commit()
		
	return {'success': True}