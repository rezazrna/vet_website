# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
import math
import pytz
from datetime import datetime as dt
from frappe.utils.file_manager import save_file, remove_file_by_url
from frappe.model.document import Document
from vet_website.vet_website.doctype.vetproduct.vetproduct import get_product
from vet_website.vet_website.doctype.vetproductpack.vetproductpack import get_pack_price
from vet_website.methods import get_current_user
from dateutil.relativedelta import relativedelta as rd

class VetTindakanDokter(Document):
	pass

@frappe.whitelist()
def get_tindakan_dokter_list(filters=None):
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
			td_or_filters.append({'pet': ['like', '%'+search+'%']})
			td_or_filters.append({'pet_name': ['like', '%'+search+'%']})
			td_or_filters.append({'pet_owner_name': ['like', '%'+search+'%']})
			td_or_filters.append({'description': ['like', '%'+search+'%']})
			td_or_filters.append({'status': ['like', '%'+search+'%']})
		if sort:
			default_sort = sort
		
	try:
		tindakan_dokter = frappe.get_list("VetTindakanDokter", or_filters=td_or_filters,  filters=td_filters, fields=["*"], order_by=default_sort, start=(page - 1) * 10, page_length= 10)
		datalength = len(frappe.get_all("VetTindakanDokter", or_filters=td_or_filters, filters=td_filters, as_list=True))
		for td in tindakan_dokter:
			td.queue = frappe.db.get_value('VetReception', td.reception, 'queue')
		return {'tindakan_dokter': tindakan_dokter, 'datalength': datalength}
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_name_list(filters=None):
	default_sort = "creation desc"
	td_filters = []
	td_or_filters = []
	filter_json = False
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
		
	if filter_json:
		sort = filter_json.get('sort', False)
		filters_json = filter_json.get('filters', False)
		search = filter_json.get('search', False)
		
		if filters_json:
			for fj in filters_json:
				td_filters.append(fj)

		if search:
			td_or_filters.append({'pet': ['like', '%'+search+'%']})
			td_or_filters.append({'pet_name': ['like', '%'+search+'%']})
			td_or_filters.append({'pet_owner_name': ['like', '%'+search+'%']})
			td_or_filters.append({'description': ['like', '%'+search+'%']})
			td_or_filters.append({'status': ['like', '%'+search+'%']})

		if sort:
			default_sort = sort
		
	try:
		namelist = frappe.get_all("VetTindakanDokter", or_filters=td_or_filters, filters=td_filters, order_by=default_sort, as_list=True)
		
		return list(map(lambda item: item[0], namelist))
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_tindakan_dokter(name):
	try:
		tindakan_dokter_search = frappe.get_list("VetTindakanDokter", filters={'name': name}, fields=["*"])
		tindakan_dokter = tindakan_dokter_search[0]
		layanan_berjadwal = frappe.get_list("VetTindakanDokterAction", filters={'parent': name}, fields=["*"])
		jasa = frappe.get_list("VetTindakanDokterJasa", filters={'parent': name}, fields=["*"])
		tindak_lanjut = frappe.get_list("VetTindakanDokterTindakLanjut", filters={'parent': name}, fields=["*"])
		attachments = frappe.get_list("VetTindakanDokterAttachments", filters={'parent': name}, fields=["*"])
		obatNoRacikan = frappe.get_list('VetTindakanDokterObat', filters={'parent': name, 'racikan': ['=', '']}, fields=['*'])
		obatRacikan = frappe.get_list('VetTindakanDokterObat', filters={'parent': name, 'racikan': ['!=', '']}, fields=['*'])
		template_tindakan = frappe.get_list('VetTemplateTindakan', filters={'register_number': tindakan_dokter.register_number}, fields=['*'])
		
		obat = obatNoRacikan + obatRacikan
		rekam_medis_count = get_rekam_medis_count(tindakan_dokter.pet)
		marker = None
		marker_list = frappe.get_list("VetMarker", filters={'name': tindakan_dokter.marker}, fields=["*"])
		if len(marker_list):
			marker = frappe.get_doc("VetMarker", tindakan_dokter.marker)
		list_product = []
		list_tindakan_template = []
		template_data = {}
		
		if tindakan_dokter.status == 'Done':
			apotik = frappe.get_list('VetApotik', filters={'register_number': tindakan_dokter.register_number}, fields=['name'])
			grooming = frappe.get_list('VetGrooming', filters={'register_number': tindakan_dokter.register_number}, fields=['name'])
			instalasi_medis = frappe.get_list('VetInstalasiMedis', filters={'register_number': tindakan_dokter.register_number}, fields=['name'])
			rawat_inap = frappe.get_list('VetRawatInap', filters={'register_number': tindakan_dokter.register_number}, fields=['name'])
			customer_invoice = frappe.get_list('VetCustomerInvoice', filters={'register_number': tindakan_dokter.register_number}, fields=['name'])
			tindakan_dokter.update({
				'apotik': list(a.name for a in apotik),
				'grooming': list(g.name for g in grooming),
				'instalasi_medis': list(i.name for i in instalasi_medis),
				'rawat_inap': list(r.name for r in rawat_inap),
				'customer_invoice': list(c.name for c in customer_invoice)
			})
		
		for a in obat:
			pr = get_product(a['product'])
			product = frappe.get_list('VetProduct', filters={'name': a['product']}, fields=['*'])
			uom = frappe.get_list('VetUOM', filters={'name': product[0]['product_uom']}, fields=['*'])
			product[0]['quantity'] = a['quantity']
			product[0]['note'] = a['note']
			product[0]['uom_name'] = uom[0]['uom_name']
			product[0]['apotik_product_name'] = a['name']
			product[0]['product_racikan'] = []
			product[0]['product_category'] = pr.get('product').get('product_category')
			
			if (a['racikan']):
				for ap in range(len(list_product)):
					if (list_product[ap]['apotik_product_name'] == a['racikan']):
						list_product[ap]['product_racikan'].append(product[0])
			else :
				list_product.append(product[0])
				
		if template_tindakan:
			template_tindakan_products = frappe.get_list('VetTemplateTindakanProducts', filters={'parent': template_tindakan[0]['name']}, fields=['*'])
			for t in template_tindakan_products:
				if t.product:
					pr = get_product(t.product)
					productTemplate = frappe.get_list('VetProduct', filters={'name': t.product}, fields=['*'])
					uom = frappe.get_list('VetUOM', filters={'name': productTemplate[0]['product_uom']}, fields=['*'])
					productTemplate[0]['quantity_template'] = t.quantity
					productTemplate[0]['description'] = t.description
					productTemplate[0]['uom_name'] = uom[0].uom_name
					productTemplate[0]['pagi'] = t.pagi
					productTemplate[0]['siang'] = t.siang
					productTemplate[0]['sore'] = t.sore
					productTemplate[0]['malam'] = t.malam
					productTemplate[0]['product_category'] = pr.get('product').get('product_category')
				
					list_tindakan_template.append(productTemplate[0])
				else:
					t.tindakan_name = t.name
					list_tindakan_template.append(t)
				
			template_tindakan[0].tindakan = list_tindakan_template
			
			template_data = template_tindakan[0]
			
		for t in tindak_lanjut:
			pr = get_product(t.product)
			t.product = pr.get('product')
			t.product_category = pr.get('product').get('product_category')
			t.is_rawat = pr.get('product').get('product_category').get('is_rawat')
			t.is_grooming = pr.get('product').get('product_category').get('is_grooming')

		list_dokter = []
		if tindakan_dokter.status == 'Draft':
			dokter_role = frappe.get_list('VetRole', filters={'is_dokter': True}, fields=['name'])
			dokter_role_names = list(map(lambda r: r.name, dokter_role))
			users = frappe.get_list('VetRoleUser', filters={'parent': ['in', dokter_role_names]}, fields=['user'], group_by="user")
			user_names = list(map(lambda u: u.user, users))
			list_dokter = frappe.get_list('User', filters={'name': ['in', user_names]}, fields=['name', 'full_name'])
		
		tindakan_dokter.update({
			'jasa': jasa,
			'tindak_lanjut': tindak_lanjut,
			'layanan_berjadwal': layanan_berjadwal,
			'rekam_medis_count': rekam_medis_count,
			'attachments': attachments,
			'obat': list_product,
			'marker': marker,
			'template_data': template_data,
			'list_dokter': list_dokter,
		})

		tindakan_dokter.update({'queue': frappe.db.get_value('VetReception', tindakan_dokter.reception, 'queue')})
		return tindakan_dokter
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_all_products():
	try:
		products = frappe.get_list("VetProduct", fields=["*"])
		for p in products:
			product_category_search = frappe.get_list("VetProductCategory", filters={'name': p.product_category}, fields=['*'])
			if len(product_category_search) != 0:
				p.update({'product_category': product_category_search[0]})
			product_quantity_search = frappe.get_list('VetProductQuantity', filters={'product': p.name}, fields=['sum(quantity) as available_quantity'])
			if len(product_quantity_search) != 0:
				p.update({'available_quantity': product_quantity_search[0].available_quantity})
			product_uom_search = frappe.get_list('VetUOM', filters={'name': p.product_uom}, fields=['uom_name'])
			if len(product_uom_search) != 0:
				p.update({'product_uom_name': product_uom_search[0].uom_name})
		return products
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_tindakan_dokter_form(name=False):
	try:
		if not name:
			data_dokter = {'status': 'Draft'}
		else:
			data_dokter = get_tindakan_dokter(name)
		# products = get_all_products()
		# products = []
		# data = {'dokter': data_dokter, 'products': products}
		data = {'dokter': data_dokter}
		if not name:
			pet_owners = frappe.get_list('VetPetOwner', fields=['*'])
			for po in pet_owners:
				pet = frappe.get_list('VetPet', filters={'status': 'Active'}, fields=['*'])
				po.pets = pet

			dokter_role = frappe.get_list('VetRole', filters={'is_dokter': True}, fields=['name'])
			dokter_role_names = list(map(lambda r: r.name, dokter_role))
			users = frappe.get_list('VetRoleUser', filters={'parent': ['in', dokter_role_names]}, fields=['user'], group_by="user")
			user_names = list(map(lambda u: u.user, users))
			list_dokter = frappe.get_list('User', filters={'name': ['in', user_names]}, fields=['name', 'full_name'])

			data.update({'pet_owners': pet_owners, 'list_dokter': list_dokter})
		return data
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def delete_tindakan_dokter(data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal menghapus penerimaan"}
	
	for d in data_json:
		frappe.delete_doc('VetTindakanDokter', d)
		frappe.db.commit()
		
	return {'success': True}
	
@frappe.whitelist()
def get_rekam_medis_count(pet):
	try:
		rekam_medis_count = frappe.db.count("VetRekamMedis", {'pet': pet})
		return rekam_medis_count
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def send_to_apotik(data):
	try:
		data_json = json.loads(data)
		data_check = frappe.get_list("VetTindakanDokter", filters={'name': data_json.get('name')}, fields=['name', 'status'])
		if data_check and data_check[0].status == 'Draft':
			tindakan_dokter = frappe.get_doc("VetTindakanDokter", data_check[0].name)
			tindakan_dokter.reload()
			
			if data_json.get("obat"):
				apotik = frappe.new_doc('VetApotik')
				apotik.update({'register_number': tindakan_dokter.register_number})
				apotik.insert()
				
				for obat in data_json.get("obat"):
					product_data = {}
					product_data.update(obat)
					product_data.pop('product_racikan')
					product_data.update({'parent': apotik.name, 'parenttype': 'VetApotikProduct', 'parentfield': 'obat'})
	
					new_product = frappe.new_doc("VetApotikProduct")
					new_product.update(product_data)
	
					apotik.obat.append(new_product)
	
					apotik.save()
					
					for pr in obat.get("product_racikan"):
						pr_data = {}
						pr_data.update(pr)
						pr_data.update({'parent': apotik.name, 'parenttype': 'VetApotikProduct', 'parentfield': 'obat', 'racikan': new_product.name})
						
						new_pr = frappe.new_doc("VetApotikProduct")
						new_pr.update(pr_data)
						
						apotik.obat.append(new_pr)
						
						apotik.save()
			return {'tindakan_dokter': tindakan_dokter}
		else:
			return {'error': "Tindakan Dokter tidak ditemukan"}

	except PermissionError as e:
		return {'error': e}
	
@frappe.whitelist()
def confirm_tindakan_dokter(data):
	tz = pytz.timezone("Asia/Jakarta")
	now = dt.now(tz)
	now_str = dt.strftime(now, "%d%m%Y%H%M%S")
	try:
		data_json = json.loads(data)
		
		data_check = frappe.get_list("VetTindakanDokter", filters={'name': data_json.get('name')}, fields=['name', 'status'])
		if data_check and data_check[0].status == 'Draft':
			tindakan_dokter = frappe.get_doc("VetTindakanDokter", data_check[0].name)
			tindakan_dokter.reload()
			tindakan_dokter_data = {}
			tindakan_dokter_data.update(data_json)
			pops = [
			'name','attachment','attachments','jasa', 'list_dokter',
			'layanan_berjadwal','pet','pet_name',
			'pet_owner','pet_owner_name','reception','reception_date',
			'register_number','status','tindak_lanjut', 'obat', 'marker', 'creation', 'modified'
			]
			for p in pops:
				if tindakan_dokter_data.get(p,False):
					tindakan_dokter_data.pop(p)
			tindakan_dokter.update(tindakan_dokter_data)
			if tindakan_dokter.status == 'Draft':
				tindakan_dokter.update({'status': 'Done'})
			tindakan_dokter.save()
			
			# if data_json.get("marker"):
			# 	marker = frappe.new_doc('VetMarker')
			# 	marker.update({'type': data_json.get("marker").get('type'), 'markers':  data_json.get("marker").get('markers')})
			# 	marker.insert()
			# 	tindakan_dokter.update({'marker': marker.name})
			# 	tindakan_dokter.save()
			
			check_apotik = frappe.get_list("VetApotik", filters={'register_number': tindakan_dokter.register_number})
			if not check_apotik and data_json.get("obat"):
				apotik = frappe.new_doc('VetApotik')
				apotik.update({'register_number': tindakan_dokter.register_number})
				apotik.insert()
				
				for obat in data_json.get("obat"):
					product_data = {}
					product_data.update(obat)
					product_data.pop('product_racikan')
					product_data.update({'parent': apotik.name, 'parenttype': 'VetApotikProduct', 'parentfield': 'obat'})
	
					new_product = frappe.new_doc("VetApotikProduct")
					new_product.update(product_data)
	
					apotik.obat.append(new_product)
	
					apotik.save()
					
					for pr in obat.get("product_racikan"):
						pr_data = {}
						pr_data.update(pr)
						pr_data.update({'parent': apotik.name, 'parenttype': 'VetApotikProduct', 'parentfield': 'obat', 'racikan': new_product.name})
						
						new_pr = frappe.new_doc("VetApotikProduct")
						new_pr.update(pr_data)
						
						apotik.obat.append(new_pr)
						
						apotik.save()
						
			if data_json.get('template_data'):
				template_tindakan = frappe.new_doc('VetTemplateTindakan')
				template_tindakan_data = {}
				template_tindakan_data.update(data_json.get('template_data'))
				template_tindakan_data.pop('tindakan')
				if template_tindakan_data.get('tindakan_template', False):
					template_tindakan_data.pop('tindakan_template')
				template_tindakan.update(template_tindakan_data)
				template_tindakan.insert()
				
				for tindakan in data_json.get('template_data').get('tindakan'):
					tindakan_data = {}
					tindakan_data.update(tindakan)
					tindakan_data.update({'parent': template_tindakan.name, 'parenttype': 'VetTemplateTindakan', 'parentfield': 'tindakan'})
		
					new_tindakan = frappe.new_doc("VetTemplateTindakanProducts")
					new_tindakan.update(tindakan_data)
		
					template_tindakan.tindakan.append(new_tindakan)
					template_tindakan.save()
					
				kandang = frappe.get_doc('VetKandang', template_tindakan.cage)
				kandang.register_number = tindakan_dokter.register_number
				kandang.save()
				
			# for obat in data_json.get("obat"):
			# 	product_data = {}
			# 	product_data.update(obat)
			# 	product_data.pop('product_racikan')
			# 	product_data.update({'parent': tindakan_dokter.name, 'parenttype': 'VetTindakanDokter', 'parentfield': 'obat'})

			# 	new_product = frappe.new_doc("VetTindakanDokterObat")
			# 	new_product.update(product_data)

			# 	tindakan_dokter.obat.append(new_product)

			# 	tindakan_dokter.save()
				
			# 	for pr in obat.get("product_racikan"):
			# 		pr_data = {}
			# 		pr_data.update(pr)
			# 		pr_data.update({'parent': tindakan_dokter.name, 'parenttype': 'VetTindakanDokter', 'parentfield': 'obat', 'racikan': new_product.name})
					
			# 		new_pr = frappe.new_doc("VetTindakanDokterObat")
			# 		new_pr.update(pr_data)
					
			# 		tindakan_dokter.obat.append(new_pr)
					
			# 		tindakan_dokter.save()
					
			products_invoice = []
			
			for jasa in data_json.get('jasa'):
			# 	if not jasa.get('name'):
			# 		new_jasa_doc = frappe.new_doc('VetTindakanDokterJasa')
			# 		new_jasa_doc.update(jasa)
			# 		new_jasa_doc.update({'parent': tindakan_dokter.name, 'parenttype': 'VetTindakanDokter', 'parentfield': 'jasa'})
			# 		tindakan_dokter.jasa.append(new_jasa_doc)
			# 		tindakan_dokter.save()
			# 	else:
			# 		if jasa.get('deleted'):
			# 			frappe.delete_doc('VetTindakanDokterJasa', jasa.get('name'))
			# 		else:
			# 			jasa_doc = frappe.get_doc('VetTindakanDokterJasa', jasa.get('name'))
			# 			jasa_doc.reload()
			# 			jasa_doc.update({'product': jasa.get('product'), 'quantity': jasa.get('quantity')})
			# 			jasa_doc.save()
						
				product_data = {
					'product': jasa.get('product'),
					# 'quantity': math.ceil(float(jasa.get('quantity'))),
					'quantity': float(jasa.get('quantity')),
				}
				products_invoice.append(product_data)
						
			# for tindak_lanjut in data_json.get('tindak_lanjut'):
			# 	if not tindak_lanjut.get('name'):
			# 		new_tindak_lanjut_doc = frappe.new_doc('VetTindakanDokterTindakLanjut')
			# 		new_tindak_lanjut_doc.update(tindak_lanjut)
			# 		new_tindak_lanjut_doc.update({'parent': tindakan_dokter.name, 'parenttype': 'VetTindakanDokter', 'parentfield': 'tindak_lanjut'})
			# 		tindakan_dokter.tindak_lanjut.append(new_tindak_lanjut_doc)
			# 		tindakan_dokter.save()
			# 	else:
			# 		if tindak_lanjut.get('deleted'):
			# 			frappe.delete_doc('VetTindakanDokterTindakLanjut', tindak_lanjut.get('name'))
			# 		else:
			# 			tindak_lanjut_doc = frappe.get_doc('VetTindakanDokterTindakLanjut', tindak_lanjut.get('name'))
			# 			tindak_lanjut_doc.reload()
			# 			tindak_lanjut_doc.update({'product': tindak_lanjut.get('product'), 'quantity': tindak_lanjut.get('quantity')})
			# 			tindak_lanjut_doc.save()
						
			# for layanan_berjadwal in data_json.get('layanan_berjadwal'):
			# 	if layanan_berjadwal.get('date') != '' and layanan_berjadwal.get('date') != None:
			# 		if not layanan_berjadwal.get('name'):
			# 			new_layanan_berjadwal_doc = frappe.new_doc('VetTindakanDokterAction')
			# 			new_layanan_berjadwal_doc.update(layanan_berjadwal)
			# 			new_layanan_berjadwal_doc.update({'parent': tindakan_dokter.name, 'parenttype': 'VetTindakanDokter', 'parentfield': 'layanan_berjadwal'})
			# 			tindakan_dokter.layanan_berjadwal.append(new_layanan_berjadwal_doc)
			# 			tindakan_dokter.save()
			# 		else:
			# 			layanan_berjadwal_doc = frappe.get_doc('VetTindakanDokterAction', layanan_berjadwal.get('name'))
			# 			layanan_berjadwal_doc.reload()
			# 			layanan_berjadwal_doc.update({'date': layanan_berjadwal.get('date'), 'note': layanan_berjadwal.get('note')})
			# 			layanan_berjadwal_doc.save()
					
			# for attachment in data_json.get('attachments'):
			# 	if not attachment.get('name'):
			# 		new_attachment_doc = frappe.new_doc('VetTindakanDokterAttachments')
			# 		filename = now_str+"-"+tindakan_dokter.name+"-"+attachment.get("filename")
			# 		filedoc = save_file(filename, attachment.get("dataurl"), "VetTindakanDokter", tindakan_dokter.name, decode=True, is_private=0)
			# 		new_attachment_doc.update({'title': attachment.get('title'), "attachment": filedoc.file_url, 'parent': tindakan_dokter.name, 'parenttype': 'VetTindakanDokter', 'parentfield': 'attachments'})
			# 		tindakan_dokter.attachments.append(new_attachment_doc)
			# 		tindakan_dokter.save()
			# 	else:
			# 		if attachment.get('deleted'):
			# 			frappe.delete_doc('VetTindakanDokterAttachments', attachment.get('name'))
			
			rekam_medis = frappe.new_doc('VetRekamMedis')
			rekam_medis_data = {}
			rekam_medis_data.update(data_json)
			pops_rekam_medis = [
				'attachments', 'creation', 'docstatus', 'idx', 'jasa', 'layanan_berjadwal', 'modified', 'modified_by', 'owner', 'parent', 'parentfield', 'parenttype',
				'pet_name', 'pet_owner', 'pet_owner_name', 'pulse', 'reception_date', 'rekam_medis_count', 'respirasi', 'status', 'tindak_lanjut', 'obat', 'marker', 'list_dokter'
			]
				
			for p in pops_rekam_medis:
				if rekam_medis_data.get(p,False):
					rekam_medis_data.pop(p)
			rekam_medis_data.update({'service': 'Dokter', 'record_date': dt.strftime(dt.now(tz), "%Y-%m-%d %H:%M:%S")})
			rekam_medis_data.update({'attachments': tindakan_dokter.attachments, 'marker': tindakan_dokter.marker})
			rekam_medis.update(rekam_medis_data)
			rekam_medis.save()
			
			for jasa in data_json.get('jasa'):
				new_jasa_doc = frappe.new_doc('VetRekamMedisJasa')
				new_jasa_doc.update(jasa)
				new_jasa_doc.update({'parent': rekam_medis.name, 'parenttype': 'VetRekamMedis', 'parentfield': 'jasa'})
				rekam_medis.jasa.append(new_jasa_doc)
				rekam_medis.save()
				
			for obat in data_json.get('obat'):
				product_data = {}
				product_data.update(obat)
				product_data.pop('product_racikan')
				product_data.update({'parent': rekam_medis.name, 'parenttype': 'VetRekamMedis', 'parentfield': 'obat'})

				new_product = frappe.new_doc("VetRekamMedisObat")
				new_product.update(product_data)

				rekam_medis.obat.append(new_product)

				rekam_medis.save()
				
				for pr in obat.get("product_racikan"):
					pr_data = {}
					pr_data.update(pr)
					pr_data.update({'parent': rekam_medis.name, 'parenttype': 'VetRekamMedis', 'parentfield': 'obat', 'racikan': new_product.name})
					
					new_pr = frappe.new_doc("VetRekamMedisObat")
					new_pr.update(pr_data)
					
					rekam_medis.obat.append(new_pr)
					
					rekam_medis.save()
				
			
			if len(tindakan_dokter.tindak_lanjut) != 0:
				
				filtered_grooming = []
				filtered_operation = []
				for i in tindakan_dokter.tindak_lanjut:
					is_grooming = frappe.db.get_value('VetProductCategory', i.product_category, 'is_grooming')
					is_rawat = frappe.db.get_value('VetProductCategory', i.product_category, 'is_rawat')
					if not is_grooming and not is_rawat:
						filtered_operation.append(i)
					elif is_grooming:
						filtered_grooming.append(i)
						
				# filtered_tindak_lanjut = [i for i in tindakan_dokter.tindak_lanjut if not i.is_rawat and not i.is_grooming]
				if len(filtered_operation) > 0:
					instalasi_medis = frappe.new_doc('VetInstalasiMedis')
					instalasi_medis_data = {
						'register_number': tindakan_dokter.register_number,
						'date': dt.now(tz).strftime('%Y-%m-%d'),
						'service': 'Operasi',
						'reference': 'Dokter',
						# 'condition': tindakan_dokter.condition,
						'temperature': tindakan_dokter.temperature,
						'weight': tindakan_dokter.weight,
						'jasa': filtered_operation,
					}
					instalasi_medis.update(instalasi_medis_data)
					instalasi_medis.save()
					
				if len(filtered_grooming) > 0:
					grooming = frappe.new_doc("VetGrooming")
					grooming.update({'reception': tindakan_dokter.reception, 'products': list({'product': p.product, 'quantity': p.quantity} for p in filtered_grooming)})
		
					grooming.insert()
					frappe.db.commit()
				
			for action in tindakan_dokter.layanan_berjadwal:
				now = dt.now(tz)
				scheduled_service_data = {
					'create_date': dt.strftime(now, "%Y-%m-%d %H:%M:%S"),
					'register_number': tindakan_dokter.register_number,
					'pet': tindakan_dokter.pet,
					'service': 'Dokter',
					'user': data_json.get('dokter'),
					'description': action.note,
					'schedule_date': action.date,
				}

				new_scheduled_service = frappe.new_doc("VetScheduledService")
				new_scheduled_service.update(scheduled_service_data)
				new_scheduled_service.insert()
			
			tindakan_dokter.reload()
				
			for tl in tindakan_dokter.tindak_lanjut:
				product_category = frappe.db.get_value('VetProduct', tl.product, 'product_category')
				is_rawat = frappe.db.get_value('VetProductCategory', product_category, 'is_rawat')
				if is_rawat == 1:
					rawat_inap_data = {
						'register_number': tindakan_dokter.register_number,
						'service': 'Dokter',
						'cage': data_json.get('template_data').get('cage')
					}
	
					new_rawat_inap = frappe.new_doc("VetRawatInap")
					new_rawat_inap.update(rawat_inap_data)
					new_rawat_inap.insert()

			invoice_data = {
				'register_number': tindakan_dokter.register_number,
				'pet': tindakan_dokter.pet,
				'products': products_invoice,
				'dokter': tindakan_dokter.dokter,
			}

			add_invoice(json.dumps(invoice_data), tindakan_dokter.name)
			
			return {'tindakan_dokter': tindakan_dokter}

		else:
			return {'error': "Tindakan Dokter tidak ditemukan"}

	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def add_invoice(invoice_data, name):
	try:
		tz = pytz.timezone("Asia/Jakarta")

		tindakan_dokter_check = frappe.get_list("VetTindakanDokter", filters={'name': name}, fields=['name'])

		if tindakan_dokter_check:
			invoice_json = json.loads(invoice_data)

			invoice = frappe.new_doc("VetCustomerInvoice")
			now = dt.now(tz)
			now_1_hour = now + rd(hour=1)
			invoice_date = dt.strftime(now, "%Y-%m-%d %H:%M:%S")
			due_date = dt.strftime(now_1_hour, "%Y-%m-%d %H:%M:%S")

			new_invoice_data = {
				'register_number': invoice_json.get('register_number'),
				'pet': invoice_json.get('pet'),
				'user': invoice_json.get('dokter'),
				'invoice_date': invoice_date,
				'due_date': due_date,
				'origin': invoice_json.get('register_number'),
			}
			invoice.update(new_invoice_data)
			invoice.insert()

			subtotal = 0

			for product in invoice_json.get('products'):
				product_data = {}
				product_data.update(product)
				product_data.update({'parent': invoice.name, 'parenttype': 'VetCustomerInvoice', 'parentfield': 'invoice_line', 'service': 'Jasa'})

				new_product = frappe.new_doc("VetCustomerInvoiceLine")
				new_product.update(product_data)
				new_product.insert()
				check_pack = frappe.get_list('VetProductPack', filters={'parent': new_product.product}, fields=['harga_pack', 'quantity_pack'])
				selected_pack = [i for i in check_pack if i['quantity_pack'] <= math.ceil(new_product.quantity)]
				# selected_pack = [i for i in check_pack if i['quantity_pack'] <= new_product.quantity]
				selected_pack.sort(key=lambda a: a.quantity_pack, reverse=True)
				if selected_pack:
					total = get_pack_price(float(math.ceil(new_product.quantity)), float(new_product.unit_price), selected_pack[0]['quantity_pack'], selected_pack[0]['harga_pack'])
					# total = get_pack_price(float(new_product.quantity), float(new_product.unit_price), selected_pack[0]['quantity_pack'], selected_pack[0]['harga_pack'])
					new_product.update({'total': total})
				else:
					new_product.update({'total': float(new_product.unit_price) * math.ceil(float(new_product.quantity))})
					# new_product.update({'total': float(new_product.unit_price) * float(new_product.quantity)})
				new_product.save()

				subtotal += new_product.total

				invoice.invoice_line.append(new_product)

				invoice.save()

			invoice.update({'subtotal': subtotal, 'total': subtotal})
			invoice.save()

			return {'invoice': invoice}

		else:
			# frappe.msgprint("Grooming tidak ditemukan")
			return {'error': "Grooming tidak ditemukan"}

	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def cancel_tindakan_dokter(name):
	try:
		t = frappe.get_doc('VetTindakanDokter', name)
		t.status = 'Cancel'
		t.save()
		frappe.db.commit()
		return {'success': True}
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def autosave(field, value, name):
	try:
		tz = pytz.timezone("Asia/Jakarta")
		if field == 'layanan_berjadwal':
			value_json = json.loads(value)
			action = frappe.get_list('VetTindakanDokterAction', filters={'parent': name}, fields=['name'])
			if len(action) == 0:
				doc = frappe.get_doc('VetTindakanDokter', name)
				doc.reload()
				doc.update({
					'layanan_berjadwal': [value_json]
				})
				doc.save()
			else:
				for key in value_json.keys():
					frappe.db.set_value('VetTindakanDokterAction', action[0].name, key, value_json.get(key, False), update_modified=False)

		elif field == 'jasa' or field == 'tindak_lanjut':
			value_json = json.loads(value)
			jasa = []
			for v in value_json:
				json_data = {
					'product': v['product'].get('name',False) if type(v['product']) is dict else v['product'],
					'quantity': v['quantity']
				}
				jasa.append(json_data)
			doc = frappe.get_doc('VetTindakanDokter', name)
			doc.update({
				field : jasa
			})
			doc.save()
		elif field == 'obat':
			value_json = json.loads(value)
			obat = []
			doc = frappe.get_doc('VetTindakanDokter', name)
			doc.update({
				'obat' : obat
			})
			doc.save()
			for v in value_json:
				json_data = {
					'product': v.get('name', False),
					'quantity': v.get('quantity', False),
					'note': v.get('note', ''),
					'parent': name,
					'parenttype': 'VetTindakanDokter',
					'parentfield': 'obat'
				}
				
				new_obat = frappe.new_doc('VetTindakanDokterObat')
				new_obat.update(json_data)
				new_obat.insert()
				
				for racikan in v.get('product_racikan'):
					json_data = {
						'product': racikan.get('name', False),
						'quantity': racikan.get('quantity', False),
						'racikan': new_obat.name,
						'note': racikan.get('note', ''),
						'parent': name,
						'parenttype': 'VetTindakanDokter',
						'parentfield': 'obat'
					}
					
					new_racikan = frappe.new_doc('VetTindakanDokterObat')
					new_racikan.update(json_data)
					new_racikan.insert()
		elif field == 'attachments':
			value_json = json.loads(value)
			attachments = []
			doc = frappe.get_doc('VetTindakanDokter', name)
			
			for r in doc.attachments:
				if len([u for u in value_json if u.get('name', '') == r.name]) == 0:
					remove_file_by_url(r.attachment, 'VetTindakanDokter')
			
			for v in value_json:
				now = dt.now(tz)
				now_str = dt.strftime(now, "%d%m%Y%H%M%S")
				json_data = {'title': v['title']}
				if v.get('name'):
					json_data['attachment'] = v['attachment']
				else:
					filename = now_str+"-"+name+"-"+v['filename']
					filedoc = save_file(filename, v['dataurl'], "VetTindakanDokter", name, decode=True, is_private=0)
					json_data['attachment'] = filedoc.file_url
				attachments.append(json_data)
			doc.update({
				'attachments' : attachments
			})
			doc.save()
		elif field == 'marker' or field == 'marker_delete':
			value_json = json.loads(value)
			if field == 'marker':
				if not value_json.get('name'):
					marker = frappe.new_doc('VetMarker')
					marker.update({'type': value_json['type'], 'markers': value_json['markers']})
					marker.insert()
					frappe.db.set_value('VetTindakanDokter', name, 'marker', marker.name, update_modified=False)
				else:
					marker = frappe.get_doc('VetMarker', value_json['name'])
					marker.update({'type': value_json['type'], 'markers': value_json['markers']})
					marker.save()
					frappe.db.commit()
			elif field == 'marker_delete':
				frappe.db.set_value('VetTindakanDokter', name, 'marker', '', update_modified=False)
				if value_json.get('name'):
					frappe.delete_doc('VetMarker', value_json['name'])
				
		else :
			frappe.db.set_value('VetTindakanDokter', name, field, value, update_modified=False)
			
		frappe.db.commit()
		return True
	except PermissionError as e:
		return {'error': e}