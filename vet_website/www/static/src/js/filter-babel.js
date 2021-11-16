class Filter extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            filters: this.props.filters != null
            ? this.props.filters
            : {
                filters: [],
                sorts: []
            },
            // filters: JSON.parse(sessionStorage.getItem(window.location.pathname)),
            new_filter: {},
            new_sort: {},
            show_form: false,
            show_sort_form: false,
        };
        
        this.addFilters = this.addFilters.bind(this)
        this.addSorts = this.addSorts.bind(this)
        this.filterChange = this.filterChange.bind(this)
        this.sortChange = this.sortChange.bind(this)
        this.deleteFilter = this.deleteFilter.bind(this)
    }
    
    addFilters() {
        if(Object.keys(this.state.new_filter).length >= 3){
            var new_filters = Object.assign({}, this.state.filters)
            var filter = []
            filter.push(this.state.new_filter.field)
            filter.push(this.state.new_filter.comparator)
            if(['like', 'not like'].includes(this.state.new_filter.comparator)){
                var value = "%"+this.state.new_filter.value+"%"
                filter.push(value)
            }
            else if(this.state.new_filter.comparator == 'between'){
                var value = [this.state.new_filter.value, this.state.new_filter.value2]
                filter.push(value)
            }
            else{
                filter.push(this.state.new_filter.value)
            }
            new_filters.filters.push(filter)
            console.log(new_filters.filters)
            this.setState({filters: new_filters, new_filter: {}, show_form: false})
            this.props.searchAction(new_filters);
        }
    }
    
    addSorts() {
        if(Object.keys(this.state.new_sort).length == 2){
            var new_filters = Object.assign({}, this.state.filters)
            var sort = this.state.new_sort.field+" "+this.state.new_sort.sort
            new_filters.sorts.push(sort)
            new_filters.sort = new_filters.sorts.join(',')
            this.setState({filters: new_filters, new_sort: {}, show_sort_form: false})
            this.props.searchAction(new_filters);
        }
    }
    
    filterChange(e, value_type=false) {
        const target = e.target;
        const value = target.value;
        const name = target.name;
        var new_filter = Object.assign({}, this.state.new_filter)
        new_filter[name] = value
        if(name == 'field'){
            delete new_filter.comparator
            delete new_filter.value
            if (!['',undefined,false].includes(value)){
                var type = this.props.field_list.find(f => f.field == value).type
                type=='select'?new_filter.comparator = '=':false
            }
        }
        else if(name == 'comparator'){
            delete new_filter.value
        }
        this.setState({new_filter: new_filter})
    }
    
    sortChange(e) {
        const target = e.target;
        const value = target.value;
        const name = target.name;
        var new_sort = Object.assign({}, this.state.new_sort)
        new_sort[name] = value
        this.setState({new_sort: new_sort})
    }
    
    toggleShowForm(){
        this.setState({show_form: !this.state.show_form})
    }
    
    toggleShowSortForm(){
        this.setState({show_sort_form: !this.state.show_sort_form})
    }
    
    deleteFilter(i){
        var new_filters = Object.assign({}, this.state.filters)
        new_filters.filters.splice(i, 1)
        this.setState({filters: new_filters, new_filter: {}, show_form: false})
        this.props.searchAction(new_filters);
    }
    
    deleteSort(i){
        var new_filters = Object.assign({}, this.state.filters)
        new_filters.sorts.splice(i, 1)
        new_filters.sort = new_filters.sorts.join(',')
        this.setState({filters: new_filters, new_sort: {}, show_sort_form: false})
        this.props.searchAction(new_filters);
    }
    
    render() {
        var panel_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px', 'marginBottom': '18px'}
        var search_style = {"fontFamily": "Open Sans, FontAwesome"}
        var btnStyle = {background: '#397DA6', color: '#FFFFFF'}
        var sort_col, date_col, add_col, search_col
        
        if (this.props.sorts.length != 0) {
            var field_list = []
            this.props.sorts.forEach(function(sort,index){
                var label
                var field = sort.value.split(' ')[0]
                if(sort.label.includes('DESC')){
                    label = sort.label.replace(' DESC', '')
                } else if(sort.label.includes('ASC')){
                    label = sort.label.replace(' ASC', '')
                }
                
                if(!field_list.map(f => f.field).includes(field)){
                    field_list.push({label: label, field: field})
                }
            })
            
            var sort_form
            if(this.state.show_sort_form){
                sort_form = <SortForm field_list={field_list} new_sort={this.state.new_sort} sortChange={this.sortChange} addSorts={this.addSorts}/>
            }
            
        //     sort_col = (
        //         <div className="col-3">
        // 			<div className="row">
        // 				<label htmlFor="sort" className="col-5 fs12 my-auto">
        // 					{this.props.group_by ? 'Group By' : 'Sort by'}
        // 				</label>
        // 				<select className="col-7 form-control form-control-sm fs14" id="sort" name="sort" onChange={this.sortChange}>
        // 					{sort_list}
        // 				</select>
        // 			</div>
        // 		</div>
        //     )
            
            sort_col = (
                <div className="col-auto px-1 position-relative">
        	        <button type="button" className="btn py-0 px-2 h-100" style={btnStyle} onClick={() => this.toggleShowSortForm()}>
            	        <i className="fa fa-sort-amount-desc fs20"/>
            	    </button>
            	    {sort_form}
        	    </div>
            )
        }
        
        var form
        if(this.state.show_form){
            form = <FilterForm field_list={this.props.field_list} new_filter={this.state.new_filter} filterChange={this.filterChange} addFilters={this.addFilters}/>
        }
        
        var filter_list = []
        if (this.state.filters.filters != null) {
            this.state.filters.filters.forEach((item, index) => {
                filter_list.push(<FilterChilds item={item} key={index.toString()} deleteFilter={() => this.deleteFilter(index.toString())}/>)
            })
        }
        
        var sort_list = []
        if (this.state.filters.sorts != null) {
             this.state.filters.sorts.forEach((item, index) => {
                sort_list.push(<SortChilds item={item} key={index.toString()} deleteSort={() => this.deleteSort(index.toString())}/>)
            })   
        }
        
        return(
            <div>
            	<div className="row mx-0 justify-content-end position-relative" id="filter_bar">
            	    <div className="col-auto px-1 position-relative">
            	        <button type="button" className="btn py-0 px-2 h-100" style={btnStyle} onClick={() => this.toggleShowForm()}>
                	        <i className="fa fa-filter fs24"/>
                	    </button>
                	    {form}
            	    </div>
            	    {sort_col}
            	    {filter_list}
            	    {sort_list}
            	</div>
            </div>
        )
    }
}

