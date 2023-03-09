# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
from frappe.model.document import Document

class VetPet(Document):
	pass

@frappe.whitelist()
def get_pet(filters=None):
	default_sort = "creation desc"
	default_limit = 0
	pet_filters = []
	pet_or_filters = []
	pet_owner_filters = []
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
		search = filter_json.get('search', False)
		filters_json = filter_json.get('filters', False)
		limit = filter_json.get('limit', False)
		currentpage = filter_json.get('currentpage', False)

		if currentpage:
			page = currentpage
		
		if filters_json:
			for fj in filters_json:
				if fj[0] != 'owner_name':
					pet_filters.append(fj)
				else:
					# fj[0] = "owner_name"
					pet_owner_filters.append(fj)
					# fj[0] = "a.pet_owner.owner_name"
					# if fj[1] == "=":
					# 	fj[1] = "=="
					# elif fj[1] == 'like':
					# 	fj[1] = 'in'
					# elif fj[1] == 'not like':
					# 	fj[1] = 'not in'
					# if fj[1] not in ['in', 'not in']:
					# 	fj[2] = "'%s'"%fj[2].lower()
					# 	result_filter = lambda a: eval(" ".join(fj))
					# else:
					# 	fj[2] = fj[2].replace('%',"'").lower()
					# 	fj.reverse()
					# 	result_filter = lambda a: eval(" ".join(fj))
				
		if search:
			pet_owner_filters.append({'owner_name': ['like', '%'+search+'%']})
			pet_or_filters.append({'pet_name': ['like', '%'+search+'%']})
			pet_or_filters.append({'name': ['like', '%'+search+'%']})
			pet_or_filters.append({'hewan_jenis_name': ['like', '%'+search+'%']})
			pet_or_filters.append({'pet_description': ['like', '%'+search+'%']})
		if sort:
			sorts = sort.split(',')
			for i,s in enumerate(sorts):
				if 'pet_owner' in s:
					sorts.pop(i)
					sort_filter = lambda o: o['pet_owner']['owner_name'].lower()
					s_words = s.split(' ')
					if s_words[1] == 'desc':
						sort_filter_reverse = True
			default_sort = ','.join(sorts)
		if limit:
			default_limit = limit

	try:
		if pet_owner_filters:
			pet_owner_names = frappe.get_list("VetPetOwner", filters=pet_owner_filters)
			if search:
				pet_or_filters.append({'parent': ['in', list(map(lambda item: item['name'], pet_owner_names))]})
			else:
				pet_filters.append({'parent': ['in', list(map(lambda item: item['name'], pet_owner_names))]})
		pet = frappe.get_list("VetPet", or_filters=pet_or_filters, filters=pet_filters, fields=["pet_name", "name", "parent", "register_date", "pet_description", "hewan_jenis", "status"], order_by=default_sort, limit=default_limit, start=(page - 1) * 10, page_length= 10)
		datalength = len(frappe.get_all("VetPet", or_filters=pet_or_filters, filters=pet_filters, as_list=True))
		for p in range(len(pet)):
			pet_owner = frappe.get_list("VetPetOwner", filters={'name': pet[p]['parent']}, fields=["owner_name", 'nik', 'phone', 'name', "address"])
			pet_type = frappe.get_list("VetPetType", filters={'name': pet[p]['hewan_jenis']}, fields=["type_name"])
			pet[p]['pet_owner'] = pet_owner[0]
			pet[p]['pet_type'] = pet_type[0]
		
		if sort_filter != False:
			pet.sort(key=sort_filter, reverse=sort_filter_reverse)
		# pet = filter(result_filter, pet)
		
		return {'pet': pet, 'datalength': datalength}
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_name_list(filters=None):
	default_sort = "creation desc"
	pet_filters = []
	pet_or_filters = []
	pet_owner_filters = []
	filter_json = False
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
		
	if filter_json:
		sort = filter_json.get('sort', False)
		search = filter_json.get('search', False)
		filters_json = filter_json.get('filters', False)

		if filters_json:
			for fj in filters_json:
				if fj[0] != 'pet_owner':
					pet_filters.append(fj)
				else:
					pet_owner_filters.append(fj)
					# fj[0] = "a.pet_owner.owner_name.lower()"
					# if fj[1] == "=":
					# 	fj[1] = "=="
					# elif fj[1] == 'like':
					# 	fj[1] = 'in'
					# elif fj[1] == 'not like':
					# 	fj[1] = 'not in'
					# if fj[1] not in ['in', 'not in']:
					# 	fj[2] = "'%s'"%fj[2].lower()
					# 	result_filter = lambda a: eval(" ".join(fj))
					# else:
					# 	fj[2] = fj[2].replace('%',"'").lower()
					# 	fj.reverse()
					# 	result_filter = lambda a: eval(" ".join(fj))
				
		if search:
			pet_owner_filters.append({'owner_name': ['like', '%'+search+'%']})
			pet_or_filters.append({'pet_name': ['like', '%'+search+'%']})
			pet_or_filters.append({'name': ['like', '%'+search+'%']})
			pet_or_filters.append({'hewan_jenis_name': ['like', '%'+search+'%']})
			pet_or_filters.append({'pet_description': ['like', '%'+search+'%']})

		if sort:
			default_sort = sort
	
	try:
		if pet_owner_filters:
			pet_owner_names = frappe.get_list("VetPetOwner", filters=pet_owner_filters)
			if search:
				pet_or_filters.append({'parent': ['in', list(map(lambda item: item['name'], pet_owner_names))]})
			else:
				pet_filters.append({'parent': ['in', list(map(lambda item: item['name'], pet_owner_names))]})
		namelist = frappe.get_all("VetPet", or_filters=pet_or_filters, filters=pet_filters, order_by=default_sort, as_list=True)
		
		return list(map(lambda item: item[0], namelist))
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def delete_pet(data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal menghapus pasien"}
	
	for d in data_json:
		frappe.delete_doc('VetPet', d)
		frappe.db.commit()
		
	return {'success': True}
	
@frappe.whitelist()
def set_decease(data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal menghapus pasien"}
	
	for d in data_json:
		doc = frappe.get_doc('VetPet', d)
		doc.status = "Nonactive"
		doc.save()
		frappe.db.commit()
		
	return {'success': True}
