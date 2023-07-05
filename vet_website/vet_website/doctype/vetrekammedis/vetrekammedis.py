# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
from urllib import response
import frappe
import json
import pytz
from frappe.model.document import Document
from datetime import datetime
from dateutil.relativedelta import relativedelta


class VetRekamMedis(Document):
	pass

@frappe.whitelist()
def get_rekam_medis_list(filters=None, no_pagination=False):
	default_sort = "creation desc"

	rekam_medis_filters = []
	rekam_medis_or_filters = []
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
		search = filter_json.get('search', False)

		if currentpage:
			page = currentpage
		
		if filters_json:
			for fj in filters_json:
				rekam_medis_filters.append(fj)
		if search:
			rekam_medis_or_filters.append({'name': ['like', '%'+search+'%']})
			rekam_medis_or_filters.append({'service': ['like', '%'+search+'%']})
			rekam_medis_or_filters.append({'pet_name': ['like', '%'+search+'%']})
			rekam_medis_or_filters.append({'pet_owner_name': ['like', '%'+search+'%']})
			rekam_medis_or_filters.append({'nama_dokter': ['like', '%'+search+'%']})
		if sort:
			default_sort = sort
				
		if pet:
			rekam_medis_filters.append({'pet': pet})
	
	try:
		if no_pagination:
			rekam_medis = frappe.get_list("VetRekamMedis", or_filters=rekam_medis_or_filters, filters=rekam_medis_filters, fields=["*"], order_by=default_sort)
			datalength = 0
		else:
			rekam_medis = frappe.get_list("VetRekamMedis", or_filters=rekam_medis_or_filters, filters=rekam_medis_filters, fields=["*"], order_by=default_sort, start=(page - 1) * 10, page_length= 10)
			datalength = len(frappe.get_all("VetRekamMedis", or_filters=rekam_medis_or_filters, filters=rekam_medis_filters, as_list=True))
		for r in rekam_medis:
			r['diagnose_name'] = r['diagnosa_utama']
		return {'rekam_medis': rekam_medis, 'datalength': datalength}
		
	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()
def get_name_list(filters=None):
	default_sort = "creation desc"

	rekam_medis_filters = []
	rekam_medis_or_filters = []
	filter_json = False
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
		
	if filter_json:
		sort = filter_json.get('sort', False)
		pet = filter_json.get('pet', False)
		filters_json = filter_json.get('filters', False)
		search = filter_json.get('search', False)

		if filters_json:
			for fj in filters_json:
				rekam_medis_filters.append(fj)
				
		if pet:
			rekam_medis_filters.append({'pet': pet})

		if search:
			rekam_medis_or_filters.append({'name': ['like', '%'+search+'%']})
			rekam_medis_or_filters.append({'service': ['like', '%'+search+'%']})
			rekam_medis_or_filters.append({'pet_name': ['like', '%'+search+'%']})
			rekam_medis_or_filters.append({'pet_owner_name': ['like', '%'+search+'%']})
			rekam_medis_or_filters.append({'nama_dokter': ['like', '%'+search+'%']})
		if sort:
			default_sort = sort
	
	try:
		namelist = frappe.get_list("VetRekamMedis", or_filters=rekam_medis_or_filters, filters=rekam_medis_filters, fields=["*"], order_by=default_sort, as_list=True)

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
		tz = pytz.timezone("Asia/Jakarta")
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
		now = datetime.now(tz).today()
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

@frappe.whitelist()
def get_rabies(filters=None, mode=False, all=False):
	invoice_filters = {'is_refund': False}
	line_or_filters = {'product_name': ['like', '%Rabies%'], 'product_name': ['like', '%Defensor%'], 'product_name': ['like', '%Rabisin%']}
	line_filters = {}

	filter_json = False
	page = 1
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
		
	if filter_json:
		search = filter_json.get('search', False)
		invoice_date = filter_json.get('invoice_date', False)
		currentpage = filter_json.get('currentpage', False)
		
		if search:
			invoice_filters.update({'owner_name': ['like', '%'+search+'%']})

		if currentpage:
			page = currentpage

		if invoice_date:
			if mode == 'monthly' or mode == 'period':
				max_date_dt = datetime.strptime(invoice_date, '%Y-%m-%d') - relativedelta(days=1)
			else:
				max_date_dt = datetime.strptime(invoice_date, '%Y-%m-%d')

			if mode == 'monthly':
				min_date = (max_date_dt).strftime('%Y-%m-01')
			else:
				min_date = max_date_dt.strftime('%Y-01-01')
			invoice_filters.update({'invoice_date': ['between', [min_date, max_date_dt.strftime('%Y-%m-%d')]]})
	
	try:
		invoices = frappe.get_list("VetCustomerInvoice", filters=invoice_filters, fields=['name'])
		invoice_names = list(j.name for j in invoices)

		line_filters.update({'parent': ['in', invoice_names]})

		if all:
			lines = frappe.get_list("VetCustomerInvoiceLine", or_filters=line_or_filters, filters=line_filters, fields=['parent'])
		else: 
			lines = frappe.get_list("VetCustomerInvoiceLine", or_filters=line_or_filters, filters=line_filters, fields=['parent'], start=(page - 1) * 30, page_length= 30)
		datalength = len(frappe.get_list("VetCustomerInvoiceLine", or_filters=line_or_filters, filters=line_filters, fields=['parent'], as_list=True))

		response = []
		for l in lines:
			invoice_date, owner, owner_name, pet_name = frappe.db.get_value('VetCustomerInvoice', l['parent'], ['invoice_date', 'owner', 'owner_name', 'pet_name'])
			obj = {'invoice_date': invoice_date, 'owner': owner, 'owner_name': owner_name, 'pet_name': pet_name}
			address = frappe.db.get_value('VetPetOwner', owner, 'address')
			obj['address'] = address
			response.append(obj)
			
		return {'data': response, 'datalength': datalength}
		
	except PermissionError as e:
		return {'error': e}