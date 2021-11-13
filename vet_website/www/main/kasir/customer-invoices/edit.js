$("form#invoice_form").trigger("reset");

$("form#invoice_form").submit(function(e){
	e.preventDefault();

	var url_string = window.location.href
	var url = new URL(url_string);
	var n = url.searchParams.get("n");

	var invoice_data = {
		'name': n,
		'invoice_line': [],
		'new_invoice_line': [],
	}

	$("div.invoice_line_row").each(function(){
		var product = $(this).find("select[name='product']");
		var quantity = $(this).find("input[name='quantity']");
		if ( !$(this).attr("id") ) {
			var line_data = {'product': product.val(), 'quantity': quantity.val()}
			invoice_data.new_invoice_line.push(line_data);
		}
		else {
			var line_data = {'product': product.val(), 'quantity': quantity.val(), 'name': $(this).attr('id')}
			invoice_data.invoice_line.push(line_data);	
		}
	});

	editCustomerInvoice(invoice_data);

});

$("button#add_invoice_line").click(function(e){
	e.preventDefault();

	var url_string = window.location.href
	var url = new URL(url_string);
	var n = url.searchParams.get("n");

	addInvoiceLineList(n);
})

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
			if (r.message.product) {
				total_col.text(formatter.format(quantity*r.message.product.price));
			}
			if (r.message.error) {
				frappe.msgprint(r.message.error);
			}
		}
	});
});