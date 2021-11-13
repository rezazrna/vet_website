import frappe

def get_context(context):
	# context.no_cache = True
	if frappe.session.user == 'Guest':
		frappe.local.flags.redirect_location = frappe.utils.get_url('/login')
		raise frappe.Redirect
		
	if frappe.form_dict:
		gudang = frappe.form_dict.gudang
		
		if gudang:
			gudang_name = frappe.db.get_value('VetGudang', gudang, 'gudang_name')
			context.alt_page_title = "Inventory / "+gudang_name

	return context