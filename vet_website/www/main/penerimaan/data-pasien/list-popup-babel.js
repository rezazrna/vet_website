class PetOwnerPopup extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': [],
            'loaded': false,
        }
        
        this.ownerSearch = this.ownerSearch.bind(this);
        this.rowClick = this.rowClick.bind(this);
        this.close = this.close.bind(this)
    }
    
    componentDidMount() {
        var po = this
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetpetowner.vetpetowner.get_pet_owner",
            args: {},
            callback: function(r){
                if (r.message) {
                    console.log(r.message);
                    po.setState({'data': r.message.pet_owner, 'loaded': true});
                }
            }
        });
    }
    
    ownerSearch(filters) {
        var po = this
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetpetowner.vetpetowner.get_pet_owner",
            args: {filters: filters},
            callback: function(r){
                if (r.message) {
                    console.log(r.message);
                    po.setState({'data': r.message.pet_owner});
                }
            }
        });
    }
    
    rowClick(value){
        if(this.props.rowClick != undefined){
            this.props.rowClick(value)
        }
    }
    
    close(){
        if(this.props.close != undefined){
            this.props.close()
        }
    }
    
    render() {
        if (this.state.loaded){
            var cursor_style = {cursor: 'pointer'}
            return(
                <div className="menu-popup">
                    <div className="container">
                        <div className="menu-popup-title">
                            Data Pemilik
                            <i className="fa fa-times float-right mt-2" style={cursor_style} onClick={() => this.close()}></i>
                        </div>
                        <SearchBarPopup sorts={[]} searchAction={this.ownerSearch}/>
                        <PetOwnerListPopup owners={this.state.data} searchAction={this.ownerSearch} rowClick={this.rowClick}/>
                    </div>
                    <div className="menu-popup-close" onClick={() => this.close()}></div>
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


class PetOwnerListPopup extends React.Component {
    render() {
        var owner_rows = []
        var panel_style = {'background': '#FFFFFF', 'padding': '12px 32px', 'paddingBottom': '32px', 'maxHeight': 'calc(100vh - 200px)', 'overflow': 'auto'}
        if (this.props.owners.length != 0){
            var number = 1
            var pol = this
            this.props.owners.forEach(function(owner, index){
                owner_rows.push(
                    <PetOwnerListRowPopup key={owner.name} number={number} owner={owner} rowClick={() => pol.props.rowClick(owner)}/>
                )
                number++
            })
            
            return(
                <div style={panel_style}>
    	            <div className="row mx-0">
    		            <div className="col row-header">
    			            <div className="row mx-0 fs12 fw600">
                				<div className="col d-flex">
                					<span className="my-auto">NIK</span>
                				</div>
                				<div className="col d-flex">
                					<span className="my-auto">Nama Pemilik</span>
                				</div>
                				<div className="col d-flex">
                					<span className="my-auto">Alamat</span>
                				</div>
                				<div className="col d-flex">
                					<span className="my-auto">Telepon</span>
                				</div>
                				<div className="col d-flex">
                					<span className="my-auto">Email</span>
                				</div>
            			    </div>
            		    </div>
            		</div>
        		    {owner_rows}
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

class PetOwnerListRowPopup extends React.Component {

    render() {
        return(
            <div className="row mx-0">
        		<div className="col row-list row-list-link" onClick={this.props.rowClick}>
        			<div className="row mx-0 fs12 fw600">
        				<div className="col d-flex">
        					<span className="my-auto">{this.props.owner.nik}</span>
        				</div>
        				<div className="col d-flex">
        					<span className="my-auto">{this.props.owner.owner_name}</span>
        				</div>
        				<div className="col d-flex">
        					<span className="my-auto">{this.props.owner.address}</span>
        				</div>
        				<div className="col d-flex">
        					<span className="my-auto">{this.props.owner.phone}</span>
        				</div>
        				<div className="col d-flex">
        					<span className="my-auto">{this.props.owner.email}</span>
        				</div>
        			</div>
        		</div>
        	</div>
        )
    }
}

class SearchBarPopup extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            filters: {}
        };
        
        this.searchEnter = this.searchEnter.bind(this)
        this.filterChange = this.filterChange.bind(this)
    }
    
    searchEnter(e) {
        if (e.key === 'Enter'){
            e.preventDefault();
            var new_filters = Object.assign({}, this.state.filters)
            new_filters.search = e.target.value
            this.setState({filters: new_filters})
            this.props.searchAction(new_filters);
        }
    }
    
    filterChange(e) {
        const target = e.target;
        const value = target.value;
        const name = target.name;
        var new_filters = Object.assign({}, this.state.filters)
        new_filters[name] = value
        this.setState({filters: new_filters})
        this.props.searchAction(new_filters);
    }
    
    render() {
        var panel_style = {'background': '#FFFFFF', 'padding': '12px 32px'}
        var search_style = {"fontFamily": "Open Sans, FontAwesome"}
        var sort_col, date_col, add_col
        
        if (this.props.sorts.length != 0) {
            var sort_list = []
            this.props.sorts.forEach(function(sort,index){
                sort_list.push(
                    <option key={sort.value} value={ sort.value }>{ sort.label }</option>
                )
            })
            sort_col = (
                <div className="col-2">
        			<div className="row">
        				<label htmlFor="sort" className="col-5 fs12 my-auto">
        					Sort by
        				</label>
        				<select className="col-7 form-control form-control-sm fs14" id="sort" name="sort" onChange={this.filterChange}>
        					{sort_list}
        				</select>
        			</div>
        		</div>
            )
        }
        
        if (this.props.show_date){
            date_col = (
                <div className="col-4">
        			<div className="row">
        				<div className="col pr-0">
        					<input type="date" className="form-control form-control-sm fs14" name="min_date" onChange={this.filterChange}/>
        				</div>
        				<div className="col-auto">
        					-
        				</div>
        				<div className="col pl-0">
        					<input type="date" className="form-control form-control-sm fs14" name="max_date" onChange={this.filterChange}/>
        				</div>
        			</div>
        		</div>
        	)
        }
        
        return(
            <div style={panel_style}>
            	<form method="GET" className="row mx-0" id="search_bar">
            		<div className="col-4 px-0">
            			<input name="search" className="form-control form-control-sm fs14" placeholder="&#xF002;    Cari" style={search_style} onKeyDown={this.searchEnter}/>
            		</div>
            		{date_col}
            		{sort_col}
            	</form>
            </div>
        )
    }
}