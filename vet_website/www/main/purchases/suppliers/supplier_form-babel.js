var id = getUrlParameter('n')

class Suppliers extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            'data': {},
            'loaded': false,
            'edit_mode': false,
            'currentUser': {}
        }
        
        this.handleInputChange = this.handleInputChange.bind(this)
        this.editSupplier = this.editSupplier.bind(this)
        this.navigationAction = this.navigationAction.bind(this)
    }
    
    componentDidMount() {
        var lastfilter = JSON.parse(sessionStorage.getItem('/main/purchases/suppliers'))
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
            method:"vet_website.vet_website.doctype.vetsupplier.vetsupplier.get_name_list",
            args: {filters: lastfilter},
            callback: function(r){
                if (r.message) {
                    gr.setState({'namelist': r.message});
                }
            }
        })
        if(id != undefined){
            frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetsupplier.vetsupplier.get_supplier",
                args: {name: id},
                callback: function(r){
                    if (r.message) {
                        console.log(r.message)
                        gr.setState({'data': r.message.supplier, 'loaded': true});
                    }
                }
            });
        }
        else{
            this.setState({loaded: true})
        }
    }
    
    changeEditMode(e) {
        e.preventDefault();
        document.getElementById("supplier_form").reset();
        this.setState({edit_mode: !this.state.edit_mode})
    }
    
    navigationAction(name){
        window.location.href="/main/purchases/suppliers/edit?n="+name
    }
    
    handleInputChange(e) {
        var name = e.target.name
        var value = e.target.value
        
        if (name == 'image') {
            var img = e.target.files[0];
            this.newPetImage(img)
        }
        
        console.log(name, value)
        
        var new_data = this.state.data
        new_data[name] = value
        this.setState({data: new_data})
    }
    
    newPetImage(file) {
        var vr = this
        var new_data = Object.assign({}, this.state.data)
        var reader = new FileReader();
        reader.onload = function(e) {
            new_data.filename = file.name,
            new_data.dataurl = reader.result
            new_data.temp_image =  URL.createObjectURL(file)
            vr.setState({data: new_data})
        }
        reader.readAsDataURL(file);
    }
    
    editSupplier(e) {
        e.preventDefault()
        var gr = this
        
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetsupplier.vetsupplier.edit_supplier",
            args: {data: this.state.data},
            callback: function(r){
                if (r.message) {
                    window.location.search = "?n="+r.message.supplier.name;
                }
            }
        });
    }
    
    render() {
        var panel_style = {background: '#FFFFFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', padding: '2px 32px', marginBottom: '15px'}
        var rowMinHeight = {minHeight: '60px'}
        var buttonMode = []
        var color = {color: '#056EAD', cursor: 'pointer'}
        var backButton = <a href="/main/purchases/suppliers" className="fs16 fw600 mr-auto my-auto" style={color}><i className="fa fa-chevron-left mr-1" style={color}></i>Back</a>
        var cursor = {cursor: 'pointer'}
        var write = checkPermission('VetSupplier', this.state.currentUser, 'write')
        
        if (this.state.loaded) {
            console.log(this.state)
            if(this.state.edit_mode || id == undefined){
                if(id != undefined){
                    buttonMode.push(
                        <div className="col-auto d-flex my-auto" key="0">
            				<a href="#" className="d-block btn btn-sm fs12 btn-outline-danger text-uppercase fwbold py-2 px-4" onClick={e => this.changeEditMode(e)}>Batalkan</a>
            			</div>
                    )
                }
                else {
                    buttonMode.push(
                        <div className="col-auto d-flex my-auto" key="0">
            				<a href="#" className="d-block btn btn-sm fs12 btn-outline-danger text-uppercase fwbold py-2 px-4" onClick={() => window.location.href='/main/purchases/suppliers'}>Batalkan</a>
            			</div>
                    )
                }
                
                buttonMode.push(
                        <div className="col-auto d-flex my-auto" key="1">
            				<button type="submit" className="d-block btn btn-sm btn-danger fs12 text-uppercase fwbold py-2 px-4">Simpan</button>
            			</div>
                    )
            }
            else{
                var purchases = (
                    <div className="col-auto mr-auto" style={cursor} key="purchases" onClick={() => window.location.href = "/main/purchases/purchase-order?supplier="+this.state.data.name}>
                        <div className="row mx-0">
                            <div className="col-auto px-0">
                                <img className="d-block mx-auto header-icon mt-2" src="/static/img/main/menu/purchases.png"/>
                                <p className="mb-0 fs12 text-muted text-center">Purchases</p>
                            </div>
                            <div className="col-auto px-2 d-flex my-auto">
                                <span className="my-auto fs26 fw600">
                                    {this.state.data.purchase_count}
                                </span>
                            </div>
                        </div>
                    </div>
                )
                
                if(write){
                    buttonMode.push(<div key="3" className="col-auto d-flex my-auto"><button className="btn btn-sm btn-danger fs12 fwbold text-uppercase py-2 px-4" onClick={e => this.changeEditMode(e)} type="button">Edit</button></div>)
                }
                buttonMode.push(purchases)
            }
            
            buttonMode.push(<div key="999" className="col-auto d-flex mr-auto">{backButton}</div>)
            
            return <form id="supplier_form" onSubmit={(e) => this.editSupplier(e)}>
                    	<div style={panel_style}>
                    		<div className="row mx-0 flex-row-reverse" style={rowMinHeight}>
                    			{buttonMode}
                    		</div>
                    	</div>
                    	<RecordNavigation currentname={this.state.data.name} namelist={this.state.namelist} navigationAction={this.navigationAction} zero_margin={true}/>
                    	<SupplierForm data={this.state.data} edit_mode={this.state.edit_mode} handleInputChange={this.handleInputChange}/>
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

class SupplierForm extends React.Component {
    
    clickFile(){
        if(this.$file != undefined){
            var file = this.$file
            $(file).trigger('click');
        }
    }
    
    render(){
        var data = this.props.data
        var panel_style = {background: '#FFFFFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', padding: '35px 50px', marginBottom: '15px', height: '750px'}
        var div_image_style = {position: 'relative', width: '100px', paddingTop: '100%', background: '#F1F1F1', filter: 'drop-shadow(0px 2px 15px rgba(0, 0, 0, 0.15))', backgroundImage: "url('/static/img/main/menu/product-no-image.png')", backgroundPosition: 'center', backgroundRepeat: 'no-repeat'}
        var color = {color: '#056EAD'}
        var inputDescription, inputAddress, inputPhone, inputEmail, inputSupplierName, inputFile
        
        var image
        if (id != undefined && data.image != undefined){
            var image_style = {position: 'absolute', top: 0, left: 0, objectFit: 'cover', height: '100%'}
            image = <img src={data.temp_image || data.image} style={image_style}/>
        } else if (id == undefined) {
            image = <img src={data.temp_image} style={image_style} />
        }
        
        if (id == undefined || this.props.edit_mode) {
            if (data.temp_image && id == undefined) {
                div_image_style = {position: 'relative', width: '100px', background: '#F1F1F1', filter: 'drop-shadow(0px 2px 15px rgba(0, 0, 0, 0.15))', backgroundImage: "url('/static/img/main/menu/product-no-image.png')", backgroundPosition: 'center', backgroundRepeat: 'no-repeat', cursor: 'pointer'}
            } else {
                div_image_style = {position: 'relative', width: '100px', paddingTop: '100%', background: '#F1F1F1', filter: 'drop-shadow(0px 2px 15px rgba(0, 0, 0, 0.15))', backgroundImage: "url('/static/img/main/menu/product-no-image.png')", backgroundPosition: 'center', backgroundRepeat: 'no-repeat', cursor: 'pointer'}
            }
    	    inputSupplierName = <input required id="supplier_name" name="supplier_name" className="form-control border-0 lightbg fs20 fwbold text-uppercase mb-4 d-block" defaultValue={ data.supplier_name } style={color} onChange={this.props.handleInputChange} placeholder="Nama Supplier"/>
    	    inputPhone = <input required  id="phone" name='phone' className="form-control border-0 lightbg" defaultValue={ data.phone } onChange={this.props.handleInputChange}/>
            inputEmail = <input required id="email" name='email' type="email" className="form-control border-0 lightbg " defaultValue={ data.email } onChange={this.props.handleInputChange} />
            inputAddress = <textarea required id="address" name='address' className="form-control border-0 lightbg" rows="3" defaultValue={ data.address } onChange={this.props.handleInputChange} ></textarea>
            inputFile = <input type="file" className="d-none" accept="image/*" name="image" onChange={this.props.handleInputChange} ref={(ref) => this.$file = ref}/>
            inputDescription = <textarea id="description" name='description' className="form-control border-0 lightbg" defaultValue={ data.description } rows="5" placeholder="Masukan bila ada" onChange={this.props.handleInputChange}></textarea>
        } else {
            inputDescription = <span className="d-block fw600">{data.description}</span>
        	inputPhone =  <span className="d-block fw600">{data.phone}</span>
        	inputEmail = <span className="d-block fw600">{data.email}</span>
        	inputAddress = <span className="d-block fw600">{data.address}</span>
        	inputSupplierName = <span className="fs20 fwbold text-uppercase mb-4 d-block" style={color}>{data.supplier_name}</span>
        }
        
        return(
            <div style={panel_style}>
                <div className="row">
                    <div className="col-auto">
                        <div style={div_image_style} onClick={() => this.clickFile()}>
                            {inputFile}
                            {image}
                        </div>
                    </div>
                    <div className="col">
                        <div className="row mb-4 pl-3">
                            {inputSupplierName}
                        </div>
                        <div className="row" style={color}>
                            <div className="col-6">
                                <div className="form-row mx-0 mb-4">
                                    <label htmlFor="address" className="fw600 col-3">Address</label>
                                    <div className="col-8">
                                        {inputAddress}
                                    </div>
                                </div>
                                <div className="form-row mx-0 mb-2">
                                    <label htmlFor="phone" className="fw600 col-3">Phone</label>
                                    <div className="col-8">
                                       {inputPhone}
                                    </div>
                                </div>
                                <div className="form-row mx-0 mb-2">
                                    <label htmlFor="email" className="fw600 col-3">Email</label>
                                    <div className="col-8">
                                        {inputEmail}
                                    </div>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="form-row mx-0">
                                    <label htmlFor="description" className="fw600 col-3">Catatan</label>
                                    <div className="col-9">
                                        {inputDescription}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

ReactDOM.render(<Suppliers />, document.getElementById('suppliers_form'))