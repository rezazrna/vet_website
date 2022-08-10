import frappe

def get_context(context):
    context.no_cache = True
    if frappe.session.user == 'Guest':
        frappe.local.flags.redirect_location = frappe.utils.get_url('/login')
        raise frappe.Redirect
    if frappe.form_dict:
        account = frappe.form_dict.account
        context.account = account
        context.account_doc = frappe.get_doc('VetCoa', context.account)
        context.alt_page_title = "General Ledger / %s %s"%(context.account_doc.account_code, context.account_doc.account_name)
    else:
        context.alt_page_title = "General Ledger"

    return context