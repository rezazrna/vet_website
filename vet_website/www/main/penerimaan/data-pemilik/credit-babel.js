var id = getUrlParameter('n')
// var tzOffset = new Date().getTimezoneOffset()
var tzOffset = 0

class Credit extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': [],
            'loaded': false,
            'popup': false,
            'check_all': false,
            'show_button': false,
            'currentpage': 1,
            'no_filter': this.props.no_filter || false,
            'supplier': this.props.supplier || false,
            'mode': this.props.mode || false,
            'owner_list': [],
            'search': false,
            'currentUser': {},
            'datalength': 0,
        }
        
        this.updateData = this.updateData.bind(this)
        this.checkRow = this.checkRow.bind(this);
        this.checkAll = this.checkAll.bind(this);
        this.processRow = this.processRow.bind(this);
        this.paginationClick = this.paginationClick.bind(this);
        this.creditSearch = this.creditSearch.bind(this);
        this.printPDF = this.printPDF.bind(this)
    }
    
    componentDidMount() {
        var po = this
        var filters = {filters: [], sorts: []}
        
        // console.log(document.referrer)
        // console.log(document.referrer.includes('/main/penerimaan/penerimaan-pasien/detail'))
       
        // if (sessionStorage.getItem(window.location.pathname) != null) {
        //     filters = JSON.parse(sessionStorage.getItem(window.location.pathname))
        // } else {
        //     filters = {filters: [], sorts: []}
        // }
        
        frappe.call({
            type: "GET",
            method:"vet_website.methods.get_current_user",
            args: {},
            callback: function(r){
                if (r.message) {
                    po.setState({'currentUser': r.message});
                }
            }
        });
        if (document.location.href.includes('?session')) {
         var url = document.location.href,
            params = url.split('?')[1].split('='),
            key = params[0],
            value = params[1]   
        }
        
        // if (filters.hasOwnProperty("currentpage")) {
        //     this.setState({'currentpage': filters['currentpage']})
        // }
        
        if (params) {
            filters[key] = value
            sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))
            this.creditSearch(filters)
        } else {
            console.log(this.props.mode)
            console.log(this.props.mode&&id?false:this.props.no_filter || false)
            console.log(this.props.mode && this.props.mode == 'debt')
            sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))
            frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetpetowner.vetpetowner.get_credit_list",
                args: {name: id || false, no_filter: this.props.mode&&id?false:this.props.no_filter || false, supplier: this.props.supplier || false, filters: filters, only_deposit: this.props.mode && this.props.mode == 'credit', only_piutang_hutang: this.props.mode && this.props.mode == 'debt'},
                callback: function(r){
                    if (r.message) {
                        console.log(r.message);
                        po.setState({'data': r.message.owner_credit_list, 'owner_list': r.message.owner_list, 'payment_method_list': r.message.payment_method_list, 'loaded': true, 'datalength': r.message.datalength});
                    }
                }
            });
        }
    }
    
    creditSearch(filters) {
        var po = this
        
        if (document.location.href.includes('?session')) {
         var url = document.location.href,
            params = url.split('?')[1].split('='),
            key = params[0],
            value = params[1]
            
            filters[key] = value
        }

        this.setState({
          currentpage: 1,
          loaded: false,
        });
        
        filters['currentpage'] = 1;
        sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))
        
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetpetowner.vetpetowner.get_credit_list",
            args: {filters: filters, name: id || false, no_filter: this.props.mode&&id?false:this.props.no_filter || false, supplier: this.props.supplier || false, session: this.props.session || false, only_deposit: this.props.mode && this.props.mode == 'credit', only_piutang_hutang: this.props.mode && this.props.mode == 'debt'},
            callback: function(r){
                if (r.message) {
                    po.setState({'data': r.message.owner_credit_list, 'owner_list': r.message.owner_list, 'payment_method_list': r.message.payment_method_list, 'loaded': true, 'datalength': r.message.datalength});
                }
            }
        });
    }
    
    paginationClick(number) {
        var po = this
        var filters = JSON.parse(sessionStorage.getItem(window.location.pathname))

        this.setState({
          currentpage: Number(number),
          loaded: false,
        });

        filters['currentpage'] = this.state.currentpage
        
        sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))

        // if (number * 30 > this.state.data.length) {
            frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetpetowner.vetpetowner.get_credit_list",
                args: {filters: filters, name: id || false, no_filter: this.props.mode&&id?false:this.props.no_filter || false, supplier: this.props.supplier || false, session: this.props.session || false, only_deposit: this.props.mode && this.props.mode == 'credit', only_piutang_hutang: this.props.mode && this.props.mode == 'debt'},
                callback: function(r){
                    if (r.message) {
                        po.setState({'data': r.message.owner_credit_list, 'owner_list': r.message.owner_list, 'payment_method_list': r.message.payment_method_list, 'loaded': true, 'datalength': r.message.datalength});
                    }
                }
            });
        // }
    }
    
    togglePopup(mode=false) {
        this.setState({popup: !this.state.popup, popup_mode: mode})
    }
    
    updateData(data) {
        this.setState({data: data, popup: false})
    }
    
    checkAll() {
        if(this.state.data.length != 0){
            if(!this.state.check_all){
                var new_data = this.state.data.slice()
                new_data.forEach((d, index) => {
                    d.checked = true
                })
                this.setState({data: new_data, check_all: true})
            }
            else {
                var new_data = this.state.data.slice()
                new_data.forEach((d, index) => {
                    d.checked = false
                })
                this.setState({data: new_data, check_all: false})
            }
            this.getCheckedRow()
        }
    }
    
    processRow(e) {
        e.preventDefault();
        var po = this
        var process_data = this.state.data.filter((d) => d.checked)
        var process_data_names = process_data.map((d) => d.name).reverse()
        var th = this
        
        console.log(process_data_names)
        if (this.state.data[0].invoice || this.state.data[0].pet_owner) {
            frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetownercredit.vetownercredit.process_invoice",
                args: {data: process_data_names},
                freeze: true,
                callback: function(r){
                    if (r.message) {
                        if (th.state.no_filter == true) {
                            window.location.reload()
                        } else {
                            th.setState({data: r.message})
                        }
                    }
                }
            });
        } else {
            frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetownercredit.vetownercredit.process_purchase",
                args: {data: process_data_names},
                freeze: true,
                callback: function(r){
                    if (r.message) {
                        th.setState({data: r.message})
                    }
                }
            });
        }
    }
    
    checkRow(i) {
        var new_data = this.state.data.slice()
        if(!new_data[i].checked){
            new_data[i].checked = true
            this.setState({data: new_data})
        }
        else {
            new_data[i].checked = false
            this.setState({data: new_data, check_all: false})
        }
        this.getCheckedRow()
    }
    
    getCheckedRow(e) {
        var checked_row = this.state.data.filter((d) => {
            return d.checked
        })
        
        if(checked_row.length == 0){
            this.setState({show_delete: false})
        }
        else {
            this.setState({show_delete: true})
        }
    }
    
    printPDF(id=false) {
        var pdfid = id?id:'pdf'
        var format = [559,794]
        var th = this
        // var doc = new jsPDF({
        //     orientation: 'p',
        //     unit: 'pt',
        //     format: format,
        // });
        var title
        if(this.props.supplier){
            this.props.mode=='debt'?title="Hutang":this.props.mode=='credit'?title="Deposit":title="SupplierPayment"
        } else {
            this.props.mode=='debt'?title="Piutang":this.props.mode=='credit'?title="Deposit":title="CustomerPayment"
        }
        var source = document.getElementById(pdfid)
        var opt = {
            margin: [10, 0, 10, 0],
            filename: title+"-"+moment().format('MM-YYYY')+".pdf",
            pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', '.row'] },
            html2canvas: {scale: 3},
            jsPDF: {orientation: 'p', unit: 'pt', format: [559*0.754,794*0.754]}
        }
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
    
    render() {
        var th = this
		var row_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px'}
		var formStyle = {border: '1px solid #397DA6', color: '#397DA6'}
		var color = {color: '#056EAD', cursor: 'pointer'}
		var popup
		
		var sorts = [
    					{'label': 'Tanggal DESC', 'value': 'date desc'},
    					{'label': 'Tanggal ASC', 'value': 'date asc'},
					]
		
		var field_list = []
		var metode_pembayaran_options = []
		this.state.data.forEach(d => {
		    if(!metode_pembayaran_options.map(o => o.value).includes(d.metode_pembayaran)){
		        var label = d.metode_pebayaran
		        var label_find = th.state.payment_method_list.find(p => p.name == d.metode_pembayaran)
		        label_find?label=label_find.method_name:false
		        metode_pembayaran_options.push({label: label, value: d.metode_pembayaran})
		    }
		})
		var proses = checkPermission('VetOwnerCredit', this.state.currentUser, 'proses')
		
        
        if (this.state.loaded){
            console.log(this.state)
            var tipe
            this.state.supplier?tipe='Purchase':tipe='Invoice'
            
            if (this.state.data.length != 0) {
                if (this.state.data[0]['invoice'] || this.state.data[0]['pet_owner']||!this.state.supplier) {
                    sorts.push({'label': 'Nama Pemilik DESC', 'value': 'pet_owner_name desc'})
                    sorts.push({'label': 'Nama Pemilik ASC', 'value': 'pet_owner_name asc'})
                    sorts.push({'label': 'No Invoice DESC', 'value': 'invoice desc'})
                    sorts.push({'label': 'No Invoice ASC', 'value': 'invoice asc'})
                    field_list = [
                        {'label': 'Tanggal', 'field': 'date', 'type': 'date'},
                        {'label': 'Nama Pemilik', 'field': 'pet_owner_name', 'type': 'char'},
                        {'label': 'Type', 'field': 'type', 'type': 'select', 'options': [
                            {'label': 'Payment', 'value': 'Payment'},
                            {'label': 'Sales', 'value': 'Sales'},
                            {'label': 'Refund', 'value': 'Refund'},
                            {'label': 'Cancel', 'value': 'Cancel'},
                            {'label': 'Purchase', 'value': 'Purchase'},
                        ]},
                        {'label': 'No Invoice', 'field': 'invoice', 'type': 'char'},
                        {'label': 'Metode Pembayaran', 'field': 'metode_pembayaran', 'type': 'select', 'options': metode_pembayaran_options},
                    ]
                    if(this.state.mode=='credit'){
                        field_list.push({'label': 'Deposit', 'field': 'credit', 'type': 'int'})
                        sorts.push({'label': 'Deposit DESC', 'value': 'credit desc'})
                        sorts.push({'label': 'Deposit ASC', 'value': 'credit asc'})
                    } else if (this.state.mode=='debt'){
                        field_list.push({'label': 'Piutang', 'field': 'debt', 'type': 'int'})
                        sorts.push({'label': 'Piutang DESC', 'value': 'debt desc'})
                        sorts.push({'label': 'Piutang ASC', 'value': 'debt asc'})
                    } else {
                        sorts.push({'label': 'Nominal DESC', 'value': 'nominal desc'})
                        sorts.push({'label': 'Nominal ASC', 'value': 'nominal asc'})
                        field_list.push({'label': 'Nominal', 'field': 'nominal', 'type': 'int'})
                    }
                } else {
                    sorts.push({'label': 'Supplier DESC', 'value': 'supplier_name desc'})
                    sorts.push({'label': 'Supplier ASC', 'value': 'supplier_name asc'})
                    field_list = [
                        {'label': 'Tanggal', 'field': 'date', 'type': 'date'},
                        {'label': 'Supplier', 'field': 'supplier_name', 'type': 'char'},
                        {'label': 'Type', 'field': 'type', 'type': 'select', 'options': [
                            {'label': 'Payment', 'value': 'Payment'},
                            {'label': 'Sales', 'value': 'Sales'},
                            {'label': 'Refund', 'value': 'Refund'},
                            {'label': 'Cancel', 'value': 'Cancel'},
                            {'label': 'Purchase', 'value': 'Purchase'},
                        ]},
                        {'label': 'No Purchase', 'field': 'purchase', 'type': 'char'},
                        {'label': 'Metode Pembayaran', 'field': 'metode_pembayaran', 'type': 'select', 'options': metode_pembayaran_options},
                    ]
                    if(this.state.mode=='credit'){
                        field_list.push({'label': 'Deposit', 'field': 'credit', 'type': 'int'})
                        sorts.push({'label': 'Deposit DESC', 'value': 'credit desc'})
                        sorts.push({'label': 'Deposit ASC', 'value': 'credit asc'})
                    } else if (this.state.mode=='debt'){
                        field_list.push({'label': 'Piutang', 'field': 'debt', 'type': 'int'})
                        sorts.push({'label': 'Piutang DESC', 'value': 'debt desc'})
                        sorts.push({'label': 'Piutang ASC', 'value': 'debt asc'})
                    } else {
                        sorts.push({'label': 'Nominal DESC', 'value': 'nominal desc'})
                        sorts.push({'label': 'Nominal ASC', 'value': 'nominal asc'})
                        field_list.push({'label': 'Nominal', 'field': 'nominal', 'type': 'int'})
                    }
                }
            }
            
            if (this.state.popup) {
                popup = <Popup togglePopup={() => this.togglePopup()} popup_mode={this.state.popup_mode} updateData={this.updateData} tipe={tipe} no_filter={this.props.mode&&id?false:this.props.no_filter || false} supplier={this.state.supplier} owner_list={this.state.owner_list} payment_method_list={this.state.payment_method_list}/>
            }
            
            var process_button
    		if(this.state.show_delete && proses){
    		    process_button = (
    		        <div className="col-auto">
    		            <button className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={this.processRow}>Process</button>
    		        </div>
    		    )
    		}
    		
    		var bayarPiutang, pengambilan_deposit, deposit
    		if (!document.location.href.includes('?session')) {
    		    bayarPiutang = <div className="col-auto mr-3 px-0">
                                    <a href="#" className="btn btn-outline-danger text-uppercase fs12 fwbold" onClick={() => this.togglePopup('bayar_piutang')}>{this.state.supplier?'Bayar Hutang':'Bayar Piutang'}</a>
                                </div>
                pengambilan_deposit = <div className="col-auto mr-3 px-0">
                                    <a href="#" className="btn btn-outline-danger text-uppercase fs12 fwbold" onClick={() => this.togglePopup('pengambilan_deposit')}>Pengambilan Deposit</a>
                                </div>
                deposit = <div className="col-auto mr-3 px-0">
                                    <a href="#" className="btn btn-outline-danger text-uppercase fs12 fwbold" onClick={() => this.togglePopup('deposit')}>Deposit</a>
                                </div>
    		}
    		
    // 		var credit
    // 		if (id != undefined){
    // 		    credit = <div className="col-auto mr-auto">
    //                 <div className="row mx-0">
    //                     <div className="col-auto px-3">
    //                         <img className="d-block mx-auto header-icon mt-2" src="/static/img/main/menu/credit.png"/>
    //                         <p className="mb-0 fs12 text-muted text-center">Balance</p>
    //                     </div>
    //                     <div className="col-auto px-2 d-flex my-auto">
    //                         <span className="fs26 fw600">
    //                             {formatter.format(this.state.data[0].credit)}
    //                         </span>
    //                     </div>
    //                 </div>
    //             </div>
    // 		}
            
            return(
                <div>
                    <div className="row mx-0" style={row_style}>
                        <div className="col-auto my-auto">
                            <span className="fs16 fw600 mr-4 my-auto" style={color} onClick={() => {history.back()}}><i className="fa fa-chevron-left mr-1" style={color}></i>Back</span>
                        </div>
                        {this.state.mode=='debt'&&false?bayarPiutang:false}
                        {this.state.mode=='credit'?pengambilan_deposit:false}
                        {this.state.mode=='credit'?deposit:false}
                        <div className="col-auto mr-3 px-0">
                            <button type="button" className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={() => this.printPDF()}>Print</button>
                        </div>
                        <div className="col-auto mr-3 px-0">
                            {process_button}
                        </div>
                        <div className="col">
                            <input className="form-control fs12" name="search" placeholder="Search..." style={formStyle} onChange={e => this.setState({search: e.target.value})}/>
                        </div>
                        <div className="col-5">
                            <Filter sorts={sorts} searchAction={this.creditSearch} field_list={field_list} filters={JSON.parse(sessionStorage.getItem(window.location.pathname))}/>
                        </div>
                    </div>
                    <CreditList data={this.state.data} search={this.state.search} payment_method_list={this.state.payment_method_list} checked={this.check_all} checkAll={this.checkAll} checkRow={this.checkRow} paginationClick={this.paginationClick} currentpage={this.state.currentpage} no_filter={this.state.no_filter} supplier={this.state.supplier} mode={this.state.mode} printPDF={this.printPDF} datalength={this.state.datalength}/>
                    {popup}
                    <PDF data={this.state.data} mode={this.props.mode} supplier={this.props.supplier} payment_method_list={this.state.payment_method_list} search={this.state.search} currentpage={this.state.currentpage}/>
                </div>
            )
        }
        else {
            return (
                <div className="row justify-content-center" key='0'>
                    <div className="col-10 col-md-8 text-center border rounded-lg py-4">
                        <p className="mb-0 fs24md fs16 fw600 text-muted">
                            <span><i className="fa fa-spin fa-circle-o-notch mr-3"></i>Loading...</span>
                        </p>
                    </div>
                </div>
            )
        }
    }
}

