# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
import pytz
from datetime import datetime as dt
from frappe.model.document import Document
from vet_website.vet_website.doctype.vetjournalentry.vetjournalentry import new_journal_entry
from vet_website.vet_website.doctype.vetpetowner.vetpetowner import set_owner_credit_total
from vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice import deliver_to_customer, add_payment
from vet_website.vet_website.doctype.vetpurchase.vetpurchase import check_paid_purchase

class VetOwnerCredit(Document):
	pass
	
@frappe.whitelist()
def submit_piutang(action, nominal, petOwner, method, tanggal=False):
	try:
		tz = pytz.timezone("Asia/Jakarta")
		if action == 'Buat':
			session_search = frappe.get_list('VetPosSessions', filters={'status': 'In Progress'}, fields=['name'])
			if len(session_search) < 1:
				return {'error': "Belum ada POS Session yang dibuka, bukan POS Session terlebih dahulu"}
			last_credit = 0
			last_credit_search = frappe.get_list('VetOwnerCredit', filters=[{'pet_owner': petOwner}, {'credit_mutation': ['!=', 0]}], fields=['credit'], order_by="date desc", limit_page_length=1)
			# last_credit_search = frappe.get_list('VetOwnerCredit', filters=[{'pet_owner': petOwner}], fields=['credit'], order_by="date desc", limit_page_length=1)
			if len(last_credit_search) != 0:
				last_credit = last_credit_search[0].credit
				if last_credit < float(nominal):
					return {'error': 'Nominal melebihi deposit, jumlah deposit tersedia %s'% last_credit, 'nominal': last_credit}
			owner_credit = frappe.new_doc('VetOwnerCredit')
			owner_credit.update({
				'date': dt.strftime(dt.now(tz), "%Y-%m-%d %H:%M:%S"),
				'invoice': '',
				'type': 'Payment',
				'nominal': -float(nominal),
				'pet_owner': petOwner,
				'metode_pembayaran': method
			})
			owner_credit.insert()
			frappe.db.commit()
			set_owner_credit_total(petOwner)
			
			create_journal_entry('Payment', -float(nominal), owner_credit.name, method)
		elif action == 'Deposit':
			session_search = frappe.get_list('VetPosSessions', filters={'status': 'In Progress'}, fields=['name'])
			if len(session_search) < 1:
				return {'error': "Belum ada POS Session yang dibuka, bukan POS Session terlebih dahulu"}
			if not tanggal:
				tanggal = dt.strftime(dt.now(tz), "%Y-%m-%d %H:%M:%S")
			owner_credit = frappe.new_doc('VetOwnerCredit')
			owner_credit.update({
				'date': dt.strftime(dt.strptime(tanggal, '%Y-%m-%d %H:%M:%S'), '%Y-%m-%d %H:%M:%S'),
				'invoice': '',
				'type': 'Payment',
				'nominal': nominal,
				'pet_owner': petOwner,
				'metode_pembayaran': method,
				'is_deposit': 1,
			})
			owner_credit.insert()
			frappe.db.commit()
			set_owner_credit_total(petOwner)
			
			create_journal_entry('Payment', nominal, owner_credit.name, method, True, dt.strptime(tanggal, '%Y-%m-%d %H:%M:%S'))
		elif action == 'Bayar':
			session_search = frappe.get_list('VetPosSessions', filters={'status': 'In Progress'}, fields=['name'])
			if len(session_search) < 1:
				return {'error': "Belum ada POS Session yang dibuka, bukan POS Session terlebih dahulu"}
			bayar_hutang_invoice(nominal, petOwner, method)
			# owner_credit = frappe.get_list('VetOwnerCredit', filters={'pet_owner': petOwner}, order_by="creation asc", fields=['*'])
			# sales_credit = frappe.get_list('VetOwnerCredit', filters={'pet_owner': petOwner, 'type': 'Sales'}, order_by="creation asc", fields=['*'])
			# list_credit = []
			
			# for i in owner_credit:
			# 	if i.invoice and i.type == 'Sales':
			# 		invoice_name = i.invoice
			# 		nominal_invoice = i.nominal
			# 	elif i.type == 'Sales':
			# 		index = [x for x in range(len(sales_credit)) if sales_credit[x] == i]
			# 		invoice_sales = [t for t in sales_credit[:index[0]] if t['invoice'] != '' and t['invoice'] != None]
			# 		invoice_name = invoice_sales[-1]['invoice']
			# 		nominal_invoice = i.nominal + float(invoice_sales[-1]['nominal'])
					
			# 	if i.type == 'Sales' and check_invoice(invoice_name , owner_credit, nominal_invoice):
			# 		list_credit.append(i)
			
			# if list_credit:
			# 	i = 0
			# 	for l in list_credit:
			# 		if float(nominal.replace('.','').replace(',','.')) > 0:
			# 			if l.invoice:
			# 				invoice_name = l.invoice
			# 			else:
			# 				index = [x for x in range(len(sales_credit)) if sales_credit[x] == l]
			# 				invoice_sales = [t for t in sales_credit[:index[0]] if t['invoice'] != '' and t['invoice'] != None]
			# 				invoice_name = invoice_sales[-1]['invoice']
							
			# 			pay = frappe.get_list('VetCustomerInvoicePay', filters={'parent': invoice_name}, fields=['sum(jumlah) as paid'])
						
			# 			if pay[0]['paid'] != None:
			# 				remaining = l.nominal - float(pay[0]['paid'])
			# 			else:
			# 				remaining = l.nominal
							
			# 			if float(nominal.replace('.','').replace(',','.')) > remaining and l != list_credit[-1]:
			# 				data = {
			# 					'jumlah': remaining,
			# 					'name': invoice_name,
			# 					'deposit': 0,
			# 					'tipe': 'Sales',
			# 					'method': method
			# 				}
			# 				create_je(data)
			# 				nominal = float(nominal.replace('.','').replace(',','.')) - float(remaining)
			# 			else:
			# 				data = {
			# 					'jumlah': nominal,
			# 					'name': invoice_name,
			# 					'deposit': 0,
			# 					'tipe': 'Sales',
			# 					'method': method
			# 				}
			# 				create_je(data)
			# 				nominal = 0
			# 			i += 1
			# else:
			# 	invoice_sales = [t for t in sales_credit if t['invoice'] != '' and t['invoice'] != None]
			# 	invoice_name = invoice_sales[-1]['invoice']
			# 	data = {
			# 		'jumlah': nominal,
			# 		'name': invoice_name,
			# 		'deposit': 0,
			# 		'tipe': 'Sales',
			# 		'method': method
			# 	}
			# 	create_je(data)
			
		credit_list = frappe.get_list('VetOwnerCredit', filters={'pet_owner': petOwner}, fields=['*'], order_by='date desc')
	
		return credit_list
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def process_invoice(data):
	try:
		data_json = json.loads(data)
		
		for d in data_json:
			credit = frappe.get_doc('VetOwnerCredit', d)
			
			if credit.status == 'Draft':
				credit.status = 'Done'
				credit.save()
				frappe.db.commit()
				
				if credit.type == 'Sales':
					set_owner_credit_total(credit.pet_owner)
					create_journal_entry('Sales', credit.nominal, credit.name)
				elif credit.type == 'Payment':
					owner_credit = frappe.get_list('VetOwnerCredit', filters={'pet_owner': credit.pet_owner}, order_by="date asc", fields=['*'])
					sales_credit = frappe.get_list('VetOwnerCredit', filters={'pet_owner': credit.pet_owner, 'type': 'Sales'}, order_by="date asc", fields=['*'])
					list_credit = []
					
					for i in owner_credit:
						if i.invoice and i.type == 'Sales':
							invoice_name = i.invoice
							nominal_invoice = i.nominal
						elif i.type == 'Sales':
							index = [x for x in range(len(sales_credit)) if sales_credit[x] == i]
							invoice_sales = [t for t in sales_credit[:index[0]] if t['invoice'] != '' and t['invoice'] != None]
							invoice_name = invoice_sales[-1]['invoice']
							nominal_invoice = i.nominal + float(invoice_sales[-1]['nominal'])
							
						if i.type == 'Sales' and check_invoice(invoice_name, owner_credit, nominal_invoice):
							list_credit.append(i)
					
					if list_credit:
						i = 0
						nominal = credit.nominal
						for l in list_credit:
							if float(nominal.replace('.','').replace(',','.')) > 0:
								if l.invoice:
									invoice_name = l.invoice
								else:
									index = [x for x in range(len(sales_credit)) if sales_credit[x] == l]
									invoice_sales = [t for t in sales_credit[:index[0]] if t['invoice'] != '' and t['invoice'] != None]
									invoice_name = invoice_sales[-1]['invoice']
									
								pay = frappe.get_list('VetCustomerInvoicePay', filters={'parent': invoice_name}, fields=['sum(jumlah) as paid'])
								
								if pay[0]['paid'] != None:
									remaining = l.nominal - float(pay[0]['paid'])
								else:
									remaining = l.nominal
									
								if float(nominal.replace('.','').replace(',','.')) > remaining and l != list_credit[-1]:
									data = {
										'jumlah': remaining,
										'name': invoice_name,
										'deposit': 0,
										'from_owner_credit': True,
										'tipe': 'Sales',
									}
									create_je(data)
									nominal = float(nominal.replace('.','').replace(',','.')) - float(remaining)
								else:
									data = {
										'jumlah': nominal,
										'name': invoice_name,
										'deposit': 0,
										'from_owner_credit': True,
										'tipe': 'Sales',
									}
									create_je(data)
									nominal = 0
								i += 1
					else:
						invoice_sales = [t for t in sales_credit if t['invoice'] != '' and  t['invoice'] != None]
						invoice_name = invoice_sales[-1]['invoice']
						nominal = credit.nominal
						data = {
							'jumlah': nominal,
							'name': invoice_name,
							'deposit': 0,
							'from_owner_credit': True,
							'tipe': 'Sales',
						}
						create_je(data)
		
		credit_list = frappe.get_list('VetOwnerCredit', filters={'pet_owner': credit.pet_owner}, fields=['*'], order_by='date desc')
	
		return credit_list
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def submit_piutang_purchase(action, nominal, supplier, method, tanggal=False):
	try:
		tz = pytz.timezone("Asia/Jakarta")
		if action == 'Buat':
			last_credit = 0
			last_credit_search = frappe.get_list('VetOwnerCredit', filters={'supplier': supplier}, fields=['credit'], order_by="date desc")
			if len(last_credit_search) != 0:
				last_credit = last_credit_search[0].credit
				if last_credit < float(nominal):
					return {'error': 'Nominal melebihi deposit, jumlah deposit tersedia %s'% last_credit, 'nominal': last_credit}
			
			owner_credit = frappe.new_doc('VetOwnerCredit')
			owner_credit.update({
				'date': dt.strftime(dt.now(tz), "%Y-%m-%d %H:%M:%S"),
				'purchase': '',
				'type': 'Payment',
				'nominal': -float(nominal),
				'supplier': supplier,
				'metode_pembayaran': method,
			})
			owner_credit.insert()
			frappe.db.commit()
			set_owner_credit_total(supplier, True)
			
			create_journal_entry('Purchase Payment', -float(nominal), owner_credit.name, method, True)	
		
		elif action == 'Deposit':
			owner_credit = frappe.new_doc('VetOwnerCredit')
			if not tanggal:
				tanggal = dt.strftime(dt.now(tz), "%Y-%m-%d %H:%M:%S")
			owner_credit.update({
				'date': dt.strftime(dt.strptime(tanggal, '%Y-%m-%d %H:%M:%S'), '%Y-%m-%d %H:%M:%S'),
				'purchase': '',
				'type': 'Payment',
				'nominal': nominal,
				'supplier': supplier,
				'metode_pembayaran': method,
				'is_deposit': 1,
			})
			owner_credit.insert()
			frappe.db.commit()
			set_owner_credit_total(supplier, True)
			
			create_journal_entry('Purchase Payment', nominal, owner_credit.name, method, True, dt.strptime(tanggal, '%Y-%m-%d %H:%M:%S'))
		elif action == 'Bayar':
			bayar_hutang_purchase(nominal, supplier, method)
			# owner_credit = frappe.get_list('VetOwnerCredit', filters={'supplier': supplier}, order_by="creation asc", fields=['*'])
			# sales_credit = frappe.get_list('VetOwnerCredit', filters={'supplier': supplier, 'type': 'Purchase'}, order_by="creation asc", fields=['*'])
			# list_credit = []
			
			# for i in owner_credit:
			# 	if i.purchase and i.type == 'Purchase':
			# 		purchase_name = i.purchase
			# 		nominal_purchase = i.nominal
			# 	elif i.type == 'Purchase':
			# 		index = [x for x in range(len(sales_credit)) if sales_credit[x] == i]
			# 		purchase_purchase = [t for t in sales_credit[:index[0]] if t['purchase'] != '' and t['purchase'] != None]
			# 		purchase_name = purchase_purchase[-1]['purchase']
			# 		nominal_purchase = i.nominal + float(purchase_purchase[-1]['nominal'])
							
			# 	if i.type == 'Purchase' and check_invoice(purchase_name, owner_credit, nominal_purchase, True):
			# 		list_credit.append(i)
			
			# if list_credit:
			# 	i = 0
			# 	for l in list_credit:
			# 		if float(nominal) > 0:
			# 			if l.purchase:
			# 				purchase_name = l.purchase
			# 			else:
			# 				index = [x for x in range(len(sales_credit)) if sales_credit[x] == l]
			# 				purchase_purchase = [t for t in sales_credit[:index[0]] if t['purchase'] != '' and t['purchase'] != None]
			# 				purchase_name = purchase_purchase[-1]['purchase']
							
			# 			pay = frappe.get_list('VetPurchasePay', filters={'parent': purchase_name}, fields=['sum(jumlah) as paid'])
						
			# 			if pay[0]['paid'] != None:
			# 				remaining = l.nominal - float(pay[0]['paid'])
			# 			else:
			# 				remaining = l.nominal
							
			# 			if float(nominal.replace('.','').replace(',','.')) > remaining and l != list_credit[-1]:
			# 				data = {
			# 					'jumlah': remaining,
			# 					'name': purchase_name,
			# 					'deposit': 0,
			# 					'tipe': 'Purchase',
			# 					'method': method
			# 				}
			# 				create_je(data)
			# 				nominal = float(nominal.replace('.','').replace(',','.')) - float(remaining)
			# 			else:
			# 				data = {
			# 					'jumlah': nominal,
			# 					'name': purchase_name,
			# 					'deposit': 0,
			# 					'tipe': 'Purchase',
			# 					'method': method
			# 				}
			# 				create_je(data)
			# 				nominal = 0
			# 			i += 1
			# else:
			# 	purchase_purchase = [t for t in sales_credit if t['purchase'] != '' and t['purchase'] != None]
			# 	purchase_name = purchase_purchase[-1]['purchase']
			# 	data = {
			# 		'jumlah': nominal,
			# 		'name': purchase_name,
			# 		'deposit': 0,
			# 		'tipe': 'Purchase',
			# 		'method': method
			# 	}
			# 	create_je(data)
			
		credit_list = frappe.get_list('VetOwnerCredit', filters={'supplier': supplier}, fields=['*'], order_by='date desc')
	
		return credit_list
	except PermissionError as e:
		return {'error': e}
		
