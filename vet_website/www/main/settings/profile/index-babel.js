class Profile extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            'data': {},
            'loaded': false,
            'edit_mode': false,
            'currentUser': {}
        }
        
        this.handleInputChange = this.handleInputChange.bind(this)
        this.editProfile = this.editProfile.bind(this)
    }
    
    componentDidMount() {
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
            method:"vet_website.vet_website.doctype.vetprofile.vetprofile.get_profile",
            args: {},
            callback: function(r){
                if (r.message) {
                    console.log(r.message)
                    gr.setState({'data': r.message.profile, 'loaded': true});
                }
            }
        });
    }
    
    changeEditMode(e) {
        e.preventDefault();
        document.getElementById("profile_form").reset();
        this.setState({edit_mode: !this.state.edit_mode})
    }
    
    handleInputChange(e) {
        var name = e.target.name
        var value = e.target.value
        
        if (name == 'image') {
            var img = e.target.files[0];
            this.newImage(img)
        }
        
        console.log(name, value)
        
        var new_data = this.state.data
        new_data[name] = value
        this.setState({data: new_data})
    }
    
    newImage(file) {
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
    
    editProfile(e) {
        e.preventDefault()
        var gr = this
        
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetprofile.vetprofile.edit_profile",
            args: {data: this.state.data},
            callback: function(r){
                if (r.message) {
                    window.location.reload()
                }
            }
        });
    }
    
    render() {
        var panel_style = {background: '#FFFFFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', padding: '2px 32px', marginBottom: '15px'}
        var rowMinHeight = {minHeight: '60px'}
        var buttonMode = []
        var color = {color: '#056EAD', cursor: 'pointer'}
        var cursor = {cursor: 'pointer'}
        var write = checkPermission('VetProfile', this.state.currentUser, 'write')
        
        if (this.state.loaded) {
            console.log(this.state)
            if(this.state.edit_mode){
                buttonMode.push(
                    <div className="col-auto d-flex my-auto" key="0">
                        <a href="#" className="d-block btn btn-sm fs12 btn-outline-danger text-uppercase fwbold py-2 px-4" onClick={e => this.changeEditMode(e)}>Batalkan</a>
                    </div>
                )
                
                buttonMode.push(
                        <div className="col-auto d-flex my-auto" key="1">
            				<button type="submit" className="d-block btn btn-sm btn-danger fs12 text-uppercase fwbold py-2 px-4">Simpan</button>
            			</div>
                    )
            } else {
                if(write){
                    buttonMode.push(<div key="3" className="col-auto d-flex my-auto"><button className="btn btn-sm btn-danger fs12 fwbold text-uppercase py-2 px-4" onClick={e => this.changeEditMode(e)} type="button">Edit</button></div>)
                }
            }
            
            return <form id="profile_form" onSubmit={(e) => this.editProfile(e)}>
                    	<div style={panel_style}>
                    		<div className="row mx-0 flex-row-reverse" style={rowMinHeight}>
                    			{buttonMode}
                    		</div>
                    	</div>
                    	<ProfileForm data={this.state.data} edit_mode={this.state.edit_mode} handleInputChange={this.handleInputChange}/>
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

class ProfileForm extends React.Component {
    
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
        var inputAddress, inputPhone, inputName, inputFile
        
        var image
        if (data.image != undefined){
            var image_style = {position: 'absolute', top: 0, left: 0, objectFit: 'cover', height: '100%'}
            image = <img src={data.temp_image || data.image} style={image_style}/>
        } else {
            image = <img src={data.temp_image} style={image_style} />
        }
        
        if (this.props.edit_mode) {
            if (data.temp_image) {
                div_image_style = {position: 'relative', width: '100px', background: '#F1F1F1', filter: 'drop-shadow(0px 2px 15px rgba(0, 0, 0, 0.15))', backgroundImage: "url('/static/img/main/menu/product-no-image.png')", backgroundPosition: 'center', backgroundRepeat: 'no-repeat', cursor: 'pointer'}
            } else {
                div_image_style = {position: 'relative', width: '100px', paddingTop: '100%', background: '#F1F1F1', filter: 'drop-shadow(0px 2px 15px rgba(0, 0, 0, 0.15))', backgroundImage: "url('/static/img/main/menu/product-no-image.png')", backgroundPosition: 'center', backgroundRepeat: 'no-repeat', cursor: 'pointer'}
            }
    	    inputName = <input required id="clinic_name" name="clinic_name" className="form-control border-0 lightbg fs20 fwbold text-uppercase mb-4 d-block" defaultValue={ data.clinic_name } style={color} onChange={this.props.handleInputChange} placeholder="Nama Klinik"/>
    	    inputPhone = <input required  id="phone" name='phone' className="form-control border-0 lightbg" defaultValue={ data.phone } onChange={this.props.handleInputChange}/>
            inputAddress = <textarea required id="address" name='address' className="form-control border-0 lightbg" rows="3" defaultValue={ data.address } onChange={this.props.handleInputChange} ></textarea>
            inputFile = <input type="file" className="d-none" accept="image/*" name="image" onChange={this.props.handleInputChange} ref={(ref) => this.$file = ref}/>
        } else {
        	inputPhone =  <span className="d-block fw600">{data.phone}</span>
        	inputAddress = <span className="d-block fw600">{data.address}</span>
        	inputName = <span className="fs20 fwbold text-uppercase mb-4 d-block" style={color}>{data.clinic_name}</span>
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
                            {inputName}
                        </div>
                        <div className="row" style={color}>
                            <div className="col">
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
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

ReactDOM.render(<Profile />, document.getElementById('profile'))