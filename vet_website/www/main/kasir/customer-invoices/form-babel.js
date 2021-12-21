var id = getUrlParameter('n')
// var tzOffset = new Date().getTimezoneOffset()
var tzOffset = 0

class CustomerInvoice extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            'data': {'pembayaran': []},
            'loaded': false,
            'show_payment': false,
            'show_refund': false,
            'show_loading_pdf': false,
            'edit_mode': false,
            'currentUser': {}
        }
        this.changeInput = this.changeInput.bind(this)
        this.inputBlur = this.inputBlur.bind(this)
        this.togglePopupPay = this.togglePopupPay.bind(this)
        this.navigationAction = this.navigationAction.bind(this)
        this.deleteRow = this.deleteRow.bind(this)
        this.getFormData = this.getFormData.bind(this)
    }
    
    componentDidMount() {
        var ci = this
        var lastfilter = JSON.parse(sessionStorage.getItem('/main/kasir/customer-invoices'))
        
        frappe.call({
            type: "GET",
            method:"vet_website.methods.get_current_user",
            args: {},
            callback: function(r){
                if (r.message) {
                    ci.setState({'currentUser': r.message});
                }
            }
        });
        
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.get_name_list",
            args: {filters: lastfilter},
            callback: function(r){
                if (r.message) {
                    console.log(r.message);
                    ci.setState({'namelist': r.message});
                }
            }
        });
        
        this.getFormData()
    }
    
    getFormData(){
        var ci = this
        var args = {}
        if (id != undefined) {
            args = {name: id}
        }
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.get_customer_invoice_form",
            args: args,
            callback: function(r){
                if (r.message) {
                    console.log(r.message)
                    var update = {'loaded': true, 'pet_owner_list': r.message.pet_owner_list, 'pet_list': r.message.pet_list, 'task_list': r.message.task_list, 'product_list': r.message.product_list, 'uom_list': r.message.uom_list, 'warehouse_list': r.message.warehouse_list, 'payment_method_list': r.message.payment_method_list, 'edit_mode': false, 'service': r.message.service, 'current_session': r.message.current_session, 'show_paymet': false, 'show_refund': false, 'links': r.message.links||[], 'services': r.message.services||[]}
                    if (r.message.customer_invoice != undefined) {
                        r.message.customer_invoice.invoice_line.forEach(i => {
                            var uom = r.message.uom_list.find(u => u.name == i.product_uom)
                            i.uom_name = uom.uom_name
                            
                            if (r.message.customer_invoice.is_refund) {
                                i.quantity_default = i.quantity
                            }
                        })
                        var invoice_line = {}
                        invoice_line['farmasi'] = r.message.customer_invoice.invoice_line.filter(i => i.service == 'Farmasi')
                        invoice_line['jasa'] = r.message.customer_invoice.invoice_line.filter(i => i.service == 'Jasa' || !i.service)
                        invoice_line['rawat_inap'] = r.message.customer_invoice.invoice_line.filter(i => i.service == 'Rawat Inap')
                        invoice_line['instalasi_medis'] = r.message.customer_invoice.invoice_line.filter(i => i.service == 'Instalasi Medis')
                        
                        r.message.customer_invoice.invoice_line = invoice_line
                        
                        // if((r.message.customer_invoice.status == 'Draft' && !r.message.customer_invoice.is_refund) || r.message.role == 'Master'){
                        if((r.message.customer_invoice.status == 'Draft' && !r.message.customer_invoice.is_refund)){
                            r.message.customer_invoice.invoice_line.farmasi.push({})
                            r.message.customer_invoice.invoice_line.jasa.push({})
                            r.message.customer_invoice.invoice_line.rawat_inap.push({})
                            r.message.customer_invoice.invoice_line.instalasi_medis.push({})
                        }
                        
                        r.message.customer_invoice.children_customer_invoice.forEach(invoice => {
                            invoice.customer_invoice.invoice_line.forEach(i => {
                                var uom = r.message.uom_list.find(u => u.name == i.product_uom)
                                i.uom_name = uom.uom_name
                                
                                if (invoice.customer_invoice.is_refund) {
                                    i.quantity_default = i.quantity
                                }
                            })
                            
                            var invoice_line = {}
                            invoice_line['farmasi'] = invoice.customer_invoice.invoice_line.filter(i => i.service == 'Farmasi')
                            invoice_line['jasa'] = invoice.customer_invoice.invoice_line.filter(i => i.service == 'Jasa' || !i.service)
                            invoice_line['rawat_inap'] = invoice.customer_invoice.invoice_line.filter(i => i.service == 'Rawat Inap')
                            invoice_line['instalasi_medis'] = invoice.customer_invoice.invoice_line.filter(i => i.service == 'Instalasi Medis')
                            
                            invoice.customer_invoice.invoice_line = invoice_line
                            
                            if((invoice.customer_invoice.status == 'Draft' && !invoice.customer_invoice.is_refund)){
                                invoice.customer_invoice.invoice_line.farmasi.push({})
                                invoice.customer_invoice.invoice_line.jasa.push({})
                                invoice.customer_invoice.invoice_line.rawat_inap.push({})
                                invoice.customer_invoice.invoice_line.instalasi_medis.push({})
                            }
                        })
                        
                        update.data = r.message.customer_invoice
                        update.total_credit = r.message.total_credit
                        update.total_remaining = r.message.total_remaining
                        update.version = r.message.version
                        update.role = r.message.role
                    } else {
                        var invoice_line = {
                            'farmasi': [{}],
                            'jasa': [{}],
                            'rawat_inap': [{}],
                            'instalasi_medis': [{}]
                        }
                        update.data = {invoice_line: invoice_line, pembayaran: [], invoice_date: moment().format("YYYY-MM-DD")}
                    }
                    ci.setState(update);
                }
            }
        });
        
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.get_customer_invoice_form_after_loading",
            args: {},
            callback: function(r){
                if (r.message) {
                    console.log(r.message)
                    var update = {'loaded': true, 'pet_owner_list': r.message.pet_owner_list, 'pet_list': r.message.pet_list, 'task_list': r.message.task_list, 'product_list': r.message.product_list, 'warehouse_list': r.message.warehouse_list, 'payment_method_list': r.message.payment_method_list}
                    
                    ci.setState(update);
                }
            }
        });
    }
    
    navigationAction(name){
        window.location.href="/main/kasir/customer-invoices/edit?n="+name
    }
    
    checkProductQuantity(i=false, service=false){
        var th = this
        var new_data = Object.assign({}, this.state.data)
        if(new_data.invoice_line[service][i].warehouse && new_data.invoice_line[service][i].product){
            frappe.call({
                type: 'GET',
                method: 'vet_website.vet_website.doctype.vetproductquantity.vetproductquantity.get_product_quantity',
                args: {warehouse: new_data.invoice_line[service][i].warehouse, product: new_data.invoice_line[service][i].product},
                callback: function(r){
                    new_data.invoice_line[service][i].quantity_in_warehouse = r.message
                    th.setState({data: new_data})
                }
            })
        }
    }
    
    changeInput(e, i=false, service=false){
        console.log(i)
        var ci = this
        var target = e.target
        var name = target.name
        var value = target.value
        var new_data = Object.assign({}, this.state.data)
        var selected = false
        
        if(name == 'register_number'){
            new_data[name] = value
            this.setState({data: new_data})
        }
        else if (name == 'pet') {
	        selected = this.state.pet_list.find(i => i.pet_name == value)
                if(this.state.data.pet_parent){
	            selected = this.state.pet_list.find(i => i.pet_name == value && i.parent == this.state.data.pet_parent)
	        }
	        if(selected){
	            new_data.owner_name = selected.owner_name || value
	            new_data.pet = selected.name || value
                new_data.pet_name = selected.pet_name || value
                this.setState({data: new_data})
	        }
	        else {
	            new_data.pet = value
                new_data.pet_name = value
                this.setState({data: new_data})
	        }
        }
        else if (name == 'owner_name') {
            var split = value.split(':')
    	    selected = this.state.pet_owner_list.find(i => i.name == split[0] && i.owner_name == split[1])
	        if(selected){
	            new_data.owner_name = value
	            new_data.pet_parent = selected.name
	            new_data.pet = undefined
                new_data.pet_name = undefined
	            this.setState({data: new_data})
	        }
	        else {
	            new_data.owner_name = value
	            new_data.pet_parent = undefined
	            new_data.pet = undefined
                new_data.pet_name = undefined
                this.setState({data: new_data})
	        }
        }
        else if (name == 'warehouse') {
            if (Object.keys(new_data.invoice_line[service][i]).length === 0) {
                new_data.invoice_line[service].push({})
            }
	        selected = this.state.warehouse_list.find(i => i.gudang_name == value)
	        if(selected){
	            new_data.invoice_line[service][i].warehouse = selected.name || value
                new_data.invoice_line[service][i].warehouse_name = selected.gudang_name || value
                this.setState({data: new_data})
	        }
	        else {
	            new_data.invoice_line[service][i].warehouse = value
                new_data.invoice_line[service][i].warehouse_name = value
                this.setState({data: new_data})
	        }
	        this.checkProductQuantity(i, service)
        }
        else if (name == 'product') {
	        selected = this.state.product_list.find(i => i.product_name == value || i.default_code == value)
	        if (selected) {
	            frappe.call({
	                type: "GET",
	                method:"vet_website.vet_website.doctype.vetproduct.vetproduct.get_product_details",
	                args: {name: selected.name},
	                callback: function(r){
	                    if (r.message) {
	                        if (Object.keys(new_data.invoice_line[service][i]).filter(n => !['product', 'product_name'].includes(n)).length === 0) {
	                            new_data.invoice_line[service].push({})
	                        }
	                        new_data.invoice_line[service][i].product_name = r.message.product_name
	                        new_data.invoice_line[service][i].uom_name = r.message.uom
	                        new_data.invoice_line[service][i].product = selected.name
	                        new_data.invoice_line[service][i].unit_price = selected.price
	                        if(selected.stockable){
	                            var default_warehouse = ci.state.warehouse_list.find(i => i.is_default == 1)
	                            if(default_warehouse){
	                                new_data.invoice_line[service][i].warehouse = default_warehouse.name
                                    new_data.invoice_line[service][i].warehouse_name = default_warehouse.gudang_name
	                            }
	                        }
	                        if (service == 'rawat_inap') {
	                            new_data.invoice_line[service][i].service = 'Rawat Inap'
	                        } else if (service == 'instalasi_medis') {
	                            new_data.invoice_line[service][i].service = 'Instalasi Medis'
	                        } else {
	                            new_data.invoice_line[service][i].service = service[0].toUpperCase() +  service.slice(1)
	                        }
	                        
	                        if (new_data.invoice_line[service][i].quantity) {
	                            new_data.invoice_line[service][i].total = selected.price * Math.ceil(parseFloat(new_data.invoice_line[service][i].quantity)) - ((new_data.invoice_line[service][i].discount || 0) / 100 * (selected.price * Math.ceil(parseFloat(new_data.invoice_line[service][i].quantity))))
	                        }
	                        ci.setState({data: new_data})
	                        ci.checkProductQuantity(i, service)
	                    }
	                }
	            });
	        } else {
	            new_data.invoice_line[service][i].product_name = value
	            new_data.invoice_line[service][i].product = value
	            delete new_data.invoice_line[service][i].uom_name
	            delete new_data.invoice_line[service][i].product_uom
	            delete new_data.invoice_line[service][i].unit_price
	            delete new_data.invoice_line[service][i].total
	            this.setState({data: new_data})
	            this.checkProductQuantity(i, service)
	        }
        } else if (['quantity'].includes(name)) {
	        if (Object.keys(new_data.invoice_line[service][i]).length === 0) {
                new_data.invoice_line[service].push({})
            }
            new_data.invoice_line[service][i][name] = value
            
            if (new_data.invoice_line[service][i]['product']) {
                frappe.call({
                    type: "GET",
                    method:"vet_website.vet_website.doctype.vetproduct.vetproduct.check_pack",
                    args: {name: new_data.invoice_line[service][i]['product'], quantity: value || 0},
                    callback: function(r){
                        if (r.message.harga_pack) {
                            new_data.invoice_line[service][i].total = r.message.harga_pack - ((new_data.invoice_line[service][i].discount || 0) / 100 * r.message.harga_pack)
                            ci.setState({data: new_data})
                            ci.refresh_subtotal()
                        } else if (r.message == false) {
                            if (new_data.invoice_line[service][i].unit_price) {
                                new_data.invoice_line[service][i].total = new_data.invoice_line[service][i].unit_price * Math.ceil(parseFloat(value)) - ((new_data.invoice_line[service][i].discount || 0) / 100 * (new_data.invoice_line[service][i].unit_price * Math.ceil(parseFloat(value))))
                            }
                	        ci.setState({data: new_data})
                	        ci.refresh_subtotal()
                        }
                        ci.checkProductQuantity(i, service)
                    }
                });
            } else {
    	        this.setState({data: new_data})
    	        this.checkProductQuantity(i, service)
            }
	    } else if (['discount'].includes(name)) {
	        if (Object.keys(new_data.invoice_line[service][i]).length === 0) {
                new_data.invoice_line[service].push({})
            }
            new_data.invoice_line[service][i][name] = value
            if (new_data.invoice_line[service][i].unit_price) {
                var invoice_line = new_data.invoice_line[service][i]
                invoice_line.total = invoice_line.unit_price * invoice_line.quantity - (invoice_line.discount / 100 * (invoice_line.unit_price * invoice_line.quantity))
            }
	        this.setState({data: new_data})
	        this.refresh_subtotal()
	    } else if (name == 'potongan') {
	        new_data[name] = value
	        this.setState({data: new_data})
	    } else if (name == 'unit_price') {
            new_data.invoice_line[service][i][name] = value
            new_data.invoice_line[service][i].total = value * new_data.invoice_line[service][i].quantity
            this.setState({data: new_data})
            this.refresh_subtotal()
	    } else {
            new_data[name] = value
            this.setState({data: new_data})
        }
    }
    
    refresh_subtotal() {
        var new_data = this.state.data
        var invoice_line = new_data.invoice_line.farmasi.concat(new_data.invoice_line.jasa).concat(new_data.invoice_line.rawat_inap).concat(new_data.invoice_line.instalasi_medis)
        new_data.subtotal = 0
        invoice_line.forEach(function(item, index) {
            if (item.unit_price && !item.deleted) {
                new_data.subtotal += item.total
            }
        })
        new_data.total = new_data.subtotal - new_data.potongan || 0
        this.setState({data: new_data})
    }
    
    inputBlur(e, list, i=false, service=false) {
        const value = e.target.value
        const name = e.target.name
        var new_data = Object.assign({}, this.state.data)
    	var selected = false
    	
    	if (name == 'product') {
    	    selected = list.find(i => i.product_name == value || i.default_code == value)
    	}
    	if (name == 'register_number') {
    	    selected = list.find(i => i.name == value)
    	} 
    	if (name == 'pet') {
    	    selected = list.find(i => i.pet_name == value)
    	}
    	if (name == 'warehouse') {
    	    selected = list.find(i => i.gudang_name == value)
    	}
    	if (name == 'owner_name') {
    	    var split = value.split(':')
    	    selected = list.find(i => i.name == split[0] && i.owner_name == split[1])
    	    if(selected){
    	        new_data.owner_name = split[1]
    	        this.setState({data: new_data})
    	    }
    	}
    	if (!selected) {
    		e.target.value = ''
    		if (name == 'register_number') {
        		new_data[name] = ''
    		    this.setState({data: new_data})
    		}
    		else if(name == 'product'){
    		    delete new_data.invoice_line[service][i].product
    		    delete new_data.invoice_line[service][i].product_name
    		    delete new_data.invoice_line[service][i].uom_name
    		    delete new_data.invoice_line[service][i].product_uom
    		    delete new_data.invoice_line[service][i].unit_price
    		    delete new_data.invoice_line[service][i].total
    		    this.setState({data: new_data})
    		}
    		else if(name == 'pet'){
    		    delete new_data.pet
    		    delete new_data.pet_name
    		    delete new_data.owner_name
    		    this.setState({data: new_data})
    		}
    		else if(name == 'owner_name'){
    		    delete new_data.pet
    		    delete new_data.pet_name
    		    delete new_data.owner_name
    		    delete new_data.pet_parent
    		    this.setState({data: new_data})
    		}
    		else if(name == 'warehouse'){
    		    delete new_data.invoice_line[service][i].warehouse
    		    delete new_data.invoice_line[service][i].warehouse_name
    		    this.setState({data: new_data})
    		}
    	}
    }
    
    setParentStatus(status){
        var th = this
        frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.set_parent_invoice_status",
            args: {name: this.state.data.name, status: status},
            callback: function(r){
                if (r.message) {
                    window.location.reload()
                }
            }
        })
    }
    
    formSubmit(e, saveOnly=false){
        e.preventDefault()
        var ci = this
        var method, args
        
        if(this.state.data.children_customer_invoice && this.state.data.children_customer_invoice.length > 0){
            var invoices = []
            this.state.data.children_customer_invoice.forEach((i, index) => {
                var old_data = Object.assign({},i.customer_invoice)
                var invoice_line = old_data.invoice_line.farmasi.concat(old_data.invoice_line.jasa).concat(old_data.invoice_line.rawat_inap).concat(old_data.invoice_line.instalasi_medis)
                invoice_line.forEach(function(item, index) {
                    item.quantity = Math.ceil(item.quantity)
                })
                
                old_data.invoice_line = invoice_line
                old_data.total = old_data.total - old_data.potongan || 0
                
                invoices.push(old_data)
            })
            if(['Draft'].includes(this.state.data.status)){
                var args = {data: invoices}
                saveOnly?args.saveonly = true:false
                
                frappe.call({
                    type: "POST",
                    method:"vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.open_invoice",
                    args: args,
                    callback: function(r){
                        if (r.message.length > 0) {
                            var results = []
                            r.message.forEach(m => {
                                if (m.error){
                                    frappe.msgprint(m.error)
                                    results.push(false)
                                } else if (m.invoice){
                                    results.push(m.invoice.status)
                                }
                            })
                            console.log(results)
                            if(results.every(e => e == 'Done')){
                                ci.setParentStatus('Done')
                            } else if(results.every(e => ['Done', 'Open'].includes(e))) {
                                ci.setParentStatus('Open')
                            } else {
                                ci.getFormData()
                            }
                        } else if (r.message.error){
                            frappe.msgprint(r.message.error)
                        }
                    }
                })
            }
            
        } else {
            var old_data = Object.assign({},this.state.data)
        
            var invoice_line = old_data.invoice_line.farmasi.concat(old_data.invoice_line.jasa).concat(old_data.invoice_line.rawat_inap).concat(old_data.invoice_line.instalasi_medis)
            
            invoice_line.forEach(function(item, index) {
                item.quantity = Math.ceil(item.quantity)
            })
            
            old_data.invoice_line = invoice_line
            old_data.total = old_data.total - old_data.potongan || 0
            
            if(['Draft'].includes(this.state.data.status)){
                console.log(old_data)
                var args = {data: old_data}
                saveOnly?args.saveonly = true:false
                
                frappe.call({
                    type: "POST",
                    method:"vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.open_invoice",
                    args: args,
                    callback: function(r){
                        if (r.message.invoice) {
                            if(saveOnly){
                                if([undefined,false,''].includes(ci.state.data.parent_customer_invoice)){
                                    ci.getFormData()
                                } else {
                                    window.location.href = "/main/kasir/customer-invoices/edit?n="+ci.state.data.parent_customer_invoice
                                }
                            } else {
                                window.location.reload()
                            }
                            // var new_data = Object.assign({}, ci.state.data)
                            // new_data.status = r.message.invoice.status
                            // new_data.subtotal = r.message.invoice.subtotal
                            // new_data.total = r.message.invoice.total
                            
                            // var invoice_line = {}
                            // invoice_line['farmasi'] = new_data.invoice_line.filter(i => i.service == 'Farmasi')
                            // invoice_line['jasa'] = new_data.invoice_line.filter(i => i.service == 'Jasa' || (!i.service && i.product && i.quantity))
                            // invoice_line['rawat_inap'] = new_data.invoice_line.filter(i => i.service == 'Rawat Inap')
                            // invoice_line['instalasi_medis'] = new_data.invoice_line.filter(i => i.service == 'Instalasi Medis')
                            
                            // new_data.invoice_line = invoice_line
                            // ci.setState({data: new_data})
                        } else if (r.message.error){
                            frappe.msgprint(r.message.error)
                        }
                    }
                })
            } else if (id == undefined) {
                old_data['invoice_date'] = moment().format("YYYY-MM-DD HH:mm:ss")
                console.log(old_data)
                
                frappe.call({
                    type: "POST",
                    method:"vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.new_invoice",
                    args: {data: old_data},
                    callback: function(r){
                        if (r.message.name) {
                            window.location.href = "/main/kasir/customer-invoices/edit?n=" + r.message.name
                        }
                    }
                })
            }
        }
    }
    
    togglePopupPay() {
        this.setState({'show_payment': !this.state.show_payment})
    }
    
    toggleEditMode() {
        this.setState({'edit_mode': !this.state.edit_mode})
    }
    
    togglePopupRefund() {
        var new_data = this.state.data
        var invoice_line = new_data.invoice_line.farmasi.concat(new_data.invoice_line.jasa).concat(new_data.invoice_line.rawat_inap).concat(new_data.invoice_line.instalasi_medis)
        if (invoice_line.filter(i => i.quantity).every(i => i.quantity_default >= i.quantity)) {
            this.setState({'show_refund': !this.state.show_refund})
        } else {
            frappe.msgprint('Quantity Melebihi Batas')
        }
    }
    
    goToJournalEntries(){
        window.location.href = '/main/accounting/journal-entries?reference=' + this.state.data.name
    }
    
    refundInvoice(e) {
        e.preventDefault()
        frappe.call({
    		type: "POST",
    		method:"vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.refund_invoice",
    		args: {name: this.state.data.name},
    		callback: function(r){
    			if (r.message.invoice) {
    				window.location.href = "/main/kasir/customer-invoices/edit?n=" + r.message.invoice.name
    			}
    			if (r.message.error) {
    				frappe.msgprint(r.message.error);
    			}
    		}
    	});
    }
    
    cancelAction(e) {
        e.preventDefault()
        var th = this
        var data = this.state.data
        
        if(this.state.data.children_customer_invoice && this.state.data.children_customer_invoice.length > 0){
            var names = this.state.data.children_customer_invoice.map(c => c.customer_invoice.name)
            
            frappe.call({
        		type: "POST",
        		method:"vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.cancel_invoice_multiple",
        		args: {names: names},
        		callback: function(r){
        			if (r.message.length > 0) {
                        var results = []
                        r.message.forEach(m => {
                            if (m.error){
                                frappe.msgprint(m.error)
                                results.push(false)
                            } else if (m.success){
                                results.push(true)
                            }
                        })
                        if(results.every(e => e)){
                            window.location.reload()
                        } else {
                            ci.getFormData()
                        }
                    } else if (r.message.error){
                        frappe.msgprint(r.message.error)
                    }
        		}
        	});
        } else {
            frappe.call({
        		type: "POST",
        		method:"vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.cancel_invoice",
        		args: {name: data.name},
        		callback: function(r){
        			if (r.message) {
        				window.location.reload()
        			}
        			if (r.message.error) {
        				frappe.msgprint(r.message.error);
        			}
        		}
        	});
        }
    }
    
    cancelRefund(e) {
        e.preventDefault()
        var th = this
        var data = this.state.data
        
        frappe.call({
    		type: "POST",
    		method:"vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.cancel_refund",
    		args: {name: data.name},
    		callback: function(r){
    			if (r.message) {
    				window.location.reload()
    			}
    			
    			if (r.message.error) {
    				frappe.msgprint(r.message.error);
    			}
    		}
    	});
    }
    
    printPDF(e, mini=false) {
        this.setState({'show_loading_pdf': true})
        
        var pdfid = 'pdf'
        var format = [559,794]
        
        if(mini){
            pdfid = 'pdfmini'
            format = [302*0.78,605*0.78]
        }
        
        e.stopPropagation()
        var th = this
        // var doc = new jsPDF({
        //     orientation: 'p',
        //     unit: 'pt',
        //     format: format,
        // });
        
        var source = document.getElementById(pdfid)
        var [width, height] = format
        var opt = {
            margin: [10, 0, 10, 0],
            filename: "Invoice-"+this.state.data.name+".pdf",
            // filename: "Invoice-"+this.state.data.name+".odt",
            pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', '.row'] },
            html2canvas: {scale: 3},
            jsPDF: {orientation: 'p', unit: 'pt', format: [width*0.754,height*0.754]}
        }
        // html2pdf().set(opt).from(source).save()
        // this.setState({'show_loading_pdf': false})
        html2pdf().set(opt).from(source).toPdf().get('pdf').then(function (pdfObj) {
            // pdfObj has your jsPDF object in it, use it as you please!
            // For instance (untested):
            pdfObj.autoPrint();
            th.setState({'show_loading_pdf': false})
            window.open(pdfObj.output('bloburl'), '_blank');
        });
        // doc.html(source, {
        //   callback: function (doc) {
        //      doc.save(th.state.data.name+"-"+th.state.data.owner_name+"-"+th.state.data.pet_name+".pdf");
        //   },
        //   x: 0,
        //   y: 0,
        //   html2canvas: {
        //       scale: 1,
        //   }
        // });
    }
    
    deleteRow(i, type){
        var new_data = this.state.data
        if(new_data.invoice_line[type][i].name != undefined){
            new_data.invoice_line[type][i].deleted = true
        }
        else {
            new_data.invoice_line[type].splice(i, 1)
        }
        this.setState({data: new_data})
        this.refresh_subtotal()
    }
    
    backAction(){
        if(this.state.data.is_rawat_inap){
            [undefined,false,''].includes(this.state.data.parent_customer_invoice)?window.location.href='/main/kasir/rawat-inap-invoices':
            window.location.href='/main/kasir/rawat-inap-invoices/edit?n='+this.state.data.parent_customer_invoice
        } else {
            [undefined,false,''].includes(this.state.data.parent_customer_invoice)?window.location.href='/main/kasir/customer-invoices':
            window.location.href='/main/kasir/customer-invoices/edit?n='+this.state.data.parent_customer_invoice
        }
    }
    
    depositExchange(e){
        e.preventDefault()
        
        var paid = this.state.data.pembayaran.reduce((total, p) => total += p.jumlah, 0)
        var exchange = parseInt(paid) - parseInt(this.state.data.total)
        var method = this.state.data.pembayaran[0].metode_pembayaran
        
        frappe.call({
            type: 'POST',
            method: "vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.create_sales_exchange_journal",
            args: {invoice_name: this.state.data.name, amount: exchange, method: method, deposit: true},
            callback: function(r){
    			if (r.message) {
    				window.location.reload()
    			}
    		}
        })
    }
    
    render() {
        var panel_style = {background: '#FFFFFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', padding: '2px 32px', marginBottom: '15px'}
        var rowMinHeight = {minHeight: '60px'}
        var buttonMode = []
        var color = {color: '#056EAD', cursor: 'pointer'}
        var backButton = <span className="fs16 fw600 mr-auto my-auto" style={color} onClick={() => this.backAction()}><i className="fa fa-chevron-left mr-1" style={color}></i>Back</span>
        var status_row, popup_pay, popup_refund, loading_pdf
        var paid = 0
        var subtotal = 0
        var total = 0
        var invoice_name
        var write = checkPermission('VetCustomerInvoice', this.state.currentUser, 'write')
        var cancel = checkPermission('VetCustomerInvoice', this.state.currentUser, 'cancel')
        var refund = checkPermission('VetCustomerInvoice', this.state.currentUser, 'refund')
        
        if(this.state.data.children_customer_invoice && this.state.data.children_customer_invoice.length > 0){
            var all_payment = []
            var children_name = []
            subtotal = this.state.data.children_customer_invoice.reduce((total,a) => total+=a.customer_invoice.subtotal, 0)
            total = this.state.data.children_customer_invoice.reduce((total,a) => total+=a.customer_invoice.total, 0)
            this.state.data.children_customer_invoice.forEach(ci => all_payment = all_payment.concat(ci.customer_invoice.pembayaran))
            this.state.data.children_customer_invoice.forEach(ci => children_name.push(ci.customer_invoice.name))
            if(all_payment.length != 0){
                paid = all_payment.map(p => p.jumlah).reduce((a,b) => a+=b, 0)
            }
            invoice_name = children_name
        } else {
            invoice_name = this.state.data.name
            subtotal = this.state.data.subtotal
            total = this.state.data.total
            if(this.state.data.pembayaran.length != 0){
                paid = this.state.data.pembayaran.map(p => p.jumlah).reduce((a,b) => a+b, 0)
            }
        }
        
        if (this.state.show_payment) {
    	    popup_pay = <PopupPay togglePopupPay={() => this.togglePopupPay()} name={invoice_name} subtotal={subtotal} total={total} paid={paid} total_credit={this.state.total_credit} total_remaining={this.state.total_remaining} payment_method_list={this.state.payment_method_list}/>
    	}
    	
    	if (this.state.show_loading_pdf) {
    	    var maxwidth = {maxWidth: '300px', paddingTop: '250px'}
    	    loading_pdf = <div className="menu-popup">
                    <div className="container" style={maxwidth}>
                        <div className="bg-white p-4">
                            <div className="row justify-content-center" key='0'>
                                <div className="col-10 col-md-8 text-center rounded-lg py-4">
                                    <p className="mb-0 fs24md fs16 fw600 text-muted">
                                        <span><i className="fa fa-spin fa-circle-o-notch mr-3"></i>Loading...</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
    	}
    	
    	if (this.state.show_refund) {
    	    popup_refund = <PopupRefund togglePopupRefund={() => this.togglePopupRefund()} name={this.state.data.name} subtotal={this.state.data.subtotal} total={this.state.data.total} paid={paid} invoice_line={this.state.data.invoice_line} total_credit={this.state.total_credit} total_remaining={this.state.total_remaining} payment_method_list={this.state.payment_method_list}/>
    	}
        
        if (this.state.loaded) {
            if (id == undefined) {
                buttonMode.push(
                        <div className="col-auto d-flex my-auto" key="1">
            				<button type="submit" className="d-block btn btn-sm btn-danger fs12 text-uppercase fwbold py-2 px-4">Tambah</button>
            			</div>
                    )
            } else {
                var list_status
            	if (this.state.data.status != 'Cancel') {
            	    if (this.state.data.is_refund) {
            	        list_status = ['Draft', 'Refund']
            	    } else {
            	        list_status = ['Draft', 'Open', 'Paid', 'Done']
            	    }
            	} else {
            	    list_status = ['Cancel']
            	}
                status_row = <StatusRow statuses={list_status} current_status={this.state.data.status}/>
            }
            if(this.state.data.status == 'Draft'){
                if (this.state.data.is_refund) {
                    if (this.state.data.pembayaran.length == 0 && cancel) {
                        buttonMode.push(
                            <div className="col-auto d-flex my-auto" key="1">
                				<button type="button" onClick={(e) => this.cancelRefund(e)} className="d-block btn btn-sm btn-outline-danger fs12 text-uppercase fwbold py-2 px-4">Cancel</button>
                			</div>
                        )
                    }
                    buttonMode.push(
                        <div className="col-auto d-flex my-auto" key="2">
            				<button type="button" onClick={() => this.togglePopupRefund()} className="d-block btn btn-sm btn-danger fs12 text-uppercase fwbold py-2 px-4">Pay</button>
            			</div>
                    )
                } else {
                    if([undefined,false,''].includes(this.state.data.parent_customer_invoice)){
                        buttonMode.push(
                            <div className="col-auto d-flex my-auto" key="1">
                				<button type="button" onClick={(e) => this.formSubmit(e)} className="d-block btn btn-sm btn-danger fs12 text-uppercase fwbold py-2 px-4">Open</button>
                			</div>
                        )
                    }
                    if(this.state.data.children_customer_invoice.length==0 && write){
                        this.state.edit_mode?
                        buttonMode.push(
                            <div className="col-auto d-flex my-auto" key="save_button">
                				<button type="button" onClick={(e) => this.formSubmit(e, true)} className="d-block btn btn-sm btn-danger fs12 text-uppercase fwbold py-2 px-4">Save</button>
                			</div>
                        ):
                        buttonMode.push(
                            <div className="col-auto d-flex my-auto" key="edit_button">
                				<button type="button" onClick={() => this.toggleEditMode()} className="d-block btn btn-sm btn-danger fs12 text-uppercase fwbold py-2 px-4">Edit</button>
                			</div>
                        )
                    }
                }
            }
            else if (this.state.data.status == 'Open'){
                if([undefined,false,''].includes(this.state.data.parent_customer_invoice)){
                    buttonMode.push(
                            <div className="col-auto d-flex my-auto" key="1">
                				<button type="button" onClick={() => this.togglePopupPay()} className="d-block btn btn-sm btn-danger fs12 text-uppercase fwbold py-2 px-4">Pay</button>
                			</div>
                        )
                    
                    if (paid == 0 && cancel) {
                        buttonMode.push(<div className="col-auto my-auto" key="2">
                                            <button className="btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2" type="button" onClick={(e) => this.cancelAction(e)}>Cancel</button>
                                       </div>)
                    }
                }
            }
            if (this.state.data.status == 'Paid' || this.state.data.status == 'Done') {
                var cursor = {cursor: 'pointer'}
                if (!this.state.data.is_refund && !this.state.data.already_refund && refund) {
                    buttonMode.push(
                        <div className="col-auto d-flex my-auto" key="1">
            				<button type="button" onClick={(e) => this.refundInvoice(e)} className="d-block btn btn-sm btn-danger fs12 text-uppercase fwbold py-2 px-4">Refund</button>
            			</div>
                    )
                }
            //     if (!this.state.data.is_refund && !this.state.data.already_refund &&!this.state.data.no_exchange) {
            //         buttonMode.push(
            //             <div className="col-auto d-flex my-auto" key="deposit_exchange">
            // 				<button type="button" onClick={e => this.depositExchange(e)} className="d-block btn btn-sm btn-outline-danger fs12 text-uppercase fwbold py-2 px-4">Deposit</button>
            // 			</div>
            //         )
            //     }
            }
            
            if(id != undefined && this.state.data.status != 'Draft'){
                buttonMode.push(<div className="col-auto d-flex my-auto" key="printmini"><button type="button" onClick={(e) => this.printPDF(e, true)} className="d-block btn btn-sm btn-outline-danger fs12 text-uppercase fwbold py-2 px-4">Print Mini</button></div>)
                buttonMode.push(<div className="col-auto d-flex my-auto" key="print"><button type="button" onClick={(e) => this.printPDF(e)} className="d-block btn btn-sm btn-outline-danger fs12 text-uppercase fwbold py-2 px-4">Print</button></div>)
            }
            
            if (this.state.data.status) {
                var cursor = {cursor: 'pointer'}
                if (this.state.data.status != 'Draft'){
                    buttonMode.push( <div className="col-auto mr-auto cursor-pointer" onClick={() => this.goToJournalEntries()} key='10' style={cursor}>
            			            <img className="d-block mx-auto mt-2 header-icon" src="/static/img/main/menu/journal_entries.png"/>
            			            <p className="mb-0 fs12 text-muted text-center">Journal Entries</p>
            			        </div>)
                }
                buttonMode.push(<div className={this.state.data.status=='Draft'?"col-auto mr-auto":"col-auto"} key="deposit_info">
                                    <div className="row mx-0">
                                        <div className="col-auto px-3 cursor-pointer" onClick={() => (window.location.href = '/main/kasir/deposit?n=' + encodeURIComponent(this.state.data.owner))} style={cursor}>
                                            <img className="d-block mx-auto header-icon mt-2" src="/static/img/main/menu/credit.png"/>
                                            <p className="mb-0 fs12 text-muted text-center">Deposit</p>
                                        </div>
                                        <div className="col-auto px-2 d-flex my-auto">
                                            <span className="fs26 fw600">
                                                {/*formatter.format(this.state.total_credit-this.state.total_remaining)*/}
                                                {formatter.format(this.state.total_credit)}
                                            </span>
                                        </div>
                                    </div>
                                </div>)
            }
            
            buttonMode.push(<div key="999" className="col-auto d-flex mr-auto">{backButton}</div>)
            
            var pet_list = this.state.pet_list
            if(this.state.data.pet_parent != undefined){
                pet_list = this.state.pet_list.filter(p => p.parent == this.state.data.pet_parent)
            }
            
            return (
                <form id="customer_invoice_form" onSubmit={(e) => this.formSubmit(e)} className="position-relative">
                    <PDF data={this.state.data} payment_method_list={this.state.payment_method_list} subtotal={subtotal} total={total} paid={paid} total_credit={this.state.total_credit}/>
                    <PDFMini data={this.state.data} payment_method_list={this.state.payment_method_list} subtotal={subtotal} total={total} paid={paid} total_credit={this.state.total_credit}/>
                	<div style={panel_style}>
                		<div className="row mx-0 flex-row-reverse" style={rowMinHeight}>
                			{buttonMode}
                		</div>
                	</div>
                	<div className="row justify-content-end">
	            	    <div className="col-auto">
	            	        {status_row}
	            	    </div>
	            	    <div className="col-auto">
	            	        <RecordNavigation currentname={this.state.data.name} namelist={this.state.namelist} navigationAction={this.navigationAction}/>
	            	    </div>
	            	</div>
                	<CustomerInvoiceForm data={this.state.data} pet_owner_list={this.state.pet_owner_list} pet_list={pet_list} task_list={this.state.task_list} changeInput={this.changeInput} inputBlur={this.inputBlur}/>
                	<CustomerInvoiceLines name={this.state.data.name} list={this.state.data.invoice_line} children_customer_invoice={this.state.data.children_customer_invoice} edit_mode={this.state.edit_mode} no_exchange={this.state.data.no_exchange} is_refund={this.state.data.is_refund} product_list={this.state.product_list} uom_list={this.state.uom_list} status={this.state.data.status} payments={this.state.data.pembayaran} payment_method_list={this.state.payment_method_list} subtotal={this.state.data.subtotal} paid={paid} changeInput={this.changeInput} inputBlur={this.inputBlur} warehouse_list={this.state.warehouse_list} potongan={this.state.data.potongan} deleteRow={this.deleteRow} role={this.state.role} service={this.state.service} is_rawat_inap={this.state.data.is_rawat_inap} current_session={this.state.current_session} links={this.state.links} services={this.state.services} register_number={this.state.data.register_number}/>
                	<CustomerInvoiceVersion version={this.state.version || []} />
                	{popup_pay}
                	{popup_refund}
                	{loading_pdf}
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

class PDF extends React.Component{
    render(){
        var data = this.props.data
        var payment_method_list = this.props.payment_method_list
        var subtotal = this.props.subtotal
        var paid = this.props.paid
        var total = this.props.total
        var total_credit = this.props.total_credit
        console.log(data)
        var page_dimension = {width: 559, minHeight: 794, top:0, left: 0, background: '#FFF', color: '#000', zIndex: -1}
        var borderStyle = {border: '1px solid #000', margin: '15px 0'}
        var row1 = {marginBottom: 12}
        var row2 = {margin: '0 -14px'}
        var th = {border: '1px solid #000'}
        var td = {borderLeft: '1px solid #000', borderRight: '1px solid #000'}
        var fs11 = {fontSize: 11}
        var fs13 = {fontSize: 13}
        var fs9 = {fontSize: 9}
        var invoice = {letterSpacing: 0, lineHeight: '24px', marginBottom: 0, marginTop: 18}
        var invoice2 = {letterSpacing: 0}
        var thead = {background: '#d9d9d9', fontSize: 11}
        var total_border = {borderTop: '1px solid #000', marginBottom: 5}
        
        function addProductRow(data){
            var table_rows = []
            if (!data.is_rawat_inap){
                var keys = ['farmasi','instalasi_medis','jasa','rawat_inap']
                keys.forEach(k => {
                    if(data.invoice_line[k].filter(i => Object.keys(i).length != 0 && !i.deleted && i.racikan == undefined) != 0){
                        var filtered_list = data.invoice_line[k].filter(i => Object.keys(i).length != 0 && !i.deleted && i.racikan == undefined)
                        var racikan = []
                        data.invoice_line[k].forEach(l => !racikan.includes(l.racikan)?racikan.push(l.racikan):false)
                        
                        table_rows.push(
                            <tr key={k+" "+data.name} style={fs9}>
                                <td className="px-2 py-1 fw600 text-capitalize" >{k.replace(/_/g,' ')}</td>
                	            <td className="py-1" ></td>
                	            <td className="py-1" ></td>
                	            <td className="py-1" ></td>
                	            <td className="py-1" ></td>
                            </tr>
                        )
                        
                        filtered_list.forEach((f,index) => {
                            table_rows.push(
                                <tr key={k+"_"+data.name+"_"+index.toString()} style={fs9}>
                                    <td className="px-2 py-1" >{f.product_name?f.product_name.replace(/&lt;/,'<').replace(/&gt;/,'>'):false}</td>
                                    <td className="py-1 text-center" >{f.quantity}</td>
                                    <td className="py-1 text-center" >{f.discount||'-'}</td>
                                    <td className="py-1 text-center" >{k=='farmasi'&&racikan.includes(f.apotik_obat_id)?formatter.format(f.total + data.invoice_line[k].filter(lf => lf.racikan == f.apotik_obat_id).reduce((total, item) => total += item.total, 0)):formatter.format(f.unit_price)}</td>
                                    <td className="py-1 text-center" >{k=='farmasi'&&racikan.includes(f.apotik_obat_id)?formatter.format(f.total + data.invoice_line[k].filter(lf => lf.racikan == f.apotik_obat_id).reduce((total, item) => total += item.total, 0)):formatter.format(f.total)}</td>
                                </tr>
                            )
                        })
                    }
                })
            } else {
                var rawat_inap_rows = []
                var date_groups = []
                
                if(data.invoice_line['instalasi_medis'].filter(i => Object.keys(i).length != 0 && !i.deleted && i.racikan == undefined) != 0){
                    var filtered_list = data.invoice_line['instalasi_medis'].filter(i => Object.keys(i).length != 0 && !i.deleted && i.racikan == undefined)
                    table_rows.push(
                        <tr key={'instalasi_medis_'+data.name} style={fs9}>
                            <td className="px-2 py-1 fw600 text-capitalize" >Instalasi Medis</td>
            	            <td className="py-1" ></td>
            	            <td className="py-1" ></td>
            	            <td className="py-1" ></td>
            	            <td className="py-1" ></td>
                        </tr>
                    )
                    
                    filtered_list.forEach((f,index) => {
                        table_rows.push(
                            <tr key={'instalasi_medis_'+data.name+"_"+index.toString()} style={fs9}>
                                <td className="px-2 py-1" >{f.product_name?f.product_name.replace(/&lt;/,'<').replace(/&gt;/,'>'):false}</td>
                                <td className="py-1 text-center" >{f.quantity}</td>
                                <td className="py-1 text-center" >{f.discount||'-'}</td>
                                <td className="py-1 text-center" >{formatter.format(f.unit_price)}</td>
                                <td className="py-1 text-center" >{formatter.format(f.total)}</td>
                            </tr>
                        )
                    })
                }
                
                // list.forEach(l => !racikan.includes(l.racikan)?racikan.push(l.racikan):false)
                data.invoice_line['rawat_inap'].forEach(l => !date_groups.map(d => d.date).includes(moment(l.creation).subtract(tzOffset, 'minute').format("YYYY-MM-DD"))?date_groups.push({'date': moment(l.creation).subtract(tzOffset, 'minute').format("YYYY-MM-DD"), 'rows': []}):false)
                date_groups.forEach((d, index) => {
                    data.invoice_line['rawat_inap'].forEach(l => moment(l.creation).subtract(tzOffset, 'minute').format("YYYY-MM-DD") == d.date?d.rows.push(l):false)
                    table_rows.push(
                        <tr key={d.date+"_"+data.name} style={fs9}>
                            <td className="px-2 py-1 fw700 text-capitalize" >{d.date}</td>
            	            <td className="py-1" ></td>
            	            <td className="py-1" ></td>
            	            <td className="py-1" ></td>
            	            <td className="py-1" ></td>
                        </tr>
                    )
                    d.rows.forEach((r, index) => {
                        table_rows.push(
                            <tr key={d.date+"_"+data.name+"_"+index.toString()} style={fs9}>
                                <td className="px-2 py-1" >{r.product_name?r.product_name.replace(/&lt;/,'<').replace(/&gt;/,'>'):false}</td>
                                <td className="py-1 text-center" >{r.quantity}</td>
                                <td className="py-1 text-center" >{r.discount||'-'}</td>
                                <td className="py-1 text-center" >{formatter.format(r.unit_price)}</td>
                                <td className="py-1 text-center" >{formatter.format(r.total)}</td>
                            </tr>
                        )
                    })
                    
                })
            }
            return table_rows
        }
        
        var table_rows = []
        var payment_rows = []
        if(data.children_customer_invoice && data.children_customer_invoice.length > 0){
            var all_payment = []
            data.children_customer_invoice.forEach(ci => {
                var border = {borderTop: "1px solid #000", paddingTop: 7}
                var headerStyle = {background: "#D9D9D9", borderRadius: 3, padding: "3px 15px", fontSize: 10, fontWeight: 600}
                table_rows.push(
                    <tr key={ci.customer_invoice.name+"_header"}>
                        <td colSpan="5">
                            <div className="row">
                                <div className="col-auto mx-auto my-1" style={headerStyle}>
                                    <span className="pr-2">{ci.customer_invoice.name}</span><span className="pl-2">{ci.customer_invoice.pet_name}</span>
                                </div>
                            </div>
                        </td>
                    </tr>
                )
                table_rows = [...table_rows, ...addProductRow(ci.customer_invoice)]
                table_rows.push(<tr key={ci.customer_invoice.name+"_border"}><td colSpan="5" style={border}/></tr>)
                all_payment = all_payment.concat(ci.customer_invoice.pembayaran)
            })
            all_payment.forEach((d, index) => {
                var payment_method = d.metode_pembayaran
                var pm_find = payment_method_list.find(p => p.name == d.metode_pembayaran)
                pm_find?payment_method = pm_find.method_name:false
                
                payment_rows.push(
                    <div className="row" style={fs11} key={index.toString()}>
    	                <div className="col-6 text-right fw600">
    	                    {payment_method}
    	                </div>
    	                <div className="col-6 text-right">
    	                    {formatter.format(d.jumlah)}
    	                </div>
    	            </div>
                )
            })
        } else {
            var border = {borderTop: "1px solid #000", paddingTop: 7}
            table_rows = addProductRow(data)
            table_rows.push(<tr key={data.name+"_border"}><td colSpan="5" style={border}/></tr>)
            data.pembayaran.forEach((d, index) => {
                var payment_method = d.metode_pembayaran
                var pm_find = payment_method_list.find(p => p.name == d.metode_pembayaran)
                pm_find?payment_method = pm_find.method_name:false
                
                payment_rows.push(
                    <div className="row" style={fs11} key={index.toString()}>
    	                <div className="col-6 text-right fw600">
    	                    {payment_method}
    	                </div>
    	                <div className="col-6 text-right">
    	                    {formatter.format(d.jumlah)}
    	                </div>
    	            </div>
                )
            })
        }
        
        var refund_border = {border: '2px solid #000'}
        var refund = (
            <div className="col-3 mr-auto">
                <div className="fs16 fw600 px-3 py-2 text-uppercase text-center" style={refund_border}>
                    Refund
                </div>
            </div>
        )
        
        var remaining = total - paid
        
        var remaining_row
        if(['Refund','Done'].includes(data.status) && data.is_rawat_inap){
            remaining_row = (
                <div className="row" style={fs11}>
	                <div className="col-6 text-right fw600">
	                    Sisa Deposit
	                </div>
	                <div className="col-6 text-right">
	                    {formatter.format(total_credit)}
	                </div>
	            </div>
            )
        } else {
            remaining_row = (
                <div className="row" style={fs11}>
                    <div className="col-6 text-right fw600">
                        {remaining<0?"Exchange":"Remaining"}
                    </div>
                    <div className="col-6 text-right">
                        {remaining<0?formatter.format(-remaining):formatter.format(remaining)}
                    </div>
                </div>
            )
        }
        
        return(
            <div className="position-absolute d-none" style={page_dimension}>
                <div id="pdf" className="px-4" style={page_dimension}>
    			    <div className="row">
    			        <div className="col-2 px-0">
    			            <img className="mt-3" src="/static/img/main/menu/naturevet_logo_2x.png"/>
    			        </div>
    			        <div className="col-6">
    			            <p className="my-3 fwbold text-uppercase" style={fs13}>Nature Vet</p>
    			            <p className="my-0" style={fs9}>Ruko Graha Boulevard Blok D Nomor 17,<br/>Curug Sangereng, Kelapa Dua, Tangerang, Banten 15810</p>
    			            <p className="my-0" style={fs9}>Telp. : (021) 83792692 </p>
    			        </div>
    			        <div className="col-4">
    			            <p className="fwbold text-right text-uppercase fs28" style={invoice}>Invoice</p>
    			            <p className="fw600 text-right text-uppercase" style={Object.assign({}, invoice2, fs13)}>{data.name}</p>
    			        </div>
    			        <div className="col-12" style={borderStyle}/>
    			    </div>
    			    <div className="row mx-0" style={row1}>
    			        <div className="col-3 px-0">
    			            <p className="mb-0 fs10">{data.owner_name}</p>
    			        </div>
    			        <div className="col px-0">
    			            <p className="mb-0 fs10">{data.pet_name}</p>
    			        </div>
    			        <div className="col">
			                <p className="mb-0 fs10 text-right">
			                    {moment(data.invoice_date).subtract(tzOffset, 'minute').format("DD-MM-YYYY HH:mm:ss")}
			                </p>
			                <p className="mb-0 fs10 text-right">
			                    {data.user_name}
			                </p>
    			        </div>
    			    </div>
    			    <table className="fs12" style={row2}>
    			        <thead className="text-uppercase" style={thead}>
        			        <tr className="text-center">
        			            <th className="fw700 py-2" width="280px" >Produk</th>
        			            <th className="fw700 py-2" width="40px" >Qty</th>
        			            <th className="fw700 py-2" width="50px" >Disc</th>
        			            <th className="fw700 py-2" width="90px" >Harga</th>
        			            <th className="fw700 py-2" width="90px" >Jumlah</th>
        			        </tr>
        			    </thead>
        			    <tbody>
        			        {table_rows}
        			    </tbody>
    			    </table>
    			    <div className="row justify-content-end mb-2">
    			        {data.is_refund?refund:false}
    			        <div className="col-7 px-0">
    			            <div className="row" style={fs11}>
    			                <div className="col-6 text-right fw600">
    			                    Sub Total
    			                </div>
    			                <div className="col-6 text-right">
    			                    {formatter.format(subtotal)}
    			                </div>
    			            </div>
    			            <div className="row" style={fs11}>
    			                <div className="col-6 text-right fw600">
    			                    Diskon
    			                </div>
    			                <div className="col-6 text-right">
    			                    {formatter.format(data.potongan)}
    			                </div>
    			            </div>
    			        </div>
    			    </div>
    			    <div className="row justify-content-end">
    			        <div className="col-6 px-0">
    			            <div style={total_border}/>
    			        </div>
    			    </div>
    			    <div className="row justify-content-end mb-2">
    			        <div className="col-7 px-0">
    			            <div className="row" style={fs11}>
    			                <div className="col-6 text-right fw600 fs16">
    			                    Total
    			                </div>
    			                <div className="col-6 text-right">
    			                    {formatter.format(total)}
    			                </div>
    			            </div>
    			            {payment_rows}
    			            {remaining_row}
    			        </div>
    			    </div>
    			</div>
			</div>
        )
    }
}

class PDFRow extends React.Component{
    render(){
        var lineHeight = {lineHeight: '24px'}
        var fontSize = {fontSize: 12}
        
        return(
            <div className="row mx-0" style={lineHeight}>
                <div className="col-5 px-1" style={fontSize}>
                    {this.props.label}
                </div>
                <div className="col-1 px-1">
                    :
                </div>
                <div className="col-6 px-1" style={fontSize}>
                    {this.props.value}
                </div>
            </div>
        )
    }
}

class PDFMini extends React.Component{
    render(){
        var data = this.props.data
        var payment_method_list = this.props.payment_method_list
        var subtotal = this.props.subtotal
        var paid = this.props.paid
        var total = this.props.total
        var total_credit = this.props.total_credit
        console.log(data)
        var page_dimension = {width: 302, minHeight: 525, top:0, left: 0, background: '#FFF', color: '#000', zIndex: -1}
        var page_scale = {transform: 'scale(78%)', transformOrigin: 'top left'}
        var borderStyle = {border: '1px solid #000', margin: '15px 0'}
        var borderStyle2 = {borderBottom: '1px solid #000'}
        var row1 = {marginBottom: 2}
        var row2 = {marginBottom: 10, width: '100%'}
        var total_border = {borderTop: '1px solid #000', marginBottom: 5}
        var fontSize = {fontSize: 12}
        var fontSize2 = {fontSize: 9}
        var logo = {width: 72}
        
        function addProductRow(data){
            var table_rows = []
            if (!data.is_rawat_inap){
                var keys = ['farmasi','instalasi_medis','jasa','rawat_inap']
                keys.forEach(k => {
                    if(data.invoice_line[k].filter(i => Object.keys(i).length != 0 && !i.deleted && i.racikan == undefined) != 0){
                        var filtered_list = data.invoice_line[k].filter(i => Object.keys(i).length != 0 && !i.deleted && i.racikan == undefined)
                        var racikan = []
                        data.invoice_line[k].forEach(l => !racikan.includes(l.racikan)?racikan.push(l.racikan):false)
                        
                        table_rows.push(
                            <tr key={k+""+data.name}>
                                <td className="px-2 py-1 fw700 text-capitalize">{k.replace(/_/g,' ')}</td>
                	            <td className="py-1"></td>
                	            <td className="py-1"></td>
                            </tr>
                        )
                        
                        filtered_list.forEach((f,index) => {
                            table_rows.push(
                                <tr key={k+""+data.name+""+index.toString()}>
                                    <td className="px-2 py-1">{f.product_name?f.product_name.replace(/&lt;/,'<').replace(/&gt;/,'>'):false}</td>
                                    <td className="py-1">{f.quantity+" x "+(k=='farmasi'&&racikan.includes(f.apotik_obat_id)?formatter.format(f.total + data.invoice_line[k].filter(lf => lf.racikan == f.apotik_obat_id).reduce((total, item) => total += item.total, 0)):formatter.format(f.unit_price))}</td>
                                    <td className="py-1 text-right">{k=='farmasi'&&racikan.includes(f.apotik_obat_id)?formatter.format(f.total + data.invoice_line[k].filter(lf => lf.racikan == f.apotik_obat_id).reduce((total, item) => total += item.total, 0)):formatter.format(f.total)}</td>
                                </tr>
                            )
                        })
                    }
                })
            } else {
                var rawat_inap_rows = []
                var date_groups = []
                
                if(data.invoice_line['instalasi_medis'].filter(i => Object.keys(i).length != 0 && !i.deleted && i.racikan == undefined) != 0){
                    var filtered_list = data.invoice_line['instalasi_medis'].filter(i => Object.keys(i).length != 0 && !i.deleted && i.racikan == undefined)
                    table_rows.push(
                        <tr key={'instalasi_medis'+data.name}>
                            <td className="px-2 py-1 fw600 text-capitalize" >Instalasi Medis</td>
            	            <td className="py-1" ></td>
            	            <td className="py-1" ></td>
                        </tr>
                    )
                    
                    filtered_list.forEach((f,index) => {
                        table_rows.push(
                            <tr key={'instalasi_medis'+data.name+"_"+index.toString()}>
                                <td className="px-2 py-1" >{f.product_name?f.product_name.replace(/&lt;/,'<').replace(/&gt;/,'>'):false}</td>
                                <td className="py-1" >{f.quantity+" x "+formatter.format(f.unit_price)}</td>
                                <td className="py-1 text-right" >{formatter.format(f.total)}</td>
                            </tr>
                        )
                    })
                }
                
                // list.forEach(l => !racikan.includes(l.racikan)?racikan.push(l.racikan):false)
                data.invoice_line['rawat_inap'].forEach(l => !date_groups.map(d => d.date).includes(moment(l.creation).subtract(tzOffset, 'minute').format("YYYY-MM-DD"))?date_groups.push({'date': moment(l.creation).subtract(tzOffset, 'minute').format("YYYY-MM-DD"), 'rows': []}):false)
                date_groups.forEach((d, index) => {
                    data.invoice_line['rawat_inap'].forEach(l => moment(l.creation).subtract(tzOffset, 'minute').format("YYYY-MM-DD") == d.date?d.rows.push(l):false)
                    table_rows.push(
                        <tr key={d.date+""+d.name}>
                            <td className="px-2 py-1 fw700 text-capitalize">{d.date}</td>
            	            <td className="py-1"></td>
            	            <td className="py-1"></td>
                        </tr>
                    )
                    d.rows.forEach((r, index) => {
                        table_rows.push(
                            <tr key={d.date+""+d.name+""+index.toString()}>
                                <td className="px-2 py-1">{r.product_name?r.product_name.replace(/&lt;/,'<').replace(/&gt;/,'>'):false}</td>
                                <td className="py-1">{r.quantity+" x "+formatter.format(r.unit_price)}</td>
                                <td className="py-1 text-right">{formatter.format(r.total)}</td>
                            </tr>
                        )
                    })
                    
                })
            }
            
            return table_rows
        }
        
        var table_rows = []
        var payment_rows = []
        if(data.children_customer_invoice && data.children_customer_invoice.length > 0){
            var all_payment = []
            data.children_customer_invoice.forEach(ci => {
                var border = {borderTop: "1px solid #000", paddingTop: 7}
                var headerStyle = {background: "#D9D9D9", borderRadius: 3, padding: "3px 15px", fontSize: 10, fontWeight: 600}
                table_rows.push(
                    <tr key={ci.customer_invoice.name+"_header"}>
                        <td colSpan="5">
                            <div className="row">
                                <div className="col-auto mx-auto my-1">
                                    <span className="pr-2">{ci.customer_invoice.name}</span><span className="pl-2">{ci.customer_invoice.pet_name}</span>
                                </div>
                            </div>
                        </td>
                    </tr>
                )
                table_rows = [...table_rows, ...addProductRow(ci.customer_invoice)]
                all_payment = all_payment.concat(ci.customer_invoice.pembayaran)
            })
            all_payment.forEach((d, index) => {
                var payment_method = d.metode_pembayaran
                var pm_find = payment_method_list.find(p => p.name == d.metode_pembayaran)
                pm_find?payment_method = pm_find.method_name:false
                
                payment_rows.push(
                    <div className="row" style={fontSize2} key={index.toString()}>
    	                <div className="col-6 text-right fw600">
    	                    {payment_method}
    	                </div>
    	                <div className="col-6 text-right">
    	                    {formatter.format(d.jumlah)}
    	                </div>
    	            </div>
                )
            })
        } else {
            var border = {borderTop: "1px solid #000", paddingTop: 7}
            table_rows = addProductRow(data)
            table_rows.push(<tr key={data.name+"_border"}><td colSpan="5" style={border}/></tr>)
            data.pembayaran.forEach((d, index) => {
                var payment_method = d.metode_pembayaran
                var pm_find = payment_method_list.find(p => p.name == d.metode_pembayaran)
                pm_find?payment_method = pm_find.method_name:false
                
                payment_rows.push(
                    <div className="row" style={fontSize2} key={index.toString()}>
    	                <div className="col-6 text-right fw600">
    	                    {payment_method}
    	                </div>
    	                <div className="col-6 text-right">
    	                    {formatter.format(d.jumlah)}
    	                </div>
    	            </div>
                )
            })
        }
        
        var refund_border = {border: '2px solid #000'}
        var refund = (
            <div className="col-3 mr-auto">
                <div className="fs16 fw600 px-3 py-2 text-uppercase text-center" style={refund_border}>
                    Refund
                </div>
            </div>
        )
        
        var remaining = total - paid
        
        var remaining_row
        if(['Refund','Done'].includes(data.status) && data.is_rawat_inap){
            remaining_row = (
                <div className="row" style={fontSize2}>
	                <div className="col-6 text-right fw600">
	                    Sisa Deposit
	                </div>
	                <div className="col-6 text-right">
	                    {formatter.format(total_credit)}
	                </div>
	            </div>
            )
        } else {
            remaining_row = (
                <div className="row" style={fontSize2}>
                    <div className="col-6 text-right fw600">
                        {remaining<0?"Exchange":"Remaining"}
                    </div>
                    <div className="col-6 text-right">
                        {remaining<0?formatter.format(-remaining):formatter.format(remaining)}
                    </div>
                </div>
            )
        }
        
        return(
            <div className="position-absolute d-none" style={page_dimension}>
                <div id="pdfmini" className="px-2 py-3" style={Object.assign({}, page_dimension, page_scale)}>
    			    <div className="row">
    			        <div className="col-auto pr-0">
    			            <img src="/static/img/main/menu/naturevet_logo.png" style={logo}/>
    			        </div>
    			        <div className="col-8">
    			            <p className="my-0 fs12 fwbold text-uppercase">Nature Vet</p>
    			            <p className="my-0" style={fontSize2}>Ruko Graha Boulevard Blok D Nomor 17,<br/>Curug Sangereng, Kelapa Dua, Tangerang, Banten 15810</p>
    			            <p className="my-0" style={fontSize2}>Telp. : (021) 83792692 </p>
    			        </div>
    			        <div className="col-12">
    			            <div style={borderStyle}/>
    			        </div>
    			    </div>
    			    <div className="row mx-0" style={row1}>
    			        <div className="col-6 px-1">
    			            <PDFMiniRow label="Owner Name" value={data.owner_name}/>
    			            <PDFMiniRow label="Pet Name" value={data.pet_name}/>
    			        </div>
    			        <div className="col-6 px-1">
    			            <PDFMiniRow right={true} label="Tanggal Invoice" value={moment(data.invoice_date).subtract(tzOffset, 'minute').format("DD-MM-YYYY HH:mm")}/>
    			            <PDFMiniRow right={true} label="No. Invoice" value={'Invoice '+data.name}/>
    			            <PDFMiniRow right={true} label="Responsible" value={data.user_name}/>
    			        </div>
    			    </div>
    			    <table style={Object.assign({}, row2, fontSize2)}>
        			    <tbody>
        			        {table_rows}
        			    </tbody>
    			    </table>
    			    <div className="row justify-content-end">
    			        <div className="col-5">
    			            <div style={total_border}/>
    			        </div>
    			    </div>
    			    <div className="row justify-content-end mb-2">
    			        <div className="col-7">
    			            {data.is_refund?refund:false}
    			            <div className="row" style={fontSize2}>
    			                <div className="col-6 text-right fw600">
    			                    Sub Total
    			                </div>
    			                <div className="col-6 text-right">
    			                    {formatter.format(subtotal)}
    			                </div>
    			            </div>
    			            <div className="row" style={fontSize2}>
    			                <div className="col-6 text-right fw600">
    			                    Diskon
    			                </div>
    			                <div className="col-6 text-right">
    			                    {formatter.format(data.potongan)}
    			                </div>
    			            </div>
    			        </div>
    			    </div>
    			    <div className="row justify-content-end">
    			        <div className="col-5">
    			            <div style={total_border}/>
    			        </div>
    			    </div>
    			    <div className="row justify-content-end mb-2">
    			        <div className="col-7">
    			            <div className="row" style={fontSize2}>
    			                <div className="col-6 text-right fw600">
    			                    Total
    			                </div>
    			                <div className="col-6 text-right">
    			                    {formatter.format(total)}
    			                </div>
    			            </div>
    			            {payment_rows}
    			            {remaining_row}
    			        </div>
    			    </div>
    			</div>
			</div>
        )
    }
}

class PDFMiniRow extends React.Component{
    render(){
        var lineHeight = {lineHeight: '24px'}
        var fontSize = {fontSize: 9}
        
        return(
            <div className="row mx-0">
                <div className={this.props.right?"col-12 px-1 fw600 text-right":"col-12 px-1 fw600"} style={fontSize}>
                    {this.props.value}
                </div>
            </div>
        )
    }
}

class CustomerInvoiceForm extends React.Component {
    sourceClick(tipe){
        if (tipe == 'origin') {
            window.location.href = '/main/kasir/customer-invoices/edit?n=' + this.props.data.origin
        } else if (tipe == 'pemilik') {
            window.location.href = '/main/penerimaan/data-pemilik/edit?n=' + this.props.data.owner
        } else if (tipe == 'pasien') {
            window.location.href = '/main/penerimaan/data-pasien/edit?n=' + this.props.data.pet
        }
    }
    
    render() {
        var panel_style = {background: '#fff', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)'}
        var data = this.props.data
        var pet_list = this.props.pet_list
        var pet_owner_list = this.props.pet_owner_list
        var task_list = this.props.task_list
        var cursor = {cursor: 'pointer'}
        var title, pet, owner_name, invoice_date, register_number, user, link_icon
        
        var pet_options = []
        if(pet_list.length != 0){
            pet_list.forEach((l, index) => pet_options.push(<option value={l.pet_name} key={l.name} />))
        }
        var pet_datalist = (
            <datalist id="pet_list">
                {pet_options}
            </datalist>
        )
        
        var task_options = []
        if(task_list.length != 0){
            task_list.forEach((l, index) => task_options.push(<option value={l.name} key={l.name} />))
        }
        var task_datalist = (
            <datalist id="task_list">
                {task_options}
            </datalist>
        )
        
        var owner_options = []
        if(pet_owner_list.length != 0){
            pet_owner_list.forEach((l, index) => owner_options.push(<option value={l.name+":"+l.owner_name} key={index.toString()} />))
        }
        var owner_datalist = (
            <datalist id="pet_owner_list">
                {owner_options}
            </datalist>
        )
        
        if (id != undefined) {
            var link_pemilik = <img src="/static/img/main/menu/tautan.png" className="mx-2" onClick={() => this.sourceClick('pemilik')} style={cursor}/>
            var link_pasien = <img src="/static/img/main/menu/tautan.png" className="mx-2" onClick={() => this.sourceClick('pasien')} style={cursor}/>
            title = <p className="fs18 fw600 text-dark mb-2">{data.name}</p>
            pet = <span className="fs16 px-0" id="pet">{data.pet_name||data.pet}{link_pasien}</span>
            owner_name = <span className="fs16 px-0" id="owner_name">{data.owner_name}{link_pemilik}</span>
            invoice_date = <span className="fs16 px-0" id="invoice_date">{data.is_refund ? moment(data.refund_date).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss") : moment(data.invoice_date).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss")}</span>
            register_number = <span className="fs16 px-0" id="register_number">{data.is_refund ? data.origin : data.register_number}</span>
            user = <span className="fs16 px-0" id="user">{data.user}</span>
            if(data.children_customer_invoice && data.children_customer_invoice.length > 0){
                pet = false
            }
        } else {
            title = <p className="fs18 fw600 text-dark mb-2">New Customer Invoice</p>
            pet = <input required type="text" name="pet" id="pet" autoComplete="off" placeholder="Pasien" className="form-control fs14" list="pet_list" onChange={e => this.props.changeInput(e)} onBlur={e => this.props.inputBlur(e, pet_list)} value={data.pet_name||data.pet||''}/>
            owner_name = <input required type="text" name="owner_name" id="owner_name" autoComplete="off" placeholder="Pemilik/Customer" className="form-control fs14" list="pet_owner_list" onChange={e => this.props.changeInput(e)} onBlur={e => this.props.inputBlur(e, pet_owner_list)} value={data.owner_name||''}/>
            invoice_date = <input required type="date" name="invoice_date" id="invoice_date" autoComplete="off" className="form-control fs14" onChange={e => this.props.changeInput(e)} value={data.invoice_date||''}/>
            register_number = <input type="text" name="register_number" id="register_number" autoComplete="off" placeholder="No. Registrasi" className="form-control fs14" list="task_list" onChange={e => this.props.changeInput(e)} onBlur={e => this.props.inputBlur(e, task_list)}/>
        }
        
        if (data.is_refund) {
            link_icon = <img src="/static/img/main/menu/tautan.png" className="mx-2" onClick={() => this.sourceClick('origin')} style={cursor}/>
        }
        
        return (
            <div>
                {pet_datalist}
                {task_datalist}
                {owner_datalist}
                {title}
            	<div style={panel_style} className="px-4 pb-1 pt-3 mb-4">
    	            <div className="form-row">
    	                <div className="col">
        	                <div className="form-group">
            					<label htmlFor="pet" className=" fw600">Pasien</label>
            					<div className="row mx-0">
            						{pet}
            					</div>
            				</div>
    	                </div>
    	                <div className="col">
        	                <div className="form-group">
            					<label htmlFor="owner_name" className=" fw600">Pemilik/Customer</label>
            					<div className="row mx-0">
            						{owner_name}
            					</div>
            				</div>
    	                </div>
    	                <div className="col">
        	                <div className="form-group">
            					<label htmlFor="invoice_date" className=" fw600">{data.is_refund ? 'Refund Date' : 'Invoice Date'}</label>
            					<div className="row mx-0">
            						{invoice_date}
            					</div>
            				</div>
    	                </div>
    	                <div className="col">
        	                <div className="form-group">
            					<label htmlFor="register_number" className=" fw600">{data.is_refund ? 'Source Document' : 'No Pendaftaran'}</label>
            					<div className="row mx-0">
            						{register_number}{link_icon}
            					</div>
            				</div>
    	                </div>
    	                <div className="col">
        	                <div className="form-group">
            					<label htmlFor="user" className=" fw600">Validate User</label>
            					<div className="row mx-0">
            						{user}
            					</div>
            				</div>
    	                </div>
    	            </div>
            	</div>
            </div>
        )
    }
}

class CustomerInvoiceLines extends React.Component {
    render() {
        var th = this
        var panel_style = {background: '#fff', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)'}
        var product_list = this.props.product_list
        var warehouse_list = this.props.warehouse_list
        var children_customer_invoice = this.props.children_customer_invoice
        var list = this.props.list
        var is_refund = this.props.is_refund
        var counterStyle = {marginTop: '-1rem', verticalAlign: 'middle'}
        var farmasi_counter, jasa_counter, instalasi_medis_counter, rawat_inap_counter
        
        var product_options = []
        if(product_list.length != 0){
            product_list.forEach((l, index) => product_options.push(<option value={l.product_name} key={l.name} >{l.name}</option>))
        }
        var product_datalist = (
            <datalist id="product_list">
                {product_options}
            </datalist>
        )
        var warehouse_options = []
        if(warehouse_list.length != 0){
            warehouse_list.forEach((l, index) => warehouse_options.push(<option value={l.gudang_name} key={l.name} />))
        }
        var warehouse_datalist = (
            <datalist id="warehouse_list">
                {warehouse_options}
            </datalist>
        )
        
        if (list.farmasi.filter(i => i.product && !i.deleted).length > 0){
		    farmasi_counter = (<span className="record-count badge badge-danger rounded-circle fs10 fw600" style={counterStyle}>{list.farmasi.filter(i => i.product && !i.deleted).length}</span>)
		}
		
		if (list.jasa.filter(i => i.product && !i.deleted).length > 0){
		    jasa_counter = (<span className="record-count badge badge-danger rounded-circle fs10 fw600" style={counterStyle}>{list.jasa.filter(i => i.product && !i.deleted).length}</span>)
		}
		
		if (list.instalasi_medis.filter(i => i.product && !i.deleted).length > 0){
		    instalasi_medis_counter = (<span className="record-count badge badge-danger rounded-circle fs10 fw600" style={counterStyle}>{list.instalasi_medis.filter(i => i.product && !i.deleted).length}</span>)
		}
		
		if (list.rawat_inap.filter(i => i.product && !i.deleted).length > 0){
		    rawat_inap_counter = (<span className="record-count badge badge-danger rounded-circle fs10 fw600" style={counterStyle}>{list.rawat_inap.filter(i => i.product && !i.deleted).length}</span>)
		}
        
    //     return (
    //         <div>
    //             <p className="fs18 fw600 text-dark mb-2">Invoice Lines</p>
    //         	<div style={panel_style} className="p-4 mb-4">
    //         	    {product_datalist}
    //         	    {warehouse_datalist}
    // 				<ul className="nav nav-tabs justify-content-around" id="serviceTab" role="tablist">
    // 				    <li className="nav-item">
    //         				<a className="nav-link py-1 active" id="farmasi-tab" data-toggle="tab" href="#farmasi" role="tab"><span>Farmasi</span>{farmasi_counter}</a>
    //         			</li>
    //         			<li className="nav-item">
    //         				<a className="nav-link py-1" id="jasa-tab" data-toggle="tab" href="#jasa" role="tab"><span>Jasa</span>{jasa_counter}</a>
    //         			</li>
    //         			<li className="nav-item">
    //         				<a className="nav-link py-1" id="rawat-inap-tab" data-toggle="tab" href="#rawat-inap" role="tab"><span>Rawat Inap</span>{rawat_inap_counter}</a>
    //         			</li>
    //         			<li className="nav-item">
    //         				<a className="nav-link py-1" id="instalasi-medis-tab" data-toggle="tab" href="#instalasi-medis" role="tab"><span>Instalasi Medis</span>{instalasi_medis_counter}</a>
    //         			</li>
    //         		</ul>
				// 	<div className="tab-content" id="dokterTabContent">
				// 	    <div className="tab-pane pt-4 pb-2 show active" id="farmasi" role="tabpanel">
				// 	        <CustomerInvoiceLinesContent list={list.farmasi} edit_mode={this.props.edit_mode} product_list={this.props.product_list} uom_list={this.props.uom_list} status={this.props.status} payments={this.props.payments} subtotal={this.props.subtotal} paid={this.props.paid} changeInput={this.props.changeInput} inputBlur={this.props.inputBlur} service="farmasi" warehouse_list={this.props.warehouse_list} is_refund={this.props.is_refund} no_exchange={this.props.no_exchange} potongan={this.props.potongan} deleteRow={(index) => this.props.deleteRow(index, 'farmasi')} role={this.props.role}/>
				// 	    </div>
				// 	    <div className="tab-pane pt-4 pb-2" id="jasa" role="tabpanel">
				// 	        <CustomerInvoiceLinesContent list={list.jasa} edit_mode={this.props.edit_mode} product_list={this.props.product_list} uom_list={this.props.uom_list} status={this.props.status} payments={this.props.payments} subtotal={this.props.subtotal} paid={this.props.paid} changeInput={this.props.changeInput} inputBlur={this.props.inputBlur} service="jasa" warehouse_list={this.props.warehouse_list} is_refund={this.props.is_refund} no_exchange={this.props.no_exchange} potongan={this.props.potongan} deleteRow={(index) => this.props.deleteRow(index, 'jasa')} role={this.props.role}/>
				// 	    </div>
				// 	    <div className="tab-pane pt-4 pb-2" id="rawat-inap" role="tabpanel">
				// 	        <CustomerInvoiceLinesContent list={list.rawat_inap} edit_mode={this.props.edit_mode} product_list={this.props.product_list} uom_list={this.props.uom_list} status={this.props.status} payments={this.props.payments} subtotal={this.props.subtotal} paid={this.props.paid} changeInput={this.props.changeInput} inputBlur={this.props.inputBlur} service="rawat_inap" warehouse_list={this.props.warehouse_list} is_refund={this.props.is_refund} no_exchange={this.props.no_exchange} potongan={this.props.potongan} deleteRow={(index) => this.props.deleteRow(index, 'rawat_inap')} role={this.props.role}/>
				// 	    </div>
				// 	    <div className="tab-pane pt-4 pb-2" id="instalasi-medis" role="tabpanel">
				// 	        <CustomerInvoiceLinesContent list={list.instalasi_medis} edit_mode={this.props.edit_mode} product_list={this.props.product_list} uom_list={this.props.uom_list} status={this.props.status} payments={this.props.payments} subtotal={this.props.subtotal} paid={this.props.paid} changeInput={this.props.changeInput} inputBlur={this.props.inputBlur} service="instalasi_medis" warehouse_list={this.props.warehouse_list} is_refund={this.props.is_refund} no_exchange={this.props.no_exchange} potongan={this.props.potongan} deleteRow={(index) => this.props.deleteRow(index, 'instalasi_medis')} role={this.props.role}/>
				// 	    </div>
				// 	</div>
    //         	</div>
    //         </div>
    //     )
        var parent_links = this.props.links.find(l => l.name == th.props.name)
        var rawat_inap_rows = []
        var date_groups = []
        // list.forEach(l => !racikan.includes(l.racikan)?racikan.push(l.racikan):false)
        list.rawat_inap.forEach(l => !date_groups.map(d => d.date).includes(moment(l.creation).subtract(tzOffset, 'minute').format("YYYY-MM-DD"))?date_groups.push({'date': moment(l.creation).subtract(tzOffset, 'minute').format("YYYY-MM-DD"), 'rows': []}):false)
        date_groups.forEach((d, index) => {
            list.rawat_inap.forEach(l => moment(l.creation).subtract(tzOffset, 'minute').format("YYYY-MM-DD") == d.date?d.rows.push(l):false)
            rawat_inap_rows.push(
                <CustomerInvoiceLinesContent key={index.toString()} list={d.rows} edit_mode={th.props.edit_mode} product_list={th.props.product_list} uom_list={th.props.uom_list} status={th.props.status} payments={th.props.payments} subtotal={th.props.subtotal} paid={th.props.paid} changeInput={th.props.changeInput} inputBlur={th.props.inputBlur} service_name={d.date} service="rawat_inap" warehouse_list={th.props.warehouse_list} is_refund={th.props.is_refund} no_exchange={th.props.no_exchange} potongan={th.props.potongan} deleteRow={(index) => th.props.deleteRow(index, 'rawat_inap')} role={th.props.role} links={parent_links} register_number={th.props.register_number}/>
            )
        })
        // <CustomerInvoiceLinesContent list={list.rawat_inap} edit_mode={this.props.edit_mode} product_list={this.props.product_list} uom_list={this.props.uom_list} status={this.props.status} payments={this.props.payments} subtotal={this.props.subtotal} paid={this.props.paid} changeInput={this.props.changeInput} inputBlur={this.props.inputBlur} service_name="Rawat Inap" service="rawat_inap" warehouse_list={this.props.warehouse_list} is_refund={this.props.is_refund} no_exchange={this.props.no_exchange} potongan={this.props.potongan} deleteRow={(index) => this.props.deleteRow(index, 'rawat_inap')} role={this.props.role}/>:false}
        
        var content
        if(!children_customer_invoice || children_customer_invoice.length == 0){
            content = <div style={panel_style} className="p-4 mb-4">
                    	    {product_datalist}
                    	    {warehouse_datalist}
                    	    <div className="row mx-0 fs14 fw600 row-header">
                				<div className="col">
                					<span className="my-auto">Product</span>
                				</div>
                				<div className="col-2 text-center">
                					<span className="my-auto">Warehouse</span>
                				</div>
                				<div className="col-1 text-center">
                					<span className="my-auto">Qty</span>
                				</div>
                				<div className="col-1 text-center">
                					<span className="my-auto">UOM</span>
                				</div>
                				<div className="col-1 text-center">
                					<span className="my-auto">Unit Price</span>
                				</div>
                				<div className="col-1 text-center">
                					<span className="my-auto">Disc %</span>
                				</div>
                				<div className="col-1 text-center">
                					<span className="my-auto">Amount</span>
                				</div>
                				<div className="col-1 text-center"></div>
                			</div>
                			{!this.props.is_rawat_inap?<CustomerInvoiceLinesContent list={list.farmasi} edit_mode={this.props.edit_mode} product_list={this.props.product_list} uom_list={this.props.uom_list} status={this.props.status} payments={this.props.payments} subtotal={this.props.subtotal} paid={this.props.paid} changeInput={this.props.changeInput} inputBlur={this.props.inputBlur} service_name="Farmasi" service="farmasi" warehouse_list={this.props.warehouse_list} is_refund={this.props.is_refund} no_exchange={this.props.no_exchange} potongan={this.props.potongan} deleteRow={(index) => this.props.deleteRow(index, 'farmasi')} role={this.props.role} links={parent_links} register_number={this.props.register_number}/>:false}
                			{!this.props.is_rawat_inap?<CustomerInvoiceLinesContent list={list.jasa} edit_mode={this.props.edit_mode} product_list={this.props.product_list} uom_list={this.props.uom_list} status={this.props.status} payments={this.props.payments} subtotal={this.props.subtotal} paid={this.props.paid} changeInput={this.props.changeInput} inputBlur={this.props.inputBlur} service_name={this.props.service||"Jasa"} service="jasa" warehouse_list={this.props.warehouse_list} is_refund={this.props.is_refund} no_exchange={this.props.no_exchange} potongan={this.props.potongan} deleteRow={(index) => this.props.deleteRow(index, 'jasa')} role={this.props.role} links={parent_links} register_number={this.props.register_number}/>:false}
                			<CustomerInvoiceLinesContent list={list.instalasi_medis} edit_mode={this.props.edit_mode} product_list={this.props.product_list} uom_list={this.props.uom_list} status={this.props.status} payments={this.props.payments} subtotal={this.props.subtotal} paid={this.props.paid} changeInput={this.props.changeInput} inputBlur={this.props.inputBlur} service_name="Instalasi Medis" service="instalasi_medis" warehouse_list={this.props.warehouse_list} is_refund={this.props.is_refund} no_exchange={this.props.no_exchange} potongan={this.props.potongan} deleteRow={(index) => this.props.deleteRow(index, 'instalasi_medis')} role={this.props.role} links={parent_links} register_number={this.props.register_number}/>
                			{this.props.is_rawat_inap?rawat_inap_rows:false}
            				<CustomerInvoicePayment payment_method_list={this.props.payment_method_list} payments={this.props.payments} status={this.props.status} subtotal={this.props.subtotal} paid={this.props.paid} is_refund={this.props.is_refund} no_exchange={this.props.no_exchange} potongan={this.props.potongan} changeInput={this.props.changeInput} role={this.props.role} current_session={this.props.current_session}/>
                    	</div>
        } else {
            var children_customer_invoice_rows = []
            children_customer_invoice.forEach((c, index) => {
                var paid = 0
        
                if(c.customer_invoice.pembayaran.length != 0){
                    paid = c.customer_invoice.pembayaran.map(p => p.jumlah).reduce((a,b) => a+b, 0)
                }
                children_customer_invoice_rows.push(
                    <CustomerInvoiceLinesMultipleRow index={index.toString()} key={c.customer_invoice.name} name={c.customer_invoice.name} status={c.customer_invoice.status} is_rawat_inap={c.customer_invoice.is_rawat_inap} pet_name={c.customer_invoice.pet_name} list={c.customer_invoice.invoice_line} children_customer_invoice={c.customer_invoice.children_customer_invoice} edit_mode={th.props.edit_mode} no_exchange={c.customer_invoice.no_exchange} is_refund={c.customer_invoice.is_refund} product_list={th.props.product_list} uom_list={th.props.uom_list} status={c.customer_invoice.status} payments={c.customer_invoice.pembayaran} payment_method_list={th.props.payment_method_list} subtotal={c.customer_invoice.subtotal} paid={paid} changeInput={th.props.changeInput} inputBlur={th.props.inputBlur} warehouse_list={th.props.warehouse_list} potongan={c.customer_invoice.potongan} deleteRow={th.props.deleteRow} role={th.props.role} service={c.customer_invoice.service} is_rawat_inap={c.customer_invoice.is_rawat_inap} current_session={th.props.current_session} links={th.props.links} services={th.props.services} register_number={c.customer_invoice.register_number}/>
                )
            })
            
            var paid = 0
            var all_payment = []
            var children_name = []
            var subtotal = children_customer_invoice.reduce((total,a) => total+=a.customer_invoice.subtotal, 0)
            var total = children_customer_invoice.reduce((total,a) => total+=a.customer_invoice.total, 0)
            children_customer_invoice.forEach(ci => all_payment = all_payment.concat(ci.customer_invoice.pembayaran))
            children_customer_invoice.forEach(ci => children_name.push(ci.customer_invoice.name))
            if(all_payment.length != 0){
                paid = all_payment.map(p => p.jumlah).reduce((a,b) => a+=b, 0)
            }
            content = <div style={panel_style} className="p-4 mb-4">
                        {product_datalist}
                    	{warehouse_datalist}
                    	{children_customer_invoice_rows}
                    	<CustomerInvoicePayment payment_method_list={this.props.payment_method_list} payments={all_payment} status={this.props.status} subtotal={subtotal} paid={paid} is_refund={this.props.is_refund} no_exchange={this.props.no_exchange} potongan={this.props.potongan} changeInput={this.props.changeInput} role={this.props.role} current_session={this.props.current_session}/>
                    </div>
        }
    
        return (
            <div>
                <p className="fs18 fw600 text-dark mb-2">Invoice Lines</p>
            	{content}
            </div>
        )
    }
}

class CustomerInvoiceLinesMultipleRow extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            show_detail: false
        }
    }
    
    toggleShowDetail(){
        this.setState({show_detail: !this.state.show_detail})
    }
    
    goToDetail(){
        this.props.is_rawat_inap?
        window.location.href = "/main/kasir/rawat-inap-invoices/edit?n="+this.props.name:
        window.location.href = "/main/kasir/customer-invoices/edit?n="+this.props.name
    }
    
    render(){
        var th = this
        var list = this.props.list
        var rowStyle = {background: '#4698E3', color: '#FFF', padding: '15px 30px', borderRadius: 10}
        var rowStyle2 = {background: '#ECF6FF', borderRadius: 3}
        var cursor = {cursor: 'pointer'}
        var chevron_class
        this.state.show_detail?chevron_class="fa fa-chevron-up fs16":chevron_class="fa fa-chevron-down fs16"
        var total_qty = 0
        var total = 0
        Object.keys(list).forEach(k => {
            total_qty += list[k].filter(l => l.product && !l.deleted).reduce((total, a) => total += a.quantity, 0)
            total += list[k].filter(l => l.product && !l.deleted).reduce((total, a) => total += a.total, 0)
        })
        
        var links = this.props.links.find(l => l.name==th.props.name)
        var service = this.props.services.find(l => l.name==th.props.name)
        var rawat_inap_rows = []
        var date_groups = []
        list.rawat_inap.forEach(l => !date_groups.map(d => d.date).includes(moment(l.creation).subtract(tzOffset, 'minute').format("YYYY-MM-DD"))?date_groups.push({'date': moment(l.creation).subtract(tzOffset, 'minute').format("YYYY-MM-DD"), 'rows': []}):false)
        date_groups.forEach((d, index) => {
            list.rawat_inap.forEach(l => moment(l.creation).subtract(tzOffset, 'minute').format("YYYY-MM-DD") == d.date?d.rows.push(l):false)
            rawat_inap_rows.push(
                <CustomerInvoiceLinesContent key={index.toString()} list={d.rows} edit_mode={th.props.edit_mode} product_list={th.props.product_list} uom_list={th.props.uom_list} status={th.props.status} payments={th.props.payments} subtotal={th.props.subtotal} paid={th.props.paid} changeInput={th.props.changeInput} inputBlur={th.props.inputBlur} service_name={d.date} service="rawat_inap" warehouse_list={th.props.warehouse_list} is_refund={th.props.is_refund} no_exchange={th.props.no_exchange} potongan={th.props.potongan} deleteRow={(index) => th.props.deleteRow(index, 'rawat_inap')} role={th.props.role} links={links} register_number={th.props.register_number}/>
            )
        })
        
        
        return(
            <div className="row mb-1 mx-0">
                <div className="col-12 fs16 fw600" style={rowStyle}>
                    <div className="row">
                        <div className="col">
        					<span className="my-auto">{this.props.pet_name}<i className={this.props.status=='Draft'?"fa fa-pencil fs18 mx-2":"fa fa-external-link fs18 mx-2"} style={cursor} onClick={() => this.goToDetail()}/></span>
        				</div>
        				<div className="col-2 text-center"/>
        				<div className="col-1 text-center">
        					<span className="my-auto">{total_qty}</span>
        				</div>
        				<div className="col-1 text-center"/>
        				<div className="col-1 text-center"/>
        				<div className="col-1 text-center"/>
        				<div className="col-1 text-center">
        					<span className="my-auto">{total}</span>
        				</div>
        				<div className="col-1 text-center"><i style={cursor} className={chevron_class} onClick={() => this.toggleShowDetail()}/></div>
        			</div>
                </div>
                <div className={this.state.show_detail?'col-12 p-2':'col-12 p-2 d-none'} style={rowStyle2}>
                    <div className="row mx-0 fs14 fw600 row-header">
                		<div className="col">
                			<span className="my-auto">Product</span>
                		</div>
                		<div className="col-2 text-center">
                			<span className="my-auto">Warehouse</span>
                		</div>
                		<div className="col-1 text-center">
                			<span className="my-auto">Qty</span>
                		</div>
                		<div className="col-1 text-center">
                			<span className="my-auto">UOM</span>
                		</div>
                		<div className="col-1 text-center">
                			<span className="my-auto">Unit Price</span>
                		</div>
                		<div className="col-1 text-center">
                			<span className="my-auto">Disc %</span>
                		</div>
                		<div className="col-1 text-center">
                			<span className="my-auto">Amount</span>
                		</div>
                		<div className="col-1 text-center"></div>
                	</div>
                	{!this.props.is_rawat_inap?<CustomerInvoiceLinesContent list={list.farmasi} edit_mode={this.props.edit_mode} product_list={this.props.product_list} uom_list={this.props.uom_list} status={this.props.status} payments={this.props.payments} subtotal={this.props.subtotal} paid={this.props.paid} changeInput={this.props.changeInput} inputBlur={this.props.inputBlur} service_name="Farmasi" service="farmasi" warehouse_list={this.props.warehouse_list} is_refund={this.props.is_refund} no_exchange={this.props.no_exchange} potongan={this.props.potongan} deleteRow={(index) => this.props.deleteRow(index, 'farmasi')} role={this.props.role} links={links} register_number={this.props.register_number}/>:false}
                	{!this.props.is_rawat_inap?<CustomerInvoiceLinesContent list={list.jasa} edit_mode={this.props.edit_mode} product_list={this.props.product_list} uom_list={this.props.uom_list} status={this.props.status} payments={this.props.payments} subtotal={this.props.subtotal} paid={this.props.paid} changeInput={this.props.changeInput} inputBlur={this.props.inputBlur} service_name={service.service||"Jasa"} service="jasa" warehouse_list={this.props.warehouse_list} is_refund={this.props.is_refund} no_exchange={this.props.no_exchange} potongan={this.props.potongan} deleteRow={(index) => this.props.deleteRow(index, 'jasa')} role={this.props.role} links={links} register_number={this.props.register_number}/>:false}
                	<CustomerInvoiceLinesContent list={list.instalasi_medis} edit_mode={this.props.edit_mode} product_list={this.props.product_list} uom_list={this.props.uom_list} status={this.props.status} payments={this.props.payments} subtotal={this.props.subtotal} paid={this.props.paid} changeInput={this.props.changeInput} inputBlur={this.props.inputBlur} service_name="Instalasi Medis" service="instalasi_medis" warehouse_list={this.props.warehouse_list} is_refund={this.props.is_refund} no_exchange={this.props.no_exchange} potongan={this.props.potongan} deleteRow={(index) => this.props.deleteRow(index, 'instalasi_medis')} role={this.props.role} links={links} register_number={this.props.register_number}/>
                	{this.props.is_rawat_inap?rawat_inap_rows:false}
                </div>
            </div>
        )
    }
}

