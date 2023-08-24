var id = getUrlParameter('n')

class Asset extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'loaded': false,
            'data': {},
            'edit': false,
            'popup_sell': false,
            'currentUser': {}
        }
        
        this.handleInputChange = this.handleInputChange.bind(this)
        this.handleInputBlur = this.handleInputBlur.bind(this)
        this.formSubmit = this.formSubmit.bind(this)
        this.toggleMode = this.toggleMode.bind(this)
        this.toggleSell = this.toggleSell.bind(this)
        this.updateData = this.updateData.bind(this)
        this.navigationAction = this.navigationAction.bind(this)
    }
    
    componentDidMount() {
        var lastfilter = JSON.parse(sessionStorage.getItem('/main/accounting/asset'))
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
            method:"vet_website.vet_website.doctype.vetasset.vetasset.get_name_list",
            args: {filters: lastfilter},
            callback: function(r){
                if (r.message) {
                    gr.setState({'namelist': r.message});
                }
            }
        })
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetasset.vetasset.get_asset",
            args: {name: id},
            callback: function(r){
                if (r.message) {
                    console.log(r.message);
                    if (r.message.asset.status == 'Draft' || !r.message.asset.status) {
                        var moment_date = moment()
                        r.message.asset.asset_date = moment_date.format('YYYY-MM-DD')
                        r.message.asset.duration_type = 'Year'
                    }
                    
                    gr.setState({'data': r.message.asset, 'coaAll': r.message.coaAll, 'loaded': true});
                }
            }
        });
    }
    
    formSubmit(e) {
        e.preventDefault()
        var new_data = this.state.data
        var th = this
        
        if (!new_data.status || new_data.status == 'Draft') {
            var selected_fixed = this.state.coaAll.find(i => i.account_name == new_data.fixed_asset_account)
            var selected_depreciation = this.state.coaAll.find(i => i.account_name == new_data.depreciation_account)
            var selected_expense = this.state.coaAll.find(i => i.account_name == new_data.expense_account)
            var selected_payment = this.state.coaAll.find(i => i.account_name == new_data.payment_account)
            new_data.fixed_asset_account = selected_fixed.name
            new_data.depreciation_account = selected_depreciation.name
            new_data.expense_account = selected_expense.name
            new_data.payment_account = selected_payment.name
        }
        
        console.log(new_data)
        
        frappe.call({
    		type: "POST",
    		method:"vet_website.vet_website.doctype.vetasset.vetasset.submit_asset",
    		args: {data: new_data},
    		callback: function(r){
    			if (r.message.asset) {
    			    if (window.location.href.includes('?')) {
    			        th.setState({data: r.message.asset, edit: false})
    			    } else {
    			        window.location.href = "/main/accounting/asset/edit?n=" + r.message.asset.name
    			    }
    			}
    			if (r.message.error) {
    				frappe.msgprint(r.message.error);
    			}
    		}
    	});
    }
    
    navigationAction(name){
        window.location.href="/main/accounting/asset/edit?n="+name
    }
    
    handleInputChange(e, i=false) {
    	const value = e.target.value
    	const name = e.target.name
    	var new_data = this.state.data
    	
    	if (i) {
    	    new_data.depreciation_list[i][name] = value
    	} else {
    	    if (['fixed_asset_account', 'depreciation_account', 'expense_account', 'payment_account'].includes(name)) {
        	    new_data[name] = value.slice(value.search(' ') + 1)
        	} else {
        	    new_data[name] = value
        	}
    	}
    	
    	this.setState({data: new_data})
    }
    
    handleInputBlur(e, list, i=false) {
        const value = e.target.value
    	const name = e.target.name
    	var new_data = this.state.data
    	var selected = false
    	
    	selected = list.find(i => i.account_name == value.slice(value.search(' ') + 1))
    	
    	
    	if (!selected) {
    	    e.target.value = ''
    	    new_data[name] = ''
    	    
    	    this.setState({data: new_data})
    	}
    }
    
    toggleMode(e) {
        e.preventDefault()
        this.setState({edit: !this.state.edit})
    }
    
    toggleSell(e) {
        e.preventDefault()
        this.setState({popup_sell: !this.state.popup_sell})
    }
    
    updateData(data) {
        this.setState({data: data, popup_sell: false})
    }
    
    // goToJournalEntries(){
    //     window.location.href = '/main/accounting/journal-entries?reference=' + this.state.data.name
    // }
    
    render() {
        var bgstyle = {background: '#FFFFFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', padding: '2px 32px', marginBottom: '15px'}
        var lh14 = {lineHeight: '14px'}
        var rowMinHeight = {minHeight: '64px'}
        var color = {color: '#056EAD', cursor: 'pointer'}
        var data = this.state.data
        var headerButton
        var cursor = {cursor: 'pointer'}
        var backButton = <span key="999" className="fs16 fw600 mr-auto my-auto" style={color} onClick={() => window.location.href='/main/accounting/asset'}><i className="fa fa-chevron-left mr-1" style={color}></i>Back</span>
        var write = checkPermission('VetAsset', this.state.currentUser, 'write')
        var sell_dispose = checkPermission('VetAsset', this.state.currentUser, 'sell/dispose')
        
        if (this.state.loaded) {
        	
        	if (data.status == 'Draft' || id == undefined || this.state.edit) {
        	    if (this.state.edit) {
        	        var batalkan = <div className="col-auto my-auto">
		            				<button type="batalkan" className="btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2" style={lh14} onClick={this.toggleMode}>Batalkan</button>
		            			</div>
        	    }
        		headerButton = <div className="row mx-0 flex-row-reverse" style={rowMinHeight}>
        		                    {batalkan}
			            			<div className="col-auto my-auto">
			            				<button type="submit" className="btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2" style={lh14}>Simpan</button>
			            			</div>
			            			{backButton}
			            		</div>
        	} else if (data.status == 'Running') {
        	    headerButton = <div className="row mx-0 flex-row-reverse" style={rowMinHeight}>
			            			{write?<div className="col-auto my-auto"><button type="button" className="btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2" style={lh14} onClick={this.toggleMode}>Edit</button></div>:false}
			            			{sell_dispose?<div className="col-auto my-auto"><button type="button" className="btn btn-sm btn-success fs12 text-uppercase h-100 px-3 fwbold py-2" style={lh14} onClick={this.toggleSell}>Sell/Dispose</button></div>:false}
			            			<a href={'/main/accounting/journal-entries?reference=' + this.state.data.name} className="col-auto mr-auto" style={cursor}>
                			            <img className="d-block mx-auto mt-2 header-icon" src="/static/img/main/menu/journal_entries.png"/>
                			            <p className="mb-0 fs12 text-muted text-center">Journal Entries</p>
                			        </a>
			            			{backButton}
			            		</div>
        	} else {
        	    headerButton = <div className="row mx-0 flex-row-reverse" style={rowMinHeight}>
        	                        <a href={'/main/accounting/journal-entries?reference=' + this.state.data.name} className="col-auto mr-auto" style={cursor}>
                			            <img className="d-block mx-auto mt-2 header-icon" src="/static/img/main/menu/journal_entries.png"/>
                			            <p className="mb-0 fs12 text-muted text-center">Journal Entries</p>
                			        </a>
			            			{backButton}
			            		</div>
        	}
        	
        	if (this.state.popup_sell) {
        	    var popup_sell = <PopupSell name={data.name} toggleSell={this.toggleSell} coaAll={this.state.coaAll} updateData={this.updateData}/>
        	}
        	
    		return <form onSubmit={this.formSubmit}>
    	            	<div style={bgstyle}>
    	            		{headerButton}
    	            	</div>
    	            	<div className="row justify-content-end">
    	            	    <div className="col-auto">
    	            	        <StatusRow statuses={['Draft', 'Running', 'Sell/Dispose']} current_status={data.status || 'Draft'}/>
    	            	    </div>
    	            	    <div className="col-auto">
    	            	        <RecordNavigation currentname={data.name} namelist={this.state.namelist} navigationAction={this.navigationAction}/>
    	            	    </div>
    	            	</div>
    	            	<AssetMainForm data={data} handleInputChange={this.handleInputChange} edit={this.state.edit}/>
    	            	<AssetDetail data={data} coaAll={this.state.coaAll} handleInputChange={this.handleInputChange} handleInputBlur={this.handleInputBlur} edit={this.state.edit}/>
    	            	{popup_sell}
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

class PopupSell extends React.Component {
    constructor(props) {
        super(props)
        this.state={
            'data': {
                name: this.props.name,
                action: 'Sell'
            }
        }
        
        this.handleInputChange = this.handleInputChange.bind(this)
        this.submitSell = this.submitSell.bind(this)
    }
    
    handleInputChange(e) {
        var name = e.target.name
        var value = e.target.value
        var new_data = this.state.data
        
        new_data[name] = value
        this.setState({data: new_data})
    }
    
    submitSell(e) {
        e.preventDefault()
        var th = this
        var new_data = this.state.data
        
        new_data['cash_account'] = this.props.coaAll.find(i => i.account_name == new_data['cash_account']).name
        new_data['lost_account'] = this.props.coaAll.find(i => i.account_name == new_data['lost_account']).name
        
        console.log(new_data)
        
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetasset.vetasset.sell_asset",
            args: {data: new_data},
            callback: function(r){
                if (r.message.asset) {
                    th.props.updateData(r.message.asset)
                }
            }
        });
    }
    
    handleInputBlur(e, list) {
        const value = e.target.value
    	const name = e.target.name
    	var new_data = this.state.data
    	var selected = false
    	
        selected = list.find(i => i.account_name == value)
    	
    	if (!selected) {
    	    e.target.value = ''
    	    new_data[name] = ''
    	    
    	    this.setState({data: new_data})
    	}
    }
    
    render() {
        var maxwidth = {maxWidth: '35%', paddingTop: '100px'}
        var simpanStyle = {background: '#056EAD', color: '#FFFFFF'}
        var batalStyle = {color: '#056EAD', border: '1px solid #056EAD'}
        var input_style = {background: '#CEEDFF'}
        var lost_options = []
        var cash_options = []
        
        var biaya_lain_account = this.props.coaAll.find(i => i.account_code == '8-0000').name
        var kas_bank_account = this.props.coaAll.find(i => i.account_code == '1-11000').name
        
        this.props.coaAll.filter(i => i.account_parent == biaya_lain_account).forEach(function(item, index) {
            lost_options.push(<option value={item.account_name} key={index.toString()} />)
        })
        
        this.props.coaAll.filter(i => i.account_parent == kas_bank_account).forEach(function(item, index) {
            cash_options.push(<option value={item.account_name} key={index.toString()} />)
        })
        
        return (
                <div className="menu-popup">
                    <div className="container" style={maxwidth}>
                        <div className="bg-white p-4">
            				<div className="form-group">
            					<label htmlFor="lost_account" className="fw600">Lost Account</label>
            					<input style={input_style} name='lost_account' list="list_lost" id="lost_account" className="form-control border-0 " onChange={this.handleInputChange} onBlur={e => this.handleInputBlur(e, this.props.coaAll)} />
								<datalist id="list_lost">
									{lost_options}
								</datalist>
            				</div>
            				<div className="form-group">
            					<label htmlFor="cash_account" className="fw600">Cash Account</label>
            					<input style={input_style} name='cash_account' list="list_cash" id="cash_account" className="form-control border-0 " onChange={this.handleInputChange} onBlur={e => this.handleInputBlur(e, this.props.coaAll)} />
								<datalist id="list_cash">
									{cash_options}
								</datalist>
            				</div>
            				<div className="form-group">
            					<label htmlFor="amount" className="fw600">Amount</label>
            					<input required type="text" id="amount" name='amount' className="form-control border-0" style={input_style} onChange={this.handleInputChange}/>
            				</div>
                            <div className="row justify-content-center mb-2">
                                <div className="col-auto d-flex mt-4">
                                    <button className="btn btn-sm fs18 h-100 fwbold px-4" style={simpanStyle} onClick={this.submitSell}>Simpan</button>
                                </div>
                                <div className="col-auto d-flex mt-4">
                                    <button className="btn btn-sm fs18 h-100 fwbold px-4" style={batalStyle} onClick={this.props.toggleSell}>Batal</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="menu-popup-close" onClick={this.props.toggleSell}></div>
                </div>
            )
    }
}

