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
    context.reception = frappe.get_doc("VetReception", n)
    context.reception_pet = frappe.get_doc("VetPet", context.reception.pet)
    context.pet_owner = frappe.get_doc("VetPetOwner", context.reception_pet.parent)
    # context.alt_page_title = "Penerimaan Pasien / "+ n
    context.alt_page_title = "Penerimaan Pasien / "+ context.reception.pet
    
    return context