class CustomerInvoiceLinesContent extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            show_list: false
        }
    }
    
    toggleShowList(){
        this.setState({show_list: !this.state.show_list})
    }
    
    contentClick(){
        console.log('HAlo')
        var links = this.props.links.links
        var register_number = this.props.register_number
        if(this.props.service=='rawat_inap'){
            if(links.rawat_inap && links.rawat_inap.length > 1){
                window.location.href = '/main/dokter-dan-jasa/rawat-inap?register_number='+encodeURIComponent(register_number)
            } else if(links.rawat_inap && links.rawat_inap.length == 1) {
                window.location.href = '/main/dokter-dan-jasa/rawat-inap/edit?n='+encodeURIComponent(links.rawat_inap[0])
            }
        } else if (this.props.service=='jasa'){
            if(this.props.service_name=='Grooming'){
                console.log('Grooming')
                console.log(links)
                if(links.grooming && links.grooming.length > 1){
                    window.location.href = '/main/dokter-dan-jasa/grooming?register_number='+encodeURIComponent(register_number)
                } else if(links.grooming && links.grooming.length == 1){
                    window.location.href = '/main/dokter-dan-jasa/grooming/edit?n='+encodeURIComponent(links.grooming[0])
                }
            } else {
                if(links.dokter && links.dokter.length > 1){
                    window.location.href = '/main/dokter-dan-jasa/tindakan-dokter?register_number='+encodeURIComponent(register_number)
                } else if(links.dokter && links.dokter.length == 1){
                    window.location.href = '/main/dokter-dan-jasa/tindakan-dokter/edit?n='+encodeURIComponent(links.dokter[0])
                }
            }
        } else if (this.props.service=='farmasi') {
            if(links.apotik && links.apotik.length > 1){
                window.location.href = '/main/farmasi/apotik?register_number='+encodeURIComponent(register_number)
            } else if(links.apotik && links.apotik.length == 1){
                window.location.href = '/main/farmasi/apotik/edit?n='+encodeURIComponent(links.apotik[0])
            }
        } else if (this.props.service=='instalasi_medis') {
            if(links.instalasi_medis && links.instalasi_medis.length > 1){
                window.location.href = '/main/dokter-dan-jasa/instalasi-medis?register_number='+encodeURIComponent(register_number)
            } else if(links.instalasi_medis && links.instalasi_medis.length == 1){
                window.location.href = '/main/dokter-dan-jasa/instalasi-medis/edit?n='+encodeURIComponent(links.instalasi_medis[0])
            }
        }
    }
    
    render() {
        var list = this.props.list
        var rows = []
        var cursor = {cursor: 'pointer'}
        var bgStyle = {background: '#CEEDFF', color: '#1B577B'}
        var headerBgStyle = {color: '#056EAD', background: '#84D1FF', boxShadow: '0px 6px 23px rgba(0, 0, 0, 0.1)'}
        var total_service = 0
        var total_quantity = 0
        var chevron_class
        this.state.show_list?chevron_class="fa fa-chevron-up fs16":chevron_class="fa fa-chevron-down fs16"

        if(this.props.status && this.props.status != 'Draft'){
            console.log(this.props.status)
            list = list.sort((a, b) => moment(a.creation) < moment(b.creation)?-1:1)
        }
        
        var linkIcon = <img src="/static/img/main/menu/tautan.png" className="mx-2" onClick={() => this.contentClick()} style={cursor}/>
        
        if (list.length != 0){
            var sl = this
            var racikan = []
            
            list.forEach(l => !racikan.includes(l.racikan)?racikan.push(l.racikan):false)
            
            list.forEach(function(l, index){
                if (!l.deleted) {
                    if(l.apotik_obat_id != undefined && racikan.includes(l.apotik_obat_id)){
                        rows.push(
                            <CustomerInvoiceLinesRow edit_mode={false} index={index.toString()} product_list={sl.props.product_list} uom_list={sl.props.uom_list} key={index.toString()} item={l} status={sl.props.status} changeInput={e => sl.props.changeInput(e, index.toString(), sl.props.service)} inputBlur={sl.props.inputBlur} warehouse_list={sl.props.warehouse_list} service={sl.props.service} is_refund={sl.props.is_refund} deleteRow={() => sl.props.deleteRow(index)} role={sl.props.role} racikan_total={l.total + list.filter(lf => lf.racikan == l.apotik_obat_id).reduce((total, item) => total += item.total, 0)}/>
                        )
                    } else {
                        if (l.racikan!=undefined && racikan.includes(l.racikan)) {
                            rows.push(false)
                        } else {
                            rows.push(
                                <CustomerInvoiceLinesRow edit_mode={sl.props.edit_mode} index={index.toString()} product_list={sl.props.product_list} uom_list={sl.props.uom_list} key={index.toString()} item={l} status={sl.props.status} changeInput={e => sl.props.changeInput(e, index.toString(), sl.props.service)} inputBlur={sl.props.inputBlur} warehouse_list={sl.props.warehouse_list} service={sl.props.service} is_refund={sl.props.is_refund} deleteRow={() => sl.props.deleteRow(index)} role={sl.props.role}/>
                            )
                         }
                    }
                    if (l.total) {
                        total_service += l.total
                    }
                    if (l.quantity) {
                        total_quantity += l.quantity
                    }
                }
            })
            
        //     return (
        //         <div>
    	   //         <div className="row mx-0 fs12 fw600 row-header">
        // 				<div className="col">
        // 					<span className="my-auto">Product</span>
        // 				</div>
        // 				<div className="col-2 text-center">
        // 					<span className="my-auto">Warehouse</span>
        // 				</div>
        // 				<div className="col-1 text-center">
        // 					<span className="my-auto">Qty</span>
        // 				</div>
        // 				<div className="col-1 text-center">
        // 					<span className="my-auto">UOM</span>
        // 				</div>
        // 				<div className="col-1 text-center">
        // 					<span className="my-auto">Unit Price</span>
        // 				</div>
        // 				<div className="col-1 text-center">
        // 					<span className="my-auto">Disc</span>
        // 				</div>
        // 				<div className="col-1 text-center">
        // 					<span className="my-auto">Amount</span>
        // 				</div>
        // 				<div className="col-1 text-center"></div>
        // 			</div>
        // 			{rows}
        // 			<div className="row mx-0">
        //         		<div className="col row-list" style={bgStyle}>
        //         			<div className="row mx-0 fs12 fw600 justify-content-end">
        //         				<div className="col-2 text-center">
        //         					{formatter2.format(total_service || 0)}
        //         				</div>
        //         			</div>
        //         		</div>
        //         	</div>
        //         </div>
        //     )
            return (
                <div className="mb-1">
    	            <div style={headerBgStyle} className="row mx-0 fs14 fw600 row-header">
        				<div className="col">
        					<span className="my-auto">{this.props.service_name}</span>{linkIcon}
        				</div>
        				<div className="col-2 text-center"/>
        				<div className="col-1 text-center">
        					<span className="my-auto">{total_quantity}</span>
        				</div>
        				<div className="col-1 text-center"/>
        				<div className="col-1 text-center"/>
        				<div className="col-1 text-center"/>
        				<div className="col-1 text-center">
        					<span className="my-auto">{formatter2.format(total_service || 0)}</span>
        				</div>
        				<div className="col-1 text-center"><i style={cursor} className={chevron_class} onClick={() => this.toggleShowList()}/></div>
        			</div>
        			{this.state.show_list?rows:false}
                </div>
            )
        } else {
            // return(
            //     <div className="row justify-content-center" key='0'>
            //         <div className="col text-center py-4">
            //             <p className="mb-0 fs24md fs16 fw600 text-muted">
            //                 <span>Tidak ada item</span>
            //             </p>
            //         </div>
            //     </div>
            // )
            return (
                <div className="mb-1">
    	            <div style={headerBgStyle} className="row mx-0 fs14 fw600 row-header">
        				<div className="col">
        					<span className="my-auto">{this.props.service_name}</span>{linkIcon}
        				</div>
        				<div className="col-2 text-center"/>
        				<div className="col-1 text-center"/>
        				<div className="col-1 text-center"/>
        				<div className="col-1 text-center"/>
        				<div className="col-1 text-center"/>
        				<div className="col-1 text-center"/>
        				<div className="col-1 text-center"><i style={cursor} className={chevron_class} onClick={() => this.toggleShowList()}/></div>
        			</div>
        			{this.state.show_list?(
        			<div className="row justify-content-center" key='0'>
                        <div className="col text-center py-4">
                            <p className="mb-0 fs24md fs16 fw600 text-muted">
                                <span>Tidak ada item</span>
                            </p>
                        </div>
                    </div>):
        			false}
                </div>
            )
        }
    }
}