class Popup extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': {action: this.props.popup_mode == 'bayar_piutang' ? 'Bayar' : this.props.popup_mode == 'pengambilan_deposit' ? 'Buat' : 'Deposit'}
        }
    }
    
    handleInputChange(e) {
        var name = e.target.name
        var value = e.target.value
        var new_data = this.state.data
        
        if (name == 'nominal' && value != ''){
            var filtered = value.replace(/\D/g,'')
            if(filtered != ''){
                var formatted = parseInt(filtered).toLocaleString('id-ID')
                new_data.nominal = formatted
            }
        } else {
            new_data[name] = value
        }
        
        this.setState({data: new_data})        
    }
    
    setPaymentMethod(value){
        var new_data = Object.assign({}, this.state.data)
        new_data.payment_method = value
        this.setState({data: new_data})
    }
    
    handleInputBlur(e) {
        var name = e.target.name
        var value = e.target.value
        var new_data = this.state.data
        var selected = false
        
        selected = this.props.owner_list.filter(i => i.owner_name == value)
        
        if (!selected) {
            e.target.value = ''
            new_data[name] = ''
            this.setState({data: new_data})
        }
    
    }
    
    submitAction() {
        var th = this
        var new_data = this.state.data
        console.log(new_data)
        console.log(this.props.tipe)
        
        if (new_data.pet_owner) {
            if (this.props.tipe == 'Invoice') {
                new_data.pet_owner_id = this.props.owner_list.filter(i => i.owner_name == new_data.pet_owner)[0]['name']
            } else if (this.props.tipe == 'Purchase') {
                new_data.pet_owner_id = this.props.owner_list.filter(i => i.supplier_name == new_data.pet_owner)[0]['name']
            }
        }
        
        new_data.nominal_float = parseInt(new_data.nominal.replace(/\D/g,''))
        
        console.log({action: new_data.action, nominal: new_data.nominal, supplier: id || new_data.pet_owner, method: new_data.payment_method})
        
        if (this.props.tipe == 'Invoice') {
            frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetownercredit.vetownercredit.submit_piutang",
                args: {action: new_data.action, nominal: new_data.nominal_float, petOwner: id || new_data.pet_owner_id, method: new_data.payment_method},
                freeze: true,
                callback: function(r){
                    if (r.message) {
                        console.log(r.message);
                        if (r.message.error){
                            frappe.msgprint(r.message.error)
                        } else {
                            th.props.updateData(r.message)
                        }
                    }
                }
            });
        } else if (this.props.tipe == 'Purchase') {
            // console.log({action: new_data.action, nominal: new_data.nominal, supplier: id || new_data.pet_owner, method: new_data.payment_method})
            frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetownercredit.vetownercredit.submit_piutang_purchase",
                args: {action: new_data.action, nominal: new_data.nominal_float, supplier: id || new_data.pet_owner_id, method: new_data.payment_method},
                freeze: true,
                callback: function(r){
                    if (r.message) {
                        console.log(r.message);
                        if (r.message.error){
                            frappe.msgprint(r.message.error)
                        } else {
                            th.props.updateData(r.message)
                        }
                    }
                }
            });
        }
    }
    
    render() {
        var th = this
        var maxwidth = {maxWidth: '35%', paddingTop: '100px'}
        var input_style = {background: '#CEEDFF'}
        var simpanStyle = {background: '#056EAD', color: '#FFFFFF'}
        var batalStyle = {color: '#056EAD', border: '1px solid #056EAD'}
        var owner_list
        
        if (this.props.no_filter) {
            var owner_option = []
            this.props.owner_list.forEach(function(item, index) {
                owner_option.push(<option value={item.owner_name || item.supplier_name} key={index.toString()}/>)
            })
            
            owner_list = <div className="form-group">
        					<label htmlFor="pet_owner" className="fw600">{this.props.supplier ? "Supplier" : "Nama Pemilik"}</label>
        					<input required type="text" list="owner_list" id="pet_owner" name='pet_owner' className="form-control border-0" style={input_style} onChange={(e) => this.handleInputChange(e)} onBlur={(e) => this.handleInputBlur(e)}/>
        					<datalist id="owner_list">
        					    {owner_option}
        					</datalist>
        				</div>
        }
        
        console.log(this.state)
        console.log(this.props.tipe)
        
        var pm_buttons = []
        this.props.payment_method_list.filter(pm => pm.method_type != 'Deposit').forEach(pm => {
            var detail
            var iconStyle = {maxWidth: 36, maxHeight: 36}
            
            if(th.state.data.payment_method != pm.method_name){
                iconStyle.filter = "saturate(40000%) hue-rotate(110deg) brightness(75%)"
            }
            
            var img
            if(pm.method_type == 'Cash'){
                img = "/static/img/main/menu/method-cash.png"
            } else if(pm.method_type == 'Card'){
                img = "/static/img/main/menu/method-card.png"
                    
            } else if(pm.method_type == 'Deposit'){
                img = "/static/img/main/menu/method-deposit.png"
            }
            detail = (
                <div className="row mx-n1">
                    <div className="col-auto px-1 d-flex">
                        <img src={img} style={iconStyle} className="m-auto"/>
                    </div>
                    <div className="col px-1 d-flex">
                        <span className="m-auto">{pm.method_name}</span>
                    </div>
                </div>
            )
            pm_buttons.push(<div key={pm.name} className="col-6 px-1 pb-2"><button type="button" style={th.state.data.payment_method == pm.name?simpanStyle:batalStyle} className="btn btn-block p-3 h-100 text-truncate fs12" onClick={() => th.setPaymentMethod(pm.name)}>{detail}</button></div>)
        })
        
        return <div className="menu-popup">
                    <div className="container" style={maxwidth}>
                        <div className="bg-white p-4">
                            <div className="row mx-n1 my-3">
                                {pm_buttons}
                            </div>
            				<div className="form-group">
            					<label htmlFor="nominal" className="fw600">Nominal</label>
            					<input required type="text" id="nominal" name='nominal' className="form-control border-0" style={input_style} onChange={(e) => this.handleInputChange(e)} value={this.state.data.nominal || ''}/>
            				</div>
            				{owner_list}
                            <div className="row justify-content-center mb-2">
                                <div className="col-auto d-flex mt-4">
                                    <button className="btn btn-sm fs18 h-100 fwbold px-4" style={simpanStyle} onClick={() => this.submitAction()}>Simpan</button>
                                </div>
                                <div className="col-auto d-flex mt-4">
                                    <button className="btn btn-sm fs18 h-100 fwbold px-4" style={batalStyle} onClick={this.props.togglePopup}>Batal</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="menu-popup-close" onClick={this.props.togglePopup}></div>
                </div>
    }
}

