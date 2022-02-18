# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
import os
import string
import random
from datetime import datetime as dt
from dateutil.relativedelta import relativedelta as rd
from frappe.utils.data import to_markdown
from frappe.utils.file_manager import save_file
from frappe.core.doctype.file.file import get_local_image
from frappe.model.document import Document

class VetReception(Document):
	pass

@frappe.whitelist()
def new_reception(owner_data, reception_data):
	now = dt.now()
	now_str = dt.strftime(now, "%d%m%Y%H%M%S")
	try:
		new_owner_data = json.loads(owner_data)
		new_reception_data = json.loads(reception_data)

		owner = frappe.get_list("VetPetOwner", filters={'name': new_owner_data.get('name', False)}, fields=['name'])
		selected_new_pet = False

		if owner and new_owner_data.get('code') != 'SCANID':
			owner_doc = frappe.get_doc("VetPetOwner", owner[0].name)
			if new_owner_data.get("pets"):
				for pet in new_owner_data.get("pets"):
					if not pet.get('name', False) or pet.get('name', False) == '/':
						pet_data = {}
						pet_data.update(pet)
						pet_data.pop('selected')
						pet_data.pop('name')
						pet_data.update({'parent': owner[0].name, 'parenttype': 'VetPetOwner', 'parentfield': 'pets'})
						
						if not pet_data.get("code", False):
							pet_data.update({'code': ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(10))})
	
						new_pet = frappe.new_doc("VetPet")
						new_pet.update(pet_data)
						if pet.get("dataurl"):
							filename = now_str+"-"+pet["filename"]
							filedoc = save_file(filename, pet["dataurl"], "VetPet", new_pet.name, decode=True, is_private=0)
							filedoc.make_thumbnail()
							resize_image(filedoc.file_url)
							new_pet.update({"pet_image": filedoc.file_url, 'pet_image_thumbnail': filedoc.thumbnail_url})
						new_pet.insert()
	
						owner_doc.pets.append(new_pet)
						owner_doc.save()
						frappe.db.commit()

					if pet.get("selected"):
						if pet.get('name', False) == '/':
							selected_new_pet = new_pet.name
						else:
							selected_new_pet = pet.get('name', False)

		else:
			new_owner_doc_data = {}
			new_owner_doc_data.update(new_owner_data)
			new_owner_doc_data.pop('pets')
			
			if not new_owner_doc_data.get("code", False) or new_owner_doc_data.get("code") == 'SCANID':
				new_owner_doc_data.update({'code': ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(10))})

			new_owner_doc = frappe.new_doc("VetPetOwner")
			new_owner_doc.update(new_owner_doc_data)

			new_owner_doc.insert()
			frappe.db.commit()
			
			if new_owner_doc_data.get("dataurl"):
				filename = now_str+"-"+new_owner_doc_data["filename"]
				filedoc = save_file(filename, new_owner_doc_data["dataurl"], "VetPetOwner", new_owner_doc.name, decode=True, is_private=0)
				new_owner_doc.update({"foto_identias": filedoc.file_url})
				new_owner_doc.save()
				frappe.db.commit()

			for pet in new_owner_data.get("pets"):
				pet_data = {}
				pet_data.update(pet)
				pet_data.pop('selected')
				pet_data.pop('name')
				pet_data.update({'parent': new_owner_doc.name, 'parenttype': 'VetPetOwner', 'parentfield': 'pets'})
				
				if not pet_data.get("code", False):
					pet_data.update({'code': ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(10))})

				new_pet = frappe.new_doc("VetPet")
				new_pet.update(pet_data)
				if pet.get("dataurl"):
					filename = now_str+"-"+pet["filename"]
					filedoc = save_file(filename, pet["dataurl"], "VetPet", new_pet.name, decode=True, is_private=0)
					filedoc.make_thumbnail()
					resize_image(filedoc.file_url)
					new_pet.update({"pet_image": filedoc.file_url, 'pet_image_thumbnail': filedoc.thumbnail_url})
				new_pet.insert()

				new_owner_doc.pets.append(new_pet)
				new_owner_doc.save()
				frappe.db.commit()

				if pet.get("selected"):
					selected_new_pet = new_pet.name
		
		reception_list = frappe.get_list("VetReception", filters={'reception_date': ['between', [dt.now().strftime('%Y-%m-%d'), (dt.now() + rd(days=1)).strftime('%Y-%m-%d')]]}, fields=['name'])
		reception = frappe.new_doc("VetReception")
		reception.update(new_reception_data)
		reception.update({'queue': len(reception_list) + 1})

		if selected_new_pet:
			reception.update({'pet': selected_new_pet})

		if not reception.reception_date:
			now = dt.now()
			reception.reception_date = dt.strftime(now, "%Y-%m-%d %H:%M:%S")

		reception.insert()
		frappe.db.commit()

		task = frappe.new_doc("VetTask")
		task.update({
				'reception': reception.name,
				'description': reception.description,
			})
		task.insert()
		frappe.db.commit()
		reception.update({'register_number': task.name})
		
		reception.save()
		frappe.db.commit()

		service = frappe.get_doc("VetService", reception.service)
		if service.service_name == "Grooming":
			grooming = frappe.new_doc("VetGrooming")
			grooming.update({'reception': reception.name})
			grooming.append("products", {"product": reception.service_detail, "quantity": 1})

			grooming.insert()
			frappe.db.commit()
		elif service.service_name == "Dokter":
			dokter = frappe.new_doc('VetTindakanDokter')
			dokter.update({'reception': reception.name, 'description': reception.description, 'reception_date': reception.reception_date, 'dokter': reception.owner})
			dokter.append("jasa", {"product": reception.service_detail, "quantity": 1})
			
			dokter.insert()
			frappe.db.commit()

		return {'reception': reception}

	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()
