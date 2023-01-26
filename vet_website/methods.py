from __future__ import unicode_literals
import frappe
import json
import os
import time
import csv
import urllib.request
import pytz
from datetime import datetime as dt
from frappe.utils.file_manager import save_file
from vet_website.vet_website.doctype.vetpet.vetpet import get_pet
from vet_website.vet_website.doctype.vetproduct.vetproduct import get_product_list
from vet_website.vet_website.doctype.vetpaymentmethod.vetpaymentmethod import get_payment_method_list
from vet_website.vet_website.doctype.vetposorder.vetposorder import get_order_list
from vet_website.vet_website.doctype.vetpetowner.vetpetowner import set_owner_credit_total
from vet_website.vet_website.doctype.vetjournalentry.vetjournalentry import set_journal_item_total
try:
	beta = True
	from frappe.core.doctype.data_import_beta.data_import_beta import start_import
except ModuleNotFoundError:
	beta = False
	from frappe.core.doctype.data_import.data_import import start_import
	

def get_home_page(context):
    print("########## Boot Session ##########")
    print(context)
    frappe.local.response["type"] = "redirect"
    frappe.local.response["location"] = "/desk#List/VetGrooming/List"
    # frappe.local.response["home_page"] = "/desk#List/VetGrooming/List"
    
@frappe.whitelist()
def get_settings():
    data = {
        'pet_owner_name_format': frappe.db.get_value('DocType', 'VetPetOwner', 'autoname'),
        'pet_name_format': frappe.db.get_value('DocType', 'VetPet', 'autoname'),
        'customer_invoice_name_format': frappe.db.get_value('DocType', 'VetCustomerInvoice', 'autoname'),
        'purchase_name_format': frappe.db.get_value('DocType', 'VetPurchase', 'autoname'),
        'task_name_format': frappe.db.get_value('DocType', 'VetTask', 'autoname'),
        'operation_name_format': frappe.db.get_value('DocType', 'VetOperation', 'autoname'),
        'adjustment_name_format': frappe.db.get_value('DocType', 'VetAdjustment', 'autoname'),
        'supplier_name_format': frappe.db.get_value('DocType', 'VetSupplier', 'autoname'),
        'apotik_name_format': frappe.db.get_value('DocType', 'VetApotik', 'autoname'),
        'rekam_medis_name_format': frappe.db.get_value('DocType', 'VetRekamMedis', 'autoname'),
        'instalasi_medis_name_format': frappe.db.get_value('DocType', 'VetInstalasiMedis', 'autoname'),
        'rawat_inap_name_format': frappe.db.get_value('DocType', 'VetRawatInap', 'autoname'),
    }
    users = get_users()
    res = {'data': data, 'users': users}
    return res
    
@frappe.whitelist()
def get_users():
	user = frappe.get_list('User', filters={'full_name': ['!=', 'Guest']}, fields=['*'], order_by="creation desc")
		
	list_user = []
	
	for u in user:
		roles = frappe.get_list('Has Role', filters={'parent': u['name']}, fields=['role'])
		vet_roles = frappe.get_list('VetRoleUser', filters={'user': u['name']}, fields=['parent'])
		for vr in vet_roles:
			vr['role'] = frappe.get_value('VetRole', vr.parent, 'role_name')
		if len([i for i in roles if i.role == 'System Manager']) != 0 and u['name'] != 'Administrator':
			u['roles'] = roles
			list_user.append(u)
		else:
			u['roles'] = roles
			u['roles'] += vet_roles
			list_user.append(u)
			
	return list_user
	
