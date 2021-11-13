class TrialBalance extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': [],
            'loaded': false,
        }
        
        this.showJournalItems = this.showJournalItems.bind(this)
    }
    
    componentDidMount() {
        var td = this
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetcoa.vetcoa.get_trial_balance_list",
            args: {},
            callback: function(r){
                if (r.message) {
                    console.log(r.message)
                    r.message.forEach(m => m.show_journal_items = false)
                    td.setState({'data': r.message, 'loaded': true});
                }
            }
        });
    }
    
    showJournalItems(i){
        var new_data = this.state.data.slice()
        
        if(!new_data[i].show_journal_items){
            if(new_data[i].journal_items == undefined){
                var th = this
                frappe.call({
                    type: "GET",
                    method:"vet_website.vet_website.doctype.vetjournalitem.vetjournalitem.get_journal_item_list",
                    args: {filters: {account: new_data[i].name}},
                    callback: function(r){
                        if (r.message) {
                            console.log(r.message)
                            new_data[i].journal_items = r.message.journal_items
                            new_data[i].show_journal_items = true
                            th.setState({data: new_data});
                        }
                    }
                });
            }
            else{
                new_data[i].show_journal_items = true
                this.setState({data: new_data})
            }
        }
        else{
            new_data[i].show_journal_items = false
            this.setState({data: new_data})
        }
    }
    
    render() {
		var row_style2 = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '2px', 'marginBottom': '18px', 'height': '72px'}
        var sorts = []
        if (this.state.loaded){
            return(
                <div>
                    <div className="row mx-0" style={row_style2}>
                        <div className="col-8 ml-auto my-auto">
                            <SearchBar sorts={sorts} searchAction={this.actionSearch} show_date={true}/>
                        </div>
                    </div>
                    <TrialBalanceAccountList items={this.state.data} showJournalItems={this.showJournalItems}/>
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

class TrialBalanceAccountList extends React.Component {
    render(){
        var items = this.props.items
        var panel_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px'}
        
        if(items.length != 0){
            var item_rows = []
            var th = this
            items.forEach((i, index) => item_rows.push(<TrialBalanceAccountRow item={i} key={i.name} showJournalItems={() => th.props.showJournalItems(index.toString())}/>))
            
            return(
                <div style={panel_style}>
                	{item_rows}
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

class TrialBalanceAccountRow extends React.Component {
    render(){
        var item = this.props.item
        var cursor = {cursor: 'pointer'}
        var row_style = {color: '#056EAD', background: '#84D1FF', borderBottom: '1px solid #C4C4C4'}
        
        var chevron_class = "fa fa-chevron-down my-auto"
        var ji_list
        if(item.show_journal_items){
            chevron_class = "fa fa-chevron-up my-auto"
            if(item.journal_items != undefined){
                ji_list = <TrialBalanceJournalItemList data={item.journal_items}/>
            }
        }
        
        return(
            <div className="mb-2">
    			<div className="row mx-0 fs14 fw600 py-2" style={row_style}>
    			    <div className="col-8">
    			        <div className="row">
    			            <div className="col-auto text-center">
            			        <p className="bg-white mb-0 rounded-lg px-2 text-truncate">{item.account_code}</p>
            			    </div>
            				<div className="col">
            					<span>{item.account_name}</span>
            				</div>
    			        </div>
    			    </div>
    				<div className="col-4">
    				    <div className="row">
    				        <div className="col-auto mr-auto">
    				            <span>{formatter2.format(item.total_debit)}</span>
    				        </div>
    				        <div className="col-auto ml-5 mr-auto">
    				            <span>{formatter2.format(item.total_credit)}</span>
    				        </div>
    				        <div className="col-auto d-flex">
            				    <i className={chevron_class} style={cursor} onClick={this.props.showJournalItems}/>
            				</div>
    				    </div>
    				</div>
    			</div>
    			{ji_list}
            </div>
        )
    }
}

class TrialBalanceJournalItemList extends React.Component {
    render(){
        var item_rows = []
        var data = this.props.data
        var panel_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px'}
        if (data.length != 0){
            var ji = this
            data.forEach(function(item, index){
                if (item.debit != 0 || item.credit != 0) {
                    item_rows.push(
                        <TrialBalanceJournalItemRow key={item.name} item={item}/>
                    )
                }
            })
            
            return(
                <div>
    	            <div className="row mx-0">
    		            <div className="col row-header">
    			            <div className="row mx-0 fs12 fw600">
                				<div className="col d-flex">
                					<span className="my-auto">Effective Date</span>
                				</div>
                				<div className="col-6 d-flex">
                					<span className="my-auto">Account</span>
                				</div>
                				<div className="col d-flex">
                					<span className="my-auto">Debit</span>
                				</div>
                				<div className="col d-flex">
                					<span className="my-auto">Credit</span>
                				</div>
            			    </div>
            		    </div>
            		</div>
        		    {item_rows}
        	    </div>
            )
        }
        else {
            return(
                <div>
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

class TrialBalanceJournalItemRow extends React.Component {
    render() {
        var item = this.props.item
        
        return(
			<div className="row mx-0">
        		<div className="col row-list row-list-link">
        			<div className="row mx-0 fs12 fw600">
        				<div className="col d-flex">
        					<span className="my-auto">{item.date}</span>
        				</div>
        				<div className="col-6 d-flex">
        					<span className="my-auto">{item.account_name}</span>
        				</div>
        				<div className="col d-flex">
        					<span className="my-auto">{formatter2.format(item.debit)}</span>
        				</div>
        				<div className="col d-flex">
        					<span className="my-auto">{formatter2.format(item.credit)}</span>
        				</div>
        			</div>
        		</div>
        	</div>
        )
    }
}

ReactDOM.render(<TrialBalance/>, document.getElementById('trial_balance_list'))