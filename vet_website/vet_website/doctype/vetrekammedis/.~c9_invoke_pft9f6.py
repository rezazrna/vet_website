# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
from frappe.model.document import Document
from datetime import date 

class VetRekamMedis(Document):
	pass
	
@frappe.whitelist()
def get_rekam_medis_list(filters=None):
	default_sort = "creation desc"

	rekam_medis_filters = {}
	filter_json = False
	
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
		pet = filter_json.get('pet', False)
		
		if search:
			rekam_medis_filters.update({'pet_name': ['like', '%'+search+'%']})
		if sort:
			default_sort = sort
			
		if min_date:
			rekam_medis_filters.update({'record_date': ['>=', min_date]})
		if max_date:
			rekam_medis_filters.update({'record_date': ['<=', max_date]})
		if min_date and max_date:
			rekam_medis_filters.update({'record_date': ['between', [min_date, max_date]]})
				
		if pet:
			rekam_medis_filters.update({'pet': pet})
	
	try:
		rekam_medis = frappe.get_list("VetRekamMedis", filters=rekam_medis_filters, fields=["*"], order_by=default_sort)
		for r in rekam_medis:
			r['diagnose_name'] = r['diagnosa_utama']
			# if r['diagnosa_utama'] != '' and r['diagnosa_utama'] != None:
			# 	diagnosa = frappe.get_list("VetDiagnose", filters={'name': r['diagnosa_utama']}, fields=["diagnose_name"])
			# 	r['diagnose_name'] = diagnosa[0]['diagnose_name']
		return rekam_medis
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def delete_rekam_medis(data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal menghapus rekam medis"}
	
	for d in data_json:
		frappe.delete_doc('VetRekamMedis', d)
		frappe.db.commit()
		
	return {'success': True}

@frappe.whitelist()
def get_all_diagnose():
	try:
		diagnose = frappe.get_list("VetDiagnose", fields=["*"])
		return diagnose
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_rekam_medis(name):
	try:
		rekam_medis_search = frappe.get_list("VetRekamMedis", filters={'name': name}, fields=["*"])
		rekam_medis = rekam_medis_search[0]
		attachments = frappe.get_list("VetTindakanDokterAttachments", filters={'parent': name}, fields=["*"])
		pet = frappe.get_list('VetPet', filters={'name': rekam_medis.pet}, fields=['status', 'birth_date'])
		now = date.today()
		birth_date = pet[0].birth_date
		if (birth_date):
			age_year = now.year - birth_date.year
			age_month = now.month - birth_date.month
			if now.day < birth_date.day:
				age_month -= 1
				while age_month < 0:
					age_month += 12
					age_year -= 1
					
			if age_month != 0:
				pet_age = str(age_year) + ' Tahun ' + str(age_year) + ' Bulan'
			else:
				pet_age = str(age_year) + ' Tahun'
		else:
			pet_age = '0 Tahun'
		rekam_medis.update({'pet_status': pet[0].status, 'pet_age': pet_age})
		return rekam_medis
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_rekam_medis_form(name):
	try:
		rekam_medis = get_rekam_medis(name)
		diagnose = get_all_diagnose()
		data = {'rekam_medis': rekam_medis, 'diagnose': diagnose}
		return data
		
	except PermissionError as e:
		return {'error': e}













































































































































































