// var list = document.getElementsByTagName("title")[0].innerHTML.split('/')
var id = getUrlParameter('n')
// var tzOffset = new Date().getTimezoneOffset()
var tzOffset = 0

class Apotik extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'loaded': false,
            'data': {},
            'new_product': {},
            'apotik_obat_wide': false,
            'edit_mode': false,
            'currentUser': {},
        }
        
        this.handleInputChange = this.handleInputChange.bind(this)
        this.handleInputChangeProduct = this.handleInputChangeProduct.bind(this)
        this.deleteProduct = this.deleteProduct.bind(this)
        this.deleteProductRacikan = this.deleteProductRacikan.bind(this)
        this.pressEnter = this.pressEnter.bind(this)
        this.toggleSelect = this.toggleSelect.bind(this)
        this.handleInputBlur = this.handleInputBlur.bind(this)
        this.addToRacikan = this.addToRacikan.bind(this)
        this.toggleWide = this.toggleWide.bind(this)
        this.navigationAction = this.navigationAction.bind(this)
    }
    
    componentDidMount() {
        var lastfilter = JSON.parse(sessionStorage.getItem('/main/farmasi/apotik'))
        var gr = this
        console.log(id)
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
        if (id != undefined){
        	frappe.call({
	            type: "GET",
	            method:"vet_website.vet_website.doctype.vetapotik.vetapotik.get_name_list",
	            args: {filters: lastfilter},
	            callback: function(r){
	                if (r.message) {
	                    gr.setState({'namelist': r.message});
	                }
	            }
	        })
	        this.getFormData()
        } else {
        	frappe.call({
	            type: "GET",
	            method:"vet_website.vet_website.doctype.vetapotik.vetapotik.get_apotik_new",
	            args: {},
	            callback: function(r){
	                if (r.message) {
	                    console.log(r.message);
	                    gr.setState({'data': r.message, 'loaded': true,});
	                }
	            }
	        });
	        
	        frappe.call({
	            type: "GET",
	            method:"vet_website.vet_website.doctype.vetapotik.vetapotik.get_products_all",
	            args: {},
	            callback: function(r){
	                if (r.message) {
	                    console.log(r.message);
	                    var tempData = gr.state.data
	                    tempData['obatAll'] = r.message
	                    gr.setState({'data': tempData});
	                }
	            }
	        });
	        
	        frappe.call({
	            type: "GET",
	            method:"vet_website.vet_website.doctype.vetapotik.vetapotik.get_warehouse_all",
	            args: {},
	            callback: function(r){
	                if (r.message) {
	                    console.log(r.message);
	                    var tempData = gr.state.data
	                    tempData['warehouseAll'] = r.message
	                    gr.setState({'data': tempData});
	                }
	            }
	        });
        }
    }
    
    getFormData(){
    	var gr = this
    	frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetapotik.vetapotik.get_apotik",
            args: {name: id},
            callback: function(r){
                if (r.message) {
                    console.log(r.message);
                    gr.setState({'data': r.message, 'loaded': true, 'edit_mode': false});
                }
            }
        });
        
        frappe.call({
	            type: "GET",
	            method:"vet_website.vet_website.doctype.vetapotik.vetapotik.get_products_all",
	            args: {},
	            callback: function(r){
	                if (r.message) {
	                    console.log(r.message);
	                    var tempData = gr.state.data
	                    tempData['obatAll'] = r.message
	                    gr.setState({'data': tempData});
	                }
	            }
	        });
	        
	        frappe.call({
	            type: "GET",
	            method:"vet_website.vet_website.doctype.vetapotik.vetapotik.get_warehouse_all",
	            args: {},
	            callback: function(r){
	                if (r.message) {
	                    console.log(r.message);
	                    var tempData = gr.state.data
	                    tempData['warehouseAll'] = r.message
	                    gr.setState({'data': tempData});
	                }
	            }
	        });
    }
    
    handleInputChange(e) {
    	const value = e.target.value
    	const name = e.target.name
    	var new_data = this.state.data
    	new_data.apotik[name] = value
    	console.log(new_data)
    	this.setState({data: new_data})
    }
    
    navigationAction(name){
        window.location.href="/main/farmasi/apotik/edit?n="+name
    }
    
    deleteProduct(e, index) {
    	var new_data = this.state.data
    	var onSelect = this.state.onSelect
    	
    	if (new_data.apotik.products[index]['apotik_product_name']) {
    		new_data.apotik.products[index].is_delete = true
    	} else {
    		new_data.apotik.products.splice(index, 1)
    	}
    	
    	if (onSelect == index) {
    		this.setState({data: new_data, onSelect: 'false'})
    	} else {
    		this.setState({data: new_data})
    	}
    }
    
    deleteProductRacikan(e, indexParent, indexChild) {
    	var new_data = this.state.data
    	
    	if (new_data.apotik.products[indexParent]['apotik_product_name']) {
    		new_data.apotik.products[indexParent].product_racikan[indexChild].is_delete = true
    	} else {
    		new_data.apotik.products[indexParent].product_racikan.splice(indexChild, 1)
    	}
    	
    	this.setState({data: new_data})
    }
    
    handleInputChangeProduct(e) {
    	const value = e.target.value
    	const name = e.target.name
    	var new_product = this.state.new_product
    	var aa = this
    	var selected = false
    	var realValue
    	
    	if (name == 'product') {
	    	this.state.data.obatAll.forEach(function(item, index) {
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
	                    	if (new_product['quantity'] != undefined) {
            				    r.message.product['quantity'] = new_product['quantity']
            				}
            				
	                        aa.setState({new_product: r.message.product})
	                    }
	                }
	            });
	    	}
    	} else if(name == 'quantity') {
    		if ((value % 1) != 0) {
    	        var new_value = value
    	        if (new_value.includes(',')) {
    	            new_value = new_value.replace(',', '.')
    	        }
    	        
    	        new_value = Math.ceil(parseFloat(new_value))
    	        new_product[name] = value
    	        new_product['original_quantity'] = new_value
    	    } else {
    	        new_product[name] = value
    	    }
    	    
    	    this.setState({new_product: new_product})
    	} else {
    		new_product[name] = value
    		this.setState({new_product: new_product})
    	}
    }
    
    pressEnter(e) {
    	var name = e.target.name
    	var new_product = this.state.new_product
    	var onSelect = this.state.onSelect
    	
        if (e.key === 'Enter' || (e.key == 'Tab' && name == 'note')) {
        	e.preventDefault();
            if (new_product.name && new_product.name != '' && new_product.quantity != '0' && new_product.quantity) {
            	var new_data = this.state.data
            	if (new_product.quantity.includes(',')) {
            	    new_product.quantity = new_product.quantity.replace(/,/g, '.') 
            	}
            	if (onSelect != 'false' && onSelect != undefined) {
            		new_data.apotik.products[onSelect].product_racikan.push(new_product)
            	} else {
            		new_data.apotik.products.push(new_product)
            	}
            	this.setState({data: new_data, new_product:{}})
            	var qty = document.getElementById("quantity")
            	var selectProduct = document.getElementById("product")
            	var note = document.getElementById("note")
            	qty.value = qty.defaultValue
            	selectProduct.value = ''
            	note.value = ''
            	
            	document.getElementById("product").focus();
            } else {
            	if (name == 'quantity') {
            		document.getElementById("note").focus();
	            } else if (name == 'note') {
	            	document.getElementById("product").focus();
	            }
            }
        }
    }
    
    formSubmit(e, saveOnly=false){
        e.preventDefault();
        var apotik_data = {}
        var products = []
        var apotik = this.state.data.apotik
        var gr = this
        
        if (apotik.products.length == 0) {
        	frappe.msgprint('Anda Belum Memilih Obat');
        } else {
        	apotik.products.forEach(function(item, index) {
	        	var product = {}
	        	product['product'] = item.name
	        	product['quantity'] = item.quantity
	        	product['note'] = item.note
	        	product['is_delete'] = item.is_delete
	        	product['apotik_product_name'] = item.apotik_product_name
	        	product['product_racikan'] = []
	        	
	        	item.product_racikan.forEach(function(item, index) {
	        		var product_racikan = {}
	        		product_racikan['product'] = item.name
	        		product_racikan['quantity'] = item.quantity
	        		product_racikan['note'] = item.note
	        		product_racikan['is_delete'] = item.is_delete
	        		product_racikan['apotik_product_name'] = item.apotik_product_name
	        		product['product_racikan'].push(product_racikan)
	        	})
	        	
	        	products.push(product)
	        })
	        
	        apotik_data['name'] = id
	        apotik_data['description'] = apotik.description
	        apotik_data['resep'] = apotik.resep
	        apotik_data['products'] = products
	        
	        var selected_warehouse = this.state.data.warehouseAll.find(i => i.gudang_name == apotik.warehouse)
	        if(selected_warehouse){
                apotik_data['warehouse'] = selected_warehouse.name
            }
            
            if (id == undefined){
            	var selected_pet = this.state.data.petList.find(i => i.pet_name == apotik.pet)
		        if(selected_pet){
	                apotik_data['pet'] = selected_pet.name
	                apotik_data['pet_name'] = selected_pet.pet_name
	                apotik_data['owner_name'] = selected_pet.pet_owner.owner_name
	            }
            }
	        
	        if (id != undefined){
	        	var args = {data: apotik_data}
	        	saveOnly?args.saveOnly = true:false
	        	console.log(args)
	        	frappe.call({
		            type: "GET",
		            method:"vet_website.vet_website.doctype.vetapotik.vetapotik.submit_apotik",
		            args: args,
		            callback: function(r){
		                if (r.message.apotik) {
		                	if(saveOnly){
                            	gr.getFormData()
	                        } else {
	                            // window.location.href = "/main/farmasi/apotik"
	                            window.location.reload()
	                        }
		                    
		                } else if(r.message.error) {
		                	frappe.msgprint(r.message.error)
		                }
		            }
		        });
	        } else {
	        	frappe.call({
		            type: "POST",
		            method:"vet_website.vet_website.doctype.vetapotik.vetapotik.new_apotik",
		            args: {data: apotik_data},
		            callback: function(r){
		                if (r.message.apotik) {
		                    console.log(r.message);
		                    if (r.message.apotik.name) {
		                        window.location.href = "/main/farmasi/apotik/edit?n=" + r.message.apotik.name
		                    } else {
		                    	// window.location.href = "/main/farmasi/apotik"
		                    	window.location.reload()
		                    }
		                } else if(r.message.error) {
		                	frappe.msgprint(r.message.error)
		                }
		            }
		        });
	        }
        }
    }
    
    cancelApotik(){
    	var th = this
    	frappe.call({
    		type: "POST",
    		method: "vet_website.vet_website.doctype.vetapotik.vetapotik.cancel_apotik",
    		args: {name: th.state.data.apotik.name},
    		callback: function(r){
    			if (r.message.success) {
    				window.location.reload()
    			}
    		}
    	})
    }
    
    toggleSelect(e, i) {
    	e.preventDefault();
    	var ts = this
    	var onSelect = this.state.onSelect
    	if (onSelect == i) {
    		frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetapotik.vetapotik.get_obat_all",
                args: {racikan: 'false'},
                callback: function(r){
                    if (r.message) {
                    	var new_data = ts.state.data
                    	new_data.obatAll = r.message.obatAll
                    	
                        ts.setState({onSelect: 'false', data: new_data})
                    }
                }
            });
    	} else {
    		frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetapotik.vetapotik.get_obat_all",
                args: {racikan: 'true'},
                callback: function(r){
                    if (r.message) {
                    	var new_data = ts.state.data
                    	new_data.obatAll = r.message.obatAll
                    	
                        ts.setState({onSelect: i, data: new_data})
                    }
                }
            });
    	}
    }
    
    toggleEditMode() {
        this.setState({'edit_mode': !this.state.edit_mode})
    }
    
    handleInputBlur(e) {
    	const value = e.target.value
    	var selected = false
    	
    	if (e.target.name == 'warehouse') {
    	    selected = this.state.data.warehouseAll.find(i => i.gudang_name == value)
    	} else if (e.target.name == 'pet') {
    	    selected = this.state.data.petList.find(i => i.pet_name == value)
    	}
    	else{
    		this.state.data.obatAll.forEach(function(item, index) {
	    		if (item.product_name == value) {
	    			selected = true
	    		}
	    	})
    	}
    	
    	if (!selected) {
    		e.target.value = ''
    		
    		if(e.target.name == 'warehouse'||e.target.name == 'pet'){
    			var new_data = this.state.data
    			new_data.apotik[e.target.name] = ''
    	    	this.setState({data: new_data})
    		} else if(e.target.name == 'pet'){
    			var new_data = this.state.data
    			new_data.apotik[e.target.name] = ''
    			new_data.apotik.pet_owner = ''
    	    	this.setState({data: new_data})
    		}
    	} else if(selected && e.target.name == 'pet'){
    		var new_data = this.state.data
			new_data.apotik.pet_owner = selected.pet_owner.owner_name
	    	this.setState({data: new_data})
    	}
    }
    
    addToRacikan(productIndex, racikanIndex){
    	var new_data = Object.assign({}, this.state.data)
    	var product = new_data.apotik.products[productIndex]
    	new_data.apotik.products[racikanIndex].product_racikan.push(product)
    	new_data.apotik.products.splice(productIndex,1)
    	this.setState({data: new_data})
    }
    
    toggleWide(e) {
    	e.preventDefault()
    	this.setState({'apotik_obat_wide': !this.state.apotik_obat_wide})
    }
    
    customerInvoiceClick(){
    	var apotik = this.state.data.apotik
        if(apotik.customer_invoice && apotik.customer_invoice.length > 1){
        	if(apotik.register_number){
        		window.location.href = '/main/kasir/customer-invoices?register_number='+encodeURIComponent(apotik.register_number)
        	} else {
        		window.location.href = '/main/kasir/customer-invoices?petAll='+encodeURIComponent(apotik.pet)
        	}
        } else if(apotik.customer_invoice && apotik.customer_invoice.length == 1) {
            window.location.href = '/main/kasir/customer-invoices/edit?n='+encodeURIComponent(apotik.customer_invoice[0])
        }
    }
    
    render() {
        var bgstyle = {background: '#FFFFFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', padding: '2px 32px', marginBottom: '15px'}
        var lh14 = {lineHeight: '14px'}
        var rowMinHeight = {minHeight: '64px'}
        var color = {color: '#056EAD', cursor: 'pointer'}
        var cursor = {cursor: 'pointer'}
        var apotik = this.state.data.apotik
        var reception = this.state.data.reception
        var obatAll = this.state.data.obatAll
        var warehouseAll = this.state.data.warehouseAll
        var headerButton
        var backButton = <span key="999" className="fs16 fw600 mr-auto my-auto" style={color} onClick={() => window.location.href='/main/farmasi/apotik'}><i className="fa fa-chevron-left mr-1" style={color}></i>Back</span>
        var statusRow
        var write = checkPermission('VetApotik', this.state.currentUser, 'write')
        var lanjut = checkPermission('VetApotik', this.state.currentUser, 'lanjut')
        var batalkan = checkPermission('VetApotik', this.state.currentUser, 'batalkan')
        
        if (this.state.loaded) {
        	console.log(this.state)
        	
        	if (apotik.status == undefined){
        		headerButton = <div className="row mx-0 flex-row-reverse" style={rowMinHeight}>
			            			<div className="col-auto my-auto">
			            				<button type="submit" className="btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2" style={lh14}>Tambah</button>
			            			</div>
			            			{backButton}
			            		</div>
        	}else if (apotik.status == 'Draft') {
        		var edit_button
        		var cancel_button = <div className="col-auto my-auto">
			            				<button type="button" className="btn btn-sm fs12 btn-outline-danger text-uppercase h-100 fwbold py-2" onClick={() => this.cancelApotik()}>Batalkan</button>
			            			</div>
			    var lanjut_button = <div className="col-auto my-auto">
			            				<button type="submit" className="btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2" style={lh14}>Lanjut</button>
			            			</div>
        		
        		this.state.edit_mode?
                edit_button = (
                    <div className="col-auto d-flex my-auto" key="save_button">
        				<button type="button" onClick={(e) => this.formSubmit(e, true)} className="d-block btn btn-sm btn-danger fs12 text-uppercase fwbold py-2 px-4">Save</button>
        			</div>
                ):
                edit_button = (
                    <div className="col-auto d-flex my-auto" key="edit_button">
        				<button type="button" onClick={() => this.toggleEditMode()} className="d-block btn btn-sm btn-danger fs12 text-uppercase fwbold py-2 px-4">Edit</button>
        			</div>
                )
        		
        		headerButton = <div className="row mx-0 flex-row-reverse" style={rowMinHeight}>
			            			{batalkan?cancel_button:false}
			            			{lanjut?lanjut_button:false}
			            			{write?edit_button:false}
			            			{backButton}
			            		</div>
        	} else {
        		var customer_invoice = (
        			<div className="col-auto mr-auto" style={cursor} onClick={() => this.customerInvoiceClick()}>
		                <div className="row mx-0">
		                    <div className="col-auto px-3">
		                        <img className="d-block mx-auto mt-2 header-icon" src="/static/img/main/menu/cashier.png"/>
		                        <p className="mb-0 fs12 text-muted text-center">Customer Invoice</p>
		                    </div>
		                </div>
		            </div>
        		)
        		
        		headerButton = <div className="row mx-0 flex-row-reverse" style={rowMinHeight}>
        							{apotik.status=='Done'?customer_invoice:false}
        							{backButton}
			            		</div>
        	}
        	
        	if(apotik.status == 'Cancel'){
        		statusRow = <StatusRow statuses={['Cancel']} current_status={apotik.status}/>
        	} else if (['Draft', 'Done'].includes(apotik.status)) {
        		statusRow = <StatusRow statuses={['Draft', 'Done']} current_status={apotik.status}/>
        	}
        	
        	if (!this.state.apotik_obat_wide) {
        		return <form onSubmit={e => this.formSubmit(e)}>
			            	<div style={bgstyle}>
			            		{headerButton}
			            	</div>
			            	<div className="row justify-content-end">
	    	            	    <div className="col-auto">
	    	            	    	{statusRow}
	    	            	    </div>
	    	            	    <div className="col-auto">
	    	            	    	<RecordNavigation currentname={this.state.data.apotik.name} namelist={this.state.namelist} navigationAction={this.navigationAction}/>
	    	            	    </div>
	    	            	</div>
			                <ApotikMainForm edit_mode={this.state.edit_mode} apotik={apotik} reception={reception} handleInputChange={this.handleInputChange} warehouseAll={warehouseAll} petList={this.state.data.petList} handleInputBlur={this.handleInputBlur}/>
			            	<ApotikObat edit_mode={this.state.edit_mode} apotik={apotik} obatAll={obatAll} deleteProduct={this.deleteProduct} handleInputChangeProduct={this.handleInputChangeProduct} pressEnter={this.pressEnter} new_product={this.state.new_product} toggleSelect={this.toggleSelect} onSelect={this.state.onSelect} deleteProductRacikan={this.deleteProductRacikan} handleInputBlur={this.handleInputBlur} addToRacikan={this.addToRacikan} apotik_obat_wide={this.state.apotik_obat_wide} toggleWide={this.toggleWide}/>
			            	{id!=undefined?<ApotikVersion version={this.state.data.version} />:false}
			            </form>
        	} else {
        		return <form onSubmit={e => this.formSubmit(e)}>
		            	<div style={bgstyle}>
		            		{headerButton}
		            	</div>
		            	<div className="row justify-content-end">
    	            	    <div className="col-auto">
    	            	    	{statusRow}
    	            	    </div>
    	            	    <div className="col-auto">
    	            	    	<RecordNavigation currentname={this.state.data.apotik.name} namelist={this.state.namelist} navigationAction={this.navigationAction}/>
    	            	    </div>
    	            	</div>
		            	<ApotikObat edit_mode={this.state.edit_mode} apotik={apotik} obatAll={obatAll} deleteProduct={this.deleteProduct} handleInputChangeProduct={this.handleInputChangeProduct} pressEnter={this.pressEnter} new_product={this.state.new_product} toggleSelect={this.toggleSelect} onSelect={this.state.onSelect} deleteProductRacikan={this.deleteProductRacikan} handleInputBlur={this.handleInputBlur} addToRacikan={this.addToRacikan} apotik_obat_wide={this.state.apotik_obat_wide} toggleWide={this.toggleWide}/>
		            	{id!=undefined?<ApotikVersion version={this.state.data.version || []} />:false}
		            </form>
        	}
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

class ApotikMainForm extends React.Component {
	sourceClick(tipe){
        if (tipe == 'penerimaan') {
            window.location.href = '/main/penerimaan/penerimaan-pasien/detail?n=' + this.props.reception.name
        } else if (tipe == 'pemilik') {
            window.location.href = '/main/penerimaan/data-pemilik/edit?n=' + this.props.reception.pet_owner.name
        } else if (tipe == 'pasien') {
            window.location.href = '/main/penerimaan/data-pasien/edit?n=' + this.props.reception.pet.name
        }
    }
    
    dokterClick(){
    	if(this.props.apotik.tindakan_dokter && this.props.apotik.tindakan_dokter.length > 1){
            window.location.href = "/main/dokter-dan-jasa/tindakan-dokter?register_number="+encodeURIComponent(this.props.reception.register_number)
        } else if(this.props.apotik.tindakan_dokter && this.props.apotik.tindakan_dokter.length == 1){
            window.location.href = "/main/dokter-dan-jasa/tindakan-dokter/edit?n="+encodeURIComponent(this.props.apotik.tindakan_dokter[0])
        }
    }
    
    render() {
        var bgstyle2 = {background: '#FFFFFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)'}
        var apotik = this.props.apotik
        var reception = this.props.reception
        var inputCatatan, inputWarehouse, inputReception, inputRegisterNumber, inputDate, inputPet, inputPetOwner
        var cursor = {cursor: 'pointer'}
        var link_pemilik = <img src="/static/img/main/menu/tautan.png" className="mx-2" onClick={() => this.sourceClick('pemilik')} style={cursor}/>
        var link_pasien = <img src="/static/img/main/menu/tautan.png" className="mx-2" onClick={() => this.sourceClick('pasien')} style={cursor}/>
        var link_penerimaan = <img src="/static/img/main/menu/tautan.png" className="mx-2" onClick={() => this.sourceClick('penerimaan')} style={cursor}/>
        var link_dokter = <img src="/static/img/main/menu/tautan.png" className="mx-2" onClick={() => this.dokterClick()} style={cursor}/>
        
        var warehouse_options = []
        this.props.warehouseAll.forEach((item, index) => warehouse_options.push(<option value={item.gudang_name} key={index.toString()} />))
        
        if ((apotik.status == 'Draft' && this.props.edit_mode) || id == undefined) {
        	inputCatatan = <textarea id="description" name='description' className="form-control border-0 lightbg" value={ apotik.description||'' } rows="3" placeholder="Masukan bila ada" onChange={this.props.handleInputChange}></textarea>
        	inputWarehouse = (
        		<div>
        			<input required name='warehouse' list="warehouses" id="warehouse" className="form-control border-0 lightbg" onChange={this.props.handleInputChange} onBlur={e => this.props.handleInputBlur(e, this.props.warehouseAll)} value={this.props.apotik.warehouse||''}/>
					<datalist id="warehouses">
						{warehouse_options}
					</datalist>
        		</div>
        	)
        } else {
        	inputCatatan = <span className="fs16 px-2" id="description">{apotik.description}</span>
        	inputWarehouse = <div><span className="fs16 px-2" id="warehouse">{apotik.warehouse_name||apotik.warehouse}</span></div>
        }
        
        var inputDokter = <span className="fs16 px-2" id="owner">{apotik.dokter}{link_dokter}</span>
        
        if (id != undefined){
        	inputReception = <span className="fs16 px-2" id="reception">{(reception.queue?reception.queue:'')+" / "+(reception.name?reception.name:'')}{reception.name?link_penerimaan:false}</span>
	        inputPet = <span className="fs16 px-2" id="name_pet">{reception.pet.pet_name}{link_pasien}</span>
	        inputDate = <span className="fs16 px-2" name='reception_date'>{reception.reception_date?moment(reception.reception_date).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss"):moment(apotik.creation).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss")}</span>
	        inputRegisterNumber = <span className="fs16 px-2" id="register_number">{apotik.register_number}</span>
	        inputPetOwner = <span className="fs16 px-2" id="owner_name">{reception.pet_owner.owner_name}{link_pemilik}</span>
	        // inputWarehouse = <div><span className="fs16 px-2" id="warehouse">{apotik.warehouse_name||apotik.warehouse}</span></div>
        } else {
        	var pet_options = []
        	this.props.petList.forEach((item, index) => pet_options.push(<option value={item.pet_name} key={index.toString()} />))
        	
        	inputPet = (
        		<div>
        			<input required name='pet' list="pets" id="pet" className="form-control border-0 lightbg" onChange={this.props.handleInputChange} onBlur={e => this.props.handleInputBlur(e, this.props.petList)} value={this.props.apotik.pet||''}/>
					<datalist id="pets">
						{pet_options}
					</datalist>
        		</div>
        	)
        	inputPetOwner = <span className="fs16 px-2" id="owner_name">{apotik.pet_owner||''}</span>
        	inputDate = <span className="fs16 px-2" name='reception_date'>{moment().subtract(tzOffset, 'minute').format("YYYY-MM-DD")}</span>
        }
        
        return <div>
        			<p className="fs18 fw600 text-dark mb-2">Data Pasien</p>
        			<div style={bgstyle2} className="p-4 mb-4">
		        		<div className="form-row">
	            	        <div className="col-9">
	            	            <div className="form-row">
	            	                <div className="col-3">
	                	                <div className="form-group">
	                    					<label htmlFor="no_antrian" className=" fw600">No Antrian / No Penerimaan</label>
	                    					<div className="row mx-0">
	                    						{inputReception}
	                    					</div>
	                    				</div>
	            	                </div>
	            	                <div className="col-3">
	            	                    <div className="form-group">
	                    					<label htmlFor="nama_pasien" className=" fw600">Nama Pasien</label>
	                    					<div className="row mx-0">
	                    						{inputPet}
	                    					</div>
	                    				</div>
	            	                </div>
	            	                <div className="col-3">
	                	                <div className="form-group">
	                    					<label htmlFor="tanggal_pendaftaran" className=" fw600">Tanggal Pendaftaran</label>
	                    					<div className="row mx-0">
	                    						{inputDate}
	                    					</div>
	                    				</div>
	            	                </div>
	            	                <div className="col-3">
	                	                <div className="form-group">
	                    					<label htmlFor="warehouse" className=" fw600">Warehouse</label>
	                    					{inputWarehouse}
	                    				</div>
	            	                </div>
	            	            </div>
	            	            <div className="form-row">
	            	                <div className="col-3">
	                	                <div className="form-group">
	                    					<label htmlFor="no_registrasi_penerimaan" className=" fw600">No Pendaftaran</label>
	                    					<div className="row mx-0">
	                    						{inputRegisterNumber}
	                    					</div>
	                    				</div>
	            	                </div>
	            	                <div className="col-3">
	                	                <div className="form-group">
	                    					<label htmlFor="nama_pemilik" className=" fw600">Nama Pemilik</label>
	                    					<div className="row mx-0">
	                    						{inputPetOwner}
	                    					</div>
	                    				</div>
	            	                </div>
	            	                <div className="col-3">
	            	                    <div className="form-group">
	                    					<label htmlFor="owner" className=" fw600">Nama Dokter</label>
	                    					<div className="row mx-0">
	                    						{inputDokter}
	                    					</div>
	                    				</div>
	            	                </div>
	            	            </div>
	            	        </div>
	            	        <div className="col-3">
	            	            <div className="form-group">
	            					<label htmlFor="description" className="fw600">Catatan</label>
	            					<div className="row mx-0">
	            						{inputCatatan}
	            					</div>
	            				</div>
	            	        </div>
	            		</div>
		        	</div>
        		</div>
    }
}

class ApotikObat extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			'expand': false
		}
	}
	
	toggleExpand(e) {
		e.preventDefault()
		this.setState({'expand': !this.state.expand})
	}
	
    render() {
    	var boxShadow_style = {background: '#fff', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)'}
    	var apotik = this.props.apotik
    	var obatAll = this.props.obatAll
    	var onSelect = this.props.onSelect
    	var apotik_obat_wide = this.props.apotik_obat_wide
    	var selectStyle, quantityStyle, button, expand
    	var apotikProductList = []
    	var ao = this
    	var cursor = {cursor: 'pointer'}
    	
    	if (onSelect != 'false' && onSelect != undefined) {
    		selectStyle = {color: '#2BA400', border: '1px solid #2BA400'}
    		quantityStyle = {color: '#2BA400', border: '1px solid #2BA400', height:'35px'}
    	} else {
    		selectStyle = {color: '#056EAD', border: '1px solid #056EAD'}
    		quantityStyle = {color: '#056EAD', border: '1px solid #056EAD', height:'35px'}
    	}
    	
    	apotik.products.forEach(function(item, index) {
    		if (!item.is_delete) {
    			apotikProductList.push(
	    			<ApotikObatList edit_mode={ao.props.edit_mode} product={item} key={index.toString()} apotik={apotik} deleteProduct={(e) => ao.props.deleteProduct(e, index)} onSelect={ao.props.onSelect} toggleSelect={(e) => ao.props.toggleSelect(e, index)} index={index.toString()} deleteProductRacikan={ao.props.deleteProductRacikan} addToRacikan={() => ao.props.addToRacikan(index.toString(), ao.props.onSelect)} expand={ao.state.expand}/>
	    		)
    		}
    	})
    	
    	if ((apotik.status == 'Draft' && this.props.edit_mode) || id == undefined) {
    		var option_product = []
    		obatAll.forEach(function(item, index) {
    			option_product.push(
    				<option value={item.product_name} key={index.toString()}>{item.name}</option>
    				)
    		})
    		
    		var newProductSelect = <div className="row">
    									<div className="col-6 pr-1">
    										<input name='product' list="products" id="product" className="form-control fs14 fw600" style={selectStyle} onChange={this.props.handleInputChangeProduct} placeholder="Pilih Untuk Menambahkan" onBlur={this.props.handleInputBlur} />
    											<datalist id="products">
    												{option_product}
    											</datalist>
    									</div>
    									<div className="col-1 my-auto px-1">
    										<input style={quantityStyle} type="text" className="form-control input-sm text-center fs14 fw600" name="quantity" id="quantity" placeholder="0" onChange={ao.props.handleInputChangeProduct} onKeyDown={ao.props.pressEnter}/>
    									</div>
    									<div className="col-5 my-auto px-1">
    										<input style={quantityStyle} type="text" className="form-control input-sm fs14 fw600" name="note" id="note" placeholder="Catatan" onChange={ao.props.handleInputChangeProduct} onKeyDown={ao.props.pressEnter}/>
    									</div>
    								</div>
    		
    	}
    	
    	if (apotik_obat_wide) {
    		boxShadow_style = {background: '#fff', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', height: '700px'}
    		button = <span style={cursor} onClick={this.props.toggleWide}><img src="/static/img/main/menu/shrink.png"/></span>
    	} else {
    		button = <span style={cursor} onClick={this.props.toggleWide}><img src="/static/img/main/menu/expand.png"/></span>
    	}
    	
    	if (this.state.expand) {
    		expand = <a href="#" onClick={e => this.toggleExpand(e)}>Collapse All</a>
    	} else {
    		expand = <a href="#" onClick={e => this.toggleExpand(e)}>Expand All</a>
    	}
    	
        return <div>
	            	<p className="mb-2 text-dark fs18 fw600">Obat </p>
	                <div className="p-4 mb-3" style={boxShadow_style}>
	                	<div className="row mb-3">
            	    		<div className="col-auto mr-auto">
            	    			{expand}
	                        </div>
	                        <div className="col-auto ml-auto">
	                            {button}
	                        </div>
            	    	</div>
	                    <div className="mb-3">
	                        {newProductSelect}
	                    </div>
	                    <div>
	                    	{apotikProductList}
	                    </div>
	    			</div>
				</div>
    }
}

