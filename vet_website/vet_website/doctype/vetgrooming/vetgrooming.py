# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
import math
import pytz
from datetime import datetime as dt
from dateutil.relativedelta import relativedelta as rd
from frappe.utils.file_manager import save_file, remove_file_by_url
from frappe.model.document import Document
from vet_website.vet_website.doctype.vetproductpack.vetproductpack import get_pack_price

class VetGrooming(Document):
	pass

@frappe.whitelist()
def add_product_list(grooming_id):
	try:
		grooming = frappe.get_doc("VetGrooming", grooming_id)
		render = frappe.render_template('templates/grooming/product_list.html', {'mode': 'Edit', 'grooming': grooming})
		return {'render': render}
	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()
def add_action_list(grooming_id):
	try:
		grooming = frappe.get_doc("VetGrooming", grooming_id)
		render = frappe.render_template('templates/grooming/action_list.html', {'mode': 'Edit', 'grooming': grooming})
		return {'render': render}
	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()
def edit_grooming(grooming_data, is_done=False):
	tz = pytz.timezone("Asia/Jakarta")
	now = dt.now(tz)
	now_str = dt.strftime(now, "%d%m%Y%H%M%S")
	try:
		grooming_json = json.loads(grooming_data)

		grooming_check = frappe.get_list("VetGrooming", filters={'name': grooming_json.get('name')}, fields=['name', 'status'])
		if grooming_check:
			old_status = grooming_check[0].status
			grooming = frappe.get_doc("VetGrooming", grooming_check[0].name)

			if grooming_check and old_status  == 'Draft':
				# grooming = frappe.get_doc("VetGrooming", grooming_check[0].name)
				# grooming_data = {}
				# grooming_data.update(grooming_json)
				# grooming_data.pop('name')
				# grooming_data.pop('actions')
				# grooming_data.pop('new_actions')
				# grooming_data.pop('products')
				# grooming_data.pop('new_products')
				# grooming_data.pop('register_number')
				# grooming_data.pop('pet')
				# grooming_data.pop('service')
				# grooming_data.pop('action')
				# grooming_data.pop('attachments')
				# grooming_data.pop('marker')
				# grooming.update(grooming_data)
				grooming.update({'status': 'Checked'})
				grooming.save()
	
				# for new_product in grooming_json.get("new_products"):
				# 	product_data = {}
				# 	product_data.update(new_product)
				# 	product_data.update({'parent': grooming.name, 'parenttype': 'VetGrooming', 'parentfield': 'products'})
	
				# 	new_product = frappe.new_doc("VetGroomingProduct")
				# 	new_product.update(product_data)
	
				# 	grooming.products.append(new_product)
	
				# 	grooming.save()
	
				# for new_action in grooming_json.get("new_actions"):
				# 	action_data = {}
				# 	action_data.update(new_action)
				# 	action_data.update({'parent': grooming.name, 'parenttype': 'VetGrooming', 'parentfield': 'actions'})
	
				# 	new_action = frappe.new_doc("VetGroomingAction")
				# 	new_action.update(action_data)
	
				# 	grooming.actions.append(new_action)
	
				# 	grooming.save()
	
				# for product in grooming_json.get("products"):
				# 	product_doc = frappe.get_doc("VetGroomingProduct", product.get('name'))
				# 	if product_doc:
				# 		if product.get("delete"):
				# 			frappe.delete_doc("VetGroomingProduct", product.get('name'))
				# 		else:
				# 			product_doc.update({
				# 					'product': product.get('product'),
				# 					'quantity': product.get('quantity'),
				# 				})
		
				# 			product_doc.save()
	
				# for action in grooming_json.get("actions"):
				# 	action_doc = frappe.get_doc("VetGroomingAction", action.get('name'))
	
				# 	if action_doc:
				# 		action_doc.update({
				# 				'date': action.get('date'),
				# 				'note': action.get('note'),
				# 			})
	
				# 		action_doc.save()
						
				# for attachment in grooming_json.get('attachments'):
				# 	if not attachment.get('name'):
				# 		new_attachment_doc = frappe.new_doc('VetGroomingAttachments')
				# 		filename = now_str+"-"+grooming.name+"-"+attachment.get("filename")
				# 		filedoc = save_file(filename, attachment.get("dataurl"), "VetGrooming", grooming.name, decode=True, is_private=0)
				# 		new_attachment_doc.update({'title': attachment.get('title'), "attachment": filedoc.file_url, 'parent': grooming.name, 'parenttype': 'VetGrooming', 'parentfield': 'attachments'})
				# 		grooming.attachments.append(new_attachment_doc)
				# 		grooming.save()
				# 	else:
				# 		if attachment.get('deleted'):
				# 			frappe.delete_doc('VetGroomingAttachments', attachment.get('name'))
							
				# if grooming_json.get("marker"):
				# 	marker = frappe.new_doc('VetMarker')
				# 	marker.update({'type': grooming_json.get("marker").get('type'), 'markers':  grooming_json.get("marker").get('markers')})
				# 	marker.insert()
				# 	grooming.update({'marker': marker.name})
				# 	grooming.save()
						
				rekam_medis_data = {}
				rekam_medis_data.update(grooming_json)
				rekam_medis_data.pop('name')
				rekam_medis_data.pop('actions')
				rekam_medis_data.pop('new_actions')
				rekam_medis_data.pop('products')
				rekam_medis_data.pop('new_products')
				rekam_medis_data.pop('attachments')
				rekam_medis_data.pop('marker')
	
				rekam_medis_data.update({'marker': grooming.marker})
				add_rekam_medis(json.dumps(rekam_medis_data), grooming_json.get('name'))
	
				for action in grooming.actions:
					now = dt.now(tz)
					scheduled_service_data = {
						'create_date': dt.strftime(now, "%Y-%m-%d %H:%M:%S"),
						'register_number': grooming_json.get('register_number'),
						'pet': grooming_json.get('pet'),
						'service': 'Grooming',
						'user': frappe.session.user,
						'description': action.note,
						'schedule_date': action.date,
					}
	
					new_scheduled_service = frappe.new_doc("VetScheduledService")
					new_scheduled_service.update(scheduled_service_data)
					new_scheduled_service.insert()
	
				# return {'grooming': grooming}
				
			if grooming_check and old_status == 'Checked' or is_done:
				grooming = frappe.get_doc("VetGrooming", grooming_check[0].name)
				grooming.update({'status': 'Done'})
				grooming.save()
				
				grooming.reload()
				
				products = []
				dokter_products = []
				
				for product in grooming.products:
					is_dokter = False
					product_category_name = frappe.db.get_value('VetProduct', product.product, 'product_category')
					if product_category_name:
						is_dokter = frappe.db.get_value('VetProductCategory', product_category_name, 'is_dokter')
					
					if is_dokter in [False, '0']:
						product_data = {
							'product': product.product,
							# 'quantity': math.ceil(float(product.quantity)),
							'quantity': float(product.quantity),
						}
						
						default_warehouse = frappe.get_list('VetGudang', filters={'is_default': '1'}, fields=['name', 'gudang_name'], limit=1)
						if product_category_name:
							stockable = frappe.db.get_value('VetProductCategory', product_category_name, 'stockable') or False
						if len(default_warehouse) > 0 and stockable:
							product_data.update({'warehouse': default_warehouse[0].name})
						
						products.append(product_data)
					else:
						product_data = {
							'product': product.product,
							# 'quantity': math.ceil(float(product.quantity)),
							'quantity': float(product.quantity),
						}
						dokter_products.append(product_data)
						
				if len(dokter_products) > 0:
					dokter = frappe.new_doc('VetTindakanDokter')
					dokter.update({'reception': grooming.reception, 'description': grooming.description, 'reception_date': grooming.reception_date, 'jasa': dokter_products})
					
					dokter.insert()
					frappe.db.commit()
	
				invoice_data = {
					'register_number': grooming.register_number,
					'pet': grooming.pet,
					'products': products,
				}
	
				add_invoice(json.dumps(invoice_data), grooming.name)
				
				# return {'grooming': grooming}
			return {'grooming': grooming}
			
		else:
			return {'error': "Grooming tidak ditemukan"}

	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()
