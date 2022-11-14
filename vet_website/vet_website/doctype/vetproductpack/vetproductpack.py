# -*- coding: utf-8 -*-
# Copyright (c) 2020, bikbuk and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
# import frappe
import math
from frappe.model.document import Document

class VetProductPack(Document):
	pass

def get_pack_price(quantity, price, quantity_pack, price_pack):
    if quantity < quantity_pack:
        return quantity*price
    else:
        return (math.floor(quantity/quantity_pack)*price_pack)+((quantity%quantity_pack)*price)