class CustomerInvoiceLinesRow extends React.Component {
    render() {
        var bgStyle = {background: '#F5FBFF'}
        var item = this.props.item
        var index = this.props.index
        var status = this.props.status
        var uom_list = this.props.uom_list
        var is_refund = this.props.is_refund
        var required = false
        if(Object.keys(item).filter(n => !['product', 'product_name'].includes(n)).length != 0){
            required = true
        }
        var product = <span className="my-auto">{item.product_name?item.product_name.replace(/&lt;/,'<').replace(/&gt;/,'>'):item.product}</span>
        var quantity = <span className="my-auto">{item.quantity}</span>
        var uom = <span className="my-auto">{item.uom_name||item.product_uom}</span>
        var unit_price = <span className="my-auto">{this.props.racikan_total || item.unit_price}</span>
        var total = <span className="my-auto">{formatter2.format(this.props.racikan_total || item.total || 0)}</span>
        var warehouse = <span className="my-auto">{item.warehouse_name||item.warehouse}</span>
        var deleteButton
        
        var stockable, is_operasi
        var current_product = this.props.product_list.find(p => p.name == item.product)
        if(current_product){
            stockable = current_product.stockable
            is_operasi = current_product.is_operasi
        }
        
        var product_style = {}
        if(item.quantity_in_warehouse < 0 || item.quantity_in_warehouse - item.quantity < 0){
            product_style = {color: '#FF0000'}
        } else if(item.quantity_in_warehouse == 0 || item.quantity_in_warehouse - item.quantity == 0) {
            product_style = {color: '#F0BC00'}
        }
        
        var discount = <span className="my-auto">{item.discount}</span>
        // if(id == undefined || (status == 'Draft' && this.props.edit_mode && !is_refund) || this.props.role == 'Master'){
        if(id == undefined || (status == 'Draft' && this.props.edit_mode && !is_refund)){
            product = <input required={required} autoComplete="off" placeholder="Product" name='product' list="product_list" id="product" style={Object.assign(product_style, bgStyle)} className="form-control border-0 fs14 fw600 p-0 h-auto" onChange={this.props.changeInput} onBlur={e => this.props.inputBlur(e, this.props.product_list, index, this.props.service)} value={item.product_name||item.product||''}/>
            quantity = <input required={required} autoComplete="off" placeholder="0" name='quantity' id="quantity" style={bgStyle} className="form-control border-0 fs14 fw600 p-0 h-auto text-center" onChange={this.props.changeInput} value={item.quantity||''}/>
            if (stockable) {
                warehouse = <input required={required} autoComplete="off" placeholder="Warehouse" name='warehouse' list="warehouse_list" id="warehouse" style={bgStyle} className="form-control border-0 fs14 fw600 p-0 h-auto" onChange={this.props.changeInput} onBlur={e => this.props.inputBlur(e, this.props.warehouse_list, index, this.props.service)} defaultValue={item.warehouse_name||item.warehouse||''}/>
            }
            // if (is_operasi) {
            //     unit_price = <input required={required} autoComplete="off" placeholder="0" name='unit_price' id="unit_price" style={bgStyle} className="form-control border-0 fs14 fw600 p-0 h-auto text-center" onChange={this.props.changeInput} defaultValue={item.unit_price||''}/>
            // }
            unit_price = <input required={required} autoComplete="off" placeholder="0" name='unit_price' id="unit_price" style={bgStyle} className="form-control border-0 fs14 fw600 p-0 h-auto text-center" onChange={this.props.changeInput} defaultValue={item.unit_price||''}/>
            discount = <input placeholder="0" name='discount' id="discount" style={bgStyle} className="form-control border-0 fs14 fw600 p-0 h-auto text-center" onChange={this.props.changeInput} value={item.discount||''}/>
            
            if (item.product && item.quantity) {
                var cursor = {cursor: 'pointer'}
                deleteButton = <i className="fa fa-trash" style={cursor} onClick={this.props.deleteRow}/>
            }
        } else if (is_refund) {
            quantity = <input required={required} autoComplete="off" placeholder="0" name='quantity' id="quantity" style={bgStyle} className="form-control border-0 fs14 fw600 p-0 h-auto text-center" onChange={this.props.changeInput} defaultValue={item.quantity||''}/>
            discount = <input placeholder="0" name='discount' id="discount" style={bgStyle} className="form-control border-0 fs14 fw600 p-0 h-auto text-center" onChange={this.props.changeInput} defaultValue={item.discount||''}/>
        }
        console.log('row')
        console.log(item.quantity_in_warehouse)
        return(
            <div className="row mx-0">
        		<div className="col row-list" style={bgStyle}>
        			<div className="row mx-0 fs14 fw600">
        				<div className="col">
        					{product}
        				</div>
        				<div className="col-2 text-center">
        					{warehouse}
        				</div>
        				<div className="col-1 text-center">
        					{quantity}
        				</div>
        				<div className="col-1 text-center">
        					{uom}
        				</div>
        				<div className="col-1 text-center">
        					{unit_price}
        				</div>
        				<div className="col-1 text-center">
        					{discount}
        				</div>
        				<div className="col-1 text-center">
        					{total}
        				</div>
        				<div className="col-1 text-center">
        					{deleteButton}
        				</div>
        			</div>
        		</div>
        	</div>
        )
    }
}