class AssetMainForm extends React.Component {
    render() {
        var bgstyle2 = {background: '#FFFFFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)'}
        var data = this.props.data
        var inputAssetName, inputPeriod, inputAssetDate, book_value
        var input_style = {background: '#CEEDFF'}
        var period_options = []
        
        if (data.status == 'Draft' || id == undefined || this.props.edit) {
            var period_list = Array.apply(0, Array(12)).map((a,i) => moment().month(i).format('MM/YYYY'))
            period_list.forEach((i, index) => period_options.push(<option value={i} key={i}>{i}</option>))
            
			inputAssetDate = <input required type="date" id="asset_date" name='asset_date' className="form-control border-0" style={input_style} onChange={this.props.handleInputChange} defaultValue={data.asset_date || ''}/>
			inputAssetName = <input required type="text" id="asset_name" name='asset_name' className="form-control border-0" style={input_style} onChange={this.props.handleInputChange} defaultValue={data.asset_name || ''}/>
			inputPeriod = <select required style={input_style} id="period" name='period' className="form-control border-0 " onChange={this.props.handleInputChange} value={data.period || ''}>
                			    <option/>
                			    {period_options}
            			    </select>
        } else {
            inputAssetDate = <div>
                                <span className="fs16 px-0">{moment(data.asset_date).format("DD-MM-YYYY")}</span>
                            </div>
			inputAssetName = <div>
			                    <span className="fs16 px-0">{data.asset_name}</span>
			                 </div>
			inputPeriod = <div>
			                    <span className="fs16 px-0">{data.period}</span>
			              </div>
			book_value = <div className="col-2 mx-3">
        	                <div className="form-group">
            					<label htmlFor="deliver_to" className="fw600">Book Value</label>
            					<div>
            					    <span className="fs16 px-0">{formatter.format(data.book_value)}</span>
            					</div>
            				</div>
    	                </div>
        }
        
        return <div>
        			<p className="fs18 fw600 text-dark mb-0">{data.name || 'Data Asset'}</p>
        			<div style={bgstyle2} className="p-4 mb-4">
		        		<div className="form-row">
            	            <div className="col-3 mx-3">
            	                <div className="form-group">
                					<label htmlFor="asset_name" className="fw600">Asset Name</label>
                					{inputAssetName}
                				</div>
        	                </div>
        	                <div className="col-3 mx-3">
            	                <div className="form-group">
                					<label htmlFor="period" className="fw600">Period</label>
                					{inputPeriod}
                				</div>
        	                </div>
        	                <div className="col-3 mx-3">
        	                    <div className="form-group">
                					<label htmlFor="asset_date" className="fw600">Date</label>
                					{inputAssetDate}
                				</div>
        	                </div>
        	                {book_value}
	            		</div>
		        	</div>
        		</div>
    }
}

