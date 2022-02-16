# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
import math
from datetime import datetime as dt
from dateutil.relativedelta import relativedelta as rd
from frappe.model.document import Document
from vet_website.vet_website.doctype.vetproductpack.vetproductpack import get_pack_price

class VetApotik(Document):
	pass

@frappe.whitelist()
def get_apotik_list(filters=None):
	default_sort = "creation desc"
	apotik_filters = []
	apotik_or_filters = []
	filter_json = False
	result_filter = lambda a: a
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
				if fj[0] != 'dokter':
					apotik_filters.append(fj)
				else:
					fj[0] = "a.dokter.lower()"
					if fj[1] == "=":
						fj[1] = "=="
					elif fj[1] == 'like':
						fj[1] = 'in'
					elif fj[1] == 'not like':
						fj[1] = 'not in'
					if fj[1] not in ['in', 'not in']:
						result_filter = lambda a: eval(" ".join(fj))
					else:
						fj[2] = fj[2].replace('%',"'").lower()
						fj.reverse()
						result_filter = lambda a: eval(" ".join(fj))
		
		if search:
			apotik_or_filters.append({'name': ['like', '%'+search+'%']})
			apotik_or_filters.append({'register_number': ['like', '%'+search+'%']})
			apotik_or_filters.append({'pet_name': ['like', '%'+search+'%']})
			apotik_or_filters.append({'pet': ['like', '%'+search+'%']})
			apotik_or_filters.append({'owner_name': ['like', '%'+search+'%']})
			apotik_or_filters.append({'dokter': ['like', '%'+search+'%']})
			apotik_or_filters.append({'status': ['like', '%'+search+'%']})
				
		if sort:
			sorts = sort.split(',')
			for i,s in enumerate(sorts):
				if 'dokter' in s:
					sorts.pop(i)
					sort_filter = lambda o: o['dokter']
					s_words = s.split(' ')
					if s_words[1] == 'desc':
						sort_filter_reverse = True
			default_sort = ','.join(sorts)
	
	try:
		apotik = frappe.get_list("VetApotik", or_filters=apotik_or_filters, filters=apotik_filters, fields=["register_number", "name", "status", "owner", "pet"], order_by=default_sort, start=(page - 1) * 10, page_length= 10)
		datalength = len(frappe.get_all("VetApotik", or_filters=apotik_or_filters, filters=apotik_filters, as_list=True))
		for a in range(len(apotik)):
			if apotik[a]['register_number']:
			    reception = frappe.get_list('VetReception', filters={'register_number': apotik[a]['register_number']}, fields=['reception_date', 'pet'])
			    pet = frappe.get_list('VetPet', filters={'name': reception[0]['pet']}, fields=['parent', 'name', 'pet_name'])
			    pet_owner = frappe.get_list('VetPetOwner', filters={'name': pet[0]['parent']}, fields=['owner_name'])
			    
			    apotik[a]['reception'] = reception[0]
			    apotik[a]['pet'] = pet[0]
			    apotik[a]['pet_owner'] = pet_owner[0]
			    apotik[a]['dokter'] = frappe.db.get_value('User', apotik[a].owner, 'full_name')
			elif apotik[a]['pet']:
				pet = frappe.get_list('VetPet', filters={'name': apotik[a]['pet']}, fields=['parent', 'name', 'pet_name'])
				pet_owner = frappe.get_list('VetPetOwner', filters={'name': pet[0]['parent']}, fields=['owner_name'])
				apotik[a]['pet'] = pet[0]
				apotik[a]['pet_owner'] = pet_owner[0]
				apotik[a]['dokter'] = frappe.db.get_value('User', apotik[a].owner, 'full_name')
			
		if sort_filter != False:
			apotik.sort(key=sort_filter, reverse=sort_filter_reverse)
		apotik = filter(result_filter, apotik)
			
		return {'apotik': apotik, 'datalength': datalength}
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_name_list(filters=None):
	apotik_filters = []
	filter_json = False
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
		
	if filter_json:
		filters_json = filter_json.get('filters', False)
		
		if filters_json:
			for fj in filters_json:
				if fj[0] != 'dokter':
					apotik_filters.append(fj)
				else:
					fj[0] = "a.dokter.lower()"
					if fj[1] == "=":
						fj[1] = "=="
					elif fj[1] == 'like':
						fj[1] = 'in'
					elif fj[1] == 'not like':
						fj[1] = 'not in'
					# if fj[1] not in ['in', 'not in']:
					# else:
					# 	fj[2] = fj[2].replace('%',"'").lower()
					# 	fj.reverse()
	
	try:
		namelist = frappe.get_all("VetApotik", filters=apotik_filters, as_list=True)
			
		return list(map(lambda item: item[0], namelist))
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def delete_apotik(data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal menghapus apotik"}
	
	for d in data_json:
		frappe.delete_doc('VetApotik', d)
		frappe.db.commit()
		
	return {'success': True}
	
@frappe.whitelist()
def cancel_apotik(name):
	apotik = frappe.get_doc('VetApotik', name)
	apotik.status = 'Cancel'
	apotik.save()
	frappe.db.commit()
	return {'success': True}
	
@frappe.whitelist()
def get_apotik(name):
	try:
		list_product = []
		apotik = frappe.get_list('VetApotik', filters={'name': name}, fields=['*'])
		apotikProductNoRacikan = frappe.get_list('VetApotikProduct', filters={'parent': name, 'racikan': ['=', '']}, fields=['*'])
		apotikProductRacikan = frappe.get_list('VetApotikProduct', filters={'parent': name, 'racikan': ['!=', '']}, fields=['*'])
		
		if apotik[0].register_number:
			reception = frappe.get_list('VetReception', filters={'register_number': apotik[0]['register_number']}, fields=['*'])
			pet = frappe.get_list('VetPet', filters={'name': reception[0]['pet']}, fields=['*'])
			pet_owner = frappe.get_list('VetPetOwner', filters={'name': pet[0]['parent']}, fields=['*'])
		
		elif apotik[0].pet:
			reception = [{}]
			pet = frappe.get_list('VetPet', filters={'name': apotik[0]['pet']}, fields=['*'])
			pet_owner = frappe.get_list('VetPetOwner', filters={'name': pet[0]['parent']}, fields=['*'])
		
		# categories = frappe.get_list('VetProductCategory', or_filters={'is_obat': True, 'is_racikan': True}, fields=['name'])
		# categorie_names = (c.name for c in categories)
		# obatAll = frappe.get_list('VetProduct', filters={'product_category': ['in', categorie_names]}, fields=['*'])
		# warehouseAll = frappe.get_list('VetGudang', fields=['*'])
		
		apotikProduct = apotikProductNoRacikan + apotikProductRacikan
		
		# for o in range(len(obatAll)):
		# 	uom = frappe.get_list('VetUOM', filters={'name': obatAll[o]['product_uom']}, fields=['uom_name'])
		# 	obatAll[o]['uom_name'] = uom[0]['uom_name']
		# 	categ = frappe.get_list('VetProductCategory', filters={'name': obatAll[o]['product_category']}, fields=['*'])
		# 	obatAll[o]['product_category'] = categ[0]
		
		for a in range(len(apotikProduct)):
			product = frappe.get_list('VetProduct', filters={'name': apotikProduct[a]['product']}, fields=['*'])
			cate = frappe.get_list('VetProductCategory', filters={'name': product[0]['product_category']}, fields=['*'])
			uom = frappe.get_list('VetUOM', filters={'name': product[0]['product_uom']}, fields=['*'])
			product[0]['product_category'] = cate[0]
			product[0]['quantity'] = apotikProduct[a]['quantity']
			product[0]['note'] = apotikProduct[a]['note']
			product[0]['uom_name'] = uom[0]['uom_name']
			product[0]['apotik_product_name'] = apotikProduct[a]['name']
			product[0]['product_racikan'] = []
			
			if (apotikProduct[a]['racikan']):
				for ap in range(len(list_product)):
					if (list_product[ap]['apotik_product_name'] == apotikProduct[a]['racikan']):
						list_product[ap]['product_racikan'].append(product[0])
			else :
				list_product.append(product[0])
		
		reception[0]['pet'] = pet[0]
		reception[0]['pet_owner'] = pet_owner[0]
		apotik[0]['products'] = list_product
		apotik[0]['dokter'] = frappe.db.get_value('User', apotik[0].owner, 'full_name')
		tindakan_dokter = frappe.get_list('VetTindakanDokter', filters={'register_number': apotik[0].register_number}, fields=['name'])
		if len(tindakan_dokter) > 0:
			apotik[0]['tindakan_dokter'] = list(t.name for t in tindakan_dokter)
		customer_invoice = frappe.get_list('VetCustomerInvoice', or_filters={'pet': apotik[0].pet, 'register_number': apotik[0].register_number}, fields=['name'])
		if len(customer_invoice) > 0:
			apotik[0]['customer_invoice'] = list(c.name for c in customer_invoice)
		
		last_warehouse = frappe.db.get_single_value('VetSetting', 'apotik_warehouse')
		if last_warehouse and apotik[0]['status'] == 'Draft':
			warehouse = frappe.db.get_value('VetGudang', last_warehouse, 'gudang_name')
			apotik[0]['warehouse'] = warehouse
			
		version = frappe.get_list('Version', filters={'ref_doctype': 'VetApotik', 'docname': name}, fields=['*'], order_by="creation desc")
		for v in version:
			data = json.loads(v['data'])
			if data.get('changed', False):
				for c in data.get('changed', False):
					label = frappe.db.get_value('DocField', {'parent': 'VetApotik', 'fieldname': c[0]}, 'label')
					c[0] = label
			v['data'] = data
		
		res = {'apotik': apotik[0], 'reception': reception[0], 'obatAll': [], 'warehouseAll': [], 'last_warehouse': last_warehouse, 'version': version, 'petList': []}
		return res
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_warehouse_all():
	try:
		warehouseAll = frappe.get_list('VetGudang', fields=['*'])
		
		return warehouseAll
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_products_all():
	try:
		categories = frappe.get_list('VetProductCategory', or_filters={'is_obat': True, 'is_racikan': True}, fields=['name'])
		categorie_names = (c.name for c in categories)
		obatAll = frappe.get_list('VetProduct', filters={'product_category': ['in', categorie_names]}, fields=['*'])
		
		for o in range(len(obatAll)):
			uom = frappe.get_list('VetUOM', filters={'name': obatAll[o]['product_uom']}, fields=['uom_name'])
			obatAll[o]['uom_name'] = uom[0]['uom_name']
			categ = frappe.get_list('VetProductCategory', filters={'name': obatAll[o]['product_category']}, fields=['*'])
			obatAll[o]['product_category'] = categ[0]
		
		return obatAll
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_apotik_new():
	try:
		apotik = {
			'dokter': frappe.db.get_value('User', frappe.session.user, 'full_name'),
			'products': []
		}
		
		petOwnerList = frappe.get_list('VetPetOwner', fields=['*'])
		petList = frappe.get_list('VetPet', fields=['*'])
		for p in petList:
			p.pet_owner = next((pet_owner for pet_owner in petOwnerList if pet_owner.name == p.parent), False)
		
		# categories = frappe.get_list('VetProductCategory', or_filters={'is_obat': True, 'is_racikan': True}, fields=['name'])
		# categorie_names = (c.name for c in categories)
		# obatAll = frappe.get_list('VetProduct', filters={'product_category': ['in', categorie_names]}, fields=['*'])
		# warehouseAll = frappe.get_list('VetGudang', fields=['*'])
		
		# for o in range(len(obatAll)):
		# 	uom = frappe.get_list('VetUOM', filters={'name': obatAll[o]['product_uom']}, fields=['uom_name'])
		# 	obatAll[o]['uom_name'] = uom[0]['uom_name']
		# 	categ = frappe.get_list('VetProductCategory', filters={'name': obatAll[o]['product_category']}, fields=['*'])
		# 	obatAll[o]['product_category'] = categ[0]
			
		last_warehouse = frappe.db.get_single_value('VetSetting', 'apotik_warehouse')
		if last_warehouse:
			warehouse = frappe.db.get_value('VetGudang', last_warehouse, 'gudang_name')
			apotik.update({'warehouse': warehouse})
		
		res = {'apotik': apotik, 'reception': {}, 'obatAll': [], 'warehouseAll': [], 'last_warehouse': last_warehouse, 'petList': petList}
		return res
	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()
def new_apotik(data):
	try:
		apotik_json = json.loads(data)
		print(apotik_json)
		
		if apotik_json.get('warehouse', False):
			setting = frappe.get_doc('VetSetting')
			setting.apotik_warehouse = apotik_json.get('warehouse')
			setting.save()
			
		new_apotik = frappe.new_doc("VetApotik")
		apotik_data = {'status': 'Draft'}
		apotik_data.update(apotik_json)
		if apotik_data.get('name', False):
			apotik_data.pop('name')
		apotik_data.pop('products')
		new_apotik.update(apotik_data)
		new_apotik.insert()
		frappe.db.commit()
		
		for product in apotik_json.get("products"):
			product_data = {}
			product_data.update(product)
			product_data.pop('product_racikan')
			product_data.update({'parent': new_apotik.name, 'parenttype': 'VetApotik', 'parentfield': 'obat'})
	
			new_product = frappe.new_doc("VetApotikProduct")
			new_product.update(product_data)
	
			new_apotik.obat.append(new_product)
	
			new_apotik.save()
			frappe.db.commit()
			
			for pr in product.get("product_racikan"):
				pr_data = {}
				pr_data.update(pr)
				pr_data.update({'parent': new_apotik.name, 'parenttype': 'VetApotik', 'parentfield': 'obat', 'racikan': new_product.name})
				
				new_pr = frappe.new_doc("VetApotikProduct")
				new_pr.update(pr_data)
				
				new_apotik.obat.append(new_pr)
				
				new_apotik.save()
				frappe.db.commit()
				
		return {'apotik': new_apotik}
		
	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()
def submit_apotik(data, saveOnly=False):
	print(saveOnly)
	try:
		apotik_json = json.loads(data)

		apotik_check = frappe.get_list("VetApotik", filters={'name': apotik_json.get('name')}, fields=['name', 'status'])

		if apotik_check and apotik_check[0].status in ['Draft']:
			if apotik_json.get('warehouse', False):
				setting = frappe.get_doc('VetSetting')
				setting.apotik_warehouse = apotik_json.get('warehouse')
				setting.save()
			
			apotik = frappe.get_doc("VetApotik", apotik_check[0].name)
			apotik_data = {}
			apotik_data.update(apotik_json)
			apotik_data.pop('name')
			apotik_data.pop('products')
			apotik.update(apotik_data)
			if apotik.status == 'Draft' and not saveOnly:
				apotik.update({'status': 'Done'})
			apotik.save()
			frappe.db.commit()

			for product in apotik_json.get("products"):
				if product.get('apotik_product_name') != None:
					if product.get('is_delete') == True:
						frappe.delete_doc('VetApotikProduct', product.get('apotik_product_name'))
						
						for pr in product.get("product_racikan"):
							frappe.delete_doc('VetApotikProduct', pr.get('apotik_product_name'))
					else:
						old_product = frappe.get_doc('VetApotikProduct', product.get('apotik_product_name'))
					
						for pr in product.get("product_racikan"):
							if pr.get('apotik_product_name') != None:
								if pr.get('is_delete') == True:
									frappe.delete_doc('VetApotikProduct', pr.get('apotik_product_name'))
								else:
									obat_doc = frappe.get_doc('VetApotikProduct', pr.get('apotik_product_name'))
									obat_doc.reload()
									obat_doc.update({'racikan': old_product.name})
									obat_doc.save()
							else :
								pr_data = {}
								pr_data.update(pr)
								pr_data.update({'parent': apotik.name, 'parenttype': 'VetApotik', 'parentfield': 'obat', 'racikan': old_product.name})
								
								new_pr = frappe.new_doc("VetApotikProduct")
								new_pr.update(pr_data)
								
								apotik.obat.append(new_pr)
								
								apotik.save()
								frappe.db.commit()
				else:
					product_data = {}
					product_data.update(product)
					product_data.pop('product_racikan')
					product_data.update({'parent': apotik.name, 'parenttype': 'VetApotik', 'parentfield': 'obat'})
	
					new_product = frappe.new_doc("VetApotikProduct")
					new_product.update(product_data)
	
					apotik.obat.append(new_product)
	
					apotik.save()
					frappe.db.commit()
					
					for pr in product.get("product_racikan"):
						if pr.get('apotik_product_name') != None:
							if pr.get('is_delete') == True:
								frappe.delete_doc('VetApotikProduct', pr.get('apotik_product_name'))
							else:
								obat_doc = frappe.get_doc('VetApotikProduct', pr.get('apotik_product_name'))
								obat_doc.reload()
								obat_doc.update({'racikan': new_product.name})
								obat_doc.save()
						else :
							pr_data = {}
							pr_data.update(pr)
							pr_data.update({'parent': apotik.name, 'parenttype': 'VetApotik', 'parentfield': 'obat', 'racikan': new_product.name})
							
							new_pr = frappe.new_doc("VetApotikProduct")
							new_pr.update(pr_data)
							
							apotik.obat.append(new_pr)
							
							apotik.save()
							frappe.db.commit()
					
			apotik.reload()
			products = []

			for product in apotik.obat:
				product_data = {
					'name': product.name,
					'product': product.product,
					'quantity': math.ceil(float(product.quantity)),
					'racikan': product.racikan
				}
				category = frappe.db.get_value('VetProduct', product.product, 'product_category')
				is_racikan = frappe.db.get_value('VetProductCategory', category, 'is_racikan')
				if is_racikan == 0:
					product_data.update({'warehouse': apotik.warehouse})
				
				products.append(product_data)
			
			if not saveOnly:
				if apotik.register_number:
					update_invoice(json.dumps(products), apotik.register_number)
				else:
					update_invoice(json.dumps(products), apotik.register_number, apotik.name)

			return {'apotik': apotik}

		else:
			return {'error': "Apotik tidak ditemukan"}

	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def update_invoice(products, register_number, apotik=False):
	try:

		invoice_check = frappe.get_list("VetCustomerInvoice", filters={'register_number': register_number, 'Status': 'Draft'}, fields=['name'])

		if invoice_check:
			products_json = json.loads(products)

			invoice = frappe.get_doc("VetCustomerInvoice", invoice_check[0]['name'])

			subtotal = 0

			for product in products_json:
				product_data = {}
				product_data.update(product)
				product_data.update({'parent': invoice.name, 'parenttype': 'VetCustomerInvoice', 'parentfield': 'invoice_line', 'service': 'Farmasi'})
				product_data.update({'apotik_obat_id': product.get('name'), 'racikan': product.get('racikan')})

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

			invoice.update({'subtotal': invoice.subtotal + subtotal, 'total': invoice.total + subtotal})
			invoice.save()
			frappe.db.commit()
		else:
			invoice = frappe.new_doc("VetCustomerInvoice")
			now = dt.now()
			now_1_hour = now + rd(hour=1)
			invoice_date = dt.strftime(now, "%Y-%m-%d %H:%M:%S")
			due_date = dt.strftime(now_1_hour, "%Y-%m-%d %H:%M:%S")
			
			if not apotik:
				pet = frappe.get_list('VetReception', filters={'register_number': register_number}, fields=['pet'])
	
				new_invoice_data = {
					'register_number': register_number,
					'pet': pet[0]['pet'],
					'user': frappe.session.user,
					'invoice_date': invoice_date,
					'due_date': due_date,
					'origin': register_number,
				}
			else:
				apotik_doc = frappe.get_list('VetApotik', filters={'name': apotik}, fields=['pet'])
	
				new_invoice_data = {
					'register_number': register_number,
					'pet': apotik_doc[0].pet,
					'user': frappe.session.user,
					'invoice_date': invoice_date,
					'due_date': due_date,
					'origin': apotik,
				}
				
			invoice.update(new_invoice_data)
			invoice.insert()
			frappe.db.commit()

			subtotal = 0

			for product in json.loads(products):
				product_data = {}
				product_data.update(product)
				product_data.update({'parent': invoice.name, 'parenttype': 'VetCustomerInvoice', 'parentfield': 'invoice_line', 'service': 'Farmasi'})
				product_data.update({'apotik_obat_id': product.get('name'), 'racikan': product.get('racikan')})

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
def get_product_details(name):
	try:
		product = frappe.get_list("VetProduct", filters={'name': name}, fields=['*'])
		uom = frappe.get_list("VetUOM", filters={'name': product[0]['product_uom']}, fields=['uom_name'])
		product[0]['uom_name'] = uom[0]['uom_name']
		product[0]['product_racikan'] = []
		product_category_search = frappe.get_list("VetProductCategory", filters={'name': product[0]['product_category']}, fields=['*'])
		if len(product_category_search) != 0:
			product[0]['product_category'] = product_category_search[0]
		return {'product': product[0]}
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_obat_all(racikan):
	try:
		if (racikan == 'true'):
			categories = frappe.get_list('VetProductCategory', filters={'is_obat': True, 'is_racikan': False}, fields=['name'])
		else :
			categories = frappe.get_list('VetProductCategory', filters={'is_obat': True}, fields=['name'])
			
		categorie_names = (c.name for c in categories)
		obatAll = frappe.get_list('VetProduct', filters={'product_category': ['in', categorie_names]}, fields=['*'])
			
		for o in range(len(obatAll)):
			uom = frappe.get_list('VetUOM', filters={'name': obatAll[o]['product_uom']}, fields=['uom_name'])
			obatAll[o]['uom_name'] = uom[0]['uom_name']
		return {'obatAll': obatAll}
	except PermissionError as e:
		return {'error': e}
	
	
	