var n = getUrlParameter('n');

class NewOwner extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'new_owner': {},
            'new_pets': [{}],
            'owner': false,
            'pets': false,
            'data_exist': false,
            'show_alert': true,
            'loaded': false,
            'pet_type': []
        }
        
    }
    
    componentDidMount() {
        var po = this
        var new_pets = this.state.new_pets.slice()
        new_pets[0].register_date = this.getRegisterDate()
        this.setState({new_pets: new_pets})
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetpettype.vetpettype.get_all_pet_type",
            args: {},
            callback: function(r){
                if (r.message.length != 0) {
                    po.setState({'pet_type': r.message});
                }
            }
        });
        if(n){
            frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetpetowner.vetpetowner.get_pet_owner_by_name",
                args: {name: n},
                callback: function(r){
                    if (r.message.length != 0) {
                        console.log(r.message)
                        po.setState({'owner': r.message[0], 'pets': r.message[0].pets, 'loaded': true});
                    }
                }
            });
        }
        else {
            this.setState({'loaded': true})
        }
    }
    
    handleInputChange(event) {
        const value = event.target.value;
        const name = event.target.name;
        if(name == 'nik'){
            this.checkNik(value);
        }
        var owner = Object.assign({}, this.state.new_owner);
        owner[name] = value
        this.setState({new_owner: owner});
    }
    
    handleInputChangePet(event, i) {
        const value = event.target.value;
        const name = event.target.name;
        var new_pets = this.state.new_pets.slice()
        new_pets[i][name] = value
        this.setState({new_pets: new_pets});
    }
    
    newOwner(e) {
        e.preventDefault();
        if(this.state.data_exist){
	        this.setState({show_alert: true});
	    }
	    else {
	        frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetpetowner.vetpetowner.new_pet_owner",
                args: {data: this.state.new_owner, pets: this.state.new_pets},
                callback: function(r){
                    if (r.message.error) {
                        console.log(r.message.error);
                    }
                    else {
                        window.location.search = "?n="+r.message.name;
                    }
                }
            });
	    }
    }
    
    getRegisterDate() {
        return moment().format('YYYY-MM-DD hh:mm:ss')
    }
    
    closeAlert() {
        this.setState({show_alert: false})
    }
    
    addPetRow(e) {
        e.preventDefault();
        var new_pets = this.state.new_pets.slice()
        new_pets.push({register_date: this.getRegisterDate()})
        this.setState({new_pets: new_pets})
    }
    
    checkNik(nik){
        var no = this
        frappe.call({
    		type: "POST",
    		method:"vet_website.vet_website.doctype.vetpetowner.vetpetowner.reception_get_pet_owner",
    		args: {nik: nik},
    		callback: function(r){
    		    if(r.message.doc){
    		        no.setState({data_exist: true});
    		    }
    		    else {
    		        no.setState({data_exist: false});
    		    }
    		}
    	});
    }
    
    isReadOnly() {
        if(this.state.owner){
            return true
        }
        else {
            return false
        }
    }
    
    render() {
        var background_style = {background: '#fff', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)'}
        var background_style2 = {background: '#fff'}
        var button_row_style = {background: '#FFFFFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', padding: '20px 32px', marginBottom: '24px'}
        var lineHeight_style = {lineHeight: '14px'}
        var noLeftRight = {left: '0', right: '0'}
        var add_pet_button_style = {color: '#056EAD', background: '#84D1FF'}
        var pet_list_style = {maxHeight: '470px', overflowY: 'auto', overflowX: 'hidden'}
        
        var alert_render, button_row, pet_button_row
        
        if (this.state.data_exist && this.state.show_alert){
            alert_render = (
                <span className="alert alert-danger alert-dismissible fade show rounded-pill fs14" role="alert">
                	NIK sudah terdaftar
                	<button className="close" onClick={() => this.closeAlert()}>
                		<span>&times;</span>
                	</button>
                </span>
            )
        }
        
        if (!this.state.owner){
            button_row = (
                <div style={button_row_style}>
            		<div className="row mx-0 flex-row-reverse">
            			<div className="col-auto">
            				<a href="/main/penerimaan/data-pemilik" className="btn btn-sm fs12 btn-outline-danger text-uppercase h-100">Batalkan</a>
            			</div>
            			<div className="col-auto">
            				<button type="submit" form="new_owner" className="btn btn-sm btn-danger fs12 text-uppercase h-100" style={lineHeight_style}>Tambah Pemilik</button>
            			</div>
            		</div>
            		<div id="alert_box" className="text-center mb-3 position-absolute" style={noLeftRight}>{alert_render}</div>
        	    </div>
            )
            pet_button_row = (
                <button onClick={(e) => this.addPetRow(e)} className="btn fs14 py-3 btn-block text-uppercase rounded-0" style={add_pet_button_style}><i className="fa fa-plus mr-2"></i>Tambah Hewan</button>
            )
        }
        else {
            button_row = (
                <div style={button_row_style}>
            		<div className="row mx-0 flex-row-reverse">
            			<div className="col-auto">
            				<a href="/main/penerimaan/data-pemilik" className="btn btn-sm fs12 btn-outline-danger text-uppercase h-100">Kembali</a>
            			</div>
            			<div className="col-auto mr-auto">
                            <a className="fs18 fw600">
                                <img src="/static/img/main/menu/spending.png" className="mr-3" title="Spending" />{this.state.owner.total_spending}
                            </a>
                        </div>
                        <div className="col-auto mr-2">
                            <a className="fs18 fw600">
                                <img src="/static/img/main/menu/visit.png" className="mr-3" title="Visit" />{this.state.owner.total_visit}
                            </a>
                        </div>
            		</div>
            		<div id="alert_box" className="text-center mb-3 position-absolute" style={noLeftRight}>{alert_render}</div>
        	    </div>
            )
        }
        
        var new_pet_row = []
        if(this.state.pets && this.state.pets.length != 0){
            var po = this
            this.state.pets.forEach((r, index) => {new_pet_row.push(<NewOwnerPetRow index={index.toString()} key={index.toString()} pet={r} register_date={r.register_date} isReadOnly={this.isReadOnly()}/>)})
        }
        else if(this.state.new_pets.length != 0){
            var po = this
            this.state.new_pets.forEach((r, index) => {new_pet_row.push(<NewOwnerPetRow index={index.toString()} key={index.toString()} pet={r} pet_type={po.state.pet_type} handleInputChangePet={e => this.handleInputChangePet(e, index.toString())} register_date={r.register_date} isReadOnly={this.isReadOnly()}/>)})
        }
        
        if (this.state.loaded){
            return (
                <form id="new_owner" onSubmit={(e) => this.newOwner(e)}>
                    {button_row}
            	    <div className="row">
                	    <div className="col-6">
            				<p className="fs18 fw600 text-dark mb-2">
            					Data Pemilik
            				</p>
            				<div style={background_style}>
            					<div className="p-4 pr-5">
            						<div className="form-group">
            							<label htmlFor="nik" className="fs10 fw600">NIK pemilik</label>
            							<div className="row mx-0">
            								<input required readOnly={this.isReadOnly()} id="nik" name='nik' className="form-control border-0 lightbg col-7" defaultValue={this.state.owner.nik || ''} onChange={e => this.handleInputChange(e)} />
            							</div>
            						</div>
            						<div className="form-group">
            							<label htmlFor="owner_name" className="fs10 fw600">Nama pemilik</label>
            							<div className="row mx-0">
            								<input required readOnly={this.isReadOnly()} id="owner_name" name='owner_name' className="form-control border-0 lightbg col-7" defaultValue={this.state.owner.owner_name || ''} onChange={e => this.handleInputChange(e)} />
            							</div>
            						</div>
            						<div className="form-group">
            							<label htmlFor="phone" className="fs10 fw600">No handphone</label>
            							<div className="row mx-0">
            								<input required readOnly={this.isReadOnly()} id="phone" name='phone' className="form-control border-0 lightbg col-7" defaultValue={this.state.owner.phone || ''} onChange={e => this.handleInputChange(e)} />
            							</div>
            						</div>
            						<div className="form-group">
            							<label htmlFor="email" className="fs10 fw600">Email</label>
            							<div className="row mx-0">
            								<input required readOnly={this.isReadOnly()} id="email" name='email' type="email" className="form-control border-0 lightbg col-7" defaultValue={this.state.owner.email || ''} onChange={e => this.handleInputChange(e)} />
            							</div>
            						</div>
            						<div className="form-group">
            							<label htmlFor="address" className="fs10 fw600">Alamat</label>
            							<textarea required readOnly={this.isReadOnly()} id="address" name='address' className="form-control border-0 lightbg" rows="3" defaultValue={this.state.owner.address || ''} onChange={e => this.handleInputChange(e)} ></textarea>
            						</div>
            					</div>
            				</div>
            			</div>
            			<div className="col-6">
            				<span className="fs18 fw600 text-dark">
            					Data Hewan
            				</span>
            				<div className="p-4" style={background_style2}>
            					{pet_button_row}
            					<div className="py-3 pet_list" style={pet_list_style}>
            						{new_pet_row}
            					</div>
            				</div>
            			</div>
            	    </div>
            	</form>
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

class NewOwnerPetRow extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'show_detail': false,
        }
    }
    
    componentDidMount() {
        if(this.props.pet.name == undefined){
            this.setState({'show_detail': true})
        }
    }
    
    toggleDetail() {
        this.setState({'show_detail': !this.state.show_detail})
    }
    
    render() {
        var color = {color: '#056EAD'}
        var rowStyle = {backgroundColor: '#F5FBFF', marginTop: '-1rem'}
        
        var pet_type_options = []
        if(this.props.pet_type && this.props.pet_type.length != 0){
            this.props.pet_type.forEach((o, index) => {pet_type_options.push(<option key={index.toString()} value={o.name}>{o.type_name}</option>)})
        }
        
        var select_field
        if(this.props.isReadOnly){
            select_field = (
                <input readOnly={this.props.isReadOnly} required id="hewan_jenis" name='hewan_jenis' className="form-control border-0" defaultValue={this.props.pet.hewan_jenis_label || ''} onChange={this.props.handleInputChangePet}/>
            )
        }
        else {
            select_field = (
                <select readOnly={this.props.isReadOnly} required id="hewan_jenis" className="form-control border-0" name='hewan_jenis' onChange={this.props.handleInputChangePet}>
				    <option value="">Pilih Jenis Hewan...</option>
					{pet_type_options}
				</select>
            )
        }
        
        if(this.props.pet.name != undefined){
            var pet_header_style = {background: '#84D1FF', color: '#056EAD', boxShadow: '0px 6px 6px rgba(0, 0, 0, 0.1)', borderRadius: '5px'}
            var cursor_style = {cursor: 'pointer'}
            var chevron
            if(this.state.show_detail){
                chevron = <i className="fa fa-chevron-up mt-auto" style={cursor_style} onClick={() => this.toggleDetail()}></i>
            }
            else {
                chevron = <i className="fa fa-chevron-down mt-auto" style={cursor_style} onClick={() => this.toggleDetail()}></i>
            }
            
            var petHeader = (
                <div style={pet_header_style} className="mb-3">
                    <div className="row mx-0 px-3 py-2">
                        <div className="col">
                            <p className="mb-0 fs12 fw600">{this.props.pet.name}</p>
                            <p className="mb-0 fs20 fw600">{this.props.pet.pet_name}</p>
                        </div>
                        <div className="col-auto d-flex px-0">
                            {chevron}
                        </div>
                    </div>
                </div>
            )
            
            var detailHeader = (
                <div className="row pb-3 justify-content-center border-bottom">
                    <div className="col-auto text-center">
                        <img src="/static/img/main/menu/rekam-medis.png"/>
                        <p className="mb-0 fs10 text-muted">Rekam Medis</p>
                    </div>
                    <div className="col-auto text-center">
                        <div className="row mx-0">
                            <div className="col-auto px-2">
                                <img src="/static/img/main/menu/visit.png"/>
                                <p className="mb-0 fs10 text-muted">Visit</p>
                            </div>
                            <div className="col-auto px-2 d-flex">
                                <span className="my-auto fs30 fw600">
                                    {this.props.pet.visit}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="col-auto">
                        <div className="row mx-0">
                            <div className="col-auto px-2">
                                <img src="/static/img/main/menu/spending.png"/>
                                <p className="mb-0 fs10 text-muted">Spending</p>
                            </div>
                            <div className="col-auto px-2 d-flex">
                                <span className="my-auto fs18 fw600">
                                    {formatter.format(this.props.pet.spending)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
        
        var detail
        if(this.state.show_detail){
            detail = (
                <div className="mb-3 p-4" style={rowStyle}>
                    {detailHeader}
                	<div className="form-row py-2">
                		<div className="col-6">
                			<div className="form-group">
                				<label htmlFor="name_pet" className="fs10 fw600">No Induk Pasien (NIP)</label>
                				<input id="name_pet" name='name_pet' className="form-control border-0" readOnly placeholder="/" defaultValue={this.props.pet.name || ''}/>
                			</div>
                		</div>
                		<div className="col-6">
                			<div className="form-group">
                				<label htmlFor="pet_name" className="fs10 fw600">Nama Hewan</label>
                				<input readOnly={this.props.isReadOnly} required id="pet_name" name='pet_name' className="form-control border-0" defaultValue={this.props.pet.pet_name || ''} onChange={this.props.handleInputChangePet}/>
                			</div>
                		</div>
                	</div>
                	<div className="form-row py-2">
                		<div className="col-6">
                			<div className="form-group">
                				<label htmlFor="hewan_jenis" className="fs10 fw600">Hewan / Jenis</label>
                				{select_field}
                			</div>
                		</div>
                		<div className="col-6">
                			<div className="form-group">
                				<label htmlFor="register_date" className="fs10 fw600">Tanggal Registrasi</label>
                				<input id="register_date" name='register_date' className="form-control border-0" readOnly defaultValue={this.props.register_date}/>
                			</div>
                		</div>
                	</div>
                	<div className="form-group">
                		<label htmlFor="pet_description" className="fs10 fw600">Keterangan</label>
                		<textarea readOnly={this.props.isReadOnly} id="pet_description" className="form-control border-0" rows="3" name='pet_description' onChange={this.props.handleInputChangePet} defaultValue={this.props.pet.pet_description || ''}></textarea>
                	</div>
                </div>
            )
        }
        
        return(
            <div className="pet_row">
            	{petHeader}
            	{detail}
            </div>
        )
    }
}
ReactDOM.render(<NewOwner/>, document.getElementById('pet_owner_new'))