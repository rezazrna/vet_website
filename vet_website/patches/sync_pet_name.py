from __future__ import unicode_literals
import frappe
from vet_website.vet_website.doctype.vetpet.vetpet import sync_all_pet_names

def execute():
	sync_all_pet_names()
	frappe.db.commit()
