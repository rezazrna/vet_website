import frappe

def get_context(context):
	context.no_cache = True
	if frappe.session.user == 'Guest':
		frappe.local.flags.redirect_location = frappe.utils.get_url('/login')
		raise frappe.Redirect
	# filters = {}
	# default_sort = "schedule_date desc"

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
	# 		filters.update({'schedule_date': ['>=', min_date]})
	# 		context.min_date = min_date
	# 	if max_date:
	# 		filters.update({'schedule_date': ['<=', max_date]})
	# 		context.max_date = max_date

	# 	if min_date and max_date:
	# 		filters.update({'schedule_date': ['between', [min_date, max_date]]})

	# context.sorts = [
	# 				{'label': 'Tanggal jadwal DESC', 'sort': 'schedule_date desc'},
	# 				{'label': 'Tanggal pendaftaran ASC', 'sort': 'schedule_date asc'},
	# 				{'label': 'Tanggal buat DESC', 'sort': 'create_date desc'},
	# 				{'label': 'Tanggal buat ASC', 'sort': 'create_date asc'},
	# 				]

	# context.scheduled_services = frappe.get_list("VetScheduledService", filters=filters, fields=["create_date", "pet", "pet_name", "pet_owner_name", "service", "schedule_date", "status", "register_number", "pet_owner_phone", "type_name"], order_by=default_sort)

	return context