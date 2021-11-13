from __future__ import unicode_literals
from frappe import _

def get_data():
    return [
      {
        "label":_("Vet Menu"),
        "icon": "octicon octicon-alert",
        "items": [
            {
              "type": "doctype",
              "name": "VetPetOwner",
              "label": _("Pet owner list"),
              "description": _("Pet owner list"),
            },
            {
              "type": "doctype",
              "name": "VetPetType",
              "label": _("Pet type list"),
              "description": _("Pet type list"),
            },
            {
              "type": "doctype",
              "name": "VetReception",
              "label": _("Reception list"),
              "description": _("Reception list"),
            },
            {
              "type": "doctype",
              "name": "VetScheduledService",
              "label": _("Scheduled Service"),
              "description": _("Scheduled Service"),
            },
            {
              "type": "doctype",
              "name": "VetGrooming",
              "label": _("Grooming list"),
              "description": _("Grooming list"),
            },
            {
              "type": "doctype",
              "name": "VetTask",
              "label": _("Task list"),
              "description": _("Task list"),
            },
            {
              "type": "doctype",
              "name": "VetProduct",
              "label": _("Product list"),
              "description": _("Product list"),
            },
            {
              "type": "doctype",
              "name": "VetService",
              "label": _("Service list"),
              "description": _("Service list"),
            },
            {
              "type": "doctype",
              "name": "VetUOM",
              "label": _("UOM list"),
              "description": _("UOM list"),
            },
            {
              "type": "doctype",
              "name": "VetRekamMedis",
              "label": _("Rekam Medis"),
              "description": _("Rekam Medis"),
            },
            {
              "type": "doctype",
              "name": "VetCustomerInvoice",
              "label": _("Customer Invoice"),
              "description": _("Customer Invoice"),
            },
          ]
      }
  ]