def bayar_hutang_purchase(nominal, supplier, method):
	def discount_value(value, discount):
		return value - (value * discount/100)

	tz = pytz.timezone("Asia/Jakarta")
	
	all_debt = 0
	last_debt = frappe.get_list("VetOwnerCredit", fields=["debt"], filters={'supplier': supplier}, order_by="date desc")
	if last_debt:
		all_debt = last_debt[0]['debt']
	
	current_nominal = float(nominal)

	purchase_orders = frappe.get_list("VetPurchase", fields=["name", "potongan"], filters={'supplier': supplier, 'status': ['in', ['Purchase Order', 'Receive', 'Paid']]}, order_by="creation desc")
	for po in purchase_orders:
		purchase_order_payments = frappe.get_list('VetPurchasePay', filters={'parent': po.name}, fields=['*'])
		purchase_order_products = frappe.get_list('VetPurchaseProducts', filters={'parent': po.name}, fields=['*'])
	
		paid = sum(p.jumlah for p in purchase_order_payments)
		received_total = sum(discount_value(p.quantity_receive * p.price, p.discount) for p in purchase_order_products)
	
		subtotal = sum(discount_value(p.quantity * p.price, p.discount) for p in purchase_order_products)
		total = subtotal - po.potongan
	
		debt = received_total - (paid if paid <= total else total)
		debt = debt if debt > 0 else 0
		
		if debt > 0 and current_nominal > 0:
			if current_nominal > debt:
				data = {'jumlah': debt, 'name': po.name, 'tipe': 'Purchase', 'method': method}
				create_je(data)
				current_nominal -= debt
				all_debt -= debt
			elif current_nominal <= debt:
				data = {'jumlah': current_nominal, 'name': po.name, 'tipe': 'Purchase', 'method': method}
				create_je(data)
				current_nominal = 0
				all_debt -= debt
	
	if all_debt > 0 and current_nominal > 0:
		if all_debt >= current_nominal:
			debt_payment = frappe.new_doc('VetOwnerCredit')
			debt_payment.update({'date': dt.strftime(dt.now(tz), "%Y-%m-%d %H:%M:%S"), 'purchase': '', 'type': 'Payment', 'nominal': current_nominal, 'supplier': supplier, 'metode_pembayaran': method})
			debt_payment.insert()
			frappe.db.commit()
			set_owner_credit_total(supplier, True)
			
			create_journal_entry('Purchase Payment', current_nominal,  debt_payment.name, method)
			current_nominal = 0
		elif all_debt < current_nominal:
			debt_payment = frappe.new_doc('VetOwnerCredit')
			debt_payment.update({'date': dt.strftime(dt.now(tz), "%Y-%m-%d %H:%M:%S"), 'purchase': '', 'type': 'Payment', 'nominal': all_debt, 'supplier': supplier, 'metode_pembayaran': method})
			debt_payment.insert()
			frappe.db.commit()
			set_owner_credit_total(supplier, True)
			
			create_journal_entry('Purchase Payment', all_debt, debt_payment.name, method)
			
			if 'Deposit' not in method:
				credit_payment = frappe.new_doc('VetOwnerCredit')
				credit_payment.update({'date': dt.strftime(dt.now(tz), "%Y-%m-%d %H:%M:%S"), 'purchase': '', 'type': 'Payment', 'nominal': current_nominal-all_debt, 'supplier': supplier, 'metode_pembayaran': method})
				credit_payment.insert()
				frappe.db.commit()
				set_owner_credit_total(supplier, True)
				
				create_journal_entry('Purchase Payment', current_nominal-all_debt, credit_payment.name, method, True)
			current_nominal = 0
	elif all_debt <= 0 and current_nominal > 0 and 'Deposit' not in method:
		credit_payment = frappe.new_doc('VetOwnerCredit')
		credit_payment.update({'date': dt.strftime(dt.now(tz), "%Y-%m-%d %H:%M:%S"), 'purchase': '', 'type': 'Payment', 'nominal': current_nominal, 'supplier': supplier, 'metode_pembayaran': method})
		credit_payment.insert()
		frappe.db.commit()
		set_owner_credit_total(supplier, True)
		
		create_journal_entry('Purchase Payment', current_nominal, credit_payment.name, method, True)
		current_nominal = 0
		
