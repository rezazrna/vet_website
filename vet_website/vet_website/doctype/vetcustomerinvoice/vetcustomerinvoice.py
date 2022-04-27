# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
import math
import pytz
from datetime import datetime as dt
from frappe.model.document import Document
from vet_website.vet_website.doctype.vetoperation.vetoperation import action_receive
from vet_website.vet_website.doctype.vetjournalentry.vetjournalentry import new_journal_entry, set_journal_item_total
from vet_website.vet_website.doctype.vetpetowner.vetpetowner import set_owner_credit_total
from vet_website.vet_website.doctype.vetproductpack.vetproductpack import get_pack_price

class VetCustomerInvoice(Document):
	pass

@frappe.whitelist()
def add_invoice_line_list(invoice_id):
	try:
		# invoice = frappe.get_doc("VetCustomerInvoice", invoice_id)
		# render = frappe.render_template('templates/customer_invoice/invoice_line_list.html', {'mode': 'Edit', 'invoice': invoice})
		invoice = frappe.get_doc("Sales Invoice", invoice_id)
		render = frappe.render_template('templates/customer_invoice/invoice_line_list2.html', {'mode': 'Edit', 'invoice': invoice})
		return {'render': render}
	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()
def get_product_detail(product_id):
	try:
		product = frappe.get_doc("VetProduct", product_id)

		if product:
			uom = frappe.get_doc("VetUOM", product.product_uom)
			product_category = frappe.get_doc("VetProductCategory", product.product_category)
			product_data = {
				'product_name': product.product_name,
				'price': product.price,
				'uom': uom.uom_name,
				'product_category': product_category
			}

			return {'product': product_data}

		else:
			return {'error': "Product tidak ditemukan"}	

	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def new_invoice(data):
	try:
		invoice_json = json.loads(data)
	
		invoice = frappe.new_doc("VetCustomerInvoice")
	
		new_invoice_data = {
			'register_number': invoice_json.get('register_number'),
			'pet': invoice_json.get('pet'),
			'user': frappe.session.user,
			'invoice_date': invoice_json.get('invoice_date'),
			'origin': invoice_json.get('register_number'),
			'potongan': invoice_json.get('potongan', 0)
		}
		invoice.update(new_invoice_data)
		invoice.insert()
	
		subtotal = 0
	
		for product in invoice_json.get('invoice_line'):
			if all([product.get('product', False), product.get('quantity', False)]):
				product_data = {}
				product_data.update(product)
				product_data.update({'parent': invoice.name, 'parenttype': 'VetCustomerInvoice', 'parentfield': 'invoice_line'})
				new_product = frappe.new_doc("VetCustomerInvoiceLine")
				new_product.update(product_data)
				new_product.insert()
				if(not product_data.get('total')):
					check_pack = frappe.get_list('VetProductPack', filters={'parent': new_product.product}, fields=['harga_pack', 'quantity_pack'])
					selected_pack = [i for i in check_pack if i['quantity_pack'] <= float(math.ceil(new_product.quantity))]
					# selected_pack = [i for i in check_pack if i['quantity_pack'] <= float(new_product.quantity)]
					selected_pack.sort(key=lambda a: a.quantity_pack, reverse=True)
					if (selected_pack):
						total = get_pack_price(float(math.ceil(new_product.quantity)), float(new_product.unit_price), selected_pack[0]['quantity_pack'], selected_pack[0]['harga_pack'])
						# total = get_pack_price(float(new_product.quantity), float(new_product.unit_price), selected_pack[0]['quantity_pack'], selected_pack[0]['harga_pack'])
						new_product.update({'total': total-(float(new_product.discount, 0) / 100*total)})
					else:
						new_product.update({'total': float(new_product.unit_price) * float(math.ceil(new_product.quantity)) - (float(new_product.discount, 0) / 100 * (float(new_product.unit_price) * float(math.ceil(new_product.quantity))))})
						# new_product.update({'total': float(new_product.unit_price) * float(new_product.quantity) - (float(new_product.discount, 0) / 100 * (float(new_product.unit_price) * float(new_product.quantity)))})
					
				new_product.save()
		
				subtotal += new_product.total
		
				invoice.invoice_line.append(new_product)
		
				invoice.save()
	
		invoice.update({'subtotal': subtotal, 'total': subtotal - float(invoice.potongan)})
		invoice.save()
		
		return invoice
		
	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()
def open_invoice_from_list(name_list):
	try:
		nl_json = json.loads(name_list)
	except:
		return {'error': "Gagal menghapus invoice"}
	
	for name in nl_json:
		data = get_customer_invoice_form(name)
		open_invoice_process(data.get("customer_invoice"))

	return get_invoice_list()

@frappe.whitelist()
def set_parent_invoice_status(name, status):
	invoice = frappe.get_doc('VetCustomerInvoice', name)
	invoice.status = status
	invoice.save()
	
	return True

@frappe.whitelist()
def open_invoice(data, saveonly=False):
	try:
		invoice_json = json.loads(data)
		if isinstance(invoice_json, dict):
			open_invoice = open_invoice_process(invoice_json, saveonly)
			return open_invoice
		elif isinstance(invoice_json, list):
			results = []
			for i in invoice_json:
				invoice_check = frappe.get_list("VetCustomerInvoice", filters={'name': i.get('name')}, fields=['name', 'status', 'rawat_inap', 'is_rawat_inap'])
				if invoice_check and invoice_check[0].status in ['Draft']:
					open_invoice = open_invoice_process(i, saveonly)
					results.append(open_invoice)
				else:
					invoice = frappe.get_doc("VetCustomerInvoice", invoice_check[0].name)
					results.append({'invoice': invoice})
				
			return results

	except PermissionError as e:
		return {'error': e}
		
