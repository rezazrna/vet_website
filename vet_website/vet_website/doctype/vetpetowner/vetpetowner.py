# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
import os
import datetime
import string
import random
import functools
import pytz
from frappe.model.document import Document
from frappe.utils.file_manager import save_file
from frappe.core.doctype.file.file import get_local_image
from frappe import _

class VetPetOwner(Document):
	pass

@frappe.whitelist()
def get_pet_owner(filters=None):
	default_sort = "creation desc"
	default_limit = 0
	owner_filters = [{'code': ['!=', 'SCANID']}]
	owner_or_filters = []
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
		nik_search = filter_json.get('nik_search', False)
		phone = filter_json.get('phone', False)
		search = filter_json.get('search', False)
		sort = filter_json.get('sort', False)
		filters_json = filter_json.get('filters', False)
		limit = filter_json.get('limit', False)
		currentpage = filter_json.get('currentpage', False)

		if currentpage:
			page = currentpage
		
		if filters_json:
			for fj in filters_json:
				if fj[0] != 'piutang':
					owner_filters.append(fj)
				else:
					# last_credit = frappe.get_list('VetOwnerCredit', filters={'pet_owner': ['not in', ['',None,False]]}, fields=['credit', 'debt', 'pet_owner'], group_by="pet_owner")
					# fj[0] = 'a.debt'
					# if fj[1] == "=":
					# 	fj[1] = "=="
					# last_credit = filter(lambda a: eval(" ".join(fj)), last_credit)
					# # print(list(last_credit))
					# owner_filters.append({'name': ['in', list(map(lambda item: item['pet_owner'], list(last_credit)))]})
					# print(owner_filters)
					fj[0] = "a.debt"
					if fj[1] == "=":
						fj[1] = "=="
					result_filter = lambda a: eval(" ".join(fj))
		if nik_search:
			owner_filters.append({'nik': ['like', '%'+nik_search+'%']})
		if phone:
			owner_filters.append({'phone': ['like', '%'+phone+'%']})
		if search:
			owner_or_filters.append({'nik': ['like', '%'+search+'%']})
			owner_or_filters.append({'owner_name': ['like', '%'+search+'%']})
			owner_or_filters.append({'address': ['like', '%'+search+'%']})
			owner_or_filters.append({'phone': ['like', '%'+search+'%']})
			owner_or_filters.append({'email': ['like', '%'+search+'%']})
		if sort:
			sorts = sort.split(',')
			for i,s in enumerate(sorts):
				if 'piutang' in s:
					sorts.pop(i)
					sort_filter = lambda o: o['debt']
					s_words = s.split(' ')
					if s_words[1] == 'desc':
						sort_filter_reverse = True
			default_sort = ','.join(sorts)
		if limit:
			default_limit = limit
	
	try:
		owner = frappe.get_list("VetPetOwner", or_filters=owner_or_filters, filters=owner_filters, fields=['name', 'nik', 'owner_name', 'phone', 'email', 'address', 'creation'], order_by=default_sort, limit=default_limit, start=(page - 1) * 10, page_length= 10)
		datalength = len(frappe.get_all("VetPetOwner", or_filters=owner_or_filters, filters=owner_filters, as_list=True))
		
		for o in owner:
			last_credit = frappe.get_list('VetOwnerCredit', filters={'pet_owner': o.name}, fields=['credit', 'debt'], order_by="creation desc")
			if last_credit:
				total_credit = last_credit[0]['credit']
				total_debt = last_credit[0]['debt']
			else:
				total_credit = 0
				total_debt = 0
				
			o.update({'credit': total_credit, 'debt': total_debt})
		if sort_filter != False:
			owner.sort(key=sort_filter, reverse=sort_filter_reverse)
		owner = filter(result_filter, owner)
		
		return {'pet_owner': owner, 'datalength': datalength}
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_name_list(filters=None):
	default_sort = "creation desc"
	owner_filters = [{'code': ['!=', 'SCANID']}]
	owner_or_filters = []
	filter_json = False
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
		
	if filter_json:
		nik_search = filter_json.get('nik_search', False)
		phone = filter_json.get('phone', False)
		search = filter_json.get('search', False)
		filters_json = filter_json.get('filters', False)
		sort = filter_json.get('sort', False)

		if filters_json:
			for fj in filters_json:
				if fj[0] != 'piutang':
					owner_filters.append(fj)
				else:
					fj[0] = "a.debt"
					if fj[1] == "=":
						fj[1] = "=="
		if nik_search:
			owner_filters.append({'nik': ['like', '%'+nik_search+'%']})
		if phone:
			owner_filters.append({'phone': ['like', '%'+phone+'%']})
		if search:
			owner_or_filters.append({'nik': ['like', '%'+search+'%']})
			owner_or_filters.append({'owner_name': ['like', '%'+search+'%']})
			owner_or_filters.append({'address': ['like', '%'+search+'%']})
			owner_or_filters.append({'phone': ['like', '%'+search+'%']})
			owner_or_filters.append({'email': ['like', '%'+search+'%']})

		if sort:
			default_sort = sort
	
	try:
		namelist = frappe.get_all("VetPetOwner", or_filters=owner_or_filters, filters=owner_filters, order_by=default_sort, as_list=True)
		
		return list(map(lambda item: item[0], namelist))
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_pet_owner_by_name(name):
	default_sort = "creation desc"
	owner_filters = {'name': name}
	try:
		owner = frappe.get_list("VetPetOwner", filters=owner_filters, fields=['*'], order_by=default_sort)
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
				order = frappe.db.get_list("VetPosOrder", filters={'pet': p['name']}, fields=['total', 'name'])
				# spending = 0
				# for iv in invoice:
				# 	pembayaran = frappe.db.get_list("VetCustomerInvoicePay", filters={'parent': iv['name']}, fields=['jumlah'])
				# 	spending += sum(p['jumlah'] for p in pembayaran)
				spending = sum(i.total for i in invoice) 
				order_spending = sum(i.total for i in order)
				total_visit += visit
				total_spending += (spending + order_spending)
				p.update({'hewan_jenis_label': pet_type.type_name, 'type_name': pet_type.type_name, 'visit': str(visit), 'spending': str(spending)})
			o.update({'pets': pets, 'total_spending': total_spending, 'total_visit': total_visit, 'petType': petTypeAll, 'total_credit': total_credit, 'total_remaining': total_remaining, 'total_debt': total_debt})
		return owner
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_last_data():
	try:
		owners = frappe.get_list("VetPetOwner", filters={'code': 'SCANID'}, fields=['*'], limit=1)

		if len(owners):
			for owner in owners:
				pets = frappe.get_list("VetPet", filters={'parent': owner.name, 'status': 'Active'}, fields=['*'])
				for p in pets:
					pet_type = frappe.get_doc('VetPetType', p.hewan_jenis)
					visit = frappe.db.count('VetReception', {'pet': p.name})
					spending = 100000
					p.update({'type_name': pet_type.type_name, 'visit': str(visit), 'spending': str(spending)})
				owner.update({'pets': pets})
			return {'doc': owners[0]}
		else:
			not_found_render = frappe.render_template('templates/reception/alert_data_not_found.html', {})
			pet_row_render = frappe.render_template('templates/reception/pet_new_row.html', {'search_nip': True})
			return {'not_found_render': not_found_render, 'pet_row_render': pet_row_render}

	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()