def get_product_option(service_name):
	try:
		products = frappe.get_list("VetProduct", filters={'service': service_name}, fields=['name', 'product_name'])
		product_option_render = frappe.render_template('templates/reception/product_options.html', {'products': products})
		return {'render': product_option_render}
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_reception(name):
	try:
		reception = frappe.get_list('VetReception', filters={'name': name}, fields=['*'])
		pet = frappe.get_list('VetPet', filters={'name': reception[0]['pet']}, fields=['*'])
		petOwner = frappe.get_list('VetPetOwner', filters={'name': pet[0]['parent']}, fields=['*'])
		service = frappe.get_list('VetService', filters={'name': reception[0]['service']}, fields=['*'])
		product = frappe.get_list('VetProduct', filters={'name': reception[0]['service_detail']}, fields=['*'])
		petType = frappe.get_doc('VetPetType', pet[0]['hewan_jenis']) 
		reception[0]['service_name'] = service[0]['service_name']
		reception[0]['product_name'] = product[0]['product_name']
		pet[0]['type_name'] = petType.type_name
		if service[0]['service_name'] == 'Dokter':
			tindakan_dokter = frappe.db.get_list('VetTindakanDokter', filters={'register_number': reception[0].register_number}, fields=['name'])
			reception[0]['tindakan_dokter'] = list(t.name for t in tindakan_dokter)
		elif service[0]['service_name'] == 'Grooming':
			grooming = frappe.db.get_list('VetGrooming', filters={'register_number': reception[0].register_number}, fields=['name'])
			reception[0]['grooming'] = list(g.name for g in grooming)
		
		# invoice = frappe.db.get_list("VetCustomerInvoice", filters={'register_number': reception[0]['register_number']}, fields=['total', 'name'])
		invoice = frappe.db.get_list("VetCustomerInvoice", filters={'pet': reception[0]['pet']}, fields=['total', 'name'])
		# total_spending = 0
		# for iv in invoice:
		# 	pembayaran = frappe.db.get_list("VetCustomerInvoicePay", filters={'parent': iv['name']}, fields=['jumlah'])
		# 	total_spending += sum(p['jumlah'] for p in pembayaran) 
		total_spending = sum(i.total for i in invoice) 
		rekam_medis = frappe.db.count('VetRekamMedis', {'register_number': reception[0]['register_number']})
		scheduled_service = frappe.get_list('VetScheduledService', filters={'register_number': reception[0]['register_number']}, fields=['*'])
		condition = ''
		schedule_date = ''
		
		customer_invoice = frappe.get_list('VetCustomerInvoice', filters={'register_number': reception[0].register_number, 'is_rawat_inap': 0}, fields=['name'])
		if len(customer_invoice) > 0:
			reception[0].customer_invoice = list(c.name for c in customer_invoice)
			
		rawat_inap_invoice = frappe.get_list('VetCustomerInvoice', filters={'register_number': reception[0].register_number, 'is_rawat_inap': 1}, fields=['name'])
		if len(rawat_inap_invoice) > 0:
			reception[0].rawat_inap_invoice = list(c.name for c in rawat_inap_invoice)
			
		if scheduled_service:
			schedule_date = scheduled_service[0]['schedule_date']
		else:
			schedule_date = '-'
			
		res = {'reception': reception[0], 'pet': pet, 'petOwner': petOwner[0], 'total_spending': total_spending, 'rekam_medis': rekam_medis, 'kunjungan_berikutnya': schedule_date}
		return res
	except PermissionError as e:
		return{'error': e}
		
