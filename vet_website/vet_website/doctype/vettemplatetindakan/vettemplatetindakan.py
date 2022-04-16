# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
from frappe.model.document import Document
from numpy import product
from vet_website.vet_website.doctype.vetproduct.vetproduct import get_product

class VetTemplateTindakan(Document):
	pass
	
@frappe.whitelist()
def save_template_tindakan(data):
	try:
		data_json = json.loads(data)
		
		template_tindakan = frappe.new_doc('VetTemplateTindakan')
		template_tindakan_data = {}
		template_tindakan_data.update(data_json)
		template_tindakan_data.pop('tindakan_template')
		template_tindakan_data.pop('tindakan')
		template_tindakan.update(template_tindakan_data)
		template_tindakan.insert()
		
		for tindakan in data_json.get('tindakan'):
			tindakan_data = {}
			tindakan_data.update(tindakan)
			tindakan_data.update({'parent': template_tindakan.name, 'parenttype': 'VetTemplateTindakan', 'parentfield': 'tindakan'})

			new_tindakan = frappe.new_doc("VetTemplateTindakanProducts")
			new_tindakan.update(tindakan_data)

			template_tindakan.tindakan.append(new_tindakan)
			template_tindakan.save()
			
		template_tindakan.reload()
		rawat_inap_search = frappe.get_list('VetRawatInap', filters={'register_number': template_tindakan.register_number}, fields=['name'])
		rawat_inap = frappe.get_doc('VetRawatInap', rawat_inap_search[0]['name'])
		rawat_inap.cage = template_tindakan.cage
		rawat_inap.save()
		frappe.db.commit()
		
		kandang = frappe.get_doc('VetKandang', template_tindakan.cage)
		kandang.register_number = template_tindakan.register_number
		kandang.save()
		frappe.db.commit()
			
		return template_tindakan

	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def check_template_tindakan(register_number):
	try:
		template_tindakan = frappe.get_list("VetTemplateTindakan", filters={'register_number': register_number}, fields=['name'])
		return template_tindakan

	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_template_tindakan(register_number):
	try:
		list_tindakan = []
		template_tindakan = frappe.get_list('VetTemplateTindakan', filters={'register_number': register_number}, fields=['*'])
		
		if template_tindakan:
			template_tindakan_products = frappe.get_list('VetTemplateTindakanProducts', filters={'parent': template_tindakan[0]['name']}, fields=['*'])
			for t in template_tindakan_products:
				if t.product:
					pr = get_product(t.product)
					productTemplate = frappe.get_list('VetProduct', filters={'name': t.product}, fields=['*'])
					uom = frappe.get_list('VetUOM', filters={'name': productTemplate[0]['product_uom']}, fields=['*'])
					productTemplate[0]['quantity'] = t.quantity
					productTemplate[0]['uom_name'] = uom[0].uom_name
					productTemplate[0]['pagi'] = t.pagi
					productTemplate[0]['siang'] = t.siang
					productTemplate[0]['sore'] = t.sore
					productTemplate[0]['malam'] = t.malam
					productTemplate[0]['tindakan_name'] = t.name
					productTemplate[0]['product_category'] = pr.get('product').get('product_category')
					productTemplate[0]['description'] = t.description
					
					list_tindakan.append(productTemplate[0])
					
				else:
					t.tindakan_name = t.name
					list_tindakan.append(t)
				
			template_tindakan[0].tindakan = list_tindakan
		else:
			template_tindakan = [{'tindakan': [], 'register_number': register_number}]
			
		return template_tindakan[0]

	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()
def edit_template_tindakan(data):
	try:
		data_json = json.loads(data)
		
		if data_json.get('name'):
		
			template_tindakan = frappe.get_doc('VetTemplateTindakan', data_json.get('name', False))
			
			for tindakan in data_json.get('tindakan', []):
				if tindakan.get('tindakan_name', False):
					if tindakan.get('delete', False):
						frappe.delete_doc('VetTemplateTindakanProducts', tindakan.get('tindakan_name', False))
					else:
						update_tindakan = frappe.get_doc('VetTemplateTindakanProducts', tindakan.get('tindakan_name', False))
						update_tindakan.update({
							'pagi': tindakan.get('pagi', False),
							'siang': tindakan.get('siang', False),
							'sore': tindakan.get('sore', False),
							'malam': tindakan.get('malam', False),
						})
						update_tindakan.save()
				else:
					tindakan_data = {
						'pagi': tindakan.get('pagi', False),
						'siang': tindakan.get('siang', False),
						'sore': tindakan.get('sore', False),
						'malam': tindakan.get('malam', False),
						'quantity': tindakan.get('quantity', ''),
						'product': tindakan.get('product', ''),
						'description': tindakan.get('description', '')
					}
					tindakan_data.update(tindakan)
					tindakan_data.update({'parent': template_tindakan.name, 'parenttype': 'VetTemplateTindakan', 'parentfield': 'tindakan'})
		
					new_tindakan = frappe.new_doc("VetTemplateTindakanProducts")
					new_tindakan.update(tindakan_data)
		
					template_tindakan.tindakan.append(new_tindakan)
					template_tindakan.save()
				
		return template_tindakan
		
	except PermissionError as e:
		return {'error': e}