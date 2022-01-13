const user = document.getElementById('pos_sessions_list').dataset.user
// var tzOffset = new Date().getTimezoneOffset()
var tzOffset = 0
class PosSessions extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': [],
            'loaded': false,
            'check_all': false,
            'show_delete': false,
            'currentpage': 1,
            'journal': [],
            'journal_out': [],
            'search': false,
            'currentUser': {},
            'datalength': 0,
        }
        
        this.sessionSearch = this.sessionSearch.bind(this);
        this.checkRow = this.checkRow.bind(this);
        this.deleteRow = this.deleteRow.bind(this);
        this.paginationClick = this.paginationClick.bind(this);
        this.createSession = this.createSession.bind(this);
        this.updateStatus = this.updateStatus.bind(this);
        this.updateOpeningClosing = this.updateOpeningClosing.bind(this)
    }
    
    componentDidMount() {
        var po = this
        var filters = {filters: [], sorts: []}
        
        // console.log(document.referrer)
        // // console.log(document.referrer.includes('/main/penerimaan/penerimaan-pasien/detail'))
       
        // if (sessionStorage.getItem(window.location.pathname) != null) {
        //     filters = JSON.parse(sessionStorage.getItem(window.location.pathname))
        // } else {
        //     filters = {filters: [], sorts: []}
        // }
        
        // if (filters.hasOwnProperty("currentpage")) {
        //     this.setState({'currentpage': filters['currentpage']})
        // }
        
        sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))
        
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
        
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetpossessions.vetpossessions.get_sessions_list",
            args: {filters: filters},
            callback: function(r){
                if (r.message) {
                    console.log(r.message)
                    po.setState({'data': r.message.session, 'loaded': true, 'journal': r.message.journal, 'journal_out': r.message.journal_out, 'datalength': r.message.datalength});
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
                method:"vet_website.vet_website.doctype.vetpossessions.vetpossessions.get_sessions_list",
                args: {filters: filters},
                callback: function(r){
                    if (r.message) {
                        console.log(r.message)
                        po.setState({'data': r.message.session, 'loaded': true, 'journal': r.message.journal, 'journal_out': r.message.journal_out, 'datalength': r.message.datalength});
                    }
                }
            });
        // }
    }
    
    sessionSearch(filters) {
        var po = this
        
        this.setState({
          currentpage: 1,
          loaded: false,
        });
        
        filters['currentpage'] = 1;
        sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))
        
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetpossessions.vetpossessions.get_sessions_list",
            args: {filters: filters},
            callback: function(r){
                if (r.message) {
                    console.log(r.message)
                    po.setState({'data': r.message.session, loaded: true, 'journal': r.message.journal, 'journal_out': r.message.journal_out, 'datalength': r.message.datalength});
                }
            }
        });
    }
    
    createSession() {
        var po = this
        frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vetpossessions.vetpossessions.create_session",
            args: {},
            callback: function(r){
                if (r.message != false) {
                    // var new_data = po.state.data
                    // new_data.unshift(r.message)
                    // po.setState({data: new_data})
                    var filters = JSON.parse(sessionStorage.getItem(window.location.pathname))
                    po.sessionSearch(filters)
                } else {
                    frappe.msgprint('Masih ada session yang active')
                }
            }
        });
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
    
    deleteRow(e) {
        e.preventDefault();
        var po = this
        var delete_data = this.state.data.filter((d) => d.checked)
        var delete_data_names = delete_data.map((d) => d.name)
        frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vetpossessions.vetpossessions.delete_pos_session",
            args: {data: delete_data_names},
            callback: function(r){
                if (r.message.success) {
                    var new_data = po.state.data.filter((d => !d.checked))
                    po.setState({data: new_data, check_all: false, show_delete: false});
                }
            }
        });
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
    
    refreshData(new_data) {
        new_data['total_kas_masuk'] = new_data['kas_masuk'].reduce((a,v) =>  a = a + v.jumlah , 0 )
        new_data['total_kas_keluar'] = new_data['kas_keluar'].reduce((a,v) =>  a = a + v.jumlah , 0 )
        new_data['current_balance'] = new_data['opening_balance'] + new_data['transaction'] + new_data['total_kas_masuk'] - new_data['total_kas_keluar']
        new_data['difference'] = new_data['current_balance'] - new_data['closing_balance']
        
        return new_data
    }
    
    updateStatus(i, data) {
        var po = this
        console.log(data)
        frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vetpossessions.vetpossessions.update_data",
            args: {data: data},
            callback: function(r){
                if (r.message) {
                    console.log(r.message)
                    var new_data = po.state.data
                    new_data[i] = Object.assign(new_data[i], r.message)
                    
                    po.setState({data: new_data})
                }
            }
        });
    }
    
    kasMasukKeluar(i, kas) {
        var th = this
        console.log(i, kas)
        
        frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vetpossessions.vetpossessions.kas_masuk_keluar",
            args: {session: this.state.data[i]['name'], list_kas: kas},
            callback: function(r){
                if (r.message) {
                    console.log(r.message)
                    var new_data = th.state.data
                    var afterRefresh = th.refreshData(Object.assign(new_data[i], r.message))
                    
                    new_data[i] = afterRefresh
                    
                    th.setState({data: new_data})
                }
            }
        });
    }
    
    updateOpeningClosing(i, mode, nominal){
        console.log('Edit OC')
        var th = this
        frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vetpossessions.vetpossessions.update_opening_closing",
            args: {name: this.state.data[i]['name'], mode: mode, nominal: nominal},
            callback: function(r){
                if (r.message) {
                    var new_data = th.state.data
                    var afterRefresh = th.refreshData(Object.assign(new_data[i], r.message))
                    
                    new_data[i] = afterRefresh
                    
                    th.setState({data: new_data})
                }
            }
        });
    }
    
    render() {
        var write = checkPermission('VetPosSessions', this.state.currentUser, 'write')
        console.log(this.state)
        var status_options = []
        this.state.data.forEach(d => !status_options.map(o => o.value).includes(d.status)?status_options.push({label: d.status, value: d.status}):false)
        
        var sorts = [
        				{'label': 'Opening Session DESC', 'value': 'opening_session desc'},
        				{'label': 'Opening Session ASC', 'value': 'opening_session asc'},
        				{'label': 'Closing Session DESC', 'value': 'closing_session desc'},
        				{'label': 'Closing Session ASC', 'value': 'closing_session asc'},
					]
					
		var field_list = [
		                {'label': 'ID Session', 'field': 'name', 'type': 'char'},
		                {'label': 'Opening Session', 'field': 'opening_session', 'type': 'date'},
		                {'label': 'Closing Session', 'field': 'closing_session', 'type': 'date'},
		                {'label': 'Responsible', 'field': 'responsible_name', 'type': 'char'},
		                {'label': 'Transaction', 'field': 'transaction', 'type': 'char'},
		                {'label': 'Status', 'field': 'status', 'type': 'select', 'options': status_options},
		            ]
					
		var row_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px'}
		var formStyle = {border: '1px solid #397DA6', color: '#397DA6'}
		var delete_button
		
		if (this.state.show_delete) {
		    delete_button = <button className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={this.deleteRow}>Hapus</button>
		}
		
        if (this.state.loaded){
            return(
                <div>
                    <div className="row mx-0" style={row_style}>
                        <div className="col-auto">
                            <button type="button" className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={this.createSession}><i className="fa fa-plus mr-2"/>Tambah</button>
                            {delete_button}
                        </div>
                        <div className="col">
                            <input className="form-control fs12" name="search" placeholder="Search..." style={formStyle} onChange={e => this.setState({search: e.target.value})}/>
                        </div>
                        <div className="col-7">
                            <Filter sorts={sorts} searchAction={this.sessionSearch} field_list={field_list} filters={JSON.parse(sessionStorage.getItem(window.location.pathname))}/>
                        </div>
                    </div>
                    <PosSessionsList write={write} sessions={this.state.data} search={this.state.search} journal={this.state.journal} journal_out={this.state.journal_out} checkRow={this.checkRow} checkAll={() => this.checkAll()} check_all={this.state.check_all} paginationClick={this.paginationClick} currentpage={this.state.currentpage} updateOpeningClosing={this.updateOpeningClosing} updateStatus={(i, data) => this.updateStatus(i, data)} kasMasukKeluar={(i, list_kas) => this.kasMasukKeluar(i, list_kas)} datalength={this.state.datalength}/>
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


class PosSessionsList extends React.Component {
    render() {
        var search = this.props.search
        function filterRow(row){
            function filterField(field){
                return field?field.toString().includes(search):false
            }
            var fields = [row.name, moment(row.opening_session).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss"), row.closing_session ? moment(row.closing_session).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss") : '', row.responsible_name, row.status]
            return ![false,''].includes(search)?fields.some(filterField):true
        }
        
        var session_rows = []
        var panel_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px'}
        var sessions = this.props.sessions
        
        if (sessions.length != 0){
            var pol = this
            // const indexOfLastTodo = this.props.currentpage * 30;
            // const indexOfFirstTodo = indexOfLastTodo - 30;
            // var currentItems
            // ![false,''].includes(search)?
            // currentItems = sessions.filter(filterRow).slice(indexOfFirstTodo, indexOfLastTodo):
            // currentItems = sessions.slice(indexOfFirstTodo, indexOfLastTodo)
            sessions.forEach(function(item, index){
                // if (currentItems.includes(item)){
                    session_rows.push(
                        <PosSessionsListRow write={pol.props.write} key={index.toString()} session={item} journal={pol.props.journal} journal_out={pol.props.journal_out} checkRow={() => pol.props.checkRow(index)} updateStatus={(data) => pol.props.updateStatus(index.toString(), data)} kasMasukKeluar={(data) => pol.props.kasMasukKeluar(index.toString(), data)} updateOpeningClosing={(mode, nominal) => pol.props.updateOpeningClosing(index.toString(), mode, nominal)}/>
                    )
                // }
            })
            
            return(
                <div style={panel_style}>
                	<div className="row mx-0">
                		<div className="col-auto pl-2 pr-3">
                			<input type="checkbox" className="d-block my-3" checked={this.props.check_all} onChange={this.props.checkAll}/>
                		</div>
                		<div className="col row-header">
                			<div className="row mx-0 fs12 fw600">
                				<div className="col text-center">
                					<span className="my-auto">ID Session</span>
                				</div>
                				<div className="col text-center">
                					<span className="my-auto">Opening Session</span>
                				</div>
                				<div className="col text-center">
                					<span className="my-auto">Closing Session</span>
                				</div>
                				<div className="col text-center">
                					<span className="my-auto">Responsible</span>
                				</div>
                				<div className="col text-center">
                					<span className="my-auto">Transaction</span>
                				</div>
                				<div className="col text-center">
                					<span className="my-auto">Status</span>
                				</div>
                				<div className="col-1 text-right"></div>
                			</div>
                		</div>
                	</div>
                	{session_rows}
                	<Pagination paginationClick={this.props.paginationClick} datalength={this.props.datalength} currentpage={this.props.currentpage} itemperpage='10'/>
                </div>
            )
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

class PosSessionsListRow extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'show_detail': false,
            'show_cash_popup': false,
            'show_open_close': false,
            'showCloseConfirmation': false,
        }
        
        this.toggleDetail = this.toggleDetail.bind(this)
        this.toggleCashPopup = this.toggleCashPopup.bind(this)
        this.toggleOpenClosePopup = this.toggleOpenClosePopup.bind(this)
        this.toggleCloseConfirmation = this.toggleCloseConfirmation.bind(this)
    }
    
    toggleDetail() {
        this.setState({show_detail: !this.state.show_detail})
    }
    
    toggleCashPopup(type=false) {
        this.setState({show_cash_popup: type})
    }
    
    toggleOpenClosePopup(type=false) {
        this.setState({show_open_close: type})
    }
    
    toggleCloseConfirmation() {
        this.setState({showCloseConfirmation: !this.state.showCloseConfirmation})
    }
    
    goToOrder() {
        var pathname = "/main/kasir/pos-order?session="+this.props.session.name
        window.location = pathname
    }
    
    goToCustomerInvoice() {
        var pathname = "/main/kasir/customer-invoices?session="+this.props.session.name
        window.location = pathname
    }
    
    goToRawatInapInvoice() {
        var pathname = "/main/kasir/rawat-inap-invoices?session="+this.props.session.name
        window.location = pathname
    }
    
    goToPayment() {
        var pathname = "/main/kasir/customer-payments?session="+this.props.session.name
        window.location = pathname
    }
    
    goToPos() {
        var pathname = "/pos"
        window.location = pathname
    }
    
    printPDF() {
        var pdfid = 'pdf'+this.props.session.name
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
            filename: "Sessions-"+this.props.session.name+".pdf",
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
        var checked = false
        var session = this.props.session
        
        if (session.checked) {
            checked = true
        }
        
        var chevron, detail, bTop
        
        var styles = {
            closeSession: {color: '#1B577B'},
            btnMain: {border: '1px solid #037CC5', background: '#037CC5', color: '#FFF', width: '100%'},
            btnOrder: {border: '1px solid #126930', color: '#126930', width: '100%'},
            btnCloseSession: {border: '1px solid #056EAD', color: '#056EAD', width: '100%'},
            btnOpenPos: {background: '#056EAD', color: '#FFFFFF', width: '100%'},
            border: {borderBottom: '1px solid #1B577B'},
            border2: {borderBottom: '1px solid #000'},
            cBlue: {color: '#1B577B'},
            cBlue2: {color: '#056EAD'},
            cGreen: {color: '#149A39'},
            cRed: {color: '#F80F0F'},
            cBlack: {color: '#000000'},
            noCashPayment: {border: '1px solid #94999E', borderRadius: '8px'},
            h78: {height: '78%'},
            flexWrap: {display: 'flex', flexFlow: 'wrap'},
            emptyCol: {minWidth: 38},
            fs11: {fontSize: 11},
            cursor: {cursor: 'pointer'}
        }
        
        var openPosButton = <div className="col-12 mt-2">
                                <button className="btn text-center fs14 py-2" style={styles.btnOpenPos} onClick={() => this.goToPos()}>Open POS</button>
                            </div>
                            
        var non_cash_transaction = session.non_cash_payment.filter(item => !['Deposit Customer','Deposit Supplier','Cash'].includes(item.type)).reduce((total, p) => total += (p.value - (p.exchange+p.credit_mutation)), 0)
        var non_cash_deposit = session.non_cash_payment.filter(item => !['Deposit Customer','Deposit Supplier','Cash'].includes(item.type)).reduce((total, p) => total += p.credit_mutation, 0)
        var non_cash_deposit_return = session.non_cash_payment.filter(item => !['Deposit Customer','Deposit Supplier','Cash'].includes(item.type)).reduce((total, p) => total += p.credit_mutation_return, 0)
        var non_cash_debt = session.non_cash_payment.filter(item => !['Deposit Customer','Deposit Supplier','Cash'].includes(item.type)).reduce((total, p) => total += p.debt_mutation, 0)
        
        var deposit_transaction = session.non_cash_payment.filter(item => ['Deposit Customer','Deposit Supplier'].includes(item.type)).reduce((total, p) => total += p.value, 0)
        var deposit_debt = session.non_cash_payment.filter(item => ['Deposit Customer','Deposit Supplier'].includes(item.type)).reduce((total, p) => total += p.debt_mutation, 0)
        
        var cash_transaction = session.cash_payment.reduce((total, p) => total += (p.value - (p.exchange+p.credit_mutation)), 0)
        var cash_deposit = session.cash_payment.reduce((total, p) => total += p.credit_mutation, 0)
        var cash_deposit_return = session.cash_payment.reduce((total, p) => total += p.credit_mutation_return, 0)
        var cash_debt = session.cash_payment.reduce((total, p) => total += p.debt_mutation, 0)
        
        var sales_debt = session.sales_debt.reduce((total, p) => total += p.debt_mutation, 0)
        
        // var balance = (session.opening_balance+cash_transaction+cash_deposit+session.total_kas_masuk)-session.total_kas_keluar
        // var setor = (cash_transaction+cash_deposit+session.total_kas_masuk)-session.total_kas_keluar
        var balance = (session.opening_balance+cash_transaction+(cash_deposit+cash_deposit_return)+session.total_kas_masuk)-session.total_kas_keluar
        // var setor = (cash_transaction+cash_deposit+session.total_kas_masuk)
        var setor = balance-session.closing_balance
        
        var all_transaction = non_cash_transaction + cash_transaction
        var all_deposit = (non_cash_deposit+non_cash_deposit_return) + (cash_deposit+cash_deposit_return)
        !all_deposit||all_deposit<0?all_deposit=0:false
        var all_debt = sales_debt + (cash_debt+non_cash_debt+deposit_debt)
        !all_debt||all_debt<0?all_debt=0:false
        
        var total_omset = all_transaction + all_deposit + all_debt
        // var total_omset = all_transaction + deposit_transaction + all_debt
        
        if (this.state.show_detail) {
            chevron = <i className="fa fa-chevron-up fa-lg"></i>
            var buttons, close_label, cash_buttons
            var customer_invoice_button = (
                <div className="row">
                    <div className="col-12">
                        <button className="btn text-center fs14 py-2 px-0" style={styles.btnMain} onClick={() => this.goToCustomerInvoice()}>Customer Invoice</button>
                    </div>
                </div>
            )
            var rawat_inap_invoice_button = (
                <div className="row">
                    <div className="col-12">
                        <button className="btn text-center fs14 py-2 px-0" style={styles.btnMain} onClick={() => this.goToRawatInapInvoice()}>Rawat Inap Invoice</button>
                    </div>
                </div>
            )
            if(session.status == "In Progress" && session.responsible == user){
                buttons = (
                    <div className="row justify-content-center mb-auto">
                        <div className="col-12 mb-3">
                            <button className="btn text-center fs14 py-2 px-0" style={styles.btnCloseSession} onClick={() => this.toggleCloseConfirmation()}>Close & Post Session</button>
                        </div>
                        <div className="col-12">
                            <div className="row">
                                <div className="col pr-2">
                                    <button className="btn text-center fs14 py-2 px-0" style={styles.btnMain} onClick={() => this.goToOrder()}>Order</button>
                                </div>
                                <div className="col pl-2">
                                    <button className="btn text-center fs14 py-2 px-0" style={styles.btnMain} onClick={() => this.goToPayment()}>Payment</button>
                                </div>
                            </div>
                            <div className="mt-2">
                                {customer_invoice_button}
                            </div>
                            <div className="mt-2">
                                {rawat_inap_invoice_button}
                            </div>
                        </div>
                    </div>
                )
            } else {
                buttons = (
                    <div className="row justify-content-center mb-auto mx-n2">
                        <div className="col-6 px-2">
                            <button className="btn text-center fs14 py-2 px-0" style={styles.btnMain} onClick={() => this.goToOrder()}>Order</button>
                        </div>
                        <div className="col-6 px-2">
                            <button className="btn text-center fs14 py-2 px-0" style={styles.btnMain} onClick={() => this.goToPayment()}>Payment</button>
                        </div>
                        <div className="col-12 px-2 mt-2">
                            {customer_invoice_button}
                        </div>
                        <div className="col-12 px-2 mt-2">
                            {rawat_inap_invoice_button}
                        </div>
                    </div>
                )
            }
            
            if(session.status == "Closed & Posted"){
                close_label = (
                    <div className="mt-auto">
                        <div className="mb-3 fs18" style={Object.assign({}, styles.closeSession, styles.cursor)} onClick={() => window.location.href="/main/accounting/journal-entries?reference="+session.name}>Closing Session</div>
                        <div className="mb-3 fs18">{session.closing_session ? moment(session.closing_session).subtract(tzOffset, 'minute').format("DD/MM/YYYY HH:mm:ss") : 'Not Defined'}</div>
                    </div>
                )
            } else {
                close_label = <div className="mt-auto"/>
            }
            
            var nonCashPayment
            if (session.non_cash_payment && session.non_cash_payment.filter(item => !['Deposit Customer','Deposit Supplier','Cash'].includes(item.type)).length > 0) {
                var nonCashRow = []
                
                session.non_cash_payment.filter(item => !['Deposit Customer','Deposit Supplier','Cash'].includes(item.type)).forEach(function(item, index) {
                    var transaction = item.value - (item.exchange+item.credit_mutation)
                    var credit_mutation = item.credit_mutation
                    var credit_mutation_return = item.credit_mutation_return

                    nonCashRow.push(
                        <div className="row mb-2 ml-0" key={index.toString()} style={styles.fs11}>
                            <div className="col-12 px-1" style={styles.cBlack}>
                                <div>{item.method_name || item.type}</div>
                            </div>
                            <div className="col-3 px-1">
                                <div>{formatter.format(transaction)}</div>
                            </div>
                            <div className="col-3 px-1">
                                <div>{formatter.format(credit_mutation)}</div>
                            </div>
                            <div className="col-3 px-1">
                                <div>{formatter.format(credit_mutation_return!=0?-credit_mutation_return:credit_mutation_return)}</div>
                            </div>
                            <div className="col-3 px-1">
                                {/*<div>{formatter.format(item.value)}</div>*/}
                                <div>{formatter.format(item.value + credit_mutation_return)}</div>
                            </div>
                        </div>
                    )
                })
                nonCashPayment = <div className="py-2 px-4 mb-3" style={styles.noCashPayment}>
                                        <div className="row justify-content-between mb-2" style={styles.border2}>
                                            <div className="col-6">
                                                <p className="fs14 fw600 mb-2" style={styles.cBlack}>Pembayaran Non Cash</p>
                                            </div>
                                            <div className="col-6 d-flex">
                                                <p className="fs14 fw600 ml-auto my-auto" style={styles.cBlack}>{formatter.format(session.non_cash_payment.filter(item => !['Deposit','Cash'].includes(item.type)).reduce((total, p) => total += p.value, 0) || 0)}</p>
                                            </div>
                                        </div>
                                        <div className="row mb-2 fs10 ml-0" style={Object.assign({}, styles.fs11, styles.cBlack)}>
                                            <div className="col-3 px-1">
                                                <div>Transaksi</div>
                                            </div>
                                            <div className="col-3 px-1">
                                                <div>Deposit</div>
                                            </div>
                                            <div className="col-3 px-1">
                                                <div>Deposit Return</div>
                                            </div>
                                            <div className="col-3 px-1">
                                                <div>Total</div>
                                            </div>
                                        </div>
                                        {nonCashRow}
                                    </div>
            }
            
            var editOpening, editClosing
            if(session.status != 'Closed & Posted'){
                editOpening = <i className="fa fa-pencil-square-o fs18" style={Object.assign({}, styles.cBlue, styles.cursor)} onClick={() => this.toggleOpenClosePopup('open')}/>
                editClosing = <i className="fa fa-pencil-square-o fs18" style={Object.assign({}, styles.cBlue, styles.cursor)} onClick={() => this.toggleOpenClosePopup('close')}/>
            }
            
            detail = <div className="col-12">
                        <div className="row mx-0 mt-3 py-3 fw600">
                            <div className="col-4 text-center px-5 d-flex flex-column">
                                {close_label}
                                {buttons}
                                <div className="row justify-content-center my-4 mx-n2">
                                    <div className="col px-2">
                                        <button className="btn text-center fs14 py-2 px-4" style={styles.btnCloseSession} onClick={() => this.toggleCashPopup("in")}>Kas Masuk</button>
                                    </div>
                                    <div className="col px-2">
                                        <button className="btn text-center fs14 py-2 px-4" style={styles.btnOrder} onClick={() => this.toggleCashPopup("out")}>Kas Keluar</button>
                                    </div>
                                </div>
                                <div className="row justify-content-center mb-2 mx-n2">
                                    <div className="col-12 px-2">
                                        <button type='button' className="btn fs14 py-2 px-4" style={styles.btnMain} onClick={session.status != 'Closed & Posted' && this.props.write?() => this.toggleOpenClosePopup('close'):() => false}><span className="float-left">Closing Acuan</span><span className="float-right">{formatter.format(session.closing_balance)}</span></button>
                                    </div>
                                </div>
                                <div className="row justify-content-center mb-2 mx-n2">
                                    <div className="col-12 px-2">
                                        <button type="button" className="btn btn-block btn-outline-danger text-uppercase fs12 fwbold" onClick={() => this.printPDF()}>Print</button>
                                    </div>
                                </div>
                            </div>
                            <div className="col-4">
                                <div className="row mb-2" style={styles.border}>
                                    <p className="fs16 fw600 mb-2" style={styles.cBlue}>Laporan Kas</p>
                                </div>
                                <div className="row justify-content-end mb-2">
                                    <div className="col-6 col-md" style={styles.cBlue}>
                                        <div>Opening Balance</div>
                                    </div>
                                    <div className="col-4 px-0">
                                        <div>{formatter.format(session.opening_balance || 0)}</div>
                                    </div>
                                    <div className="col-2 px-0 text-right">
                                        {editOpening}
                                    </div>
                                </div>
                                <div className="row justify-content-end mb-2">
                                    <div className="col-6 col-md" style={styles.cBlue}>
                                        <div>Transaction</div>
                                    </div>
                                    <div className="col-6 px-0">
                                        {/*<div>{formatter.format(session.transaction)}</div>*/}
                                        <div>{formatter.format(cash_transaction || 0)}</div>
                                    </div>
                                </div>
                                <div className="row justify-content-end mb-2">
                                    <div className="col-6 col-md" style={styles.cBlue}>
                                        <div>Deposit</div>
                                    </div>
                                    <div className="col-6 px-0">
                                        <div>{formatter.format(cash_deposit || 0)}</div>
                                    </div>
                                </div>
                                <div className="row justify-content-end mb-2">
                                    <div className="col-6 col-md" style={styles.cBlue}>
                                        <div>Deposit Return</div>
                                    </div>
                                    <div className="col-6 px-0">
                                        <div>{formatter.format(cash_deposit_return!=0?-cash_deposit_return:cash_deposit_return || 0)}</div>
                                    </div>
                                </div>
                                <div className="row justify-content-end mb-2">
                                    <div className="col-6 col-md" style={styles.cBlue}>
                                        <div style={styles.cBlue2} className="pl-2">Kas Masuk</div>
                                    </div>
                                    <div className="col-6 px-0">
                                        <div style={styles.cBlue2}>{formatter.format(session.total_kas_masuk || 0)}</div>
                                    </div>
                                </div>
                                <div className="row justify-content-end mb-2">
                                    <div className="col-6 col-md" style={styles.cBlue}>
                                        <div style={styles.cGreen} className="pl-2">Kas Keluar</div>
                                    </div>
                                    <div className="col-6 px-0">
                                        <div style={styles.cGreen}>{formatter.format(session.total_kas_keluar || 0)}</div>
                                    </div>
                                </div>
                                <div className="row mb-2" style={styles.border}/>
                                <div className="row justify-content-end mb-2">
                                    <div className="col-6 col-md" style={styles.cBlue}>
                                        <div>Balance</div>
                                    </div>
                                    <div className="col-6 px-0">
                                        {/*<div>{formatter.format(session.current_balance)}</div>*/}
                                        <div>{formatter.format(balance || 0)}</div>
                                    </div>
                                </div>
                                <div className="row justify-content-end mb-2">
                                    <div className="col-6 col-md" style={styles.cBlue}>
                                        <div>Setor</div>
                                    </div>
                                    <div className="col-6 px-0">
                                        {/*<div>{formatter.format(session.difference || 0)}</div>*/}
                                        <div>{formatter.format(setor<0?0:setor || 0)}</div>
                                    </div>
                                </div>
                                <div className="row mb-2" style={styles.border}/>
                                <div className="row justify-content-end mb-2">
                                    <div className="col-6 col-md" style={styles.cBlue}>
                                        <div>Closing Balance</div>
                                    </div>
                                    <div className="col-6 px-0">
                                        <div>{formatter.format(setor<0?session.closing_balance+setor:session.closing_balance)}</div>
                                    </div>
                                </div>
                                {/*<div className="row mb-2" style={styles.border}/>
                                <div className="row justify-content-end mb-2">
                                    <div className="col-6 col-md" style={styles.cBlue}>
                                        <div>Closing Acuan</div>
                                    </div>
                                    <div className="col-4 px-0">
                                        <div>{formatter.format(session.closing_balance)}</div>
                                    </div>
                                    <div className="col-2 px-0 text-right">
                                        {editClosing}
                                    </div>
                                </div>*/}
                            </div>
                            <div className="col-4 pl-5">
                                {nonCashPayment}
                                <div className="py-2 px-4" style={styles.noCashPayment}>
                                    <div className="row justify-content-between mb-2" style={styles.border2}>
                                        <div className="col-6">
                                            <p className="fs14 fw600 mb-2" style={styles.cBlack}>Total Omset</p>
                                        </div>
                                        <div className="col-6 d-flex">
                                            <p className="fs14 fw600 ml-auto my-auto" style={styles.cBlack}>{formatter.format(total_omset || 0)}</p>
                                        </div>
                                    </div>
                                    <div className="row mb-2 mx-0" style={styles.fs11}>
                                        <div className="col-6 px-1" style={styles.cBlack}>
                                            <div>Dibayar</div>
                                        </div>
                                        <div className="col-6 text-right px-1">
                                            <div>{formatter.format(all_transaction || 0)}</div>
                                        </div>
                                    </div>
                                    <div className="row mb-2 mx-0" style={styles.fs11}>
                                        <div className="col-6 px-1" style={styles.cBlack}>
                                            <div>Deposit</div>
                                        </div>
                                        <div className="col-6 text-right px-1">
                                            <div>{formatter.format(all_deposit || 0)}</div>
                                        </div>
                                    </div>
                                    <div className="row mb-2 mx-0" style={styles.fs11}>
                                        <div className="col-6 px-1" style={styles.cBlack}>
                                            <div>Piutang</div>
                                        </div>
                                        <div className="col-6 text-right px-1">
                                            <div>{formatter.format(all_debt || 0)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
        } else {
            chevron = <i className="fa fa-chevron-down fa-lg"></i>
        }
        
        var cashpopup
        if(this.state.show_cash_popup == "in"){
            cashpopup = <CashPopupForm write={this.props.write} data={session} journal={this.props.journal} type="in" cancelAction={() => this.toggleCashPopup()} submitAction={(data) => {this.setState({show_cash_popup: false}); this.props.kasMasukKeluar(data)}}/>
        } else if(this.state.show_cash_popup == "out"){
            cashpopup = <CashPopupForm write={this.props.write} data={session} journal={this.props.journal_out} type="out" cancelAction={() => this.toggleCashPopup()} submitAction={(data) => {this.setState({show_cash_popup: false}); this.props.kasMasukKeluar(data)}}/>
        }
        
        var openclosepopup
        if(this.state.show_open_close == "open"){
            openclosepopup = <OpenClosePopupForm data={session} nominal={session.opening_balance} type="open" cancelAction={() => this.toggleOpenClosePopup()} submitAction={(nominal) => {this.setState({show_open_close: false}); this.props.updateOpeningClosing('open', nominal)}}/>
        } else if(this.state.show_open_close == "close"){
            openclosepopup = <OpenClosePopupForm data={session} nominal={session.closing_balance} type="close" cancelAction={() => this.toggleOpenClosePopup()} submitAction={(nominal) => {this.setState({show_open_close: false}); this.props.updateOpeningClosing('close', nominal)}}/>
        }
        
        var closeConfirmation
        if (this.state.showCloseConfirmation) {
            closeConfirmation = <CloseConfirmation data={session} journal={this.props.journal} setor={setor} updateStatus={(data) => {this.setState({showCloseConfirmation: false}); this.props.updateStatus(data)}} toggleCloseConfirmation={this.toggleCloseConfirmation} />
        }
        
        return(
            <div className="row mx-0">
        		<div className="col-auto pl-2 pr-3">
        			<input type="checkbox" className="d-block my-3" checked={checked} onChange={this.props.checkRow}/>
        		</div>
        		<div className="col row-list row-list-link" onClick={this.toggleDetail}>
        			<div className="row mx-0 fs12 fw600">
        			    <div className="col text-center">
        					<span className="my-auto">{session.name}</span>
        				</div>
        				<div className="col text-center">
        					<span className="my-auto">{moment(session.opening_session).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss")}</span>
        				</div>
        				<div className="col text-center">
        					<span className="my-auto">{session.closing_session ? moment(session.closing_session).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss") : ''}</span>
        				</div>
        				<div className="col text-center">
        					<span className="my-auto">{session.responsible_name}</span>
        				</div>
        				<div className="col text-center">
        					<span className="my-auto">{formatter.format(total_omset)}</span>
        				</div>
        				<div className="col text-center">
        					<span className="my-auto">{session.status}</span>
        				</div>
        				<div className="col-1 text-right">
        					{chevron}
        				</div>
        			</div>
        		</div>
        		{detail}
        		{cashpopup}
        		{openclosepopup}
        		{closeConfirmation}
        		<PDF data={this.props.session} id={"pdf"+session.name}/>
        	</div>
        )
    }
}

class CashPopupForm extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'list_kas': this.props.type == 'in' ? this.props.data.kas_masuk : this.props.data.kas_keluar,
            'amount': 0,
            'journal': '',
            'keterangan': '',
            'show_form': false
        }
    }
    
    formSubmit(e){
        e.preventDefault()
        
        var journal = this.props.journal.find(i => i['account_name'] == this.state.journal)
        
        this.props.submitAction({'jumlah': parseFloat(this.state.amount), 'keterangan': this.state.keterangan, 'type': this.props.type, 'journal': journal['name']})
    }
    
    changeInput(e){
        var target = e.target
        var name = target.name
        var value = target.value
        
        this.setState({[name]: value})
    }
    
    toggleShowForm() {
        this.setState({show_form: !this.state.show_form})
    }
    
    render(){
        var container_style = {marginTop: '50px', maxWidth: '945px'}
        var panel_style = {borderRadius: '10px', overflowY: 'auto', maxHeight: '600px'}
        var input_style = {background: '#CEEDFF'}
        var button1_style = {minWidth: '147px', border: '1px solid #056EAD', background: '#056EAD', color: '#FFF'}
        var button2_style = {minWidth: '147px', border: '1px solid #056EAD', color: '#056EAD'}
        var input_title = ''
        var kas_row = []
        var kas_list
        var pStyle = {color: '#056EAD'}
        
        if(this.props.type == "in"){
            input_title = 'Masuk'
        } else if(this.props.type == "out"){
            input_title = 'Keluar'
        }
        
        if (this.state.list_kas.length != 0) {
            this.state.list_kas.forEach(function(item, index) {
                kas_row.push(
                    <div className="row mx-0 mb-2 fs16" key={index.toString()}>
                        <div className="col">{moment(item.kas_date).format("HH:mm:ss DD/MM/YYYY")}</div>
                        <div className="col">{formatter.format(item.jumlah)}</div>
                        <div className="col-5">{item.keterangan}</div>
                    </div>
                )
            })
            
            kas_list = <div>
                            <div className="row mx-0 mb-3 fw600 fs16">
                                <div className="col">Tanggal</div>
                                <div className="col">{'Jumlah Kas ' + input_title}</div>
                                <div className="col-5">Keterangan</div>
                            </div>
                            {kas_row}
                        </div>
        } else {
            kas_list = <div className="text-center fs26 fw600" key='9999'>{'Belum Ada Kas ' + input_title}</div>
        }
        
        var tambahBtn
        if (this.props.data.status != 'Closed & Posted' && this.props.write) {
            tambahBtn = <div className="col-auto">
            	            <button type="button" className="btn fs18 fw600 py-2" style={button2_style} onClick={() => this.toggleShowForm()}>Tambah</button>
            	        </div>
        }
        
        
        var journalOptions = [<option className="d-none" key="99999"></option>]
        
        this.props.journal.forEach(function(item, index) {
            journalOptions.push(<option value={item.account_name} key={index.toString()}>{item.account_name}</option>)
        })
        
        if (this.state.show_form) {
            return(
                <div className='menu-popup pt-0 d-flex' onClick={this.props.cancelAction}>
                    <div className="container my-auto" style={container_style} onClick={event => event.stopPropagation()}>
                    	<form onSubmit={e => this.formSubmit(e)} className="p-5 bg-white" style={panel_style}>
                    	    <div className="row">
                    	        <div className="col-6 d-flex flex-column">
                    	            <div className="form-group text-center mb-auto">
                            	        <label htmlFor="amount" className="fs18 fw600">{'Jumlah Kas ' + input_title}</label>
                            	        <input className="form-control fs18 border-0" style={input_style} type="text" name="amount" id="amount" required autoComplete="off" onChange={e => this.changeInput(e)}/>
                            	    </div>
                            	    <div className="form-group text-center mt-auto">
                            	        <label htmlFor="code" className="fs18 fw600">Journal</label>
                            	        <select className="form-control fs18 border-0" style={input_style} name="journal" id="journal" required autoComplete="off" onChange={e => this.changeInput(e)}>
                            	            {journalOptions}
                            	        </select>
                            	    </div>
                    	        </div>
                    	        <div className="col-6">
                    	            <div className="form-group text-center">
                            	        <label htmlFor="note" className="fs18 fw600">Keterangan</label>
                            	        <textarea className="form-control fs18 border-0" style={input_style} name="keterangan" id="ketrangan" onChange={e => this.changeInput(e)} rows="4"/>
                            	    </div>
                    	        </div>
                    	    </div>
                    	    <div className="row justify-content-center mt-5">
                    	        <div className="col-auto">
                    	            <button type="submit" className="btn fs18 fw600 py-2" style={button1_style}>OK</button>
                    	        </div>
                    	        <div className="col-auto">
                    	            <button type="button" className="btn fs18 fw600 py-2" style={button2_style} onClick={() => this.toggleShowForm()}>Kembali</button>
                    	        </div>
                    	    </div>
                    	</form>
                    </div>
                    <div className="menu-popup-close"/>
                </div>
            )
        } else {
            return(
            <div className='menu-popup pt-0 d-flex' onClick={this.props.cancelAction}>
                <div className="container my-auto" style={container_style} onClick={event => event.stopPropagation()}>
                    <div className="p-5 bg-white" style={panel_style}>
                        {kas_list}
                	    <div className="row justify-content-center mt-5">
                	        <div className="col-auto">
                	            <button type="button" className="btn fs18 fw600 py-2" style={button1_style} onClick={this.props.cancelAction}>Tutup</button>
                	        </div>
                	        {tambahBtn}
                	    </div>
                    </div>
                </div>
                <div className="menu-popup-close"/>
            </div>
        )
        }
    }
}

class CloseConfirmation extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'journal': '',
            'closing_session': moment().format('YYYY-MM-DD'),
        }
    }
    
    formSubmit(e) {
        e.preventDefault()
        var new_data = Object.assign({}, this.props.data)
        new_data['status'] = 'Closed & Posted'
        new_data['close_journal'] = this.state.journal
        new_data['setor'] = this.props.setor
        new_data['closing_session'] = this.state.closing_session + ' 23:59:59'
        console.log(new_data)
        this.props.updateStatus(new_data)
    }
    
    changeInput(e){
        var target = e.target
        var name = target.name
        var value = target.value
        
        this.setState({[name]: value})
    }
    
    render(){
        var container_style = {marginTop: '50px', maxWidth: '32%'}
        var panel_style = {borderRadius: '10px'}
        var button1_style = {minWidth: '147px', border: '1px solid #056EAD', background: '#056EAD', color: '#FFF'}
        var button2_style = {minWidth: '147px', border: '1px solid #056EAD', color: '#056EAD'}
        var input_style = {background: '#CEEDFF'}
        
        var journalOptions = [<option className="d-none" key="99999"></option>]
        
        this.props.journal.forEach(function(item, index) {
            journalOptions.push(<option value={item.name} key={index.toString()}>{item.account_name}</option>)
        })
        
        return(
            <div className='menu-popup pt-0 d-flex' onClick={this.props.toggleCloseConfirmation}>
                <div className="container my-auto" style={container_style} onClick={event => event.stopPropagation()}>
                	<form onSubmit={(e) => this.formSubmit(e)} className="p-5 bg-white" style={panel_style}>
                	    <div className="text-center mb-5 fs30">
                	        Apakah anda yakin akan menutup session ini ?
                	    </div>
                	    <div className="row mt-5">
                	        <div className="col-12">
                	            <div className="form-group text-center mt-auto">
                        	        <label htmlFor="journal" className="fs18 fw600">Journal</label>
                        	        <select className="form-control fs18 border-0" style={input_style} name="journal" id="journal" required autoComplete="off" value={this.state.journal} onChange={e => this.changeInput(e)}>
                        	            {journalOptions}
                        	        </select>
                        	    </div>
                	        </div>
                	    </div>
                        <div className="row mt-5">
                	        <div className="col-12">
                	            <div className="form-group text-center mt-auto">
                                <input required type="date" id="closing_session" name='closing_session' className="form-control border-0 fs22 fw600 mb-4" onChange={e => this.changeInput(e)} defaultValue={this.state.closing_session || ''} style={input_style}/>
                        	    </div>
                	        </div>
                	    </div>
                	    <div className="row justify-content-center mt-5">
                	        <div className="col-auto">
                	            <button type="submit" className="btn fs18 fw600 py-2" style={button1_style}>Iya</button>
                	        </div>
                	        <div className="col-auto">
                	            <button type="button" className="btn fs18 fw600 py-2" style={button2_style} onClick={this.props.toggleCloseConfirmation}>Tidak</button>
                	        </div>
                	    </div>
                	</form>
                </div>
                <div className="menu-popup-close"/>
            </div>
        )
    }
}

