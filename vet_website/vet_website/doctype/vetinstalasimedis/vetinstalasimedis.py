# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
import math
from datetime import datetime as dt
from dateutil.relativedelta import relativedelta
from frappe.utils.file_manager import save_file, remove_file_by_url
from frappe.model.document import Document
from vet_website.vet_website.doctype.vetproductpack.vetproductpack import get_pack_price

class VetInstalasiMedis(Document):
	pass

@frappe.whitelist()
def get_instalasi_medis_list(filters=None):
	default_sort = "creation desc"
	td_filters = []
	filter_json = False
	odd_filters = []
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
				if fj[0] != 'jasa':
					td_filters.append(fj)
				else:
					odd_filters.append(fj)
		if search:
			td_filters.append({'pet_name': ['like', '%'+search+'%']})
		if sort:
			default_sort = sort
	
	try:
		data = frappe.get_list("VetInstalasiMedis", filters=td_filters, fields=["*"], order_by=default_sort, start=(page - 1) * 10, page_length= 10)
		datalength = len(frappe.get_all("VetInstalasiMedis", filters=td_filters, as_list=True))
		for d in data:
		    jasa = frappe.get_list("VetInstalasiMedisJasa", filters={'parent': d.name}, fields=["product_name"])
		    d.update({'jasa': ', '.join(tl.product_name for tl in jasa)})
		    
		    
		for fj in odd_filters:
			fj[0] = 'a.jasa.lower()'
			fj[1] = 'in'
			fj[2] = "'%s'.lower()"%fj[2]
			fj.reverse()
			result_filter = lambda a: eval(" ".join(fj))
			data = filter(result_filter, data)
		
		return {'data': data, 'datalength': datalength}
		
		
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_name_list(filters=None):
	td_filters = []
	filter_json = False
	odd_filters = []
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
		
	if filter_json:
		filters_json = filter_json.get('filters', False)
		
		if filters_json:
			for fj in filters_json:
				if fj[0] != 'jasa':
					td_filters.append(fj)
				else:
					odd_filters.append(fj)
	
	try:
		namelist = frappe.get_all("VetInstalasiMedis", filters=td_filters, as_list=True)
		
		return list(map(lambda item: item[0], namelist))
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def delete_instalasi_medis(data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal menghapus penerimaan"}
	
	for d in data_json:
		frappe.delete_doc('VetInstalasiMedis', d)
		frappe.db.commit()
		
	return {'success': True}
	
@frappe.whitelist()
def get_instalasi_medis(name):
	now = dt.now()
	try:
		list_product = []
		instalasi_medis_search = frappe.get_list("VetInstalasiMedis", filters={'name': name}, fields=["*"])
		instalasi_medis = instalasi_medis_search[0]
		pet = frappe.get_doc('VetPet', instalasi_medis.pet)
		owner = frappe.get_doc('User', instalasi_medis.owner)
		owner_name = owner.full_name
		pet_age_year = relativedelta(now, pet.birth_date).years
		pet_age_month = relativedelta(now, pet.birth_date).months
		jasa = frappe.get_list("VetInstalasiMedisJasa", filters={'parent': name}, fields=["*"])
		tindak_lanjut = frappe.get_list("VetInstalasiMedisTindakLanjut", filters={'parent': name}, fields=["*"])
		attachments = frappe.get_list("VetInstalasiMedisAttachments", filters={'parent': name}, fields=["*"])
		obat = frappe.get_list("VetInstalasiMedisObat", filters={'parent': name}, fields=["*"])
		marker = None
		marker_list = frappe.get_list("VetMarker", filters={'name': instalasi_medis.marker}, fields=["*"])
		
		if len(marker_list):
			marker = frappe.get_doc("VetMarker", instalasi_medis.marker)
        
		for a in obat:
			product_list = frappe.get_list('VetProduct', filters={'name': a.product}, fields=['*'])
			product = product_list[0]
			uom = frappe.get_list('VetUOM', filters={'name': product.product_uom}, fields=['*'])
			product.quantity = a.quantity
			product.uom_name = uom[0].uom_name
			product.product = a.name
			
			list_product.append(product)
        
		instalasi_medis.update({'jasa': jasa, 'tindak_lanjut': tindak_lanjut, 'pet_age_month': pet_age_month, 'pet_age_year': pet_age_year, 'owner_name': owner_name, 'attachments': attachments, 'obat': list_product, 'marker': marker})
		
		tindakan_dokter = frappe.get_list('VetTindakanDokter', filters={'register_number': instalasi_medis.register_number}, fields=['name'])
		if len(tindakan_dokter) > 0:
			instalasi_medis['tindakan_dokter'] = list(t.name for t in tindakan_dokter)
		customer_invoice = frappe.get_list('VetCustomerInvoice', filters={'register_number': instalasi_medis.register_number}, fields=['name'])
		if len(customer_invoice) > 0:
			instalasi_medis['customer_invoice'] = list(c.name for c in customer_invoice)
		rawat_inap = frappe.get_list('VetRawatInap', filters={'register_number': instalasi_medis.register_number}, fields=['name'])
		if len(rawat_inap) > 0:
			instalasi_medis['rawat_inap'] = list(r.name for r in rawat_inap)
		
		return instalasi_medis

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
def get_instalasi_medis_form(name):
	try:
		data_instalasi = get_instalasi_medis(name)
		# products = get_all_products()
		data = {'instalasi_medis': data_instalasi, 'products': []}
		return data
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def confirm_instalasi_medis(data):
	now = dt.now()
	now_str = dt.strftime(now, "%d%m%Y%H%M%S")
	try:
		data_json = json.loads(data)
		
		data_check = frappe.get_list("VetInstalasiMedis", filters={'name': data_json.get('name')}, fields=['name', 'status'])
		if data_check and data_check[0].status == 'Draft':
			instalasi_medis = frappe.get_doc("VetInstalasiMedis", data_check[0].name)
			instalasi_medis.reload()
			instalasi_medis_data = {}
			instalasi_medis_data.update(data_json)
			pops = [
			'name','attachments','dokter','jasa',
			'nama_dokter','pet','pet_name','pet_owner','pet_owner_name',
			'reception','date','register_number','status','tindak_lanjut',
			'obat','marker', 'creation', 'modified', 'tindakan_dokter', 'customer_invoice', 'rawat_inap'
			]
			for p in pops:
				if instalasi_medis_data.get(p,False):
					instalasi_medis_data.pop(p)
			instalasi_medis.update(instalasi_medis_data)
			if instalasi_medis.status == 'Draft':
				instalasi_medis.update({'status': 'Done'})
			instalasi_medis.save()
			
			# if data_json.get("marker"):
			# 	marker = frappe.new_doc('VetMarker')
			# 	marker.update({'type': data_json.get("marker").get('type'), 'markers':  data_json.get("marker").get('markers')})
			# 	marker.insert()
			# 	instalasi_medis.update({'marker': marker.name})
			# 	instalasi_medis.save()
				
			products_invoice = []
				
			for obat in data_json.get("obat"):
				# product_data = {}
				# product_data.update(obat)
				# product_data.update({'parent': instalasi_medis.name, 'parenttype': 'VetInstalasiMedis', 'parentfield': 'obat'})

				# new_product = frappe.new_doc("VetInstalasiMedisObat")
				# new_product.update(product_data)

				# instalasi_medis.obat.append(new_product)

				# instalasi_medis.save()
				
				product_data = {
					'product': obat.get('product'),
					'quantity': math.ceil(float(obat.get('quantity'))),
				}
				products_invoice.append(product_data)
			
			for jasa in data_json.get('jasa'):
				# if not jasa.get('name'):
				# 	new_jasa_doc = frappe.new_doc('VetInstalasiMedisJasa')
				# 	new_jasa_doc.update(jasa)
				# 	new_jasa_doc.update({'parent': instalasi_medis.name, 'parenttype': 'VetInstalasiMedis', 'parentfield': 'jasa'})
				# 	instalasi_medis.jasa.append(new_jasa_doc)
				# 	instalasi_medis.save()
				# else:
				# 	if jasa.get('deleted'):
				# 		frappe.delete_doc('VetInstalasiMedisJasa', jasa.get('name'))
				# 	else:
				# 		jasa_doc = frappe.get_doc('VetInstalasiMedisJasa', jasa.get('name'))
				# 		jasa_doc.reload()
				# 		jasa_doc.update({'product': jasa.get('product'), 'quantity': jasa.get('quantity')})
				# 		jasa_doc.save()
						
				product_data = {
					'product': jasa.get('product'),
					'quantity': math.ceil(float(jasa.get('quantity'))),
				}
				products_invoice.append(product_data)
						
			# for tindak_lanjut in data_json.get('tindak_lanjut'):
			# 	new_tindak_lanjut_doc = frappe.new_doc('VetInstalasiMedisTindakLanjut')
			# 	new_tindak_lanjut_doc.update(tindak_lanjut)
			# 	new_tindak_lanjut_doc.update({'parent': instalasi_medis.name, 'parenttype': 'VetInstalasiMedis', 'parentfield': 'tindak_lanjut'})
			# 	instalasi_medis.tindak_lanjut.append(new_tindak_lanjut_doc)
			# 	instalasi_medis.save()
						
			# for attachment in data_json.get('attachments'):
			# 	if not attachment.get('name'):
			# 		new_attachment_doc = frappe.new_doc('VetInstalasiMedisAttachments')
			# 		filename = now_str+"-"+instalasi_medis.name+"-"+attachment.get("filename")
			# 		filedoc = save_file(filename, attachment.get("dataurl"), "VetInstalasiMedis", instalasi_medis.name, decode=True, is_private=0)
			# 		new_attachment_doc.update({'title': attachment.get('title'), "attachment": filedoc.file_url, 'parent': instalasi_medis.name, 'parenttype': 'VetInstalasiMedis', 'parentfield': 'attachments'})
			# 		instalasi_medis.attachments.append(new_attachment_doc)
			# 		instalasi_medis.save()
			# 	else:
			# 		if attachment.get('deleted'):
			# 			frappe.delete_doc('VetInstalasiMedisAttachments', attachment.get('name'))
						
			rekam_medis = frappe.new_doc('VetRekamMedis')
			rekam_medis_data = {}
			rekam_medis_data.update(data_json)
			pops_rekam_medis = [
				'attachments', 'creation', 'docstatus', 'idx', 'jasa', 'modified', 'modified_by', 'owner', 'parent', 'parentfield', 'parenttype',
				'pet_name', 'pet_owner', 'pet_owner_name', 'date', 'status', 'tindak_lanjut', 'obat', 'marker', 'tindakan_dokter', 'customer_invoice', 'rawat_inap']
			for p in pops_rekam_medis:
				if rekam_medis_data.get(p,False):
					rekam_medis_data.pop(p)  # TODO service ganti
			rekam_medis_data.update({'service': 'Operasi', 'record_date': dt.strftime(dt.now(), "%Y-%m-%d %H:%M:%S")})
			rekam_medis_data.update({'attachments': instalasi_medis.attachments, 'marker': instalasi_medis.marker})
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
				product_data.update({'parent': rekam_medis.name, 'parenttype': 'VetRekamMedis', 'parentfield': 'obat'})

				new_product = frappe.new_doc("VetRekamMedisObat")
				new_product.update(product_data)

				rekam_medis.obat.append(new_product)

				rekam_medis.save()

			update_invoice(json.dumps(products_invoice), instalasi_medis.register_number, instalasi_medis.reference)
			
			return {'instalasi_medis': instalasi_medis}

		else:
			return {'error': "Tindakan Dokter tidak ditemukan"}

	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def update_invoice(products, register_number, reference=False):
	try:
		invoice_filters = {'register_number': register_number, 'Status': 'Draft'}
		if reference == 'Rawat Inap':
			invoice_filters.update({'is_rawat_inap': '1'})
		
		invoice_check = frappe.get_list("VetCustomerInvoice", filters=invoice_filters, fields=['name'])

		if invoice_check:
			products_json = json.loads(products)

			invoice = frappe.get_doc("VetCustomerInvoice", invoice_check[0]['name'])

			subtotal = 0

			for product in products_json:
				product_data = {}
				product_data.update(product)
				product_data.update({'parent': invoice.name, 'parenttype': 'VetCustomerInvoice', 'parentfield': 'invoice_line', 'service': 'Instalasi Medis'})
				
				default_warehouse = frappe.get_list('VetGudang', filters={'is_default': '1'}, fields=['name', 'gudang_name'], limit=1)
				product_category = frappe.db.get_value('VetProduct', product.get('product'), 'product_category')
				if product_category:
					stockable = frappe.db.get_value('VetProductCategory', product_category, 'stockable') or False
				if len(default_warehouse) > 0 and stockable:
					product_data.update({'warehouse': default_warehouse[0].name})

				new_product = frappe.new_doc("VetCustomerInvoiceLine")
				new_product.update(product_data)
				new_product.insert()
				new_product.update({'total': float(new_product.unit_price) * math.ceil(float(new_product.quantity))})
				new_product.save()

				subtotal += new_product.total

				invoice.invoice_line.append(new_product)

				invoice.save()
				frappe.db.commit()

			invoice.update({'subtotal': invoice.subtotal + subtotal, 'total': invoice.total + subtotal})
			invoice.save()
			frappe.db.commit()

		else:
			invoice = frappe.new_doc("VetCustomerInvoice")
			now = dt.now()
			now_1_hour = now + relativedelta(hour=1)
			invoice_date = dt.strftime(now, "%Y-%m-%d %H:%M:%S")
			due_date = dt.strftime(now_1_hour, "%Y-%m-%d %H:%M:%S")
			
			pet = frappe.get_list('VetReception', filters={'register_number': register_number}, fields=['pet'])

			new_invoice_data = {
				'register_number': register_number,
				'pet': pet[0]['pet'],
				'user': frappe.session.user,
				'invoice_date': invoice_date,
				'due_date': due_date,
				'origin': register_number,
			}
			if reference == 'Rawat Inap':
				rawat_inap = frappe.get_list('VetRawatInap', filters={'register_number': register_number}, fields=['name'])
				new_invoice_data.update({'is_rawat_inap': '1', 'rawat_inap': rawat_inap[0].name})

			invoice.update(new_invoice_data)
			invoice.insert()
			frappe.db.commit()

			subtotal = 0

			for product in json.loads(products):
				product_data = {}
				product_data.update(product)
				product_data.update({'parent': invoice.name, 'parenttype': 'VetCustomerInvoice', 'parentfield': 'invoice_line', 'service': 'Instalasi Medis'})

				new_product = frappe.new_doc("VetCustomerInvoiceLine")
				new_product.update(product_data)
				new_product.insert()
				check_pack = frappe.get_list('VetProductPack', filters={'parent': new_product.product}, fields=['harga_pack', 'quantity_pack'])
				selected_pack = [i for i in check_pack if i['quantity_pack'] <= math.ceil(new_product.quantity)]
				selected_pack.sort(key=lambda a: a.quantity_pack, reverse=True)
				if selected_pack:
					total = get_pack_price(float(math.ceil(new_product.quantity)), float(new_product.unit_price), selected_pack[0]['quantity_pack'], selected_pack[0]['harga_pack'])
					new_product.update({'total': total})
				else:					
					new_product.update({'total': float(new_product.unit_price) * math.ceil(float(new_product.quantity))})
				new_product.save()

				subtotal += new_product.total

				invoice.invoice_line.append(new_product)

				invoice.save()
				frappe.db.commit()

			invoice.update({'subtotal': subtotal, 'total': subtotal})
			invoice.save()
			frappe.db.commit()
			
		return {'invoice': invoice}

	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def autosave(field, value, name):
	try:
		if field == 'jasa' or field == 'tindak_lanjut':
			value_json = json.loads(value)
			jasa = []
			for v in value_json:
				json_data = {
					'product': v['product'],
					'quantity': v['quantity']
				}
				jasa.append(json_data)
			doc = frappe.get_doc('VetInstalasiMedis', name)
			doc.update({
				field : jasa
			})
			doc.save()
		elif field == 'obat':
			value_json = json.loads(value)
			obat = []
			for v in value_json:
				json_data = {
					'product': v['name'],
					'quantity': v['quantity'],
				}
				obat.append(json_data)
			doc = frappe.get_doc('VetInstalasiMedis', name)
			doc.update({
				'obat' : obat
			})
			doc.save()
		elif field == 'attachments':
			value_json = json.loads(value)
			attachments = []
			doc = frappe.get_doc('VetInstalasiMedis', name)
			
			for r in doc.attachments:
				if len([u for u in value_json if u.get('name', '') == r.name]) == 0:
					remove_file_by_url(r.attachment, 'VetInstalasiMedis')
			
			for v in value_json:
				now = dt.now()
				now_str = dt.strftime(now, "%d%m%Y%H%M%S")
				json_data = {'title': v['title']}
				if v.get('name'):
					json_data['attachment'] = v['attachment']
				else:
					filename = now_str+"-"+name+"-"+v['filename']
					filedoc = save_file(filename, v['dataurl'], "VetInstalasiMedis", name, decode=True, is_private=0)
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
					frappe.db.set_value('VetInstalasiMedis', name, 'marker', marker.name, update_modified=False)
				else:
					marker = frappe.get_doc('VetMarker', value_json['name'])
					marker.update({'type': value_json['type'], 'markers': value_json['markers']})
					marker.save()
					frappe.db.commit()
			elif field == 'marker_delete':
				frappe.db.set_value('VetInstalasiMedis', name, 'marker', '', update_modified=False)
				if value_json.get('name'):
					frappe.delete_doc('VetMarker', value_json['name'])
				
		else :
			frappe.db.set_value('VetInstalasiMedis', name, field, value, update_modified=False)
			
		frappe.db.commit()
		return True
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def cancel_instalasi_medis(name):
	try:
		instalasi_medis = frappe.get_doc('VetInstalasiMedis', name)
		instalasi_medis.status = 'Cancel'
		instalasi_medis.save()
		frappe.db.commit()
		return {'success': True}
	except PermissionError as e:
		return {'error': e}