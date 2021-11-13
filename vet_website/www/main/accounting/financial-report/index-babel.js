class FinancialReport extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': {},
            'loaded': false,
            'month': moment().format('MM'),
            'year': moment().format('YYYY'),
        }
    }
    
    componentDidMount() {
        var td = this
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetcoa.vetcoa.get_financial_report_data",
            args: {},
            callback: function(r){
                if (r.message) {
                    console.log(r.message)
                    td.setState({'data': r.message, 'loaded': true});
                }
            }
        });
    }
    
    render() {
		var row_style2 = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '2px', 'marginBottom': '18px', 'height': '72px'}
        
        if (this.state.loaded){
            console.log(this.state)
            return(
                <div>
                    <div className="row mx-0" style={row_style2}>
                    </div>
                    <FinancialReportList data={this.state.data}/>
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

class FinancialReportList extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'show_operating': false,
            'show_investing': false,
            'show_financing': false,
        }
    }
    
    toggleShowOperating(){
        this.setState({'show_operating': !this.state.show_operating})
    }
    
    toggleShowInvesting(){
        this.setState({'show_investing': !this.state.show_investing})
    }
    
    toggleShowFinancing(){
        this.setState({'show_financing': !this.state.show_financing})
    }
    
    render() {
        var rows = []
        var panel_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px'}
        var title_color = {color: '#1B577B'}
        var cursor = {cursor: 'pointer'}
        var row_style = {color: '#056EAD', background: '#84D1FF', borderBottom: '1px solid #C4C4C4'}
        var row_style2 = {color: '#787E84', background: '#CEEDFF', borderBottom: '1px solid #C4C4C4'}
        var row_style3 = {color: '#1B577B', background: '#B6DBF8'}
        
        var data = this.props.data
        var operating_row = []
        var operating_list
        var operating_chevron_class = "fa fa-chevron-down my-auto"
        
        var investing_row = []
        var investing_list
        var investing_chevron_class = "fa fa-chevron-down my-auto"
        
        var financing_row = []
        var financing_list
        var financing_chevron_class = "fa fa-chevron-down my-auto"
        
        if (Object.keys(data).length != 0 ){
            var cash_from_customers = (data.revenue-data.revenue_p)-(data.piutang-data.piutang_p)
            var cash_paid_to_employees = (data.biaya_gaji-data.biaya_gaji_p)-(data.hutang_gaji-data.hutang_gaji_p)
            
            // items.forEach((i, index) => {
            //     if(i.account_type == 'Asset' && i.total > 0){
            //         asset_row.push(<FinancialReportListRow key={i.account_name} item={i}/>)
            //     }
            //     else if(i.account_type == 'Liability' && i.total > 0){
            //         liability_row.push(<FinancialReportListRow key={i.account_name} item={i}/>)
            //     }
            //     else if(i.account_type == 'Equity' && i.total > 0){
            //         equity_row.push(<FinancialReportListRow key={i.account_name} item={i}/>)
            //     }
            // })
            
            // var asset_total = items.filter(i => i.account_type == 'Asset').reduce((a,b) => a+b.total, 0)
            // var le_total = items.filter(i => ['Liability','Equity'].includes(i.account_type)).reduce((a,b) => a+b.total, 0)
            
            if(this.state.show_operating){
                operating_list = (
                    <div>
                        {operating_row}
                        <div className="row mx-0 fs14 fw600 py-2" style={row_style2}>
            				<div className="col-auto">
            					<span>Cash received from customers</span>
            				</div>
            				<div className="col-2 d-flex ml-auto">
            				    <span>{formatter2.format(cash_from_customers)}</span>
            				</div>
            			</div>
            			<div className="row mx-0 fs14 fw600 py-2" style={row_style2}>
            				<div className="col-auto">
            					<span>Cash paid to employees</span>
            				</div>
            				<div className="col-2 d-flex ml-auto">
            				    <span>{formatter2.format(cash_paid_to_employees)}</span>
            				</div>
            			</div>
            			<div className="row mx-0 fs14 fw600 py-2" style={row_style2}>
            				<div className="col-auto">
            					<span>NET CASH PROVIDED BY OPERATING ACTIVITIES</span>
            				</div>
            				<div className="col-2 d-flex ml-auto">
            				    <span>{formatter2.format(0)}</span>
            				</div>
            			</div>
                    </div>
                )
                operating_chevron_class = "fa fa-chevron-up my-auto"
            }
            
            if(this.state.show_investing){
                investing_list = (
                    <div>
                        {investing_row}
                        <div className="row mx-0 fs14 fw600 py-2" style={row_style2}>
            				<div className="col-auto">
            					<span>NET CASH PROVIDED BY INVESTING ACTIVITIES</span>
            				</div>
            				<div className="col-2 d-flex ml-auto">
            				    <span>{formatter2.format(0)}</span>
            				</div>
            			</div>
                    </div>
                )
                investing_chevron_class = "fa fa-chevron-up my-auto"
            }
            
            if(this.state.show_financing){
                financing_list = (
                    <div>
                        {financing_row}
                        <div className="row mx-0 fs14 fw600 py-2" style={row_style2}>
            				<div className="col-auto">
            					<span>NET CASH PROVIDED BY FINANCING ACTIVITIES</span>
            				</div>
            				<div className="col-2 d-flex ml-auto">
            				    <span>{formatter2.format(0)}</span>
            				</div>
            			</div>
                    </div>
                )
                financing_chevron_class = "fa fa-chevron-up my-auto"
            }
            
            return(
                <div style={panel_style}>
                	<div className="mb-4">
            			<div className="row mx-0 fs14 fw600 py-2" style={row_style}>
            				<div className="col-auto">
            					<span>Cash Flows From Operating Activities</span>
            				</div>
            				<div className="col-auto d-flex ml-auto">
            				    <i className={operating_chevron_class} style={cursor} onClick={() => this.toggleShowOperating()}/>
            				</div>
            			</div>
            			{operating_list}
        			</div>
                	<div className="mb-4">
            			<div className="row mx-0 fs14 fw600 py-2" style={row_style}>
            				<div className="col-auto">
            					<span>CASH FLOWS FROM INVESTING ACTIVITIES</span>
            				</div>
            				<div className="col-auto d-flex ml-auto">
            				    <i className={investing_chevron_class} style={cursor} onClick={() => this.toggleShowInvesting()}/>
            				</div>
            			</div>
            			{investing_list}
            			<div className="row mx-0 fs14 fw600 py-2" style={row_style}>
            				<div className="col-auto">
            					<span>CASH FLOWS FROM FINANCING ACTIVITIES</span>
            				</div>
            				<div className="col-auto d-flex ml-auto">
            				    <i className={financing_chevron_class} style={cursor} onClick={() => this.toggleShowFinancing()}/>
            				</div>
            			</div>
            			{financing_list}
        			</div>
        			<div className="mb-4">
        			    <div className="row mx-0 fs14 fw600 py-2" style={row_style3}>
            				<div className="col-auto">
            					<span>NET INCREASE (DECREASE) IN CASH</span>
            				</div>
            				<div className="col-2 d-flex ml-auto">
            				    {formatter2.format(0)}
            				</div>
            			</div>
            		</div>
            		<div className="mb-4">
        			    <div className="row mx-0 fs14 fw600 py-2" style={row_style3}>
            				<div className="col-auto">
            					<span>BEGINNING CASH BALANCE</span>
            				</div>
            				<div className="col-2 d-flex ml-auto">
            				    {formatter2.format(0)}
            				</div>
            			</div>
            			<div className="row mx-0 fs14 fw600 py-2" style={row_style3}>
            				<div className="col-auto">
            					<span>ENDING CASH BALANCE</span>
            				</div>
            				<div className="col-2 d-flex ml-auto">
            				    {formatter2.format(0)}
            				</div>
            			</div>
            		</div>
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

class FinancialReportListRow extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'show': false,
            'loaded': false
        }
        
        this.toggleShow = this.toggleShow.bind(this)
    }
    
    toggleShow(e) {
        e.stopPropagation();
        this.setState({show: !this.state.show})
        if (!this.state.loaded) {
            var td = this
            frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetcoa.vetcoa.get_coa_children",
                args: {name: this.props.item.name},
                callback: function(r){
                    if (r.message) {
                        console.log(r.message)
                        td.setState({children: r.message, loaded: true})
                    }
                }
            });
        }
    }
    
    render() {
        var item = this.props.item
        var row_style = {color: '#056EAD', background: '#CEEDFF', borderBottom: '1px solid #C4C4C4'}
        var cursor = {cursor: 'pointer'}
        var chevron_class = "fa fa-chevron-down my-auto"
        var children_row = []
        var color = {color: '#056EAD', background: '#F5FBFF', borderBottom: '1px solid #C4C4C4'}
        var transparent = {opacity: 0}
        
        if (this.state.show && this.state.loaded) {
            if (this.state.children.length != 0) {
                var cl = this
                this.state.children.forEach(function(value, index){
                    if (value.total > 0){
                        children_row.push(
                            <FinancialReportListRow key={value.account_name} item={value}/>
                        )
                    }
                })
            }
            
            chevron_class = "fa fa-chevron-up my-auto"
        }
        
        if (item.is_parent) {
            return(
                <div>
        			<div className="row mx-0 fs14 fw600 py-2" style={row_style}>
        				<div className="col-auto">
        					<span>{item.account_name}</span>
        				</div>
        				<div className="col-auto d-flex ml-auto">
        					<span>{formatter2.format(item.total)}</span>
        				</div>
        				<div className="col-auto d-flex">
        				    <i className={chevron_class} style={cursor} onClick={e => this.toggleShow(e)}/>
        				</div>
        			</div>
        			<div className="pl-2">
        			    {children_row}
        			</div>
    			</div>
            )
        } else {
            return(
                <div className="row mx-0 fw600 py-2" style={color}>
                    <div className="col-8">
                        <span>{item.account_name}</span>
                    </div>
                    <div className="col text-right">
                        <span>{formatter2.format(item.total)}</span>
                    </div>
                    <div className="col-auto d-flex">
    				    <i className="fa fa-chevron-up" style={transparent}/>
    				</div>
                </div>
            )
        }
    }
}

ReactDOM.render(<FinancialReport/>, document.getElementById('financial_report_list'))