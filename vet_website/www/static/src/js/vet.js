$("input.datetimepicker").datetimepicker({
	format: "YYYY-MM-DD HH:mm:ss",
	defaultDate: moment().format("YYYY-MM-DD HH:mm:ss"),
});

$("div.row-list.row-list-link").click(function(){
	if ($(this).data('href')) {
		window.location = $(this).data('href');
	}
})

$("form#search_bar select[name='sort'], form#search_bar input[name='min_date'], form#search_bar input[name='max_date']").change(function(){
	$("form#search_bar").submit();
});

var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
};

var formatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 5,
});

var formatter2 = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 5,
});

var formatter3 = new Intl.NumberFormat('id-ID', {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
  });

function userGetRolePermission(user){
	var roles = []
	var permissions = []
	if(user && user.roles){
		roles = user.roles.map(r => r.role)
		user.roles.forEach(r => {
            if(r.permissions){
                permissions = permissions.concat(r.permissions)
            }
        })
	}
	return [roles, permissions]
}

function checkPermission(doctype, user, access){
	var [roles, permissions] = userGetRolePermission(user)
	if(roles.includes('System Manager')){
		return true
	} else {
		if(['read','write','create','delete'].includes(access)){
			if(permissions.find(p => p.doctype_table == doctype && p[access] == 1)){
				return true
			}
		} else {
			if(permissions.find(p => p.doctype_table == doctype && p.extra_permission.split(',').includes(access))){
				return true
			}
		}
	} 
	return false
}

function getPetOwner(nik=false, nip=false) {
	frappe.call({
		type: "POST",
		method:"vet_website.vet_website.doctype.vetpetowner.vetpetowner.reception_get_pet_owner",
		args: {nik: nik, nip: nip},
		callback: function(r){
			if (r.message.doc) {
				// console.log(r.message.doc);
				$("input[name='nik']").val(r.message.doc.nik);
				$("input[name='owner_name']").val(r.message.doc.owner_name);
				$("input[name='owner_name']").attr('readonly', 'readonly');
				$("input[name='phone']").val(r.message.doc.phone);
				$("input[name='phone']").attr('readonly', 'readonly');
				$("input[name='email']").val(r.message.doc.email);
				$("input[name='email']").attr('readonly', 'readonly');
				$("textarea[name='address']").val(r.message.doc.address);
				$("textarea[name='address']").attr('readonly', 'readonly');
			}
			if (r.message.not_found_render){
				$("div#alert_box").empty();
				$("div#alert_box").append(r.message.not_found_render);
				$("input[name='owner_name']").val('');
				$("input[name='owner_name']").removeAttr('readonly');
				$("input[name='phone']").val('');
				$("input[name='phone']").removeAttr('readonly');
				$("input[name='email']").val('');
				$("input[name='email']").removeAttr('readonly');
				$("textarea[name='address']").val('');
				$("textarea[name='address']").removeAttr('readonly');
			}
			if (r.message.pet_row_render){
				$("div.pet_list").empty();
				$("div.pet_list").append(r.message.pet_row_render);
				$("input.datetimepicker").datetimepicker({
					format: "YYYY-MM-DD HH:mm:ss",
					defaultDate: moment().format("YYYY-MM-DD HH:mm:ss"),
				});
			}
			if (r.message.error) {
				frappe.msgprint(r.message.error);
			}
			$("button.pet_row_select").click(function(e){
				e.preventDefault();
				var parent = $(this).parent("div.pet_row");
				var radio = $(parent).find("input[name='pet']")
				$(radio).prop("checked", true);

				var title = $(parent).find("span.pet_row_name").text()

				$("button.pet_row_select").removeClass("text-success alert-success").addClass("alert-secondary text-muted").text("Pilih");
				$("button.pet_row_select").find("i").remove();
				$(this).removeClass("alert-secondary text-muted").addClass("text-success alert-success").text(title+" Dipilih").prepend("<i class='fa fa-lg fa-check-circle-o mr-3'></i>");
			})
		}
	});
}

function addPetRow() {
	frappe.call({
		type: "POST",
		method:"vet_website.vet_website.doctype.vetpetowner.vetpetowner.reception_add_pet_row",
		args: {},
		callback: function(r){
			if (r.message.pet_row_render) {
				$("div.pet_list").append(r.message.pet_row_render);
				$("input.datetimepicker").datetimepicker({
					format: "YYYY-MM-DD HH:mm:ss",
					defaultDate: moment().format("YYYY-MM-DD HH:mm:ss"),
				});
			}
			if (r.message.error) {
				frappe.msgprint(r.message.error);
			}
			$("button.pet_row_select").click(function(e){
				e.preventDefault();
				var parent = $(this).parent("div.pet_row");
				var radio = $(parent).find("input[name='pet']")
				$(radio).prop("checked", true);

				var title = $(parent).find("span.pet_row_name").text()

				$("button.pet_row_select").removeClass("text-success alert-success").addClass("alert-secondary text-muted").text("Pilih");
				$("button.pet_row_select").find("i").remove();
				$(this).removeClass("alert-secondary text-muted").addClass("text-success alert-success").text(title+" Dipilih").prepend("<i class='fa fa-lg fa-check-circle-o mr-3'></i>");
			})
		}
	});
}

function newReception(owner_data, reception_data) {
	frappe.call({
		type: "POST",
		method:"vet_website.vet_website.doctype.vetreception.vetreception.new_reception",
		args: {owner_data: owner_data, reception_data: reception_data},
		callback: function(r){
			if (r.message.reception) {
				window.location.pathname = "/main/penerimaan/penerimaan-pasien"
			}
			if (r.message.error) {
				frappe.msgprint(r.message.error);
			}
		}
	});
}

