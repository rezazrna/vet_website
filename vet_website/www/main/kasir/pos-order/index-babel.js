var tzOffset = new Date().getTimezoneOffset()

class PosOrder extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': [],
            'loaded': false,
            'check_all': false,
            'show_delete': false,
            'currentpage': 1,
            'search': false,
            'datalength': 0,
        }
        
        this.orderSearch = this.orderSearch.bind(this);
        this.checkRow = this.checkRow.bind(this);
        this.deleteRow = this.deleteRow.bind(this);
        this.paginationClick = this.paginationClick.bind(this);
    }
    
    componentDidMount() {
        var po = this
        var filters
        
        console.log(document.referrer)
        // console.log(document.referrer.includes('/main/penerimaan/penerimaan-pasien/detail'))
       
        if (sessionStorage.getItem(window.location.pathname) != null && document.referrer.includes('/main/kasir/pos-order/form')) {
            filters = JSON.parse(sessionStorage.getItem(window.location.pathname))
        } else {
            filters = {filters: [], sorts: []}
        }
        
        if (document.location.href.includes('?')) {
         var url = document.location.href,
            params = url.split('?')[1].split('='),
            key = params[0],
            value = params[1]   
        }
        
        if (filters.hasOwnProperty("currentpage")) {
            this.setState({'currentpage': filters['currentpage']})
        }
        
        if (params) {
            filters = {[key]: value}
            sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))
            this.orderSearch(filters)
        } else {
            sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))
            frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetposorder.vetposorder.get_order_list",
                args: {filters: filters},
                callback: function(r){
                    if (r.message) {
                        console.log(r.message);
                        po.setState({'data': r.message.order, 'loaded': true, 'datalength': r.message.datalength});
                    }
                }
            });
        }
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
                method:"vet_website.vet_website.doctype.vetposorder.vetposorder.get_order_list",
                args: {filters: filters},
                callback: function(r){
                    if (r.message) {
                        console.log(r.message);
                        po.setState({'data': r.message.order, 'loaded': true, 'datalength': r.message.datalength});
                    }
                }
            });
        // }
    }
    
    orderSearch(filters) {
        var po = this
        console.log(filters)
        
        this.setState({
          currentpage: 1,
          loaded: false,
        });
        
        filters['currentpage'] = 1;
        sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))
        console.log(filters)
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetposorder.vetposorder.get_order_list",
            args: {filters: filters},
            callback: function(r){
                if (r.message) {
                    console.log(r.message);
                    po.setState({'data': r.message.order, loaded: true, 'datalength': r.message.datalength});
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
            type: "GET",
            method:"vet_website.vet_website.doctype.vetposorder.vetposorder.delete_pos_order",
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
    
    openPOS(){
        frappe.call({
            method: 'frappe.client.get_value',
            args: {
                'doctype': 'VetPosSessions',
                'filters': {'status': 'In Progress'},
                'fieldname': ['name']
            },
            callback: function(r) {
                console.log(r)
                if (!r.exc) {
                    if (r.message.name) {
                        window.location.href = "/pos"
                    } else {
                        frappe.msgprint('POS Session belum dibuka')
                    }
                    // code snippet
                }
            }
        });
        // !['False',false].includes(this.props.show_open)
        // ? window.location.href = "/pos"
        // : frappe.msgprint('POS Session belum dibuka')
    }
    
    render() {
        var metode_options = []
        this.state.data.forEach(d => {
            d.metode_pembayaran.split(', ').forEach(o => {
                !metode_options.map(j => j.value).includes(o) && o != ''?metode_options.push({label: o, value: o}):false
            })
        })
        
        var sorts = [
        				{'label': 'Tanggal DESC', 'value': 'order_date desc'},
        				{'label': 'Tanggal ASC', 'value': 'order_date asc'},
        				{'label': 'ID DESC', 'value': 'name desc'},
        				{'label': 'ID ASC', 'value': 'name asc'},
        				{'label': 'Nama Pemilik DESC', 'value': 'owner_name desc'},
        				{'label': 'Nama Pemilik ASC', 'value': 'owner_name asc'},
        				{'label': 'Nama Pasien DESC', 'value': 'pet_name desc'},
        				{'label': 'Nama Pasien ASC', 'value': 'pet_name asc'},
        				{'label': 'Responsible DESC', 'value': 'responsible_name desc'},
        				{'label': 'Responsible ASC', 'value': 'responsible_name asc'},
        				{'label': 'Total DESC', 'value': 'total desc'},
        				{'label': 'Total ASC', 'value': 'total asc'},
					]
					
		var field_list = [
		                {'label': 'Tanggal', 'field': 'order_date', 'type': 'date'},
		                {'label': 'ID', 'field': 'name', 'type': 'char'},
		                {'label': 'Session', 'field': 'session', 'type': 'char'},
		                {'label': 'Nama Pemilik', 'field': 'owner_name', 'type': 'char'},
		                {'label': 'Nama Hewan', 'field': 'pet_name', 'type': 'char'},
		                {'label': 'Responsible', 'field': 'responsible_name', 'type': 'char'},
		                {'label': 'Metode Pembayaran', 'field': 'metode_pembayaran', 'type': 'select', 'options': metode_options},
		                {'label': 'Total', 'field': 'total', 'type': 'int'},
		            ]
					
		var row_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px'}
		var formStyle = {border: '1px solid #397DA6', color: '#397DA6'}
		var delete_button, backButton
		
		var btnOpenPos = {background: '#056EAD', color: '#FFFFFF'}
		var openPosButton = <button type="button" className="btn text-center fs12 fwbold mx-2" style={btnOpenPos} onClick={() => this.openPOS()}>Open POS</button>
		
		if (this.state.show_delete) {
		    delete_button = <button className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={this.deleteRow}>Hapus</button>
		}
		
		if (document.location.href.includes('?')) {
		    var color = {color: '#056EAD', cursor: 'pointer'}
		    backButton = <span className="fs16 fw600 mr-4" style={color} onClick={() => {history.back()}}><i className="fa fa-chevron-left mr-1" style={color}></i>Back</span>
		}
		
        if (this.state.loaded){
            return(
                <div>
                    <div className="row mx-0" style={row_style}>
                        <div className="col-auto my-auto">
                            {backButton}
                            {openPosButton}
                            {delete_button}
                        </div>
                        <div className="col">
                            <input className="form-control fs12" name="search" placeholder="Search..." style={formStyle} onChange={e => this.setState({search: e.target.value})}/>
                        </div>
                        <div className="col-7">
                            <Filter sorts={sorts} searchAction={this.orderSearch} field_list={field_list} filters={JSON.parse(sessionStorage.getItem(window.location.pathname))}/>
                        </div>
                    </div>
                    <PosOrderList order={this.state.data} search={this.state.search} checkRow={this.checkRow} checkAll={() => this.checkAll()} check_all={this.state.check_all} paginationClick={this.paginationClick} currentpage={this.state.currentpage} datalength={this.state.datalength}/>
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


class PosOrderList extends React.Component {
    render() {
        var search = this.props.search
        function filterRow(row){
            function filterField(field){
                return field?field.toString().includes(search):false
            }
            var fields = [moment(row.order_date || row.refund_date).format('YYYY-MM-DD HH:mm'), row.name, row.session, row.owner_name, row.pet_name, row.responsible_name, row.metode_pembayaran, row.total]
            return ![false,''].includes(search)?fields.some(filterField):true
        }
        
        var order_rows = []
        var panel_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px'}
        var order = this.props.order
        
        if (order.length != 0){
            var pol = this
            // const indexOfLastTodo = this.props.currentpage * 30;
            // const indexOfFirstTodo = indexOfLastTodo - 30;
            // var currentItems
            // ![false,''].includes(search)?
            // currentItems = order.filter(filterRow).slice(indexOfFirstTodo, indexOfLastTodo):
            // currentItems = order.slice(indexOfFirstTodo, indexOfLastTodo)
            order.forEach(function(item, index){
                // if (currentItems.includes(item)){
                    order_rows.push(
                        <PosOrderListRow key={index.toString()} item={item} checkRow={() => pol.props.checkRow(index)}/>
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
                					<span className="my-auto">Tanggal</span>
                				</div>
                				<div className="col text-center">
                					<span className="my-auto">ID</span>
                				</div>
                				<div className="col text-center">
                					<span className="my-auto">Session</span>
                				</div>
                				<div className="col text-center">
                					<span className="my-auto">Nama Pemilik</span>
                				</div>
                				<div className="col text-center">
                					<span className="my-auto">Nama Hewan</span>
                				</div>
                				<div className="col text-center">
                					<span className="my-auto">Responsible</span>
                				</div>
                				<div className="col text-center">
                					<span className="my-auto">Metode Pembayaran</span>
                				</div>
                				<div className="col text-center">
                					<span className="my-auto">Total</span>
                				</div>
                			</div>
                		</div>
                	</div>
                	{order_rows}
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

class PosOrderListRow extends React.Component {
    clickRow(e) {
        e.preventDefault()
        var pathname = "/main/kasir/pos-order/form?n="+this.props.item.name
        window.location = pathname
    }
    
    render() {
        var checked = false
        var item = this.props.item
        
        if (item.checked) {
            checked = true
        }
        
        return(
            <div className="row mx-0">
        		<div className="col-auto pl-2 pr-3">
        			<input type="checkbox" className="d-block my-3" checked={checked} onChange={this.props.checkRow}/>
        		</div>
        		<div className="col row-list row-list-link" onClick={(e) => this.clickRow(e)}>
        			<div className="row mx-0 fs12 fw600">
        			    <div className="col text-center">
        					<span className="my-auto">{moment(item.order_date || item.refund_date).subtract(tzOffset, 'minute').format('YYYY-MM-DD HH:mm')}</span>
        				</div>
        			    <div className="col text-center">
        					<span className="my-auto">{item.name}</span>
        				</div>
        			    <div className="col text-center">
        					<span className="my-auto">{item.session}</span>
        				</div>
        				<div className="col text-center">
        					<span className="my-auto">{item.owner_name}</span>
        				</div>
        				<div className="col text-center">
        					<span className="my-auto">{item.pet_name}</span>
        				</div>
        				<div className="col text-center">
        					<span className="my-auto">{item.responsible_name}</span>
        				</div>
        				<div className="col text-center">
        					<span className="my-auto">{item.metode_pembayaran}</span>
        				</div>
        				<div className="col text-center">
        					<span className="my-auto">{formatter2.format(item.total)}</span>
        				</div>
        			</div>
        		</div>
        	</div>
        )
    }
}

var elem = document.getElementById('pos_order_list')
elem
? ReactDOM.render(<PosOrder show_open={elem.dataset.show_open||false}/>, elem)
: false