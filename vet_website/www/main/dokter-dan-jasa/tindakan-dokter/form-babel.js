var kondisiOptions = [
        {label: 'Sehat', value: 'Sehat'},
        {label: 'Sakit', value: 'Sakit'},
        {label: 'Membaik', value: 'Membaik'},
        {label: 'Memburuk', value: 'Memburuk'},
        {label: 'Kritis', value: 'Kritis'},
    ]
    
var id = getUrlParameter('n')
// var tzOffset = new Date().getTimezoneOffset()
var tzOffset = 0

class TindakanDokter extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            'data': {},
            'products': [],
            'loaded': false,
            'main_form_wide': false,
            'add_mode': 'jasa',
            'new_obat': {},
            'checks': [],
            'show_template': false,
            'show_kunjungan_berikutnya': false,
            'currentUser': {},
        }
        
        this.addJasaLain = this.addJasaLain.bind(this)
        this.addTindakLanjut = this.addTindakLanjut.bind(this)
        this.deleteJasaLain = this.deleteJasaLain.bind(this)
        this.deleteTindakLanjut = this.deleteTindakLanjut.bind(this)
        this.changeKunjunganBerikutnya = this.changeKunjunganBerikutnya.bind(this)
        this.changeTindakanDokter = this.changeTindakanDokter.bind(this)
        this.toggleMainFormWide = this.toggleMainFormWide.bind(this)
        this.changeAddMode = this.changeAddMode.bind(this)
        this.handleInputBlur = this.handleInputBlur.bind(this)
        this.handleInputChangeObat = this.handleInputChangeObat.bind(this)
        this.deleteObat = this.deleteObat.bind(this)
        this.deleteObatRacikan = this.deleteObatRacikan.bind(this)
        this.pressEnter = this.pressEnter.bind(this)
        this.toggleSelectObat = this.toggleSelectObat.bind(this)
        this.addToRacikan = this.addToRacikan.bind(this)
        this.addCheck = this.addCheck.bind(this)
        this.deleteCheck = this.deleteCheck.bind(this)
        this.addAttachment = this.addAttachment.bind(this)
        this.deleteAttachment = this.deleteAttachment.bind(this)
        this.addMarker = this.addMarker.bind(this)
        this.resetMarker = this.resetMarker.bind(this)
        this.toggleTemplateTindakan = this.toggleTemplateTindakan.bind(this)
        this.saveTemplate = this.saveTemplate.bind(this)
        this.navigationAction = this.navigationAction.bind(this)
    }
    
    componentDidMount() {
        var td = this
        var lastfilter = JSON.parse(sessionStorage.getItem('/main/dokter-dan-jasa/tindakan-dokter'))
        frappe.call({
            type: "GET",
            method:"vet_website.methods.get_current_user",
            args: {},
            callback: function(r){
                if (r.message) {
                    td.setState({'currentUser': r.message});
                }
            }
        });
        
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vettindakandokter.vettindakandokter.get_name_list",
            args: {filters: lastfilter},
            callback: function(r){
                if (r.message) {
                    td.setState({'namelist': r.message});
                }
            }
        });
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vettindakandokter.vettindakandokter.get_tindakan_dokter_form",
            args: {name: id},
            callback: function(r){
                console.log(r.message)
                if (r.message) {
                    var checks = [
                        {'label': 'Riwayat Vaksin', 'name': 'vaccine_history'},
                        {'label': 'Riwayat Makanan', 'name': 'food_history'},
                        {'label': 'Anamnese', 'name': 'anamnese'},
                        {'label': 'Diagnosa Utama', 'name': 'diagnosa_utama'},
                        {'label': 'Prognosa', 'name': 'prognosa'},
                        {'label': 'Diagnosa Banding', 'name': 'diagnosa_banding'},
                        {'label': 'BCS', 'name': 'bcs'},
                        {'label': 'Vomit', 'name': 'vomit'},
                        {'label': 'Ausc. L', 'name': 'auscl'},
                        {'label': 'Ausc. H', 'name': 'ausch'},
                        {'label': 'Pulsus', 'name': 'pulse'},
                        {'label': 'Respirasi', 'name': 'respiration'},
                        {'label': 'Abdomnal Palpasi Pain', 'name': 'abdominal_palpasi_pain'},
                        {'label': 'Abdominal Palpasi Tension', 'name': 'abdominal_palpasi_tension'},
                        {'label': 'Limfonodule', 'name': 'limfonodule'},
                        {'label': 'Mukosa', 'name': 'mukosa'},
                        {'label': 'Mata', 'name': 'mata'},
                        {'label': 'Hidung', 'name': 'hidung'},
                        {'label': 'Mulut', 'name': 'mulut'},
                        {'label': 'Telinga', 'name': 'telinga'},
                        {'label': 'Kulit', 'name': 'kulit'},
                        {'label': 'Ekstremitas', 'name': 'ekstremitas'},
                        {'label': 'Sensasi Refleks', 'name': 'reflex'},
                        {'label': 'Lainnya', 'name': 'other'},
                        {'label': 'Tindakan', 'name': 'action'},
                        {'label': 'Lainnya Pemeriksaan', 'name': 'other_pemeriksaan'},
                        {'label': 'Lainnya Diagnosa', 'name': 'other_diagnosa'},
                    ]
                    var new_checks = []
                    
                    checks.forEach((c, index) => {
                        if (![undefined, '', null, 0].includes(r.message.dokter[c.name])){
                            c.value = r.message.dokter[c.name]
                            new_checks.push(c)
                        }
                    })
                    
                    td.setState({'data': r.message.dokter, 'loaded': true, 'checks': new_checks, 'version': r.message.version});
                }
            }
        });
        
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vettindakandokter.vettindakandokter.get_all_products",
            args: {},
            callback: function(r){
                console.log(r.message)
                if (r.message) {
                    td.setState({'products': r.message});
                }
            }
        });
        
        $(document).on("keydown", ":input:not(textarea)", function(event) {
            return event.key != "Enter";
        });
    }
    
    navigationAction(name){
        window.location.href="/main/dokter-dan-jasa/tindakan-dokter/edit?n="+name
    }
    
    formSubmit(e){
        e.preventDefault();
        var new_data = this.state.data
        var products = []
        
        if (Object.keys(new_data.template_data).length != 0) {
            var list_tindakan = []
        
            new_data.template_data.tindakan.forEach(function(item, index) {
            	var tindakan = {}
            	tindakan['product'] = item.name
            	tindakan['quantity'] = item.quantity_template
            	tindakan['pagi'] = item.pagi
            	tindakan['siang'] = item.siang
            	tindakan['sore'] = item.sore
            	tindakan['malam'] = item.malam
            	tindakan['description'] = item.description
            	
            	list_tindakan.push(tindakan)
            })
            
            new_data.template_data.tindakan = list_tindakan
            
        }
        
        this.state.checks.forEach((c, index) => {
            if(!c.delete){
                new_data[c.name] = c.value
            }
        })
        
        new_data.obat.forEach(function(item, index) {
        	var product = {}
        	product['product'] = item.name
        	product['quantity'] = item.quantity
        	product['note'] = item.note
        	product['product_racikan'] = []
        	
        	item.product_racikan.forEach(function(item, index) {
        		var product_racikan = {}
        		product_racikan['product'] = item.name
        		product_racikan['quantity'] = item.quantity
        		product_racikan['note'] = item.note
        		product['product_racikan'].push(product_racikan)
        	})
        	
        	products.push(product)
        })
        
        new_data.obat = products
        
        console.log(new_data)
        var method = "vet_website.vet_website.doctype.vettindakandokter.vettindakandokter.confirm_tindakan_dokter"
        this.state.send_to_apotik?method="vet_website.vet_website.doctype.vettindakandokter.vettindakandokter.send_to_apotik":false
        
        frappe.call({
    		type: "POST",
    		method:method,
    		args: {data: new_data},
    		callback: function(r){
    			if (r.message.tindakan_dokter) {
    				window.location.reload()
    			}
    			if (r.message.error) {
    				frappe.msgprint(r.message.error);
    			}
    		}
    	});
    }
    
    rekamMedisClick(e){
        e.preventDefault();
        window.location.href = "/main/rekam-medis/rekam-medis?pet="+this.state.data.pet
    }
    
    deleteJasaLain(i){
        var new_data = JSON.parse(JSON.stringify(this.state.data));
        if(new_data.jasa[i].name != undefined){
            new_data.jasa[i].deleted = true
        }
        else {
            new_data.jasa.splice(i, 1)
        }

        var th = this

        frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vettindakandokter.vettindakandokter.autosave",
            args: {field: 'jasa', value: new_data.jasa.filter(i => !i.deleted), name: id},
            callback: function(r){
                if (r.message) {
                    th.setState({data: new_data})
                } else {
                    frappe.msgprint(r.message.error)
                }
            }
        });
    }
    
    deleteTindakLanjut(i){
        var new_data = JSON.parse(JSON.stringify(this.state.data));
        if(new_data.tindak_lanjut[i].name != undefined){
            new_data.tindak_lanjut[i].deleted = true
        }
        else {
            new_data.tindak_lanjut.splice(i, 1)
        }

        var th = this

        frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vettindakandokter.vettindakandokter.autosave",
            args: {field: 'tindak_lanjut', value: new_data.tindak_lanjut.filter(i => !i.deleted), name: id},
            callback: function(r){
                if (r.message) {
                    th.setState({data: new_data})
                } else {
                    frappe.msgprint(r.message.error)
                }
            }
        });
    }
    
    addJasaLain(e){
        var target = e.target
        var value = target.value
        var new_data = JSON.parse(JSON.stringify(this.state.data));
        var jl = this
        var realValue
        var selected = false
        if (value != undefined || value != '') {
            this.state.products.forEach(function(item, index) {
        	    if (item.product_name == value) {
        	        selected = true
        	        realValue = item.name
        	    }
        	})
        	
        	if (selected) {
        	    e.target.selectedIndex = 0
                frappe.call({
            		type: "POST",
            		method:"vet_website.vet_website.doctype.vetproduct.vetproduct.get_product",
            		args: {name: realValue},
            		callback: function(r){
            			if (r.message.product) {
            				new_data.jasa.push({product: realValue, product_name: r.message.product.product_name, quantity: 1, 'product_price': r.message.product.price, 'product_category': r.message.product.product_category,})
            				frappe.call({
                                type: "POST",
                                method:"vet_website.vet_website.doctype.vettindakandokter.vettindakandokter.autosave",
                                args: {field: 'jasa', value: new_data.jasa.filter(i => !i.deleted), name: id},
                                callback: function(r){
                                    if (r.message) {
                                        jl.setState({'data': new_data})
                                    } else {
                                        frappe.msgprint(r.message.error)
                                    }
                                }
                            });
            			}
            			if (r.message.error) {
            				frappe.msgprint(r.message.error);
            			}
            		}
            	});
            	
            	e.target.value = e.target.defaultValue
        	}
        }
    }
    
    addTindakLanjut(e){
        var target = e.target
        var value = target.value
        var tl = this
        var new_data = JSON.parse(JSON.stringify(this.state.data));
        var selected = false
        var realValue
        if (value != undefined || value != '') {
            this.state.products.forEach(function(item, index) {
        	    if (item.product_name == value) {
        	        selected = true
        	        realValue = item.name
        	    }
        	})
        	
        	if (selected) {
        	    e.target.selectedIndex = 0
                frappe.call({
            		type: "POST",
            		method:"vet_website.vet_website.doctype.vetproduct.vetproduct.get_product",
            		args: {name: realValue},
            		callback: function(r){
            			if (r.message.product) {
            				new_data.tindak_lanjut.push({product: realValue, product_name: r.message.product.product_name, quantity: 1, 'product_price': r.message.product.price, 'product_category': r.message.product.product_category, 'is_rawat': r.message.product.is_rawat})
            				frappe.call({
                                type: "POST",
                                method:"vet_website.vet_website.doctype.vettindakandokter.vettindakandokter.autosave",
                                args: {field: 'tindak_lanjut', value: new_data.tindak_lanjut.filter(i => !i.deleted), name: id},
                                callback: function(r){
                                    if (r.message) {
                                        tl.setState({'data': new_data})
                                    } else {
                                        frappe.msgprint(r.message.error)
                                    }
                                }
                            });
            			}
            			if (r.message.error) {
            				frappe.msgprint(r.message.error);
            			}
            		}
            	});
            	e.target.value = e.target.defaultValue
        	}
        }
    }
    
    changeKunjunganBerikutnya(e, i){
        var target = e.target
        var name = target.name
        var value = target.value
        var new_data = JSON.parse(JSON.stringify(this.state.data));
        if(new_data.layanan_berjadwal[i] == undefined){
            new_data.layanan_berjadwal[i] = {}
        }
        new_data.layanan_berjadwal[i][name] = value
        var th = this
        
        if (new_data.layanan_berjadwal[i]['date'] && new_data.layanan_berjadwal[i]['note']) {
            frappe.call({
                type: "POST",
                method:"vet_website.vet_website.doctype.vettindakandokter.vettindakandokter.autosave",
                args: {field: 'layanan_berjadwal', value: new_data.layanan_berjadwal[i], name: id},
                callback: function(r){
                    if (r.message) {
                        th.setState({data: new_data})
                    } else {
                        frappe.msgprint(r.message.error)
                    }
                }
            });
        }
    }
    
    changeTindakanDokter(e){
        var target = e.target
        var name = target.name
        var value = target.value
        var new_data = JSON.parse(JSON.stringify(this.state.data));
        
        new_data[name] = value

        if (name != 'nama_dokter') {
            frappe.call({
                type: "POST",
                method:"vet_website.vet_website.doctype.vettindakandokter.vettindakandokter.autosave",
                args: {field: name, value: value, name: id},
                callback: function(r){
                    if (r.message != true) {
                        frappe.msgprint(r.message.error)
                    }
                }
            });
        }

        this.setState({data: new_data});
    }
    
    toggleMainFormWide(){
        this.setState({main_form_wide: !this.state.main_form_wide})
    }
    
    changeAddMode(mode){
        this.setState({add_mode: mode})
    }
    
    handleInputBlur(e, list) {
        const value = e.target.value
        const name = e.target.name
        var new_data = this.state.data
    	var selected = false
    	
    	if (name == "product") {
    	    list.forEach(function(item, index) {
        	    if (item.product_name == value) {
        	        selected = true
        	    }
        	})
    	} else if (name == 'obat') {
    	    var obat_name = value.slice(value.search(']') + 2)
    	    list.forEach(function(item, index) {
        	    if (item.product_name == obat_name) {
        	        selected = true
        	    }
        	})
    	} else if (name == "nama_dokter") {
    	    list.forEach(function(item, index) {
        	    if (item.full_name == value) {
        	        selected = true
                    new_data['dokter'] = item.name
                    this.setState({data: new_data})
                    return
        	    }
        	}) 
        }
    	else {
	        list.forEach(function(item, index) {
        	    if (item.label == value) {
        	        selected = true
        	    }
        	})
    	}
    	
    	if (!selected) {
    		e.target.value = ''
    		
    		if (name != 'product' && name != 'obat') {
    		    new_data[name] = ''
		        this.setState({data: new_data})
    		}
    	}
    }
    
    deleteObat(e, index) {
    	var new_data = JSON.parse(JSON.stringify(this.state.data));
    	var onSelectObat = this.state.onSelectObat
    	new_data.obat.splice(index, 1)

        var th = this
    	
    	frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vettindakandokter.vettindakandokter.autosave",
            args: {field: 'obat', value: new_data.obat, name: id},
            callback: function(r){
                if (r.message) {
                    if (onSelectObat == index) {
                        th.setState({data: new_data, onSelectObat: 'false'})
                    } else {
                        th.setState({data: new_data})
                    }
                } else {
                    frappe.msgprint(r.message.error)
                }
            }
        });
    }
    
    handleInputChangeObat(e) {
    	const value = e.target.value
    	const name = e.target.name
    	var new_obat = this.state.new_obat
    	var aa = this
    	var selected = false
    	var realValue
    	var obatAll = this.state.products.filter(i => i.product_category.is_obat || i.product_category.is_racikan) 
    	
    	if (name == 'obat') {
    	    var obat_name = value.slice(value.search(']') + 2)
	    	obatAll.forEach(function(item, index) {
	    		if (item.product_name == obat_name) {
	    			selected = true
	    			realValue = item.name
	    		}
	    	})
	    	
	    	if (selected) {
	    		frappe.call({
	                type: "GET",
	                method:"vet_website.vet_website.doctype.vetapotik.vetapotik.get_product_details",
	                args: {name: realValue},
	                callback: function(r){
	                    if (r.message) {
	                        if (new_obat['quantity'] != undefined) {
            				    r.message.product['quantity'] = new_obat['quantity']
            				}
            				
	                        aa.setState({new_obat: r.message.product})
	                    }
	                }
	            });
	    	}
    	} else if (name == 'quantity') {
    	    if ((value % 1) != 0) {
    	        var new_value = value
    	        if (new_value.includes(',')) {
    	            new_value = new_value.replace(',', '.')
    	        }
    	        
    	        new_value = Math.ceil(parseFloat(new_value))
    	        new_obat[name] = value
    	        new_obat['original_quantity'] = new_value
    	    } else {
    	        new_obat[name] = value
    	    }
    	    
    	    this.setState({new_obat: new_obat})
    	} else {
    		new_obat[name] = value
    		this.setState({new_obat: new_obat})
    	}
    }
    
    pressEnter(e) {
        var th = this
    	var name = e.target.name
    	var new_obat = this.state.new_obat
    	var onSelectObat = this.state.onSelectObat
    	
        if (e.key === 'Enter' || (e.key == 'Tab' && name == 'note')) {
        	e.preventDefault();
            if (new_obat.name && new_obat.name != '' && new_obat.quantity != '0' && new_obat.quantity) {
            	var new_data = JSON.parse(JSON.stringify(this.state.data));
            	if (new_obat.quantity.includes(',')) {
            	    new_obat.quantity = new_obat.quantity.replace(/,/g, '.') 
            	}
            	if (onSelectObat != 'false' && onSelectObat != undefined) {
            		new_data.obat[onSelectObat].product_racikan.push(new_obat)
            	} else {
            		new_data.obat.push(new_obat)
            	}
            	
            	frappe.call({
                    type: "POST",
                    method:"vet_website.vet_website.doctype.vettindakandokter.vettindakandokter.autosave",
                    args: {field: 'obat', value: new_data.obat, name: id},
                    callback: function(r){
                        console.log(r.message)
                        if (r.message) {
                            th.setState({data: new_data, new_obat:{}})
                            var qty = document.getElementById("quantity")
                            var selectObat = document.getElementById("obat_input")
                            var note = document.getElementById("note")
                            qty.value = qty.defaultValue
                            selectObat.value = ''
                            note.value = ''

                            document.getElementById("obat_input").focus();
                        } else {
                            frappe.msgprint(r.message.error)
                        }
                    }
                });
            } else {
            	if (name == 'quantity') {
            		document.getElementById("note").focus();
	            } else if (name == 'note') {
	            	document.getElementById("obat").focus();
	            }
            }
        }
    }
    
    toggleSelectObat(e, i) {
    	e.preventDefault();
    	var onSelectObat = this.state.onSelectObat
    	if (onSelectObat == i) {
            this.setState({onSelectObat: 'false'})
    	} else {
            this.setState({onSelectObat: i})
    	}
    }
    
    deleteObatRacikan(e, indexParent, indexChild) {
    	var new_data = JSON.parse(JSON.stringify(this.state.data));
    	new_data.obat[indexParent].product_racikan.splice(indexChild, 1)
        var th = this
    	
    	frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vettindakandokter.vettindakandokter.autosave",
            args: {field: 'obat', value: new_data.obat, name: id},
            callback: function(r){
                if (r.message) {
                    th.setState({data: new_data})
                } else {
                    frappe.msgprint(r.message.error)
                }
            }
        });
    }
    
    addToRacikan(productIndex, racikanIndex) {
    	var new_data = JSON.parse(JSON.stringify(this.state.data));
    	var product = new_data.obat[productIndex]
    	new_data.obat[racikanIndex].product_racikan.push(product)
    	new_data.obat.splice(productIndex,1)
        var th = this
    	
    	frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vettindakandokter.vettindakandokter.autosave",
            args: {field: 'obat', value: new_data.obat, name: id},
            callback: function(r){
                if (r.message) {
                    if (racikanIndex > productIndex){
                        th.setState({onSelectObat: racikanIndex-1, data: new_data})
                    } else {
                        th.setState({data: new_data})
                    }
                } else {
                    frappe.msgprint(r.message.error)
                }
            }
        });
    }
    
    addCheck(data){
        var checks = this.state.checks.slice()
        checks.push(data)
        console.log(data)
        
        frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vettindakandokter.vettindakandokter.autosave",
            args: {field: data.name, value: data.value, name: id},
            callback: function(r){
                if (r.message != true) {
                    frappe.msgprint(r.message.error)   
                }
            }
        });

        this.setState({checks: checks})
    }
    
    deleteCheck(i){
        var checks = this.state.checks.slice()
        checks[i].delete = true
        
        frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vettindakandokter.vettindakandokter.autosave",
            args: {field: checks[i]['name'], value: '', name: id},
            callback: function(r){
                if (r.message != true) {
                    frappe.msgprint(r.message.error)
                }
            }
        });

        this.setState({checks: checks})
    }
    
    addAttachment(data) {
        var vr = this
        var new_data = JSON.parse(JSON.stringify(this.state.data));
        var name = data.attachment.name;
        var reader = new FileReader();
        reader.onload = function(e) {
            data.filename = name,
            data.dataurl = reader.result
            data.attachment =  URL.createObjectURL(data.attachment)
            new_data.attachments.push(data)
            frappe.call({
                type: "POST",
                method:"vet_website.vet_website.doctype.vettindakandokter.vettindakandokter.autosave",
                args: {field: 'attachments', value: new_data.attachments.filter(i => !i.deleted), name: id},
                callback: function(r){
                    if (r.message) {
                        vr.setState({data: new_data})
                    } else {
                        frappe.msgprint(r.message.error)
                    }
                }
            });
        }
        reader.readAsDataURL(data.attachment);
    }
    
    deleteAttachment(i){
        var new_data = JSON.parse(JSON.stringify(this.state.data));
        if(new_data.attachments[i].name != undefined){
            new_data.attachments[i].deleted = true
        }
        else {
            new_data.attachments.splice(i, 1)
        }
        var th = this
        frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vettindakandokter.vettindakandokter.autosave",
            args: {field: 'attachments', value: new_data.attachments.filter(i => !i.deleted), name: id},
            callback: function(r){
                if (r.message) {
                    th.setState({data: new_data})
                } else {
                    frappe.msgprint(r.message.error)
                }
            }
        });
    }
    
    addMarker(marker){
        var new_data = JSON.parse(JSON.stringify(this.state.data));
        new_data.marker = marker

        frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vettindakandokter.vettindakandokter.autosave",
            args: {field: 'marker', value: new_data.marker, name: id},
            callback: function(r){
                if (r.message != true) {
                    frappe.msgprint(r.message.error)
                }
            }
        });

        this.setState({data: new_data})
    }
    
    resetMarker(){
        var new_data = JSON.parse(JSON.stringify(this.state.data));

        frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vettindakandokter.vettindakandokter.autosave",
            args: {field: 'marker_delete', value: new_data.marker, name: id},
            callback: function(r){
                if (r.message != true) {
                    frappe.msgprint(r.message.error)   
                }
            }
        });

        delete new_data.marker
        this.setState({data: new_data})
    }
    
    toggleTemplateTindakan(e) {
        e.preventDefault()
        this.setState({show_template: !this.state.show_template})
    }
    
    saveTemplate(template_data) {
        var new_data = this.state.data
        new_data.template_data = template_data
        
        this.setState({data: new_data, show_template: false})
    }
    
    cancelTindakanDokter(e) {
        e.preventDefault();
        frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vettindakandokter.vettindakandokter.cancel_tindakan_dokter",
            args: {name: id},
            callback: function(r){
                if (r.message.success) {
                    window.location.pathname = "/main/dokter-dan-jasa/tindakan-dokter"
                } else if(r.message.error) {
                    frappe.msgprint(r.message.error);
                }
            }
        });
    }
    
    toggleShowKunjunganBerikutnya(){
        this.setState({show_kunjungan_berikutnya: !this.state.show_kunjungan_berikutnya})
    }
    
    customerInvoiceClick(){
        if(this.state.data.customer_invoice && this.state.data.customer_invoice.length > 1){
            window.location.href = '/main/kasir/customer-invoices?register_number='+encodeURIComponent(this.state.data.register_number)
        } else if(this.state.data.customer_invoice && this.state.data.customer_invoice.length == 1) {
            window.location.href = '/main/kasir/customer-invoices/edit?n='+encodeURIComponent(this.state.data.customer_invoice[0])
        }
    }
    
    render() {
        var bgstyle = {background: '#FFFFFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', padding: '2px 32px', marginBottom: '15px'}
        var lh14 = {lineHeight: '14px'}
        var color = {color: '#056EAD', cursor: 'pointer'}
        var cursor = {cursor: 'pointer'}
        var backButton = <span className="fs16 fw600 mr-4 my-auto" style={color} onClick={() => window.location.href="/main/dokter-dan-jasa/tindakan-dokter"}><i className="fa fa-chevron-left mr-1" style={color}></i>Back</span>
        var templateTindakan
        var actionButton = []
        var write = checkPermission('VetTindakanDokter', this.state.currentUser, 'write')
        var lanjut = checkPermission('VetTindakanDokter', this.state.currentUser, 'lanjut')
        var batalkan = checkPermission('VetTindakanDokter', this.state.currentUser, 'batalkan')
        
        if (this.state.data.status != 'Done') {
            if(batalkan){
                actionButton.push(
                    <div className="col-auto d-flex" key="0">
        				<button type="button" className="btn btn-sm fs12 btn-outline-danger text-uppercase px-3 py-2 my-auto" onClick={e => this.cancelTindakanDokter(e)}>Batalkan</button>
        			</div>
        	    )
            }
        	
        	if(lanjut){
        	    actionButton.push(
                    <div className="col-auto d-flex" key="1">
        				<button type="submit" className="btn btn-sm fs12 btn-danger text-uppercase px-3 py-2 my-auto" style={lh14}>Lanjut</button>
        			</div>
            	)
        	}
        	
        	actionButton.push(
                <div className="col-auto d-flex" key="send_to_apotik">
    				<button type="submit" className="btn btn-sm fs12 btn-danger text-uppercase px-3 py-2 my-auto" style={lh14} onClick={() => this.setState({send_to_apotik: true})}>Kirim ke Apotik</button>
    			</div>
        	)
        }
        
        actionButton.push(
            <div className="col-auto d-flex" key="9">
				<button type="button" className="btn btn-sm fs12 btn-outline-danger text-uppercase px-3 py-2 my-auto" onClick={() => this.toggleShowKunjunganBerikutnya()}>Kunjungan Berikutnya</button>
			</div>
    	)
        
        var rekam_medis = (
            <div className="col-auto" style={cursor} onClick={e => this.rekamMedisClick(e)}>
                <div className="row mx-0">
                    <div className="col-auto px-3">
                        <img className="d-block mx-auto mt-2 header-icon" src="/static/img/main/menu/rekam-medis.png"/>
                        <p className="mb-0 fs12 text-muted text-center">Rekam Medis</p>
                    </div>
                    <div className="col-auto px-2 d-flex my-auto">
                        <span className="fs26 fw600">
                            {this.state.data.rekam_medis_count}
                        </span>
                    </div>
                </div>
            </div>
        )
        
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
        
        var rekam_medis_class = "col-6"
        
        if (this.state.show_template) {
            templateTindakan = <TemplateTindakan list_product={this.state.products} toggleTemplateTindakan={this.toggleTemplateTindakan} register_number={this.state.data.register_number} saveTemplate={this.saveTemplate} template_data={this.state.data.template_data} status={this.state.data.status}/>
        }
        
        var statuses = ['Draft', 'Done']
        if (this.state.data.status == 'Cancel') {
            statuses = ['Cancel']
        }
        
        if(this.state.loaded) {
            console.log(this.state)
            return (
                <form onSubmit={e => this.formSubmit(e)}>
                	<div style={bgstyle}>
                		<div className="row mx-0 flex-row-reverse">
                			{actionButton}
                			<div className="col-auto ml-auto px-0"/>
                			{this.state.data.status=='Done'?customer_invoice:false}
                			{rekam_medis}
                			<div className="col-auto d-flex mr-auto">
                				{backButton}
                			</div>
                		</div>
                	</div>
                	<div className="row justify-content-end">
	            	    <div className="col-auto">
	            	        <StatusRow statuses={statuses} current_status={this.state.data.status}/>
	            	    </div>
	            	    <div className="col-auto">
	            	        <RecordNavigation currentname={this.state.data.name} namelist={this.state.namelist} navigationAction={this.navigationAction}/>
	            	    </div>
	            	</div>
                	<TindakanDokterMainForm write={write} data={this.state.data} handleInputBlur={this.handleInputBlur} changeTindakanDokter={this.changeTindakanDokter} main_form_wide={this.state.main_form_wide} toggleMainFormWide={() => this.toggleMainFormWide()}/>
                	<div className="row">
                	    <div className={rekam_medis_class}>
                	        <TindakanDokterRekamMedis write={write} main_form_wide={this.state.main_form_wide} data={this.state.data} changeTindakanDokter={this.changeTindakanDokter} handleInputBlur={this.handleInputBlur} addCheck={this.addCheck} deleteCheck={this.deleteCheck} checks={this.state.checks} toggleRekamMedisWide={() => this.toggleRekamMedisWide()} deleteAttachment={this.deleteAttachment} addAttachment={this.addAttachment} addMarker={this.addMarker} resetMarker={this.resetMarker}/>
                	    </div>
                	    <div className="col-6">
                	        <TindakanDokterJasaLain write={write} main_form_wide={this.state.main_form_wide} jasa={this.state.data.jasa} tindak_lanjut={this.state.data.tindak_lanjut} status={this.state.data.status} register_number={this.state.data.register_number} instalasi_medis={this.state.data.instalasi_medis} rawat_inap={this.state.data.rawat_inap} grooming={this.state.data.grooming} apotik={this.state.data.apotik} deleteJasaLain={this.deleteJasaLain} deleteTindakLanjut={this.deleteTindakLanjut} addJasaLain={this.addJasaLain} addTindakLanjut={this.addTindakLanjut} changeAddMode={this.changeAddMode} list_jasa={this.state.products} add_mode={this.state.add_mode} handleInputBlur={this.handleInputBlur} obat={this.state.data.obat} deleteObat={this.deleteObat} handleInputChangeObat={this.handleInputChangeObat} pressEnter={this.pressEnter} toggleSelectObat={this.toggleSelectObat} onSelectObat={this.state.onSelectObat} deleteObatRacikan={this.deleteObatRacikan} addToRacikan={this.addToRacikan} toggleTemplateTindakan={this.toggleTemplateTindakan}/>
                	        {this.state.show_kunjungan_berikutnya?<KunjunganBerikutnya write={write} items={this.state.data.layanan_berjadwal} status={this.state.data.status} changeKunjunganBerikutnya={this.changeKunjunganBerikutnya} toggleShowKunjunganBerikutnya={() => this.toggleShowKunjunganBerikutnya()}/>:false}
                	    </div>
                	</div>
                	<TindakanDokterVersion version={this.state.version || []} />
                	{templateTindakan}
                </form>
            )
        }
        else {
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

class TindakanDokterMainForm extends React.Component {
    sourceClick(tipe){
        if (tipe == 'penerimaan') {
            window.location.href = '/main/penerimaan/penerimaan-pasien/detail?n=' + this.props.data.reception
        } else if (tipe == 'pemilik') {
            window.location.href = '/main/penerimaan/data-pemilik/edit?n=' + this.props.data.pet_owner
        } else if (tipe == 'pasien') {
            window.location.href = '/main/penerimaan/data-pasien/edit?n=' + this.props.data.pet
        }
    }
    
    render() {
        var readOnly = false
        var select_style = { color: '#056EAD', border: '1px solid #056EAD' }
        var input_nama_dokter = <input required name='nama_dokter' className="form-control lightbg fs14" style={select_style} onChange={e => this.props.changeTindakanDokter(e)} onBlur={(e) => this.props.handleInputBlur(e, this.props.data.list_dokter)} list="list_dokter" id="nama_dokter" autoComplete="off" value={this.props.data.nama_dokter || ''} readOnly={readOnly}/>
        if(this.props.data.status == 'Done' || !this.props.write){
            readOnly = true
            input_nama_dokter = <p className="mb-0">{this.props.data.nama_dokter || ''}</p>
        }
        var bgstyle = {background: '#fff', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)'}
        var cursor = {cursor: 'pointer'}
        var link_pemilik = <img src="/static/img/main/menu/tautan.png" className="mx-2" onClick={() => this.sourceClick('pemilik')} style={cursor}/>
        var link_pasien = <img src="/static/img/main/menu/tautan.png" className="mx-2" onClick={() => this.sourceClick('pasien')} style={cursor}/>
        var link_penerimaan = <img src="/static/img/main/menu/tautan.png" className="mx-2" onClick={() => this.sourceClick('penerimaan')} style={cursor}/>

        var option_dokter = [];

        this.props.data.list_dokter.forEach(function (item, index) {
            option_dokter.push(
                <option value={item.full_name} key={index.toString()} />
            )
        })
        
        var row, button
        if(this.props.main_form_wide){
            button = <span style={cursor} onClick={this.props.toggleMainFormWide}><img src="/static/img/main/menu/shrink.png"/></span>
            row = (
                <div className="row mx-0">
        			<div className="col">
        			    <div className="row">
        			        <div className="col-4">
            			        <div className="form-group mb-1">
                					<label htmlFor="reception" className="fs10 fw600">No Antrian / No Penerimaan</label>
                					<p className="mb-0">{this.props.data.queue+" / "+this.props.data.reception || ''}{link_penerimaan}</p>
                				</div>
                				<div className="form-group mb-1">
                					<label htmlFor="register_number" className="fs10 fw600">No Pendaftaran</label>
                					<p className="mb-0">{this.props.data.register_number || ''}</p>
                				</div>
        			        </div>
        			        <div className="col-4">
        			            <div className="form-group mb-1">
                					<label htmlFor="pet_name" className="fs10 fw600">Nama Pasien</label>
                					<p className="mb-0">{this.props.data.pet_name || ''}{link_pasien}</p>
                				</div>
                				<div className="form-group mb-1">
                					<label htmlFor="pet_owner_name" className="fs10 fw600">Nama Pemilik</label>
                					<p className="mb-0">{this.props.data.pet_owner_name || ''}{link_pemilik}</p>
                				</div>
        			        </div>
        			        <div className="col-4">
            			        <div className="form-group mb-1">
                					<label htmlFor="reception_date" className="fs10 fw600">Tanggal Pendaftaran</label>
                					<p className="mb-0">{moment(this.props.data.reception_date).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss") || ''}</p>
                				</div>
            			        <div className="form-group mb-1">
                					<label htmlFor="nama_dokter" className="fs10 fw600">Nama Dokter</label>
                                    {input_nama_dokter}
                                    <datalist id="list_dokter">
                                        {option_dokter}
                                    </datalist>
                				</div>
        			        </div>
        			    </div>
        			</div>
        			<div className="col-3">
			            <div className="form-group mb-1">
        					<label htmlFor="description" className="fs10 fw600">Catatan</label>
        					<textarea id="description" name="description" className="form-control lightbg border-0" rows="3" placeholder="Masukkan bila ada" value={this.props.data.description || ''} readOnly={readOnly} onChange={e => this.props.changeTindakanDokter(e)}/>
        				</div>
			        </div>
        			<div className="col-auto text-right mt-auto">
			            {button}
			        </div>
        		</div>
            )
        }
        else {
            button = <span style={cursor} onClick={this.props.toggleMainFormWide}><img src="/static/img/main/menu/expand.png"/></span>
            row = (
                <div className="row mx-0">
			        <div className="col">
    			        <div className="form-group mb-1">
        					<label htmlFor="reception" className="fs10 fw600">No Antrian / No Penerimaan</label>
        					<p className="mb-0">{this.props.data.queue+" / "+this.props.data.reception || ''}{link_penerimaan}</p>
        				</div>
			        </div>
			        <div className="col">
			            <div className="form-group mb-1">
        					<label htmlFor="pet_name" className="fs10 fw600">Nama Pasien</label>
        					<p className="mb-0">{this.props.data.pet_name || ''}{link_pasien}</p>
        				</div>
			        </div>
			        <div className="col">
    			        <div className="form-group mb-1">
        					<label htmlFor="nama_dokter" className="fs10 fw600">Nama Dokter</label>
                            {input_nama_dokter}
                            <datalist id="list_dokter">
                                {option_dokter}
                            </datalist>
        				</div>
			        </div>
			        <div className="col">
			            <div className="form-group mb-1">
        					<label htmlFor="reception_date" className="fs10 fw600">Tanggal Pendaftaran</label>
        					<p className="mb-0">{moment(this.props.data.reception_date).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss") || ''}</p>
        				</div>
			        </div>
			        <div className="col">
			            <div className="form-group mb-1">
        					<label htmlFor="description" className="fs10 fw600">Catatan</label>
        					<textarea id="description" name="description" className="form-control lightbg border-0" rows="1" placeholder="Masukkan bila ada" value={this.props.data.description || ''} readOnly={readOnly} onChange={e => this.props.changeTindakanDokter(e)}/>
        				</div>
			        </div>
			        <div className="col-auto text-right mt-auto">
			            {button}
			        </div>
        		</div>
            )
        }
        
        return (
            <div>
                <p className="fs18 fw600 text-dark mb-2">
            		Data Pasien
            	</p>
            	<div style={bgstyle} className="py-2 px-3 mb-4">
            		{row}
            	</div>
            </div>
        )
    }
}

class TindakanDokterJasaLain extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            tindak_lanjut_filter: 'is_operasi'
        }
    }
    
    changeTindakLanjutFilter(e){
        var value = e.target.value
        this.setState({tindak_lanjut_filter: value})
    }
    
    render() {
        var th = this
        var list_jasa = this.props.list_jasa
        var jasa = this.props.jasa
        var tindak_lanjut = this.props.tindak_lanjut
        var jasa_rows = []
        var tindak_lanjut_rows = []
        // var boxShadow_style = {background: '#fff', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', padding:'10px 24px'}
        var boxShadow_style = {background: '#fff', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', padding:'10px 24px', height: 'calc(100vh - 380px)', maxHeight: 'unset', minHeight: '180px'}
        var counterStyle = {marginTop: '-1rem', verticalAlign: 'middle'}
        // var tabPaneStyle = {height: '280px'}
        var tabPaneStyle = {height: '100%'}
        var obatAll = list_jasa.filter(i => i.product_category.is_obat || i.product_category.is_racikan)
        
        this.props.main_form_wide?boxShadow_style.height = 'calc(100vh - 430px)':false
        
        var select_style = {color: '#056EAD', border: '1px solid #056EAD'}
        var newSelect, div_class
		if(this.props.status != 'Done' && this.props.write){
		    var jasa_products
		    var jasa_options = []
		    if(list_jasa != undefined && list_jasa.length != 0){
		        if(this.props.add_mode == 'jasa'){
		          //  jasa_products = list_jasa.filter(i => i.product_category.is_tindakan)
		          jasa_products = list_jasa.filter(i => i.product_category.is_dokter)
		        }
		        else if(this.props.add_mode == 'tindak_lanjut'){
		          //  jasa_products = list_jasa.filter(i => i.product_category.is_operasi || i.product_category.is_rawat)
		          jasa_products = list_jasa.filter(i => i.product_category[th.state.tindak_lanjut_filter])
		        }
		        if(jasa_products != undefined && jasa_products.length != 0){
		            jasa_products.forEach((item, index) => {
    		            jasa_options.push(<option value={item.product_name} key={index.toString()} />)
    		        })
		        }
		    }
		    
		    if(this.props.add_mode == 'jasa'){
	            newSelect = (
                    <div>
                        <input autoComplete="off" name='product' className="form-control fs14" style={select_style} onChange={e => this.props.addJasaLain(e)} onBlur={(e) => this.props.handleInputBlur(e, jasa_products)} list="jasa_list" placeholder="Pilih Untuk Menambahkan"/>
                        <datalist id="jasa_list">
                            {jasa_options}
                        </datalist>
                    </div>
        		)
	        }
	        else if(this.props.add_mode == 'tindak_lanjut'){
	            newSelect = (
                    <div className="row">
                        <div className="col-4">
                            <select name="filter" className="form-control fs14" style={select_style} value={this.state.tindak_lanjut_filter} onChange={e => this.changeTindakLanjutFilter(e)}>
                                <option value="is_operasi">Instalasi Medis</option>
                                <option value="is_rawat">Rawat Inap</option>
                                <option value="is_grooming">Grooming</option>
                            </select>
                        </div>
                        <div className="col-8">
                            <input autoComplete="off" name='product' className="form-control fs14" style={select_style} onChange={e => this.props.addTindakLanjut(e)} onBlur={(e) => this.props.handleInputBlur(e, jasa_products)} list="tindak_lanjut_list" placeholder="Pilih Untuk Menambahkan"/>
                            <datalist  id="tindak_lanjut_list">
                                {jasa_options}
                            </datalist>
                        </div>
                    </div>
        		)
	        }
        }
		
		if(jasa != undefined && jasa.length != 0){
		    jasa.forEach((item, index) => {
		        if(!item.deleted){
		            jasa_rows.push(<TindakanDokterJasaLainRow write={th.props.write} item={item} status={this.props.status} key={index.toString()} deleteAction={() => this.props.deleteJasaLain(index.toString())}/>)
		        }
		    })
		}
		
		if(tindak_lanjut != undefined && tindak_lanjut.length != 0){
		    tindak_lanjut.forEach((item, index) => {
		        if(!item.deleted){
		            tindak_lanjut_rows.push(<TindakanDokterJasaLainRow write={th.props.write} mode="tindak_lanjut" item={item} instalasi_medis={this.props.instalasi_medis} grooming={this.props.grooming} rawat_inap={this.props.rawat_inap} register_number={this.props.register_number} status={this.props.status} key={index.toString()} deleteAction={() => this.props.deleteTindakLanjut(index.toString())} toggleTemplateTindakan={this.props.toggleTemplateTindakan} />)
		        }
		    })
		}
		
		var jasa_counter, tindak_lanjut_counter, obat_counter
		if (jasa_rows.length > 0){
		    jasa_counter = (<span className="record-count badge badge-danger rounded-circle fs10 fw600" style={counterStyle}>{jasa_rows.length}</span>)
		}
		if (tindak_lanjut_rows.length > 0){
		    tindak_lanjut_counter = (<span className="record-count badge badge-danger rounded-circle fs10 fw600" style={counterStyle}>{tindak_lanjut_rows.length}</span>)
		}
		if (this.props.obat && this.props.obat.length > 0) {
		    obat_counter = (<span className="record-count badge badge-danger rounded-circle fs10 fw600" style={counterStyle}>{this.props.obat.length}</span>)
		}
        
        return (
            <div className={div_class}>
                <p className="mb-2 text-dark fs18 fw600">Lain-lain</p>
                <div className="mb-3 jasa-lain-panel" style={boxShadow_style}>
    				<div>
        				<ul className="nav nav-tabs nav-fill justify-content-around" id="dokterTab" role="tablist">
        				    <li className="nav-item">
                				<a className="nav-link py-1 active px-0" id="obat-tab" data-toggle="tab" href="#obat" role="tab" onClick={() => this.props.changeAddMode('obat')}><span>Obat</span>{obat_counter}</a>
                			</li>
                			<li className="nav-item">
                				<a className="nav-link py-1 px-0" id="jasa-tab" data-toggle="tab" href="#jasa" role="tab" onClick={() => this.props.changeAddMode('jasa')}><span>Jasa</span>{jasa_counter}</a>
                			</li>
                			<li className="nav-item">
                				<a className="nav-link py-1 px-0" id="tindak-lanjut-tab" data-toggle="tab" href="#tindak_lanjut" role="tab" onClick={() => this.props.changeAddMode('tindak_lanjut')}><span>Tindak Lanjut</span>{tindak_lanjut_counter}</a>
                			</li>
                		</ul>
    					<div className="tab-content" id="dokterTabContent" style={tabPaneStyle}>
    					    <div className="tab-pane pt-4 pb-2 show active" id="obat" role="tabpanel">
    					        <TindakanDokterObat write={this.props.write} status={this.props.status} register_number={this.props.register_number} apotik={this.props.apotik} obat={this.props.obat} obatAll={obatAll} deleteObat={this.props.deleteObat} handleInputChangeObat={this.props.handleInputChangeObat} pressEnter={this.props.pressEnter} toggleSelectObat={this.props.toggleSelectObat} onSelectObat={this.props.onSelectObat} deleteObatRacikan={this.props.deleteObatRacikan} handleInputBlur={this.props.handleInputBlur} addToRacikan={this.props.addToRacikan} />
    					    </div>
    					    <div className="tab-pane pt-4 pb-2" id="jasa" role="tabpanel">
    					        <div className="mb-3">
                                    {newSelect}
                                </div>
    					        {jasa_rows}
    					    </div>
    					    <div className="tab-pane pt-4 pb-2" id="tindak_lanjut" role="tabpanel">
    					        <div className="mb-3">
                                    {newSelect}
                                </div>
    					        {tindak_lanjut_rows}
    					    </div>
    					</div>
    				</div>
    			</div>
			</div>
		)
    }
}

class TindakanDokterJasaLainRow extends React.Component {
    tindakLanjutClick(mode){
        if(mode=='rawat_inap'){
            if(this.props.rawat_inap && this.props.rawat_inap.length > 1){
                window.location.href = '/main/dokter-dan-jasa/rawat-inap?register_number='+encodeURIComponent(this.props.register_number)
            } else if(this.props.rawat_inap && this.props.rawat_inap.length == 1) {
                window.location.href = '/main/dokter-dan-jasa/rawat-inap/edit?n='+encodeURIComponent(this.props.rawat_inap[0])
            }
        } else if (mode=='grooming'){
            if(this.props.grooming && this.props.grooming.length > 1){
                window.location.href = '/main/dokter-dan-jasa/grooming?register_number='+encodeURIComponent(this.props.register_number)
            } else if(this.props.grooming && this.props.grooming.length == 1){
                window.location.href = '/main/dokter-dan-jasa/grooming/edit?n='+encodeURIComponent(this.props.grooming[0])
            }
        } else if (mode=='operation') {
            if(this.props.instalasi_medis && this.props.instalasi_medis.length > 1){
                window.location.href = '/main/dokter-dan-jasa/instalasi-medis?register_number='+encodeURIComponent(this.props.register_number)
            } else if(this.props.instalasi_medis && this.props.instalasi_medis.length == 1){
                window.location.href = '/main/dokter-dan-jasa/instalasi-medis/edit?n='+encodeURIComponent(this.props.instalasi_medis[0])
            }
        }
    }
    
    render() {
        var item = this.props.item
        var cursor = {cursor: 'pointer'}
        var panel_style = {background: '#D2EEFF', padding: '10px 20px', color: '#056EAD'}
        var product_name = <span className="ml-3 fs14">{item.product_name}</span>
        var description = <span className="ml-3">{formatter.format(item.product_price)}</span>
        var cursor = {cursor: 'pointer', color: '#787E84'}
        var deleteButton, rawatInapButton, linkIcon, tindakLanjutRow, categoryName
        
        if (this.props.status != 'Done'){
            deleteButton = <i className="fa fa-2x fa-trash mx-3" style={cursor} onClick={this.props.deleteAction}/>
        }
        
        if (this.props.mode == 'tindak_lanjut') {
            tindakLanjutRow = (
                <div className="col-12">
                    <div className="row">
            	        <div className="col-6">
            	            {product_name}
            	        </div>
            	        <div className="col-6 text-right">
            	            {description}
            	        </div>
            	    </div>
                </div>
            )
            if (item.product_category.is_rawat) {
                linkIcon = <img className="px-3" src="/static/img/main/menu/tautan.png" style={cursor} onClick={() => this.tindakLanjutClick('rawat_inap')}/>
                rawatInapButton = <img className="mx-3" src="/static/img/main/menu/is_rawat_inap.png" style={cursor} onClick={this.props.toggleTemplateTindakan}/>
                categoryName = <div><span className="ml-3 fs14">Rawat Inap</span>{this.props.status=='Done'?linkIcon:false}</div>
            } else if (item.product_category.is_grooming){
                linkIcon = <img className="px-3" src="/static/img/main/menu/tautan.png" style={cursor} onClick={() => this.tindakLanjutClick('grooming')}/>
                categoryName = <div><span className="ml-3 fs14">Grooming</span>{this.props.status=='Done'?linkIcon:false}</div>
            } else {
                linkIcon = <img className="px-3" src="/static/img/main/menu/tautan.png" style={cursor} onClick={() => this.tindakLanjutClick('operation')}/>
                categoryName = <div><span className="ml-3 fs14">Instalasi Medis</span>{this.props.status=='Done'?linkIcon:false}</div>
            }
        }
        
        return (
            <div className="row mx-0 mb-3 fs12 fw600 grooming_products" style={panel_style}>
            	<div className="col-10">
            	    <div className="row">
            	        <div className="col-7">
            	            {this.props.mode!='tindak_lanjut'?product_name:categoryName}
            	        </div>
            	    </div>
            		{this.props.mode!='tindak_lanjut'?description:false}
            	</div>
            	<div className="col-2 my-auto">
            	    <div className="row justify-content-end">
            	        {this.props.write?rawatInapButton:false}
            	        {this.props.write?deleteButton:false}
            	    </div>
            	</div>
            	{tindakLanjutRow}
            </div>
        )
    }
}

class TemplateTindakan extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'kandang': [],
            'loaded': false,
            'new_tindakan': {},
            'data': {
                'tindakan': [],
                'register_number': this.props.register_number
            }
        }
        
        this.handleInputChangeTemplate = this.handleInputChangeTemplate.bind(this)
        this.handleInputBlurTemplate = this.handleInputBlurTemplate.bind(this)
        this.pressEnterTemplate = this.pressEnterTemplate.bind(this)
        this.selectWaktu = this.selectWaktu.bind(this)
        this.submitTemplate = this.submitTemplate.bind(this)
        this.deleteTindakan = this.deleteTindakan.bind(this)
    }
    
    componentDidMount() {
        var new_data = this.state.data
        var td = this
        
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetkandang.vetkandang.get_all_kandang",
            args: {},
            callback: function(r){
                if (r.message) {
                    td.setState({'kandang': r.message, 'loaded': true});
                }
            }
        });
        
        if (Object.keys(this.props.template_data).length != 0) {
            new_data = this.props.template_data
            this.setState({data: new_data})
        } 
    }
    
    handleInputChangeTemplate(e) {
        const value = e.target.value
    	const name = e.target.name
    	var new_data = this.state.data
    	var new_tindakan = this.state.new_tindakan
    	var realValue
    	var aa = this
    	
    	if (name == 'tindakan_template') {
    	    realValue = this.props.list_product.find(i => i.product_name == value)
    	    
    	    if (realValue) {
    	        frappe.call({
	                type: "GET",
	                method:"vet_website.vet_website.doctype.vetapotik.vetapotik.get_product_details",
	                args: {name: realValue.name},
	                callback: function(r){
	                    if (r.message) {
	                        if (new_tindakan['quantity_template'] != undefined) {
            				    r.message.product['quantity_template'] = new_tindakan['quantity_template']
            				}

                            if (new_tindakan['description'] != undefined) {
            				    r.message.product['description'] = new_tindakan['description']
            				}
            				
	                        aa.setState({new_tindakan: r.message.product})
	                    }
	                }
	            });
    	    }
    	    
    	} else if (name == 'cage') {
    	    realValue = this.state.kandang.find(i => i.cage_name == value)
    	    
    	    new_data[name] = realValue.name
    	    this.setState({data: new_data})
    	} else if (name == 'quantity_template') {
    	    new_tindakan[name] = value
    	    this.setState({new_tindakan: new_tindakan})
    	} else if (name == 'description_template') {
    	    new_tindakan['description'] = value
    	    this.setState({new_tindakan: new_tindakan})
    	} else {
    	    new_data[name] = value
    	    this.setState({data: new_data})
    	}
    }
    
    handleInputBlurTemplate(e) {
        const value = e.target.value
    	const name = e.target.name
    	var new_data = this.state.data
    	var selected = false
    	
    	if (name == 'cage') {
    	    selected = this.state.kandang.find(i => i.cage_name == value)
    	} else if (name == 'tindakan_template') {
    	    selected = this.props.list_product.find(i => i.product_name == value)
    	}
    	
    	if (!selected) {
    	    e.target.value = ''
    	    new_data[name] = ''
    	}
    }
    
    pressEnterTemplate(e) {
    	var new_tindakan = this.state.new_tindakan
    	var new_data = this.state.data
    	
        if (e.key === 'Enter' || e.key == 'Tab') {
        	e.preventDefault();
            if((new_tindakan.description && new_tindakan.description != '') || (new_tindakan.name && new_tindakan.name != '' && new_tindakan.quantity_template != '0' && new_tindakan.quantity_template)){
        	    new_data.tindakan.push(new_tindakan)
            	
            	this.setState({data: new_data, new_tindakan:{}})
            	
            	var qty = document.getElementById("quantity_template")
            	var selectProduct = document.getElementById("tindakan_template")
                var desc = document.getElementById("description_template")
            	desc.value = ''
            	qty.value = qty.defaultValue
            	selectProduct.value = ''
            	
            	document.getElementById("tindakan_template").focus();
            	
        	}

        	// if(e.target.name == 'description' && new_tindakan.description && new_tindakan.description != ''){
        	//     new_data.tindakan.push({description: new_tindakan.description})
            // 	this.setState({data: new_data, new_tindakan:{}})
            	
            // 	var desc = document.getElementById("description")
            // 	desc.value = ''
            	
        	// } else if (new_tindakan.name && new_tindakan.name != '' && new_tindakan.quantity_template != '0' && new_tindakan.quantity_template) {
            // 	new_data.tindakan.push(new_tindakan)
            	
            // 	this.setState({data: new_data, new_tindakan:{}})
            	
            // 	var qty = document.getElementById("quantity_template")
            // 	var selectProduct = document.getElementById("tindakan_template")
            // 	qty.value = qty.defaultValue
            // 	selectProduct.value = ''
            	
            // 	document.getElementById("tindakan_template").focus();
            // }
        }
    }
    
    deleteTindakan(e, index) {
        e.preventDefault()
    	var new_data = this.state.data
    	
    	new_data.tindakan.splice(index, 1)
    	this.setState({data: new_data})
    }
    
    selectWaktu(e, index, waktu) {
        e.preventDefault()
        if (this.props.status == 'Draft') {
            var new_data = this.state.data
            
            if (new_data.tindakan[index][waktu]) {
                new_data.tindakan[index][waktu] = !new_data.tindakan[index][waktu]
            } else {
                new_data.tindakan[index][waktu] = true
            }
            
        	this.setState({data: new_data})
        }
    }
    
    submitTemplate(e) {
        e.preventDefault()
        if([undefined,false,''].includes(this.state.data.cage)){
            frappe.msgprint('Anda belum memilih kandang')
        } else {
            console.log(this.state.data)
            this.props.saveTemplate(this.state.data)
        }
    }
    
    render() {
        var maxwidth = {maxWidth: '35%'}
        var cage_options = []
        var tindakan_options = []
        var tindakan_rows = []
        var select_style = {color: '#056EAD', border: '1px solid #056EAD'}
        var list_product = this.props.list_product
        var th = this
        var cage, input_kandang, tindakanDesc, tindakanSelect, rowButton
        var kandang_filter = this.state.kandang.filter(i => i.status == 'Active' & [null,""].includes(i.register_number))
        
        cage = this.state.kandang.find(i => i.name == this.state.data.cage)
        
        list_product.forEach((item, index) => {
            tindakan_options.push(<option value={item.product_name} key={index.toString()} />)
        })
        
        kandang_filter.forEach(function(item, index) {
            cage_options.push(<option value={item.cage_name} key={index.toString()} />)
        })
        
        this.state.data.tindakan.forEach(function(item, index) {
            tindakan_rows.push(<TemplateTindakanRow key={index.toString()} item={item} selectWaktu={th.selectWaktu} index={index.toString()} deleteTindakan={th.deleteTindakan} status={th.props.status}/>)
        })
        
        if (this.props.status == 'Draft') {
            input_kandang = <div className="row mx-0 mb-4">
                				<input required id="cage" name='cage' className="form-control fs14" style={select_style} placeholder="Pilih Kandang" list="cage_list" onChange={this.handleInputChangeTemplate} onBlur={this.handleInputBlurTemplate} defaultValue={cage ? cage.cage_name : ''}/>
                                <datalist id="cage_list">
                                    {cage_options}
                                </datalist>
                			</div>
            tindakanSelect = <div className="row mx-0 mb-3">
                                <div className="col-11 pr-2 pl-0">
                                    <input id="tindakan_template" name='tindakan_template' className="form-control fs14" style={select_style} placeholder="Tindakan / Produk" list="tindakan_list" onChange={this.handleInputChangeTemplate} onBlur={this.handleInputBlurTemplate} />
                                        <datalist id="tindakan_list">
                                            {tindakan_options}
                                        </datalist>
                                </div>
                                <div className="col-1 px-0">
                                    <input id="quantity_template" name='quantity_template' className="form-control fs14 text-center" style={select_style} placeholder="0" onChange={this.handleInputChangeTemplate} onKeyDown={this.pressEnterTemplate}/>
                                </div>
        					</div>
        	tindakanDesc = <div className="row mx-0 mb-3">
                                <div className="col-12 px-0">
                                    <input id="description_template" name='description_template' className="form-control fs14 text-center" style={select_style} placeholder="Masukkan Deskripsi Tindakan" onChange={this.handleInputChangeTemplate} onKeyDown={this.pressEnterTemplate}/>
                                </div>
        					</div>
        	rowButton = <div className="row justify-content-center">
                			<div className="col-auto d-flex mt-4">
                				<button className="d-block btn btn-sm btn-danger fs12 text-uppercase fwbold py-2 px-4" onClick={this.submitTemplate}>Simpan</button>
                			</div>
						    <div className="col-auto d-flex mt-4">
                    			<a href="#" className="d-block btn btn-sm fs12 btn-outline-danger text-uppercase fwbold py-2 px-4" onClick={this.props.toggleTemplateTindakan}>Batalkan</a>
                			</div>
						</div>
        } else {
            input_kandang = <div className="row mx-0 mb-4">
                				<span>{cage ? cage.cage_name : ''}</span>
            			    </div>
        }
        
        if (this.state.loaded) {
            return (
                <div className="menu-popup">
                    <div className="container" style={maxwidth}>
                        <div className="bg-white p-4">
                            <div className="fs20 fw600 mb-2">Kandang</div>
                            {input_kandang}
        					<div className="fs20 fw600 mb-2">Template Tindakan</div>
        					{tindakanDesc}
                            {tindakanSelect}
        					{tindakan_rows}
        					{rowButton}
                        </div>
                    </div>
                    <div className="menu-popup-close" onClick={this.props.toggleTemplateTindakan}></div>
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

class TemplateTindakanRow extends React.Component {
	render() {
		var panel_style = {background: '#84D1FF', padding: '10px 20px', color: '#056EAD'}
		var tipe_style = {background: '#056EAD', color: '#FFF', borderRadius: '3px', padding: '2px 7px', display: 'block', width: '100%', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis'}
		var item = this.props.item
		var cursor = {cursor: 'pointer'}
		var tipe_tindakan
		var pagi = 'pagi.png'
		var siang = 'siang.png'
		var sore = 'sore.png'
		var malam = 'malam.png'
		var index = this.props.index
		var deleteButtonTemplate
		
		var nameclass = "col-11"
		var tipe = <div className="col-3"/>
		if(item.product_category){
		    nameclass = "col-8 px-0"
		    if (item.product_category.is_makanan) {
    		    tipe_tindakan = 'Makanan'
    		} else if (item.product_category.is_obat || item.product_category.is_racikan) {
    		    tipe_tindakan = 'Obat'
    		} else {
    		    tipe_tindakan = 'Jasa'
    		}
    		tipe = <div className="col-3">
        	            <span className="fs14" style={tipe_style}>{tipe_tindakan}</span>
        	        </div>
		}

		
		if (item.pagi) {
		    pagi = 'pagi_active.png'
		}
		
		if (item.siang) {
		    siang = 'siang_active.png'
		}
		
		if (item.sore) {
		    sore = 'sore_active.png'
		}
		
		if (item.malam) {
		    malam = 'malam_active.png'
		}
		
		if (this.props.status == 'Draft') {
		    deleteButtonTemplate = <div className="col-1 pr-1 text-right px-0">
            			        	    <i className="fa fa-2x fa-trash" onClick={this.props.deleteTindakan} style={cursor}/>
            			        	</div>
		}
		
		var total = <div className="col-3 px-0"/>
		var amount_row = <div className="col-6 px-0"/>
        var desc_row
		if(item.uom_name != undefined && item.quantity_template != undefined && item.price != undefined){
		    total = <div className="col-3 px-0">
	        	    	<span className="mr-1 fs14">{formatter.format(item.quantity_template * item.price)}</span>
	        	    </div>
	        amount_row = <div className="col-6 px-0">
    	        	        	<div className="row">
    	        	        		<div className="col-auto">
    	        	        			<span className="fs14">{item.quantity_template + ' ' + item.uom_name}</span>
    	        	        		</div>
    	        	        		<div className="col-auto">
    	        	        			<span className="fs14">x</span>
    	        	        		</div>
    	        	        		<div className="col-auto">
    	        	        			<span className="fs14">{formatter.format(item.price)}</span>
    	        	        		</div>
    	        	        	</div>
    	        	        </div>
		}

        if (item.product_name && item.description) {
            desc_row = <div className="col-12 px-0">
                <span className="fs14">{item.description}</span>
            </div>
        }
		
		return <div>
				<div className="row mx-0 mb-3 fs12 fw600 grooming_products rounded" style={panel_style}>
				    <div className="col-12 px-0">
    				    <div className="row mb-2">
    	        	        {tipe}
    	        	        <div className={nameclass}>
    	        	            <span className="fs14">{item.product_name||item.description}</span>
    	        	        </div>
    	        	        {deleteButtonTemplate}
    	        	    </div>
    	        	</div>
                    {desc_row}
    	        	<div className="col-12">
    	        	    <div className="row d-flex">
    	        	        {amount_row}
    	        	        {total}
    		        	    <div className="col-3 px-0">
    		        	    	<div className="row">
    		        	    	    <div className="col-3 px-0 d-flex">
    		        	    	        <img className="mt-auto mx-auto" src={"/static/img/main/menu/" + pagi} style={cursor} onClick={e => this.props.selectWaktu(e, index, 'pagi')} />
    		        	    	    </div>
    		        	    	    <div className="col-3 px-0 d-flex">
    		        	    	        <img className="mt-auto mx-auto" src={"/static/img/main/menu/" + siang} style={cursor} onClick={e => this.props.selectWaktu(e, index, 'siang')} />
    		        	    	    </div>
    		        	    	    <div className="col-3 px-0 d-flex">
    		        	    	        <img className="mt-auto mx-auto" src={"/static/img/main/menu/" + sore} style={cursor} onClick={e => this.props.selectWaktu(e, index, 'sore')} />
    		        	    	    </div>
    		        	    	    <div className="col-3 px-0 d-flex">
    		        	    	        <img className="mt-auto mx-auto" src={"/static/img/main/menu/" + malam} style={cursor} onClick={e => this.props.selectWaktu(e, index, 'malam')} />
    		        	    	    </div>
    		        	    	</div>
    		        	    </div>
    	        	    </div>
    	        	</div>
		        </div>
			</div>
	}
}

class KunjunganBerikutnya extends React.Component {
    render() {
        var items = {}
        if(this.props.items != undefined && this.props.items.length != 0){
            items = this.props.items[0]
        }
        var item_rows = []
        var boxShadow_style = {background: '#fff', borderRadius: 10, maxWidth: 480, boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)'}
        var cursor = {cursor: 'pointer'}
        var newActionRow
    	
    	if(this.props.status != 'Done' && this.props.write){
    	    if (items.date) {
    	        var formatted_date = moment(items.date).format('YYYY-MM-DD');
    	    }
    	    newActionRow = (
    	        <div>
    				<div id="new_action" className="mx-0 mb-3 fs12 fw600 grooming_actions">
                    	<div className="row mb-1">
                	        <div className="col-6">
                	            <label htmlFor="new_date" className="fw600">Tanggal</label>
                	        </div>
                	        <div className="col-6">
                	            <input type="date" id="new_date" name='date' className="form-control fs14" value={formatted_date || items.date || ''} onChange={e => this.props.changeKunjunganBerikutnya(e, 0)}/>
                	        </div>
                	    </div>
                	    <div className="row mb-1">
                	        <div className="col-6">
                	            <label htmlFor="new_note" className="fw600">Catatan</label>
                	        </div>
                	        <div className="col-6">
                	            <input name='note' id="new_note" className="form-control fs14 lightbg" placeholder="Masukkan bila ada" value={items.note || ''} onChange={e => this.props.changeKunjunganBerikutnya(e, 0)}/>
                	        </div>
                	    </div>
                    </div>
    			</div>
        	)
    	}
    	else {
    	    if (items.date) {
                item_rows.push(<KunjunganBerikutnyaRow key='0' item={items}/>)
        	}
        	else {
        	    item_rows.push(
        	        <div className="col-auto d-flex p-3" key='999'>
                        <span className="fs16 fw500 mx-auto">Tidak Ada Layanan Berjadwal</span>
                    </div>
        	    )
        	}
    	}
        
        return (
            <div className="menu-popup">
                <div className="container p-3" style={boxShadow_style}>
                    <p className="fs18 fw600 text-dark">
                		Kunjungan Berikutnya
                		<i className="fa fa-times-circle text-danger fs20 float-right" style={cursor} onClick={this.props.toggleShowKunjunganBerikutnya}/>
                	</p>
                	<div className="p-2 mb-3">
        				<div>
        					<div id="action_list">
        					    {item_rows}
        					</div>
        					{newActionRow}
        				</div>
        			</div>
        		</div>
    			<div className="menu-popup-close" onClick={this.props.toggleShowKunjunganBerikutnya}/>
            </div>
        	)
    }
}

class KunjunganBerikutnyaRow extends React.Component {
    render() {
        var item = this.props.item
        return (
            <div className="mb-3 fs14 grooming_actions">
        	    <div className="row">
        	        <div className="col-6">
        	            <label htmlFor="date" className="fw600">Tanggal</label>
        	        </div>
        	        <div className="col-6">
        	            <p>{moment(item.date).format("DD-MM-YYYY hh:mm:ss")}</p>
        	        </div>
        	    </div>
        	    <div className="row">
        	        <div className="col-6">
        	            <label htmlFor="note" className="fw600">Catatan</label>
        	        </div>
        	        <div className="col-6">
        	            <p>{item.note}</p>
        	        </div>
        	    </div>
            </div>
        )
    }
}

class TindakanDokterRekamMedis extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            'new_check': {},
            'available_check': [
                {'label': 'Riwayat Vaksin', 'name': 'vaccine_history'},
                {'label': 'Riwayat Makanan', 'name': 'food_history'},
                {'label': 'Anamnese', 'name': 'anamnese'},
                {'label': 'Diagnosa Utama', 'name': 'diagnosa_utama'},
                {'label': 'Prognosa', 'name': 'prognosa'},
                {'label': 'Diagnosa Banding', 'name': 'diagnosa_banding'},
                {'label': 'BCS', 'name': 'bcs'},
                {'label': 'Vomit', 'name': 'vomit'},
                {'label': 'Ausc. L', 'name': 'auscl'},
                {'label': 'Ausc. H', 'name': 'ausch'},
                {'label': 'Pulsus', 'name': 'pulse'},
                {'label': 'Respirasi', 'name': 'respiration'},
                {'label': 'Abdomnal Palpasi Pain', 'name': 'abdominal_palpasi_pain'},
                {'label': 'Abdominal Palpasi Tension', 'name': 'abdominal_palpasi_tension'},
                {'label': 'Limfonodule', 'name': 'limfonodule'},
                {'label': 'Mukosa', 'name': 'mukosa'},
                {'label': 'Mata', 'name': 'mata'},
                {'label': 'Hidung', 'name': 'hidung'},
                {'label': 'Mulut', 'name': 'mulut'},
                {'label': 'Telinga', 'name': 'telinga'},
                {'label': 'Kulit', 'name': 'kulit'},
                {'label': 'Ekstremitas', 'name': 'ekstremitas'},
                {'label': 'Sensasi Refleks', 'name': 'reflex'},
                {'label': 'Lainnya', 'name': 'other'},
                {'label': 'Tindakan', 'name': 'action'},
                {'label': 'Lainnya Pemeriksaan', 'name': 'other_pemeriksaan'},
                {'label': 'Lainnya Diagnosa', 'name': 'other_diagnosa'},
            ],
            'selected_check': false
        }
    }
    
    handleInputChangeRekamMedis(e) {
    	const value = e.target.value
    	const name = e.target.name
    	const id = e.target.id
    	var new_check = this.state.new_check
    	var aa = this
    	
    	
    	if (name == 'field_name') {
    	    var checked = this.state.available_check.filter(c => c.label == value)
    		if (checked.length != 0) {
    			new_check.name = checked[0].name
    			new_check.label = checked[0].label
		        aa.setState({new_check: new_check})
		        var anamnese = document.getElementById("field_name_anamnese")
            	var pemeriksaan = document.getElementById("field_name_pemeriksaan")
            	var diagnosa = document.getElementById("field_name_diagnosa")
            	if(id == 'field_name_anamnese'){
            	    pemeriksaan.value = ''
            	    diagnosa.value = ''
            	}
            	else if(id == 'field_name_pemeriksaan'){
            	    anamnese.value = ''
            	    diagnosa.value = ''
            	}
            	else if(id == 'field_name_diagnosa'){
            	    anamnese.value = ''
            	    pemeriksaan.value = ''
            	}
    		}
    	} else if (name == 'field_value') {
            new_check.value = value
	        this.setState({new_check: new_check})
    	}
    }
    
    handleInputBlurRekamMedis(e, list) {
        const value = e.target.value
        const name = e.target.name
        var new_check = this.state.new_check
    	var selected = false
    	
    	if (name == "field_name" || name == 'condition') {
    	    list.forEach(function(item, index) {
        	    if (item.label == value) {
        	        selected = true
        	    }
        	})
    	} else {
	        list.forEach(function(item, index) {
        	    if (item == value) {
        	        selected = true
        	    }
        	})
    	}
    	
    	if (!selected) {
    		e.target.value = ''
    		if (name == 'field_name') {
    		    new_check.name = ''
    	        this.setState({new_check: new_check})
    		}
    	}
    }
    
    pressEnterRekamMedis(e) {
    	var new_check = this.state.new_check
    	
        if (e.key === 'Enter' || e.key == 'Tab') {
        	e.preventDefault();
            if (new_check.name && new_check.name != '' && new_check.value != '' && new_check.value) {
            	var field_value = document.getElementById("field_value")
            	var anamnese = document.getElementById("field_name_anamnese")
            	var pemeriksaan = document.getElementById("field_name_pemeriksaan")
            	var diagnosa = document.getElementById("field_name_diagnosa")
            	this.props.addCheck(this.state.new_check)
            	field_value.value = ''
            	anamnese.value = ''
            	pemeriksaan.value = ''
            	diagnosa.value = ''
            	this.setState({new_check: {}})
            }
        }
    }
    
    render() {
        var data = this.props.data
        var boxShadow_style = {background: '#fff', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', height: 'calc(100vh - 380px)', overflowY: 'auto', minHeight: '310px'}
        // var boxShadow_style = {background: '#fff', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', height: 'calc(100% - 50px)', overflowY: 'auto', maxHeight: '553px'}
        var inputStyle = {color: '#056EAD', border: '1px solid #056EAD'}
        var suhu, berat, kondisi_awal
        var enable_edit = false
        var panel_style = {background: '#D2EEFF', padding: '10px 20px', color: '#056EAD', borderRadius: '5px'}
        var fontColor = {color: '#6D7573'}
        var fontColor2 = {color: '#056EAD'}
        var cursor = {cursor: 'pointer'}
        
        this.props.main_form_wide?boxShadow_style.height = 'calc(100vh - 430px)':false
        
        if (data.status == 'Draft' && this.props.write) {
            enable_edit = true
            var available_check_anamnese = []
            var available_check_pemeriksaan = []
            var available_check_diagnosa = []
            var anamnese_options = ['vaccine_history', 'food_history', 'bcs', 'vomit', 'auscl', 'ausch', 'temperature', 'weight', 'other']
		    var pemeriksaan_options = ['pulse', 'respiration', 'abdominal_palpasi_pain','abdominal_palpasi_tension','limfonodule','mukosa','mata','hidung','mulut','telinga','kulit','ekstermitas','reflex','other_pemeriksaan']
		    var diagnosa_options = ['diagnosa_utama','prognosa','diagnosa_banding','action','other_diagnosa']
			var check_name = this.props.checks.filter(c => c.delete == undefined).map(c => c.name)
			this.state.available_check.forEach(function(item, index) {
			    if(!check_name.includes(item.name) && anamnese_options.includes(item.name)){
			        available_check_anamnese.push(
    				    <option value={item.label} key={index.toString()}/>
    				)
			    }
			    else if (!check_name.includes(item.name) && pemeriksaan_options.includes(item.name)){
			        available_check_pemeriksaan.push(
    				    <option value={item.label} key={index.toString()}/>
    				)
			    }
			    else if (!check_name.includes(item.name) && diagnosa_options.includes(item.name)){
			        available_check_diagnosa.push(
    				    <option value={item.label} key={index.toString()}/>
    				)
			    }
    		})
    		
        //     var option_kondisi = []
        //     kondisiOptions.forEach(function(item, index) {
        //         option_kondisi.push(
    				// <option value={item.value} key={index.toString()} />
    				// )
        //     })
            
            suhu = (
                <div className="col pr-0 my-auto">
                    <div className="row">
                        <div className="col-4">
                            <label htmlFor="temperature" className="fw600 my-2" style={fontColor}>Suhu (C)</label>
                        </div>
                        <div className="col-6 pl-auto">
                            <input id="temperature" name="temperature" className="form-control border-0" placeholder="0"  onChange={this.props.changeTindakanDokter} required style={fontColor} value={data.temperature || ''}/>
                        </div>
                    </div>
    		    </div>
            )
            berat = (
                <div className="col">
                    <div className="row">
                        <div className="col-4">
                            <label htmlFor="weight" className="fw600 my-2" style={fontColor}>Berat (kg)</label>
                        </div>
                        <div className="col-6 pl-auto">
                            <input id="weight" name="weight" className="form-control border-0" placeholder="0"  onChange={this.props.changeTindakanDokter} required style={fontColor} value={data.weight || ''}/>
                        </div>
                    </div>
    		    </div>
            )
            
        //     kondisi_awal = (
        //         <div className="col-6">
        // 		    <label htmlFor="condition" className="fw600" style={fontColor}>Kondisi Awal</label>
        // 			<div>
        //                 <input name='condition' list="list_kondisi" id="condition" className="form-control border-0" onChange={this.props.changeTindakanDokter} placeholder="Pilih" autoComplete="off" style={fontColor} onBlur={e => this.handleInputBlurRekamMedis(e, kondisiOptions)}/>
        // 				<datalist id="list_kondisi">
        // 					{option_kondisi}
        // 				</datalist>
        //             </div>
        // 		</div>
        //     )
                        
            var newSelect = <div className="row mb-3">
    							<div className="col-4 my-1 pr-1">
    								<input autoComplete="off" name='field_name' list="anamnese_options" id="field_name_anamnese" className="form-control fs14 fw600" style={inputStyle} onChange={e => this.handleInputChangeRekamMedis(e)} placeholder="Anamnese" onBlur={e => this.handleInputBlurRekamMedis(e, this.state.available_check.filter(i => anamnese_options.includes(i.name)))}/>
    								<datalist id="anamnese_options">
    									{available_check_anamnese}
    								</datalist>
    							</div>
    							<div className="col-4 my-1 px-1">
    								<input autoComplete="off" name='field_name' list="pemeriksaan_options" id="field_name_pemeriksaan" className="form-control fs14 fw600" style={inputStyle} onChange={e => this.handleInputChangeRekamMedis(e)} placeholder="Pemeriksaan" onBlur={e => this.handleInputBlurRekamMedis(e, this.state.available_check.filter(i => pemeriksaan_options.includes(i.name)))}/>
    								<datalist id="pemeriksaan_options">
    									{available_check_pemeriksaan}
    								</datalist>
    							</div>
    							<div className="col-4 my-1 pl-1">
    								<input autoComplete="off" name='field_name' list="diagnosa_options" id="field_name_diagnosa" className="form-control fs14 fw600" style={inputStyle} onChange={e => this.handleInputChangeRekamMedis(e)} placeholder="Diagnosa" onBlur={e => this.handleInputBlurRekamMedis(e, this.state.available_check.filter(i => diagnosa_options.includes(i.name)))}/>
    								<datalist id="diagnosa_options">
    									{available_check_diagnosa}
    								</datalist>
    							</div>
    							<div className="col-12 my-1">
    								<input style={inputStyle} type="text" className="form-control input-sm fs14 fw600" name="field_value" id="field_value" placeholder="Keterangan" onChange={e => this.handleInputChangeRekamMedis(e)} onKeyDown={e => this.pressEnterRekamMedis(e)}/>
    							</div>
    						</div>
    	    
        } else if (['Done','Cancel'].includes(data.status) || !this.props.write) {
            suhu = (
                <div className="col-4 text-center">
                    <div className="row">
                        <div className="col-4">
                            <label htmlFor="temperature" className="fwbold my-2" style={fontColor2}>Suhu</label>
                        </div>
                        <div className="col-6 pl-auto">
                            <p style={fontColor2} className="mb-0 fw600 my-2">{data.temperature}</p>
                        </div>
                    </div>
        		</div>
            )
            berat = (
                <div className="col-4 text-center">
                    <div className="row">
                        <div className="col-4">
                            <label htmlFor="weight" className="fwbold my-2" style={fontColor2}>Berat</label>
                        </div>
                        <div className="col-6 pl-auto">
                            <p style={fontColor2} className="mb-0 fw600 my-2">{data.weight}</p>
                        </div>
                    </div>
        		</div>
        	)
            kondisi_awal = (
                <div className="col-4 text-center">
        		    <label htmlFor="condition" className="fwbold" style={fontColor2}>Kondisi Awal</label>
        		    <p style={fontColor2} className="mb-0 fw600">{data.condition}</p>
        		</div>
            )
        }
        
        var checks_list = []
        this.props.checks.forEach((c, index) => {
            if(c.delete == undefined){
                checks_list.push(<TindakanDokterRekamMedisList write={this.props.write} check={c} key={index.toString()} status={data.status} deleteCheck={() => this.props.deleteCheck(index.toString())}/>)
            }
        })
        
        var layout_class = "col-12"
        
        return (
            <div className="h-100">
                <p className="mb-2 text-dark fs18 fw600">Rekam Medis</p>
                <div className="px-4 pb-4 pt-2 mb-3" style={boxShadow_style}>
			        <div className="row justify-content-around mb-3 mx-n1" style={panel_style}>
    		            {suhu}
    		            {berat}
    		        </div>
                    <div className="row">
                        <div className={layout_class}>
                            {newSelect}
                        	{checks_list}
                        </div>
                        <div className={layout_class}>
                            <Attachments attachments={data.attachments} enable_edit={enable_edit} deleteAction={this.props.deleteAttachment} addAction={this.props.addAttachment} addMarker={this.props.addMarker} resetMarker={this.props.resetMarker} marker={data.marker}/>
                        </div>
                    </div>
    			</div>
			</div>
        )
    }
}

class TindakanDokterRekamMedisList extends React.Component {
    render() {
        var panel_style = {background: '#D2EEFF', padding: '10px 20px', color: '#056EAD', borderRadius: '5px'}
        var check = this.props.check
        var status = this.props.status
        var cursor = {cursor: 'pointer'}
        var deleteButton
        
        if (status == 'Draft' && this.props.write) {
            deleteButton = <i className="fa fa-2x fa-trash ml-auto" onClick={this.props.deleteCheck} style={cursor}/>
        }
        return <div id={check.name} className="form-row mb-3 fs12 fw600 grooming_products" style={panel_style}>
	        <div className="col-6">
	            <span className="fs14">{check.label || check.name}</span>
	        </div>
	        <div className="col text-right">
	            <span className="fs14">{check.value}</span>
	        </div>
	        <div className="col-auto text-center d-flex">
        	    {deleteButton}
        	</div>
        </div>
    }
}

class TindakanDokterObat extends React.Component {
    apotikClick(){
        if(this.props.apotik && this.props.apotik.length > 1){
            window.location.href = "/main/farmasi/apotik?register_number="+encodeURIComponent(this.props.register_number)
        } else if(this.props.apotik && this.props.apotik.length == 1) {
            window.location.href = "/main/farmasi/apotik/edit?n="+encodeURIComponent(this.props.apotik[0])
        }
    }
    
    render() {
        var color = {color: "#056EAD"}
        var cursor = {cursor: "pointer"}
    	var status = this.props.status
    	var obat = this.props.obat
    	var obatAll = this.props.obatAll
    	var onSelectObat = this.props.onSelectObat
    	var selectStyle, quantityStyle
    	var obatList = []
    	var ao = this
    	
    	if (onSelectObat != 'false' && onSelectObat != undefined) {
    		selectStyle = {color: '#2BA400', border: '1px solid #2BA400'}
    		quantityStyle = {color: '#2BA400', border: '1px solid #2BA400'}
    	} else {
    		selectStyle = {color: '#056EAD', border: '1px solid #056EAD'}
    		quantityStyle = {color: '#056EAD', border: '1px solid #056EAD'}
    	}
    	
    	if (obat != null) {
    	    obat.forEach(function(item, index) {
        		obatList.push(
        			<TindakanDokterObatList write={ao.props.write} obat={item} status={status} key={index.toString()} deleteObat={(e) => ao.props.deleteObat(e, index)} onSelectObat={ao.props.onSelectObat} toggleSelectObat={(e) => ao.props.toggleSelectObat(e, index)} index={index.toString()} deleteObatRacikan={ao.props.deleteObatRacikan} addToRacikan={() => ao.props.addToRacikan(index.toString(), ao.props.onSelectObat)}/>
        		)
        	})
    	}
    	
    	if (status == 'Draft' && this.props.write) {
    		var option_product = []
    		obatAll.forEach(function(item, index) {
    		    var available_quantity = item.available_quantity || 0
    		    var uom = item.product_uom_name || ''
    			option_product.push(
    				<option value={"["+available_quantity+' '+uom+"] "+item.product_name} key={index.toString()} />
    				)
    		})
    		
    		var newProductSelect = <div className="row">
    									<div className="col-5 pr-1">
    										<input name='obat' list="products" id="obat_input" className="form-control fs14 fw600" style={selectStyle} onChange={this.props.handleInputChangeObat} placeholder="Pilih Untuk Menambahkan" onBlur={(e) => this.props.handleInputBlur(e, obatAll)} />
    											<datalist id="products">
    												{option_product}
    											</datalist>
    									</div>
    									<div className="col-2 my-auto px-1">
    										<input style={quantityStyle} type="text" className="form-control input-sm text-center fs14 fw600" name="quantity" id="quantity" placeholder="0" onChange={ao.props.handleInputChangeObat} onKeyDown={ao.props.pressEnter}/>
    									</div>
    									<div className="col-5 my-auto px-1">
    										<input style={quantityStyle} type="text" className="form-control input-sm fs14 fw600" name="note" id="note" placeholder="Keterangan" onChange={ao.props.handleInputChangeObat} onKeyDown={ao.props.pressEnter}/>
    									</div>
    								</div>
    		
    	}
    	
    	var apotik_link
    	if (status == 'Done'){
    	    apotik_link = (
    	        <div className="row justify-content-end">
    	            <div className="col-auto text-center" style={cursor} onClick={() => this.apotikClick()}>
    	                <div className="row mx-0">
    	                    <div className="col-auto px-0">
    	                        <img className="d-block mb-2" src='/static/img/main/menu/apotik.png'/>
    	                        <span className="fs10 fw600" style={color}>Apotik</span>
    	                    </div>
    	                    <div className="col-auto pr-0 d-flex">
    	                        <svg width="13" height="24" viewBox="0 0 13 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="my-auto">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M0.949707 22.051L2.62642 24L12.9497 12L2.62642 0L0.949707 1.94905L9.59628 12L0.949707 22.051Z" fill="#056EAD"/>
                                </svg>
    	                    </div>
    	                </div>
    	            </div>
    	        </div>
    	    )
    	}
    	
        return <div>
                    <div className="mb-3">
                        {newProductSelect}
                    </div>
                    <div>
                    	{obatList}
                    </div>
                    <div>
                        {apotik_link}
                    </div>
				</div>
    }
}

class TindakanDokterObatList extends React.Component {
	render() {
		var panel_style = {background: '#84D1FF', padding: '10px 20px', color: '#056EAD'}
		var cursor = {cursor: 'pointer', color: '#787E84'}
		var xStyle = {cursor: 'pointer', color: '#056EAD'}
		var rowStyle = {backgroundColor: '#F5FBFF', marginTop: '-1rem'}
		var status = this.props.status
		var obat = this.props.obat
		var index = this.props.index
		var onSelectObat = this.props.onSelectObat
		var deleteObatRacikan = this.props.deleteObatRacikan
		var rowButton, racikan, racikanStyle, detail, xButton, rotate
		var detail_row = []
// 		var totalPrice = obat.quantity * obat.price
		var totalPrice = Math.ceil(parseFloat(obat.quantity)) * obat.price
		var ap = this
		
		obat.product_racikan.forEach(function(item, index) {
// 			totalPrice = totalPrice + (item.price * item.quantity)
			totalPrice = totalPrice + (Math.ceil(parseFloat(item.quantity)) * item.price)
		})
		
		if (index == onSelectObat) {
			racikanStyle = {cursor: 'pointer', color: '#2BA400'}
			rotate = 'fa-rotate-180'
			
			obat.product_racikan.forEach(function(item, index) {
				// var totalProductPrice = item.price * item.quantity
				var totalProductPrice = item.price * Math.ceil(parseFloat(item.quantity))
				
				if (status == 'Draft') {
					xButton = <div className="col-auto my-auto">
				        	    <i className="fa fa-2x fa-times-circle mr-1" style={xStyle} onClick={(e) => deleteObatRacikan(e, ap.props.index, index)}/>
				        	</div>
				}
				
				// var child_quantity_display = <span className="fs14">{obat.quantity + ' ' + obat.uom_name}</span>
    //     		if(obat.original_quantity != undefined || parseFloat(obat.quantity) % 1 != 0 ){
    //     		    var rounded = Math.ceil(parseFloat(obat.quantity))
    //     			child_quantity_display = <span className="fs14">{obat.quantity + ' ' + obat.uom_name} @ {obat.original_quantity||rounded + ' ' + obat.uom_name}</span>
    //     		}
    
                var child_quantity_display = <span className="fs14">{item.quantity + ' ' + item.uom_name}</span>
        		if(item.original_quantity != undefined || parseFloat(item.quantity) % 1 != 0 ){
        		    var rounded = Math.ceil(parseFloat(item.quantity))
        			child_quantity_display = <span className="fs14">{item.quantity + ' ' + item.uom_name} @ {item.original_quantity||rounded + ' ' + item.uom_name}</span>
        		}
				
				detail_row.push(
					<div className="row mx-0 fs12 mb-1 px-4 py-2" key={index.toString()}>
	                	<div className="col pl-0">
			        	    <div className="row mb-2">
			        	        <div className="col-12">
			        	            <span className="fs14">{item.product_name}</span>
			        	        </div>
			        	    </div>
			        	    <div className="row">
			        	    	<div className="col-auto px-1">
			        	    		{child_quantity_display}
			        	    	</div>
			        	    	<div className="col-auto px-1">
			        	    		<span className="fs14">x</span>
			        	    	</div>
			        	    	<div className="col-auto px-1">
			        	    		<span className="fs14">{formatter.format(item.price)}</span>
			        	    	</div>
			        	    </div>
			        	</div>
			        	<div className="col-auto my-auto">
			        	    <span className="fs14">{formatter.format(totalProductPrice)}</span>
			        	</div>
			        	{xButton}
	                </div>
				)
					
			})
			
			detail = <div style={rowStyle}>
						{detail_row}
					</div>
		} else {
			racikanStyle = {cursor: 'pointer', color: '#787E84'}
		}
		
		
		if (obat.product_category.is_racikan) {
			racikan = <i className={"fa fa-2x fa-flask mr-3 " + rotate} style={racikanStyle} onClick={this.props.toggleSelectObat}/>
		}
		
		var add_to_racikan
		if (!['false',undefined].includes(onSelectObat) && !obat.product_category.is_racikan) {
			add_to_racikan = <i className={"fa fa-2x fa-plus mr-3"} style={racikanStyle} onClick={this.props.addToRacikan} title="Masukkan kedalam racikan"/>
		}
		
		if (status == 'Draft' && this.props.write) {
			rowButton = <div className="row flex-row-reverse mb-2">
							<i className="fa fa-2x fa-trash mr-1" onClick={this.props.deleteObat} style={cursor}/>
							{racikan}
							{add_to_racikan}
						</div>
		} else {
			rowButton = <div className="row flex-row-reverse mb-2">
							{racikan}
						</div>
		}
		
		var quantity_display = <span className="fs14">{obat.quantity + ' ' + obat.uom_name}</span>
		if(obat.original_quantity != undefined || parseFloat(obat.quantity) % 1 != 0 ){
		    var rounded = Math.ceil(parseFloat(obat.quantity))
			quantity_display = <span className="fs14">{obat.quantity + ' ' + obat.uom_name} @ {obat.original_quantity||rounded + ' ' + obat.uom_name}</span>
		}
		
		
		return <div>
					<div className="row mx-0 mb-3 fs12 fw600 grooming_products rounded" style={panel_style}>
			        	<div className="col-10 pl-0">
			        	    <div className="row mb-2">
			        	        <div className="col-12">
			        	            <span className="fs14">{obat.product_name}</span>
			        	        </div>
			        	    </div>
			        	    <div className="row">
			        	    	<div className="col-5">
			        	            <span className="fs14">{obat.note}</span>
			        	        </div>
			        	        <div className="col-7 text-center">
			        	        	<div className="row mx-0">
			        	        		<div className="col-auto px-1">
			        	        			{quantity_display}
			        	        		</div>
			        	        		<div className="col-auto px-1">
			        	        			<span className="fs14">x</span>
			        	        		</div>
			        	        		<div className="col-auto px-1">
			        	        			<span className="fs14">{formatter.format(obat.price)}</span>
			        	        		</div>
			        	        	</div>
			        	        </div>
			        	    </div>
			        	</div>
			        	<div className="col-2">
			        	    {rowButton}
			        	    <div className="row flex-row-reverse">
			        	    	<span className="mr-1 fs14">{formatter.format(totalPrice)}</span>
			        	    </div>
			        	</div>
			        </div>
			        {detail}
				</div>
	}
}

class Attachments extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            'show_list': false,
            'show_marker': false,
            'new_file': {}
        }
        this.addMarker = this.addMarker.bind(this)
        this.resetMarker = this.resetMarker.bind(this)
    }
    
    toggleShowList(){
        this.setState({show_list: !this.state.show_list})
    }
    
    toggleShowMarker(marker){
        if(['canine', 'feline'].includes(marker)){
            this.setState({show_marker: marker})
        }
        else {
            this.setState({show_marker: false})
        }
        
    }
    
    clickFile(){
        if(this.$file != undefined){
            var file = this.$file
            $(file).trigger('click');
        }
    }
    
    changeNewFile(e){
        var target = e.target
        var name = target.name
        var value = target.value
        var new_file = Object.assign({}, this.state.new_file)
        if(name == 'attachment'){
            var img = event.target.files[0];
            new_file[name] = img
            this.setState({new_file: new_file})
        }
        else {
            new_file[name] = value
            this.setState({new_file: new_file})
        }
    }
    
    addAttachments(){
        if(this.state.new_file.attachment != undefined && ![undefined, ''].includes(this.state.new_file.title)){
            this.props.addAction(this.state.new_file)
            this.setState({show_list: false, new_file: {}})
        }
    }
    
    cancelAttachments(){
        this.setState({show_list: false, new_file: {}})
    }
    
    addMarker(marker){
        this.props.addMarker(marker)
        this.setState({show_marker: false})
    }
    
    resetMarker(){
        this.props.resetMarker()
        this.setState({show_marker: false})
    }
    
    render(){
        var panel_style = {background: '#D2EEFF', padding: '10px 18px', color: '#056EAD', borderRadius: '5px'}
        var buttonStyle = {background: '#076FAD', color: '#FFF'}
        var cursor = {cursor: 'pointer'}
        var attachment_buttons = []
        var att = this
        if(this.props.attachments.length != 0){
            this.props.attachments.forEach((d, i) => {
                if(!d.deleted){
                    attachment_buttons.push(<AttachmentsButton key={i.toString()} data={d} enable_edit={att.props.enable_edit} deleteAction={() => att.props.deleteAction(i.toString())}/>)
                }
            })
        }
        
        var new_attachment_form, add_button, file_button
        if(this.state.new_file.attachment != undefined){
            file_button = <button type="button" title="Tambah" className="btn btn-success fs12 fw600 rounded-lg px-3" onClick={() => this.addAttachments()}><i className="fa fa-check"/></button>
        }
        else{
            file_button = <button type="button" title="Pilih File" className="btn fs12 fw600 rounded-lg px-3" style={buttonStyle} onClick={() => this.clickFile()}><i className="fa fa-file"/></button>
        }
        
        if(this.props.enable_edit){
            if(this.state.show_list){
                new_attachment_form = (
                    <div className="col-12 py-3 rounded-lg bg-white mb-3">
                        <div className="form-row">
                            <div className="col">
                                <input type="text" name="title" id="title" className="form-control fs12" required placeholder="Masukkan Judul" value={this.state.new_file.title || ''} onChange={e => this.changeNewFile(e)}/>
                            </div>
                            <div className="col-auto">
                                <input type="file" className="d-none" name="attachment" ref={(ref) => this.$file = ref} onChange={e => this.changeNewFile(e)}/>
                                {file_button}
                            </div>
                            <div className="col-auto">
                                <button type="button" title="Batal" className="btn btn-outline-danger fs12 fw600 rounded-lg px-3" onClick={() => this.cancelAttachments()}><i className="fa fa-times"/></button>
                            </div>
                        </div>
                    </div>
                )
            }
            else {
                if(this.props.marker == undefined){
                    add_button = (
                        <div className="col-auto d-flex">
                            <button type="button" className="btn fs12 fw600 rounded-lg mx-1" style={buttonStyle} onClick={() => this.toggleShowMarker('feline')}><img src="/static/img/main/menu/cat-icon.png"/></button>
                            <button type="button" className="btn fs12 fw600 rounded-lg mx-1" style={buttonStyle} onClick={() => this.toggleShowMarker('canine')}><img src="/static/img/main/menu/dog-icon.png"/></button>
                            <button type="button" className="btn fs12 fw600 rounded-lg px-3 mx-1" style={buttonStyle} onClick={() => this.toggleShowList()}><i className="fa fa-plus mr-2"/>Attachment</button>
                        </div>
                    )
                }
                else {
                    add_button = (
                        <div className="col-auto">
                            <button type="button" className="btn fs12 fw600 rounded-lg px-3 mx-1" style={buttonStyle} onClick={() => this.toggleShowList()}><i className="fa fa-plus mr-2"/>Attachment</button>
                        </div>
                    )
                }
            }
        }
        
        var marker_panel
        if(this.props.marker != undefined){
            var marker_delete_button
            if(this.props.enable_edit){
                marker_delete_button = (
                    <div className="col-auto ml-auto mb-2"><i className="fa fa-2x fa-trash" style={cursor} onClick={e => {e.stopPropagation(); this.resetMarker()}}/></div>
                )
            }
            marker_panel = (
                <div className="form-row mb-3" style={panel_style} onClick={() => this.toggleShowMarker(this.props.marker.type)}>
                    {marker_delete_button}
                    <MarkerField readOnly={true} marker={this.props.marker} />
                </div>
            ) 
        }
        
        var attachment_panel
        if(attachment_buttons.length != 0){
            attachment_panel = (
                <div className="form-row mb-3" style={panel_style}>{attachment_buttons}</div>
            )
        }
        
        var marker_add
        if (this.state.show_marker) {
        var container_style = {borderRadius: '10px'}
            marker_add = (
            <div className='menu-popup' onClick={() => this.toggleShowMarker(false)}>
                <div className="container" style={container_style} onClick={event => event.stopPropagation()}>
                	<section className="px-5 py-4 bg-white rounded-lg">
                    	<MarkerField readOnly={!this.props.enable_edit} marker={this.props.marker} type={this.state.show_marker} submitAction={this.addMarker} resetAction={this.resetMarker}/>
                	</section>
                </div>
                <div className="menu-popup-close"/>
            </div>
            )
        }
        
        return(
            <div>
                {attachment_panel}
                {marker_panel}
                <div className="row justify-content-end my-3">
                    {new_attachment_form}
                    {add_button}
                </div>
                {marker_add}
            </div>
        )
    }
}

class AttachmentsButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            'show_validation': false,
        }
    }
    
    toggleShowValidation(){
        this.setState({'show_validation': !this.state.show_validation})
    }
    
    render(){
        var d = this.props.data
        var buttonStyle = {background: '#076FAD', color: '#FFF'}
        var delete_icon, validation
        
        if(this.props.enable_edit){
            delete_icon = (<i className="fa fa-trash ml-4" onClick={e => {e.stopPropagation(); this.toggleShowValidation()}}/>)
        }
        
        if (this.state.show_validation) {
        var container_style = {borderRadius: '10px', maxWidth: '508px'}
            validation = (
            <div className='menu-popup' onClick={() => this.toggleShowValidation()}>
                <div className="container" style={container_style} onClick={event => event.stopPropagation()}>
                	<section className="px-5 py-4 bg-white rounded-lg">
                    	<p className="fs24 text-center mb-4">{'Apakah anda yakin akan menghapus ' + d.title + ' ?'}</p>
                    	<div className="row justify-content-center">
                            <button className="btn py-1 px-2 px-lg-3 mr-5" style={buttonStyle} onClick={this.props.deleteAction}><p className="fs18 fs18md mb-0">Ya</p></button>
                            <button className="btn btn-danger py-1 px-2 px-lg-3" onClick={() => this.toggleShowValidation()}><p className="fs18 fs18md mb-0">Tidak</p></button>
                        </div>
                	</section>
                </div>
                <div className="menu-popup-close"/>
            </div>
            )
        }
        
        return(
            <div className="col-auto my-1">
                {validation}
                <a title={d.title} className="btn fs14 fw600 rounded-lg px-3" style={buttonStyle} onClick={() => {window.open(d.attachment, '_blank')}}>{d.title}{delete_icon}</a>
            </div>
        )
    }
}

