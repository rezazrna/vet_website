class ProfitAndLoss extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': [],
            'loaded': true,
            // 'mode': 'monthly',
            // 'month': moment().format('MM'),
            // 'year': moment().format('YYYY'),
            'month': '',
            'year': '',
            'print_loading': false,
        }
    }
    
    // componentDidMount() {
    //     var td = this
        // frappe.call({
        //     type: "GET",
        //     method:"vet_website.vet_website.doctype.vetcoa.vetcoa.get_coa_list",
        //     args: {filters: {accounting_date: moment(this.state.year+'-'+this.state.month, 'YYYY-MM').add(1,'month').format('YYYY-MM-DD')}, is_profit_loss: 1},
        //     callback: function(r){
        //         if (r.message) {
        //             console.log(r.message)
        //             td.setState({'data': r.message, 'loaded': true});
        //         }
        //     }
        // });
    // }
    
    filterChange(e){
        // this.setState({loaded: false})
        var th = this
        var name = e.target.name
        var value = e.target.value
        var accounting_date
        if(name == 'month'){
            this.setState({month: value})
            // if (this.state.mode == 'monthly') {
                accounting_date = moment(this.state.year+'-'+value, 'YYYY-MM').add(1,'month').format('YYYY-MM-DD')
            // } else {
            //     accounting_date = moment(this.state.year+'-'+value, 'YYYY-MM').format('YYYY-MM-DD')
            // }
        }
        else if(name == 'year'){
            this.setState({year: value})
            if (this.state.mode == 'annual') {
                accounting_date = moment(value+'-12-31', 'YYYY-MM-DD').format('YYYY-MM-DD')
            } else {
                accounting_date = moment(value+'-'+this.state.month, 'YYYY-MM').add(1,'month').format('YYYY-MM-DD')
            } 
        }

        th.setState({accounting_date: accounting_date})
        // if(this.state.mode == 'monthly'){
        //     frappe.call({
        //         type: "GET",
        //         method:"vet_website.vet_website.doctype.vetcoa.vetcoa.get_coa_list",
        //         args: {filters: filters},
        //         callback: function(r){
        //             if (r.message) {
        //                 console.log(r.message)
        //                 th.setState({'data': r.message, 'loaded': true});
        //             }
        //         }
        //     });
        // } else if(this.state.mode == 'annual') {
        //     frappe.call({
        //         type: "GET",
        //         method:"vet_website.vet_website.doctype.vetcoa.vetcoa.get_annual_balance_sheet",
        //         args: {year: value, get_all: 1},
        //         callback: function(r){
        //             if (r.message) {
        //                 th.setState({'annual_data': r.message, loaded: true});
        //             }
        //         }
        //     });
        // }
    }
    
    setMode(e){
        var th = this
        var mode = e.target.value
        th.setState({'mode': mode, 'month': '', 'year': ''})
        // if(['monthly','annual'].includes(mode)){
        //     if(mode == 'annual' && this.state.annual_data == undefined){
        //         this.setState({loaded: false})
        //         console.log('Fetching...')
        //         frappe.call({
        //             type: "GET",
        //             method:"vet_website.vet_website.doctype.vetcoa.vetcoa.get_annual_balance_sheet",
        //             args: {year: this.state.year, get_all: 1},
        //             callback: function(r){
        //                 if (r.message) {
        //                     th.setState({'annual_data': r.message, mode: mode, loaded: true});
        //                 }
        //             }
        //         });
        //     } else {
        //         frappe.call({
        //             type: "GET",
        //             method:"vet_website.vet_website.doctype.vetcoa.vetcoa.get_coa_list",
        //             args: {filters: {accounting_date: moment(this.state.year+'-'+this.state.month, 'YYYY-MM').add(1,'month').format('YYYY-MM-DD')}},
        //             callback: function(r){
        //                 if (r.message) {
        //                     console.log(r.message)
        //                     th.setState({'data': r.message, 'mode': mode, 'loaded': true});
        //                 }
        //             }
        //         });
        //     }
        // }
    }

    setFilter(){
        var td = this
        console.log(this.state.mode)
        console.log(this.state.month)
        console.log(this.state.year)
        console.log(this.state.accounting_date)
        if ((((this.state.mode == 'monthly' || this.state.mode == 'period') && this.state.month != '') || (this.state.mode == 'annual')) && this.state.year != '') {
            td.setState({'loaded': false})
            frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetcoa.vetcoa.get_coa_list",
                args: {filters: {accounting_date: td.state.accounting_date}, mode: td.state.mode, is_profit_loss: 1},
                callback: function(r){
                    if (r.message) {
                        console.log(r.message)
                        td.setState({'data': r.message, 'loaded': true});
                    }
                }
            });
        } else {
            frappe.msgprint(('Month or Year must be selected'));
        }
    }
    
    getPrintData(){
        if ((((this.state.mode == 'monthly' || this.state.mode == 'period') && this.state.month != '') || (this.state.mode == 'annual')) && this.state.year != '') {
            var th = this
            var filters = {
                accounting_date: this.state.accounting_date
                // moment(this.state.year+'-'+this.state.month, 'YYYY-MM').add(1,'month').format('YYYY-MM-DD')
            }
            if(!this.state.print_loading){
                this.setState({print_loading: true})
                console.log(filters)
                console.log(this.state.mode)
                frappe.call({
                    type: "GET",
                    method:"vet_website.vet_website.doctype.vetcoa.vetcoa.get_coa_list",
                    args: {filters: filters, mode: this.state.mode, all_children: true, is_profit_loss: 1},
                    callback: function(r){
                        if (r.message) {
                            console.log(r.message)
                            th.setState({data: r.message, loaded: true});
                            th.printPDF()
                        }
                    }
                });
            }
        } else {
            frappe.msgprint(('Month or Year must be selected'));
        }
    }
    
    printPDF() {
        var pdfid = 'pdf'
        var format = [559,794]
        var th = this
        // var doc = new jsPDF({
        //     orientation: 'p',
        //     unit: 'pt',
        //     format: format,
        // });
        var source = document.getElementById(pdfid)
        var opt = {
            margin: [10, 0, 10, 0],
            filename: "ProfitAndLoss-"+th.state.month+"-"+th.state.year+".pdf",
            pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', '.row'] },
            html2canvas: {scale: 3},
            jsPDF: {orientation: 'p', unit: 'pt', format: [559*0.754,794*0.754]}
        }
        html2pdf().set(opt).from(source).save()
        this.setState({print_loading: false})
        // doc.html(source, {
        //   callback: function (doc) {
        //      doc.save("ProfitAndLoss-"+th.state.month+"-"+th.state.year+".pdf");
        //   },
        //   x: 0,
        //   y: 0,
        //   html2canvas: {
        //       scale: 1,
        //   }
        // });
    }
    
    render() {
		var row_style2 = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '2px', 'marginBottom': '18px', 'height': '72px'}
        var month_options = [<option className="d-none" key="99999"></option>]
		var year_options = [<option className="d-none" key="99999"></option>]
		var i
		for(i = 0; i <= 11; i++){
		    var moment_month = moment(i+1, 'M')
		    var moment_year = moment().add(-i, 'year')
		    month_options.push(<option key={moment_month.format('MM')} value={moment_month.format('MM')}>{moment_month.format('MMMM')}</option>)
		    year_options.push(<option key={moment_year.format('YYYY')}>{moment_year.format('YYYY')}</option>)
		}
        
        if (this.state.loaded){
            console.log(this.state)
            var content, pdf, print_button, month_select, sd_period
            content = <ProfitAndLossList items={this.state.data} accounting_date={this.state.accounting_date} mode={this.state.mode}/>
            pdf = <PDF data={this.state.data} month={this.state.month} year={this.state.year}/>
            print_button = <button type="button" className={this.state.print_loading?"btn btn-outline-danger disabled text-uppercase fs12 fwbold mx-2":"btn btn-outline-danger text-uppercase fs12 fwbold mx-2"} onClick={() => this.getPrintData()}>{this.state.print_loading?(<span><i className="fa fa-spin fa-circle-o-notch mr-3"/>Loading...</span>):"Print"}</button>


            if(this.state.mode == 'monthly' || this.state.mode == 'period'){

                if (this.state.mode == 'period') {
                    sd_period = <div className="col-auto my-auto mx-auto">
                                    s/d
                                </div> 
                }
                
                month_select = <div className="col-2 my-auto">
                                <select name="month" className="form-control" value={this.state.month} onChange={e => this.filterChange(e)}>
                                    {month_options}
                                </select>
                            </div>
            } 
            // else if (this.state.mode == 'annual' && this.state.annual_data != undefined){
            //     content = <ProfitAndLossAnnual items={this.state.annual_data}/>
            // }
            return(
                <div>
                    <div className="row mx-0" style={row_style2}>
                        <div className="col-auto my-auto">
                            {print_button}
                        </div>
                        <div className="col-2 my-auto ml-auto">
                            <select name="mode" className="form-control" value={this.state.mode} onChange={e => this.setMode(e)}>
                                <option className="d-none" key="99999"></option>
                                <option value="monthly">Monthly</option>
                                <option value="annual">Annual</option>
                                <option value="period">Period</option>
                            </select>
                        </div>
                        {sd_period}
                        {month_select}
                        <div className="col-2 my-auto">
                            <select name="year" className="form-control" value={this.state.year} onChange={e => this.filterChange(e)}>
                                {year_options}
                            </select>
                        </div>
                        <div className="col-2 my-auto">
                            <button type="button" className="btn btn-outline-danger text-uppercase fs12 fwbold" onClick={() => this.setFilter()}>Set</button>
                        </div>
                    </div>
                    {pdf}
                    {content}
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

class ProfitAndLossList extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            // 'show_revenue': false,
            // 'show_cogs': false,
            // 'show_operating_expense': false,
            // 'show_net_profit': false,
            // 'show_other_income': false,
            // 'show_other_expense': false,
        }
    }
    
    // toggleShowRevenue(){
    //     this.setState({'show_revenue': !this.state.show_revenue})
    // }
    
    // toggleShowCogs(){
    //     this.setState({'show_cogs': !this.state.show_cogs})
    // }
    
    // toggleShowOperatingExpense(){
    //     this.setState({'show_operating_expense': !this.state.show_operating_expense})
    // }
    
    // toggleShowNetProfit(){
    //     this.setState({'show_net_profit': !this.state.show_net_profit})
    // }
    
    // toggleShowOtherIncome(){
    //     this.setState({'show_other_income': !this.state.show_other_income})
    // }
    
    // toggleShowOtherExpense(){
    //     this.setState({'show_other_expense': !this.state.show_other_expense})
    // }
    
    render() {
        var rows = []
        var rows2 = []
        var panel_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px'}
        var title_color = {color: '#1B577B'}
        var cursor = {cursor: 'pointer'}
        var row_style = {color: '#056EAD', background: '#84D1FF', borderBottom: '1px solid #C4C4C4'}
        var row_style3 = {color: '#1B577B', background: '#B6DBF8'}
        var row_style4 = {background: '#D6DCDF'}
        var items = this.props.items
        var space_width = {width: '56px'}
        var label_width = {width: '90.4px'}
        var total_style = {color: '#056EAD', background: '#84D1FF', 'boxShadow': '0px 6px 23px rgba(0, 0, 0, 0.1)', borderRadius: '5px'}
        var chevron_class = "fa fa-chevron-down my-auto"
        // var revenue_row = []
        // var revenue_list
        // var revenue_chevron_class = "fa fa-chevron-down my-auto"
        
        // var cogs_row = []
        // var cogs_list
        // var cogs_chevron_class = "fa fa-chevron-down my-auto"
        
        // var operating_expense_row = []
        // var operating_expense_list
        // var operating_expense_chevron_class = "fa fa-chevron-down my-auto"
        
        // var net_profit_row = []
        // var net_profit_list
        // var net_profit_chevron_class = "fa fa-chevron-down my-auto"
        
        // var other_income_row = []
        // var other_income_list
        // var other_income_chevron_class = "fa fa-chevron-down my-auto"
        
        // var other_expense_row = []
        // var other_expense_list
        // var other_expense_chevron_class = "fa fa-chevron-down my-auto"
        
        if (items.length != 0 ){
            
            items.forEach((i, index) => {
                if(i.account_code.match(/^4-.*$/) || i.account_code.match(/^5-.*$/)){
                    rows.push(<div className="mb-2">
                            <ProfitAndLossListRow key={i.account_name} item={i} accounting_date={this.props.accounting_date} mode={this.props.mode}/>
                            </div>)
                } else {
                    rows2.push(<div className="mb-2">
                            <ProfitAndLossListRow key={i.account_name} item={i} accounting_date={this.props.accounting_date} mode={this.props.mode}/>
                            </div>)
                }
                // else if(i.account_code.match(/^5-.*$/)){
                //     cogs_row.push(<ProfitAndLossListRow key={i.account_name} item={i} month={this.props.month} year={this.props.year}/>)
                // }
                // else if(i.account_code.match(/^6-.*$/)){
                //     operating_expense_row.push(<ProfitAndLossListRow key={i.account_name} item={i} month={this.props.month} year={this.props.year}/>)
                // }
                // else if(i.account_code.match(/^7-.*$/)){
                //     other_income_row.push(<ProfitAndLossListRow key={i.account_name} item={i} month={this.props.month} year={this.props.year}/>)
                // }
                // else if(i.account_code.match(/^8-.*$/)){
                //     other_expense_row.push(<ProfitAndLossListRow key={i.account_name} item={i} month={this.props.month} year={this.props.year}/>)
                // }
            })
            
            var revenue_total = items.filter(i => i.account_code.match(/^4-.*$/)).reduce((a,b) => a+b.total, 0)
            var cogs_total = items.filter(i => i.account_code.match(/^5-.*$/)).reduce((a,b) => a+b.total, 0)
            var operating_expense_total = items.filter(i => i.account_code.match(/^6-.*$/)).reduce((a,b) => a+b.total, 0)
            var gross_profit = revenue_total - cogs_total
            var net_operating_income = gross_profit - operating_expense_total
            var other_income_total = items.filter(i => i.account_code.match(/^7-.*$/)).reduce((a,b) => a+b.total, 0)
            var other_expense_total = items.filter(i => i.account_code.match(/^8-.*$/)).reduce((a,b) => a+b.total, 0)
            
            // if(this.state.show_revenue){
            //     revenue_list = <div className="pl-2">{revenue_row}</div>
            //     revenue_chevron_class = "fa fa-chevron-up my-auto"
            // }
            
            // if(this.state.show_cogs){
            //     cogs_list = <div className="pl-2">{cogs_row}</div>
            //     cogs_chevron_class = "fa fa-chevron-up my-auto"
            // }
            
            // if(this.state.show_operating_expense){
            //     operating_expense_list = <div className="pl-2">{operating_expense_row}</div>
            //     operating_expense_chevron_class = "fa fa-chevron-up my-auto"
            // }
            
            // if(this.state.show_net_profit){
            //     net_profit_list = <div className="pl-2">{net_profit_row}</div>
            //     net_profit_chevron_class = "fa fa-chevron-up my-auto"
            // }
            
            // if(this.state.show_other_income){
            //     other_income_list = <div className="pl-2">{other_income_row}</div>
            //     other_income_chevron_class = "fa fa-chevron-up my-auto"
            // }
            
            // if(this.state.show_other_expense){
            //     other_expense_list = <div className="pl-2">{other_expense_row}</div>
            //     other_expense_chevron_class = "fa fa-chevron-up my-auto"
            // }
            
            return(
                <div style={panel_style}>
                    {rows}
                    <div className="mb-4">
            			<div className="row mx-0 fs14 fw600 py-2" style={row_style4}>
            				<div className="col-auto">
            					<span>Gross Profit</span>
            				</div>
            				<div className="col-auto d-flex ml-auto">
            				    {formatter2.format(gross_profit)}
            				</div>
                            <div className="col-1"></div>
            			</div>
            		</div>
                    {rows2}
                    <div className="mb-4">
            			<div className="row mx-0 fs14 fw600 py-2" style={row_style4}>
            				<div className="col-auto">
            					<span>Profit / Loss</span>
            				</div>
            				<div className="col-auto d-flex ml-auto">
            				    {formatter2.format(net_operating_income + other_income_total - other_expense_total)}
            				</div>
                            <div className="col-1"></div>
            			</div>
        			</div>
                	{/* <div className="mb-4">
            			<div className="row mx-0 fs14 fw600 py-2" style={row_style}>
            				<div className="col-auto">
            					<span>Revenue</span>
            				</div>
            				<div className="col-auto d-flex ml-auto">
            				    <i className={revenue_chevron_class} style={cursor} onClick={() => this.toggleShowRevenue()}/>
            				</div>
            			</div>
            			{revenue_list}
            			<div className="row mx-0 fs14 fw600 py-2" style={row_style3}>
            				<div className="col-auto">
            					<span>Total Revenue</span>
            				</div>
            				<div className="col-2 d-flex ml-auto">
            				    {formatter2.format(revenue_total)}
            				</div>
            			</div>
            			<div className="row mx-0 fs14 fw600 py-2" style={row_style}>
            				<div className="col-auto">
            					<span>Cost of Goods Sold</span>
            				</div>
            				<div className="col-auto d-flex ml-auto">
            				    <i className={cogs_chevron_class} style={cursor} onClick={() => this.toggleShowCogs()}/>
            				</div>
            			</div>
            			{cogs_list}
            			<div className="row mx-0 fs14 fw600 py-2" style={row_style3}>
            				<div className="col-auto">
            					<span>Total Cost of Goods Sold</span>
            				</div>
            				<div className="col-2 d-flex ml-auto">
            				    {formatter2.format(cogs_total)}
            				</div>
            			</div>
        			</div>
                	<div className="mb-4">
            			<div className="row mx-0 fs14 fw600 py-2" style={row_style4}>
            				<div className="col-auto">
            					<span>Gross Profit</span>
            				</div>
            				<div className="col-2 d-flex ml-auto">
            				    {formatter2.format(gross_profit)}
            				</div>
            			</div>
            		</div>
                	<div className="mb-4">
            			<div className="row mx-0 fs14 fw600 py-2" style={row_style}>
            				<div className="col-auto">
            					<span>Operating Expense</span>
            				</div>
            				<div className="col-auto d-flex ml-auto">
            				    <i className={operating_expense_chevron_class} style={cursor} onClick={() => this.toggleShowOperatingExpense()}/>
            				</div>
            			</div>
            			{operating_expense_list}
            			<div className="row mx-0 fs14 fw600 py-2" style={row_style3}>
            				<div className="col-auto">
            					<span>Total Operating Expense</span>
            				</div>
            				<div className="col-2 d-flex ml-auto">
            				    {formatter2.format(operating_expense_total)}
            				</div>
            			</div>
        			</div>
        			<div className="mb-4">
            			<div className="row mx-0 fs14 fw600 py-2" style={row_style4}>
            				<div className="col-auto">
            					<span>Net Operating Income</span>
            				</div>
            				<div className="col-2 d-flex ml-auto">
            				    {formatter2.format(net_operating_income)}
            				</div>
            			</div>
        			</div>
        			<div className="mb-4">
            			<div className="row mx-0 fs14 fw600 py-2" style={row_style}>
            				<div className="col-auto">
            					<span>Other Income</span>
            				</div>
            				<div className="col-auto d-flex ml-auto">
            				    <i className={other_income_chevron_class} style={cursor} onClick={() => this.toggleShowOtherIncome()}/>
            				</div>
            			</div>
            			{other_income_list}
            			<div className="row mx-0 fs14 fw600 py-2" style={row_style3}>
            				<div className="col-auto">
            					<span>Total Other Income</span>
            				</div>
            				<div className="col-2 d-flex ml-auto">
            				    {formatter2.format(other_income_total)}
            				</div>
            			</div>
            			<div className="row mx-0 fs14 fw600 py-2" style={row_style}>
            				<div className="col-auto">
            					<span>Other Expense</span>
            				</div>
            				<div className="col-auto d-flex ml-auto">
            				    <i className={other_expense_chevron_class} style={cursor} onClick={() => this.toggleShowOtherExpense()}/>
            				</div>
            			</div>
            			{other_expense_list}
            			<div className="row mx-0 fs14 fw600 py-2" style={row_style3}>
            				<div className="col-auto">
            					<span>Total Other Expense</span>
            				</div>
            				<div className="col-2 d-flex ml-auto">
            				    {formatter2.format(other_expense_total)}
            				</div>
            			</div>
        			</div>
        			<div className="mb-4">
            			<div className="row mx-0 fs14 fw600 py-2" style={row_style4}>
            				<div className="col-auto">
            					<span>Net Profit (Loss)</span>
            				</div>
            				<div className="col-2 d-flex ml-auto">
            				    {formatter2.format(net_operating_income + other_income_total - other_expense_total)}
            				</div>
            			</div>
        			</div> */}
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

class ProfitAndLossListRow extends React.Component {
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
        console.log(this.props.accounting_date)
        console.log(this.props.mode)
        if (!this.state.loaded) {
            var td = this
            // var accounting_date = moment(this.props.year+'-'+this.props.month, 'YYYY-MM').add(1,'month').format('YYYY-MM-DD')
            frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetcoa.vetcoa.get_coa_children",
                args: {name: this.props.item.name, max_date: td.props.accounting_date, mode: td.props.mode},
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
        var chevron_class = "fa fa-chevron-down my-auto ml-auto"
        var children_row = []
        var color = {color: '#056EAD', background: '#F5FBFF', borderBottom: '1px solid #C4C4C4'}
        var transparent = {opacity: 0}
        
        if (this.state.show && this.state.loaded) {
            if (this.state.children.length != 0) {
                var cl = this
                this.state.children.forEach(function(value, index){
                    if (value.total > 0){
                        children_row.push(
                            <ProfitAndLossListRow key={value.account_name} item={value} accounting_date={cl.props.accounting_date} mode={cl.props.mode}/>
                        )
                    }
                })
            }
            
            chevron_class = "fa fa-chevron-up my-auto ml-auto"
        }
        
        if (item.is_parent) {
            return(
                <div>
        			<div className="row mx-0 fs14 fw600 py-2" style={row_style}>
        				<div className="col-auto">
        					<span>{item.account_name}</span>
        				</div>
        				<div className="col-auto d-flex ml-auto">
        					<span>{formatter3.format(item.total)}</span>
        				</div>
        				<div className="col-1 d-flex">
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
                        <span>{formatter3.format(item.total)}</span>
                    </div>
                    <div className="col-1 d-flex">
    				    <i className="fa fa-chevron-up" style={transparent}/>
    				</div>
                </div>
            )
        }
    }
}

// class ProfitAndLossAnnual extends React.Component {
//     constructor(props) {
//         super(props)
//         this.state = {
//             'show_revenue': false,
//             'show_cogs': false,
//             'show_operating_expense': false,
//             'show_net_profit': false,
//             'show_other_income': false,
//             'show_other_expense': false,
//         }
//     }
    
//     toggleShowRevenue(){
//         this.setState({'show_revenue': !this.state.show_revenue})
//     }
    
//     toggleShowCogs(){
//         this.setState({'show_cogs': !this.state.show_cogs})
//     }
    
//     toggleShowOperatingExpense(){
//         this.setState({'show_operating_expense': !this.state.show_operating_expense})
//     }
    
//     toggleShowNetProfit(){
//         this.setState({'show_net_profit': !this.state.show_net_profit})
//     }
    
//     toggleShowOtherIncome(){
//         this.setState({'show_other_income': !this.state.show_other_income})
//     }
    
//     toggleShowOtherExpense(){
//         this.setState({'show_other_expense': !this.state.show_other_expense})
//     }
    
//     render() {
//         var revenue_rows = []
//         var cogs_rows = []
//         var operating_expense_rows = []
//         var other_income_rows = []
//         var other_expense_rows = []
        
//         var revenue_cols = []
//         var cogs_cols = []
//         var gross_profit_cols = []
//         var operating_expense_cols = []
//         var net_operating_income_cols = []
//         var other_income_cols = []
//         var other_expense_cols = []
//         var net_profit_cols = []
//         var month_cols = []
        
//         var panel_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px'}
//         var headerBorder = {borderBottom: '2px solid #1B577B', color: '#1B577B', background: '#84D1FF', position: 'sticky', zIndex: 1, top: 0}
//         var row_style3 = {color: '#1B577B', background: '#B6DBF8', cursor: 'pointer'}
//         var row_style4 = {background: '#D6DCDF'}
//         var items = this.props.items
//         var divStyle = {minHeight: 552, position: 'relative', overflow: 'auto'}
//         var colWidth = {width: '6.5%'}
//         var colWidth2 = {width: '15.5%', position: 'sticky', left: 0, background: "inherit", boxShadow: "1px 0px 1px #0003"}
//         var contentStyle = {position: 'absolute', top: 0, left: 0, minWidth: 2100, width: '100%'}
        
//         if (items.length != 0 ){
            
//             items.forEach((i, index) => {
//                 if(i.account_code.match(/^4-.*$/)){
//                     revenue_rows.push(<ProfitAndLossAnnualRow key={i.account_name} item={i}/>)
//                 }
//                 else if(i.account_code.match(/^5-.*$/)){
//                     cogs_rows.push(<ProfitAndLossAnnualRow key={i.account_name} item={i}/>)
//                 }
//                 else if(i.account_code.match(/^6-.*$/)){
//                     operating_expense_rows.push(<ProfitAndLossAnnualRow key={i.account_name} item={i}/>)
//                 }
//                 else if(i.account_code.match(/^7-.*$/)){
//                     other_income_rows.push(<ProfitAndLossAnnualRow key={i.account_name} item={i}/>)
//                 }
//                 else if(i.account_code.match(/^8-.*$/)){
//                     other_expense_rows.push(<ProfitAndLossAnnualRow key={i.account_name} item={i}/>)
//                 }
//             })
            
//             for(var i = 0;i<=12;i++){
//                 month_cols.push(<div className="fwbold px-1 py-2 text-right" key={i} style={colWidth}>{i<=11?moment(i+1, 'M').format('MMMM YYYY'):'Total'}</div>)
                
//                 var revenue_total = items.filter(i => i.account_code.match(/^4-.*$/)).reduce((a,b) => a+b.total[i].total, 0)
//                 revenue_cols.push(<div className="px-1 py-2 text-right" key={i} style={colWidth}>{formatter2.format(revenue_total)}</div>)
                
//                 var cogs_total = items.filter(i => i.account_code.match(/^5-.*$/)).reduce((a,b) => a+b.total[i].total, 0)
//                 cogs_cols.push(<div className="px-1 py-2 text-right" key={i} style={colWidth}>{formatter2.format(cogs_total)}</div>)
                
//                 var operating_expense_total = items.filter(i => i.account_code.match(/^6-.*$/)).reduce((a,b) => a+b.total[i].total, 0)
//                 operating_expense_cols.push(<div className="px-1 py-2 text-right" key={i} style={colWidth}>{formatter2.format(operating_expense_total)}</div>)
                
//                 var gross_profit = revenue_total - cogs_total
//                 gross_profit_cols.push(<div className="px-1 py-2 text-right" key={i} style={colWidth}>{formatter2.format(gross_profit)}</div>)
                
//                 var net_operating_income = gross_profit - operating_expense_total
//                 net_operating_income_cols.push(<div className="px-1 py-2 text-right" key={i} style={colWidth}>{formatter2.format(net_operating_income)}</div>)
                
//                 var other_income_total = items.filter(i => i.account_code.match(/^7-.*$/)).reduce((a,b) => a+b.total[i].total, 0)
//                 other_income_cols.push(<div className="px-1 py-2 text-right" key={i} style={colWidth}>{formatter2.format(other_income_total)}</div>)
                
//                 var other_expense_total = items.filter(i => i.account_code.match(/^8-.*$/)).reduce((a,b) => a+b.total[i].total, 0)
//                 other_expense_cols.push(<div className="px-1 py-2 text-right" key={i} style={colWidth}>{formatter2.format(other_expense_total)}</div>)
                
//                 var net_profit = net_operating_income + other_income_total - other_expense_total
//                 net_profit_cols.push(<div className="px-1 py-2 text-right" key={i} style={colWidth}>{formatter2.format(net_profit)}</div>)
//             }
            
//             var revenue_list, cogs_list, operating_expense_list, other_income_list, other_expense_list
            
//             if(this.state.show_revenue){
//                 revenue_list = <div>{revenue_rows}</div>
//             }
            
//             if(this.state.show_cogs){
//                 cogs_list = <div>{cogs_rows}</div>
//             }
            
//             if(this.state.show_operating_expense){
//                 operating_expense_list = <div>{operating_expense_rows}</div>
//             }
            
//             if(this.state.show_other_income){
//                 other_income_list = <div>{other_income_rows}</div>
//             }
            
//             if(this.state.show_other_expense){
//                 other_expense_list = <div>{other_expense_rows}</div>
//             }
            
//             return(
//                 <div style={panel_style}>
//                 	<div style={divStyle}>
//                 	    <div style={contentStyle}>
//                 	        <div className="row mx-0" style={headerBorder}>
//                 	            <div className="fwbold px-3 py-2" style={colWidth2}>
//                 	                Description
//                 	            </div>
//                 	            {month_cols}
//                 	        </div>
//                 	        <div className="row mx-0 border-bottom border-white" style={row_style3} onClick={() => this.toggleShowRevenue()}>
//                 	            <div className="fwbold px-3 py-2" style={colWidth2}>
//                 	                Revenue
//                 	            </div>
//                 	            {revenue_cols}
//                 	        </div>
//                 	        {revenue_list}
//                 	        <div className="row mx-0 border-bottom border-white" style={row_style3} onClick={() => this.toggleShowCogs()}>
//                 	            <div className="fwbold px-3 py-2" style={colWidth2}>
//                 	                Cost of Goods Sold
//                 	            </div>
//                 	            {cogs_cols}
//                 	        </div>
//                 	        {cogs_list}
//                 	        <div className="row mx-0 my-2 border-bottom border-white" style={row_style4}>
//                 	            <div className="fwbold px-3 py-2" style={colWidth2}>
//                 	                Gross Profit
//                 	            </div>
//                 	            {gross_profit_cols}
//                 	        </div>
//                 	        <div className="row mx-0 border-bottom border-white" style={row_style3} onClick={() => this.toggleShowOperatingExpense()}>
//                 	            <div className="fwbold px-3 py-2" style={colWidth2}>
//                 	                Operating Expense
//                 	            </div>
//                 	            {operating_expense_cols}
//                 	        </div>
//                 	        {operating_expense_list}
//                 	        <div className="row mx-0 my-2 border-bottom border-white" style={row_style4}>
//                 	            <div className="fwbold px-3 py-2" style={colWidth2}>
//                 	                Net Operating Income
//                 	            </div>
//                 	            {net_operating_income_cols}
//                 	        </div>
//                 	        <div className="row mx-0 border-bottom border-white" style={row_style3} onClick={() => this.toggleShowOtherIncome()}>
//                 	            <div className="fwbold px-3 py-2" style={colWidth2}>
//                 	                Other Income
//                 	            </div>
//                 	            {other_income_cols}
//                 	        </div>
//                 	        {other_income_list}
//                 	        <div className="row mx-0 border-bottom border-white" style={row_style3} onClick={() => this.toggleShowOtherExpense()}>
//                 	            <div className="fwbold px-3 py-2" style={colWidth2}>
//                 	                Other Expense
//                 	            </div>
//                 	            {other_expense_cols}
//                 	        </div>
//                 	        {other_expense_list}
//                 	        <div className="row mx-0 my-2 border-bottom border-white" style={row_style4}>
//                 	            <div className="fwbold px-3 py-2" style={colWidth2}>
//                 	                Net Profit (Loss)
//                 	            </div>
//                 	            {net_profit_cols}
//                 	        </div>
//                 	    </div>
//                 	</div>
//                 </div>
//             )
//         }
//         else {
//             return(
//                 <div style={panel_style}>
//                     <div className="row justify-content-center" key='0'>
//                         <div className="col-10 col-md-8 text-center border rounded-lg py-4">
//                             <p className="mb-0 fs24md fs16 fw600 text-muted">
//                                 <span>Item tidak ditemukan</span>
//                             </p>
//                         </div>
//                     </div>
//                 </div>
//             )
//         }
//     }
// }

// class ProfitAndLossAnnualRow extends React.Component {
//     constructor(props) {
//         super(props)
//         this.state = {
//             'show': false,
//             'loaded': false
//         }
        
//         this.toggleShow = this.toggleShow.bind(this)
//     }
    
//     toggleShow(e) {
//         console.log('Halo')
//         e.stopPropagation();
//         this.setState({show: !this.state.show})
//         if (!this.state.loaded) {
//             var td = this
//             frappe.call({
//                 type: "GET",
//                 method:"vet_website.vet_website.doctype.vetcoa.vetcoa.get_annual_balance_sheet",
//                 args: {name: this.props.item.name, get_all: 1},
//                 callback: function(r){
//                     if (r.message) {
//                         td.setState({children: r.message, loaded: true})
//                     }
//                 }
//             });
//         }
//     }
    
//     render() {
//         var item = this.props.item
//         var cols = []
//         var row_style3 = {color: '#1B577B', background: '#B6DBF8', cursor: 'pointer'}
//         var children_row = []
//         var colWidth = {width: '6.5%'}
//         var colWidth2 = {width: '15.5%', position: 'sticky', left: 0, background: "inherit", boxShadow: "1px 0px 1px #0003"}
        
//         if (this.state.loaded) {
//             if (this.state.children.length != 0) {
//                 var cl = this
//                 this.state.children.forEach(function(value, index){
//                     children_row.push(
//                         <ProfitAndLossAnnualRow key={value.account_name} item={value}/>
//                     )
//                 })
//             }
//         } else if (!this.state.loaded){
//             children_row.push(
//                 <div className="row mx-0 py-2" key="loading">
//                     <div className="col-auto">
//                         <span><i className="fa fa-spin fa-circle-o-notch mr-3"></i>Loading...</span>
//                     </div>
//                 </div>
//             )
//         }
        
//         if (item.is_parent) {
            
//             for(var i = 0;i<=11;i++){
//                 cols.push(<div className="px-1 py-2 text-right" key={i} style={colWidth}>{formatter2.format(item.total[i].total)}</div>)
//             }
            
//             return(
//                 <div>
//         			<div className="row mx-0 border-bottom border-white" style={row_style3} onClick={e => this.toggleShow(e)}>
//         	            <div className="fwbold py-2 px-3" style={colWidth2}>
//         	                {item.account_code+" "+item.account_name}
//         	            </div>
//         	            {cols}
//         	        </div>
//         			<div className={!this.state.show?'d-none':''}>
//         			    {children_row}
//         			</div>
//     			</div>
//             )
//         } else {
//             for(var i = 0;i<=11;i++){
//                 cols.push(<div className="px-1 py-2 text-right" key={i} style={colWidth}>{formatter2.format(item.total[i].total)}</div>)
//             }
            
//             return(
//                 <div>
//         			<div className="row mx-0 border-bottom bg-white">
//         	            <div className="fwbold py-2 px-3" style={colWidth2}>
//         	                {item.account_name}
//         	            </div>
//         	            {cols}
//         	        </div>
//     			</div>
//             )
//         }
//     }
// }

class PDF extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            'profile': {},
            'loaded': false,
        }
    }
    
    componentDidMount() {
        var ci = this
        
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetprofile.vetprofile.get_profile",
            args: {},
            callback: function(r){
                if (r.message) {
                    ci.setState({'profile': r.message.profile, 'loaded': true});
                }
            }
        });
    }
    
    render(){
        var data = this.props.data
        var profile = this.state.profile
        console.log(data)
        var page_dimension = {width: 559, minHeight: 794, top:0, right: 0, background: '#FFF', color: '#000', zIndex: -1}
        var borderStyle = {border: '1px solid #000', margin: '15px 0'}
        var borderTop = {borderTop: '1px solid #000'}
        var row2 = {margin: '0 -14px'}
        var th = {border: '1px solid #000'}
        var td = {borderLeft: '1px solid #000', borderRight: '1px solid #000'}
        var fs11 = {fontSize: 11}
        var fs13 = {fontSize: 13}
        var fs9 = {fontSize: 9}
        var invoice = {letterSpacing: 0, lineHeight: '24px', marginBottom: 0, marginTop: 18}
        var invoice2 = {letterSpacing: 0}
        var thead = {background: '#d9d9d9', fontSize: 11}
        
        function addRow(data, initial_padding=0, padding_increment=0){
            var next_padding = initial_padding+padding_increment
            var style = {paddingLeft: initial_padding}
            var table_rows = []
            data.forEach((d, index) => {
                table_rows.push(
                    <tr key={d.name} style={fs9}>
                        <td className="py-1" style={style}>{d.account_code+" "+d.account_name}</td>
                        <td className="py-1" >{formatter.format(d.total)}</td>
                    </tr>
                )
                if(d.children && d.children.length > 0){
                    var d_children = addRow(d.children.filter(i => i.total != 0), next_padding, padding_increment)
                    table_rows = [...table_rows, ...d_children]
                }
            })
            return table_rows
        }
        
        var revenue_total = data.filter(i => i.account_code.match(/^4-.*$/)).reduce((a,b) => a+b.total, 0)
        var cogs_total = data.filter(i => i.account_code.match(/^5-.*$/)).reduce((a,b) => a+b.total, 0)
        var operating_expense_total = data.filter(i => i.account_code.match(/^6-.*$/)).reduce((a,b) => a+b.total, 0)
        var gross_profit = revenue_total - cogs_total
        var net_operating_income = gross_profit - operating_expense_total
        var other_income_total = data.filter(i => i.account_code.match(/^7-.*$/)).reduce((a,b) => a+b.total, 0)
        var other_expense_total = data.filter(i => i.account_code.match(/^8-.*$/)).reduce((a,b) => a+b.total, 0)
        
        var revenue_rows = addRow(data.filter(i => i.account_code.match(/^4-.*$/) && i.total != 0), 5, 8)
        revenue_rows.push(
            <tr key='revenue_total_spacer'>
                <td className="pb-1"/>
            </tr>
        )
        revenue_rows.push(
            <tr key='revenue_total' className="fs12" style={borderTop}>
                <td className="py-1 text-center text-uppercase fw700">Total Revenue</td>
                <td className="py-1">{formatter.format(revenue_total)}</td>
            </tr>
        )
        
        var cogs_rows = addRow(data.filter(i => i.account_code.match(/^5-.*$/) && i.total != 0), 5, 8)
        cogs_rows.push(
            <tr key='cogs_total_spacer'>
                <td className="pb-1"/>
            </tr>
        )
        cogs_rows.push(
            <tr key='cogs_total' className="fs12" style={borderTop}>
                <td className="py-1 text-center text-uppercase fw700">Total Cost of Goods Sold</td>
                <td className="py-1">{formatter.format(cogs_total)}</td>
            </tr>
        )
        cogs_rows.push(
            <tr key="gross_profit" className="text-center" style={thead}>
	            <td className="fw700 py-2">Gross Profit</td>
	            <td className="fw700 py-2">{formatter.format(gross_profit)}</td>
	        </tr>
        )
        
        var operating_expense_rows = addRow(data.filter(i => i.account_code.match(/^6-.*$/) && i.total != 0), 5, 8)
        operating_expense_rows.push(
            <tr key='operating_expense_total_spacer'>
                <td className="pb-1"/>
            </tr>
        )
        operating_expense_rows.push(
            <tr key='operating_expense_total' className="fs12" style={borderTop}>
                <td className="py-1 text-center text-uppercase fw700">Total Operating Expense</td>
                <td className="py-1">{formatter.format(operating_expense_total)}</td>
            </tr>
        )
        operating_expense_rows.push(
            <tr key="net_operating_income" className="text-center" style={thead}>
	            <td className="fw700 py-2">Net Operating Income</td>
	            <td className="fw700 py-2">{formatter.format(net_operating_income)}</td>
	        </tr>
        )
        
        var other_income_rows = addRow(data.filter(i => i.account_code.match(/^7-.*$/) && i.total != 0), 5, 8)
        other_income_rows.push(
            <tr key='other_income_total_spacer'>
                <td className="pb-1"/>
            </tr>
        )
        other_income_rows.push(
            <tr key='other_income_total' className="fs12" style={borderTop}>
                <td className="py-1 text-center text-uppercase fw700">Total Other Income</td>
                <td className="py-1">{formatter.format(other_income_total)}</td>
            </tr>
        )
        
        var other_expense_rows = addRow(data.filter(i => i.account_code.match(/^8-.*$/) && i.total != 0), 5, 8)
        other_expense_rows.push(
            <tr key='other_expense_total_spacer'>
                <td className="pb-1"/>
            </tr>
        )
        other_expense_rows.push(
            <tr key='other_expense_total' className="fs12" style={borderTop}>
                <td className="py-1 text-center text-uppercase fw700">Total Other Expense</td>
                <td className="py-1">{formatter.format(other_expense_total)}</td>
            </tr>
        )
        other_expense_rows.push(
            <tr key="net_profit_loss" className="text-center" style={thead}>
	            <td className="fw700 py-2">Net Profit (Loss)</td>
	            <td className="fw700 py-2">{formatter2.format(net_operating_income + other_income_total - other_expense_total)}</td>
	        </tr>
        )

        if (this.state.loaded) {
            var image
            if (profile.image != undefined){
                var image_style = {position: 'absolute', top: 0, left: 0, objectFit: 'cover', height: '100%'}
                image = <img src={profile.temp_image || profile.image} style={image_style}/>
            } else {
                image = <img src={profile.temp_image} style={image_style} />
            }

            return(
                <div className="position-absolute d-none" style={page_dimension}>
                    <div id="pdf" className="px-4" style={page_dimension}>
                        <div className="row">
                            <div className="col-2 px-0">
                                {image}
                                {/* <img className="mt-3" src="/static/img/main/menu/naturevet_logo_2x.png"/> */}
                            </div>
                            <div className="col-6">
                                <p className="my-3 fwbold text-uppercase" style={fs13}>{profile.clinic_name}</p>
                                <p className="my-0" style={fs9}>{profile.address}</p>
                                <p className="my-0" style={fs9}>Telp. : {profile.phone}</p>
                            </div>
                            <div className="col-4 px-0">
                                <p className="fwbold text-right text-uppercase fs28" style={invoice}>Profit & Loss</p>
                                <p className="fw600 text-right text-uppercase fs14" style={invoice2}>{this.props.month+"/"+this.props.year}</p>
                            </div>
                            <div className="col-12" style={borderStyle}/>
                        </div>
                        <div className="row">
                            <div className="col-12 text-uppercase text-center fw700 py-2">
                                Revenue
                            </div>
                        </div>
                        <table className="fs12" style={row2}>
                            <thead className="text-uppercase">
                                <tr className="text-center" style={thead}>
                                    <th className="fw700 py-2" width="419px" >Account</th>
                                    <th className="fw700 py-2" width="140px" >Nominal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {revenue_rows}
                            </tbody>
                        </table>
                        <div className="row mt-3">
                            <div className="col-12 text-uppercase text-center fw700 py-2">
                                Cost of Goods Sold
                            </div>
                        </div>
                        <table className="fs12" style={row2}>
                            <thead className="text-uppercase">
                                <tr className="text-center" style={thead}>
                                    <th className="fw700 py-2" width="419px" >Account</th>
                                    <th className="fw700 py-2" width="140px" >Nominal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cogs_rows}
                            </tbody>
                        </table>
                        <div className="row mt-3">
                            <div className="col-12 text-uppercase text-center fw700 py-2">
                                Operating Expense
                            </div>
                        </div>
                        <table className="fs12" style={row2}>
                            <thead className="text-uppercase">
                                <tr className="text-center" style={thead}>
                                    <th className="fw700 py-2" width="419px" >Account</th>
                                    <th className="fw700 py-2" width="140px" >Nominal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {operating_expense_rows}
                            </tbody>
                        </table>
                        <div className="row mt-3">
                            <div className="col-12 text-uppercase text-center fw700 py-2">
                                Other Income
                            </div>
                        </div>
                        <table className="fs12" style={row2}>
                            <thead className="text-uppercase">
                                <tr className="text-center" style={thead}>
                                    <th className="fw700 py-2" width="419px" >Account</th>
                                    <th className="fw700 py-2" width="140px" >Nominal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {other_income_rows}
                            </tbody>
                        </table>
                        <div className="row mt-3">
                            <div className="col-12 text-uppercase text-center fw700 py-2">
                                Other Expense
                            </div>
                        </div>
                        <table className="fs12" style={row2}>
                            <thead className="text-uppercase">
                                <tr className="text-center" style={thead}>
                                    <th className="fw700 py-2" width="419px" >Account</th>
                                    <th className="fw700 py-2" width="140px" >Nominal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {other_expense_rows}
                            </tbody>
                        </table>
                    </div>
                </div>
            )
        } else {
            return <div className="row justify-content-center" key='0'>
                    <div className="col-10 col-md-8 text-center border rounded-lg py-4">
                        <p className="mb-0 fs24md fs16 fw600 text-muted">
                            <span><i className="fa fa-spin fa-circle-o-notch mr-3"></i>Loading...</span>
                        </p>
                    </div>
                </div>
        }
        
        
    }
}

ReactDOM.render(<ProfitAndLoss/>, document.getElementById('profit_and_loss_list'))