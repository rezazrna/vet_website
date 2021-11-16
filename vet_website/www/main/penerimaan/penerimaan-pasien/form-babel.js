var mode = document.getElementById('penerimaan_pasien').getAttribute('mode')
var list = document.getElementsByTagName("title")[0].innerHTML.split('/')
// var id = list[list.length - 1].replace(' ', '')
var id = getUrlParameter('n')
var tzOffset = new Date().getTimezoneOffset();

class PenerimaanPasien extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': [],
            'loaded': false,
            'modeEditPet': false,
            'new_owner': {},
            'new_pet': false,
            'new_pets': [],
            'new_reception': {},
            'data_exist': false,
            'nik_suggest': {'show': false, 'suggestions': []},
            'name_suggest': {'show': false, 'suggestions': []},
            'phone_suggest': {'show': false, 'suggestions': []},
            'pet_suggest': {'show': false, 'suggestions': []},
            'show_search': false,
            'show_search_pet': false,
            'show_detail': false,
            'currentUser': {},
        }
        this.handleInputChangeOwner = this.handleInputChangeOwner.bind(this);
        this.handleInputChangePet = this.handleInputChangePet.bind(this);
        this.handleInputChangeReception = this.handleInputChangeReception.bind(this);
        this.handleInputBlur = this.handleInputBlur.bind(this);
        this.changeModeEditPet = this.changeModeEditPet.bind(this);
        this.addNewPets = this.addNewPets.bind(this);
        this.addNewPet = this.addNewPet.bind(this);
        this.selectPet = this.selectPet.bind(this);
        this.deletePet = this.deletePet.bind(this);
        this.getPetOwnerByNik = this.getPetOwnerByNik.bind(this);
        this.closeSuggestion = this.closeSuggestion.bind(this)
        this.processPopupRow = this.processPopupRow.bind(this)
        this.openSearchPopup = this.openSearchPopup.bind(this)
        this.closeSearchPopup = this.closeSearchPopup.bind(this)
        this.listFilter = this.listFilter.bind(this)
        this.nextInput = this.nextInput.bind(this)
        this.navigationAction = this.navigationAction.bind(this)
        this.refreshAction = this.refreshAction.bind(this)
        this.getRegisterDate = this.getRegisterDate.bind(this)
        this.setDecease = this.setDecease.bind(this)
        this.handleInputBlurPetType = this.handleInputBlurPetType.bind(this)
    }
    
    componentDidMount() {
        var currentaddress = window.location.pathname.replace('/detail', '').replace('/edit', '').replace('/form', '')
        var lastfilter = JSON.parse(sessionStorage.getItem(currentaddress))
        var vr = this
        
        var method
        if(currentaddress.includes('penerimaan-pasien')){
            method = "vet_website.vet_website.doctype.vetreception.vetreception.get_name_list"
        }
        else if(currentaddress.includes('data-pasien')){
            method = "vet_website.vet_website.doctype.vetpet.vetpet.get_name_list"
        }
        else if(currentaddress.includes('data-pemilik')){
            method = "vet_website.vet_website.doctype.vetpetowner.vetpetowner.get_name_list"
        }
        
        frappe.call({
            type: "GET",
            method:"vet_website.methods.get_current_datetime",
            args: {},
            callback: function(r){
                if (r.message) {
                    vr.setState({'currentTime': r.message, 'new_reception': {'reception_date': r.message}});
                }
            }
        });
        
        frappe.call({
            type: "GET",
            method:"vet_website.methods.get_current_user",
            args: {},
            callback: function(r){
                if (r.message) {
                    vr.setState({'currentUser': r.message});
                }
            }
        });
        
        frappe.call({
            type: "GET",
            method: method,
            args: {filters: lastfilter},
            callback: function(r){
                if (r.message) {
                    vr.setState({'namelist': r.message});
                }
            }
        });
        
        if (mode == 'Detail') {
            frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetreception.vetreception.get_reception",
                args: {name: id},
                callback: function(r){
                    if (r.message) {
                        console.log(r.message)
                        var data = {
                            total_spending: r.message.total_spending,
                            rekam_medis: r.message.rekam_medis,
                            kunjungan_berikutnya: r.message.kunjungan_berikutnya
                        }
                        var new_owner = r.message.petOwner
                        var new_pets = r.message.pet
                        var new_reception = r.message.reception
                        vr.setState({'new_owner': new_owner, 'new_pets': new_pets, 'new_reception': new_reception, 'data': data, 'loaded': true});
                    }
                }
            });
        } else if (mode == 'Edit Pet') {
            frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetreception.vetreception.get_pet",
                args: {name: id},
                callback: function(r){
                    if (r.message) {
                        console.log(r.message)
                        var data = {
                            petType: r.message[0].petType,
                            total_spending: r.message[0].total_spending,
                            total_visit: r.message[0].total_visit,
                            total_credit: r.message[0].total_credit,
                            total_remaining: r.message[0].total_remaining,
                            total_debt: r.message[0].total_debt,
                        }
                        var new_owner = Object.assign({}, r.message[0])
                        var new_pets = new_owner.pets.slice()
                        delete new_owner['pets']
                        vr.setState({'new_owner': new_owner, 'new_pets': new_pets, 'data': data, 'loaded': true});
                    }
                }
            });
        } else if (mode == 'New' || mode == 'New Pet' || mode == 'New Owner') {
            frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetreception.vetreception.get_services",
                args: {},
                callback: function(r){
                    if (r.message) {
                        console.log(r.message)
                        vr.setState({'data': r.message, 'loaded': true});
                    }
                }
            });
        } else if (mode == 'Edit Owner') {
            frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetpetowner.vetpetowner.get_pet_owner_by_name",
                args: {name: id},
                callback: function(r){
                    if (r.message) {
                        var data = {
                            petType: r.message[0].petType,
                            total_visit: r.message[0].total_visit,
                            total_spending: r.message[0].total_spending,
                            kunjungan_berikutnya: r.message[0].kunjungan_berikutnya,
                            total_credit: r.message[0].total_credit,
                            total_remaining: r.message[0].total_remaining,
                            total_debt: r.message[0].total_debt,
                        }
                        var new_owner = Object.assign({}, r.message[0])
                        var new_pets = new_owner.pets.slice()
                        delete new_owner['pets']
                        vr.setState({'new_owner': new_owner, 'new_pets': new_pets, 'data': data, 'loaded': true});
                    }
                }
            });
        }
    }
    
    navigationAction(name){
        window.location.href = window.location.pathname+"?n="+name
    }
    
    getRegisterDate() {
        return this.state.currentTime
    }
    
    getPetOwnerByNik(name){
        var vr = this
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetpetowner.vetpetowner.reception_get_pet_owner",
            args: {name: name},
            callback: function(r){
                if (r.message && r.message.doc) {
                    var new_pets = r.message.doc.pets.slice()
                    if(new_pets.length == 0){
                        new_pets = []
                    }
                    delete r.message.doc['pets']
                    vr.setState({'new_owner': r.message.doc, 'new_pets': new_pets, 'new_pet': false, 'data_exist': true, 'show_detail': false});
                }
                else {
                    vr.setState({'new_owner': {'nik': nik}, 'new_pets': [], 'new_pet': false, 'data_exist': false});
                }
            }
        });
    }
    
    refreshAction(){
        var vr = this
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetpetowner.vetpetowner.get_last_data",
            args: {},
            callback: function(r){
                if (r.message && r.message.doc) {
                    var new_pets = r.message.doc.pets.slice()
                    if(new_pets.length == 0){
                        new_pets = []
                    }
                    delete r.message.doc['pets']
                    vr.setState({'new_owner': r.message.doc, 'new_pets': new_pets, 'new_pet': false, 'show_detail': false});
                }
                else {
                    vr.setState({'new_owner': {}, 'new_pets': [], 'new_pet': false, 'data_exist': false});
                }
            }
        });
    }
    
    getPetOwnerSuggestion(filters, state_field, label_field, value_field){
        var vr = this;
        console.log(filters)
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetpetowner.vetpetowner.get_pet_owner",
            args: {filters: filters},
            callback: function(r){
                if (r.message) {
                    var suggests = r.message.pet_owner.slice()
                    suggests.forEach((r, index) => {
                        r.label = r[label_field]
                        r.value = r[value_field]
                        r.onClick = function(){
                            var set_obj = {}
                            set_obj[state_field] = {show: false, suggestions: []}
                            vr.getPetOwnerByNik(r.name);
                            vr.setState(set_obj);
                        }
                    })
                    var set_obj = {}
                    set_obj[state_field] = {show: true, suggestions: suggests}
                    
                    if (suggests.length == 0 && vr.state.data_exist) {
                        var value
                        if (label_field == 'nik') {
                            value = filters.nik_search
                        } else {
                            value = filters.search
                        }
                        vr.setState({'new_pets': [], 'new_owner': {[label_field]: value}, 'data_exist': false});
                    } else {
                        vr.setState(set_obj);
                    }
                } else {
                    var set_obj = {}
                    set_obj[state_field] = {show: false, suggestions: []}
                    vr.setState(set_obj);
                }
            }
        });
    }
    
    getPetSuggestion(filters, state_field, label_field, value_field){
        var vr = this;
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetpet.vetpet.get_pet",
            args: {filters: filters},
            callback: function(r){
                if (r.message) {
                    var suggests = r.message.slice()
                    suggests.forEach((r, index) => {
                        r.label = r[label_field]
                        r.value = r.pet_owner[value_field]
                        r.onClick = function(){
                            var set_obj = {}
                            set_obj[state_field] = {show: false, suggestions: []}
                            vr.getPetOwnerByNik(r.pet_owner.name);
                            vr.setState(set_obj);
                        }
                    })
                    
                    console.log(suggests)
                    
                    var set_obj = {}
                    set_obj[state_field] = {show: true, suggestions: suggests}
                    
                    if (suggests.length == 0 && vr.state.data_exist) {
                        var value
                        value = filters.search
                        var new_pet = vr.state.new_pet
                        new_pet[label_field] = value
                        vr.setState({'new_pet': new_pet, 'data_exist': false});
                    } else {
                        vr.setState(set_obj);
                    }
                } else {
                    var set_obj = {}
                    set_obj[state_field] = {show: false, suggestions: []}
                    vr.setState(set_obj);
                }
            }
        });
    }
    
    closeSuggestion(state_field) {
        var suggestions = Object.assign({}, this.state[state_field])
        suggestions.show = false
        var set_obj = {}
        set_obj[state_field] = suggestions
        this.setState(set_obj);
    }
    
    handleInputChangeOwner(event) {
        const value = event.target.value;
        const name = event.target.name;
        var vr = this
        var filters = {}
        var new_owner = Object.assign({}, this.state.new_owner)
        new_owner[name] = value
        this.setState({'new_owner': new_owner})
        
        if (['nik','owner_name', 'phone'].includes(name)){
            if(name == 'nik'){
                if(value == ''){
                    vr.setState({'new_owner': {}, 'new_pets': [], 'data_exist': false, 'nik_suggest': {show: false, suggestions: []}});
                }
                else {
                    filters.nik_search = value
                    filters.limit = 5
                    this.getPetOwnerSuggestion(filters, 'nik_suggest', 'nik', 'nik');
                }
            }
            else if(name == 'owner_name'){
                if(value == ''){
                    this.setState({'name_suggest': {show: false, suggestions: []}});
                }
                else {
                    filters.search = value
                    filters.limit = 5
                    this.getPetOwnerSuggestion(filters, 'name_suggest', 'owner_name', 'nik');
                }
            } else if(name == 'phone'){
                if(value == ''){
                    this.setState({'phone_suggest': {show: false, suggestions: []}});
                }
                else {
                    filters.phone = value
                    filters.limit = 5
                    this.getPetOwnerSuggestion(filters, 'phone_suggest', 'phone', 'nik');
                }
            }
        } else if (name == 'foto_identitas') {
            var img = event.target.files[0];
            this.editFotoIdentitas(img)
        }
    }
    
    handleInputChangePet(event, i=false) {
        const value = event.target.value;
        const name = event.target.name;
        var vr = this
        if (i) {
            if (name == 'pet_image') {
                var img = event.target.files[0];
                this.editPetImage(img, i)
            } else {
                var new_pets = this.state.new_pets.slice()
                new_pets[i][name] = value
                if (name == 'hewan_jenis'){
                    var find = this.state.data.petType.find(p => p.type_name == value)
                    if(find){
                        new_pets[i].type_name=find.type_name
                        new_pets[i].hewan_jenis=find.name
                    } else {
                        new_pets[i].type_name = value
                    }
                }
                this.setState({'new_pets': new_pets})
            }
        }
        
        if (name == 'name_pet') {
            if (value == '') {
                vr.setState({'new_owner': {}, 'new_pets': [], 'data_exist': false});
            } else {
                frappe.call({
                    type: "GET",
                    method:"vet_website.vet_website.doctype.vetpetowner.vetpetowner.reception_get_pet_owner",
                    args: {nip: value},
                    callback: function(r){
                        if (r.message && r.message.doc) {
                            var new_pets = r.message.doc.pets.slice()
                            if(new_pets.length == 0){
                                new_pets = []
                            }
                            delete r.message.doc['pets']
                            vr.setState({'new_owner': r.message.doc, 'new_pets': new_pets, 'data_exist': true});
                        }
                        else {
                            vr.setState({'new_owner': {}, 'new_pets': [], 'data_exist': false});
                        }z
                    }
                });
            }
        }
    }
    
    handleInputChangeNewPet(event) {
        const value = event.target.value;
        const name = event.target.name;
        var new_pet = Object.assign({}, this.state.new_pet)
        var filters = {}
        if (name == 'pet_image') {
            var img = event.target.files[0];
            this.newPetImage(img)
        } else if (name == 'pet_name') {
            if(value == ''){
                new_pet[name] = value
                this.setState({'pet_suggest': {show: false, suggestions: []}});
            }
            else {
                new_pet[name] = value
                filters.search = value
                filters.limit = 5
                this.getPetSuggestion(filters, 'pet_suggest', 'pet_name', 'nik');
            }
        } else {
            new_pet[name] = value
            if (name == 'hewan_jenis'){
                var find = this.state.data.petType.find(p => p.type_name == value)
                if(find){
                    new_pet.type_name=find.type_name
                    new_pet.hewan_jenis=find.name
                } else {
                    new_pet.type_name = value
                }
            }
        }
        this.setState({'new_pet': new_pet})
    }
    
    newPetImage(file) {
        var vr = this
        var new_pet = Object.assign({}, this.state.new_pet)
        var name = file.name;
        var reader = new FileReader();
        reader.onload = function(e) {
            new_pet.filename = file.name,
            new_pet.dataurl = reader.result
            new_pet.temp_image =  URL.createObjectURL(file)
            vr.setState({'new_pet': new_pet})
        }
        reader.readAsDataURL(file);
    }
    
    editPetImage(file, i) {
        var vr = this
        var new_pets = this.state.new_pets.slice()
        var name = file.name;
        var reader = new FileReader();
        reader.onload = function(e) {
            new_pets[i].filename = file.name,
            new_pets[i].dataurl = reader.result
            new_pets[i].temp_image =  URL.createObjectURL(file)
            vr.setState({'new_pets': new_pets})
        }
        reader.readAsDataURL(file);
    }
    
    editFotoIdentitas(file) {
        var vr = this
        var new_owner = Object.assign({}, this.state.new_owner)
        var name = file.name;
        var reader = new FileReader();
        reader.onload = function(e) {
            new_owner.filename = file.name,
            new_owner.dataurl = reader.result
            new_owner.temp_image =  URL.createObjectURL(file)
            vr.setState({'new_owner': new_owner})
        }
        reader.readAsDataURL(file);
    }
    
    handleInputChangeReception(event) {
        const value = event.target.value;
        const name = event.target.name;
        var selected = false
        var realValue
        var hi = this
        
        if(mode == 'New'){
            var new_reception = Object.assign({}, this.state.new_reception)
            
            if (name == 'service') {
                this.state.data.services.forEach(function(item, index) {
                    if (item.service_name == value) {
                        realValue = item.name
                    }
                })
                
                new_reception[name] = realValue
                hi.setState({new_reception: new_reception})
                
            } else if (name == 'service_detail') {
                this.state.data.products.forEach(function(item, index) {
                    if (item.product_name == value) {
                        selected = true
                        realValue = item.name
                    }
                })
                
                if (selected) {
                    new_reception[name] = realValue
                    this.setState({'new_reception': new_reception})
                }
                
            } else {
                new_reception[name] = value
                this.setState({'new_reception': new_reception})
            }
        }
    }
    
    handleInputBlur(e) {
        const value = e.target.value
        const name = e.target.name
        var selected = false
        var th = this
        
        if (name == 'service') {
            this.state.data.services.forEach(function(item, index) {
                if (item.service_name == value) {
                    selected = true
                    var new_reception = Object.assign({}, th.state.new_reception)
                    new_reception.service_detail = ''
                    document.getElementById('service_detail').value = ''
                    th.setState({'new_reception': new_reception})
                }
            })
        } else if (name == 'service_detail') {
            this.state.data.products.forEach(function(item, index) {
                if (item.product_name == value) {
                    selected = true
                }
            })
        }
        
        if (!selected) {
            e.target.value = ''
        }
    }
    
    handleInputBlurPetType(e, i=false){
        console.log(i)
        console.log(this.state.new_pets)
        const value = e.target.value
        
        if (i){
            var new_pets = this.state.new_pets.slice()
            var find = false
            this.state.data.petType.forEach(p => p.type_name == value&&!find?find=true:false)
            console.log(find)
            if (!find){
                e.target.value = ''
                new_pets[i].hewan_jenis = undefined
                new_pets[i].type_name = undefined
                this.setState({new_pets: new_pets})
            }
        } else {
            var new_pet = Object.assign({}, this.state.new_pet)
            var find = false
            this.state.data.petType.forEach(p => p.type_name == value&&!find?find=true:false)
            if (!find){
                e.target.value = ''
                new_pet.hewan_jenis = undefined
                new_pet.type_name = undefined
                this.setState({new_pet: new_pet})
            }
        }
    }
    
    processPopupRow(data, pet_suggest=false) {
        console.log(data)
        if (pet_suggest) {
            if(data.pet_owner.nik != undefined){
                this.getPetOwnerByNik(data.pet_owner.name);
                this.closeSearchPopup(true);
            }
        } else {
            if(data.nik != undefined){
                this.getPetOwnerByNik(data.name);
                this.closeSearchPopup();
            }
        }
    }
    
    closeSearchPopup(pet_suggest=false) {
        if (pet_suggest) {
            this.setState({show_search_pet: false});
        } else {
            this.setState({show_search: false});
        }
    }
    
    openSearchPopup(state_field) {
        this.closeSuggestion(state_field)
        if (state_field == 'pet_suggest') {
            this.setState({show_search_pet: true});
        } else {
            this.setState({show_search: true});
        }
    }
    
    selectPet(event, i=false) {
        event.preventDefault()
        var new_pets = this.state.new_pets.slice()
        new_pets.forEach((p, index) => {
            p.selected = false
            if(index == i){
                p.selected = true
            }
        })
        this.setState({'new_pets': new_pets})
    }
    
    addNewPet(e) {
        e.preventDefault();
        this.setState({'new_pet': {'register_date': this.getRegisterDate()}, 'show_detail': !this.state.show_detail})
    }
    
    addNewPets(e) {
        e.preventDefault();
        var new_pets = this.state.new_pets.slice()
        var new_pet = Object.assign({}, this.state.new_pet)
        if(new_pet.pet_name != undefined && new_pet.hewan_jenis != undefined){
            new_pet.name = "/"
            new_pets.push(new_pet)
            this.setState({'new_pets': new_pets, 'new_pet': false})
        }
    }
    
    newOwner(e) {
        e.preventDefault();
        frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vetpetowner.vetpetowner.new_pet_owner",
            args: {data: this.state.new_owner, pets: this.state.new_pets},
            freeze: true,
            callback: function(r){
                if (r.message.error) {
                    console.log(r.message.error);
                }
                else {
                    if (mode == 'New Owner') {
                        window.location.href = "/main/penerimaan/data-pemilik/edit?n="+r.message.name;
                    } else {
                        window.location.href = "/main/penerimaan/data-pasien/edit?n="+r.message.pets[r.message.pets.length - 1].name;
                    }
                }
            }
        });
    }
    
    editOwner(e) {
        e.preventDefault();
        var vr = this
        console.log(this.state.new_owner)
        frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vetpetowner.vetpetowner.edit_pet_owner",
            args: {data: this.state.new_owner, pets: this.state.new_pets},
            freeze: true,
            callback: function(r){
                if (r.message.error) {
                    console.log(r.message.error);
                }
                else {
                    if (mode == 'Edit Owner') {
                        console.log(r.message)
                        window.location.search = "?n="+r.message.name;
                    } else {
                        // vr.state.new_pets.forEach(function(item, index) {
                        //     window.location.pathname = 'main/penerimaan/data-pasien/edit';
                        // })
                        // window.location.href = '/main/penerimaan/data-pasien';
                        window.location.href = '/main/penerimaan/data-pasien';
                    }
                }
            }
        });
    }
    
    submitForm(e) {
        if(mode == 'New'){
            var selected = false
            this.state.new_pets.forEach(function(item, index) {
                if (item.selected == true) {
                    selected = true
                }
            })
            
            if (selected) {
                this.newReception(e)
            } else {
                e.preventDefault()
                frappe.msgprint('Anda belum memilih Hewan');
            }
        } else if(mode == 'Edit Owner' || mode == 'Edit Pet'){
            this.editOwner(e);
        } else if (mode == 'New Owner') {
            this.newOwner(e);
        } else if (mode == 'New Pet'){
            if(this.state.new_owner.name != undefined){
                this.editOwner(e);
            } else {
                this.newOwner(e);
            }
        }
        
    }
    
    newReception(e) {
        e.preventDefault();
        var new_owner = Object.assign({}, this.state.new_owner)
        new_owner.pets = this.state.new_pets
        console.log(new_owner)
        frappe.call({
		    type: "POST",
    		method:"vet_website.vet_website.doctype.vetreception.vetreception.new_reception",
    		args: {owner_data: new_owner, reception_data: this.state.new_reception},
    		freeze: true,
    		callback: function(r){
    			if (r.message.reception) {
    				window.location.href = "/main/penerimaan/penerimaan-pasien/detail?n=" + r.message.reception.name
    			}
    		}
    	});
    }
    
    changeModeEditPet(e) {
        e.preventDefault();
        document.getElementById("reception_form").reset();
        this.setState({'modeEditPet': !this.state.modeEditPet})
    }
    
    deletePet(e, i) {
        e.preventDefault();
        var new_pets = this.state.new_pets
        new_pets[i]['status'] = 'Nonactive'
        this.setState({'new_pets': new_pets})
    }
    
    setDecease(e, pet_name) {
        var th = this
        
        e.preventDefault();
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetpet.vetpet.set_decease",
            args: {data: [pet_name]},
            callback: function(r){
                if (r.message.success) {
                    var new_pets = th.state.new_pets.slice()
                    var pet = new_pets.find(p => p.name == pet_name)
                    pet?pet.status = 'Nonactive':false
                    th.setState({'new_pets': new_pets})
                }
            }
        });
    }
    
    listFilter(e, type, i=false) {
        e.preventDefault()
        var url
        if (type == 'Reception') {
            if (i) {
                var name = this.state.new_pets[i]['name']
                url = '/main/penerimaan/penerimaan-pasien?pet=' + encodeURIComponent(name);
            } else {
                url = '/main/penerimaan/penerimaan-pasien?petOwner=' + encodeURIComponent(this.state.new_owner.name);
            }
        } else if (type == 'Rekam Medis') {
            var name
            if (i) {
                name = this.state.new_pets[i]['name']
            } else {
                name = this.state.new_reception.pet
            }
            url = '/main/rekam-medis/rekam-medis?pet=' + encodeURIComponent(name);
        } else if (type == 'Kunjungan Berikutnya') {
            var name = this.state.new_reception.pet
            url = '/main/penerimaan/layanan-berjadwal?pet=' + encodeURIComponent(name);
        } else if (type == 'Spending') {
            if (i) {
                var name = this.state.new_pets[i]['name']
                // url = '/main/kasir/customer-invoices?pet=' + encodeURIComponent(name);
                url = '/main/penerimaan/data-pemilik/spending?pet=' + encodeURIComponent(name);
            } else {
                // url = '/main/kasir/customer-invoices?petOwner=' + encodeURIComponent(this.state.new_owner.name);
                url = '/main/penerimaan/data-pemilik/spending?petOwner=' + encodeURIComponent(this.state.new_owner.name);
            }
        } else if (type == 'Credit') {
            var name = this.state.new_owner.name
            url = '/main/kasir/deposit?n=' + encodeURIComponent(name);
        } else if (type == 'Debt') {
            var name = this.state.new_owner.name
            url = '/main/kasir/piutang?n=' + encodeURIComponent(name);
        }
        
        window.location.href = url
    }
    
    resetForm(e) {
        e.preventDefault();
        this.setState({'new_pets': [], 'new_owner': {}, 'data_exist': false})
    }
    
    nextInput(e) {
        if(e.key == 'Tab'){
            e.preventDefault();
            document.getElementById("service").focus();
        }
    }
    
    backToList(){
        if(window.location.href.includes('/main/penerimaan/penerimaan-pasien') && document.referrer.includes('/main/penerimaan/penerimaan-pasien')){
            window.location.href = '/main/penerimaan/penerimaan-pasien'
        } else if(window.location.href.includes('/main/penerimaan/data-pasien') && document.referrer.includes('/main/penerimaan/data-pasien')){
            window.location.href = '/main/penerimaan/data-pasien'
        } else if(window.location.href.includes('/main/penerimaan/data-pemilik') && document.referrer.includes('/main/penerimaan/data-pemilik')){
            window.location.href = '/main/penerimaan/data-pemilik'
        } else {
            history.back()
        }
    }
    
    customerInvoiceClick(){
        if(this.state.new_reception.customer_invoice && this.state.new_reception.customer_invoice.length > 1){
            window.location.href = '/main/kasir/customer-invoices?register_number='+encodeURIComponent(this.state.new_reception.register_number)
        } else if(this.state.new_reception.customer_invoice && this.state.new_reception.customer_invoice.length == 1) {
            window.location.href = '/main/kasir/customer-invoices/edit?n='+encodeURIComponent(this.state.new_reception.customer_invoice[0])
        } else {
            frappe.msgprint('Belum ada Transaksi')
        }
    }
    
    rawatInapInvoiceClick(){
        if(this.state.new_reception.rawat_inap_invoice && this.state.new_reception.rawat_inap_invoice.length > 1){
            window.location.href = '/main/kasir/rawat-inap-invoices?register_number='+encodeURIComponent(this.state.new_reception.register_number)
        } else if(this.state.new_reception.rawat_inap_invoice && this.state.new_reception.rawat_inap_invoice.length == 1) {
            window.location.href = '/main/kasir/rawat-inap-invoices/edit?n='+encodeURIComponent(this.state.new_reception.rawat_inap_invoice[0])
        } else {
            frappe.msgprint('Belum ada Transaksi')
        }
    }
    
    render() {
        var write = checkPermission('VetPetOwner', this.state.currentUser, 'write')
        var decease = checkPermission('VetPetOwner', this.state.currentUser, 'decease')
        var buttonMode, dataPenerimaan, searchPopup, visit, spending, rekam_medis, kunjungan_berikutnya, credit, debt
        var lineHeight_style = {lineHeight: '10px'}
        var background_style = {background: '#FFFFFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', padding: '2px 32px', marginBottom: '15px'}
        var noLeftRight = {left: '0', right: '0'}
        
        var color = {color: '#056EAD', cursor: 'pointer'}
        var cursor = {cursor: 'pointer'}
        var rowMinHeight = {minHeight: '64px'}
        var emptyDivStyle = {height: '64px'}
		var backButton = <span className="fs16 fw600 mr-4 my-auto" style={color} onClick={() => this.backToList()}><i className="fa fa-chevron-left mr-1" style={color}></i>Back</span>
		
		spending = <div className="col-auto mr-2" onClick={e => this.listFilter(e, 'Spending')} style={cursor}>
                        <div className="row mx-0">
                            <div className="col-auto px-3">
                                <img className="d-block mx-auto header-icon mt-2" src="/static/img/main/menu/spending.png"/>
                                <p className="mb-0 fs12 text-muted text-center">Spending</p>
                            </div>
                            <div className="col-auto px-2 d-flex my-auto">
                                <span className="fs26 fw600">
                                    {formatter.format(this.state.data.total_spending)}
                                </span>
                            </div>
                        </div>
                    </div>
        
        credit = <div className="col-auto" onClick={e => this.listFilter(e, 'Credit')} style={cursor}>
                        <div className="row mx-0">
                            <div className="col-auto px-3">
                                <img className="d-block mx-auto header-icon mt-2" src="/static/img/main/menu/credit.png"/>
                                <p className="mb-0 fs12 text-muted text-center">Deposit</p>
                            </div>
                            <div className="col-auto px-2 d-flex my-auto">
                                <span className="fs26 fw600">
                                    {formatter.format(this.state.data.total_credit-this.state.data.total_remaining)}
                                </span>
                            </div>
                        </div>
                    </div>
                    
        debt = <div className="col-auto mr-auto" onClick={e => this.listFilter(e, 'Debt')} style={cursor}>
                        <div className="row mx-0">
                            <div className="col-auto px-3">
                                <img className="d-block mx-auto header-icon mt-2" src="/static/img/main/menu/credit.png"/>
                                <p className="mb-0 fs12 text-muted text-center">Piutang</p>
                            </div>
                            <div className="col-auto px-2 d-flex my-auto">
                                <span className="fs26 fw600">
                                    {formatter.format(this.state.data.total_debt)}
                                </span>
                            </div>
                        </div>
                    </div>
                    
        visit = <div className="col-auto mr-2" onClick={e => this.listFilter(e, 'Reception')} style={cursor}>
                    <div className="row mx-0">
                        <div className="col-auto px-3">
                            <img className="d-block mx-auto header-icon mt-2" src="/static/img/main/menu/visit.png"/>
                            <p className="mb-0 fs12 text-muted text-center">Visit</p>
                        </div>
                        <div className="col-auto px-2 d-flex my-auto">
                            <span className="fs26 fw600">
                                {this.state.data.total_visit}
                            </span>
                        </div>
                    </div>
                </div>
        
        rekam_medis = <div className="col-auto mr-auto" onClick={e => this.listFilter(e, 'Rekam Medis')} style={cursor}>
                        <div className="row mx-0">
                            <div className="col-auto px-3">
                                <img className="d-block mx-auto header-icon mt-2" src="/static/img/main/menu/rekam-medis.png"/>
                                <p className="mb-0 fs12 text-muted text-center">Rekam Medis</p>
                            </div>
                            <div className="col-auto px-2 d-flex my-auto">
                                <span className="fs26 fw600">
                                    {this.state.data.rekam_medis}
                                </span>
                            </div>
                        </div>
                    </div>
                    
        kunjungan_berikutnya = <div className="col-auto mr-auto" onClick={e => this.listFilter(e, 'Kunjungan Berikutnya')} style={cursor}>
                                    <div className="row mx-0">
                                        <div className="col-auto px-0">
                                            <img className="d-block mx-auto header-icon mt-2" src="/static/img/main/menu/kunjungan-berikutnya.png"/>
                                            <p className="mb-0 fs12 text-muted text-center">Kunjungan Berikutnya</p>
                                        </div>
                                        <div className="col-auto px-2 d-flex my-auto">
                                            <span className="my-auto fs26 fw600">
                                                {this.state.data.kunjungan_berikutnya}
                                            </span>
                                        </div>
                                    </div>
                                </div>
        
        var customer_invoice = (
            <div className="col-auto" style={cursor} onClick={() => this.customerInvoiceClick()}>
                <div className="row mx-0">
                    <div className="col-auto px-3">
                        <img className="d-block mx-auto mt-2 header-icon" src="/static/img/main/menu/cashier.png"/>
                        <p className="mb-0 fs12 text-muted text-center">Customer Invoice</p>
                    </div>
                </div>
            </div>
        )
        
        var rawat_inap_invoice = (
            <div className="col-auto" style={cursor} onClick={() => this.rawatInapInvoiceClick()}>
                <div className="row mx-0">
                    <div className="col-auto px-3">
                        <img className="d-block mx-auto mt-2 header-icon" src="/static/img/main/menu/cashier.png"/>
                        <p className="mb-0 fs12 text-muted text-center">Rawat Inap Invoice</p>
                    </div>
                </div>
            </div>
        )
        
        if (mode == 'New') {
            var emptyDivStyle = {height: '64px'}
            buttonMode = <div style={background_style}>
                    		<div className="row mx-0 flex-row-reverse">
                    			<div className="col-auto my-auto">
                    				<a href="#" className="btn btn-sm fs12 btn-outline-danger text-uppercase h-100 fwbold py-2" onClick={(e) => this.resetForm(e)}>Reset Form</a>
                    			</div>
                    			<div className="col-auto my-auto">
                    				<button type="submit" className="btn btn-sm btn-danger fs12 text-uppercase h-100 fwbold py-2">Daftar Penerimaan</button>
                    			</div>
                    			<div className="col-auto my-auto">
                    				<button type="button" className="btn btn-sm btn-danger fs12 text-uppercase h-100 fwbold py-2" onClick={this.refreshAction}>Refresh</button>
                    			</div>
                    			<div className="col-auto p-0" style={emptyDivStyle}/>
                    			<div className="col-auto d-flex mr-auto">
                    			    {backButton}
                    			</div>
                    		</div>
                    		<div id="alert_box" className="text-center mb-3 position-absolute" style={noLeftRight}></div>
                	    </div>
    	    dataPenerimaan = <DataPenerimaan services={this.state.data.services} products={this.state.data.products} handleInputChange={(e) => this.handleInputChangeReception(e)} reception={this.state.new_reception} handleInputBlur={this.handleInputBlur}/>
    	    if (this.state.show_search){
    	        searchPopup = (
    	            <PetOwnerPopup rowClick={this.processPopupRow} close={() => this.closeSearchPopup()}/>
    	       )
    	    }
    	    
    	    if (this.state.show_search_pet){
    	        searchPopup = (
    	            <PetPopup rowClick={(data) => this.processPopupRow(data, true)} close={() => this.closeSearchPopup(true)}/>
    	       )
    	    }
        } else if (mode == 'Edit Pet' || mode == 'Edit Owner') {
            if (this.state.modeEditPet) {
                buttonMode = <div style={background_style}>
                        		<div className="row mx-0 flex-row-reverse">
                        			<div className="col-auto d-flex my-auto">
                        				<a href="#" className="d-block btn btn-sm fs12 btn-outline-danger text-uppercase fwbold py-2 px-4" onClick={this.changeModeEditPet}>Batalkan</a>
                        			</div>
                        			<div className="col-auto d-flex my-auto">
                        				<button type="submit" className="d-block btn btn-sm btn-danger fs12 text-uppercase fwbold py-2 px-4">Simpan</button>
                        			</div>
                        			{debt}
                        			{credit}
                        			{spending}
                        			{visit}
                        			<div className="col-auto d-flex mr-auto">
                        			    {backButton}
                        			</div>
                        		</div>
                        		<div id="alert_box" className="text-center mb-3 position-absolute" style={noLeftRight}></div>
                    	    </div>
            } else {
                var edit_button
                if (write){
                    edit_button = <div className="col-auto d-flex my-auto">
        				<button className="btn btn-sm btn-danger fs12 fwbold text-uppercase py-2 px-4" onClick={this.changeModeEditPet}>Edit</button>
        			</div>
                }
                
                buttonMode = <div style={background_style}>
                        		<div className="row mx-0 flex-row-reverse">
                        			{edit_button}
                        			{debt}
                        			{credit}
                        			{spending}
                        			{visit}
                        			<div className="col-auto d-flex mr-auto">
                        			    {backButton}
                        			</div>
                        		</div>
                    	    </div>
            }
        } else if (mode == 'Detail') {
            if (document.referrer.includes('/main/penerimaan/penerimaan-pasien/form')) {
                buttonMode = <div style={background_style}>
                        		<div className="row mx-0 flex-row-reverse" style={rowMinHeight}>
                        			<div className="col-auto d-flex my-auto">
                        				<a href="/main/penerimaan/penerimaan-pasien/form" className="btn btn-sm btn-danger fs12 text-uppercase h-100 fwbold py-2" >Tambah Baru</a>
                        			</div>
                        			<div className="col-auto d-flex mr-auto">
                        			    {backButton}
                        			</div>
                        		</div>
                        		<div id="alert_box" className="text-center mb-3 position-absolute" style={noLeftRight}></div>
                    	    </div> 
            } else {
                buttonMode = <div style={background_style}>
                        		<div className="row mx-0 flex-row-reverse">
                        		    {kunjungan_berikutnya}
                        		    {rawat_inap_invoice}
                        		    {customer_invoice}
                        		    {rekam_medis}
                        			{spending}
                        			<div className="col-auto d-flex mr-auto">
                        			    {backButton}
                        			</div>
                        		</div>
                        		<div id="alert_box" className="text-center mb-3 position-absolute" style={noLeftRight}></div>
                    	    </div>
            }
            dataPenerimaan = <DataPenerimaan reception={this.state.new_reception}/>
        } else if (mode == 'New Pet') {
            buttonMode = <div style={background_style}>
                    		<div className="row mx-0 flex-row-reverse">
                    			<div className="col-auto my-auto">
                    				<a href="/main/penerimaan/data-pasien" className="btn btn-sm fs12 btn-outline-danger text-uppercase h-100 fwbold py-2">Batalkan</a>
                    			</div>
                    			<div className="col-auto my-auto">
                    				<button type="submit" className="btn btn-sm btn-danger fs12 text-uppercase h-100 fwbold py-2">Daftar Pasien</button>
                    			</div>
                    			<div className="col-auto my-auto">
                    				<button type="button" className="btn btn-sm btn-danger fs12 text-uppercase h-100 fwbold py-2" onClick={this.refreshAction}>Refresh</button>
                    			</div>
                    			<div className="col-auto p-0" style={emptyDivStyle}/>
                    			<div className="col-auto d-flex mr-auto">
                    			    {backButton}
                    			</div>
                    		</div>
                    		<div id="alert_box" className="text-center mb-3 position-absolute" style={noLeftRight}></div>
                	    </div> 
    	    if (this.state.show_search){
    	        searchPopup = (
    	            <PetOwnerPopup rowClick={this.processPopupRow} close={() => this.closeSearchPopup()}/>
    	       )
    	    }
        } else if (mode == 'New Owner') {
            buttonMode = <div style={background_style}>
                    		<div className="row mx-0 flex-row-reverse">
                    			<div className="col-auto my-auto">
                    				<a href="/main/penerimaan/data-pemilik" className="btn btn-sm fs12 btn-outline-danger text-uppercase h-100 fwbold py-2">Batalkan</a>
                    			</div>
                    			<div className="col-auto my-auto">
                    				<button type="submit" className="btn btn-sm btn-danger fs12 text-uppercase h-100 fwbold py-2">Daftar Pemilik</button>
                    			</div>
                    			<div className="col-auto my-auto">
                    				<button type="button" className="btn btn-sm btn-danger fs12 text-uppercase h-100 fwbold py-2" onClick={this.refreshAction}>Refresh</button>
                    			</div>
                    			<div className="col-auto p-0" style={emptyDivStyle}/>
                    			<div className="col-auto d-flex mr-auto">
                    			    {backButton}
                    			</div>
                    		</div>
                    		<div id="alert_box" className="text-center mb-3 position-absolute" style={noLeftRight}></div>
                	    </div> 
        }
        
        if (this.state.loaded) {
            console.log(this.state)
            var marginTop = {marginTop: 0}
            mode=='Detail'?marginTop.marginTop = -20:false
            
            var recordNavigation
            if(!['PemilikBaru','PasienBaru','PenerimaanPasien Baru'].includes(id)){
                recordNavigation = <RecordNavigation currentname={id} namelist={this.state.namelist} navigationAction={this.navigationAction} zero_margin={mode=="Detail"?true:false}/>
            }
            
            return (
            <div>
                <form id="reception_form" method="POST" action="/form" onSubmit={(e) => this.submitForm(e)}>
                    {buttonMode}
                    {recordNavigation}
                	<div className="mb-3" style={marginTop}>
                		<div className="row">
                			{dataPenerimaan}
                		</div>
                	</div>
            	    <div>
                		<div className="row">
                		<DataPemilik newOwner={this.state.new_owner} data_exist={this.state.data_exist} handleInputChange={(e) => this.handleInputChangeOwner(e)} modeEditPet={this.state.modeEditPet} nik_suggest={this.state.nik_suggest} name_suggest={this.state.name_suggest} phone_suggest={this.state.phone_suggest} closeSuggestion={this.closeSuggestion} openSearchPopup={this.openSearchPopup} nextInput={this.nextInput}/>
                		<DataPasien decease={decease} new_pet={this.state.new_pet} new_pets={this.state.new_pets} petType={this.state.data.petType} handleInputChange={this.handleInputChangePet} handleInputChangeNewPet={(e) => this.handleInputChangeNewPet(e)} handleInputBlurPetType={this.handleInputBlurPetType} selectPet={this.selectPet} modeEditPet={this.state.modeEditPet} addNewPet={e => this.addNewPet(e)} addNewPets={e => this.addNewPets(e)} show_detail={this.state.show_detail} deletePet={this.deletePet} setDecease={this.setDecease} listFilter={this.listFilter} pet_suggest={this.state.pet_suggest} closeSuggestion={this.closeSuggestion} openSearchPopup={this.openSearchPopup}/>
                		</div>
                	</div>
                </form>
                {searchPopup}
            </div>
            )
        } else {
            return <div className="row justify-content-center" key='0'>
                    <div className="col-10 col-md-8 text-center border rounded-lg py-4">
                        <p className="mb-0 fs24md fs16 fw600 text-muted">
                            <span><i className="fa fa-spin fa-circle-o-notch mr-3"></i>Loading...</span>
                        </p>
                    </div>
                </div>
        }
    }
}

