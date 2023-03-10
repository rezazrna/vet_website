# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
import random
import string
import math
import pytz
from datetime import datetime
from dateutil import tz
from frappe.model.document import Document
from vet_website.vet_website.doctype.vetpetowner.vetpetowner import new_pet_owner
from vet_website.vet_website.doctype.vetpet.vetpet import get_pet
from vet_website.vet_website.doctype.vetposorder.vetposorder import get_order_list
from vet_website.vet_website.doctype.vetjournalentry.vetjournalentry import new_journal_entry
from vet_website.vet_website.doctype.vetoperation.vetoperation import action_receive
from vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice import decrease_product_valuation, increase_product_valuation

class VetPosSessions(Document):
	pass

@frappe.whitelist()
def get_sessions_list(filters=None):
	tz = pytz.timezone("Asia/Jakarta")
	default_sort = "opening_session desc"
	session_filters = []
	session_or_filters = []
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
		
		if filters_json:
			for fj in filters_json:
				if fj[0] == 'closing_session' and fj[1] == '=':
					session_filters.append(['closing_session', 'between', [fj[2] + ' 00:00:00', fj[2] + ' 23:59:59']])
				elif fj[0] == 'opening_session' and fj[1] == '=':
					session_filters.append(['opening_session', 'between', [fj[2] + ' 00:00:00', fj[2] + ' 23:59:59']])
				else:
					session_filters.append(fj)
		if search:
			session_or_filters.append({'name': ['like', '%'+search+'%']})
			session_or_filters.append({'responsible_name': ['like', '%'+search+'%']})
			session_or_filters.append({'transaction': ['like', '%'+search+'%']})
			session_or_filters.append({'status': ['like', '%'+search+'%']})
		if sort:
			default_sort = sort
	
	try:
		session = frappe.get_list("VetPosSessions", or_filters=session_or_filters, filters=session_filters, fields=["*"], order_by=default_sort, start=(page - 1) * 10, page_length= 10)
		datalength = len(frappe.get_all("VetPosSessions", or_filters=session_or_filters, filters=session_filters, as_list=True))
		for index, s in enumerate(session):
			kas_masuk = frappe.get_list("VetPosSessionsKasMasuk", filters={'parent': s['name']}, fields=["*"], order_by="kas_date desc")
			kas_keluar = frappe.get_list("VetPosSessionsKasKeluar", filters={'parent': s['name']}, fields=["*"], order_by="kas_date desc")
			order = frappe.get_list("VetPosOrder", filters={'session': s['name']}, fields=["name", "is_refund"])
			non_cash_payment = []
			cash_payment = []
			
			if order:
				for o in order:
					order_payment = frappe.get_list("VetPosOrderPayment", filters={'parent': o['name'], 'method_type': ['!=', 'Cash']}, fields=["*"])
					order_payment_cash = frappe.get_list("VetPosOrderPayment", filters={'parent': o['name'], 'method_type': 'Cash'}, fields=["*"])
					for r in order_payment:
						berhasil = False
						for n in non_cash_payment:
							if n['type'] == r['type']:
								if o['is_refund']:
									n['value'] -= r['value']
								else:
									n['value'] += r['value']
								n['exchange'] += r['exchange']
								berhasil = True
						
						if berhasil == False:
							if o['is_refund']:
								r['value'] = -r['value']
							method_name = frappe.db.get_value('VetPaymentMethod', r.type, 'method_name')
							r['method_name'] = method_name
							r['debt_mutation'] = 0
							r['credit_mutation'] = 0
							r['credit_mutation_return'] = 0
							non_cash_payment.append(r)
							
					for r in order_payment_cash:
						berhasil = False
						for n in cash_payment:
							if n['type'] == r['type']:
								if o['is_refund']:
									n['value'] -= r['value']
								else:
									n['value'] += r['value']
								n['exchange'] += r['exchange']
								berhasil = True
						
						if berhasil == False:
							if o['is_refund']:
								r['value'] = -r['value']
							method_name = frappe.db.get_value('VetPaymentMethod', r.type, 'method_name')
							r['method_name'] = method_name
							r['debt_mutation'] = 0
							r['credit_mutation'] = 0
							r['credit_mutation_return'] = 0
							cash_payment.append(r)

			# max_session_date = s['closing_session']

			# opening_date = s['opening_session'].date()

			# if index != 0 and session[index - 1]['opening_session'].date() == opening_date:
			# 	max_session_date = session[index - 1]['opening_session']

			# credit_filters = [['date', '>=', s['opening_session']], ['date', '<=', max_session_date or datetime.now(tz)], ['type', 'in', ['Payment', 'Refund']]]
			# sales_credit_filters = [['date', '>=', s['opening_session']], ['date', '<=', max_session_date or datetime.now(tz)], ['type', '=', 'Sales']]
							
			credit_filters = [['date', '>=', s['opening_session']], ['date', '<=', s['closing_session'] or datetime.now(tz)], ['type', 'in', ['Payment', 'Refund']]]
			sales_credit_filters = [['date', '>=', s['opening_session']], ['date', '<=', s['closing_session'] or datetime.now(tz)], ['type', '=', 'Sales']]
			owner_credit_list = frappe.get_list('VetOwnerCredit', or_filters={'pet_owner': ['!=', ''], 'invoice': ['!=', '']}, filters=credit_filters, fields=['*'], order_by='creation desc')
			sales_credit_list = frappe.get_list('VetOwnerCredit', or_filters={'pet_owner': ['!=', ''], 'invoice': ['!=', '']}, filters=sales_credit_filters, fields=['*'], order_by='creation desc')

			for ow in owner_credit_list:
				# print(ow.metode_pembayaran)
				payment_method = frappe.get_list('VetPaymentMethod', filters={'method_name': ow['metode_pembayaran']}, fields=['name', 'method_name'])
				if payment_method:
					payment_method_name = payment_method[0]['name']
				else:
					payment_method_name = ''

				# if payment_method :
				if ow.metode_pembayaran != 'Cash':
					ada = False
					for n in non_cash_payment:
						if n['method_name'] == ow['metode_pembayaran']:
							if ow['type'] == 'Refund':
								n['value'] -= ow['nominal'] if ow['nominal'] > 0 else 0
							else:
								n['value'] += ow['nominal'] if ow['nominal'] > 0 else 0
							n['exchange'] += ow['exchange']
							n['debt_mutation'] += ow['debt_mutation'] or 0
							n['credit_mutation'] += ow['credit_mutation'] if ow['credit_mutation'] > 0 else 0
							n['credit_mutation_return'] += ow['credit_mutation'] if ow['credit_mutation'] < 0 else 0
							ada = True
					
					if ada == False:
						if ow['type'] == 'Refund':
							value = -ow['nominal']
						else:
							value = ow['nominal'] if ow['nominal'] > 0 else 0
						credit_mutation = ow['credit_mutation'] if ow['credit_mutation'] > 0 else 0
						credit_mutation_return = ow['credit_mutation'] if ow['credit_mutation'] < 0 else 0
						ncp = {'type': payment_method_name, 'method_name': ow['metode_pembayaran'], 'value': value, 'exchange': ow['exchange'], 'debt_mutation': ow['debt_mutation'], 'credit_mutation': credit_mutation, 'credit_mutation_return': credit_mutation_return}
						non_cash_payment.append(ncp)
				else:
					ada = False
					for n in cash_payment:
						if n['type'] == ow['metode_pembayaran']:
							if ow['type'] == 'Refund':
								n['value'] -= ow['nominal'] if ow['nominal'] > 0 else 0
							else:
								n['value'] += ow['nominal'] if ow['nominal'] > 0 else 0
							n['exchange'] += ow['exchange']
							n['debt_mutation'] += ow['debt_mutation'] or 0
							n['credit_mutation'] += ow['credit_mutation'] if ow['credit_mutation'] > 0 else 0
							n['credit_mutation_return'] += ow['credit_mutation'] if ow['credit_mutation'] < 0 else 0
							ada = True
					
					if ada == False:
						if ow['type'] == 'Refund':
							value = -ow['nominal']
						else:
							value = ow['nominal'] if ow['nominal'] > 0 else 0
						credit_mutation = ow['credit_mutation'] if ow['credit_mutation'] > 0 else 0
						credit_mutation_return = ow['credit_mutation'] if ow['credit_mutation'] < 0 else 0
						ncp = {'type': ow['metode_pembayaran'], 'method_name': method_name, 'value': value, 'exchange': ow['exchange'], 'debt_mutation': ow['debt_mutation'], 'credit_mutation': credit_mutation, 'credit_mutation_return': credit_mutation_return}
						cash_payment.append(ncp)
			
			s['kas_masuk'] = kas_masuk
			s['total_kas_masuk'] = sum([m['jumlah'] for m in kas_masuk])
			s['kas_keluar'] = kas_keluar
			s['total_kas_keluar'] = sum([k['jumlah'] for k in kas_keluar])
			s['non_cash_payment'] = non_cash_payment
			s['cash_payment'] = cash_payment
			s['sales_debt'] = sales_credit_list
		
		journal = frappe.get_list("VetCoa", fields=["*"])
		# journal = frappe.get_list("VetCoa", filters={'account_parent': 'VC-102'}, fields=["*"])
		# if len(journal) == 0:
		# 	journal = frappe.get_list("VetCoa", filters={'account_parent': '1-11000'}, fields=["*"])
		
		# journal_out_names = []
		# hpp_journal = frappe.get_list("VetCoa", filters={'account_code': ['like', '5-%'], 'is_parent': '0'}, fields=["name"])
		# journal_out_names += list(j.name for j in hpp_journal)
		# biaya_journal = frappe.get_list("VetCoa", filters={'account_code': ['like', '6-%'], 'is_parent': '0'}, fields=["name"])
		# journal_out_names += list(j.name for j in biaya_journal)
		# karyawan_journal = frappe.get_list("VetCoa", filters={'account_parent': ['in', ['VC-124', '1-14300']], 'is_parent': '0'}, fields=["name"])
		# journal_out_names += list(j.name for j in karyawan_journal)
		# journal_out = frappe.get_list("VetCoa", filters={'name': ['in', journal_out_names]}, fields=["*"])
		# if len(journal_out) == 0:
		# 	journal_out = frappe.get_list("VetCoa", filters={'account_parent': '6-0000'}, fields=["*"])
		
		return {'session': session, 'journal': journal, 'journal_out': journal, 'datalength': datalength}
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def create_session():
	tz = pytz.timezone("Asia/Jakarta")
	checkActiveSession = frappe.get_list('VetPosSessions', filters={'status': 'In Progress'})
	
	if not checkActiveSession:
		last_session = frappe.get_list('VetPosSessions', filters={'status': 'Closed & Posted'}, fields=['*'], order_by="creation desc", limit=1)
		if last_session:
			cash_payment = []
			kas_masuk_list = frappe.get_list("VetPosSessionsKasMasuk", filters={'parent': last_session[0]['name']}, fields=["*"], order_by="kas_date desc")
			kas_keluar_list = frappe.get_list("VetPosSessionsKasKeluar", filters={'parent': last_session[0]['name']}, fields=["*"], order_by="kas_date desc")
			kas_masuk = sum(k.jumlah for k in kas_masuk_list)
			kas_keluar = sum(k.jumlah for k in kas_keluar_list)
			order = frappe.get_list("VetPosOrder", filters={'session': last_session[0]['name']}, fields=["name"])
			for o in order:
				order_payment_cash = frappe.get_list("VetPosOrderPayment", filters={'parent': o['name'], 'method_type': 'Cash'}, fields=["*"])
				for r in order_payment_cash:
					berhasil = False
					for n in cash_payment:
						if n['type'] == r['type']:
							n['value'] += r['value']
							n['exchange'] += r['exchange']
							berhasil = True
					
					if berhasil == False:
						method_name = frappe.db.get_value('VetPaymentMethod', r.type, 'method_name')
						r['method_name'] = method_name
						r['debt_mutation'] = 0
						r['credit_mutation'] = 0
						cash_payment.append(r)
			credit_filters = [['date', '>=', last_session[0]['opening_session']], ['date', '<=', last_session[0]['closing_session'] or datetime.now(tz)], ['type', '=', 'Payment']]
			owner_credit_list = frappe.get_list('VetOwnerCredit', or_filters={'pet_owner': ['!=', ''], 'invoice': ['!=', '']}, filters=credit_filters, fields=['*'], order_by='creation desc')
			for ow in owner_credit_list:
				method_name = frappe.db.get_value('VetPaymentMethod', ow['metode_pembayaran'], 'method_name')
				if ow.metode_pembayaran == 'Cash':
					ada = False
					for n in cash_payment:
						if n['type'] == ow['metode_pembayaran']:
							n['value'] += ow['nominal']
							n['exchange'] += ow['exchange']
							n['debt_mutation'] += ow['debt_mutation'] or 0
							n['credit_mutation'] += ow['credit_mutation'] or 0
							ada = True
					
					if ada == False:
						ncp = {'type': ow['metode_pembayaran'], 'method_name': method_name, 'value': ow['nominal'], 'exchange': ow['exchange'], 'debt_mutation': ow['debt_mutation'], 'credit_mutation': ow['credit_mutation']}
						cash_payment.append(ncp)
			cash_transaction = sum(p['value'] - p['exchange'] for p in cash_payment)
			# opening_balance = last_session[0]['closing_balance']
		else:
			cash_transaction = 0
			kas_masuk = 0
			kas_keluar = 0

		setor = 0
		opening_balance = 0
		closing_balance = 0
		current_balance = 0
		difference = 0

		if last_session:
			balance = (last_session[0]['opening_balance']+cash_transaction+kas_masuk)-kas_keluar
			setor = balance - last_session[0]['closing_balance']
			closing_balance = last_session[0]['closing_balance']

			if setor >= 0:
				opening_balance = last_session[0]['closing_balance']
				current_balance = setor
				difference = setor
			else:
				opening_balance = last_session[0]['closing_balance'] + setor
				current_balance = last_session[0]['closing_balance'] + setor
				difference = last_session[0]['closing_balance'] + setor
		
		new_session = frappe.new_doc('VetPosSessions')
		new_session.update({
			'opening_session': datetime.now(tz).strftime("%Y-%m-%d %H:%M:%S"),
			'responsible': frappe.session.user,
			'opening_balance': opening_balance,
			'closing_balance': closing_balance,
			'current_balance': current_balance,
			'difference': difference,
		})
		new_session.insert()
		frappe.db.commit()
	else:
		new_session = False
	
	return new_session
    
