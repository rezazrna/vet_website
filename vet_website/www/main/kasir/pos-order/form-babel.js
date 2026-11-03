var id = getUrlParameter('n')
// var tzOffset = new Date().getTimezoneOffset()
var tzOffset = 0

class PosOrder extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'loaded': false,
            'data': {},
            'payment_method_list': [],
            'currentUser': {},
            'show_refund': false,
        }
        
        this.navigationAction = this.navigationAction.bind(this)
        this.deleteRow = this.deleteRow.bind(this)
        this.changeInput = this.changeInput.bind(this)
    }
    
    componentDidMount() {
        var lastfilter = JSON.parse(sessionStorage.getItem('/main/kasir/pos-order'))
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
            method:"vet_website.vet_website.doctype.vetposorder.vetposorder.get_name_list",
            args: {filters: lastfilter},
            callback: function(r){
                if (r.message) {
                    gr.setState({'namelist': r.message});
                }
            }
        })
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetposorder.vetposorder.get_pos_order",
            args: {name: id},
            callback: function(r){
                if (r.message) {
                    console.log(r.message)
                    r.message.order.produk.forEach(i => {
                        var uom = r.message.uom_list.find(u => u.name == i.uom)
                        i.uom_name = uom.uom_name
                        
                        if (r.message.order.is_refund) {
                            i.quantity_default = i.quantity
                        }
                    })
                    gr.setState({'data': r.message.order, 'payment_method_list': r.message.payment_method_list, 'loaded': true});
                }
            }
        });
    }
    
    navigationAction(name){
        window.location.href="/main/kasir/pos-order/form?n="+name
    }
    
    refundOrder(e) {
        e.preventDefault()
        
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetposorder.vetposorder.refund_order",
            args: {name: id},
            callback: function(r){
                if (r.message) {
                    window.location.href="/main/kasir/pos-order/form?n="+r.message.order.name
                }
            }
        });
    }

    changeInput(e, i=false){
        console.log(i)
        var ci = this
        var target = e.target
        var name = target.name
        var value = target.value
        var new_data = Object.assign({}, this.state.data)
        var selected = false
        
        if (['quantity'].includes(name)) {
            new_data.produk[i][name] = value || 0

            if (new_data.produk[i].price) {
                new_data.produk[i].amount = new_data.produk[i].price * Math.ceil(parseFloat(value || 0)) - ((new_data.produk[i].disc || 0) / 100 * (new_data.produk[i].price * Math.ceil(parseFloat(value || 0))))
                // new_data.invoice_line[service][i].total = new_data.invoice_line[service][i].unit_price * parseFloat(value) - ((new_data.invoice_line[service][i].discount || 0) / 100 * (new_data.invoice_line[service][i].unit_price * parseFloat(value)))
            }  
            ci.setState({data: new_data})
            ci.refresh_subtotal()
	    }
    }

    togglePopupRefund() {
        var new_data = this.state.data
        if (new_data.produk.filter(i => i.quantity).every(i => i.quantity_default >= i.quantity)) {
            this.setState({'show_refund': !this.state.show_refund})
        } else {
            frappe.msgprint('Quantity Melebihi Batas')
        }
    }

    deleteRow(i){
        var new_data = this.state.data
        if(new_data.produk[i].name != undefined){
            new_data.produk[i].deleted = true
        }else {
            new_data.produk.splice(i, 1)
        }
        this.setState({data: new_data})
        this.refresh_subtotal()
    }

    refresh_subtotal() {
        var new_data = this.state.data
        var order_produk = new_data.produk
        new_data.subtotal = 0
        order_produk.forEach(function(item, index) {
            if (item.price && !item.deleted) {
                new_data.subtotal += item.amount
            }
        })
        new_data.total = new_data.subtotal
        this.setState({data: new_data})
    }
    
    printPDF(e, mini=false) {
        var pdfid = 'pdf'
        var format = [700,948]
        
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
        var opt = {
            margin: [10, 0, 10, 0],
            filename: th.state.data.session+"-"+th.state.data.name+".pdf",
            pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', '.row'] },
            html2canvas: {scale: 3},
            jsPDF: {orientation: 'p', unit: 'pt', format: [format[0]*0.754,format[1]*0.754]}
        }
        html2pdf().set(opt).from(source).save()
        // doc.html(source, {
        //   callback: function (doc) {
        //      doc.save(th.state.data.session+"-"+th.state.data.name+".pdf");
        //   },
        //   x: 0,
        //   y: 0,
        //   html2canvas: {
        //       scale: 1,
        //   }
        // });
    }
    
    render() {
        var bgstyle = {background: '#FFFFFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', padding: '2px 32px', marginBottom: '15px'}
        var lh14 = {lineHeight: '14px'}
        var rowMinHeight = {minHeight: '64px'}
        var color = {color: '#056EAD', cursor: 'pointer'}
        var data = this.state.data
        var refundBtn, payRefundBtn, popup_refund
        var refund = checkPermission('VetPosOrder', this.state.currentUser, 'refund')

        if (this.state.loaded) {
            var paid = data.payment.reduce((total, p) => total += p.value, 0)
            var isDone = paid >= data.total
            console.log(this.state.data)
            if (!data.already_refund && !data.is_refund && refund) {
                refundBtn = <div className="col-auto d-flex my-auto" key="2">
                				<button type="button" className="d-block btn btn-sm btn-danger fs12 text-uppercase fwbold py-2 px-4" onClick={(e) => this.refundOrder(e)}>Refund</button>
                			</div>
            }

            if (!isDone && data.is_refund) {
                payRefundBtn = <div className="col-auto d-flex my-auto" key="3">
                				<button type="button" className="d-block btn btn-sm btn-danger fs12 text-uppercase fwbold py-2 px-4" onClick={() => this.togglePopupRefund()}>Pay</button>
                			</div>
            }

            if (this.state.show_refund) {
                popup_refund = <PopupRefund togglePopupRefund={() => this.togglePopupRefund()} name={this.state.data.name} subtotal={this.state.data.subtotal} total={this.state.data.total} paid={paid} order_produk={this.state.data.produk} payment_method_list={this.state.payment_method_list}/>
            }
        	
    		return <form onSubmit={this.formSubmit}>
    		            <PDF data={data}/>
    		            <PDFMini data={data}/>
    	            	<div style={bgstyle}>
    	            		<div className="row mx-0 flex-row-reverse" style={rowMinHeight}>
		            			{refundBtn}
                                {payRefundBtn}
		            			<div className="col-auto d-flex my-auto"><button type="button" onClick={(e) => this.printPDF(e, true)} className="d-block btn btn-sm btn-outline-danger fs12 text-uppercase fwbold py-2 px-4">Print</button></div>
		            			<span key="999" className="fs16 fw600 mr-auto my-auto" style={color} onClick={() => window.location.href='/main/kasir/pos-order'}><i className="fa fa-chevron-left mr-1" style={color}></i>Back</span>
		            		</div>
    	            	</div>
    	            	<div className="row justify-content-end">
    	            	    <div className="col-auto">
    	            	        <RecordNavigation currentname={this.state.data.name} namelist={this.state.namelist} navigationAction={this.navigationAction}/>
    	            	    </div>
    	            	</div>
    	            	<PosOrderMainForm data={data}/>
    	            	<PosOrderProducts data={data} payment_method_list={this.state.payment_method_list} isDone={isDone} isRefund={data.is_refund} deleteRow={this.deleteRow} changeInput={this.changeInput}/>
                        {popup_refund}
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

class PosOrderMainForm extends React.Component {
    render() {
        var bgstyle2 = {background: '#FFFFFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)'}
        var data = this.props.data
        
        return <div>
        			<p className="fs18 fw600 text-dark mb-2">Data Order</p>
        			<div style={bgstyle2} className="p-4 mb-4">
		        		<div className="row mx-0">
            	            <div className="col">
            	                <div>
                					<label htmlFor="session" className="fw600">Session</label>
                					<div><span className="fs16 px-0">{data.session}</span></div>
                				</div>
        	                </div>
        	                <div className="col">
            	                <div>
                					<label htmlFor="order_date" className="fw600">Tanggal</label>
                					<div><span className="fs16 px-0">{moment(data.order_date).subtract(tzOffset, 'minute').format('YYYY-MM-DD HH:mm')}</span></div>
                				</div>
        	                </div>
        	                <div className="col">
            	                <div>
                					<label htmlFor="owner_name" className="fw600">Pemilik</label>
                					<div><span className="fs16 px-0">{data.owner_name}</span></div>
                				</div>
        	                </div>
        	                <div className="col">
            	                <div>
                					<label htmlFor="pet_name" className="fw600">Hewan</label>
                					<div><span className="fs16 px-0">{data.pet_name}</span></div>
                				</div>
        	                </div>
        	                <div className="col">
            	                <div>
                					<label htmlFor="responsible" className="fw600">Responsible</label>
                					<div><span className="fs16 px-0">{data.responsible_name}</span></div>
                				</div>
        	                </div>
	            		</div>
		        	</div>
        		</div>
    }
}

class PosOrderProducts extends React.Component {
    render() {
        var panel_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px'}
        var data = this.props.data
        var rows = []
        var payment_rows = []
        var payment_list, deleteRow
        var blueStyle = {'color': '#1B577B'}
        var lineStyle = {'border': '1px solid #1B577B'}
        var isDone = this.props.isDone
        var isRefund = this.props.isRefund
        var sl = this
        
        if (data.produk.length != 0){
            data.produk.forEach(function(item, index){
                if (!item.deleted) {
                    rows.push(
                        <ProdukListRow key={index.toString()} item={item} index={index.toString()} isDone={sl.props.isDone} isRefund={sl.props.isRefund} deleteRow={() => sl.props.deleteRow(index)} changeInput={(e) => sl.props.changeInput(e, index)}/>
                    )
                }
            })
        }
        
        if(data.payment.length != 0){
            data.payment.forEach(p => p.value-p.exchange!=0?payment_rows.push(<PosOrderPaymentRow item={p} key={p.name} payment_method_list={sl.props.payment_method_list}/>):false)
            payment_list = (
                <div>
			        <div className="row mx-0 fs14 fw600 row-header">
        				<div className="col text-center">
        					<span className="my-auto">Metode Pembayaran</span>
        				</div>
        				<div className="col text-center">
        					<span className="my-auto">Jumlah</span>
        				</div>
        			</div>
        			{payment_rows}
			    </div>
			)
        }

        if (!isDone && isRefund) {
            deleteRow = <div className="col-1 text-right">
                        </div>
        }
        
        
        return(
			<div style={panel_style} className="p-4 mb-4">
			    <div className="row mx-0 fs14 fw600 row-header">
    				<div className="col-3">
    					<span className="my-auto">Produk</span>
    				</div>
    				<div className="col-1 text-center">
    					<span className="my-auto">Qty</span>
    				</div>
    				<div className="col text-center">
    					<span className="my-auto">UOM</span>
    				</div>
    				<div className="col text-center">
    					<span className="my-auto">Unit Price</span>
    				</div>
    				<div className="col text-center">
    					<span className="my-auto">Disc</span>
    				</div>
    				<div className="col text-right">
    					<span className="my-auto">Amount</span>
    				</div>
                    {deleteRow}
    			</div>
    			{rows}
    			<div className="row mx-0 justify-content mt-4 fw600">
    			    <div className="col-4 mr-auto px-0">
    			        {payment_list}
    			    </div>
    			    <div className="col-4" style={blueStyle}>
    			        <div className="row text-left mb-2">
    			            <div className="col-4">Subtotal</div>
                            <div className="col-auto px-0">:</div>
                            <div className="col-2 text-right">Rp</div>
                            <div className="col text-right">{formatter2.format(data.subtotal)}</div>
    			        </div>
    			        <div className="row text-left mb-2">
    			            <div className="col-4">Tax</div>
                            <div className="col-auto px-0">:</div>
                            <div className="col-2 text-right">Rp</div>
                            <div className="col text-right">{formatter2.format(data.tax)}</div>
    			        </div>
    			        <hr style={lineStyle} className="mb-2" />
    			        <div className="row text-left mb-2 fs20 fw600 mb-4">
    			            <div className="col-4">Total</div>
                            <div className="col-auto px-0">:</div>
                            <div className="col-2 text-right">Rp</div>
                            <div className="col text-right">{formatter2.format(data.total)}</div>
    			        </div>
        			</div>
    			</div>
        	</div>
        )
    }
}

class PosOrderPaymentRow extends React.Component {
    render() {
        var bgStyle = {background: '#F5FBFF'}
        var item = this.props.item
        var payment_method = item.type
        var pm_find = this.props.payment_method_list.find(p => p.name == item.type)
        pm_find?payment_method=pm_find.method_name:false
        
        return(
            <div className="row mx-0">
        		<div className="col row-list" style={bgStyle}>
        			<div className="row mx-0 fs14 fw600">
        				<div className="col text-center">
        					<span>{payment_method || ''}</span>
        				</div>
        				<div className="col text-center">
        					<span>{formatter2.format(item.value-item.exchange || 0)}</span>
        				</div>
        			</div>
        		</div>
        	</div>
        )
    }
}

class ProdukListRow extends React.Component {
    render() {
        var item = this.props.item
        var isDone = this.props.isDone
        var isRefund = this.props.isRefund
        var bgStyle = {background: '#F5FBFF'}
        var quantity = <span className="my-auto">{item.quantity}</span>
        var deleteButton

        console.log(isDone)
        console.log(isRefund)

        if (!isDone && isRefund) {
            quantity = <input required={true} autoComplete="off" placeholder="0" name='quantity' id="quantity" style={bgStyle} className="form-control border-0 fs14 fw600 p-0 h-auto text-center" onChange={this.props.changeInput} defaultValue={Math.ceil(item.quantity)||''}/>
            if (item.produk && item.quantity) {
                var cursor = {cursor: 'pointer'}
                deleteButton = <div className="col-1 text-center">
                                <i className="fa fa-trash" style={cursor} onClick={this.props.deleteRow}/>
                            </div>
            }
        }
        
        return(
            <div className="row mx-0">
        		<div className="col row-list" style={bgStyle}>
        			<div className="row mx-0 fs14 fw600">
        				<div className="col-3">
                            <span className="my-auto">{item.nama_produk}</span>
                        </div>
        				<div className="col-1 text-center">
        					{quantity}
        				</div>
        				<div className="col text-center my-auto">
                            <span className="my-auto">{item.uom_name}</span>
                        </div>
        				<div className="col text-center my-auto">
        					<span className="my-auto">{formatter2.format(item.price || 0)}</span>
        				</div>
        				<div className="col text-center my-auto">
        					<span className="my-auto">{item.disc}</span>
        				</div>
        				<div className="col text-right my-auto">
        					<span className="my-auto">{formatter2.format(item.amount || 0)}</span>
        				</div>
                        {deleteButton}
        			</div>
        		</div>
        	</div>
        )
    }
}

class PopupRefund extends React.Component {
    constructor(props) {
        super(props)
        this.state={
            'data': {'name': this.props.name, 'order_produk': this.props.order_produk},
            'loading': false,
        }
        
        this.handleInputChange = this.handleInputChange.bind(this)
        this.submitRefund = this.submitRefund.bind(this)
    }
    
    componentDidMount(){
        console.log(this.props.total)
        console.log(this.props.paid)
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
            if (new RegExp(/,$/g).test(value)) {
                new_data.refund = value
            } else {
                var filtered = this.reverseFormatNumber(value, 'id')
                console.log(filtered)
                if(filtered != ''){
                    var formatted = parseFloat(filtered).toLocaleString('id-ID')
                    console.log(formatted)
                    new_data.refund = formatted
                }
            }
        }
        else {
            new_data[name] = value
        }
        this.setState({data: new_data})
    }
    
    
    setPaymentMethod(value, method_type){
        var new_data = Object.assign({}, this.state.data)
        new_data.payment_method = value
        new_data.method_type = method_type
        this.setState({data: new_data})
    }
    
    submitRefund(e) {
        e.preventDefault()
        var remaining = 0

        if (this.state.loading) {
            return;
        }

        this.setState({loading: true})
        
        remaining = this.props.total - this.props.paid
        if(['',undefined,null].includes(this.state.data.refund)){
            var new_data = Object.assign({}, this.state.data)
            new_data.refund = parseFloat(remaining).toLocaleString('id-ID')
            this.setState({'data': new_data, 'loading': false})
        }
        else if (parseFloat(this.reverseFormatNumber(this.state.data.refund, 'id')) > remaining) {
            this.setState({loading: false})
            frappe.msgprint('Hanya ada sisa ' + formatter.format(remaining))
        } else if (this.state.data.payment_method != undefined) {
            var new_data = this.state.data
            var order_produk = new_data.order_produk
            new_data.refund = parseFloat(this.reverseFormatNumber(new_data.refund, 'id'))
        
            new_data.order_produk = order_produk.filter(i => i.produk && i.quantity)
            new_data.order_produk.forEach(function(item, index) {
                if (item.quantity == '0' || item.quantity == 0) {
                    item.is_delete = true
                }
            })
            
            console.log(new_data)
            
            frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetpossessions.vetpossessions.submit_refund",
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
            } else if((pm.method_type == 'Deposit Customer') && this.props.total_credit > 0){
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
            pm_buttons.push(<div key={pm.name} className="col-6 px-1 pb-2"><button type="button" style={th.state.data.payment_method == pm.method_name? payStyle :batalStyle} className="btn btn-block p-3 h-100 text-truncate fs12" onClick={() => th.setPaymentMethod(pm.method_name, pm.method_type)}>{detail}</button></div>)
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
                                    <button className={this.state.loading
                                        ? "btn btn-sm fs18 h-100 fwbold px-4 disabled"
                                        : "btn btn-sm fs18 h-100 fwbold px-4"} style={refundStyle} onClick={this.submitRefund}>Refund</button>
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
        var page_dimension = {width: 700, minHeight: 948, top:0, left: 0, background: '#FFF', color: '#1B577B', zIndex: -1, letterSpacing: '2px'}
        var borderStyle = {border: '1px solid #1B577B', margin: '15px 0'}
        var row1 = {marginBottom: 32}
        var row2 = {marginBottom: 40, border: '1px solid #1B577B', borderCollapse: 'collapse', width: '100%'}
        var th = {border: '1px solid #1B577B'}
        var td = {borderLeft: '1px solid #1B577B', borderRight: '1px solid #1B577B'}
        var fontSize = {fontSize: 14}
        var fontSize2 = {fontSize: 12}
        
        var table_rows = []
        if(data.produk.length != 0){
            data.produk.forEach((f,index) => {
                table_rows.push(
                    <tr key={f+index.toString()}>
                        <td className="px-2 py-1" style={td}>{f.nama_produk}</td>
                        <td className="py-1 text-center" style={td}>{f.quantity}</td>
                        <td className="py-1 text-center" style={td}>{f.uom_name}</td>
                        <td className="py-1 text-center" style={td}>{formatter.format(f.price)}</td>
                        <td className="py-1 text-center" style={td}>{f.disc?f.disc+"%":''}</td>
                        <td className="py-1 text-center" style={td}>{formatter.format(f.amount)}</td>
                    </tr>
                )
            })
        }

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
					<div id="pdf" className="px-4 py-3" style={page_dimension}>
						<div className="row">
							<div className="col-12 text-center">
								<p className="my-3 fs22 fwbold text-uppercase">{profile.clinic_name}</p>
								<p className="my-0 fs12">{profile.address}</p>
								<p className="my-0 fs12">Telp. : {profile.phone}</p>
								<div style={borderStyle}/>
							</div>
						</div>
						<div className="row mx-0" style={row1}>
							<div className="col-6 px-1">
								<PDFRow label="Tanggal Invoice" value={moment(data.order_date).format('DD-MM-YYYY')}/>
								<PDFRow label="Nama Pasien" value={data.pet_name || '-'}/>
								<PDFRow label="Nama Pemilik" value={data.owner_name || '-'}/>
							</div>
							<div className="col-6 px-1">
								<PDFRow label="Nama Pasien" value={data.pet_name || '-'}/>
								<PDFRow label="Nomor Invoice" value={data.name}/>
								<PDFRow label="Responsible" value={data.responsible_name}/>
							</div>
						</div>
						<table className="fs12" style={row2}>
							<thead>
								<tr className="text-center">
									<th className="fw700 py-2" width="290px" style={th}>Name</th>
									<th className="fw700 py-2" width="30px" style={th}>Qty</th>
									<th className="fw700 py-2" width="50px" style={th}>UOM</th>
									<th className="fw700 py-2" width="90px" style={th}>Unit Price</th>
									<th className="fw700 py-2" width="90px" style={th}>Disc</th>
									<th className="fw700 py-2" width="90px" style={th}>Total</th>
								</tr>
							</thead>
							<tbody>
								{table_rows}
							</tbody>
						</table>
						<div className="row justify-content-end" style={row1}>
							<div className="col-4">
								<div className="row fw700" style={fontSize}>
									<div className="col-auto">
										Amount
									</div>
									<div className="col text-right">
										{formatter.format(data.total)}
									</div>
								</div>
							</div>
						</div>
						<div className="row justify-content-end">
							<div className="col-auto text-center" style={fontSize2}>
								<p className="mb-5">Responsible</p>
								<p className="mb-0">{data.responsible_name}</p>
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
        console.log(data)
        var page_dimension = {width: 302, minHeight: 525, top:0, left: 0, background: '#FFF', color: '#000', zIndex: -1}
        var page_scale = {transform: 'scale(78%)', transformOrigin: 'top left'}
        var borderStyle = {border: '1px solid #000', margin: '15px 0 2px'}
        var borderStyle2 = {borderBottom: '1px solid #000'}
        var row1 = {marginBottom: 2}
        var row2 = {marginBottom: 10, width: '100%'}
        var total_border = {borderTop: '1px solid #000', marginBottom: 5}
        var fontSize = {fontSize: 12}
        var fontSize2 = {fontSize: 9}
        var logo = {width: 72}
        
        var table_rows = []
        if(data.produk.length != 0){
            data.produk.forEach((f,index) => {
                table_rows.push(
                    <tr key={f+index.toString()}>
                        <td className="px-2 py-1">{f.nama_produk}</td>
                        <td className="py-1">{f.quantity+" x "+formatter.format(f.price)}</td>
                        <td className="py-1 text-right">{formatter.format(f.amount)}</td>
                    </tr>
                )
            })
        }

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
					<div id="pdfmini" className="px-2 py-3" style={Object.assign({}, page_dimension, page_scale)}>
						<div className="row">
							<div className="col-auto pr-0">
								{image}
								{/* <img src="/static/img/main/menu/naturevet_logo.png" style={logo}/> */}
							</div>
							<div className="col-8">
								<p className="my-0 fs12 fwbold text-uppercase">{profile.clinic_name}</p>
								<p className="my-0" style={fontSize2}>{profile.address}</p>
								<p className="my-0" style={fontSize2}>Telp. : {profile.phone}</p>
							</div>
							<div className="col-12">
								<div style={borderStyle}/>
							</div>
						</div>
						<div className="row mx-0" style={row1}>
							<div className="col-6 px-1">
								<PDFMiniRow label="Pet Name" value={data.pet_name}/>
								<PDFMiniRow label="Owner Name" value={data.owner_name}/>
							</div>
							<div className="col-6 px-1">
								<PDFMiniRow label="Tanggal Invoice" value={moment(data.invoice_date).format('DD-MM-YYYY HH:mm')} text_align='right'/>
								<PDFMiniRow label="No. Invoice" value={data.name} text_align='right'/>
								<PDFMiniRow label="Responsible" value={data.responsible_name} text_align='right'/>
							</div>
						</div>
						<table style={Object.assign({}, row2, fontSize2)}>
							<tbody>
								{table_rows}
							</tbody>
						</table>
						<div className="row justify-content-end">
							<div className="col-6">
								<div style={total_border}/>
							</div>
						</div>
						<div className="row justify-content-end mb-2">
							<div className="col-8">
								<div className="row" style={fontSize2}>
									<div className="col-6 text-right fw600">
										Sub Total
									</div>
									<div className="col-6 text-right">
										{formatter.format(data.subtotal)}
									</div>
								</div>
								<div className="row" style={fontSize2}>
									<div className="col-6 text-right fw600">
										Diskon
									</div>
									<div className="col-6 text-right">
										{formatter.format(data.potongan || 0)}
									</div>
								</div>
							</div>
						</div>
						<div className="row justify-content-end">
							<div className="col-6">
								<div style={total_border}/>
							</div>
						</div>
						<div className="row justify-content-end mb-2">
							<div className="col-8">
								<div className="row" style={fontSize2}>
									<div className="col-6 text-right fw600">
										Total
									</div>
									<div className="col-6 text-right">
										{formatter.format(data.total)}
									</div>
								</div>
								<div className="row" style={fontSize2}>
									<div className="col-6 text-right fw600">
										Cash
									</div>
									<div className="col-6 text-right">
										{formatter.format(data.payment.reduce((total, a) => total += a.value, 0))}
									</div>
								</div>
								<div className="row" style={fontSize2}>
									<div className="col-6 text-right fw600">
										Change
									</div>
									<div className="col-6 text-right">
										{formatter.format(data.payment.reduce((total, a) => total += a.exchange, 0))}
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

class PDFMiniRow extends React.Component{
    render(){
        var lineHeight = {lineHeight: '18px'}
        var fontSize = {fontSize: 9, textAlign: this.props.text_align||'left'}
        
        return(
            <div className="row mx-0" style={lineHeight}>
                <div className="col-12 fw600" style={fontSize}>
                    {this.props.value}
                </div>
            </div>
        )
    }
}


ReactDOM.render(<PosOrder />,document.getElementById("pos_order_form"));
