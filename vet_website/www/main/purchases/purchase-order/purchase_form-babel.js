var id = getUrlParameter('n')

class PurchaseOrder extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'loaded': false,
            'data': {},
            'show_popup_pay': false,
            'show_popup_refund': false,
            'show_receive': false,
            'edit_mode': false,
            'currentUser': {}
        }
        
        this.handleInputChange = this.handleInputChange.bind(this)
        this.handleInputBlur = this.handleInputBlur.bind(this)
        this.formSubmit = this.formSubmit.bind(this)
        this.togglePopupPay = this.togglePopupPay.bind(this)
        this.togglePopupRefund = this.togglePopupRefund.bind(this)
        this.togglePopupRetur = this.togglePopupRetur.bind(this)
        this.deleteRow = this.deleteRow.bind(this)
        this.refundPurchase = this.refundPurchase.bind(this)
        this.returPurchase = this.returPurchase.bind(this)
        this.navigationAction = this.navigationAction.bind(this)
        this.toggleEditMode = this.toggleEditMode.bind(this)
    }
    
    componentDidMount() {
        var lastfilter = JSON.parse(sessionStorage.getItem('/main/purchases/purchase-order'))
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
            method:"vet_website.vet_website.doctype.vetpurchase.vetpurchase.get_name_list",
            args: {filters: lastfilter},
            callback: function(r){
                if (r.message) {
                    gr.setState({'namelist': r.message});
                }
            }
        })
        this.getData()
    }
    
    getData(){
        var gr = this
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetpurchase.vetpurchase.get_purchase",
            args: {name: id},
            callback: function(r){
                if (r.message) {
                    var edit_mode = false
                    console.log(r.message);
                    if (['Draft', 'RFQ'].includes(r.message.purchase_order.status || 'Draft') && !r.message.purchase_order.is_refund) {
                        if (r.message.purchase_order.status == 'Draft' || !r.message.purchase_order.status) {
                            var moment_date = moment()
                            r.message.purchase_order.order_date = moment_date.format('YYYY-MM-DD')
                            edit_mode = true
                            
                        }
                        if(!id){
                            r.message.purchase_order.products.push({default: true})
                        } else {
                            r.message.purchase_order.products.push({})
                        }
                    } 
                    if (r.message.purchase_order.is_refund) {
                        r.message.purchase_order.products.forEach(function(item, index) {
                            item.quantity_default = item.quantity
                        })
                    }
                    gr.setState({'data': r.message.purchase_order, 'gudang': r.message.gudang, 'supplier': r.message.supplier, 'productAll': r.message.productAll, 'loaded': true, 'uomAll': r.message.uomAll, 'payment_method_list': r.message.payment_method_list, 'edit_mode': edit_mode});
                    
                    frappe.call({
                        type: "GET",
                        method:"vet_website.vet_website.doctype.vetpurchase.vetpurchase.get_purchase_after_loading",
                        args: {},
                        callback: function(r){
                            if (r.message) {
                                console.log('products loaded');
                                console.log(r.message);
                                gr.setState({'gudang': r.message.gudang, 'supplier': r.message.supplier, 'productAll': r.message.productAll, 'loaded': true, 'uomAll': r.message.uomAll, 'payment_method_list': r.message.payment_method_list});
                            }
                        }
                    });
                }
            }
        });
        
        
    }
    
    formSubmit(e, saveOnly=false) {
        e.preventDefault()
        var new_data = this.state.data
        var list_product = []
        var selected_gudang = this.state.gudang.find(i => i.gudang_name == new_data.deliver_to)
        var selected_supplier = this.state.supplier.find(i => i.supplier_name == new_data.supplier)
        var th = this
        
        console.log(new_data)
        new_data.products.forEach(function(item, index) {
            console.log(item)
            var products = {}
            
            var realValueProduct = th.state.productAll.find(i => i.product_name == item.product)
            var realValueUom = th.state.uomAll.find(i => i.uom_name == item.uom)
            
            if (item.product && item.quantity) {
                products['product'] = realValueProduct.name
                products['quantity'] = parseFloat(th.reverseFormatNumber(String(item.quantity || 0), 'id'))
                products['uom'] = realValueUom.name
                products['price'] = parseFloat(th.reverseFormatNumber(String(item.price || 0), 'id'))
                products['name'] = item.name
                products['discount'] = parseFloat(th.reverseFormatNumber(String(item.discount || 0), 'id'))
                if(item.delete){
                    products['delete'] = item.delete
                }
                
                list_product.push(products)
            }
        })
        
        new_data.products = list_product
        
        if (!new_data.status || new_data.status == 'Draft') {
            new_data.deliver_to = selected_gudang.name
            new_data.supplier = selected_supplier.name
        }
        
        console.log(new_data)
        var args = {data: new_data}
        saveOnly?args.saveOnly = true:false
        
        // frappe.call({
    	// 	type: "POST",
    	// 	method:"vet_website.vet_website.doctype.vetpurchase.vetpurchase.confirm_purchase",
    	// 	args: args,
    	// 	callback: function(r){
    	// 		if (r.message.purchase) {
    	// 		    if (saveOnly){
    	// 		        th.getData()
    	// 		     //   th.setState({'edit_mode': false})
    	// 		    } else {
    	// 		        window.location.href = "/main/purchases/purchase-order/edit?n=" + r.message.purchase.name
    	// 		    }
    	// 		}
    	// 		if (r.message.error) {
    	// 			frappe.msgprint(r.message.error);
    	// 		}
    	// 	}
    	// });
    }
    
    navigationAction(name){
        window.location.href="/main/purchases/purchase-order/edit?n="+name
    }
    
    toggleReceive(e) {
        e.preventDefault()
        this.setState({show_receive: !this.state.show_receive})
    }
    
    toggleEditMode(e){
        e.preventDefault()
        var new_data = this.state.data

        if (this.state.edit) {
            new_data.products.forEach((e, index) => {
                // e.debit = parseFloat(String(e.debit || '0').replace(/(?!)\D/g,'').replace(/,$/g,'').replace(',','.'))
                // e.credit = parseFloat(String(e.credit || '0').replace(/(?!)\D/g,'').replace(/,$/g,'').replace(',','.'))
                e.quantity = parseFloat(this.reverseFormatNumber(String(e.quantity || 0), 'id'))
                e.price = parseFloat(this.reverseFormatNumber(String(e.price || 0), 'id'))
                e.discount = parseFloat(this.reverseFormatNumber(String(e.discount || 0), 'id'))
            })
                
            this.setState({edit_mode: false, data: new_data})
        } else {
            new_data.products.forEach((e, index) => {
                e.quantity = formatter2.format(e.quantity || 0)
                e.price = formatter2.format(e.price || 0)
                e.discount = formatter2.format(e.discount || 0)
            })
            console.log(new_data.products)
            this.setState({edit_mode: true, data: new_data})
        }
    }
    
    handleInputChange(e, i=false) {
    	const value = e.target.value
    	const name = e.target.name
    	var new_data = this.state.data
    	
	    if (['quantity', 'price', 'discount'].includes(name)) {
	        var empty = new_data.products.filter(p => Object.keys(p).length == 0)
	        console.log(empty)

            if (new RegExp(/,$/g).test(value)) {
                if (empty.length < 1 && !new_data.is_refund) {
                    new_data.products.push({})
                }

                new_data.products[i][name] = value
	            this.setState({data: new_data})
            } else {
                // var filtered = value.replace(/(?!)\D/g,'').replace(/,$/g,'.01').replace(',','.')
                var filtered = this.reverseFormatNumber(value, 'id')
                console.log(filtered)
                if(filtered != ''){
                    if (empty.length < 1 && !new_data.is_refund) {
                        new_data.products.push({})
                    }
                    var formatted = parseFloat(filtered).toLocaleString('id-ID')
                    console.log(formatted)
                    new_data.products[i][name] = formatted
                    this.setState({data: new_data})
                } else {
                    new_data.products[i][name] = value
	                this.setState({data: new_data})
                }
            }
	    } else if (name == 'product') {
	        var empty = new_data.products.filter(p => Object.keys(p).length == 0)
	        console.log(empty)
	        if (empty.length <= 1 && !new_data.is_refund) {
                new_data.products.push({})
            }
            
	        var realValue = this.state.productAll.find(i => i.product_name == value || i.default_code == value)
	        var th = this
	        
	        if (realValue) {
    	        frappe.call({
            		type: "POST",
            		method:"vet_website.vet_website.doctype.vetpurchase.vetpurchase.get_last_product_details",
            		args: {name: realValue.name},
            		callback: function(r){
            		    console.log('ini', r.message)
            			if (r.message != false) {
            				if (new_data.products[i]['quantity'] != undefined) {
            				    r.message['quantity'] = new_data.products[i]['quantity']
            				}
            				
            				if (new_data.products[i]['name'] != undefined) {
            				    r.message['name'] = new_data.products[i]['name']
            				}
            				
            				new_data.products[i] = r.message
            				
            				var uom = document.querySelectorAll('[id=uom'+i+']')
            				var price = document.querySelectorAll('[id=price'+i+']')
            				console.log(uom)
            				uom.value = new_data.products[i].uom
            				if (new_data.products[i].price) {
                                var formattedPrice = formatter2.format(new_data.products[i].price || 0)
                                new_data.products[i].price = formattedPrice
            				    price.value = formattedPrice
            				}
            				
            				th.setState({data: new_data})
            			} else {
            			    new_data.products[i][name] = value
            			    th.setState({data: new_data})
            			}
            			
            			if (r.message.error) {
            				frappe.msgprint(r.message.error);
            			}
            		}
            	});
	        }
	        else {
	            new_data.products[i][name] = value
                th.setState({data: new_data})
	        }
	    } else if (name == 'uom') {
	        var empty = new_data.products.filter(p => Object.keys(p).length == 0)
	        console.log(empty)
	        if (empty.length < 1 && !new_data.is_refund) {
                new_data.products.push({})
            }
            
            var ratio_uom = this.state.uomAll.find(i => i.uom_name == value)
            
            if (ratio_uom) {
                if (new_data.products[i]['price']) {
                    var uom_before = new_data.products[i]['uom']
                    var ratio_before = this.state.uomAll.find(i => i.uom_name == uom_before)
                    var to_master = new_data.products[i]['price'] / (ratio_before.ratio || 1) 
                    new_data.products[i]['price'] = to_master * (ratio_uom.ratio || 1)
                }
                
                var price = document.querySelectorAll('[id=price'+i+']')
                price.value = formatter2.format(new_data.products[i]['price'] || 0)
                new_data.products[i]['price'] = formatter2.format(new_data.products[i]['price'] || 0)
                
                new_data.products[i][name] = value
                this.setState({data: new_data})
            }
	      
	    } else {
    	    new_data[name] = value
    	    this.setState({data: new_data})
    	}
    }
    
    handleInputBlur(e, list, i=false) {
        const value = e.target.value
    	const name = e.target.name
    	var new_data = this.state.data
    	var selected = false
    	
    	if (name == 'supplier') {
    	    selected = list.find(i => i.supplier_name == value)
    	} else if (name == 'deliver_to') {
    	    selected = list.find(i => i.gudang_name == value)
    	} else if (name == 'product') {
    	    selected = list.find(i => i.product_name == value)
    	}
    	
    	if (!selected) {
    	    e.target.value = ''
    	    if (name == 'product') {
    	        new_data.products[i][name] = ''
    	    } else {
    	        new_data[name] = ''
    	    }
    	    
    	    this.setState({data: new_data})
    	}
    }
    
    togglePopupPay(e) {
        e.preventDefault()
        this.setState({'show_popup_pay': !this.state.show_popup_pay})
    }

    togglePopupRetur(e) {
        e.preventDefault()
        this.setState({'show_popup_retur': !this.state.show_popup_retur})
    }
    
    togglePopupRefund(e) {
        e.preventDefault()
        console.log(this.state.data.products)
        if (this.state.data.products.every(i => i.quantity_default >= i.quantity)) {
            this.setState({'show_popup_refund': !this.state.show_popup_refund})
        } else {
            frappe.msgprint("Quantity Melebihi Batas")
        }
    }
    
    cancelAction(e) {
        e.preventDefault()
        var th = this
        var data = this.state.data
        
        frappe.call({
    		type: "POST",
    		method:"vet_website.vet_website.doctype.vetpurchase.vetpurchase.cancel_purchase",
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
    
    deleteRow(i){
        var new_data = Object.assign({}, this.state.data)
        if(new_data.products[i].name != undefined){
            new_data.products[i].delete = true
        }
        else {
            new_data.products.splice(i, 1)
        }
        this.setState({data: new_data})
    }
    
    goToJournalEntries(){
        window.location.href = '/main/accounting/journal-entries?reference=' + this.state.data.name
    }
    
    refundPurchase(e) {
        e.preventDefault()
        frappe.call({
    		type: "POST",
    		method:"vet_website.vet_website.doctype.vetpurchase.vetpurchase.refund_purchase",
    		args: {name: this.state.data.name},
    		callback: function(r){
    			if (r.message.purchase) {
    				window.location.href = "/main/purchases/purchase-order/edit?n=" + r.message.purchase.name
    			}
    			if (r.message.error) {
    				frappe.msgprint(r.message.error);
    			}
    		}
    	});
    }

    returPurchase(e) {
        e.preventDefault()
        frappe.call({
    		type: "POST",
    		method:"vet_website.vet_website.doctype.vetpurchase.vetpurchase.retur_purchase",
    		args: {name: this.state.data.name},
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
    
    printPDF() {
        var pdfid = 'pdf'
        var format = [559,794]
        var th = this
        // var doc = new jsPDF({
        //     orientation: 'p',
        //     unit: 'pt',
        //     format: format,
        // });
        var source = document.getElementById(pdfid)
        var opt = {
            margin: [10, 0, 10, 0],
            filename: "PruchaseOrder-"+this.state.data.name+".pdf",
            pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', '.row'] },
            html2canvas: {scale: 3},
            jsPDF: {orientation: 'p', unit: 'pt', format: [559*0.754,794*0.754]}
        }
        console.log('masuk')
        html2pdf().set(opt).from(source).save()
        // doc.html(source, {
        //   callback: function (doc) {
        //      doc.save("JournalItem-"+th.state.month+"-"+th.state.year+".pdf");
        //   },
        //   x: 0,
        //   y: 0,
        //   html2canvas: {
        //       scale: 1,
        //   }
        // });
    }
    
    reverseFormatNumber(val,locale){
        var group = new Intl.NumberFormat(locale).format(1111).replace(/1/g, '');
        var decimal = new Intl.NumberFormat(locale).format(1.1).replace(/1/g, '');
        var reversedVal = val.replace(new RegExp('\\' + group, 'g'), '');
        reversedVal = reversedVal.replace(new RegExp('\\' + decimal, 'g'), '.');
        return Number.isNaN(reversedVal) ? '' : reversedVal;
    }
    
    render() {
        var bgstyle = {background: '#FFFFFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', padding: '2px 32px', marginBottom: '15px'}
        var lh14 = {lineHeight: '14px'}
        var rowMinHeight = {minHeight: '64px'}
        var color = {color: '#056EAD', cursor: 'pointer'}
        var data = this.state.data
        var headerButton, popup_pay, popup_receive, popup_refund, pdf, print_button, retur_button, popup_retur
        var backButton = <span key="999" className="fs16 fw600 mr-auto my-auto" style={color} onClick={() => window.location.href='/main/purchases/purchase-order'}><i className="fa fa-chevron-left mr-1" style={color}></i>Back</span>
        var subtotal = 0, paid = 0
        var write = checkPermission('VetPurchase', this.state.currentUser, 'write')
        var cancel = checkPermission('VetPurchase', this.state.currentUser, 'cancel')
        var receive = checkPermission('VetPurchase', this.state.currentUser, 'receive')
        var refund = checkPermission('VetPurchase', this.state.currentUser, 'refund')
        var th = this
        
        if (this.state.loaded) {
            
            console.log(this.state)
            
            if (!!data.products) {
                 data.products.filter(d => !d.delete).forEach(function(item, index) {
                    if (item.product && item.quantity && item.price) {
                        var newPrice, newQuantity, newDiscount
                        if (['Draft', 'RFQ'].includes(data.status || 'Draft') && !data.is_refund && th.state.edit_mode) {
                            newPrice = parseFloat(th.reverseFormatNumber(String(item.price || 0), 'id'))
                            newQuantity = parseFloat(th.reverseFormatNumber(String(item.quantity || 0), 'id'))
                            newDiscount = parseFloat(th.reverseFormatNumber(String(item.discount || 0), 'id'))
                        } else {
                            newPrice = item.price || 0
                            newQuantity = item.quantity || 0
                            newDiscount = item.discount || 0
                        }
                        subtotal = subtotal + (newPrice * newQuantity - ((newDiscount || 0) / 100 * (newPrice * newQuantity)))
                    }
                })
            }
            
            var cancelButton
            if (!!data.products) {
                 if (data.products.every(i => i.quantity_receive == 0 || i.quantity_receive == undefined) && data.pembayaran.length == 0 && data.status != 'Cancel' && cancel) {
    	            cancelButton = <div className="col-auto my-auto">
    	                                <button className="btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2" style={lh14} type="button" onClick={(e) => this.cancelAction(e)}>Cancel</button>
    	                           </div>
    	        }
                
                if (!data.products.every(i => i.quantity_receive == 0) && !['Cancel', 'Refund', 'Done'].includes(data.status)) {
                    retur_button = <div className="col-auto my-auto">
                            <button className="btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2" style={lh14} onClick={this.togglePopupRetur}>Retur</button>
                    </div>
                }
            }
            
            if (!!data.pembayaran) {
                data.pembayaran.forEach(function(item, index) {
                    paid = paid + item.jumlah
                })   
            }
        	
        	if (data.status == 'Draft' || id == undefined) {
        	    if (data.is_refund) {
        	        headerButton = <div className="row mx-0 flex-row-reverse" style={rowMinHeight}>
    			            			<div className="col-auto my-auto">
    			            				<button type="button" className="btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2" style={lh14} onClick={this.togglePopupRefund}>Pay</button>
    			            			</div>
    			            			{backButton}
    			            		</div>
        	    } else {
        	        headerButton = <div className="row mx-0 flex-row-reverse" style={rowMinHeight}>
    			            			<div className="col-auto my-auto">
    			            				<button type="submit" className="btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2" style={lh14}>Request For Quotation</button>
    			            			</div>
    			            			{backButton}
    			            		</div>
        	    }
        	} else if (data.status == 'RFQ') {
        	    var edit_button
        	    
        	    if(this.state.edit_mode){
        	        edit_button = <div className="col-auto my-auto">
			            				<button type="button" className="btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2" style={lh14} onClick={e => this.formSubmit(e, true)}>Save</button>
			            			</div>
        	    } else {
        	        edit_button = <div className="col-auto my-auto">
			            				<button type="button" className="btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2" style={lh14} onClick={e => this.toggleEditMode(e)}>Edit</button>
			            			</div>
        	    }
        	    
        	    headerButton = <div className="row mx-0 flex-row-reverse" style={rowMinHeight}>
			            			<div className="col-auto my-auto">
			            				<button type="submit" className="btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2" style={lh14}>Purchase</button>
			            			</div>
			            			{write?edit_button:false}
			            			{cancelButton}
			            			{backButton}
			            		</div>
        	} else if (['Purchase Order', 'Receive', 'Paid', 'Cancel', 'Refund', 'Done'].includes(data.status)) {
        	    var receive_button, pay_button, refundButton
        	    var cursor = {cursor: 'pointer'}
        	    journal_entries = <div className="col-auto mr-auto" style={cursor} onClick={() => this.goToJournalEntries()}>
                			            <img className="d-block mx-auto mt-2 header-icon" src="/static/img/main/menu/journal_entries.png"/>
                			            <p className="mb-0 fs12 text-muted text-center">Journal Entries</p>
                			        </div>
        	    if(data.status == 'Purchase Order'){
        	        if(receive){
        	            receive_button = <div className="col-auto my-auto">
        	                            <button className="btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2" style={lh14} type="button" onClick={(e) => this.toggleReceive(e)}>Receive</button>
        	                       </div>
        	        }
        	    }
        	    
        	    if(paid < subtotal && !['Cancel', 'Refund'].includes(data.status)){
        	        pay_button = <div className="col-auto my-auto">
        	                        <button className="btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2" style={lh14} onClick={this.togglePopupPay}>Pay</button>
        	                   </div>
        	    }
        	    
        	    var journal_entries
        	    if (['Paid', 'Refund', 'Done'].includes(data.status)) {
                	if (!data.is_refund && !data.already_refund && data.status != 'Paid' && refund) {
                	    refundButton = <div className="col-auto my-auto">
                	                        <button className="btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2" style={lh14} onClick={this.refundPurchase}>Refund</button>
                	                   </div>
                	}
                	
                	if (receive && !data.products.every(i => parseFloat(i.quantity) == parseFloat(i.quantity_receive))) {
                	    receive_button = <div className="col-auto my-auto">
            	                            <button className="btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2" style={lh14} type="button" onClick={(e) => this.toggleReceive(e)}>Receive</button>
            	                       </div>
                	}
        	    }

                pdf = <PDF data={data} subtotal={subtotal} paid={paid} payment_method_list={this.state.payment_method_list}/>

                print_button = <div className="col-auto my-auto">
                                    <button className="btn btn-sm btn-outline-danger fs12 text-uppercase h-100 px-3 fwbold py-2" style={lh14} type="button" onClick={() => this.printPDF()}>Print</button>
                                </div>
        	    
        	    headerButton = <div className="row mx-0 flex-row-reverse" style={rowMinHeight}>
			            			{print_button}
			            			{pay_button}
			            			{receive_button}
			            			{cancelButton}
			            			{refundButton}
                                    {retur_button}
			            			{journal_entries}
			            			{backButton}
			            		</div>
        	}
        	
        	if (this.state.show_popup_pay) {
        	    popup_pay = <PopupPay togglePopupPay={this.togglePopupPay} name={data.name} subtotal={subtotal} paid={paid} total_credit={data.total_true_credit} payment_method_list={this.state.payment_method_list} potongan={data.potongan}/>
        	}

            if (this.state.show_popup_retur) {
        	    popup_retur = <PopupRetur toggleRetur={this.togglePopupRetur} name={data.name} products={data.products.filter(i => i.quantity_receive != 0)} paid={paid} total_credit={data.total_true_credit} payment_method_list={this.state.payment_method_list} potongan={data.potongan}/>
        	}
        	
        	if (this.state.show_popup_refund) {
        	    popup_refund = <PopupRefund togglePopupRefund={this.togglePopupRefund} name={data.name} subtotal={subtotal} paid={paid} products={data.products} total_credit={data.total_true_credit} payment_method_list={this.state.payment_method_list}/>
        	}
        	
        	if (this.state.show_receive) {
        	    popup_receive = <PopupReceive toggleReceive={(e) => this.toggleReceive(e)} name={data.name} products={data.products.filter(i => i.quantity != i.quantity_receive)} />
        	}
        	
        	var list_status
        	if (data.status != 'Cancel') {
        	    if (data.is_refund) {
        	        list_status = ['Draft', 'Refund']
        	    } else {
        	        if (!!data.products && !data.products.every(i => i.quantity == i.quantity_receive) && paid == subtotal) {
        	            list_status = ['Draft', 'RFQ', 'Purchase Order', 'Paid', 'Receive', 'Done']
        	        } else {
        	            list_status = ['Draft', 'RFQ', 'Purchase Order', 'Receive', 'Paid', 'Done']
        	        }
        	    }
        	} else {
        	    list_status = ['Cancel']
        	}
        	
    		return <form onSubmit={this.formSubmit}>
    	            	<div style={bgstyle}>
    	            		{headerButton}
    	            	</div>
    	            	<div className="row justify-content-end">
    	            	    <div className="col-auto">
    	            	        <StatusRow statuses={list_status} current_status={data.status || 'Draft'}/>
    	            	    </div>
    	            	    <div className="col-auto">
    	            	        <RecordNavigation currentname={this.state.data.name} namelist={this.state.namelist} navigationAction={this.navigationAction}/>
    	            	    </div>
    	            	</div>
    	            	<PurchaseOrderMainForm edit_mode={this.state.edit_mode} data={data} gudang={this.state.gudang} supplier={this.state.supplier} handleInputChange={this.handleInputChange} handleInputBlur={this.handleInputBlur}/>
    	            	<PurchaseOrderProducts edit_mode={this.state.edit_mode} products={data.products || []} uomAll={this.state.uomAll} productAll={this.state.productAll} status={data.status || 'Draft'} handleInputChange={this.handleInputChange} handleInputBlur={this.handleInputBlur} deleteRow={this.deleteRow} pembayaran={data.pembayaran || []} payment_method_list={this.state.payment_method_list} subtotal={subtotal} paid={paid} is_refund={data.is_refund} potongan={data.potongan || 0}/>
    	            	{popup_pay}
    	            	{popup_receive}
    	            	{popup_refund}
                        {popup_retur}
    	            	{pdf}
    	            </form>
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

class PopupPay extends React.Component {
    constructor(props) {
        super(props)
        this.state={
            'data': {
                'name': this.props.name,
                'tanggal': moment().format('YYYY-MM-DD'),
                'time': moment().format('HH:mm:ss')
            },
            'loading': false,
        }
        
        this.handleInputChange = this.handleInputChange.bind(this)
        this.submitPay = this.submitPay.bind(this)
    }
    
    componentDidMount(){
        if(this.props.subtotal != undefined && this.props.paid != undefined){
            var remaining = this.props.subtotal - this.props.potongan - this.props.paid
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

            if (new RegExp(/,$/g).test(value)) {
                new_data.jumlah = value
            } else {
                // var filtered = value.replace(/\D/g,'')
                var filtered = parseFloat(this.reverseFormatNumber(value, 'id'))
                console.log(filtered)
                if(filtered != ''){
                    var formatted = parseFloat(filtered).toLocaleString('id-ID')
                    console.log(formatted)
                    new_data.jumlah = formatted
                }
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
        var remaining = 0

        if (this.state.loading) {
            return;
        }

        this.setState({loading: true})
        
        remaining = this.props.subtotal - this.props.potongan - this.props.paid
        if(['',undefined,null].includes(this.state.data.jumlah)){
            var new_data = Object.assign({}, this.state.data)
            new_data.jumlah = remaining
            this.setState({'data': new_data, 'loading': false})
        }
        else{
            console.log(this.state.data)
            var new_data = Object.assign({}, this.state.data)
            new_data.jumlah = parseFloat(this.reverseFormatNumber(new_data.jumlah || '0', 'id'))
            new_data.payment_method.includes('Deposit') ? new_data.jumlah = this.props.total_credit:false
            new_data.tanggal = new_data.tanggal + ' ' + new_data.time
            delete new_data['time']
            console.log(new_data)
            if(new_data.payment_method){
                frappe.call({
                    type: "GET",
                    method:"vet_website.vet_website.doctype.vetpurchase.vetpurchase.submit_pembayaran",
                    freeze: true,
                    args: {data: new_data},
                    callback: function(r){
                        if (r.message) {
                            window.location.reload()
                        }
                    }
                });
            }
        }
    }

    reverseFormatNumber(val,locale){
        var group = new Intl.NumberFormat(locale).format(1111).replace(/1/g, '');
        var decimal = new Intl.NumberFormat(locale).format(1.1).replace(/1/g, '');
        var reversedVal = val.replace(new RegExp('\\' + group, 'g'), '');
        reversedVal = reversedVal.replace(new RegExp('\\' + decimal, 'g'), '.');
        return Number.isNaN(reversedVal) ? '' : reversedVal;
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
            } else if((pm.method_type == 'Deposit Supplier') && this.props.total_credit > 0){
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
            pm_buttons.push(<div key={pm.name} className="col-6 px-1 pb-2"><button type="button" style={th.state.data.payment_method == pm.method_name?payStyle:batalStyle} className="btn btn-block p-3 h-100 text-truncate fs12" onClick={() => th.setPaymentMethod(pm.method_name)}>{detail}</button></div>)
        })
        
        var value_input = <div className="form-group">
                                <span className="fs14 fw600 mb-2">Jumlah</span>
                                <input required name='jumlah' id="jumlah" className="form-control border-0 fs22 fw600 mb-4" onChange={this.handleInputChange} value={this.state.data.jumlah||''} style={inputStyle}/>
                            </div>

        var tanggal_input = <div className="form-group">
                                <span className="fs14 fw600 mb-2">Tanggal</span>
                                <input required type="date" id="tanggal" name='tanggal' className="form-control border-0 fs22 fw600 mb-4" onChange={this.handleInputChange} defaultValue={this.state.data.tanggal || ''} style={inputStyle}/>
                            </div>
        
        var time_input = <div className="form-group">
                                <span className="fs14 fw600 mb-2">Waktu</span>
                                <input required type="time" id="time" name='time' className="form-control border-0 fs22 fw600 mb-4" onChange={this.handleInputChange} defaultValue={this.state.data.time || ''} style={inputStyle}/>
                            </div>
        
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
                            {this.state.data.payment_method&&!this.state.data.payment_method.includes('Deposit')?value_input:false}
                            {this.state.data.payment_method&&!this.state.data.payment_method.includes('Deposit')?tanggal_input:false}
                            {this.state.data.payment_method&&!this.state.data.payment_method.includes('Deposit')?time_input:false}
                            <div className="row justify-content-center mb-2">
                                <div className="col-auto d-flex mt-4">
                                    <button className={this.state.loading
                                        ? "btn btn-sm fs18 h-100 fwbold px-4 disabled"
                                        : "btn btn-sm fs18 h-100 fwbold px-4"} style={payStyle} onClick={this.submitPay}>Pay</button>
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
            'data': {'name': this.props.name, 'products': this.props.products}
        }
        
        this.handleInputChange = this.handleInputChange.bind(this)
        this.submitRefund = this.submitRefund.bind(this)
    }
    
    handleInputChange(e) {
        var name = e.target.name
        var value = e.target.value
        var new_data = this.state.data
        
        new_data[name] = value
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
        
        remaining = this.props.subtotal - this.props.potongan - this.props.paid
        
        if (this.state.data.refund > remaining) {
            frappe.msgprint('Hanya ada sisa ' + formatter.format(remaining))
        } else {
            var new_data = this.state.data
            
            new_data.products.forEach(function(item, index) {
                if (item.quantity == '0' || item.quantity == 0) {
                    item.is_delete = true
                }
            })
            
            console.log(new_data)
            
            frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetpurchase.vetpurchase.submit_refund",
                args: {data: new_data},
                freeze: true,
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
            } else if((pm.method_type == 'Deposit Supplier') && this.props.total_credit > 0){
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
            pm_buttons.push(<div key={pm.name} className="col-6 px-1 pb-2"><button type="button" style={th.state.data.payment_method == pm.method_name?payStyle:batalStyle} className="btn btn-block p-3 h-100 text-truncate fs12" onClick={() => th.setPaymentMethod(pm.method_name)}>{detail}</button></div>)
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
                                <input required name='refund' id="refund" className="form-control border-0 fs22 fw600 mb-4" onChange={this.handleInputChange} style={inputStyle}/>
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

class PopupReceive extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': {
                'name': this.props.name,
                'products': this.props.products,
                'receive_date': moment().format('YYYY-MM-DD'),
                'time': moment().format('HH:mm:ss')
            },
            'backOrder': true,
            'showBackOrder': false,
        }
        
        this.handleInputChange = this.handleInputChange.bind(this)
        this.confirmReceive = this.confirmReceive.bind(this)
        this.toggleBackOrder = this.toggleBackOrder.bind(this)
    }
    
    handleInputChange(e, i=false) {
        var value = e.target.value
        var name = e.target.name
        var new_data = this.state.data
        
        if (name == 'backOrder') {
            if (this.state.backOrder) {
                this.setState({backOrder: false})
            } else {
                this.setState({backOrder: true})
            }
        } else if (name == 'receive_date') {
            new_data.receive_date = value
            this.setState({data: new_data})
        } else if (name == 'time') {
            new_data.time = value
            this.setState({data: new_data})
        } else {
            var showBackOrder = this.state.showBackOrder
            if (new_data.products[i].quantity > value) {
                showBackOrder = true
            } else {
                showBackOrder = false
            }
            new_data.products[i].quantity_receive_temp = value
            this.setState({data: new_data, showBackOrder: showBackOrder})
        }
    }
    
    confirmReceive(e) {
        e.preventDefault()
        var th = this
        var new_data = this.state.data
        
        var products = []
        
        new_data.products.forEach(function(item, index) {
            if (item.quantity != item.quantity_receive) {
                if (item.quantity_receive_temp == undefined) {
                    item.quantity_receive = parseFloat(item.quantity) - parseFloat(item.quantity_receive)
                } else {
                    item.quantity_receive = parseFloat(item.quantity_receive_temp)
                }
                
                products.push(item)
            }
            
            delete item.quantity_receive_temp
        })
        
        var valid = new_data.products.every(i => parseFloat(i.quantity) >= parseFloat(i.quantity_receive))

        new_data.receive_date = new_data.receive_date + ' ' + new_data.time
        delete new_data['time']
        console.log(new_data, products, this.state.backOrder)
        
        if (valid) {
            if (!this.state.backOrder && this.state.showBackOrder) {
                frappe.call({
            		type: "POST",
            		method:"vet_website.vet_website.doctype.vetpurchase.vetpurchase.edit_receive_purchase",
            		args: {name: new_data.name, products: new_data.products, receive_date: new_data.receive_date},
            		freeze: true,
            		callback: function(r){
            			if (r.message.purchase) {
            				window.location.href = "/main/purchases/purchase-order/edit?n=" + r.message.purchase.name
            			}
            			if (r.message.error) {
            				frappe.msgprint(r.message.error);
            			}
            		}
            	});
            } else {
                frappe.call({
            		type: "POST",
            		method:"vet_website.vet_website.doctype.vetpurchase.vetpurchase.receive_purchase",
            		args: {name: new_data.name, products: products, receive_date: new_data.receive_date},
            		freeze: true,
            		callback: function(r){
            			if (r.message.purchase) {
            				window.location.href = "/main/purchases/purchase-order/edit?n=" + r.message.purchase.name
            			}
            			if (r.message.error) {
            				frappe.msgprint(r.message.error);
            			}
            		}
            	});
            }
        } else {
            frappe.msgprint('Received Quantity melebihi Quantity')
        }
    }
    
    toggleBackOrder(e) {
        e.preventDefault()
        this.setState({backOrder: !this.state.backOrder})
    }
    
    render() {
        var maxwidth = {maxWidth: '480px', paddingTop: '100px'}
        var maxwidth2 = {maxWidth: '20%', paddingTop: '100px'}
        var payStyle = {background: '#056EAD', color: '#FFFFFF'}
        var batalStyle = {color: '#056EAD', border: '1px solid #056EAD'}
        var row_products = []
        var bgStyle = {background: '#F5FBFF'}
        var qtyStyle = {background: '#CEEDFF'}
        var th = this
        var backOrder
        
        console.log(this.state)
        
        this.props.products.forEach(function(item, index) {
            row_products.push(
                <div className="row mx-0" key={index.toString()}>
            		<div className="col row-list" style={bgStyle}>
            			<div className="row mx-0 fs14 fw600">
            				<div className="col-8">
            					<span>{item.product}</span>
            				</div>
            				<div className="col">
            					<input name='quantity_receive' id="quantity_receive" style={qtyStyle} className="form-control border-0 fs14 fw600 px-0 text-center" onChange={e => th.handleInputChange(e, index)} defaultValue={item.quantity - item.quantity_receive}/>
            				</div>
            			</div>
            		</div>
            	</div>
            )
        })
        
        if (this.state.showBackOrder) {
            var checkbox_style = {width: '20px', height: '20px'}
            backOrder = <div className="row mt-2">
                            <div className="col-auto">
                                <input type="checkbox" name="backOrder" id="backOrder" style={checkbox_style} onChange={this.handleInputChange} checked={this.state.backOrder}/>
                            </div>
                            <span>Back Order</span>
                        </div>
        }
        
        return (
            <div className="menu-popup">
                <div className="container" style={maxwidth}>
                    <div className="bg-white p-4">
                        <div className="row mx-0 fs14 fw600 row-header">
            				<div className="col-8 text-center">
            					<span className="my-auto">Produk</span>
            				</div>
            				<div className="col text-center">
            					<span className="my-auto">Qty</span>
            				</div>
            			</div>
            			{row_products}
                        <div className="form-group mt-2">
                            <span className="fs14 fw600 mb-2">Tanggal</span>
                            <input required type="date" id="receive_date" name='receive_date' className="form-control border-0 fs22 fw600 mb-2" onChange={this.handleInputChange} defaultValue={this.state.data.receive_date || ''} style={qtyStyle}/>
                        </div>
                        <div className="form-group mt-2">
                            <span className="fs14 fw600 mb-2">Waktu</span>
                            <input required type="time" id="time" name='time' className="form-control border-0 fs22 fw600 mb-2" onChange={this.handleInputChange} defaultValue={this.state.data.time || ''} style={qtyStyle}/>
                        </div>
            			{backOrder}
                        <div className="row justify-content-center mb-2">
                            <div className="col-auto d-flex mt-4">
                                <button className="btn btn-sm fs18 h-100 fwbold px-4" style={payStyle} onClick={this.confirmReceive}>Konfirmasi</button>
                            </div>
                            <div className="col-auto d-flex mt-4">
                                <button className="btn btn-sm fs18 h-100 fwbold px-4" style={batalStyle} onClick={this.props.toggleReceive}>Batal</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="menu-popup-close" onClick={this.props.toggleReceive}></div>
            </div>
        )
    }
}

class PopupRetur extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': {
                'name': this.props.name,
                'products': this.props.products,
            },
            'show_popup_pay_retur': false
        }
        
        this.handleInputChange = this.handleInputChange.bind(this)
        this.confirmRetur = this.confirmRetur.bind(this)
        this.togglePopupPayRetur = this.togglePopupPayRetur.bind(this)
    }
    
    handleInputChange(e, i=false) {
        var value = e.target.value
        var name = e.target.name
        var new_data = this.state.data
        
        // if (name == 'backOrder') {
        //     if (this.state.backOrder) {
        //         this.setState({backOrder: false})
        //     } else {
        //         this.setState({backOrder: true})
        //     }
        // } else if (name == 'receive_date') {
        //     new_data.receive_date = value
        //     this.setState({data: new_data})
        // } else {
        //     var showBackOrder = this.state.showBackOrder
        //     if (new_data.products[i].quantity > value) {
        //         showBackOrder = true
        //     } else {
        //         showBackOrder = false
        //     }
        new_data.products[i].quantity_retur_temp = value
        this.setState({data: new_data})
        // }
    }

    togglePopupPayRetur(e) {
        e.preventDefault()
        this.setState({show_popup_pay_retur: !this.state.show_popup_pay_retur})
    }
    
    confirmRetur(e) {
        e.preventDefault()
        var th = this
        var new_data = {}
        new_data = this.state.data
        
        var valid = new_data.products.every((i) => {
            if (i.quantity_retur_temp != undefined) {
                return (parseFloat(i.quantity_receive) - parseFloat(i.quantity_retur_temp)) >= 0
            }

            return true
        })
        
        console.log(new_data)
        
        if (valid) {

            var products = []
            var subtotal = 0
        
            new_data.products.forEach(function(item, index) {
                if (item.quantity_receive > 0) {
                    if (item.quantity_retur_temp == undefined) {
                        item.quantity_retur = parseFloat(item.quantity_receive)
                        item.quantity_receive = 0
                    } else {
                        item.quantity_retur = parseFloat(item.quantity_retur_temp)
                        item.quantity_receive = parseFloat(item.quantity_receive) - parseFloat(item.quantity_retur_temp)
                    }
                    
                    products.push(item)
                    subtotal += item.price * item.quantity_receive - ((item.discount || 0) / 100 * (item.price * item.quantity_receive))
                }
                
                delete item.quantity_retur_temp
            })

            if (this.props.paid > (subtotal - this.props.potongan)) {
                console.log('balikin uang')
                this.setState({show_popup_pay_retur: true})
            } else {
                console.log('gausah balikin uang')
                frappe.call({
                    type: "POST",
                    method:"vet_website.vet_website.doctype.vetpurchase.vetpurchase.retur_purchase",
                    args: {name: new_data.name, products: new_data.products},
                    freeze: true,
                    callback: function(r){
                        if (r.message.purchase) {
                            window.location.reload()
                        }
                        if (r.message.error) {
                            frappe.msgprint(r.message.error);
                        }
                    }
                });
            }
            // if (!this.state.backOrder && this.state.showBackOrder) {
            //     frappe.call({
            // 		type: "POST",
            // 		method:"vet_website.vet_website.doctype.vetpurchase.vetpurchase.edit_receive_purchase",
            // 		args: {name: new_data.name, products: new_data.products, receive_date: new_data.receive_date},
            // 		freeze: true,
            // 		callback: function(r){
            // 			if (r.message.purchase) {
            // 				window.location.href = "/main/purchases/purchase-order/edit?n=" + r.message.purchase.name
            // 			}
            // 			if (r.message.error) {
            // 				frappe.msgprint(r.message.error);
            // 			}
            // 		}
            // 	});
            // } else {
            //     frappe.call({
            // 		type: "POST",
            // 		method:"vet_website.vet_website.doctype.vetpurchase.vetpurchase.receive_purchase",
            // 		args: {name: new_data.name, products: products, receive_date: new_data.receive_date},
            // 		freeze: true,
            // 		callback: function(r){
            // 			if (r.message.purchase) {
            // 				window.location.href = "/main/purchases/purchase-order/edit?n=" + r.message.purchase.name
            // 			}
            // 			if (r.message.error) {
            // 				frappe.msgprint(r.message.error);
            // 			}
            // 		}
            // 	});
            // }
        } else {
            frappe.msgprint('Retur Quantity melebihi Received Quantity')
        }
    }
    
    // toggleBackOrder(e) {
    //     e.preventDefault()
    //     this.setState({backOrder: !this.state.backOrder})
    // }
    
    render() {
        var maxwidth = {maxWidth: '480px', paddingTop: '100px'}
        var maxwidth2 = {maxWidth: '20%', paddingTop: '100px'}
        var payStyle = {background: '#056EAD', color: '#FFFFFF'}
        var batalStyle = {color: '#056EAD', border: '1px solid #056EAD'}
        var row_products = []
        var bgStyle = {background: '#F5FBFF'}
        var qtyStyle = {background: '#CEEDFF'}
        var th = this
        var popup_pay_retur
        
        console.log(this.state)
        
        this.props.products.forEach(function(item, index) {
            row_products.push(
                <div className="row mx-0" key={index.toString()}>
            		<div className="col row-list" style={bgStyle}>
            			<div className="row mx-0 fs14 fw600">
            				<div className="col-8">
            					<span>{item.product}</span>
            				</div>
            				<div className="col">
            					<input name='quantity_retur' id="quantity_retur" style={qtyStyle} className="form-control border-0 fs14 fw600 px-0 text-center" onChange={e => th.handleInputChange(e, index)} defaultValue={item.quantity_receive}/>
            				</div>
            			</div>
            		</div>
            	</div>
            )
        })

        if (this.state.show_popup_pay_retur) {
            popup_pay_retur = <PopupPayRetur togglePopupPayRetur={this.togglePopupPayRetur} name={this.props.name} subtotal={this.props.subtotal} paid={this.props.paid} products={this.state.data.products} total_credit={this.props.total_credit} payment_method_list={this.props.payment_method_list} potongan={this.props.potongan}/>
        }
        
        // if (this.state.showBackOrder) {
        //     var checkbox_style = {width: '20px', height: '20px'}
        //     backOrder = <div className="row mt-2">
        //                     <div className="col-auto">
        //                         <input type="checkbox" name="backOrder" id="backOrder" style={checkbox_style} onChange={this.handleInputChange} checked={this.state.backOrder}/>
        //                     </div>
        //                     <span>Back Order</span>
        //                 </div>
        // }
        
        return (
            <div className="menu-popup">
                <div className="container" style={maxwidth}>
                    <div className="bg-white p-4">
                        <div className="row mx-0 fs14 fw600 row-header">
            				<div className="col-8 text-center">
            					<span className="my-auto">Produk</span>
            				</div>
            				<div className="col text-center">
            					<span className="my-auto">Qty</span>
            				</div>
            			</div>
            			{row_products}
                        {/* <div className="form-group mt-2">
                            <span className="fs14 fw600 mb-2">Tanggal</span>
                            <input required type="date" id="receive_date" name='receive_date' className="form-control border-0 fs22 fw600 mb-2" onChange={this.handleInputChange} defaultValue={this.state.data.receive_date || ''} style={qtyStyle}/>
                        </div> */}
            			{/* {backOrder} */}
                        <div className="row justify-content-center mb-2">
                            <div className="col-auto d-flex mt-4">
                                <button className="btn btn-sm fs18 h-100 fwbold px-4" style={payStyle} onClick={this.confirmRetur}>Konfirmasi</button>
                            </div>
                            <div className="col-auto d-flex mt-4">
                                <button className="btn btn-sm fs18 h-100 fwbold px-4" style={batalStyle} onClick={this.props.toggleRetur}>Batal</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="menu-popup-close" onClick={this.props.toggleRetur}></div>
                {popup_pay_retur}
            </div>
        )
    }
}

class PopupPayRetur extends React.Component {
    constructor(props) {
        super(props)
        this.state={
            'data': {'name': this.props.name, 'products': this.props.products}
        }
        
        // this.handleInputChange = this.handleInputChange.bind(this)
        this.submitReturPay = this.submitReturPay.bind(this)
    }
    
    // handleInputChange(e) {
    //     var name = e.target.name
    //     var value = e.target.value
    //     var new_data = this.state.data
        
    //     new_data[name] = value
    //     this.setState({data: new_data})
    // }
    
    setPaymentMethod(value){
        var new_data = Object.assign({}, this.state.data)
        new_data.payment_method = value
        this.setState({data: new_data})
    }
    
    submitReturPay(e) {
        e.preventDefault()
        // var remaining = 0
        
        // remaining = this.props.subtotal - this.props.potongan - this.props.paid
        
        if (this.state.data.payment_method == undefined) {
            frappe.msgprint('Pilih metode pembayaran')
        } else {
            var new_data = this.state.data
            
            // new_data.products.forEach(function(item, index) {
            //     if (item.quantity == '0' || item.quantity == 0) {
            //         item.is_delete = true
            //     }
            // })

            var jumlah = 0
        
            this.state.data.products.forEach(function(item, index) {
                jumlah += item.price * item.quantity_receive - ((item.discount || 0) / 100 * (item.price * item.quantity_receive))
            })

            jumlah = this.props.paid - jumlah
            
            console.log(new_data, jumlah)
            
            frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetpurchase.vetpurchase.retur_purchase",
                args: {name: new_data.name, products: new_data.products, jumlah: jumlah, payment_method: new_data.payment_method},
                freeze: true,
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

        var jumlah = 0
        
        this.state.data.products.forEach(function(item, index) {
            jumlah += item.price * item.quantity_receive - ((item.discount || 0) / 100 * (item.price * item.quantity_receive))
        })
        
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
            } else if((pm.method_type == 'Deposit Supplier') && this.props.total_credit > 0){
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
            pm_buttons.push(<div key={pm.name} className="col-6 px-1 pb-2"><button type="button" style={th.state.data.payment_method == pm.method_name?payStyle:batalStyle} className="btn btn-block p-3 h-100 text-truncate fs12" onClick={() => th.setPaymentMethod(pm.method_name)}>{detail}</button></div>)
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
                                <input readOnly name='refund' id="refund" className="form-control border-0 fs22 fw600 mb-4" style={inputStyle} defaultValue={formatter2.format(this.props.paid - jumlah)}/>
                            </div>
                            <div className="row justify-content-center mb-2">
                                <div className="col-auto d-flex mt-4">
                                    <button className="btn btn-sm fs18 h-100 fwbold px-4" style={refundStyle} onClick={this.submitReturPay}>Refund</button>
                                </div>
                                <div className="col-auto d-flex mt-4">
                                    <button className="btn btn-sm fs18 h-100 fwbold px-4" style={batalStyle} onClick={this.props.togglePopupPayRetur}>Batal</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="menu-popup-close" onClick={this.props.togglePopupPayRetur}></div>
                </div>
            )
    }
}

class PurchaseOrderMainForm extends React.Component {
    render() {
        var bgstyle2 = {background: '#FFFFFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)'}
        var data = this.props.data
        var inputSupplier, inputGudang, inputUser, inputOrderDate
        var supplier_options = []
        var gudang_options = []
        
        if ((data.status == 'Draft' && !data.is_refund) || id == undefined) {
            if (id != undefined) {
                inputUser = <div className="col-3">
                                <div className="form-group">
                					<label htmlFor="user" className="fw600">Responsible</label>
                					<div className="row mx-0">
                						<span className="fs16 px-2">{data.user_name}</span>
                					</div>
                				</div>
                            </div>
            }
            
            this.props.supplier.forEach(function(item, index) {
                supplier_options.push(<option value={item.supplier_name} key={index.toString()} />)
            })
            
            this.props.gudang.forEach(function(item, index) {
                gudang_options.push(<option value={item.gudang_name} key={index.toString()} />)
            })
            
            inputSupplier = <div>
								<input autoComplete="off" required name='supplier' list="suppliers" id="supplier" className="form-control border-0 lightbg" onChange={this.props.handleInputChange} onBlur={e => this.props.handleInputBlur(e, this.props.supplier)} defaultValue={data.supplier_name || ''}/>
									<datalist id="suppliers">
										{supplier_options}
									</datalist>
							</div>
							
			inputGudang = <div>
								<input autoComplete="off" required name='deliver_to' list="list_gudang" id="deliver_to" className="form-control border-0 lightbg" onChange={this.props.handleInputChange} onBlur={e => this.props.handleInputBlur(e, this.props.gudang)} defaultValue={data.delivery_to_name || ''}/>
									<datalist id="list_gudang">
										{gudang_options}
									</datalist>
							</div>
			inputOrderDate = <div>
			                    <input required type="date" id="order_date" name='order_date' className="form-control border-0 lightbg" onChange={this.props.handleInputChange} defaultValue={data.order_date || ''}/>
			                </div>
        } else {
            inputSupplier = <div>
                                <span className="fs16 px-0">{data.supplier_name}</span>
                            </div>
            inputGudang = <div>
                                <span className="fs16 px-0">{data.is_refund ? data.deliver_from_name: data.deliver_to_name}</span>
                            </div>
            inputUser = <div className="col-3">
                            <div className="form-group">
            					<label htmlFor="user" className="fw600">Responsible</label>
            					<div className="row mx-0">
            						<span className="fs16 px-0">{data.user_name}</span>
            					</div>
            				</div>
                        </div>
                        
            if (this.props.edit_mode){
                inputOrderDate = <div>
			                    <input required type="date" id="order_date" name='order_date' className="form-control border-0 lightbg" onChange={this.props.handleInputChange} defaultValue={data.order_date || ''}/>
			                </div>
            } else {
                inputOrderDate = <div>
                                <span className="fs16 px-0">{moment(data.is_refund ? data.refund_date : data.order_date).format("DD-MM-YYYY")}</span>
                            </div>
            }
        }
        
        return <div>
        			<p className="fs18 fw600 text-dark mb-2">{data.name || 'Data Purchase'}</p>
        			<div style={bgstyle2} className="p-4 mb-4">
		        		<div className="form-row">
            	            <div className="col-3">
            	                <div className="form-group">
                					<label htmlFor="supplier" className="fw600">Supplier</label>
                					{inputSupplier}
                				</div>
        	                </div>
        	                <div className="col-3">
        	                    <div className="form-group">
                					<label htmlFor="order_date" className="fw600">{data.is_refund ? 'Refund Date' : 'Order Date'}</label>
                					{inputOrderDate}
                				</div>
        	                </div>
        	                <div className="col-3">
            	                <div className="form-group">
                					<label htmlFor="deliver_to" className="fw600">{data.is_refund ? 'Deliver From' : 'Deliver To'}</label>
                					{inputGudang}
                				</div>
        	                </div>
        	                {inputUser}
	            		</div>
		        	</div>
        		</div>
    }
}

class PurchaseOrderProducts extends React.Component {
    render() {
        var panel_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px'}
        var products = this.props.products
        var pembayaran =this.props.pembayaran
        var is_refund =this.props.is_refund
        var rows = []
        var fontStyle = {'color': '#1B577B'}
        var paidStyle = {'color': '#126930'}
        var refundStyle = {'color': '#691212'}
        var lineStyle = {'border': '1px solid #1B577B'}
        var divStyle = {width: '11px'}
        var tax = 0
        var pembayaran_rows = []
        var remaining = 0
        var paidRow, remainingRow, pembayaran_header, quantity_receive_header, refundRow
        
        if (products.length != 0){
            var sl = this
            products.forEach(function(item, index){
                var uom
                if (item.uom) {
                    var realUom = sl.props.uomAll.find(i => i.uom_name == item.uom)
                    if (realUom && realUom.unit_master == undefined) {
                        uom = sl.props.uomAll.filter(i => i.unit_master_name == item.uom || i.uom_name == item.uom)
                    } else {
                        uom = sl.props.uomAll.filter(i => i.unit_master_name == realUom.unit_master_name || i.uom_name == realUom.unit_master_name)
                    }
                } else {
                    uom = []
                }
                
                if(!item.delete){
                    rows.push(
                        <ProductsListRow paid={sl.props.paid} is_refund={sl.props.is_refund} key={index.toString()} item={item} status={sl.props.status} uomAll={uom} productAll={sl.props.productAll} handleInputBlur={sl.props.handleInputBlur} handleInputChange={sl.props.handleInputChange} index={index.toString()} products={products} edit_mode={sl.props.edit_mode} deleteRow={() => sl.props.deleteRow(index.toString())}/>
                    )
                }
            })
        }
        
        if (pembayaran.length != 0) {
            var th = this
            pembayaran.forEach(function(item, index) {
                pembayaran_rows.push(<PembayaranListRow key={index.toString()} item={item} payment_method_list={th.props.payment_method_list}/>)
            })
        }
        
        remaining = this.props.subtotal - this.props.potongan - this.props.paid
        
        var neverReceived = products.every(i => i.quantity_receive == 0 || i.quantity == undefined || i.quantity == '')
        
        if (['Receive', 'Paid', 'Purchase Order', 'Done'].includes(this.props.status)) {
    		remainingRow = <div className="row text-left mb-2">
        			            <div className="col-4">{remaining < 0 ? 'Deposit' : 'Remaining'}</div>
                                <div className="col-auto px-0">:</div>
                                <div className="col-2 text-right">Rp</div>
                                <div className="col text-right">{formatter2.format(remaining < 0 ? -remaining : remaining)}</div>
        			        </div>
        	pembayaran_header = <div className="row mx-0 fs14 fw600 row-header">
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
                    			
            paidRow = <div className="row text-left mb-2" style={paidStyle}>
    			            <div className="col-4">Paid</div>
                            <div className="col-auto px-0">:</div>
                            <div className="col-2 text-right">Rp</div>
                            <div className="col text-right">{formatter2.format(this.props.paid)}</div>
    			        </div>
                    			
            if (!neverReceived) {
                quantity_receive_header = <div className="col text-center">
                        					<span className="my-auto">Qty Received</span>
                        				</div>
            }
        } else if (is_refund) {
            pembayaran_header = <div className="row mx-0 fs14 fw600 row-header">
                    				<div className="col text-center">
                    					<span className="my-auto">Tanggal</span>
                    				</div>
                    				<div className="col text-center">
                    					<span className="my-auto">Jumlah Bayar</span>
                    				</div>
                    			</div>
            remainingRow = <div className="row text-left mb-2">
        			            <div className="col-4">Remaining</div>
                                <div className="col-auto px-0">:</div>
                                <div className="col-2 text-right">Rp</div>
                                <div className="col text-right">{formatter2.format(remaining < 0 ? 0 : remaining)}</div>
        			        </div>
        	refundRow = <div className="row text-left mb-2" style={refundStyle}>
        			            <div className="col-4">Refund</div>
                                <div className="col-auto px-0">:</div>
                                <div className="col-2 text-right">Rp</div>
                                <div className="col text-right">{formatter2.format(this.props.paid)}</div>
        			        </div>
        }
        
        var potongan
        if (['Draft', 'RFQ'].includes(this.props.status) || id == undefined || this.props.role == 'Master') {
            potongan = <input type="text" name="potongan" id="potongan" placeholder="0" autoComplete="off" className="form-control fs14 fw600 text-right border-0 p-0" style={fontStyle} onChange={this.props.handleInputChange} defaultValue={this.props.potongan || ''}/>
        } else {
            potongan = <span>{formatter2.format(this.props.potongan || 0)}</span>
        }
        
        
        return(
            <div>
    			<p className="fs18 fw600 text-dark mb-2">Products</p>
    			<div style={panel_style} className="p-4 mb-4">
    			    <div className="row mx-0 fs14 fw600 row-header">
        				<div className="col-3">
        					<span className="my-auto">Produk</span>
        				</div>
        				<div className="col-1 text-center">
        					<span className="my-auto">Qty</span>
        				</div>
        				<div className="col text-center">
        					<span className="my-auto">Product Unit Of Measurement</span>
        				</div>
        				{quantity_receive_header}
        				<div className="col text-center">
        					<span className="my-auto">Unit Price</span>
        				</div>
        				<div className="col text-center">
        					<span className="my-auto">Taxes</span>
        				</div>
        				<div className="col text-center">
        					<span className="my-auto">Disc (%)</span>
        				</div>
        				<div className="col text-right">
        					<span className="my-auto">Subtotal</span>
        				</div>
        				<div className="col-auto text-center">
        				    <div style={divStyle}/>
        				</div>
        			</div>
        			{rows}
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
                                <div className="col text-right">{formatter2.format(this.props.subtotal + tax - this.props.potongan)}</div>
        			        </div>
        			        {paidRow}
        			        {refundRow}
        			        {remainingRow}
        			    </div>
        			    <div className="col-4 mr-auto px-0">
        			        {pembayaran_header}
                			{pembayaran_rows}
        			    </div>
        			</div>
	        	</div>
    		</div>
        )
    }
}

class PembayaranListRow extends React.Component {
    render() {
        var bgStyle = {background: '#F5FBFF'}
        var item = this.props.item
        
        var payment_method = item.metode_pembayaran
        var pm_find = this.props.payment_method_list.find(p => p.name == item.metode_pembayaran)
        pm_find?payment_method = pm_find.method_name:false
        
        return(
            <div className="row mx-0">
        		<div className="col row-list" style={bgStyle}>
        			<div className="row mx-0 fs14 fw600">
        				<div className="col text-center">
        					<span>{moment(item.tanggal).format("DD-MM-YYYY") || ''}</span>
        				</div>
        				<div className="col text-center">
        					<span>{payment_method || ''}</span>
        				</div>
        				<div className="col text-center">
        					<span>{formatter2.format(item.jumlah) || ''}</span>
        				</div>
        			</div>
        		</div>
        	</div>
        )
    }
}

class ProductsListRow extends React.Component {
    reverseFormatNumber(val,locale){
        var group = new Intl.NumberFormat(locale).format(1111).replace(/1/g, '');
        var decimal = new Intl.NumberFormat(locale).format(1.1).replace(/1/g, '');
        var reversedVal = val.replace(new RegExp('\\' + group, 'g'), '');
        reversedVal = reversedVal.replace(new RegExp('\\' + decimal, 'g'), '.');
        return Number.isNaN(reversedVal) ? '' : reversedVal;
    }

    render() {
        var item = this.props.item
        var index = this.props.index
        var is_refund = this.props.is_refund
        var taxes = 0
        var inputProduct, inputQuantity, inputUOM, inputPrice, inputQuantityReceive, inputDiscount
        var productOptions = []
        var uomOptions = []
        var bgStyle = {background: '#F5FBFF'}
        var cursor = {cursor: 'pointer'}
        var divStyle = {width: '11px'}
        var deleteButton
        var required=false
        
        if(Object.keys(item).length != 0 && ['Draft','RFQ'].includes(this.props.status) && this.props.edit_mode){
            !item.default?deleteButton = <i className="fa fa-trash" style={cursor} onClick={this.props.deleteRow}/>:false
            required = true
        }
        else {
            deleteButton = <div style={divStyle}/>
        }
        
        if (['Draft', 'RFQ'].includes(this.props.status) && !is_refund && this.props.edit_mode) {
            this.props.productAll.forEach(function(item, index) {
                var display_name = item.name.startsWith('[') ? item.name : "[" + item.name + ']' + item.product_name
                productOptions.push(<option value={item.product_name} key={index.toString()}>{display_name}</option>)
            })
              
            this.props.uomAll.forEach(function(item, index) {
                uomOptions.push(<option value={item.uom_name} key={index.toString()}>{item.uom_name}</option>)
            })
            
            inputProduct = <div className="col-3">
								<input required={required} autoComplete="off" name='product' list="products" id="product" style={bgStyle} className="form-control border-0 fs14 fw600 px-0" onChange={e => this.props.handleInputChange(e, index)} onBlur={e => this.props.handleInputBlur(e, this.props.productAll, this.props.index)} value={item.product || ''}/>
									<datalist id="products">
										{productOptions}
									</datalist>
							</div>
			inputUOM = <div className="col text-center my-auto">
			                <select required={required} name='uom' id={"uom"+index} style={bgStyle} className="form-control border-0 fs14 fw600 px-0 text-center" onChange={e => this.props.handleInputChange(e, index)} value={item.uom || ''}>
			                    {uomOptions}
			                </select>
						</div>
						
			inputPrice = <input required={required} type="text" name="price" id={"price"+index} style={bgStyle} className="form-control border-0 fs14 fw600 text-center" onChange={e => this.props.handleInputChange(e, index)} value={item.price || ''} />
			inputDiscount = <input type="text" name="discount" id="discount" style={bgStyle} className="form-control border-0 fs14 fw600 text-center" onChange={e => this.props.handleInputChange(e, index)} value={item.discount || ''} />
							
			inputQuantity = <input required={required} type="text" name="quantity" id="quantity" style={bgStyle} className="form-control border-0 fs14 fw600 text-center" onChange={e => this.props.handleInputChange(e, index)} value={item.quantity || ''} />
        } else {
            inputProduct = <div className="col-3">
                                <span className="my-auto">{item.product}</span>
                            </div>
            inputUOM = <div className="col text-center my-auto">
                            <span>{item.uom || ''}</span>
                        </div>
            inputPrice = <span>{item.price ? formatter2.format(item.price) : ''}</span>
            inputDiscount = <span>{item.price ? formatter2.format(item.discount) : ''}</span>
            if (is_refund && this.props.paid == 0) {
                inputQuantity = <input type="text" name="quantity" id="quantity" style={bgStyle} className="form-control border-0 fs14 fw600 text-center" onChange={e => this.props.handleInputChange(e, index)} defaultValue={item.quantity || ''} />
            } else {
                inputQuantity = <span className="my-auto">{item.quantity}</span>
            }
        }
        
        var neverReceived = this.props.products.every(i => i.quantity_receive == 0)
        
        if ((this.props.status == 'Purchase Order' && !neverReceived) || ['Receive', 'Paid', 'Done'].includes(this.props.status)) {
          inputQuantityReceive = <div className="col text-center my-auto">
                                    <span>{item.quantity_receive}</span>
                                </div>
        }

        var newPrice, newQuantity, newDiscount

        if (['Draft', 'RFQ'].includes(this.props.status) && !is_refund && this.props.edit_mode) {
            newPrice = parseFloat(this.reverseFormatNumber(String(item.price || 0), 'id'))
            newQuantity = parseFloat(this.reverseFormatNumber(String(item.quantity || 0), 'id'))
            newDiscount = parseFloat(this.reverseFormatNumber(String(item.discount || 0), 'id'))
        } else {
            newPrice = item.price || 0
            newQuantity = item.quantity || 0
            newDiscount = item.discount || 0
        }

        var subtotal = item.quantity && item.price 
            ? formatter2.format(newPrice * newQuantity - ((newDiscount || 0) / 100 * (newPrice * newQuantity)) + taxes)
            : ''
        
        return(
            <div className="row mx-0">
        		<div className="col row-list" style={bgStyle}>
        			<div className="row mx-0 fs14 fw600">
        				{inputProduct}
        				<div className="col-1 text-center">
        					{inputQuantity}
        				</div>
        				{inputUOM}
        				{inputQuantityReceive}
        				<div className="col text-center my-auto">
        					{inputPrice}
        				</div>
        				<div className="col text-center my-auto">
        					<span>{item.price ? formatter2.format(taxes) : ''}</span>
        				</div>
        				<div className="col text-center my-auto">
        					{inputDiscount}
        				</div>
        				<div className="col text-right my-auto">
        					<span>{subtotal}</span>
        				</div>
        				<div className="col-auto text-center my-auto">
        					{deleteButton}
        				</div>
        			</div>
        		</div>
        	</div>
        )
    }
}

class PDF extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            'profile': {},
            'loaded': false,
        }
    }
    
    componentDidMount() {
        var ci = this
        
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetprofile.vetprofile.get_profile",
            args: {},
            callback: function(r){
                if (r.message) {
                    ci.setState({'profile': r.message.profile, 'loaded': true});
                }
            }
        });
    }
    
    render(){
        var data = this.props.data
        var profile = this.state.profile
        var payment_method_list = this.props.payment_method_list
        var page_dimension = {width: 559, minHeight: 794, top:0, right: 0, background: '#FFF', color: '#000', zIndex: -1}
        var borderStyle = {border: '1px solid #000', margin: '15px 0'}
        var row1 = {marginBottom: 12}
        var row2 = {margin: '0 -14px'}
        var th = {border: '1px solid #000'}
        var td = {borderLeft: '1px solid #000', borderRight: '1px solid #000'}
        var fs13 = {fontSize: 13}
        var fs11 = {fontSize: 11}
        var fs9 = {fontSize: 9}
        var invoice = {letterSpacing: 0, lineHeight: '24px', marginBottom: 0, marginTop: 18}
        var invoice2 = {letterSpacing: 0}
        var thead = {background: '#d9d9d9', fontSize: 11}
        var total_border = {borderTop: '1px solid #000', marginBottom: 5}
        var table_rows = []
        data.products.forEach((d, index) => {
            table_rows.push(
                <tr key={d.name} style={fs9} className="text-center">
                    <td className="py-1">{d.product_name}</td>
                    <td className="py-1">{d.quantity}</td>
                    <td className="py-1">{d.uom_name}</td>
                    <td className="py-1">{d.quantity_receive}</td>
                    <td className="py-1">{d.discount}%</td>
                    <td className="py-1">{formatter.format(d.price)}</td>
                    <td className="py-1">{formatter.format(d.price * d.quantity - ((d.discount || 0) / 100 * (d.price * d.quantity)))}</td>
                </tr>
            )
        })
        var payment_rows = []
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
        
        var remaining = this.props.subtotal - data.potongan - this.props.paid
        var refund_border = {border: '2px solid #000'}
        var refund = (
            <div className="col-3 mr-auto">
                <div className="fs16 fw600 px-3 py-2 text-uppercase text-center" style={refund_border}>
                    Refund
                </div>
            </div>
        )

        if (this.state.loaded) {
            var image
            if (profile.image != undefined){
                var image_style = {position: 'absolute', top: 0, left: 0, objectFit: 'cover', height: '100%'}
                image = <img src={profile.temp_image || profile.image} style={image_style}/>
            } else {
                image = <img src={profile.temp_image} style={image_style} />
            }

            return(
                <div className="position-absolute d-none" style={page_dimension}>
                    <div id="pdf" className="px-4" style={page_dimension}>
                        <div className="row">
                            <div className="col-2 px-0">
                                {image}
                                {/* <img className="mt-3" src="/static/img/main/menu/naturevet_logo_2x.png"/> */}
                            </div>
                            <div className="col-5">
                                <p className="my-3 fwbold text-uppercase" style={fs13}>{profile.clinic_name}</p>
                                <p className="my-0" style={fs9}>{profile.address}</p>
                                <p className="my-0" style={fs9}>Telp. : {profile.phone}</p>
                            </div>
                            <div className="col-5 px-0">
                                <p className="fwbold text-right text-uppercase fs28" style={invoice}>Purchase Order</p>
                                <p className="fw600 text-right text-uppercase fs14" style={invoice2}>{data.name}</p>
                            </div>
                            <div className="col-12" style={borderStyle}/>
                        </div>
                        <div className="row mx-0" style={row1}>
                            <div className="col-6 px-0">
                                <p className="mb-0 fs10">{data.supplier_name}<i className="fa fa-arrow-right mx-2"/>{data.is_refund?data.deliver_from_name:data.deliver_to_name}</p>
                            </div>
                            <div className="col-6 px-0">
                                <p className="mb-0 fs10 text-right">
                                    {moment(data.is_refund?data.refund_date:data.order_date).format('DD-MM-YYYY')}
                                </p>
                                <p className="mb-0 fs10 text-right">
                                    {data.user_name}
                                </p>
                            </div>
                        </div>
                        <table className="fs12" style={row2}>
                            <thead className="text-uppercase" style={thead}>
                                <tr className="text-center">
                                    <th className="fw700 py-2" width="183px">Product</th>
                                    <th className="fw700 py-2" width="52px">Qty</th>
                                    <th className="fw700 py-2" width="68px">UOM</th>
                                    <th className="fw700 py-2" width="52px">Qty Received</th>
                                    <th className="fw700 py-2" width="68px">Disc</th>
                                    <th className="fw700 py-2" width="68px">Harga</th>
                                    <th className="fw700 py-2" width="68px">Jumlah</th>
                                </tr>
                            </thead>
                            <tbody>
                                {table_rows}
                            </tbody>
                        </table>
                        <div className="row justify-content-end mb-2">
                            <div className="col-12" style={borderStyle}/>
                            {data.is_refund?refund:false}
                            <div className="col-7 px-0">
                                <div className="row" style={fs11}>
                                    <div className="col-6 text-right fw600">
                                        Sub Total
                                    </div>
                                    <div className="col-6 text-right">
                                        {formatter.format(this.props.subtotal)}
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
                                        {formatter.format(this.props.subtotal-data.potongan)}
                                    </div>
                                </div>
                                {payment_rows}
                                <div className="row" style={fs11}>
                                    <div className="col-6 text-right fw600">
                                        {remaining<0?"Deposit":"Remaining"}
                                    </div>
                                    <div className="col-6 text-right">
                                        {remaining<0?formatter.format(-remaining):formatter.format(remaining)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
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

ReactDOM.render(<PurchaseOrder />,document.getElementById("purchase_order_form"));