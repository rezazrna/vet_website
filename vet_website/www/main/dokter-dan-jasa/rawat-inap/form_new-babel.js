var time = getUrlParameter('time')

class RawatInapNew extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'loaded': false,
            'data': [],
        }
        this.addJasaObat = this.addJasaObat.bind(this)
        this.handleInputBlur = this.handleInputBlur.bind(this)
        this.handleInputChangeObat = this.handleInputChangeObat.bind(this)
        this.pressEnter = this.pressEnter.bind(this)
        this.addTindakLanjut = this.addTindakLanjut.bind(this)
        this.deleteJasaObat = this.deleteJasaObat.bind(this)
        this.deleteTindakLanjut = this.deleteTindakLanjut.bind(this)
    }
    
    componentDidMount() {
        var ri = this
        if(time != undefined){
            frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetrawatinap.vetrawatinap.get_unfinished_rawat_inap",
                args: {},
                callback: function(r){
                    if (r.message) {
                        console.log(r.message)
                        r.message.rawat_inap.forEach(r => {
                            r.pemeriksaan = {
                				'checks': [],
                				'attachments': [],
                				'status': r.status,
                				'jasa_dan_obat': [],
                				'tindak_lanjut': [],
                            }
                			r.new_obat = {}
                        })
                        ri.setState({'data': r.message.rawat_inap, 'loaded': true, 'products': r.message.products});
                    }
                }
            });
        }
    }
    
    addJasaObat(i, data){
        var new_data = this.state.data.slice()
        new_data[i].pemeriksaan.jasa_dan_obat.push(data)
        this.setState({data: new_data})
    }
    
    handleInputBlur(e, list) {
		const value = e.target.value
    	
    	var selected = list.find(i => i.product_name == value)
    	
    	if (!selected) {
    		e.target.value = ''
    	}
    	
	}
	
	changeTindakanDokter(e, i){
        var target = e.target
        var name = target.name
        var value = target.value
        var new_data = this.state.data.slice()
        
        new_data.pemeriksaan[name] = value
        this.setState({data: new_data})
    }
    
    handleInputChangeObat(e,i) {
    	const value = e.target.value
    	const name = e.target.name
    	var new_data = this.state.data.slice()
    	var aa = this
    	var selected = false
    	var realValue
    	var obatAll = this.state.products.filter(p => p.product_category.is_tindakan || p.product_category.is_obat || p.product_category.is_racikan || p.product_category.is_makanan)
    	if (name == 'product_jasa') {
	    	obatAll.forEach(function(item, index) {
	    		if (item.product_name == value) {
	    			selected = true
	    			realValue = item.name
	    		}
	    	})
	    	
	    	if (selected) {
	    		frappe.call({
	                type: "GET",
	                method:"vet_website.vet_website.doctype.vetapotik.vetapotik.get_product_details",
	                args: {name: realValue},
	                callback: function(r){
	                    if (r.message) {
	                        new_data[i].new_obat = r.message.product
	                        aa.setState({data: new_data})
	                    }
	                }
	            });
	    	}
    	} else {
    		new_data[i].new_obat[name] = value
    		this.setState({data: new_data})
    	}
    }
    
    deleteJasaObat(i, item_index){
        var new_data = this.state.data.slice()
    	new_data[i].pemeriksaan.jasa_dan_obat.splice(item_index, 1)
    	this.setState({data: new_data})
    }
    
    deleteTindakLanjut(i, item_index){
    	var new_data = this.state.data.slice()
    	new_data[i].pemeriksaan.tindak_lanjut.splice(item_index, 1)
    	this.setState({data: new_data})
    }
    
    pressEnter(e, i) {
    	
    	var new_obat = this.state.data[i].new_obat
    	var new_data = this.state.data.slice()
    	var onSelectObat = this.state.onSelectobat
    	
        if (e.key === 'Enter' || e.key == 'Tab') {
        	e.preventDefault();
            if (new_obat.name && new_obat.name != '' && new_obat.quantity != '0' && new_obat.quantity) {
        		new_data[i].pemeriksaan.jasa_dan_obat.push(new_obat)
        		new_data[i].new_obat = {}
            	this.setState({data: new_data})
            	var qty = document.getElementById("quantity"+i)
            	var selectProduct = document.getElementById("product_jasa"+i)
            	qty.value = qty.defaultValue
            	selectProduct.value = ''
            }
        }
    }
	
	addTindakLanjut(e, i){
        var target = e.target
        var name = target.name
        var value = target.value
        var tl = this
        var new_data = this.state.data.slice()
        var selected = false
        var realValue
        if (value != undefined || value != '') {
            this.state.products.forEach(function(item, index) {
        	    if (item.product_name == value) {
        	        selected = true
        	        realValue = item.name
        	    }
        	})
        	
        	if (selected) {
        	    e.target.selectedIndex = 0
                frappe.call({
            		type: "POST",
            		method:"vet_website.vet_website.doctype.vetproduct.vetproduct.get_product",
            		args: {name: realValue},
            		callback: function(r){
            			if (r.message.product) {
            				new_data[i].pemeriksaan.tindak_lanjut.push(r.message.product)
            				tl.setState({'data': new_data})
            			}
            			if (r.message.error) {
            				frappe.msgprint(r.message.error);
            			}
            		}
            	});
            	e.target.value = e.target.defaultValue
        	}
        }
    }
	
	addCheck(data, i){
        var new_data = this.state.data.slice()
        new_data[i].pemeriksaan.checks.push(data)
        this.setState({data: new_data})
    }
    
    deleteCheck(i, item_index){
        var new_data = this.state.data.slice()
        new_data[i].pemeriksaan.checks[item_index].delete = true
        this.setState({data: new_data})
    }
    
    addAttachment(data, i){
        var vr = this
        var new_data = this.state.data.slice()
        var name = data.attachment.name;
        var reader = new FileReader();
        reader.onload = function(e) {
            data.filename = name,
            data.dataurl = reader.result
            data.attachment =  URL.createObjectURL(data.attachment)
            new_data[i].pemeriksaan.attachments.push(data)
            vr.setState({data: new_data})
        }
        reader.readAsDataURL(data.attachment);
    }
    
    deleteAttachment(i, item_index){
        var new_data = this.state.data.slice()
        if(new_data[i].pemeriksaan.attachments[item_index].name != undefined){
            new_data[i].pemeriksaan.attachments[item_index].deleted = true
        }
        else {
            new_data[i].pemeriksaan.attachments.splice(item_index, 1)
        }
        this.setState({data: new_data})
    }
    
    addMarker(marker, i){
        var new_data = this.state.data.slice()
        new_data[i].pemeriksaan.marker = marker
        this.setState({data: new_data})
    }
    
    resetMarker(i){
        var new_data = this.state.data.slice()
        delete new_data[i].pemeriksaan.marker
        this.setState({data: new_data})
    }
    
    addTindakan(){
    	var at = this
    	var new_data = this.state.data.slice()
    	new_data.forEach(d => {
    	    d.waktu = time
    	    d.rekam_medis = d.pemeriksaan
    	    d.pemeriksaan.checks.forEach((c, index) => {
                if(!c.delete){
                    d.rekam_medis[c.name] = c.value
                }
            })
            delete d.rekam_medis.checks
    	})
    	
    	console.log(new_data)
        
    	frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vetrawatinap.vetrawatinap.add_more_tindakan",
            args: {datas: new_data},
            callback: function(r){
                if (r.message) {
                    window.location.pathname = '/main/dokter-dan-jasa/rawat-inap'
                }
            }
        });
    }
    
    render(){
        var bgstyle = {background: '#FFFFFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', padding: '2px 32px', marginBottom: '15px'}
        var rowMinHeight = {minHeight: '64px'}
        var color = {color: '#056EAD', cursor: 'pointer'}
        var cursor = {cursor: 'pointer'}
        var noLeftRight = {left: '0', right: '0'}
        var rawat_inap = this.state.data
        var headerButton
        var backButton = <span key="999" className="fs16 fw600 mr-auto my-auto" style={color} onClick={() => window.location.href='/main/dokter-dan-jasa/rawat-inap'}><i className="fa fa-chevron-left mr-1" style={color}></i>Back</span>
        var rawat_inap_list = []
        
        if (this.state.loaded) {
            var ri = this
            this.state.data.forEach((r, index) => {
                rawat_inap_list.push(
                    <div className="col-6" key={index.toString()}>
                        <RawatInapNewTindakan rawat_inap={r} index={index.toString()} products={ri.state.products} time={time} addJasaObat={data => ri.addJasaObat(index.toString(), data)} handleInputBlur={ri.handleInputBlur} changeTindakanDokter={e => ri.changeTindakanDokter(e, index.toString())} handleInputChangeObat={e => ri.handleInputChangeObat(e, index.toString())} pressEnter={e => ri.pressEnter(e, index.toString())} addTindakLanjut={e => ri.addTindakLanjut(e, index.toString())} deleteJasaObat={item_index => this.deleteJasaObat(index.toString(), item_index)} deleteTindakLanjut={item_index => this.deleteTindakLanjut(index.toString(), item_index)} addCheck={data => this.addCheck(data, index.toString())} addAttachment={data => this.addAttachment(data, index.toString())} addMarker={marker => this.addMarker(marker, index.toString())} deleteCheck={item_index => this.deleteCheck(index.toString(), item_index)} deleteAttachment={item_index => this.deleteAttachment(index.toString(), item_index)} resetMarker={() => this.resetMarker(index.toString())}/>
                    </div>
                )
            })
            
            headerButton = <div>
                        		<div className="row mx-0 flex-row-reverse">
                        			<div className="col-auto d-flex my-auto">
                        				<button type="button" className="d-block btn btn-sm fs12 btn-outline-danger text-uppercase fwbold py-2 px-4" onClick={() => window.location.href='/main/dokter-dan-jasa/rawat-inap'}>Batal</button>
                        			</div>
                        			<div className="col-auto d-flex my-auto">
                        				<button className="d-block btn btn-sm btn-danger fs12 text-uppercase fwbold py-2 px-4" onClick={() => this.addTindakan()}>Selesai</button>
                        			</div>
                        			<div style={rowMinHeight}/>
                        			<div className="col-auto d-flex mr-auto">
                        			    {backButton}
                        			</div>
                        		</div>
                    	    </div>
            
            return <div>
		            	<div style={bgstyle}>
		            		{headerButton}
		            	</div>
		            	<div className='row'>
		            	    {rawat_inap_list}
		            	</div>
		            </div>
        }
        else {
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

class RawatInapNewTindakan extends React.Component {
    constructor(props) {
		super(props)
		this.state = {
			'mode': '',
		}
		this.changeMode = this.changeMode.bind(this)
	}
	
	componentDidMount() {
		var th = this
		frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vettemplatetindakan.vettemplatetindakan.get_template_tindakan",
            args: {register_number: this.props.rawat_inap.register_number},
            callback: function(r){
                if (r.message) {
                    console.log(r.message)
                    var template_data_tindakan = r.message.tindakan.filter(i => i[th.props.time])
            		var jasa_dan_obat = []
            		template_data_tindakan.forEach(function(item, index) {
                    	th.props.addJasaObat(item);
                    })
                }
            }
        });
	}
	
	changeMode(e, value) {
		e.preventDefault()
		this.setState({mode: value})
	}
    
    render(){
        var ri = this
        var bgstyle = {background: '#FFFFFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', padding: '16px 24px', marginBottom: '20px'}
        var color = {color: '#056EAD'}
        var tabPanelStyle = {height: '380px', overflow: 'auto'}
        var image = {width: 72, height: 72, objectFit: 'cover', borderRadius: '50%'}
        var select_style = {color: '#056EAD', border: '1px solid #056EAD'}
        var counterStyle = {marginTop: '-1rem', verticalAlign: 'middle'}
        var rawat_inap = this.props.rawat_inap
        var index = this.props.index
        var mode = this.state.mode
        var products = this.props.products
        var list_products, newSelect
        var list_options = []
        var jasa_rows = []
		var tindak_lanjut_rows = []
        
        if (mode == 'jasa'){
            list_products = products.filter(i => (i.product_category.is_tindakan || i.product_category.is_obat || i.product_category.is_makanan) && !i.product_category.is_racikan)
        } else if (mode == 'tindak_lanjut'){
            list_products = products.filter(i => i.product_category.is_operasi)
        }
        
        if (list_products != undefined && list_products.length != 0) {
            list_products.forEach((item, index) => {
	            list_options.push(<option value={item.product_name} key={index.toString()} />)
	        })
        }
        
        if (mode == 'jasa') {
            newSelect = (
                <div>
                	<div className="row mx-0 mb-3">
                        <div className="col-11 pr-2 pl-0">
                            <input id={"product_jasa"+index} name='product_jasa' className="form-control fs14" style={select_style} onChange={this.props.handleInputChangeObat} onBlur={e => this.props.handleInputBlur(e, list_products)} list={"jasa_list"+index} placeholder="Pilih Untuk Menambahkan" autoComplete="off"/>
	                        <datalist id={"jasa_list"+index}>
	                            {list_options}
	                        </datalist>
                        </div>
                        <div className="col-1 my-auto px-1">
							<input id={"quantity"+index} name='quantity' className="form-control fs14 text-center" style={select_style} placeholder="0" onChange={this.props.handleInputChangeObat} onKeyDown={this.props.pressEnter}/>
						</div>
					</div>
                </div>
    		)
        } else if (mode == 'tindak_lanjut') {
            newSelect = (
                <div>
                    <input id="product_tindak_lanjut" name='product_tindak_lanjut' className="form-control fs14" style={select_style} onChange={this.props.addTindakLanjut} onBlur={e => this.props.handleInputBlur(e, list_products)} list="tindak_lanjut_list" placeholder="Pilih Untuk Menambahkan" autoComplete="off"/>
                    <datalist  id="tindak_lanjut_list">
                        {list_options}
                    </datalist>
                </div>
    		)
        }
        
        rawat_inap.pemeriksaan.jasa_dan_obat.forEach(function(item, index) {
        	jasa_rows.push(<RawatInapTindakanJasaRow item={item} key={index.toString()} deleteTindakan={() => ri.props.deleteJasaObat(index.toString())}/>)
        })
        
        rawat_inap.pemeriksaan.tindak_lanjut.forEach(function(item, index) {
        	tindak_lanjut_rows.push(<RawatInapTindakanTindakLanjutRow item={item} key={index.toString()} deleteTindakan={() => ri.props.deleteTindakLanjut(index.toString())}/>)
        })
        
        var jasa_counter, tindak_lanjut_counter
		if (jasa_rows.length > 0){
		    jasa_counter = (<span className="record-count badge badge-danger rounded-circle fs10 fw600" style={counterStyle}>{jasa_rows.length}</span>)
		}
		if (tindak_lanjut_rows.length > 0){
		    tindak_lanjut_counter = (<span className="record-count badge badge-danger rounded-circle fs10 fw600" style={counterStyle}>{tindak_lanjut_rows.length}</span>)
		}
        
        return(
            <div style={bgstyle}>
                <div className="row mx-0 justify-content-center mb-3">
                    <div className="col-10">
                        <div className="row">
                            <div className="col-auto">
                                <img src={rawat_inap.pet_image?rawat_inap.pet_image:'/static/img/main/menu/empty-image.png'} style={image}/>
                            </div>
                            <div className="col text-center d-flex">
                                <div className="m-auto fs16" style={color}>
                                    <i className="fa fa-paw mr-2"/><span>{rawat_inap.pet_name}</span>
                                </div>
                            </div>
                            <div className="col text-center d-flex">
                                <div className="m-auto fs16" style={color}>
                                    <i className="fa fa-user mr-2"/><span>{rawat_inap.owner_name}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
    				<ul className="nav nav-tabs justify-content-around" id={'tindakanTab'+index} role="tablist">
    				    <li className="nav-item">
            				<a className="nav-link py-1 active" id={"pemeriksaan-tab"+index} data-toggle="tab" href={"#pemeriksaan"+index} role="tab"><span>Pemeriksaan</span></a>
            			</li>
            			<li className="nav-item">
            				<a className="nav-link py-1" id={"jasa-tab"+index} data-toggle="tab" href={"#jasa"+index} role="tab" onClick={e => this.changeMode(e, 'jasa')} ><span>Jasa/Obat</span>{jasa_counter}</a>
            			</li>
            			<li className="nav-item">
            				<a className="nav-link py-1" id={"tindak-lanjut-tab"+index} data-toggle="tab" href={"#tindak_lanjut"+index} role="tab" onClick={e => this.changeMode(e, 'tindak_lanjut')} ><span>Tindak Lanjut</span>{tindak_lanjut_counter}</a>
            			</li>
            		</ul>
					<div className="tab-content" id={"tindakanTabContent"+index} style={tabPanelStyle}>
					    <div className="tab-pane pt-4 pb-2 show active" id={"pemeriksaan"+index} role="tabpanel">
					        <Pemeriksaan index={this.props.index} data={rawat_inap.pemeriksaan} changeTindakanDokter={this.props.changeTindakanDokter} handleInputBlur={this.props.handleInputBlur} addCheck={this.props.addCheck} deleteCheck={this.props.deleteCheck} deleteAttachment={this.props.deleteAttachment} addAttachment={this.props.addAttachment} addMarker={this.props.addMarker} resetMarker={this.props.resetMarker}/>
					    </div>
					    <div className="tab-pane pt-4 pb-2" id={"jasa"+index} role="tabpanel">
					        <div className="mb-3">
                                {newSelect}
                            </div>
                            {jasa_rows}
					    </div>
					    <div className="tab-pane pt-4 pb-2" id={"tindak_lanjut"+index} role="tabpanel">
					        <div className="mb-3">
                                {newSelect}
                            </div>
                            {tindak_lanjut_rows}
					    </div>
					</div>
                </div>
            </div>
        )
    }
}