class OpenClosePopupForm extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'nominal': this.props.nominal || 0,
        }
    }
    
    formSubmit(e){
        e.preventDefault()
        this.props.submitAction(this.state.nominal)
    }
    
    changeInput(e){
        var target = e.target
        var name = target.name
        var value = target.value
        
        this.setState({[name]: value})
    }
    
    render(){
        var container_style = {marginTop: '50px', maxWidth: '422px'}
        var panel_style = {borderRadius: '10px', overflowY: 'auto', maxHeight: '600px'}
        var input_style = {background: '#CEEDFF'}
        var button1_style = {border: '1px solid #056EAD', background: '#056EAD', color: '#FFF'}
        var button2_style = {border: '1px solid #056EAD', color: '#056EAD'}
        var input_title = ''
        
        if(this.props.type == "open"){
            input_title = 'Opening Balance'
        } else if(this.props.type == "close"){
            input_title = 'Closing Acuan'
        }
        return(
            <div className='menu-popup pt-0 d-flex' onClick={this.props.cancelAction}>
                <div className="container my-auto" style={container_style} onClick={event => event.stopPropagation()}>
                	<form onSubmit={e => this.formSubmit(e)} className="p-5 bg-white" style={panel_style}>
                	    <div className="row">
                	        <div className="col-12">
                	            <div className="form-group text-center mb-auto">
                        	        <label htmlFor="nominal" className="fs18 fw600">{'Ubah ' + input_title}</label>
                        	        <input className="form-control fs18 border-0" style={input_style} type="text" name="nominal" id="nominal" required autoComplete="off" value={this.state.nominal} onChange={e => this.changeInput(e)}/>
                        	    </div>
                	        </div>
                	    </div>
                	    <div className="row justify-content-center mt-5">
                	        <div className="col-6">
                	            <button type="submit" className="btn btn-block fs18 fw600 py-2" style={button1_style}>OK</button>
                	        </div>
                	        <div className="col-6">
                	            <button type="button" className="btn btn-block fs18 fw600 py-2" style={button2_style} onClick={this.props.cancelAction}>Kembali</button>
                	        </div>
                	    </div>
                	</form>
                </div>
                <div className="menu-popup-close"/>
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
        
        var non_cash_transaction = data.non_cash_payment.filter(item => !['Deposit Customer','Deposit Supplier','Cash'].includes(item.type)).reduce((total, p) => total += (p.value - (p.exchange+p.credit_mutation)), 0)
        var non_cash_deposit = data.non_cash_payment.filter(item => !['Deposit Customer','Deposit Supplier','Cash'].includes(item.type)).reduce((total, p) => total += p.credit_mutation, 0)
        var non_cash_deposit_return = data.non_cash_payment.filter(item => !['Deposit Customer','Deposit Supplier','Cash'].includes(item.type)).reduce((total, p) => total += p.credit_mutation_return, 0)
        var non_cash_debt = data.non_cash_payment.filter(item => !['Deposit Customer','Deposit Supplier','Cash'].includes(item.type)).reduce((total, p) => total += p.debt_mutation, 0)
        
        var deposit_transaction = data.non_cash_payment.filter(item => ['Deposit Customer','Deposit Supplier'].includes(item.type)).reduce((total, p) => total += p.value, 0)
        var deposit_debt = data.non_cash_payment.filter(item => ['Deposit Customer','Deposit Supplier'].includes(item.type)).reduce((total, p) => total += p.debt_mutation, 0)
        
        var cash_transaction = data.cash_payment.reduce((total, p) => total += (p.value - (p.exchange+p.credit_mutation)), 0)
        var cash_deposit = data.cash_payment.reduce((total, p) => total += p.credit_mutation, 0)
        var cash_deposit_return = data.cash_payment.reduce((total, p) => total += p.credit_mutation_return, 0)
        var cash_debt = data.cash_payment.reduce((total, p) => total += p.debt_mutation, 0)
        
        var sales_debt = data.sales_debt.reduce((total, p) => total += p.debt_mutation, 0)
        
        // var balance = (data.opening_balance+cash_transaction+cash_deposit+data.total_kas_masuk)-data.total_kas_keluar
        // var setor = (cash_transaction+cash_deposit+data.total_kas_masuk)-data.total_kas_keluar
        var balance = (data.opening_balance+cash_transaction+(cash_deposit+cash_deposit_return)+data.total_kas_masuk)-data.total_kas_keluar
        // var setor = (cash_transaction+cash_deposit+data.total_kas_masuk)
        var setor = balance-data.closing_balance
        
        var all_transaction = non_cash_transaction + cash_transaction
        var all_deposit = (non_cash_deposit+non_cash_deposit_return) + (cash_deposit+cash_deposit_return)
        !all_deposit||all_deposit<0?all_deposit=0:false
        var all_debt = sales_debt + (cash_debt+non_cash_debt+deposit_debt)
        !all_debt||all_debt<0?all_debt=0:false
        
        var total_omset = all_transaction + all_deposit + all_debt
        // var total_omset = all_transaction + deposit_transaction + all_debt
        
        var page_dimension = {width: 559, minHeight: 794, top:0, right: 0, background: '#FFF', color: '#000', zIndex: -1}
        var borderStyle = {border: '1px solid #000', margin: '15px 0'}
        var row1 = {marginBottom: 12}
        var row2 = {margin: '0 -14px'}
        var th = {border: '1px solid #000'}
        var td = {borderLeft: '1px solid #000', borderRight: '1px solid #000'}
        var fs13 = {fontSize: 13}
        var fs9 = {fontSize: 9}
        var invoice = {letterSpacing: 0, lineHeight: '24px', marginBottom: 0, marginTop: 18}
        var invoice2 = {letterSpacing: 0}
        var thead = {background: '#d9d9d9', fontSize: 11}
        
        var nonCashPayment
        if (data.non_cash_payment && data.non_cash_payment.filter(item => !['Deposit Customer','Deposit Supplier','Cash'].includes(item.type)).length > 0) {
            var nonCashRow = []
            
            data.non_cash_payment.filter(item => !['Deposit Customer','Deposit Supplier','Cash'].includes(item.type)).forEach(function(item, index) {
                var transaction = item.value - (item.exchange+item.credit_mutation)
                var credit_mutation = item.credit_mutation
                var credit_mutation_return = item.credit_mutation_return

                nonCashRow.push(
                    <div className="row" style={fs9} key={index.toString()}>
    			        <div className="col py-1">{item.method_name || item.type}</div>
    			        <div className="col text-right py-1">{formatter.format(transaction)}</div>
    			        <div className="col text-right py-1">{formatter.format(credit_mutation)}</div>
    			        <div className="col text-right py-1">{formatter.format(credit_mutation_return!=0?-credit_mutation_return:credit_mutation_return)}</div>
    			        <div className="col text-right py-1">{formatter.format(item.value+credit_mutation_return)}</div>
    			    </div>
                )
            })
            nonCashPayment = (
                <div>
                    <div className="row">
    			        <div className="col-12 text-uppercase fw700 py-2" style={thead}>
    			            <div className="row">
    			                <div className="col-6">
    			                    Pembayaran Non Cash
    			                </div>
    			                <div className="col-6 text-right">
    			                    {formatter.format(data.non_cash_payment.filter(item => !['Deposit Customer','Deposit Supplier','Cash'].includes(item.type)).reduce((total, p) => total += p.value, 0) || 0)}
    			                </div>
    			            </div>
    			        </div>
    			    </div>
    			    <div className="row" style={fs9}>
    			        <div className="col py-1"/>
    			        <div className="col text-right py-1">
    			            Transaksi
    			        </div>
    			        <div className="col text-right py-1">
    			            Deposit
    			        </div>
    			        <div className="col text-right py-1">
    			            Deposit Return
    			        </div>
    			        <div className="col text-right py-1">
    			            Total
    			        </div>
    			    </div>
    			    {nonCashRow}
                </div>
            )
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
                    <div id={this.props.id} className="px-4" style={page_dimension}>
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
                                <p className="fwbold text-right text-uppercase fs28" style={invoice}>Sessions</p>
                                <p className="fw600 text-right text-uppercase fs14" style={invoice2}>{data.name}</p>
                            </div>
                            <div className="col-12" style={borderStyle}/>
                        </div>
                        <div className="row mx-0" style={row1}>
                            <div className="col-6 px-0">
                                <p className="mb-0 fs10">{moment(data.opening_session).format('DD-MM-YYYY HH:mm:ss')}</p>
                                <p className="mb-0 fs10">{data.closing_session?moment(data.closing_session).format('DD-MM-YYYY HH:mm:ss'):'-'}</p>
                            </div>
                            <div className="col-6 text-right px-0">
                                <p className="mb-0 fs10">{formatter.format(total_omset)}</p>
                                <p className="mb-0 fs10">{data.responsible_name}</p>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-12 text-uppercase text-center fw700 py-2" style={thead}>Laporan Kas</div>
                        </div>
                        <div className="row" style={fs9}>
                            <div className="col-6 text-left py-1">
                                Opening Balance
                            </div>
                            <div className="col-6 text-right py-1">
                                {formatter.format(data.opening_balance || 0)}
                            </div>
                        </div>
                        <div className="row" style={fs9}>
                            <div className="col-6 text-left py-1">
                                Transaction
                            </div>
                            <div className="col-6 text-right py-1">
                                {formatter.format(cash_transaction || 0)}
                            </div>
                        </div>
                        <div className="row" style={fs9}>
                            <div className="col-6 text-left py-1">
                                Deposit
                            </div>
                            <div className="col-6 text-right py-1">
                                {formatter.format(cash_deposit || 0)}
                            </div>
                        </div>
                        <div className="row" style={fs9}>
                            <div className="col-6 text-left py-1">
                                Deposit Return
                            </div>
                            <div className="col-6 text-right py-1">
                                {formatter.format(cash_deposit_return!=0?-cash_deposit_return:cash_deposit_return || 0)}
                            </div>
                        </div>
                        <div className="row" style={fs9}>
                            <div className="col-6 text-left py-1">
                                <span className="pl-2">Kas Masuk</span>
                            </div>
                            <div className="col-6 text-right py-1">
                                {formatter.format(data.total_kas_masuk || 0)}
                            </div>
                        </div>
                        <div className="row" style={fs9}>
                            <div className="col-6 text-left py-1">
                                <span className="pl-2">Kas Keluar</span>
                            </div>
                            <div className="col-6 text-right py-1">
                                {formatter.format(data.total_kas_keluar || 0)}
                            </div>
                        </div>
                        <div className="row" style={fs9}>
                            <div className="col-6 text-left py-1">
                                Balance
                            </div>
                            <div className="col-6 text-right py-1">
                                {formatter.format(balance || 0)}
                            </div>
                        </div>
                        <div className="row" style={fs9}>
                            <div className="col-6 text-left py-1">
                                Setor
                            </div>
                            <div className="col-6 text-right py-1">
                                {formatter.format(setor<0?0:setor || 0)}
                            </div>
                        </div>
                        <div className="row" style={fs9}>
                            <div className="col-6 text-left py-1">
                                Closing Balance
                            </div>
                            <div className="col-6 text-right py-1">
                                {formatter.format(setor<0?data.closing_balance+setor:data.closing_balance)}
                            </div>
                        </div>
                        {nonCashPayment}
                        <div className="row">
                            <div className="col-12 text-uppercase fw700 py-2" style={thead}>
                                <div className="row">
                                    <div className="col-6">
                                        Total Omset
                                    </div>
                                    <div className="col-6 text-right">
                                        {formatter.format(total_omset || 0)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row" style={fs9}>
                            <div className="col-6 text-left py-1">
                                Dibayar
                            </div>
                            <div className="col-6 text-right py-1">
                                {formatter.format(all_transaction || 0)}
                            </div>
                        </div>
                        <div className="row" style={fs9}>
                            <div className="col-6 text-left py-1">
                                Deposit
                            </div>
                            <div className="col-6 text-right py-1">
                                {formatter.format(all_deposit || 0)}
                            </div>
                        </div>
                        <div className="row" style={fs9}>
                            <div className="col-6 text-left py-1">
                                Piutang
                            </div>
                            <div className="col-6 text-right py-1">
                                {formatter.format(all_debt || 0)}
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

ReactDOM.render(<PosSessions />, document.getElementById('pos_sessions_list'))