@frappe.whitelist()
def update_data(data):
	json_data = json.loads(data)
	# if json_data['status'] == 'Closed & Posted':
	# 	json_data['closing_session'] = datetime.today()
		
	session = frappe.get_doc('VetPosSessions', json_data['name'])
	
	session.update({
		'closing_session': json_data['closing_session'],
		'status': json_data['status'],
	})
	session.save()
	frappe.db.commit()
	
	if json_data['status'] == 'Closed & Posted':
		closing_je_data = {
			'journal': json_data['close_journal'],
			'jumlah': json_data['setor'],
			'closing_session': json_data['closing_session']
		}
	closing_transfer(json_data['name'], json.dumps(closing_je_data))
	
	return session
	
@frappe.whitelist()
def update_opening_closing(name, mode, nominal):
		
	session = frappe.get_doc('VetPosSessions', name)
	if mode == 'open':
		session.update({
			'opening_balance': nominal,
		})
		session.save()
		frappe.db.commit()
	elif mode == 'close':
		session.update({
			'closing_balance': nominal,
		})
		session.save()
		frappe.db.commit()
	return session
	
@frappe.whitelist()
def pos_add_customer(data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal membuat pemilik baru"}

	tz = pytz.timezone("Asia/Jakarta")
		
	data = {
		"nik": ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(16)),
		"owner_name": data_json.get('owner_name'),
		"address": "-",
		"phone": data_json.get('phone'),
	}
	
	pettypes = frappe.get_list("VetPetType", order_by="creation asc", fields=["name"])
	
	pets = [
		{
			"name": "/",
			"pet_name": data_json.get("pet_name"),
			"hewan_jenis": pettypes[0].name,
			"register_date": datetime.now(tz).strftime("%Y-%m-%d %H:%M:%S")
		}
	]
	
	new_pet_owner(json.dumps(data), json.dumps(pets))
	
	return get_pet()
	