class CreditList extends React.Component {
    render() {
        var search = this.props.search
        var supplier = this.props.supplier
        var payment_method_list = this.props.payment_method_list
        function filterRow(row){
            function filterField(field){
                return field?field.toString().includes(search):false
            }
            var pm_find = payment_method_list.find(p => p.name == row.metode_pembayaran)
            var fields
            supplier?
            fields = [moment(row.date).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss"), row.supplier_name, pm_find?pm_find.method_name:'']:
            fields = [moment(row.date).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss"), row.pet_owner_name, pm_find?pm_find.method_name:'']
            
            return ![false,''].includes(search)?fields.some(filterField):true
        }
        var item_rows = []
        var panel_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px'}
        var data = this.props.data
        var data_names = this.props.data.map(d => d.name)
        var th = this
        var supplier_head
        
        console.log(this.props.mode)
        if (!this.props.supplier){
            !this.props.mode ? data_names = data.filter(filterRow).filter(d => d.type=='Payment' && d.nominal>=0).map(d => d.name) :
            this.props.mode=='debt' ? data_names = data.filter(filterRow).filter(d => d.debt_mutation != 0).map(d => d.name) :
            this.props.mode=='credit' ? data_names = data.filter(filterRow).filter(d => d.credit_mutation != 0).map(d => d.name):false
        } else {
            !this.props.mode ? data_names = data.filter(filterRow).filter(d => d.type=='Payment' && d.nominal>=0).map(d => d.name):
            this.props.mode=='debt' ? data_names = data.filter(filterRow).filter(d => d.debt_mutation != 0).map(d => d.name) :
            this.props.mode=='credit' ? data_names = data.filter(filterRow).filter(d => d.credit_mutation != 0).map(d => d.name) : false
        }
        
        if (data_names.length != 0){
            var ji = this
            // const indexOfLastTodo = this.props.currentpage * 30;
            // const indexOfFirstTodo = indexOfLastTodo - 30;
            // // const currentItems = this.props.data.slice(indexOfFirstTodo, indexOfLastTodo)
            // const currentItems = data_names.slice(indexOfFirstTodo, indexOfLastTodo)
            
            data.forEach(function(item, index){
                // if (currentItems.includes(item.name)){
                // if ((th.props.mode == 'credit' && item.credit_mutation != 0) || th.props.mode != 'credit') {
                    item_rows.push(
                        <CreditListRow payment_method_list={th.props.payment_method_list} key={index.toString()} item={item} checkRow={() => th.props.checkRow(index.toString())} no_filter={th.props.no_filter || false} supplier={th.props.supplier || false} mode={th.props.mode} printPDF={th.props.printPDF}/>
                    )
                // }
                // }
            })
            
            if (this.props.supplier) {
                supplier_head = <div className="col d-flex">
                					<span className="my-auto">{'Supplier'}</span>
                				</div>
            }
            
            if (data[0].invoice || data[0].pet_owner) {
                var balanceHeader, statusHeader, debtHeader, depositHeader, debitHeader, creditHeader, nominalHeader, methodHeader
                
                // if (!document.location.href.includes('?session')) {
                //     statusHeader = <div className="col-1 text-center">
                //     					<span className="my-auto">Status</span>
                //     				</div>
                //     balanceHeader = <div className="col d-flex">
                //     					<span className="my-auto">Balance</span>
                //     				</div>
                // }
                
                
                if (this.props.mode == 'debt' || this.props.mode == 'credit'){
                    if (this.props.mode == 'debt'){
                        debtHeader = <div className="col d-flex">
                        					<span className="my-auto">Remaining</span>
                        				</div>
                    } else if (this.props.mode == 'credit'){
                        depositHeader = <div className="col d-flex">
                        					<span className="my-auto">Deposit</span>
                        				</div>

                        debitHeader = <div className="col d-flex">
                                        <span className="my-auto">Debit</span>
                                    </div>
                        creditHeader = <div className="col d-flex">
                                        <span className="my-auto">Credit</span>
                                    </div>
                        methodHeader = <div className="col d-flex">
                                        <span className="my-auto">Metode Pembayaran</span>
                                    </div>
                    }
                } else {
                    nominalHeader = <div className="col d-flex">
                    					<span className="my-auto">Nominal</span>
                    				</div>
                    methodHeader = <div className="col d-flex">
                                        <span className="my-auto">Metode Pembayaran</span>
                                    </div>
                }
                
                return(
                    <div style={panel_style}>
                        <div className="row mx-0">
                            <div className="col-auto pl-2 pr-3">
                    			<input type="checkbox" className="d-block my-3" checked={this.props.check_all} onChange={this.props.checkAll}/>
                    		</div>
                            <div className="col row-header">
        			            <div className="row mx-0 fs12 fw600">
                    				<div className="col d-flex">
                    					<span className="my-auto">Tanggal</span>
                    				</div>
                    				<div className="col d-flex">
                    					<span className="my-auto">{this.props.no_filter ? 'Nama Pemilik' : 'No Registrasi'}</span>
                    				</div>
                    				<div className="col d-flex">
                    					<span className="my-auto">No Invoice</span>
                    				</div>
                    				{nominalHeader}
                    				{debitHeader}
                    				{creditHeader}
                    				{methodHeader}
                    				{balanceHeader}
                    				{debtHeader}
                    				{depositHeader}
                    				{statusHeader}
                			    </div>
                		    </div>
                        </div>
            		    {item_rows}
            		    <Pagination paginationClick={this.props.paginationClick} datalength={this.props.datalength} currentpage={this.props.currentpage} itemperpage='10'/>
            	    </div>
                )
            } else {
                var balanceHeader, statusHeader, debtHeader, depositHeader, debitHeader, creditHeader, nominalHeader
                
                // if (!document.location.href.includes('?session')) {
                //     balanceHeader = <div className="col d-flex">
                //     					<span className="my-auto">Balance</span>
                //     				</div>
                				
                //     statusHeader = <div className="col-1 text-center">
                //     					<span className="my-auto">Status</span>
                //     				</div>
                // }
                
                if (this.props.mode == 'debt' || this.props.mode == 'credit'){
                    debitHeader = <div className="col d-flex">
                        					<span className="my-auto">Debit</span>
                        				</div>
                    creditHeader = <div className="col d-flex">
                    					<span className="my-auto">Credit</span>
                    				</div>
                    
                    if (this.props.mode == 'debt'){
                        debtHeader = <div className="col d-flex">
                        					<span className="my-auto">Hutang</span>
                        				</div>
                    } else if (this.props.mode == 'credit'){
                        depositHeader = <div className="col d-flex">
                        					<span className="my-auto">Deposit</span>
                        				</div>
                    }
                } else {
                    nominalHeader = <div className="col d-flex">
                    					<span className="my-auto">Nominal</span>
                    				</div>
                }
                
                return(
                    <div style={panel_style}>
                        <div className="row mx-0">
                            <div className="col-auto pl-2 pr-3">
                    			<input type="checkbox" className="d-block my-3" checked={this.props.check_all} onChange={this.props.checkAll}/>
                    		</div>
                            <div className="col row-header">
        			            <div className="row mx-0 fs12 fw600">
                    				<div className="col d-flex">
                    					<span className="my-auto">Tanggal</span>
                    				</div>
                    				{supplier_head}
                    				<div className="col d-flex">
                    					<span className="my-auto">No Purchase</span>
                    				</div>
                    				{nominalHeader}
                    				{debitHeader}
                    				{creditHeader}
                    				<div className="col d-flex">
                    					<span className="my-auto">Metode Pembayaran</span>
                    				</div>
                    				{balanceHeader}
                    				{debtHeader}
                    				{depositHeader}
                    				{statusHeader}
                			    </div>
                		    </div>
                        </div>
            		    {item_rows}
            		    <Pagination paginationClick={this.props.paginationClick} datalength={this.props.datalength} currentpage={this.props.currentpage} itemperpage='10'/>
            	    </div>
                )
            }
        }
        else {
            return(
                <div style={panel_style}>
                    <div className="row justify-content-center" key='0'>
                        <div className="col-10 col-md-8 text-center border rounded-lg py-4">
                            <p className="mb-0 fs24md fs16 fw600 text-muted">
                                <span>Item tidak ditemukan</span>
                            </p>
                        </div>
                    </div>
                </div>
            )
        }
    }
}

class CreditListRow extends React.Component {
    clickRow(e){
        e.stopPropagation()
        var item = this.props.item
        
        if(item.invoice){
            if (item.invoice.includes('POSORDER')){
                window.location.href = "/main/kasir/pos-order/form?n="+ item.invoice
            } else {
                window.location.href = "/main/kasir/customer-invoices/edit?n="+ item.invoice
            }
        } else if(item.purchase){
            window.location.href = "/main/purchases/purchase-order/edit?n="+ item.purchase
        } else {
            window.location.href = "/main/accounting/journal-entries?reference="+ item.name
            // this.clickRowCredit(e, true)
        }
    }
    
    clickRowCredit(e,deposit){
        e.stopPropagation()
        var item = this.props.item
        
        if(item.invoice || item.pet_owner){
            deposit?window.location.href = "/main/kasir/deposit?n="+ item.pet_owner:window.location.href = "/main/penerimaan/data-pemilik/edit?n="+ item.pet_owner
        } else if(item.purchase || item.supplier){
            deposit?window.location.href = "/main/purchases/deposit?n="+ item.supplier:window.location.href = "/main/purchases/suppliers/edit?n="+ item.supplier
        }
    }
    
    render() {
        var item = this.props.item
        var style
        var cursor = {cursor: 'pointer'}
        var checked = false
        var supplier_row
        
        var link_icon = {cursor: 'pointer', maxWidth: 14, maxHeight: 14}
        
        if (this.props.item.checked){
            checked = true
        }
        
        if (['Draft'].includes(item.status)) {
            style = 'bg-warning'
        } else if (['Done'].includes(item.status)) {
            style = 'bg-success'
        }
        
        if (this.props.supplier) {
            supplier_row = <div className="col d-flex">
            					<span className="my-auto">{item.supplier_name} <img onClick={e => this.clickRowCredit(e)} src="/static/img/main/menu/tautan.png" className="ml-2" style={link_icon}/></span>
            				</div>
        }
        
        if (item.invoice || item.pet_owner) {
            var balanceRow, statusRow, debtRow, depositRow, debitRow, creditRow, nominalRow, methodRow
            
            // if (!document.location.href.includes('?session')) {
            //     statusRow = <div className="col-1 px-0 text-right">
            // 					<span title={item.status} className={style + " fs12 py-1 rounded-pill text-center text-white px-3 m-auto d-block text-truncate"}>
            // 						{item.status}
            // 					</span>
            // 				</div>
            // 	balanceRow = <div className="col d-flex">
            // 					<span className="my-auto">{formatter.format(item.credit)}</span>
            // 				</div>
            // }
            
            if(this.props.mode == 'debt'){
                debtRow = <div className="col d-flex">
            					<span className="my-auto">{formatter.format(item.remaining)}</span>
            				</div>
            	// if (item.debt_mutation >= 0){
            	//     debitRow = <div className="col d-flex">
            	// 				<span className="my-auto">{formatter.format(item.debt_mutation)}</span>
            	// 			</div>
            	// 	creditRow = <div className="col d-flex">
            	// 				<span className="my-auto">{formatter.format(0)}</span>
            	// 			</div>
            	// } else {
            	//     debitRow = <div className="col d-flex">
            	// 				<span className="my-auto">{formatter.format(0)}</span>
            	// 			</div>
            	// 	creditRow = <div className="col d-flex">
            	// 				<span className="my-auto">{formatter.format(-item.debt_mutation)}</span>
            	// 			</div>
            	// }
            } else if (this.props.mode == 'credit'){
                depositRow = <div className="col d-flex">
            					<span className="my-auto">{formatter.format(item.credit)}</span>
            				</div>
                methodRow = <div className="col d-flex">
                                <span className="my-auto">{payment_method || ''}</span>
                            </div>
            	if (item.credit_mutation >= 0){
            	    debitRow = <div className="col d-flex">
            					<span className="my-auto">{formatter.format(item.credit_mutation)}</span>
            				</div>
            		creditRow = <div className="col d-flex">
            					<span className="my-auto">{formatter.format(0)}</span>
            				</div>
            	} else {
            	    debitRow = <div className="col d-flex">
            					<span className="my-auto">{formatter.format(0)}</span>
            				</div>
            		creditRow = <div className="col d-flex">
            					<span className="my-auto">{formatter.format(-item.credit_mutation)}</span>
            				</div>
            	}
            } else {
                nominalRow = <div className="col d-flex">
            					<span className="my-auto">{formatter.format(item.nominal-(item.exchange||0))}</span>
            				</div>
                methodRow = <div className="col d-flex">
                                <span className="my-auto">{payment_method || ''}</span>
                            </div>
            }
            
            var credit_link
            if(this.props.no_filter){
                credit_link =  <img onClick={e => this.clickRowCredit(e)} src="/static/img/main/menu/tautan.png" className="ml-2" style={link_icon}/>
            }
            
            var payment_method = item.metode_pembayaran
            var pm_find = this.props.payment_method_list.find(p => p.name == item.metode_pembayaran)
            pm_find?payment_method = pm_find.method_name:false
            
            var pdfdeposit, print_button
            var no_invoice = !item.invoice||item.invoice.length == 0
            var no_purchase = !item.purchase||item.purchase.length == 0
            if(this.props.mode=='credit'&&!this.props.supplier&&(no_invoice&&no_purchase)){
                var print_button_style = {position: "absolute", right: 30, color: '#056EAD', cursor: 'pointer'}
                pdfdeposit = <PDFDeposit data={item} payment_method={payment_method} id={"pdfdeposit_"+item.name}/>
                print_button = <i className="fa fa-print fs16" style={print_button_style} onClick={() => this.props.printPDF("pdfdeposit_"+item.name)}/>
            }
            
            return(
                <div className="row mx-0">
                    <div className="col-auto pl-2 pr-3">
            			<input type="checkbox" className="d-block my-3" checked={checked} onChange={this.props.checkRow}/>
            		</div>
                    <div className="col row-list">
            			<div className="row mx-0 fs12 fw600">
            				<div className="col d-flex">
            					<span className="my-auto">{moment(item.date).subtract(tzOffset, 'minute').format("DD-MM-YYYY HH:mm:ss")}</span>
            				</div>
            				<div className="col d-flex">
            					<span className="my-auto">{this.props.no_filter ? item.pet_owner_name : item.register_number} {item.pet_owner_name||item.register_number?credit_link:false}</span>
            				</div>
            				<div className="col d-flex">
            					<span className="my-auto">{item.type} {item.invoice} <img onClick={e => this.clickRow(e)} src="/static/img/main/menu/tautan.png" className="ml-2" style={link_icon}/></span>
            				</div>
            				{nominalRow}
            				{debitRow}
            				{creditRow}
                            {methodRow}
            				{balanceRow}
            				{debtRow}
            				{depositRow}
            				{statusRow}
            				{print_button}
            			</div>
            		</div>
            		{pdfdeposit}
                </div>
            )
        } else {
            var balanceRow, statusRow, debtRow, depositRow, debitRow, creditRow, nominalRow
            
            if (!document.location.href.includes('?session')) {
                // balanceRow = <div className="col d-flex">
            				// // 	<span className="my-auto">{formatter.format(item.credit)}</span>
            				// // </div>
            				
                // statusRow = <div className="col-1 px-0 text-right">
            				// 	<span title={item.status} className={style + " fs12 py-1 rounded-pill text-center text-white px-3 m-auto d-block text-truncate"}>
            				// 		{item.status}
            				// 	</span>
            				// </div>
            	
            	if(this.props.mode == 'debt'){
                    debtRow = <div className="col d-flex">
                					<span className="my-auto">{formatter.format(item.debt)}</span>
                				</div>
                	if (item.debt_mutation >= 0){
                	    debitRow = <div className="col d-flex">
                					<span className="my-auto">{formatter.format(item.debt_mutation)}</span>
                				</div>
                		creditRow = <div className="col d-flex">
                					<span className="my-auto">{formatter.format(0)}</span>
                				</div>
                	} else {
                	    debitRow = <div className="col d-flex">
                					<span className="my-auto">{formatter.format(0)}</span>
                				</div>
                		creditRow = <div className="col d-flex">
                					<span className="my-auto">{formatter.format(-item.debt_mutation)}</span>
                				</div>
                	}
                } else if (this.props.mode == 'credit'){
                    depositRow = <div className="col d-flex">
                					<span className="my-auto">{formatter.format(item.credit)}</span>
                				</div>
                	if (item.credit_mutation >= 0){
                	    debitRow = <div className="col d-flex">
                					<span className="my-auto">{formatter.format(item.credit_mutation)}</span>
                				</div>
                		creditRow = <div className="col d-flex">
                					<span className="my-auto">{formatter.format(0)}</span>
                				</div>
                	} else {
                	    debitRow = <div className="col d-flex">
                					<span className="my-auto">{formatter.format(0)}</span>
                				</div>
                		creditRow = <div className="col d-flex">
                					<span className="my-auto">{formatter.format(-item.credit_mutation)}</span>
                				</div>
                	}
                } else {
                    nominalRow = <div className="col d-flex">
                					<span className="my-auto">{formatter.format(item.nominal-(item.exchange||0))}</span>
                				</div>
                }			
                
            }
            
            var payment_method = item.metode_pembayaran
            var pm_find = this.props.payment_method_list.find(p => p.name == item.metode_pembayaran)
            pm_find?payment_method = pm_find.method_name:false
            
            var pdfdeposit, print_button
            var no_invoice = !item.invoice||item.invoice.length == 0
            var no_purchase = !item.purchase||item.purchase.length == 0
            if(this.props.mode=='credit'&&!this.props.supplier&&(no_invoice&&no_purchase)){
                var print_button_style = {position: "absolute", right: 30, color: '#056EAD', cursor: 'pointer'}
                pdfdeposit = <PDFDeposit data={item} payment_method={payment_method} id={"pdfdeposit_"+item.name} onClick={() => this.props.printPDF("pdfdeposit_"+item.name)}/>
                print_button = <i className="fa fa-print fs16" style={print_button_style}/>
            }
            
            return(
                <div className="row mx-0">
                    <div className="col-auto pl-2 pr-3">
            			<input type="checkbox" className="d-block my-3" checked={checked} onChange={this.props.checkRow}/>
            		</div>
                    <div className="col row-list">
            			<div className="row mx-0 fs12 fw600">
            				<div className="col d-flex">
            					<span className="my-auto">{moment(item.date).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss")}</span>
            				</div>
            				{supplier_row}
            				<div className="col d-flex">
            					<span className="my-auto">{item.type} {item.purchase} <img onClick={e => this.clickRow(e)} src="/static/img/main/menu/tautan.png" className="ml-2" style={link_icon}/></span>
            				</div>
            				{nominalRow}
            				{debitRow}
            				{creditRow}
            				<div className="col d-flex">
            					<span className="my-auto">{payment_method || ''}</span>
            				</div>
            				{balanceRow}
            				{debtRow}
            				{depositRow}
            				{statusRow}
            				{print_button}
            			</div>
            		</div>
            		{pdfdeposit}
                </div>
            )
        }
    }
}

class PDF extends React.Component{
    render(){
        var search = this.props.search
        function filterRow(row){
            function filterField(field){
                return field?field.toString().includes(search):false
            }
            var pm_find = payment_method_list.find(p => p.name == row.metode_pembayaran)
            var fields
            supplier?
            fields = [moment(row.date).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss"), row.supplier_name, pm_find?pm_find.method_name:'']:
            fields = [moment(row.date).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss"), row.pet_owner_name, pm_find?pm_find.method_name:'']
            
            return ![false,''].includes(search)?fields.some(filterField):true
        }
        
        var data = this.props.data
        var supplier = this.props.supplier
        var mode = this.props.mode
        var payment_method_list = this.props.payment_method_list
        console.log(data)
        var page_dimension = {width: 559, minHeight: 794, top:0, right: 0, background: '#FFF', color: '#000', zIndex: -1}
        var borderStyle = {border: '1px solid #000', margin: '15px 0'}
        var row2 = {margin: '0 -14px'}
        var th = {border: '1px solid #000'}
        var td = {borderLeft: '1px solid #000', borderRight: '1px solid #000'}
        var fs13 = {fontSize: 13}
        var fs9 = {fontSize: 9}
        var invoice = {letterSpacing: 0, lineHeight: '24px', marginBottom: 0, marginTop: 18}
        var invoice2 = {letterSpacing: 0}
        var thead = {background: '#d9d9d9', fontSize: 11}
        var table_rows = []
        
        var print_data = data.slice()
        if (!supplier){
            !mode?print_data = print_data.filter(filterRow).filter(d => d.type=='Payment'&&d.nominal>=0):
            mode=='debt'?print_data = print_data.filter(filterRow).filter(d => d.debt_mutation != 0):
            mode=='credit'?print_data = print_data.filter(filterRow).filter(d => d.credit_mutation != 0):false
        } else {
            !mode?print_data = print_data.filter(filterRow).filter(d => d.type=='Payment'&&d.nominal>=0):
            mode=='debt'?print_data = print_data.filter(filterRow).filter(d => d.debt_mutation != 0):
            mode=='credit'?print_data = print_data.filter(filterRow).filter(d => d.credit_mutation != 0):false
        }
        
        const indexOfLastTodo = this.props.currentpage * 30;
        const indexOfFirstTodo = indexOfLastTodo - 30;
        const currentItems = print_data.slice(indexOfFirstTodo, indexOfLastTodo)
        // currentItems = print_data.slice(0,30)
        currentItems.forEach((d, index) => {
            var payment_method = d.metode_pembayaran
            var pm_find = payment_method_list.find(p => p.name == d.metode_pembayaran)
            pm_find?payment_method = pm_find.method_name:false
            var owner_col, reference_col, debit_col, credit_col, nominal_col, debt_col, deposit_col
            if(supplier){
                owner_col = <td className="py-1">{d.supplier_name}</td>
    	        reference_col = <td className="py-1">{d.type} {d.purchase}</td>
	            if(mode == 'debt'){
                    debt_col = <td className="py-1">{formatter.format(d.debt)}</td>
                    if (d.debt_mutation >= 0){
                	    debit_col = <td className="py-1">{formatter.format(d.debt_mutation)}</td>
                	    credit_col = <td className="py-1">{formatter.format(0)}</td>
                	} else {
                	    debit_col = <td className="py-1">{formatter.format(0)}</td>
                	    credit_col = <td className="py-1">{formatter.format(-d.debt_mutation)}</td>
                	}
                } else if(mode == 'credit'){
                    deposit_col = <td className="py-1">{formatter.format(d.credit)}</td>
                    if (d.credit_mutation >= 0){
                	    debit_col = <td className="py-1">{formatter.format(d.credit_mutation)}</td>
                	    credit_col = <td className="py-1">{formatter.format(0)}</td>
                	} else {
                	    debit_col = <td className="py-1">{formatter.format(0)}</td>
                	    credit_col = <td className="py-1">{formatter.format(-d.credit_mutation)}</td>
                	}
                } else {
                    nominal_col = <td className="py-1">{formatter.format(d.nominal-d.exchange||0)}</td>
                }
            } else {
                owner_col = <td className="py-1">{d.pet_owner_name}</td>
    	        reference_col = <td className="py-1">{d.type} {d.invoice}</td>
	            if(mode == 'debt'){
                    debt_col = <td className="py-1">{formatter.format(d.debt)}</td>
                    if (d.debt_mutation >= 0){
                	    debit_col = <td className="py-1">{formatter.format(d.debt_mutation)}</td>
                	    credit_col = <td className="py-1">{formatter.format(0)}</td>
                	} else {
                	    debit_col = <td className="py-1">{formatter.format(0)}</td>
                	    credit_col = <td className="py-1">{formatter.format(-d.debt_mutation)}</td>
                	}
                } else if(mode == 'credit'){
                    deposit_col = <td className="py-1">{formatter.format(d.credit)}</td>
                    if (d.credit_mutation >= 0){
                	    debit_col = <td className="py-1">{formatter.format(d.credit_mutation)}</td>
                	    credit_col = <td className="py-1">{formatter.format(0)}</td>
                	} else {
                	    debit_col = <td className="py-1">{formatter.format(0)}</td>
                	    credit_col = <td className="py-1">{formatter.format(-d.credit_mutation)}</td>
                	}
                } else {
                    nominal_col = <td className="py-1">{formatter.format(d.nominal-d.exchange||0)}</td>
                }
            }
        
            table_rows.push(
                <tr key={d.name} style={fs9} className="text-center">
                    <td className="py-1 text-left">{moment(d.date).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss")}</td>
                    {owner_col}
                    {reference_col}
                    {debit_col}
                    {credit_col}
                    {nominal_col}
                    <td className="py-1">{payment_method}</td>
                    {debt_col}
                    {deposit_col}
                </tr>
            )
        })
        
        var header_row, owner_col, reference_col, debit_col, credit_col, nominal_col, debt_col, deposit_col
        if(this.props.supplier){
            var width = "79px"
            owner_col = <th className="fw700 py-2" width={width}>Supplier</th>
	        reference_col = <th className="fw700 py-2" width={width}>No. Purchase</th>
	        if(['debt', 'credit'].includes(this.props.mode)){
	            debit_col = <th className="fw700 py-2" width={width}>Debit</th>
	            credit_col = <th className="fw700 py-2" width={width}>Credit</th>
	            if(this.props.mode == 'debt'){
                    debt_col = <th className="fw700 py-2" width={width}>Hutang</th>
                } else if(this.props.mode == 'credit'){
                    deposit_col = <th className="fw700 py-2" width={width}>Deposit</th>
                }
	        } else {
	            width = "111px"
                nominal_col = <th className="fw700 py-2" width={width}>Nominal</th>
            }
        } else {
            var width = "79px"
            owner_col = <th className="fw700 py-2" width={width}>Nama Pemilik</th>
	        reference_col = <th className="fw700 py-2" width={width}>No. Invoice</th>
	        if(['debt', 'credit'].includes(this.props.mode)){
	            debit_col = <th className="fw700 py-2" width={width}>Debit</th>
	            credit_col = <th className="fw700 py-2" width={width}>Credit</th>
	            if(this.props.mode == 'debt'){
                    debt_col = <th className="fw700 py-2" width={width}>Piutang</th>
                } else if(this.props.mode == 'credit'){
                    deposit_col = <th className="fw700 py-2" width={width}>Deposit</th>
                }
	        } else {
	            width = "111px"
                nominal_col = <th className="fw700 py-2" width={width}>Nominal</th>
            }
        }
        
        header_row = <tr className="text-center">
            <th className="fw700 py-2" width={width}>Tanggal</th>
            {owner_col}
            {reference_col}
            {nominal_col}
            {debit_col}
            {credit_col}
            <th className="fw700 py-2" width={width}>Metode Pembayaran</th>
            {debt_col}
            {deposit_col}
        </tr>
        
        return(
            <div className="position-absolute d-none" style={page_dimension}>
                <div id="pdf" className="px-4" style={page_dimension}>
    			    <div className="row">
    			        <div className="col-2 px-0">
    			            <img className="mt-3" src="/static/img/main/menu/naturevet_logo_2x.png"/>
    			        </div>
    			        <div className="col-6">
    			            <p className="my-3 fwbold text-uppercase" style={fs13}>Nature Vet Tebet</p>
    			            <p className="my-0" style={fs9}>Jl. Tebet Raya No.14, Tebet Bar.,<br/>Kec. Tebet,  Jakarta Selatan</p>
    			            <p className="my-0" style={fs9}>Telp. : (021) 83792692 </p>
    			        </div>
    			        <div className="col-4 px-0">
    			            <p className="fwbold text-right text-uppercase fs28" style={invoice}>Purchase Order</p>
    			            <p className="fw600 text-right text-uppercase fs14" style={invoice2}>{moment().format("MM/YYYY")}</p>
    			        </div>
    			        <div className="col-12" style={borderStyle}/>
    			    </div>
    			    <table className="fs12" style={row2}>
    			        <thead className="text-uppercase" style={thead}>
        			        {header_row}
        			    </thead>
        			    <tbody>
        			        {table_rows}
        			    </tbody>
    			    </table>
    			</div>
			</div>
        )
    }
}

class PDFDeposit extends React.Component {
    render(){
        var data = this.props.data
        var payment_method = this.props.payment_method
        var page_dimension = {width: 559, minHeight: 794, top:0, right: 0, background: '#FFF', color: '#000', zIndex: -1}
        var borderStyle = {border: '1px solid #000', margin: '15px 0'}
        var row2 = {margin: '0 -14px'}
        var th = {border: '1px solid #000'}
        var td = {borderLeft: '1px solid #000', borderRight: '1px solid #000'}
        var fs13 = {fontSize: 13}
        var fs9 = {fontSize: 9}
        var invoice = {letterSpacing: 0, lineHeight: '24px', marginBottom: 0, marginTop: 18}
        var invoice2 = {letterSpacing: 0}
        var thead = {background: '#d9d9d9', fontSize: 11}
        
        return(
            <div className="position-absolute d-none" style={page_dimension}>
                <div id={this.props.id} className="px-4" style={page_dimension}>
    			    <div className="row">
    			        <div className="col-2 px-0">
    			            <img className="mt-3" src="/static/img/main/menu/naturevet_logo_2x.png"/>
    			        </div>
    			        <div className="col-10">
    			            <p className="my-3 fwbold text-uppercase" style={fs13}>Nature Vet Tebet</p>
    			            <p className="my-0" style={fs9}>Jl. Tebet Raya No.14, Tebet Bar.,<br/>Kec. Tebet,  Jakarta Selatan</p>
    			            <p className="my-0" style={fs9}>Telp. : (021) 83792692 </p>
    			        </div>
    			        <div className="col-12" style={borderStyle}/>
    			    </div>
    			    <div className="row">
    			        <div className="col-12 text-center text-uppercase" style={thead}>
    			            Payment
    			        </div>
    			    </div>
    			    <div className="row fs10">
    			        <div className="col-4">Tanggal</div>
    			        <div className="col-auto px-0">:</div>
    			        <div className="col">{moment(data.date).locale('id').format("dddd, DD-MM-YYYY HH:mm:ss")}</div>
    			    </div>
    			    <div className="row fs10">
    			        <div className="col-4">Nama Pemilik</div>
    			        <div className="col-auto px-0">:</div>
    			        <div className="col">{data.pet_owner_name}</div>
    			    </div>
    			    <div className="row fs10">
    			        <div className="col-4">Nominal</div>
    			        <div className="col-auto px-0">:</div>
    			        <div className="col">{formatter.format(data.nominal<0?-data.nominal:data.nominal)}</div>
    			    </div>
    			    <div className="row fs10">
    			        <div className="col-4">Metode Pembayaran</div>
    			        <div className="col-auto px-0">:</div>
    			        <div className="col">{payment_method}</div>
    			    </div>
    			    <div className="row fs10">
    			        <div className="col-4">Keterangan</div>
    			        <div className="col-auto px-0">:</div>
    			        <div className="col">{data.credit_mutation<0?"Pengambilan Deposit":"Pembayaran Depost"}</div>
    			    </div>
    			    <div className="row fs10">
    			        <div className="col-4">Deposit</div>
    			        <div className="col-auto px-0">:</div>
    			        <div className="col">{formatter.format(data.credit)}</div>
    			    </div>
    			    <div className="row fs10 mt-2">
    			        <div className="col-4 ml-auto text-right">
    			            <p className="fw600 mb-5">Responsible</p>
    			            <p className="fw600 mb-0">{data.owner_full_name}</p>
    			        </div>
    			    </div>
    			</div>
    		</div>
    	)
    }
}

var pet_owner_credit = document.getElementById('pet_owner_credit')
if(pet_owner_credit != undefined){
    ReactDOM.render(<Credit />, pet_owner_credit)
}

var customer_payments = document.getElementById('customer_payments')
if(customer_payments != undefined){
    ReactDOM.render(<Credit no_filter={true} mode={customer_payments.dataset.mode||false}/>, customer_payments)
}

var supplier_payments = document.getElementById('supplier_payments')
if(supplier_payments != undefined){
    ReactDOM.render(<Credit no_filter={true} mode={supplier_payments.dataset.mode||false} supplier={true}/>, supplier_payments)
}