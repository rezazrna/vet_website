class Coa extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': [],
            'loaded': false,
            'show_add': false,
            'show_edit': false,
            'selected': false,
            'dc_mode': false,
            'edit_data': {},
            'month': moment().format('MM'),
            'year': moment().format('YYYY'),
            'accounting_date': moment().add(1,'month').format('YYYY-MM-DD'),
            'mode': '',
            'print_loading': false,
            'currentUser': {},
            'list_year': []
        }
        this.coaSearch = this.coaSearch.bind(this)
        this.toggleAdd = this.toggleAdd.bind(this)
        this.toggleEdit = this.toggleEdit.bind(this)
        this.selectRow = this.selectRow.bind(this)
    }
    
    componentDidMount() {
        var td = this
        var filters = {}
        var dc_mode = this.props.dc_mode
        if(dc_mode == '1'){
            this.setState({dc_mode: true, loaded: true, month: '', year: '', accounting_date: undefined})
            filters.dc_mode = 1
        }
        // frappe.call({
        //     type: "GET",
        //     method:"vet_website.vet_website.doctype.vetcoa.vetcoa.get_coa_list",
        //     args: {filters: filters},
        //     callback: function(r){
        //         if (r.message) {
        //             console.log(r.message)
        //             td.setState({'data': r.message, 'loaded': true});
        //         }
        //     }
        // });
        frappe.call({
            type: "GET",
            method:"vet_website.methods.get_current_user",
            args: {},
            callback: function(r){
                if (r.message) {
                    console.log(r.message)
                    td.setState({'currentUser': r.message});
                }
            }
        });
        if (!dc_mode) {
            this.coaSearch(filters)
        }

        frappe.call({
            type: "GET",
            method: "vet_website.methods.get_list_year",
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    td.setState({ 'list_year': r.message });
                }
            }
        });
    }
    
    handleInputOnChange(e) {
        var th = this
        var name = e.target.name
        var value = e.target.value
        // var filters = {}
        // this.setState({loaded: false})
        if (name == 'min_month') {
            var accounting_min_date = moment(this.state.year + '-' + value + '-01', 'YYYY-MM-DD').format('YYYY-MM-DD')
            th.setState({ min_month: value, accounting_min_date: accounting_min_date })
        } else if(name == 'month'){
            var accounting_date = moment(this.state.year+'-'+value, 'YYYY-MM').add(1,'month').format('YYYY-MM-DD')
            this.setState({month: value, accounting_date: accounting_date})
        }
        else if(name == 'year'){
            var accounting_date = moment(value+'-'+this.state.month, 'YYYY-MM').add(1,'month').format('YYYY-MM-DD')
            this.setState({year: value, accounting_date: accounting_date})
        }
        // this.coaSearch(filters)
        // frappe.call({
        //     type: "GET",
        //     method:"vet_website.vet_website.doctype.vetcoa.vetcoa.get_coa_list",
        //     args: {filters: filters},
        //     callback: function(r){
        //         if (r.message) {
        //             console.log(r.message)
        //             th.setState({'data': r.message, 'loaded': true});
        //         }
        //     }
        // });
    }

    setMode(e) {
        var th = this
        var mode = e.target.value
        th.setState({ 'mode': mode, 'month': '', 'min_month': '', 'year': '', 'accounting_date': undefined, 'accounting_min_date': undefined})
    }

    setFilter() {
        if (((this.state.mode == 'monthly' && this.state.month != '') ||
         (this.state.mode == 'period' && this.state.month != '' && this.state.min_month != ''))
          && this.state.year != '') {
            var filters = {accounting_date: this.state.accounting_date, accounting_min_date: this.state.accounting_min_date}
            this.setState({loaded: false})
            this.coaSearch(filters)
            // frappe.call({
            //     type: "GET",
            //     method: "vet_website.vet_website.doctype.vetjournalitem.vetjournalitem.get_journal_item_list",
            //     args: { filters: filters, mode: td.state.mode, },
            //     callback: function (r) {
            //         if (r.message) {
            //             console.log(r.message)
            //             td.setState({'data': r.message.journal_items, 'journals': r.message.journals, 'loaded': true, 'datalength': r.message.datalength, 'coaAll': r.message.coaAll});
            //         }
            //     }
            // });
        } else {
            frappe.msgprint(('Month or Year must be selected'));
        }
    }
    
    // getPrintData(){
    //     var th = this
    //     var filters = {
    //         accounting_date: this.state.accounting_date,
    //         accounting_min_date: this.state.accounting_min_date,
    //     }
    //     if(this.state.dc_mode){
    //         filters.dc_mode = 1
    //     }
    //     if(!this.state.print_loading){
    //         this.setState({print_loading: true})
    //         frappe.call({
    //             type: "GET",
    //             method:"vet_website.vet_website.doctype.vetcoa.vetcoa.get_coa_list",
    //             args: {filters: filters, all_children: true, mode: th.state.mode,},
    //             callback: function(r){
    //                 if (r.message) {
    //                     console.log(r.message)
    //                     th.setState({data: r.message, loaded: true});
    //                     th.printPDF()
    //                 }
    //             }
    //         });
    //     }
    // }
    
    print(is_excel=false) {
        var title = this.state.dc_mode ? 'TrialBalance-' : 'ChartOfAccounts'
        var filters = JSON.parse(sessionStorage.getItem(window.location.pathname))

        if (filters != undefined && filters.accounting_date != undefined && this.state.mode != undefined) {
            if (this.state.mode == 'monthly') {
                var bulan = moment(this.state.year + '-' + this.state.month, 'YYYY-MM').format('MM-YYYY')
                console.log(bulan)
                title += 'Monthly-' + bulan
            } else if (this.state.mode == 'period') {
                var sampai_bulan = moment(this.state.year + '-' + this.state.month, 'YYYY-MM').format('MM-YYYY')
                title += 'Periode-' + moment(filters.accounting_min_date).format('MM-YYYY') + '-' + sampai_bulan
            }
        }

        if (is_excel) {
            var elt = document.getElementById('excel_page');
            var wb = XLSX.utils.table_to_book(elt, { sheet: "sheet1" });
            var sheet = wb.Sheets[wb.SheetNames[0]];

            const format = '#,##0.00'
            for (let col of [1, 2]) {
                this.formatColumn(sheet, col, format)
            }

            var sheetcols = this.state.dc_mode 
            ? [
                {wpx:319},
                {wpx:120},
                {wpx:120},
            ]
            : [
                {wpx:439},
                {wpx:120},
            ];
            
            sheet['!cols'] = sheetcols;

            XLSX.writeFile(wb, title + '.xlsx');
            this.setState({print_loading: false});
        } else {
            var pdfid = 'pdf'
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
            //      doc.save("TrialBalance-"+th.state.month+"-"+th.state.year+".pdf");
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
    
    coaSearch(filters, all=false) {
        var td = this
        if(this.state.dc_mode){
            filters.dc_mode = 1
        }
        var args = {filters: filters}
        if (all) { args.all_children = true }
        if (this.state.mode) {args.mode = this.state.mode}
        console.log(args)
        sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))

        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetcoa.vetcoa.get_coa_list",
            args: args,
            callback: function(r){
                if (r.message) {
                    console.log(r.message)
                    td.setState({data: r.message, loaded: true, print_loading: false});
                }
            }
        });
    }
    
    toggleAdd(e) {
        e.preventDefault()
        this.setState({'show_add': !this.state.show_add})
    }
    
    toggleEdit(e) {
        e.preventDefault()
        this.setState({'show_edit': !this.state.show_edit})
    }
    
    selectRow(name, edit_data){
        if(name == this.state.selected){
            this.setState({'selected': false, 'edit_data': {}})
        }
        else{
            this.setState({'selected': name, 'edit_data': edit_data})
        }
    }
    
    deleteRow(e) {
        e.preventDefault();
        console.log('Halo')
        console.log(this.state.selected)
        if(this.state.selected){
            frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetcoa.vetcoa.delete_coa",
                args: {data: [this.state.selected]},
                callback: function(r){
                    console.log(r.message);
                    if (r.message.success) {
                        window.location.reload()
                    }
                }
            });
        }
    }
    
    render() {
		var row_style2 = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '2px', 'marginBottom': '18px', 'height': '72px'}
		var popup_add, delete_button, edit_button, gl_button, print_button, pdf, mode_options, sd_period, min_month_select, print_excel, excel_page;
		var write = checkPermission('VetCoa', this.state.currentUser, 'write')
        
        if (this.state.loaded){
            console.log(this.state)
            var add_button, month_select, year_select, set_button
            if(!this.state.dc_mode){
                add_button = <a href="#" className="btn btn-outline-danger text-uppercase fs12 fwbold" onClick={this.toggleAdd}><i className="fa fa-plus mr-2"/>Tambah</a>
                if (this.state.show_add) {
                    popup_add = <PopupAdd write={write} toggleAdd={this.toggleAdd}/>
                }
                else if (this.state.show_edit) {
                    popup_add = <PopupAdd write={write} toggleAdd={this.toggleEdit} data={this.state.edit_data}/>
                }
                
                if(this.state.selected){
                    if(!this.state.edit_data.is_parent){
                        delete_button = <button className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={e => this.deleteRow(e)}>Hapus</button>
                        gl_button = <button type="button" className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={() => window.location.href = "/main/accounting/general-ledger?account="+this.state.selected}>General Ledger</button>
                    }
                    edit_button = <button type="button" className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={this.toggleEdit}>{write?"Edit":"Detail"}</button>
                }
                
                print_button = <button type="button" className={this.state.print_loading?"btn btn-outline-danger disabled text-uppercase fs12 fwbold mx-2":"btn btn-outline-danger text-uppercase fs12 fwbold mx-2"} onClick={() => this.print()}>{this.state.print_loading?(<span><i className="fa fa-spin fa-circle-o-notch mr-3"/>Loading...</span>):"Print"}</button>
                print_excel = <button type="button" className={this.state.print_loading?"btn btn-outline-danger disabled text-uppercase fs12 fwbold mx-2":"btn btn-outline-danger text-uppercase fs12 fwbold mx-2"} onClick={() => this.print(true)}>{this.state.print_loading?(<span><i className="fa fa-spin fa-circle-o-notch mr-3"/>Loading...</span>):"Print Excel"}</button>
        		pdf = <PDF data={this.state.data} month={this.state.month} year={this.state.year} mode={this.state.mode}/>
                excel_page = <ExcelPage data={this.state.data} month={this.state.month} year={this.state.year} mode={this.state.mode}/>
            }
            else{
                var i
                var month_options = [<option className="d-none" key="99999"></option>]
		        var year_options = [<option className="d-none" key="99999"></option>]
        		for(i = 0; i <= 11; i++){
        		    var moment_month = moment(i+1, 'M')
        		    // var moment_year = moment().add(-i, 'year')
        		    month_options.push(<option key={moment_month.format('MM')} value={moment_month.format('MM')}>{moment_month.format('MMMM')}</option>)
        		    // year_options.push(<option key={moment_year.format('YYYY')}>{moment_year.format('YYYY')}</option>)
        		}

                this.state.list_year.forEach(function(e, index) {
                    year_options.push(<option key={e}>{e}</option>)
                })
        		
        		print_button = <button type="button" className={this.state.print_loading?"btn btn-outline-danger disabled text-uppercase fs12 fwbold mx-2":"btn btn-outline-danger text-uppercase fs12 fwbold mx-2"} onClick={() => this.print()}>{this.state.print_loading?(<span><i className="fa fa-spin fa-circle-o-notch mr-3"/>Loading...</span>):"Print"}</button>
                print_excel = <button type="button" className={this.state.print_loading?"btn btn-outline-danger disabled text-uppercase fs12 fwbold mx-2":"btn btn-outline-danger text-uppercase fs12 fwbold mx-2"} onClick={() => this.print(true)}>{this.state.print_loading?(<span><i className="fa fa-spin fa-circle-o-notch mr-3"/>Loading...</span>):"Print Excel"}</button>
        		pdf = <PDF data={this.state.data} month={this.state.month} year={this.state.year} dc_mode={true} mode={this.state.mode}/>
                excel_page = <ExcelPage data={this.state.data} month={this.state.month} year={this.state.year} dc_mode={true} mode={this.state.mode}/>

                if (this.state.mode == 'monthly' || this.state.mode == 'period') {

                    if (this.state.mode == 'period') {
                        sd_period = <div className="col-1 my-auto mx-auto">
                            s/d
                        </div>

                        min_month_select = <div className="col-2 my-auto">
                            <select name="min_month" placeholder="Month" className="form-control" value={this.state.min_month} onChange={e => this.handleInputOnChange(e)}>
                                {month_options}
                            </select>
                        </div>
                    }
    
                    month_select = <div className="col-2 my-auto">
                        <select name="month" placeholder="Month" className="form-control" value={this.state.month} onChange={e => this.handleInputOnChange(e)}>
                            {month_options}
                        </select>
                    </div>
                }
                
                // month_select = (
                // <div className="col-2 my-auto ml-auto">
                //     <select name="month" className="form-control" value={this.state.month} onChange={e => this.handleInputOnChange(e)}>
                //         {month_options}
                //     </select>
                // </div>
                // )

                mode_options = <div className="col-2 my-auto">
                                    <select name="mode" placeholder="Periode" className="form-control" value={this.state.mode} onChange={e => this.setMode(e)}>
                                        <option className="d-none" key="99999"></option>
                                        <option value="monthly">Monthly</option>
                                        <option value="period">Period</option>
                                    </select>
                                </div>

                year_select = (
                <div className="col-2 my-auto">
                    <select name="year" className="form-control" value={this.state.year} onChange={e => this.handleInputOnChange(e)}>
                        {year_options}
                    </select>
                </div>
                )

                set_button =<div className="col-1 my-auto">
                            <button type="button" className="btn btn-outline-danger text-uppercase fs12 fwbold" onClick={() => this.setFilter()}>Set</button>
                        </div>
            }
            
            return(
                <div className="position-relative">
                    <div className="row mx-0" style={row_style2}>
                        <div className="col-auto my-auto">
                        	{add_button}
                        	{edit_button}
                        	{delete_button}
                        	{gl_button}
                        	{print_button}
                            {print_excel}
                        </div>
                        {mode_options}
                        {year_select}
                        {min_month_select}
                        {sd_period}
                        {month_select}
                        {set_button}
                    </div>
                    {pdf}
                    {excel_page}
                    <CoaList items={this.state.data} selected={this.state.selected} selectRow={this.selectRow} dc_mode={this.state.dc_mode} month={this.state.month} year={this.state.year} accounting_date={this.state.accounting_date} accounting_min_date={this.state.accounting_min_date} mode={this.state.mode}/>
                    {popup_add}
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

class PopupAdd extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': {},
            'loaded': false,
            'parent_clicked': false,
        }
    }
    
    componentDidMount() {
        var td = this
        
        if(this.props.data != undefined){
            this.setState({data: this.props.data})
        }
        
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetcoa.vetcoa.get_parent_list",
            args: {},
            callback: function(r){
                if (r.message) {
                    console.log(r.message)
                    td.setState({'parentList': r.message, 'loaded': true});
                }
            }
        });
    }
    
    formSubmit(e){
        e.preventDefault()
        var new_data = this.state.data
        
        if (new_data.account_parent) {
            var realValue = this.state.parentList.find(i => i.account_name == new_data.account_parent || i.name == new_data.account_parent)
            
            new_data.account_parent = realValue.name
        }
        
        var method = "vet_website.vet_website.doctype.vetcoa.vetcoa.new_coa"
        if(new_data.name){
            method = "vet_website.vet_website.doctype.vetcoa.vetcoa.edit_coa"
        }
        
        frappe.call({
            type: "GET",
            method:method,
            args: {data: new_data},
            callback: function(r){
                if (r.message) {
                    console.log(r.message)
                    window.location.reload()
                }
            }
        });
    }
    
    changeInput(e){
        var target = e.target
        var name = target.name
        var value = target.value
        var new_data = Object.assign({}, this.state.data)
        
        if (name == 'is_parent') {
            if (new_data.is_parent) {
                new_data[name] = false
            } else {
                new_data[name] = true
            }
        } else {
            new_data[name] = value
        }
        
        this.setState({data: new_data})
    }
    
    inputBlur(e, list) {
        const value = e.target.value
        const name = e.target.name
        var new_data = Object.assign({}, this.state.data)
    	var selected = false
    	
    	if (name == 'account_type') {
    	    selected = list.find(i => i == value)
    	} else if (name == 'account_parent') {
    	    this.setState({parent_clicked: false})
    	    selected = list.find(i => i.account_name == value)
    	}
    	
    	if (!selected) {
    		e.target.value = ''
    		new_data[name] = ''
		    this.setState({data: new_data})
    	}
    }
    
    parentClick(){
        if (['',undefined,false,null].includes(this.state.data.account_type)){
            this.setState({parent_clicked: true})
        }
        else{
            this.setState({parent_clicked: false})
        }
    }
    
    render(){
        var container_style = {marginTop: '50px', maxWidth: '915px'}
        var panel_style = {borderRadius: '8px'}
        var input_style = {background: '#CEEDFF'}
        var button1_style = {minWidth: '147px', border: '1px solid #056EAD', background: '#056EAD', color: '#FFF'}
        var button2_style = {minWidth: '147px', border: '1px solid #056EAD', color: '#056EAD'}
        var type_options = []
        var parent_options = []
        var typeList = ['Asset', 'Equity', 'Expense', 'Income', 'Liability']
        var data = this.state.data
        
        if (this.state.loaded) {
            var readOnly = false || !this.props.write
            console.log(data)
            typeList.forEach((um, index) => type_options.push(<option value={um} key={index.toString()} />))
        
            this.state.parentList.filter(a => a.account_type == this.state.data.account_type).forEach((um, index) => parent_options.push(<option value={um.account_name} key={um.name} />))
            
            var default_account_type = typeList.find(t => t == data.account_type)
            var default_parent = this.state.parentList.find(p => p.name == data.account_parent)
            var default_parent_name
            if(default_parent != undefined){
                default_parent_name = default_parent.account_name
            }
            
            var parent_style = {background: '#CEEDFF'}
            var parent_warning_label
            if(this.state.parent_clicked){
                parent_style.border = '1px solid #FF2525'
                parent_style.boxShadow = '0 0 3px #ff2525'
                parent_warning_label = <span className="text-danger">Harap isi Account Type terlebih dahulu</span>
            }
        
            return(
                <div className='menu-popup pt-0 d-flex' onClick={this.props.toggleAdd}>
                    <div className="container my-auto" style={container_style} onClick={event => event.stopPropagation()}>
                    	<form onSubmit={e => this.formSubmit(e)} className="p-5 bg-white" style={panel_style}>
                    	    <div className="form-row">
                    	        <div className="col-4">
                    	            <div className="form-group">
                            	        <label htmlFor="account_code" className="fs18 fw600">Account Code</label>
                            	        <input readOnly={readOnly} className="form-control fs18 border-0" style={input_style} type="text" name="account_code" id="account_code" required onChange={e => this.changeInput(e)} placeholder="0" defaultValue={data.account_code || ''}/>
                            	    </div>
                    	        </div>
                    	        <div className="col-8">
                    	            <div className="form-group">
                            	        <label htmlFor="account_name" className="fs18 fw600">Account Name</label>
                            	        <input readOnly={readOnly} className="form-control fs18 border-0" style={input_style} type="text" name="account_name" id="account_name" required onChange={e => this.changeInput(e)} placeholder="Masukkan Bila ada" defaultValue={data.account_name || ''}/>
                            	    </div>
                    	        </div>
                    	    </div>
                    	    <div className="form-row">
                    	        <div className="col-11">
                    	            <div className="form-group">
                            	        <label htmlFor="account_type" className="fs18 fw600">Account Type</label>
                            	        <input readOnly={readOnly} className="form-control fs18 border-0" style={input_style} type="text" name="account_type" id="account_type" required onChange={e => this.changeInput(e)} list="type_list" onBlur={e => this.inputBlur(e, typeList)} defaultValue={default_account_type} autoComplete="off"/>
                            	        <datalist id="type_list">
                            	            {type_options}
                            	        </datalist>
                            	    </div>
                    	        </div>
                    	        <div className="col-1">
                    	            <div className="form-group">
                            	        <label htmlFor="is_parent" className="fs18 fw600">Parent</label>
                            	        <input disabled={readOnly} className="form-control fs18 border-0" style={input_style} type="checkbox" name="is_parent" id="is_parent" onChange={e => this.changeInput(e)} checked={data.is_parent||false}/>
                            	    </div>
                    	        </div>
                    	    </div>
                    	    <div className="form-group mb-5">
                    	        <label htmlFor="account_parent" className="fs18 fw600">Account Parent</label>
                    	        <input readOnly={readOnly} style={parent_style} className="form-control fs18" type="text" name="account_parent" id="account_parent" onChange={e => this.changeInput(e)} onClick={() => this.parentClick()} list="parent_list" onBlur={e => this.inputBlur(e, this.state.parentList)} defaultValue={default_parent_name} autoComplete="off"/>
                    	        <datalist id="parent_list">
                    	            {parent_options}
                    	        </datalist>
                    	        {parent_warning_label}
                    	    </div>
                    	    <div className="row justify-content-center">
                    	        {this.props.write?<div className="col-auto"><button type="submit" className="btn fs18 fw600 py-2" style={button1_style}>Simpan</button></div>:false}
                    	        <div className="col-auto">
                    	            <button type="button" className="btn fs18 fw600 py-2" style={button2_style} onClick={this.props.toggleAdd}>Batal</button>
                    	        </div>
                    	    </div>
                    	</form>
                    </div>
                    <div className="menu-popup-close"/>
                </div>
            )
        } else {
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


class CoaList extends React.Component {
    render() {
        var rows = []
        var panel_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px'}
        var row_style = {color: '#056EAD', background: '#84D1FF', 'boxShadow': '0px 6px 23px rgba(0, 0, 0, 0.1)', borderRadius: '5px'}
        var items = this.props.items
        
        if (items.length != 0 ){
            var cl = this
            items.forEach(function(value, index){
                rows.push(
                    <CoaListRow key={value.account_name} item={value} selected={cl.props.selected} selectRow={cl.props.selectRow} dc_mode={cl.props.dc_mode} month={cl.props.month} year={cl.props.year} accounting_date={cl.props.accounting_date} accounting_min_date={cl.props.accounting_min_date} mode={cl.props.mode}/>
                )
            })
            
            var dc_total
            if(this.props.dc_mode){
                var space_width = {width: '56px'}
                var label_width = {width: '90.4px'}
                var total_debit = items.reduce((total,b) => total+b.total_debit, 0)
                var total_credit = items.reduce((total,b) => total+b.total_credit, 0)
                dc_total = (
                    <div className="row mx-0 fs14 fw600 py-2 mb-2" style={row_style}>
                    <div className="col-auto text-center" style={space_width}/>
                        <div className="col-auto text-center" style={label_width}><span>Total</span></div>
                        <div className="col offset-7">
                            <div className="row">
                                <div className="col-6 text-right">
                                    {formatter2.format(total_debit)}
                                </div>
                                <div className="col-6 text-right">
                                    {formatter2.format(total_credit)}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            
            return(
                <div style={panel_style}>
                	{rows}
                	{dc_total}
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

class CoaListRow extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'show': false,
            'loaded': this.props.item.children.length > 0,
            'children': this.props.item.children,
        }
        
        this.toggleShow = this.toggleShow.bind(this)
    }
    
    toggleShow(e) {
        e.stopPropagation();
        this.setState({show: !this.state.show})
        if (!this.state.loaded) {
            var args = {name: this.props.item.name}
            if(this.props.dc_mode){
                args.dc_mode = '1'
                args.max_date = this.props.accounting_date
                args.min_date = this.props.accounting_min_date
                args.mode = this.props.mode
            }
            console.log(args)
            var td = this
            frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetcoa.vetcoa.get_coa_children",
                args: args,
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
        var row_style = {color: '#056EAD', background: '#84D1FF', 'boxShadow': '0px 6px 23px rgba(0, 0, 0, 0.1)', borderRadius: '5px', cursor: 'pointer'}
        var cursor = {cursor: 'pointer'}
        var chevron_class = "fa fa-chevron-right my-auto p-2"
        var children_row = []
        var color = {color: '#056EAD', cursor:'pointer'}
        
        if (this.state.show) {
            if (this.state.loaded) {
                if (this.state.children.length != 0) {
                    var cl = this
                    this.state.children.forEach(function(value, index){
                        children_row.push(
                            <CoaListRow key={value.account_name} item={value} selected={cl.props.selected} selectRow={cl.props.selectRow} dc_mode={cl.props.dc_mode} month={cl.props.month} year={cl.props.year} accounting_date={cl.props.accounting_date} accounting_min_date={cl.props.accounting_min_date} mode={cl.props.mode}/>
                        )
                    })
                }
            } else {
                children_row.push(
                    <div className="col py-2" key="0">
        			    <div className="row justify-content-center">
                            <div className="col-10 col-md-8 text-center border rounded-lg py-4">
                                <p className="mb-0 fs24md fs16 fw600 text-muted">
                                    <span><i className="fa fa-spin fa-circle-o-notch mr-3"></i>Loading...</span>
                                </p>
                            </div>
                        </div>
        			</div>
                )
            }
            
            chevron_class = "fa fa-chevron-down my-auto p-2"
        }
        
        if (item.is_parent) {
            var span_class = "my-auto"
            var onClick = () => this.props.selectRow(item.name, item)
            var nominal_col = (
                <div className="col">
                    <div className="row">
                        <div className="col d-flex">
        					<span className={"ml-auto "+span_class}>{formatter2.format(item.total)}</span>
        				</div>
        				<div className="col-3 d-flex">
        					<span className={"ml-auto "+span_class}>IDR</span>
        				</div>
    				</div>
				</div>
            )
            if(this.props.selected == item.name){
                row_style.background = '#4698E3'
                var span_class = "bg-white rounded-lg px-2 py-1 text-truncate d-block"
            }
            if(this.props.dc_mode){
                onClick = e => e.preventDefault()
                row_style.cursor = 'default'
                var total_debit = item.total_debit
                var total_credit = item.total_credit
                // if(['Asset', 'Expense'].includes(item.account_type)){
                //     total_debit = item.total
                // }
                // else if(['Equity','Income','Liability'].includes(item.account_type)){
                //     total_credit = item.total
                // }
                nominal_col = (
                    <div className="col">
                        <div className="row">
                            <div className="col-6 d-flex">
            					<span className={"ml-auto "+span_class}>{formatter2.format(total_debit)}</span>
            				</div>
            				<div className="col-6 d-flex">
            					<span className={"ml-auto "+span_class}>{formatter2.format(total_credit)}</span>
            				</div>
        				</div>
    				</div>
                )
            }
            return(
                <div>
        			<div className="row mx-0 fs14 fw600 py-2 mb-2" style={row_style} onClick={onClick}>
        			    <div className="col-auto d-flex">
        				    <i className={chevron_class} style={cursor} onClick={e => this.toggleShow(e)}/>
        				</div>
        			    <div className="col-auto text-center">
        					<p className="bg-white mb-0 rounded-lg px-2 py-1 text-truncate">{item.account_code}</p>
        				</div>
        				<div className="col-7 d-flex">
        					<span className={span_class}>{item.account_name}</span>
        				</div>
        				{nominal_col}
        			</div>
        			<div className="pl-4">
        			    {children_row}
        			</div>
    			</div>
            )
        } else {
            var onClick = () => this.props.selectRow(item.name, item)
            var nominal_col = (
                <div className="col">
                    <div className="row">
                        <div className="col text-right">
                            <span>{formatter2.format(item.total)}</span>
                        </div>
                        <div className="col-auto">
                            <span>IDR</span>
                        </div>
                    </div>
                </div>
            )
            if(this.props.selected == item.name){
                color.background = '#CEEDFF'
            }
            if(this.props.dc_mode){
                onClick = e => e.preventDefault()
                var total_debit = item.total_debit
                var total_credit = item.total_credit
                // if(['Asset', 'Expense'].includes(item.account_type)){
                //     total_debit = item.total
                // }
                // else if(['Equity','Income','Liability'].includes(item.account_type)){
                //     total_credit = item.total
                // }
                nominal_col = (
                    <div className="col">
                        <div className="row">
                            <div className="col-6 text-right">
                                <span>{formatter2.format(total_debit)}</span>
                            </div>
                            <div className="col-6 text-right">
                                <span>{formatter2.format(total_credit)}</span>
                            </div>
                        </div>
                    </div>
                )
            }
            return(
                <div className="row mx-0 fw600 mb-3 p-1" style={color} onClick={onClick}>
                    <div className="col-auto">
                        <span>{item.account_code}</span>
                    </div>
                    <div className="col-8">
                        <span>{item.account_name}</span>
                    </div>
                    {nominal_col}
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
        var dc_mode = this.props.dc_mode || false
        console.log(data)
        var page_dimension = {width: 559, minHeight: 794, top:0, right: 0, background: '#FFF', color: '#000', zIndex: -1}
        var borderStyle = {border: '1px solid #000', margin: '15px 0'}
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

        if (filters != undefined && filters.accounting_date != undefined && this.props.mode != undefined) {
            if (this.props.mode == 'monthly') {
                var bulan = moment(this.props.year + '-' + this.props.month, 'YYYY-MM').format('MM-YYYY')
                subtitle = 'Monthly ' + bulan
            } else if (this.props.mode == 'period') {
                var sampai_bulan = moment(this.props.year + '-' + this.props.month, 'YYYY-MM').format('MM-YYYY')
                subtitle = 'Periode ' + moment(filters.accounting_min_date).format('MM-YYYY') + '-' + sampai_bulan
            } 
        }
        
        function addRow(data, initial_padding=0, padding_increment=0, dc_mode=false){
            var next_padding = initial_padding+padding_increment
            var style = {paddingLeft: initial_padding}
            var table_rows = []
            var total_debit = 0
            var total_credit = 0
            data.forEach((d, index) => {
                if(dc_mode){
                    table_rows.push(
                        <tr key={d.name} style={fs9}>
                            <td className="py-1" style={style}>{d.account_code+" "+d.account_name}</td>
                            <td className="py-1" >{formatter2.format(d.total_debit)}</td>
                            <td className="py-1" >{formatter2.format(d.total_credit)}</td>
                        </tr>
                    )
                    total_debit += d.total_debit
                    total_credit += d.total_credit
                } else {
                    table_rows.push(
                        <tr key={d.name} style={fs9}>
                            <td className="py-1" style={style}>{d.account_code+" "+d.account_name}</td>
                            <td className="py-1" >{formatter2.format(d.total)}</td>
                        </tr>
                    )
                }
                if(d.children && d.children.length > 0){
                    var d_children = addRow(d.children, next_padding, padding_increment, dc_mode)
                    table_rows = [...table_rows, ...d_children]
                }
            })

            if (dc_mode && initial_padding == 5) {
                table_rows.push(
                    <tr key='999999999' style={fs9}>
                        <td className="py-1" style={style}>Total</td>
                        <td className="py-1" >{formatter2.format(total_debit)}</td>
                        <td className="py-1" >{formatter2.format(total_credit)}</td>
                    </tr>
                )
            }
            return table_rows
        }
        
        var table_rows = addRow(data, 5, 8, dc_mode)
        
        var thead_row
        if(dc_mode){
            thead_row = <tr className="text-center">
	            <th className="fw700 py-2" width="319px" >Account</th>
	            <th className="fw700 py-2" width="120px" >Debit</th>
	            <th className="fw700 py-2" width="120px" >Credit</th>
	        </tr>
        } else {
            thead_row = <tr className="text-center">
	            <th className="fw700 py-2" width="439px" >Account</th>
	            <th className="fw700 py-2" width="120px" >Nominal</th>
	        </tr>
        }

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
                                <p className="fwbold text-right text-uppercase fs28" style={invoice}>{tbl != undefined ? 'Trial Balance' : 'Chart Of Accounts'}</p>
                                <p className="fw600 text-right text-uppercase fs14" style={invoice2}>{subtitle}</p>
                            </div>
                            <div className="col-12" style={borderStyle}/>
                        </div>
                        <table className="fs12" style={row2}>
                            <thead className="text-uppercase" style={thead}>
                                {thead_row}
                            </thead>
                            <tbody>
                                {table_rows}
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
        var dc_mode = this.props.dc_mode || false
        console.log(data)
        var page_dimension = {width: 559, minHeight: 794, top:0, right: 0, background: '#FFF', color: '#000', zIndex: -1}
        var borderStyle = {border: '1px solid #000', margin: '15px 0'}
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

        if (filters != undefined && filters.accounting_date != undefined && this.props.mode != undefined) {
            if (this.props.mode == 'monthly') {
                var bulan = moment(this.props.year + '-' + this.props.month, 'YYYY-MM').format('MM-YYYY')
                subtitle = 'Monthly ' + bulan
            } else if (this.props.mode == 'period') {
                var sampai_bulan = moment(this.props.year + '-' + this.props.month, 'YYYY-MM').format('MM-YYYY')
                subtitle = 'Periode ' + moment(filters.accounting_min_date).format('MM-YYYY') + '-' + sampai_bulan
            } 
        }
        
        function addRow(data, initial_padding=0, padding_increment=0, dc_mode=false){
            var next_padding = initial_padding+padding_increment
            var style = {paddingLeft: initial_padding}
            var table_rows = []
            var total_debit = 0
            var total_credit = 0
            data.forEach((d, index) => {
                if(dc_mode){
                    table_rows.push(
                        <tr key={d.name} style={fs9}>
                            <td className="py-1" style={style}>{d.account_code+" "+d.account_name}</td>
                            <td className="py-1" >{d.total_debit}</td>
                            <td className="py-1" >{d.total_credit}</td>
                        </tr>
                    )
                    total_debit += d.total_debit
                    total_credit += d.total_credit
                } else {
                    table_rows.push(
                        <tr key={d.name} style={fs9}>
                            <td className="py-1" style={style}>{d.account_code+" "+d.account_name}</td>
                            <td className="py-1" >{d.total}</td>
                        </tr>
                    )
                }
                if(d.children && d.children.length > 0){
                    var d_children = addRow(d.children, next_padding, padding_increment, dc_mode)
                    table_rows = [...table_rows, ...d_children]
                }
            })

            if (dc_mode && initial_padding == 5) {
                table_rows.push(
                    <tr key='999999999' style={fs9}>
                        <td className="py-1" style={style}>Total</td>
                        <td className="py-1" >{total_debit}</td>
                        <td className="py-1" >{total_credit}</td>
                    </tr>
                )
            }
            return table_rows
        }
        
        var table_rows = addRow(data, 5, 8, dc_mode)
        
        var thead_row
        if(dc_mode){
            thead_row = <tr className="text-center">
	            <th className="fw700 py-2" width="319px" >Account</th>
	            <th className="fw700 py-2" width="120px" >Debit</th>
	            <th className="fw700 py-2" width="120px" >Credit</th>
	        </tr>
        } else {
            thead_row = <tr className="text-center">
	            <th className="fw700 py-2" width="439px" >Account</th>
	            <th className="fw700 py-2" width="120px" >Nominal</th>
	        </tr>
        }

        if (this.state.loaded) {
            var image
            if (profile.image != undefined){
                var image_style = {position: 'absolute', top: 0, left: 0, objectFit: 'cover', height: '100%'}
                image = <img src={profile.temp_image || profile.image} style={image_style}/>
            } else {
                image = <img src={profile.temp_image} style={image_style} />
            }
            
            return(
                <table id="excel_page" border="1" className="position-absolute d-none">
                    <thead className="text-uppercase" style={thead}>
                        <tr>
                            <td rowspan="3">{image}</td>
                            <td colspan="3">{profile.clinic_name}</td>
                            <td colspan="2">{tbl != undefined ? 'Trial Balance' : 'Chart Of Accounts'}</td>
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
                        {thead_row}
                    </thead>
                    <tbody>
                        {table_rows}
                    </tbody>
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

var cl = document.getElementById('coa_list')
var tbl = document.getElementById('trial_balance_list')
if(cl != undefined){
    ReactDOM.render(<Coa />, cl)
}
if(tbl != undefined){
    ReactDOM.render(<Coa dc_mode='1'/>, tbl)
}