class CustomerInvoicePayment extends React.Component {
    render(){
        var th = this
        var lineStyle = {'border': '1px solid #1B577B'}
        var paidStyle = {'color': '#126930'}
        var refundStyle = {'color': '#691212'}
        var fontStyle = {'color': '#1B577B'}
        var payment_rows = []
        var payments = this.props.payments
        var tax = 0
        var payment_list
        var paid = this.props.paid
        
        if(payments.length != 0){
            payments.forEach(p => payment_rows.push(<CustomerInvoicePaymentRow payment_method_list={th.props.payment_method_list} item={p} key={p.name} current_session={th.props.current_session}/>))
            payment_list = (
                <div className="col-5 mr-auto px-0">
			        <div className="row mx-0 fs14 fw600 row-header mb-2">
        				<div className="col text-center">
        					<span className="my-auto">POS Session</span>
        				</div>
        				<div className="col text-center">
        					<span className="my-auto">Tanggal</span>
        				</div>
        				<div className="col text-center">
        					<span className="my-auto">Metode Pembayaran</span>
        				</div>
        				<div className="col text-center">
        					<span className="my-auto">Jumlah Bayar</span>
        				</div>
        			</div>
        			{payment_rows}
			    </div>
			)
        }
        
        var remaining = (this.props.subtotal - (this.props.potongan||0)) - paid
        if (this.props.is_refund) {
            var paidRow = <div className="row text-left mb-2" style={refundStyle}>
			            <div className="col-4">Refund</div>
                        <div className="col-auto px-0">:</div>
                        <div className="col-2 text-right">Rp</div>
                        <div className="col text-right">{formatter2.format(paid)}</div>
			        </div>
        } else {
            var paidRow = <div className="row text-left mb-2" style={paidStyle}>
			            <div className="col-4">Paid</div>
                        <div className="col-auto px-0">:</div>
                        <div className="col-2 text-right">Rp</div>
                        <div className="col text-right">{formatter2.format(paid)}</div>
			        </div>
        }
        
    	var remainingRow = <div className="row text-left mb-2">
        			            <div className="col-4">{remaining < 0 ? 'Exchange' : 'Remaining'}</div>
                                <div className="col-auto px-0">:</div>
                                <div className="col-2 text-right">Rp</div>
                                <div className="col text-right">{formatter2.format(remaining > 0 ? remaining : this.props.no_exchange == 1 ? 0 : -remaining)}</div>
        			        </div>
        			        
        var potongan
        if (this.props.status == 'Draft' || id == undefined || this.props.role == 'Master') {
            potongan = <input type="text" name="potongan" id="potongan" placeholder="0" autoComplete="off" className="form-control fs14 fw600 text-right border-0 p-0" style={paidStyle} onChange={e => this.props.changeInput(e)} defaultValue={this.props.potongan || ''}/>
        } else {
            potongan = <span>{formatter2.format(this.props.potongan || 0)}</span>
        }
        
        return(
            <div className="row flex-row-reverse mx-0 fs14 fw600 mt-4 mb-2" style={fontStyle}>
			    <div className="col-4">
			        <div className="row text-left mb-2">
			            <div className="col-4">Sub Total</div>
                        <div className="col-auto px-0">:</div>
                        <div className="col-2 text-right">Rp</div>
                        <div className="col text-right">{formatter2.format(this.props.subtotal)}</div>
			        </div>
			        <div className="row text-left mb-2">
			            <div className="col-4">Tax</div>
                        <div className="col-auto px-0">:</div>
                        <div className="col-2 text-right">Rp</div>
                        <div className="col text-right">{formatter2.format(tax)}</div>
			        </div>
			        <div className="row text-left mb-2">
			            <div className="col-4">Potongan</div>
                        <div className="col-auto px-0">:</div>
                        <div className="col-2 text-right">Rp</div>
                        <div className="col text-right">
                            {potongan}
                        </div>
			        </div>
			        <hr style={lineStyle} className="mb-2" />
			        <div className="row text-left mb-2 fs20 fw600 mb-4">
			            <div className="col-4">Total</div>
                        <div className="col-auto px-0">:</div>
                        <div className="col-2 text-right">Rp</div>
                        <div className="col text-right">{formatter2.format(this.props.subtotal + (tax||0) - (this.props.potongan||0))}</div>
			        </div>
			        {paidRow}
			        {remainingRow}
			    </div>
			    {payment_list}
			</div>
        )
    }
}

