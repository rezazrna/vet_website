import frappe

def get_context(context):
    # context.no_cache = True
    if frappe.session.user == 'Guest':
        frappe.local.flags.redirect_location = frappe.utils.get_url('/login')
        raise frappe.Redirect
    if frappe.form_dict:
        n = frappe.form_dict.n
        context.n = n

    context.alt_page_title = "Journal Entry / "+ n

    return context