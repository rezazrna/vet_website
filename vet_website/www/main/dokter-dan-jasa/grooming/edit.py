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

    context.mode = "Edit"
    context.grooming = frappe.get_doc("VetGrooming", n)
    context.pet = frappe.get_doc("VetPet", context.grooming.pet)
    context.pet_owner = frappe.get_doc("VetPetOwner", context.pet.parent)
    context.statuses = ["Draft", "Done"]
    # context.alt_page_title = "Grooming / "+ n
    context.alt_page_title = "Grooming / "+ context.grooming.pet

    return context