class RawatInapTindakanJasaRow extends React.Component {
	render() {
		var panel_style = {background: '#84D1FF', padding: '10px 20px', color: '#056EAD'}
		var tipe_style = {background: '#056EAD', color: '#FFF', borderRadius: '3px', padding: '2px 7px', display: 'block', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis'}
		var item = this.props.item
		var cursor = {cursor: 'pointer'}
		var tipe_tindakan
		
		var nameclass = "col-11"
		var tipe = <div className="col-3"/>
		if(item.product_category){
		    nameclass = "col-8 px-0"
		    if (item.product_category.is_makanan) {
    		    tipe_tindakan = 'Makanan'
    		} else if (item.product_category.is_obat || item.product_category.is_racikan) {
    		    tipe_tindakan = 'Obat'
    		} else {
    		    tipe_tindakan = 'Jasa'
    		}
    		tipe = <div className="col-3">
        	            <span className="fs14" style={tipe_style}>{tipe_tindakan}</span>
        	        </div>
		}
		
		var total_display = <div className="col-3 px-0"/>
		var amount_row = <div className="col-6 px-0"/>
		if(item.uom_name != undefined && item.quantity != undefined && item.price != undefined){
		    total_display = <div className="col-3 px-0">
	        	    	<span className="mr-1 fs14">{formatter.format(item.quantity * item.price)}</span>
	        	    </div>
	        amount_row = <div className="col-6 px-0">
    	        	        	<div className="row">
    	        	        		<div className="col-auto">
    	        	        			<span className="fs14">{item.quantity + ' ' + item.uom_name}</span>
    	        	        		</div>
    	        	        		<div className="col-auto">
    	        	        			<span className="fs14">x</span>
    	        	        		</div>
    	        	        		<div className="col-auto">
    	        	        			<span className="fs14">{formatter.format(item.price)}</span>
    	        	        		</div>
    	        	        	</div>
    	        	        </div>
		}
		
		return <div>
				<div className="row mx-0 mb-3 fs12 fw600 grooming_products rounded" style={panel_style}>
				    <div className="col-12 pl-0">
    				    <div className="row mb-2">
    	        	        {tipe}
    	        	        <div className={nameclass}>
    	        	            <span className="fs14">{item.product_name||item.description}</span>
    	        	        </div>
    	        	        <div className="col-1 text-right px-0">
    			        	    <i className="fa fa-2x fa-trash" onClick={this.props.deleteTindakan} style={cursor}/>
    			        	</div>
    	        	    </div>
    	        	</div>
    	        	<div className="col-12">
    	        	    <div className="row d-flex">
    	        	        {amount_row}
    	        	        {total_display}
    	        	    </div>
    	        	</div>
		        </div>
			</div>
	}
}

class RawatInapTindakanTindakLanjutRow extends React.Component {
	render() {
		var panel_style = {background: '#84D1FF', padding: '10px 20px', color: '#056EAD'}
		var item = this.props.item
		var cursor = {cursor: 'pointer'}
		
		return <div className="row mx-0 mb-3 fs12 fw600 grooming_products rounded" style={panel_style}>
				    <div className="col-10">
        	        	<div className="row mx-0">
        	        		<div className="col-12">
        	        			<span className="ml-3 fs14">{item.product_name}</span>
        	        		</div>
	        	        	<div className="col-12">
    	        	            <span className="ml-3 fs14">Tindak Lanjut</span>
    	        	        </div>
        	        	</div>
    	        	</div>
    	        	<div className="col-2 d-flex">
		        	    <i className="fa fa-2x fa-trash m-auto" onClick={this.props.deleteTindakan} style={cursor}/>
        	        </div>
		        </div>
	}
}

class Pemeriksaan extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            'new_check': {},
            'available_check': [
                {'label': 'Riwayat Vaksin', 'name': 'vaccine_history'},
                {'label': 'Riwayat Makanan', 'name': 'food_history'},
                {'label': 'Anamnese', 'name': 'anamnese'},
                {'label': 'Diagnosa Utama', 'name': 'diagnosa_utama'},
                {'label': 'Prognosa', 'name': 'prognosa'},
                {'label': 'Diagnosa Banding', 'name': 'diagnosa_banding'},
                {'label': 'BCS', 'name': 'bcs'},
                {'label': 'Vomit', 'name': 'vomit'},
                {'label': 'Ausc. L', 'name': 'auscl'},
                {'label': 'Ausc. H', 'name': 'ausch'},
                {'label': 'Pulsus', 'name': 'pulse'},
                {'label': 'Respirasi', 'name': 'respiration'},
                {'label': 'Abdominal Palpasi Pain', 'name': 'abdominal_palpasi_pain'},
                {'label': 'Abdominal Palpasi Tension', 'name': 'abdominal_palpasi_tension'},
                {'label': 'Limfonodule', 'name': 'limfonodule'},
                {'label': 'Mukosa', 'name': 'mukosa'},
                {'label': 'Mata', 'name': 'mata'},
                {'label': 'Hidung', 'name': 'hidung'},
                {'label': 'Mulut', 'name': 'mulut'},
                {'label': 'Telinga', 'name': 'telinga'},
                {'label': 'Kulit', 'name': 'kulit'},
                {'label': 'Ekstremitas', 'name': 'ekstremitas'},
                {'label': 'Sensasi Refleks', 'name': 'reflex'},
                {'label': 'Lainnya', 'name': 'other'},
                {'label': 'Tindakan', 'name': 'action'},
                {'label': 'Suhu', 'name': 'temperature'},
                {'label': 'Berat', 'name': 'weight'},
            ],
            'selected_check': false
        }
    }
    
    handleInputChangeRekamMedis(e) {
    	const value = e.target.value
    	const name = e.target.name
    	const id = e.target.id
    	var new_check = this.state.new_check
    	var aa = this
    	var index = this.props.index
    	
    	if (name == 'field_name') {
    	    var checked = this.state.available_check.filter(c => c.label == value)
    		if (checked.length != 0) {
    			new_check.name = checked[0].name
    			new_check.label = checked[0].label
		        aa.setState({new_check: new_check})
		        var anamnese = document.getElementById("field_name_anamnese"+index)
            	var pemeriksaan = document.getElementById("field_name_pemeriksaan"+index)
            	var diagnosa = document.getElementById("field_name_diagnosa"+index)
            	if(id == 'field_name_anamnese'+index){
            	    pemeriksaan.value = ''
            	    diagnosa.value = ''
            	}
            	else if(id == 'field_name_pemeriksaan'+index){
            	    anamnese.value = ''
            	    diagnosa.value = ''
            	}
            	else if(id == 'field_name_diagnosa'+index){
            	    anamnese.value = ''
            	    pemeriksaan.value = ''
            	}
    		}
    	} else if (name == 'field_value') {
            new_check.value = value
	        this.setState({new_check: new_check})
    	}
    }
    
    handleInputBlurRekamMedis(e, list) {
        const value = e.target.value
        const name = e.target.name
        var new_check = this.state.new_check
    	var selected = false
    	
    	if (name == "field_name" || name == 'condition') {
    	    list.forEach(function(item, index) {
        	    if (item.label == value) {
        	        selected = true
        	    }
        	})
    	} else {
	        list.forEach(function(item, index) {
        	    if (item == value) {
        	        selected = true
        	    }
        	})
    	}
    	
    	if (!selected) {
    		e.target.value = ''
    		if (name == 'field_name') {
    		    new_check.name = ''
    	        this.setState({new_check: new_check})
    		}
    	}
    }
    
    pressEnterRekamMedis(e) {
    	var new_check = this.state.new_check
    	var index = this.props.index
    	
        if (e.key === 'Enter' || e.key == 'Tab') {
        	e.preventDefault();
            if (new_check.name && new_check.name != '' && new_check.value != '' && new_check.value) {
            	var field_value = document.getElementById("field_value"+index)
            	var anamnese = document.getElementById("field_name_anamnese"+index)
            	var pemeriksaan = document.getElementById("field_name_pemeriksaan"+index)
            	var diagnosa = document.getElementById("field_name_diagnosa"+index)
            	this.props.addCheck(this.state.new_check)
            	field_value.value = ''
            	anamnese.value = ''
            	pemeriksaan.value = ''
            	diagnosa.value = ''
            	this.setState({new_check: {}})
            }
        }
    }
    
    render() {
        var data = this.props.data
        var index = this.props.index
        var boxShadow_style = {background: '#fff', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', height: 'calc(100% - 50px)', overflowY: 'auto', maxHeight: '553px'}
        var inputStyle = {color: '#056EAD', border: '1px solid #056EAD', height:'35px'}
        var suhu, berat, kondisi_awal
        var enable_edit = false
        var panel_style = {background: '#D2EEFF', padding: '10px 20px', color: '#056EAD', borderRadius: '5px'}
        var fontColor = {color: '#6D7573'}
        var fontColor2 = {color: '#056EAD'}
        var cursor = {cursor: 'pointer'}
        
        enable_edit = true
        var available_check_anamnese = []
        var available_check_pemeriksaan = []
        var available_check_diagnosa = []
        var anamnese_options = ['vaccine_history', 'food_history', 'bcs', 'vomit', 'auscl', 'ausch', 'temperature', 'weight', 'other']
	    var pemeriksaan_options = ['pulse', 'respiration', 'abdominal_palpasi_pain','abdominal_palpasi_tension','limfonodule','mukosa','mata','hidung','mulut','telinga','kulit','ekstermitas','reflex']
	    var diagnosa_options = ['diagnosa_utama','prognosa','diagnosa_banding','action']
		var check_name = data.checks.filter(c => c.delete == undefined).map(c => c.name)
		this.state.available_check.forEach(function(item, index) {
		    if(!check_name.includes(item.name) && anamnese_options.includes(item.name)){
		        available_check_anamnese.push(
				    <option value={item.label} key={index.toString()}/>
				)
		    }
		    else if (!check_name.includes(item.name) && pemeriksaan_options.includes(item.name)){
		        available_check_pemeriksaan.push(
				    <option value={item.label} key={index.toString()}/>
				)
		    }
		    else if (!check_name.includes(item.name) && diagnosa_options.includes(item.name)){
		        available_check_diagnosa.push(
				    <option value={item.label} key={index.toString()}/>
				)
		    }
		})
		
    //     var option_kondisi = []
    //     kondisiOptions.forEach(function(item, index) {
    //         option_kondisi.push(
				// <option value={item.value} key={index.toString()} />
				// )
    //     })
        
    //     suhu = (
    //         <div className="col-3 pr-0">
		  //      <label htmlFor="temperature" className="fw600" style={fontColor}>Suhu (C)</label>
		  //      <input id="temperature" name="temperature" className="form-control border-0" placeholder="0"  onChange={this.props.changeTindakanDokter} value={data.temperature || ''} required style={fontColor} />
		  //  </div>
    //     )
    //     berat = (
    //         <div className="col-3">
		  //      <label htmlFor="weight" className="fw600" style={fontColor}>Berat (kg)</label>
		  //      <input id="weight" name="weight" className="form-control border-0" placeholder="0"  onChange={this.props.changeTindakanDokter} value={data.weight || ''} required style={fontColor} />
		  //  </div>
    //     )
        
    //     kondisi_awal = (
    //         <div className="col-6">
    // 		    <label htmlFor="condition" className="fw600" style={fontColor}>Kondisi Awal</label>
    // 			<div>
    //                 <input required name='condition' list="list_kondisi" id="condition" className="form-control border-0" onChange={this.props.changeTindakanDokter} placeholder="Pilih" autoComplete="off" style={fontColor} onBlur={e => this.handleInputBlurRekamMedis(e, kondisiOptions)}/>
    // 				<datalist id="list_kondisi">
    // 					{option_kondisi}
    // 				</datalist>
    //             </div>
    // 		</div>
    //     )
                    
        var newSelect = <div className="row mb-3">
							<div className="col-4 my-1">
								<input autoComplete="off" name='field_name' list={"anamnese_options"+index} id={"field_name_anamnese"+index} className="form-control fs14 fw600" style={inputStyle} onChange={e => this.handleInputChangeRekamMedis(e)} placeholder="Anamnese" onBlur={e => this.handleInputBlurRekamMedis(e, this.state.available_check.filter(i => anamnese_options.includes(i.name)))}/>
								<datalist id={"anamnese_options"+index}>
									{available_check_anamnese}
								</datalist>
							</div>
							<div className="col-4 my-1">
								<input autoComplete="off" name='field_name' list={"pemeriksaan_options"+index} id={"field_name_pemeriksaan"+index} className="form-control fs14 fw600" style={inputStyle} onChange={e => this.handleInputChangeRekamMedis(e)} placeholder="Pemeriksaan" onBlur={e => this.handleInputBlurRekamMedis(e, this.state.available_check.filter(i => pemeriksaan_options.includes(i.name)))}/>
								<datalist id={"pemeriksaan_options"+index}>
									{available_check_pemeriksaan}
								</datalist>
							</div>
							<div className="col-4 my-1">
								<input autoComplete="off" name='field_name' list={"diagnosa_options"+index} id={"field_name_diagnosa"+index} className="form-control fs14 fw600" style={inputStyle} onChange={e => this.handleInputChangeRekamMedis(e)} placeholder="Diagnosa" onBlur={e => this.handleInputBlurRekamMedis(e, this.state.available_check.filter(i => diagnosa_options.includes(i.name)))}/>
								<datalist id={"diagnosa_options"+index}>
									{available_check_diagnosa}
								</datalist>
							</div>
							<div className="col-12 my-1">
								<input style={inputStyle} type="text" className="form-control input-sm fs14 fw600" name="field_value" id={"field_value"+index} placeholder="Keterangan" onChange={e => this.handleInputChangeRekamMedis(e)} onKeyDown={e => this.pressEnterRekamMedis(e)}/>
							</div>
						</div>
    	    
        
        var checks_list = []
        data.checks.forEach((c, index) => {
            if(c.delete == undefined){
                checks_list.push(<PemeriksaanList check={c} key={index.toString()} status={data.status} deleteCheck={() => this.props.deleteCheck(index.toString())}/>)
            }
        })
        
        var toggle_button_icon, layout_class
        if(this.props.rekam_medis_wide){
            toggle_button_icon = "/static/img/main/menu/shrink.png"
            layout_class = "col-6"
        }
        else{
            toggle_button_icon = "/static/img/main/menu/expand.png"
            layout_class = "col-12"
        }
        
        return (
            <div className="px-4 pb-4 pt-2 mb-3">
                <div className="row">
                    <div className={layout_class}>
                        {newSelect}
                    	{checks_list}
                    </div>
                    <div className={layout_class}>
                        <Attachments attachments={data.attachments} enable_edit={enable_edit} deleteAction={this.props.deleteAttachment} addAction={this.props.addAttachment} addMarker={this.props.addMarker} resetMarker={this.props.resetMarker} marker={data.marker}/>
                    </div>
                </div>
			</div>
        )
    }
}