class AssetDetail extends React.Component {
    render() {
        var panel_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px'}
        var input_style = {background: '#CEEDFF'}
        var color = {color: '#056EAD'}
        var checkbox_style = {width: '20px', height: '20px'}
        var data = this.props.data
        var content
        var fixed_options = []
        var depreciable_options = []
        var expense_options = []
        var payment_options = []
        
        if (data.status == 'Draft' || id == undefined || this.props.edit) {
            var aktiva_tetap_account = this.props.coaAll.find(i => i.account_code == '1-20000').name
            var biaya_penyusutan_account = this.props.coaAll.find(i => i.account_code == '6-40000').name
            var hutang_bank_account = this.props.coaAll.find(i => i.account_code == '2-21000').name
            var hutang_biaya_account = this.props.coaAll.find(i => i.account_code == '2-12000').name
            var hutang_lainnya_account = this.props.coaAll.find(i => i.account_code == '2-15000').name
            
            var filtered_depreciable_coa = this.props.coaAll.filter(i => i.account_parent == aktiva_tetap_account)
            var map_filtered_depreciable = filtered_depreciable_coa.map(i => i.name)
            var filtered_depreciable_coa2 = this.props.coaAll.filter(i => map_filtered_depreciable.includes(i.account_parent))
            
            var filtered_expense_coa = this.props.coaAll.filter(i => i.account_parent == biaya_penyusutan_account)
            var map_filtered_expense = filtered_expense_coa.map(i => i.name)
            var filtered_expense_coa2 = this.props.coaAll.filter(i => map_filtered_expense.includes(i.account_parent))
            
            var filtered_payment_coa = this.props.coaAll.filter(i => [hutang_bank_account, hutang_lainnya_account, hutang_biaya_account].includes(i.account_parent))
            
            filtered_payment_coa.forEach(function(item, index) {
                payment_options.push(<option value={item.account_code + ' ' + item.account_name} key={index.toString()}/>)
            })
            
            filtered_depreciable_coa.concat(filtered_depreciable_coa2).forEach(function(item, index) {
                depreciable_options.push(<option value={item.account_code + ' ' + item.account_name} key={index.toString()} />)
            })
            
            filtered_expense_coa.concat(filtered_expense_coa2).forEach(function(item, index) {
                expense_options.push(<option value={item.account_code + ' ' + item.account_name} key={index.toString()} />)
            })
            
            filtered_depreciable_coa.concat(filtered_depreciable_coa2).forEach(function(item, index) {
                fixed_options.push(<option value={item.account_code + ' ' + item.account_name} key={index.toString()} />)
            })
            
            var readOnly = false
            if (this.props.edit) {
                readOnly = true
            }
            
            content = <div className="row mx-0 fs14 fw600">
        				<div className="col-6 px-0">
        				    <p className="fs20 fw600 mx-3">Asset Values</p>
        				    <div className="form-group mx-3">
            					<label htmlFor="original_value" className="fw600">Original Value</label>
            					<input readOnly={readOnly} type="text" id="original_value" name='original_value' className="form-control border-0" style={input_style} onChange={this.props.handleInputChange} defaultValue={data.original_value || ''}/>
            				</div>
            				<div className="form-group mx-3">
            					<label htmlFor="acquistion_date" className="fw600">Acquistion Date</label>
            					<input type="date" id="acquistion_date" name='acquistion_date' className="form-control border-0" style={input_style} onChange={this.props.handleInputChange} defaultValue={data.acquistion_date || ''}/>
            				</div>
            				<p className="fs20 fw600 mx-3">Depreciation Method</p>
            				<p className="fs16 fw600 mx-3">Method</p>
            				<div className="row mx-3">
            				    <div className="col">
            				        <div className="row mx-0">
            				            <div className="col-auto">
            				                <input type="radio" name="method" id="method" value="Linear" style={checkbox_style} onChange={this.props.handleInputChange} checked={data.method == 'Linear'}/>
            				            </div>
            				            <div className="col">
            				                <label htmlFor="linear" className="fs14 fw600">Linear</label>
            				            </div>
            				        </div>
            				    </div>
            				    <div className="col">
            				        <div className="row mx-0">
            				            <div className="col-auto">
            				                <input type="radio" name="method" id="method" value="Degressive" style={checkbox_style} onChange={this.props.handleInputChange} checked={data.method == 'Degressive'}/>
            				            </div>
            				            <div className="col">
            				                <label htmlFor="deggressive" className="fs14 fw600">Degressive</label>
            				            </div>
            				        </div>
            				    </div>
            				    <div className="col">
            				        <div className="row mx-0">
            				            <div className="col-auto">
            				                <input type="radio" name="method" id="method" value="Accelerated Degressive" style={checkbox_style} onChange={this.props.handleInputChange} checked={data.method == 'Accelerated Degressive'}/>
            				            </div>
            				            <div className="col">
            				                <label htmlFor="accelerated_degressive" className="fs14 fw600">Accelerated Degressive</label>
            				            </div>
            				        </div>
            				    </div>
            				</div>
            				<div className="form-group mx-3">
            					<label htmlFor="residual_value" className="fw600">Residual Value</label>
            					<input type="text" id="residual_value" name='residual_value' className="form-control border-0" style={input_style} onChange={this.props.handleInputChange} defaultValue={data.residual_value != undefined ? data.residual_value.toString() : ''}/>
            				</div>
    				        <div className="form-group mx-3">
            					<label htmlFor="duration" className="fw600">Duration</label>
            					<div className="row">
            					    <div className="col-4">
            					        <input type="text" id="duration" name='duration' className="form-control border-0" style={input_style} onChange={this.props.handleInputChange} defaultValue={data.duration || ''}/>
            					    </div>
            					    <div className="col-8">
            					        <select style={input_style} id="duration_type" name='duration_type' className="form-control border-0 " onChange={this.props.handleInputChange} value={data.duration_type || ''}>
                            			    <option value="Year">Year</option>
                            			    <option value="Month">Month</option>
                        			    </select>
            					    </div>
            					</div>
            				</div>
        				</div>
        				<div className="col-6 px-0">
        				    <p className="fs20 fw600 mx-3">Accounting</p>
            				<div className="form-group mx-3">
            					<label htmlFor="payment_account" className="fw600">Payment Account</label>
            					<input readOnly={readOnly} style={input_style} name='payment_account' list="list_payment" id="payment_account" className="form-control border-0 " onChange={this.props.handleInputChange} onBlur={e => this.props.handleInputBlur(e, filtered_payment_coa)} defaultValue={data.payment_account ? data.payment_account_code + ' ' + data.payment_account_name : ''}/>
								<datalist id="list_payment">
									{payment_options}
								</datalist>
            				</div>
        				    <div className="form-group mx-3">
            					<label htmlFor="fixed_asset_account" className="fw600">Fixed Asset Account</label>
            					<input readOnly={readOnly} style={input_style} name='fixed_asset_account' list="list_fixed" id="fixed_asset_account" className="form-control border-0 " onChange={this.props.handleInputChange} onBlur={e => this.props.handleInputBlur(e, filtered_depreciable_coa.concat(filtered_depreciable_coa2))} defaultValue={data.fixed_asset_account ? data.fixed_asset_account_code + ' ' + data.fixed_asset_account_name : ''}/>
								<datalist id="list_fixed">
									{fixed_options}
								</datalist>
            				</div>
            				<div className="form-group mx-3">
            					<label htmlFor="depreciation_account" className="fw600">Depreciation Account</label>
            					<input readOnly={readOnly} style={input_style} name='depreciation_account' list="list_depreciable" id="depreciation_account" className="form-control border-0 " onChange={this.props.handleInputChange} onBlur={e => this.props.handleInputBlur(e, filtered_depreciable_coa.concat(filtered_depreciable_coa2))} defaultValue={data.depreciation_account ? data.depreciation_account_code + ' ' + data.depreciation_account_name : ''}/>
								<datalist id="list_depreciable">
									{depreciable_options}
								</datalist>
            				</div>
            				<div className="form-group mx-3">
            					<label htmlFor="expense_account" className="fw600">Expense Account</label>
            					<input readOnly={readOnly} style={input_style} name='expense_account' list="list_expense" id="expense_account" className="form-control border-0 " onChange={this.props.handleInputChange} onBlur={e => this.props.handleInputBlur(e, filtered_expense_coa.concat(filtered_expense_coa2))} defaultValue={data.expense_account ? data.expense_account_code + ' ' + data.expense_account_name : ''}/>
								<datalist id="list_expense">
									{expense_options}
								</datalist>
            				</div>
        				</div>
        			</div>
        } else {
            content = <div  style={color}>
                        <div className="row mx-0 fs14 fw600">
            				<div className="col-6">
            				    <p className="fs20 fw600 mb-3">Asset Values</p>
            				    <div className="row mb-2">
            				        <div className="col-6 fs16 fw600">Original Value</div>
            				        <div className="col-6"><span className="fs16 px-0">{formatter.format(data.original_value)}</span></div>
            				    </div>
            				    <div className="row mb-4">
            				        <div className="col-6 fs16 fw600">Acquistion Date</div>
            				        <div className="col-6"><span className="fs16 px-0">{moment(data.acquistion_date).format("DD-MM-YYYY")}</span></div>
            				    </div>
            				    <p className="fs20 fw600 mb-3">Depreciation Method</p>
            				    <div className="row mb-2">
            				        <div className="col-6 fs16 fw600">Method</div>
            				        <div className="col-6"><span className="fs16 px-0">{data.method}</span></div>
            				    </div>
            				    <div className="row mb-2">
            				        <div className="col-6 fs16 fw600">Duration</div>
            				        <div className="col-6"><span className="fs16 px-0">{data.duration + ' ' + (data.duration > 1 ? data.duration_type + 's' : data.duration_type)}</span></div>
            				    </div>
            				    <div className="row mb-4">
            				        <div className="col-6 fs16 fw600">Residual Value</div>
            				        <div className="col-6"><span className="fs16 px-0">{formatter.format(data.residual_value)}</span></div>
            				    </div>
            				</div>
            				<div className="col-6">
            				    <p className="fs20 fw600 mb-3">Accounting</p>
            				    <div className="row mb-2">
            				        <div className="col-6 fs16 fw600">Payment Account</div>
            				        <div className="col-6 px-0"><span className="fs16 px-0">{data.payment_account_code + ' ' + data.payment_account_name}</span></div>
            				    </div>
            				    <div className="row mb-2">
            				        <div className="col-6 fs16 fw600">Fixed Asset Account</div>
            				        <div className="col-6 px-0"><span className="fs16 px-0">{data.fixed_asset_account_code + ' ' + data.fixed_asset_account_name}</span></div>
            				    </div>
            				    <div className="row mb-2">
            				        <div className="col-6 fs16 fw600">Despreciation Account</div>
            				        <div className="col-6 px-0"><span className="fs16 px-0">{data.depreciation_account_code + ' ' + data.depreciation_account_name}</span></div>
            				    </div>
            				    <div className="row mb-2">
            				        <div className="col-6 fs16 fw600">Expense Account</div>
            				        <div className="col-6 px-0"><span className="fs16 px-0">{data.expense_account_code + ' ' + data.expense_account_name}</span></div>
            				    </div>
            				</div>
            			</div>
            			<p className="fs20 fw600 mb-3 mx-3">Depreciation Board</p>
            		    <DepreciationList data={data.depreciation_list}/>
        		    </div>
        }
        
        return <div style={panel_style} className="p-4 mb-4">
    			    {content}
            	</div>
    }
}

