import frappe

def get_context(context):
    # context.no_cache = True
    if frappe.session.user == 'Guest':
        frappe.local.flags.redirect_location = frappe.utils.get_url('/login')
        raise frappe.Redirect

    if frappe.form_dict:
        n = frappe.form_dict.n
        context.n = n

    context.mode = "Edit Pet"
    context.alt_page_title = "Data Pasien / "+ n
    context.reception_pet = frappe.get_doc("VetPet", n)
    context.pet_owner = frappe.get_doc("VetPetOwner", context.reception_pet.parent)

    return context