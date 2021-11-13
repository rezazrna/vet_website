var petOwner = getUrlParameter('petOwner')
var pet = getUrlParameter('pet')

var tzOffset = new Date().getTimezoneOffset()

class Spending extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            invoice_data: [],
            order_data: [],
            loadad: false,
            invoice_currentpage: 1,
            order_currentpage: 1,
            mode: 'invoice',
        }
        this.invoicePaginationClick = this.invoicePaginationClick.bind(this)
        this.orderPaginationClick = this.orderPaginationClick.bind(this)
        this.toggleMode = this.toggleMode.bind(this)
        this.dataSearch = this.dataSearch.bind(this)
    }
    
    componentDidMount() {
        var po = this
        var name, name_type
        
        if(petOwner){
            name = petOwner
            name_type = 'pet_owner'
        } else if (pet){
            name = pet
            name_type = 'pet'
        }
        
        frappe.call({
            type: "GET",
            method:"vet_website.methods.get_spending",
            args: {name: name, name_type: name_type},
            callback: function(r){
                if (r.message) {
                    po.setState({'invoice_data': r.message.customer_invoice, 'order_data': r.message.pos_order, 'loaded': true});
                }
            }
        });
    }
    
    dataSearch(filters) {
        var th = this
        var mode = this.state.mode
        var new_filters = Object.assign({}, filters)
        filters.filters?new_filters.filters = filters.filters.slice():new_filters.filters=[]
        
        if (petOwner) {
            new_filters.filters.push(['pet_owner', '=', petOwner])
        } else if (pet) {
            new_filters.filters.push(['pet', '=', pet])
        }
        
        frappe.call({
            type: "GET",
            method:"vet_website.methods.get_spending_separate",
            args: {mode: mode, filters: filters},
            callback: function(r){
                if (r.message) {
                    console.log(r.message)
                    mode=='invoice'?
                    th.setState({invoice_data: r.message, 'loaded': true}):
                    mode=='order'?
                    th.setState({order_data: r.message, 'loaded': true}):
                    false
                }
            }
        });
    }
    
    invoicePaginationClick(number) {
        this.setState({
          invoice_currentpage: Number(number)
        });
    }
    
    orderPaginationClick(number) {
        this.setState({
          order_currentpage: Number(number)
        });
    }
    
    toggleMode(mode){
        this.setState({mode: mode})
    }
    
    render() {
        var sorts = [
            {label: 'ID DESC', value: 'name desc'},
            {label: 'ID ASC', value: 'name asc'},
            {label: 'Tanggal DESC', value: 'date desc'},
            {label: 'Tanggal DESC', value: 'date asc'},
            {label: 'Nama Pemilik DESC', value: 'owner_name desc'},
            {label: 'Nama Pemilik ASC', value: 'owner_name asc'},
            {label: 'Nama Pasien DESC', value: 'pet_name desc'},
            {label: 'Nama Pasien ASC', value: 'pet_name asc'},
            {label: 'Total DESC', value: 'total desc'},
            {label: 'Total ASC', value: 'total asc'},
        ]
        
        var field_list = [
            {'label': 'ID', 'field': 'name', 'type': 'char'},
            {'label': 'Tanggal', 'field': 'date', 'type': 'date'},
            {'label': 'Nama Pemilik', 'field': 'owner_name', 'type': 'char'},
            {'label': 'Nama Pasien', 'field': 'pet_name', 'type': 'char'},
            {'label': 'Total', 'field': 'total', 'type': 'int'},
        ]
        
		var row_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px'}
		var color = {color: '#056EAD', cursor: 'pointer'}
		
		if (this.state.loaded){
		    return(
                <div>
                    <div className="row mx-0" style={row_style}>
                        <div className="col-auto my-auto">
                            <span className="fs16 fw600 mr-4 my-auto" style={color} onClick={() => {history.back()}}><i className="fa fa-chevron-left mr-1" style={color}></i>Back</span>
                        </div>
                        <div className={this.state.mode=='invoice'?'col':'col d-none'}>
                            <Filter sorts={sorts} searchAction={this.dataSearch} field_list={field_list}/>
                        </div>
                        <div className={this.state.mode=='order'?'col':'col d-none'}>
                            <Filter sorts={sorts} searchAction={this.dataSearch} field_list={field_list}/>
                        </div>
                    </div>
                    <SpendingList mode={this.state.mode} toggleMode={this.toggleMode} invoice_data={this.state.invoice_data} invoicePaginationClick={this.invoicePaginationClick} invoice_currentpage={this.state.invoice_currentpage} order_data={this.state.order_data} orderPaginationClick={this.orderPaginationClick} order_currentpage={this.state.order_currentpage}/>
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

class SpendingList extends React.Component {
    render() {
        var invoice_rows = []
        var order_rows = []
        var panel_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px'}
        var invoice_data = this.props.invoice_data
        var order_data = this.props.order_data
        var th = this
        var invoice_panel, order_panel
        
        if (invoice_data.length != 0){
            const invoiceIndexOfLastTodo = this.props.invoice_currentpage * 30;
            const invoiceIndexOfFirstTodo = invoiceIndexOfLastTodo - 30;
            const invoiceCurrentItems = invoice_data.slice(invoiceIndexOfFirstTodo, invoiceIndexOfLastTodo)
            
            invoiceCurrentItems.forEach(function(item, index){
                invoice_rows.push(
                    <SpendingListRow key={index.toString()} item={item} type='invoice'/>
                )
            })
            
            invoice_panel = (
                <div style={panel_style}>
                    <div className="row mx-0">
                        <div className="col row-header">
    			            <div className="row mx-0 fs12 fw600">
                				<div className="col d-flex">
                					<span className="my-auto">ID</span>
                				</div>
                				<div className="col d-flex">
                					<span className="my-auto">Tanggal</span>
                				</div>
                				<div className="col d-flex">
                					<span className="my-auto">Nama Pemilik</span>
                				</div>
                				<div className="col d-flex">
                					<span className="my-auto">Nama Pasien</span>
                				</div>
                				<div className="col d-flex">
                					<span className="my-auto">Total</span>
                				</div>
            			    </div>
            		    </div>
                    </div>
        		    {invoice_rows}
        		    <Pagination paginationClick={this.props.invoicePaginationClick} datalength={invoice_data.length} currentpage={this.props.invoice_currentpage} itemperpage='30'/>
        	    </div>
            )
        } else {
            invoice_panel = (
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
        
        
        if (order_data.length != 0){
            const orderIndexOfLastTodo = this.props.order_currentpage * 30;
            const orderIndexOfFirstTodo = orderIndexOfLastTodo - 30;
            const orderCurrentItems = order_data.slice(orderIndexOfFirstTodo, orderIndexOfLastTodo)
            
            orderCurrentItems.forEach(function(item, index){
                order_rows.push(
                    <SpendingListRow key={index.toString()} item={item} type='order'/>
                )
            })
            
            order_panel = (
                <div style={panel_style}>
                    <div className="row mx-0">
                        <div className="col row-header">
    			            <div className="row mx-0 fs12 fw600">
                				<div className="col d-flex">
                					<span className="my-auto">ID</span>
                				</div>
                				<div className="col d-flex">
                					<span className="my-auto">Tanggal</span>
                				</div>
                				<div className="col d-flex">
                					<span className="my-auto">Nama Pemilik</span>
                				</div>
                				<div className="col d-flex">
                					<span className="my-auto">Nama Pasien</span>
                				</div>
                				<div className="col d-flex">
                					<span className="my-auto">Total</span>
                				</div>
            			    </div>
            		    </div>
                    </div>
        		    {order_rows}
        		    <Pagination paginationClick={this.props.orderPaginationClick} datalength={order_data.length} currentpage={this.props.order_currentpage} itemperpage='30'/>
        	    </div>
            )
            
        }  else {
            order_panel = (
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
        
        return(
            <div>
                <ul className="nav nav-tabs nav-fill justify-content-around bg-white pt-2 px-2" id="spendingTab" role="tablist">
				    <li className="nav-item">
        				<a className="nav-link py-1 active px-0" id="invoice-tab" data-toggle="tab" href="#invoice" role="tab" onClick={() => this.props.toggleMode('invoice')}><span>Invoice</span></a>
        			</li>
        			<li className="nav-item">
        				<a className="nav-link py-1 px-0" id="order-tab" data-toggle="tab" href="#order" role="tab" onClick={() => this.props.toggleMode('order')}><span>Order</span></a>
        			</li>
        		</ul>
                {this.props.mode=='invoice'?invoice_panel:this.props.mode=='order'?order_panel:false}
            </div>
        )
    }
}

class SpendingListRow extends React.Component {
    render() {
        var item = this.props.item
        var type = this.props.type
        var style
        var cursor = {cursor: 'pointer'}
        
        var date
        type=='invoice'?date=item.invoice_date:type=='order'?date=item.order_date:false
            
        return(
            <div className="row mx-0">
                <div className="col row-list">
        			<div className="row mx-0 fs12 fw600">
        				<div className="col d-flex">
        					<span className="my-auto">{item.name}</span>
        				</div>
        				<div className="col d-flex">
        					<span className="my-auto">{moment(date).subtract(tzOffset, 'minute').format('YYYY-MM-DD HH:mm:ss')}</span>
        				</div>
        				<div className="col d-flex">
        					<span className="my-auto">{item.owner_name}</span>
        				</div>
        				<div className="col d-flex">
        					<span className="my-auto">{item.pet_name}</span>
        				</div>
        				<div className="col d-flex">
        					<span className="my-auto">{formatter.format(item.total)}</span>
        				</div>
        			</div>
        		</div>
            </div>
        )
    }
}

var spending_list = document.getElementById('spending_list')
spending_list?ReactDOM.render(<Spending/>, spending_list):false