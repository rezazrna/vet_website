import frappe

def get_context(context):
	context.no_cache = True
	if frappe.session.user == 'Guest':
		frappe.local.flags.redirect_location = frappe.utils.get_url('/login')
		raise frappe.Redirect
	if frappe.form_dict:
		oc_name = frappe.form_dict.id
		if oc_name:
			oc_supplier = frappe.db.get_value('VetOwnerCredit', oc_name, 'supplier')
			oc_pet_owner = frappe.db.get_value('VetOwnerCredit', oc_name, 'pet_owner')
			if oc_supplier:
				frappe.local.flags.redirect_location = frappe.utils.get_url('/main/purchases/deposit?n=%s'% oc_supplier)
				raise frappe.Redirect
			elif oc_pet_owner:
				frappe.local.flags.redirect_location = frappe.utils.get_url('/main/kasir/deposit?n=%s'% oc_pet_owner)
				raise frappe.Redirect
	return context