class PemeriksaanList extends React.Component {
    render() {
        var panel_style = {background: '#D2EEFF', padding: '10px 20px', color: '#056EAD', borderRadius: '5px'}
        var check = this.props.check
        var status = this.props.status
        var cursor = {cursor: 'pointer'}
        var deleteButton
        
        if (status == 'Draft') {
            deleteButton = <i className="fa fa-2x fa-trash ml-auto" onClick={this.props.deleteCheck} style={cursor}/>
        }
        return <div id={check.name} className="form-row mb-3 fs12 fw600 grooming_products" style={panel_style}>
	        <div className="col-3">
	            <span className="fs14">{check.label || check.name}</span>
	        </div>
	        <div className="col text-right">
	            <span className="fs14">{check.value}</span>
	        </div>
	        <div className="col-auto text-center d-flex">
        	    {deleteButton}
        	</div>
        </div>
    }
}

class Attachments extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            'show_list': false,
            'show_marker': false,
            'new_file': {}
        }
        this.addMarker = this.addMarker.bind(this)
        this.resetMarker = this.resetMarker.bind(this)
    }
    
    toggleShowList(){
        this.setState({show_list: !this.state.show_list})
    }
    
    toggleShowMarker(marker){
        if(['canine', 'feline'].includes(marker)){
            this.setState({show_marker: marker})
        }
        else {
            this.setState({show_marker: false})
        }
        
    }
    
    clickFile(){
        if(this.$file != undefined){
            var file = this.$file
            $(file).trigger('click');
        }
    }
    
    changeNewFile(e){
        var target = e.target
        var name = target.name
        var value = target.value
        var new_file = Object.assign({}, this.state.new_file)
        if(name == 'attachment'){
            var img = event.target.files[0];
            new_file[name] = img
            this.setState({new_file: new_file})
        }
        else {
            new_file[name] = value
            this.setState({new_file: new_file})
        }
    }
    
    addAttachments(){
        if(this.state.new_file.attachment != undefined && ![undefined, ''].includes(this.state.new_file.title)){
            this.props.addAction(this.state.new_file)
            this.setState({show_list: false, new_file: {}})
        }
    }
    
    cancelAttachments(){
        this.setState({show_list: false, new_file: {}})
    }
    
    addMarker(marker){
        this.props.addMarker(marker)
        this.setState({show_marker: false})
    }
    
    resetMarker(){
        this.props.resetMarker()
        this.setState({show_marker: false})
    }
    
    render(){
        var panel_style = {background: '#D2EEFF', padding: '10px 18px', color: '#056EAD', borderRadius: '5px'}
        var buttonStyle = {background: '#076FAD', color: '#FFF'}
        var cursor = {cursor: 'pointer'}
        var attachment_buttons = []
        var att = this
        if(this.props.attachments.length != 0){
            this.props.attachments.forEach((d, i) => {
                if(!d.deleted){
                    attachment_buttons.push(<AttachmentsButton key={i.toString()} data={d} enable_edit={att.props.enable_edit} deleteAction={() => att.props.deleteAction(i.toString())}/>)
                }
            })
        }
        
        var new_attachment_form, add_button, file_button
        if(this.state.new_file.attachment != undefined){
            file_button = <button type="button" title="Tambah" className="btn btn-success fs12 fw600 rounded-lg px-3" onClick={() => this.addAttachments()}><i className="fa fa-check"/></button>
        }
        else{
            file_button = <button type="button" title="Pilih File" className="btn fs12 fw600 rounded-lg px-3" style={buttonStyle} onClick={() => this.clickFile()}><i className="fa fa-file"/></button>
        }
        
        if(this.props.enable_edit){
            if(this.state.show_list){
                new_attachment_form = (
                    <div className="col-12 py-3 rounded-lg bg-white mb-3">
                        <div className="form-row">
                            <div className="col">
                                <input type="text" name="title" id="title" className="form-control fs12" required placeholder="Masukkan Judul" value={this.state.new_file.title || ''} onChange={e => this.changeNewFile(e)}/>
                            </div>
                            <div className="col-auto">
                                <input type="file" className="d-none" name="attachment" onChange={() => this.changeNewFile} ref={(ref) => this.$file = ref} onChange={e => this.changeNewFile(e)}/>
                                {file_button}
                            </div>
                            <div className="col-auto">
                                <button type="button" title="Batal" className="btn btn-outline-danger fs12 fw600 rounded-lg px-3" onClick={() => this.cancelAttachments()}><i className="fa fa-times"/></button>
                            </div>
                        </div>
                    </div>
                )
            }
            else {
                if(this.props.marker == undefined){
                    add_button = (
                        <div className="col-auto d-flex">
                            <button type="button" className="btn fs12 fw600 rounded-lg mx-1" style={buttonStyle} onClick={() => this.toggleShowMarker('feline')}><img src="/static/img/main/menu/cat-icon.png"/></button>
                            <button type="button" className="btn fs12 fw600 rounded-lg mx-1" style={buttonStyle} onClick={() => this.toggleShowMarker('canine')}><img src="/static/img/main/menu/dog-icon.png"/></button>
                            <button type="button" className="btn fs12 fw600 rounded-lg px-3 mx-1" style={buttonStyle} onClick={() => this.toggleShowList()}><i className="fa fa-plus mr-2"/>Attachment</button>
                        </div>
                    )
                }
                else {
                    add_button = (
                        <div className="col-auto">
                            <button type="button" className="btn fs12 fw600 rounded-lg px-3 mx-1" style={buttonStyle} onClick={() => this.toggleShowList()}><i className="fa fa-plus mr-2"/>Attachment</button>
                        </div>
                    )
                }
            }
        }
        
        var marker_panel
        if(this.props.marker != undefined){
            var marker_delete_button
            if(this.props.enable_edit){
                marker_delete_button = (
                    <div className="col-auto ml-auto mb-2"><i className="fa fa-2x fa-trash" style={cursor} onClick={e => {e.stopPropagation(); this.resetMarker()}}/></div>
                )
            }
            marker_panel = (
                <div className="form-row mb-3" style={panel_style} onClick={() => this.toggleShowMarker(this.props.marker.type)}>
                    {marker_delete_button}
                    <MarkerField readOnly={true} marker={this.props.marker} />
                </div>
            ) 
        }
        
        var attachment_panel
        if(attachment_buttons.length != 0){
            attachment_panel = (
                <div className="form-row mb-3" style={panel_style}>{attachment_buttons}</div>
            )
        }
        
        var marker_add
        if (this.state.show_marker) {
        var container_style = {borderRadius: '10px'}
            marker_add = (
            <div className='menu-popup' onClick={() => this.toggleShowMarker(false)}>
                <div className="container" style={container_style} onClick={event => event.stopPropagation()}>
                	<section className="px-5 py-4 bg-white rounded-lg">
                    	<MarkerField readOnly={!this.props.enable_edit} marker={this.props.marker} type={this.state.show_marker} submitAction={this.addMarker} resetAction={this.resetMarker}/>
                	</section>
                </div>
                <div className="menu-popup-close"/>
            </div>
            )
        }
        
        return(
            <div>
                {attachment_panel}
                {marker_panel}
                <div className="row justify-content-end my-3">
                    {new_attachment_form}
                    {add_button}
                </div>
                {marker_add}
            </div>
        )
    }
}

class AttachmentsButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            'show_validation': false,
        }
    }
    
    toggleShowValidation(){
        this.setState({'show_validation': !this.state.show_validation})
    }
    
    render(){
        var d = this.props.data
        var buttonStyle = {background: '#076FAD', color: '#FFF'}
        var delete_icon, validation
        
        if(this.props.enable_edit){
            delete_icon = (<i className="fa fa-trash ml-4" onClick={e => {e.stopPropagation(); this.toggleShowValidation()}}/>)
        }
        
        if (this.state.show_validation) {
        var container_style = {borderRadius: '10px', maxWidth: '508px'}
            validation = (
            <div className='menu-popup' onClick={() => this.toggleShowValidation()}>
                <div className="container" style={container_style} onClick={event => event.stopPropagation()}>
                	<section className="px-5 py-4 bg-white rounded-lg">
                    	<p className="fs24 text-center mb-4">{'Apakah anda yakin akan menghapus ' + d.title + ' ?'}</p>
                    	<div className="row justify-content-center">
                            <button className="btn py-1 px-2 px-lg-3 mr-5" style={buttonStyle} onClick={this.props.deleteAction}><p className="fs18 fs18md mb-0">Ya</p></button>
                            <button className="btn btn-danger py-1 px-2 px-lg-3" onClick={() => this.toggleShowValidation()}><p className="fs18 fs18md mb-0">Tidak</p></button>
                        </div>
                	</section>
                </div>
                <div className="menu-popup-close"/>
            </div>
            )
        }
        
        return(
            <div className="col-auto my-1">
                {validation}
                <a title={d.title} className="btn fs14 fw600 rounded-lg px-3" style={buttonStyle} onClick={() => {window.open(d.attachment, '_blank')}}>{d.title}{delete_icon}</a>
            </div>
        )
    }
}

