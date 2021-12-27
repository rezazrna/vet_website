class UnitOfMeasure extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': [],
            'loaded': false,
            'check_all': false,
            'show_delete': false,
            'show_form': false,
            'currentpage': 1,
            'search': false,
            'currentUser': {},
            'datalength': 0,
        }
        this.checkRow = this.checkRow.bind(this);
        this.deleteRow = this.deleteRow.bind(this);
        this.newUOM = this.newUOM.bind(this)
        this.toggleShowForm = this.toggleShowForm.bind(this)
        this.paginationClick = this.paginationClick.bind(this);
    }
    
    componentDidMount() {
        var td = this
        var new_filters = {filters: [], sorts: []}

        frappe.call({
            type: "GET",
            method:"vet_website.methods.get_current_user",
            args: {},
            callback: function(r){
                if (r.message) {
                    td.setState({'currentUser': r.message});
                }
            }
        });
        sessionStorage.setItem(window.location.pathname, JSON.stringify(new_filters))

        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetuom.vetuom.get_uom_list",
            args: {filters: new_filters},
            callback: function(r){
                if (r.message) {
                    td.setState({'data': r.message.uom_list, 'loaded': true, 'datalength': r.message.datalength});
                }
            }
        });
    }
    
    paginationClick(number) {
        console.log('Halo')
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
                method:"vet_website.vet_website.doctype.vetuom.vetuom.get_uom_list",
                args: {filters: filters},
                callback: function(r){
                    if (r.message) {
                        po.setState({'data': r.message.uom_list, 'loaded': true, 'datalength': r.message.datalength});
                    }
                }
            });
        // }
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
            method:"vet_website.vet_website.doctype.vetuom.vetuom.delete_uom",
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
    
    toggleShowForm(value){
        this.setState({show_form: value})
    }
    
    newUOM(data){
        var uom = this
        frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vetuom.vetuom.new_uom",
            args: {data: data},
            callback: function(r){
                if (r.message) {
                    console.log(r.message)
                    var new_data = uom.state.data.slice()
                    if(r.message.unit_master != ''){
                        uom.state.data.forEach((d, index) => {
                            if (d.name == r.message.unit_master){
                                new_data.splice(index+1, 0, r.message)
                            }
                        })
                    }
                    else{
                        new_data.unshift(r.message)
                    }
                    uom.setState({data: new_data, show_form: false, show_edit: false});
                }
            }
        })
    }
    
    editUOM(index, data){
        var uom = this
        frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vetuom.vetuom.edit_uom",
            args: {data: data},
            callback: function(r){
                if (r.message) {
                    var new_data = uom.state.data.slice()
                    new_data[index] = r.message
                    uom.setState({data: new_data, show_form: false, show_edit: false});
                }
            }
        })
    }
    
    render() {
		var write = checkPermission('VetUOM', this.state.currentUser, 'write')
		var row_style2 = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px', 'height': '72px'}			
		var formStyle = {border: '1px solid #397DA6', color: '#397DA6'}
		var delete_row, popup_form
		var add_row = (
		        <div className="col-auto">
                	<button className="btn btn-outline-danger text-uppercase fs12 fwbold" onClick={() => this.toggleShowForm('new')}><i className="fa fa-plus mr-2"/>Tambah</button>
                </div>
		    )
		if(this.state.show_delete){
		    delete_row = (
		        <div className="col-auto">
                	<button className="btn btn-outline-danger text-uppercase fs12 fwbold" onClick={this.deleteRow}>Hapus</button>
                </div>
		    )
		}
		
		if(this.state.show_form !== false){
		    if(this.state.show_form === 'new'){
		        popup_form = <UnitOfMeasurePopupForm cancelAction={() => this.toggleShowForm(false)} submitAction={this.newUOM} uom_list={this.state.data}/>
		    }
		    else if(this.state.data[this.state.show_form] != undefined) {
		        popup_form = <UnitOfMeasurePopupForm write={write} data={this.state.data[this.state.show_form]} cancelAction={() => this.toggleShowForm(false)} submitAction={data => this.editUOM(this.state.show_form, data)} uom_list={this.state.data}/>
		    }
		}
        
        if (this.state.loaded){
            return(
                <div>
                    <div className="row mx-0" style={row_style2}>
                        <div className="col-auto">
                            <div className="row">
                                {add_row}
                                {delete_row}
                            </div>
                        </div>
                        <div className="col">
                            <input className="form-control fs12" name="search" placeholder="Search..." style={formStyle} onChange={e => this.setState({search: e.target.value})}/>
                        </div>
                        <div className="col-7"/>
                    </div>
                    <UnitOfMeasureList items={this.state.data} search={this.state.search} checkRow={this.checkRow} checkAll={() => this.checkAll()} check_all={this.state.check_all} toggleShowForm={this.toggleShowForm} paginationClick={this.paginationClick} currentpage={this.state.currentpage} datalength={this.state.datalength}/>
                    {popup_form}
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

class UnitOfMeasureList extends React.Component {
    render() {
        var search = this.props.search
        function filterRow(row){
            function filterField(field){
                return field?field.toString().includes(search):false
            }
            var fields = [row.uom_name]
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
            console.log(items)
            items.forEach(function(item, index){
                rows.push(
                    <UnitOfMeasureListRow key={index.toString()} item={item} checkRow={() => list.props.checkRow(index)} toggleShowForm={() => list.props.toggleShowForm(index.toString())}/>
                )
            })
            
            return(
                <div style={panel_style}>
                	<div className="row mx-0">
                		<div className="col-auto pl-2 pr-3">
                			<input type="checkbox" className="d-block my-3" checked={this.props.check_all} onChange={this.props.checkAll}/>
                		</div>
                		<div className="col row-header">
                			<div className="row mx-0 fs12 fw600">
                				<div className="col-9 d-flex">
                					<span className="my-auto">Unit of Measurement</span>
                				</div>
                				<div className="col-3 d-flex">
                					<span className="my-auto">Unit Master</span>
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

class UnitOfMeasureListRow extends React.Component {
    
    render() {
        var indicator_style = {color: '#1B577B'}
        var indicator_style2 = {marginRight: '25px'}
        var checked = false
        if(this.props.item.checked){
            checked = true
        }
        var statusClass
        var item = this.props.item
        
        var master_indicator
        var unit_master = 1
        if(![undefined,null,false,'0',''].includes(item.unit_master)){
            unit_master = item.ratio
            master_indicator = <span style={indicator_style2}/>
        }
        else {
            master_indicator = <i className="fa fa-circle my-auto mr-3" style={indicator_style}/>
        }
        
        return(
            <div className="row mx-0">
                <div className="col-auto pl-2 pr-3">
        			<input type="checkbox" className="d-block my-3" checked={checked} onChange={this.props.checkRow}/>
        		</div>
                <div className="col row-list row-list-link" onClick={this.props.toggleShowForm}>
        			<div className="row mx-0 fs12 fw600">
        				<div className="col-9 d-flex">
        					{master_indicator}<span className="my-auto">{item.uom_name}</span>
        				</div>
        				<div className="col-3 d-flex">
        					<span className="my-auto">{formatter2.format(unit_master)}</span>
        				</div>
        			</div>
        		</div>
            </div>
        )
    }
}

class UnitOfMeasurePopupForm extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': {},
        }
    }
    
    componentDidMount() {
        if(this.props.data != undefined){
            this.setState({data: this.props.data})
        }
    }
    
    formSubmit(e){
        e.preventDefault()
        var new_data = this.state.data
        var unit_master = this.props.uom_list.find(i => i.name == new_data.unit_master || i.uom_name == new_data.unit_master)
        unit_master?new_data.unit_master = unit_master.name:unit_master = ''
        this.props.submitAction(new_data)
    }
    
    changeInput(e){
        var target = e.target
        var name = target.name
        var value = target.value
        var new_data = Object.assign({}, this.state.data)
        
        new_data[name] = value
        this.setState({data: new_data})
    }
    
    inputBlur(e, list) {
        const value = e.target.value
        const name = e.target.name
        var new_data = Object.assign({}, this.state.data)
    	var selected = false
    	console.log(value)
    	
    	if (name == "unit_master") {
    	    list.forEach(function(item, index) {
        	    if (item.uom_name == value) {
        	        selected = true
        	    }
        	})
    	} 
    	if (!selected) {
    		e.target.value = ''
    		if (name == "unit_master") {
        		new_data[name] = ''
        		new_data['unit_master_label'] = ''
    		    this.setState({data: new_data})
    		}
    	}
    }
    
    render(){
        console.log(this.props.uom_list)
        var container_style = {marginTop: '50px', maxWidth: '915px'}
        var panel_style = {borderRadius: '8px'}
        var input_style = {background: '#CEEDFF'}
        var button1_style = {minWidth: '147px', border: '1px solid #056EAD', background: '#056EAD', color: '#FFF'}
        var button2_style = {minWidth: '147px', border: '1px solid #056EAD', color: '#056EAD'}
        var button_title = 'Tambah'
        var ratio_required = false
        var unit_master_input
        
        if(![undefined,null,false,'0',''].includes(this.state.data.unit_master)){
            ratio_required = true
        }
        
        var unit_list = []
        var unit_master = this.props.uom_list.filter(um => um.name != this.state.data.name && [undefined,null,false,'0',''].includes(um.unit_master))
        unit_master.forEach((um, index) => unit_list.push(<option value={um.uom_name} key={index.toString()} />))
        
        if(this.state.data.name != undefined){
            button_title = 'Ubah'
        }
        else {
            unit_master_input = (
                <div className="form-group">
        	        <label htmlFor="unit_master" className="fs18 fw600">Unit Master</label>
        	        <input className="form-control fs18 border-0" style={input_style} type="text" name="unit_master" id="unit_master" autoComplete="off" defaultValue={this.state.data.unit_master_label||this.state.data.unit_master||''} onChange={e => this.changeInput(e)} onBlur={e => this.inputBlur(e, this.props.uom_list)} list="unit_master_list"/>
        	        <datalist id="unit_master_list">
        	            {unit_list}
        	        </datalist>
        	    </div>
            )
        }
        
        var submit_button = <div className="col-auto">
                	            <button type="submit" className="btn fs18 fw600 py-2" style={button1_style}>{button_title}</button>
                	        </div>
        var readOnly = !this.props.write || false
        
        return(
            <div className='menu-popup pt-0 d-flex' onClick={this.props.cancelAction}>
                <div className="container my-auto" style={container_style} onClick={event => event.stopPropagation()}>
                	<form onSubmit={e => this.formSubmit(e)} className="p-5 bg-white" style={panel_style}>
                	    <div className="form-group">
                	        <label htmlFor="uom_name" className="fs18 fw600">Unit Of Measurement</label>
                	        <input readOnly={readOnly} className="form-control fs18 border-0" style={input_style} type="text" name="uom_name" id="uom_name" required autoComplete="off" defaultValue={this.state.data.uom_name||''} onChange={e => this.changeInput(e)} placeholder="Masukkan bila ada"/>
                	    </div>
                	    {unit_master_input}
                	    <div className="form-group mb-5">
                	        <label htmlFor="ratio" className="fs18 fw600">Ratio</label>
                	        <input readOnly={readOnly} className="form-control fs18 border-0" style={input_style} type="text" name="ratio" id="ratio" required={ratio_required} autoComplete="off" defaultValue={this.state.data.ratio||''} onChange={e => this.changeInput(e)} placeholder="Masukkan bila ada"/>
                	    </div>
                	    <div className="row justify-content-center">
                	        {this.props.write?submit_button:false}
                	        <div className="col-auto">
                	            <button type="button" className="btn fs18 fw600 py-2" style={button2_style} onClick={this.props.cancelAction}>Batal</button>
                	        </div>
                	    </div>
                	</form>
                </div>
                <div className="menu-popup-close"/>
            </div>
        )
    }
}

ReactDOM.render(<UnitOfMeasure />, document.getElementById('uom_list'))