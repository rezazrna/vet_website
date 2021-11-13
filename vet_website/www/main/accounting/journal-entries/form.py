import frappe

def get_context(context):
    # context.no_cache = True
    context.alt_page_title = "Journal Entry Baru"
    if frappe.session.user == 'Guest':
    	frappe.local.flags.redirect_location = frappe.utils.get_url('/login')
    	raise frappe.Redirect
    return context