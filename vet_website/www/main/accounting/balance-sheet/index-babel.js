class BalanceSheet extends React.Component {
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
            'list_year': []
        }
    }
    
    componentDidMount() {
        var po = this
        frappe.call({
            type: "GET",
            method: "vet_website.methods.get_list_year",
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'list_year': r.message });
                }
            }
        });

        // var td = this
        // frappe.call({
        //     type: "GET",
        //     method:"vet_website.vet_website.doctype.vetcoa.vetcoa.get_coa_list",
        //     args: {filters: {accounting_date: moment(this.state.year+'-'+this.state.month, 'YYYY-MM').add(1,'month').format('YYYY-MM-DD')}},
        //     callback: function(r){
        //         if (r.message) {
        //             console.log(r.message)
        //             td.setState({'data': r.message, 'loaded': true});
        //         }
        //     }
        // });
    }
    
    filterChange(e){
        // this.setState({loaded: false})
        var th = this
        var name = e.target.name
        var value = e.target.value
        // var filters = {}
        var accounting_date
        if(name == 'month'){
            this.setState({month: value})
            // filters.accounting_date = moment(this.state.year+'-'+value, 'YYYY-MM').add(1,'month').format('YYYY-MM-DD')
            accounting_date = moment(this.state.year+'-'+value, 'YYYY-MM').add(1,'month').format('YYYY-MM-DD')
        }
        else if(name == 'year'){
            this.setState({year: value})
            // filters.accounting_date = moment(value+'-'+this.state.month, 'YYYY-MM').add(1,'month').format('YYYY-MM-DD')
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
        //         args: {year: value},
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
        //             args: {year: this.state.year},
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
            var filters = {accounting_date: this.state.accounting_date}
            sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))
            td.setState({'loaded': false})
            frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetcoa.vetcoa.get_coa_list",
                args: {filters: filters, mode: td.state.mode, is_balance_sheet: 1},
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
    
    // getPrintData(){
    //     if ((((this.state.mode == 'monthly' || this.state.mode == 'period') && this.state.month != '') || (this.state.mode == 'annual')) && this.state.year != '') {
    //         var th = this
    //         var filters = JSON.parse(sessionStorage.getItem(window.location.pathname))
    //         console.log(filters)
    //         if(!this.state.print_loading){
    //             this.setState({print_loading: true})
    //             frappe.call({
    //                 type: "GET",
    //                 method:"vet_website.vet_website.doctype.vetcoa.vetcoa.get_coa_list",
    //                 args: {filters: filters, all_children: true, is_balance_sheet: 1, mode: th.state.mode,},
    //                 callback: function(r){
    //                     if (r.message) {
    //                         console.log(r.message)
    //                         th.setState({data: r.message, loaded: true});
    //                         th.printPDF()
    //                     }
    //                 }
    //             });
    //         }
    //     } else {
    //         frappe.msgprint(('Month or Year must be selected'));
    //     }
    // }
    
    print(is_excel=false) {
        var title = 'BalanceSheet-';
        var filters = JSON.parse(sessionStorage.getItem(window.location.pathname))

        if (filters.accounting_date != undefined && this.state.mode != undefined) {
            if (this.state.mode == 'monthly') {
                title += 'Monthly-' + moment(this.state.year + '-' + this.state.month, 'YYYY-MM').format('MM-YYYY')
            } else if (this.state.mode == 'annual') {
                title += 'Annual-' + moment(filters.accounting_date).format('YYYY')
            } else if (this.state.mode == 'period') {
                title += 'Periode-' + moment(this.state.year + '-' + this.state.month, 'YYYY-MM').format('MM-YYYY')
            }
        }

        if (is_excel) {
            var elt = document.getElementById('excel_page');
            var wb = XLSX.utils.table_to_book(elt, { sheet: "sheet1" });
            var sheet = wb.Sheets[wb.SheetNames[0]];

            const format = '#,##0.00'
            for (let col of [1]) {
                this.formatColumn(sheet, col, format)
            }

            var sheetcols = [
                {wpx:419},
                {wpx:140},
            ];
            
            sheet['!cols'] = sheetcols;

            XLSX.writeFile(wb, title + '.xlsx');
            this.setState({print_loading: false});
        } else {
            var pdfid = 'pdf'
            // var format = [559,794]
            // var th = this
            // var doc = new jsPDF({
            //     orientation: 'p',
            //     unit: 'pt',
            //     format: format,
            // });
            var source = document.getElementById(pdfid)
            var opt = {
                margin: [10, 0, 10, 0],
                filename: title + ".pdf",
                pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', '.row'] },
                html2canvas: {scale: 3},
                jsPDF: {orientation: 'p', unit: 'pt', format: [559*0.754,794*0.754]}
            }
            html2pdf().set(opt).from(source).save()
            this.setState({print_loading: false})
            // doc.html(source, {
            //   callback: function (doc) {
            //      doc.save("BalanceSheet-"+th.state.month+"-"+th.state.year+".pdf");
            //   },
            //   x: 0,
            //   y: 0,
            //   html2canvas: {
            //       scale: 1,
            //   }
            // });
        }
    }

    formatColumn(worksheet, col, fmt) {
        const range = XLSX.utils.decode_range(worksheet['!ref'])
        // note: range.s.r + 1 skips the header row
        for (let row = range.s.r + 1; row <= range.e.r; ++row) {
            const ref = XLSX.utils.encode_cell({ r: row, c: col })
            if (worksheet[ref] && worksheet[ref].t === 'n') {
            worksheet[ref].z = fmt
            }
        }
    }
    
    render() {
		var row_style2 = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '2px', 'marginBottom': '18px', 'height': '72px'}
		var month_options = [<option className="d-none" key="99999"></option>]
		var year_options = [<option className="d-none" key="99999"></option>]
		var i
		for(i = 0; i <= 11; i++){
		    var moment_month = moment(i+1, 'M')
		    // var moment_year = moment().add(-i, 'year')
		    month_options.push(<option key={moment_month.format('MM')} value={moment_month.format('MM')}>{moment_month.format('MMMM')}</option>)
		    // year_options.push(<option key={moment_year.format('YYYY')}>{moment_year.format('YYYY')}</option>)
		}

        this.state.list_year.forEach(function(e, index) {
            year_options.push(<option key={e}>{e}</option>)
        })
        
        if (this.state.loaded){
            console.log(this.state)
            var content, pdf, print_button, month_select, sd_period, excel_page, print_excel
            content = <BalanceSheetList items={this.state.data} month={this.state.month} year={this.state.year} mode={this.state.mode} accounting_date={this.state.accounting_date}/>
            pdf = <PDF data={this.state.data} month={this.state.month} year={this.state.year} mode={this.state.mode}/>
            print_button = <button type="button" 
                className={this.state.print_loading
                    ? "btn btn-outline-danger disabled text-uppercase fs12 fwbold mx-2"
                    : "btn btn-outline-danger text-uppercase fs12 fwbold mx-2"} 
                onClick={() => this.print()}>{this.state.print_loading
                    ?(<span><i className="fa fa-spin fa-circle-o-notch mr-3"/>Loading...</span>)
                    :"Print"}</button>
            excel_page = <ExcelPage data={this.state.data} month={this.state.month} year={this.state.year} mode={this.state.mode}/>
            print_excel = <button type="button" 
                className={this.state.print_loading
                    ? "btn btn-outline-danger disabled text-uppercase fs12 fwbold mx-2"
                    : "btn btn-outline-danger text-uppercase fs12 fwbold mx-2"} 
                onClick={() => this.print(true)}>{this.state.print_loading
                    ?(<span><i className="fa fa-spin fa-circle-o-notch mr-3"/>Loading...</span>)
                    :"Print Excel"}</button>
            
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
            // else if (this.state.mode == 'annual'){
            //     content = <BalanceSheetAnnual items={this.state.annual_data}/>
            // }
            return(
                <div>
                    <div className="row mx-0" style={row_style2}>
                        <div className="col-auto my-auto">
                            {print_button}
                            {print_excel}
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
                        {/* <div className="col-2 my-auto">
                            <select name="month" className="form-control" value={this.state.month} onChange={e => this.filterChange(e)}>
                                {month_options}
                            </select>
                        </div> */}
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
                    {excel_page}
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

class BalanceSheetList extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'show_asset': false,
            'show_liability': false,
            'show_equity': false,
        }
    }
    
    toggleShowAsset(){
        this.setState({'show_asset': !this.state.show_asset})
    }
    
    toggleShowLiability(){
        this.setState({'show_liability': !this.state.show_liability})
    }
    
    toggleShowEquity(){
        this.setState({'show_equity': !this.state.show_equity})
    }
    
    render() {
        var rows = []
        var panel_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px'}
        var title_color = {color: '#1B577B'}
        var cursor = {cursor: 'pointer'}
        var row_style = {color: '#056EAD', background: '#84D1FF', borderBottom: '1px solid #C4C4C4'}
        var row_style3 = {color: '#1B577B', background: '#B6DBF8'}
        var items = this.props.items
        var asset_row = []
        var asset_list
        var asset_chevron_class = "fa fa-chevron-down my-auto"
        
        var liability_row = []
        var liability_list
        var liability_chevron_class = "fa fa-chevron-down my-auto"
        
        var equity_row = []
        var equity_list
        var equity_chevron_class = "fa fa-chevron-down my-auto"
        
        if (items.length != 0 ){
            
            items.forEach((i, index) => {
                if(i.account_type == 'Asset' && i.total != 0){
                    asset_row.push(<BalanceSheetListRow key={i.account_name} item={i} month={this.props.month} year={this.props.year} mode={this.props.mode} accounting_date={this.props.accounting_date}/>)
                }
                else if(i.account_type == 'Liability' && i.total != 0){
                    liability_row.push(<BalanceSheetListRow key={i.account_name} item={i} month={this.props.month} year={this.props.year} mode={this.props.mode} accounting_date={this.props.accounting_date}/>)
                }
                else if(i.account_type == 'Equity' && i.total != 0){
                    equity_row.push(<BalanceSheetListRow key={i.account_name} item={i} month={this.props.month} year={this.props.year} mode={this.props.mode} accounting_date={this.props.accounting_date}/>)
                }
            })
            
            var asset_total = items.filter(i => i.account_type == 'Asset').reduce((a,b) => a+b.total, 0)
            var liability_total = items.filter(i => i.account_type == 'Liability').reduce((a,b) => a+b.total, 0)
            var equity_total = items.filter(i => i.account_type == 'Equity').reduce((a,b) => a+b.total, 0)
            
            if(this.state.show_asset){
                asset_list = <div>{asset_row}</div>
                asset_chevron_class = "fa fa-chevron-up my-auto"
            }
            
            if(this.state.show_liability){
                liability_list = <div>{liability_row}</div>
                liability_chevron_class = "fa fa-chevron-up my-auto"
            }
            
            if(this.state.show_equity){
                equity_list = <div>{equity_row}</div>
                equity_chevron_class = "fa fa-chevron-up my-auto"
            }
            
            return(
                <div style={panel_style}>
                	<div className="text-center fs20 fw600 py-2" style={title_color}>Asset</div>
                	<div className="mb-4">
            			<div className="row mx-0 fs14 fw600 py-2" style={row_style}>
            				<div className="col-auto">
            					<span>Asset</span>
            				</div>
            				<div className="col-auto d-flex ml-auto">
            				    <i className={asset_chevron_class} style={cursor} onClick={() => this.toggleShowAsset()}/>
            				</div>
            			</div>
            			{asset_list}
            			<div className="row mx-0 fs14 fw600 py-2" style={row_style3}>
            				<div className="col-auto">
            					<span>Total Asset</span>
            				</div>
            				<div className="col-2 d-flex ml-auto">
            				    {formatter2.format(asset_total)}
            				</div>
            			</div>
        			</div>
                	<div className="text-center fs20 fw600 py-2" style={title_color}>Liability and Equity</div>
                	<div className="mb-4">
            			<div className="row mx-0 fs14 fw600 py-2" style={row_style}>
            				<div className="col-auto">
            					<span>Liability</span>
            				</div>
            				<div className="col-auto d-flex ml-auto">
            				    <i className={liability_chevron_class} style={cursor} onClick={() => this.toggleShowLiability()}/>
            				</div>
            			</div>
            			{liability_list}
            			<div className="row mx-0 fs14 fw600 py-2" style={row_style3}>
            				<div className="col-auto">
            					<span>Total Liability</span>
            				</div>
            				<div className="col-2 d-flex ml-auto">
            				    {formatter2.format(liability_total)}
            				</div>
            			</div>
        			</div>
        			<div className="mb-4">
        			    <div className="row mx-0 fs14 fw600 py-2" style={row_style}>
            				<div className="col-auto">
            					<span>Equity</span>
            				</div>
            				<div className="col-auto d-flex ml-auto">
            				    <i className={equity_chevron_class} style={cursor} onClick={() => this.toggleShowEquity()}/>
            				</div>
            			</div>
            			{equity_list}
            			<div className="row mx-0 fs14 fw600 py-2" style={row_style3}>
            				<div className="col-auto">
            					<span>Total Equity</span>
            				</div>
            				<div className="col-2 d-flex ml-auto">
            				    {formatter2.format(equity_total)}
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

class BalanceSheetListRow extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'show': false,
            'loaded': this.props.item.children.length > 0,
            'onLoading': false,
            'children': this.props.item.children,
        }
        
        this.toggleShow = this.toggleShow.bind(this)
    }
    
    toggleShow(e) {
        e.stopPropagation();
        this.setState({show: !this.state.show})
        if (!this.state.loaded) {
            this.setState({onLoading: true})
            var td = this
            frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetcoa.vetcoa.get_coa_children",
                args: {name: this.props.item.name, max_date: this.props.accounting_date, mode: this.props.mode},
                callback: function(r){
                    if (r.message) {
                        console.log(r.message)
                        td.setState({children: r.message, loaded: true, onLoading: false})
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
        var iconRow
        
        if (this.state.show && this.state.loaded) {
            if (this.state.children.length != 0) {
                var cl = this
                this.state.children.forEach(function(value, index){
                    if (value.total != 0){
                        children_row.push(
                            <BalanceSheetListRow key={value.account_name} item={value} month={cl.props.month} year={cl.props.year} mode={cl.props.mode} accounting_date={cl.props.accounting_date}/>
                        )
                    }
                })
            }
            
            chevron_class = "fa fa-chevron-up my-auto"
        }

        if (this.state.onLoading) {
            iconRow = <i className="fa fa-spin fa-circle-o-notch my-auto ml-auto" />
        } else {
            iconRow = <i className={chevron_class} style={cursor} onClick={e => this.toggleShow(e)}/>
        }
        
        if (item.is_parent) {
            return(
                <div>
        			<div className="row mx-0 fs14 fw600 py-2" style={row_style}>
        				<div className="col-auto">
        					<span>{item.account_code}</span>
        				</div>
        				<div className="col-auto">
        					<span>{item.account_name}</span>
        				</div>
        				<div className="col-auto d-flex ml-auto">
        					<span>{formatter2.format(item.total)}</span>
        				</div>
        				<div className="col-auto d-flex">
        				    {iconRow}
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
                    <div className="col-auto">
    					<span>{item.account_code}</span>
    				</div>
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

class BalanceSheetAnnual extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'show_asset': false,
            'show_liability': false,
            'show_equity': false,
        }
    }
    
    toggleShowAsset(){
        this.setState({'show_asset': !this.state.show_asset})
    }
    
    toggleShowLiability(){
        this.setState({'show_liability': !this.state.show_liability})
    }
    
    toggleShowEquity(){
        this.setState({'show_equity': !this.state.show_equity})
    }
    
    render() {
        var asset_rows = []
        var liability_rows = []
        var equity_rows = []
        
        var asset_cols = []
        var liability_cols = []
        var equity_cols = []
        var month_cols = []
        
        var panel_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px'}
        var headerBorder = {borderBottom: '2px solid #1B577B', color: '#1B577B', background: '#84D1FF', position: 'sticky', zIndex: 1, top: 0}
        var row_style3 = {color: '#1B577B', background: '#B6DBF8', cursor: 'pointer'}
        var items = this.props.items
        var divStyle = {minHeight: 552, position: 'relative', overflow: 'auto'}
        var colWidth = {width: '6.5%'}
        var colWidth2 = {width: '15.5%', position: 'sticky', left: 0, background: "inherit", boxShadow: "1px 0px 1px #0003"}
        var contentStyle = {position: 'absolute', top: 0, left: 0, minWidth: 2100, width: '100%'}
        
        if (items.length != 0 ){
            
            items.forEach((i, index) => {
                if(i.account_type == 'Asset' && i.total != 0){
                    asset_rows.push(<BalanceSheetAnnualRow key={i.account_name} item={i}/>)
                }
                else if(i.account_type == 'Liability' && i.total != 0){
                    liability_rows.push(<BalanceSheetAnnualRow key={i.account_name} item={i}/>)
                }
                else if(i.account_type == 'Equity' && i.total != 0){
                    equity_rows.push(<BalanceSheetAnnualRow key={i.account_name} item={i}/>)
                }
            })
            
            for(var i = 0;i<=12;i++){
                month_cols.push(<div className="fwbold px-1 px-2 text-right" key={i} style={colWidth}>{i<=11?moment(i+1, 'M').format('MMMM YYYY'):'Total'}</div>)
                
                var asset_total = items.filter(i => i.account_type == 'Asset').reduce((a,b) => a+b.total[i].total, 0)
                asset_cols.push(<div className="px-1 py-2 text-right" key={i} style={colWidth}>{formatter2.format(asset_total)}</div>)
                var liability_total = items.filter(i => i.account_type == 'Liability').reduce((a,b) => a+b.total[i].total, 0)
                liability_cols.push(<div className="px-1 py-2 text-right" key={i} style={colWidth}>{liability_total}</div>)
                var equity_total = items.filter(i => i.account_type == 'Equity').reduce((a,b) => a+b.total[i].total, 0)
                equity_cols.push(<div className="px-1 py-2 text-right" key={i} style={colWidth}>{equity_total}</div>)
            }
            
            var asset_list, liability_list, equity_list
            
            if(this.state.show_asset){
                asset_list = <div>{asset_rows}</div>
            }
            
            if(this.state.show_liability){
                liability_list = <div>{liability_rows}</div>
            }
            
            if(this.state.show_equity){
                equity_list = <div>{equity_rows}</div>
            }
            
            return(
                <div style={panel_style}>
                	<div style={divStyle}>
                	    <div style={contentStyle}>
                	        <div className="row mx-0" style={headerBorder}>
                	            <div className="fwbold py-2 px-3" style={colWidth2}>
                	                Description
                	            </div>
                	            {month_cols}
                	        </div>
                	        <div className="row mx-0 border-bottom border-white" style={row_style3} onClick={() => this.toggleShowAsset()}>
                	            <div className="fwbold py-2 px-3" style={colWidth2}>
                	                Asset
                	            </div>
                	            {asset_cols}
                	        </div>
                	        {asset_list}
                	        <div className="row mx-0 border-bottom border-white" style={row_style3} onClick={() => this.toggleShowLiability()}>
                	            <div className="fwbold py-2 px-3" style={colWidth2}>
                	                Liability
                	            </div>
                	            {liability_cols}
                	        </div>
                	        {liability_list}
                	        <div className="row mx-0 border-bottom border-white" style={row_style3} onClick={() => this.toggleShowEquity()}>
                	            <div className="fwbold py-2 px-3" style={colWidth2}>
                	                Equity
                	            </div>
                	            {equity_cols}
                	        </div>
                	        {equity_list}
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

class BalanceSheetAnnualRow extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'show': false,
            'loaded': false
        }
        
        this.toggleShow = this.toggleShow.bind(this)
    }
    
    toggleShow(e) {
        console.log('Halo')
        e.stopPropagation();
        this.setState({show: !this.state.show})
        if (!this.state.loaded) {
            var td = this
            frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetcoa.vetcoa.get_annual_balance_sheet",
                args: {name: this.props.item.name},
                callback: function(r){
                    if (r.message) {
                        td.setState({children: r.message, loaded: true})
                    }
                }
            });
        }
    }
    
    render() {
        var item = this.props.item
        var cols = []
        var row_style3 = {color: '#1B577B', background: '#B6DBF8', cursor: 'pointer'}
        var children_row = []
        var colWidth = {width: '6.5%'}
        var colWidth2 = {width: '15.5%', position: 'sticky', left: 0, background: "inherit", boxShadow: "1px 0px 1px #0003"}
        
        if (this.state.loaded) {
            if (this.state.children.length != 0) {
                var cl = this
                this.state.children.forEach(function(value, index){
                    children_row.push(
                        <BalanceSheetAnnualRow key={value.account_name} item={value}/>
                    )
                })
            }
        } else if (!this.state.loaded){
            children_row.push(
                <div className="row mx-0 py-2" key="loading">
                    <div className="col-auto">
                        <span><i className="fa fa-spin fa-circle-o-notch mr-3"></i>Loading...</span>
                    </div>
                </div>
            )
        }
        
        if (item.is_parent) {
            
            for(var i = 0;i<=11;i++){
                cols.push(<div className="px-1 py-2 text-right" key={i} style={colWidth}>{formatter2.format(item.total[i].total)}</div>)
            }
            
            return(
                <div>
        			<div className="row mx-0 border-bottom border-white" style={row_style3} onClick={e => this.toggleShow(e)}>
        	            <div className="fwbold py-2 px-3" style={colWidth2}>
        	                {item.account_code+" "+item.account_name}
        	            </div>
        	            {cols}
        	        </div>
        			<div className={!this.state.show?'d-none':''}>
        			    {children_row}
        			</div>
    			</div>
            )
        } else {
            for(var i = 0;i<=11;i++){
                cols.push(<div className="px-1 py-2 text-right" key={i} style={colWidth}>{formatter2.format(item.total[i].total)}</div>)
            }
            
            return(
                <div>
        			<div className="row mx-0 border-bottom bg-white">
        	            <div className="fwbold py-2 px-3" style={colWidth2}>
        	                {item.account_name}
        	            </div>
        	            {cols}
        	        </div>
    			</div>
            )
        }
    }
}

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
        var subtitle = ''
        var filters = JSON.parse(sessionStorage.getItem(window.location.pathname))

        if (filters != undefined) {
            if (filters.accounting_date != undefined && this.props.mode != undefined) {
                if (this.props.mode == 'monthly') {
                    subtitle = 'Monthly ' + moment(this.props.year + '-' + this.props.month, 'YYYY-MM').format('MM-YYYY')
                } else if (this.props.mode == 'annual') {
                    subtitle = 'Annual ' + moment(filters.accounting_date).format('YYYY')
                } else if (this.props.mode == 'period') {
                    subtitle = 'Periode ' + moment(this.props.year + '-' + this.props.month, 'YYYY-MM').format('MM-YYYY')
                }
            }
        }
        
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
        
        var asset_rows = addRow(data.filter(i => i.account_type == 'Asset' && i.total != 0), 5, 8)
        asset_rows.push(
            <tr key='asset_total_spacer'>
                <td className="pb-1"/>
            </tr>
        )
        asset_rows.push(
            <tr key='asset_total' className="fs12" style={borderTop}>
                <td className="py-1 text-center text-uppercase fw700">Total Asset</td>
                <td className="py-1">{formatter.format(data.filter(i => i.account_type == 'Asset').reduce((a,b) => a+b.total, 0))}</td>
            </tr>
        )
        
        var liability_rows = addRow(data.filter(i => i.account_type == 'Liability' && i.total != 0), 5, 8)
        liability_rows.push(
            <tr key='liability_total_spacer'>
                <td className="pb-1"/>
            </tr>
        )
        liability_rows.push(
            <tr key='liability_total' className="fs12" style={borderTop}>
                <td className="py-1 text-center text-uppercase fw700">Total Liability</td>
                <td className="py-1">{formatter.format(data.filter(i => i.account_type == 'Liability').reduce((a,b) => a+b.total, 0))}</td>
            </tr>
        )
        
        var equity_rows = addRow(data.filter(i => i.account_type == 'Equity' && i.total != 0), 5, 8)
        equity_rows.push(
            <tr key='equity_total_spacer'>
                <td className="pb-1"/>
            </tr>
        )
        equity_rows.push(
            <tr key='equity_total' className="fs12" style={borderTop}>
                <td className="py-1 text-center text-uppercase fw700">Total Equity</td>
                <td className="py-1">{formatter.format(data.filter(i => i.account_type == 'Equity').reduce((a,b) => a+b.total, 0))}</td>
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
                                <p className="fwbold text-right text-uppercase fs28" style={invoice}>Balance Sheet</p>
                                <p className="fw600 text-right text-uppercase fs14" style={invoice2}>{subtitle}</p>
                            </div>
                            <div className="col-12" style={borderStyle}/>
                        </div>
                        <div className="row">
                            <div className="col-12 text-uppercase text-center fw700 py-2">
                                Asset
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
                                {asset_rows}
                            </tbody>
                        </table>
                        <div className="row mt-3">
                            <div className="col-12 text-uppercase text-center fw700 py-2">
                                Liability & Equity
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
                                <tr>
                                    <th className="fw700 py-2">Liability</th>
                                </tr>
                                {liability_rows}
                            </tbody>
                        </table>
                        <table className="fs12 mt-3" style={row2}>
                            <thead className="text-uppercase">
                                <tr className="text-center" style={thead}>
                                    <th className="fw700 py-2" width="419px" >Account</th>
                                    <th className="fw700 py-2" width="140px" >Nominal</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <th className="fw700 py-2">Equity</th>
                                </tr>
                                {equity_rows}
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

class ExcelPage extends React.Component{
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
        var subtitle = ''
        var filters = JSON.parse(sessionStorage.getItem(window.location.pathname))

        if (filters != undefined) {
            if (filters.accounting_date != undefined && this.props.mode != undefined) {
                if (this.props.mode == 'monthly') {
                    subtitle = 'Monthly ' + moment(this.props.year + '-' + this.props.month, 'YYYY-MM').format('MM-YYYY')
                } else if (this.props.mode == 'annual') {
                    subtitle = 'Annual ' + moment(filters.accounting_date).format('YYYY')
                } else if (this.props.mode == 'period') {
                    subtitle = 'Periode ' + moment(this.props.year + '-' + this.props.month, 'YYYY-MM').format('MM-YYYY')
                }
            }
        }
        
        function addRow(data, initial_padding=0, padding_increment=0){
            var next_padding = initial_padding+padding_increment
            var style = {paddingLeft: initial_padding}
            var table_rows = []
            data.forEach((d, index) => {
                table_rows.push(
                    <tr key={d.name} style={fs9}>
                        <td className="py-1" style={style}>{d.account_code+" "+d.account_name}</td>
                        <td className="py-1" >{d.total}</td>
                    </tr>
                )
                if(d.children && d.children.length > 0){
                    var d_children = addRow(d.children.filter(i => i.total != 0), next_padding, padding_increment)
                    table_rows = [...table_rows, ...d_children]
                }
            })
            return table_rows
        }
        
        var asset_rows = addRow(data.filter(i => i.account_type == 'Asset' && i.total != 0), 5, 8)
        asset_rows.push(
            <tr key='asset_total_spacer'>
                <td className="pb-1"/>
            </tr>
        )
        asset_rows.push(
            <tr key='asset_total' className="fs12" style={borderTop}>
                <td className="py-1 text-center text-uppercase fw700">Total Asset</td>
                <td className="py-1">{data.filter(i => i.account_type == 'Asset').reduce((a,b) => a+b.total, 0)}</td>
            </tr>
        )
        
        var liability_rows = addRow(data.filter(i => i.account_type == 'Liability' && i.total != 0), 5, 8)
        liability_rows.push(
            <tr key='liability_total_spacer'>
                <td className="pb-1"/>
            </tr>
        )
        liability_rows.push(
            <tr key='liability_total' className="fs12" style={borderTop}>
                <td className="py-1 text-center text-uppercase fw700">Total Liability</td>
                <td className="py-1">{data.filter(i => i.account_type == 'Liability').reduce((a,b) => a+b.total, 0)}</td>
            </tr>
        )
        
        var equity_rows = addRow(data.filter(i => i.account_type == 'Equity' && i.total != 0), 5, 8)
        equity_rows.push(
            <tr key='equity_total_spacer'>
                <td className="pb-1"/>
            </tr>
        )
        equity_rows.push(
            <tr key='equity_total' className="fs12" style={borderTop}>
                <td className="py-1 text-center text-uppercase fw700">Total Equity</td>
                <td className="py-1">{data.filter(i => i.account_type == 'Equity').reduce((a,b) => a+b.total, 0)}</td>
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
                <table id="excel_page" border="1" className="position-absolute d-none" style={page_dimension}>
                    <thead className="text-uppercase" style={thead}>
                        <tr>
                            <td rowspan="3">{image}</td>
                            <td colspan="3">{profile.clinic_name}</td>
                            <td colspan="2">Balance Sheet</td>
                        </tr>
                        <tr>
                            <td colspan="3">{profile.address}</td>
                        </tr>
                        <tr>
                            <td colspan="3">Telp. : {profile.phone}</td>
                            <td colspan="2">{subtitle}</td>
                        </tr>
                        <tr></tr>
                        <tr></tr>
                    </thead>
                    <tr>
                        <th colspan="2">Asset</th>
                    </tr>
                    <table className="fs12" style={row2}>
                        <thead className="text-uppercase">
                            <tr className="text-center" style={thead}>
                                <th className="fw700 py-2" width="419px" >Account</th>
                                <th className="fw700 py-2" width="140px" >Nominal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {asset_rows}
                        </tbody>
                    </table>
                    <tr></tr>
                    <tr>
                        <th colspan="2">Liability & Equity</th>
                    </tr>
                    <tr></tr>
                    <table className="fs12" style={row2}>
                        <thead className="text-uppercase">
                            <tr>
                                <th colspan="2" className="fw700 py-2">Liability</th>
                            </tr>
                            <tr className="text-center" style={thead}>
                                <th className="fw700 py-2" width="419px" >Account</th>
                                <th className="fw700 py-2" width="140px" >Nominal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {liability_rows}
                        </tbody>
                    </table>
                    <tr></tr>
                    <table className="fs12 mt-3" style={row2}>
                        <thead className="text-uppercase">
                            <tr>
                                <th colspan="2" className="fw700 py-2">Equity</th>
                            </tr>
                            <tr className="text-center" style={thead}>
                                <th className="fw700 py-2" width="419px" >Account</th>
                                <th className="fw700 py-2" width="140px" >Nominal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {equity_rows}
                        </tbody>
                    </table>
                </table>
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

ReactDOM.render(<BalanceSheet/>, document.getElementById('balance_sheet_list'))