class DepreciationList extends React.Component {
    render() {
        var data = this.props.data
        var rows = []
        
        if (data.length != 0){
            var sl = this
            data.forEach(function(item, index){
                rows.push(
                    <DepreciationListRow key={index.toString()} item={item} handleInputChange={sl.props.handleInputChange} edit={sl.props.edit}/>
                )
            })
        }
        
        return(
            <div className="mx-3">
			    <div className="row mx-0 fs14 fw600 row-header">
    				<div className="col-3">
    					<span className="my-auto">Reference</span>
    				</div>
    				<div className="col text-center">
    					<span className="my-auto">Despreciation Date</span>
    				</div>
    				<div className="col text-center">
    					<span className="my-auto">Depreciation</span>
    				</div>
    				<div className="col text-center">
    					<span className="my-auto">Cumulative Depreciation</span>
    				</div>
    			</div>
    			{rows}
    		</div>
        )
    }
}

class DepreciationListRow extends React.Component {
    render() {
        var item = this.props.item
        var bgStyle = {background: '#F5FBFF'}
        var paddingStyle = {borderBottom: '1px solid #CBD3DA', padding: "12px 0", color: '#787E84'}
        var depreciation_date = new Date(item.depreciation_date)
        
        return(
            <div className="row mx-0" style={bgStyle}>
        		<div className="col" style={paddingStyle}>
        			<div className="row mx-0 fs12 fw600" >
        			    <div className="col-3 d-flex">
        					<span className="my-auto">{item.reference}</span>
        				</div>
        				<div className="col d-flex">
        					<span className="my-auto mx-auto">{depreciation_date.toLocaleDateString('id-ID')}</span>
        				</div>
        				<div className="col d-flex">
        					<span className="my-auto mx-auto">{formatter2.format(item.depreciation_value)}</span>
        				</div>
        				<div className="col d-flex">
        					<span className="my-auto mx-auto">{formatter2.format(item.cumulative_depreciation)}</span>
        				</div>
        			</div>
        		</div>
        	</div>
        )
    }
}

ReactDOM.render(<Asset />,document.getElementById("asset_form"));