def open_invoice_process(data, saveonly=False):
	tz = pytz.timezone("Asia/Jakarta")
	invoice_check = frappe.get_list("VetCustomerInvoice", filters={'name': data.get('name')}, fields=['name', 'status', 'rawat_inap', 'is_rawat_inap'])

	if invoice_check and invoice_check[0].status in ['Draft']:
		pos_session = False
		
		if saveonly == False:
		# 	rawat_inap_search = frappe.get_list('VetRawatInap', filters={'name': invoice_check[0].rawat_inap}, fields=['name'])
		# 	if len(rawat_inap_search) > 0 and invoice_check[0].is_rawat_inap == 1:
		# 		rawat_inap_status = frappe.db.get_value('VetRawatInap', invoice_check[0].rawat_inap, 'status')
		# 		if rawat_inap_status != 'Done':
		# 			return {'error': "Rawat Inap Belum Selesai"}
					
			session_search = frappe.get_list('VetPosSessions', filters={'status': 'In Progress'}, fields=['name'])
			if len(session_search) < 1 and not data.get('ignore_pos',False):
				return {'error': "Belum ada POS Session yang dibuka, bukan POS Session terlebih dahulu"}
			else:
				pos_session = session_search[0].name

		subtotal = 0
		for line in data.get("invoice_line"):
			if line.get('name', False):
				line_doc = frappe.get_doc("VetCustomerInvoiceLine", line.get('name'))
				
				if line.get('deleted'):
					line_doc.delete()
					frappe.db.commit()
				elif line_doc:
					line_doc.update({
						'product': line.get('product', False),
						'product_name': line.get('product_name', False),
						'product_uom': line.get('product_uom', False),
						# 'quantity': math.ceil(float(line.get('quantity', False))),
						'quantity': float(line.get('quantity', False)),
						'unit_price': line.get('unit_price', False),
						'discount': line.get('discount', 0),
						'total': line.get('total', False),
					})
					if(not line.get('total', False)):
						check_pack = frappe.get_list('VetProductPack', filters={'parent': line_doc.product}, fields=['harga_pack', 'quantity_pack'])
						selected_pack = [i for i in check_pack if i['quantity_pack'] <= float(math.ceil(line_doc.quantity))]
						# selected_pack = [i for i in check_pack if i['quantity_pack'] <= float(line_doc.quantity)]
						selected_pack.sort(key=lambda a: a.quantity_pack, reverse=True)
						if selected_pack:
							total = get_pack_price(float(math.ceil(line.get('quantity'))), float(line.get('unit_price')), selected_pack[0]['quantity_pack'], selected_pack[0]['harga_pack'])
							# total = get_pack_price(float(line.get('quantity')), float(line.get('unit_price')), selected_pack[0]['quantity_pack'], selected_pack[0]['harga_pack'])
							line_doc.total = total-(float(line.get('discount', 0)) / 100*total)
						else:
							line_doc.total = float(line.get('unit_price')) * float(math.ceil(line.get('quantity'))) - (float(line.get('discount', 0)) / 100 * (float(line.get('unit_price')) * float(math.ceil(line.get('quantity')))))
							# line_doc.total = float(line.get('unit_price')) * float(line.get('quantity')) - (float(line.get('discount', 0)) / 100 * (float(line.get('unit_price')) * float(line.get('quantity'))))
							
					subtotal += line_doc.total
					line_doc.save()
					frappe.db.commit()
			else:
				if all([line.get('product', False), line.get('quantity', False)]):
					line_data = {}
					line_data.update(line)
					line_data.update({'parent': invoice_check[0].name, 'parenttype': 'VetCustomerInvoice', 'parentfield': 'invoice_line'})
					new_line = frappe.new_doc("VetCustomerInvoiceLine")
					new_line.update(line_data)
					new_line.insert()
					if(not line_data.get('total', False)):
						check_pack = frappe.get_list('VetProductPack', filters={'parent': new_line.product}, fields=['harga_pack', 'quantity_pack'])
						selected_pack = [i for i in check_pack if i['quantity_pack'] <= float(math.ceil(new_line.quantity))]
						# selected_pack = [i for i in check_pack if i['quantity_pack'] <= new_line.quantity]
						selected_pack.sort(key=lambda a: a.quantity_pack, reverse=True)
						if selected_pack:
							total = get_pack_price(float(math.ceil(new_line.quantity)), float(new_line.unit_price), selected_pack[0]['quantity_pack'], selected_pack[0]['harga_pack'])
							# total = get_pack_price(float(new_line.quantity), float(new_line.unit_price), selected_pack[0]['quantity_pack'], selected_pack[0]['harga_pack'])
							new_line.update({'total': total-(float(new_line.discount, 0) / 100*total)})
						else:
							new_line.update({'total': float(new_line.unit_price) * float(math.ceil(new_line.quantity)) - (float(new_line.discount, 0) / 100 * (float(new_line.unit_price) * float(math.ceil(new_line.quantity))))})
							# new_line.update({'total': float(new_line.unit_price) * float(new_line.quantity) - (float(new_line.discount, 0) / 100 * (float(new_line.unit_price) * float(new_line.quantity)))})
					new_line.save()
					frappe.db.commit()
			
					subtotal += new_line.total

		invoice = frappe.get_doc("VetCustomerInvoice", invoice_check[0].name)
		if saveonly == False:
			if not all(check_product_account(i.product) for i in invoice.invoice_line):
				frappe.msgprint('Tidak Bisa mengirim sales karena kategori barang belum memiliki Stock Input Account, Stock Output Account, dan Income Account')
				return False
			check_sales_journal()
		
		if saveonly == False:
			invoice.update({'status': 'Open', 'pos_session': pos_session})
		invoice.update({'subtotal': subtotal, 'total': subtotal - float(data.get('potongan', 0)), 'potongan': data.get('potongan', 0)})
		invoice.save()
		frappe.db.commit()
		invoice.reload()
		if saveonly == False:
			create_sales_journal_entry(invoice.name)
			invoice.reload()
			deliver_to_customer(invoice.name)
			
			owner_credit = frappe.new_doc('VetOwnerCredit')
			owner_credit.update({
				'date': dt.strftime(dt.now(tz), "%Y-%m-%d %H:%M:%S"),
				'register_number': invoice.register_number,
				'invoice': invoice.name,
				'type': 'Sales',
				'nominal': invoice.total
			})
			owner_credit.insert()
			frappe.db.commit()
			set_owner_credit_total(invoice.owner)
			
			last_credit = frappe.get_list('VetOwnerCredit', filters={'pet_owner': invoice.owner}, fields=['credit'], order_by="creation desc")
			if last_credit and invoice.is_rawat_inap == 1:
				data = {'jumlah': 0, 'name': invoice.name}
				paid = 0
				paid_search = frappe.get_list('VetCustomerInvoicePay', filters={'parent': invoice.name}, fields=['sum(jumlah) as paid'])
				if paid_search[0]['paid'] != None:
					paid = paid_search[0]['paid']
					
				remaining = invoice.total - paid
				
				if last_credit[0]['credit'] > 0:
					if last_credit[0]['credit'] > remaining:
						data.update({'jumlah': remaining})
					else:
						data.update({'jumlah': last_credit[0]['credit']})
					
					# session_search = frappe.get_list('VetPosSessions', filters={'status': 'In Progress'}, fields=['name'])
					# if len(session_search) > 0:
					# 	add_payment_from_deposit(json.dumps(data))
					add_payment_from_deposit(json.dumps(data))
			
		return {'invoice': invoice}

	else:
		return {'error': "Invoice tidak ditemukan"}
		
@frappe.whitelist()
def join_invoice(name_list, datetime):
	try:
		nl_json = json.loads(name_list)
	except:
		return {'error': "Gagal menggabung invoice"}
		
	first_pet = frappe.db.get_value('VetCustomerInvoice', nl_json[0], 'pet')
	first_status = frappe.db.get_value('VetCustomerInvoice', nl_json[0], 'status')
	first_is_rawat_inap = frappe.db.get_value('VetCustomerInvoice', nl_json[0], 'is_rawat_inap')
		
	join_invoice = frappe.new_doc("VetCustomerInvoice")
	
	children_customer_invoice = []
	for name in nl_json:
		has_children = frappe.db.get_list('VetCustomerInvoiceChildren', filters={'parent': name}, fields=['customer_invoice'])
		print('has_children')
		print(has_children)
		if has_children:
			print('masuk')
			for child in has_children:
				children_customer_invoice.append({'customer_invoice': child.customer_invoice})
		else:
			children_customer_invoice.append({'customer_invoice': name})
	
	print(children_customer_invoice)
	new_invoice_data = {
		'pet': first_pet,
		'user': frappe.session.user,
		'invoice_date': datetime,
		'status': first_status,
		'children_customer_invoice': children_customer_invoice,
		'is_rawat_inap': first_is_rawat_inap
	}
	join_invoice.update(new_invoice_data)
	join_invoice.insert()
	
	for name in nl_json:
		frappe.db.set_value('VetCustomerInvoice', name, 'parent_customer_invoice', join_invoice.name, update_modified=False)

	return {'success': True}
		
