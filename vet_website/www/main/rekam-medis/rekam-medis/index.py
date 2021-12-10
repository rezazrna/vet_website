import frappe

def get_context(context):
	context.no_cache = True
	if frappe.session.user == 'Guest':
		frappe.local.flags.redirect_location = frappe.utils.get_url('/login')
		raise frappe.Redirect
	# default_sort = "record_date desc"
	# filters={}

	# if frappe.form_dict:
	# 	search = frappe.form_dict.search
	# 	sort = frappe.form_dict.sort
	# 	if search:
	# 		pets = filters.update({'register_number': ['like', '%'+search+'%']})
	# 		context.search = search
	# 	if sort:
	# 		default_sort = sort
	# 	context.sort = sort

	# 	min_date = frappe.form_dict.min_date
	# 	max_date = frappe.form_dict.max_date

	# 	if min_date:
	# 		filters.update({'record_date': ['>=', min_date]})
	# 		context.min_date = min_date
	# 	if max_date:
	# 		filters.update({'record_date': ['<=', max_date]})
	# 		context.max_date = max_date

	# 	if min_date and max_date:
	# 		filters.update({'record_date': ['between', [min_date, max_date]]})

	# context.sorts = [
	# 				{'label': 'Tanggal Rekam Medis DESC', 'sort': 'record_date desc'},
	# 				{'label': 'Tanggal Rekam Medis ASC', 'sort': 'record_date asc'},
	# 				{'label': 'No Reg Penerimaan DESC', 'sort': 'register_number desc'},
	# 				{'label': 'No Reg Penerimaan', 'sort': 'register_number asc'},
	# 				]

	# context.rekam_medis = frappe.get_list("VetRekamMedis", filters=filters, fields=["register_number", "record_date", "service", "pet_name", "pet", "pet_owner_name", "temperature", "weight", "diagnosa1", "diagnosa2", "prognosa", "action", "name"], order_by=default_sort)

	return context