@frappe.whitelist()
def get_pet(name):
	default_sort = "creation desc"
	try:
		pet = frappe.get_doc('VetPet', name)
		owner = frappe.get_list("VetPetOwner", filters={'name': pet.parent}, fields=['*'], order_by=default_sort)
		for o in owner:
			pets = frappe.get_list("VetPet", filters={'parent': o.name}, fields=['name', 'pet_name', 'hewan_jenis', 'register_date', 'pet_description', 'pet_image', 'pet_image_thumbnail', 'status', 'birth_date', 'jenis_kelamin'], order_by='register_date asc')
			petTypeAll = frappe.get_list('VetPetType', fields=['name', 'type_name'])
			total_visit = 0
			total_spending = 0
			last_credit = frappe.get_list('VetOwnerCredit', filters={'pet_owner': o.name}, fields=['credit','debt'], order_by="creation desc")
			if last_credit:
				total_credit = last_credit[0]['credit']
				total_debt = last_credit[0]['debt']
			else:
				total_credit = 0
				total_debt = 0
				
			total_remaining = 0
			all_remaining = frappe.get_list('VetCustomerInvoice', filters={'status': 'Draft', 'is_rawat_inap': 1, 'owner': o.name}, fields=['sum(total) as all_remaining'])
			if len(all_remaining) > 0:
				total_remaining = all_remaining[0].all_remaining
				
			for p in pets:
				pet_type = frappe.get_doc("VetPetType", p.hewan_jenis)
				visit = frappe.db.count('VetReception', {'pet': p.name})
				invoice = frappe.db.get_list("VetCustomerInvoice", filters={'pet': p['name']}, fields=['total', 'name'])
				# spending = 0
				# for iv in invoice:
				# 	pembayaran = frappe.db.get_list("VetCustomerInvoicePay", filters={'parent': iv['name']}, fields=['jumlah'])
				# 	spending += sum(p['jumlah'] for p in pembayaran)
				spending = sum(i.total for i in invoice) 
				total_visit += visit
				total_spending += spending
				p.update({'hewan_jenis_label': pet_type.type_name, 'type_name': pet_type.type_name, 'visit': str(visit), 'spending': str(spending)})
			o.update({'pets': pets, 'total_spending': total_spending, 'total_visit': total_visit, 'petType': petTypeAll, 'total_credit': total_credit, 'total_remaining': total_remaining, 'total_debt': total_debt})
		return owner
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()	
def get_services():
	try:
		services = frappe.get_list("VetService", fields=['name', 'service_name'])
		product_category = frappe.get_list("VetProductCategory", or_filters=[('is_dokter','=',1),('is_grooming','=',1)], fields=['name'])
		product_category_map = map(lambda x: x.name, product_category)
		products = frappe.get_list("VetProduct", filters={'product_category': ['in', list(product_category_map)]}, fields=['name', 'product_name', 'product_category'])
		for p in products:
			product_category_search = frappe.get_list("VetProductCategory", filters={'name': p.product_category}, fields=['name', 'category_name', 'is_grooming', 'is_dokter'])
			if len(product_category_search) != 0:
				p.update({'product_category': product_category_search[0]})
		petTypeAll = frappe.get_list('VetPetType', fields=['name', 'type_name'])
		res = {'services': services, 'products': products, 'petType': petTypeAll}
		return res
	except PermissionError as e:
		return{'error': e}
		
@frappe.whitelist()	
def get_product_by_service(name):
	try:
		products = frappe.get_list("VetProduct", filters={'service': name}, fields=['name', 'product_name'])
		return {'products': products}
	except PermissionError as e:
		return{'error': e}
	