def new_pet_owner(data, pets):
	tz = pytz.timezone("Asia/Jakarta")
	now = datetime.datetime.now(tz)
	now_str = datetime.datetime.strftime(now, "%d%m%Y%H%M%S")
	try:
		data_json = json.loads(data)
		pet_json = json.loads(pets)
	except:
		return {'error': "Gagal membuat pemilik baru"}
		
	if not data_json.get("code", False) or data_json.get("code") == 'SCANID':
		data_json.update({'code': ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(10))})

	new_owner = frappe.new_doc("VetPetOwner")
	new_owner.update(data_json)

	new_owner.insert()
	frappe.db.commit()
	
	if data_json.get("dataurl"):
		filename = now_str+"-"+data_json["filename"]
		filedoc = save_file(filename, data_json["dataurl"], "VetPetOwner", new_owner.name, decode=True, is_private=0)
		new_owner.update({"foto_identitas": filedoc.file_url})
		new_owner.save()
		frappe.db.commit()
	
	for pet in pet_json:
		pet_data = {}
		pet_data.update(pet)
		pet_data.update({'parent': new_owner.name, 'parenttype': 'VetPetOwner', 'parentfield': 'pets'})
		pet_data.pop('name')
		
		if not pet_data.get("code", False):
			pet_data.update({'code': ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(10))})

		new_pet = frappe.new_doc("VetPet")
		new_pet.update(pet_data)
		new_pet.insert()
		
		if pet.get("dataurl"):
			filename = now_str+"-"+pet["filename"]
			filedoc = save_file(filename, pet["dataurl"], "VetPet", new_pet.name, decode=True, is_private=0)
			filedoc.make_thumbnail()
			resize_image(filedoc.file_url)
			new_pet.update({"pet_image": filedoc.file_url, 'pet_image_thumbnail': filedoc.thumbnail_url})

		new_owner.pets.append(new_pet)
		new_owner.save()
		frappe.db.commit()
	
	return new_owner
	
