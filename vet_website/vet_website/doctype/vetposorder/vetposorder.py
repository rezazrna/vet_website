# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
from datetime import datetime
from frappe.model.document import Document

class VetPosOrder(Document):
	pass

@frappe.whitelist()
def get_order_list(filters=None):
	default_sort = "creation desc"
	order_filters = []
	filter_json = False
	result_filter = lambda a: a
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
		session = filter_json.get('session', False)
		currentpage = filter_json.get('currentpage', False)
		search = filter_json.get('search', False)

		if currentpage:
			page = currentpage
		
		if filters_json:
			for fj in filters_json:
				if fj[0] != 'metode_pembayaran':
					order_filters.append(fj)
				else:
					odd_filters.append(fj)

		if search:
			order_filters.append({'pet_name': ['like', '%'+search+'%']})
		if sort:
			default_sort = sort
			
		if session:
			order_filters.append({'session': session})
	
	try:
		order = frappe.get_list("VetPosOrder", filters=order_filters, fields=["*"], order_by=default_sort, start=(page - 1) * 10, page_length= 10)
		datalength = len(frappe.get_all("VetPosOrder", filters=order_filters, as_list=True))

		for o in order:
			payment = frappe.get_list("VetPosOrderPayment", filters={'parent': o['name']}, fields=["*"])
			o['metode_pembayaran'] = ', '.join(frappe.db.get_value('VetPaymentMethod', tl.type, 'method_name') or '' for tl in payment if tl.value - tl.exchange != 0)
		
		for fj in odd_filters:
			fj[0] = 'a.metode_pembayaran.lower()'
			fj[1] = 'in'
			fj[2] = "'%s'.lower()"%fj[2]
			fj.reverse()
			result_filter = lambda a: eval(" ".join(fj))
			order = filter(result_filter, order)
		return {'order': order, 'datalength': datalength}
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_name_list(filters=None):
	order_filters = []
	filter_json = False
	result_filter = lambda a: a
	odd_filters = []
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
		
	if filter_json:
		filters_json = filter_json.get('filters', False)
		session = filter_json.get('session', False)
		
		if filters_json:
			for fj in filters_json:
				if fj[0] != 'metode_pembayaran':
					order_filters.append(fj)
				else:
					odd_filters.append(fj)
			
		if session:
			order_filters.append({'session': session})
	
	try:
		namelist = frappe.get_all("VetPosOrder", filters=order_filters, as_list=True)
		
		return list(map(lambda item: item[0], namelist))
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_pos_order(name=None):
	try:
		if name != None :
			payment_method_list = frappe.get_list('VetPaymentMethod', fields=['*'])
			order = frappe.get_doc('VetPosOrder', name)
			res = {'order': order, 'payment_method_list': payment_method_list}
		else:
			res = {}
		    
		return res
	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()
def refund_order(name=None):
	try:
		old_order = frappe.get_doc('VetPosOrder', name)
		old_order.already_refund = True
		old_order.save()
		order = frappe.new_doc('VetPosOrder')
		order.update({
			'refund_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
			'session': old_order.session,
			'responsible': frappe.session.user,
			'produk': old_order.produk,
			'pet': old_order.pet,
			'subtotal': old_order.subtotal,
			'tax': old_order.tax,
			'total': old_order.total,
			'is_refund': True
		})
		order.insert()
		frappe.db.commit()
				
		return {'order': order}
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_report(filters=None):
	po_filters = []
	filter_json = False
	group = ''
	scale = ''
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
		
	if filter_json:
		filters_json = filter_json.get('filters', False)
		group = filter_json.get('sort', False)
		scale = filter_json.get('scale', False)
		
		if filters_json:
			for fj in filters_json:
				po_filters.append(fj)
	
	try:
		if group:
			pos_order = frappe.get_list("VetPosOrder", filters=po_filters, fields=["order_date", "total"], order_by="creation asc", group_by=group)
		else:
			pos_order = frappe.get_list("VetPosOrder", filters=po_filters, fields=["order_date", "total"], order_by="creation asc")
		
		res = []
		
		for p in pos_order:
			berhasil = False
			
			if scale == 'day':
				for r in res:
					if p['order_date'] != None and p['order_date'].date() == r['order_date']:
						r['total'] += p['total']
						berhasil = True
						
				if berhasil == False:
					if p['order_date'] != None:
						ob = {'order_date': p['order_date'].date(), 'total': p['total']}
					else:
						ob = {'order_date': p['order_date'], 'total': p['total']}
					res.append(ob)
			else:
				for r in res:
					if p['order_date'] != None and p['order_date'].date().month == r['order_date'].month:
						r['total'] += p['total']
						berhasil = True
						
				if berhasil == False:
					if p['order_date'] != None:
						ob = {'order_date': p['order_date'].date(), 'total': p['total']}
					else:
						ob = {'order_date': p['order_date'], 'total': p['total']}
					res.append(ob)
			
		return res
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def delete_pos_order(data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal menghapus pos order"}
	
	for d in data_json:
		frappe.delete_doc('VetPosOrder', d)
		frappe.db.commit()
		
	return {'success': True}