import frappe
from datetime import datetime as dt

def get_context(context):
    context.no_cache = True

    context.mode = "New"
    context.search_nip = True
    context.alt_page_title = "Penerimaan Pasien Baru"
    
    if frappe.session.user == 'Guest':
        frappe.local.flags.redirect_location = frappe.utils.get_url('/login')
        raise frappe.Redirect

    return context