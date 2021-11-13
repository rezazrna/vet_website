$("form#reception_form").submit(function(e){
	e.preventDefault();

	var url_string = window.location.href
	var url = new URL(url_string);
	var n = url.searchParams.get("n");

	var owner_data = {
		'owner_name': $("input[name='owner_name']").val(),
		'phone': $("input[name='phone']").val(),
		'email': $("input[name='email']").val(),
		'address': $("textarea[name='address']").val(),
	}

	var pet_data = {
		'name' : n,
		'pet_name': $("input[name='pet_name']").val(),
		'hewan_jenis': $("select[name='hewan_jenis']").val(),
		'description': $("textarea[name='pet_description']").val(),
	}

	console.log(pet_data)
	console.log(owner_data)
	editPet(owner_data, pet_data);
})