@frappe.whitelist()
def pos_add_order(data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal membuat order baru"}

	tz = pytz.timezone("Asia/Jakarta")
		
	pet = data_json.get("pet", False)
	if pet:
		petlist = frappe.get_list("VetPet", filters={"name": pet}, fields=["name"])
		if len(petlist) == 0:
			data_json.pop("pet")
		
	new_order = frappe.new_doc("VetPosOrder")
	new_order.update(data_json)
	new_order.insert()
	frappe.db.commit()
	
	pos_order_filters = {
		"session": data_json.get("session")
	}
	
	total = sum([(i['price'] * i['quantity'])-(i['price'] * i['quantity'] * (i['disc']/100)) for i in data_json.get('produk')])
	session = frappe.get_doc("VetPosSessions", data_json.get('session'))
	session.transaction += total
	total_kas_masuk = sum([i.jumlah for i in session.kas_masuk])
	total_kas_keluar = sum([a.jumlah for a in session.kas_keluar])
	session.current_balance = session.opening_balance + session.transaction + total_kas_masuk - total_kas_keluar
	session.difference = session.current_balance - session.closing_balance
	session.save()
	frappe.db.commit()
	
	deliver_to_customer(new_order.name)
	
	new_order.reload()
	create_pos_journal_entry(new_order.name, data_json.get("payment"))
	
	return {"orders": get_order_list(json.dumps(pos_order_filters)), "datetime": datetime.now(tz).strftime("%Y-%m-%d %H:%M:%S")}
	
@frappe.whitelist()
def kas_masuk_keluar(session, list_kas):
	tz = pytz.timezone("Asia/Jakarta")
	try:
		kas = json.loads(list_kas)
	except:
		return {'error': "Gagal membuat kas baru"}

	tz = pytz.timezone("Asia/Jakarta")
		
	sales_journal = frappe.db.get_value('VetJournal', {'journal_name': 'Sales Journal', 'type': 'Sale'}, 'name')
	kas_kecil_account = frappe.db.get_value('VetCoa', {'account_code': '1-11101'}, 'name')
	jis = []
	
	doc = frappe.get_doc('VetPosSessions', session)
	
	
	if kas['type'] == 'in':
		kas_data = {}
		kas_data.update({'jumlah': kas['jumlah'], 'keterangan': kas['keterangan'], 'kas_date': datetime.now(tz).strftime("%Y-%m-%d %H:%M:%S"), 'parent': session, 'parenttype': 'VetPosSessions', 'parentfield': 'kas_masuk'})
		
		new_kas = frappe.new_doc("VetPosSessionsKasMasuk")
		new_kas.update(kas_data)
		doc.kas_masuk.append(new_kas)
		doc.save()
		
		jis.append({
				'account': kas_kecil_account,
				'debit': kas['jumlah']
			})
		
		jis.append({
				'account': kas['journal'],
				'credit': kas['jumlah']
			})
			
		if check_transfer_journal():
			sales_journal = frappe.db.get_value('VetJournal', {'name': 'TRANS'}, 'name')
		else:
			sales_journal = create_transfer_journal()
	else:
		kas_data = {}
		kas_data.update({'jumlah': kas['jumlah'], 'keterangan': kas['keterangan'], 'kas_date': datetime.now(tz).strftime("%Y-%m-%d %H:%M:%S"), 'parent': session, 'parenttype': 'VetPosSessions', 'parentfield': 'kas_keluar'})
		
		new_kas = frappe.new_doc("VetPosSessionsKasKeluar")
		new_kas.update(kas_data)
		doc.kas_keluar.append(new_kas)
		doc.save()
		
		jis.append({
				'account': kas['journal'],
				'debit': kas['jumlah']
			})
		
		jis.append({
				'account': kas_kecil_account,
				'credit': kas['jumlah']
			})
		if check_expense_journal():
			sales_journal = frappe.db.get_value('VetJournal', {'name': 'EXP'}, 'name')
		else:
			sales_journal = create_expense_journal()
			
	doc.reload()
	totalKasMasuk = sum([i.jumlah for i in doc.kas_masuk])
	totalKasKeluar = sum([w.jumlah for w in doc.kas_keluar])
	doc.current_balance = doc.opening_balance + doc.transaction + totalKasMasuk - totalKasKeluar
	doc.difference = doc.current_balance - doc.closing_balance
	doc.kas_masuk = sorted(doc.kas_masuk, key=lambda x: x.kas_date, reverse=True)
	doc.kas_keluar = sorted(doc.kas_keluar, key=lambda x: x.kas_date, reverse=True)
	doc.save()
	frappe.db.commit()
		
	je_data = {
		'journal': sales_journal,
		'period': datetime.now(tz).strftime('%m/%Y'),
		'date': datetime.now(tz).date().strftime('%Y-%m-%d'),
		'reference': session,
		'keterangan': kas['keterangan'],
		'journal_items': jis
	}
	
	new_journal_entry(json.dumps(je_data))
	
	return doc
	
def closing_transfer(session, data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal membuat kas baru"}

	tz = pytz.timezone("Asia/Jakarta")
		
	if check_transfer_journal():
		sales_journal = frappe.db.get_value('VetJournal', {'name': 'TRANS'}, 'name')
	else:
		sales_journal = create_transfer_journal()
	kas_kecil_account = frappe.db.get_value('VetCoa', {'account_code': '1-11101'}, 'name')
	jis = [
		{
			'account': data_json['journal'],
			'debit': data_json['jumlah']
		},{
			'account': kas_kecil_account,
			'credit': data_json['jumlah']
		}
	]
	closing_date = datetime.strptime(data_json['closing_session'], '%Y-%m-%d %H:%M:%S')
	je_data = {
		'journal': sales_journal,
		'period': closing_date.strftime('%m/%Y'),
		'date': closing_date.date().strftime('%Y-%m-%d'),
		'reference': session,
		'journal_items': jis
	}
	
	new_journal_entry(json.dumps(je_data))
	
@frappe.whitelist()
def delete_pos_session(data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal menghapus pos session"}
	
	for d in data_json:
		frappe.delete_doc('VetPosSessions', d)
		frappe.db.commit()
		
	return {'success': True}
	
@frappe.whitelist()
def deliver_to_customer(name, refund=False, refund_from=False):
	try:
		pos_order = frappe.get_doc("VetPosOrder", name)
		gudang = frappe.get_list("VetGudang", fields=["name"], order_by='creation asc')
		default_warehouse = frappe.get_list('VetGudang', filters={'is_default': '1'}, fields=['name', 'gudang_name'], limit=1)
		pos_order_produk = frappe.get_list("VetPosOrderProduk", filters={'parent': name}, fields=['*'])
		if refund and pos_order.is_refund == 1:
			date = pos_order.refund_date.strftime("%Y-%m-%d")
		else:
			date = pos_order.order_date.strftime("%Y-%m-%d")
		
		move_list = []
		for p in pos_order_produk:
			product_category = frappe.db.get_value('VetProduct', p.produk, 'product_category')
			stockable = frappe.db.get_value('VetProductCategory', product_category, 'stockable')
			
			if not p.warehouse and stockable == 1:
				if default_warehouse:
					p.update({'warehouse': default_warehouse[0].name})
				else:
					p.update({'warehouse': gudang[0].name})
			
			if stockable == 1:
				move_data = {
					'product': p.produk,
					'product_uom': p.uom,
					'quantity': p.quantity,
					'date': date,
					'warehouse': p.warehouse,
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
					'reference': pos_order.name,
					'source': pos_order.name,
					'to': mv[0].get('warehouse'),
					'status': 'Delivery',
					'date': date,
					'moves': mv,
				}
			else:
				operation_data = {
					'reference': pos_order.name,
					'source': pos_order.name,
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
					decrease_product_valuation(m.product, m.quantity, m.product_uom)

	except PermissionError as e:
		return {'error': e}

@frappe.whitelist()
def submit_refund(data):
	try:
		tz = pytz.timezone("Asia/Jakarta")
		data_json = json.loads(data)
		
		if data_json.get('refund') :
			order = frappe.get_doc('VetPosOrder', data_json.get('name'))
			
			for t in data_json.get('order_produk'):
				if t.get('deleted', False):
					frappe.delete_doc('VetPosOrderProduk', t.get('name'))
				else:
					order_produk = frappe.get_doc('VetPosOrderProduk', t.get('name'))
					order_produk.quantity = t.get('quantity')
					order_produk.amount = t.get('total')
					order_produk.save()
					frappe.db.commit()
			order.reload()
			order.subtotal = sum(i.price * math.ceil(i.quantity) - ((i.disc or 0) / 100 * (i.price * math.ceil(i.quantity))) for i in order.produk)
			# invoice.subtotal = sum(i.unit_price * i.quantity - ((i.discount or 0) / 100 * (i.unit_price * i.quantity)) for i in invoice.invoice_line)
			order.total = order.subtotal
			order.save()
			pay = frappe.new_doc("VetPosOrderPayment")
			pay.update({
				'value': data_json.get('refund'),
				# 'tanggal': dt.strftime(dt.now(tz), "%Y-%m-%d"),
				'type': data_json.get('payment_method'),
				'method_type': data_json.get('method_type'),
				'pos_session': order.session,
				'parent': order.name,
				'parenttype': 'VetPosOrder',
				'parentfield': 'payment'
			})
			pay.insert()
			order.payment.append(pay)
			order.save()
			frappe.db.commit()
			
			create_sales_payment_journal_items(order.name, data_json.get('refund'), True, 0, data_json.get('payment_method'), order.refund_from)
			paid_search = frappe.get_list('VetPosOrderPayment', filters={'parent': order.name}, fields=['sum(value) as paid'])
			if len(paid_search) != 0:
				paid = paid_search[0].paid
			
			if paid >= order.total:
				# invoice.status = 'Refund'
				# invoice.save()
				deliver_to_customer(order.name, True, order.refund_from)
				
			pay.reload()
			
			search_active_session = frappe.get_list('VetPosSessions', filters={'status': 'In Progress'}, fields=['name'])
			if search_active_session :
				session = frappe.get_doc('VetPosSessions', search_active_session[0]['name'])
				total_kas_masuk = sum([i.jumlah for i in session.kas_masuk])
				total_kas_keluar = sum([q.jumlah for q in session.kas_keluar])
				session.transaction -= float(pay.value)
				session.current_balance = session.transaction + session.opening_balance + total_kas_masuk - total_kas_keluar
				session.difference = session.current_balance - session.closing_balance
				session.save()
				frappe.db.commit()
			
			# owner_credit = frappe.new_doc('VetOwnerCredit')
			# owner_credit.update({
			# 	'date': dt.strftime(dt.now(tz), "%Y-%m-%d %H:%M:%S"),
			# 	'register_number': invoice.register_number,
			# 	'invoice': invoice.name,
			# 	'type': 'Refund',
			# 	'nominal': pay.jumlah,
			# 	'metode_pembayaran': data_json.get('payment_method')
			# })
			# owner_credit.insert()
			# frappe.db.commit()
			# set_owner_credit_total(invoice.owner)
			# pay.update()
				
		return {'order': order}

	except PermissionError as e:
		return {'error': e}

def create_sales_payment_journal_items(order_name, amount, refund=False, deposit=0, method=False, refund_from=False):
	tz = pytz.timezone("Asia/Jakarta")
	#create payment choose payment journal
	# sales_journal = frappe.db.get_value('VetJournal', {'journal_name': 'Sales Journal', 'type': 'Sale'}, 'name')
	if refund:
		if check_refund_journal():
			sales_journal = frappe.db.get_value('VetJournal', {'name': 'REFUND'}, 'name')
		else:
			sales_journal = create_refund_journal()
	else:
		if check_payment_journal():
			sales_journal = frappe.db.get_value('VetJournal', {'name': 'PAY'}, 'name')
		else:
			sales_journal = create_payment_journal()

	if method: 
		debit_account = frappe.db.get_value('VetPaymentMethod', {'method_name': method}, 'account')
		if not debit_account:
			debit_account = frappe.db.get_value('VetPaymentMethod', method, 'account')
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
			products = frappe.get_list('VetPosOrderProduk', filters={'parent': order_name}, fields=['*'])
			for pp in products:
				product = frappe.get_doc('VetProduct', pp.produk)
				product_category = frappe.get_doc('VetProductCategory', product.product_category)
				if product_category.stockable:
					order_produk = frappe.get_doc('VetPosOrderProduk', pp.name)
					amount = 0
					current_quantity = pp.quantity
					line = frappe.get_list('VetPosOrderProduk', filters={'parent': refund_from, 'produk': order_produk.produk}, fields=['*'])
					if line:
						purchase_products = frappe.get_list('VetPosOrderPurchaseProducts', filters={'order_produk_name': line[0]['name']}, fields=['*'], order_by="name desc")
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
		order = frappe.get_doc('VetPosOrder', order_name)
		paid = sum(i.value for i in order.payment)
		jis = []
		
		if deposit != 0:
			jis.append({'account': deposit_account, 'debit': deposit})
		
		if float(paid) - float(order.total) > 0:
			# jas = [
			# 	{'account': debit_account, 'debit': amount},
			# 	{'account': credit_account, 'credit': float(invoice.total) - (float(paid) - float(amount))},
			# 	{'account': uang_muka_lain, 'credit': float(paid) - float(invoice.total)}
			# ]
			
			jas = [
				{'account': debit_account, 'debit': float(order.total) - (float(paid) - float(amount))},
				{'account': credit_account, 'credit': float(order.total) - (float(paid) - float(amount))},
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
		'period': datetime.now(tz).strftime('%m/%Y'),
		'date': datetime.now(tz).date().strftime('%Y-%m-%d'),
		'reference': order_name,
		'journal_items': jis
	}
	
	new_journal_entry(json.dumps(je_data))
		
def create_pos_journal_entry(name, payment, refund=False):
	tz = pytz.timezone("Asia/Jakarta")
	pos_order = frappe.get_doc('VetPosOrder', name)
	sales_journal = frappe.db.get_value('VetJournal', {'journal_name': 'Sales Journal', 'type': 'Sale'}, 'name')
	# journal_debit = frappe.db.get_value('VetJournal', {'journal_name': 'Sales Journal', 'type': 'Sale'}, 'default_debit_account')
	# journal_credit = frappe.db.get_value('VetJournal', {'journal_name': 'Sales Journal', 'type': 'Sale'}, 'default_credit_account')
	# potongan_account = frappe.db.get_value('VetCoa', {'account_code': '4-90001'}, 'name')
	# credit_account = frappe.db.get_value('VetCoa', {'account_code': '1-13001'}, 'name')
	# uang_muka_lain = frappe.db.get_value('VetCoa', {'account_code': '2-16003'}, 'name')
	# retur_account = frappe.db.get_value('VetCoa', {'account_code': '4-11001'}, 'name')
	
	produk = frappe.get_list('VetPosOrderProduk', filters={'parent': name}, fields=['*'])
	jis = []
	total = 0
	for pp in produk:
		product = frappe.get_doc('VetProduct', pp.produk)
		product_category = frappe.get_doc('VetProductCategory', product.product_category)
		amount = pp.amount
		total += amount
		same_income_ji = next((ji for ji in jis if ji.get('account') == product_category.income_account), False)
		if same_income_ji:
			# if refund:
			# 	same_income_ji.update({
			# 		'debit': same_income_ji.get('debit') + amount,
			# 	})
			# else:
			same_income_ji.update({
				'credit': same_income_ji.get('credit') + amount,
			})
		else:
			# if refund:
			# 	jis.append({
			# 		'account': product_category.income_account,
			# 		'debit': amount,
			# 	})
			# else:	
			jis.append({
				'account': product_category.income_account,
				'credit': amount,
			})
		if product_category.stockable:
			order_produk = frappe.get_doc('VetPosOrderProduk', pp.name)
			amount = 0
			current_quantity = pp.quantity
			purchase_with_stock_search = frappe.get_list('VetPurchaseProducts', filters={'product': pp.produk}, fields=['*'], order_by="creation asc")
			purchase_with_stock = list(p for p in purchase_with_stock_search if p.quantity_stocked)
			
			for pws in purchase_with_stock:
				if current_quantity != 0:
					purchase_product = frappe.get_doc('VetPurchaseProducts', pws.name)
					
					if (purchase_product.uom != pp.product_uom) :
						ratio = frappe.db.get_value('VetUOM', pp.product_uom, 'ratio')
						target_ratio = frappe.db.get_value('VetUOM', purchase_product.uom, 'ratio')
						current_quantity = current_quantity * (float(ratio or 1)/float(target_ratio or 1))
						current_uom = purchase_product.uom

					new_order_produk_purchase = frappe.new_doc("VetPosOrderPurchaseProducts")
					
					if float(current_quantity) > purchase_product.quantity_stocked:
						new_order_produk_purchase.update({
							'order_produk_name': order_produk.name,
							'purchase_products_name': purchase_product.name,
							# 'quantity': math.ceil(purchase_product.quantity_stocked),
							'quantity': purchase_product.quantity_stocked,
						})

						new_order_produk_purchase.insert()
						frappe.db.commit()

						current_quantity = float(current_quantity) - purchase_product.quantity_stocked
						# amount += purchase_product.price * math.ceil(purchase_product.quantity_stocked)
						amount += purchase_product.price * purchase_product.quantity_stocked
					else:
						new_order_produk_purchase.update({
							'order_produk_name': order_produk.name,
							'purchase_products_name': purchase_product.name,
							# 'quantity': math.ceil(current_quantity),
							'quantity': current_quantity,
						})

						new_order_produk_purchase.insert()
						frappe.db.commit()

						# amount += purchase_product.price * math.ceil(current_quantity)
						amount += purchase_product.price * current_quantity
						current_quantity = 0
			
			same_input_ji = next((ji for ji in jis if ji.get('account') == product_category.stock_input_account), False)
			same_output_ji = next((ji for ji in jis if ji.get('account') == product_category.stock_output_account), False)
			if same_input_ji:
				# if refund:
				# 	same_input_ji.update({
				# 		'debit': same_input_ji.get('debit') + amount,
				# 	})
				# else:
				same_input_ji.update({
					'credit': same_input_ji.get('credit') + amount,
				})
			else:
				# if refund:
				# 	jis.append({
				# 		'account': product_category.stock_input_account,
				# 		'debit': amount,
				# 	})
				# else:
				jis.append({
					'account': product_category.stock_input_account,
					'credit': amount,
				})
			if same_output_ji:
				# if refund:
				# 	same_output_ji.update({
				# 		'credit': same_output_ji.get('credit') + amount,
				# 	})
				# else:
				same_output_ji.update({
					'debit': same_output_ji.get('debit') + amount,
				})
			else:
				# if refund:
				# 	jis.append({
				# 		'account': product_category.stock_output_account,
				# 		'credit': amount,
				# 	})
				# else:
				jis.append({
					'account': product_category.stock_output_account,
					'debit': amount,
				})
	# if refund:
	# 	jis.append({
	# 		'account': journal_debit,
	# 		'credit': total,
	# 	})
	# else:
	# jis.append({
	# 	'account': journal_debit,
	# 	'debit': total,
	# })
		
	# if invoice.potongan > 0:
	# 	jis.append({
	# 		'account': potongan_account,
	# 		'debit': float(invoice.potongan)
	# 	})
	
	paid = sum(i.value for i in pos_order.payment)
	exchange = float(paid) - float(pos_order.total)
	
	for y in payment:
		if y['type']:
			debit_account = frappe.db.get_value('VetPaymentMethod', y['type'], 'account')
		else:
			debit_account = frappe.db.get_value('VetCoa', {'account_code': '1-11101'}, 'name')
		# if refund:
		# 	jis = [
		# 		{
		# 			'account': debit_account,
		# 			'credit': amount,
		# 		},{
		# 			'account': retur_account,
		# 			'debit': amount,
		# 		}
		# 	]
		# else:
		
		# if deposit != 0:
		# 	jis.append({'account': uang_muka_lain, 'debit': deposit})
		
		data = {'account': debit_account, 'debit': y['value']}
		if y['method_type'] == 'Cash':
			if y['value'] >= exchange:
				data.update({'debit': y['value'] - exchange})
			else:
				data.pop('debit')
				data.update({'credit': -(y['value'] - exchange)})
		
		jis.append(data)
		
	
	# jis.append({'account': credit_account, 'credit': float(pos_order.total)})
	
	# if float(paid) - float(pos_order.total) > 0:
	# 	jas = [{'account': uang_muka_lain, 'credit': float(paid) - float(pos_order.total)}]
	# 	jis.extend(jas)
		
	je_data = {
		'journal': sales_journal,
		'period': datetime.now(tz).strftime('%m/%Y'),
		'date': datetime.now(tz).date().strftime('%Y-%m-%d'),
		'reference': pos_order.name,
		'journal_items': jis
	}
	
	new_journal_entry(json.dumps(je_data))
	
def check_transfer_journal():
	transfer_journal = frappe.get_list('VetJournal', filters={'name': 'TRANS'}, fields=['name'])
	return len(transfer_journal) > 0

def create_transfer_journal():
	transfer_journal = frappe.new_doc('VetJournal')
	transfer_journal.update({
		'code': 'TRANS',
		'type': 'General',
		'journal_name': 'Transafer Journal',
	})
	transfer_journal.insert()
	frappe.db.commit()
	
	return transfer_journal.name
	
def check_expense_journal():
	expense_journal = frappe.get_list('VetJournal', filters={'name': 'EXP'}, fields=['name'])
	return len(expense_journal) > 0
	
def create_expense_journal():
	expense_journal = frappe.new_doc('VetJournal')
	expense_journal.update({
		'code': 'EXP',
		'type': 'General',
		'journal_name': 'Expense',
	})
	expense_journal.insert()
	frappe.db.commit()
	
	return expense_journal.name

def check_payment_journal():
	payment_journal = frappe.get_list('VetJournal', filters={'name': 'PPAY'}, fields=['name'])
	return len(payment_journal) > 0

def create_payment_journal():
	payment_journal = frappe.new_doc('VetJournal')
	payment_journal.update({
		'code': 'PPAY',
		'type': 'General',
		'journal_name': 'Purchase Payment Journal',
	})
	payment_journal.insert()
	frappe.db.commit()
	
	return payment_journal.name

def check_refund_journal():
	refund_journal = frappe.get_list('VetJournal', filters={'name': 'PREFUND'}, fields=['name'])
	return len(refund_journal) > 0

def create_refund_journal():
	refund_journal = frappe.new_doc('VetJournal')
	refund_journal.update({
		'code': 'PREFUND',
		'type': 'General',
		'journal_name': 'Purchase Refund Journal',
	})
	refund_journal.insert()
	frappe.db.commit()
	
	return refund_journal.name