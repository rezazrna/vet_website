class SearchBar extends React.Component {
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
        var panel_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px', 'marginBottom': '18px'}
        var search_style = {"fontFamily": "Open Sans, FontAwesome"}
        var sort_col, date_col, add_col, search_col
        
        if (this.props.sorts.length != 0) {
            var sort_list = []
            this.props.sorts.forEach(function(sort,index){
                sort_list.push(
                    <option key={index.toString()} value={ sort.value }>{ sort.label }</option>
                )
            })
            sort_col = (
                <div className="col-3">
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
                <div className="col-6 mx-0">
        			<div className="row">
        				<div className="col-5 p-0">
        					<input type="date" className="form-control form-control-sm fs14" name="min_date" onChange={this.filterChange}/>
        				</div>
        				<div className="col-auto">
        					-
        				</div>
        				<div className="col-5 p-0">
        					<input type="date" className="form-control form-control-sm fs14" name="max_date" onChange={this.filterChange}/>
        				</div>
        			</div>
        		</div>
        	)
        }
        else if (this.props.show_single_date){
            date_col = (
                <div className="col-2 mx-0">
        			<div className="row">
        				<div className="col-12 p-0">
        					<input type="date" className="form-control form-control-sm fs14" name="date" onChange={this.filterChange}/>
        				</div>
        			</div>
        		</div>
        	)
        }
        
        if (this.props.show_search != false) {
            search_col = <div className="col-3">
                			<input name="search" className="form-control form-control-sm fs14" placeholder="&#xF002;    Cari" style={search_style} onKeyDown={this.searchEnter} autoComplete="off"/>
                		</div>
        }
        
        return(
            <div>
            	<form method="GET" className="row mx-0 justify-content-end" id="search_bar">
            		{search_col}
            		{date_col}
            		{sort_col}
            	</form>
            </div>
        )
    }
}