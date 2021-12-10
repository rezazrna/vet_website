import frappe

def get_context(context):
	context.no_cache = True
	if frappe.session.user == 'Guest':
		frappe.local.flags.redirect_location = frappe.utils.get_url('/login')
		raise frappe.Redirect
	# filters = {}
	# default_sort = "reception_date desc"

	# if frappe.form_dict:
	# 	search = frappe.form_dict.search
	# 	sort = frappe.form_dict.sort
	# 	if search:
	# 		pets = frappe.get_list("VetPet", filters={'pet_name': ['like', '%'+search+'%']}, fields=['name'])
	# 		names = []
	# 		for pet in pets:
	# 			names.append(pet.name)
	# 		print(names)
	# 		filters.update({'pet': ['in', names]})
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

	# context.receptions = frappe.get_list("VetReception", filters=filters, fields=["reception_date", "description", "name", "pet", "owner", "service"], order_by=default_sort)
	
	return context