class DataPemilik extends React.Component {
    clickFile(){
        if(this.$file != undefined){
            var file = this.$file
            $(file).trigger('click');
        }
    }
    
    render() {
        var background_style = {background: '#fff', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)'}
        var inputNIK, inputPemilik, inputNo, inputEmail, inputAlamat, tautan, inputTanggalLahir, inputTempatLahir, inputJenisKelamin, inputTanggalPembuatanKartu, inputProfesi, inputStatusPernikahan, inputNegara, inputAgama
        var newOwner = this.props.newOwner
        var modeEditPet = this.props.modeEditPet
        var cursor = {cursor: 'pointer'}
        var inputFile = <input type="file" className="d-none" accept="image/*" name="foto_identitas" onChange={this.props.handleInputChange} ref={(ref) => this.$file = ref}/>
        var inputFileImage = <img className="product-img product-img-mini" src={newOwner.temp_image || newOwner.foto_identitas || '/static/img/main/menu/insert-image.png'} onClick={() => this.clickFile()}/>
        
        if (mode == 'New') {
            var nik_suggest, name_suggest, phone_suggest
            if(this.props.nik_suggest && this.props.nik_suggest.suggestions.length != 0 && this.props.nik_suggest.show){
                nik_suggest = <InputSuggestion suggestions={this.props.nik_suggest} closeSuggestion={() => this.props.closeSuggestion('nik_suggest')} searchAction={() => this.props.openSearchPopup('nik_suggest')}/>
            }
            if(this.props.name_suggest && this.props.name_suggest.suggestions.length != 0 && this.props.name_suggest.show){
                name_suggest = <InputSuggestion suggestions={this.props.name_suggest} closeSuggestion={() => this.props.closeSuggestion('name_suggest')} searchAction={() => this.props.openSearchPopup('name_suggest')}/>
            }
            if(this.props.phone_suggest && this.props.phone_suggest.suggestions.length != 0 && this.props.phone_suggest.show){
                phone_suggest = <InputSuggestion suggestions={this.props.phone_suggest} closeSuggestion={() => this.props.closeSuggestion('phone_suggest')} searchAction={() => this.props.openSearchPopup('phone_suggest')}/>
            }
            inputNIK = <div className=" px-0 position-relative"><input id="nik" name='nik' autoComplete="off" className="form-control border-0 lightbg" onChange={this.props.handleInputChange} value={newOwner.nik || ''}/>{nik_suggest}</div>
            inputPemilik = <div className=" px-0 position-relative"><input required autoComplete="off" id="owner_name" name='owner_name' className="form-control border-0 lightbg" onChange={this.props.handleInputChange} value={newOwner.owner_name || ''}/>{name_suggest}</div>
            inputNo = <div className=" px-0 position-relative"><input required autoComplete="off" readOnly={this.props.data_exist} id="phone" name='phone' className="form-control border-0 lightbg " onChange={this.props.handleInputChange} value={newOwner.phone || ''}/>{phone_suggest}</div>
            inputEmail = <input readOnly={this.props.data_exist} id="email" name='email' type="email" className="form-control border-0 lightbg " onChange={this.props.handleInputChange} value={newOwner.email || ''}/>
            inputAlamat = <textarea required readOnly={this.props.data_exist} id="address" name='address' className="form-control border-0 lightbg" rows="3" onChange={this.props.handleInputChange} value={newOwner.address || ''} onKeyDown={this.props.nextInput}></textarea>
            inputTanggalLahir = <input readOnly={this.props.data_exist} id="tanggal_lahir" name='tanggal_lahir' type="date" className="form-control border-0 lightbg " onChange={this.props.handleInputChange} value={newOwner.tanggal_lahir || ''}/>
            inputTempatLahir = <input readOnly={this.props.data_exist} id="tempat_lahir" name='tempat_lahir' type="text" className="form-control border-0 lightbg " onChange={this.props.handleInputChange} value={newOwner.tempat_lahir || ''}/>
            inputJenisKelamin = <select disabled={this.props.data_exist} id="jenis_kelamin" name='jenis_kelamin' type="text" className="form-control border-0 lightbg " onChange={this.props.handleInputChange} value={newOwner.jenis_kelamin || ''}>
                                    <option value="" className="d-none"></option>
                                    <option value="LAKI-LAKI">LAKI-LAKI</option>
                                    <option value="PEREMPUAN">PEREMPUAN</option>
                                </select>
            inputTanggalPembuatanKartu = <input readOnly={this.props.data_exist} id="tanggal_pembuatan_kartu" name='tanggal_pembuatan_kartu' type="date" className="form-control border-0 lightbg " onChange={this.props.handleInputChange} value={newOwner.tanggal_pembuatan_kartu || ''}/>
            inputProfesi = <input readOnly={this.props.data_exist} id="profesi" name='profesi' type="text" className="form-control border-0 lightbg " onChange={this.props.handleInputChange} value={newOwner.profesi || ''}/>
            inputStatusPernikahan = <select disabled={this.props.data_exist} id="status_pernikahan" name='status_pernikahan' type="text" className="form-control border-0 lightbg " onChange={this.props.handleInputChange} value={newOwner.status_pernikahan || ''}>
                                        <option value="" className="d-none"></option>
                                        <option value="BELUM KAWIN">BELUM KAWIN</option>
                                        <option value="KAWIN">KAWIN</option>
                                    </select>
            inputNegara = <input readOnly={this.props.data_exist} id="negara" name='negara' type="text" className="form-control border-0 lightbg " onChange={this.props.handleInputChange} value={newOwner.negara || ''}/>
            inputAgama = <input readOnly={this.props.data_exist} id="agama" name='agama' type="text" className="form-control border-0 lightbg " onChange={this.props.handleInputChange} value={newOwner.agama || ''}/>
            if (this.props.data_exist) {
                inputFile = false
            }
        } else if (mode == 'New Owner' || mode == 'New Pet') {
            background_style['maxHeight'] = '728px'
            inputNIK = <div className=" px-0 position-relative"><input id="nik" name='nik' className="form-control border-0 lightbg" onChange={this.props.handleInputChange} value={newOwner.nik || ''}/></div>
            inputPemilik = <div className=" px-0 position-relative"><input required readOnly={this.props.data_exist} id="owner_name" name='owner_name' className="form-control border-0 lightbg" onChange={this.props.handleInputChange} value={newOwner.owner_name || ''}/></div>
            inputNo = <input required readOnly={this.props.data_exist} id="phone" name='phone' className="form-control border-0 lightbg " onChange={this.props.handleInputChange} value={newOwner.phone || ''}/>
            inputEmail = <input readOnly={this.props.data_exist} id="email" name='email' type="email" className="form-control border-0 lightbg " onChange={this.props.handleInputChange} value={newOwner.email || ''}/>
            inputAlamat = <textarea required readOnly={this.props.data_exist} id="address" name='address' className="form-control border-0 lightbg" rows="3" onChange={this.props.handleInputChange} value={newOwner.address || ''}></textarea>
            if (mode == 'New Pet'){
                var nik_suggest, name_suggest
                if(this.props.nik_suggest && this.props.nik_suggest.suggestions.length != 0 && this.props.nik_suggest.show){
                    nik_suggest = <InputSuggestion suggestions={this.props.nik_suggest} closeSuggestion={() => this.props.closeSuggestion('nik_suggest')} searchAction={() => this.props.openSearchPopup('nik_suggest')}/>
                }
                if(this.props.name_suggest && this.props.name_suggest.suggestions.length != 0 && this.props.name_suggest.show){
                    name_suggest = <InputSuggestion suggestions={this.props.name_suggest} closeSuggestion={() => this.props.closeSuggestion('name_suggest')} searchAction={() => this.props.openSearchPopup('name_suggest')}/>
                }
                if(this.props.phone_suggest && this.props.phone_suggest.suggestions.length != 0 && this.props.phone_suggest.show){
                    phone_suggest = <InputSuggestion suggestions={this.props.phone_suggest} closeSuggestion={() => this.props.closeSuggestion('phone_suggest')} searchAction={() => this.props.openSearchPopup('phone_suggest')}/>
                }
                inputNIK = <div className=" px-0 position-relative"><input id="nik" name='nik' autoComplete="off" className="form-control border-0 lightbg" onChange={this.props.handleInputChange} value={newOwner.nik || ''}/>{nik_suggest}</div>
                inputPemilik = <div className=" px-0 position-relative"><input required autoComplete="off" id="owner_name" name='owner_name' className="form-control border-0 lightbg" onChange={this.props.handleInputChange} value={newOwner.owner_name || ''}/>{name_suggest}</div>
                inputNo = <div className=" px-0 position-relative"><input required autoComplete="off" id="phone" name='phone' className="form-control border-0 lightbg " onChange={this.props.handleInputChange} value={newOwner.phone || ''}/>{phone_suggest}</div>
            }
            inputTanggalLahir = <input readOnly={this.props.data_exist} id="tanggal_lahir" name='tanggal_lahir' type="date" className="form-control border-0 lightbg " onChange={this.props.handleInputChange} value={newOwner.tanggal_lahir || ''}/>
            inputTempatLahir = <input readOnly={this.props.data_exist} id="tempat_lahir" name='tempat_lahir' type="text" className="form-control border-0 lightbg " onChange={this.props.handleInputChange} value={newOwner.tempat_lahir || ''}/>
            inputJenisKelamin = <select disabled={this.props.data_exist} id="jenis_kelamin" name='jenis_kelamin' type="text" className="form-control border-0 lightbg " onChange={this.props.handleInputChange} value={newOwner.jenis_kelamin || ''}>
                                    <option value="" className="d-none"></option>
                                    <option value="LAKI-LAKI">LAKI-LAKI</option>
                                    <option value="PEREMPUAN">PEREMPUAN</option>
                                </select>
            inputTanggalPembuatanKartu = <input readOnly={this.props.data_exist} id="tanggal_pembuatan_kartu" name='tanggal_pembuatan_kartu' type="date" className="form-control border-0 lightbg " onChange={this.props.handleInputChange} value={newOwner.tanggal_pembuatan_kartu || ''}/>
            inputProfesi = <input readOnly={this.props.data_exist} id="profesi" name='profesi' type="text" className="form-control border-0 lightbg " onChange={this.props.handleInputChange} value={newOwner.profesi || ''}/>
            inputStatusPernikahan = <select disabled={this.props.data_exist} id="status_pernikahan" name='status_pernikahan' type="text" className="form-control border-0 lightbg " onChange={this.props.handleInputChange} value={newOwner.status_pernikahan || ''}>
                                        <option value="" className="d-none"></option>
                                        <option value="BELUM KAWIN">BELUM KAWIN</option>
                                        <option value="KAWIN">KAWIN</option>
                                    </select>
            inputNegara = <input readOnly={this.props.data_exist} id="negara" name='negara' type="text" className="form-control border-0 lightbg " onChange={this.props.handleInputChange} value={newOwner.negara || ''}/>
            inputAgama = <input readOnly={this.props.data_exist} id="agama" name='agama' type="text" className="form-control border-0 lightbg " onChange={this.props.handleInputChange} value={newOwner.agama || ''}/>
            if (this.props.data_exist) {
                inputFile = false
            }
        } else if (mode == 'Edit Pet' || mode == 'Edit Owner') {
            background_style['maxHeight'] = '728px'
            inputNIK = <input id="nik" name='nik' className="form-control border-0" readOnly value={newOwner.nik}/>
            inputPemilik = <input required id="owner_name" name='owner_name' className={modeEditPet ? 'form-control border-0 lightbg ' : 'form-control border-0'} defaultValue={newOwner.owner_name} onChange={this.props.handleInputChange} readOnly={!modeEditPet}/>
            inputNo = <input required id="phone" name='phone' className={modeEditPet ? 'form-control border-0 lightbg ' : 'form-control border-0'} defaultValue={newOwner.phone} onChange={this.props.handleInputChange} readOnly={!modeEditPet}/>
            inputEmail = <input id="email" name='email' type="email" className={modeEditPet ? 'form-control border-0 lightbg ' : 'form-control border-0'} defaultValue={newOwner.email} onChange={this.props.handleInputChange} readOnly={!modeEditPet}/>
            inputAlamat = <textarea required id="address" name='address' className={modeEditPet ? 'form-control border-0 lightbg ' : 'form-control border-0'} rows="3" defaultValue={newOwner.address} onChange={this.props.handleInputChange} readOnly={!modeEditPet}></textarea>
            inputTanggalLahir = <input id="tanggal_lahir" name='tanggal_lahir' type="date" className={modeEditPet ? 'form-control border-0 lightbg ' : 'form-control border-0'} defaultValue={newOwner.tanggal_lahir || ''} onChange={this.props.handleInputChange} readOnly={!modeEditPet}/>
            inputTempatLahir = <input id="tempat_lahir" name='tempat_lahir' type="text" className={modeEditPet ? 'form-control border-0 lightbg ' : 'form-control border-0'} defaultValue={newOwner.tempat_lahir || ''} onChange={this.props.handleInputChange} readOnly={!modeEditPet}/>
            if (!modeEditPet){
                inputJenisKelamin = <span className="fs16 px-2">{newOwner.jenis_kelamin}</span>
                inputStatusPernikahan = <span className="fs16 px-2">{newOwner.status_pernikahan}</span>
            } else {
                inputJenisKelamin = <select id="jenis_kelamin" name='jenis_kelamin' type="text" className={modeEditPet ? 'form-control border-0 lightbg ' : 'form-control border-0'} defaultValue={newOwner.jenis_kelamin || ''} onChange={this.props.handleInputChange} disabled={!modeEditPet}>
                                    <option value="" className="d-none"></option>
                                    <option value="LAKI-LAKI">LAKI-LAKI</option>
                                    <option value="PEREMPUAN">PEREMPUAN</option>
                                </select>
                inputStatusPernikahan = <select id="status_pernikahan" name='status_pernikahan' type="text" className={modeEditPet ? 'form-control border-0 lightbg ' : 'form-control border-0'} defaultValue={newOwner.status_pernikahan || ''} onChange={this.props.handleInputChange} disabled={!modeEditPet}>
                                        <option value="" className="d-none"></option>
                                        <option value="BELUM KAWIN">BELUM KAWIN</option>
                                        <option value="KAWIN">KAWIN</option>
                                    </select>
            }
            inputTanggalPembuatanKartu = <input id="tanggal_pembuatan_kartu" name='tanggal_pembuatan_kartu' type="date" className={modeEditPet ? 'form-control border-0 lightbg ' : 'form-control border-0'} defaultValue={newOwner.tanggal_pembuatan_kartu || ''} onChange={this.props.handleInputChange} readOnly={!modeEditPet}/>
            inputProfesi = <input id="profesi" name='profesi' type="text" className={modeEditPet ? 'form-control border-0 lightbg ' : 'form-control border-0'} defaultValue={newOwner.profesi || ''} onChange={this.props.handleInputChange} readOnly={!modeEditPet}/>
            inputNegara = <input id="negara" name='negara' type="text" className={modeEditPet ? 'form-control border-0 lightbg ' : 'form-control border-0'} defaultValue={newOwner.negara || ''} onChange={this.props.handleInputChange} readOnly={!modeEditPet}/>
            inputAgama = <input id="agama" name='agama' type="text" className={modeEditPet ? 'form-control border-0 lightbg ' : 'form-control border-0'} defaultValue={newOwner.agama || ''} onChange={this.props.handleInputChange} readOnly={!modeEditPet}/>
            if (!modeEditPet) {
                inputFile = false
            }
        } else if (mode  == 'Detail') {
            inputNIK = <span className="fs16 px-2">{newOwner.nik}</span>
            inputPemilik = <span className="fs16 px-2">{newOwner.owner_name}</span>
            inputNo = <span className="fs16 px-2">{newOwner.phone}</span>
            inputEmail = <span className="fs16 px-2">{newOwner.email}</span>
            inputAlamat = <div className="row mx-0"><span className="fs16 px-2">{newOwner.address}</span></div>
            tautan = <div style={cursor} onClick={() => window.location.href = "/main/penerimaan/data-pemilik/edit?n="+newOwner.name}>
					    <img className="d-block m-auto" src="/static/img/main/menu/tautan.png"/>
				    </div>
			inputTanggalLahir = <span className="fs16 px-2">{newOwner.tanggal_lahir}</span>
            inputTempatLahir = <span className="fs16 px-2">{newOwner.tempat_lahir}</span>
            inputJenisKelamin = <span className="fs16 px-2">{newOwner.jenis_kelamin}</span>
            inputTanggalPembuatanKartu = <span className="fs16 px-2">{newOwner.tanggal_pembuatan_kartu}</span>
            inputProfesi = <span className="fs16 px-2">{newOwner.profesi}</span>
            inputStatusPernikahan = <span className="fs16 px-2">{newOwner.status_pernikahan}</span>
            inputNegara = <span className="fs16 px-2">{newOwner.negara}</span>
            inputAgama = <span className="fs16 px-2">{newOwner.agama}</span>
            inputFile = false
            inputFileImage = <img className="product-img product-img-mini" src={newOwner.temp_image || newOwner.foto_identitas || '/static/img/main/menu/empty-image.png'} onClick={() => this.toggleImage()}/>
        }
        
        return <div className="col-6">
    				<p className="fs18 fw600 text-dark mb-2">
    					Data Pemilik
    				</p>
    				<div style={background_style} className="pemilik-panel">
    					<div className="p-4">
    					    <div className="form-row py-2">
    					        <div className="col-6">
    					            <div className="form-group">
            							<label htmlFor="nik" className="fw600">NIK pemilik</label>
            							<div className="row mx-0">
            								{inputNIK}
            							</div>
            						</div>
    					        </div>
    					        <div className="col-5">
    					            <div className="form-group">
            							<label htmlFor="phone" className="fw600">No handphone</label>
            							<div className="row mx-0">
            								{inputNo}
            							</div>
            						</div>
    					        </div>
    					        {tautan}
    					    </div>
    					    <div className="form-row py-2">
    					        <div className="col-6">
    					            <div className="form-group">
            							<label htmlFor="owner_name" className="fw600">Nama pemilik</label>
            							<div className="row mx-0">
            								{inputPemilik}
            							</div>
            						</div>
    					        </div>
    					        <div className="col-6">
    					            <div className="form-group">
            							<label htmlFor="email" className="fw600">Email</label>
            							<div className="row mx-0">
            								{inputEmail}
            							</div>
            						</div>
    					        </div>
    					    </div>
    					    <div className="form-row py-2">
    					        <div className="col-6">
    					            <div className="form-group">
            							<label htmlFor="tanggal_lahir" className="fw600">Tanggal Lahir</label>
            							<div className="row mx-0">
            								{inputTanggalLahir}
            							</div>
            						</div>
    					        </div>
    					        <div className="col-6">
    					            <div className="form-group">
            							<label htmlFor="tempat_lahir" className="fw600">Tempat Lahir</label>
            							<div className="row mx-0">
            								{inputTempatLahir}
            							</div>
            						</div>
    					        </div>
    					    </div>
    					    <div className="form-row py-2">
    					        <div className="col-6">
    					            <div className="form-group">
            							<label htmlFor="Jenis Kelamin" className="fw600">Jenis Kelamin</label>
            							<div className="row mx-0">
            								{inputJenisKelamin}
            							</div>
            						</div>
    					        </div>
    					        <div className="col-6">
    					            <div className="form-group">
            							<label htmlFor="tanggal_pembuatan_kartu" className="fw600">Tanggal Pembuatan Kartu</label>
            							<div className="row mx-0">
            								{inputTanggalPembuatanKartu}
            							</div>
            						</div>
    					        </div>
    					    </div>
    					    <div className="form-row py-2">
    					        <div className="col-6">
    					            <div className="form-group">
            							<label htmlFor="profesi" className="fw600">Profesi</label>
            							<div className="row mx-0">
            								{inputProfesi}
            							</div>
            						</div>
    					        </div>
    					        <div className="col-6">
    					            <div className="form-group">
            							<label htmlFor="status_pernikahan" className="fw600">Status Pernikahan</label>
            							<div className="row mx-0">
            								{inputStatusPernikahan}
            							</div>
            						</div>
    					        </div>
    					    </div>
    					    <div className="form-row py-2">
    					        <div className="col-6">
    					            <div className="form-group">
            							<label htmlFor="negara" className="fw600">Negara</label>
            							<div className="row mx-0">
            								{inputNegara}
            							</div>
            						</div>
    					        </div>
    					        <div className="col-6">
    					            <div className="form-group">
            							<label htmlFor="agama" className="fw600">Agama</label>
            							<div className="row mx-0">
            								{inputAgama}
            							</div>
            						</div>
    					        </div>
    					    </div>
    						<div className="form-row py-2">
    					        <div className="col-6">
    					            <div className="form-group">
            							<label htmlFor="address" className="fw600">Alamat</label>
            							{inputAlamat}
            						</div>
    					        </div>
    					        <div className="col-6">
    					            <div className="form-group">
            							<label htmlFor="foto_identitas" className="fw600">Foto Identitas</label>
            							<div className="product-img-container-wide">
                            	            {inputFile}
                            	            {inputFileImage}
                            	        </div>
            						</div>
    					        </div>
    					    </div>
    					</div>
    				</div>
    			</div>
    }
}