def bayar_hutang_invoice(nominal, pet_owner, method):
	def discount_value(value, discount):
		return value - (value * discount/100)

	tz = pytz.timezone("Asia/Jakarta")
	
	all_debt = 0
	last_debt = frappe.get_list("VetOwnerCredit", fields=["debt"], filters={'pet_owner': pet_owner}, order_by="date desc")
	if last_debt:
		all_debt = last_debt[0]['debt']
	
	current_nominal = float(nominal)

	customer_invoices = frappe.get_list("VetCustomerInvoice", fields=["name", "potongan"], filters={'owner': pet_owner, 'status': 'Open'}, order_by="creation desc")
	for ci in customer_invoices:
		customer_invoice_payments = frappe.get_list('VetCustomerInvoicePay', filters={'parent': ci.name}, fields=['*'])
		customer_invoice_products = frappe.get_list('VetCustomerInvoiceLine', filters={'parent': ci.name}, fields=['*'])
	
		paid = sum(p.jumlah-p.exchange for p in customer_invoice_payments)
	
		subtotal = sum(discount_value(p.quantity * p.unit_price, p.discount) for p in customer_invoice_products)
		total = (subtotal - ci.potongan) or ci.total
	
		debt = total - (paid if paid <= total else total)
		debt = debt if debt > 0 else 0
		
		if debt > 0 and current_nominal > 0:
			if current_nominal > debt:
				data = {'jumlah': debt, 'name': ci.name, 'payment_method': method}
				add_payment(json.dumps(data))
				current_nominal -= debt
				all_debt -= debt
			elif current_nominal <= debt:
				data = {'jumlah': current_nominal, 'name': ci.name, 'payment_method': method}
				add_payment(json.dumps(data))
				current_nominal = 0
				all_debt -= debt
	
	if all_debt > 0 and current_nominal > 0:
		if all_debt >= current_nominal:
			debt_payment = frappe.new_doc('VetOwnerCredit')
			debt_payment.update({'date': dt.strftime(dt.now(tz), "%Y-%m-%d %H:%M:%S"), 'purchase': '', 'type': 'Payment', 'nominal': current_nominal, 'pet_owner': pet_owner, 'metode_pembayaran': method})
			debt_payment.insert()
			frappe.db.commit()
			set_owner_credit_total(pet_owner)
			
			create_journal_entry('Purchase Payment', current_nominal,  debt_payment.name, method)
			current_nominal = 0
		elif all_debt < current_nominal:
			debt_payment = frappe.new_doc('VetOwnerCredit')
			debt_payment.update({'date': dt.strftime(dt.now(tz), "%Y-%m-%d %H:%M:%S"), 'purchase': '', 'type': 'Payment', 'nominal': all_debt, 'pet_owner': pet_owner, 'metode_pembayaran': method})
			debt_payment.insert()
			frappe.db.commit()
			set_owner_credit_total(pet_owner)
			
			create_journal_entry('Purchase Payment', all_debt, debt_payment.name, method)
			
			if 'Deposit' not in method:
				credit_payment = frappe.new_doc('VetOwnerCredit')
				credit_payment.update({'date': dt.strftime(dt.now(tz), "%Y-%m-%d %H:%M:%S"), 'invoice': '', 'type': 'Payment', 'nominal': current_nominal-all_debt, 'pet_owner': pet_owner, 'metode_pembayaran': method})
				credit_payment.insert()
				frappe.db.commit()
				set_owner_credit_total(pet_owner)
				
				create_journal_entry('Payment', current_nominal-all_debt, credit_payment.name, method, True)
			current_nominal = 0
	elif all_debt <= 0 and current_nominal > 0 and 'Deposit' not in method:
		credit_payment = frappe.new_doc('VetOwnerCredit')
		credit_payment.update({'date': dt.strftime(dt.now(tz), "%Y-%m-%d %H:%M:%S"), 'invoice': '', 'type': 'Payment', 'nominal': current_nominal, 'pet_owner': pet_owner, 'metode_pembayaran': method})
		credit_payment.insert()
		frappe.db.commit()
		set_owner_credit_total(pet_owner)
		
		create_journal_entry('Payment', current_nominal, credit_payment.name, method, True)
		current_nominal = 0
		
