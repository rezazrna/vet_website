import frappe

def get_context(context):
    context.no_cache = True

    context.mode = "New Pet"
    context.search_nip = True
    context.alt_page_title = "Pasien Baru"
    
    if frappe.session.user == 'Guest':
        frappe.local.flags.redirect_location = frappe.utils.get_url('/login')
        raise frappe.Redirect

    return context