# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
import math
import pytz
from datetime import datetime as dt
from frappe.utils.file_manager import save_file
from frappe.model.document import Document
from vet_website.vet_website.doctype.vetproduct.vetproduct import get_product
from vet_website.vet_website.doctype.vetproductpack.vetproductpack import get_pack_price
from dateutil.relativedelta import relativedelta as rd

class VetRawatInap(Document):
	pass

@frappe.whitelist()
def get_rawat_inap_list(filters=None):
	default_sort = "creation desc"
	ri_filters = []
	ri_or_filters = []
	filter_json = False
	# result_filter = lambda a: a
	sort_filter = False
	sort_filter_reverse = False
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
				# if fj[0] != 'dokter_reference':
				ri_filters.append(fj)
				# else:
				# 	fj[0] = "a.dokter_reference.lower()"
				# 	if fj[1] == "=":
				# 		fj[1] = "=="
				# 	elif fj[1] == 'like':
				# 		fj[1] = 'in'
				# 	elif fj[1] == 'not like':
				# 		fj[1] = 'not in'
				# 	if fj[1] not in ['in', 'not in']:
				# 		fj[2] = "'%s'"%fj[2].lower()
				# 		result_filter = lambda a: eval(" ".join(fj))
				# 	else:
				# 		fj[2] = fj[2].replace('%',"'").lower()
				# 		fj.reverse()
				# 		result_filter = lambda a: eval(" ".join(fj))
		if search:
			ri_or_filters.append({'name': ['like', '%'+search+'%']})
			ri_or_filters.append({'register_number': ['like', '%'+search+'%']})
			ri_or_filters.append({'pet_name': ['like', '%'+search+'%']})
			ri_or_filters.append({'owner_name': ['like', '%'+search+'%']})
			ri_or_filters.append({'dokter_reference': ['like', '%'+search+'%']})
			ri_or_filters.append({'status': ['like', '%'+search+'%']})
		if sort:
			sorts = sort.split(',')
			for i,s in enumerate(sorts):
				if 'dokter_reference' in s:
					sorts.pop(i)
					sort_filter = lambda o: o['dokter_reference'].lower()
					s_words = s.split(' ')
					if s_words[1] == 'desc':
						sort_filter_reverse = True
			default_sort = ','.join(sorts)
		
	try:
		rawat_inap = frappe.get_list("VetRawatInap", or_filters=ri_or_filters, filters=ri_filters, fields=["*"], order_by=default_sort, start=(page - 1) * 10, page_length= 10)
		datalength = len(frappe.get_all("VetRawatInap", or_filters=ri_or_filters, filters=ri_filters, as_list=True))
		for ri in rawat_inap:
			tindakan_dokter = frappe.get_list("VetTindakanDokter", filters={'register_number': ri.register_number}, fields=["*"])
			if(len(tindakan_dokter) == 0):
				reception = frappe.get_list("VetReception", filters={'register_number': ri.register_number}, fields=["*"])
				pet = frappe.get_doc('VetPet', reception[0].pet)
				ri['pet_name'] = reception[0].pet_name
				ri['pet_status'] = pet.status
				ri['owner_name'] = reception[0].pet_owner_name
				ri['dokter_reference'] = frappe.db.get_value('User', reception[0].owner, 'full_name') or ''
			else:
				pet = frappe.get_doc('VetPet', tindakan_dokter[0].pet)
				
				ri['pet_name'] = tindakan_dokter[0].pet_name
				ri['pet_status'] = pet.status
				ri['owner_name'] = tindakan_dokter[0].pet_owner_name
				ri['dokter_reference'] = tindakan_dokter[0].nama_dokter or ''
		
		if sort_filter != False:
			rawat_inap.sort(key=sort_filter, reverse=sort_filter_reverse)
		# rawat_inap = filter(result_filter, rawat_inap)
		
		return {'rawat_inap': rawat_inap, 'datalength': datalength}
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_name_list(filters=None):
	ri_filters = []
	ri_or_filters = []
	filter_json = False
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
		
	if filter_json:
		filters_json = filter_json.get('filters', False)
		search = filter_json.get('search', False)
		
		if filters_json:
			for fj in filters_json:
				# if fj[0] != 'dokter_reference':
				ri_filters.append(fj)
				# else:
				# 	fj[0] = "a.dokter_reference.lower()"
				# 	if fj[1] == "=":
				# 		fj[1] = "=="
				# 	elif fj[1] == 'like':
				# 		fj[1] = 'in'
				# 	elif fj[1] == 'not like':
				# 		fj[1] = 'not in'
				# 	if fj[1] not in ['in', 'not in']:
				# 		fj[2] = "'%s'"%fj[2].lower()
				# 	else:
				# 		fj[2] = fj[2].replace('%',"'").lower()
				# 		fj.reverse()

		if search:
			ri_or_filters.append({'name': ['like', '%'+search+'%']})
			ri_or_filters.append({'register_number': ['like', '%'+search+'%']})
			ri_or_filters.append({'pet_name': ['like', '%'+search+'%']})
			ri_or_filters.append({'owner_name': ['like', '%'+search+'%']})
			ri_or_filters.append({'dokter_reference': ['like', '%'+search+'%']})
			ri_or_filters.append({'status': ['like', '%'+search+'%']})
		
	try:
		namelist = frappe.get_all("VetRawatInap", or_filters=ri_or_filters, filters=ri_filters, as_list=True)
		
		return list(map(lambda item: item[0], namelist))
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def delete_rawat_inap(data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal menghapus Rawat Inap"}
	
	for d in data_json:
		frappe.delete_doc('VetRawatInap', d)
		frappe.db.commit()
		
	return {'success': True}
	
@frappe.whitelist()
def get_rawat_inap(name):
	try:
		rawat_inap_search = frappe.get_list('VetRawatInap', filters={'name': name}, fields=['*'])
		rawat_inap = rawat_inap_search[0]
		tindakan_dokter = frappe.get_list('VetTindakanDokter', filters={'register_number': rawat_inap.register_number}, fields=['*'])
		rawat_inap_tindakan = frappe.get_list('VetRawatInapTindakan', filters={'parent': rawat_inap.name}, fields=['*'], order_by="modified desc")
		
		rawat_inap['pet_name'] = tindakan_dokter[0]['pet_name']
		rawat_inap['pet'] = tindakan_dokter[0]['pet']
		
		tindakan_dokter = frappe.get_list('VetTindakanDokter', filters={'register_number': rawat_inap.register_number}, fields=['name'])
		if len(tindakan_dokter) > 0:
			rawat_inap['tindakan_dokter'] = list(t.name for t in tindakan_dokter)
		customer_invoice = frappe.get_list('VetCustomerInvoice', filters={'register_number': rawat_inap.register_number, 'is_rawat_inap': '1'}, fields=['name'])
		if len(customer_invoice) > 0:
			rawat_inap['customer_invoice'] = list(c.name for c in customer_invoice)
		
		tindakan_list = []
		for rit in rawat_inap_tindakan:
			rekam_medis = frappe.get_list('VetRekamMedis', filters={'name': rit.rekam_medis}, fields=['*'])
			rit['rekam_medis'] = rekam_medis[0]
			
			if not tindakan_list:
				tindakan_list.append([rit])
			else:
				add = True
				for tl in tindakan_list:
					name = []
					for t in tl:
						name.append(t.name)
					if dt.date(tl[0]['rekam_medis']['record_date']) == dt.date(rit['rekam_medis']['record_date']):
						tl.append(rit)
						add = False
						break
						
				if add:
					tindakan_list.append([rit])

		for i in tindakan_list:
			i.sort(key = lambda a: a['rekam_medis']['record_date'])
			
		rawat_inap.tindakan = tindakan_list
		# products = frappe.get_list("VetProduct", fields=["*"])
		# for p in products:
		# 	pr = get_product(p.name)
		# 	p.product_category = pr.get('product').get('product_category')
		
		kandang = frappe.get_list('VetKandang', filters={'register_number': '', 'status': 'Active'}, fields=['*'])
			
		res = {'rawat_inap': rawat_inap, 'products': [], 'kandang': kandang}
		
		return res
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_all_products():
	try:
		products = frappe.get_list("VetProduct", fields=["*"])
		for p in products:
			pr = get_product(p.name)
			p.product_category = pr.get('product').get('product_category')
			
		return products
	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()		
def get_rekam_medis(name):
	try:
		rekam_medis_search = frappe.get_list("VetRekamMedis", filters={'name': name}, fields=["*"])
		rekam_medis = rekam_medis_search[0]
		jasa = frappe.get_list("VetRekamMedisJasa", filters={'parent': name}, fields=["*"])
		for j in jasa:
			pr = get_product(j.product)
			product = frappe.get_list("VetProduct", filters={'name': j.product}, fields=["*"])
			uom = frappe.get_doc('VetUOM', product[0].product_uom)
			product[0].product_uom_name = uom.uom_name
			product[0].product_category = pr.get('product').get('product_category')
			j.product = product[0]
		obat = frappe.get_list("VetRekamMedisObat", filters={'parent': name}, fields=["*"])
		for o in obat:
			pr = get_product(o.product)
			product = frappe.get_list("VetProduct", filters={'name': o.product}, fields=["*"])
			uom = frappe.get_doc('VetUOM', product[0].product_uom)
			product[0].product_uom_name = uom.uom_name
			product[0].product_category = pr.get('product').get('product_category')
			o.product = product[0]
		rekam_medis.update({'jasa': jasa, 'obat': obat})
		
		return rekam_medis
	except PermissionError as e:
		return {'error': e}
		
		
@frappe.whitelist()
def add_more_tindakan(datas):
	tz = pytz.timezone("Asia/Jakarta")
	now = dt.now(tz)
	now_str = dt.strftime(now, "%d%m%Y%H%M%S")
	try:
		data_json = json.loads(datas)
		for d in data_json:
			add_tindakan(json.dumps(d))
			
		return 'Oke'
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def add_tindakan(data):
	tz = pytz.timezone("Asia/Jakarta")
	now = dt.now(tz)
	now_str = dt.strftime(now, "%d%m%Y%H%M%S")
	try:
		data_json = json.loads(data)
		
		data_check = frappe.get_list("VetRawatInap", filters={'name': data_json.get('name')}, fields=['name'])
		if len(data_check):
			rawat_inap = frappe.get_doc('VetRawatInap', data_json.get('name', False))
			if len(rawat_inap.tindakan) == 0:
				rawat_inap.status = 'On Progress'
				
			task = frappe.get_doc('VetTask', rawat_inap.register_number)
			penerimaan = frappe.get_doc('VetReception', task.reception)
			rekam_medis_json = data_json.get('rekam_medis', False)
			
			rekam_medis = frappe.new_doc('VetRekamMedis')
			rekam_medis_data = {
				'register_number': rawat_inap.register_number,
				'pet': penerimaan.pet
			}
			rekam_medis_data.update(rekam_medis_json)
			pops_rekam_medis = [
				'attachments', 'creation', 'docstatus', 'idx', 'jasa_dan_obat', 'layanan_berjadwal', 'modified', 'modified_by', 'owner', 'parent', 'parentfield', 'parenttype',
				'pet_name', 'pet_owner', 'pet_owner_name', 'reception_date', 'rekam_medis_count', 'status', 'tindak_lanjut', 'marker'
				]
				
			for p in pops_rekam_medis:
				if rekam_medis_json.get(p, False):
					rekam_medis_data.pop(p)
			rekam_medis_data.update({'service': 'Rawat Inap', 'record_date': dt.strftime(now, "%Y-%m-%d %H:%M:%S")})
			rekam_medis.update(rekam_medis_data)
			rekam_medis.insert()
			
			if rekam_medis_json.get("marker", False):
				marker = frappe.new_doc('VetMarker')
				marker.update({'type': rekam_medis_json.get("marker").get('type'), 'markers':  rekam_medis_json.get("marker").get('markers')})
				marker.insert()
				rekam_medis.update({'marker': marker.name})
				rekam_medis.save()
			
			if rekam_medis_json.get("attachments", False):	
				for attachment in rekam_medis_json.get("attachments", False):
					if not attachment.get('name'):
						new_attachment_doc = frappe.new_doc('VetRekamMedisAttachments')
						filename = now_str+"-"+rekam_medis.name+"-"+attachment.get("filename")
						filedoc = save_file(filename, attachment.get("dataurl"), "VetRekamMedis", rekam_medis.name, decode=True, is_private=0)
						new_attachment_doc.update({'title': attachment.get('title'), "attachment": filedoc.file_url, 'parent': rekam_medis.name, 'parenttype': 'VetRekamMedis', 'parentfield': 'attachments'})
						rekam_medis.attachments.append(new_attachment_doc)
						rekam_medis.save()
					else:
						if attachment.get('deleted'):
							frappe.delete_doc('VetRekamMedisAttachments', attachment.get('name'))
							
			products_invoice = []
			
			for jo in rekam_medis_json.get('jasa_dan_obat', False):
				if jo.get('name',False) and jo.get('default_code', False):
					# if jo.get('is_apotik',False) == 1 or jo.get('is_food',False) == 1:
					if jo.get('product_category',{}).get('is_obat', False) == 1 or jo.get('product_category',{}).get('is_racikan', False) == 1 or jo.get('product_category',{}).get('is_makanan', False) == 1:
						product_data = {
							'product': jo.get('name', False),
							'quantity': jo.get('quantity', False),
							'note': jo.get('description', False)
						}
						product_data.update({'parent': rekam_medis.name, 'parenttype': 'VetRekamMedis', 'parentfield': 'obat'})
		
						new_product = frappe.new_doc("VetRekamMedisObat")
						new_product.update(product_data)
		
						rekam_medis.obat.append(new_product)
		
						rekam_medis.save()
						
						if jo.get('product_racikan', False):
							for pr in jo.get("product_racikan",False):
								pr_data = {
									'product': pr.get('name', False),
									'quantity': pr.get('quantity', False),
									'note': pr.get('description', False),
								}
								pr_data.update({'parent': rekam_medis.name, 'parenttype': 'VetRekamMedis', 'parentfield': 'obat', 'racikan': new_product.name})
								
								new_pr = frappe.new_doc("VetRekamMedisObat")
								new_pr.update(pr_data)
								
								rekam_medis.obat.append(new_pr)
								
								rekam_medis.save()
								
					else:
						print("Jasa Item WTF!")
						new_jasa_doc = frappe.new_doc('VetRekamMedisJasa')
						new_jasa_data = {
							'product': jo.get('product', jo.get('name', False)),
							'quantity': jo.get('quantity', False),
						}
						new_jasa_doc.update(new_jasa_data)
						new_jasa_doc.update({'parent': rekam_medis.name, 'parenttype': 'VetRekamMedis', 'parentfield': 'jasa'})
						rekam_medis.jasa.append(new_jasa_doc)
						rekam_medis.save()
						
					product_invoice_data = {
						'product': jo.get('name'),
						# 'quantity': math.ceil(float(jo.get('quantity'))),
						'quantity': float(jo.get('quantity')),
					}
					products_invoice.append(product_invoice_data)
				else:
					if rekam_medis.action:
						rekam_medis.action = ", ".join([rekam_medis.action, jo.get('description')])
					else:
						rekam_medis.action = jo.get('description')
					rekam_medis.save()
					
			rawat_inap_tindakan = frappe.new_doc('VetRawatInapTindakan')
			rawat_inap_tindakan_data = {
						'time': data_json.get('waktu',False).capitalize(),
						'rekam_medis': rekam_medis.name,
						'parent': rawat_inap.name,
						'parenttype': 'VetRawatInap',
						'parentfield': 'tindakan',
					}
			rawat_inap_tindakan.update(rawat_inap_tindakan_data)
			rawat_inap.tindakan.append(rawat_inap_tindakan)
			rawat_inap.save()
			
			if len(rekam_medis_json.get('tindak_lanjut', False)) != 0:
				print("Ada tindak lanjut")
				filtered_tindak_lanjut = [i for i in rekam_medis_json.get('tindak_lanjut', False) if i.get('product_category').get('is_rawat', 0) == 0]
				print('filtered ' + str(filtered_tindak_lanjut))	
				instalasi_medis = frappe.new_doc('VetInstalasiMedis')
				instalasi_medis_data = {
					'register_number': rawat_inap.register_number,
					'date': now.strftime('%Y-%m-%d'),
					'service': 'Operasi',
					'reference': 'Rawat Inap',
					'temperature': rekam_medis.temperature,
					'weight': rekam_medis.weight,
				}
				instalasi_medis.update(instalasi_medis_data)
				instalasi_medis.save()
				for tindak_lanjut in filtered_tindak_lanjut:
					# new_tindak_lanjut_doc = frappe.new_doc('VetInstalasiMedisTindakLanjut')
					# new_tindak_lanjut_doc.update({
					# 	'parent': instalasi_medis.name, 
					# 	'parenttype': 'VetInstalasiMedis', 
					# 	'parentfield': 'tindak_lanjut',
					# 	'product': tindak_lanjut.get('name', False),
					# 	'quantity': 1,
					# })
					# instalasi_medis.tindak_lanjut.append(new_tindak_lanjut_doc)
					# instalasi_medis.save()
					new_jasa_doc = frappe.new_doc('VetInstalasiMedisJasa')
					new_jasa_doc.update({
						'parent': instalasi_medis.name, 
						'parenttype': 'VetInstalasiMedis', 
						'parentfield': 'tindak_lanjut',
						'product': tindak_lanjut.get('name', False),
						'quantity': 1,
					})
					instalasi_medis.jasa.append(new_jasa_doc)
					instalasi_medis.save()
			
			tindakan_search = frappe.get_list('VetRawatInapTindakan', filters={'name': rawat_inap_tindakan.name}, fields=['*'])
			tindakan = tindakan_search[0]
			tindakan.rekam_medis = get_rekam_medis(rekam_medis.name)
			
			update_invoice(json.dumps(products_invoice), rawat_inap.name)
			
			return tindakan
		else:
			return {'error': "Rawat Inap tidak ditemukan"}

	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def update_invoice(products, rawat_inap):
	warehouse_search = frappe.get_list('VetGudang', fields=['name'])
	last_warehouse = frappe.db.get_single_value('VetSetting', 'apotik_warehouse')
	
	warehouse = last_warehouse or warehouse_search[0].name
	tz = pytz.timezone("Asia/Jakarta")
	
	try:

		invoice_check = frappe.get_list("VetCustomerInvoice", filters={'rawat_inap': rawat_inap, 'is_rawat_inap': '1', 'status': 'Draft'}, fields=['name'])

		if invoice_check:
			products_json = json.loads(products)

			invoice = frappe.get_doc("VetCustomerInvoice", invoice_check[0]['name'])
			invoice.update({'pos_session': None})

			subtotal = 0

			for product in products_json:
				product_data = {}
				product_data.update(product)
				product_data.update({'parent': invoice.name, 'parenttype': 'VetCustomerInvoice', 'parentfield': 'invoice_line', 'service': 'Rawat Inap'})
				
				default_warehouse = frappe.get_list('VetGudang', filters={'is_default': '1'}, fields=['name', 'gudang_name'], limit=1)
				product_category = frappe.db.get_value('VetProduct', product.get('product'), 'product_category')
				if product_category:
					stockable = frappe.db.get_value('VetProductCategory', product_category, 'stockable') or False
				if len(default_warehouse) > 0 and stockable:
					product_data.update({'warehouse': default_warehouse[0].name})

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
				frappe.db.commit()

			invoice.update({'subtotal': invoice.subtotal + subtotal, 'total': invoice.total + subtotal})
			# if invoice.is_rawat_inap == 1 and invoice.status == 'Paid':
			# 	invoice.update({'status': 'Open'})
				
			invoice.save()
			frappe.db.commit()

		else:
			invoice = frappe.new_doc("VetCustomerInvoice")
			now = dt.now(tz)
			now_1_hour = now + rd(hour=1)
			invoice_date = dt.strftime(now, "%Y-%m-%d %H:%M:%S")
			due_date = dt.strftime(now_1_hour, "%Y-%m-%d %H:%M:%S")
			
			rawat_inap_doc = frappe.get_doc('VetRawatInap', rawat_inap)
			pet = frappe.db.get_value('VetReception', rawat_inap_doc.reception, 'pet')

			new_invoice_data = {
				'register_number': rawat_inap_doc.register_number,
				'pet': pet,
				'user': frappe.session.user,
				'invoice_date': invoice_date,
				'due_date': due_date,
				'origin': rawat_inap,
				'rawat_inap': rawat_inap,
				'is_rawat_inap': '1',
			}
			invoice.update(new_invoice_data)
			invoice.insert()
			frappe.db.commit()

			subtotal = 0

			for product in json.loads(products):
				product_data = {}
				product_data.update(product)
				product_data.update({'parent': invoice.name, 'parenttype': 'VetCustomerInvoice', 'parentfield': 'invoice_line', 'service': 'Rawat Inap'})

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
				frappe.db.commit()

			invoice.update({'subtotal': subtotal, 'total': subtotal, 'pos_session': None})
			invoice.save()
			frappe.db.commit()
			
		return {'invoice': invoice}

	except PermissionError as e:
		return {'error': e}
		
		
@frappe.whitelist()
def rawat_inap_return(name):
	try:
		tz = pytz.timezone("Asia/Jakarta")
		rawat_inap_search = frappe.get_list('VetRawatInap', filters={'name': name}, fields=['register_number'])
		if len(rawat_inap_search):
			kandang_search = frappe.get_list('VetKandang', filters={'register_number': rawat_inap_search[0].register_number}, fields=['name'])
			if len(kandang_search):
				kandang = frappe.get_doc('VetKandang', kandang_search[0].name)
				kandang.register_number = ''
				kandang.save()
				frappe.db.commit()
				
			rawat_inap = frappe.get_doc('VetRawatInap', name)
			rawat_inap.status = 'Done'
			rawat_inap.save()
			
			tindakan_dokter = frappe.get_list('VetTindakanDokter', filters={'register_number': rawat_inap.register_number}, fields=['name'])
			if tindakan_dokter:
				tindak_lanjut = frappe.get_list('VetTindakanDokterTindakLanjut', filters={'parent': tindakan_dokter[0]['name']}, fields=['*'])
				product = [i.product for i in tindak_lanjut if i.is_rawat]
				if product:
					product_invoice_data = {
						'product': product[0],
						'quantity': (dt.now(tz).today() - rawat_inap.creation).days if (dt.now(tz).today() - rawat_inap.creation).days > 0 else 1,
					}
					
					update_invoice(json.dumps([product_invoice_data]), rawat_inap.name)
			
			return "Oke"
		
		else:
			return {'error': "Rawat Inap tidak ditemukan"}

	except PermissionError as e:
		return {'error': e}
		
	
	
@frappe.whitelist()
def get_unfinished_rawat_inap():
	try:
		rawat_inap_search = frappe.get_list('VetRawatInap', filters={'status': ['!=', 'Done']}, fields=['*'])
		for rawat_inap in rawat_inap_search:
			tindakan_dokter = frappe.get_list('VetTindakanDokter', filters={'register_number': rawat_inap.register_number}, fields=['*'])
			rawat_inap_tindakan = frappe.get_list('VetRawatInapTindakan', filters={'parent': rawat_inap.name}, fields=['*'], order_by="modified desc")
		
			rawat_inap['pet_name'] = tindakan_dokter[0]['pet_name']
			rawat_inap['owner_name'] = tindakan_dokter[0].pet_owner_name
			rawat_inap['pet_image'] = frappe.db.get_value('VetPet', tindakan_dokter[0]['pet'], 'pet_image_thumbnail')
		
			tindakan_list = []
			for rit in rawat_inap_tindakan:
				rekam_medis = frappe.get_list('VetRekamMedis', filters={'name': rit.rekam_medis}, fields=['*'])
				rit['rekam_medis'] = rekam_medis[0]
				
				if not tindakan_list:
					tindakan_list.append([rit])
				else:
					add = True
					for tl in tindakan_list:
						name = []
						for t in tl:
							name.append(t.name)
						if dt.date(tl[0]['rekam_medis']['record_date']) == dt.date(rit['rekam_medis']['record_date']):
							tl.append(rit)
							add = False
							break
							
					if add:
						tindakan_list.append([rit])
		
			
			rawat_inap.tindakan = tindakan_list
			
		products = frappe.get_list("VetProduct", fields=["*"])
		for p in products:
			pr = get_product(p.name)
			p.product_category = pr.get('product').get('product_category')
			
		res = {'rawat_inap': rawat_inap_search, 'products': products}
		
		return res
	except PermissionError as e:
		return {'error': e}