@frappe.whitelist()
def remove_user(name):
	try:
		VetRoleUsers = frappe.get_list('VetRoleUser', filters={'user': name}, fields=['name'])
		for vrl in VetRoleUsers:
			frappe.delete_doc('VetRoleUser', vrl.name)
			frappe.db.commit()
		
		frappe.delete_doc('User', name)
		frappe.db.commit()
		        
		return True
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def add_user(data):
	try:
		data_json = json.loads(data)
		
		custom_role = False
		if data_json.get('role') == 'Staff' :
			role = frappe.get_value('Role', {'role_name': 'Staff'}, 'name')
		elif data_json.get('role') == 'Master':
			role = frappe.get_value('Role', {'role_name': 'System Manager'}, 'name')
		else:
			vet_default_role = frappe.get_list('Role', filters={'name': 'Vet Website Default'}, fields=['name'])
			if len(vet_default_role) == 0:
				prepare_default_vet_role()
			role = "Vet Website Default"
			custom_role = True
		
		new_user = frappe.new_doc('User')
		new_user.update({
			'email': data_json.get('email'),
			'first_name': data_json.get('full_name'),
			'new_password': data_json.get('new_password'),
			'send_welcome_email': 0,
			#'roles': [{'role': role}]
		})
		new_user.insert()
		frappe.db.commit()
		
		has_role = frappe.new_doc('Has Role')
		has_role.update({'parent': new_user.name, 'parenttype': 'User', 'parentfield': 'roles', 'role': role})
		has_role.insert()
		frappe.db.commit()
		
		new_user.roles.append(has_role)
		new_user.save()
		frappe.db.commit()

		if custom_role:
			VetRoleUser = frappe.new_doc('VetRoleUser')
			VetRoleUser.update({'parent': data_json.get('role'), 'parenttype': 'VetRole', 'parentfield': 'users', 'user': new_user.name})
			VetRoleUser.insert()
			
			VetRole = frappe.get_doc('VetRole', data_json.get('role'))
			VetRole.users.append(VetRoleUser)
			VetRole.save()
			frappe.db.commit()
		
		users = filter(lambda u: u.name == new_user.name, get_users())
		return list(users)[0]
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def edit_user(data):
	try:
		data_json = json.loads(data)
		
		custom_role = False
		if data_json.get('role') == 'Staff' :
			role = frappe.get_value('Role', {'role_name': 'Staff'}, 'name')
		elif data_json.get('role') == 'Master':
			role = frappe.get_value('Role', {'role_name': 'System Manager'}, 'name')
		else:
			vet_default_role = frappe.get_list('Role', filters={'name': 'Vet Website Default'}, fields=['name'])
			if len(vet_default_role) == 0:
				prepare_default_vet_role()
			role = "Vet Website Default"
			custom_role = True
		
		user = frappe.get_doc('User', data_json.get('name'))
		if data_json.get('new_password') and data_json.get('new_password') != '':
			user.update({
				'email': data_json.get('email'),
				'first_name': data_json.get('full_name'),
				'new_password': data_json.get('new_password'),
				'roles': []
			})
		else:
			user.update({
				'email': data_json.get('email'),
				'first_name': data_json.get('full_name'),
				'roles': []
			})
		user.save()
		frappe.db.commit()
		
		has_role = frappe.new_doc('Has Role')
		has_role.update({'parent': user.name, 'parenttype': 'User', 'parentfield': 'roles', 'role': role})
		has_role.insert()
		frappe.db.commit()
		
		user.roles.append(has_role)
		user.save()
		frappe.db.commit()

		VetRoleUsers = frappe.get_list('VetRoleUser', filters={'user': user.name}, fields=['name'])
		for vrl in VetRoleUsers:
			frappe.delete_doc('VetRoleUser', vrl.name)
			frappe.db.commit()
		
		if custom_role:
			VetRoleUser = frappe.new_doc('VetRoleUser')
			VetRoleUser.update({'parent': data_json.get('role'), 'parenttype': 'VetRole', 'parentfield': 'users', 'user': user.name})
			VetRoleUser.insert()
			
			VetRole = frappe.get_doc('VetRole', data_json.get('role'))
			VetRole.users.append(VetRoleUser)
			VetRole.save()
			frappe.db.commit()
		        
		users = filter(lambda u: u.name == user.name, get_users())
		return list(users)[0]
	except PermissionError as e:
		return {'error': e}
    
@frappe.whitelist()
def set_settings(data):
    try:
        data_json = json.loads(data)
        filepath = os.path.dirname(os.path.realpath(__file__))
        
        fields = [
            ['pet_owner_name_format', 'VetPetOwner'],
            ['pet_name_format', 'VetPet'],
            ['customer_invoice_name_format', 'VetCustomerInvoice'],
            ['purchase_name_format', 'VetPurchase'],
            ['task_name_format', 'VetTask'],
            ['operation_name_format', 'VetOperation'],
            ['adjustment_name_format', 'VetAdjustment'],
            ['supplier_name_format', 'VetSupplier'],
            ['apotik_name_format', 'VetApotik'],
            ['rekam_medis_name_format', 'VetRekamMedis'],
            ['instalasi_medis_name_format', 'VetInstalasiMedis'],
            ['rawat_inap_name_format', 'VetRawatInap'],
        ]
        
        for f in fields:
            if data_json.get(f[0], False):
                path = '%s/vet_website/doctype/%s/%s.json'%(filepath,f[1].lower(),f[1].lower())
                edit_doctype_autoname(f[1], data_json.get(f[0]), path)
            
        return True
        
    except:
        return {'error': "Gagal membuat pemilik baru"}
        
def edit_doctype_autoname(doctype, value, filepath):
    print(doctype)
    frappe.db.set_value('DocType', doctype, 'autoname', value)
    frappe.db.commit()
    
    with open(filepath, 'r') as f:
        data = json.load(f)
        data["autoname"] = value
        f.close()
        
    with open(filepath, 'w') as f:
        json.dump(data, f, indent = 4)
        f.close()
        
    d = frappe.get_doc('DocType', doctype)
    d.reload()
    d.save()
    frappe.db.commit()
        