class MarkerField extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            'marker': {
                'type': 'canine',
                'markers': []
            },
        }
    }
    
    componentDidMount() {
        if(this.props.marker != undefined){
            var marker = Object.assign({}, this.props.marker)
            this.setState({marker: marker})
        }
        else if(this.props.marker == undefined && ['canine', 'feline'].includes(this.props.type)){
            var marker = Object.assign({}, this.state.marker)
            marker.type = this.props.type
            this.setState({marker: marker})
        }
    }
    
    submitMarker(){
        this.props.submitAction(this.state.marker);
    }
    
    resetMarker(){
        this.props.resetAction();
    }
    
    clickArea(e){
        if(!this.props.readOnly){
            var marker = Object.assign({}, this.state.marker)
            var rect = e.target.getBoundingClientRect();
            var x = e.clientX - rect.left - 7;
            var x_percent = (x*100)/rect.width;
            var y = e.clientY - rect.top - 7;
            var y_percent = (y*100)/rect.height;
            var new_marker = {x: x_percent+'%', y: y_percent+'%'}
            
            marker.markers.push(new_marker)
            this.setState({marker: marker})
        }
    }
    
    render(){
        var boxShadow_style = {background: '#fff', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)'}
        
        var markers = this.state.marker.markers
        var marker_list = []
        if(markers != undefined && markers.length != 0){
            markers.forEach((marker, index) => marker_list.push(<Marker x={marker.x} y={marker.y} description={marker.description} key={index.toString()}/>))
        }
        
        var marker_field_class
        if(this.props.type == 'feline' || this.state.marker.type == 'feline'){
            marker_field_class = 'marker-field-cat'
        }
        else {
            marker_field_class = 'marker-field-dog'
        }
        
        var action_button
        if(!this.props.readOnly){
            action_button = (
                <div className="row">
                    <div className="col-auto ml-auto">
                        <button type="button" className="btn btn-success fs12 fw600 rounded-lg px-3 mx-1" onClick={() => this.submitMarker()}>Submit</button>
                        <button type="button" className="btn btn-danger fs12 fw600 rounded-lg px-3 mx-1" onClick={() => this.resetMarker()}>Reset</button>
                    </div>
                </div>
            )
        }
        
        return(
            <div className="w-100">
                {action_button}
                <div className={'marker-field '+marker_field_class} onClick={e => this.clickArea(e)}>
                    {marker_list}
                </div>
            </div>
        )
    }
}

class Marker extends React.Component {
    render(){
        var markerStyle={
            position: 'absolute',
            top: this.props.y,
            left: this.props.x,
        }
        
        return(
            <i className="fa fa-lg fa-times text-danger" style={markerStyle} title={this.props.description}/>
        )
    }
}

ReactDOM.render(<RawatInapNew/>,document.getElementById("rawat_inap_new"));