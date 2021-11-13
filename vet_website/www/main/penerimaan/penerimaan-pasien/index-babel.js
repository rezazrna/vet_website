var tzOffset = new Date().getTimezoneOffset()
class Reception extends React.Component {
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
        
        this.receptionSearch = this.receptionSearch.bind(this);
        this.checkRow = this.checkRow.bind(this);
        this.deleteRow = this.deleteRow.bind(this);
        this.paginationClick = this.paginationClick.bind(this);
    }
    
    componentDidMount() {
        var po = this
        var filters
        
        console.log(document.referrer)
        // console.log(document.referrer.includes('/main/penerimaan/penerimaan-pasien/detail'))
       
        if (sessionStorage.getItem(window.location.pathname) != null && document.referrer.includes('/main/penerimaan/penerimaan-pasien/detail')) {
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
            this.receptionSearch(filters)
        } else {
            sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))
            frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetreception.vetreception.get_reception_list",
                args: {filters: filters},
                callback: function(r){
                    if (r.message) {
                        console.log(r.message);
                        po.setState({'data': r.message.reception, 'loaded': true, 'datalength': r.message.datalength});
                    }
                }
            });
        }
    }
    
    paginationClick(number) {
        var po = this
        var filters = JSON.parse(sessionStorage.getItem(window.location.pathname))
        
        console.log(filters)
        
        if (document.location.href.includes('?')) {
            var url = document.location.href,
            params = url.split('?')[1].split('='),
            key = params[0],
            value = params[1]   
        }
            
        if (params) {
            filters[key] = value
        }
        
        this.setState({
          currentpage: Number(number),
          loaded: false,
        });

        filters['currentpage'] = this.state.currentpage
        
        sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))

        // if (number * 10 > this.state.data.length) {
            frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetreception.vetreception.get_reception_list",
                args: {filters: filters},
                callback: function(r){
                    if (r.message) {
                        console.log(r.message);
                        po.setState({'data': r.message.reception, 'loaded': true, 'datalength': r.message.datalength});
                    }
                }
            });
        // }
    }
    
    receptionSearch(filters) {
        console.log(filters)
        if (document.location.href.includes('?')) {
            var url = document.location.href,
            params = url.split('?')[1].split('='),
            key = params[0],
            value = params[1]   
        }
            
        if (params) {
            filters[key] = value
        }
        var po = this
        
        this.setState({
          currentpage: 1,
          loaded: false,
        });
        
        filters['currentpage'] = 1;
        sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetreception.vetreception.get_reception_list",
            args: {filters: filters},
            callback: function(r){
                if (r.message) {
                    console.log(r.message);
                    po.setState({'data': r.message.reception, 'loaded': true, 'datalength': r.message.datalength});
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
            method:"vet_website.vet_website.doctype.vetreception.vetreception.delete_reception",
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
        var service_options = []
        this.state.data.forEach(d => !service_options.map(s => s.value).includes(d.service.name)?service_options.push({label: d.service.service_name, value: d.service.name}):false)
        
        var sorts = [
    					{'label': 'Tanggal Pendaftaran DESC', 'value': 'reception_date desc'},
    					{'label': 'Tanggal Pendaftaran ASC', 'value': 'reception_date asc'},
    					{'label': 'No. Pendaftaran DESC', 'value': 'register_number desc'},
    					{'label': 'No. Pendaftaran ASC', 'value': 'register_number asc'},
    					{'label': 'Nama Pasien DESC', 'value': 'pet_name desc'},
    					{'label': 'Nama Pasien ASC', 'value': 'pet_name asc'},
    					{'label': 'Nama Pemilik DESC', 'value': 'pet_owner_name desc'},
    					{'label': 'Nama Pemilik ASC', 'value': 'pet_owner_name asc'},
					]
					
		var field_list = [
		                {'label': 'Tanggal Pendaftaran', 'field': 'reception_date', 'type': 'date'},
		                {'label': 'No. Pendaftaran', 'field': 'register_number', 'type': 'char'},
		                {'label': 'Layanan', 'field': 'service', 'type': 'select', 'options': service_options},
		              //  {'label': 'NIP', 'field': 'pet', 'type': 'char'},
		              //  {'label': 'ID', 'field': 'name', 'type': 'char'},
		                {'label': 'Nama Pasien', 'field': 'pet_name', 'type': 'char'},
		                {'label': 'Nama Pemilik', 'field': 'pet_owner_name', 'type': 'char'},
		                {'label': 'Catatan', 'field': 'description', 'type': 'char'},
		            ]
					
		var delete_button, backButton, addButton
// 		if(this.state.show_delete){
// 		    delete_button = <button className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={this.deleteRow}>Hapus</button>
// 		}
		var addStyle = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px'}
		var formStyle = {border: '1px solid #397DA6', color: '#397DA6'}
		
		if (document.location.href.includes('?')) {
		    var color = {color: '#056EAD', cursor: 'pointer'}
		    backButton = <span className="fs16 fw600 mr-4 my-auto" style={color} onClick={() => {history.back()}}><i className="fa fa-chevron-left mr-1" style={color}></i>Back</span>
		} else {
		    addButton = <a href="/main/penerimaan/penerimaan-pasien/form" className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2"><i className="fa fa-plus mr-2"></i>Penerimaan Pasien</a>
		}
        
        if (this.state.loaded){
            return(
                <div>
                    <div className="row mx-0" style={addStyle}>
                        <div className="col-auto my-auto">
                            {backButton}
                        	{addButton}
                        	{delete_button}
                        </div>
                        <div className="col">
                            <input className="form-control fs12" name="search" placeholder="Search..." style={formStyle} onChange={e => this.setState({search: e.target.value})}/>
                        </div>
                        <div className="col-7">
                            <Filter sorts={sorts} searchAction={this.receptionSearch} field_list={field_list} filters={JSON.parse(sessionStorage.getItem(window.location.pathname))}/>
                        </div>
                    </div>
                    <ReceptionList receptions={this.state.data} search={this.state.search} checkRow={this.checkRow} checkAll={() => this.checkAll()} check_all={this.state.check_all} paginationClick={this.paginationClick} currentpage={this.state.currentpage} datalength={this.state.datalength}/>
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


class ReceptionList extends React.Component {
    render() {
        var reception_rows = []
        var panel_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px'}
        var col_style = {'width': '40px'}
        var receptions = this.props.receptions
        var search = this.props.search
        
        function filterReception(reception){
            function filterField(field){
                return field?field.toString().includes(search):false
            }
            var fields = [reception.reception_date, reception.queue, reception.register_number, reception.pet.pet_name, reception.pet_owner.owner_name, reception.service.service_name, reception.description, reception.owner, reception.service.service_name]
            return ![false,''].includes(search)?fields.some(filterField):true
        }
        
        if (receptions.length != 0){
            // var number = 1
            // var pol = this
            // const indexOfLastTodo = this.props.currentpage * 10;
            // const indexOfFirstTodo = indexOfLastTodo - 10;
            // var currentItems
            // ![false,''].includes(search)?
            // currentItems = receptions.filter(filterReception).slice(indexOfFirstTodo, indexOfLastTodo):
            // currentItems = receptions.slice(indexOfFirstTodo, indexOfLastTodo)
            receptions.forEach(function(reception, index){
                // if (currentItems.includes(reception)){
                    reception_rows.push(
                        <ReceptionListRow key={reception.name} reception={reception} checkRow={() => pol.props.checkRow(index)}/>
                    )
                // }
                // number++
            })
            
            return(
                <div style={panel_style}>
                	<div className="row mx-0">
                		<div className="col-auto pl-2 pr-3">
                			<input type="checkbox" className="d-block my-3" checked={this.props.check_all} onChange={this.props.checkAll} />
                		</div>
                		<div className="col row-header">
                			<div className="row mx-0 fs12 fw600">
                				<div className="col d-flex">
                					<span className="my-auto">Tanggal Pendaftaran</span>
                				</div>
                				<div className="col-1 d-flex">
                					<span className="my-auto">No antrian</span>
                				</div>
                				<div className="col-1 d-flex">
                					<span className="my-auto">Nomor Pendaftaran</span>
                				</div>
                				<div className="col d-flex">
                					<span className="my-auto">Nama Pasien</span>
                				</div>
                				<div className="col d-flex">
                					<span className="my-auto">Nama Pemilik</span>
                				</div>
                				<div className="col-1 d-flex">
                					<span className="my-auto">Layanan</span>
                				</div>
                				<div className="col d-flex">
                					<span className="my-auto">Catatan</span>
                				</div>
                				<div className="col d-flex">
                					<span className="my-auto">Responsible</span>
                				</div>
                			</div>
                		</div>
                	</div>
                	{reception_rows}
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

class ReceptionListRow extends React.Component {
    clickRow() {
        var pathname = "/main/penerimaan/penerimaan-pasien/detail?n="+this.props.reception.name
        window.location = pathname
    }
    
    render() {
        var col_style = {'width': '40px'}
        var checked = false
        if(this.props.reception.checked){
            checked = true
        }
        var reception = this.props.reception
        
        return(
            <div className="row mx-0">
        		<div className="col-auto pl-2 pr-3">
        			<input type="checkbox" className="d-block my-3" checked={checked} onChange={this.props.checkRow} />
        		</div>
        		<div className="col row-list row-list-link" onClick={() => this.clickRow()}>
        			<div className="row mx-0 fs12 fw600">
        				<div className="col d-flex">
        					<span className="my-auto">{moment(reception.reception_date).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss")}</span>
        				</div>
        				<div className="col-1 d-flex">
        					<span className="my-auto">{reception.queue}</span>
        				</div>
        				<div className="col-1 d-flex">
        					<span className="my-auto">{reception.register_number}</span>
        				</div>
        				<div className="col d-flex">
        					<span className="my-auto">{reception.pet.pet_name}</span>
        				</div>
        				<div className="col d-flex">
        					<span className="my-auto">{reception.pet_owner.owner_name}</span>
        				</div>
        				<div className="col-1 d-flex">
        					<span className="my-auto">{reception.service.service_name}</span>
        				</div>
        				<div className="col d-flex">
        					<span className="my-auto">{reception.description}</span>
        				</div>
        				<div className="col d-flex">
        					<span className="my-auto">{reception.owner}</span>
        				</div>
        			</div>
        		</div>
        	</div>
        )
    }
}

ReactDOM.render(<Reception />, document.getElementById('reception_list'))