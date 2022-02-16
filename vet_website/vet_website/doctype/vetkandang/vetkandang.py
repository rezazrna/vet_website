# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import json
import frappe
from datetime import datetime as dt
from frappe.model.document import Document

class VetKandang(Document):
	pass

@frappe.whitelist()
def get_kandang_list(filters=None):
	default_sort = "creation desc"
	kandang_filters = []
	kandang_or_filters = []
	odd_filters = []
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
				if fj[0] not in ['masuk_kandang_date','pet_name','owner_name', 'status']:
					kandang_filters.append(fj)
				else:
					odd_filters.append(fj)
		if search:
			kandang_or_filters.append({'cage_name': ['like', '%'+search+'%']})
			kandang_or_filters.append({'status': ['like', '%'+search+'%']})
			kandang_or_filters.append({'cage_size': ['like', '%'+search+'%']})
			kandang_or_filters.append({'pet_name': ['like', '%'+search+'%']})
			kandang_or_filters.append({'owner_name': ['like', '%'+search+'%']})
			kandang_or_filters.append({'cage_location': ['like', '%'+search+'%']})
		if sort:
			sorts = sort.split(',')
			for i,s in enumerate(sorts):
				if 'masuk_kandang_date' in s:
					sorts.pop(i)
					sort_filter = lambda o: o['masuk_kandang_date']
					s_words = s.split(' ')
					if s_words[1] == 'desc':
						sort_filter_reverse = True
			default_sort = ','.join(sorts)
	
	try:
		kandang = frappe.get_list("VetKandang", or_filters=kandang_or_filters, filters=kandang_filters, fields=["*"], order_by=default_sort, start=(page - 1) * 10, page_length= 10)
		datalength = len(frappe.get_all("VetKandang", or_filters=kandang_or_filters, filters=kandang_filters, as_list=True))
		for k in kandang:
			if k.register_number:
				reception = frappe.get_list('VetReception', filters={'register_number' : k.register_number}, fields=['pet'])
				pet = frappe.get_doc('VetPet', reception[0].pet)
				pet_owner = frappe.get_doc('VetPetOwner', pet.parent)
				rawat_inap = frappe.get_list('VetRawatInap', filters={'register_number' : k.register_number}, fields=['creation'])
				k.pet_name = pet.pet_name or ''
				k.owner_name = pet_owner.owner_name or ''
				if rawat_inap:
					k.masuk_kandang_date = rawat_inap[0]['creation']
				else:
					k.masuk_kandang_date = k.creation
			else:
				k.masuk_kandang_date = k.creation
				k.pet_name = ''
				k.owner_name = ''
		
		if sort_filter != False:
			kandang.sort(key=sort_filter, reverse=sort_filter_reverse)
		for fj in odd_filters:
			if fj[0] != 'status':
				result_filter = process_odd_filter(fj)
				kandang = filter(result_filter, kandang)
			else:
				empty = ['',None,False]
				result_filter = lambda a: a.register_number in empty if fj[2] == 'Available' else a.register_number not in empty
				kandang = filter(result_filter, kandang)
		return {'kandang': kandang, 'datalength': datalength}
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def delete_kandang(data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal menghapus kandang"}
	
	for d in data_json:
		frappe.delete_doc('VetKandang', d)
		frappe.db.commit()
		
	return {'success': True}
	
@frappe.whitelist()
def submit_kandang(data):
	try:
		data_json = json.loads(data)
		
		if data_json.get('name', False):
			kandang = frappe.get_doc('VetKandang', data_json.get('name', False))
			kandang.update(data_json)
			kandang.save()
		else:
			kandang = frappe.new_doc('VetKandang')
			kandang.update(data_json)
			kandang.insert()
			
		return get_kandang_list()

	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_all_kandang():
	try:
		kandang = frappe.get_list('VetKandang', fields=['*'])
			
		return kandang

	except PermissionError as e:
		return {'error': e}


@frappe.whitelist()
def toggle_status(name):
	try:
		kandang = frappe.get_doc('VetKandang', name)
		if kandang.status == 'Active':
			kandang.status = 'Inactive'
		elif kandang.status == 'Inactive':
			kandang.status = 'Active'
		kandang.save()
		
		return kandang.status
	except PermissionError as e:
		return {'error': e}
		
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
		
		if 'masuk_kandang_date' in f[0]:
			f[2] = "dt.strptime('%s', '%s')"%(f[2], '%Y-%m-%d')
			
		elif f[1] in ['in', 'not in']:
			f[0] = '%s.lower()'%f[0]
			f[2] = f[2].replace('%',"'").lower()
			fj.reverse()
		elif f[0] not in ['a.pet_name', 'a.owner_name']:
			f[2] = "'%s'"%f[2]
		
		string = " ".join(f)
		print(string)
		
		return lambda a: eval(string)
	else:
		return lambda a: a[f[0]] > dt.strptime(f[2][0], '%Y-%m-%d') and a[f[0]] < dt.strptime(f[2][1], '%Y-%m-%d')