var id = getUrlParameter('n')

class JournalEntry extends React.Component {
    constructor(props) {
        super(props)
        var moment_date = moment()
        this.state = {
            'loaded': false,
            'data': {
                'period': moment_date.format('MM/YYYY'),
                'journal_items': [{}],
            },
            'edit': false,
            'currentUser': {},
            'loading_simpan': false,
            'loading_post': false,
        }
        
        this.handleInputChange = this.handleInputChange.bind(this)
        this.handleInputBlur = this.handleInputBlur.bind(this)
        this.formSubmit = this.formSubmit.bind(this)
        this.deleteRow = this.deleteRow.bind(this)
        this.toggleEdit = this.toggleEdit.bind(this)
        this.navigationAction = this.navigationAction.bind(this)
    }
    
    componentDidMount() {
        var lastfilter = JSON.parse(sessionStorage.getItem('/main/accounting/journal-entries'))
        var gr = this
        frappe.call({
            type: "GET",
            method:"vet_website.methods.get_current_user",
            args: {},
            callback: function(r){
                if (r.message) {
                    gr.setState({'currentUser': r.message});
                }
            }
        });
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetjournalentry.vetjournalentry.get_name_list",
            args: {filters: lastfilter},
            callback: function(r){
                if (r.message) {
                    gr.setState({'namelist': r.message});
                }
            }
        })
        var je = this
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetjournalentry.vetjournalentry.get_journal_entry_form",
            args: {name: id},
            callback: function(r){
                if (r.message) {
                    console.log(r.message);
                    var update = {'accounts': r.message.account_list, 'journals': r.message.journal_list, 'loaded': true}
                    if (r.message.journal_entry != undefined) {
                        update.data = r.message.journal_entry
                    }
                    je.setState(update);
                }
            }
        });
    }
    
    navigationAction(name){
        window.location.href="/main/accounting/journal-entries/edit?n="+name
    }
    
    handleInputChange(e, i=false) {
    	const value = e.target.value
    	const name = e.target.name
    	var new_data = this.state.data
    	
    	if(name == 'journal'){
    	    var journal = this.state.journals.find(j => j.name == value)
    	    if(journal){
    	        new_data.journal = value
    	        new_data.journal_name = journal.journal_name
    	    }
    	    else{
    	        new_data.journal = value
    	        new_data.journal_name = value
    	    }
    	    this.setState({data: new_data})
    	}
    	else if(name == 'account'){
    	    if (Object.keys(new_data.journal_items[i]).length === 0) {
                new_data.journal_items.push({})
            }
    	    var account = this.state.accounts.find(a => a.name == value)
    	    if(account){
    	        new_data.journal_items[i].account = value
    	        new_data.journal_items[i].account_name = account.account_name
    	        new_data.journal_items[i].account_code = account.account_code
    	    }
    	    else{
    	        new_data.journal_items[i].account = value
    	        new_data.journal_items[i].account_name = value
    	        new_data.journal_items[i].account_code = value
    	    }
    	    this.setState({data: new_data})
    	} else if(['debit','credit'].includes(name)){
            console.log(value)
            if (new RegExp(/,$/g).test(value)) {
                if (Object.keys(new_data.journal_items[i]).length === 0) {
                    new_data.journal_items.push({})
                }
                new_data.journal_items[i][name] = value
	            this.setState({data: new_data})
            } else {
                // var filtered = value.replace(/(?!)\D/g,'').replace(/,$/g,'.01').replace(',','.')
                var filtered = this.reverseFormatNumber(value, 'id')
                console.log(filtered)
                if(filtered != ''){
                    if (Object.keys(new_data.journal_items[i]).length === 0) {
                        new_data.journal_items.push({})
                    }
                    var formatted = parseFloat(filtered).toLocaleString('id-ID')
                    console.log(formatted)
                    new_data.journal_items[i][name] = formatted
                    this.setState({data: new_data})
                } else {
                    new_data.journal_items[i][name] = value
                    this.setState({data: new_data})
                }
            }
        } else if (name == 'date') {
            new_data[name] = value
            new_data.period = moment(value).format("MM-YYYY")
	        this.setState({data: new_data})
        }
    	else {
    	    new_data[name] = value
	        this.setState({data: new_data})
    	}
    }
    
    handleInputBlur(e, list, i=false) {
        const value = e.target.value
    	const name = e.target.name
    	var new_data = this.state.data
    	var selected = false
    	
    	if (name == 'journal') {
    	    selected = list.find(i => i.journal_name == value)
    	}
    	
    	if (name == 'account') {
    	    selected = list.find(i => i.account_name == value)
    	}
    	
    	if (!selected) {
    	    e.target.value = ''
    	    if (name == 'journal') {
    	        new_data.journal = ''
    	        new_data.journal_name = ''
    	    }else if (name == 'account') {
    	        new_data.journal_items[i] = {}
    	       // new_data.journal_items[i].account = ''
    	       // new_data.journal_items[i].account_name = ''
    	       // new_data.journal_items[i].account_code = ''
    	    } else {
    	        new_data[name] = ''
    	    }
    	    
    	    this.setState({data: new_data})
    	}
    }
    
    deleteRow(i){
        var new_data = Object.assign({}, this.state.data)
        if(new_data.journal_items[i].name != undefined){
            new_data.journal_items[i].delete = true
        }
        else {
            new_data.journal_items.splice(i, 1)
        }
        this.setState({data: new_data})
    }
    
    formSubmit(e) {
        e.preventDefault()
        var new_data = this.state.data
        var th = this
        var method
        var args = {}
        console.log(new_data)
        if(id == undefined || this.state.edit){
            method = "vet_website.vet_website.doctype.vetjournalentry.vetjournalentry.new_journal_entry"
            args = {data: new_data}
        }
        else{
            method = "vet_website.vet_website.doctype.vetjournalentry.vetjournalentry.post_journal_entry"
            args = {name: new_data.name}
        }

        new_data.journal_items.forEach((e) => {
            // e.debit = parseFloat(String(e.debit || 0).replace(/(?!)\D/g,'').replace(/,$/g,'').replace(',','.'))
            // e.credit = parseFloat(String(e.credit || 0).replace(/(?!)\D/g,'').replace(/,$/g,'').replace(',','.'))
            e.debit = parseFloat(this.reverseFormatNumber(String(e.debit || 0), 'id'))
            e.credit = parseFloat(this.reverseFormatNumber(String(e.credit || 0), 'id'))
        })
        
        var total_debit = new_data.journal_items.filter(a => !a.delete).reduce((total, j) => total+=parseFloat(j.debit||'0'),0)
        var total_credit = new_data.journal_items.filter(a => !a.delete).reduce((total, j) => total+=parseFloat(j.credit||'0'),0)
        console.log(total_debit.toFixed(2))
        console.log(total_credit.toFixed(2))
        if (total_debit.toFixed(2) != total_credit.toFixed(2)) {
            frappe.msgprint("Total debit tidak sama dengan total credit")
        } else {
            if (this.state.edit) {
                this.setState({'loading_simpan': true})
            } else {
                this.setState({'loading_post': true})
            }
            frappe.call({
        		type: "POST",
        		method:method,
        		args: args,
        		callback: function(r){
                    console.log(r.message)
        			if (r.message) {
        			    if (th.state.edit) {
        			        var update = {'accounts': r.message.account_list, 'journals': r.message.journal_list, 'edit': false, 'loading_simpan': false}
                            if (r.message.journal_entry != undefined) {
                                update.data = r.message.journal_entry
                            }
                            th.setState(update);
        			    } else {
                            th.setState({'loading_post': false})
        			        window.location.href = "/main/accounting/journal-entries/edit?n=" + r.message.journal_entry.name
        			    }
        			}
        			if (r.message.error) {
        				frappe.msgprint(r.message.error);
        			}
        		}
        	});
        }
    }
    
    toggleEdit(e, batal=false) {
        e.preventDefault()
        var new_data = this.state.data
        
        if (this.state.edit) {
            new_data.journal_items.forEach((e, index) => {
                // e.debit = parseFloat(String(e.debit || '0').replace(/(?!)\D/g,'').replace(/,$/g,'').replace(',','.'))
                // e.credit = parseFloat(String(e.credit || '0').replace(/(?!)\D/g,'').replace(/,$/g,'').replace(',','.'))
                e.debit = parseFloat(this.reverseFormatNumber(String(e.debit || 0), 'id'))
                e.credit = parseFloat(this.reverseFormatNumber(String(e.credit || 0), 'id'))
            })

            if (!new_data.journal_items[new_data.journal_items.length - 1].account) {
                var i = new_data.journal_items.length - 1
                new_data.journal_items.splice(i, 1)
            }
                
            this.setState({edit: false, data: new_data})
        } else {
            new_data.journal_items.forEach((e, index) => {
                e.debit = formatter2.format(e.debit || 0)
                e.credit = formatter2.format(e.credit || 0)
            })
            console.log(new_data.journal_items)
            new_data.journal_items.push({})
            this.setState({edit: true, data: new_data})
        }
    }

    reverseFormatNumber(val,locale){
        var group = new Intl.NumberFormat(locale).format(1111).replace(/1/g, '');
        var decimal = new Intl.NumberFormat(locale).format(1.1).replace(/1/g, '');
        var reversedVal = val.replace(new RegExp('\\' + group, 'g'), '');
        reversedVal = reversedVal.replace(new RegExp('\\' + decimal, 'g'), '.');
        return Number.isNaN(reversedVal) ? '' : reversedVal;
    }
    
    render() {
        var bgstyle = {background: '#FFFFFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', padding: '2px 32px', marginBottom: '15px'}
        var lh14 = {lineHeight: '14px'}
        var rowMinHeight = {minHeight: '64px'}
        var color = {color: '#056EAD', cursor: 'pointer'}
        var data = this.state.data
        var submit_button, batal_button
        var backButton = <span key="999" className="fs16 fw600" style={color} onClick={() => {history.go(-1)}}><i className="fa fa-chevron-left mr-1" style={color}></i>Back</span>
        var write = checkPermission('VetJournalEntry', this.state.currentUser, 'write')
        
        if (this.state.loaded) {
            console.log(this.state)
            
            if(this.state.data.status != 'Posted'){
                submit_button = <button type="submit" className={
                    this.state.loading_post
                    ? "btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2 disabled"
                    : "btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2"} style={lh14}>
                        {this.state.loading_post
                        ? (<span><i className="fa fa-spin fa-circle-o-notch mr-3"/>Loading...</span>)
                        : "Post"}</button>
            } else if (this.state.data.status == 'Posted' && !this.state.edit && write) {
                submit_button = <button type="button" className="btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2" style={lh14} onClick={this.toggleEdit}>Edit</button>
            } else if (this.state.edit) {
                submit_button = <button type="submit" className={
                    this.state.loading_simpan
                    ? "btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2 disabled"
                    : "btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2"} style={lh14}>{this.state.loading_simpan
                    ? (<span><i className="fa fa-spin fa-circle-o-notch mr-3"/>Loading...</span>)
                    : "Simpan"}</button>
                batal_button = <button type="button" className="btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2" style={lh14} onClick={e => this.toggleEdit(e, true)}>Batalkan</button>
            }
        	
    		return <form onSubmit={this.formSubmit}>
    	            	<div style={bgstyle}>
    	            		<div className="row mx-0 flex-row-reverse" style={rowMinHeight}>
		            			<div className="col-auto my-auto">
		            				{batal_button}
		            			</div>
		            			<div className="col-auto my-auto">
		            				{submit_button}
		            			</div>
		            			<div className="col-auto mr-auto my-auto px-0">
		            				{backButton}
		            			</div>
		            		</div>
    	            	</div>
    	            	<div className="row justify-content-end">
    	            	    <div className="col-auto">
    	            	        <StatusRow statuses={['Unposted', 'Posted']} current_status={data.status || 'Unposted'}/>
    	            	    </div>
    	            	    <div className="col-auto">
    	            	        <RecordNavigation currentname={this.state.data.name} namelist={this.state.namelist} navigationAction={this.navigationAction}/>
    	            	    </div>
    	            	</div>
    	            	<JournalEntryMainForm edit={this.state.edit} data={data} journals={this.state.journals} handleInputChange={this.handleInputChange} handleInputBlur={this.handleInputBlur}/>
    	            	<JournalEntryItems edit={this.state.edit} items={this.state.data.journal_items} accounts={this.state.accounts} status={this.state.data.status || 'Unposted'} handleInputChange={this.handleInputChange} handleInputBlur={this.handleInputBlur} deleteRow={this.deleteRow}/>
    	            </form>
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

class JournalEntryMainForm extends React.Component {
//     referenceClick(e){
//     e.stopPropagation()
//     var reference = this.props.data.reference
//     var regexes = [
//         {regex: /(POSORDER-\d)/g, pathname: '/main/kasir/pos-order/form?n='},
//         {regex: /(PO\d)/g, pathname: '/main/purchases/purchase-order/edit?n='},
//         {regex: /(VCI-\d)/g, pathname: '/main/kasir/customer-invoices/edit?n='},
//         {regex: /(VOC-\d)/g, pathname: '/main/kasir/deposit?id='},
//         {regex: /(VE-\d)/g, pathname: '/main/accounting/expenses?n='},
//         {regex: /(VAS-\d)/g, pathname: '/main/accounting/asset/edit?n='},
//         {regex: /(VAJ-\d)/g, pathname: '/main/inventory/adjustment/edit?n='},
//         {regex: /(VO-\d)/g, pathname: '/main/inventory/operation/edit?n='},
//     ]
//     regexes.forEach(r => {
//         console.log(r.regex)
//         if(reference.match(r.regex)){
//             window.location.href = r.pathname+reference
//         }
//     })
// }
    
    render() {
        var moment_date = moment()
        // var period_list = Array.apply(0, Array(36)).map((a,i) => moment().month(i).format('MM/YYYY'))
        var bgstyle2 = {background: '#FFFFFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)'}
        var inputStyle = {height:'35px'}
        var cursor = {cursor: 'pointer'}
        var data = this.props.data
        var journal, period, date, reference, keterangan
        var journal_options = []
        // var period_options = []
        
        if (id == undefined || this.props.edit) {
            
            this.props.journals.forEach(function(item, index) {
                journal_options.push(<option value={item.name} key={index.toString()}>{item.journal_name}</option>)
            })
            
            // period_list.forEach((i, index) => period_options.push(<option value={i} key={i}>{i}</option>))
            
            journal = <input required name='journal' list="journal" id="journal" className="form-control border-0 lightbg" onChange={this.props.handleInputChange} onBlur={e => this.props.handleInputBlur(e, this.props.journals)} value={data.journal_name || ''}/>
			// period = (
			//     <select required id="period" name='period' className="form-control border-0 lightbg" onChange={this.props.handleInputChange} value={data.period || ''}>
			//     <option/>
			//     {period_options}
			//     </select>
			//     )

            period = <input readOnly id="period" name='period' className="form-control border-0 lightbg" onChange={this.props.handleInputChange} value={data.period || ''} />
                    
			
			date = <input required type="date" id="date" name='date' className="form-control border-0 lightbg" onChange={this.props.handleInputChange} value={data.date || ''}/>
			reference = <input required type="text" id="reference" name='reference' className="form-control border-0 lightbg" onChange={this.props.handleInputChange} value={data.reference || ''}/>
            keterangan = <textarea id="keterangan" name='keterangan' rows='4' className="form-control border-0 lightbg" onChange={this.props.handleInputChange} value={data.keterangan || ''}></textarea>
        } else {
            var reHref = ''
            var reference = this.props.data.reference
            var regexes = [
                {regex: /(POSORDER-\d)/g, pathname: '/main/kasir/pos-order/form?n='},
                {regex: /(PO\d)/g, pathname: '/main/purchases/purchase-order/edit?n='},
                {regex: /(VCI-\d)/g, pathname: '/main/kasir/customer-invoices/edit?n='},
                {regex: /(VOC-\d)/g, pathname: '/main/kasir/deposit?id='},
                {regex: /(VE-\d)/g, pathname: '/main/accounting/expenses?n='},
                {regex: /(VAS-\d)/g, pathname: '/main/accounting/asset/edit?n='},
                {regex: /(VAJ-\d)/g, pathname: '/main/inventory/adjustment/edit?n='},
                {regex: /(VO-\d)/g, pathname: '/main/inventory/operation/edit?n='},
            ]
            regexes.forEach(r => {
                console.log(r.regex)
                if(reference.match(r.regex)){
                    reHref = r.pathname+reference
                }
            })
            var link_reference = <a href={reHref}><img src="/static/img/main/menu/tautan.png" className="mx-2" onClick={e => this.referenceClick(e)} style={cursor}/></a>
            
            journal = <span className="fs16 px-0 d-block">{data.journal_name}</span>
            period = <span className="fs16 px-0 d-block">{data.period}</span>
            date = <span className="fs16 px-0 d-block">{moment(data.date).format("DD-MM-YYYY")}</span>
            reference = <span className="fs16 px-0 d-block">{data.reference || ''}{(data.reference || '').match(/(POSORDER-\d)|(PO\d)|(VCI-\d)|(VOC-\d)|(VE-\d)|(VAS-\d)|(VAJ-\d)|(VO-\d)/g)?link_reference:false}</span>
            keterangan = <span className="fs16 px-0 d-block">{data.keterangan}</span>
        }
        
        return <div>
        			<p className="fs18 fw600 text-dark mb-2">{data.name || id || 'Journal Entry'}</p>
        			<div style={bgstyle2} className="p-4 mb-4">
        			    <datalist id="journal">
							{journal_options}
						</datalist>
		        		<div className="form-row">
                            <div className="col-8">
                                <div className="form-row">
                                    <div className="col">
                                        <div className="form-group">
                                            <label htmlFor="journal" className="fw600">Journal</label>
                                            {journal}
                                        </div>
                                    </div>
                                    <div className="col">
                                        <div className="form-group">
                                            <label htmlFor="period" className="fw600">Period</label>
                                            {period}
                                        </div>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="col">
                                        <div className="form-group">
                                            <label htmlFor="date" className="fw600">Date</label>
                                            {date}
                                        </div>
                                    </div>
                                    <div className="col">
                                        <div className="form-group">
                                            <label htmlFor="reference" className="fw600">Reference</label>
                                            {reference}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-4">
                                <div className="form-group">
                                    <label htmlFor="keterangan" className="fw600">Keterangan</label>
                                    <div className="row mx-0">
                                        {keterangan}
                                    </div>
                                </div>
                            </div>
                        </div>
		        	</div>
        		</div>
    }
}

class JournalEntryItems extends React.Component {
    reverseFormatNumber(val,locale){
        var group = new Intl.NumberFormat(locale).format(1111).replace(/1/g, '');
        var decimal = new Intl.NumberFormat(locale).format(1.1).replace(/1/g, '');
        var reversedVal = val.replace(new RegExp('\\' + group, 'g'), '');
        reversedVal = reversedVal.replace(new RegExp('\\' + decimal, 'g'), '.');
        return Number.isNaN(reversedVal) ? '' : reversedVal;
    }
    
    render() {
        var panel_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px'}
        var items = this.props.items || []
        var rows = []
        var divStyle = {width: '11px'}
        var totalRow
        var bgStyle = {background: '#F5FBFF'}
        var total_debit = 0
        var total_credit = 0
        
        if (items.length != 0){
            var ji = this
            items.forEach(function(item, index){
                if(!item.delete && (item.debit != 0 || item.credit != 0)){
                    rows.push(
                        <JournalEntryItemsRow edit={ji.props.edit} key={index.toString()} accounts={ji.props.accounts} item={item} status={ji.props.status} handleInputBlur={ji.props.handleInputBlur} handleInputChange={ji.props.handleInputChange} index={index.toString()} deleteRow={() => ji.props.deleteRow(index.toString())}/>
                    )
                    // var new_debit = parseFloat(String(item.debit || '0').replace(/(?!)\D/g,'').replace(/,$/g,'').replace(',','.'))
                    // var new_credit = parseFloat(String(item.credit || '0').replace(/(?!)\D/g,'').replace(/,$/g,'').replace(',','.'))

                    var new_debit, new_credit

                    if (id == undefined || ji.props.edit) {
                        new_debit = parseFloat(ji.reverseFormatNumber(String(item.debit || 0), 'id'))
                        new_credit = parseFloat(ji.reverseFormatNumber(String(item.credit || 0), 'id'))
                    } else {
                        new_debit = item.debit || 0
                        new_credit = item.credit || 0
                    }

                    console.log(new_debit)
                    console.log(item.debit)

                    total_debit += new_debit
                    total_credit += new_credit
                }
            })
        }

        totalRow = <div className="row mx-0">
            <div className="col row-list" style={bgStyle}>
                <div className="row mx-0 fs14 fw600">
                    <div className="col-7">Total</div>
                    <div className="col text-center my-auto">
                        {formatter2.format(total_debit || 0)}
                    </div>
                    <div className="col text-center my-auto">
                        {formatter2.format(total_credit || 0)}
                    </div>
                    <div className="col-auto text-center my-auto">
                        <div style={divStyle}/>
                    </div>
                </div>
            </div>
        </div>
        
        return(
            <div>
    			<div style={panel_style} className="p-4 mb-4">
    			    <div className="row mx-0 fs14 fw600 row-header">
        				<div className="col-7">
        					<span className="my-auto">Account</span>
        				</div>
        				<div className="col text-center">
        					<span className="my-auto">Debit</span>
        				</div>
        				<div className="col text-center">
        					<span className="my-auto">Credit</span>
        				</div>
        				<div className="col-auto text-center">
        				    <div style={divStyle}/>
        				</div>
        			</div>
        			{rows}
                    {totalRow}
	        	</div>
    		</div>
        )
    }
}

class JournalEntryItemsRow extends React.Component {
    render() {
        var item = this.props.item
        var index = this.props.index
        var account, debit, credit
        var accountOptions = []
        var bgStyle = {background: '#F5FBFF'}
        var cursor = {cursor: 'pointer'}
        var divStyle = {width: '11px'}
        var deleteButton
        var required = false
        
        if (Object.keys(item).length != 0 && (id == undefined || this.props.edit)) {
            deleteButton = <i className="fa fa-trash" style={cursor} onClick={this.props.deleteRow}/>
            required = true
        } else {
            deleteButton = <div style={divStyle}/>
        }
        
        if (id == undefined || this.props.edit) {
            this.props.accounts.filter(a => a.is_parent == 0).forEach(function(item, index) {
                accountOptions.push(<option value={item.name} key={index.toString()}>{item.account_name}</option>)
            })
            
            account = <input required={required} name='account' list={"account"+index} id={"account"+index} style={bgStyle} className="form-control border-0 fs14 fw600 px-0" onChange={e => this.props.handleInputChange(e, index)} onBlur={e => this.props.handleInputBlur(e, this.props.accounts, this.props.index)} value={item.account_name || ''}/>
			debit = <input type="text" name="debit" id={"debit"+index} style={bgStyle} className="form-control border-0 fs14 fw600 text-center" onChange={e => this.props.handleInputChange(e, index)} value={item.debit || ''} placeholder="0"/>
			credit = <input type="text" name="credit" id={"credit"+index} style={bgStyle} className="form-control border-0 fs14 fw600 text-center" onChange={e => this.props.handleInputChange(e, index)} value={item.credit || ''} placeholder="0"/>
							
        } else {
            account = <span className="my-auto">{item.account_code+" "+item.account_name}</span>
            debit = <span className="my-auto">{formatter2.format(item.debit || 0)}</span>
            credit = <span className="my-auto">{formatter2.format(item.credit || 0)}</span>
        }
        
        return(
            <div className="row mx-0">
        		<div className="col row-list" style={bgStyle}>
        		    <datalist id={"account"+index}>
						{accountOptions}
					</datalist>
        			<div className="row mx-0 fs14 fw600">
        				<div className="col-7">
        					{account}
        				</div>
        				<div className="col text-center my-auto">
        					{debit}
        				</div>
        				<div className="col text-center my-auto">
        					{credit}
        				</div>
        				<div className="col-auto text-center my-auto">
        					{deleteButton}
        				</div>
        			</div>
        		</div>
        	</div>
        )
    }
}

ReactDOM.render(<JournalEntry />,document.getElementById("journal_entry_form"));