@frappe.whitelist()
def process_purchase(data):
	try:
		data_json = json.loads(data)
		
		for d in data_json:
			credit = frappe.get_doc('VetOwnerCredit', d)
			
			if credit.status == 'Draft':
				credit.status = 'Done'
				credit.save()
				frappe.db.commit()
				
				if credit.type == 'Purchase':
					set_owner_credit_total(credit.supplier, True)
					create_journal_entry('Purchase', credit.nominal, credit.name)
				elif credit.type == 'Payment':
					owner_credit = frappe.get_list('VetOwnerCredit', filters={'supplier': credit.supplier}, order_by="date asc", fields=['*'])
					sales_credit = frappe.get_list('VetOwnerCredit', filters={'supplier': credit.supplier, 'type': 'Purchase'}, order_by="date asc", fields=['*'])
					list_credit = []
					
					for i in owner_credit:
						if i.purchase and i.type == 'Purchase':
							purchase_name = i.purchase
							nominal_purchase = i.nominal
						elif i.type == 'Purchase':
							index = [x for x in range(len(sales_credit)) if sales_credit[x] == i]
							purchase_purchase = [t for t in sales_credit[:index[0]] if t['purchase'] != '' and t['purchase'] != None]
							purchase_name = purchase_purchase[-1]['purchase']
							nominal_purchase = i.nominal + float(purchase_purchase[-1]['nominal'])
							
						if i.type == 'Purchase' and check_invoice(purchase_name, owner_credit, nominal_purchase, True):
							list_credit.append(i)
					
					if list_credit:
						i = 0
						nominal = credit.nominal
						for l in list_credit:
							if float(nominal.replace('.','').replace(',','.')) > 0:
								if l.purchase:
									purchase_name = l.purchase
								else:
									index = [x for x in range(len(sales_credit)) if sales_credit[x] == l]
									purchase_purchase = [t for t in sales_credit[:index[0]] if t['purchase'] != '' and t['purchase'] != None]
									purchase_name = purchase_purchase[-1]['purchase']
									
								pay = frappe.get_list('VetPurchasePay', filters={'parent': purchase_name}, fields=['sum(jumlah) as paid'])
								
								if pay[0]['paid'] != None:
									remaining = l.nominal - float(pay[0]['paid'])
								else:
									remaining = l.nominal
									
								if float(nominal.replace('.','').replace(',','.')) > remaining and l != list_credit[-1]:
									data = {
										'jumlah': remaining,
										'name': purchase_name,
										'deposit': 0,
										'from_owner_credit': True,
										'tipe': 'Purchase'
									}
									create_je(data)
									nominal = float(nominal.replace('.','').replace(',','.')) - float(remaining)
								else:
									data = {
										'jumlah': nominal,
										'name': purchase_name,
										'deposit': 0,
										'from_owner_credit': True,
										'tipe': 'Purchase'
									}
									create_je(data)
									nominal = 0
								i += 1
					else:
						purchase_purchase = [t for t in sales_credit if t['purchase'] != '' and t['purchase'] != None]
						purchase_name = purchase_purchase[-1]['purchase']
						nominal = credit.nominal
						data = {
							'jumlah': nominal,
							'name': purchase_name,
							'deposit': 0,
							'from_owner_credit': True,
							'tipe': 'Purchase'
						}
						create_je(data)
			
		credit_list = frappe.get_list('VetOwnerCredit', filters={'supplier': credit.supplier}, fields=['*'], order_by='date desc')
	
		return credit_list
	except PermissionError as e:
		return {'error': e}
		
