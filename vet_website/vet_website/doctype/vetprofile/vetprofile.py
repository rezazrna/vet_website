# -*- coding: utf-8 -*-
# Copyright (c) 2022, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
import pytz
from frappe.utils.file_manager import save_file
from datetime import datetime as dt
from frappe.model.document import Document

class VetProfile(Document):
	pass

@frappe.whitelist()
def get_profile():
	try:
		profile = frappe.get_doc("VetProfile")
		return {'profile': profile}
	except PermissionError as e:
		return {'error': e}
		
@frappe.whitelist()
def edit_profile(data):
	tz = pytz.timezone("Asia/Jakarta")
	now = dt.now(tz)
	now_str = dt.strftime(now, "%d%m%Y%H%M%S")
	
	try:
		data_json = json.loads(data)
		
		if data_json.get('name'):
			profile = frappe.get_doc("VetProfile", data_json.get('name'))
			profile.clinic_name =  data_json.get('clinic_name', profile.clinic_name)
			profile.phone =  data_json.get('phone', profile.phone)
			profile.address =  data_json.get('address', profile.address)
			
			if data_json.get("dataurl"):
				filename = now_str+"-"+data_json.get("filename")
				filedoc = save_file(filename, data_json.get("dataurl"), "VetProfile", profile.name, decode=True, is_private=0)
				filedoc.make_thumbnail()
				profile.update({"image": filedoc.file_url})
			
			profile.save()
			
			frappe.db.commit()
		else:
			profile_data = {}
			profile_data.update(data_json)
			
			profile = frappe.new_doc('VetProfile')
			profile.update(profile_data)
			
			if data_json.get("dataurl"):
				filename = now_str+"-"+data_json.get("filename")
				filedoc = save_file(filename, data_json.get("dataurl"), "VetProfile", profile.name, decode=True, is_private=0)
				filedoc.make_thumbnail()
				profile.update({"image": filedoc.file_url})
				
			profile.insert()
				
			frappe.db.commit()
		
		return {'profile': profile}
	except PermissionError as e:
		return {'error': e}