class CustomerInvoicePaymentRow extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            payment_method: this.props.item.metode_pembayaran,
            edit_mode: false,
            current_session: this.props.current_session || false,
        }
    }
    
    toggleEditMode(){
        if(!this.state.edit_mode && this.state.current_session.status != 'In Progress'){
            frappe.msgprint('POS Session Sudah di tutup')
        } else {
            this.setState({edit_mode: !this.state.edit_mode})
        }
    }
    
    changePaymentMethod(e){
        var value = e.target.value
        this.setState({payment_method: value})
    }
    
    editPayment(){
        var th = this
        frappe.call({
            type: 'POST',
            method: 'vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.edit_payment',
            args: {name: this.props.item.name, method: this.state.payment_method},
            callback: function(r){
                if(r.message.error){
                    th.setState({payment_method: th.props.item.metode_pembayaran})
                    if(r.message.current_session){
                        th.setState({current_session: r.message.current_session})
                    }
                    frappe.msgprint(r.message.error)
                } else if (r.message.success){
                    th.setState({edit_mode: false})
                }
            }
        })
    }
    
    
    render() {
        var th = this
        var bgStyle = {background: '#F5FBFF'}
        var cursor = {cursor: 'pointer'}
        var item = this.props.item
        var payment_method = item.metode_pembayaran
        var payment_method_find = this.props.payment_method_list.find(p => p.name == th.state.payment_method)
        payment_method_find?payment_method=payment_method_find.method_name:false
        
        var payment_field, edit_button
        if(this.state.edit_mode){
            var payment_method_options = []
            this.props.payment_method_list.forEach(p => p.name!='Deposit'||p.method_type!='Deposit'?payment_method_options.push(<option key={p.name} value={p.name}>{p.method_name}</option>):false)
            payment_field = <select name="payment_method" className="form-control fs14 p-0 h-auto" value={this.state.payment_method} onChange={e => this.changePaymentMethod(e)}>
                {payment_method_options}
            </select>
            edit_button = <i className="fa fa-floppy-o ml-2" style={cursor} onClick={() => this.editPayment()}/>
        } else if (th.state.payment_method != 'Deposit' && th.state.current_session.name == item.pos_session){
            payment_field = <span>{payment_method || ''}</span>
            edit_button = <i className="fa fa-pencil ml-2" style={cursor} onClick={() => this.toggleEditMode()}/>
        } else {
            payment_field = <span>{payment_method || ''}</span>
        }
        
        return(
            <div className="row mx-0">
        		<div className="col row-list" style={bgStyle}>
        			<div className="row mx-0 fs14 fw600">
        				<div className="col text-center">
        					<span>{item.pos_session || ''}</span>
        				</div>
        				<div className="col text-center">
        					<span>{moment(item.tanggal).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss") || ''}</span>
        				</div>
        				<div className="col text-center">
        				    <div className="row">
        				        <div className="col-9">
        				            {payment_field}
        				        </div>
        				        <div className="col-3 text-center">
        				            {edit_button}
        				        </div>
        				    </div>
        				</div>
        				<div className="col text-center">
        					<span>{formatter2.format(item.jumlah-(item.exchange||0)) || ''}</span>
        				</div>
        			</div>
        		</div>
        	</div>
        )
    }
}

