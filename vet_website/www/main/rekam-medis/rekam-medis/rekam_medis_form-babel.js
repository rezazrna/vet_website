var mode = document.getElementById('rekam_medis_form').getAttribute('mode')
var list = document.getElementsByTagName("title")[0].innerHTML.split('/')
var id = list[list.length - 1].replace(' ', '')
// var tzOffset = new Date().getTimezoneOffset()
var tzOffset = 0

var kondisiOptions = [
        {label: 'Sehat', value: 'Sehat'},
        {label: 'Sakit', value: 'Sakit'},
        {label: 'Membaik', value: 'Membaik'},
        {label: 'Memburuk', value: 'Memburuk'},
        {label: 'Kritis', value: 'Kritis'},
    ]

class RekamMedisForm extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': [],
            'diagnose': [],
            'loaded': false,
            'main_form_wide': false,
            'rekam_medis_wide': false,
            'checks': []
        }
        
        this.toggleMainFormWide = this.toggleMainFormWide.bind(this)
        this.toggleRekamMedisWide = this.toggleRekamMedisWide.bind(this)
        this.addMarker = this.addMarker.bind(this)
        this.navigationAction = this.navigationAction.bind(this)
    }
    
    componentDidMount() {
        var lastfilter = JSON.parse(sessionStorage.getItem('/main/rekam-medis/rekam-medis'))
        var gr = this
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetrekammedis.vetrekammedis.get_name_list",
            args: {filters: lastfilter},
            callback: function(r){
                if (r.message) {
                    gr.setState({'namelist': r.message});
                }
            }
        })
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetrekammedis.vetrekammedis.get_rekam_medis_form",
            args: {name: id},
            callback: function(r){
                if (r.message) {
                    console.log(r.message);
                    var checks = [
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
                        {'label': 'Abdomnal Palpasi Pain', 'name': 'abdominal_palpasi_pain'},
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
                    ]
                    var new_checks = []
                    
                    checks.forEach((c, index) => {
                        if (![undefined, '', null, 0].includes(r.message.rekam_medis[c.name])){
                            c.value = r.message.rekam_medis[c.name]
                            new_checks.push(c)
                        }
                    })
                    
                    gr.setState({'data': r.message.rekam_medis, 'diagnose': r.message.diagnose, 'loaded': true, 'checks': new_checks});
                }
            }
        });
    }
    
    toggleMainFormWide(){
        this.setState({main_form_wide: !this.state.main_form_wide})
    }
    
    toggleRekamMedisWide(){
        this.setState({rekam_medis_wide: !this.state.rekam_medis_wide})
    }
    
    addMarker(data){
        var new_data = Object.assign({}, this.state.data)
        new_data.markers.push(data)
        this.setState({data: new_data})
    }
    
    navigationAction(name){
        window.location.href="/main/rekam-medis/rekam-medis/detail?n="+name
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
            filename: "RekamMedis-"+this.state.data.name+".pdf",
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
        var color = {color: '#056EAD', cursor: 'pointer'}
        var cursor = {cursor: 'pointer'}
        var rowStyle = {minHeight: '64px'}
        var backButton = <span className="fs16 fw600 mr-4 my-auto" style={color} onClick={() => window.location.href='/main/rekam-medis/rekam-medis'}><i className="fa fa-chevron-left mr-1" style={color}></i>Back</span>
        
        var deceased
        if(this.state.data.pet_status == 'Nonactive'){
            deceased = (
                <div className="col-auto mr-auto" style={cursor} onClick={e => this.rekamMedisClick(e)}>
                    <div className="row mx-0">
                        <div className="col-auto px-3">
                            <img className="d-block mx-auto mt-2 header-icon" src="/static/img/main/menu/tombstone.png"/>
                            <p className="mb-0 fs12 text-muted text-center">R.I.P</p>
                        </div>
                    </div>
                </div>
            )
        }
        
        var rekam_medis_class="col-6"
        if(this.state.rekam_medis_wide){
            rekam_medis_class="col-12"
        }
        
        if (this.state.loaded) {
            return <div>
                        <div style={bgstyle}>
                    		<div className="row mx-0 flex-row-reverse" style={rowStyle}>
                    		    <div className="col-auto my-auto">
                    				<button type="button" className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={() => this.printPDF()}>Print</button>
                    			</div>
                    		    {deceased}
                    			<div className="col-auto d-flex mr-auto">
                    				{backButton}
                    			</div>
                    		</div>
                    	</div>
                    	<RecordNavigation currentname={this.state.data.name} namelist={this.state.namelist} navigationAction={this.navigationAction}/>
                        <p className="fs18 fw600 text-dark mb-2">
                        	Data Pasien
                        </p>
                        <DataPasien rekam_medis={this.state.data} main_form_wide={this.state.main_form_wide} toggleMainFormWide={() => this.toggleMainFormWide()}/>
                        <div className="row">
                    	    <div className={rekam_medis_class}>
                    	        <TindakanDokterRekamMedis data={this.state.data} changeTindakanDokter={this.changeTindakanDokter} handleInputBlur={this.handleInputBlur} addCheck={this.addCheck} deleteCheck={this.deleteCheck} checks={this.state.checks} toggleRekamMedisWide={() => this.toggleRekamMedisWide()} deleteAttachment={this.deleteAttachment} addAttachment={this.addAttachment} addMarker={this.addMarker} resetMarker={this.resetMarker} rekam_medis_wide={this.state.rekam_medis_wide}/>
                    	    </div>
                    	    <div className="col-6">
                    	        <AnalisaLayananObat analisa_layanan_obat={this.state.data.analisa_layanan_obat}/>
                    	    </div>
                    	</div>
                    	<PDF data={this.state.data} checks={this.state.checks}/>
                    </div>
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

class DataPasien extends React.Component {
    sourceClick(tipe){
        if (tipe == 'pemilik') {
            window.location.href = '/main/penerimaan/data-pemilik/edit?n=' + this.props.rekam_medis.pet_owner
        } else if (tipe == 'pasien') {
            window.location.href = '/main/penerimaan/data-pasien/edit?n=' + this.props.rekam_medis.pet
        }
    }
    
    render() {
        var panel_style = {background: '#fff', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)'}
        var cursor = {cursor: 'pointer'}
        var rekam_medis = this.props.rekam_medis
        var cursor = {cursor: 'pointer'}
        var link_pemilik = <img src="/static/img/main/menu/tautan.png" className="mx-2" onClick={() => this.sourceClick('pemilik')} style={cursor}/>
        var link_pasien = <img src="/static/img/main/menu/tautan.png" className="mx-2" onClick={() => this.sourceClick('pasien')} style={cursor}/>
        
        var row, button
        if (this.props.main_form_wide){
            button = <span style={cursor} onClick={this.props.toggleMainFormWide}><img src="/static/img/main/menu/shrink.png"/></span>
            row = (
                <div className="row mx-0">
        			<div className="col">
        			    <div className="row">
        			        <div className="col-4">
            			        <div className="form-group">
                					<label htmlFor="reception" className="fs10 fw600">Usia</label>
                					<p>{rekam_medis.pet_age || ''}</p>
                				</div>
                				<div className="form-group">
                					<label htmlFor="register_number" className="fs10 fw600">No Pendaftaran</label>
                					<p>{rekam_medis.register_number || ''}</p>
                				</div>
        			        </div>
        			        <div className="col-4">
        			            <div className="form-group">
                					<label htmlFor="pet_name" className="fs10 fw600">Nama Pasien</label>
                					<p>{rekam_medis.pet_name || ''}{link_pasien}</p>
                				</div>
                				<div className="form-group">
                					<label htmlFor="pet_owner_name" className="fs10 fw600">Nama Pemilik</label>
                					<p>{rekam_medis.pet_owner_name || ''}{link_pemilik}</p>
                				</div>
        			        </div>
        			        <div className="col-4">
            			        <div className="form-group">
                					<label htmlFor="reception_date" className="fs10 fw600">Tanggal Pendaftaran</label>
                					<p>{moment(rekam_medis.record_date).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss") || ''}</p>
                				</div>
            			        <div className="form-group">
                					<label htmlFor="nama_dokter" className="fs10 fw600">Nama Dokter</label>
                					<p>{rekam_medis.nama_dokter || ''}</p>
                				</div>
        			        </div>
        			    </div>
        			</div>
        			<div className="col-3">
        				<div className="form-group">
        					<label htmlFor="description" className="fs10 fw600">Catatan</label>
        					<textarea id="description" name="description" className="form-control lightbg border-0" rows="3" placeholder="Masukkan bila ada" value={rekam_medis.description || ''} readOnly={true}/>
        				</div>
        			</div>
        			<div className="col-auto text-right mt-auto">
			            {button}
			        </div>
        		</div>
            )
        }
        else {
            button = <span style={cursor} onClick={this.props.toggleMainFormWide}><img src="/static/img/main/menu/expand.png"/></span>
            row = (
                <div className="row mx-0">
			        <div className="col-3">
    			        <div className="form-group">
        					<label htmlFor="reception" className="fs10 fw600">Usia</label>
        					<p>{rekam_medis.pet_age || ''}</p>
        				</div>
			        </div>
			        <div className="col-3">
			            <div className="form-group">
        					<label htmlFor="pet_name" className="fs10 fw600">Nama Pasien</label>
        					<p>{rekam_medis.pet_name || ''}{link_pasien}</p>
        				</div>
			        </div>
			        <div className="col-3">
    			        <div className="form-group">
        					<label htmlFor="nama_dokter" className="fs10 fw600">Nama Dokter</label>
        					<p>{rekam_medis.nama_dokter || ''}</p>
        				</div>
			        </div>
			        <div className="col">
			            <div className="form-group">
        					<label htmlFor="reception_date" className="fs10 fw600">Tanggal Pendaftaran</label>
        					<p>{moment(rekam_medis.record_date).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss") || ''}</p>
        				</div>
			        </div>
			        <div className="col-auto text-right mt-auto">
			            {button}
			        </div>
        		</div>
        	)
        }
        
        return <div style={panel_style} className="py-2 px-3 mb-4">
            	{row}
            </div>
    }
}

class AnalisaLayananObat extends React.Component {
    render() {
        var boxShadow_style = {background: '#fff', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', height: 'calc(100% - 50px)', overflowY: 'auto', maxHeight: '553px'}
        var rows = []
        var analisa_layanan_obat = this.props.analisa_layanan_obat
        
        analisa_layanan_obat.forEach(function(item, index) {
            rows.push(<AnalisaLayananObatList item={item} key={index.toString()} />)
        })
        
        return (
            <div className="h-100">
                <p className="mb-2 text-dark fs18 fw600">Analisa Layanan dan Obat</p>
                <div className="p-4 mb-3" style={boxShadow_style}>
            		<div className="col row-header">
            			<div className="row mx-0 fs14 fw600">
            				<div className="col">
            					<p className="mb-0">Jenis</p>
            				</div>
            				<div className="col-7 text-center">
            					<p className="mb-0">Nama / Detail</p>
            				</div>
            				<div className="col-2 text-right">
            					<p className="mb-0">Qty</p>
            				</div>
            			</div>
            		</div>
            		{rows}
    			</div>
			</div>
        )
    }
}

class AnalisaLayananObatList extends React.Component {
    render() {
        var item = this.props.item
        var note
        var product_name = []
        var quantity = []
        var noteStyle = {color: '#056EAD', background: '#fff'}
        var rowStyle = {borderBottom: '1px solid #CBD3DA', padding: '12px 0', color: '#787E84', background: '#F5FBFF'}
        
        if (!item.uom_name) {
            item.uom_name = ''
        }
        
        if (item.type == 'Obat') {
            if (item.note) {
                note  = <div className="row fs14 mx-0 mt-2" style={noteStyle}>
            			    <div className="col-2 pr-0">
            			        <p className="mb-0">Catatan : </p>
            			    </div>
            			    <div className="col pl-0">
            			        <p className="mb-0">{item.note}</p>
            			    </div>
            			</div>
            }
        	
        	product_name.push(<p className="mb-0" key="999">{item.product_name}</p>)
        	quantity.push(<p className="mb-0" key="999">{item.quantity + ' ' + item.uom_name}</p>)
        	
        	item.product_racikan.forEach(function(item, index) {
        	    product_name.push(<p className="mb-0" key={index.toString()}>{item.product_name}</p>)
        	    quantity.push(<p className="mb-0" key={index.toString()}>{item.quantity + ' ' + item.uom_name}</p>)
        	})
        } else {
            product_name.push(<p className="mb-0" key="999">{item.product_name}</p>)
            quantity.push(<p className="mb-0" key="999">{item.quantity + ' ' + item.uom_name}</p>)
        }
        
        return (
    		<div className="col" style={rowStyle} >
    			<div className="row mx-0 fs16 fw600 mb-2">
    				<div className="col">
    					<p className="mb-0">{item.type}</p>
    				</div>
    				<div className="col-9">
    				    <div className="row">
    				        <div className="col-10">
            					{product_name}
            				</div>
            				<div className="col text-right">
            					{quantity}
            				</div>
    				    </div>
    				    {note}
    				</div>
    			</div>
    		</div>
        )
    }
}

class TindakanDokterRekamMedis extends React.Component {
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
                {'label': 'Abdomnal Palpasi Pain', 'name': 'abdominal_palpasi_pain'},
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
    	var new_check = this.state.new_check
    	var aa = this
    	
    	
    	if (name == 'field_name') {
    	    var checked = this.state.available_check.filter(c => c.label == value)
    		if (checked.length != 0) {
    			new_check.name = checked[0].name
    			new_check.label = checked[0].label
		        aa.setState({new_check: new_check})
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
    	
        if (e.key === 'Enter' || e.key == 'Tab') {
        	e.preventDefault();
            console.log(this.state, 'masuk')
            if (new_check.name && new_check.name != '' && new_check.value != '' && new_check.value) {
            	var field_value = document.getElementById("field_value")
            	var field_name = document.getElementById("field_name")
            	this.props.addCheck(this.state.new_check)
            	field_value.value = ''
            	field_name.value = ''
            	this.setState({new_check: {}})
            }
        }
    }
    
    render() {
        var data = this.props.data
        var boxShadow_style = {background: '#fff', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', height: 'calc(100% - 50px)', overflowY: 'auto', maxHeight: '553px'}
        var inputStyle = {color: '#056EAD', border: '1px solid #056EAD', height:'35px'}
        var suhu, berat, kondisi_awal
        var enable_edit = false
        var panel_style = {background: '#D2EEFF', padding: '10px 20px', color: '#056EAD', borderRadius: '5px'}
        var fontColor = {color: '#6D7573'}
        var fontColor2 = {color: '#056EAD'}
        var cursor = {cursor: 'pointer'}
        
        if (data.status == 'Draft') {
            enable_edit = true
            var available_check = []
			var check_name = this.props.checks.filter(c => c.delete == undefined).map(c => c.name)
			this.state.available_check.forEach(function(item, index) {
			    if(!check_name.includes(item.name)){
			        available_check.push(
    				    <option value={item.label} key={index.toString()}/>
    				)
			    }
    		})
    		
            var option_kondisi = []
            kondisiOptions.forEach(function(item, index) {
                option_kondisi.push(
    				<option value={item.value} key={index.toString()} />
    				)
            })
            
            suhu = (
                <div className="col-3 pr-0">
    		        <label htmlFor="temperature" className="fw600" style={fontColor}>Suhu (C)</label>
    		        <input id="temperature" name="temperature" className="form-control border-0" placeholder="0"  onChange={this.props.changeTindakanDokter} required style={fontColor} />
    		    </div>
            )
            berat = (
                <div className="col-3">
    		        <label htmlFor="weight" className="fw600" style={fontColor}>Berat (kg)</label>
    		        <input id="weight" name="weight" className="form-control border-0" placeholder="0"  onChange={this.props.changeTindakanDokter} required style={fontColor} />
    		    </div>
            )
            
            kondisi_awal = (
                <div className="col-6">
        		    <label htmlFor="condition" className="fw600" style={fontColor}>Kondisi Awal</label>
        			<div>
                        <input name='condition' list="list_kondisi" id="condition" className="form-control border-0" onChange={this.props.changeTindakanDokter} placeholder="Pilih" autoComplete="off" style={fontColor} onBlur={e => this.handleInputBlurRekamMedis(e, kondisiOptions)}/>
        				<datalist id="list_kondisi">
        					{option_kondisi}
        				</datalist>
                    </div>
        		</div>
            )
                        
            var newSelect = <div className="row mb-3">
    							<div className="col-7 ">
    								<input name='field_name' list="options" id="field_name" className="form-control fs14 fw600" style={inputStyle} onChange={e => this.handleInputChangeRekamMedis(e)} placeholder="Pilih Untuk Menambahkan" onBlur={e => this.handleInputBlurRekamMedis(e, this.state.available_check)}/>
    								<datalist id="options">
    									{available_check}
    								</datalist>
    							</div>
    							<div className="col-5">
    								<input style={inputStyle} type="text" className="form-control input-sm fs14 fw600" name="field_value" id="field_value" placeholder="Keterangan" onChange={e => this.handleInputChangeRekamMedis(e)} onKeyDown={e => this.pressEnterRekamMedis(e)}/>
    							</div>
    						</div>
    	    
        } else if (data.status != 'Draft') {
            suhu = (
                <div className="col-4 text-center">
        		    <label htmlFor="temperature" className="fwbold" style={fontColor2}>Suhu</label>
        		    <p style={fontColor2} className="mb-0 fw600">{data.temperature}</p>
        		</div>
            )
            berat = (
                <div className="col-4 text-center">
        		    <label htmlFor="weight" className="fwbold" style={fontColor2}>Berat</label>
        		    <p style={fontColor2} className="mb-0 fw600">{data.weight}</p>
        		</div>
        	)
            kondisi_awal = (
                <div className="col-4 text-center">
        		    <label htmlFor="condition" className="fwbold" style={fontColor2}>Kondisi Awal</label>
        		    <p style={fontColor2} className="mb-0 fw600">{data.condition}</p>
        		</div>
            )
        }
        
        var checks_list = []
        this.props.checks.forEach((c, index) => {
            if(c.delete == undefined){
                checks_list.push(<TindakanDokterRekanMedisList check={c} key={index.toString()} status={data.status} deleteCheck={() => this.props.deleteCheck(index.toString())}/>)
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
            <div className="h-100">
                <p className="mb-2 text-dark fs18 fw600">Rekam Medis</p>
                <div className="px-4 pb-4 pt-2 mb-3" style={boxShadow_style}>
                    <div className="text-right mb-3 p-0">
			            <span style={cursor} onClick={this.props.toggleRekamMedisWide}><img src={toggle_button_icon}/></span>
			        </div>
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
			</div>
        )
    }
}

class TindakanDokterRekanMedisList extends React.Component {
    render(){
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
        if(this.props.attachments != undefined && this.props.attachments.length != 0){
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
            markers.forEach((marker, index) => marker_list.push(<Marker x={marker.x} y={marker.y} description={marker.description} key={index.toString()} mini={this.props.mini}/>))
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
        
        if(this.props.mini){markerStyle.fontSize=6}
        
        return(
            <i className="fa fa-lg fa-times text-danger" style={markerStyle} title={this.props.description}/>
        )
    }
}

class PDF extends React.Component{
    render(){
        var data = this.props.data
        var checks = this.props.checks
        console.log(checks)
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
        var obat_rows = []
        var check_rows = []
        
        data.analisa_layanan_obat.forEach((d, index) => {
            obat_rows.push(
                <div className={data.marker?"col-6 py-1":"col-12 py-1"} style={fs9} key={index.toString()}>
                    <div className="row mx-n2">
                        <div className="col-3 px-0 fwbold">
                            {d.type}
                        </div>
                        <div className="col-6 px-0">
                            {d.product_name}
                        </div>
                        <div className="col-3 px-0">
                            {d.quantity+" "+d.uom_name}
                        </div>
                    </div>
                </div>
            )
        })
        
        checks.filter(c => !c.delete).forEach((c, index) => {
            check_rows.push(
                <div className="row mx-n2" style={fs9} key={index.toString()}>
                    <div className="col-6 px-0 fwbold py-1">
                        {c.label}
                    </div>
                    <div className="col-6 px-0 py-1 text-right">
                        {c.value}
                    </div>
                </div>
            )
        })
        
        var marker
        if(data.marker){
            marker = <div className="col-6 px-1"><MarkerField marker={data.marker} readOnly={true} mini={true}/></div>
        }
        
        return(
            <div className="position-absolute d-none" style={page_dimension}>
                <div id="pdf" className="px-4" style={page_dimension}>
    			    <div className="row">
    			        <div className="col-2 px-0">
    			            <img className="mt-3" src="/static/img/main/menu/naturevet_logo_2x.png"/>
    			        </div>
    			        <div className="col-5">
    			            <p className="my-3 fwbold text-uppercase" style={fs13}>Nature Vet Tebet</p>
    			            <p className="my-0" style={fs9}>Jl. Tebet Raya No.14, Tebet Bar.,<br/>Kec. Tebet,  Jakarta Selatan</p>
    			            <p className="my-0" style={fs9}>Telp. : (021) 83792692 </p>
    			        </div>
    			        <div className="col-5 px-0">
    			            <p className="fwbold text-right text-uppercase fs28" style={invoice}>Rekam Medis</p>
    			            <p className="fw600 text-right text-uppercase fs14" style={invoice2}>{data.name}</p>
    			        </div>
    			        <div className="col-12" style={borderStyle}/>
    			    </div>
    			    <div className="row mx-0" style={row1}>
    			        <div className="col-3 px-0">
    			            <p className="mb-0 fs10">{data.pet_name}</p>
    			        </div>
    			        <div className="col-3 px-0">
    			            <p className="mb-0 fs10 text-center">{data.pet_age || ''}</p>
    			        </div>
    			        <div className="col-3 px-0">
    			            <p className="mb-0 fs10 text-center">{data.service}</p>
    			        </div>
    			        <div className="col-3 px-0">
			                <p className="mb-0 fs10 text-right">
			                    {moment(data.record_date).format('DD-MM-YYYY HH:mm:ss')}
			                </p>
			                <p className="mb-0 fs10 text-right">
			                    {data.nama_dokter}
			                </p>
    			        </div>
    			    </div>
    			    <div className="row">
    			        <div className={data.marker?"col-12":"col-6"}>
    			            <div className="row mx-n2">
            			        <div className="col-12 text-uppercase text-center fw700 py-2" style={thead}>Rekam Medis</div>
            			    </div>
            			    <div className="row mx-n2">
            			        <div className={data.marker?"col-6":"col-12"}>
            			            {check_rows}
            			        </div>
            			        {marker}
            			    </div>
    			        </div>
    			        <div className={data.marker?"col-12":"col-6"}>
    			            <div className="row mx-n2">
            			        <div className="col-12 text-uppercase text-center fw700 py-2" style={thead}>Analisa Layanan dan Obat</div>
            			    </div>
            			    <div className="row mx-n2">
            			        {obat_rows}
            			    </div>
    			        </div>
    			    </div>
    			</div>
			</div>
        )
    }
}

ReactDOM.render(<RekamMedisForm />,document.getElementById("rekam_medis_form"));