var id = getUrlParameter('n')

class InstalasiMedis extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            'data': {},
            'products': [],
            'loaded': false,
            'main_form_wide': false,
            'add_mode': 'jasa',
            'new_obat': {},
            'currentUser': {},
            'save_loading': false,
        }
        this.toggleMainFormWide = this.toggleMainFormWide.bind(this)
        this.changeAddMode = this.changeAddMode.bind(this)
        this.addJasaLain = this.addJasaLain.bind(this)
        this.deleteJasaLain = this.deleteJasaLain.bind(this)
        this.deleteTindakLanjut = this.deleteTindakLanjut.bind(this)
        this.addTindakLanjut = this.addTindakLanjut.bind(this)
        this.handleInputBlur = this.handleInputBlur.bind(this)
        this.changeInstalasiMedis = this.changeInstalasiMedis.bind(this)
        this.handleInputChangeObat = this.handleInputChangeObat.bind(this)
        this.deleteObat = this.deleteObat.bind(this)
        this.pressEnter = this.pressEnter.bind(this)
        this.addCheck = this.addCheck.bind(this)
        this.deleteCheck = this.deleteCheck.bind(this)
        this.addAttachment = this.addAttachment.bind(this)
        this.deleteAttachment = this.deleteAttachment.bind(this)
        this.addMarker = this.addMarker.bind(this)
        this.resetMarker = this.resetMarker.bind(this)
        this.navigationAction = this.navigationAction.bind(this)
    }
    
    componentDidMount() {
        var lastfilter = JSON.parse(sessionStorage.getItem('/main/dokter-dan-jasa/instalasi-medis'))
        var gr = this
        frappe.call({
            type: "GET",
            method:"vet_website.methods.get_current_user",
            args: {},
            callback: function(r){
                if (r.message) {
                    gr.setState({'currentUser': r.message});
                }
            }
        });
        
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetinstalasimedis.vetinstalasimedis.get_name_list",
            args: {filters: lastfilter},
            callback: function(r){
                if (r.message) {
                    gr.setState({'namelist': r.message});
                }
            }
        })
        var td = this
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetinstalasimedis.vetinstalasimedis.get_instalasi_medis_form",
            args: {name: id},
            callback: function(r){
                if (r.message) {
                    console.log(r.message);
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
                        if (![undefined, '', null, 0].includes(r.message.instalasi_medis[c.name])){
                            c.value = r.message.instalasi_medis[c.name]
                            new_checks.push(c)
                        }
                    })
                    
                    td.setState({'data': r.message.instalasi_medis, 'products': r.message.products, 'loaded': true, 'checks': new_checks});
                }
            }
        });
        
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetinstalasimedis.vetinstalasimedis.get_all_products",
            args: {},
            callback: function(r){
                if (r.message) {
                    gr.setState({'products': r.message});
                }
            }
        })
    }
    
    navigationAction(name){
        window.location.href="/main/dokter-dan-jasa/instalasi-medis/edit?n="+name
    }
    
    toggleMainFormWide(){
        this.setState({main_form_wide: !this.state.main_form_wide})
    }
    
    changeAddMode(mode){
        this.setState({add_mode: mode})
    }
    
    deleteObat(e, index) {
    	var new_data = this.state.data
    	var onSelectObat = this.state.onSelectObat
    	new_data.obat.splice(index, 1)
    	if (onSelectObat == index) {
    		this.setState({data: new_data, save_loading: true, onSelectObat: 'false'})
    	} else {
    		this.setState({data: new_data, save_loading: true})
    	}

        var th = this
    	
    	frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vetinstalasimedis.vetinstalasimedis.autosave",
            args: {field: 'obat', value: new_data.obat.filter(i => !i.deleted), name: id},
            callback: function(r){
                if (r.message != true) {
                    frappe.msgprint(r.message.error)
                    th.setState({data: r.message.data})
                }

                th.setState({save_loading: false})
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
    	var obatAll = this.state.products.filter(i => i.product_category.is_obat && !i.product_category.is_racikan)
    	
    	if (name == 'obat') {
	    	obatAll.forEach(function(item, index) {
	    		if (item.product_name == value) {
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
    	}
    }
    
    pressEnter(e) {
    	var new_obat = this.state.new_obat
    	
        if (e.key === 'Enter' || e.key == 'Tab') {
        	e.preventDefault();
            if (new_obat.name && new_obat.name != '' && new_obat.quantity != '0' && new_obat.quantity) {
            	var new_data = this.state.data
            	if (new_obat.quantity.includes(',')) {
            	    new_obat.quantity = new_obat.quantity.replace(/,/g, '.') 
            	}
        		new_data.obat.push(new_obat)
            	this.setState({data: new_data, new_obat:{}, save_loading: true})
            	var qty = document.getElementById("quantity")
            	var selectProduct = document.getElementById("obat_input")
            	qty.value = qty.defaultValue
            	selectProduct.value = ''

                var th = this
            	
            	frappe.call({
                    type: "POST",
                    method:"vet_website.vet_website.doctype.vetinstalasimedis.vetinstalasimedis.autosave",
                    args: {field: 'obat', value: new_data.obat.filter(i => !i.deleted), name: id},
                    callback: function(r){
                        if (r.message != true) {
                            frappe.msgprint(r.message.error)
                            th.setState({data: r.message.data})
                        }

                        th.setState({save_loading: false})
                    }
                });
            }
            
            document.getElementById("obat_input").focus();
        }
    }
    
    changeInstalasiMedis(e){
        var target = e.target
        var name = target.name
        var value = target.value
        var new_data = Object.assign({}, this.state.data)
        
        new_data[name] = value
        this.setState({data: new_data})

        if (name != 'nama_dokter') {
            this.setState({save_loading: true})
            var th = this
            frappe.call({
                type: "POST",
                method:"vet_website.vet_website.doctype.vetinstalasimedis.vetinstalasimedis.autosave",
                args: {field: name, value: value, name: id},
                callback: function(r){
                    if (r.message != true) {
                        frappe.msgprint(r.message.error)
                        th.setState({data: r.message.data})
                    }
                    th.setState({save_loading: false})
                }
            });
        }
    }
    
    handleInputBlur(e, list) {
        const value = e.target.value
        const name = e.target.name
        var new_data = this.state.data
    	var selected = false
    	
    	if (name == "product" || name == "obat") {
    	    list.forEach(function(item, index) {
        	    if (item.product_name == value) {
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
        } else {
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
    
    addJasaLain(e){
        var target = e.target
        var value = target.value
        var new_data = Object.assign({}, this.state.data)
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
                this.setState({save_loading: true})
        	    e.target.selectedIndex = 0
                frappe.call({
            		type: "POST",
            		method:"vet_website.vet_website.doctype.vetproduct.vetproduct.get_product",
            		args: {name: realValue},
            		callback: function(r){
            			if (r.message.product) {
            				new_data.jasa.push({product: realValue, product_name: r.message.product.product_name, quantity: 1, 'product_price': r.message.product.price})
            				jl.setState({'data': new_data})
            				
            				frappe.call({
                                type: "POST",
                                method:"vet_website.vet_website.doctype.vetinstalasimedis.vetinstalasimedis.autosave",
                                args: {field: 'jasa', value: new_data.jasa.filter(i => !i.deleted), name: id},
                                callback: function(r){
                                    if (r.message != true) {
                                        frappe.msgprint(r.message.error)
                                        jl.setState({data: r.message.data})
                                    }

                                    jl.setState({save_loading: false})
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
        var name = target.name
        var value = target.value
        var tl = this
        var new_data = Object.assign({}, this.state.data)
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
                this.setState({save_loading: true})
        	    e.target.selectedIndex = 0
                frappe.call({
            		type: "POST",
            		method:"vet_website.vet_website.doctype.vetproduct.vetproduct.get_product",
            		args: {name: realValue},
            		callback: function(r){
            			if (r.message.product) {
            				new_data.tindak_lanjut.push({product: realValue, product_name: r.message.product.product_name, quantity: 1, 'product_price': r.message.product.price})
            				tl.setState({'data': new_data})
            				
            				frappe.call({
                                type: "POST",
                                method:"vet_website.vet_website.doctype.vetinstalasimedis.vetinstalasimedis.autosave",
                                args: {field: 'tindak_lanjut', value: new_data.tindak_lanjut.filter(i => !i.deleted), name: id},
                                callback: function(r){
                                    if (r.message != true) {
                                        frappe.msgprint(r.message.error)
                                        tl.setState({data: r.message.data})
                                    }

                                    tl.setState({save_loading: false})
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
    
    deleteJasaLain(i){
        var new_data = Object.assign({}, this.state.data)
        if(new_data.jasa[i].name != undefined){
            new_data.jasa[i].deleted = true
        }
        else {
            new_data.jasa.splice(i, 1)
        }
        this.setState({data: new_data, save_loading: true})

        var th = this
        
        frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vetinstalasimedis.vetinstalasimedis.autosave",
            args: {field: 'jasa', value: new_data.jasa.filter(i => !i.deleted), name: id},
            callback: function(r){
                if (r.message != true) {
                    frappe.msgprint(r.message.error)
                    th.setState({data: r.message.data})
                }

                th.setState({save_loading: false})
            }
        });
    }
    
    deleteTindakLanjut(i){
        var new_data = Object.assign({}, this.state.data)
        if(new_data.tindak_lanjut[i].name != undefined){
            new_data.tindak_lanjut[i].deleted = true
        }
        else {
            new_data.tindak_lanjut.splice(i, 1)
        }
        this.setState({data: new_data, save_loading: true})

        var th = this
        
        frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vetinstalasimedis.vetinstalasimedis.autosave",
            args: {field: 'tindak_lanjut', value: new_data.tindak_lanjut.filter(i => !i.deleted), name: id},
            callback: function(r){
                if (r.message != true) {
                    frappe.msgprint(r.message.error)
                    th.setState({data: r.message.data})
                }

                th.setState({save_loading: false})
            }
        });
    }
    
    cancelButton(e){
        e.preventDefault();
        frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vetinstalasimedis.vetinstalasimedis.cancel_instalasi_medis",
            args: {name: id},
            callback: function(r){
                if (r.message.success) {
                    window.location.href = "/main/dokter-dan-jasa/instalasi-medis"
                } else if(r.message.error) {
                    frappe.msgprint(r.message.error);
                }
            }
        });
    }
    
    formSubmit(e){
        e.preventDefault();
        var new_data = this.state.data
        var products = []
        
        this.state.checks.forEach((c, index) => {
            if(!c.delete){
                new_data[c.name] = c.value
            }
        })
        
        console.log(new_data.obat)
        
        new_data.obat.forEach(function(item, index) {
        	var product = {}
        	product['product'] = item.name
        	product['quantity'] = item.quantity
        	
        	products.push(product)
        })
        
        new_data.obat = products
        console.log(new_data)
        
        frappe.call({
    		type: "POST",
    		method:"vet_website.vet_website.doctype.vetinstalasimedis.vetinstalasimedis.confirm_instalasi_medis",
    		args: {data: new_data},
    		callback: function(r){
    			if (r.message.instalasi_medis) {
    				window.location.reload()
    			}
    			if (r.message.error) {
    				frappe.msgprint(r.message.error);
    			}
    		}
    	});
    }
    
    addCheck(data){
        var checks = this.state.checks.slice()
        checks.push(data)
        this.setState({checks: checks, save_loading: true})

        var th = this
        
        frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vetinstalasimedis.vetinstalasimedis.autosave",
            args: {field: data.name, value: data.value, name: id},
            callback: function(r){
                if (r.message != true) {
                    frappe.msgprint(r.message.error)
                    th.setState({data: r.message.data})
                }
                th.setState({save_loading: false})
            }
        });
    }
    
    deleteCheck(i){
        var checks = this.state.checks.slice()
        checks[i].delete = true
        this.setState({checks: checks, save_loading: true})

        var th = this
        
        frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vetinstalasimedis.vetinstalasimedis.autosave",
            args: {field: checks[i]['name'], value: '', name: id},
            callback: function(r){
                if (r.message != true) {
                    frappe.msgprint(r.message.error)
                    th.setState({data: r.message.data})
                }
                th.setState({save_loading: false})
            }
        });
    }
    
    addAttachment(data){
        var vr = this
        var new_data = Object.assign({}, this.state.data)
        var name = data.attachment.name;
        var reader = new FileReader();
        reader.onload = function(e) {
            data.filename = name,
            data.dataurl = reader.result
            data.attachment =  URL.createObjectURL(data.attachment)
            new_data.attachments.push(data)
            vr.setState({data: new_data, save_loading: true})
            
            frappe.call({
                type: "POST",
                method:"vet_website.vet_website.doctype.vetinstalasimedis.vetinstalasimedis.autosave",
                args: {field: 'attachments', value: new_data.attachments.filter(i => !i.deleted), name: id},
                callback: function(r){
                    if (r.message != true) {
                        frappe.msgprint(r.message.error)
                        vr.setState({data: r.message.data})
                    }
                    vr.setState({save_loading: false})
                }
            });
        }
        reader.readAsDataURL(data.attachment);
    }
    
    deleteAttachment(i){
        var new_data = Object.assign({}, this.state.data)
        if(new_data.attachments[i].name != undefined){
            new_data.attachments[i].deleted = true
        }
        else {
            new_data.attachments.splice(i, 1)
        }
        this.setState({data: new_data, save_loading: true})

        var th = this
        
        frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vetinstalasimedis.vetinstalasimedis.autosave",
            args: {field: 'attachments', value: new_data.attachments.filter(i => !i.deleted), name: id},
            callback: function(r){
                if (r.message != true) {
                    frappe.msgprint(r.message.error)
                    th.setState({data: r.message.data})
                }

                th.setState({save_loading: false})
            }
        });
    }
    
    addMarker(marker){
        var new_data = Object.assign({}, this.state.data)
        new_data.marker = marker
        this.setState({data: new_data, save_loading: true})

        var th = this
        
        frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vetinstalasimedis.vetinstalasimedis.autosave",
            args: {field: 'marker', value: new_data.marker, name: id},
            callback: function(r){
                if (r.message != true) {
                    frappe.msgprint(r.message.error)
                    th.setState({data: r.message.data})
                }

                th.setState({save_loading: false})
            }
        });
    }
    
    resetMarker(){
        var new_data = Object.assign({}, this.state.data)
        delete new_data.marker
        this.setState({data: new_data, save_loading: true})

        var th = this
        
        frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vetinstalasimedis.vetinstalasimedis.autosave",
            args: {field: 'marker_delete', value: new_data.marker, name: id},
            callback: function(r){
                if (r.message != true) {
                    frappe.msgprint(r.message.error)
                    th.setState({data: r.message.data})
                }

                th.setState({save_loading: false})
            }
        });
    }
    
    customerInvoiceClick(){
        var location
        this.state.data.reference='Rawat Inap'?location = '/main/kasir/rawat-inap-invoices':location = '/main/kasir/customer-invoices'
        if(this.state.data.customer_invoice && this.state.data.customer_invoice.length > 1){
            window.location.href = location+'?register_number='+encodeURIComponent(this.state.data.register_number)
        } else if(this.state.data.customer_invoice && this.state.data.customer_invoice.length == 1) {
            window.location.href = location+'/edit?n='+encodeURIComponent(this.state.data.customer_invoice[0])
        }
    }
    
    render(){
        var bgstyle = {background: '#FFFFFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', padding: '15px 32px', marginBottom: '15px'}
        var button_style = {lineHeight: '14px', width: '130px'}
        var color = {color: '#056EAD', cursor: 'pointer'}
        var cursor = {cursor: 'pointer'}
        var backButton = <span className="fs16 fw600 mr-4 my-auto" style={color} onClick={() => window.location.href="/main/dokter-dan-jasa/instalasi-medis"}><i className="fa fa-chevron-left mr-1" style={color}></i>Back</span>
        var write = checkPermission('VetInstalasiMedis', this.state.currentUser, 'write')
        var lanjut = checkPermission('VetInstalasiMedis', this.state.currentUser, 'lanjut')
        var batalkan = checkPermission('VetInstalasiMedis', this.state.currentUser, 'batalkan')
        
        var actionButton = []
        
        if(this.state.data.status != 'Done'){
            if(batalkan){
                actionButton.push(
                    <div className="col-auto d-flex" key="0">
        				<button type="button" className="btn btn-sm fs12 btn-outline-danger text-uppercase px-3 py-2 my-auto" onClick={e => this.cancelButton(e)}>Batalkan</button>
        			</div>
        	    )
            }
        	
        	if(lanjut){
        	    actionButton.push(
                    <div className="col-auto d-flex" key="1">
        				<button type="submit" 
                            className={this.state.save_loading
                                ? "btn btn-sm fs12 btn-danger text-uppercase px-3 py-2 my-auto disabled"
                                : "btn btn-sm fs12 btn-danger text-uppercase px-3 py-2 my-auto"} 
                            style={button_style}>
                            {this.state.save_loading
                                ? (<span><i className="fa fa-spin fa-circle-o-notch mr-3"/>Loading...</span>)
                                : "Lanjut"}</button>
        			</div>
            	)
        	}
        }
        
        var statuses
        if (this.state.data.status == 'Cancel') {
            statuses = ['Cancel']
        } else {
            statuses = ['Draft', 'Checked', 'Done']
        }
        
        var customer_invoice = (
            <div className="col-auto" style={cursor} onClick={() => this.customerInvoiceClick()}>
                <div className="row mx-0">
                    <div className="col-auto px-3">
                        <img className="d-block mx-auto mt-2 header-icon" src="/static/img/main/menu/cashier.png"/>
                        <p className="mb-0 fs12 text-muted text-center">{this.state.data.reference=='Rawat Inap'?'Rawat Inap Invoice':'Customer Invoice'}</p>
                    </div>
                </div>
            </div>
        )
        
        if(this.state.loaded) {
            
            return (
                <form onSubmit={e => this.formSubmit(e)}>
                	<div style={bgstyle}>
                		<div className="row mx-0 flex-row-reverse">
                			{actionButton}
                			<div className="col-auto px-0 ml-auto"/>
                			{this.state.data.status=='Done'?customer_invoice:false}
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
                	<InstalasiMedisMainForm data={this.state.data} main_form_wide={this.state.main_form_wide} toggleMainFormWide={() => this.toggleMainFormWide()} changeInstalasiMedis={this.changeInstalasiMedis} handleInputBlur={this.handleInputBlur}/>
                	<div className="row">
                	    <div className='col-6'>
                	        <InstalasiMedisRekamMedis write={write} main_form_wide={this.state.main_form_wide} data={this.state.data} changeInstalasiMedis={this.changeInstalasiMedis} handleInputBlur={this.handleInputBlur} addCheck={this.addCheck} deleteCheck={this.deleteCheck} checks={this.state.checks} toggleRekamMedisWide={() => this.toggleRekamMedisWide()} deleteAttachment={this.deleteAttachment} addAttachment={this.addAttachment} addMarker={this.addMarker} resetMarker={this.resetMarker}/>
                	    </div>
                	    <div className='col-6'>
                	        <InstalasiMedisJasaLain write={write} main_form_wide={this.state.main_form_wide} jasa={this.state.data.jasa} tindak_lanjut={this.state.data.tindak_lanjut} status={this.state.data.status} deleteJasaLain={this.deleteJasaLain} deleteTindakLanjut={this.deleteTindakLanjut} addJasaLain={this.addJasaLain} addTindakLanjut={this.addTindakLanjut} changeAddMode={this.changeAddMode} list_jasa={this.state.products} add_mode={this.state.add_mode} handleInputBlur={this.handleInputBlur} obat={this.state.data.obat} deleteObat={this.deleteObat} handleInputChangeObat={this.handleInputChangeObat} pressEnter={this.pressEnter}/>
                	    </div>
                	</div>
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

class InstalasiMedisMainForm extends React.Component {
    sourceClick(tipe){
        if (tipe == 'pemilik') {
            window.location.href = '/main/penerimaan/data-pemilik/edit?n=' + this.props.data.pet_owner
        } else if (tipe == 'pasien') {
            window.location.href = '/main/penerimaan/data-pasien/edit?n=' + this.props.data.pet
        }
    }
    
    dokterClick(){
    	if(this.props.data.tindakan_dokter && this.props.data.tindakan_dokter.length > 1){
            window.location.href = "/main/dokter-dan-jasa/tindakan-dokter?register_number="+encodeURIComponent(this.props.reception.register_number)
        } else if(this.props.data.tindakan_dokter && this.props.data.tindakan_dokter.length == 1){
            window.location.href = "/main/dokter-dan-jasa/tindakan-dokter/edit?n="+encodeURIComponent(this.props.data.tindakan_dokter[0])
        }
    }
    
    rawatInapClick(){
    	if(this.props.data.rawat_inap && this.props.data.rawat_inap.length > 1){
            window.location.href = "/main/dokter-dan-jasa/rawat-inap?register_number="+encodeURIComponent(this.props.reception.register_number)
        } else if(this.props.data.rawat_inap && this.props.data.rawat_inap.length == 1){
            window.location.href = "/main/dokter-dan-jasa/rawat-inap/edit?n="+encodeURIComponent(this.props.data.rawat_inap[0])
        }
    }
    
    render() {
        var readOnly = false
        var select_style = { color: '#056EAD', border: '1px solid #056EAD' }
        var input_nama_dokter = <input required name='nama_dokter' className="form-control lightbg fs14" style={select_style} onChange={e => this.props.changeInstalasiMedis(e)} onBlur={(e) => this.props.handleInputBlur(e, this.props.data.list_dokter)} list="list_dokter" id="nama_dokter" autoComplete="off" value={this.props.data.nama_dokter || ''} readOnly={readOnly}/>
        if(this.props.data.status == 'Done'){
            readOnly = true
            input_nama_dokter = <p className="mb-0">{this.props.data.nama_dokter || ''}</p>
        }
        var bgstyle = {background: '#fff', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)'}
        var cursor = {cursor: 'pointer'}
        var link_pemilik = <img src="/static/img/main/menu/tautan.png" className="mx-2" onClick={() => this.sourceClick('pemilik')} style={cursor}/>
        var link_pasien = <img src="/static/img/main/menu/tautan.png" className="mx-2" onClick={() => this.sourceClick('pasien')} style={cursor}/>
        var link_dokter = <img src="/static/img/main/menu/tautan.png" className="mx-2" onClick={() => this.dokterClick()} style={cursor}/>
        var link_rawat_inap = <img src="/static/img/main/menu/tautan.png" className="mx-2" onClick={() => this.rawatInapClick()} style={cursor}/>

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
			        <div className="col-3">
    			        <div className="form-group mb-1">
        					<label htmlFor="register_number" className="fs10 fw600">No Pendaftaran</label>
        					<p className="mb-0">{this.props.data.register_number || ''}</p>
        				</div>
        				<div className="form-group mb-1">
        					<label htmlFor="pet" className="fs10 fw600">No. Induk Pasien</label>
        					<p className="mb-0">{this.props.data.pet || ''}</p>
        				</div>
			        </div>
			        <div className="col-3">
			            <div className="form-group mb-1">
        					<label htmlFor="pet_name" className="fs10 fw600">Nama Pasien</label>
        					<p className="mb-0">{this.props.data.pet_name || ''}{link_pasien}</p>
        				</div>
        				<div className="form-group mb-1">
        					<label htmlFor="pet_age" className="fs10 fw600">Umur</label>
        					<p className="mb-0">{this.props.data.pet_age_year || 0} Th {this.props.data.pet_age_month || 0} Bln</p>
        				</div>
        				<div className="form-group mb-1">
        					<label htmlFor="pet_owner_name" className="fs10 fw600">Nama Pemilik</label>
        					<p className="mb-0">{this.props.data.pet_owner_name || ''}{link_pemilik}</p>
        				</div>
			        </div>
			        <div className="col-3">
			            <div className="form-group mb-1">
        					<label htmlFor="date" className="fs10 fw600">Tanggal</label>
        					<p className="mb-0">{moment(this.props.data.date).format("DD-MM-YYYY") || ''}</p>
        				</div>
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
        					<label htmlFor="service" className="fs10 fw600">Layanan</label>
        					<p className="mb-0">{this.props.data.service || ''}</p>
        				</div>
        				<div className="form-group mb-1">
        					<label htmlFor="reference" className="fs10 fw600">Rujukan</label>
        					<p className="mb-0">{this.props.data.reference || ''}{this.props.data.reference=='Dokter'?link_dokter:this.props.data.reference=='Rawat Inap'?link_rawat_inap:false}</p>
        				</div>
        				<div className="form-group mb-1">
        					<label htmlFor="owner" className="fs10 fw600">User</label>
        					<p className="mb-0">{this.props.data.owner_name || ''}</p>
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
			        <div className="col-3">
    			        <div className="form-group mb-1">
        					<label htmlFor="register_number" className="fs10 fw600">No Pendaftaran</label>
        					<p className="mb-0">{this.props.data.register_number || ''}</p>
        				</div>
			        </div>
			        <div className="col-3">
			            <div className="form-group mb-1">
        					<label htmlFor="pet_name" className="fs10 fw600">Nama Pasien</label>
        					<p className="mb-0">{this.props.data.pet_name || ''}{link_pasien}</p>
        				</div>
			        </div>
			        <div className="col-3">
			            <div className="form-group mb-1">
        					<label htmlFor="date" className="fs10 fw600">Tanggal</label>
        					<p className="mb-0">{moment(this.props.data.date).format("DD-MM-YYYY") || ''}</p>
        				</div>
			        </div>
                    <div className="col-2">
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
        					<label htmlFor="service" className="fs10 fw600">Layanan</label>
        					<p className="mb-0">{this.props.data.service || ''}</p>
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

class InstalasiMedisJasaLain extends React.Component {
    render() {
        var list_jasa = this.props.list_jasa
        var jasa = this.props.jasa
        var tindak_lanjut = this.props.tindak_lanjut
        var jasa_rows = []
        var tindak_lanjut_rows = []
        // var boxShadow_style = {background: '#fff', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', padding:'10px 24px'}
        var boxShadow_style = {background: '#fff', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', height: 'calc(100vh - 355px)', overflowY: 'auto', minHeight: '310px'}
        var counterStyle = {marginTop: '-1rem', verticalAlign: 'middle'}
        var tabPaneStyle = {minHeight: '280px'}
        var obatAll = list_jasa.filter(i => i.product_category.is_obat && !i.product_category.is_racikan)
        
        this.props.main_form_wide?boxShadow_style.height = 'calc(100vh - 460px)':false
        
        var select_style = {color: '#056EAD', border: '1px solid #056EAD'}
        var newSelect, div_class
		if(this.props.status != 'Done' && this.props.write){
		    var jasa_products
		    var jasa_options = []
		    if(list_jasa != undefined && list_jasa.length != 0){
		        if(this.props.add_mode == 'jasa'){
		            jasa_products = list_jasa.filter(i => i.product_category.is_tindakan)
		        }
		        else if(this.props.add_mode == 'tindak_lanjut'){
		          //  jasa_products = list_jasa.filter(i => i.is_operasi || i.is_usg || i.is_radiologi || i.is_lab || i.is_rawat)
		            jasa_products = list_jasa.filter(i => i.product_category.is_operasi || i.product_category.is_usg || i.product_category.is_radiologi || i.product_category.is_lab)
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
                    <div>
                        <input autoComplete="off" name='product' className="form-control fs14" style={select_style} onChange={e => this.props.addTindakLanjut(e)} onBlur={(e) => this.props.handleInputBlur(e, jasa_products)} list="tindak_lanjut_list" placeholder="Pilih Untuk Menambahkan"/>
                        <datalist  id="tindak_lanjut_list">
                            {jasa_options}
                        </datalist>
                    </div>
        		)
	        }
        }
		
		if(jasa != undefined && jasa.length != 0){
		    jasa.forEach((item, index) => {
		        if(!item.deleted){
		            jasa_rows.push(<InstalasiMedisJasaLainRow write={this.props.write} item={item} status={this.props.status} key={index.toString()} deleteAction={() => this.props.deleteJasaLain(index.toString())}/>)
		        }
		    })
		}
		
		if(tindak_lanjut != undefined && tindak_lanjut.length != 0){
		    tindak_lanjut.forEach((item, index) => {
		        if(!item.deleted){
		            tindak_lanjut_rows.push(<InstalasiMedisJasaLainRow write={this.props.write} mode="tindak_lanjut" item={item} status={this.props.status} key={index.toString()} deleteAction={() => this.props.deleteTindakLanjut(index.toString())}/>)
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
                <div className="mb-3 px-4 py-2" style={boxShadow_style}>
    				<div>
        				<ul className="nav nav-tabs justify-content-around" id="dokterTab" role="tablist">
                			<li className="nav-item">
                				<a className="nav-link py-1 active" id="obat-tab" data-toggle="tab" href="#obat" role="tab" onClick={() => this.props.changeAddMode('obat')}><span>Obat</span>{obat_counter}</a>
                			</li>
                			<li className="nav-item">
                				<a className="nav-link py-1" id="jasa-tab" data-toggle="tab" href="#jasa" role="tab" onClick={() => this.props.changeAddMode('jasa')}><span>Jasa</span>{jasa_counter}</a>
                			</li>
                			<li className="nav-item">
                				<a className="nav-link py-1" id="tindak-lanjut-tab" data-toggle="tab" href="#tindak_lanjut" role="tab" onClick={() => this.props.changeAddMode('tindak_lanjut')}><span>Tindak Lanjut</span>{tindak_lanjut_counter}</a>
                			</li>
                		</ul>
    					<div className="tab-content" id="dokterTabContent" style={tabPaneStyle}>
    					    <div className="tab-pane pt-4 pb-2 show active" id="obat" role="tabpanel">
    					        <InstalasiMedisObat write={this.props.write} status={this.props.status} obat={this.props.obat} obatAll={obatAll} deleteObat={this.props.deleteObat} handleInputChangeObat={this.props.handleInputChangeObat} pressEnter={this.props.pressEnter} handleInputBlur={this.props.handleInputBlur} />
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

class InstalasiMedisJasaLainRow extends React.Component {
    render() {
        var item = this.props.item
        var panel_style = {background: '#D2EEFF', padding: '10px 20px', color: '#056EAD'}
        var product_name = <span className="ml-3 fs14">{item.product_name}</span>
        var description = <span className="ml-3">{formatter.format(item.product_price)}</span>
        var cursor = {cursor: 'pointer'}
        var deleteButton
        if (this.props.status != 'Done'){
            deleteButton = <i className="fa fa-2x fa-trash m-auto" style={cursor} onClick={this.props.deleteAction}/>
        }
        
        if(this.props.mode == 'tindak_lanjut')
        description = <span className="ml-3">Tindak Lanjut</span>
        
        return (
            <div className="row mx-0 mb-3 fs12 fw600 grooming_products" style={panel_style}>
            	<div className="col-10">
            	    <div className="row">
            	        <div className="col-7">
            	            {product_name}
            	        </div>
            	    </div>
            		{description}
            	</div>
            	<div className="col-2 text-center d-flex">
            	    {this.props.write?deleteButton:false}
            	</div>
            </div>
        )
    }
}

class InstalasiMedisRekamMedis extends React.Component {
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
                // {'label': 'Suhu', 'name': 'temperature'},
                // {'label': 'Berat', 'name': 'weight'},
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
        var boxShadow_style = {background: '#fff', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', height: 'calc(100vh - 355px)', overflowY: 'auto', minHeight: '310px'}
        var inputStyle = {color: '#056EAD', border: '1px solid #056EAD', height:'35px'}
        var suhu, berat
        var enable_edit = false
        var panel_style = {background: '#D2EEFF', padding: '10px 20px', color: '#056EAD'}
        var fontColor = {color: '#6D7573'}
        var fontColor2 = {color: '#056EAD'}
        var cursor = {cursor: 'pointer'}
        
        this.props.main_form_wide?boxShadow_style.height = 'calc(100vh - 460px)':false
        
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
            
            suhu = (
                <div className="col pr-0">
                    <div className="row">
                        <div className="col-4">
                            <label htmlFor="temperature" className="fw600 my-2" style={fontColor}>Suhu (C)</label>
                        </div>
                        <div className="col-6 pl-auto">
                            <input id="temperature" name="temperature" className="form-control border-0" placeholder="0"  onChange={this.props.changeInstalasiMedis} required style={fontColor} value={data.temperature || ''}/>
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
                            <input id="weight" name="weight" className="form-control border-0" placeholder="0"  onChange={this.props.changeInstalasiMedis} required style={fontColor} value={data.weight || ''}/>
                        </div>
                    </div>
    		    </div>
            )
                        
            var newSelect = <div className="row mb-3">
    							<div className="col-4 my-1">
    								<input autoComplete="off" name='field_name' list="anamnese_options" id="field_name_anamnese" className="form-control fs14 fw600" style={inputStyle} onChange={e => this.handleInputChangeRekamMedis(e)} placeholder="Anamnese" onBlur={e => this.handleInputBlurRekamMedis(e, this.state.available_check.filter(i => anamnese_options.includes(i.name)))}/>
    								<datalist id="anamnese_options">
    									{available_check_anamnese}
    								</datalist>
    							</div>
    							<div className="col-4 my-1">
    								<input autoComplete="off" name='field_name' list="pemeriksaan_options" id="field_name_pemeriksaan" className="form-control fs14 fw600" style={inputStyle} onChange={e => this.handleInputChangeRekamMedis(e)} placeholder="Pemeriksaan" onBlur={e => this.handleInputBlurRekamMedis(e, this.state.available_check.filter(i => pemeriksaan_options.includes(i.name)))}/>
    								<datalist id="pemeriksaan_options">
    									{available_check_pemeriksaan}
    								</datalist>
    							</div>
    							<div className="col-4 my-1">
    								<input autoComplete="off" name='field_name' list="diagnosa_options" id="field_name_diagnosa" className="form-control fs14 fw600" style={inputStyle} onChange={e => this.handleInputChangeRekamMedis(e)} placeholder="Diagnosa" onBlur={e => this.handleInputBlurRekamMedis(e, this.state.available_check.filter(i => diagnosa_options.includes(i.name)))}/>
    								<datalist id="diagnosa_options">
    									{available_check_diagnosa}
    								</datalist>
    							</div>
    							<div className="col-12 my-1">
    								<input style={inputStyle} type="text" className="form-control input-sm fs14 fw600" name="field_value" id="field_value" placeholder="Keterangan" onChange={e => this.handleInputChangeRekamMedis(e)} onKeyDown={e => this.pressEnterRekamMedis(e)}/>
    							</div>
    						</div>
    	    
        } else if (data.status == 'Done' || !this.props.write) {
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
        }
        
        var checks_list = []
        this.props.checks.forEach((c, index) => {
            if(c.delete == undefined){
                checks_list.push(<InstalasiMedisRekamMedisList write={this.props.write} check={c} key={index.toString()} status={data.status} deleteCheck={() => this.props.deleteCheck(index.toString())}/>)
            }
        })
        
        return (
            <div className="h-100">
                <p className="mb-2 text-dark fs18 fw600">Rekam Medis</p>
                <div className="px-4 pb-4 pt-2 mb-3" style={boxShadow_style}>
                    <div className="row justify-content-around mb-3 mx-n1" style={panel_style}>
    		            {suhu}
    		            {berat}
    		        </div>
                    <div className="row">
                        <div className="col-12">
                            {newSelect}
                        	{checks_list}
                        </div>
                        <div className="col-12">
                            <Attachments attachments={data.attachments} enable_edit={enable_edit} deleteAction={this.props.deleteAttachment} addAction={this.props.addAttachment} addMarker={this.props.addMarker} resetMarker={this.props.resetMarker} marker={data.marker}/>
                        </div>
                    </div>
    			</div>
			</div>
        )
    }
}

class InstalasiMedisRekamMedisList extends React.Component {
    render(){
        var panel_style = {background: '#D2EEFF', padding: '10px 20px', color: '#056EAD', borderRadius: '5px'}
        var check = this.props.check
        var status = this.props.status
        var cursor = {cursor: 'pointer'}
        var deleteButton
        
        if (status == 'Draft') {
            deleteButton = <i className="fa fa-2x fa-trash ml-auto" onClick={this.props.deleteCheck} style={cursor}/>
        }
        return <div id={check.name} className="form-row mb-3 fs12 fw600 grooming_products" style={panel_style}>
	        <div className="col-3">
	            <span className="fs14">{check.label || check.name}</span>
	        </div>
	        <div className="col text-right">
	            <span className="fs14">{check.value}</span>
	        </div>
	        <div className="col-auto text-center d-flex">
        	    {this.props.write?deleteButton:false}
        	</div>
        </div>
    }
}

class InstalasiMedisObat extends React.Component {
    render() {
    	var status = this.props.status
    	var obat = this.props.obat
    	var obatAll = this.props.obatAll
    	var selectStyle = {color: '#056EAD', border: '1px solid #056EAD'}
    	var quantityStyle = {color: '#056EAD', border: '1px solid #056EAD', height:'35px'}
    	var obatList = []
    	var ao = this
    	
    	if (obat != null) {
    	    obat.forEach(function(item, index) {
        		obatList.push(
        			<InstalasiMedisObatList write={ao.props.write} obat={item} key={index.toString()} status={status} deleteObat={(e) => ao.props.deleteObat(e, index)} index={index.toString()} />
        		)
        	})
    	}
    	
    	if (status == 'Draft' && this.props.write) {
    		var option_product = []
    		obatAll.forEach(function(item, index) {
    			option_product.push(
    				<option value={item.product_name} key={index.toString()} />
    				)
    		})
    		
    		var newProductSelect = <div className="row">
    									<div className="col-10">
    										<input name='obat' list="products" id="obat_input" className="form-control fs14 fw600" style={selectStyle} onChange={this.props.handleInputChangeObat} placeholder="Pilih Untuk Menambahkan" onBlur={(e) => this.props.handleInputBlur(e, obatAll)} />
    											<datalist id="products">
    												{option_product}
    											</datalist>
    									</div>
    									<div className="col-2 my-auto mx-auto">
    										<input style={quantityStyle} type="text" className="form-control input-sm text-center fs14 fw600" name="quantity" id="quantity" placeholder="0" onChange={ao.props.handleInputChangeObat} onKeyDown={ao.props.pressEnter}/>
    									</div>
    								</div>
    		
    	}
    	
        return <div>
                    <div className="mb-3">
                        {newProductSelect}
                    </div>
                    <div>
                    	{obatList}
                    </div>
				</div>
    }
}

class InstalasiMedisObatList extends React.Component {
	render() {
		var panel_style = {background: '#84D1FF', padding: '10px 20px', color: '#056EAD'}
		var cursor = {cursor: 'pointer', color: '#787E84'}
		var obat = this.props.obat
		var status = this.props.status
		var rowButton
// 		var totalPrice = obat.quantity * obat.price
		var totalPrice = Math.ceil(parseFloat(obat.quantity)) * obat.price
		
		if (status == 'Draft' && this.props.write) {
			rowButton = <div className="row flex-row-reverse mb-2">
							<i className="fa fa-2x fa-trash mr-1" onClick={this.props.deleteObat} style={cursor}/>
						</div>
		} else {
			rowButton = <div className="row flex-row-reverse mb-2">
						</div>
		}
		
		var quantity_display = <span className="ml-1 fs14">{obat.quantity + ' ' + obat.uom_name}</span>
		if(obat.original_quantity != undefined || parseFloat(obat.quantity) % 1 != 0 ){
		    var rounded = Math.ceil(parseFloat(obat.quantity))
			quantity_display = <span className="ml-1 fs14">{obat.quantity + ' ' + obat.uom_name} @ {obat.original_quantity||rounded + ' ' + obat.uom_name}</span>
		}
		
		return <div>
					<div className="row mx-0 mb-3 fs12 fw600 grooming_products rounded" style={panel_style}>
			        	<div className="col-10">
			        	    <div className="row mb-2">
			        	        <span className="ml-1 fs14">{obat.product_name}</span>
			        	    </div>
			        	    <div className="row">
			        	    	<div className="col-auto">
			        	    		{quantity_display}
			        	    	</div>
			        	    	<div className="col-auto">
			        	    		<span className="ml-1 fs14">x</span>
			        	    	</div>
			        	    	<div className="col-auto">
			        	    		<span className="ml-1 fs14">{formatter.format(obat.price)}</span>
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
ReactDOM.render(<InstalasiMedis/>,document.getElementById("instalasi_medis"));