@frappe.whitelist()
def get_reception_list(filters=None):
	default_sort = "creation desc"
	reception_or_filters = []
	reception_filters = []
	filter_json = False
	page = 1
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
		
	if filter_json:
		sort = filter_json.get('sort', False)
		petOwner = filter_json.get('petOwner', False)
		pet_search = filter_json.get('pet', False)
		filters_json = filter_json.get('filters', False)
		currentpage = filter_json.get('currentpage', False)
		search = filter_json.get('search', False)

		if currentpage:
			page = currentpage
		
		if sort:
			default_sort = sort

		if filters_json:
			for fj in filters_json:
				reception_filters.append(fj)

		if search:
			reception_or_filters.append({'register_number': ['like', '%'+search+'%']})
			# reception_or_filters.append({'service': ['like', '%'+search+'%']})
			reception_or_filters.append({'pet_name': ['like', '%'+search+'%']})
			reception_or_filters.append({'pet_owner_name': ['like', '%'+search+'%']})
			reception_or_filters.append({'description': ['like', '%'+search+'%']})
			
		if petOwner:
			owner = frappe.get_doc("VetPetOwner", petOwner)
			for p in owner.pets:
				reception_or_filters.append(('pet', '=', p.name))
				
		if pet_search:
			reception_filters.append(('pet', '=', pet_search))
	
	print(reception_filters)
	print(reception_or_filters)
	try:
		reception = frappe.get_list("VetReception", filters=reception_filters, or_filters=reception_or_filters, fields=["reception_date", "description", "name", "pet", "owner", "service", "queue", "register_number"], order_by=default_sort, start=(page - 1) * 10, page_length= 10)
		datalength = len(frappe.get_all("VetReception", filters=reception_filters, or_filters=reception_or_filters, as_list=True))
		for r in range(len(reception)):
			pet = frappe.get_list("VetPet", filters={'name': reception[r]['pet']}, fields=["pet_name", "parent", "name"])
			pet_owner = frappe.get_list("VetPetOwner", filters={'name': pet[0]['parent']}, fields=["owner_name"])
			service = frappe.get_list("VetService", filters={'name': reception[r]['service']}, fields=["name","service_name"])
			
			reception[r]['pet'] = pet[0]
			reception[r]['pet_owner'] = pet_owner[0]
			reception[r]['service'] = service[0]
		return {'reception' : reception, 'datalength': datalength}
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_name_list(filters=None):
	reception_or_filters = []
	reception_filters = []
	filter_json = False
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
		
	if filter_json:
		petOwner = filter_json.get('petOwner', False)
		pet_search = filter_json.get('pet', False)
		filters_json = filter_json.get('filters', False)
		search = filter_json.get('search', False)

		if filters_json:
			for fj in filters_json:
				reception_filters.append(fj)
			
		if petOwner:
			owner = frappe.get_doc("VetPetOwner", petOwner)
			for p in owner.pets:
				reception_or_filters.append(('pet', '=', p.name))
				
		if pet_search:
			reception_filters.append(('pet', '=', pet_search))

		if search:
			reception_or_filters.append({'register_number': ['like', '%'+search+'%']})
			# reception_or_filters.append({'service': ['like', '%'+search+'%']})
			reception_or_filters.append({'pet_name': ['like', '%'+search+'%']})
			reception_or_filters.append({'pet_owner_name': ['like', '%'+search+'%']})
			reception_or_filters.append({'description': ['like', '%'+search+'%']})
	
	try:
		namelist = frappe.get_all("VetReception", or_filters=reception_or_filters, filters=reception_filters, as_list=True)
		
		return list(map(lambda item: item[0], namelist))
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def delete_reception(data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal menghapus penerimaan"}
	
	for d in data_json:
		frappe.delete_doc('VetReception', d)
		frappe.db.commit()
		
	return {'success': True}
	
def resize_image(file_url):
    try:
        image, filename, extn = get_local_image(file_url)
    except IOError:
        return
    image.thumbnail((800,800))

    image_url = filename + "." + extn

    path = os.path.abspath(frappe.get_site_path("public", image_url.lstrip("/")))

    try:
        image.save(path)
        print(file_url+" oke")
    except IOError:
        print(_("Unable to write file format for {0}").format(path))
        return

    return image_url