def add_rekam_medis(rekam_medis_data, grooming_id):
	try:
		tz = pytz.timezone("Asia/Jakarta")

		grooming_check = frappe.get_list("VetGrooming", filters={'name': grooming_id}, fields=['name'])
		attachments = frappe.get_list("VetGroomingAttachments", filters={'parent': grooming_id}, fields=['title', 'attachment'])

		if grooming_check:

			rekam_medis_json = json.loads(rekam_medis_data)

			rekam_medis = frappe.new_doc("VetRekamMedis")
			rekmed_data = {}
			rekmed_data.update(rekam_medis_json)
				
			rekam_medis.update(rekmed_data)
			
			if len(attachments):
				rekam_medis.update({'attachments': attachments})

			if not rekam_medis.record_date:
				now = dt.now(tz)
				rekam_medis.record_date = dt.strftime(now, "%Y-%m-%d %H:%M:%S")

			rekam_medis.insert()

			grooming = frappe.get_doc("VetGrooming", grooming_check[0].name)
			grooming.update({'rekam_medis': rekam_medis.name})
			grooming.save()

			return {'grooming': grooming}

		else:
			# frappe.msgprint("Grooming tidak ditemukan")
			return {'error': "Grooming tidak ditemukan"}	

	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()
def add_invoice(invoice_data, grooming_id):
	try:
		tz = pytz.timezone("Asia/Jakarta")

		grooming_check = frappe.get_list("VetGrooming", filters={'name': grooming_id}, fields=['name'])

		if grooming_check:
			invoice_json = json.loads(invoice_data)

			invoice = frappe.new_doc("VetCustomerInvoice")
			now = dt.now(tz)
			now_1_hour = now + rd(hours=1)
			invoice_date = dt.strftime(now, "%Y-%m-%d %H:%M:%S")
			due_date = dt.strftime(now_1_hour, "%Y-%m-%d %H:%M:%S")

			new_invoice_data = {
				'register_number': invoice_json.get('register_number'),
				'pet': invoice_json.get('pet'),
				'user': frappe.session.user,
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

			grooming = frappe.get_doc("VetGrooming", grooming_check[0].name)
			grooming.update({'invoice': invoice.name})
			grooming.save()

			return {'grooming': grooming}

		else:
			# frappe.msgprint("Grooming tidak ditemukan")
			return {'error': "Grooming tidak ditemukan"}

	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_grooming_list(filters=None):
	default_sort = "creation desc"
	grooming_filters = []
	grooming_or_filters = []
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
				grooming_filters.append(fj)

		if search:
			grooming_or_filters.append({'pet_name': ['like', '%'+search+'%']})
			grooming_or_filters.append({'pet': ['like', '%'+search+'%']})
			grooming_or_filters.append({'owner_name': ['like', '%'+search+'%']})
			grooming_or_filters.append({'description': ['like', '%'+search+'%']})
			grooming_or_filters.append({'status': ['like', '%'+search+'%']})

		if sort:
			default_sort = sort
	
	try:
		grooming = frappe.get_list("VetGrooming", or_filters=grooming_or_filters, filters=grooming_filters, fields=["reception", "reception_date", "pet", "pet_name", "description", "status", "name"], order_by=default_sort, start=(page - 1) * 10, page_length= 10)
		datalength = len(frappe.get_all("VetGrooming", or_filters=grooming_or_filters, filters=grooming_filters, as_list=True))
		for g in range(len(grooming)):
			pet = frappe.get_list("VetPet", filters={'name': grooming[g]['pet']}, fields=["parent"])
			pet_owner = frappe.get_list("VetPetOwner", filters={'name': pet[0]['parent']}, fields=["owner_name"])
			grooming[g]['queue'] = frappe.db.get_value('VetReception', grooming[g]['reception'], 'queue')
			grooming[g]['pet_owner'] = pet_owner[0]
			
		return {'grooming': grooming, 'datalength': datalength}
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_name_list(filters=None):
	default_sort = "creation desc"
	grooming_filters = []
	grooming_or_filters = []
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
				grooming_filters.append(fj)

		if search:
			grooming_or_filters.append({'pet_name': ['like', '%'+search+'%']})
			grooming_or_filters.append({'pet': ['like', '%'+search+'%']})
			grooming_or_filters.append({'owner_name': ['like', '%'+search+'%']})
			grooming_or_filters.append({'description': ['like', '%'+search+'%']})
			grooming_or_filters.append({'status': ['like', '%'+search+'%']})

		if sort:
			default_sort = sort
	
	try:
		namelist = frappe.get_all("VetGrooming", or_filters=grooming_or_filters, filters=grooming_filters, order_by=default_sort, as_list=True)
			
		return list(map(lambda item: item[0], namelist))
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def delete_grooming(data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal menghapus grooming"}
	
	for d in data_json:
		frappe.delete_doc('VetGrooming', d)
		frappe.db.commit()
		
	return {'success': True}
	
@frappe.whitelist()
def get_grooming(name):
	try:
		grooming = frappe.get_list('VetGrooming', filters={'name': name}, fields=['*'])
		products = frappe.get_list('VetGroomingProduct', filters={'parent': name}, fields=['*'])
		actions = frappe.get_list('VetGroomingAction', filters={'parent': name}, fields=['*'])
		pet = frappe.get_list("VetPet", filters={'name': grooming[0]['pet']}, fields=['*'])
		pet_owner = frappe.get_list("VetPetOwner", filters={'name': pet[0]['parent']}, fields=['*'])
		attachments = frappe.get_list("VetGroomingAttachments", filters={'parent': name}, fields=["*"])
		marker = None
		marker_list = frappe.get_list("VetMarker", filters={'name': grooming[0].marker}, fields=["*"])
		if len(marker_list):
			marker = frappe.get_doc("VetMarker", grooming[0].marker)
		
		for p in products:
			product = frappe.get_doc('VetProduct', p['product'])
			product_category = frappe.get_doc('VetProductCategory', product.product_category)
			uom = frappe.get_doc("VetUOM", product.product_uom)
			p['product_name'] = product.product_name
			p['price'] = product.price
			p['uom'] = uom.uom_name
			p['is_dokter'] = product_category.is_dokter
		grooming[0]['products'] = products
		grooming[0]['actions'] = actions
		grooming[0]['attachments'] = attachments
		grooming[0]['marker'] = marker
		grooming[0]['queue'] = frappe.db.get_value('VetReception', grooming[0]['reception'], 'queue')
		grooming[0]['owner_full_name'] = frappe.db.get_value('User', grooming[0]['owner'], 'full_name')
		tindakan_dokter = frappe.get_list('VetTindakanDokter', filters={'register_number': grooming[0].register_number}, fields=['name'])
		if len(tindakan_dokter) > 0:
			grooming[0]['tindakan_dokter'] = list(t.name for t in tindakan_dokter)
			
		customer_invoice = frappe.get_list('VetCustomerInvoice', filters={'register_number': grooming[0].register_number}, fields=['name'])
		if len(customer_invoice) > 0:
			grooming[0]['customer_invoice'] = list(c.name for c in customer_invoice)
		
		# products_all = frappe.get_list("VetProduct", filters={'service': 'VS-2'}, fields=['name', 'product_name'])
		# product_category = frappe.get_list("VetProductCategory", or_filters=[('is_grooming','=',1),('is_obat','=',1),('is_dokter','=',1)], fields=['name'])
		# product_category_map = map(lambda x: x.name, product_category)
		# products_all = frappe.get_list("VetProduct", filters={'product_category': ['in', list(product_category_map)]}, fields=['name', 'product_name', 'product_category'])
		# for p in products_all:
		# 	product_category_search = frappe.get_list("VetProductCategory", filters={'name': p.product_category}, fields=['name', 'category_name', 'is_grooming', 'is_dokter'])
		# 	if len(product_category_search) != 0:
		# 		p.update({'product_category': product_category_search[0]})
		# products_all = []

		total_spending = 10000
		
		version = frappe.get_list('Version', filters={'ref_doctype': 'VetGrooming', 'docname': name}, fields=['*'], order_by="creation desc")
		for v in version:
			data = json.loads(v['data'])
			if data.get('changed', False):
				for c in data.get('changed', False):
					label = frappe.db.get_value('DocField', {'parent': 'VetGrooming', 'fieldname': c[0]}, 'label')
					c[0] = label
			v['data'] = data
		
		res = {'grooming': grooming[0], 'pet': pet[0], 'pet_owner': pet_owner[0], 'total_spending': total_spending, 'version': version, 'products_all': []}
		return res
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_all_products():
	try:
		product_category = frappe.get_list("VetProductCategory", or_filters=[('is_grooming','=',1),('is_obat','=',1),('is_dokter','=',1)], fields=['name'])
		product_category_map = map(lambda x: x.name, product_category)
		products_all = frappe.get_list("VetProduct", filters={'product_category': ['in', list(product_category_map)], 'active': True}, fields=['name', 'product_name', 'product_category'])
		for p in products_all:
			product_category_search = frappe.get_list("VetProductCategory", filters={'name': p.product_category}, fields=['name', 'category_name', 'is_grooming', 'is_dokter'])
			if len(product_category_search) != 0:
				p.update({'product_category': product_category_search[0]})
				
		return products_all
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def cancel_grooming(name):
	try:
		grooming = frappe.get_doc('VetGrooming', name)
		grooming.status = 'Cancel'
		grooming.save()
		frappe.db.commit()
		return {'success': True}
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def autosave(field, value, name):
	try:
		tz = pytz.timezone("Asia/Jakarta")
		if field == 'actions':
			value_json = json.loads(value)
			action = frappe.get_list('VetGroomingAction', filters={'parent': name}, fields=['name'])
			if len(action) == 0:
				doc = frappe.get_doc('VetGrooming', name)
				doc.reload()
				doc.update({
					'actions': [value_json]
				})
				doc.save()
			else:
				for key in value_json.keys():
					frappe.db.set_value('VetGroomingAction', action[0].name, key, value_json.get(key, False), update_modified=False)
		elif field == 'products':
			value_json = json.loads(value)
			jasa = []
			for v in value_json:
				json_data = {
					'product': v['product'],
					'quantity': v['quantity']
				}
				jasa.append(json_data)
			doc = frappe.get_doc('VetGrooming', name)
			doc.update({
				'products' : jasa
			})
			doc.save()
		elif field == 'attachments':
			value_json = json.loads(value)
			attachments = []
			doc = frappe.get_doc('VetGrooming', name)
			
			for r in doc.attachments:
				if len([u for u in value_json if u.get('name', '') == r.name]) == 0:
					remove_file_by_url(r.attachment, 'VetGrooming')
			
			for v in value_json:
				now = dt.now(tz)
				now_str = dt.strftime(now, "%d%m%Y%H%M%S")
				json_data = {'title': v['title']}
				if v.get('name'):
					json_data['attachment'] = v['attachment']
				else:
					filename = now_str+"-"+name+"-"+v['filename']
					filedoc = save_file(filename, v['dataurl'], "VetGrooming", name, decode=True, is_private=0)
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
					frappe.db.set_value('VetGrooming', name, 'marker', marker.name, update_modified=False)
				else:
					marker = frappe.get_doc('VetMarker', value_json['name'])
					marker.update({'type': value_json['type'], 'markers': value_json['markers']})
					marker.save()
					frappe.db.commit()
			elif field == 'marker_delete':
				frappe.db.set_value('VetGrooming', name, 'marker', '', update_modified=False)
				if value_json.get('name'):
					frappe.delete_doc('VetMarker', value_json['name'])
		else :
			frappe.db.set_value('VetGrooming', name, field, value, update_modified=False)
			
		frappe.db.commit()
		return True
	except Exception as e:
		return {'error': e, 'data': get_grooming(name)}