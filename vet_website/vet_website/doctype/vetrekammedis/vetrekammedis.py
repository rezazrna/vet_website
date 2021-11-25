# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
from frappe.model.document import Document
from datetime import date
from dateutil.relativedelta import relativedelta

class VetRekamMedis(Document):
	pass

@frappe.whitelist()
def get_rekam_medis_list(filters=None):
	default_sort = "creation desc"

	rekam_medis_filters = []
	filter_json = False
	page = 1
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
		
	if filter_json:
		sort = filter_json.get('sort', False)
		pet = filter_json.get('pet', False)
		filters_json = filter_json.get('filters', False)
		currentpage = filter_json.get('currentpage', False)

		if currentpage:
			page = currentpage
		
		if filters_json:
			for fj in filters_json:
				rekam_medis_filters.append(fj)
		if sort:
			default_sort = sort
				
		if pet:
			rekam_medis_filters.append({'pet': pet})
	
	try:
		rekam_medis = frappe.get_list("VetRekamMedis", filters=rekam_medis_filters, fields=["*"], order_by=default_sort, start=(page - 1) * 10, page_length= 10)
		datalength = len(frappe.get_all("VetRekamMedis", filters=rekam_medis_filters, as_list=True))
		for r in rekam_medis:
			r['diagnose_name'] = r['diagnosa_utama']
		return {'rekam_medis': rekam_medis, 'datalength': datalength}
		
	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()
def get_name_list(filters=None):

	rekam_medis_filters = []
	filter_json = False
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
		
	if filter_json:
		pet = filter_json.get('pet', False)
		filters_json = filter_json.get('filters', False)

		if filters_json:
			for fj in filters_json:
				rekam_medis_filters.append(fj)
				
		if pet:
			rekam_medis_filters.append({'pet': pet})
	
	try:
		namelist = frappe.get_list("VetRekamMedis", filters=rekam_medis_filters, fields=["*"], as_list=True)

		return list(map(lambda item: item[0], namelist))
		
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
		analisa_layanan_obat = []
		list_product = []
		rekam_medis_search = frappe.get_list("VetRekamMedis", filters={'name': name}, fields=["*"])
		rekam_medis = rekam_medis_search[0]
		attachments = frappe.get_list("VetRekamMedisAttachments", filters={'parent': name}, fields=["*"])
		jasa = frappe.get_list("VetRekamMedisJasa", filters={'parent': name}, fields=["*"])
		obatNoRacikan = frappe.get_list('VetRekamMedisObat', filters={'parent': name, 'racikan': ['=', '']}, fields=['*'])
		obatRacikan = frappe.get_list('VetRekamMedisObat', filters={'parent': name, 'racikan': ['!=', '']}, fields=['*'])
		obat = obatNoRacikan + obatRacikan
		marker = None
		marker_list = frappe.get_list("VetMarker", filters={'name': rekam_medis.marker}, fields=["*"])
		if len(marker_list):
			marker = frappe.get_doc("VetMarker", rekam_medis.marker)
		pet = frappe.get_list('VetPet', filters={'name': rekam_medis.pet}, fields=['status', 'birth_date'])
		now = date.today()
		birth_date = pet[0].birth_date
		if birth_date:
			delta = relativedelta(now, birth_date)
			age_year = delta.years or 0
			age_month = delta.months or 0
			pet_age_string = []
			if age_year != 0:
				pet_age_string.append("%s Tahun"% age_year)
			if age_month != 0:
				pet_age_string.append("%s Bulan"% age_month)
			pet_age = ' '.join(pet_age_string)
		else:
			pet_age = '-'
			
		for j in jasa:
			layanan = {}
			layanan['type'] = 'Jasa'
			layanan['product_name'] = j.product_name
			layanan['quantity'] = j.quantity
			
			analisa_layanan_obat.append(layanan)
			
		for a in obat:
			layanan = {}
			product = frappe.get_list('VetProduct', filters={'name': a['product']}, fields=['*'])
			uom = frappe.get_list('VetUOM', filters={'name': product[0]['product_uom']}, fields=['*'])
			layanan['type'] = 'Obat'
			layanan['product_name'] = product[0]['product_name']
			layanan['quantity'] = a.quantity
			layanan['uom_name'] = uom[0]['uom_name']
			layanan['note'] = a.note
			layanan['apotik_product_name'] = a.name
			layanan['product_racikan'] = []
			
			if (a['racikan']):
				for ap in range(len(list_product)):
					if (list_product[ap]['apotik_product_name'] == a['racikan']):
						list_product[ap]['product_racikan'].append(layanan)
			else :
				list_product.append(layanan)
				
		analisa_layanan_obat = analisa_layanan_obat + list_product
		
		rekam_medis.update({'pet_status': pet[0].status, 'pet_age': pet_age, 'attachments': attachments, 'marker': marker, 'analisa_layanan_obat': analisa_layanan_obat})
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