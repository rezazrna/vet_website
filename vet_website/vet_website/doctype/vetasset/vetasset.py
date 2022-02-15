# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
from frappe.model.document import Document
from dateutil.relativedelta import relativedelta
from datetime import datetime
from vet_website.vet_website.doctype.vetjournalentry.vetjournalentry import new_journal_entry

class VetAsset(Document):
	pass

@frappe.whitelist()
def get_asset_list(filters=None):
	default_sort = "creation desc"
	asset_filters = []
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
				asset_filters.append(fj)
		
		if search:
			asset_filters.append({'asset_name': ['like', '%'+search+'%']})
		
		if sort:
			default_sort = sort
	
	try:
		asset = frappe.get_list("VetAsset", filters=asset_filters, fields=["*"], order_by=default_sort, start=(page - 1) * 10, page_length= 10)
		datalength = len(frappe.get_all("VetAsset", filters=asset_filters, as_list=True))
		for a in asset:
			a['first_depreciation_date'] = frappe.get_value('VetDepreciationList', {'parent': a['name']}, 'depreciation_date')
		
		return {'asset': asset, 'datalength': datalength}
		
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def delete_asset(data):
	try:
		data_json = json.loads(data)
	except:
		return {'error': "Gagal menghapus asset"}
	
	for d in data_json:
		frappe.delete_doc('VetAsset', d)
		frappe.db.commit()
		
	return {'success': True}
	
@frappe.whitelist()
def get_asset(name=None):
	try:
		if name == False or name == None:
			asset = {}
		else:
			asset_search = frappe.get_list("VetAsset", filters={'name': name}, fields=['*'])
			asset = asset_search[0]
			
			depreciation_list = frappe.get_list('VetDepreciationList', filters={'parent': asset['name']}, fields=['*'])
			asset['depreciation_list'] = depreciation_list
		    
		coaAll = frappe.get_list('VetCoa', fields=['*'])
		
		res = {'asset': asset, 'coaAll': coaAll}
		    
		return res
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def submit_asset(data):
	try:
		data_json = json.loads(data)
		
		if data_json.get('name') :
			asset = frappe.get_doc("VetAsset", data_json['name'])
			asset.update(data_json)
			asset.save()
			
		else :
			asset = frappe.new_doc("VetAsset")
			asset.update(data_json)
			asset.insert()
			
			journal_entry =  {
				'date': data_json.get('acquistion_date'),
				'journal': '8137c6f684',
				'period': data_json.get('period'),
				'reference': asset.name,
				'journal_items': [
					{'account': asset.payment_account, 'credit': data_json.get('original_value')},
					{'account': asset.fixed_asset_account, 'debit': data_json.get('original_value')},
				]
			}
			
			new_journal_entry(json.dumps(journal_entry))
			
		acquistion_date = datetime.strptime(data_json.get('acquistion_date'), "%Y-%m-%d")
		if data_json.get('duration_type') == 'Year' :
			duration = float(data_json.get('duration')) * 12
		else :
			duration = float(data_json.get('duration'))
			
		original_value = float(data_json.get('original_value')) - float(data_json.get('residual_value'))
			
		depreciation_value = original_value / duration
		
		r = relativedelta(datetime.today(), acquistion_date)
		
		book_value = float(data_json.get('original_value')) - (float(r.months + (12 * r.years)) * depreciation_value)
		
		if not data_json.get('name') or (data_json.get('name') and float(asset.book_value) != float(book_value)):
			if (data_json.get('name')):
				frappe.db.delete('VetDepreciationList', {
				    'parent': asset.name
				})
				
				list_journal = frappe.get_list('VetJournalEntry', filters={'reference': asset.name, 'date': ['!=', data_json.get('acquistion_date')]}, fields=['name'])
				journal = [i['name'] for i in list_journal]
				
				frappe.db.delete('VetJournalItem', {
				    'parent': ['in', journal]
				})
				
				frappe.db.delete('VetJournalEntry', {
					'name': ['in', journal]
				})
				
			asset.book_value = book_value
			asset.save()
			asset.reload()
			
			i = 1
			while acquistion_date + relativedelta(months=i) <= datetime.today() and i <= duration:
				new_depreciation = frappe.new_doc('VetDepreciationList')
				new_depreciation.update({
					'reference': data_json.get('asset_name') + ' ' + '(' + str(i) + '/' + str(int(duration)) + ')',
					'depreciation_date': acquistion_date + relativedelta(months=i),
					'depreciation_value': depreciation_value,
					'cumulative_depreciation': depreciation_value * i,
					'parent': asset.name, 
					'parenttype': 'VetAsset', 
					'parentfield': 'depreciation_list'
				})
				asset.depreciation_list.append(new_depreciation)
				asset.save()
				
				journal_entry_despreciation =  {
					'date': (acquistion_date + relativedelta(months=i)).strftime('%Y-%m-%d'),
					'journal': '8137c6f684',
					'period': data_json.get('period'),
					'reference': asset.name,
					'journal_items': [
						{'account': asset.depreciation_account, 'credit': depreciation_value},
						{'account': asset.expense_account, 'debit': depreciation_value},
					]
				}
				
				new_journal_entry(json.dumps(journal_entry_despreciation))
				
				i = i+1
				
		return {'asset': asset}

	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def sell_asset(data):
	try:
		data_json = json.loads(data)
		
		asset = frappe.get_doc('VetAsset', data_json.get('name'))
		asset.status = 'Sell/Dispose'
		
		new_depreciation = frappe.new_doc('VetDepreciationList')
		new_depreciation.update({
			'reference': 'Sell/Dispose',
			'depreciation_date': datetime.today(),
			'depreciation_value': float(asset.book_value) - float(data_json.get('amount')),
			'cumulative_depreciation': data_json.get('amount'),
			'parent': asset.name, 
			'parenttype': 'VetAsset', 
			'parentfield': 'depreciation_list'
		})
		asset.depreciation_list.append(new_depreciation)
		asset.save()
				
		asset.save()
		frappe.db.commit()
		
		ji_list = [
			{'account': asset.depreciation_account, 'debit': (float(asset.original_value) - float(asset.book_value))},
			{'account': asset.fixed_asset_account, 'credit': float(asset.original_value)},
			{'account': data_json.get('cash_account'), 'debit': float(data_json.get('amount'))},
		]
		
		if float(data_json.get('amount')) - float(asset.book_value) != 0 :
			if float(data_json.get('amount')) - float(asset.book_value) > 0 :
				ji_list.append(
					{'account': data_json.get('lost_account'), 'credit': float(data_json.get('amount')) - float(asset.book_value)},
				)
			else :
				ji_list.append(
					{'account': data_json.get('lost_account'), 'debit': float(asset.book_value) - float(data_json.get('amount'))},
				)
		
		journal_entry =  {
			'date': datetime.today().strftime('%Y-%m-%d'),
			'journal': '8137c6f684',
			'period': asset.period.strftime('%m/%Y'),
			'reference': asset.name,
			'journal_items': ji_list
		}
		
		new_journal_entry(json.dumps(journal_entry))
				
		return {'asset': asset}

	except PermissionError as e:
		return {'error': e}