class DataPasien extends React.Component {
    addPetNewRow() {
        petRow.push(<PetNewRow handleInputChange={this.props.handleInputChange} handleInputBlurPetType={this.props.handleInputBlurPetType}/>)
    }
    
    render() {
        var background_style = {background: '#FFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)'}
        var button_style = {color: '#056EAD', background: '#84D1FF'}
        var overflow_style = {maxHeight: 'calc(100% - 5px)', overflowY: 'auto', overflowX: 'hidden'}
        var newButton, petNewRow
        var petRow = []
        var petType = this.props.petType
        var modeEditPet = this.props.modeEditPet
        var panel_class = "p-4 pasien-panel"
        
        if (mode == 'New' || mode == 'New Pet' || mode == 'New Owner') {
            if (mode == 'New'){
                var panel_class = "p-4 pasien-panel-short"
            }
            var label = "Tambah Pasien"
            if (mode != 'New'){
                label = "Tambah Hewan"
            }
            newButton = <button className="btn fs14 py-3 btn-block text-uppercase rounded mb-3" id="add_pet_row" style={button_style} onClick={this.props.addNewPet}><i className="fa fa-plus mr-2"></i>{label}</button>
            if (this.props.new_pets.length != 0){
                var pr = this
                this.props.new_pets.forEach(function(item, index) {
                    petRow.push(<PetNewRow index={index.toString()} pet={item} petType={petType} key={index.toString()} handleInputChange={(e) => pr.props.handleInputChange(e, index.toString())} handleInputBlurPetType={pr.props.handleInputBlurPetType} selectPet={(e) => pr.props.selectPet(e, index.toString())}/>)
                })
            }
            if (this.props.new_pet != false){
                petRow.unshift(<PetNewRow index="-1" pet={this.props.new_pet} petType={petType} key="-1" addNewPets={this.props.addNewPets} handleInputChange={this.props.handleInputChangeNewPet} handleInputBlurPetType={this.props.handleInputBlurPetType} show_detail={this.props.show_detail} addNewPet={this.props.addNewPet} pet_suggest={this.props.pet_suggest} closeSuggestion={this.props.closeSuggestion} openSearchPopup={this.props.openSearchPopup}/>)
            }
        } else if (mode == 'Detail') {
            var panel_class = "pasien-panel-short"
            var pr = this
            this.props.new_pets.forEach(function(item, index) {
                petRow.push(<PetRow index={index.toString()} pet={item} petType={petType} key={index.toString()} handleInputChange={(e) => pr.props.handleInputChange(e, index.toString())} handleInputBlurPetType={pr.props.handleInputBlurPetType} modeEditPet={modeEditPet}/>)
            })
        } else if(mode == 'Edit Owner' || mode == 'Edit Pet'){
            var pr = this
            if (modeEditPet){
                newButton = <button className="btn fs14 py-3 btn-block text-uppercase rounded mb-3" id="add_pet_row" style={button_style} onClick={this.props.addNewPet}><i className="fa fa-plus mr-2"></i>Tambah Hewan</button>
            }
            this.props.new_pets.forEach(function(item, index) {
                petRow.push(<PetRow decease={pr.props.decease} index={index.toString()} pet={item} petType={petType} key={index.toString()} handleInputChange={(e) => pr.props.handleInputChange(e, index.toString())} handleInputBlurPetType={pr.props.handleInputBlurPetType} modeEditPet={modeEditPet} deletePet={pr.props.deletePet} setDecease={pr.props.setDecease} listFilter={pr.props.listFilter} />)
            })
            if (this.props.new_pet != false){
                petRow.unshift(<PetNewRow index="-1" pet={this.props.new_pet} petType={petType} key="-1" addNewPets={this.props.addNewPets} handleInputChange={this.props.handleInputChangeNewPet} handleInputBlurPetType={this.props.handleInputBlurPetType} show_detail={this.props.show_detail} addNewPet={this.props.addNewPet} />)
            }
        }
        return <div className="col-6">
                    <p className="fs18 fw600 text-dark mb-2">
    					Data Pasien
    				</p>
    				<div className={panel_class} style={background_style}>
    					<div className="py-3 pet_list" style={overflow_style}>
    					    {newButton}
    					    {petNewRow}
    						{petRow}
    					</div>
    				</div>
                </div>
    }
}

