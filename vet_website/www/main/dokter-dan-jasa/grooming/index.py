import frappe

def get_context(context):
	# context.no_cache = True
	if frappe.session.user == 'Guest':
		frappe.local.flags.redirect_location = frappe.utils.get_url('/login')
		raise frappe.Redirect
	# default_sort = "reception_date desc"
	# filters={}

	# if frappe.form_dict:
	# 	search = frappe.form_dict.search
	# 	sort = frappe.form_dict.sort
	# 	if search:
	# 		pets = filters.update({'reception': ['like', '%'+search+'%']})
	# 		context.search = search
	# 	if sort:
	# 		default_sort = sort
	# 	context.sort = sort

	# 	min_date = frappe.form_dict.min_date
	# 	max_date = frappe.form_dict.max_date

	# 	if min_date:
	# 		filters.update({'reception_date': ['>=', min_date]})
	# 		context.min_date = min_date
	# 	if max_date:
	# 		filters.update({'reception_date': ['<=', max_date]})
	# 		context.max_date = max_date

	# 	if min_date and max_date:
	# 		filters.update({'reception_date': ['between', [min_date, max_date]]})

	# context.sorts = [
	# 				{'label': 'Tanggal pendaftaran DESC', 'sort': 'reception_date desc'},
	# 				{'label': 'Tanggal pendaftaran ASC', 'sort': 'reception_date asc'},
	# 				{'label': 'No Antrian DESC', 'sort': 'name desc'},
	# 				{'label': 'No Antrian ASC', 'sort': 'name asc'},
	# 				]

	# context.grooming = frappe.get_list("VetGrooming", filters=filters, fields=["reception", "reception_date", "pet", "pet_name", "description", "status", "name"], order_by=default_sort)

	return context