class FilterChilds extends React.Component {
    render(){
        var item = this.props.item
        var cursor = {cursor: 'pointer'}
        
        var style = {background: '#397DA6', color: '#FFFFFF'}
        return(
            <div className="col-auto px-1 mb-2">
                <div className="h-100 d-flex rounded" style={style}>
                    <span className="px-2 my-auto">{item[0]} {item[1]} {Array.isArray(item[2]) ? item[2].join(' - ') : item[2]} {item[3]}<i className="fa fa-times ml-2" style={cursor} onClick={this.props.deleteFilter}/></span>
                </div>
            </div>
        )
    }
}

class SortChilds extends React.Component {
    render(){
        var item = this.props.item
        var cursor = {cursor: 'pointer'}
        
        var style = {background: '#397DA6', color: '#FFFFFF'}
        return(
            <div className="col-auto px-1">
                <div className="h-100 d-flex rounded" style={style}>
                    <span className="px-2 my-auto">{item}<i className="fa fa-times ml-2" style={cursor} onClick={this.props.deleteSort}/></span>
                </div>
            </div>
        )
    }
}

class FilterForm extends React.Component {
    render(){
        function AddIcon(){
            var style = {width: 12, height: 12, display: 'inline-block', marginRight: 8}
            var style2 = {marginTop: -2}
            return(
                <span style={style}>
                    <svg preserveAspectRatio="xMidYMax" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg" style={style2}>
                        <path d="M8 3.42857H4.57143V0H3.42857V3.42857H0V4.57143H3.42857V8H4.57143V4.57143H8V3.42857Z" fill="white"/>
                    </svg>
                </span>
            )
        }
        
        var absoluteStyle = {width: 180, background: '#FFF', top: '110%', right: 15, boxShadow: '-2px 4px 4px rgba(0, 0, 0, 0.25)', zIndex: 1}
        var btnStyle = {background: '#397DA6', color: '#FFFFFF'}
        var formStyle = {border: '1px solid #397DA6', color: '#397DA6'}
        var new_filter = this.props.new_filter
        var field_list = this.props.field_list
        var comparators = [
                {'label': 'Equal', 'value': '='},
                {'label': 'Not Equal', 'value': '!='},
                {'label': 'Like', 'value': 'like'},
                {'label': 'Not Like', 'value': 'not like'},
                {'label': '<', 'value': '<'},
                {'label': '<=', 'value': '<='},
                {'label': '>', 'value': '>'},
                {'label': '>=', 'value': '>='},
                {'label': 'Between', 'value': 'between'},
                
            ]
        var field_options = [<option key='' value=''>Nama Field</option>]
        var compare_options = [<option key='' value=''>Filter</option>]
        var value_options = [<option key='' value=''>Pilih</option>]
        var valuePlaceholder = 'Nilai'
        var valuePlaceholder2 = 'Sampai'
        
        field_list.forEach(f => field_options.push(<option value={f.field} key={f.field}>{f.label}</option>))
        
        var value_type = "text"
        var value2 = <div className="col"/>
        var type
        
        if(!['',false,undefined].includes(new_filter.field)){
            type = field_list.find(f => f.field == new_filter.field).type
            if(type == 'char'){
                comparators.slice(0,4).forEach(o => compare_options.push(<option value={o.value} key={o.value}>{o.label}</option>))
            }
            else if (type == 'date') {
                value_type = "date"
                comparators.splice(2,2)
                comparators.forEach(o => compare_options.push(<option value={o.value} key={o.value}>{o.label}</option>))
                if(new_filter.comparator == 'between'){
                    value2 = (
                        <div className="col-12 px-0">
                            <input style={formStyle} type="date" placeholder={valuePlaceholder2} className="form-control form-control-sm fs12 mb-1" id="value2" name="value2" onChange={e => this.props.filterChange(e)} value={new_filter.value2||''}/>
                        </div>
                    )
                    valuePlaceholder = 'Dari'
                }
            } else if (type == 'int') {
                comparators.splice(2,2)
                comparators.splice(-1,1)
                comparators.forEach(o => compare_options.push(<option value={o.value} key={o.value}>{o.label}</option>))
            } else if (type == 'select') {
                field_list.find(f => f.field == new_filter.field).options?
                field_list.find(f => f.field == new_filter.field).options.forEach(o => value_options.push(<option key={o.value} value={o.value}>{o.label}</option>)):
                false
            }
            
        }
        
        var compare = <div className="col-12 px-0">
                        <select style={formStyle} className="form-control form-control-sm fs12 mb-1" id="comparator" name="comparator" onChange={e => this.props.filterChange(e)} value={new_filter.comparator||''}>
        					{compare_options}
        				</select>
                    </div>
                    
        var input = <input style={formStyle} type={value_type} placeholder={valuePlaceholder} className="form-control form-control-sm fs12 mb-1" id="value" name="value" onChange={e => this.props.filterChange(e, value_type)} value={new_filter.value||''}/>
        var input_select = <select style={formStyle} className="form-control form-control-sm fs12 mb-1" id="value" name="value" onChange={e => this.props.filterChange(e, value_type)} value={new_filter.value||''}>
                                {value_options}
                            </select>
        
        return(
            <div className="position-absolute p-2 rounded" style={absoluteStyle} onClick={e => e.stopPropagation()}>
                <div className="row mx-0 justify-content-end p-1">
                    <div className="col-12 px-0">
                        <select style={formStyle} className="form-control form-control-sm fs12 mb-1" id="field" name="field" onChange={e => this.props.filterChange(e)} value={new_filter.field||''}>
        					{field_options}
        				</select>
                    </div>
                    {type!='select'?compare:false}
                    <div className="col-12 px-0">
                        {type!='select'?input:input_select}
                    </div>
                    {value2}
                    <div className="col-12 px-0">
                        <button type="button" className="btn btn-block py-1 px-2 fs14" style={btnStyle} onClick={() => this.props.addFilters()}><AddIcon/>Tambah</button>
                    </div>
                </div>
            </div>
        )
    }
}

