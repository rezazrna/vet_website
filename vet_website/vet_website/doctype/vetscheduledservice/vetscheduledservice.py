# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
import pytz
from datetime import datetime as dt
from frappe.model.document import Document
from frappe.utils import data

class VetScheduledService(Document):
	pass

@frappe.whitelist()
def get_scheduled_service_list(filters=None):
	default_sort = "schedule_date asc"
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
		scheduled = frappe.get_list("VetScheduledService", or_filters=scheduled_or_filters, filters=scheduled_filters, fields=["*"], order_by=default_sort, start=(page - 1) * 30, page_length= 30)
		datalength = len(frappe.get_all("VetScheduledService", or_filters=scheduled_or_filters, filters=scheduled_filters, as_list=True))

		pet_type_list = frappe.get_all("VetPetType")

		return {'scheduled': scheduled, 'datalength': datalength, 'pet_type_list': pet_type_list}
		
	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()
def create_scheduled_service(data):
	tz = pytz.timezone("Asia/Jakarta")
	now = dt.now(tz)
	data_json = json.loads(data)

	scheduled_service_data = {
		'create_date': dt.strftime(now, "%Y-%m-%d %H:%M:%S"),
		# 'register_number': tindakan_dokter.register_number,
		# 'pet': tindakan_dokter.pet,
		# 'service': 'Dokter',
		'user': frappe.session.user,
		# 'description': action.note,
		# 'schedule_date': action.date,
	}

	scheduled_service_data.update(data_json)

	new_scheduled_service = frappe.new_doc("VetScheduledService")
	new_scheduled_service.update(scheduled_service_data)
	new_scheduled_service.insert()

	return True

@frappe.whitelist()
def get_scheduled_service(parent):
	layanan_berjadwal_list = frappe.get_list("VetScheduledService", filters={'register_number': parent}, fields=["*"], page_length=1)
	layanan_berjadwal = None
	if layanan_berjadwal_list:
		layanan_berjadwal = layanan_berjadwal_list[0]

	return layanan_berjadwal

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