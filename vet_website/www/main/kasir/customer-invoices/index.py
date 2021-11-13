import frappe

def get_context(context):
	# context.no_cache = True
	if frappe.session.user == 'Guest':
		frappe.local.flags.redirect_location = frappe.utils.get_url('/login')
		raise frappe.Redirect
	# default_sort = "invoice_date desc"
	# default_sort = "posting_date desc"
	# filters={}

	# if frappe.form_dict:
	# 	search = frappe.form_dict.search
	# 	sort = frappe.form_dict.sort
	# 	if search:
	# 		# filters.update({'pet_name': ['like', '%'+search+'%']})
	# 		filters.update({'owner': ['like', '%'+search+'%']})
	# 		context.search = search
	# 	if sort:
	# 		default_sort = sort
	# 	context.sort = sort

	# 	min_date = frappe.form_dict.min_date
	# 	max_date = frappe.form_dict.max_date

	# 	if min_date:
	# 		# filters.update({'invoice_date': ['>=', min_date]})
	# 		filters.update({'posting_date': ['>=', min_date]})
	# 		context.min_date = min_date
	# 	if max_date:
	# 		# filters.update({'invoice_date': ['<=', max_date]})
	# 		filters.update({'posting_date': ['<=', max_date]})
	# 		context.max_date = max_date

	# 	if min_date and max_date:
	# 		# filters.update({'invoice_date': ['between', [min_date, max_date]]})
	# 		filters.update({'posting_date': ['between', [min_date, max_date]]})

	# context.sorts = [
	# 				# {'label': 'Tanggal Invoice DESC', 'sort': 'invoice_date desc'},
	# 				# {'label': 'Tanggal Invoice ASC', 'sort': 'invoice_date asc'},
	# 				{'label': 'Tanggal Invoice DESC', 'sort': 'posting_date desc'},
	# 				{'label': 'Tanggal Invoice ASC', 'sort': 'posting_date asc'},
	# 				{'label': 'total DESC', 'sort': 'total desc'},
	# 				{'label': 'total ASC', 'sort': 'total asc'},
	# 				]

	# # context.invoices = frappe.get_list("VetCustomerInvoice", filters=filters, fields=["register_number", "pet", "pet_name", "owner", "owner_name", "invoice_date", "due_date", "user", "origin", "subtotal", "total", "name", "status"], order_by=default_sort)
	# context.invoices = frappe.get_list("Sales Invoice", filters=filters, fields=["posting_date", "due_date", "owner", "total", "grand_total", "name", "status"], order_by=default_sort)

	return context