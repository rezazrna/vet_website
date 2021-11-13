import frappe
from datetime import datetime as dt

def get_context(context):
	# context.no_cache = True
	context.title = "Pemilik Baru"
	filters = {}
	if frappe.form_dict:
		n = frappe.form_dict.n
		
		if n:
			filters.update({'name': n})
	
	context.mode = "Edit Pet"
	context.pet_owner = frappe.get_list("VetPetOwner", filters=filters, fields=["owner_name", "name"])
	if n and len(context.pet_owner) != 0:
		context.title = "Data Pemilik / "+context.pet_owner[0].owner_name
	

	return context