class PopupPay extends React.Component {
    constructor(props) {
        super(props)
        this.state={
            'data': {'name': this.props.name}
        }
        
        this.handleInputChange = this.handleInputChange.bind(this)
        this.submitPay = this.submitPay.bind(this)
    }
    
    componentDidMount(){
        console.log(this.props.paid)
        if(this.props.total != undefined && this.props.paid != undefined){
            var remaining = this.props.total - this.props.paid
            var new_data = Object.assign({}, this.state.data)
            new_data.jumlah = remaining.toLocaleString('id-ID')
            this.setState({'data': new_data})
        }
    }
    
    handleInputChange(e) {
        var name = e.target.name
        var value = e.target.value
        var new_data = this.state.data
        if(name == 'jumlah' && value != ''){
            console.log(value)
            var filtered = value.replace(/(?!,)\D/g,'').replace(/,$/g,'.01').replace(',','.')
            console.log(filtered)
            if(filtered != ''){
                var formatted = parseFloat(filtered).toLocaleString('id-ID')
                console.log(formatted)
                new_data.jumlah = formatted
            }
        }
        else {
            new_data[name] = value
        }
        this.setState({data: new_data})
    }
    
    setPaymentMethod(value){
        var new_data = Object.assign({}, this.state.data)
        new_data.payment_method = value
        this.setState({data: new_data})
    }
    