@frappe.whitelist()
def get_pos_data(name):
	payment_method_filter = {
		"filters": [
			['method_type', 'not in', ['Deposit Customer', 'Deposit Supplier']],
			# ['account', '!=', 'VC-104'],
			# ['account', '!=', '1-11102'],
		]
	}
	
	pos_order_filters = {
		"session": name
	}
	
	allCustomer = list(get_pet()['pet'])
	
	owner_no_pet = []
	owner_no_pet_search = frappe.get_list('VetPetOwner', filters={'name': ['not in', (p.parent for p in get_pet()['pet'])]}, fields=['nik', 'owner_name', 'phone', 'name'])
	for o in owner_no_pet_search:
		owner_no_pet.append({
			'pet_owner': o
		})
	
	data = {
		"session": frappe.get_doc("VetPosSessions", name),
		"orders": get_order_list(json.dumps(pos_order_filters)),
		"allProduct": get_product_list(),
		"allCustomer": allCustomer+owner_no_pet,
		"allPaymentMethod": get_payment_method_list(json.dumps(payment_method_filter)).get('list')
	}
	
	return data
	
@frappe.whitelist()
def ping():
	return True
	
@frappe.whitelist()
def get_current_datetime():
	tz = pytz.timezone("Asia/Jakarta")
	return dt.now(tz).strftime("%Y-%m-%d %H:%M:%S")
	
@frappe.whitelist()
def get_spending(name=False, name_type=False):
	customer_invoice_filters = []
	pos_order_filters = []
	
	if name and name_type == 'pet':
		customer_invoice_filters.append(['pet', '=', name])
		pos_order_filters.append(['pet', '=', name])
	elif name and name_type == 'pet_owner':
		customer_invoice_filters.append(['owner', '=', name])
		pos_order_filters.append(['pet_owner', '=', name])
		
	customer_invoice = frappe.db.get_list('VetCustomerInvoice', filters=customer_invoice_filters, fields=['name', 'invoice_date', 'owner_name', 'pet_name', 'total'])
	pos_order = frappe.db.get_list('VetPosOrder', filters=pos_order_filters, fields=['name', 'order_date', 'owner_name', 'pet_name', 'total'])
		
	return {'customer_invoice': customer_invoice, 'pos_order': pos_order}

@frappe.whitelist()	
def get_spending_separate(mode, filters=None):
	default_sort = "creation desc"
	order_filters = []
	filter_json = False
	
	if mode == 'invoice':
		field = 'invoice_date'
		doctype = 'VetCustomerInvoice'
	elif mode == 'order':
		field = 'order_date'
		doctype = 'VetPosOrder'
	
	if filters:
		try:
			filter_json = json.loads(filters)
		except:
			filter_json = False
		
	if filter_json:
		sort = filter_json.get('sort', False)
		filters_json = filter_json.get('filters', False)
		
		if filters_json:
			for fj in filters_json:
				if fj[0] == 'date':
					fj[0] = field
				order_filters.append(fj)
		if sort:
			sorts = sort.split(',')
			for s in sorts:
				s_words = s.split(' ')
				if s_words[0] == 'date':
					s_words[0] = field
			default_sort = ','.join(sorts)
			
	print(filters_json)
	print(order_filters)
			
	data = frappe.db.get_list(doctype, filters=order_filters, fields=['name', field, 'owner_name', 'pet_name', 'total'], order_by=default_sort)
	return data
	
@frappe.whitelist()
def get_migration_table():
	return {'master': [
            {'title': 'Pelanggan', 'doctype': 'VetPetOwner', 'link': '/main/penerimaan/data-pemilik'},
            {'title': 'Supplier', 'doctype': 'VetSupplier', 'link': '/main/purchases/suppliers'},
            {'title': 'Product', 'doctype': 'VetProduct', 'link': '/main/inventory/products'},
            {'title': 'Product Category', 'doctype': 'VetProductCategory', 'link': '/main/inventory/product-categories'},
            {'title': 'Product Tags', 'doctype': 'VetTag', 'link': '/main/inventory/product-tags'},
            {'title': 'UOM', 'doctype': 'VetUOM', 'link': '/main/inventory/unit-of-measure'},
            {'title': 'Jenis Hewan', 'doctype': 'VetPetType', 'link': '/main/settings/type-of-animals'},
            {'title': 'COA', 'doctype': 'VetCoa', 'link': '/main/accounting/chart-of-accounts'},
            {'title': 'Rekam Medis', 'doctype': 'VetRekamMedis', 'link': '/main/rekam-medis/rekam-medis'},
            {'title': 'Metode Pembayaran', 'doctype': 'VetPaymentMethod', 'link': '/main/kasir/payment-method'},
            {'title': 'Kandang', 'doctype': 'VetKandang', 'link': '/main/dokter-dan-jasa/kandang'},
            {'title': 'Gudang', 'doctype': 'VetGudang', 'link': '/main/inventory/warehouse'},
        ], 'computation': [
        	{'title': 'Stok Awal dan Valuasi', 'doctype': 'VetStockImport', 'link': '/main/inventory/inventory'},
        	{'title': 'Journal Awal', 'doctype': 'VetJournalImport', 'link': '/main/accounting/journal-entries'},
        	{'title': 'Deposit', 'doctype': 'VetDepositImport', 'link': '/main/kasir/deposit'},
        	{'title': 'Hutang Awal', 'doctype': 'VetHutangImport', 'link': '/main/purchases/hutang'},
        	{'title': 'Piutang Awal', 'doctype': 'VetPiutangImport', 'link': '/main/kasir/piutang'},
        ]}
        