class SortForm extends React.Component {
    render(){
        function AddIcon(){
            var style = {width: 12, height: 12, display: 'inline-block', marginRight: 8}
            var style2 = {marginTop: -2}
            return(
                <span style={style}>
                    <svg preserveAspectRatio="xMidYMax" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg" style={style2}>
                        <path d="M8 3.42857H4.57143V0H3.42857V3.42857H0V4.57143H3.42857V8H4.57143V4.57143H8V3.42857Z" fill="white"/>
                    </svg>
                </span>
            )
        }
        
        var absoluteStyle = {width: 180, background: '#FFF', top: '110%', right: 15, boxShadow: '-2px 4px 4px rgba(0, 0, 0, 0.25)', zIndex: 1}
        var btnStyle = {background: '#397DA6', color: '#FFFFFF'}
        var formStyle = {border: '1px solid #397DA6', color: '#397DA6'}
        var new_sort = this.props.new_sort
        var field_list = this.props.field_list
        var field_options = [<option key='' value=''>Nama Field</option>]
        
        field_list.forEach(f => field_options.push(<option value={f.field} key={f.field}>{f.label}</option>))
        
        return(
            <div className="position-absolute p-2 rounded" style={absoluteStyle} onClick={e => e.stopPropagation()}>
                <div className="row mx-0 justify-content-end p-1">
                    <div className="col-12 px-0">
                        <select style={formStyle} className="form-control form-control-sm fs12 mb-1" id="field" name="field" onChange={e => this.props.sortChange(e)} value={new_sort.field||''}>
        					{field_options}
        				</select>
                    </div>
                    <div className="col-12 px-0">
                        <select style={formStyle} className="form-control form-control-sm fs12 mb-1" id="sort" name="sort" onChange={e => this.props.sortChange(e)} value={new_sort.sort||''}>
        					<option value=''>Sort</option>
        					<option value='asc'>ASC</option>
        					<option value='desc'>DESC</option>
        				</select>
                    </div>
                    <div className="col-12 px-0">
                        <button type="button" className="btn btn-block py-1 px-2 fs14" style={btnStyle} onClick={() => this.props.addSorts()}><AddIcon/>Tambah</button>
                    </div>
                </div>
            </div>
        )
    }
}