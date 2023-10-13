# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
import os
import math
import pytz
from datetime import datetime as dt
from frappe.utils import data
from frappe.utils.file_manager import save_file
from frappe.core.doctype.file.file import get_local_image
from frappe.model.document import Document
from vet_website.vet_website.doctype.vetproductpack.vetproductpack import get_pack_price

class VetProduct(Document):
	pass

@frappe.whitelist()
def get_product(name):
	try:
		product = frappe.get_doc("VetProduct", name)
		product_category_search = frappe.get_list("VetProductCategory", filters={'name': product.product_category}, fields=['*'])
		if len(product_category_search) != 0:
			product.update({'product_category': product_category_search[0]})
		return {'product': product}
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_product_details(name):
	try:
		product = frappe.get_doc("VetProduct", name)
		uom = frappe.get_doc("VetUOM", product.product_uom)
		res = {'product_name': product.product_name, 'uom': uom.uom_name}
		return res
	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()
def get_product_details_hpp(name, quantity):
	try:
		product = frappe.get_doc("VetProduct", name)
		uom = frappe.get_doc("VetUOM", product.product_uom)
		
		purchase_with_stock_search = frappe.get_list('VetPurchaseProducts', filters={'product': name}, fields=['name', 'quantity_stocked', 'product', 'product_name', 'price', 'parent'], order_by="creation asc")
		purchase_with_stock = list(p for p in purchase_with_stock_search if p.quantity_stocked)

		current_quantity = float(quantity)
		total = 0
		price = 0

		if float(quantity) <= 0:
			if len(purchase_with_stock) > 0:
				price = purchase_with_stock[0]['price']
		else:
			for pws in purchase_with_stock:
				if current_quantity != 0:
					purchase_product = frappe.get_doc('VetPurchaseProducts', pws.name)
					
					if (purchase_product.uom != product.product_uom) :
						ratio = frappe.db.get_value('VetUOM', product.product_uom, 'ratio')
						target_ratio = frappe.db.get_value('VetUOM', purchase_product.uom, 'ratio')
						current_quantity = current_quantity * (float(ratio or 1)/float(target_ratio or 1))
						current_uom = purchase_product.uom
					
					if float(current_quantity) > purchase_product.quantity_stocked:
						current_quantity = float(current_quantity) - purchase_product.quantity_stocked
						total += purchase_product.price * purchase_product.quantity_stocked
					else:
						total += purchase_product.price * current_quantity
						current_quantity = 0
			price = total / float(quantity)

		res = {'product_name': product.product_name, 'uom': uom.uom_name, 'price': price}

		return res
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_product_form(name=False):
	try:
		uom_list = frappe.get_list('VetUOM', fields=['*'])
		category_list = frappe.get_list('VetProductCategory', fields=['*'])
		tag_list = frappe.get_list("VetTag", fields=["*"])
		supplier_list = frappe.get_list("VetSupplier", fields=["*"])
		form_data = {'uom_list': uom_list, 'category_list': category_list, 'tag_list': tag_list, 'supplier_list': supplier_list}
		if name:
			product_search = frappe.get_list("VetProduct", filters={'name': name}, fields=['*'])
			product = product_search[0]
			quantity = frappe.get_list("VetProductQuantity", filters={'product': product.name}, fields=["*"])
			purchaseproduct = frappe.get_list("VetPurchaseProducts", filters={'product': product.name}, fields=["parent"])
			purchase_name_map = map(lambda x: x.parent, purchaseproduct)
			purchase_number = frappe.get_list("VetPurchase", filters={'name': ['in', list(purchase_name_map)]}, fields=["name"])
			salesproduct = frappe.get_list("VetCustomerInvoiceLine", filters={'product': product.name}, fields=["parent"])
			sales_name_map = map(lambda x: x.parent, salesproduct)
			sales_number = frappe.get_list("VetCustomerInvoice", filters={'name': ['in', list(sales_name_map)]}, fields=["name"])
			suppliers = frappe.get_list("VetProductSuppliers", filters={'parent': product.name}, fields=["*"])
			tags = frappe.get_list("VetProductTags", filters={'parent': product.name}, fields=["*"])
			pack = frappe.get_list("VetProductPack", filters={'parent': product.name}, fields=["*"])
			product.update({'quantity': sum(q.quantity for q in quantity), 'suppliers': suppliers, 'tags': tags, 'purchase_number': len(purchase_number), 'sales_number': len(sales_number), 'pack': pack})
			form_data.update({'product': product})
			
		return form_data
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_product_list(filters=None):
	default_sort = "creation desc"
	td_filters = []
	td_or_filters = []
	product_tag_filters = {}
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

		if search:
			td_or_filters.append({'product_name': ['like', '%'+search+'%']})
			td_or_filters.append({'name': ['like', '%'+search+'%']})
			td_or_filters.append({'category_name': ['like', '%'+search+'%']})
			td_or_filters.append({'price': ['like', '%'+search+'%']})
		
		if filters_json:
			for fj in filters_json:
				if fj[0] == 'tag':
					product_tag_filters.update({'tag_id': [fj[1], fj[2]]})
				else:
					td_filters.append(fj)
		
		if sort:
			default_sort = sort
			
	try:
		if len(product_tag_filters) > 0:
			product_filtered =  frappe.get_list("VetProductTags", filters=product_tag_filters, fields=["name", "parent"])
			product_names = list(p.parent for p in product_filtered)
			td_filters.append(['name', 'in', product_names])

		product_list = frappe.get_list("VetProduct", or_filters=td_or_filters, filters=td_filters, fields=["*"], order_by=default_sort, start=(page - 1) * 10, page_length= 10)
		datalength = len(frappe.get_all("VetProduct", or_filters=td_or_filters, filters=td_filters, as_list=True))
		for p in product_list:
			uom_name = frappe.db.get_value('VetUOM', p.product_uom, 'uom_name')
			tags = frappe.get_list("VetProductTags", filters={'parent': p.name}, fields=["*"], order_by='creation desc')
			quantity = frappe.get_list("VetProductQuantity", filters={'product': p.name}, fields=["*"], order_by='creation desc')
			purchaseproduct = frappe.get_list("VetPurchaseProducts", filters={'product': p.name}, fields=["parent"])
			purchase_name_map = map(lambda x: x.parent, purchaseproduct)
			purchase_number = frappe.get_list("VetPurchase", filters={'name': ['in', list(purchase_name_map)]}, fields=["name"])
			salesproduct = frappe.get_list("VetCustomerInvoiceLine", filters={'product': p.name}, fields=["parent"])
			sales_name_map = map(lambda x: x.parent, salesproduct)
			sales_number = frappe.get_list("VetCustomerInvoice", filters={'name': ['in', list(sales_name_map)]}, fields=["name"])
			p.update({'uom_name': uom_name, 'tags': tags, 'quantity': sum(q.quantity for q in quantity), 'purchase_number': len(purchase_number), 'sales_number': len(sales_number)})

		category_list = frappe.get_all("VetProductCategory")
		tag_list = frappe.get_all("VetTag")
			
		return {'product': product_list, 'datalength': datalength, 'category_list': category_list, 'tag_list': tag_list}
		
	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()