    submitPay(e) {
        e.preventDefault()
        var th = this
        var subtotal = 0
        var paid = 0
        var remaining = 0
        remaining = this.props.total - this.props.paid
        if(['',undefined,null].includes(this.state.data.jumlah)){
            var new_data = Object.assign({}, this.state.data)
            new_data.jumlah = parseInt(remaining).toLocaleString('id-ID')
            this.setState({'data': new_data})
        }
        else if (this.state.data.payment_method != undefined){
            var method = "vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.add_payment"
            var new_data = Object.assign({}, this.state.data)
            new_data.jumlah = parseFloat(new_data.jumlah.replace(/(?!,)\D/g,'').replace(/,$/g,'').replace(',','.'))
            typeof new_data.name == 'object'?method = "vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.add_payment_multiple":false
            if(new_data.payment_method=='Deposit'&&new_data.jumlah>this.props.total_credit){
                frappe.msgprint('Nominal melebihi deposit, jumlah deposit tersedia '+formatter.format(this.props.total_credit))
            } else {
                frappe.call({
                    type: "POST",
                    method:method,
                    args: {data: new_data},
                    freeze: true,
                    callback: function(r){
                        if (r.message) {
                            if(typeof new_data.name == 'object'){
                                if (r.message.length > 0) {
                                    var results = []
                                    r.message.forEach(m => {
                                        console.log(m)
                                        if (m.error){
                                            frappe.msgprint(m.error)
                                            results.push(false)
                                        } else if (m.name){
                                            results.push(true)
                                        }
                                    })
                                    if(results.every(e => e)){
                                        window.location.reload()
                                    } else {
                                        th.props.getFormData()
                                    }
                                } else if (r.message.error){
                                    frappe.msgprint(r.message.error)
                                }
                            } else {
                                if(r.message.error){
                                    frappe.msgprint(r.message.error)
                                } else {
                                    window.location.reload()
                                }
                            }
                        }
                    }
                });
            }
        }
    }
    
