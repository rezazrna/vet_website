# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
from frappe.model.document import Document

class VetPetType(Document):
	pass

@frappe.whitelist()
def get_all_pet_type(filters=None):
	odd_filters = []
	filter_json = False
	pet_type_sorts = []
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
	
	print(filter_json)
	if filter_json:
		filters_json = filter_json.get('filters', False)
		sort = filter_json.get('sort', False)
		if sort:
			sorts = sort.split(',')
			for s in sorts:
				pet_type_sorts.append(s)
			default_sort = sort
		
		if filters_json:
			for fj in filters_json:
				odd_filters.append(fj)
	
	try:
		pet_type = frappe.get_list("VetPetType", fields=['name', 'type_name'], order_by="type_name asc")
		
		if len(pet_type_sorts) > 0:
			for pps in pet_type_sorts:
				reverse = False
				s_words = pps.split(' ')
				index = 1 if s_words[0] == 'race' else 0
				sort_filter = lambda o: o['type_name'].split('/')[index] if len(o['type_name'].split('/')) > index else ''
				if s_words[1] == 'desc':
					reverse = True
				pet_type.sort(key=sort_filter, reverse=reverse)
		
		for fj in odd_filters:
			print(fj)
			result_filter = process_odd_filter(fj)
			pet_type = filter(result_filter, pet_type)
		
		return pet_type
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def new_pet_type(type_name):
	try:
		new_pet_type = frappe.new_doc('VetPetType')
		new_pet_type.update({'type_name': type_name})
		new_pet_type.insert()
		frappe.db.commit()
	
		return get_all_pet_type()
	except frappe.UniqueValidationError as e:
		frappe.msgprint("Jenis hewan sudah ada")
		
@frappe.whitelist()
def edit_pet_type(name, type_name):
	pet_type = frappe.get_doc('VetPetType', name)
	pet_type.update({'type_name': type_name})
	pet_type.save()
	frappe.db.commit()

	return get_all_pet_type()
		
@frappe.whitelist()
def delete_pet_type(name):
	try:
		frappe.delete_doc('VetPetType', name)
		return get_all_pet_type()
	except frappe.LinkExistsError as e:
		frappe.msgprint("Jenis hewan sudah dipakai di dalam record lain")
		
		
def process_odd_filter(fj):
	f = fj
	
	if f[1] == "=":
		f[1] = "=="
	elif f[1] == 'like':
		f[1] = 'in'
	elif f[1] == 'not like':
		f[1] = 'not in'
	if f[0] == 'type':
		f[0] = "a.type_name.split('/')[0]"
	elif f[0] == 'race':
		f[0] = "a.type_name.split('/')[-1]"
		
	if f[1] in ['in', 'not in']:
		f[0] = '%s.lower()'%f[0]
		f[2] = f[2].replace('%',"'").lower()
		fj.reverse()
	else:
		f[2] = "'%s'"%f[2]
	
	string = " ".join(f)
	print(string)
	
	return lambda a: eval(string)