class MarkerField extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            'marker': {
                'type': 'canine',
                'markers': []
            },
        }
    }
    
    componentDidMount() {
        if(this.props.marker != undefined){
            var marker = Object.assign({}, this.props.marker)
            this.setState({marker: marker})
        }
        else if(this.props.marker == undefined && ['canine', 'feline'].includes(this.props.type)){
            var marker = Object.assign({}, this.state.marker)
            marker.type = this.props.type
            this.setState({marker: marker})
        }
    }
    
    submitMarker(){
        this.props.submitAction(this.state.marker);
    }
    
    resetMarker(){
        this.props.resetAction();
    }
    
    clickArea(e){
        if(!this.props.readOnly){
            var marker = Object.assign({}, this.state.marker)
            var rect = e.target.getBoundingClientRect();
            var x = e.clientX - rect.left - 7;
            var x_percent = (x*100)/rect.width;
            var y = e.clientY - rect.top - 7;
            var y_percent = (y*100)/rect.height;
            var new_marker = {x: x_percent+'%', y: y_percent+'%'}
            
            marker.markers.push(new_marker)
            this.setState({marker: marker})
        }
    }
    
    render(){
        var boxShadow_style = {background: '#fff', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)'}
        
        var markers = this.state.marker.markers
        var marker_list = []
        if(markers != undefined && markers.length != 0){
            markers.forEach((marker, index) => marker_list.push(<Marker x={marker.x} y={marker.y} description={marker.description} key={index.toString()}/>))
        }
        
        var marker_field_class
        if(this.props.type == 'feline' || this.state.marker.type == 'feline'){
            marker_field_class = 'marker-field-cat'
        }
        else {
            marker_field_class = 'marker-field-dog'
        }
        
        var action_button
        if(!this.props.readOnly){
            action_button = (
                <div className="row">
                    <div className="col-auto ml-auto">
                        <button type="button" className="btn btn-success fs12 fw600 rounded-lg px-3 mx-1" onClick={() => this.submitMarker()}>Submit</button>
                        <button type="button" className="btn btn-danger fs12 fw600 rounded-lg px-3 mx-1" onClick={() => this.resetMarker()}>Reset</button>
                    </div>
                </div>
            )
        }
        
        return(
            <div className="w-100">
                {action_button}
                <div className={'marker-field '+marker_field_class} onClick={e => this.clickArea(e)}>
                    {marker_list}
                </div>
            </div>
        )
    }
}

