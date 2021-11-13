var tzOffset = new Date().getTimezoneOffset()
var register_number = getUrlParameter('register_number')

class TindakanDokter extends React.Component {
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
        this.listSearch = this.listSearch.bind(this);
        this.paginationClick = this.paginationClick.bind(this);
    }
    
    componentDidMount() {
        var td = this
        var new_filters = {filters: [], sorts: []}
        
        if (sessionStorage.getItem(window.location.pathname) != null && (document.referrer.includes('/main/dokter-dan-jasa/tindakan-dokter/detail') || document.referrer.includes('/main/dokter-dan-jasa/tindakan-dokter/edit'))) {
            new_filters = JSON.parse(sessionStorage.getItem(window.location.pathname))
        }
        
        if (register_number){
            new_filters.filters.push(['register_number', '=', register_number])
        }
        
        if (new_filters.hasOwnProperty("currentpage")) {
            this.setState({'currentpage': new_filters['currentpage']})
        }
        
        sessionStorage.setItem(window.location.pathname, JSON.stringify(new_filters))
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vettindakandokter.vettindakandokter.get_tindakan_dokter_list",
            args: {filters: new_filters},
            callback: function(r){
                if (r.message) {
                    td.setState({'data': r.message.tindakan_dokter, 'loaded': true, 'datalength': r.message.datalength});
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
                method:"vet_website.vet_website.doctype.vettindakandokter.vettindakandokter.get_tindakan_dokter_list",
                args: {filters: filters},
                callback: function(r){
                    if (r.message) {
                        po.setState({'data': r.message.tindakan_dokter, 'loaded': true, 'datalength': r.message.datalength});
                    }
                }
            });
        // }
    }
    
    listSearch(filters) {
        var td = this
        var new_filters = Object.assign({}, filters)
        filters.filters?new_filters.filters = filters.filters.slice():new_filters.filters=[]
        if (register_number){
            new_filters.filters.push(['register_number', '=', register_number])
        }
        
        this.setState({
          currentpage: 1,
          loaded: false,
        });
        
        new_filters['currentpage'] = 1;
        
        sessionStorage.setItem(window.location.pathname, JSON.stringify(new_filters))
        
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vettindakandokter.vettindakandokter.get_tindakan_dokter_list",
            args: {filters: new_filters},
            callback: function(r){
                if (r.message) {
                    console.log(r.message)
                    td.setState({'data': r.message.tindakan_dokter, 'loaded': true, 'datalength': r.message.datalength});
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
            method:"vet_website.vet_website.doctype.vettindakandokter.vettindakandokter.delete_tindakan_dokter",
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
        var status_options = [
            {label: 'Draft', value: 'Draft'},
            {label: 'Done', value: 'Done'},
            {label: 'Cancel', value: 'Cancel'},
        ]
        
        var sorts = [
    					{'label': 'Tanggal pendaftaran DESC', 'value': 'reception_date desc'},
    					{'label': 'Tanggal pendaftaran ASC', 'value': 'reception_date asc'},
    				// 	{'label': 'No Antrian DESC', 'value': 'reception desc'},
    				// 	{'label': 'No Antrian ASC', 'value': 'reception asc'},
    				    {'label': 'NIP DESC', 'value': 'pet desc'},
    					{'label': 'NIP ASC', 'value': 'pet asc'},
    					{'label': 'Nama Pasien DESC', 'value': 'pet_name desc'},
    					{'label': 'Nama Pasien ASC', 'value': 'pet_name asc'},
    					{'label': 'Nama Pemilik DESC', 'value': 'pet_owner_name desc'},
    					{'label': 'Nama Pemilik ASC', 'value': 'pet_owner_name asc'},
					]
					
		var field_list = [
		                {'label': 'Tanggal Pendaftaran', 'field': 'reception_date', 'type': 'date'},
		              //  {'label': 'No Penerimaan', 'field': 'reception', 'type': 'char'},
		              //  {'label': 'No Pendaftaran', 'field': 'register_number', 'type': 'char'},
		                {'label': 'NIP', 'field': 'pet', 'type': 'char'},
		                {'label': 'Nama Pasien', 'field': 'pet_name', 'type': 'char'},
		                {'label': 'Nama Pemilik', 'field': 'pet_owner_name', 'type': 'char'},
		                {'label': 'Keterangan', 'field': 'description', 'type': 'char'},
		                {'label': 'Status', 'field': 'status', 'type': 'select', 'options': status_options},
		              //  {'label': 'Kondisi Awal', 'field': 'condition', 'type': 'char'},
		              //  {'label': 'Kondisi Akhir', 'field': 'last_condition', 'type': 'char'},
		            ]
		
		var row_style2 = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px'}			
		var formStyle = {border: '1px solid #397DA6', color: '#397DA6'}
		var delete_row
		if(this.state.show_delete){
		    delete_row = (
		        <div>
                	<button className="btn btn-outline-danger text-uppercase fs12 fwbold" onClick={this.deleteRow}>Hapus</button>
                </div>
		    )
		}
        
        if (this.state.loaded){
            return(
                <div>
                    <div className="row mx-0" style={row_style2}>
                        <div className="col-auto">
                            {delete_row}
                        </div>
                        <div className="col">
                            <input className="form-control fs12" name="search" placeholder="Search..." style={formStyle} onChange={e => this.setState({search: e.target.value})}/>
                        </div>
                        <div className="col-8">
                            <Filter sorts={sorts} searchAction={this.listSearch} field_list={field_list} filters={JSON.parse(sessionStorage.getItem(window.location.pathname))}/>
                        </div>
                    </div>
                    <TindakanDokterList search={this.state.search} items={this.state.data} checkRow={this.checkRow} checkAll={() => this.checkAll()} check_all={this.state.check_all} paginationClick={this.paginationClick} currentpage={this.state.currentpage} datalength={this.state.datalength}/>
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


class TindakanDokterList extends React.Component {
    render() {
        var search = this.props.search
        
        function filterRow(row){
            function filterField(field){
                return field?field.toString().includes(search):false
            }
            var fields = [row.reception_date, row.queue, row.pet, row.pet_name, row.pet_owner_name, row.description, row.status]
            return ![false,''].includes(search)?fields.some(filterField):true
        }
        
        var rows = []
        var panel_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px'}
        var items = this.props.items
        
        if (items.length != 0 ){
            // var list = this
            // const indexOfLastTodo = this.props.currentpage * 30;
            // const indexOfFirstTodo = indexOfLastTodo - 30;
            // var currentItems
            // ![false,''].includes(search)?
            // currentItems = items.filter(filterRow).slice(indexOfFirstTodo, indexOfLastTodo):
            // currentItems = items.slice(indexOfFirstTodo, indexOfLastTodo)
            items.forEach(function(item, index){
                // if (currentItems.includes(item)){
                    rows.push(
                        <TindakanDokterListRow key={index.toString()} item={item} checkRow={() => list.props.checkRow(index)}/>
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
                				<div className="col d-flex">
                					<span className="my-auto">Tgl Pendaftaran</span>
                				</div>
                				<div className="col d-flex">
                					<span className="my-auto">No Antrian</span>
                				</div>
                				<div className="col d-flex">
                					<span className="my-auto">NIP</span>
                				</div>
                				<div className="col-2 d-flex">
                					<span className="my-auto">Nama Pasien</span>
                				</div>
                				<div className="col-2 d-flex">
                					<span className="my-auto">Nama Pemilik</span>
                				</div>
                				<div className="col d-flex">
                					<span className="my-auto">Keterangan / request</span>
                				</div>
                				<div className="col-1 d-flex">
                					<span className="my-auto">Status</span>
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

class TindakanDokterListRow extends React.Component {
    clickRow() {
        var type
        var item = this.props.item
        
        if (['Draft', 'Checked'].includes(item.status)) {
            type = 'edit'
        } else {
            type = 'detail'
        }
        
        var pathname = "/main/dokter-dan-jasa/tindakan-dokter/" + type + "?n=" + item.name
        window.location = pathname
    }
    
    render() {
        var checked = false
        if(this.props.item.checked){
            checked = true
        }
        var statusClass
        var item = this.props.item
        
        if (item.status == 'Draft') {
            statusClass = 'bg-warning'
        } else if (item.status == 'Done') {
            statusClass = 'bg-success'
        } else if (item.status == 'Cancel'){
            statusClass = 'bg-danger'
        } else {
            statusClass = 'bg-secondary'
        }
        
        return(
            <div className="row mx-0">
                <div className="col-auto pl-2 pr-3">
        			<input type="checkbox" className="d-block my-3" checked={checked} onChange={this.props.checkRow}/>
        		</div>
                <div className="col row-list row-list-link" onClick={() => this.clickRow()}>
        			<div className="row mx-0 fs12 fw600">
        				<div className="col d-flex">
        					<span className="my-auto">{moment(item.reception_date).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss")}</span>
        				</div>
        				<div className="col d-flex">
        					<span className="my-auto">{item.queue}</span>
        				</div>
        				<div className="col d-flex">
        					<span className="my-auto">{item.pet}</span>
        				</div>
        				<div className="col-2 d-flex">
        					<span className="my-auto">{item.pet_name}</span>
        				</div>
        				<div className="col-2 d-flex">
        					<span className="my-auto">{item.pet_owner_name}</span>
        				</div>
        				<div className="col d-flex">
        					<span className="my-auto">{item.description}</span>
        				</div>
        				<div className="col-1 d-flex">
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

ReactDOM.render(<TindakanDokter />, document.getElementById('tindakan_dokter_list'))