@frappe.whitelist()
def new_migration_upload(data):
	try:
		doctype = "Data Import Beta" if beta else "Data Import"
		tz = pytz.timezone("Asia/Jakarta")
		now = dt.now(tz)
		now_str = dt.strftime(now, "%d%m%Y%H%M%S")
		data_json = json.loads(data)
		
		new_data_import = frappe.new_doc(doctype)
		new_data_import.reference_doctype = data_json.get('doctype')
		new_data_import.import_type = 'Insert New Records'
		
		if data_json.get("dataurl"):
			filename = now_str+"-"+data_json.get("filename")
			filedoc = save_file(filename, data_json.get("dataurl"), doctype, new_data_import.name, decode=True, is_private=0)
			new_data_import.update({"import_file": filedoc.file_url})
			
		new_data_import.insert()
		frappe.db.commit()
		
		if(data_json.get('doctype') == 'VetPetOwner'):
			pet_owner_name_format = frappe.db.get_value('DocType', 'VetPetOwner', 'autoname')
			pet_name_format = frappe.db.get_value('DocType', 'VetPet', 'autoname')
			setting_data = {'pet_owner_name_format': 'field:code', 'pet_name_format': 'field:code'}
			set_settings(json.dumps(setting_data))
		elif(data_json.get('doctype') == 'VetSupplier'):
			supplier_name_format = frappe.db.get_value('DocType', 'VetSupplier', 'autoname')
			setting_data = {'supplier_name_format': 'field:code',}
			set_settings(json.dumps(setting_data))
		
		# time.sleep(5)
		start_import(new_data_import.name)
		# time.sleep(5)
	
		if(data_json.get('doctype') == 'VetPetOwner'):
			setting_data = {'pet_owner_name_format': pet_owner_name_format, 'pet_name_format': pet_name_format}
			set_settings(json.dumps(setting_data))
		elif(data_json.get('doctype') == 'VetSupplier'):
			setting_data = {'supplier_name_format': supplier_name_format}
			set_settings(json.dumps(setting_data))
		
		new_data_import.reload()
		if data_json.get('doctype') == 'VetPiutangImport' and new_data_import.import_log:
			new_ci_names = []
			import_log_json = json.loads(new_data_import.import_log)
			for i in import_log_json:
				if i.get('success', False):
					new_customer_invoice_from_piutang_import(i.get('docname'))
		elif data_json.get('doctype') == 'VetHutangImport' and new_data_import.import_log:
			new_pu_names = []
			import_log_json = json.loads(new_data_import.import_log)
			for i in import_log_json:
				if i.get('success', False):
					new_purchase_from_hutang_import(i.get('docname'))
		elif data_json.get('doctype') == 'VetJournalImport' and new_data_import.import_log:
			new_name = []
			import_log_json = json.loads(new_data_import.import_log)
			for i in import_log_json:
				if i.get('success', False):
					new_name.append(i.get('docname'))
			je_names = new_journal_entry_from_journal_import(new_name)
			for name in je_names:
				journal_items = frappe.get_list('VetJournalItem', filters={'parent': name}, fields=['name', 'account'])
				for ji in journal_items:
					set_journal_item_total(ji.name, ji.account)
		elif data_json.get('doctype') == 'VetDepositImport' and new_data_import.import_log:
			import_log_json = json.loads(new_data_import.import_log)
			for i in import_log_json:
				if i.get('success', False):
					new_owner_credit_from_deposit_import(i.get('docname'))
		elif data_json.get('doctype') == 'VetStockImport' and new_data_import.import_log:
			new_name = []
			import_log_json = json.loads(new_data_import.import_log)
			for i in import_log_json:
				if i.get('success', False):
					new_name.append(i.get('docname'))
			new_initial_stock_from_stock_import(new_name)
		
		return {'import': new_data_import}
	except:
		return {'error': 'Gagal mengupload data'}
	
@frappe.whitelist()
def get_data_import(name):
	try:
		doctype = "Data Import Beta" if beta else "Data Import"
		data_import = frappe.get_doc(doctype, name)
		return {'import': data_import}
	except:
		return {'error': 'Gagal mengambil data'}
		
