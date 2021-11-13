# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import json
import frappe
from datetime import datetime as dt
from frappe.model.document import Document

class VetPosOrderPayment(Document):
	pass

@frappe.whitelist()
def get_order_payment_list(filters=None):
	
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
			
			if 'order_date' in f[0]:
				f[2] = "dt.strptime('%s', '%s')"%(f[2], '%Y-%m-%d')
				
			elif f[1] in ['in', 'not in']:
				f[0] = '%s.lower()'%f[0]
				f[2] = f[2].replace('%',"'").lower()
				fj.reverse()
			else:
				f[2] = "'%s'"%f[2]
			
			string = " ".join(f)
			print(string)
			
			return lambda a: eval(string)
		else:
			return lambda a: a[f[0]] > dt.strptime(f[2][0], '%Y-%m-%d') and a[f[0]] < dt.strptime(f[2][1], '%Y-%m-%d')
	
	default_sort = "creation desc"
	payment_filters = []
	filter_json = False
	sort_filter = False
	sort_filter_reverse = False
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

		if currentpage:
			page = currentpage
		
		if filters_json:
			for fj in filters_json:
				if fj[0] not in ['order_date', 'owner_name', 'session']:
					payment_filters.append(fj)
				else:
					odd_filters.append(fj)

		if sort:
			sorts = sort.split(',')
			for i,s in enumerate(sorts):
				if 'order_date' in s:
					sorts.pop(i)
					sort_filter = lambda o: o['order_date']
					s_words = s.split(' ')
					if s_words[1] == 'desc':
						sort_filter_reverse = True
			default_sort = ','.join(sorts)
			
	try:
		order_payment = frappe.get_list("VetPosOrderPayment", filters=payment_filters, fields=["*"], order_by=default_sort, start=(page - 1) * 10, page_length= 10)
		datalength = len(frappe.get_all("VetPosOrderPayment", filters=payment_filters, as_list=True))
		for op in order_payment:
			pos_order = frappe.get_doc('VetPosOrder', op.parent)
			op['order_date'] = pos_order.order_date
			op['owner_name'] = pos_order.owner_name or ''
			op['session'] = pos_order.session
		if sort_filter != False:
			order_payment.sort(key=sort_filter, reverse=sort_filter_reverse)
			
		for fj in odd_filters:
			result_filter = process_odd_filter(fj)
			order_payment = filter(result_filter, order_payment)
			
		return {'data': order_payment, 'datalength': datalength}
			
	except PermissionError as e:
		return {'error': e}