class DataPenerimaan extends React.Component {
    serviceClick(){
        if(this.props.reception.service_name == "Dokter"){
            if(this.props.reception.tindakan_dokter && this.props.reception.tindakan_dokter.length > 1){
                window.location.href = "/main/dokter-dan-jasa/tindakan-dokter?register_number="+encodeURIComponent(this.props.reception.register_number)
            } else if(this.props.reception.tindakan_dokter && this.props.reception.tindakan_dokter.length == 1){
                window.location.href = "/main/dokter-dan-jasa/tindakan-dokter/edit?n="+encodeURIComponent(this.props.reception.tindakan_dokter[0])
            }
            
        } else if (this.props.reception.service_name == "Grooming") {
            if(this.props.reception.grooming && this.props.reception.grooming.length > 1){
                window.location.href = "/main/dokter-dan-jasa/grooming?register_number="+encodeURIComponent(this.props.reception.register_number)
            } else if(this.props.reception.grooming && this.props.reception.grooming.length == 1){
                window.location.href = "/main/dokter-dan-jasa/grooming/edit?n="+encodeURIComponent(this.props.reception.grooming[0])
            }
        }
    }
    
    render() {
        var background_style = {background: '#fff', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)'}
        var cursor = {cursor: 'pointer'}
        var inputNoPendaftaran, inputLayanan, inputNoAntrian, inputDetailJasa, inputTanggalPenerimaan, inputCatatan
        var serviceRow = []
        var productRow = []
        var reception = this.props.reception
        var services = this.props.services
        var products = this.props.products
        
        if (mode == 'New') {
            services.forEach(function(item, index) {
                serviceRow.push(
                    <option key={index.toString()} value={item.service_name}></option>
                    )
            })
            if(services != undefined){
                var service = services.find(s => s.name == reception.service)
                if(service != undefined && service.service_name == 'Dokter'){
                    products = products.filter(p => p.product_category.is_dokter == '1')
                }
                else if(service != undefined && service.service_name == 'Grooming'){
                    products = products.filter(p => p.product_category.is_grooming == '1')
                }
            }
            products.forEach(function(item, index) {
                productRow.push(
                    <option key={index.toString()} value={item.product_name}></option>
                    )
            })
            
            inputNoPendaftaran = <div className="row mx-0"><span className="fs16 px-2">/</span></div>
            inputLayanan = <div>
                                <input id="service" list="services" className="form-control border-0 lightbg" name='service' required onChange={this.props.handleInputChange} onBlur={this.props.handleInputBlur} autoComplete="off"/>
                                <datalist id="services">
                                    {serviceRow}
                                </datalist>
                            </div>
            inputNoAntrian = <div className="row mx-0"><span className="fs16 px-2">/</span></div>
            inputDetailJasa = <div>
                                    <input id="service_detail" list="services_detail" className="form-control border-0 lightbg" name='service_detail' required onChange={this.props.handleInputChange} onBlur={this.props.handleInputBlur} autoComplete="off"/>
                                    <datalist id="services_detail">
                                        {productRow}
                                    </datalist>
                                </div>
            inputTanggalPenerimaan = <div>
								<label htmlFor="reception_date" className="fw600">Tanggal Penerimaan</label>
								<div className="row mx-0">
				    				<input id="reception_date" name='reception_date' className="form-control border-0" readOnly defaultValue={moment(reception.reception_date).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss")}/>
								</div>
							</div>
			inputCatatan = <div className="form-group py-2">
								<label htmlFor="description" className="fw600">Catatan</label>
								<textarea id="description" name='description' className="form-control border-0 lightbg" rows="3" onChange={this.props.handleInputChange}></textarea>
							</div>
        } else if (mode == 'Detail') {
            inputNoPendaftaran = <div className="row mx-0"><span className="fs16 px-2">{reception.register_number}</span></div>
            inputLayanan = <div className="row mx-0"><span className="fs16 px-2">{reception.service_name}</span><span style={cursor} onClick={() => this.serviceClick()}><img src="/static/img/main/menu/tautan.png"/></span></div>
            inputNoAntrian = <div className="row mx-0"><span className="fs16 px-2">{reception.queue}</span></div>
            inputDetailJasa = <div className="row mx-0"><span className="fs16 px-2">{reception.product_name}</span></div>
            inputTanggalPenerimaan = <div>
								<label htmlFor="reception_date" className="fw600">Tanggal Penerimaan</label>
								<div className="row mx-0">
									<span className="fs16 px-2">{moment(reception.reception_date).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss")}</span>
								</div>
							</div>
            inputCatatan = <div className="form-group py-2">
								<label htmlFor="reception_description" className="fw600">Catatan</label>
								<div className="row mx-0">
									<span className="fs16 px-2">{reception.description}</span>
								</div>
							</div>
        }
        
        return <div className="col-12">
				<p className="fs18 fw600 text-dark mb-2">
					Data Penerimaan
				</p>
				<div className="p-4" style={background_style}>
					<div className="row">
						<div className="col-9">
    						<div className="form-row">
    				            <div className="col-4">
        				            <div>
        				                <label htmlFor="register_number" className="fw600">No Pendaftaran</label>
        				                {inputNoPendaftaran}
        				            </div>
    				            </div>
    				            <div className="col-4">
    				                {inputTanggalPenerimaan}
    				            </div>
    				            <div className="col-4">
    				                <div>
        				                <label htmlFor="register_number" className="fw600">Layanan</label>
        				                {inputLayanan}
        				            </div>
    				            </div>
    						</div>
    						<div className="form-row">
    						    <div className="col-4">
        						    <div>
        				                <label htmlFor="register_number" className="fw600">No Antrian</label>
        				                {inputNoAntrian}
        				            </div>
    						    </div>
    						    <div className="col-4">
    						        <div>
        				                <label htmlFor="user" className="fw600">Responsible</label>
        				                <p className="mb-0 px-2 fs16">{reception.owner}</p>
        				            </div>
    						    </div>
    						    <div className="col-4">
    						        <div>
        				                <label htmlFor="register_number" className="fw600">Detail Jasa</label>
        				                {inputDetailJasa}
        				            </div>
    						    </div>
    						</div>
						</div>
						<div className="col-3">
						    {inputCatatan}
						</div>
					</div>
				</div>
			</div>
    }
}

class PetNewRow extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'show_detail': false,
            'show_image': false,
        }
    }
    
    // componentDidMount() {
    //     if(this.props.pet.name == undefined){
    //         this.setState({'show_detail': true})
    //     }
    // }
    
    toggleDetail() {
        this.setState({'show_detail': !this.state.show_detail})
    }
    
    toggleImage() {
        this.setState({'show_image': !this.state.show_image})
    }
    
    clickFile(){
        if(this.$file != undefined){
            var file = this.$file
            $(file).trigger('click');
        }
    }
    
    render() {
        var colorStyle = {color: '#056EAD'}
        var opacityStyle = {opacity: '0'}
        var rowStyle = {backgroundColor: '#F5FBFF', marginTop: '-1rem'}
        var pet = this.props.pet
        var petType = this.props.petType
        var index = this.props.index
        var inputPetType, addButton, petHeader, cancelButton, inputJenisKelamin
        var nip_input = <input id="name_pet" name='name_pet' className="form-control border-0" placeholder="/" value={pet.name} readOnly/>
        var inputFile = <input type="file" className="d-none" accept="image/*" name="pet_image" onChange={this.props.handleInputChange} ref={(ref) => this.$file = ref}/>
        var inputFileImage = <img className="product-img product-img-mini" src={pet.temp_image || '/static/img/main/menu/insert-image.png'} onClick={() => this.clickFile()}/>
        var readOnly = false
        
        if (pet.name != undefined) {
            inputPetType = <input required id="hewan_jenis" className="form-control border-0" name='hewan_jenis' value={ pet.type_name } readOnly placeholder={ pet.type_name } />
            inputJenisKelamin = <input required id="jenis_kelamin" className="form-control border-0" name='jenis_kelamin' value={ pet.jenis_kelamin } readOnly placeholder={ pet.jenis_kelamin } />
            readOnly = true
            inputFile = false
            inputFileImage = <img className="product-img product-img-mini" src={pet.temp_image || pet.pet_image_thumbnail || '/static/img/main/menu/empty-image.png'} onClick={() => this.toggleImage()}/>
        } 
        else {
            var petTypeRow = []
            
            petType.forEach(function(item, index) {
                petTypeRow.push(
                    <option value={item.type_name} key={index.toString()}>{item.type_name}</option>
                    )
            })
            
            // inputPetType = <select required id="hewan_jenis" className="form-control border-0" name='hewan_jenis' value={pet.hewan_jenis} onChange={this.props.handleInputChange}>
            //                     <option value=''>Pilih jenis hewan...</option>
        				// 		{petTypeRow}
        				// 	</select>
        	inputPetType = <input required id="hewan_jenis" className="form-control border-0" name='hewan_jenis' value={pet.type_name||pet.hewan_jenis||''} onChange={this.props.handleInputChange} onBlur={e => this.props.handleInputBlurPetType(e)} list="hewan_jenis_list"/>
        	var noneStyle = {display: "none"}
        	inputJenisKelamin = <select required id="jenis_kelamin" className="form-control border-0" name='jenis_kelamin' value={pet.jenis_kelamin} onChange={this.props.handleInputChange}>
                                    <option style={noneStyle}></option>
                                    <option value="Jantan">Jantan</option>
                                    <option value="Betina">Betina</option>
            					</select>
        					
        	if(index == 0){
                nip_input = <input id="name_pet" name='name_pet' className="form-control border-0" defaultValue='' onChange={this.props.handleInputChange}/>
            }
            if (['New', 'New Pet', 'New Owner', 'Edit Owner', 'Edit Pet'].includes(mode)) {
                var button_style = {color: '#056EAD', background: '#84D1FF'}
                var cancel_style = {color: '#056EAD', background: '#F5FBFF', borderColor: '#056EAD',}
                addButton = (<button className="btn fs14 fw600 py-2 px-3 d-block ml-auto rounded" style={button_style} onClick={this.props.addNewPets}><i className="fa fa-plus mr-2"></i>Tambah</button>)
                cancelButton = <button className="btn fs14 fw600 py-2 px-4 d-block ml-auto rounded" style={cancel_style} onClick={this.props.addNewPet}>Cancel</button>
            }
        }
        
        var checked = false
        var select_button
        var button_style = {'color': "#056EAD", "background": "#E4F4FF"}
        if (mode == 'New' && pet.name != undefined) {
            select_button = (
                <button className="pet_row_select btn d-block ml-auto rounded text-center fwbold fs12 py-2 my-auto mr-3" style={button_style} onClick={this.props.selectPet}>
                    Pilih
                </button>
            )
        }
        
        if(mode == 'Detail'){
            rowStyle = {marginTop: '-1rem'}
        }
        
        if(pet.selected && mode == 'New' && pet.name != undefined){
            checked = true
            select_button = (
                <i className="fa fa-3x fa-check-circle-o ml-auto my-auto mr-4"></i>
            )
        }
        
        if (pet.name != undefined) {
            var pet_header_style = {background: '#84D1FF', color: '#056EAD', boxShadow: '0px 6px 6px rgba(0, 0, 0, 0.1)', borderRadius: '5px'}
            var cursor_style = {cursor: 'pointer'}
            var chevron
            if(this.state.show_detail){
                chevron = <i className="fa fa-chevron-up mt-auto" style={cursor_style} onClick={() => this.toggleDetail()}></i>
            }
            else {
                chevron = <i className="fa fa-chevron-down mt-auto" style={cursor_style} onClick={() => this.toggleDetail()}></i>
            }
            
            petHeader = (
                <div style={pet_header_style} className="mb-3">
                    <div className="row mx-0 px-3 py-2">
                        <div className="col-5">
                            <p className="mb-0 fs12 fw600">{pet.name}</p>
                            <p className="mb-0 fs20 fw600">{pet.pet_name}</p>
                        </div>
                        <div className='col text-center d-flex'>
                            <p className="mb-0 fs18 fw600">{pet.type_name}</p>
                        </div>
                        <div className="col text-center d-flex">
                            {select_button}
                        </div>
                        <div className="col-auto d-flex px-0">
                            {chevron}
                        </div>
                    </div>
                </div>
            )
        }
        
        var showImage
        if(this.state.show_image){
            var close_style = {cursor: 'pointer', zIndex: '10', position: 'absolute', top: '10px', right: '10px'}
            showImage = (
                <div className="menu-popup">
                    <div className="container p-5 bg-white rounded-lg position-relative">
                        <i className="fa fa-times float-right fa-2x text-dark" style={close_style} onClick={() => this.toggleImage()}></i>
                        <div className="product-img-container-wide">
                            <img className="product-img" src={pet.temp_image || pet.pet_image_thumbnail || '/static/img/main/menu/empty-image.png'}/>
                        </div>
                        <div className="menu-popup-close" onClick={() => this.toggleImage()}></div>
                    </div>
                </div>
            )
        }
        
        var detail
        var pet_suggest
        if(this.state.show_detail || (pet.name == undefined && this.props.show_detail)){
            if(this.props.pet_suggest && this.props.pet_suggest.suggestions.length != 0 && this.props.pet_suggest.show){
                pet_suggest = <InputSuggestion suggestions={this.props.pet_suggest} closeSuggestion={() => this.props.closeSuggestion('pet_suggest')} searchAction={() => this.props.openSearchPopup('pet_suggest')}/>
            }
            
            detail = (
                <div className="mb-3 p-4" style={rowStyle}>
                	<div className="form-row py-2">
                		<div className="col-6">
                			<div className="form-group">
                				<label htmlFor="name_pet" className="fw600">No Induk Pasien (NIP)</label>
                				{nip_input}
                			</div>
                		</div>
                		<div className="col-6">
                			<div className="form-group">
                			    <label htmlFor="register_date" className="fw600">Tanggal Registrasi</label>
            				    <input id="register_date" name='register_date' className="form-control border-0" readOnly value={moment(pet.register_date).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss")|| ''}/>
                			</div>
                		</div>
                	</div>
                	<div className="form-row py-2">
                	    <div className="col-6">
                			<div className="form-group">
                				<label htmlFor="pet_name" className="fw600">Nama Pasien</label>
                				<div className=" px-0 position-relative"><input required id="pet_name" name='pet_name' className="form-control border-0" value={pet.pet_name || ''} readOnly={readOnly} onChange={this.props.handleInputChange}/>{pet_suggest}</div>
                			</div>
                		</div>
                		<div className="col-6">
                		    <div className="form-group">
                        		<label htmlFor="birth_date" className="fw600">Tanggal Lahir</label>
                        		<input type="date" id="birth_date" name='birth_date' className="form-control border-0" value={pet.birth_date || ''} onChange={this.props.handleInputChange} readOnly={readOnly}/>
                        	</div>
                		</div>
                	</div>
                	<div className="form-row py-2">
                	    <div className="col-6">
                			<div className="form-group">
                				<label htmlFor="hewan_jenis" className="fw600">Hewan / Jenis</label>
                				{inputPetType}
                				<datalist id="hewan_jenis_list">
        	                        <option value=''>Pilih jenis hewan...</option>
        						    {petTypeRow}
        	                    </datalist>
                			</div>
                		</div>
                		<div className="col-6">
                		    <div className="form-group">
                				<label htmlFor="jenis_kelamin" className="fw600">Jenis Kelamin</label>
                				{inputJenisKelamin}
                			</div>
                		</div>
                	</div>
                	<div className="form-row py-2">
                	    <div className="col-6">
                			<div className="form-group">
                        		<label htmlFor="pet_description" className="fw600">Keterangan</label>
                        		<textarea id="pet_description" className="form-control border-0" rows="3" name='pet_description' value={pet.pet_description || ''} readOnly={readOnly} onChange={this.props.handleInputChange}></textarea>
                        	</div>
                		</div>
                		<div className="col-6 text-center">
                		    <div className="form-group">
                    	        <div className="product-img-container-mini">
                    	            {inputFile}
                    	            {inputFileImage}
                    	            {showImage}
                    	        </div>
                    	    </div>
                		</div>
                	</div>
                	<input type="radio" name="pet" value="New" style={opacityStyle} checked={checked} onChange={e => e.preventDefault()}/>
                	<div className="form-row py-2 justify-content-end">
                	    <div className="col-auto">
                	        {cancelButton}
                	    </div>
                	    <div className="col-aut0">
                	        {addButton}
                	    </div>
                	</div>
                </div>
            )
        }
        
        return (
            <div className="pet_row">
                {petHeader}
                {detail}
            </div>
        )
    }
}