@frappe.whitelist()
def get_invoice_list(filters=None):
	default_sort = "creation desc"
	invoice_filters = []
	invoice_or_filters = []
	odd_filters = []
	filter_json = False
	page = 1
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
	
	if filter_json:
		register_number_search = False
		sort = filter_json.get('sort', False)
		filters_json = filter_json.get('filters', False)
		pet = filter_json.get('pet', False)
		petOwner = filter_json.get('petOwner', False)
		session = filter_json.get('session', False)
		currentpage = filter_json.get('currentpage', False)
		search = filter_json.get('search', False)

		if currentpage:
			page = currentpage
		
		if filters_json:
			for fj in filters_json:
				if fj[0] == 'register_number':
					register_number_search = True
					
				if fj[0] == 'invoice_date' and fj[1] == '=':
					invoice_filters.append(['invoice_date', 'between', [fj[2] + ' 00:00:00', fj[2] + ' 23:59:59']])
				elif fj[0] not in ['remaining', 'deposit']:
					invoice_filters.append(fj)
				else:
					odd_filters.append(fj)
					# paid_search = frappe.get_list('VetCustomerInvoicePay', filters={'sum(jumlah) as paid': ['>', 100000]}, fields=['sum(jumlah) as paid', 'parent'], group_by='parent')

					# if fj[1] == 'Equal':
					# 	fj[1] = '=='
					# elif fj[1] == 'Not Equal':
					# 	fj[1] = '!='

					# paid_search = frappe.db.sql("""
					# 					SELECT
					# 						SUM(jumlah) AS paid, parent, parent.total
					# 					FROM `tabVetCustomerInvoicePay`
					# 					GROUP BY parent
					# 					HAVING SUM(jumlah) {} {}
					# 				""".format(fj[1], fj[2]), as_dict=1)
					# print('paid_search')
					# print(paid_search)

		if search:
			invoice_or_filters.append({'name': ['like', '%'+search+'%']})
			invoice_or_filters.append({'owner_name': ['like', '%'+search+'%']})
			invoice_or_filters.append({'pet_name': ['like', '%'+search+'%']})
			invoice_or_filters.append({'user_name': ['like', '%'+search+'%']})
			invoice_or_filters.append({'total': ['like', '%'+search+'%']})
			# invoice_or_filters.append({'remaining': ['like', '%'+search+'%']})
			invoice_or_filters.append({'status': ['like', '%'+search+'%']})
		
		if not register_number_search:
			invoice_filters.append(('parent_customer_invoice', '=', ''))
		
		if sort:
			sorts = sort.split(',')
			for i,s in enumerate(sorts):
				if 'deposit' in s or 'remaining' in s:
					sorts.pop(i)
			default_sort = ','.join(sorts)
			
		if pet:
			invoice_filters.append(('pet', '=', pet))
			invoice_filters.append(('status',  'in', ['Paid', 'Done']))
			
		if petOwner:
			invoice_filters.append(('owner', '=', petOwner))
			invoice_filters.append(('status',  'in', ['Paid', 'Done']))
			
		if session:
			# session_open = frappe.db.get_value('VetPosSessions', session, 'opening_session')
			# session_close = frappe.db.get_value('VetPosSessions', session, 'closing_session')
			# if not session_close:
			# 	session_close = dt.now().strftime('%Y-%m-%d %H:%M:%S')
			# invoice_filters.append(['creation', 'between', [session_open, session_close]])
			invoice_filters.append(('pos_session', '=', session))
			
	# print(invoice_filters)
	
	try:
		invoice = frappe.get_list("VetCustomerInvoice", or_filters=invoice_or_filters, filters=invoice_filters, fields=["*"], order_by=default_sort, start=(page - 1) * 10, page_length= 10)
		datalength = len(frappe.get_all("VetCustomerInvoice", or_filters=invoice_or_filters, filters=invoice_filters, as_list=True))
		# print(frappe.get_all("VetCustomerInvoice", filters=invoice_filters, as_list=True))
		for i in range(len(invoice)):
			pet_owner = frappe.get_list("VetPetOwner", filters={'name': invoice[i]['owner']}, fields=["owner_name"])
			pet = frappe.get_list('VetPet', filters={'name': invoice[i]['pet']}, fields=['pet_name'])
			if len(pet) > 0:
				invoice[i]['owner_name'] = pet_owner[0]['owner_name']
				invoice[i]['pet_name'] = pet[0]['pet_name']
			else:
				invoice[i]['owner_name'] = ''
				invoice[i]['pet_name'] = invoice[i]['pet']
			customer_invoice_children = frappe.get_list('VetCustomerInvoiceChildren', filters={'parent': invoice[i]['name']}, fields=['customer_invoice'])
			if len(customer_invoice_children) > 0:
				customer_invoice_name = list(c.customer_invoice for c in customer_invoice_children)
				all_total = frappe.get_list('VetCustomerInvoice', filters={'name': ['in', customer_invoice_name]}, fields=['sum(total) as all_total'])
				
				paid_search = frappe.get_list('VetCustomerInvoicePay', filters={'parent': ['in', customer_invoice_name]}, fields=['sum(jumlah) as paid'])
				if paid_search[0]['paid'] != None:
					invoice[i]['all_total'] = all_total[0].all_total
					invoice[i]['remaining'] = all_total[0].all_total - paid_search[0]['paid']
					invoice[i]['paid'] = paid_search[0]['paid']
				else:
					invoice[i]['all_total'] = all_total[0].all_total
					invoice[i]['remaining'] = all_total[0].all_total
					invoice[i]['paid'] = 0
			else:
				paid_search = frappe.get_list('VetCustomerInvoicePay', filters={'parent': invoice[i].name}, fields=['sum(jumlah) as paid'])
				if paid_search[0]['paid'] != None:
					invoice[i]['remaining'] = invoice[i].total - paid_search[0]['paid']
					invoice[i]['paid'] = paid_search[0]['paid']
				else:
					invoice[i]['remaining'] = invoice[i].total
					invoice[i]['paid'] = 0
				
			last_credit = frappe.get_list('VetOwnerCredit', filters={'pet_owner': invoice[i]['owner']}, fields=['credit', 'debt'], order_by="creation desc")
			# print(last_credit)
			if last_credit:
				invoice[i]['credit'] = last_credit[0]['credit']
				invoice[i]['debt'] = last_credit[0]['debt']
			else:
				invoice[i]['credit'] = 0
				invoice[i]['debt'] = 0
			if invoice[i].is_rawat_inap:
				all_remaining = frappe.get_list('VetCustomerInvoice', filters={'status': 'Draft', 'is_rawat_inap': 1, 'owner': invoice[i].owner}, fields=['sum(total) as all_remaining'])
				if len(all_remaining) > 0:
					invoice[i]['all_remaining'] = all_remaining[0].all_remaining
		
		for fj in odd_filters:
			result_filter = process_odd_filter(fj)
			invoice = filter(result_filter, invoice)
		
		return {'customer_invoice': invoice, 'datalength': datalength}
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_name_list(filters=None):
	invoice_filters = []
	invoice_or_filters = []
	odd_filters = []
	filter_json = False
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
	
	if filter_json:
		register_number_search = False
		filters_json = filter_json.get('filters', False)
		pet = filter_json.get('pet', False)
		petOwner = filter_json.get('petOwner', False)
		session = filter_json.get('session', False)
		search = filter_json.get('search', False)
		
		if filters_json:
			for fj in filters_json:
				if fj[0] == 'register_number':
					register_number_search = True
					
				if fj[0] == 'invoice_date' and fj[1] == '=':
					invoice_filters.append(['invoice_date', 'between', [fj[2] + ' 00:00:00', fj[2] + ' 23:59:59']])
				elif fj[0] not in ['remaining', 'deposit']:
					invoice_filters.append(fj)
				else:
					odd_filters.append(fj)
		
		if not register_number_search:
			invoice_filters.append(('parent_customer_invoice', '=', ''))
			
		if pet:
			invoice_filters.append(('pet', '=', pet))
			invoice_filters.append(('status',  'in', ['Paid', 'Done']))
			
		if petOwner:
			invoice_filters.append(('owner', '=', petOwner))
			invoice_filters.append(('status',  'in', ['Paid', 'Done']))
			
		if session:
			# session_open = frappe.db.get_value('VetPosSessions', session, 'opening_session')
			# session_close = frappe.db.get_value('VetPosSessions', session, 'closing_session')
			# if not session_close:
			# 	session_close = dt.now().strftime('%Y-%m-%d %H:%M:%S')
			# invoice_filters.append(['creation', 'between', [session_open, session_close]])
			invoice_filters.append(('pos_session', '=', session))

		if search:
			invoice_or_filters.append({'name': ['like', '%'+search+'%']})
			invoice_or_filters.append({'owner_name': ['like', '%'+search+'%']})
			invoice_or_filters.append({'pet_name': ['like', '%'+search+'%']})
			invoice_or_filters.append({'user_name': ['like', '%'+search+'%']})
			invoice_or_filters.append({'total': ['like', '%'+search+'%']})
			# invoice_or_filters.append({'remaining': ['like', '%'+search+'%']})
			invoice_or_filters.append({'status': ['like', '%'+search+'%']})
			
	print(invoice_filters)
	
	try:
		namelist = frappe.get_all("VetCustomerInvoice", or_filters=invoice_or_filters, filters=invoice_filters, as_list=True)
		
		return list(map(lambda item: item[0], namelist))
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def delete_customer_invoice(data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal menghapus invoice"}
	
	for d in data_json:
		frappe.delete_doc('VetCustomerInvoice', d)
		frappe.db.commit()
		
	return {'success': True}
	
@frappe.whitelist()
def get_customer_invoice_form(name=False):
	try:
		customer_invoice_names = [name]
		# pet_owner_list = frappe.get_list("VetPetOwner", fields=['*'])
		# pet_list = frappe.get_list("VetPet", fields=['*'])
		# for pet in pet_list:
		# 	owner_name = frappe.db.get_value('VetPetOwner', pet.parent, 'owner_name')
		# 	pet.owner_name = owner_name
		# task_list = frappe.get_list("VetTask", fields=['*'])
		uom_list = frappe.get_list("VetUOM", fields=['*'])
		# product_list = frappe.get_list("VetProduct", fields=['*'])
		# for pl in product_list:
		# 	pl.update({
		# 		'stockable': frappe.db.get_value('VetProductCategory', pl.product_category, 'stockable'),
		# 		'is_operasi': frappe.db.get_value('VetProductCategory', pl.product_category, 'is_operasi'),
		# 	})
		# warehouse_list = frappe.get_list("VetGudang", fields=['*'])
		# # payment_method = frappe.get_list("VetPaymentMethod", fields=['*'])
		# payment_method = frappe.get_list("VetPaymentMethod", filters={'account': ['!=', 'VC-104']}, fields=['*'])
		# payment_method = frappe.get_list("VetPaymentMethod", filters={'account': ['!=', '1-11102']}, fields=['*'])
		pet_owner_list = []
		pet_list = []
		task_list = []
		# uom_list = []
		product_list = []
		warehouse_list = []
		payment_method = []
		user = frappe.get_doc("User", frappe.session.user)
		role = ''
		if len([i for i in user.roles if i.role == 'Staff']) != 0:
			role = 'Staff'
		elif len([i for i in user.roles if i.role == 'System Manager']) != 0:
			role = 'Master'
		current_session_name = None
		current_session = frappe.get_list('VetPosSessions', fields=['name', 'status'], order_by='creation desc', limit=1)
		if len(current_session) > 0:
			current_session_name = current_session[0]
		form_data = {'pet_owner_list': pet_owner_list, 'pet_list': pet_list, 'task_list': task_list, 'uom_list': uom_list, 'product_list': product_list, 'warehouse_list': warehouse_list, 'payment_method_list': payment_method, 'role': role, 'current_session': current_session_name}
		if name:
			customer_invoice = frappe.get_doc("VetCustomerInvoice", name)
			if customer_invoice.register_number:
				reception = frappe.db.get_value('VetTask', customer_invoice.register_number, 'reception')
				service_id = frappe.db.get_value('VetReception', reception, 'service')
				form_data.update({'service': frappe.db.get_value('VetService', service_id, 'service_name')})
			total_credit = 0
			last_credit = frappe.get_list('VetOwnerCredit', filters={'pet_owner': customer_invoice.owner}, fields=['credit'], order_by="creation desc")
			if last_credit:
				total_credit = last_credit[0]['credit']
			version = frappe.get_list('Version', filters={'ref_doctype': "VetCustomerInvoice", 'docname': name}, fields=['*'], order_by="creation desc")
			for v in version:
				data = json.loads(v['data'])
				if data.get('changed', False):
					for c in data.get('changed', False):
						label = frappe.db.get_value('DocField', {'parent': 'VetCustomerInvoice', 'fieldname': c[0]}, 'label')
						c[0] = label
				v['data'] = data
			for ci in customer_invoice.invoice_line:
				if ci.apotik_obat_id:
					if not ci.racikan:
						ci.racikan = frappe.db.get_value('VetApotikProduct', ci.apotik_obat_id, 'racikan')
			
			for cci in customer_invoice.children_customer_invoice:
				children_customer_invoice = frappe.get_doc('VetCustomerInvoice', cci.customer_invoice)
				customer_invoice_names.append(children_customer_invoice.name)
				for ci in children_customer_invoice.invoice_line:
					if ci.apotik_obat_id:
						if not ci.racikan:
							ci.racikan = frappe.db.get_value('VetApotikProduct', ci.apotik_obat_id, 'racikan')
				
				cci.customer_invoice = children_customer_invoice	
			
			total_remaining = 0
			all_remaining = frappe.get_list('VetCustomerInvoice', filters={'status': 'Draft', 'is_rawat_inap': 1, 'owner': customer_invoice.owner}, fields=['sum(total) as all_remaining'])
			if len(all_remaining) > 0:
				total_remaining = all_remaining[0].all_remaining
			
			links = []
			services = []
			for cn in customer_invoice_names:
				register_number = frappe.db.get_value('VetCustomerInvoice', cn, 'register_number')
				
				apotik = frappe.get_list('VetApotik', filters={'register_number': register_number}, fields=['name'])
				instalasi_medis = frappe.get_list('VetInstalasiMedis', filters={'register_number': register_number}, fields=['name'])
				rawat_inap = frappe.get_list('VetRawatInap', filters={'register_number': register_number}, fields=['name'])
				grooming = frappe.get_list('VetGrooming', filters={'register_number': register_number}, fields=['name'])
				dokter = frappe.get_list('VetTindakanDokter', filters={'register_number': register_number}, fields=['name'])
				links.append({
					'name': cn,
					'links': {'apotik': list(a.name for a in apotik), 'instalasi_medis': list(i.name for i in instalasi_medis), 'rawat_inap': list(r.name for r in rawat_inap), 'grooming': list(g.name for g in grooming), 'dokter': list(d.name for d in dokter)}
				})
				reception = frappe.db.get_value('VetTask', register_number, 'reception')
				service_id = frappe.db.get_value('VetReception', reception, 'service')
				service_name = frappe.db.get_value('VetService', service_id, 'service_name')
				services.append({'name': cn, 'service': service_name})
			
			form_data.update({'customer_invoice': customer_invoice, 'total_credit': total_credit, 'total_remaining': total_remaining, 'version': version, 'links': links, 'services': services})
			
		return form_data
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_customer_invoice_form_after_loading():
	try:
		pet_owner_list = frappe.get_list("VetPetOwner", fields=['*'])
		pet_list = frappe.get_list("VetPet", fields=['*'])
		for pet in pet_list:
			owner_name = frappe.db.get_value('VetPetOwner', pet.parent, 'owner_name')
			pet.owner_name = owner_name
		task_list = frappe.get_list("VetTask", fields=['*'])
		# uom_list = frappe.get_list("VetUOM", fields=['*'])
		product_list = frappe.get_list("VetProduct", fields=['*'])
		for pl in product_list:
			pl.update({
				'stockable': frappe.db.get_value('VetProductCategory', pl.product_category, 'stockable'),
				'is_operasi': frappe.db.get_value('VetProductCategory', pl.product_category, 'is_operasi'),
			})
		warehouse_list = frappe.get_list("VetGudang", fields=['*'])
		payment_method = frappe.get_list("VetPaymentMethod", fields=['*'])
		# payment_method = frappe.get_list("VetPaymentMethod", filters={'account': ['!=', 'VC-104']}, fields=['*'])
			
		return {'pet_owner_list': pet_owner_list, 'pet_list': pet_list, 'task_list': task_list, 'product_list': product_list, 'warehouse_list': warehouse_list, 'payment_method_list': payment_method}
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def add_payment_multiple(data):
	try:
		results = []
		data_json = json.loads(data)
		invoices = frappe.db.get_list('VetCustomerInvoice', filters={'name': ['in', data_json.get('name')]}, fields=['name', 'total'])
		jumlah = data_json.get('jumlah')
		for index,item in enumerate(invoices):
			if jumlah > 0:
				paid = 0
				paid_search = frappe.get_list('VetCustomerInvoicePay', filters={'parent': item.name}, fields=['sum(jumlah) as paid'])
				if paid_search[0]['paid'] != None:
					paid = paid_search[0]['paid']
				remaining = item.total - paid
				if 'Deposit' in data_json.get('payment_method'):
					invoice_jumlah = jumlah if remaining >= jumlah else remaining
				else:
					invoice_jumlah = jumlah if remaining >= jumlah or len(invoices)-1 == index else remaining
				payment_data = {
					'name': item.name,
					'jumlah': invoice_jumlah,
					'payment_method': data_json.get('payment_method')
				}
				
				result = add_payment(json.dumps(payment_data))
				results.append(result)
				jumlah -= invoice_jumlah
				
		invoices = frappe.db.get_list('VetCustomerInvoice', filters={'name': ['in', data_json.get('name')]}, fields=['status', 'parent_customer_invoice'])
		if all(i.status == 'Done' for i in invoices):
			set_parent_invoice_status(invoices[0].parent_customer_invoice, 'Done')
				
		return results
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def add_payment(data):
	try:
		tz = pytz.timezone("Asia/Jakarta")
		pos_session = False
		data_json = json.loads(data)
		
		session_search = frappe.get_list('VetPosSessions', filters={'status': 'In Progress'}, fields=['name'])
		if len(session_search) < 1:
			return {'error': "Belum ada POS Session yang dibuka, bukan POS Session terlebih dahulu"}
		else:
			pos_session = session_search[0].name
		
		
		if data_json.get('jumlah') :
			invoice = frappe.get_doc('VetCustomerInvoice', data_json.get('name'))
			line_data = {}
			line_data.update({'parent': invoice.name, 'parenttype': 'VetCustomerInvoice', 'parentfield': 'pembayaran', 'pos_session': pos_session})
			
			tanggal = dt.strftime(dt.now(tz), "%Y-%m-%d %H:%M:%S")
			
			pay = frappe.new_doc("VetCustomerInvoicePay")
			pay.jumlah = float(data_json.get('jumlah'))
			pay.tanggal = tanggal
			pay.metode_pembayaran = data_json.get('payment_method')
			pay.update(line_data)
			pay.insert()
			
			frappe.db.commit()
			
			invoice.pembayaran.append(pay)
			
			paid = 0
			paid_search = frappe.get_list('VetCustomerInvoicePay', filters={'parent': invoice.name}, fields=['sum(jumlah) as paid'])
			if paid_search[0]['paid'] != None:
				paid = paid_search[0]['paid']
			
			if invoice.status == 'Open' and paid >= invoice.total:
				invoice.status = 'Done'
				if paid > invoice.total:
					exchange = paid - invoice.total
					# create_sales_exchange_journal(invoice.name, exchange, data_json.get('payment_method'))
					pay.exchange = exchange
					pay.save()
					frappe.db.commit()
				# deliver_to_customer(invoice.name)
			invoice.save()
			frappe.db.commit()
			
			create_sales_payment_journal_items(invoice.name, float(data_json.get('jumlah')), False, data_json.get('deposit', 0), data_json.get('payment_method'))
			invoice.reload()
			
			search_active_session = frappe.get_list('VetPosSessions', filters={'status': 'In Progress'}, fields=['name'])
			if search_active_session :
				session = frappe.get_doc('VetPosSessions', search_active_session[0]['name'])
				total_kas_masuk = sum([i.jumlah for i in session.kas_masuk])
				total_kas_keluar = sum([q.jumlah for q in session.kas_keluar])
				session.transaction += float(data_json.get('jumlah'))
				session.current_balance = session.transaction + session.opening_balance + total_kas_masuk - total_kas_keluar
				session.difference = session.current_balance - session.closing_balance
				session.save()
				frappe.db.commit()
			
			if not data_json.get('from_owner_credit'):
				owner_credit = frappe.new_doc('VetOwnerCredit')
				owner_credit.update({
					'date': tanggal,
					'register_number': invoice.register_number,
					'invoice': invoice.name,
					'type': 'Payment',
					'nominal': float(data_json.get('jumlah')),
					'metode_pembayaran': data_json.get('payment_method')
				})
				owner_credit.insert()
				frappe.db.commit()
				set_owner_credit_total(invoice.owner)
					
			# if paid > invoice.total:
			# 	exchange = paid - invoice.total
			# 	create_sales_exchange_journal(invoice.name, exchange, data_json.get('payment_method'))
			# 	pay.exchange = exchange
			# 	pay.save()
			# 	frappe.db.commit()
			if paid == invoice.total:
				invoice.no_exchange = 1
				invoice.save()
				frappe.db.commit()
				
			return invoice

	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def deliver_to_customer(name, refund=False, refund_from=False):
	try:
		customer_invoice = frappe.get_doc("VetCustomerInvoice", name)
		gudang = frappe.get_list("VetGudang", fields=["name"])
		customer_invoice_lines = frappe.get_list("VetCustomerInvoiceLine", filters={'parent': name}, fields=['*'])
		if refund and customer_invoice.is_refund == 1:
			date = customer_invoice.refund_date.strftime("%Y-%m-%d")
		else:
			date = customer_invoice.invoice_date.strftime("%Y-%m-%d")
		
		# if not all(check_product_account(c.product) for c in customer_invoice_lines):
		# 	frappe.msgprint('Tidak Bisa mengirim sales karena kategori barang belum memiliki Stock Input Account, Stock Output Account, dan Stock Income Account')
		# 	return False
		# check_sales_journal()
		
		move_list = []
		for line in customer_invoice_lines:
			product_category = frappe.db.get_value('VetProduct', line.product, 'product_category')
			stockable = frappe.db.get_value('VetProductCategory', product_category, 'stockable')
			
			if not line.warehouse and stockable == 1:
				line.update({'warehouse': gudang[0].name})
			
			if stockable == 1:
				move_data = {
					'product': line.product,
					'product_uom': line.product_uom,
					'quantity': line.quantity,
					'date': date,
					'warehouse': line.warehouse,
				}
				
				if move_list:
					berhasil = False
					for mv in move_list:
						if mv[0].get('warehouse') == move_data.get('warehouse'):
							mv.append(move_data)
							berhasil = True
					if not berhasil:
						move_list.append([move_data])
				else:
					move_list.append([move_data])
				
		operation_list = []
		for mv in move_list:
			if refund:
				operation_data = {
					'reference': customer_invoice.name,
					'source': customer_invoice.name,
					'to': mv[0].get('warehouse'),
					'status': 'Delivery',
					'date': date,
					'moves': mv,
				}
			else:
				operation_data = {
					'reference': customer_invoice.name,
					'source': customer_invoice.name,
					'from': mv[0].get('warehouse'),
					'status': 'Delivery',
					'date': date,
					'moves': mv,
				}
			
			operation = frappe.new_doc('VetOperation')
			operation.update(operation_data)
			operation.insert()
			operation_list.append(operation)
			
		for operation in operation_list:
			moves = frappe.get_list('VetOperationMove', filters={'parent': operation.name}, fields=['name', 'product', 'product_uom', 'quantity', 'quantity_done'])
			for m in moves:
				m.quantity_done = m.quantity
				
			action_receive(operation.name, json.dumps(moves))
			
			for m in moves:
				if refund:
					increase_product_valuation(name, m.product, m.quantity, m.product_uom, refund_from)
				else:
					decrease_product_valuation(m.product, m.quantity, m.product_uom, refund)
		
		# date = customer_invoice.invoice_date.strftime("%Y-%m-%d")
		
		# operation_data = {
		# 	'reference': customer_invoice.name,
		# 	'source': customer_invoice.name,
		# 	'from': gudang[0].name,
		# 	'status': 'Delivery',
		# 	'date': date,
		# }
		
		# operation = frappe.new_doc('VetOperation')
		# operation.update(operation_data)
		# operation.insert()
		
		# for line in customer_invoice_lines:
		# 	new_move = frappe.new_doc("VetOperationMove")
		# 	new_move.update({
		# 		'parent': operation.name,
		# 		'parenttype': 'VetOperation',
		# 		'parentfield': 'moves',
		# 		'product': line.product,
		# 		'product_uom': line.product_uom,
		# 		'quantity': line.quantity,
		# 		'date': date,
		# 	})

		# 	operation.moves.append(new_move)
		# 	operation.save()
			
		# moves = frappe.get_list('VetOperationMove', filters={'parent': operation.name}, fields=['name', 'product', 'product_uom', 'quantity', 'quantity_done'])
		# for m in moves:
		# 	m.quantity_done = m.quantity
			
		# action_receive(operation.name, json.dumps(moves))
		
		# for m in moves:
		# 	decrease_product_valuation(m.product, m.quantity, m.product_uom)

	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def edit_payment(name, method):
	try:
		owner_credit_name = False
		payment = frappe.get_doc('VetCustomerInvoicePay', name)
		old_payment_method = payment.metode_pembayaran
		current_session = frappe.get_list('VetPosSessions', fields=['name', 'status'], order_by='creation desc', limit=1)
		if len(current_session) > 0:
			if payment.pos_session != current_session[0].name or current_session[0].status != 'In Progress':
				return {'error': 'POS Session telah berubah status', 'current_session': current_session[0]}
		
		if payment.get('owner_credit', False):
			owner_credit_name = payment.owner_credit
		else:
			pet_owner = frappe.db.get_value('VetCustomerInvoice', payment.parent, 'owner')
			owner_credit = frappe.get_list('VetOwnerCredit', filters={'nominal': payment.jumlah, 'metode_pembayaran': payment.metode_pembayaran, 'pet_owner': pet_owner, 'invoice': payment.parent}, fields=['name'])
			if len(owner_credit) > 0:
				owner_credit_name = owner_credit[0].name
			
		payment.metode_pembayaran = method
		payment.save()
		
		edit_payment_journal_entry(payment.parent, payment.jumlah, old_payment_method, method)
		
		if owner_credit_name:
			owner_credit = frappe.get_doc('VetOwnerCredit', owner_credit_name)
			owner_credit.metode_pembayaran = method
			owner_credit.save()
		return {'success': True}
	except:
		return {'error': 'Gagal mengubah payment'}
		
def edit_payment_journal_entry(customer_invoice, amount, old_payment_method, new_payment_method):
	old_payment_method_account = frappe.db.get_value('VetPaymentMethod', {'method_name': old_payment_method}, 'account')
	new_payment_method_account =  frappe.db.get_value('VetPaymentMethod', {'method_name': new_payment_method}, 'account')
	journal_entry_search = frappe.get_list('VetJournalEntry', filters={'reference': customer_invoice}, fields=['name'])
	journal_item_name = False
	for je in journal_entry_search:
		journal_item_search = frappe.get_list('VetJournalItem', filters={'parent': je.name, 'account': old_payment_method_account, 'debit': amount}, fields=['name'])
		if len(journal_item_search) > 0:
			journal_item_name = journal_item_search[0].name
	journal_item = frappe.get_doc('VetJournalItem', journal_item_name)
	journal_item.update({
		'account': new_payment_method_account
	})
	journal_item.save()
	frappe.db.commit()
	old_last_ji = frappe.get_list('VetJournalItem', filters={'account': old_payment_method_account}, fields=['name'], order_by='creation desc')
	set_journal_item_total(old_last_ji[0].name, old_payment_method_account)
	set_journal_item_total(journal_item.name, new_payment_method_account)

@frappe.whitelist()
def decrease_product_valuation(product, quantity, uom=False, reverse=False):
	adjustment_value = 0
	
	product_uom = uom
	if not product_uom:
		product_uom = frappe.db.get_value('VetProduct', 'product_uom')
		
	purchase_with_stock_search = frappe.get_list('VetPurchaseProducts', filters={'product': product}, fields=['*'], order_by="creation asc")
	purchase_with_stock = list(p for p in purchase_with_stock_search if p.quantity_stocked)
	if len(purchase_with_stock):
		
		current_quantity = float(quantity)
		current_uom = product_uom
		
		for pws in purchase_with_stock:
			if current_quantity != 0:
				purchase_product = frappe.get_doc('VetPurchaseProducts', pws.name)
				
				if(purchase_product.uom != current_uom):
					ratio = frappe.db.get_value('VetUOM', current_uom, 'ratio')
					target_ratio = frappe.db.get_value('VetUOM', purchase_product.uom, 'ratio')
					current_quantity = current_quantity * (float(ratio or 1)/float(target_ratio or 1))
					current_uom = purchase_product.uom
				
				if not reverse:
					if current_quantity >= purchase_product.quantity_stocked:
						current_quantity = float(current_quantity) - purchase_product.quantity_stocked
						adjustment_value += purchase_product.quantity_stocked * purchase_product.price
						purchase_product.quantity_stocked = 0
						purchase_product.save()
						frappe.db.commit()
					else:
						adjustment_value += float(current_quantity) * purchase_product.price
						purchase_product.quantity_stocked = purchase_product.quantity_stocked - float(current_quantity)
						current_quantity = 0
						purchase_product.save()
						frappe.db.commit()
				else:
					adjustment_value += float(current_quantity) * purchase_product.price
					purchase_product.quantity_stocked = purchase_product.quantity_stocked + float(current_quantity)
					current_quantity = 0
					purchase_product.save()
					frappe.db.commit()
					
	return adjustment_value

@frappe.whitelist()
def increase_product_valuation(invoice_name, product, quantity, uom=False, refund_from=False):
	adjustment_value = 0
	line = []
	
	product_uom = uom
	if not product_uom:
		product_uom = frappe.db.get_value('VetProduct', 'product_uom')

	if refund_from:
		line = frappe.get_list('VetCustomerInvoiceLine', filters={'parent': refund_from, 'product': product}, fields=['*'])
	else:
		line = frappe.get_list('VetCustomerInvoiceLine', filters={'parent': invoice_name, 'product': product}, fields=['*'])

	if line:
		purchase_products = frappe.get_list('VetCustomerInvoicePurchaseProducts', filters={'invoice_line_name': line[0]['name']}, fields=['*'], order_by="name desc")
		
		current_quantity = float(quantity)
		current_uom = product_uom
		
		for pws in purchase_products:
			if current_quantity != 0:
				purchase_product = frappe.get_doc('VetPurchaseProducts', pws.purchase_products_name)
				
				if(purchase_product.uom != current_uom):
					ratio = frappe.db.get_value('VetUOM', current_uom, 'ratio')
					target_ratio = frappe.db.get_value('VetUOM', purchase_product.uom, 'ratio')
					current_quantity = current_quantity * (float(ratio or 1)/float(target_ratio or 1))
					current_uom = purchase_product.uom

				if float(current_quantity) >= pws.quantity:
					adjustment_value += pws.quantity * purchase_product.price
					purchase_product.quantity_stocked = purchase_product.quantity_stocked + pws.quantity
					current_quantity = float(current_quantity) - pws.quantity
					purchase_product.save()
					frappe.db.commit()
				else:
					adjustment_value += float(current_quantity) * purchase_product.price
					purchase_product.quantity_stocked = purchase_product.quantity_stocked + float(current_quantity)
					current_quantity = 0
					purchase_product.save()
					frappe.db.commit()
					
	return adjustment_value
	
@frappe.whitelist()
def refund_invoice(name):
	try:
		tz = pytz.timezone("Asia/Jakarta")
		old_invoice = frappe.get_doc('VetCustomerInvoice', name)
		old_invoice.already_refund = True
		old_invoice.save()
		invoice = frappe.new_doc('VetCustomerInvoice')
		invoice.update({
			'refund_date': dt.now(tz).strftime('%Y-%m-%d %H:%M:%S'),
			'register_number': old_invoice.register_number,
			'pet': old_invoice.pet,
			'user': old_invoice.user,
			'origin': old_invoice.name,
			'subtotal': old_invoice.subtotal,
			'total': old_invoice.total,
			'status': 'Draft',
			'invoice_line': old_invoice.invoice_line,
			'is_refund': True,
			'refund_from': old_invoice.name
		})
		invoice.insert()
		frappe.db.commit()
				
		return {'invoice': invoice}

	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def submit_refund(data):
	try:
		tz = pytz.timezone("Asia/Jakarta")
		data_json = json.loads(data)
		
		if data_json.get('refund') :
			invoice = frappe.get_doc('VetCustomerInvoice', data_json.get('name'))
			
			for t in data_json.get('invoice_line'):
				if t.get('is_delete', False):
					frappe.delete_doc('VetCustomerInvoiceLine', t.get('name'))
				else:
					invoice_line = frappe.get_doc('VetCustomerInvoiceLine', t.get('name'))
					invoice_line.quantity = t.get('quantity')
					invoice_line.save()
					frappe.db.commit()
			invoice.reload()
			invoice.subtotal = sum(i.unit_price * math.ceil(i.quantity) - ((i.discount or 0) / 100 * (i.unit_price * math.ceil(i.quantity))) for i in invoice.invoice_line)
			# invoice.subtotal = sum(i.unit_price * i.quantity - ((i.discount or 0) / 100 * (i.unit_price * i.quantity)) for i in invoice.invoice_line)
			invoice.total = invoice.subtotal - (float(invoice.potongan) or 0)
			invoice.save()
			pay = frappe.new_doc("VetCustomerInvoicePay")
			pay.update({
				'jumlah': data_json.get('refund'),
				'tanggal': dt.strftime(dt.now(tz), "%Y-%m-%d"),
				'metode_pembayaran': data_json.get('payment_method'),
				'parent': invoice.name,
				'parenttype': 'VetCustomerInvoice',
				'parentfield': 'pembayaran'
			})
			pay.insert()
			invoice.pembayaran.append(pay)
			invoice.save()
			frappe.db.commit()
			
			create_sales_payment_journal_items(invoice.name, data_json.get('refund'), True, 0, data_json.get('payment_method'), invoice.refund_from)
			paid_search = frappe.get_list('VetCustomerInvoicePay', filters={'parent': invoice.name}, fields=['sum(jumlah) as paid'])
			if len(paid_search) != 0:
				paid = paid_search[0].paid
			
			if paid >= invoice.total:
				invoice.status = 'Refund'
				invoice.save()
				deliver_to_customer(invoice.name, True, invoice.refund_from)
				
			pay.reload()
			
			search_active_session = frappe.get_list('VetPosSessions', filters={'status': 'In Progress'}, fields=['name'])
			if search_active_session :
				session = frappe.get_doc('VetPosSessions', search_active_session[0]['name'])
				total_kas_masuk = sum([i.jumlah for i in session.kas_masuk])
				total_kas_keluar = sum([q.jumlah for q in session.kas_keluar])
				session.transaction -= float(pay.jumlah)
				session.current_balance = session.transaction + session.opening_balance + total_kas_masuk - total_kas_keluar
				session.difference = session.current_balance - session.closing_balance
				session.save()
				frappe.db.commit()
			
			owner_credit = frappe.new_doc('VetOwnerCredit')
			owner_credit.update({
				'date': dt.strftime(dt.now(tz), "%Y-%m-%d %H:%M:%S"),
				'register_number': invoice.register_number,
				'invoice': invoice.name,
				'type': 'Refund',
				'nominal': pay.jumlah,
				'metode_pembayaran': data_json.get('payment_method')
			})
			owner_credit.insert()
			frappe.db.commit()
			set_owner_credit_total(invoice.owner)
			# pay.update()
				
		return {'invoice': invoice}

	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def cancel_refund(name):
	try:
		invoice = frappe.get_doc('VetCustomerInvoice', name)
		invoice.status = 'Cancel'
		invoice.save()
		invoice.reload()
		old_invoice = frappe.get_doc('VetCustomerInvoice', invoice.origin)
		old_invoice.already_refund = False
		old_invoice.save()
		frappe.db.commit()
		
		return {'success': True}
		
	except PermissionError as  e:
		return {'error': e}

@frappe.whitelist()
def cancel_invoice_multiple(names):
	try:
		results = []
		names_json = json.loads(names)
		for name in names_json:
			result = cancel_invoice(name)
			results.append(result)
			
		invoices = frappe.db.get_list('VetCustomerInvoice', filters={'name': ['in', names_json]}, fields=['status', 'parent_customer_invoice'])
		if all(i.status == 'Cancel' for i in invoices):
			set_parent_invoice_status(invoices[0].parent_customer_invoice, 'Cancel')
		return results
		
	except PermissionError as  e:
		return {'error': e}

@frappe.whitelist()
def cancel_invoice(name):
	try:
		tz = pytz.timezone("Asia/Jakarta")
		invoice = frappe.get_doc('VetCustomerInvoice', name)
		invoice.status = 'Cancel'
		invoice.save()
		create_sales_journal_entry(invoice.name, True)
		invoice.reload()
		deliver_to_customer(invoice.name, True)
		owner_credit = frappe.new_doc('VetOwnerCredit')
		owner_credit.update({
			'date': dt.strftime(dt.now(tz), "%Y-%m-%d %H:%M:%S"),
			'register_number': invoice.register_number,
			'invoice': invoice.name,
			'type': 'Cancel',
			'nominal': invoice.total
		})
		owner_credit.insert()
		frappe.db.commit()
		set_owner_credit_total(invoice.owner)
		
		return {'success': True}
		
	except PermissionError as  e:
		return {'error': e}
					
def check_sales_journal():
	sales_journal = frappe.db.get_value('VetJournal', {'journal_name': 'Sales Journal', 'type': 'Sale'}, 'name')
	if not sales_journal:
		frappe.msgprint('Journal "Sales Journal" tidak ada')
		return False
	else:
		journal_debit = frappe.db.get_value('VetJournal', {'journal_name': 'Sales Journal', 'type': 'Sale'}, 'default_debit_account')
		journal_credit = frappe.db.get_value('VetJournal', {'journal_name': 'Sales Journal', 'type': 'Sale'}, 'default_credit_account')
		if not all([journal_credit, journal_debit]):
			frappe.msgprint('Sales Journal tidak memiliki debit account & credit account')
			return False
			
def check_product_account(product_name):
	product = frappe.get_doc('VetProduct', product_name)
	product_category = frappe.get_doc('VetProductCategory', product.product_category)
	if product_category.income_account:
		if product_category.stockable:
			if product_category.stock_input_account and product_category.stock_output_account:
				return True
			else:
				return False
		else:
			return True
	else:
		return False
		
		
def create_sales_journal_entry(invoice_name, refund=False):
	tz = pytz.timezone("Asia/Jakarta")
	invoice = frappe.get_doc('VetCustomerInvoice', invoice_name)
	sales_journal = frappe.db.get_value('VetJournal', {'journal_name': 'Sales Journal', 'type': 'Sale'}, 'name')
	journal_debit = frappe.db.get_value('VetJournal', {'journal_name': 'Sales Journal', 'type': 'Sale'}, 'default_debit_account')
	journal_credit = frappe.db.get_value('VetJournal', {'journal_name': 'Sales Journal', 'type': 'Sale'}, 'default_credit_account')
	products = frappe.get_list('VetCustomerInvoiceLine', filters={'parent': invoice_name}, fields=['*'])
	potongan_account = frappe.db.get_value('VetCoa', {'account_code': '4-90001'}, 'name')
	product_discount_account = frappe.db.get_value('VetCoa', {'account_code': '6-10002'}, 'name')
	jis = []
	total = 0
	total_discount = 0
	for pp in products:
		product = frappe.get_doc('VetProduct', pp.product)
		product_category = frappe.get_doc('VetProductCategory', product.product_category)
		amount = pp.total
		amount_no_discount = math.ceil(pp.quantity) * pp.unit_price
		amount_discount = amount_no_discount*(pp.discount/100)
		total += amount
		total_discount += amount_discount
		same_income_ji = next((ji for ji in jis if ji.get('account') == product_category.income_account), False)
		if same_income_ji:
			if refund:
				same_income_ji.update({
					'debit': same_income_ji.get('debit') + amount_no_discount,
				})
			else:
				same_income_ji.update({
					'credit': same_income_ji.get('credit') + amount_no_discount,
				})
		else:
			if refund:
				jis.append({
					'account': product_category.income_account,
					'debit': amount_no_discount,
				})
			else:	
				jis.append({
					'account': product_category.income_account,
					'credit': amount_no_discount,
				})
		if product_category.stockable:
			invoice_line = frappe.get_doc('VetCustomerInvoiceLine', pp.name)
			amount = 0
			current_quantity = pp.quantity
			if refund:
				purchase_products = frappe.get_list('VetCustomerInvoicePurchaseProducts', filters={'invoice_line_name': invoice_line.name}, fields=['*'], order_by="name desc")
				for pws in purchase_products:
					if current_quantity != 0:
						purchase_product = frappe.get_doc('VetPurchaseProducts', pws.purchase_products_name)
						
						if (purchase_product.uom != pp.product_uom) :
							ratio = frappe.db.get_value('VetUOM', pp.product_uom, 'ratio')
							target_ratio = frappe.db.get_value('VetUOM', purchase_product.uom, 'ratio')
							current_quantity = current_quantity * (float(ratio or 1)/float(target_ratio or 1))
							current_uom = purchase_product.uom
						
						if float(current_quantity) >= pws.quantity:
							current_quantity = float(current_quantity) - pws.quantity
							# amount += purchase_product.price * math.ceil(pws.quantity)
							amount += purchase_product.price * pws.quantity
						else:
							# amount += purchase_product.price * math.ceil(current_quantity)
							amount += purchase_product.price * current_quantity
							current_quantity = 0
			else:
				purchase_with_stock_search = frappe.get_list('VetPurchaseProducts', filters={'product': pp.product}, fields=['*'], order_by="creation asc")
				purchase_with_stock = list(p for p in purchase_with_stock_search if p.quantity_stocked)

				# print('purchase with stock')
				# print(purchase_with_stock)
				
				for pws in purchase_with_stock:
					if current_quantity != 0:
						purchase_product = frappe.get_doc('VetPurchaseProducts', pws.name)
						
						if (purchase_product.uom != pp.product_uom) :
							ratio = frappe.db.get_value('VetUOM', pp.product_uom, 'ratio')
							target_ratio = frappe.db.get_value('VetUOM', purchase_product.uom, 'ratio')
							current_quantity = current_quantity * (float(ratio or 1)/float(target_ratio or 1))
							current_uom = purchase_product.uom

						# print('current qty')
						# print(current_quantity)

						new_invoice_line_purchase = frappe.new_doc("VetCustomerInvoicePurchaseProducts")
						
						if float(current_quantity) > purchase_product.quantity_stocked:
							new_invoice_line_purchase.update({
								'invoice_line_name': invoice_line.name,
								'purchase_products_name': purchase_product.name,
								# 'quantity': math.ceil(purchase_product.quantity_stocked),
								'quantity': purchase_product.quantity_stocked,
							})

							new_invoice_line_purchase.insert()
							frappe.db.commit()

							current_quantity = float(current_quantity) - purchase_product.quantity_stocked
							# amount += purchase_product.price * math.ceil(purchase_product.quantity_stocked)
							amount += purchase_product.price * purchase_product.quantity_stocked
						else:
							new_invoice_line_purchase.update({
								'invoice_line_name': invoice_line.name,
								'purchase_products_name': purchase_product.name,
								# 'quantity': math.ceil(current_quantity),
								'quantity': current_quantity,
							})

							new_invoice_line_purchase.insert()
							frappe.db.commit()

							# amount += purchase_product.price * math.ceil(current_quantity)
							amount += purchase_product.price * current_quantity
							current_quantity = 0

			# print('amount')
			# print(amount)
			
			same_input_ji = next((ji for ji in jis if ji.get('account') == product_category.stock_input_account), False)
			same_output_ji = next((ji for ji in jis if ji.get('account') == product_category.stock_output_account), False)
			if same_input_ji:
				if refund:
					same_input_ji.update({
						'debit': same_input_ji.get('debit') + amount,
					})
				else:
					same_input_ji.update({
						'credit': same_input_ji.get('credit') + amount,
					})
			else:
				if refund:
					jis.append({
						'account': product_category.stock_input_account,
						'debit': amount,
					})
				else:
					jis.append({
						'account': product_category.stock_input_account,
						'credit': amount,
					})
			if same_output_ji:
				if refund:
					same_output_ji.update({
						'credit': same_output_ji.get('credit') + amount,
					})
				else:
					same_output_ji.update({
						'debit': same_output_ji.get('debit') + amount,
					})
			else:
				if refund:
					jis.append({
						'account': product_category.stock_output_account,
						'credit': amount,
					})
				else:
					jis.append({
						'account': product_category.stock_output_account,
						'debit': amount,
					})
	if refund:
		jis.append({
			'account': journal_debit,
			'credit': total - float(invoice.potongan),
		})
	else:
		jis.append({
			'account': journal_debit,
			'debit': total - float(invoice.potongan),
		})
		
	if float(invoice.potongan) > 0:
		jis.append({
			'account': potongan_account,
			'debit': float(invoice.potongan or 0) + total_discount
		})
		
	# if total_discount > 0:
	# 	jis.append({
	# 		'account': product_discount_account,
	# 		'debit': float(total_discount)
	# 	})
		
	je_data = {
		'journal': sales_journal,
		'period': dt.now(tz).strftime('%m/%Y'),
		'date': dt.now(tz).date().strftime('%Y-%m-%d'),
		'reference': invoice.name,
		'journal_items': jis
	}
	
	new_journal_entry(json.dumps(je_data))
	
	
def create_sales_payment_journal_items(invoice_name, amount, refund=False, deposit=0, method=False, refund_from=False):
	tz = pytz.timezone("Asia/Jakarta")
	#create payment choose payment journal
	# sales_journal = frappe.db.get_value('VetJournal', {'journal_name': 'Sales Journal', 'type': 'Sale'}, 'name')
	if check_payment_journal():
		sales_journal = frappe.db.get_value('VetJournal', {'name': 'PAY'}, 'name')
	else:
		sales_journal = create_payment_journal()

	if method: 
		debit_account = frappe.db.get_value('VetPaymentMethod', {'method_name': method}, 'account')
	else:
		debit_account = frappe.db.get_value('VetCoa', {'account_code': '1-11101'}, 'name')

	deposit_account = frappe.db.get_value('VetPaymentMethod', {'method_type': 'Deposit Customer'}, 'account')
	if not deposit_account:
		deposit_account = frappe.db.get_value('VetCoa', {'account_code': '2-16003'}, 'name')

	credit_account = frappe.db.get_value('VetCoa', {'account_code': '1-13001'}, 'name')
	retur_account = frappe.db.get_value('VetCoa', {'account_code': '4-11001'}, 'name')
	if refund:
		jis = [
			{
				'account': debit_account,
				'credit': amount,
			},{
				'account': retur_account,
				'debit': amount,
			}
		]

		if refund_from:
			products = frappe.get_list('VetCustomerInvoiceLine', filters={'parent': invoice_name}, fields=['*'])
			print('products')
			print(products)
			for pp in products:
				product = frappe.get_doc('VetProduct', pp.product)
				product_category = frappe.get_doc('VetProductCategory', product.product_category)
				print('category')
				print(product_category.stockable)
				if product_category.stockable:
					invoice_line = frappe.get_doc('VetCustomerInvoiceLine', pp.name)
					amount = 0
					current_quantity = pp.quantity
					line = frappe.get_list('VetCustomerInvoiceLine', filters={'parent': refund_from, 'product': invoice_line.product}, fields=['*'])
					if line:
						purchase_products = frappe.get_list('VetCustomerInvoicePurchaseProducts', filters={'invoice_line_name': line[0]['name']}, fields=['*'], order_by="name desc")
						print('purchase products')
						print(purchase_products)
						for pws in purchase_products:
							if current_quantity != 0:
								purchase_product = frappe.get_doc('VetPurchaseProducts', pws.purchase_products_name)
								
								if (purchase_product.uom != pp.product_uom) :
									ratio = frappe.db.get_value('VetUOM', pp.product_uom, 'ratio')
									target_ratio = frappe.db.get_value('VetUOM', purchase_product.uom, 'ratio')
									current_quantity = current_quantity * (float(ratio or 1)/float(target_ratio or 1))
									current_uom = purchase_product.uom
								
								if float(current_quantity) >= pws.quantity:
									current_quantity = float(current_quantity) - pws.quantity
									# amount += purchase_product.price * math.ceil(pws.quantity)
									amount += purchase_product.price * pws.quantity
								else:
									# amount += purchase_product.price * math.ceil(current_quantity)
									amount += purchase_product.price * current_quantity
									current_quantity = 0

						same_input_ji = next((ji for ji in jis if ji.get('account') == product_category.stock_input_account), False)
						same_output_ji = next((ji for ji in jis if ji.get('account') == product_category.stock_output_account), False)
						if same_input_ji:
							same_input_ji.update({
								'debit': same_input_ji.get('debit') + amount,
							})
						else:
							jis.append({
								'account': product_category.stock_input_account,
								'debit': amount,
							})
						if same_output_ji:
							same_output_ji.update({
								'credit': same_output_ji.get('credit') + amount,
							})
						else:
							jis.append({
								'account': product_category.stock_output_account,
								'credit': amount,
							})
	else:
		invoice = frappe.get_doc('VetCustomerInvoice', invoice_name)
		paid = sum(i.jumlah for i in invoice.pembayaran)
		jis = []
		
		if deposit != 0:
			jis.append({'account': deposit_account, 'debit': deposit})
		
		if float(paid) - float(invoice.total) > 0:
			# jas = [
			# 	{'account': debit_account, 'debit': amount},
			# 	{'account': credit_account, 'credit': float(invoice.total) - (float(paid) - float(amount))},
			# 	{'account': uang_muka_lain, 'credit': float(paid) - float(invoice.total)}
			# ]
			
			jas = [
				{'account': debit_account, 'debit': float(invoice.total) - (float(paid) - float(amount))},
				{'account': credit_account, 'credit': float(invoice.total) - (float(paid) - float(amount))},
			]
			
			jis.extend(jas)
		else:
			jas = [
				{
					'account': debit_account,
					'debit': amount,
					'credit': 0,
				},
				{
					'account': credit_account,
					'credit': float(amount) + float(deposit),
					'debit': 0,
				}
			]
			jis.extend(jas)
	
	je_data = {
		'journal': sales_journal,
		'period': dt.now(tz).strftime('%m/%Y'),
		'date': dt.now(tz).date().strftime('%Y-%m-%d'),
		'reference': invoice_name,
		'journal_items': jis
	}
	
	new_journal_entry(json.dumps(je_data))
	
@frappe.whitelist()
def create_sales_exchange_journal(invoice_name, amount, method, deposit=False):
	tz = pytz.timezone("Asia/Jakarta")
	invoice = frappe.get_doc('VetCustomerInvoice', invoice_name)
	sales_journal = frappe.db.get_value('VetJournal', {'journal_name': 'Sales Journal', 'type': 'Sale'}, 'name')
	credit_account = frappe.db.get_value('VetPaymentMethod', {'method_name': method}, 'account')
	deposit_account = frappe.db.get_value('VetPaymentMethod', {'method_type': 'Deposit Customer'}, 'account')
	if not deposit_account:
		deposit_account = frappe.db.get_value('VetCoa', {'account_code': '2-16003'}, 'name')
	
	if deposit:
		jis = [
			{
				'account': deposit_account,
				'credit': amount,
				'debit': 0,
			},
			{
				'account': credit_account,
				'credit': 0,
				'debit': amount,
			}
		]
		
		invoice.no_exchange = 1
		invoice.save()
		frappe.db.commit()
		
		owner_credit = frappe.new_doc('VetOwnerCredit')
		owner_credit.update({
			'date': dt.strftime(dt.now(tz), "%Y-%m-%d %H:%M:%S"),
			'register_number': invoice.register_number,
			'invoice': invoice.name,
			'type': 'Payment',
			'nominal': float(amount),
			'metode_pembayaran': method,
			'is_deposit': 1,
		})
		owner_credit.insert()
		frappe.db.commit()
		set_owner_credit_total(invoice.owner)
		
	else:
		jis = [
			{
				'account': deposit_account,
				'debit': amount,
				'credit': 0,
			},
			{
				'account': credit_account,
				'credit': amount,
				'debit': 0,
			}
		]
		
		owner_credit = frappe.new_doc('VetOwnerCredit')
		owner_credit.update({
			'date': dt.strftime(dt.now(tz), "%Y-%m-%d %H:%M:%S"),
			'register_number': invoice.register_number,
			'invoice': invoice.name,
			'type': 'Payment',
			'nominal': -amount,
			'metode_pembayaran': method
		})
		owner_credit.insert()
		frappe.db.commit()
		set_owner_credit_total(invoice.owner)
		
	
	je_data = {
		'journal': sales_journal,
		'period': dt.now(tz).strftime('%m/%Y'),
		'date': dt.now(tz).date().strftime('%Y-%m-%d'),
		'reference': invoice_name,
		'journal_items': jis
	}
	
	new_journal_entry(json.dumps(je_data))
	
	return True
	
	
def add_payment_from_deposit(data):
	tz = pytz.timezone("Asia/Jakarta")
	credit_account = frappe.db.get_value('VetCoa', {'account_code': '1-13001'}, 'name')
	deposit_account = frappe.db.get_value('VetPaymentMethod', {'method_type': 'Deposit Customer'}, 'account')
	if not deposit_account:
		deposit_account = frappe.db.get_value('VetCoa', {'account_code': '2-16003'}, 'name')
	# sales_journal = frappe.db.get_value('VetJournal', {'journal_name': 'Sales Journal', 'type': 'Sale'}, 'name')
	if check_payment_journal():
		sales_journal = frappe.db.get_value('VetJournal', {'name': 'PAY'}, 'name')
	else:
		sales_journal = create_payment_journal()
	
	try:
		pos_session = False
		data_json = json.loads(data)
		
		session_search = frappe.get_list('VetPosSessions', filters={'status': 'In Progress'}, fields=['name'])
		if len(session_search) < 1:
			return {'error': "Belum ada POS Session yang dibuka, bukan POS Session terlebih dahulu"}
		else:
			pos_session = session_search[0].name
		
		if data_json.get('jumlah') :
			invoice = frappe.get_doc('VetCustomerInvoice', data_json.get('name'))
			line_data = {}
			line_data.update({'parent': invoice.name, 'parenttype': 'VetCustomerInvoice', 'parentfield': 'pembayaran', 'pos_session': pos_session})
			
			tanggal = dt.strftime(dt.now(tz), "%Y-%m-%d %H:%M:%S")
			
			pay = frappe.new_doc("VetCustomerInvoicePay")
			pay.jumlah = data_json.get('jumlah')
			pay.tanggal = tanggal
			pay.metode_pembayaran = 'Deposit Customer'
			pay.update(line_data)
			pay.insert()
			
			frappe.db.commit()
			
			invoice.pembayaran.append(pay)
			
			paid = 0
			paid_search = frappe.get_list('VetCustomerInvoicePay', filters={'parent': invoice.name}, fields=['sum(jumlah) as paid'])
			if paid_search[0]['paid'] != None:
				paid = paid_search[0]['paid']
			
			if invoice.status == 'Open' and paid >= invoice.total:
				invoice.status = 'Done'
				invoice.no_exchange = '1'

			invoice.save()
			frappe.db.commit()
			
			jis = [
				{
					'account': deposit_account,
					'debit': data_json.get('jumlah'),
					'credit': 0,
				},
				{
					'account': credit_account,
					'credit': data_json.get('jumlah'),
					'debit': 0,
				}
			]
			
			je_data = {
				'journal': sales_journal,
				'period': dt.now(tz).strftime('%m/%Y'),
				'date': dt.now(tz).date().strftime('%Y-%m-%d'),
				'reference': invoice.name,
				'journal_items': jis
			}
			
			new_journal_entry(json.dumps(je_data))
			
			owner_credit = frappe.new_doc('VetOwnerCredit')
			owner_credit.update({
				'date': dt.strftime(dt.now(tz), "%Y-%m-%d %H:%M:%S"),
				'register_number': invoice.register_number,
				'invoice': invoice.name,
				'type': 'Payment',
				'nominal': data_json.get('jumlah'),
				'metode_pembayaran': 'Deposit Customer'
			})
			owner_credit.insert()
			frappe.db.commit()
			set_owner_credit_total(invoice.owner)
			
			invoice.reload()
				
			return invoice

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
		
		if 'date' in f[0]:
			f[2] = "dt.strptime('%s', '%s')"%(f[2], '%Y-%m-%d')
			
		elif f[1] in ['in', 'not in']:
			f[0] = '%s.lower()'%f[0]
			f[2] = f[2].replace('%',"'").lower()
			fj.reverse()
		elif f[0] not in ['a.remaining', 'a.deposit']:
			f[2] = "'%s'"%f[2]
		elif f[0] == 'a.deposit':
			f[0] = 'a.credit - (a.all_remaining or 0)'
		
		string = " ".join(f)
		# print(string)
		
		return lambda a: eval(string)
	else:
		return lambda a: a[f[0]] > dt.strptime(f[2][0], '%Y-%m-%d') and a[f[0]] < dt.strptime(f[2][1], '%Y-%m-%d')
		
def check_payment_journal():
	payment_journal = frappe.get_list('VetJournal', filters={'name': 'PAY'}, fields=['name'])
	return len(payment_journal) > 0

def create_payment_journal():
	payment_journal = frappe.new_doc('VetJournal')
	payment_journal.update({
		'code': 'PAY',
		'type': 'General',
		'journal_name': 'Payment Journal',
	})
	payment_journal.insert()
	frappe.db.commit()
	
	return payment_journal.name