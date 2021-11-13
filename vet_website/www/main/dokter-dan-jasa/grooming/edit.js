$("form#grooming_form").trigger("reset");

$("form#grooming_form").submit(function(e){
	e.preventDefault();

	var url_string = window.location.href
	var url = new URL(url_string);
	var n = url.searchParams.get("n");

	var grooming_data = {
		'name': n,
		'register_number': $("input#register_number").val(),
		'pet': $("input#name_pet").val(),
		'service': "Grooming",
		'action': "Grooming",
		'limfonodule': $("select[name='limfonodule']").val(),
		'mulut': $("input[name='mulut']").val(),
		'mata': $("input[name='mata']").val(),
		'telinga': $("input[name='telinga']").val(),
		'hidung': $("input[name='hidung']").val(),
		'kulit': $("input[name='kulit']").val(),
		'condition': $("select[name='condition']").val(),
		'temperature': $("input[name='temperature']").val(),
		'weight': $("input[name='weight']").val(),
		'add_rekam_medis': $("input[name='add_rekam_medis']").val(),
		'add_invoice': $("input[name='add_invoice']").val(),
		'products': [],
		'new_products': [],
		'actions': [],
		'new_actions': [],
	}

	$("div.grooming_products").each(function(){
		var product = $(this).find("select[name='product']");
		var quantity = $(this).find("input[name='quantity']");
		if ( !$(this).attr("id") ) {
			var product_data = {'product': product.val(), 'quantity': quantity.val()}
			grooming_data.new_products.push(product_data);
		}
		else {
			var product_data = {'product': product.val(), 'quantity': quantity.val(), 'name': $(this).attr('id')}
			grooming_data.products.push(product_data);	
		}
	});

	$("div.grooming_actions").each(function(){
		var date = $(this).find("input[name='date']");
		var note = $(this).find("input[name='note']");
		if ( !$(this).attr("id") ) {
			var action_data = {'date': date.val(), 'note': note.val()}
			grooming_data.new_actions.push(action_data);
		}
		else {
			var action_data = {'date': date.val(), 'note': note.val(), 'name': $(this).attr('id')}
			grooming_data.actions.push(action_data);
		}
	});

	editGrooming(grooming_data);

});

$("button#add_product").click(function(e){
	e.preventDefault();

	var url_string = window.location.href
	var url = new URL(url_string);
	var n = url.searchParams.get("n");

	addProductList(n);
})

$("button#add_action").click(function(e){
	e.preventDefault();

	var url_string = window.location.href
	var url = new URL(url_string);
	var n = url.searchParams.get("n");

	addActionList(n);
})

$("button#add_invoice").click(function(e){
	e.preventDefault();

	$("input[name='add_invoice']").val("1");
	$(this).hide();
})

$("button#add_rekam_medis").click(function(e){
	e.preventDefault();

	$("input[name='add_rekam_medis']").val("1");
	$(this).hide();

	// var url_string = window.location.href
	// var url = new URL(url_string);
	// var n = url.searchParams.get("n");

	// var rekam_medis_data = {
	// 	'register_number': $("input#register_number").val(),
	// 	'pet': $("input#name_pet").val(),
	// 	'service': "Grooming",
	// 	'action': "Grooming",
	// 	'temperature': $("input#temperature").val(),
	// 	'weight': $("input#weight").val(),
	// 	'condition': $("select#condition").val(),
	// 	'limfonodule': $("select#limfonodule").val(),
	// 	'mulut': $("input#mulut").val(),
	// 	'mata': $("input#mata").val(),
	// 	'telinga': $("input#telinga").val(),
	// 	'hidung': $("input#hidung").val(),
	// 	'kulit': $("input#kulit").val(),
	// }

	// groomingAddRekamMedis(rekam_medis_data, n)
})