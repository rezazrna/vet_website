import frappe

def get_context(context):
    context.no_cache = True
    if frappe.session.user == 'Guest':
        frappe.local.flags.redirect_location = frappe.utils.get_url('/login')
        raise frappe.Redirect

    n = False

    if frappe.form_dict:
        petOwner = frappe.form_dict.petOwner
        pet = frappe.form_dict.pet
        context.n = n
        
    context.alt_page_title = "Spending / "+ petOwner or pet

    return context