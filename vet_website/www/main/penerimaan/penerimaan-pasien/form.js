$('form input').keydown(function (e) {
	if (e.keyCode == 13) {
		e.preventDefault();
		return false;
	}
});

$("form#reception_form").trigger("reset");

$("form#reception_form").submit(function(e){
	e.preventDefault();
	var owner_data = {
		'nik': $("input[name='nik']").val(),
		'owner_name': $("input[name='owner_name']").val(),
		'phone': $("input[name='phone']").val(),
		'email': $("input[name='email']").val(),
		'address': $("textarea[name='address']").val(),
		'pets': [],
	}

	var reception_data = {
		'reception_date': $("input[name='reception_date']").val(),
		'description': $("textarea[name='reception_description']").val(),
		'pet': $("input[name='pet']:checked").val(),
		'register_number': $("input[name='register_number']").val(),
		'service': $("select[name='service']").val(),
		'service_detail': $("select[name='service_detail']").val(),
	}

	$("div.pet_row").each(function(){
		var selected = $(this).find("input[name='pet']");
		var pet_name = $(this).find("input[name='pet_name']");
		var hewan_jenis = $(this).find("select[name='hewan_jenis']")
		var register_date = $(this).find("input[name='register_date']")
		var description = $(this).find("textarea[name='pet_description']")
		if ( !$(this).attr("id") ) {
			var pet_data = {'pet_name': pet_name.val(), 'hewan_jenis': hewan_jenis.val(), 'register_date': register_date.val(), 'description': description.val(), 'selected': false}
			if ( selected.prop("checked") ) {
				pet_data.selected = selected.prop("checked");
			}
			owner_data.pets.push(pet_data);
		}
	});

	newReception(owner_data, reception_data);
})

$("button#add_pet_row").click(function(e){
	e.preventDefault();
	addPetRow();
})

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

$("input[name='nik']").change(function(){
	if ($(this).val().length) {
		getPetOwner($(this).val());
	}
})

$("input[name='name_pet']").change(function(){
	if ($(this).val().length) {
		getPetOwner(false, $(this).val());
	}
})

$("select[name='service']").change(function(){
	changeProductOption($(this).val());
})

$("select[name='service_detail']").change(function(){
	changeServiceOption($(this).val());
})