function editPet(owner_data, pet_data) {
	frappe.call({
		type: "POST",
		method:"vet_website.vet_website.doctype.vetpetowner.vetpetowner.edit_pet",
		args: {owner_data: owner_data, pet_data: pet_data},
		callback: function(r){
			if (r.message.pet) {
				window.location.pathname = "/main/penerimaan/data-pasien"
			}
			if (r.message.error) {
				frappe.msgprint(r.message.error);
			}
		}
	});
}

function changeProductOption(service_name) {
	frappe.call({
		type: "POST",
		method:"vet_website.vet_website.doctype.vetreception.vetreception.get_product_option",
		args: {service_name: service_name},
		callback: function(r){
			if (r.message.render) {
				$("select[name='service_detail']").empty();
				$("select[name='service_detail']").append(r.message.render);
			}
			if (r.message.error) {
				frappe.msgprint(r.message.error);
			}
		}
	});
}

function changeServiceOption(product_name) {
	frappe.call({
		type: "POST",
		method:"vet_website.vet_website.doctype.vetproduct.vetproduct.get_product",
		args: {name: product_name},
		callback: function(r){
			if (r.message.product) {
				$("select[name='service']").val(r.message.product.service);
			}
			if (r.message.error) {
				frappe.msgprint(r.message.error);
			}
		}
	});
}

function addProductList(grooming_id) {
	frappe.call({
		type: "POST",
		method:"vet_website.vet_website.doctype.vetgrooming.vetgrooming.add_product_list",
		args: {grooming_id: grooming_id},
		callback: function(r){
			if (r.message.render) {
				$("div#product_list").append(r.message.render);
			}
			if (r.message.error) {
				frappe.msgprint(r.message.error);
			}
		}
	});
}

function addInvoiceLineList(invoice_id) {
	frappe.call({
		type: "POST",
		method:"vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.add_invoice_line_list",
		args: {invoice_id: invoice_id},
		callback: function(r){
			if (r.message.render) {
				$("div#product_list").append(r.message.render);

				$("select.product_options").change(function(){
					var product_id = $(this).val();
					var parent = $(this).parents("div.invoice_line_row");
					var quantity = parent.find("input[name='quantity']").val();
					var name_col = parent.find("div.product_name_col");
					var uom_col = parent.find("div.uom_col");
					var price_col = parent.find("div.unit_price_col");
					var total_col = parent.find("div.total_col");

					frappe.call({
						type: "POST",
						method:"vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.get_product_detail",
						args: {product_id: product_id},
						callback: function(r){
							console.log(r);
							if (r.message.product) {
								name_col.text(r.message.product.product_name);
								uom_col.text(r.message.product.uom);
								price_col.text(formatter.format(r.message.product.price));
								total_col.text(formatter.format(quantity*r.message.product.price));
							}
							if (r.message.error) {
								frappe.msgprint(r.message.error);
							}
						}
					});
				})

				$("input[name='quantity']").change(function(){
					var quantity = $(this).val();
					var parent = $(this).parents("div.invoice_line_row");
					var product_id = parent.find('select.product_options').val();
					var total_col = parent.find("div.total_col");
					frappe.call({
						type: "POST",
						method:"vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.get_product_detail",
						args: {product_id: product_id},
						callback: function(r){
							console.log(r);
							if (r.message.product) {
								total_col.text(formatter.format(quantity*r.message.product.price));
							}
							if (r.message.error) {
								frappe.msgprint(r.message.error);
							}
						}
					});
				});
			}
			if (r.message.error) {
				frappe.msgprint(r.message.error);
			}
		}
	});
}

function addActionList(grooming_id) {
	frappe.call({
		type: "POST",
		method:"vet_website.vet_website.doctype.vetgrooming.vetgrooming.add_action_list",
		args: {grooming_id: grooming_id},
		callback: function(r){
			if (r.message.render) {
				$("div#action_list").append(r.message.render);
				$("input.datetimepicker").datetimepicker({
					format: "YYYY-MM-DD HH:mm:ss",
					defaultDate: moment().format("YYYY-MM-DD HH:mm:ss"),
				});
			}
			if (r.message.error) {
				frappe.msgprint(r.message.error);
			}
		}
	});
}

function editGrooming(grooming_data) {
	frappe.call({
		type: "POST",
		method:"vet_website.vet_website.doctype.vetgrooming.vetgrooming.edit_grooming",
		args: {grooming_data: grooming_data},
		callback: function(r){
			if (r.message.grooming) {
				window.location.pathname = "/main/dokter-dan-jasa/grooming"
			}
			if (r.message.error) {
				frappe.msgprint(r.message.error);
			}
		}
	});
}

function groomingAddRekamMedis(rekam_medis_data, grooming_id) {
	frappe.call({
		type: "POST",
		method:"vet_website.vet_website.doctype.vetgrooming.vetgrooming.add_rekam_medis",
		args: {rekam_medis_data: rekam_medis_data, grooming_id: grooming_id},
		callback: function(r){
			if (r.message.grooming) {
				window.location.pathname = "/main/dokter-dan-jasa/grooming"
			}
			if (r.message.error) {
				frappe.msgprint(r.message.error);
			}
		}
	});
}

function editCustomerInvoice(invoice_data) {
	frappe.call({
		type: "POST",
		method:"vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.edit_customer_invoice",
		args: {invoice_data: invoice_data},
		callback: function(r){
			if (r.message.invoice) {
				window.location.pathname = "/main/kasir/customer-invoices"
			}
			if (r.message.error) {
				frappe.msgprint(r.message.error);
			}
		}
	});
}