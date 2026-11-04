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
			rekam_medis_or_filters.append({'description': ['like', '%'+search+'%']})
			rekam_medis_or_filters.append({'action': ['like', '%'+search+'%']})
			rekam_medis_or_filters.append({'diagnosa_utama': ['like', '%'+search+'%']})
			obat_parents = frappe.db.sql_list("""select distinct o.parent from `tabVetRekamMedisObat` o
				join `tabVetProduct` p on p.name = o.product
				where o.parenttype = 'VetRekamMedis' and p.product_name like %s""", ('%'+search+'%',))
			# Filter like pada field Datetime lewat get_list tidak pernah cocok di Frappe v12, jadi cari tanggal lewat SQL
			# (format 2026-11-03 maupun 03-11-2026)
			date_parents = frappe.db.sql_list("""select name from `tabVetRekamMedis`
				where cast(record_date as char) like %s or date_format(record_date, '%%d-%%m-%%Y') like %s""", ('%'+search+'%', '%'+search+'%'))
			if obat_parents or date_parents:
				rekam_medis_or_filters.append({'name': ['in', list(set(obat_parents + date_parents))]})
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
		obat_list = {}
		if rekam_medis:
			obat_rows = frappe.db.sql("""select o.parent, o.quantity, p.product_name, p.uom_name from `tabVetRekamMedisObat` o
				left join `tabVetProduct` p on p.name = o.product
				where o.parenttype = 'VetRekamMedis' and ifnull(o.racikan, '') = '' and o.parent in %s
				order by o.idx""", ([r['name'] for r in rekam_medis],), as_dict=True)
			for o in obat_rows:
				quantity = ('%f' % (o.quantity or 0)).rstrip('0').rstrip('.')
				obat_list.setdefault(o.parent, []).append(' '.join(i for i in [o.product_name or '', quantity, o.uom_name or ''] if i))

		for r in rekam_medis:
			r['diagnose_name'] = r['diagnosa_utama']
			r['obat_list'] = ', '.join(obat_list.get(r['name'], []))

		service_list = frappe.get_list("VetService", fields=["name","service_name"])

		return {'rekam_medis': rekam_medis, 'datalength': datalength, 'service_list': service_list}
		
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
	conditions = ["ci.is_refund = 0", "(l.product_name like %(defensor)s or l.product_name like %(rabisin)s)"]
	values = {'defensor': '%Defensor%', 'rabisin': '%Rabisin%'}

	filter_json = False
	page = 1

	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False

	if filter_json:
		search = filter_json.get('search', False)
		min_date = filter_json.get('min_date', False)
		max_date = filter_json.get('max_date', False)
		currentpage = filter_json.get('currentpage', False)

		if search:
			conditions.append("ci.owner_name like %(search)s")
			values['search'] = '%'+search+'%'

		if currentpage:
			page = int(currentpage)

		if min_date and max_date:
			# invoice_date berupa datetime: sertakan seluruh hari terakhir
			conditions.append("ci.invoice_date >= %(min_date)s and ci.invoice_date < %(max_date)s + interval 1 day")
			values.update({'min_date': min_date, 'max_date': max_date})

	from_where = """
		from `tabVetCustomerInvoiceLine` l
		join `tabVetCustomerInvoice` ci on ci.name = l.parent
		left join `tabVetPetOwner` po on po.name = ci.owner
		where """ + " and ".join(conditions)

	try:
		limit = ""
		if not all:
			limit = " limit %d offset %d" % (30, (page - 1) * 30)

		response = frappe.db.sql("""
			select ci.invoice_date, ci.owner, ci.owner_name, ci.pet_name, po.address
			""" + from_where + """
			order by ci.invoice_date asc, ci.name asc, l.idx asc""" + limit, values, as_dict=True)
		datalength = frappe.db.sql("select count(*) " + from_where, values)[0][0]

		return {'data': response, 'datalength': datalength}

	except PermissionError as e:
		return {'error': e}