var id = getUrlParameter('n')

class Operation extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            'data': {},
            'loaded': false,
            'show_receive': false,
            'edit_mode': false,
            'currentUser': {},
            'submit_loading': false,
        }
        
        this.changeInput = this.changeInput.bind(this)
        this.inputBlur = this.inputBlur.bind(this)
        this.toggleReceive = this.toggleReceive.bind(this)
        this.navigationAction = this.navigationAction.bind(this)
    }
    
    componentDidMount() {
        var lastfilter = JSON.parse(sessionStorage.getItem('/main/inventory/operation'))
        if(this.props.usage){
            lastfilter = JSON.parse(sessionStorage.getItem('/main/accounting/usage'))
        }
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
            method:"vet_website.vet_website.doctype.vetoperation.vetoperation.get_name_list",
            args: {filters: lastfilter},
            callback: function(r){
                if (r.message) {
                    gr.setState({'namelist': r.message});
                }
            }
        })
        this.getInitialData()
    }
    
    getInitialData(){
        var gr = this
        var args = {}
        if(id != undefined){
            args = {name: id}
        }
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetoperation.vetoperation.get_operation_form",
            args: args,
            callback: function(r){
                if (r.message) {
                    console.log(r.message)
                    var update = {'loaded': true, 'gudang_list': r.message.gudang_list, 'product_list': r.message.product_list, 'uom_list': r.message.uom_list, 'accounts': r.message.accounts, 'edit_mode': false}
                    if(r.message.operation != undefined){
                        update.data = r.message.operation
                    }
                    else {
                        update.data = {moves: [{}], date: moment().format('YYYY-MM-DD')}
                        if(gr.props.usage){
                            update.data = {'is_usage': 1, reference: '-', to: 'USAGE', to_name: 'USAGE', moves: [{}], date: moment().format('YYYY-MM-DD')}
                        }
                    }
                    gr.setState(update);
                }
            }
        });
    }
    
    navigationAction(name){
        this.props.usage?window.location.href="/main/accounting/usage/edit?n="+name:window.location.href="/main/inventory/operation/edit?n="+name
    }
    
    changeInput(e, i=false){
        var ci = this
        var target = e.target
        var name = target.name
        var value = target.value
        var new_data = Object.assign({}, this.state.data)
        var selected = false
        
        if(['from','to'].includes(name)){
            new_data[name] = value
            this.setState({data: new_data})
        }
        else if (name == 'product') {
	        selected = this.state.product_list.find(i => i.product_name == value)
	        if (selected) {
	            frappe.call({
	                type: "GET",
	                method:"vet_website.vet_website.doctype.vetproduct.vetproduct.get_product_details",
	                args: {name: selected.name},
	                callback: function(r){
	                    if (r.message) {
	                        if (Object.keys(new_data.moves[i]).filter(n => !['product', 'product_name'].includes(n)).length === 0) {
	                            new_data.moves.push({})
	                        }
	                        new_data.moves[i].product_name = r.message.product_name
	                        new_data.moves[i].uom_name = r.message.uom
	                        new_data.moves[i].product = selected.name
	                        new_data.moves[i].price = selected.price
	                        var selected_uom = ci.state.uom_list.find(i => i.uom_name == r.message.uom)
	                        new_data.moves[i].product_uom = selected_uom.name
	                        ci.setState({data: new_data})
	                    }
	                }
	            });
	        }
	        else {
	            new_data.moves[i].product_name = value
	            new_data.moves[i].product = value
	            delete new_data.moves[i].uom_name
	            delete new_data.moves[i].price
	            this.setState({data: new_data})
	        }
        }
        else if (name == 'product_uom') {
	        selected = this.state.uom_list.find(i => i.uom_name == value)
	        if (selected) {
	            new_data.moves[i].uom_name = selected.uom_name
	            new_data.moves[i].product_uom = selected.name
                ci.setState({data: new_data})
	        }
        }
        else if (['quantity'].includes(name)) {
	        if (Object.keys(new_data.moves[i]).length === 0) {
                new_data.moves.push({})
            }
            
	        new_data.moves[i][name] = value
	        this.setState({data: new_data})
	    }
        else{
            new_data[name] = value
            this.setState({data: new_data})
        }
    }
    
    inputBlur(e, list, i=false) {
        const value = e.target.value
        const name = e.target.name
        var new_data = Object.assign({}, this.state.data)
    	var selected = false
    	
    	if (['from','to'].includes(name)) {
    	    if(name == 'to' && this.props.usage){
    	        selected = true
    	    } else {
    	        selected = list.find(i => i.gudang_name == value)
    	    }
    	}
    	if (name == 'product') {
    	    selected = list.find(i => i.product_name == value)
    	}
    	if (name == 'product_uom') {
    	    selected = list.find(i => i.uom_name == value)
    	}
    	if (name == 'expense_account') {
    	    selected = list.find(i => i.account_name == value)
    	}
    	if (!selected) {
    		e.target.value = ''
    		if (['from','to','expense_account'].includes(name)) {
		        new_data[name] = ''
		        this.setState({data: new_data})
    		}
    		else if(name == 'product'){
    		    delete new_data.moves[i].product
    		    delete new_data.moves[i].product_name
    		    delete new_data.moves[i].uom_name
    		    this.setState({data: new_data})
    		}
    		else if(name == 'product_uom'){
    		    delete new_data.moves[i].product_uom
    		    delete new_data.moves[i].uom_name
    		    this.setState({data: new_data})
    		}
    	}
    }
    
    statusDone(){
        console.log('masuk statusDone')
        var new_data = Object.assign({}, this.state.data)
        new_data.is_done = true
        if(id == undefined){
            this.setState({data: new_data})
        }
    }
    
    formSubmit(e){
        e.preventDefault()
        var op = this
        var method, args
        var new_data = this.state.data
        if (!this.state.submit_loading) {
            this.setState({submit_loading: true})

            if(['Draft'].includes(this.state.data.status)){
                if(this.props.usage){
                    if(!this.state.edit_mode){
                        frappe.call({
                            type: "POST",
                            method:"vet_website.vet_website.doctype.vetoperation.vetoperation.usage_operation_submit",
                            args: {name: new_data.name},
                            callback: function(r){
                                console.log(r.message)
                                window.location.reload()
                                
                            }
                        })
                    } else {
                        new_data.from_name = new_data.from
                        new_data.from = this.state.gudang_list.find(i => i.name == new_data['from'] || i.gudang_name == new_data['from']).name
                        new_data.expense_account_name = new_data.expense_account
                        new_data.expense_account = this.state.accounts.find(i => i.name == new_data['expense_account'] || i.account_name == new_data['expense_account']).name
                        
                        console.log(this.state.data)
                        frappe.call({
                            type: "POST",
                            method:"vet_website.vet_website.doctype.vetoperation.vetoperation.edit_operation",
                            args: {data: new_data},
                            callback: function(r){
                                if (r.message) {
                                    window.location.reload()
                                }
                            }
                        })
                    }
                } else {
                    frappe.call({
                        type: "POST",
                        method:"vet_website.vet_website.doctype.vetoperation.vetoperation.action_send",
                        args: {name: new_data.name},
                        callback: function(r){
                            if (r.message) {
                                var new_data = Object.assign({}, op.state.data)
                                new_data.status = r.message.status
                                op.setState({data: new_data, submit_loading: false})
                            }
                        }
                    })
                }
            } else if(id == undefined){
                console.log('masuk')
                console.log(new_data)
                new_data.from = this.state.gudang_list.find(i => i.gudang_name == new_data['from']).name
                if(this.props.usage){new_data.expense_account = this.state.accounts.find(i => i.account_name == new_data['expense_account']).name}
                if(new_data.to == 'USAGE'){
                    new_data.to = undefined
                } else {
                    new_data.to = this.state.gudang_list.find(i => i.gudang_name == new_data['to']).name
                }
                
                console.log(new_data)
                
                frappe.call({
                    type: "POST",
                    method:"vet_website.vet_website.doctype.vetoperation.vetoperation.new_operation",
                    args: {data: new_data},
                    callback: function(r){
                        if (r.message) {
                            
                            op.props.usage?
                            window.location.href = "/main/accounting/usage/edit?n=" + r.message.name:
                            window.location.href = "/main/inventory/operation/edit?n=" + r.message.name
                        }
                    }
                })
            }
        }
    }
    
    toggleReceive(e) {
        this.setState({show_receive: !this.state.show_receive})
    }
    
    goToJournalEntries(){
        window.location.href = '/main/accounting/journal-entries?reference=' + this.state.data.name
    }
    
    toggleEditMode(e){
        e.preventDefault()
        var new_data = Object.assign({}, this.state.data)
        new_data.moves.push({})
        this.setState({edit_mode: !this.state.edit_mode, data: new_data})
    }
    
    render() {
        var panel_style = {background: '#FFFFFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', padding: '2px 32px', marginBottom: '15px'}
        var rowMinHeight = {minHeight: '60px'}
        var buttonMode = []
        var color = {color: '#056EAD', cursor: 'pointer'}
        var backButton = <span className="fs16 fw600 mr-auto my-auto" style={color} onClick={() => history.back()}><i className="fa fa-chevron-left mr-1" style={color}></i>Back</span>
        var statuses = ['Draft', 'Delivery', 'Done']
        if(this.props.usage){statuses = ['Draft', 'Done']}
        var status_row
        var write = checkPermission('VetOperation', this.state.currentUser, 'write')
        var kirim = checkPermission('VetOperation', this.state.currentUser, 'kirim')
        var terima = checkPermission('VetOperation', this.state.currentUser, 'terima')
        
        if (this.state.loaded) {
            console.log(this.state)
            if(id == undefined){
                buttonMode.push(
                        <div className="col-auto d-flex my-auto" key="1">
            				<button type="submit" 
                                className={ this.state.submit_loading
                                    ? "d-block btn btn-sm btn-danger fs12 text-uppercase fwbold py-2 px-4 disabled"
                                    : "d-block btn btn-sm btn-danger fs12 text-uppercase fwbold py-2 px-4"}>
                                { this.state.submit_loading
                                    ? (<span><i className="fa fa-spin fa-circle-o-notch mr-3"/>Loading...</span>)
                                    : this.props.usage?"Simpan":"Tambah"}
                            </button>
            			</div>
                    )
                // if(this.props.usage){
                //     buttonMode.push(
                //         <div className="col-auto d-flex my-auto" key="simpan">
            	// 			<button type="submit" className="d-block btn btn-sm btn-danger fs12 text-uppercase fwbold py-2 px-4" onClick={() => this.statusDone()}>Tambah</button>
            	// 		</div>
                //     )
                // }
            }
            else {
                status_row = <StatusRow statuses={statuses} current_status={this.state.data.status}/>
            }
            
            if(this.state.data.status == 'Draft' && this.state.data.from){
                if(kirim && !this.props.usage){
                    buttonMode.push(
                        <div className="col-auto d-flex my-auto" key="1">
            				<button type="submit" 
                                className={ this.state.submit_loading
                                    ? "d-block btn btn-sm btn-danger fs12 text-uppercase fwbold py-2 px-4 disabled"
                                    : "d-block btn btn-sm btn-danger fs12 text-uppercase fwbold py-2 px-4"
                                }>
                                    {this.state.submit_loading
                                    ? (<span><i className="fa fa-spin fa-circle-o-notch mr-3"/>Loading...</span>)
                                    : 'Kirim'}
                            </button>
            			</div>
                    )
                }
                if(this.props.usage){
                    if(write){
                        if(this.state.edit_mode){
                            buttonMode.push(
                                <div className="col-auto d-flex my-auto" key="cancel">
                    				<button type="button" className="d-block btn btn-sm btn-outline-danger fs12 text-uppercase fwbold py-2 px-4" onClick={() => this.getInitialData()}>Batal</button>
                    			</div>
                            )
                            buttonMode.push(
                                <div className="col-auto d-flex my-auto" key="1">
                    				<button type="submit" className={ this.state.submit_loading
                                        ? "d-block btn btn-sm btn-danger fs12 text-uppercase fwbold py-2 px-4 disabled"
                                        : "d-block btn btn-sm btn-danger fs12 text-uppercase fwbold py-2 px-4"
                                    }>
                                        { this.state.submit_loading
                                        ? (<span><i className="fa fa-spin fa-circle-o-notch mr-3"/>Loading...</span>)
                                        : 'Simpan'}
                                    </button>
                    			</div>
                            )
                        } else {
                            buttonMode.push(
                                <div className="col-auto d-flex my-auto" key="1">
                    				<button type="button" className="d-block btn btn-sm btn-danger fs12 text-uppercase fwbold py-2 px-4" onClick={e => this.toggleEditMode(e)}>Edit</button>
                    			</div>
                            )

                            buttonMode.push(
                                <div className="col-auto d-flex my-auto" key="simpan">
                                    <button type="submit" className={ this.state.submit_loading
                                        ? "d-block btn btn-sm btn-danger fs12 text-uppercase fwbold py-2 px-4 disabled"
                                        : "d-block btn btn-sm btn-danger fs12 text-uppercase fwbold py-2 px-4"
                                    } onClick={() => this.statusDone()}>
                                        {this.state.submit_loading
                                        ? (<span><i className="fa fa-spin fa-circle-o-notch mr-3"/>Loading...</span>)
                                        : 'Proses'}
                                    </button>
                                </div>
                            )
                        }
                    }
                }
            }
            else if (this.state.data.status == 'Delivery' && this.state.data.from){
                if(terima && !this.props.usage){
                    buttonMode.push(
                        <div className="col-auto d-flex my-auto" key="1">
            				<button type="button" onClick={this.toggleReceive} className="d-block btn btn-sm btn-danger fs12 text-uppercase fwbold py-2 px-4">Terima</button>
            			</div>
                    )
                }
            } else if (id != undefined && this.state.data.status == 'Done' && this.state.data.is_usage){
                var cursor = {cursor: 'pointer'}
                buttonMode.push(<div className="col-auto mr-auto" key="journal_entry" style={cursor} onClick={() => this.goToJournalEntries()}>
                			            <img className="d-block mx-auto mt-2 header-icon" src="/static/img/main/menu/journal_entries.png"/>
                			            <p className="mb-0 fs12 text-muted text-center">Journal Entries</p>
                			        </div>)
            }
            buttonMode.push(<div key="999" className="col-auto d-flex mr-auto">{backButton}</div>)
            
            var popup_receive
            if (this.state.show_receive) {
                popup_receive = <PopupReceive toggleReceive={(e) => this.toggleReceive(e)} moves={this.state.data.moves} name={this.state.data.name}/>
            }
            
            return <form id="product_form" onSubmit={(e) => this.formSubmit(e)}>
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
            	</div><FormOperation edit_mode={this.state.edit_mode} usage={this.props.usage} data={this.state.data} accounts={this.state.accounts} gudang_list={this.state.gudang_list} changeInput={this.changeInput} inputBlur={this.inputBlur}/>
            	<OperationStockMove edit_mode={this.state.edit_mode} usage={this.props.usage}  list={this.state.data.moves} product_list={this.state.product_list} uom_list={this.state.uom_list} status={this.state.data.status} changeInput={this.changeInput} inputBlur={this.inputBlur}/>
            	{popup_receive}
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

class PopupReceive extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': {
                'name': this.props.name,
                'moves': this.props.moves,
            }
        }
        
        this.handleInputChange = this.handleInputChange.bind(this)
        this.confirmReceive = this.confirmReceive.bind(this)
    }
    
    handleInputChange(e, i) {
        var value = e.target.value
        var new_data = this.state.data
        
        new_data.moves[i].quantity_receive_temp = value
        this.setState({data: new_data})
    }
    
    confirmReceive(e) {
        e.preventDefault()
        var th = this
        var new_data = this.state.data
        
        var moves = []
        
        new_data.moves.forEach(function(item, index) {
            if (item.quantity != item.quantity_done) {
                if (item.quantity_receive_temp == undefined) {
                    item.quantity_done = item.quantity
                } else {
                    item.quantity_done = parseFloat(item.quantity_receive_temp) + parseFloat(item.quantity_done)
                }
                
                moves.push(item)
            }
            
            delete item.quantity_receive_temp
        })
        
        var valid = new_data.moves.every(i => parseFloat(i.quantity) >= parseFloat(i.quantity_done))
        
        console.log(new_data.name, moves)
        
        if (valid) {
            frappe.call({
        		type: "POST",
        		method:"vet_website.vet_website.doctype.vetoperation.vetoperation.action_receive",
        		args: {name: new_data.name, moves: moves},
        		callback: function(r){
        			if (r.message) {
                        window.location.href = "/main/inventory/operation/edit?n=" + r.message.name
                    }
        		}
        	});
        } else {
            frappe.msgprint('Received Quantity melebihi Quantity')
        }
    }
    
    render() {
        var maxwidth = {maxWidth: '25%', paddingTop: '100px'}
        var payStyle = {background: '#056EAD', color: '#FFFFFF'}
        var batalStyle = {color: '#056EAD', border: '1px solid #056EAD'}
        var row_products = []
        var bgStyle = {background: '#F5FBFF'}
        var qtyStyle = {background: '#CEEDFF'}
        var th = this
        
        this.props.moves.forEach(function(item, index) {
            if (item.quantity != item.quantity_done) {
                row_products.push(
                    <div className="row mx-0" key={index.toString()}>
                		<div className="col row-list" style={bgStyle}>
                			<div className="row mx-0 fs14 fw600">
                				<div className="col-8">
                					<span>{item.product_name}</span>
                				</div>
                				<div className="col">
                					<input name='quantity_done' id="quantity_done" style={qtyStyle} className="form-control border-0 fs14 fw600 px-0 text-center" onChange={e => th.handleInputChange(e, index)} defaultValue={item.quantity - item.quantity_done}/>
                				</div>
                			</div>
                		</div>
                	</div>
                )
            }
        })
        
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

class FormOperation extends React.Component {
    sourceClick(){
        var source = this.props.data.reference
        var source_filter = [
            {regexp: /^VAJ-.*$/, location:"/main/inventory/adjustment/edit?n="},
            {regexp: /^VE-.*$/, location:"/main/accounting/expenses?n="},
            {regexp: /^VCI-.*$/, location:"/main/kasir/customer-invoices/edit?n="},
            {regexp: /^PO.*$/, location:"/main/purchases/purchase-order/edit?n="},
            {regexp: /^POSORDER.*$/, location:"/main/kasir/pos-order/form?n="}
        ]
        source_filter.forEach(sf => {
            if(source.match(sf.regexp)){
                window.location.href = sf.location+source
            }
        })
    }
    
    render() {
        var panel_style = {background: '#fff', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)'}
        var data = this.props.data
        var gudang_list = this.props.gudang_list
        var accounts = this.props.accounts
        var arrow_style = {marginTop: '35px'}
        var input_style = {background: '#CEEDFF', color: '#056EAD'}
        var cursor = {cursor: 'pointer'}
        var title, reference, from, to, source, moment_date, arrow, date, expense_account
        
        var date = data.date || data.creation
        
        var gudang_options = []
        if(gudang_list.length != 0){
            gudang_list.forEach((l, index) => gudang_options.push(<option value={l.gudang_name} key={l.name} />))
        }
        var gudang_datalist = (
            <datalist id="gudang">
                {gudang_options}
            </datalist>
        )
        
        var expense_account_options = []
        if(accounts.length != 0){
            // accounts.filter(a => a.is_parent == 0 && a.account_type == 'Expense' && (a.account_code.match(/^8-.*$/) || a.account_code.match(/^6-.*$/))).forEach((l, index) => expense_account_options.push(<option value={l.account_name} key={l.name} />))
            accounts.filter(a => a.is_parent == 0 && a.account_type == 'Expense' && a.account_code.match(/^5-.*$/)).forEach((l, index) => expense_account_options.push(<option value={l.account_name} key={l.name} />))
        }
        var expense_account_datalist = (
            <datalist id="expense_account_list">
                {expense_account_options}
            </datalist>
        )
        
        var link_icon
        
        console.log(this.props.edit_mode)
        console.log(this.props.usage)
        if (id == undefined || (this.props.usage && this.props.edit_mode)){
            arrow_style.marginTop = '40px'
            // reference = <input required type="text" name="reference" id="reference" autoComplete="off" placeholder="Reference" className="form-control fs20 fwbold px-0 p-1 h-auto border-0" value={data.reference||''} style={input_style} onChange={e => this.props.changeInput(e)}/>
            title = <p className="fs18 fw600 text-dark mb-2">{this.props.usage?"Penggunaan Baru":"Operasi Baru"}</p>
            from = <input required type="text" name="from" id="from" autoComplete="off" placeholder="From" className="form-control fs14" list="gudang" defaultValue={data.from_name||''} onChange={e => this.props.changeInput(e)} onBlur={e => this.props.inputBlur(e, gudang_list)}/>
            to = <input readOnly={this.props.usage} required type="text" name="to" id="to" autoComplete="off" placeholder="To" className="form-control fs14" list="gudang" defaultValue={data.to_name||''} onChange={e => this.props.changeInput(e)} onBlur={e => this.props.inputBlur(e, gudang_list)}/>
            expense_account = <input required type="text" name="expense_account" id="expense_account" autoComplete="off" placeholder="Expense Accounts" className="form-control fs14" list="expense_account_list" defaultValue={data.expense_account_name||''} onChange={e => this.props.changeInput(e)} onBlur={e => this.props.inputBlur(e, accounts)}/>
            source = <input type="text" name="reference" id="reference" autoComplete="off" placeholder={this.props.usage?"Keterangan":"Source"} className="form-control fs14" value={data.reference||''} onChange={e => this.props.changeInput(e)}/>
            moment_date = moment(date)
            date = <input required type="date" name="date" id="date" className="form-control fs14" value={data.date||''} onChange={e => this.props.changeInput(e)}/>
        }
        else if(id != undefined){
            var from_name = data.from_name == undefined
            ? data.reference.match(/^VCI-.*$/) || data.reference.match(/^POSORDER.*$/)
                ? 'Customer'
                : 'Supplier'
            : data.from_name
            var to_name = data.to_name == undefined
                ? data.reference.match(/^VCI-.*$/) || data.reference.match(/^POSORDER.*$/)
                    ? 'Customer'
                    : 'Supplier'
                : data.to_name

            title = <p className="fs18 fw600 text-dark mb-2">{data.name}</p>
            from = <span className="fs16 px-0" id="from">{from_name}</span>
            to = <span className="fs16 px-0" id="to">{to_name}</span>
            expense_account = <span className="fs16 px-0" id="to">{data.expense_account_name||''}</span>
            source = <span className="fs16 px-0" id="reference">{data.reference||''}</span>
            moment_date = moment(date)
            date = <span className="fs16 px-0">{moment_date.format('DD-MM-YYYY')}</span>
                    
            var source_filter = [/^VAJ-.*$/,/^VE-.*$/,/^VCI-.*$/,/^PO.*$/]
            if(source_filter.some(sf => data.reference.match(sf))){
                link_icon = <img src="/static/img/main/menu/tautan.png" className="mx-2" onClick={() => this.sourceClick()} style={cursor}/>
            }
        }
        
        return (
            <div>
                {gudang_datalist}
                {expense_account_datalist}
                {title}
            	<div style={panel_style} className="px-4 py-1 mb-4">
            	    <div className="form-row mb-3">
            	        <div className="col-4">
            	            {reference}
            	        </div>
            	    </div>
    	            <div className="form-row">
    	                <div className="col-6">
    	                    <div className="row">
    	                        <div className="col">
    	                            <div className="form-group">
                    					<label htmlFor="from" className=" fw600">From</label>
                    					<div className="row mx-0">
                    						{from}
                    					</div>
                    				</div>
    	                        </div>
    	                        {this.props.usage?
    	                        false:
	                            <div className="col mx-auto">
                                    <img src="/static/img/main/menu/operation-arrow-right.png" style={arrow_style}/>
                                </div>
    	                        }
    	                        <div className="col">
        	                        <div className="form-group">
                    					<label htmlFor="to" className=" fw600">{this.props.usage?"Expense Account":"To"}</label>
                    					<div className="row mx-0">
                    						{this.props.usage?expense_account:to}
                    					</div>
                    				</div>
    	                        </div>
    	                    </div>
    	                </div>
    	                <div className="col-3">
    	                    <div className="form-group">
            					<label htmlFor="date" className=" fw600">Date</label>
            					<div className="row mx-0">
            						{date}
            					</div>
            				</div>
    	                </div>
    	                <div className="col-3">
        	                <div className="form-group">
            					<label htmlFor="reference" className=" fw600">{this.props.usage?"Keterangan":"Source Document"}</label>
            					<div className="row mx-0">
            						{source}{link_icon}
            					</div>
            				</div>
    	                </div>
    	            </div>
            	</div>
            </div>
        )
    }
}

class OperationStockMove extends React.Component {
    render() {
        var panel_style = {background: '#fff', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)'}
        var fontStyle = {'color': '#1B577B'}
        var lineStyle = {'border': '1px solid #1B577B'}
        var list = this.props.list
        var product_list = this.props.product_list
        var rows = []
        
        var product_options = []
        if(product_list.length != 0){
            product_list.forEach(function (l, index) {
                var display_name = l.name.startsWith('[') ? l.name : "[" + l.name + ']' + l.product_name
                product_options.push(<option value={l.product_name} key={l.name}>{display_name}</option>)
            })
        }
        var product_datalist = (
            <datalist id="product">
                {product_options}
            </datalist>
        )
        
        if (list.length != 0){
            var sl = this
            list.forEach(function(l, index){
                console.log(list)
                rows.push(
                    <OperationStockMoveListRow show_receive_date={list.some((l) => l.receive_date)} edit_mode={sl.props.edit_mode} usage={sl.props.usage} index={index.toString()} product_list={product_list} uom_list={sl.props.uom_list} key={index.toString()} item={l} status={sl.props.status} changeInput={e => sl.props.changeInput(e, index.toString())} inputBlur={sl.props.inputBlur}/>
                )
            })
        }
        
        var qty_done, price, subtotal, receive_date
        if (![undefined, 'Draft'].includes(this.props.status)) {
            qty_done = <div className="col text-center">
        					<span className="my-auto">Qty Done</span>
        				</div>
        }
        
        if(this.props.usage){
            price = <div className="col text-center">
        					<span className="my-auto">Price</span>
        				</div>
            subtotal = <div className="col text-center">
        					<span className="my-auto">Subtotal</span>
        				</div>
        }

        if (list.some((l) => l.receive_date)) {
            receive_date = <div className="col text-center">
                            <span className="my-auto">Receive Date</span>
                        </div>
        }
        
        var total_detail
        if(this.props.usage){
            var total = list.reduce((total, l) => total += (l.price||0)*(parseFloat(l.quantity)||0), 0)
            console.log(total)
            total_detail = (
            <div className="row flex-row-reverse mx-0 fs14 fw600 mt-4 mb-2" style={fontStyle}>
			    <div className="col-4">
			        <hr style={lineStyle} className="mb-2" />
			        <div className="row text-left mb-2 fs20 fw600 mb-4">
			            <div className="col-4">Total</div>
                        <div className="col-auto px-0">:</div>
                        <div className="col-2 text-right">Rp</div>
                        <div className="col text-right">{formatter2.format(total)}</div>
			        </div>
			    </div>
			</div>)
        }
        
        return (
            <div>
                <p className="fs18 fw600 text-dark mb-2">{this.props.usage?"Products":"Stock Move"}</p>
            	<div style={panel_style} className="p-4 mb-4">
            	    {product_datalist}
    	            <div className="row mx-0 fs12 fw600 row-header">
        				<div className="col-4 text-center">
        					<span className="my-auto">Product</span>
        				</div>
                        {receive_date}
        				<div className="col-3 text-center">
        					<span className="my-auto">Unit Of Measurement</span>
        				</div>
        				<div className="col text-center">
        					<span className="my-auto">{this.props.usage?'Qty':'Qty Sent'}</span>
        				</div>
        				{price}
        				{qty_done}
        				{subtotal}
        			</div>
        			{rows}
        			{total_detail}
            	</div>
            </div>
        )
    }
}

class OperationStockMoveListRow extends React.Component {
    render() {
        var bgStyle = {background: '#F5FBFF'}
        var item = this.props.item
        var index = this.props.index
        var status = this.props.status
        var uom_list = this.props.uom_list
        var required = false
        if(Object.keys(item).filter(n => !['product', 'product_name'].includes(n)).length != 0){
            required = true
        }
        var receive_date
        var product = <span className="my-auto">{item.product_name||item.product}</span>
        if (this.props.show_receive_date) {
            receive_date = <div className="col text-center">
                <span className="my-auto">{item.receive_date ? moment(item.receive_date).format('DD-MM-YYYY') : ''}</span>
                </div>
        }
        var quantity = <span className="my-auto">{item.quantity}</span>
        var uom = <span className="my-auto">{item.uom_name||item.product_uom}</span>
        
        var quantity_done, price, subtotal
        if (![undefined, 'Draft'].includes(status)) {
            quantity_done = <div className="col text-center">
                                <span className="my-auto">{item.quantity_done}</span>
                            </div>
        }
        
        if(this.props.usage){
            price = <div className="col text-center">
                                <span className="my-auto">{item.price?formatter.format(item.price||0):''}</span>
                            </div>
            subtotal = <div className="col text-center">
                                <span className="my-auto">{item.price?formatter.format(item.price*parseFloat(item.quantity)||0):''}</span>
                            </div>
        }
        
        if(id == undefined){
            product = <input required={required} autoComplete="off" placeholder="Product" name='product' list="product" id="product" style={bgStyle} className="form-control border-0 fs14 fw600 p-0 h-auto" onChange={this.props.changeInput} onBlur={e => this.props.inputBlur(e, this.props.product_list, index)} defaultValue={item.product_name||item.product||''}/>
            quantity = <input required={required} autoComplete="off" placeholder="0" name='quantity' id="quantity" style={bgStyle} className="form-control border-0 fs14 fw600 p-0 h-auto text-center" onChange={this.props.changeInput} defaultValue={item.quantity||''}/>
            uom = <input required={required} autoComplete="off" placeholder="Unit Of Measurement" name='product_uom' list={'uom'+index} id="product_uom" style={bgStyle} className="form-control border-0 fs14 fw600 p-0 h-auto text-center" onChange={this.props.changeInput} onBlur={e => this.props.inputBlur(e, this.props.uom_list, index)} defaultValue={item.uom_name||item.product_uom||''}/>
        } else if(id != undefined && (this.props.edit_mode && this.props.usage)){
            product = <input required={required} autoComplete="off" placeholder="Product" name='product' list="product" id="product" style={bgStyle} className="form-control border-0 fs14 fw600 p-0 h-auto" onChange={this.props.changeInput} onBlur={e => this.props.inputBlur(e, this.props.product_list, index)} value={item.product_name||''}/>
            quantity = <input required={required} autoComplete="off" placeholder="0" name='quantity' id="quantity" style={bgStyle} className="form-control border-0 fs14 fw600 p-0 h-auto text-center" onChange={this.props.changeInput} value={item.quantity||''}/>
            uom = <input required={required} autoComplete="off" placeholder="Unit Of Measurement" name='product_uom' list={'uom'+index} id="product_uom" style={bgStyle} className="form-control border-0 fs14 fw600 p-0 h-auto text-center" onChange={this.props.changeInput} onBlur={e => this.props.inputBlur(e, this.props.uom_list, index)} value={item.uom_name||''}/>
        }
        
        var uom_options = []
        if(uom_list.length != 0 && item.product != undefined){
            var current_product = this.props.product_list.find(p => p.name == item.product)
            if(current_product != undefined){
                var filtered_uom_list = uom_list.filter(u => u.name == current_product.product_uom || u.unit_master == current_product.product_uom)
                filtered_uom_list.forEach((l, index) => uom_options.push(<option value={l.uom_name} key={l.name} />))
            }
        }
        var uom_datalist = (
            <datalist id={"uom"+index}>
                {uom_options}
            </datalist>
        )
        
        return(
            <div className="row mx-0">
        		<div className="col row-list" style={bgStyle}>
        			<div className="row mx-0 fs12 fw600">
        				<div className="col-4">
        					{product}
        				</div>
                        {receive_date}
        				<div className="col-3 text-center">
        					{uom}{uom_datalist}
        				</div>
        				<div className="col text-center">
        					{quantity}
        				</div>
        				{price}
        				{quantity_done}
        				{subtotal}
        			</div>
        		</div>
        	</div>
        )
    }
}
var operation_form = document.getElementById('operation_form')
var usage_form = document.getElementById('usage_form')
if(operation_form){
    ReactDOM.render(<Operation/>, operation_form)
} else if(usage_form){
    ReactDOM.render(<Operation usage={true}/>, usage_form)
}
