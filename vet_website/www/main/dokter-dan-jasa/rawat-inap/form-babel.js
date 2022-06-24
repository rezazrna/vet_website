var list = document.getElementsByTagName("title")[0].innerHTML.split('/')
var id = list[list.length - 1].replace(' ', '')

var kondisiOptions = [
        {label: 'Sehat', value: 'Sehat'},
        {label: 'Sakit', value: 'Sakit'},
        {label: 'Membaik', value: 'Membaik'},
        {label: 'Memburuk', value: 'Memburuk'},
        {label: 'Kritis', value: 'Kritis'},
    ]
    
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
        {'label': 'Suhu', 'name': 'temperature'},
        {'label': 'Berat', 'name': 'weight'},
        {'label': 'Lainnya', 'name': 'other_pemeriksaan'},
        {'label': 'Lainnya', 'name': 'other_diagnosa'},
    ]

class RawatInap extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'loaded': false,
            'data': {},
            'show_template': false,
            'currentUser': {}
        }
        
        this.toggleWide = this.toggleWide.bind(this)
        this.togglePopupTindakan = this.togglePopupTindakan.bind(this)
        this.expandRow = this.expandRow.bind(this)
        this.expandAll = this.expandAll.bind(this);
        this.addTindakan = this.addTindakan.bind(this)
        this.handleInputChange = this.handleInputChange.bind(this)
        this.handleInputBlur = this.handleInputBlur.bind(this)
        this.toggleTemplateTindakan = this.toggleTemplateTindakan.bind(this)
        this.navigationAction = this.navigationAction.bind(this)
    }
    
    componentDidMount() {
        var lastfilter = JSON.parse(sessionStorage.getItem('/main/dokter-dan-jasa/rawat-inap'))
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
            method:"vet_website.vet_website.doctype.vetrawatinap.vetrawatinap.get_name_list",
            args: {filters: lastfilter},
            callback: function(r){
                if (r.message) {
                    gr.setState({'namelist': r.message});
                }
            }
        })
        this.getRawatInap()
    }
    
    getRawatInap(){
        var gr = this
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetrawatinap.vetrawatinap.get_rawat_inap",
            args: {name: id},
            callback: function(r){
                if (r.message) {
                    console.log(r.message)
                    gr.setState({'data': r.message.rawat_inap, 'loaded': true, 'products': r.message.products, 'kandang': r.message.kandang, 'show_popup_tindakan': false});
                }
            }
        });
        
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetrawatinap.vetrawatinap.get_all_products",
            args: {},
            callback: function(r){
                if (r.message) {
                    gr.setState({'products': r.message});
                }
            }
        })
    }
    
    navigationAction(name){
        window.location.href="/main/dokter-dan-jasa/rawat-inap/edit?n="+name
    }
    
    toggleTemplateTindakan() {
        var th = this
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vettemplatetindakan.vettemplatetindakan.check_template_tindakan",
            args: {register_number: this.state.data.register_number},
            callback: function(r){
                if (r.message) {
                    if (r.message.length == 0) {
                        if (th.state.data.cage) {
                            th.setState({show_template: !th.state.show_template})
                        } else {
                            frappe.msgprint('Anda belum memilih kandang')
                        }
                    } else if (r.message.length != 0) {
                        th.setState({show_template: !th.state.show_template})
                    }
                }
            }
        });
    }
    
    toggleWide(e) {
    	e.preventDefault()
    	this.setState({'main_form_wide': !this.state.main_form_wide})
    }
    
    togglePopupTindakan(e) {
    	e.preventDefault()
    	var th = this
    	frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vettemplatetindakan.vettemplatetindakan.check_template_tindakan",
            args: {register_number: this.state.data.register_number},
            callback: function(r){
                if (r.message) {
                    if (r.message.length != 0) {
                        th.setState({'show_popup_tindakan': !th.state.show_popup_tindakan})
                    } else {
                        frappe.msgprint('Anda belum membuat template tindakan')
                    }
                }
            }
        });
    }
    
    expandRow(i, condition=null) {
        var aa = this
        var new_data = Object.assign({}, this.state.data)
        if([true, false].includes(condition)){
            new_data.tindakan[i].expand = condition
        }
        if(!new_data.tindakan[i].expand){
            new_data.tindakan[i].forEach(function(item, index) {
                if(item.rekam_medis.attachments == undefined){
                    frappe.call({
                        type: "GET",
                        method:"vet_website.vet_website.doctype.vetrawatinap.vetrawatinap.get_rekam_medis",
                        args: {name: item.rekam_medis.name},
                        callback: function(r){
                            if (r.message) {
                                new_data.tindakan[i].expand = true
                                item.rekam_medis.jasa = r.message.jasa
                                item.rekam_medis.obat = r.message.obat
                                aa.setState({data: new_data})
                                aa.checkExpand()
                            }
                        }
                    });
                }
                else{
                    new_data.tindakan[i].expand = true
                    this.setState({data: new_data})
                    this.checkExpand()
                }
            })
            
        }
        else {
            new_data.tindakan[i].expand = false
            this.setState({data: new_data})
            this.checkExpand()
        }
    }
    
    expandAll() {
        if(this.state.data.tindakan.length != 0){
            var new_data = this.state.data
            new_data.tindakan.forEach((d, index) => {
                d.expand = false
            })
            this.setState({data: new_data, expand_all: false})
        }
    }
    
    checkExpand() {
        var is_all_expanded = this.state.data.tindakan.every((d) => d.expand)
        if(is_all_expanded){
            this.setState({expand_all: true})
        }
        else {
            this.setState({expand_all: false})
        }
    }
    
    addTindakan(data){
    	var at = this
    	var new_data = Object.assign({}, this.state.data)
    	data.name = id
    	
    	console.log(data)
    	
    	frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vetrawatinap.vetrawatinap.add_tindakan",
            args: {data: data},
            callback: function(r){
                if (r.message) {
                //     var sameDate = new_data.tindakan.findIndex(i => new Date(i[0].rekam_medis.record_date).toISOString().slice(0,10) == new Date(r.message.rekam_medis.record_date).toISOString().slice(0,10))
                    
                //     if (sameDate != -1) {
                //         new_data.tindakan[sameDate].push(r.message)
                //     } else {
                //         new_data.tindakan.push([r.message])
                //     }
                    
                // 	at.setState({'show_popup_tindakan': false, 'data': new_data})
                    at.getRawatInap()
                }
            }
        });
    }
    
    rawatInapReturn(){
    	var at = this
    	var new_data = Object.assign({}, this.state.data)
    	frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vetrawatinap.vetrawatinap.rawat_inap_return",
            args: {name: id},
            callback: function(r){
                if (r.message) {
                	new_data.status = 'Done'
                	at.setState({'data': new_data})
                }
            }
        });
    }
    
    handleInputChange(e) {
        var value = e.target.value
        var name = e.target.name
        var new_data = this.state.data
        
        new_data[name] = value
        this.setState({data: new_data})
    }
    
    handleInputBlur(e) {
        var value = e.target.value
        var name = e.target.name
        var new_data = this.state.data
        var selected = false
        
        selected = this.state.kandang.find(i => i.cage_name == value)
        
        if (!selected) {
            e.target.value = ''
            new_data[name] = ''
        }
        
        this.setState({data: new_data})
    }
    
    customerInvoiceClick(){
        if(this.state.data.customer_invoice && this.state.data.customer_invoice.length > 1){
            window.location.href = '/main/kasir/rawat-inap-invoices?register_number='+encodeURIComponent(this.state.data.register_number)
        } else if(this.state.data.customer_invoice && this.state.data.customer_invoice.length == 1) {
            window.location.href = '/main/kasir/rawat-inap-invoices/edit?n='+encodeURIComponent(this.state.data.customer_invoice[0])
        }
    }
    
    render() {
        var bgstyle = {background: '#FFFFFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', padding: '2px 32px', marginBottom: '15px'}
        var lh14 = {lineHeight: '14px'}
        var rowMinHeight = {minHeight: '64px'}
        var color = {color: '#056EAD', cursor: 'pointer'}
        var cursor = {cursor: 'pointer'}
        var noLeftRight = {left: '0', right: '0'}
        var rawat_inap = this.state.data
        var headerButton, popupTindakan, templateTindakan
        var backButton = <span key="999" className="fs16 fw600 mr-auto my-auto" style={color} onClick={() => window.location.href="/main/dokter-dan-jasa/rawat-inap"}><i className="fa fa-chevron-left mr-1" style={color}></i>Back</span>
        var tambah_tindakan = checkPermission('VetRawatInap', this.state.currentUser, 'tambah tindakan')
        var pulang = checkPermission('VetRawatInap', this.state.currentUser, 'pulang')
        
        if (this.state.show_template) {
            templateTindakan = <TemplateTindakan cage={this.state.data.cage} kandang={this.state.kandang} list_product={this.state.products} toggleTemplateTindakan={this.toggleTemplateTindakan} register_number={this.state.data.register_number} saveTemplate={this.saveTemplate} status={this.state.data.status}/>
        }
        
        if (this.state.loaded) {
            var customer_invoice = (
                    <div className="col-auto" style={cursor} onClick={() => this.customerInvoiceClick()}>
                        <div className="row mx-0">
                            <div className="col-auto px-3">
                                <img className="d-block mx-auto mt-2 header-icon" src="/static/img/main/menu/cashier.png"/>
                                <p className="mb-0 fs12 text-muted text-center">Rawat Inap Invoice</p>
                            </div>
                        </div>
                    </div>
                )
        	
        	if (rawat_inap.status != 'Done') {
        	    var tambah_button, pulang_button
        	    if(tambah_tindakan){
        	        tambah_button = <div className="col-auto d-flex my-auto">
                        				<button className="d-block btn btn-sm btn-danger fs12 text-uppercase fwbold py-2 px-4" onClick={this.togglePopupTindakan}>Tambah Tindakan</button>
                        			</div>
        	    }
        	    if(pulang){
        	        pulang_button = <div className="col-auto d-flex my-auto">
                        				<button type="button" className="d-block btn btn-sm fs12 btn-outline-danger text-uppercase fwbold py-2 px-4" onClick={() => this.rawatInapReturn()}>Pulang</button>
                        			</div>
        	    }
        		headerButton = <div>
                        		<div className="row mx-0 flex-row-reverse">
                        			
                        			{pulang_button}
                        			{tambah_button}
                        			<div className="col-auto px-0 ml-auto"/>
                        			{rawat_inap.status=='On Progress'?customer_invoice:false}
							        <div className="col-auto" style={cursor} onClick={() => this.toggleTemplateTindakan()}>
							            <img className="d-block mx-auto mt-2 header-icon" src="/static/img/main/menu/template-tindakan.png"/>
							            <p className="mb-0 fs12 text-muted text-center">Template Tindakan</p>
							        </div>
                        			<div className="col-auto d-flex mr-auto">
                        			    {backButton}
                        			</div>
                        		</div>
                        		<div id="alert_box" className="text-center mb-3 position-absolute" style={noLeftRight}></div>
                    	    </div>
        	} else {
        		headerButton = <div className="row mx-0 flex-row-reverse" style={rowMinHeight}>
        		                    <div className="col-auto px-0 ml-auto"/>
        		                    {customer_invoice}
        							{backButton}
			            		</div>
        	}
        	
        	if (this.state.show_popup_tindakan) {
        		popupTindakan = <PopupTindakan togglePopupTindakan={this.togglePopupTindakan} products={this.state.products} data={this.state.data} addTindakan={this.addTindakan}/>
        	}
        	
    		return <div>
		            	<div style={bgstyle}>
		            		{headerButton}
		            	</div>
		            	<div className="row justify-content-end">
    	            	    <div className="col-auto">
    	            	        <StatusRow statuses={['Draft', 'On Progress', 'Done']} current_status={rawat_inap.status}/>
    	            	    </div>
    	            	    <div className="col-auto">
    	            	        <RecordNavigation currentname={this.state.data.name} namelist={this.state.namelist} navigationAction={this.navigationAction}/>
    	            	    </div>
    	            	</div>
		                <RawatInapMainForm data={rawat_inap} main_form_wide={this.state.main_form_wide} toggleWide={this.toggleWide} kandang={this.state.kandang} handleInputChange={this.handleInputChange} handleInputBlur={this.handleInputBlur}/>
		                <ListExpandable data={this.state.data.tindakan} expandRow={this.expandRow} expandAll={() => this.expandAll()} expand_all={this.state.expand_all}/>
		                {popupTindakan}
		                {templateTindakan}
		            </div>
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

class PopupTindakan extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			'waktu': '',
			'mode': '',
			'loaded': false,
			'pemeriksaan': {
				'checks': [],
				'attachments': [],
				'status': this.props.data.status,
				'jasa_dan_obat': [],
				'tindak_lanjut': [],
			},
			'new_obat': {},
		}
		this.selectWaktu = this.selectWaktu.bind(this)
		this.changeMode = this.changeMode.bind(this)
		this.addCheck = this.addCheck.bind(this)
		this.deleteCheck = this.deleteCheck.bind(this)
		this.addAttachment = this.addAttachment.bind(this)
		this.deleteAttachment = this.deleteAttachment.bind(this)
		this.addMarker = this.addMarker.bind(this)
		this.resetMarker = this.resetMarker.bind(this)
		this.changeTindakanDokter = this.changeTindakanDokter.bind(this)
		this.deleteJasaObat = this.deleteJasaObat.bind(this)
		this.deleteTindakLanjut = this.deleteTindakLanjut.bind(this)
	}
	
	componentDidMount() {
		var th = this
		frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vettemplatetindakan.vettemplatetindakan.get_template_tindakan",
            args: {register_number: this.props.data.register_number},
            callback: function(r){
                if (r.message) {
                    console.log(r.message)
                    th.setState({'template_data': r.message, 'loaded': true});
                }
            }
        });
	}
	
	selectWaktu(e, value) {
		e.preventDefault()
		var template_data_tindakan = this.state.template_data.tindakan.filter(i => i[value])
		var pemeriksaan = Object.assign({}, this.state.pemeriksaan)
		template_data_tindakan.forEach(function(item, index) {
        	pemeriksaan.jasa_dan_obat.push(item)
        })
		this.setState({waktu: value, pemeriksaan: pemeriksaan})
		
	}
	
	changeMode(e, value) {
		e.preventDefault()
		this.setState({mode: value})
	}
	
	handleInputBlur(e, list) {
		const value = e.target.value
    	
    	var selected = list.find(i => i.product_name == value)
    	
    	if (!selected) {
    		e.target.value = ''
    	}
    	
	}
	
	changeTindakanDokter(e){
        var target = e.target
        var name = target.name
        var value = target.value
        var new_data = Object.assign({}, this.state.pemeriksaan)
        
        new_data[name] = value
        this.setState({pemeriksaan: new_data})
    }
    
    handleInputChangeObat(e) {
    	const value = e.target.value
    	const name = e.target.name
    	var new_obat = this.state.new_obat
    	var aa = this
    	var selected = false
    	var realValue
    	var obatAll = this.props.products.filter(i => i.product_category.is_tindakan || i.product_category.is_obat || i.product_category.is_racikan || i.product_category.is_makanan)
    	if (name == 'product_jasa') {
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

                            if (new_obat['description'] != undefined) {
            				    r.message.product['description'] = new_obat['description']
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
    	} else if (name == 'description') {
    	    new_obat[name] = value
    	    this.setState({new_obat: new_obat})
    	} else {
    		new_obat[name] = value
    		this.setState({new_obat: new_obat})
    	}
    }
    
    deleteJasaObat(i){
    	var pemeriksaan = Object.assign({}, this.state.pemeriksaan)
    	pemeriksaan.jasa_dan_obat.splice(i, 1)
    	this.setState({pemeriksaan: pemeriksaan})
    }
    
    deleteTindakLanjut(i){
    	var pemeriksaan = Object.assign({}, this.state.pemeriksaan)
    	pemeriksaan.tindak_lanjut.splice(i, 1)
    	this.setState({pemeriksaan: pemeriksaan})
    }
    
    pressEnter(e) {
    	var new_obat = this.state.new_obat
    	var onSelectObat = this.state.onSelectobat
    	
        if (e.key === 'Enter' || e.key == 'Tab') {
        	e.preventDefault();
            if ((new_obat.description && new_obat.description != '') || (new_obat.name && new_obat.name != '' && new_obat.quantity != '0' && new_obat.quantity)) {
                console.log(new_obat)
            	var pemeriksaan = Object.assign({}, this.state.pemeriksaan)
        		pemeriksaan.jasa_dan_obat.push(new_obat)

            	this.setState({pemeriksaan: pemeriksaan, new_obat:{}})

            	var qty = document.getElementById("quantity")
            	var selectProduct = document.getElementById("product_jasa")
                var desc = document.getElementById("description")
            	desc.value = ''
            	qty.value = qty.defaultValue
            	selectProduct.value = ''
            }

            // if(e.target.name == 'description' && new_obat.description && new_obat.description != ''){
            //     var pemeriksaan = Object.assign({}, this.state.pemeriksaan)
        	//     pemeriksaan.jasa_dan_obat.push({description: new_obat.description})
            // 	this.setState({pemeriksaan: pemeriksaan, new_obat:{}})
            	
            // 	var desc = document.getElementById("description")
            // 	desc.value = ''
            	
        	// } else if (new_obat.name && new_obat.name != '' && new_obat.quantity != '0' && new_obat.quantity) {
            // 	var pemeriksaan = Object.assign({}, this.state.pemeriksaan)
        	// 	pemeriksaan.jasa_dan_obat.push(new_obat)
            // 	this.setState({pemeriksaan: pemeriksaan, new_obat:{}})
            // 	var qty = document.getElementById("quantity")
            // 	var selectProduct = document.getElementById("product_jasa")
            //     var desc = document.getElementById("description")
            // 	desc.value = ''
            // 	qty.value = qty.defaultValue
            // 	selectProduct.value = ''
            // }
        }
    }
	
	addTindakLanjut(e){
        var target = e.target
        var name = target.name
        var value = target.value
        var tl = this
        var pemeriksaan = Object.assign({}, this.state.pemeriksaan)
        var selected = false
        var realValue
        if (value != undefined || value != '') {
            this.props.products.forEach(function(item, index) {
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
            				pemeriksaan.tindak_lanjut.push(r.message.product)
            				tl.setState({'pemeriksaan': pemeriksaan})
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
	
	addCheck(data){
        var pemeriksaan = Object.assign({}, this.state.pemeriksaan)
        pemeriksaan.checks.push(data)
        this.setState({pemeriksaan: pemeriksaan})
    }
    
    deleteCheck(i){
        var pemeriksaan = Object.assign({}, this.state.pemeriksaan)
        pemeriksaan.checks[i].delete = true
        this.setState({pemeriksaan: pemeriksaan})
    }
    
    addAttachment(data){
        var vr = this
        var new_data = Object.assign({}, this.state.pemeriksaan)
        var name = data.attachment.name;
        var reader = new FileReader();
        reader.onload = function(e) {
            data.filename = name,
            data.dataurl = reader.result
            data.attachment =  URL.createObjectURL(data.attachment)
            new_data.attachments.push(data)
            vr.setState({pemeriksaan: new_data})
        }
        reader.readAsDataURL(data.attachment);
    }
    
    deleteAttachment(i){
        var new_data = Object.assign({}, this.state.pemeriksaan)
        if(new_data.attachments[i].name != undefined){
            new_data.attachments[i].deleted = true
        }
        else {
            new_data.attachments.splice(i, 1)
        }
        this.setState({pemeriksaan: new_data})
    }
    
    addMarker(marker){
        var new_data = Object.assign({}, this.state.pemeriksaan)
        new_data.marker = marker
        this.setState({pemeriksaan: new_data})
    }
    
    resetMarker(){
        var new_data = Object.assign({}, this.state.pemeriksaan)
        delete new_data.marker
        this.setState({pemeriksaan: new_data})
    }
    
    formSubmit(e){
    	e.preventDefault()
    	var data = {}
    	data.waktu = this.state.waktu
    	data.rekam_medis = this.state.pemeriksaan
    	this.state.pemeriksaan.checks.forEach((c, index) => {
            if(!c.delete){
                data.rekam_medis[c.name] = c.value
            }
        })
        
        delete data.rekam_medis.checks
    	this.props.addTindakan(data);
    }
	
	render() {
		var pt = this
		var maxwidth = {maxWidth: '35%', paddingTop: '300px'}
		var cursor = {cursor: 'pointer'}
		var tabPanelStyle = {height: '380px', overflow: 'auto'}
		var select_style = {color: '#056EAD', border: '1px solid #056EAD'}
		var button_style = {background: '#056EAD', color: '#FFF'}
		var label_color = {color: '#056EAD'}
		var products = this.props.products
		var mode = this.state.mode
		var list_products, newSelect
		var list_options = []
		var jasa_rows = []
		var tindak_lanjut_rows = []
		
		if (this.state.loaded) {
			if (this.state.waktu) {
				maxwidth = {maxWidth: '40%', paddingTop: '100px'}
				
				if (mode == 'jasa'){
		            list_products = products.filter(i => (i.product_category.is_tindakan || i.product_category.is_obat || i.product_category.is_makanan) && !i.product_category.is_racikan)
		        } else if (mode == 'tindak_lanjut'){
		            list_products = products.filter(i => i.product_category.is_operasi)
		        }
		        
		        if (list_products != undefined && list_products.length != 0) {
		            list_products.forEach((item, index) => {
			            list_options.push(<option value={item.product_name} key={index.toString()} />)
			        })
		        }
		        
		        if (mode == 'jasa') {
		            newSelect = (
	                    <div>
	                        <div className="row mx-0 mb-3">
                                <div className="col-12 px-0">
                                    <input id="description" name='description' className="form-control fs14 text-center" style={select_style} placeholder="Masukkan Deskripsi Tindakan" onChange={e => this.handleInputChangeObat(e)} onKeyDown={e => this.pressEnter(e)}/>
                                </div>
        					</div>
	                    	<div className="row mx-0 mb-3">
	                            <div className="col-11 pr-2 pl-0">
	                                <input id="product_jasa" name='product_jasa' className="form-control fs14" style={select_style} onChange={e => this.handleInputChangeObat(e)} onBlur={(e) => this.handleInputBlur(e, list_products)} list="jasa_list" placeholder="Pilih Untuk Menambahkan" autoComplete="off"/>
			                        <datalist id="jasa_list">
			                            {list_options}
			                        </datalist>
	                            </div>
	                            <div className="col-1 my-auto px-1">
									<input id="quantity" name='quantity' className="form-control fs14 text-center" style={select_style} placeholder="0" onChange={e => this.handleInputChangeObat(e)} onKeyDown={e => this.pressEnter(e)}/>
								</div>
	    					</div>
	                    </div>
	        		)
		        } else if (mode == 'tindak_lanjut') {
		            newSelect = (
	                    <div>
	                        <input id="product_tindak_lanjut" name='product_tindak_lanjut' className="form-control fs14" style={select_style} onChange={e => this.addTindakLanjut(e)} onBlur={(e) => this.handleInputBlur(e, list_products)} list="tindak_lanjut_list" placeholder="Pilih Untuk Menambahkan" autoComplete="off"/>
	                        <datalist  id="tindak_lanjut_list">
	                            {list_options}
	                        </datalist>
	                    </div>
	        		)
		        }
		        
		        this.state.pemeriksaan.jasa_dan_obat.forEach(function(item, index) {
		        	jasa_rows.push(<PopupTindakanRow item={item} key={index.toString()} deleteTindakan={() => pt.deleteJasaObat(index.toString())}/>)
		        })
		        
		        this.state.pemeriksaan.tindak_lanjut.forEach(function(item, index) {
		        	tindak_lanjut_rows.push(<PopupTindakanTindakLanjutRow item={item} key={index.toString()} deleteTindakan={() => pt.deleteTindakLanjut(index.toString())}/>)
		        })
				
				return <div className="menu-popup">
	                    <div className="container" style={maxwidth}>
	                        <form className="bg-white p-4" onSubmit={e => this.formSubmit(e)}>
		        				<ul className="nav nav-tabs justify-content-around" id="tindakanTab" role="tablist">
		        				    <li className="nav-item">
		                				<a className="nav-link py-1 active" id="pemeriksaan-tab" data-toggle="tab" href="#pemeriksaan" role="tab"><span>Pemeriksaan</span></a>
		                			</li>
		                			<li className="nav-item">
		                				<a className="nav-link py-1" id="jasa-tab" data-toggle="tab" href="#jasa" role="tab" onClick={e => this.changeMode(e, 'jasa')} ><span>Jasa/Obat</span></a>
		                			</li>
		                			<li className="nav-item">
		                				<a className="nav-link py-1" id="tindak-lanjut-tab" data-toggle="tab" href="#tindak_lanjut" role="tab" onClick={e => this.changeMode(e, 'tindak_lanjut')} ><span>Tindak Lanjut</span></a>
		                			</li>
		                		</ul>
		    					<div className="tab-content" id="dokterTabContent" style={tabPanelStyle}>
		    					    <div className="tab-pane pt-4 pb-2 show active" id="pemeriksaan" role="tabpanel">
		    					        <Pemeriksaan data={this.state.pemeriksaan} changeTindakanDokter={this.changeTindakanDokter} handleInputBlur={this.handleInputBlur} addCheck={this.addCheck} deleteCheck={this.deleteCheck} deleteAttachment={this.deleteAttachment} addAttachment={this.addAttachment} addMarker={this.addMarker} resetMarker={this.resetMarker}/>
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
		    					<div className="row mt-3">
		    						<div className="col-auto ml-auto">
		    							<button type="submit" className="btn fs12 fw600" style={button_style}><i className="fa fa-plus mr-2"/>Tambah Tindakan</button>
		    						</div>
		    					</div>
	                        </form>
	                    </div>
	                    <div className="menu-popup-close" onClick={this.props.togglePopupTindakan}></div>
	                </div>
			} else {
				return <div className="menu-popup">
	                    <div className="container" style={maxwidth}>
	                        <div className="bg-white p-5">
	                            <div className="row mx-0">
			        	    	    <div className="col-3 text-center">
			        	    	        <div style={cursor} onClick={e => this.selectWaktu(e, 'pagi')}>
    			        	    	        <img className="mt-auto mx-auto" src={"/static/img/main/menu/pagi_nolabel_active.png"}/>
    			        	    	        <p className="fs22 fw600 mb-0" style={label_color}>Pagi</p>
			        	    	        </div>
			        	    	    </div>
			        	    	    <div className="col-3 text-center">
    			        	    	    <div style={cursor} onClick={e => this.selectWaktu(e, 'siang')}>
    			        	    	        <img className="mt-auto mx-auto" src={"/static/img/main/menu/siang_nolabel_active.png"}/>
    			        	    	        <p className="fs22 fw600 mb-0" style={label_color}>Siang</p>
    			        	    	    </div>
			        	    	    </div>
			        	    	    <div className="col-3 text-center">
			        	    	        <div style={cursor} onClick={e => this.selectWaktu(e, 'sore')}>
    			        	    	        <img className="mt-auto mx-auto" src={"/static/img/main/menu/sore_nolabel_active.png"}/>
    			        	    	        <p className="fs22 fw600 mb-0" style={label_color}>Sore</p>
    			        	    	    </div>
			        	    	    </div>
			        	    	    <div className="col-3 text-center">
    			        	    	    <div style={cursor} onClick={e => this.selectWaktu(e, 'malam')}>
    			        	    	        <img className="mt-auto mx-auto" src={"/static/img/main/menu/malam_nolabel_active.png"}/>
    			        	    	        <p className="fs22 fw600 mb-0" style={label_color}>Malam</p>
    			        	    	    </div>
			        	    	    </div>
			        	    	</div>
	                        </div>
	                    </div>
	                    <div className="menu-popup-close" onClick={this.props.togglePopupTindakan}></div>
	                </div>
			}
		} else {
			return <div className="menu-popup">
	                    <div className="container" style={maxwidth}>
	                        <div className="bg-white p-4 text-center">
	                            <p className="mb-0 fs24md fs16 fw600 text-muted">
	                                <span><i className="fa fa-spin fa-circle-o-notch mr-3"></i>Loading...</span>
	                            </p>
	                        </div>
	                    </div>
	                    <div className="menu-popup-close" onClick={this.props.togglePopupTindakan}></div>
	                </div>
		}
	}
}

class PopupTindakanRow extends React.Component {
	render() {
		var panel_style = {background: '#84D1FF', padding: '10px 20px', color: '#056EAD'}
		var tipe_style = {background: '#056EAD', color: '#FFF', borderRadius: '3px', padding: '2px 7px', display: 'block', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis'}
		var item = this.props.item
		var cursor = {cursor: 'pointer'}
		var tipe_tindakan
		var total = Math.ceil(parseFloat(item.quantity)) * item.price
		
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
		
		var total_display = <div className="col-3 px-0"/>
		var amount_row = <div className="col-6 px-0"/>
        var desc_row
		if(item.uom_name != undefined && item.quantity != undefined && item.price != undefined){
		    var quantity_display = <span className="fs14">{item.quantity + ' ' + item.uom_name}</span>
    		if(item.original_quantity != undefined || parseFloat(item.quantity) % 1 != 0 ){
    		    var rounded = Math.ceil(parseFloat(item.quantity))
    			quantity_display = <span className="fs14">{item.quantity + ' ' + item.uom_name} @ {(item.original_quantity||rounded) + ' ' + item.uom_name}</span>
    		}
		    
		    total_display = <div className="col-3 px-0">
	        	    	<span className="mr-1 fs14">{formatter.format(total)}</span>
	        	    </div>
	        amount_row = <div className="col-6 px-0">
    	        	        	<div className="row">
    	        	        		<div className="col-auto">
    	        	        			{quantity_display}
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
				    <div className="col-12 pl-0">
    				    <div className="row mb-2">
    	        	        {tipe}
    	        	        <div className={nameclass}>
    	        	            <span className="fs14">{item.product_name||item.description}</span>
    	        	        </div>
    	        	        <div className="col-1 text-right px-0">
    			        	    <i className="fa fa-2x fa-trash" onClick={this.props.deleteTindakan} style={cursor}/>
    			        	</div>
    	        	    </div>
    	        	</div>
                    {desc_row}
    	        	<div className="col-12">
    	        	    <div className="row d-flex">
    	        	        {amount_row}
    	        	        {total_display}
    	        	    </div>
    	        	</div>
		        </div>
			</div>
	}
}

class PopupTindakanTindakLanjutRow extends React.Component {
	render() {
		var panel_style = {background: '#84D1FF', padding: '10px 20px', color: '#056EAD'}
		var item = this.props.item
		var cursor = {cursor: 'pointer'}
		
		return <div className="row mx-0 mb-3 fs12 fw600 grooming_products rounded" style={panel_style}>
				    <div className="col-10">
        	        	<div className="row mx-0">
        	        		<div className="col-12">
        	        			<span className="ml-3 fs14">{item.product_name}</span>
        	        		</div>
	        	        	<div className="col-12">
    	        	            <span className="ml-3 fs14">Tindak Lanjut</span>
    	        	        </div>
        	        	</div>
    	        	</div>
    	        	<div className="col-2 d-flex">
		        	    <i className="fa fa-2x fa-trash m-auto" onClick={this.props.deleteTindakan} style={cursor}/>
        	        </div>
		        </div>
	}
}

class RawatInapMainForm extends React.Component {
    constructor(props) {
		super(props)
		this.state = {
			'template_tindakan': [],
			'loaded': true
		}
	}
	
	componentDidMount() {
		var th = this
		frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vettemplatetindakan.vettemplatetindakan.check_template_tindakan",
            args: {register_number: this.props.data.register_number},
            callback: function(r){
                if (r.message) {
                    th.setState({'template_tindakan': r.message, 'loaded': true});
                }
            }
        });
	}
	
	sourceClick(tipe){
        if (tipe == 'pasien') {
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
	
    render() {
        var bgstyle2 = {background: '#FFFFFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)'}
        var data = this.props.data
        var kandang
        var kandang_options = []
        var cursor = {cursor: 'pointer'}
        var link_pasien = <img src="/static/img/main/menu/tautan.png" className="mx-2" onClick={() => this.sourceClick('pasien')} style={cursor}/>
        var link_dokter = <img src="/static/img/main/menu/tautan.png" className="mx-2" onClick={() => this.dokterClick()} style={cursor}/>
        
        if (this.state.loaded) {
            if (this.state.template_tindakan.length == 0) {
                this.props.kandang.forEach(function(item, index) {
                    kandang_options.push(<option value={item.cage_name} key={index.toString()}/>)
                })
                
                kandang = <div className="col-2">
                                <div className="form-group">
                					<label htmlFor="kandang" className="fs10 fw600">Kandang</label>
                					<input name='cage' className="form-control fs14" onChange={this.props.handleInputChange} onBlur={this.props.handleInputBlur} list="kandang_list"/>
                                    <datalist id="kandang_list">
                                        {kandang_options}
                                    </datalist>
                				</div>
                            </div>
            } else {
                kandang = <div className="col-2">
                                <label htmlFor="kandang" className="fs10 fw600">Kandang</label>
                    			<p>{data.cage_name || ''}</p>
                            </div>
            }
            
            return <div>
            			<p className="fs18 fw600 text-dark mb-2">Data Pasien</p>
            			<div style={bgstyle2} className="p-4 mb-4">
        	        		<div className="row mx-0">
        	        			<div className="col-3">
        	        			    <div className="form-group">
                    					<label htmlFor="reception" className="fs10 fw600">No Pendaftaran</label>
                    					<p>{data.register_number || ''}</p>
                    				</div>
        	        			</div>
        	        			<div className="col-3">
        	        				<div className="form-group">
                    					<label htmlFor="reception" className="fs10 fw600">Nama Pasien</label>
                    					<p>{data.pet_name || ''}{link_pasien}</p>
                    				</div>
        	        			</div>
        	        			<div className="col-2">
        	        			    <div className="form-group">
                    					<label htmlFor="reception" className="fs10 fw600">Tanggal</label>
                    					<p>{moment(data.creation).format("DD-MM-YYYY HH:mm:ss") || ''}</p>
                    				</div>
        	        			</div>
        	        			<div className="col-2">
        	        				<div className="form-group">
                    					<label htmlFor="reception" className="fs10 fw600">Layanan</label>
                    					<p>{data.service || ''}{link_dokter}</p>
                    				</div>
        	        			</div>
        	        			{kandang}
        	        		</div>
        	        	</div>
            		</div>
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

class Pemeriksaan extends React.Component {
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
                {'label': 'Suhu', 'name': 'temperature'},
                {'label': 'Berat', 'name': 'weight'},
                {'label': 'Lainnya', 'name': 'other_pemeriksaan'},
                {'label': 'Lainnya', 'name': 'other_diagnosa'},
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
        var boxShadow_style = {background: '#fff', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', height: 'calc(100% - 50px)', overflowY: 'auto', maxHeight: '553px'}
        var inputStyle = {color: '#056EAD', border: '1px solid #056EAD', height:'35px'}
        var suhu, berat, kondisi_awal
        var enable_edit = false
        var panel_style = {background: '#D2EEFF', padding: '10px 20px', color: '#056EAD', borderRadius: '5px'}
        var fontColor = {color: '#6D7573'}
        var fontColor2 = {color: '#056EAD'}
        var cursor = {cursor: 'pointer'}
        
        if (data.status != 'Done') {
            enable_edit = true
            var available_check_anamnese = []
            var available_check_pemeriksaan = []
            var available_check_diagnosa = []
            var anamnese_options = ['vaccine_history', 'food_history', 'bcs', 'vomit', 'auscl', 'ausch', 'temperature', 'weight', 'other']
		    var pemeriksaan_options = ['pulse', 'respiration', 'abdominal_palpasi_pain','abdominal_palpasi_tension','limfonodule','mukosa','mata','hidung','mulut','telinga','kulit','ekstermitas','reflex','other_pemeriksaan']
		    var diagnosa_options = ['diagnosa_utama','prognosa','diagnosa_banding','action','other_diagnosa']
			var check_name = data.checks.filter(c => c.delete == undefined).map(c => c.name)
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
    		
            var option_kondisi = []
            kondisiOptions.forEach(function(item, index) {
                option_kondisi.push(
    				<option value={item.value} key={index.toString()} />
    				)
            })
            
            suhu = (
                <div className="col-3 pr-0">
    		        <label htmlFor="temperature" className="fw600" style={fontColor}>Suhu (C)</label>
    		        <input id="temperature" name="temperature" className="form-control border-0" placeholder="0"  onChange={this.props.changeTindakanDokter} value={data.temperature || ''} required style={fontColor} />
    		    </div>
            )
            berat = (
                <div className="col-3">
    		        <label htmlFor="weight" className="fw600" style={fontColor}>Berat (kg)</label>
    		        <input id="weight" name="weight" className="form-control border-0" placeholder="0"  onChange={this.props.changeTindakanDokter} value={data.weight || ''} required style={fontColor} />
    		    </div>
            )
            
            kondisi_awal = (
                <div className="col-6">
        		    <label htmlFor="condition" className="fw600" style={fontColor}>Kondisi Awal</label>
        			<div>
                        <input required name='condition' list="list_kondisi" id="condition" className="form-control border-0" onChange={this.props.changeTindakanDokter} placeholder="Pilih" autoComplete="off" style={fontColor} onBlur={e => this.handleInputBlurRekamMedis(e, kondisiOptions)}/>
        				<datalist id="list_kondisi">
        					{option_kondisi}
        				</datalist>
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
    	    
        } else if (data.status == 'Done') {
            suhu = (
                <div className="col-4 text-center">
        		    <label htmlFor="temperature" className="fwbold" style={fontColor2}>Suhu</label>
        		    <p style={fontColor2} className="mb-0 fw600">{data.temperature}</p>
        		</div>
            )
            berat = (
                <div className="col-4 text-center">
        		    <label htmlFor="weight" className="fwbold" style={fontColor2}>Berat</label>
        		    <p style={fontColor2} className="mb-0 fw600">{data.weight}</p>
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
        data.checks.forEach((c, index) => {
            if(c.delete == undefined){
                checks_list.push(<PemeriksaanList check={c} key={index.toString()} status={data.status} deleteCheck={() => this.props.deleteCheck(index.toString())}/>)
            }
        })
        
        var toggle_button_icon, layout_class
        if(this.props.rekam_medis_wide){
            toggle_button_icon = "/static/img/main/menu/shrink.png"
            layout_class = "col-6"
        }
        else{
            toggle_button_icon = "/static/img/main/menu/expand.png"
            layout_class = "col-12"
        }
        
        return (
            <div className="px-4 pb-4 pt-2 mb-3">
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
        )
    }
}

class PemeriksaanList extends React.Component {
    render() {
        var panel_style = {background: '#D2EEFF', padding: '10px 20px', color: '#056EAD', borderRadius: '5px'}
        var check = this.props.check
        var status = this.props.status
        var cursor = {cursor: 'pointer'}
        var deleteButton
        
        if (status != 'Done') {
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
        	    {deleteButton}
        	</div>
        </div>
    }
}

class ListExpandable extends React.Component {
    render() {
        var rekam_medis_rows = []
        var panel_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '5px 32px 40px 22px'}
        var col_style = {width: '25px'}
        if (this.props.data.length != 0){
            var pol = this
            this.props.data.forEach(function(item, index){
                rekam_medis_rows.push(
                    <ListRowExpandable key={index.toString()} data={item} expandRow={() => pol.props.expandRow(index.toString())}/>
                )
            })
            
            var collapse_link
            var thr_expand = this.props.data.find(d => d.expand)
            if (thr_expand){
                collapse_link = <a href="#" onClick={this.props.expandAll}>Collapse All</a>
            }
            
            return(
            	<div>
            		<p className="fs18 fw600 text-dark mb-2">Tindakan</p>
	                <div style={panel_style}>
	                    <div className="text-right py-3">
	                        {collapse_link}
	                    </div>
	        		    {rekam_medis_rows}
	        	    </div>
        	    </div>
            )
        }
        else {
            panel_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 22px'}
            return(
            	<div>
            		<p className="fs18 fw600 text-dark mb-2">Tindakan</p>
	                <div style={panel_style}>
	                    <div className="row justify-content-center" key='0'>
	                        <div className="col-10 col-md-8 text-center py-4">
	                            <p className="mb-0 fs24md fs16 fw600 text-muted">
	                                <span>Belum ada tindakan</span>
	                            </p>
	                        </div>
	                    </div>
	                </div>
	            </div>
            )
        }
    }
}

class ListRowExpandable extends React.Component {
    clickRow() {
        var pathname = "/main/rekam-medis/rekam-medis/detail?n="+this.props.data.name
        window.location = pathname
    }
    
    render() {
        var data = this.props.data
        var number_style = {width: '25px'}
        
        var row_detail = []
        var chevron = <i className="fa fa-chevron-down"/>
        if(data.expand){
            data.forEach(function(item, index) {
                row_detail.push(<ListRowExpandableDetail data={item} key={index.toString()} />)
            })
            
            chevron = <i className="fa fa-chevron-up"/>
        }
        var moment_date = moment(data[0].rekam_medis.record_date)
        
        return(
            <div className="row mx-0">
                <div className="col-auto px-0">
                    <div className="side-marker"/>
                </div>
        		<div className="col">
        			<div className="row mx-0 fw600 row-list row-list-expandable w-25" onClick={this.props.expandRow}>
        				<div className="col-auto d-flex">
        					<span className="my-auto">{moment_date.format('DD-MM-YYYY')}</span>
        				</div>
        				<div className="col-auto ml-auto">
        					{chevron}
        				</div>
        			</div>
        			{row_detail}
        		</div>
        	</div>
        )
    }
}

class ListRowExpandableDetail extends React.Component {
    render() {
        var data = this.props.data
        var panel_style = {background: '#D2EEFF', boxShadow: '0px 6px 6px rgba(0, 0, 0, 0.1)', borderRadius: '5px', color: '#056EAD'}
        var panel_style2 = {background: '#FFFFFF', borderRadius: '5px', color: '#056EAD'}
        var icon_style = {width: '38px'}
        
        var jasa_obat_list = []
        var rekam_medis_list = []
        
        var rekam_medis_display
        
        checks.forEach((c, index) => {
            if (![null, undefined, '-', '', 0].includes(data.rekam_medis[c.name])){
                rekam_medis_list.push(
            	    <div className="col-3 mb-3" key={c.name}>
            			<div className="fw600">
            				{c.label}
            			</div>
            			<div>
            				{data.rekam_medis[c.name]}
            			</div>
            	    </div>
            	)
            }
        })
        
        if (rekam_medis_list.length > 0){
            rekam_medis_display = (
                <div className="row mx-4 pt-3 my-2" style={panel_style2}>
                    {rekam_medis_list}
                </div>
            )
        }
        
        if(data.rekam_medis.jasa == undefined){
            return (
                <div className="row justify-content-center">
                    <div className="col-10 col-md-8 text-center border rounded-lg py-4">
                        <p className="mb-0 fs24md fs16 fw600 text-muted">
                            <span><i className="fa fa-spin fa-circle-o-notch mr-3"></i>Loading....</span>
                        </p>
                    </div>
                </div>
            )
        } else {
            data.rekam_medis.jasa.forEach((item, index) => {
            	jasa_obat_list.push(
            	    <div className="col-6" key={item.name}>
                		<div className="row mx-0 py-1">
                			<div className="col-3 fw600">
                				Jasa
                			</div>
                			<div className="col-7">
                				{item.product.product_name}
                			</div>
                			<div className="col-2">
                				{item.quantity} {item.product.product_uom_name}
                			</div>
                		</div>
                	</div>
            	)
            })
            
            data.rekam_medis.obat.forEach((item, index) => {
            	var type
            	if(item.product.product_category.is_makanan){
            		type = 'Makanan'
            	}
            	else if(item.product.product_category.is_obat || item.product.product_category.is_racikan){
            		type = 'Obat'
            	}
            	
            	var note
            	if(![undefined,null,''].includes(item.note)){
            		note = (
            			<div className="col-9 offset-3 mt-1">
            				<div className="row mx-0 bg-white fs12 py-2">
            					<div className="col-auto px-2 fw600">
            						Catatan :
            					</div>
            					<div className="col px-0">
            						{item.note}
            					</div>
            				</div>
            			</div>
            		)
            	}
            	
            	jasa_obat_list.push(
            	    <div className="col-6" key={item.name}>
                	    <div className="row mx-0 py-1">
                			<div className="col-3 fw600">
                				{type}
                			</div>
                			<div className="col-7">
                				{item.product.product_name}
                			</div>
                			<div className="col-2">
                				{item.quantity} {item.product.product_uom_name}
                			</div>
                			{note}
                		</div>
            	    </div>
            	)
            })
            
            // var offset = new Date().getTimezoneOffset();
            var date = new Date(data.rekam_medis.record_date)
            // date.setHours(date.getHours() + (-offset/60));
            var moment_date = moment(date)
            var time_icon
            if(['Pagi','Siang','Sore','Malam'].includes(data.time)){
            	time_icon = <img src={"/static/img/main/menu/"+data.time.toLowerCase()+"_nolabel_active.png"} className="mx-2" style={icon_style}/>
            }
    
            return (
                <div style={panel_style} className="p-2 pr-4">
                    <div className="row fw600">
                    	<div className="col d-flex">
                    		{time_icon}
                    		<span className="my-auto">{data.time}</span>
                    	</div>
                    	<div className="col d-flex text-center">
                    		<span className="m-auto">{data.rekam_medis.nama_dokter}</span>
                    	</div>
                    	<div className="col d-flex text-right">
                    		<span className="my-auto ml-auto">{moment_date.format('HH:mm')}</span>
                    	</div>
                    </div>
                    {rekam_medis_display}
                    <div className="row mx-0 py-3">
                    	{jasa_obat_list}
                    </div>
            	</div>
            )
        }
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

class TemplateTindakan extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'loaded': false,
            'new_tindakan': {},
            'data': {'tindakan': []}
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
            method:"vet_website.vet_website.doctype.vettemplatetindakan.vettemplatetindakan.get_template_tindakan",
            args: {register_number: this.props.register_number},
            callback: function(r){
                if (r.message) {
                    console.log(r.message)
                    td.setState({'data': r.message, 'loaded': true});
                }
            }
        });
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
	                        if (new_tindakan['quantity'] != undefined) {
            				    r.message.product['quantity'] = new_tindakan['quantity']
            				}

                            if (new_tindakan['description'] != undefined) {
            				    r.message.product['description'] = new_tindakan['description']
            				}
            				
	                        aa.setState({new_tindakan: r.message.product})
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
    	        new_tindakan[name] = value
    	        new_tindakan['original_quantity'] = new_value
    	    } else {
    	        new_tindakan[name] = value
    	    }
    	    
    	    this.setState({new_tindakan: new_tindakan})
    	} else if (name == 'description') {
    	    new_tindakan[name] = value
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
    	
    	if (name == 'tindakan_template') {
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
            if((new_tindakan.description && new_tindakan.description != '') || (new_tindakan.name && new_tindakan.name != '' && new_tindakan.quantity != '0' && new_tindakan.quantity)){
        	    console.log(new_tindakan)
            	new_data.tindakan.push(new_tindakan)
            	this.setState({data: new_data, new_tindakan:{}})
            	
            	var qty = document.getElementById("quantity")
            	var selectProduct = document.getElementById("tindakan_template")
                var desc = document.getElementById("description")
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
            	
        	// } else if (new_tindakan.name && new_tindakan.name != '' && new_tindakan.quantity != '0' && new_tindakan.quantity) {
            //     console.log(new_tindakan)
            // 	new_data.tindakan.push(new_tindakan)
            // 	this.setState({data: new_data, new_tindakan:{}})
            	
            // 	var qty = document.getElementById("quantity")
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
    	
    	if(new_data.tindakan[index].tindakan_name != undefined){
    	    new_data.tindakan[index].delete = true
    	}
    	else{
    	    new_data.tindakan.splice(index, 1)
    	}
    	this.setState({data: new_data})
    }
    
    selectWaktu(e, index, waktu) {
        e.preventDefault()
        if (this.props.status != 'Done') {
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
        var th = this
        var new_data = this.state.data
        e.preventDefault()
        var list_tindakan = []
        
        new_data.tindakan.forEach(function(item, index) {
        	var tindakan = {}
        	tindakan['product'] = item.name
        	tindakan['quantity'] = item.quantity
        	tindakan['pagi'] = item.pagi
        	tindakan['siang'] = item.siang
        	tindakan['sore'] = item.sore
        	tindakan['malam'] = item.malam
        	tindakan['tindakan_name'] = item.tindakan_name
        	tindakan['delete'] = item.delete
        	tindakan['description'] = item.description
        	
        	list_tindakan.push(tindakan)
        })
        
        new_data.tindakan = list_tindakan
        
        if (new_data.tindakan.length != 0) {
            if (new_data.name) {
                frappe.call({
                    type: "post",
                    method:"vet_website.vet_website.doctype.vettemplatetindakan.vettemplatetindakan.edit_template_tindakan",
                    args: {data: new_data},
                    callback: function(r){
                        if (r.message) {
                            th.props.toggleTemplateTindakan()
                        }
                    }
                });
            } else {
                new_data.cage = this.props.kandang.find(i => i.cage_name == this.props.cage).name
                frappe.call({
                    type: "post",
                    method:"vet_website.vet_website.doctype.vettemplatetindakan.vettemplatetindakan.save_template_tindakan",
                    args: {data: new_data},
                    callback: function(r){
                        if (r.message) {
                            window.location.reload()
                            // th.props.toggleTemplateTindakan()
                        }
                    }
                });
            }
        } else {
            frappe.msgprint('Template Tindakan tidak boleh kosong')
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
        var tindakanDesc, tindakanSelect, rowButton
        
        list_product.forEach((item, index) => {
            tindakan_options.push(<option value={item.product_name} key={index.toString()} />)
        })
        
        this.state.data.tindakan.forEach(function(item, index) {
            if(!item.delete){
                tindakan_rows.push(<TemplateTindakanRow key={index.toString()} item={item} selectWaktu={th.selectWaktu} index={index.toString()} deleteTindakan={e => th.deleteTindakan(e, index.toString())} status={th.props.status}/>)
            }
        })
        
        if (this.props.status != 'Done') {
            tindakanSelect = <div className="row mx-0 mb-3">
                                <div className="col-11 pr-2 pl-0">
                                    <input id="tindakan_template" name='tindakan_template' className="form-control fs14" style={select_style} placeholder="Tindakan / Produk" list="tindakan_list" onChange={this.handleInputChangeTemplate} onBlur={this.handleInputBlurTemplate} />
                                        <datalist id="tindakan_list">
                                            {tindakan_options}
                                        </datalist>
                                </div>
                                <div className="col-1 px-0">
                                    <input id="quantity" name='quantity' className="form-control fs14 text-center" style={select_style} placeholder="0" onChange={this.handleInputChangeTemplate} onKeyDown={this.pressEnterTemplate}/>
                                </div>
        					</div>
        	tindakanDesc = <div className="row mx-0 mb-3">
                                <div className="col-12 px-0">
                                    <input id="description" name='description' className="form-control fs14 text-center" style={select_style} placeholder="Masukkan Deskripsi Tindakan" onChange={this.handleInputChangeTemplate} onKeyDown={this.pressEnterTemplate}/>
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
        }
        
        if (this.state.loaded) {
            return (
                <div className="menu-popup">
                    <div className="container" style={maxwidth}>
                        <div className="bg-white p-4">
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
		var total = Math.ceil(parseFloat(item.quantity)) * item.price
		
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
		
		if (this.props.status != 'Done') {
		    deleteButtonTemplate = <div className="col-1 pr-1 text-right px-0">
            			        	    <i className="fa fa-2x fa-trash" onClick={this.props.deleteTindakan} style={cursor}/>
            			        	</div>
		}
		
		var total_display = <div className="col-3 px-0"/>
		var amount_row = <div className="col-6 px-0"/>
        var desc_row
		if(item.uom_name != undefined && item.quantity_template != undefined && item.price != undefined){
		    var quantity_display = <span className="fs14">{item.quantity + ' ' + item.uom_name}</span>
    		if(item.original_quantity != undefined || parseFloat(item.quantity) % 1 != 0 ){
    		    var rounded = Math.ceil(parseFloat(item.quantity))
    			quantity_display = <span className="fs14">{item.quantity + ' ' + item.uom_name} @ {(item.original_quantity||rounded) + ' ' + item.uom_name}</span>
    		}
		    
		    total_display = <div className="col-3 px-0">
	        	    	<span className="mr-1 fs14">{formatter.format(total)}</span>
	        	    </div>
	        amount_row = <div className="col-6 px-0">
    	        	        	<div className="row">
    	        	        		<div className="col-auto">
    	        	        			{quantity_display}
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
    	        	        {total_display}
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

ReactDOM.render(<RawatInap/>,document.getElementById("rawat_inap"));