def new_customer_invoice_from_piutang_import(piutang_import_name):
	try:
		piutang_import = frappe.get_doc('VetPiutangImport', piutang_import_name)
		pet_owner = frappe.get_doc('VetPetOwner', piutang_import.pet_owner)
		pet_name = False
		pet = frappe.get_list('VetPet', filters={'parent': piutang_import.pet_owner}, fields=['name'])
		if len(pet) == 0:
			new_pet_doc = new_pet(pet_owner.name)
			pet_owner.pets.append(new_pet_doc)
			pet_owner.save()
			frappe.db.commit()
			pet_name = new_pet_doc.name
		else:
			pet_name = pet[0].name
			
		product_name = False
		product = frappe.get_list('VetProduct', filters={'name': 'HPA'}, fields=['name'])
		if len(product) == 0:
			new_product_doc = new_product()
			product_name = new_product_doc.name
		else:
			product_name = product[0].name
		
		new_ci_data = {
			'pet': pet_name,
			'invoice_date': get_current_datetime(),
			'invoice_line': [
				{
					'product': product_name,
					'quantity': 1,
					'unit_price': piutang_import.nominal,
					'service': 'Jasa'
				}
			],
			'already_refund': 1,
			'subtotal': piutang_import.nominal,
			'total': piutang_import.nominal,
			'status': 'Open'
		}
			
		new_ci = frappe.new_doc('VetCustomerInvoice')
		new_ci.update(new_ci_data)
		new_ci.insert()
		frappe.db.commit()
		
		return new_ci
		# return True
	except:
		return {'error': 'Gagal membuat piutang customer invoice'}
		
def new_purchase_from_hutang_import(hutang_import_name):
	try:
		tz = pytz.timezone("Asia/Jakarta")
		hutang_import = frappe.get_doc('VetHutangImport', hutang_import_name)
			
		product_name = False
		uom_name = False
		product = frappe.get_list('VetProduct', filters={'name': 'HPA'}, fields=['name', 'product_uom'])
		if len(product) == 0:
			new_product_doc = new_product()
			product_name = new_product_doc.name
			uom_name = new_product_doc.product_uom
		else:
			product_name = product[0].name
			uom_name = product[0].product_uom
		
		new_pu_data = {
			'order_date': dt.now(tz).strftime('%Y-%m-%d'),
			'supplier': hutang_import.supplier,
			'first_action': 'Receive',
			'status': 'Receive',
			'already_refund': 1,
			'products': [
				{
					'product': product_name,
					'quantity': 1,
					'quantity_receive': 1,
					'uom': uom_name,
					'price': hutang_import.nominal,
				}
			]
		}
			
		new_pu = frappe.new_doc('VetPurchase')
		new_pu.update(new_pu_data)
		new_pu.insert()
		frappe.db.commit()
		return new_pu
		# return True
	except:
		return {'error': 'Gagal membuat hutang purchase'}

def new_journal_entry_from_journal_import(journal_import_names):
	try:
		journal_entry_names = []
		journal_name = False
		journal = frappe.get_list('VetJournal', filters={'code': 'OPJ', 'journal_name': 'Opening Journal'}, fields=['name'])
		if len(journal) == 0:
			new_journal_doc = frappe.new_doc('VetJournal')
			new_journal_doc.update({'code': 'OPJ', 'journal_name': 'Opening Journal'})
			new_journal_doc.insert()
			frappe.db.commit()
			journal_name = new_journal_doc.name
		else:
			journal_name = journal[0].name
		
		new_je_data = []
		for ji_name in journal_import_names:
			journal_import = frappe.get_doc('VetJournalImport', ji_name)
			print(journal_import.date)
			print(type(journal_import.date))
			if len(new_je_data) == 0:
				new_je_data.append({
					'journal': journal_name,
					'date': journal_import.date,
					'period': journal_import.date.strftime('%m/%Y'),
					'status': 'Posted',
					'journal_items': [
						{
							'account': journal_import.account,
							'credit': journal_import.credit,
							'debit': journal_import.debit,
						}
					]
				})
			else:
				appended = False
				print(new_je_data)
				for je_data in new_je_data:
					if journal_import.date == je_data.get('date') and not appended:
						je_data.get('journal_items').append({
							'account': journal_import.account,
							'credit': journal_import.credit,
							'debit': journal_import.debit,
						})
						appended = True
				if not appended:
					new_je_data.append({
						'journal': journal_name,
						'date': journal_import.date,
						'period': journal_import.date.strftime('%m/%Y'),
						'status': 'Posted',
						'journal_items': [
							{
								'account': journal_import.account,
								'credit': journal_import.credit,
								'debit': journal_import.debit,
							}
						]
					})
		print(new_je_data)
		for je_data in new_je_data:
			new_je = frappe.new_doc('VetJournalEntry')
			new_je.update(je_data)
			new_je.insert()
			frappe.db.commit()
			journal_entry_names.append(new_je.name)
		print(journal_entry_names)
		
		return journal_entry_names
	except:
		return {'error': 'Gagal membuat journal entry'}
		
def new_owner_credit_from_deposit_import(di_name):
	try:
		deposit_import = frappe.get_doc('VetDepositImport', di_name)
		data = {
			'date': deposit_import.date,
			'type': 'Payment',
			'nominal': deposit_import.nominal,
			'pet_owner': deposit_import.pet_owner,
			'status': 'Done',
			'is_deposit': 1
		}
		new_owner_credit = frappe.new_doc('VetOwnerCredit')
		new_owner_credit.update(data)
		new_owner_credit.insert()
		frappe.db.commit()
		
		set_owner_credit_total(deposit_import.pet_owner)
	
		return new_owner_credit
	except:
		return {'error': 'Gagal menambah deposit'}
		