def check_invoice(invoice, owner_credit, total_invoice, purchase=False):
	if purchase:
		list_payment = [p for p in owner_credit if p['type'] == 'Payment' and p['purchase'] == invoice]
	else:
		list_payment = [p for p in owner_credit if p['type'] == 'Payment' and p['invoice'] == invoice]
		
	if list_payment:
		paid = sum([j.nominal for j in list_payment])
		if float(paid) < float(total_invoice):
			return True
		else:
			return False
	else:
		return True
		
def create_journal_entry(tipe, nominal, owner_credit, method=False, is_deposit=False, date=False):
	tz = pytz.timezone("Asia/Jakarta")
	sales_journal = frappe.db.get_value('VetJournal', {'journal_name': 'Sales Journal', 'type': 'Sale'}, 'name')
	purchase_journal = frappe.db.get_value('VetJournal', {'journal_name': 'Purchase Journal', 'type': 'Purchase'}, 'name')
	
	if check_payment_journal():
		pay_journal = frappe.db.get_value('VetJournal', {'name': 'PAY'}, 'name')
	else:
		pay_journal = create_payment_journal()
	
	hut_dag_account = frappe.db.get_value('VetJournal', {'journal_name': 'Purchase Journal', 'type': 'Purchase'}, 'default_credit_account')
	persediaan_account = frappe.db.get_value('VetCoa', {'account_code': '1-17002'}, 'name')
	piutang_account = frappe.db.get_value('VetCoa', {'account_code': '1-13001'}, 'name')
	debit_account = frappe.db.get_value('VetPaymentMethod', {'method_name': method}, 'account')
	if not debit_account:
		debit_account = frappe.db.get_value('VetPaymentMethod', method, 'account')
	penjualan_account = frappe.db.get_value('VetCoa', {'account_code': '4-10001'}, 'name')
	kas_account = frappe.db.get_value('VetCoa', {'account_code': '1-11101'}, 'name')
	deposit_account = frappe.db.get_value('VetPaymentMethod', {'method_type': 'Deposit Customer'}, 'account')
	if not deposit_account:
		deposit_account = frappe.db.get_value('VetCoa', {'account_code': '2-16003'}, 'name')
	supplier_deposit_account = frappe.db.get_value('VetPaymentMethod', {'method_type': 'Deposit Supplier'}, 'account')
	if not supplier_deposit_account:
		supplier_deposit_account = frappe.db.get_value('VetCoa', {'account_code': '1-16301'}, 'name')
	
	if tipe == 'Sales':
		ji = [
			{'account': piutang_account, 'debit': nominal},
			{'account': penjualan_account, 'credit': nominal},
		]
		journal = sales_journal
	elif tipe == 'Payment':
		ji = [
			{'account': piutang_account, 'credit': nominal},
			{'account': debit_account, 'debit': nominal},
		]
		if is_deposit:
			ji = [
				{'account': deposit_account, 'credit': nominal},
				{'account': debit_account, 'debit': nominal},
			]
		if float(nominal) < 0:
			ji = [
				{'account': debit_account, 'credit': -float(nominal)},
				{'account': deposit_account, 'debit': -float(nominal)},
			]
		journal = pay_journal
	elif tipe == 'Purchase':
		ji = [
				{'account': hut_dag_account, 'credit': nominal},
				{'account': persediaan_account, 'debit': nominal},
			]
		journal = purchase_journal
	elif tipe == 'Purchase Payment':
		ji = [
			{'account': debit_account, 'credit': nominal},
			{'account': hut_dag_account, 'debit': nominal},
		]
		if is_deposit:
			ji = [
				{'account': supplier_deposit_account, 'debit': nominal},
				{'account': debit_account, 'credit': nominal},
			]
		if float(nominal) < 0:
			ji = [
				{'account': debit_account, 'debit': -float(nominal)},
				{'account': supplier_deposit_account, 'credit': -float(nominal)},
			]
		journal = pay_journal
			
	
	je_data = {
		'journal': journal,
		'period': (date or dt.now(tz)).strftime('%m/%Y'),
		'date': (date or dt.now(tz)).date().strftime('%Y-%m-%d'),
		'reference': owner_credit,
		'journal_items': ji
	}
	
	new_journal_entry(json.dumps(je_data))
	