def get_name_list(filters=None):
	default_sort = "creation desc"
	td_filters = []
	td_or_filters = []
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

		if search:
			td_or_filters.append({'product_name': ['like', '%'+search+'%']})
			td_or_filters.append({'category_name': ['like', '%'+search+'%']})
			td_or_filters.append({'price': ['like', '%'+search+'%']})
		
		if filters_json:
			for fj in filters_json:
				td_filters.append(fj)

		if sort:
			default_sort = sort
			
	try:
		namelist = frappe.get_all("VetProduct", or_filters=td_or_filters, filters=td_filters, order_by=default_sort, as_list=True)
			
		return list(map(lambda item: item[0], namelist))
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def delete_product(data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal menghapus product"}
	
	for d in data_json:
		frappe.delete_doc('VetProduct', d)
		frappe.db.commit()
		
	return {'success': True}
	
@frappe.whitelist()
def check_pack(name, quantity):
	try:
		product_sale_price = frappe.db.get_value('VetProduct', name, 'price')
		pack = frappe.get_list('VetProductPack', filters={'parent': name}, fields=['harga_pack', 'quantity_pack'])
		selected_pack = [i for i in pack if i['quantity_pack'] <= math.ceil(float(quantity))]
		# selected_pack = [i for i in pack if i['quantity_pack'] <= float(quantity)]
		selected_pack.sort(key=lambda a: a.quantity_pack, reverse=True)
		if selected_pack:
			harga_pack = get_pack_price(float(quantity), product_sale_price, selected_pack[0]['quantity_pack'], selected_pack[0]['harga_pack'])
			# return {'harga_pack': selected_pack[0]['harga_pack']}
			return {'harga_pack': harga_pack}
		else:
			return False
	except PermissionError as e:
		return {'error': e}
	
@frappe.whitelist()
def new_product(data):
	tz = pytz.timezone("Asia/Jakarta")
	now = dt.now(tz)
	now_str = dt.strftime(now, "%d%m%Y%H%M%S")
	try:
		data_json = json.loads(data)
		product_data = {}
		product_data.update(data_json)
		product_data.update({'product_name': product_data.get('product_name').replace('<', 'kurang').replace('>', 'lebih')})
		product_data.pop('suppliers')
		product_data.pop('tags')
		new_product = frappe.new_doc('VetProduct')
		new_product.update(product_data)
		if data_json.get("dataurl"):
			filename = now_str+"-"+data_json["filename"]
			filedoc = save_file(filename, data_json["dataurl"], "VetProduct", new_product.name, decode=True, is_private=0)
			filedoc.make_thumbnail()
			resize_image(filedoc.file_url)
			new_product.update({"image": filedoc.file_url})
		new_product.insert()
		
		for t in data_json.get("tags"):
			if t.get('name'):
				if t.get('delete'):
					product_tag = frappe.delete_doc('VetProductTags', t.get('name'))
			else:
				if t.get('tag_id'):
					new_product_tag = frappe.new_doc('VetProductTags')
					new_product_tag.tag_id = t.get('tag_id')
					new_product_tag.update({'parent': new_product.name, 'parenttype': 'VetProduct', 'parentfield': 'tags'})
					new_product_tag.insert()
					
		for s in data_json.get("suppliers"):
			if all([s.get('supplier', False), s.get('min_quantity', False), s.get('purchase_price', False)]):
				new_product_supplier = frappe.new_doc('VetProductSuppliers')
				new_product_supplier.update({
					'supplier': s.get('supplier', False),
					'min_quantity': s.get('min_quantity', False),
					'purchase_price': s.get('purchase_price', False),
					'parent': new_product.name, 
					'parenttype': 'VetProduct', 
					'parentfield': 'suppliers'
				})
				new_product_supplier.insert()
				
		
		return new_product
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def edit_product(data):
	tz = pytz.timezone("Asia/Jakarta")
	now = dt.now(tz)
	now_str = dt.strftime(now, "%d%m%Y%H%M%S")
	try:
		data_json = json.loads(data)
		
		data_check = frappe.get_list('VetProduct', filters={'name': data_json.get('name', False)}, fields=['name'])
		if len(data_check) != 0:
			product_data = {}
			product_data.update(data_json)
			product_data.pop('suppliers')
			product_data.pop('tags')
			update_product = frappe.get_doc('VetProduct', data_json.get('name', False))
			update_product.update(product_data)
			if data_json.get("dataurl"):
				filename = now_str+"-"+data_json["filename"]
				filedoc = save_file(filename, data_json["dataurl"], "VetProduct", update_product.name, decode=True, is_private=0)
				filedoc.make_thumbnail()
				resize_image(filedoc.file_url)
				update_product.update({"image": filedoc.file_url})

			update_product.save()
			
			for t in data_json.get("tags"):
				if t.get('name'):
					if t.get('delete'):
						product_tag = frappe.delete_doc('VetProductTags', t.get('name'))
				else:
					if t.get('tag_id'):
						new_product_tag = frappe.new_doc('VetProductTags')
						new_product_tag.tag_id = t.get('tag_id')
						new_product_tag.update({'parent': update_product.name, 'parenttype': 'VetProduct', 'parentfield': 'tags'})
						new_product_tag.insert()
			
			for s in data_json.get("suppliers"):
				if s.get('name', False):
					product_supplier = frappe.get_doc('VetProductSuppliers', s.get('name', False))
					product_supplier.update({
						'supplier': s.get('supplier', False),
						'min_quantity': s.get('min_quantity', False),
						'purchase_price': s.get('purchase_price', False),
					})
					product_supplier.save()
				else:
					if all([s.get('supplier', False), s.get('min_quantity', False), s.get('purchase_price', False)]):
						new_product_supplier = frappe.new_doc('VetProductSuppliers')
						new_product_supplier.update({
							'supplier': s.get('supplier', False),
							'min_quantity': s.get('min_quantity', False),
							'purchase_price': s.get('purchase_price', False),
							'parent': update_product.name, 
							'parenttype': 'VetProduct', 
							'parentfield': 'suppliers'
						})
						new_product_supplier.insert()

			return update_product
		
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
        print(file_url+" oke")
    except IOError:
        print("Unable to write file format for {0}".format(path))
        return

    return image_url