class PetRow extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'show_detail': false,
            'show_validation': false,
            'show_image': false
        }
    }
    
    toggleDetail() {
        this.setState({'show_detail': !this.state.show_detail})
    }
    
    toggleValidation() {
        this.setState({'show_validation': !this.state.show_validation, 'show_detail': false})
    }
    
    toggleImage() {
        this.setState({'show_image': !this.state.show_image})
    }
    
    deleteHewan(e) {
        this.toggleValidation()
        this.props.deletePet(e, this.props.index)
    }
    
    setDecease(e) {
        this.toggleValidation()
        this.props.setDecease(e, this.props.pet.name)
    }
    
    clickFile(){
        if(this.$file != undefined){
            var file = this.$file
            $(file).trigger('click');
        }
    }
    
    render() {
        var index = this.props.index
        var pet = this.props.pet
        var petType = this.props.petType
        var border_style = {color: '#056EAD'}
        var cursor = {cursor: 'pointer'}
        var readonly, inputPetType, detailHeader, decease, validation, inputJenisKelamin
        var modeEditPet = this.props.modeEditPet
        var rowStyle = {backgroundColor: '#F5FBFF', marginTop: '-1rem'}
        var inputFile = <input type="file" className="d-none" accept="image/*" name="pet_image" onChange={this.props.handleInputChange} ref={(ref) => this.$file = ref}/>
        var inputFileImage = <img className="product-img product-img-mini" src={pet.temp_image || pet.pet_image_thumbnail || '/static/img/main/menu/insert-image.png'} onClick={() => this.clickFile()}/>
        
        if (!['Edit Pet', 'Edit Owner'].includes(mode)) {
            readonly = true
        } else {
            readonly = !modeEditPet
        }
        
        if (mode == 'Detail' || (mode == 'Edit Pet' && !modeEditPet) || (mode == 'Edit Owner' && !modeEditPet)) {
            inputPetType = <input required id="hewan_jenis" className="form-control border-0" name='hewan_jenis' value={ pet.type_name } readOnly placeholder={ pet.type_name } />
            inputJenisKelamin = <input required id="jenis_kelamin" className="form-control border-0" name='jenis_kelamin' value={ pet.jenis_kelamin } readOnly placeholder={ pet.jenis_kelamin } />
            inputFile = false
            inputFileImage = <img className="product-img product-img-mini" src={pet.pet_image_thumbnail || '/static/img/main/menu/empty-image.png'} onClick={() => this.toggleImage()}/>
        } else if (mode == 'Edit Pet' || mode == 'Edit Owner') {
            var petTypeRow = []
            
            petType.forEach(function(item, index) {
                petTypeRow.push(
                    <option value={item.type_name} key={index.toString()}>{item.type_name}</option>
                    )
            })
            
            // inputPetType = <select required id="hewan_jenis" className="form-control border-0" name='hewan_jenis' defaultValue={pet.hewan_jenis} onChange={this.props.handleInputChange}>
        				// 		{petTypeRow}
        				// 	</select>
        	inputPetType = <input required id="hewan_jenis" className="form-control border-0" name='hewan_jenis' defaultValue={pet.type_name||pet.hewan_jenis||''} onChange={this.props.handleInputChange} onBlur={e => this.props.handleInputBlurPetType(e, this.props.index)} list='hewan_jenis_list'/>
        	var noneStyle = {display: 'none'}
        	inputJenisKelamin = <select required id="jenis_kelamin" className="form-control border-0" name='jenis_kelamin' defaultValue={pet.jenis_kelamin} onChange={this.props.handleInputChange}>
        						<option style={noneStyle}></option>
        						<option value="Jantan">Jantan</option>
        						<option value="Betina">Betina</option>
        					</select>
        }
        
        if(mode == 'Detail'){
            rowStyle = {marginTop: '-1rem'}
        }
        
        if(mode != 'Detail'){
            var pet_header_style
            if (pet.status == 'Nonactive') {
                pet_header_style = {background: '#D4D4D4', color: '#818487', boxShadow: '0px 6px 6px rgba(0, 0, 0, 0.1)', borderRadius: '5px'}
            } else {
                pet_header_style = {background: '#84D1FF', color: '#056EAD', boxShadow: '0px 6px 6px rgba(0, 0, 0, 0.1)', borderRadius: '5px'}
            }
            var cursor_style = {cursor: 'pointer'}
            var chevron
            if(this.state.show_detail){
                chevron = <i className="fa fa-chevron-up mt-auto" style={cursor_style} onClick={() => this.toggleDetail()}></i>
            }
            else {
                chevron = <i className="fa fa-chevron-down mt-auto" style={cursor_style} onClick={() => this.toggleDetail()}></i>
            }
            
            if (pet.name != '/' && pet.status == 'Active' && this.props.decease) {
                var btn_style = {color: '#056EAD', background: '#F5FBFF'}
                decease = <a className="btn mx-3 my-auto" onClick={() => this.toggleValidation()} style={btn_style}>Decease</a>
            } else if (!readonly && pet.name != '/' && pet.status == 'Nonactive') {
                var decease_style = {color: '#818487'}
                decease = <span className="btn mx-3 my-auto" style={decease_style}>Deceased</span>
            }
            
            if (this.state.show_validation) {
                var container_style = {borderRadius: '10px'}
                validation = <div className='custom-modal-overlay active' onClick={this.toggleValidation}>
                                <div className="container custom-modal-container slim" style={container_style} onClick={event => event.stopPropagation()}>
                                	<section className="px-5 py-4">
                                    	<p className="fs24 fs24md text-center mb-4">{'Apakah anda yakin akan mengubah status ' + pet.pet_name + ' menjadi mati ?'}</p>
                                    	<div className="row justify-content-center">
                                            <button className="btn btn-gray py-1 py-lg-2 px-2 px-lg-3 mr-5" onClick={!readonly?(e) => this.deleteHewan(e):(e) => this.setDecease(e)}><p className="fs18 fs18md mb-0">Ya</p></button>
                                            <button className="btn btn-gray py-1 py-lg-2 px-2 px-lg-3" onClick={() => this.toggleValidation()}><p className="fs18 fs18md mb-0">Tidak</p></button>
                                        </div>
                                	</section>
                                </div>
                            </div>
            }
            
            var petHeader = (
                <div style={pet_header_style} className="mb-3">
                    <div className="row mx-0 px-3 py-2">
                        <div className="col">
                            <p className="mb-0 fs12 fw600">{pet.name}</p>
                            <p className="mb-0 fs20 fw600">{pet.pet_name}</p>
                        </div>
                        <div className='col-auto ml-auto text-center d-flex px-0'>
                            <p className="my-auto mx-3 fs18 fw600">{pet.type_name}</p>
                        </div>
                        <div className="col-auto d-flex px-0">
                            {decease}
                            {chevron}
                        </div>
                    </div>
                </div>
            )
            
            detailHeader = (
                <div className="row pb-3 justify-content-center border-bottom">
                    <div className="col-auto text-center" style={cursor} onClick={e => this.props.listFilter(e, 'Rekam Medis', index)}>
                        <img src="/static/img/main/menu/rekam-medis.png"/>
                        <p className="mb-0 fs10 text-muted">Rekam Medis</p>
                    </div>
                    <div className="col-auto text-center" style={cursor} onClick={e => this.props.listFilter(e, 'Reception', index)}>
                        <div className="row mx-0">
                            <div className="col-auto px-2">
                                <img src="/static/img/main/menu/visit.png"/>
                                <p className="mb-0 fs10 text-muted">Visit</p>
                            </div>
                            <div className="col-auto px-2 d-flex">
                                <span className="my-auto fs30 fw600">
                                    {pet.visit}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="col-auto" style={cursor} onClick={e => this.props.listFilter(e, 'Spending', index)}>
                        <div className="row mx-0">
                            <div className="col-auto px-2">
                                <img src="/static/img/main/menu/spending.png"/>
                                <p className="mb-0 fs10 text-muted">Spending</p>
                            </div>
                            <div className="col-auto px-2 d-flex">
                                <span className="my-auto fs18 fw600">
                                    {formatter.format(pet.spending)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
        
        var showImage
        if(this.state.show_image){
            var close_style = {cursor: 'pointer', zIndex: '10', position: 'absolute', top: '10px', right: '10px'}
            showImage = (
                <div className="menu-popup">
                    <div className="container p-5 bg-white rounded-lg position-relative">
                        <i className="fa fa-times float-right fa-2x text-dark" style={close_style} onClick={() => this.toggleImage()}></i>
                        <div className="product-img-container-wide">
                            <img className="product-img" src={pet.temp_image || pet.pet_image || '/static/img/main/menu/empty-image.png'}/>
                        </div>
                        <div className="menu-popup-close" onClick={() => this.toggleImage()}></div>
                    </div>
                </div>
            )
        }
        var tautan
        if (mode == 'Detail') {
            var cursor = {cursor: 'pointer'}
            tautan = <div style={cursor} onClick={() => window.location.href = "/main/penerimaan/data-pasien/edit?n="+pet.name}>
					    <img className="d-block m-auto" src="/static/img/main/menu/tautan.png"/>
				    </div>
        }
        
        var detail
        if(this.state.show_detail || mode == 'Detail'){
            detail = (
                <div className="mb-3 p-4" style={rowStyle}>
                    {detailHeader}
                	<div className="form-row py-2">
                		<div className="col-6">
                			<div className="form-group">
                				<label htmlFor="name_pet" className="fw600">No Induk Pasien (NIP)</label>
                				<input id="name_pet" name='name_pet' className="form-control border-0" value={ pet.name } placeholder={ pet.name } readOnly />
                			</div>
                		</div>
                		<div className="col-5">
                			<div className="form-group">
                				<label htmlFor="pet_name" className="fw600">Nama Pasien</label>
                				<input required id="pet_name" name='pet_name' className="form-control border-0" defaultValue={ pet.pet_name } placeholder={ mode != 'Edit Pet' ? pet.pet_name : '' } readOnly={readonly} onChange={this.props.handleInputChange}/>
                			</div>
                		</div>
                		{tautan}
                	</div>
                	<div className="form-row py-2">
                	    <div className="col-6">
                			<div className="form-group">
                				<label htmlFor="register_date" className="fw600">Tanggal Registrasi</label>
                				<input required id="register_date" className="form-control border-0" name='register_date' value={ moment(pet.register_date).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss") } readOnly placeholder={ moment(pet.register_date).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss") } />
                			</div>
                		</div>
                		<div className="col-6">
                			<div className="form-group">
                        		<label htmlFor="birth_date" className="fw600">Tanggal Lahir</label>
                        		<input type="date" id="birth_date" name='birth_date' className="form-control border-0" value={pet.birth_date || ''} onChange={this.props.handleInputChange} readOnly={readonly} />
                        	</div>
                		</div>
                	</div>
                	<div className="form-row py-2">
                	    <div className="col-6">
                			<div className="form-group">
                				<label htmlFor="hewan_jenis" className="fw600">Hewan / Jenis</label>
                				{inputPetType}
                				<datalist id="hewan_jenis_list">
                				    {petTypeRow}
                				</datalist>
                			</div>
                		</div>
                		<div className="col-6">
                			<div className="form-group">
                        		<label htmlFor="jenis_kelamin" className="fw600">Jenis Kelamin</label>
                        		{inputJenisKelamin}
                        	</div>
                		</div>
                	</div>
                	<div className="form-row py-2">
                	    <div className="col-6">
                			<div className="form-group">
                        		<label htmlFor="pet_description" className="fw600">Keterangan</label>
                        		<textarea readOnly={readonly} id="pet_description" className="form-control border-0" rows="3" name='pet_description' placeholder={ pet.pet_description } onChange={this.props.handleInputChange} defaultValue={pet.pet_description}></textarea>
                        	</div>
                		</div>
                		<div className="col-6 text-center">
                			<div className="form-group">
                    	        <div className="product-img-container-mini">
                    	            {inputFile}
                    	            {inputFileImage}
                    	            {showImage}
                    	        </div>
                    	    </div>
                		</div>
                	</div>
                </div>
            )
        }
        
        return <div className="pet_row" id={pet.name}>
                {petHeader}
            	{detail}
            	{validation}
            </div>
    }
}

ReactDOM.render(<PenerimaanPasien/>,document.getElementById("penerimaan_pasien"));