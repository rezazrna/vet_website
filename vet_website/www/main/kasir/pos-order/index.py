import frappe

def get_context(context):
	context.no_cache = True
	if frappe.session.user == 'Guest':
		frappe.local.flags.redirect_location = frappe.utils.get_url('/login')
		raise frappe.Redirect
		
	session = False
	context.show_open = False
	
	session_search = frappe.get_list('VetPosSessions', filters={'status': 'In Progress'}, fields=['name'])
	print('cari pos session')
	print(session_search)
	if len(session_search) > 0:
		context.show_open = True

	return context