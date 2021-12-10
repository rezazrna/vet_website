import frappe
from datetime import datetime as dt

def get_context(context):
	context.no_cache = True
	if frappe.session.user == 'Guest':
		frappe.local.flags.redirect_location = frappe.utils.get_url('/login')
		raise frappe.Redirect
	# filters = {}
	# default_sort = 'register_date desc'

	# if frappe.form_dict:
	# 	search = frappe.form_dict.search
	# 	sort = frappe.form_dict.sort
	# 	if search:
	# 		filters.update({'pet_name': ['like', '%'+search+'%']})
	# 		context.search = search
	# 	if sort:
	# 		default_sort = sort
	# 	context.sort = sort

	# 	min_date = frappe.form_dict.min_date
	# 	max_date = frappe.form_dict.max_date

	# 	if min_date:
	# 		filters.update({'register_date': ['>=', min_date]})
	# 		context.min_date = min_date
	# 	if max_date:
	# 		filters.update({'register_date': ['<=', max_date]})
	# 		context.max_date = max_date

	# 	if min_date and max_date:
	# 		filters.update({'register_date': ['between', [min_date, max_date]]})

	# context.sorts = [
	# 				{'label': 'Tanggal registrasi DESC', 'sort': 'register_date desc'},
	# 				{'label': 'Tanggal registrasi ASC', 'sort': 'register_date asc'},
	# 				{'label': 'NIP DESC', 'sort': 'name desc'},
	# 				{'label': 'NIP ASC', 'sort': 'name asc'},
	# 				{'label': 'Nama pasien DESC', 'sort': 'pet_name desc'},
	# 				{'label': 'Nama pasien ASC', 'sort': 'pet_name asc'},
	# 				]
	# context.pets = frappe.get_list("VetPet", filters=filters, fields=["pet_name", "name", "parent"], order_by=default_sort)

	return context