def new_initial_stock_from_stock_import(si_names):
	try:
		new_si_data = []
		for si_name in si_names:
			stock_import = frappe.get_doc('VetStockImport', si_name)
			product_uom = frappe.db.get_value('VetProduct', stock_import.product, 'product_uom')
			if len(new_si_data) == 0:
				new_si_data.append({
					'order_date': stock_import.date,
					'deliver_to': stock_import.warehouse,
					'status': 'Done',
					'already_refund': 1,
					'first_action': 'Receive',
					'products': [{
						'product': stock_import.product,
						'quantity': stock_import.quantity,
						'uom': product_uom,
						'price': stock_import.value,
						'quantity_receive': stock_import.quantity,
						'quantity_stocked': stock_import.quantity,
					}]
				})
			else:
				appended = False
				print(new_si_data)
				for si_data in new_si_data:
					if stock_import.date == si_data.get('order_date') and stock_import.warehouse == si_data.get('deliver_to') and not appended:
						si_data.get('products').append({
							'product': stock_import.product,
							'quantity': stock_import.quantity,
							'uom': product_uom,
							'price': stock_import.value,
							'quantity_receive': stock_import.quantity,
							'quantity_stocked': stock_import.quantity,
						})
						appended = True
				if not appended:
					new_si_data.append({
					'order_date': stock_import.date,
					'deliver_to': stock_import.warehouse,
					'status': 'Done',
					'already_refund': 1,
					'first_action': 'Receive',
					'products': [{
						'product': stock_import.product,
						'quantity': stock_import.quantity,
						'uom': product_uom,
						'price': stock_import.value,
						'quantity_receive': stock_import.quantity,
						'quantity_stocked': stock_import.quantity,
					}]
				})
		po_names = []
		for si_data in new_si_data:
			new_si_purchase = frappe.new_doc('VetPurchase')
			new_si_purchase.update(si_data)
			new_si_purchase.insert()
			frappe.db.commit()
			po_names.append(new_si_purchase.name)
		
		for name in po_names:
			purchase = frappe.get_doc('VetPurchase', name)

			operation = frappe.new_doc("VetOperation")
			operation.update({
				'reference': purchase.name,
				'to': purchase.deliver_to,
				'date': purchase.order_date,
				'status': 'Done',
			})
			operation.insert()
			frappe.db.commit()
			operation.reload()

			gudang = frappe.db.get_value('VetPurchase', name, 'deliver_to')
			purchase_products = frappe.get_list('VetPurchaseProducts', filters={'parent': name}, fields=['*'])
			for product in purchase_products:
				new_move = frappe.new_doc("VetOperationMove")
				new_move.update({
					'parent': operation.name,
					'parenttype': 'VetOperation',
					'parentfield': 'moves',
					'product': product.product,
					'product_uom': product.uom,
					'quantity': product.quantity,
					'quantity_done': product.quantity,
					'date': purchase.order_date,
					'receive_date': purchase.order_date,
				})

				operation.moves.append(new_move)
				operation.save()
				frappe.db.commit()

				new_product_quantity = frappe.new_doc('VetProductQuantity')
				new_product_quantity.update({
					'product': product.product,
					'quantity': product.quantity,
					'gudang': gudang,
					'inventory_value': product.price,
				})
				new_product_quantity.insert()
				frappe.db.commit()
		
		return po_names
	except:
		return {'error': 'Gagal menambah stock awal'}
	
def new_pet_category():
	income_account = frappe.get_list('VetCoa', filters={'name', ['in', ['VC-240', '4-20001']]}, fields=['name'])
	new_pet_category_doc = frappe.new_doc('VetPetType')
	new_pet_category_doc.update({'type_name': 'Lain-lain', 'income_account': income_account[0].name})
	new_pet_category_doc.insert()
	frappe.db.commit()
	
	return new_pet_category_doc

def new_pet(parent):
	pet_category_name = False
	pet_category = frappe.get_list('VetPetType', fields=['name'])
	if len(pet_category) == 0:
		new_pet_category_doc = new_pet_category()
		pet_category_name = new_pet_category_doc.name
	else:
		pet_category_name = pet_category[0].name
		
	new_pet_doc = frappe.new_doc('VetPet')
	new_pet_doc.update({
		'pet_name': 'Default',
		'hewan_jenis': pet_category_name,
		'register_date': get_current_datetime(),
		'parent': parent,
		'parenttype': 'VetPetOwner',
		'parentfield': 'pets'
	})
	new_pet_doc.insert()
	frappe.db.commit()
	
	return new_pet_doc
	
def new_product_category():
	new_product_category_doc = frappe.new_doc('VetProductCategory')
	new_product_category_doc.update({'category_name': 'Hutang-Piutang Awal'})
	new_product_category_doc.insert()
	frappe.db.commit()
	
	return new_product_category_doc
	
def new_uom():
	new_uom_doc = frappe.new_doc('VetUOM')
	new_uom_doc.update({'uom_name': 'Hutang-Piutang'})
	new_uom_doc.insert()
	frappe.db.commit()
	
	return new_uom_doc
	