def create_journal_entry_payment(tipe, nominal, reference, method=False):
	tz = pytz.timezone("Asia/Jakarta")
	sales_journal = frappe.db.get_value('VetJournal', {'journal_name': 'Sales Journal', 'type': 'Sale'}, 'name')
	purchase_journal = frappe.db.get_value('VetJournal', {'journal_name': 'Purchase Journal', 'type': 'Purchase'}, 'name')
	piutang_account = frappe.db.get_value('VetCoa', {'account_code': '1-13001'}, 'name')
	debit_account = frappe.db.get_value('VetPaymentMethod', {'method_name': method}, 'account')
	if not debit_account:
		debit_account = frappe.db.get_value('VetPaymentMethod', method, 'account')
	credit_account = frappe.db.get_value('VetPaymentMethod', {'method_name': method}, 'account')
	if not credit_account:
		credit_account = frappe.db.get_value('VetPaymentMethod', method, 'account')
	hut_dag_account = frappe.db.get_value('VetJournal', {'journal_name': 'Purchase Journal', 'type': 'Purchase'}, 'default_credit_account')
	
	if tipe == 'Sales':
		ji = [
			{'account': piutang_account, 'credit': nominal},
			{'account': debit_account, 'debit': nominal},
		]
		journal = sales_journal
	elif tipe == 'Purchase':
		ji = [
				{'account': hut_dag_account, 'debit': nominal},
				{'account': credit_account, 'credit': nominal},
			]
		journal = purchase_journal
			
	
	je_data = {
		'journal': journal,
		'period': dt.now(tz).strftime('%m/%Y'),
		'date': dt.now(tz).date().strftime('%Y-%m-%d'),
		'reference': reference,
		'journal_items': ji
	}
	
	new_journal_entry(json.dumps(je_data))
	
