class Operation extends React.Component {
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
        this.checkRow = this.checkRow.bind(this);
        this.deleteRow = this.deleteRow.bind(this);
        this.paginationClick = this.paginationClick.bind(this);
        this.operationSearch = this.operationSearch.bind(this);
    }
    
    componentDidMount() {
        var po = this
        var filters = {filters: [], sorts: []}

        if (sessionStorage.getItem(window.location.pathname) != null && document.referrer.includes('/main/inventory/operation/edit')) {
            filters = JSON.parse(sessionStorage.getItem(window.location.pathname))
        }

        filters.filters.push(['is_usage', '=', this.props.is_usage?'1':'0'])

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
            this.operationSearch(filters)
        } else {
            var td = this
            sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))
            frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetoperation.vetoperation.get_operation_list",
                args: {filters: filters},
                callback: function(r){
                    if (r.message) {
                        td.setState({'data': r.message.operation, 'loaded': true, 'datalength': r.message.datalength});
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

        // if (number * 30 > this.state.data.length) {
            frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetoperation.vetoperation.get_operation_list",
                args: {filters: filters},
                callback: function(r){
                    if (r.message) {
                        po.setState({'data': r.message.operation, 'loaded': true, 'datalength': r.message.datalength});
                    }
                }
            });
        // }
    }
    
    operationSearch(filters) {
        var td = this
        
        var new_filters = Object.assign({}, filters)
        filters.filters?new_filters.filters = filters.filters.slice():new_filters.filters=[]
        // if (this.props.usage){
        //     new_filters.filters.push(['is_usage', '=', '1'])
        // } else {
        //     new_filters.filters.push(['is_usage', '=', '0'])
        // }

        this.setState({
            currentpage: 1,
            loaded: false,
        });
        
        new_filters['currentpage'] = 1;

        sessionStorage.setItem(window.location.pathname, JSON.stringify(new_filters))

        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetoperation.vetoperation.get_operation_list",
            args: {filters: new_filters},
            callback: function(r){
                if (r.message) {
                    td.setState({'data': r.message.operation, 'loaded': true, 'datalength': r.message.datalength});
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
            method:"vet_website.vet_website.doctype.vetoperation.vetoperation.delete_operation",
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
    
    render() {
        
        var sorts = [
    					{'label': 'Reference DESC', 'value': 'reference desc'},
    					{'label': 'Reference ASC', 'value': 'reference asc'},
    					{'label': 'Date DESC', 'value': 'creation desc'},
    					{'label': 'Date ASC', 'value': 'creation asc'},
					]
					
		var field_list = [
		                {'label': 'Number', 'field': 'name', 'type': 'char'},
		                {'label': 'Reference', 'field': 'reference', 'type': 'char'},
		                {'label': 'From Gudang', 'field': 'from_name', 'type': 'char'},
		                {'label': 'To Gudang', 'field': 'to_name', 'type': 'char'},
		                {'label': 'Date', 'field': 'date', 'type': 'date'},
		                {'label': 'Status', 'field': 'status', 'type': 'char'},
		            ]
		
		var row_style2 = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px', 'height': '72px'}			
		var formStyle = {border: '1px solid #397DA6', color: '#397DA6'}
		var delete_row
		var add_row = (
		        <div className="col-auto">
                	<a href={this.props.usage?"/main/accounting/usage/form":"/main/inventory/operation/form"} className="btn btn-outline-danger text-uppercase fs12 fwbold"><i className="fa fa-plus mr-2"/>Tambah</a>
                </div>
		    )
		if(this.state.show_delete){
		    delete_row = (
		        <div className="col-auto">
                	<button className="btn btn-outline-danger text-uppercase fs12 fwbold" onClick={this.deleteRow}>Hapus</button>
                </div>
		    )
		}
		
		var backBtn
		if (document.location.href.includes('?')) {
		    var color = {color: '#056EAD', cursor: 'pointer'}
		    backBtn = <div className="col-auto my-auto">
		                    <span key="999" className="fs16 fw600 mr-auto my-auto" style={color} onClick={() => {history.back()}}><i className="fa fa-chevron-left mr-1" style={color}></i>Back</span>
		                </div>
		}
        
        if (this.state.loaded){
            return(
                <div>
                    <div className="row mx-0" style={row_style2}>
                        <div className="col-auto">
                            <div className="row">
                                {backBtn}
                                {add_row}
                                {delete_row}
                            </div>
                        </div>
                        <div className="col">
                            <input className="form-control fs12" name="search" placeholder="Search..." style={formStyle} onChange={e => this.setState({search: e.target.value})}/>
                        </div>
                        <div className="col-7">
                            <Filter sorts={sorts} searchAction={this.operationSearch} field_list={field_list} filters={JSON.parse(sessionStorage.getItem(window.location.pathname))}/>
                        </div>
                    </div>
                    <OperationList usage={this.props.usage} items={this.state.data} search={this.state.search} checkRow={this.checkRow} checkAll={() => this.checkAll()} check_all={this.state.check_all} paginationClick={this.paginationClick} currentpage={this.state.currentpage} datalength={this.state.datalength}/>
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

class OperationList extends React.Component {
    render() {
        var search = this.props.search
        function filterRow(row){
            function filterField(field){
                return field?field.toString().includes(search):false
            }
            var fields = [row.name, row.reference, row.from_name||row.from||'Supplier', row.to_name||row.to||'Customer',row.status,moment(row.creation).format('DD-MM-YYYY')]
            return ![false,''].includes(search)?fields.some(filterField):true
        }
        var rows = []
        var panel_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px'}
        var items = this.props.items
        
        if (items.length != 0 ){
            var list = this
            // const indexOfLastTodo = this.props.currentpage * 30;
            // const indexOfFirstTodo = indexOfLastTodo - 30;
            // var currentItems
            // ![false,''].includes(search)?
            // currentItems = items.filter(filterRow).slice(indexOfFirstTodo, indexOfLastTodo):
            // currentItems = items.slice(indexOfFirstTodo, indexOfLastTodo)
            items.forEach(function(item, index){
                // if (currentItems.includes(item)){
                    rows.push(
                        <OperationListRow usage={list.props.usage} key={index.toString()} item={item} checkRow={() => list.props.checkRow(index)}/>
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
                			    <div className="col">
                					<span>ID</span>
                				</div>
                			    <div className="col text-center">
                					<span>{this.props.usage?"Keterangan":"Source Document"}</span>
                				</div>
                				<div className="col text-center">
                					<span>From</span>
                				</div>
                				<div className="col text-center">
                					<span>To</span>
                				</div>
                				<div className="col text-center">
                					<span>Date</span>
                				</div>
                				<div className="col text-center">
                					<span>Status</span>
                				</div>
                			</div>
                		</div>
                	</div>
                	{rows}
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

class OperationListRow extends React.Component {
    clickRow() {
        var pathname = "/main/inventory/operation/edit?n="+this.props.item.name
        if(this.props.usage){
            pathname = "/main/accounting/usage/edit?n="+this.props.item.name
        }
        window.location = pathname
    }
    
    render() {
        var checked = false
        if(this.props.item.checked){
            checked = true
        }
        var statusClass
        var item = this.props.item
        var moment_date = moment(item.creation)
        
        if (item.status == 'Draft') {
            statusClass = 'bg-warning'
        } else if (item.status == 'Done') {
            statusClass = 'bg-success'
        } else if (item.status == 'Cancel'){
            statusClass = 'bg-danger'
        } else {
            statusClass = 'bg-info'
        }
        
        return(
            <div className="row mx-0">
                <div className="col-auto pl-2 pr-3">
        			<input type="checkbox" className="d-block my-3" checked={checked} onChange={this.props.checkRow}/>
        		</div>
                <div className="col row-list row-list-link" onClick={() => this.clickRow()}>
        			<div className="row mx-0 fs12 fw600">
        			    <div className="col">
        					<span>{item.name}</span>
        				</div>
        			    <div className="col text-center">
        					<span>{item.reference}</span>
        				</div>
        				<div className="col text-center">
        					<span>{item.from_name||item.from || 'Supplier'}</span>
        				</div>
        				<div className="col text-center">
        					<span>{item.to_name||item.to||'Customer'}</span>
        				</div>
        				<div className="col text-center">
        					<span>{moment_date.format('DD-MM-YYYY')}</span>
        				</div>
        				<div className="col text-center">
        					<span className={statusClass + ' fs12 py-1 rounded-pill text-center text-white px-3 my-auto'}>
        						{item.status}
        					</span>
        				</div>
        			</div>
        		</div>
            </div>
        )
    }
}

var operation_list = document.getElementById('operation_list')
var usage_list = document.getElementById('usage_list')
if(operation_list){
    ReactDOM.render(<Operation />, operation_list)
} else if(usage_list){
    ReactDOM.render(<Operation usage={true}/>, usage_list)
}