def new_product():
	product_category_name = False
	uom_name = False
	product_category = frappe.get_list('VetProductCategory', filters={'name': 'Hutang-Piutang Awal'}, fields=['name'])
	uom = frappe.get_list('VetUOM', filters={'name': 'Hutang-Piutang'}, fields=['name'])
	if len(product_category) == 0:
		new_product_category_doc = new_product_category()
		product_category_name = new_product_category_doc.name
	else:
		product_category_name = product_category[0].name
		
	if len(uom) == 0:
		new_uom_doc = new_uom()
		uom_name = new_uom_doc.name
	else:
		uom_name = uom[0].name
		
	new_product_doc = frappe.new_doc('VetProduct')
	new_product_doc.update({
		'default_code': 'HPA',
		'product_name': 'Hutang-Piutang Awal',
		'product_uom': uom_name,
		'product_category': product_category_name
	})
	new_product_doc.insert()
	frappe.db.commit()
	
	return new_product_doc
	
@frappe.whitelist(allow_guest=True)
def get_current_user():
	roles = frappe.get_list('Has Role', filters={'parent': frappe.session.user}, fields=['role'])
	vet_roles = frappe.get_list('VetRoleUser', filters={'user': frappe.session.user}, fields=['parent'])
	for vr in vet_roles:
		vr['role'] = frappe.get_value('VetRole', vr.parent, 'role_name')
		vr['permissions'] = frappe.get_list('VetRolePermission', filters={'parent': vr.parent}, fields=['*'])
	roles += vet_roles
	return {'name': frappe.session.user, 'full_name': frappe.db.get_value('User', frappe.session.user, 'full_name'), 'roles': roles}
	
@frappe.whitelist()
def get_current_session():
	session_search = frappe.get_list('VetPosSessions', filters={'status': 'In Progress'}, fields=['name'])
	if len(session_search) > 0:
		return session_search[0].name
	else:
		return False
		
@frappe.whitelist()
def get_current_session_user():
	return {'current_session': get_current_session(), 'user': get_current_user()}
	
@frappe.whitelist()
def get_roles(filters=None):
	default_sort = "name asc"
	td_filters = []
	td_or_filters = []
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
				td_filters.append(fj)

		if search:
			td_or_filters.append({'role_name': ['like', '%'+search+'%']})
			td_or_filters.append({'description': ['like', '%'+search+'%']})
		
		if sort:
			default_sort = sort
	
	try:
		roles = frappe.get_list("VetRole", or_filters=td_or_filters, filters=td_filters, fields=["*"], order_by=default_sort, start=(page - 1) * 10, page_length= 10)
		datalength = len(frappe.get_list("VetRole", or_filters=td_or_filters, filters=td_filters, as_list=True))
		for r in roles:
			r['permissions'] = frappe.get_list('VetRolePermission', filters=[['parent', '=', r.name]], fields=['*'], order_by="doctype_table asc")
			
		return {'roles': roles, 'datalength': datalength}
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def get_role_form():
	doctype = frappe.get_list('DocType', fields=['name'], filters=[['name', 'like', 'Vet%'],['istable', '=', 0]], order_by='name asc')
	extra_permission = [
		{'name': 'VetPetOwner','extra_permission': ['decease']},
		{'name': 'VetTindakanDokter','extra_permission': ['lanjut', 'batalkan']},
		{'name': 'VetGrooming','extra_permission': ['lanjut','proses']},
		{'name': 'VetInstalasiMedis','extra_permission': ['lanjut', 'batalkan']},
		{'name': 'VetRawatInap','extra_permission': ['tambah tindakan', 'pulang']},
		{'name': 'VetApotik','extra_permission': ['lanjut', 'batalkan']},
		{'name': 'VetCustomerInvoice','extra_permission': ['cancel', 'refund']},
		{'name': 'VetPosOrder','extra_permission': ['refund']},
		{'name': 'VetOwnerCredit','extra_permission': ['proses']},
		{'name': 'VetPurchase','extra_permission': ['cancel', 'receive', 'refund']},
		{'name': 'VetOperation','extra_permission': ['kirim', 'terima']},
		{'name': 'VetAdjustment','extra_permission': ['cancel', 'validate']},
		{'name': 'VetAsset','extra_permission': ['sell/dispose']},
		{'name': 'VetExpenses','extra_permission': ['reject','approve']},
	]
	for d in doctype:
		try:
			d['extra_permission'] = list(filter(lambda e: e.get('name') == d.name, extra_permission))[0].get('extra_permission')
		except IndexError:
			d['extra_permission'] = []
	return {'doctype': doctype}
	