@frappe.whitelist(allow_guest=True)
def create_from_api(data):
	tz = pytz.timezone("Asia/Jakarta")
	now = datetime.datetime.now(tz)
	now_str = datetime.datetime.strftime(now, "%d%m%Y%H%M%S")
	data_json = json.loads(data)
	doc_data = {}
	doc_data.update(data_json)
	doc_data.pop('foto_identitas')
	check_scanid = frappe.get_all('VetPetOwner', filters={'name': 'SCANID'}, fields=['name'])
	
	if check_scanid:
		doc = frappe.get_doc('VetPetOwner', check_scanid[0]['name'])
		doc.update(doc_data)
		doc.save(ignore_permissions=True)
		frappe.db.commit()
	else:
		doc = frappe.new_doc("VetPetOwner")
		doc.update(doc_data)
		doc.insert(ignore_permissions=True)
		frappe.db.commit()
		
	if data_json.get('foto_identitas'):
		filename = now_str
		filedoc = save_file(filename, data_json.get('foto_identitas'), "VetPetOwner", doc.name, decode=True, is_private=0)
		doc.update({"foto_identitas": filedoc.file_url})
		doc.save()
		frappe.db.commit()
	
	return True

@frappe.whitelist()
def edit_pet_owner(data, pets):
	tz = pytz.timezone("Asia/Jakarta")
	now = datetime.datetime.now(tz)
	now_str = datetime.datetime.strftime(now, "%d%m%Y%H%M%S")
	try:
		data_json = json.loads(data)
		pet_json = json.loads(pets)
	except:
		return {'error': "Gagal membuat pemilik baru"}

	new_owner = frappe.get_doc("VetPetOwner", data_json.get('name'))
		
	owner_data = {}
	owner_data.update(data_json)
	if owner_data.get('petType', False):
		owner_data.pop('petType')
	new_owner.update(owner_data)
	new_owner.save()
	frappe.db.commit()
	
	new_owner.reload()
	
	if data_json.get("dataurl"):
		filename = now_str+"-"+data_json["filename"]
		filedoc = save_file(filename, data_json["dataurl"], "VetPetOwner", new_owner.name, decode=True, is_private=0)
		new_owner.update({'foto_identitas': filedoc.file_url})
		new_owner.save()
		frappe.db.commit()
	
	for pet in pet_json:
		if pet.get('name') == '/':
			pet_data = {}
			pet_data.update(pet)
			pet_data.update({'parent': new_owner.name, 'parenttype': 'VetPetOwner', 'parentfield': 'pets'})
			pet_data.pop('name')
			
			if not pet_data.get("code", False):
				pet_data.update({'code': ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(10))})
	
			new_pet = frappe.new_doc("VetPet")
			new_pet.update(pet_data)
			new_pet.insert()
		
			if pet.get("dataurl"):
				filename = now_str+"-"+pet["filename"]
				filedoc = save_file(filename, pet["dataurl"], "VetPet", new_pet.name, decode=True, is_private=0)
				filedoc.make_thumbnail()
				resize_image(filedoc.file_url)
				new_pet.update({"pet_image": filedoc.file_url, 'pet_image_thumbnail': filedoc.thumbnail_url})
	
			new_owner.pets.append(new_pet)
			new_owner.save()
			frappe.db.commit()
		else:
			pet_data = {}
			pet_data.update(pet)
			pops = ['name', 'creation', 'modified']
			for pop in pops:
				if pet_data.get(pop, False):
					pet_data.pop(pop)
	
			update_pet = frappe.get_doc("VetPet", pet.get('name'))
			update_pet.reload()
			update_pet.update(pet_data)
			if pet.get("dataurl"):
				filename = now_str+"-"+pet["filename"]
				filedoc = save_file(filename, pet["dataurl"], "VetPet", update_pet.name, decode=True, is_private=0)
				filedoc.make_thumbnail()
				resize_image(filedoc.file_url)
				update_pet.update({"pet_image": filedoc.file_url, 'pet_image_thumbnail': filedoc.thumbnail_url})
				
			update_pet.save()
			frappe.db.commit()
	
	return new_owner
	
