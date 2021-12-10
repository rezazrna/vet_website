import frappe

def get_context(context):
	context.no_cache = True
	context.pos_session_id = False
	if frappe.session.user == 'Guest':
		frappe.local.flags.redirect_location = frappe.utils.get_url('/login')
		raise frappe.Redirect
	else:
		pos_session = frappe.get_list("VetPosSessions", filters={"status": "In Progress", "responsible": frappe.session.user}, fields=["name"])
		if len(pos_session) == 0:
			frappe.local.flags.redirect_location = frappe.utils.get_url('/main/kasir/pos-sessions')
			raise frappe.Redirect
		else:
			context.pos_session_id = pos_session[0].name

	return context