@frappe.whitelist()
def new_role(data):
	try:
		data_json = json.loads(data)
		
		new_role = frappe.new_doc('VetRole')
		new_role.update({
			'role_name': data_json.get('role_name'),
			'is_dokter': data_json.get('is_dokter', False),
		})
		
		new_role.insert()
		frappe.db.commit()
		
		permissions = data_json.get('permissions', [])
		for perm in permissions:
			extra_permission = ",".join(perm.get('extra_permission', []))
			new_perm = frappe.new_doc("VetRolePermission")
			new_perm.update({
				'create': perm.get('create'),
				'delete': perm.get('delete'),
				'read': perm.get('read'),
				'write': perm.get('write'),
				'doctype_table': perm.get('doctype_table'),
				'extra_permission': extra_permission,
				'parent': new_role.name,
				'parentfield': 'permissions',
				'parenttype': "VetRole",
			})
			new_perm.insert()
			frappe.db.commit()
		
		new_roles = frappe.get_list("VetRole", filters=[['name', '=', new_role.name]], fields=["*"])
		new_role = new_roles[0]
		new_role['permissions'] = frappe.get_list('VetRolePermission', filters=[['parent', '=', new_role.name]], fields=['*'])
		
		return new_role
		
	except PermissionError as e:
		return {'error': e}
		
def prepare_default_vet_role():
	doctype = frappe.get_list('DocType', fields=['name'], filters=[['name', 'like', 'Vet%'],['istable', '=', 0]], order_by='name asc')
	additional_doctype = ['Version', 'User']
	
	new_role = frappe.new_doc('Role')
	new_role.update({
		'role_name': "Vet Website Default",
		'desk_access': 0,
	})
	
	new_role.insert()
	frappe.db.commit()
	
	for doc in doctype:
		custom_docperm = frappe.new_doc("Custom DocPerm")
		custom_docperm.update({
			'create': 1,
			'delete': 1,
			'read': 1,
			'write': 1,
			'parent': doc.name,
			'parentfield': 'permissions',
			'parenttype': "DocType",
			'role': "Vet Website Default",
		})
		custom_docperm.insert()
		frappe.db.commit()
		
	for ad in additional_doctype:
		custom_docperm = frappe.new_doc("Custom DocPerm")
		custom_docperm.update({
			'create': 0,
			'delete': 0,
			'read': 1,
			'write': 0,
			'parent': ad,
			'parentfield': 'permissions',
			'parenttype': "DocType",
			'role': "Vet Website Default",
		})
		custom_docperm.insert()
		frappe.db.commit()
		
@frappe.whitelist()
def edit_role(data):
	try:
		data_json = json.loads(data)
		
		edit_role = frappe.get_doc('VetRole', data_json.get('name'))
		edit_role.update({
			'role_name': data_json.get('role_name'),
			'is_dokter': data_json.get('is_dokter'),
		})
		
		edit_role.save()
		frappe.db.commit()
		
		permissions = data_json.get('permissions', [])
		for perm in permissions:
			extra_permission = ",".join(perm.get('extra_permission', []))
			if(perm.get('name')):
				if perm.get('deleted'):
					frappe.delete_doc('VetRolePermission', perm.get('name'))
					frappe.db.commit()
					
				else:
					new_perm = frappe.get_doc("VetRolePermission", perm.get('name'))
					new_perm.update({
						'create': perm.get('create'),
						'delete': perm.get('delete'),
						'read': perm.get('read'),
						'write': perm.get('write'),
						'extra_permission': extra_permission,
					})
					new_perm.save()
					frappe.db.commit()
			else:
				new_perm = frappe.new_doc("VetRolePermission")
				new_perm.update({
					'create': perm.get('create'),
					'delete': perm.get('delete'),
					'read': perm.get('read'),
					'write': perm.get('write'),
					'extra_permission': extra_permission,
					'doctype_table': perm.get('doctype_table'),
					'parent': edit_role.get('name'),
					'parentfield': 'permissions',
					'parenttype': "VetRole",
				})
				new_perm.insert()
				frappe.db.commit()
		
		new_roles = frappe.get_list("VetRole", filters=[['name', '=', edit_role.name]], fields=["*"])
		new_role = new_roles[0]
		new_role['permissions'] = frappe.get_list('VetRolePermission', filters=[['parent', '=', edit_role.name]], fields=['*'])
		
		return new_role
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def toggle_roles(data, enable=False):
	try:
		value = 1 if not enable else 0
		data_json = json.loads(data)
		for d in data_json:
			frappe.db.set_value('Role', d, 'disabled', value)
			frappe.db.commit()
	except:
		return {'error': "Gagal mengubah Roles"}
		
	return {'success': True}

@frappe.whitelist()
def get_list_year():
	try:
		tz = pytz.timezone("Asia/Jakarta")
		first_year = 2010
		first_je = frappe.get_list("VetJournalEntry", fields=["date"], order_by="date asc", page_length=1)
		if first_je:
			first_year_dt = first_je[0]['date'].strftime('%Y'),
			first_year = int(first_year_dt[0])
			print(first_year)
		now_year = dt.now(tz).today().year

		return range(now_year + 1, now_year - ((now_year - first_year) + 1), -1)
	except:
		return {'error': "Gagal mengambil list tahun"}

# @frappe.whitelist()
# def run_every_two_mins():
# 	try:
# 		print('udah lima menit nih')
		
# 		return True
# 	except:
# 		return {'error': "Gagal mengambil list tahun"}
