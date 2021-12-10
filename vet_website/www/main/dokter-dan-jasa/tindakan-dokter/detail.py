import frappe

def get_context(context):
    context.no_cache = True
    if frappe.session.user == 'Guest':
        frappe.local.flags.redirect_location = frappe.utils.get_url('/login')
        raise frappe.Redirect
    n = False

    if frappe.form_dict:
        n = frappe.form_dict.n
        context.n = n

    context.mode = "Detail"
    context.tindakan_dokter = frappe.get_doc("VetTindakanDokter", n)
    # context.alt_page_title = "Tindakan Dokter / "+ n
    context.alt_page_title = "Tindakan Dokter / "+ context.tindakan_dokter.pet
    context.statuses = ["Draft", "Done"]

    return context