class ApotikObatList extends React.Component {
	render() {
		var panel_style = {background: '#84D1FF', padding: '10px 20px', color: '#056EAD'}
		var cursor = {cursor: 'pointer', color: '#787E84'}
		var xStyle = {cursor: 'pointer', color: '#056EAD'}
		var racikanStyle = {cursor: 'pointer', color: '#787E84'}
		var rowStyle = {backgroundColor: '#F5FBFF', marginTop: '-1rem'}
		var product = this.props.product
		var apotik = this.props.apotik
		var index = this.props.index
		var onSelect = this.props.onSelect
		var deleteProductRacikan = this.props.deleteProductRacikan
		var rowButton, racikan, detail, xButton, rotate
		var detail_row = []
		// var totalPrice = product.quantity * product.price
		var totalPrice = Math.ceil(parseFloat(product.quantity)) * product.price
		var ap = this
		
		product.product_racikan.forEach(function(item, index) {
			// totalPrice = totalPrice + (item.price * item.quantity)
			totalPrice = totalPrice + (item.price * Math.ceil(parseFloat(item.quantity)))
		})
		
		if (index == onSelect || this.props.expand) {
			if (index == onSelect) {
				racikanStyle = {cursor: 'pointer', color: '#2BA400'}
			}
			rotate = 'fa-rotate-180'
			
			product.product_racikan.forEach(function(item, index) {
				// var totalProductPrice = item.price * item.quantity
				var totalProductPrice = item.price * Math.ceil(parseFloat(item.quantity))
				
				if ((apotik.status == 'Draft' && ap.props.edit_mode) || id == undefined) {
					xButton = <div className="col-1 pr-0 text-right">
				        	    <i className="fa fa-2x fa-times-circle mr-1" style={xStyle} onClick={(e) => deleteProductRacikan(e, ap.props.index, index)}/>
				        	</div>
				}
				
				var child_quantity_display = <span className="fs14">{item.quantity + ' ' + item.uom_name}</span>
				if(item.original_quantity != undefined || parseFloat(item.quantity) % 1 != 0 ){
					var rounded = Math.ceil(parseFloat(item.quantity))
					child_quantity_display = <span className="fs14">{item.quantity + ' ' + item.uom_name} @ {item.original_quantity||rounded + ' ' + item.uom_name}</span>
				}
				
				if (!item.is_delete) {
					detail_row.push(
						<div className="row mx-0 fs12 mb-1 px-4 py-2" key={index.toString()}>
		        	        <div className="col-7 pl-0">
		        	            <span className="fs14">{item.product_name}</span>
		        	        </div>
		        	        <div className="col-3">
		        	        	<div className="row">
				        	    	<div className="col-auto">
				        	    		{child_quantity_display}
				        	    	</div>
				        	    	<div className="col-auto">
				        	    		<span className="fs14">x</span>
				        	    	</div>
				        	    	<div className="col-auto">
				        	    		<span className="fs14">{formatter.format(item.price)}</span>
				        	    	</div>
				        	    </div>
		        	        </div>
				        	<div className="col-1 text-center">
				        	    <span className="fs14">{formatter.format(totalProductPrice)}</span>
				        	</div>
				        	{xButton}
		                </div>
					)
				}
					
			})
			
			detail = <div style={rowStyle}>
						{detail_row}
					</div>
		}
	
		if (product.product_category.is_racikan) {
			racikan = <i className={"fa fa-2x fa-flask mr-3 " + rotate} style={racikanStyle} onClick={this.props.toggleSelect}/>
		}
		
		var add_to_racikan
		if (!['false',undefined].includes(onSelect) && !product.product_category.is_racikan) {
			add_to_racikan = <i className={"fa fa-2x fa-plus mr-3"} style={racikanStyle} onClick={this.props.addToRacikan} title="Masukkan kedalam racikan"/>
		}
		
		if ((apotik.status == 'Draft' && this.props.edit_mode) || id == undefined) {
			rowButton = <div className="row flex-row-reverse mb-2">
							<i className="fa fa-2x fa-trash mr-1" onClick={this.props.deleteProduct} style={cursor}/>
							{racikan}
							{add_to_racikan}
						</div>
		} else {
			rowButton = <div className="row flex-row-reverse mb-2">
							{racikan}
						</div>
		}
		
		var quantity_display = <span className="fs14">{product.quantity + ' ' + product.uom_name}</span>
		if(product.original_quantity != undefined || parseFloat(product.quantity) % 1 != 0 ){
			var rounded = Math.ceil(parseFloat(product.quantity))
			quantity_display = <span className="fs14">{product.quantity + ' ' + product.uom_name} @ {(product.original_quantity||rounded) + ' ' + product.uom_name}</span>
		}
		
		
		return <div>
					<div className="row mx-0 mb-3 fs12 fw600 grooming_products rounded" style={panel_style}>
	        	        <div className="col-5">
	        	            <span className="fs14">{product.product_name}</span>
	        	        </div>
	        	        <div className="col-2 text-center">
	        	            <span className="fs14">{product.note}</span>
	        	        </div>
	        	        <div className="col-3 ">
	        	        	<div className="row justify-content-end">
	        	        		<div className="col-auto">
	        	        			{quantity_display}
	        	        		</div>
	        	        		<div className="col-auto">
	        	        			<span className="fs14">x</span>
	        	        		</div>
	        	        		<div className="col-auto">
	        	        			<span className="fs14">{formatter.format(product.price)}</span>
	        	        		</div>
	        	        		<div className="col-1"/>
	        	        	</div>
	        	        </div>
	        	        <div className="col-1 text-center">
		        	    	<span className="mr-1 fs14">{formatter.format(totalPrice)}</span>
		        	    </div>
			        	<div className="col-1">
			        	    {rowButton}
			        	</div>
			        </div>
			        {detail}
				</div>
	}
}

class ApotikVersion extends React.Component {
	render() {
		var row_version = []
		var heightStyle = {'height': '50px'}
		
		this.props.version.forEach(function(item, index) {
			if (item.data.changed != undefined && item.data['changed'].length != 0) {
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

ReactDOM.render(<Apotik/>,document.getElementById("apotik"));