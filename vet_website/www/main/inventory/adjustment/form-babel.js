var id = getUrlParameter('n')

class Adjustment extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'loaded': false,
            'data': {'status': 'Draft'},
            'edit_mode': false,
            'currentUser': {}
        }
        
        this.handleInputChange = this.handleInputChange.bind(this)
        this.handleInputBlur = this.handleInputBlur.bind(this)
        this.formSubmit = this.formSubmit.bind(this)
        this.navigationAction = this.navigationAction.bind(this)
    }
    
    componentDidMount() {
        var lastfilter = JSON.parse(sessionStorage.getItem('/main/inventory/adjustment'))
        var gr = this
        frappe.call({
            type: "GET",
            method:"vet_website.methods.get_current_user",
            args: {},
            callback: function(r){
                if (r.message) {
                    this.setState({'edit_mode': checkPermission('VetAdjustment', r.message, 'write')})
                    gr.setState({'currentUser': r.message});
                }
            }
        });
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetadjustment.vetadjustment.get_name_list",
            args: {filters: lastfilter},
            callback: function(r){
                if (r.message) {
                    gr.setState({'namelist': r.message});
                }
            }
        })
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetadjustment.vetadjustment.get_adjustment",
            args: {name: id},
            callback: function(r){
                if (r.message) {
                    console.log(r.message);
                    if (['Draft', 'On Progress'].includes(r.message.adjustment.status || 'Draft')) {
                        if (r.message.adjustment.status == 'Draft' || !r.message.adjustment.status) {
                            var moment_date = moment()
                            r.message.adjustment.inventory_date = moment_date.format('YYYY-MM-DD')
                        }
                        r.message.adjustment.inventory_details.push({})
                    }
                    gr.setState({'data': r.message.adjustment, 'gudang': r.message.gudang, 'productAll': r.message.productAll, 'loaded': true});
                }
            }
        });
    }
    
    navigationAction(name){
        window.location.href="/main/inventory/adjustment/edit?n="+name
    }
    
    formSubmit(e) {
        e.preventDefault()
        var new_data = this.state.data
        var th = this
        
        if (!new_data.status || new_data.status == 'Draft') {
            var selected_gudang = this.state.gudang.find(i => i.gudang_name == new_data.warehouse)
            new_data.warehouse = selected_gudang.name
        }
        
        new_data.inventory_details = new_data.inventory_details.filter(i => i.product)
        
        console.log(new_data)
        
        frappe.call({
    		type: "POST",
    		method:"vet_website.vet_website.doctype.vetadjustment.vetadjustment.submit_adjustment",
    		args: {data: new_data},
    		callback: function(r){
    			if (r.message.adjustment) {
    				window.location.href = "/main/inventory/adjustment/edit?n=" + r.message.adjustment.name
    			}
    			if (r.message.error) {
    				frappe.msgprint(r.message.error);
    			}
    		}
    	});
    }
    
    saveAdjustment() {
        var new_data = this.state.data
        var th = this
        
        new_data.inventory_details.forEach((i, index) => {
            if(!i.product){
                if(i.name){
                    i.delete = true
                }
                else{
                    new_data.inventory_details.splice(index, 1)
                }
            }
        })
        
        console.log(new_data)
        
        frappe.call({
    		type: "POST",
    		method:"vet_website.vet_website.doctype.vetadjustment.vetadjustment.save_adjustment",
    		args: {data: new_data},
    		callback: function(r){
    			if (r.message.adjustment) {
    				window.location.reload(true)
    			}
    			if (r.message.error) {
    				frappe.msgprint(r.message.error);
    			}
    		}
    	});
    }
    
    handleInputChange(e, i=false) {
    	const value = e.target.value
    	const name = e.target.name
    	var new_data = this.state.data
    	
    	if (['product', 'real_quantity'].includes(name)) {
    	    if (Object.keys(new_data.inventory_details[i]).length === 0) {
                new_data.inventory_details.push({})
            }
                    
            if (name == 'product') {
                var realValue = this.state.productAll.find(i => i.product_name == value)
                var th = this
                
                if (realValue) {
                    frappe.call({
                		type: "POST",
                		method:"vet_website.vet_website.doctype.vetadjustment.vetadjustment.get_quantity_product",
                		args: {name: realValue.name, adjustment_name: new_data.name},
                		callback: function(r){
                			if (r.message !== false) {
                			    new_data.inventory_details[i][name] = realValue.name
                				new_data.inventory_details[i]['theoritical_quantity'] = r.message
                				
                				th.setState({data: new_data})
                			}
                			
                			if (r.message.error) {
                				frappe.msgprint(r.message.error);
                			}
                		}
                	});
                } else {
                    new_data.inventory_details[i][name] = value
                    th.setState({data: new_data})
                }
            } else {
                var inventory = new_data.inventory_details[i]
                inventory[name] = value
                var theoritical_quantity = inventory['theoritical_quantity'] || 0
                var real_quantity = inventory['real_quantity'] || 0
                inventory['diff_quantity'] = real_quantity - theoritical_quantity
            }
    	} else {
    	    new_data[name] = value
    	}
    	
    	this.setState({data: new_data})
    }
    
    handleInputBlur(e, list, i=false) {
        const value = e.target.value
    	const name = e.target.name
    	var new_data = this.state.data
    	var selected = false
    	
    	if (name == 'product') {
    	    selected = list.find(i => i.product_name == value)
    	} else if (name == 'warehouse') {
    	    selected = list.find(i => i.gudang_name == value)
    	}
    	
    	if (!selected) {
    	    e.target.value = ''
    	    if (name == 'product') {
    	        new_data.inventory_details[i][name] = ''
    	        new_data.inventory_details[i]['theoritical_quantity'] = ''
    	        new_data.inventory_details[i]['real_quantity'] = ''
    	    } else {
    	        new_data[name] = ''
    	    }
    	    
    	    this.setState({data: new_data})
    	}
    }
    
    cancelAction(e) {
        e.preventDefault()
        var th = this
        var data = this.state.data
        
        frappe.call({
    		type: "POST",
    		method:"vet_website.vet_website.doctype.vetadjustment.vetadjustment.cancel_adjustment",
    		args: {name: data.name},
    		callback: function(r){
    			if (r.message) {
    				// th.setState({data: r.message})
    				window.location.reload()
    			}
    			
    			if (r.message.error) {
    				frappe.msgprint(r.message.error);
    			}
    		}
    	});
    }
    
    // toggleEditMode(){
    //     this.setState({edit_mode: !this.state.edit_mode})
    // }
    
    goToJournalEntries(){
        window.location.href = '/main/accounting/journal-entries?reference=' + this.state.data.name
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
            filename: "Adjustment-"+this.state.data.name+".pdf",
            pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', '.row'] },
            html2canvas: {scale: 3},
            jsPDF: {orientation: 'p', unit: 'pt', format: [559*0.754,794*0.754]}
        }
        html2pdf().set(opt).from(source).save()
        // doc.html(source, {
        //   callback: function (doc) {
        //      doc.save("JournalItem-"+th.state.month+"-"+th.state.year+".pdf");
        //   },
        //   x: 0,
        //   y: 0,
        //   html2canvas: {
        //       scale: 1,
        //   }
        // });
    }
    
    render() {
        var bgstyle = {background: '#FFFFFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', padding: '2px 32px', marginBottom: '15px'}
        var lh14 = {lineHeight: '14px'}
        var rowMinHeight = {minHeight: '64px'}
        var color = {color: '#056EAD', cursor: 'pointer'}
        var data = this.state.data
        var headerButton
        var backButton = <span key="999" className="fs16 fw600 my-auto" style={color} onClick={() => window.location.href='/main/inventory/adjustment'}><i className="fa fa-chevron-left mr-1" style={color}></i>Back</span>
        // var write = checkPermission('VetAdjustment', this.state.currentUser, 'write')
        var cancel = checkPermission('VetAdjustment', this.state.currentUser, 'cancel')
        var validate = checkPermission('VetAdjustment', this.state.currentUser, 'validate')
        
        if (this.state.loaded) {
            
            console.log(this.state)
            
            var adjustment_inventory = <AdjustmentInventory list={data.inventory_details} productAll={this.state.productAll} status={data.status || 'Draft'} handleInputChange={this.handleInputChange} handleInputBlur={this.handleInputBlur} edit_mode={this.state.edit_mode}/>
        	
        	if (data.status == 'Draft' || id == undefined) {
        		headerButton = <div className="row mx-0 flex-row-reverse" style={rowMinHeight}>
			            			<div className="col-auto ml-auto my-auto">
			            				<button type="submit" className="btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2" style={lh14}>Start</button>
			            			</div>
			            			{backButton}
			            		</div>
			    adjustment_inventory = false
        	} else if (data.status == 'On Progress') {
        	    // var edit_button, 
                var cancel_button, validate_button
                // , batal_button
        	    // if(this.state.edit_mode){
        	    //     edit_button = <div className="col-auto my-auto"><button className="btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2" style={lh14} type="button" onClick={() => this.saveAdjustment()}>Save</button></div>
                //     batal_button = <div className="col-auto my-auto">
                //                     <button className="btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2" style={lh14} type="button" onClick={() => this.toggleEditMode()}>Batal</button>
                //                 </div>
        	    // }else{
        	    //     edit_button = <div className="col-auto my-auto"><button className="btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2" style={lh14} type="button" onClick={() => this.toggleEditMode()}>Edit</button></div>
                if(validate){
                    validate_button = <div className="col-auto my-auto">
                        <button type="submit" className="btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2" style={lh14}>Validate</button>
                    </div>
                }
                if(cancel){
                    cancel_button = <div className="col-auto my-auto">
                                        <button className="btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2" style={lh14} type="button" onClick={(e) => this.cancelAction(e)}>Cancel</button>
                                    </div>
                }
        	    // }
        	    headerButton = <div className="row mx-0 flex-row-reverse" style={rowMinHeight}>
			            			{validate_button}
			            			{cancel_button}
                                    {/* {batal_button} */}
			            			{/* {write?edit_button:false} */}
			            			<div className="col-auto px-0 mx-auto"/>
			            			{backButton}
			            		</div>
        	} else {
        	    var print_button
        	    if(data.status == 'Done'){
        	        print_button = <div className="col-auto my-auto"><button type="button" className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={() => this.printPDF()}>Print</button></div>
        	    }
        	    var cursor = {cursor: 'pointer'}
        	    headerButton = <div className="row mx-0 flex-row-reverse" style={rowMinHeight}>
        	                        <div className="col-auto mx-auto" style={cursor} onClick={() => this.goToJournalEntries()}>
                			            <img className="d-block mx-auto mt-2 header-icon" src="/static/img/main/menu/journal_entries.png"/>
                			            <p className="mb-0 fs12 text-muted text-center">Journal Entries</p>
                			        </div>
                			        {print_button}
			            			{backButton}
			            		</div>
        	}
        	
        	var list_status
        	if (data.status != 'Cancel') {
        	    list_status = ['Draft', 'On Progress', 'Done']
        	} else {
        	    list_status = ['Cancel']
        	}
        	
    		return <form onSubmit={this.formSubmit}>
    	            	<div style={bgstyle}>
    	            		{headerButton}
    	            	</div>
    	            	<div className="row justify-content-end">
    	            	    <div className="col-auto">
    	            	        <StatusRow statuses={list_status} current_status={data.status || 'Draft'}/>
    	            	    </div>
    	            	    <div className="col-auto">
    	            	        <RecordNavigation currentname={this.state.data.name} namelist={this.state.namelist} navigationAction={this.navigationAction}/>
    	            	    </div>
    	            	</div>
    	            	<AdjustmentMainForm data={data} gudang={this.state.gudang} handleInputChange={this.handleInputChange} handleInputBlur={this.handleInputBlur}/>
    	            	{adjustment_inventory}
    	            	<PDF data={data}/>
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

class AdjustmentMainForm extends React.Component {
    render() {
        var bgstyle2 = {background: '#FFFFFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)'}
        var data = this.props.data
        var gudang_options = []
        
        var adjustment_value = data.inventory_details.map(v => v['adjustment_value']).reduce((sum, current) => sum + current, 0 );
        
        var warehouse = <div>
                            <span className="fs16 px-0">{data.warehouse_name}</span>
                        </div>
        var inventoryDate = <div>
                                <span className="fs16 px-0">{moment(data.inventory_date).format("DD-MM-YYYY")}</span>
                            </div>
        var adjustmentValue = <div>
                                <span className="fs16 px-0">{formatter.format(adjustment_value || 0)}</span>
                            </div>
        var user = <div className="col-3">
                        <div className="form-group">
        					<label htmlFor="user" className="fw600">User</label>
        					<div className="row mx-0">
        						<span className="fs16 px-0">{data.owner_full_name}</span>
        					</div>
        				</div>
                    </div>
                    
        var moment_date = moment()
        
        if (data.status == 'Draft' || id == undefined) {
            this.props.gudang.forEach(function(item, index) {
                gudang_options.push(<option value={item.gudang_name} key={index.toString()} />)
            })
							
			warehouse = <div>
							<input required name='warehouse' list="list_gudang" id="warehouse" className="form-control border-0 lightbg" onChange={this.props.handleInputChange} onBlur={e => this.props.handleInputBlur(e, this.props.gudang)} defaultValue={data.warehouse_name || ''}/>
							<datalist id="list_gudang">
								{gudang_options}
							</datalist>
						</div>
			                
			inventoryDate = <div>
			                    <input required type="date" id="inventory_date" name='inventory_date' className="form-control border-0 lightbg" onChange={this.props.handleInputChange} defaultValue={data.inventory_date || ''}/>
			                </div>
			                
			user = <div></div>
        }
        
        return <div>
        			<p className="fs18 fw600 text-dark mb-2">{data.name || 'Data Adjustment'}</p>
        			<div style={bgstyle2} className="p-4 mb-4">
		        		<div className="form-row">
            	            <div className="col-3">
            	                <div className="form-group">
                					<label htmlFor="adjustment_value" className="fw600">Adjustment Value</label>
                					{adjustmentValue}
                				</div>
        	                </div>
        	                <div className="col-3">
        	                    <div className="form-group">
                					<label htmlFor="inventory_date" className="fw600">Inventory Date</label>
                					{inventoryDate}
                				</div>
        	                </div>
        	                <div className="col-3">
            	                <div className="form-group">
                					<label htmlFor="warehouse" className="fw600">Warehouse</label>
                					{warehouse}
                				</div>
        	                </div>
        	                {user}
	            		</div>
		        	</div>
        		</div>
    }
}

class AdjustmentInventory extends React.Component {
    render() {
        var panel_style = {background: '#fff', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)'}
        var productAll = this.props.productAll
        var list = this.props.list
        var rows = []
        
        var sl = this
        list.forEach(function(l, index){
            rows.push(
                <InventoryRow index={index.toString()} productAll={sl.props.productAll} key={index.toString()} item={l} status={sl.props.status} handleInputChange={e => sl.props.handleInputChange(e, index.toString())} handleInputBlur={sl.props.handleInputBlur} edit_mode={sl.props.edit_mode}/>
            )
        })
        
        var product_options = []
        if(productAll.length != 0){
            productAll.forEach((l, index) => product_options.push(<option value={l.product_name} key={l.name} />))
        }
        var product_datalist = (
            <datalist id="productAll">
                {product_options}
            </datalist>
        )
        
        var adjustment_col
        if(this.props.status == 'Done'){
            adjustment_col = <div className="col-2 text-center"><span className="my-auto">Adjustment Value</span></div>
        }
        
        return (
        	<div style={panel_style} className="p-4 mb-4">
        	    {product_datalist}
        	    <div className="row mx-0 fs12 fw600 row-header">
    				<div className="col">
    					<span className="my-auto">Product</span>
    				</div>
    				<div className="col-2 text-center">
    					<span className="my-auto">Theoritical Quantity</span>
    				</div>
    				<div className="col-2 text-center">
    					<span className="my-auto">Real Quantity</span>
    				</div>
    				<div className="col-2 text-center">
    					<span className="my-auto">Diff Quantity</span>
    				</div>
    				{adjustment_col}
    			</div>
    			{rows}
        	</div>
        )
    }
}

class InventoryRow extends React.Component {
    render() {
        var bgStyle = {background: '#F5FBFF'}
        var item = this.props.item
        var index = this.props.index
        var status = this.props.status
        var required = false
        if(Object.keys(item).filter(n => !['product', 'product_name'].includes(n)).length != 0){
            required = true
        }
        var product = <span className="my-auto">{item.product_name||item.product || ''}</span>
        var theoriticalQuantity = <span className="my-auto">{item.theoritical_quantity || '0'}</span>
        var realQuantity = <span className="my-auto">{item.real_quantity || '0'}</span>
        var diffQuantity = <span className="my-auto">{item.diff_quantity || '0'}</span>
        
        if(id == undefined || status == 'Draft' || (status == 'On Progress' && this.props.edit_mode)){
            product = <input required={required} autoComplete="off" placeholder="Product" name='product' list="productAll" id="product" style={bgStyle} className="form-control border-0 fs14 fw600 p-0 h-auto" onChange={this.props.handleInputChange} onBlur={e => this.props.handleInputBlur(e, this.props.productAll, index)} defaultValue={item.product_name||item.product||''}/>
            realQuantity = <input autoComplete="off" placeholder="0" name='real_quantity' id="real_quantity" style={bgStyle} className="form-control border-0 fs14 fw600 p-0 h-auto text-center" onChange={this.props.handleInputChange} value={item.real_quantity || ''}/>
        }
        
        var adjustment_col
        if(status == 'Done'){
            adjustment_col = <div className="col-2 text-center"><span className="my-auto">{formatter2.format(item.adjustment_value) || 0}</span></div>
        }
        
        
        return(
            <div className="row mx-0">
        		<div className="col row-list" style={bgStyle}>
        			<div className="row mx-0 fs12 fw600">
        				<div className="col">
        					{product}
        				</div>
        				<div className="col-2 text-center">
        					{theoriticalQuantity}
        				</div>
        				<div className="col-2 text-center">
        					{realQuantity}
        				</div>
        				<div className="col-2 text-center">
        					{diffQuantity}
        				</div>
        				{adjustment_col}
        			</div>
        		</div>
        	</div>
        )
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
        var row1 = {marginBottom: 12}
        var row2 = {margin: '0 -14px'}
        var th = {border: '1px solid #000'}
        var td = {borderLeft: '1px solid #000', borderRight: '1px solid #000'}
        var fs13 = {fontSize: 13}
        var fs9 = {fontSize: 9}
        var invoice = {letterSpacing: 0, lineHeight: '24px', marginBottom: 0, marginTop: 18}
        var invoice2 = {letterSpacing: 0}
        var thead = {background: '#d9d9d9', fontSize: 11}
        var table_rows = []
        data.inventory_details.forEach((d, index) => {
            table_rows.push(
                <tr key={d.name} style={fs9} className="text-center">
                    <td className="py-1">{d.product_name}</td>
                    <td className="py-1">{d.theoritical_quantity}</td>
                    <td className="py-1">{d.real_quantity}</td>
                    <td className="py-1">{d.diff_quantity}</td>
                    <td className="py-1">{formatter.format(d.adjustment_value)}</td>
                </tr>
            )
        })
        
        var adjustment_value = data.inventory_details.map(v => v['adjustment_value']).reduce((sum, current) => sum + current, 0 );

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
    			        <div className="col-5">
    			            <p className="my-3 fwbold text-uppercase" style={fs13}>{profile.clinic_name}</p>
                            <p className="my-0" style={fs9}>{profile.address}</p>
                            <p className="my-0" style={fs9}>Telp. : {profile.phone}</p>
    			        </div>
    			        <div className="col-5 px-0">
    			            <p className="fwbold text-right text-uppercase fs28" style={invoice}>Adjustment</p>
    			            <p className="fw600 text-right text-uppercase fs14" style={invoice2}>{data.name}</p>
    			        </div>
    			        <div className="col-12" style={borderStyle}/>
    			    </div>
    			    <div className="row mx-0" style={row1}>
    			        <div className="col-4 px-0">
    			            <p className="mb-0 fs10">{adjustment_value}</p>
    			        </div>
    			        <div className="col-4 px-0">
    			            <p className="mb-0 fs10 text-center">{data.warehouse_name}</p>
    			        </div>
    			        <div className="col-4 px-0">
			                <p className="mb-0 fs10 text-right">
			                    {moment(data.inventory_date).format('DD-MM-YYYY')}
			                </p>
			                <p className="mb-0 fs10 text-right">
			                    {data.owner_full_name}
			                </p>
    			        </div>
    			    </div>
    			    <table className="fs12" style={row2}>
    			        <thead className="text-uppercase" style={thead}>
        			        <tr className="text-center">
        			            <th className="fw700 py-2" width="182px">Product</th>
        			            <th className="fw700 py-2" width="94px">Theoritical Qty</th>
        			            <th className="fw700 py-2" width="94px">Real Qty</th>
        			            <th className="fw700 py-2" width="94px">Different Qty</th>
        			            <th className="fw700 py-2" width="95px">Adjustment Value</th>
        			        </tr>
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

ReactDOM.render(<Adjustment />,document.getElementById("adjustment_form"));