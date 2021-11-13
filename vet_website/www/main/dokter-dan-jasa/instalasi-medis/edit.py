import frappe

def get_context(context):
    # context.no_cache = True
    if frappe.session.user == 'Guest':
        frappe.local.flags.redirect_location = frappe.utils.get_url('/login')
        raise frappe.Redirect
    n = False

    if frappe.form_dict:
        n = frappe.form_dict.n
        context.n = n

    context.mode = "Edit"
    context.alt_page_title = "Instalasi Medis / "+ n
    # context.instalasi_medis = frappe.get_doc("VetInstalasiMedis", n)
    # context.statuses = ["Draft", "Done"]

    return context