def create_je(data):
	tz = pytz.timezone("Asia/Jakarta")
	if data.get('jumlah') and data.get('tipe') == 'Sales' :
		invoice = frappe.get_doc('VetCustomerInvoice', data.get('name'))
		line_data = {}
		line_data.update({'parent': invoice.name, 'parenttype': 'VetCustomerInvoice', 'parentfield': 'pembayaran'})
		
		tanggal = dt.strftime(dt.now(tz), "%Y-%m-%d %H:%M:%S")
		
		pay = frappe.new_doc("VetCustomerInvoicePay")
		pay.jumlah = data.get('jumlah')
		pay.tanggal = tanggal
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
			deliver_to_customer(invoice.name)
		invoice.save()
		frappe.db.commit()
		
		create_journal_entry_payment(data.get('tipe'), data.get('jumlah'), data.get('name'), data.get('method', False))
		invoice.reload()
		
		search_active_session = frappe.get_list('VetPosSessions', filters={'status': 'In Progress'}, fields=['name'])
		if search_active_session :
			session = frappe.get_doc('VetPosSessions', search_active_session[0]['name'])
			total_kas_masuk = sum([i.jumlah for i in session.kas_masuk])
			total_kas_keluar = sum([q.jumlah for q in session.kas_keluar])
			session.transaction += float(data.get('jumlah'))
			session.current_balance = session.transaction + session.opening_balance + total_kas_masuk - total_kas_keluar
			session.difference = session.current_balance - session.closing_balance
			session.save()
			frappe.db.commit()
		
		if not data.get('from_owner_credit'):
			owner_credit = frappe.new_doc('VetOwnerCredit')
			owner_credit.update({
				'date': dt.strftime(dt.now(tz), "%Y-%m-%d %H:%M:%S"),
				'register_number': invoice.register_number,
				'invoice': invoice.name,
				'type': 'Payment',
				'nominal': data.get('jumlah'),
				'metode_pembayaran': data.get('method')
			})
			owner_credit.insert()
			frappe.db.commit()
		set_owner_credit_total(invoice.owner)
			
	elif data.get('jumlah') and data.get('tipe') == 'Purchase':
		purchase = frappe.get_doc('VetPurchase', data.get('name'))
		pp_data = {}
		pp_data.update({'parent': purchase.name, 'parenttype': 'VetPurchase', 'parentfield': 'pembayaran'})
		
		tanggal = dt.strftime(dt.now(tz), "%Y-%m-%d")
		
		pay = frappe.new_doc("VetPurchasePay")
		pay.jumlah = data.get('jumlah')
		pay.tanggal = tanggal
		pay.metode_pembayaran = data.get('method')
		pay.update(pp_data)
		pay.insert()
		
		frappe.db.commit()
		
		purchase.pembayaran.append(pay)
		if purchase.status == 'Receive' and check_paid_purchase(purchase.name):
			purchase.status = 'Done'
		elif check_paid_purchase(purchase.name):
			purchase.status = 'Paid'
			
		purchase.save()
		frappe.db.commit()
		
		create_journal_entry_payment(data.get('tipe'), data.get('jumlah'), data.get('name'), data.get('method', False))
		purchase.reload()
		
		if not data.get('from_owner_credit'):
			owner_credit = frappe.new_doc('VetOwnerCredit')
			owner_credit.update({
				'date': dt.strftime(dt.now(tz), "%Y-%m-%d %H:%M:%S"),
				'purchase': purchase.name,
				'type': 'Payment',
				'nominal': pay.jumlah,
				'metode_pembayaran': data.get('method')
			})
			owner_credit.insert()
			frappe.db.commit()
		set_owner_credit_total(purchase.supplier, True)
			
		return True
	
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