class Marker extends React.Component {
    render(){
        var markerStyle={
            position: 'absolute',
            top: this.props.y,
            left: this.props.x,
        }
        
        return(
            <i className="fa fa-lg fa-times text-danger" style={markerStyle} title={this.props.description}/>
        )
    }
}

class TindakanDokterVersion extends React.Component {
	render() {
		var row_version = []
		var heightStyle = {'height': '50px'}
		
		this.props.version.forEach(function(item, index) {
			if (item.data['changed'].length != 0) {
				var owner = <span className="fw700">{item.owner}</span>
				var extra = <span> changed value of</span>
				var desc = ''
				item.data['changed'].forEach(function(item, index) {
					desc = desc.concat(" " + item[0] + " from " + (item[1] || 'empty') + " to " + item[2] + ",")
				})
				var changed = <span className="fw700">{desc}</span>
				var date = <span>{' - ' + moment(item.creation).format("dddd, MMMM Do YYYY, h:mm:ss a")}</span>
				// var date = <span>{' - ' + moment(item.creation).format("DD-MM-YYYY HH:mm:ss")}</span>
				// var date = <span>{' - ' + moment_date(item.creation).fromNow()}</span>
				row_version.push(
					<div className="row mx-0" key={index.toString()}>
		                <div className="col-auto px-0">
		                    <div className="side-marker" />
		                </div>
		        		<div className="col pt-2" style={heightStyle}>
		        			{owner}{extra}{changed}{date}
		        		</div>
		        	</div>
				)
			}
		})
		
		return <div className="mt-2">
					{row_version}
				</div>
	}
}

ReactDOM.render(<TindakanDokter/>,document.getElementById("tindakan_dokter"));