@frappe.whitelist()
def delete_pet_owner(data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal menghapus pemilik"}
	
	for d in data_json:
		frappe.delete_doc('VetPetOwner', d)
		frappe.db.commit()
		
	return {'success': True}
	
@frappe.whitelist()
def get_credit_list(name=False, no_filter=False, filters=None, supplier=False, only_deposit=False, only_piutang_hutang=False, only_payment=False):
	tz = pytz.timezone("Asia/Jakarta")
	def process_odd_filter(fj):
		f = fj
		
		if f[1] == "=":
			f[1] = "=="
		elif f[1] == 'like':
			f[1] = 'in'
		elif f[1] == 'not like':
			f[1] = 'not in'
		
		if f[1] != 'between':
			f[0] = "a.%s"%f[0]
			
			if 'date' in f[0]:
				f[2] = "datetime.datetime.strptime('%s', '%s')"%(f[2], '%Y-%m-%d')
				
			elif f[1] in ['in', 'not in']:
				f[0] = '%s.lower()'%f[0]
				f[2] = f[2].replace('%',"'").lower()
				fj.reverse()
			elif f[0] not in ['a.nominal', 'a.credit', 'a.debt']:
				f[2] = "'%s'"%f[2]
			
			string = " ".join(f)
			print(string)
			
			return lambda a: eval(string)
		else:
			return lambda a: a[f[0]] > datetime.datetime.strptime(f[2][0], '%Y-%m-%d') and a[f[0]] < datetime.datetime.strptime(f[2][1], '%Y-%m-%d')
	# print('only_deposit')
	# print(only_deposit)
	credit_filters = []
	if only_payment == 'true':
		credit_filters = [['type', '=', 'Payment']]
	if only_deposit == 'true':
		credit_filters = [['credit_mutation', '!=', 0]]
	if only_piutang_hutang == 'true':
		if supplier == 'true':
			credit_filters.append(['purchase_status', 'in', ['Draft', 'RFQ', 'Purchase Order', 'Receive']])
		else:
			credit_filters.append(['invoice_status', 'in', ['Draft', 'Open']])
		credit_filters.append(['type', 'in', ['Sales', 'Purchase']])
	# print(credit_filters)
	odd_filters = []
	filter_json = False
	session = ''
	default_sort = 'creation desc'
	pos_payment_sorts = []
	page = 1
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
		
	if filter_json:
		filters_json = filter_json.get('filters', False)
		session = filter_json.get('session', False)
		sort = filter_json.get('sort', False)
		currentpage = filter_json.get('currentpage', False)
		search = filter_json.get('search', False)

		if currentpage:
			page = currentpage

		if sort:
			sorts = sort.split(',')
			for s in sorts:
				pos_payment_sorts.append(s)
			default_sort = sort
		
		if filters_json:
			for fj in filters_json:
				if fj[0] == 'date' and fj[1] == '=':
					credit_filters.append(['date', 'between', [fj[2] + ' 00:00:00', fj[2] + ' 23:59:59']])
				else:
					credit_filters.append(fj)
					odd_filters.append(fj)
		if search:
			if supplier == 'true':
				credit_filters.append({'supplier_name': ['like', '%'+search+'%']})
			else:
				credit_filters.append({'pet_owner_name': ['like', '%'+search+'%']})
			
	try:
		pos_order_payment_list = []
		if no_filter == 'true':
			if supplier == 'true':
				owner_credit_list = frappe.get_list('VetOwnerCredit', or_filters={'supplier': ['!=', ''], 'purchase': ['!=', '']}, filters=credit_filters, fields=['*'], order_by=default_sort, start=(page - 1) * 10, page_length= 10)
				datalength = len(frappe.get_all("VetOwnerCredit", or_filters={'supplier': ['!=', ''], 'purchase': ['!=', '']}, filters=credit_filters, as_list=True))
				for oc in owner_credit_list:
					oc['owner_full_name'] = frappe.db.get_value('User', oc['owner'], 'full_name')
					if oc['invoice']:
						customer_invoice = frappe.db.get_value('VetCustomerInvoice', oc['invoice'], ['subtotal', 'potongan', 'name'], as_dict=1)
						all_payments = frappe.get_list('VetCustomerInvoicePay', filters={'parent': customer_invoice.name}, fields=['jumlah'])
						paid = 0
						for a in list(map(lambda item: item['jumlah'], all_payments)):
							paid += a
						oc['remaining'] = (customer_invoice.subtotal - customer_invoice.potongan) - paid
				owner_list = frappe.get_list('VetSupplier', fields=['*'])
			else:
				if session not in ['',False]: 
					doc_session = frappe.get_doc('VetPosSessions', session)
					credit_filters.append(['date', '>=', doc_session.opening_session])
					credit_filters.append(['date', '<=', doc_session.closing_session or datetime.datetime.now(tz)])
					credit_filters.append(['type', '=', 'Payment'])
					pos_order = frappe.get_list('VetPosOrder', filters={'session': session}, fields=['name', 'order_date', 'owner_name'])
					for po in pos_order:
						po_payment = frappe.get_list('VetPosOrderPayment', filters={'parent': po.name}, fields=['*'])
						for pop in po_payment:
							if pop.value - pop.exchange != 0:
								pop['date'] =  po.order_date
								pop['pet_owner_name'] = po.owner_name or ''
								pop['invoice'] = po.name
								pop['nominal'] = pop.value
								pop['metode_pembayaran'] = pop.type
								pop['type'] = 'Payment'
								pos_order_payment_list.append(pop)
					
				owner_credit_list = frappe.get_list('VetOwnerCredit', or_filters={'pet_owner': ['!=', ''], 'invoice': ['!=', '']}, filters=credit_filters, fields=['*'], order_by=default_sort, start=(page - 1) * 10, page_length= 10)
				datalength = len(frappe.get_all("VetOwnerCredit", or_filters={'pet_owner': ['!=', ''], 'invoice': ['!=', '']}, filters=credit_filters, as_list=True))
				for oc in owner_credit_list:
					oc['owner_full_name'] = frappe.db.get_value('User', oc['owner'], 'full_name')
					if oc['invoice']:
						customer_invoice = frappe.db.get_value('VetCustomerInvoice', oc['invoice'], ['subtotal', 'potongan', 'name'], as_dict=1)
						all_payments = frappe.get_list('VetCustomerInvoicePay', filters={'parent': customer_invoice.name}, fields=['jumlah'])
						paid = 0
						for a in list(map(lambda item: item['jumlah'], all_payments)):
							paid += a
						oc['remaining'] = (customer_invoice.subtotal - customer_invoice.potongan) - paid
				owner_list = frappe.get_list('VetPetOwner', fields=['*'])
		else:
			owner_credit_list = frappe.get_list('VetOwnerCredit', or_filters=[{'pet_owner': name}, {'supplier': name}], filters=credit_filters, fields=['*'], order_by=default_sort, start=(page - 1) * 10, page_length= 10)
			datalength = len(frappe.get_all("VetOwnerCredit", or_filters=[{'pet_owner': name}, {'supplier': name}], filters=credit_filters, as_list=True))
			for oc in owner_credit_list:
				oc['owner_full_name'] = frappe.db.get_value('User', oc['owner'], 'full_name')
				if oc['invoice']:
					customer_invoice = frappe.db.get_value('VetCustomerInvoice', oc['invoice'], ['subtotal', 'potongan', 'name'], as_dict=1)
					all_payments = frappe.get_list('VetCustomerInvoicePay', filters={'parent': customer_invoice.name}, fields=['jumlah'])
					paid = 0
					for a in list(map(lambda item: item['jumlah'], all_payments)):
						paid += a
					oc['remaining'] = (customer_invoice.subtotal - customer_invoice.potongan) - paid
				elif oc['purchase']:
					pembayaran = frappe.db.get_list('VetPurchasePay', filters={'parent': oc['purchase']}, fields=['jumlah'])
					barang = frappe.db.get_list('VetPurchaseProducts', filters={'parent': oc['purchase']}, fields=['product', 'price', 'quantity', 'discount'])
					paid = 0
					subtotal = 0
					for p in pembayaran:
						paid += p['jumlah']
							
					for b in barang:
						if b['product'] and b['quantity'] and b['price']:
							subtotal = subtotal + (b['price'] * b['quantity'] - ((b['discount'] or 0) / 100 * (b['price'] * b['quantity'])))
					oc['remaining'] = subtotal - paid

			owner_list = []
			
		payment_method = frappe.get_list("VetPaymentMethod", fields=['*'])
		
		if len(pos_order_payment_list) > 0:
			owner_credit_list.extend(pos_order_payment_list)
			
			if len(pos_payment_sorts) > 0:
				for pps in pos_payment_sorts:
					reverse = False
					s_words = pps.split(' ')
					sort_filter = lambda o: o[s_words[0]]
					if s_words[1] == 'desc':
						reverse = True
					owner_credit_list.sort(key=sort_filter, reverse=reverse)
			else:
				sort_filter = lambda o: o['date']
				owner_credit_list.sort(key=sort_filter, reverse=True)
			
			for fj in odd_filters:
				result_filter = process_odd_filter(fj)
				owner_credit_list = filter(result_filter, owner_credit_list)
				
		
		return {'owner_credit_list': owner_credit_list, 'owner_list': owner_list, 'payment_method_list': payment_method, 'datalength': datalength}
	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()
def reception_get_pet_owner(nik=False, nip=False, name=False):
	try:
		if name and name != 'false':
			owners = frappe.get_list("VetPetOwner", filters={'name': name}, fields=['*'])

			if len(owners):
				for owner in owners:
					pets = frappe.get_list("VetPet", filters={'parent': owner.name, 'status': 'Active'}, fields=['*'])
					for p in pets:
						pet_type = frappe.get_doc('VetPetType', p.hewan_jenis)
						visit = frappe.db.count('VetReception', {'pet': p.name})
						spending = 100000
						p.update({'type_name': pet_type.type_name, 'visit': str(visit), 'spending': str(spending)})
					owner.update({'pets': pets})
				return {'doc': owners[0]}
			else:
				not_found_render = frappe.render_template('templates/reception/alert_data_not_found.html', {})
				pet_row_render = frappe.render_template('templates/reception/pet_new_row.html', {'search_nip': True})
				return {'not_found_render': not_found_render, 'pet_row_render': pet_row_render}
			
		if nik and nik != 'false':
			owners = frappe.get_list("VetPetOwner", filters={'nik': nik}, fields=['*'])

			if len(owners):
				for owner in owners:
					pets = frappe.get_list("VetPet", filters={'parent': owner.name, 'status': 'Active'}, fields=['*'])
					for p in pets:
						pet_type = frappe.get_doc('VetPetType', p.hewan_jenis)
						visit = frappe.db.count('VetReception', {'pet': p.name})
						spending = 100000
						p.update({'type_name': pet_type.type_name, 'visit': str(visit), 'spending': str(spending)})
					owner.update({'pets': pets})
				return {'doc': owners[0]}
			else:
				not_found_render = frappe.render_template('templates/reception/alert_data_not_found.html', {})
				pet_row_render = frappe.render_template('templates/reception/pet_new_row.html', {'search_nip': True})
				return {'not_found_render': not_found_render, 'pet_row_render': pet_row_render}

		if nip and nip != 'false':
			pet = frappe.get_list("VetPet", filters={'name': nip}, fields=['parent'])

			if len(pet):
				owners = frappe.get_list("VetPetOwner", filters={'name': pet[0].parent}, fields=['*'])
				for owner in owners:
					pets = frappe.get_list("VetPet", filters={'parent': owner.name, 'status': 'Active'}, fields=['*'])
					for p in pets:
						pet_type = frappe.get_doc('VetPetType', p.hewan_jenis)
						visit = frappe.db.count('VetReception', {'pet': p.name})
						spending = 100000
						p.update({'type_name': pet_type.type_name, 'visit': str(visit), 'spending': str(spending)})
					owner.update({'pets': pets})
				return {'doc': owners[0]}

			else:
				not_found_render = frappe.render_template('templates/reception/alert_data_not_found.html', {})
				pet_row_render = frappe.render_template('templates/reception/pet_new_row.html', {'search_nip': True})
				return {'not_found_render': not_found_render, 'pet_row_render': pet_row_render}

	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()
def reception_add_pet_row():
	try:
		pet_row_render = frappe.render_template('templates/reception/pet_new_row.html', {})
		return {'pet_row_render': pet_row_render}
	except PermissionError as e:
		return {'error': e}

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
    except IOError:
        print(_("Unable to write file format for {0}").format(path))
        return

    return image_url
    
# def set_owner_credit_total(name, supplier=False):
# 	if supplier:
# 		owner_credit_search = frappe.get_list('VetOwnerCredit', filters={'supplier': name}, fields=['*'], order_by='creation asc')
# 	else:
# 		owner_credit_search = frappe.get_list('VetOwnerCredit', filters={'pet_owner': name}, fields=['*'], order_by='creation asc')
		
# 	credit = 0
# 	for o in owner_credit_search:
# 		owner_credit = frappe.get_doc('VetOwnerCredit', o['name'])
# 		if o['type'] == 'Payment' or o['type'] == 'Refund' or o['type'] == 'Cancel':
# 			owner_credit.credit = 0
# 			credit += o['nominal']
# 			owner_credit.credit = credit
# 		elif o['type'] == 'Sales' or o['type'] == 'Purchase':
# 			owner_credit.credit = 0
# 			credit -= o['nominal']
# 			owner_credit.credit = credit
# 		owner_credit.save()
# 		frappe.db.commit()

def set_owner_credit_total(name, supplier=False):
	if supplier:
		owner_credit_search = frappe.get_list('VetOwnerCredit', filters={'supplier': name}, fields=['*'], order_by='creation asc')
	else:
		owner_credit_search = frappe.get_list('VetOwnerCredit', filters={'pet_owner': name}, fields=['*'], order_by='creation asc')
		
	credit = 0
	debt = 0
	for o in owner_credit_search:
		# print('##########%s#############'%o.name)
		# print(credit)
		# print(debt)
		owner_credit = frappe.get_doc('VetOwnerCredit', o['name'])
		if o['type'] == 'Payment' or o['type'] == 'Refund' or o['type'] == 'Cancel':
			if o['nominal'] < 0 or owner_credit.is_deposit:
				# Pengambilan atau Penyimpanan Deposit
				print("Pengambilan atau Penyimpanan Deposit")
				owner_credit.credit = 0
				credit += o['nominal']
				owner_credit.credit = credit
				owner_credit.credit_mutation = o['nominal']
				
				owner_credit.debt = debt
				
			elif 'Deposit' in (owner_credit.metode_pembayaran or ''):
				# Pembayaran dari Deposit
				print("Pembayaran dari Deposit")
				purchase_search = frappe.get_list('VetPurchase', filters={'name': owner_credit.purchase}, fields=['name'])
				if len(purchase_search) > 0:
					# print("Ada Purchase")
					purchase = frappe.get_doc('VetPurchase', owner_credit.purchase)
					purchase_debt = get_purchase_debit_credit(owner_credit.name)
					purchase_debt = -purchase_debt if purchase_debt < 0 else 0
					excess = 0
					if purchase_debt > 0:
						excess = o['nominal'] - purchase_debt
					excess = excess if excess > 0 else 0
					debt_mutation = o['nominal'] - excess
					
					# print(excess)
					# print(debt_mutation)

					# if excess >= 0:
					# 	owner_credit.credit = 0
					# 	credit += excess
					# 	owner_credit.credit = credit
					# 	owner_credit.credit_mutation = excess
					
					owner_credit.credit = 0
					credit -= debt_mutation
					owner_credit.credit = credit
					print(credit)
					owner_credit.credit_mutation = -debt_mutation
						
					owner_credit.debt = 0
					debt -= debt_mutation
					owner_credit.debt = debt
					owner_credit.debt_mutation = -debt_mutation
				
				else:
					owner_credit.credit = 0
					credit -= o['nominal']
					owner_credit.credit = credit
					owner_credit.credit_mutation = -o['nominal']
					
					owner_credit.debt = 0
					debt -= o['nominal']
					owner_credit.debt = debt
					owner_credit.debt_mutation = -o['nominal']
			
			elif debt >= o['nominal'] and o['nominal'] > 0:
				# Nominal lebik kecil dari utang
				# print("Nominal lebik kecil dari utang")
				if o['type'] == 'Refund':
					owner_credit.debt = debt
					owner_credit.debt_mutation = 0
				else:
					purchase_search = frappe.get_list('VetPurchase', filters={'name': owner_credit.purchase}, fields=['name'])
					if len(purchase_search) > 0:
						# print("Ada Purchase")
						purchase = frappe.get_doc('VetPurchase', owner_credit.purchase)
						purchase_debt = get_purchase_debit_credit(owner_credit.name)
						purchase_debt = -purchase_debt if purchase_debt < 0 else 0
						excess = 0
						if purchase_debt > 0:
							excess = o['nominal'] - purchase_debt
						excess = excess if excess > 0 else 0
						debt_mutation = o['nominal'] - excess
						
						# print(excess)
						# print(debt_mutation)

						# if excess >= 0:
						# 	owner_credit.credit = 0
						# 	credit += excess
						# 	owner_credit.credit = credit
						# 	owner_credit.credit_mutation = excess
							
						owner_credit.debt = 0
						debt -= debt_mutation
						owner_credit.debt = debt
						owner_credit.debt_mutation = -debt_mutation
					
					else:
						owner_credit.debt = 0
						debt -= o['nominal']
						owner_credit.debt = debt
						owner_credit.debt_mutation = -o['nominal']
					
				owner_credit.credit = credit
			elif debt < o['nominal'] and o['nominal'] > 0:
				# Nominal lebik besar dari utang
				# print("Nominal lebik besar dari utang")
				if o['type'] == 'Refund':
					owner_credit.debt = debt
					owner_credit.debt_mutation = 0
				else:
					excess = o['nominal'] - debt
					excess = excess if excess > 0 else 0
					debt_mutation = o['nominal'] - excess
					
					purchase_search = frappe.get_list('VetPurchase', filters={'name': owner_credit.purchase}, fields=['name'])
					invoice_search = frappe.get_list('VetCustomerInvoice', filters={'name': owner_credit.invoice}, fields=['name'])
					
					if len(purchase_search) > 0:
						# print("Ada Purchase")
						purchase = frappe.get_doc('VetPurchase', owner_credit.purchase)
						purchase_debt = get_purchase_debit_credit(owner_credit.name)
						purchase_debt = -purchase_debt if purchase_debt < 0 else 0
						excess = 0
						if purchase_debt > 0:
							excess = o['nominal'] - purchase_debt
						excess = excess if excess > 0 else 0
						debt_mutation = o['nominal'] - excess
						owner_credit.credit = credit

						# if excess >= 0:
						# 	owner_credit.credit = 0
						# 	credit += excess
						# 	owner_credit.credit = credit
						# 	owner_credit.credit_mutation = excess
							
						owner_credit.debt = 0
						debt -= debt_mutation
						owner_credit.debt = debt
						owner_credit.debt_mutation = -debt_mutation

					elif len(invoice_search) > 0:
						owner_credit.debt = 0
						debt -= debt_mutation
						owner_credit.debt = debt
						owner_credit.debt_mutation = -debt_mutation
						
						invoice = frappe.get_doc('VetCustomerInvoice', owner_credit.invoice)
						paid = sum([p.jumlah for p in invoice.pembayaran])
						if paid > invoice.total:
							owner_credit.exchange = excess
							
						owner_credit.credit = credit
					
					else:
						owner_credit.credit = 0
						credit += excess
						owner_credit.credit = credit
						owner_credit.credit_mutation = excess
						
						owner_credit.debt = 0
						debt -= debt_mutation
						owner_credit.debt = debt
						owner_credit.debt_mutation = -debt_mutation
				
		elif o['type'] == 'Sales' or o['type'] == 'Purchase':
			if o['type'] == 'Sales':
				owner_credit.debt = 0
				debt += o['nominal']
				owner_credit.debt = debt
				owner_credit.debt_mutation = o['nominal']
				owner_credit.credit = credit
			elif o['type'] == 'Purchase':
				prev_payment_search = frappe.get_list('VetOwnerCredit', filters={'purchase': owner_credit.purchase, 'type': 'Payment', 'date': ['<', owner_credit.date]}, order_by='date desc', fields=['name'])
				if len(prev_payment_search) > 0:
					# print('Ada Purchase Payment')
					prev_payment = frappe.get_doc('VetOwnerCredit', prev_payment_search[0].name)
					purchase_credit = get_purchase_debit_credit(owner_credit.name)
					# print(purchase_credit)
					purchase_credit = purchase_credit if purchase_credit > 0 else 0
					# if prev_payment.credit >= o['nominal']:
					if purchase_credit >= o['nominal']:
						# print('Credit lebih besar')
						owner_credit.credit = 0
						credit -= o['nominal']
						owner_credit.credit = credit
						owner_credit.credit_mutation = -o['nominal']
						owner_credit.debt = debt
					else:
						# print('Credit lebih kecil')
						owner_credit.credit = 0
						credit -= purchase_credit
						owner_credit.credit = credit
						owner_credit.credit_mutation = -purchase_credit
						
						owner_credit.debt = 0
						debt += (o['nominal'] - purchase_credit)
						owner_credit.debt = debt
						owner_credit.debt_mutation = (o['nominal'] - purchase_credit)
				else:
					# print('Tidak ada Purchase Payment')
					owner_credit.debt = 0
					debt += o['nominal']
					owner_credit.debt = debt
					owner_credit.debt_mutation = o['nominal']
					owner_credit.credit = credit
			
		owner_credit.save()
		frappe.db.commit()
		
def get_supplier_true_credit(supplier_name):
	def discount_value(value, discount):
		return value - (value * discount/100)
	
	credit = 0
	total_reduced_credit = 0
	
	last_credit = frappe.get_list("VetOwnerCredit", fields=["credit"], filters={'supplier': supplier_name}, order_by="creation desc")
	if last_credit:
		credit = last_credit[0]['credit']
		
	# purchase_orders = frappe.get_list("VetPurchase", fields=["name", "potongan"], filters={'supplier': supplier_name, 'status': ['in', ['Purchase Order', 'Receive', 'Paid']]}, order_by="creation desc")
	# for po in purchase_orders:
	# 	purchase_order_payments = frappe.get_list('VetPurchasePay', filters={'parent': po.name}, fields=['*'])
	# 	purchase_order_products = frappe.get_list('VetPurchaseProducts', filters={'parent': po.name}, fields=['*'])
		
	# 	paid = sum(p.jumlah for p in purchase_order_payments)
		
	# 	received_total = sum(discount_value(p.quantity_receive * p.price, p.discount) for p in purchase_order_products)
	# 	subtotal = sum(discount_value(p.quantity * p.price, p.discount) for p in purchase_order_products)
	# 	total = subtotal - po.potongan
		
	# 	reduced_credit = (paid if paid <= total else total) - received_total
	# 	reduced_credit = reduced_credit if reduced_credit > 0 else 0
	# 	total_reduced_credit += reduced_credit
		
	credit = credit - total_reduced_credit
	credit = credit if credit > 0 else 0
		
	return credit
	
def get_purchase_debit_credit(owner_credit):
	current_owner_credit = frappe.get_doc('VetOwnerCredit', owner_credit)
	
	purchase_payments = frappe.get_list('VetOwnerCredit', filters={'purchase': current_owner_credit.purchase, 'type': 'Purchase', 'date': ['<', current_owner_credit.date]}, order_by='date desc', fields=['nominal'])
	payment_payments = frappe.get_list('VetOwnerCredit', filters={'purchase': current_owner_credit.purchase, 'type': 'Payment', 'date': ['<', current_owner_credit.date]}, order_by='date desc', fields=['nominal'])
	
	purchase_payments_total = sum(p.nominal for p in purchase_payments)
	payment_payments_total = sum(p.nominal for p in payment_payments)
	
	return payment_payments_total - purchase_payments_total