$("button#add_rekam_medis").click(function(e){
	e.preventDefault();

	var url_string = window.location.href
	var url = new URL(url_string);
	var n = url.searchParams.get("n");

	var rekam_medis_data = {
		'register_number': $("span#register_number").text(),
		'pet': $("span#name_pet").text(),
		'service': "Grooming",
		'action': "Grooming",
		'temperature': $("span#temperature").text(),
		'weight': $("span#weight").text(),
		'condition': $("span#condition").text(),
		'limfonodule': $("span#limfonodule").text(),
		'mulut': $("span#mulut").text(),
		'mata': $("span#mata").text(),
		'telinga': $("span#telinga").text(),
		'hidung': $("span#hidung").text(),
		'kulit': $("span#kulit").text(),
	}

	groomingAddRekamMedis(rekam_medis_data, n)
})