    render() {
        var th = this
        var maxwidth = {maxWidth: '480px', paddingTop: '100px'}
        var colorStyle = {color: '#056EAD'}
        var inputStyle = {background: '#CEEDFF'}
        var payStyle = {background: '#056EAD', color: '#FFFFFF'}
        var batalStyle = {color: '#056EAD', border: '1px solid #056EAD'}
        // var credit_display
        // if(this.props.total_credit < 0){
        //     var image_style = {width: 24, height: 24, marginRight: 14}
        //     credit_display = <div className="text-center fs20 fw600"><img src="/static/img/main/menu/credit.png" style={image_style}/>{formatter.format(this.props.total_credit)}</div>
        // }
        var pm_buttons = []
        this.props.payment_method_list.forEach(pm => {
            var detail
            var iconStyle = {maxWidth: 36, maxHeight: 36}
            
            if(th.state.data.payment_method != pm.method_name){
                iconStyle.filter = "saturate(40000%) hue-rotate(110deg) brightness(75%)"
            }
            
            if(pm.method_type == 'Cash'){
                detail = (
                <div className="row mx-n1">
                    <div className="col-auto px-1 d-flex">
                        <img src="/static/img/main/menu/method-cash.png" style={iconStyle} className="m-auto"/>
                    </div>
                    <div className="col px-1 d-flex">
                        <span className="m-auto">{pm.method_name}</span>
                    </div>
                </div>
                )
            } else if(pm.method_type == 'Card'){
                detail = (
                <div className="row mx-n1">
                    <div className="col-auto px-1 d-flex">
                        <img src="/static/img/main/menu/method-card.png" style={iconStyle} className="m-auto"/>
                    </div>
                    <div className="col px-1 d-flex">
                        <span className="m-auto">{pm.method_name}</span>
                    </div>
                </div>
                )
            } else if((pm.method_type == 'Deposit Customer' || pm.method_type == 'Deposit Supplier') && this.props.total_credit > 0){
                detail = (
                <div className="row mx-n1">
                    <div className="col-auto px-1 d-flex">
                        <img src="/static/img/main/menu/method-deposit.png" style={iconStyle} className="m-auto"/>
                    </div>
                    <div className="col px-1">
                        {pm.method_name}<br/>{formatter.format(this.props.total_credit)}
                    </div>
                </div>
                )
            } else {
                return;
            }
            pm_buttons.push(<div key={pm.name} className="col-6 px-1 pb-2"><button type="button" style={th.state.data.payment_method == pm.name?payStyle:batalStyle} className="btn btn-block p-3 h-100 text-truncate fs12" onClick={() => th.setPaymentMethod(pm.name)}>{detail}</button></div>)
        })
        
        return (
                <div className="menu-popup">
                    <div className="container" style={maxwidth}>
                        <div className="bg-white p-4">
                            <div className="text-center fs20 fw600 mb-4" style={colorStyle}>
                            PEMBAYARAN
                            </div>
                            <div className="row mx-n1 my-3">
                                {pm_buttons}
                            </div>
                            <div className="form-group">
                                <span className="fs14 fw600 mb-2">Nominal</span>
                                <input required name='jumlah' id="jumlah" className="form-control border-0 fs22 fw600 mb-4" onChange={this.handleInputChange} value={this.state.data.jumlah||''} style={inputStyle}/>
                            </div>
                            <div className="row justify-content-center mb-2">
                                <div className="col-auto d-flex mt-4">
                                    <button className="btn btn-sm fs18 h-100 fwbold px-4" style={payStyle} onClick={this.submitPay}>Pay</button>
                                </div>
                                <div className="col-auto d-flex mt-4">
                                    <button className="btn btn-sm fs18 h-100 fwbold px-4" style={batalStyle} onClick={this.props.togglePopupPay}>Batal</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="menu-popup-close" onClick={this.props.togglePopupPay}></div>
                </div>
            )
    }
}

class PopupRefund extends React.Component {
    constructor(props) {
        super(props)
        this.state={
            'data': {'name': this.props.name, 'invoice_line': this.props.invoice_line}
        }
        
        this.handleInputChange = this.handleInputChange.bind(this)
        this.submitRefund = this.submitRefund.bind(this)
    }
    
    componentDidMount(){
        if(this.props.total != undefined && this.props.paid != undefined){
            var remaining = this.props.total - this.props.paid
            var new_data = Object.assign({}, this.state.data)
            new_data.refund = remaining.toLocaleString('id-ID')
            this.setState({'data': new_data})
        }
    }
    
    handleInputChange(e) {
        var name = e.target.name
        var value = e.target.value
        var new_data = this.state.data
        if(name == 'refund' && value != ''){
            var filtered = value.replace(/\D/g,'')
            if(filtered != ''){
                var formatted = parseInt(filtered).toLocaleString('id-ID')
                new_data.refund = formatted
            }
        }
        else {
            new_data[name] = value
        }
        this.setState({data: new_data})
    }
    
    
    setPaymentMethod(value){
        var new_data = Object.assign({}, this.state.data)
        new_data.payment_method = value
        this.setState({data: new_data})
    }
    
    submitRefund(e) {
        e.preventDefault()
        var remaining = 0
        
        remaining = this.props.total - this.props.paid
        if(['',undefined,null].includes(this.state.data.refund)){
            var new_data = Object.assign({}, this.state.data)
            new_data.refund = parseInt(remaining).toLocaleString('id-ID')
            this.setState({'data': new_data})
        }
        else if (this.state.data.refund.replace(/\D/g,'') > remaining) {
            frappe.msgprint('Hanya ada sisa ' + formatter.format(remaining))
        } else if (this.state.data.payment_method != undefined) {
            var new_data = this.state.data
            var invoice_line = new_data.invoice_line.farmasi.concat(new_data.invoice_line.jasa).concat(new_data.invoice_line.rawat_inap).concat(new_data.invoice_line.instalasi_medis)
            new_data.refund = parseInt(new_data.refund.replace(/\D/g,''))
        
            new_data.invoice_line = invoice_line.filter(i => i.product && i.quantity)
            new_data.invoice_line.forEach(function(item, index) {
                if (item.quantity == '0' || item.quantity == 0) {
                    item.is_delete = true
                }
            })
            
            console.log(new_data)
            
            frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.submit_refund",
                freeze: true,
                args: {data: new_data},
                callback: function(r){
                    if (r.message) {
                        console.log(r.message)
                        window.location.reload()
                    }
                }
            });
        }
    }
    
    render() {
        var th = this
        var maxwidth = {maxWidth: '480px', paddingTop: '100px'}
        var colorStyle = {color: '#AD0505'}
        var inputStyle = {background: '#FFCECE'}
        var refundStyle = {background: '#AD0505', color: '#FFFFFF'}
        var batalStyle = {color: '#AD0505', border: '1px solid #AD0505'}
        var payStyle = {background: '#AD0505', color: '#FFFFFF'}
        
        var pm_buttons = []
        this.props.payment_method_list.forEach(pm => {
            var detail
            var iconStyle = {maxWidth: 36, maxHeight: 36}
            
            if(th.state.data.payment_method != pm.method_name){
                iconStyle.filter = "saturate(40000%) hue-rotate(240deg) brightness(75%)"
            }
            
            if(pm.method_type == 'Cash'){
                detail = (
                <div className="row mx-n1">
                    <div className="col-auto px-1 d-flex">
                        <img src="/static/img/main/menu/method-cash.png" style={iconStyle} className="m-auto"/>
                    </div>
                    <div className="col px-1 d-flex">
                        <span className="m-auto">{pm.method_name}</span>
                    </div>
                </div>
                )
            } else if(pm.method_type == 'Card'){
                detail = (
                <div className="row mx-n1">
                    <div className="col-auto px-1 d-flex">
                        <img src="/static/img/main/menu/method-card.png" style={iconStyle} className="m-auto"/>
                    </div>
                    <div className="col px-1 d-flex">
                        <span className="m-auto">{pm.method_name}</span>
                    </div>
                </div>
                )
            } else if((pm.method_type == 'Deposit Customer' || pm.method_type == 'Deposit Supplier') && this.props.total_credit > 0){
                detail = (
                <div className="row mx-n1">
                    <div className="col-auto px-1 d-flex">
                        <img src="/static/img/main/menu/method-deposit.png" style={iconStyle} className="m-auto"/>
                    </div>
                    <div className="col px-1">
                        {pm.method_name}<br/>{formatter.format(this.props.total_credit)}
                    </div>
                </div>
                )
            } else {
                return;
            }
            pm_buttons.push(<div key={pm.name} className="col-6 px-1 pb-2"><button type="button" style={th.state.data.payment_method == pm.name? payStyle :batalStyle} className="btn btn-block p-3 h-100 text-truncate fs12" onClick={() => th.setPaymentMethod(pm.name)}>{detail}</button></div>)
        })
        
        return (
                <div className="menu-popup">
                    <div className="container" style={maxwidth}>
                        <div className="bg-white p-4">
                            <div className="text-center fs20 fw600 mb-4" style={colorStyle}>
                                REFUND
                            </div>
                            <div className="row mx-n1 my-3">
                                {pm_buttons}
                            </div>
                            <div className="form-group">
                                <span className="fs14 fw600 mb-2">Jumlah</span>
                                <input required name='refund' id="refund" className="form-control border-0 fs22 fw600 mb-4" onChange={this.handleInputChange} value={this.state.data.refund||''} style={inputStyle}/>
                            </div>
                            <div className="row justify-content-center mb-2">
                                <div className="col-auto d-flex mt-4">
                                    <button className="btn btn-sm fs18 h-100 fwbold px-4" style={refundStyle} onClick={this.submitRefund}>Refund</button>
                                </div>
                                <div className="col-auto d-flex mt-4">
                                    <button className="btn btn-sm fs18 h-100 fwbold px-4" style={batalStyle} onClick={this.props.togglePopupRefund}>Batal</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="menu-popup-close" onClick={this.props.togglePopupRefund}></div>
                </div>
            )
    }
}

class CustomerInvoiceVersion extends React.Component {
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

document.getElementById('customer_invoice_form')?ReactDOM.render(<CustomerInvoice/>, document.getElementById('customer_invoice_form')):false
