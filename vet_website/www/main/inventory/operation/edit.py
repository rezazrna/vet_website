import frappe

def get_context(context):
    context.no_cache = True
    if frappe.session.user == 'Guest':
        frappe.local.flags.redirect_location = frappe.utils.get_url('/login')
        raise frappe.Redirect

    if frappe.form_dict:
        n = frappe.form_dict.n
        context.n = n

    context.mode = "Edit"
    operation = frappe.get_doc("VetOperation", n)
    context.operation = operation
    context.alt_page_title = "Operation / "+ operation.name
    
    if operation.is_usage:
        frappe.local.flags.redirect_location = frappe.utils.get_url('/main/accounting/usage/edit?n=%s'%operation.name)
        raise frappe.Redirect

    return context