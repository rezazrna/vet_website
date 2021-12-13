var session = getUrlParameter('session')
// var tzOffset = new Date().getTimezoneOffset()
var tzOffset = 0

class OrderPayment extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            data: [],
            loaded: false,
            currentpage: 1,
            datalength: 0
        }
        this.paginationClick = this.paginationClick.bind(this);
        this.searchAction = this.searchAction.bind(this)
    }
    
    componentDidMount() {
        var th = this
        var filters
        
        console.log(document.referrer)
        // console.log(document.referrer.includes('/main/penerimaan/penerimaan-pasien/detail'))
       
        if (sessionStorage.getItem(window.location.pathname) != null && document.referrer.includes('/main/kasir/pos-order/form')) {
            filters = JSON.parse(sessionStorage.getItem(window.location.pathname))
        } else {
            filters = {filters: [], sorts: []}
        }
        
        if (filters.hasOwnProperty("currentpage")) {
            this.setState({'currentpage': filters['currentpage']})
        }
        
        if (session) {
            filters.filters = [['session', '=', session]]
        }
        
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetposorderpayment.vetposorderpayment.get_order_payment_list",
            args: {filters: filters},
            callback: function(r){
                if (r.message) {
                    if (r.message.error){
                        frappe.msgprint(r.message.error)
                    } else {
                        th.setState({'data': r.message.data,'loaded': true, 'datalength': r.message.datalength});
                    }
                }
            }
        });
        
        // this.searchAction(filters)
    }
    
    searchAction(filters) {
        var th = this
        var new_filter = Object.assign({}, filters)
        filters.filters?new_filter.filters = filters.filters.slice():new_filter.filters=[]
        if (session) {
            new_filter.filters.push(['session', '=', session])
        }
        
        this.setState({
          currentpage: 1,
          loaded: false,
        });
        
        new_filter['currentpage'] = 1;
        
        sessionStorage.setItem(window.location.pathname, JSON.stringify(new_filter))
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetposorderpayment.vetposorderpayment.get_order_payment_list",
            args: {filters: new_filter},
            callback: function(r){
                if (r.message) {
                    if (r.message.error){
                        frappe.msgprint(r.message.error)
                    } else {
                        th.setState({'data': r.message.data,'loaded': true, 'datalength': r.message.datalength});
                    }
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
                    method:"vet_website.vet_website.doctype.vetposorderpayment.vetposorderpayment.get_order_payment_list",
                    args: {filters: filters},
                    callback: function(r){
                        if (r.message) {
                            if (r.message.error){
                                frappe.msgprint(r.message.error)
                            } else {
                                po.setState({'data': r.message.data,'loaded': true, 'datalength': r.message.datalength});
                            }
                        }
                    }
                });
            // }
    }
    
    render() {
		var row_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px'}
		
		var sorts = [
    					{'label': 'Tanggal DESC', 'value': 'order_date desc'},
    					{'label': 'Tanggal ASC', 'value': 'order_date asc'},
					]
		
		var field_list = [
                        {'label': 'Tanggal', 'field': 'order_date', 'type': 'date'},
                        {'label': 'Nama Pemilik', 'field': 'owner_name', 'type': 'char'},
                        {'label': 'No Invoice', 'field': 'parent', 'type': 'char'},
                        {'label': 'Nominal', 'field': 'value', 'type': 'int'},
                        {'label': 'Metode Pembayaran', 'field': 'method_type', 'type': 'char'},
                    ]
        
        if (this.state.loaded){
            return(
                <div>
                    <div className="row mx-0" style={row_style}>
                        <div className="col-4"/>
                        <div className="col-8">
                            <Filter sorts={sorts} searchAction={this.searchAction} field_list={field_list} filters={JSON.parse(sessionStorage.getItem(window.location.pathname))}/>
                        </div>
                    </div>
                    <OrderPaymentList data={this.state.data} paginationClick={this.paginationClick} currentpage={this.state.currentpage} datalength={this.state.datalength}/>
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

class OrderPaymentList extends React.Component {
    render() {
        var item_rows = []
        var panel_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px'}
        var data = this.props.data
        var th = this
        
        if (data.length != 0){
            var th = this
            // const indexOfLastTodo = this.props.currentpage * 30;
            // const indexOfFirstTodo = indexOfLastTodo - 30;
            // const currentItems = data.slice(indexOfFirstTodo, indexOfLastTodo)
            
            data.forEach(function(item, index){
                // if (currentItems.includes(item)){
                    item_rows.push(
                        <OrderPaymentListRow key={index.toString()} item={item} />
                    )
                // }
            })
            
            return(
                    <div style={panel_style}>
                        <div className="row mx-0">
                            <div className="col row-header">
        			            <div className="row mx-0 fs12 fw600">
                    				<div className="col d-flex">
                    					<span className="my-auto">Tanggal</span>
                    				</div>
                    				<div className="col d-flex">
                    					<span className="my-auto">Nama Pemilik</span>
                    				</div>
                    				<div className="col d-flex">
                    					<span className="my-auto">No Invoice</span>
                    				</div>
                    				<div className="col d-flex">
                    					<span className="my-auto">Nominal</span>
                    				</div>
                    				<div className="col d-flex">
                    					<span className="my-auto">Exchange</span>
                    				</div>
                    				<div className="col d-flex">
                    					<span className="my-auto">Metode Pembayaran</span>
                    				</div>
                			    </div>
                		    </div>
                        </div>
            		    {item_rows}
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

class OrderPaymentListRow extends React.Component {
    clickRow(e){
        e.stopPropagation()
        window.location.href = "/main/kasir/pos-order/form?n="+ this.props.item.parent
    }
    
    render() {
        var item = this.props.item
        var link_icon = {cursor: 'pointer', maxWidth: 14, maxHeight: 14}
        
         return(
            <div className="row mx-0">
                <div className="col row-list row-list-link" onClick={e => this.clickRow(e)}>
        			<div className="row mx-0 fs12 fw600">
        				<div className="col d-flex">
        					<span className="my-auto">{moment(item.order_date).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss")}</span>
        				</div>
        				<div className="col d-flex">
        					<span className="my-auto">{item.owner_name}</span>
        				</div>
        				<div className="col d-flex">
        					<span className="my-auto">Payment {item.parent}</span>
        				</div>
        				<div className="col d-flex">
        					<span className="my-auto">{formatter.format(item.value)}</span>
        				</div>
        				<div className="col d-flex">
        					<span className="my-auto">{formatter.format(item.exchange||0)}</span>
        				</div>
        				<div className="col d-flex">
        					<span className="my-auto">{item.method_type || ''}</span>
        				</div>
        			</div>
        		</div>
            </div>
        )
    }
}

var pos_order_payments = document.getElementById('pos_order_payments')
pos_order_payments?ReactDOM.render(<OrderPayment/>, pos_order_payments):false
