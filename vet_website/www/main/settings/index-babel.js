class Settings extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            data: {},
            loaded: false,
            edit_mode: false,
        }
    }
    
    componentDidMount(){
        var th = this
        frappe.call({
            type: 'GET',
            method: 'vet_website.methods.get_settings',
            args: {},
            callback: function(r){
                if(r.message){
                    console.log(r.message)
                    th.setState({data: r.message.data, loaded: true, users: r.message.users})
                }
            }
        })
    }
    
    toggleEdit(e){
        e.preventDefault()
        this.setState({edit_mode: !this.state.edit_mode})
    }
    
    submitForm(e){
        var th = this
        e.preventDefault()
        frappe.call({
            type: 'POST',
            method: 'vet_website.methods.set_settings',
            args: {data: this.state.data},
            callback: function(r){
                if(r.message.error == undefined){
                    th.setState({edit_mode: false})
                }
            }
        })
    }
    
    handleInputChange(e){
        var name = e.target.name
        var value = e.target.value
        var new_data = Object.assign({}, this.state.data)
        
        new_data[name] = value
        
        this.setState({data: new_data})
    }
    
    render(){
        var th = this
        var data = this.state.data
        var bgstyle = {background: '#FFFFFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', padding: '2px 32px', marginBottom: '15px'}
        var cursor = {cursor: 'pointer'}
        var rowStyle = {minHeight: '64px'}
        var edit_button = <button type="button" className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={e => this.toggleEdit(e)}>Edit</button>
		var naming_format_class = 'd-none small'
		
		var fields = []
		Object.keys(this.state.data).forEach(k => {
		    var field = <span className="d-block fs16">{data[k]}</span>
		    
		    if(th.state.edit_mode){
		        field = <input value={data[k]||''} onChange={e => this.handleInputChange(e)} required autoComplete="off" type="text" id={k} name={k} className="form-control fs14"/>
		    }
		    
		    fields.push(
                <div className="col-4" key={k}>
    	            <div className="form-group">
    	                <label htmlFor={k} className="fw600 text-capitalize">{k.replace(/_/g, ' ')}</label>
    	                {field}
    	            </div>
    	        </div>
		    )
		})
        
        if(this.state.edit_mode){
		    edit_button = <button type="submit" className="btn btn-danger text-uppercase fs12 fwbold mx-2">Simpan</button>
		    var naming_format_class = 'small'
		}
		
        if (this.state.loaded) {
            return <form onSubmit={e => this.submitForm(e)}>
                        {/*<div style={bgstyle}>
                    		<div className="row mx-0 flex-row-reverse" style={rowStyle}>
                    		    <div className="col-auto my-auto">
                    		        {edit_button}
                    		    </div>
                    		</div>
                    	</div>*/}
                    	<p className="fs18 fw600 text-dark mb-2">
                        	AutoName
                        </p>
                    	<div style={bgstyle} className="p-3 mb-4">
                    	    <div className="text-right mb-2">
                    	        {edit_button}
                    	    </div>
                    	    <div className="row">
                    	        <div className="col-9">
                    	            <div className="row">
                    	                {fields}
                    	            </div>
                    	        </div>
                    	        <div className="col-3">
                    	            <div className={naming_format_class}>
                    	                <span>Naming Options:</span>
                    	                <ol>
                    	                    <li><b>field:[fieldname]</b> - Name by field value</li>
                    	                    <li><b>[series]</b> - Series by prefix (separated by a dot); example PRE.#####, result PRE00001, PRE00002, PRE00003, etc.</li>
                    	                    <li><b>format:EXAMPLE-{"{fieldname1}"}-{"{fieldname2}"}-{"{#####}"}</b> - Replace all braced words (fieldnames, date words (DD, MM, YY), series) with their value. Outside braces, any characters can be used.</li>
                    	                </ol>
                    	            </div>
                    	        </div>
                    	    </div>
                        </div>
                        <SettingUsers users={this.state.users}/>
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

class SettingUsers extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'users': this.props.users || [],
            'new_user': {},
            'edit': false,
            'indexEdit': '',
            'show_delete': false,
            'roles': [],
        }
        
        this.removeUser = this.removeUser.bind(this)
        this.addUser = this.addUser.bind(this)
        this.toggleEdit = this.toggleEdit.bind(this)
        this.simpanEdit = this.simpanEdit.bind(this)
        this.showPopupDelete = this.showPopupDelete.bind(this)
    }
    
    componentDidMount(){
        var th = this
        frappe.call({
            type: 'GET',
            method: 'vet_website.methods.get_roles',
            args: {},
            callback: function(r){
                if(r.message){
                    th.setState({roles: r.message.roles})
                }
            }
        })
    }
    
    handleInputChange(e) {
        var name = e.target.name
        var value = e.target.value
        var new_user = this.state.new_user
        new_user[name] = value
        this.setState({new_user: new_user})
    }
    
    removeUser(index) {
        var th = this
        var users = this.state.users
        
        frappe.call({
            type: "POST",
            method:"vet_website.methods.remove_user",
            args: {name: users[index]['name']},
            callback: function(r){
                if (r.message) {
                    users.splice(index, 1)
                    th.setState({users: users, show_delete: false})
                }
            }
        });
    }
    
    toggleEdit(index) {
        var user = this.state.users[index]
        var role
        
        if (user.roles.filter(i => i.role == 'Staff').length != 0) {
            role = 'Staff'
        } else if (user.roles.filter(i => i.role == 'System Manager').length != 0) {
            role = 'Master'
        } else if (user.roles.length != 0){
            var parents = user.roles.filter(r => r.parent)
            role = parents.length > 0 ? parents[0].parent : 'Guest'
        }
        
        var new_user = {
            'full_name': user.full_name,
            'email': user.email,
            'role': role,
            'name': user.name
        }
        
        this.setState({new_user: new_user, edit: true, indexEdit: index})
    }
    
    showPopupDelete(index=false){
        console.log('masukk')
        this.setState({show_delete: index})
    }
    
    addUser(e) {
        e.preventDefault()
        var th = this
        var users = this.state.users
        
        console.log(this.state.new_user)
        frappe.call({
            type: "POST",
            method:"vet_website.methods.add_user",
            args: {data: this.state.new_user},
            callback: function(r){
                if (r.message) {
                    console.log(r.message)
                    users.unshift(r.message)
                    th.setState({users: users, new_user: {}})
                }
            }
        });
    }
    
    simpanEdit(e) {
        e.preventDefault()
        var th = this
        var users = this.state.users
        
        console.log(this.state.new_user)
        frappe.call({
            type: "POST",
            method:"vet_website.methods.edit_user",
            args: {data: this.state.new_user},
            callback: function(r){
                if (r.message) {
                    console.log(r.message)
                    users[th.state.indexEdit] = r.message
                    th.setState({users: users, new_user: {}, edit: false, indexEdit: ''})
                }
            }
        });
    }
    
    render() {
        var bgstyle = {background: '#FFFFFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', padding: '2px 32px', marginBottom: '15px'}
        var new_user = this.state.new_user
        var rows = []
        var bgColor = {backgroundColor: '#84D1FF', color: '#056EAD'}
        var btn
        var th = this
        var cursor = {cursor: 'pointer'}
        
        if (this.state.edit) {
            btn = <button type="button" className="btn btn-danger text-uppercase fs12 fwbold mx-2" onClick={this.simpanEdit}>Simpan</button>
        } else {
            btn = <button type="button" className="btn btn-danger text-uppercase fs12 fwbold mx-2" onClick={this.addUser}><i className="fa fa-plus mr-2"/>Tambah</button>
        }
        
        console.log(this.state)
        
        this.state.users.forEach(function(item, index) {
            var role
            if (item.roles.filter(i => i.role == 'Staff').length != 0) {
                role = <span className="fs16"><img className="mx-2" src="/static/img/main/menu/master.png" />Staff</span>
            } else if (item.roles.filter(i => i.role == 'System Manager').length != 0) {
                role = <span className="fs16"><img className="mx-2" src="/static/img/main/menu/master.png" />Master</span>
            } else {
                var parents = item.roles.filter(r => r.parent)
                role = <span className="fs16"><img className="mx-2" src="/static/img/main/menu/master.png" />{parents.length > 0 ? parents[0].role : 'Guest'}</span>
            }
            
            rows.push(
                <div className="row mx-0 py-2 mb-2 rounded justify-content-around" style={bgColor} key={index.toString()}>
                    <div className="col-7 col-xl-5">
                        <p className="fs16 mb-1">{item.full_name}</p>
                        <p className="fs14 mb-1">{item.email}</p>
                    </div>
                    <div className="col-5 col-xl-4 my-auto text-right text-xl-center">
                        {role}
                    </div>
                    <div className="col-xl-3 my-auto">
                        <div className="row justify-content-between mx-0">
                            <div className="col-auto col-xl-6 px-1 my-auto text-center">
                                <i className="fa fa-pencil-square-o fa-lg" onClick={() => th.toggleEdit(index)} style={cursor}/>
                            </div>
                            <div className="col-auto col-xl-6 px-1 my-auto text-center">
                                <i className="fa fa-trash fa-lg" onClick={() => th.showPopupDelete(index)} style={cursor}/>
                            </div>
                        </div>
                    </div>
                </div>
                )
        })
        
        var delete_popup
        if(this.state.show_delete !== false){
            var container_style = {borderRadius: '10px', maxWidth: '508px'}
            var buttonStyle = {background: '#076FAD', color: '#FFF'}
            
            delete_popup = <div className='menu-popup' onClick={() => th.showPopupDelete()}>
                                <div className="container" style={container_style} onClick={e => e.stopPropagation()}>
                                	<section className="px-5 py-4 bg-white rounded-lg">
                                    	<p className="fs24 text-center mb-4">{"Apakah anda yakin ingin menghapus "+this.state.users[this.state.show_delete].full_name+"?"}</p>
                                    	<div className="row justify-content-center">
                                            <button type="button" className="btn py-1 px-2 px-lg-3 mr-5" style={buttonStyle} onClick={() => this.removeUser(this.state.show_delete)}><p className="fs18 fs18md mb-0">Ya</p></button>
                                            <button type="button" className="btn btn-danger py-1 px-2 px-lg-3" onClick={() => th.showPopupDelete()}><p className="fs18 fs18md mb-0">Tidak</p></button>
                                        </div>
                                	</section>
                                </div>
                                <div className="menu-popup-close"/>
                            </div>
        }
        
        var role_options = []
        this.state.roles.filter(d => !d.disabled).forEach(d => {
            role_options.push(<option key={d.name} value={d.name}>{d.role_name}</option>)
        })
        
        return <div>
                   <p className="fs18 fw600 text-dark mb-2">Users</p>
                	<div style={bgstyle} className="p-3 mb-4">
                	    <div className="row">
                	        <div className="col">
                	            <div className="form-group">
                	               <label htmlFor="full_name" className="fw600 mb-0">Nama</label>
                	               <input value={new_user.full_name || ''} onChange={e => this.handleInputChange(e)} autoComplete="off" type="text" id='full_name' name='full_name' className="form-control fs14"/>
                	            </div>
                	        </div>
                	        <div className="col">
                	            <div className="form-group">
                	               <label htmlFor="email" className="fw600 mb-0">Email</label>
                	               <input value={new_user.email || ''} onChange={e => this.handleInputChange(e)} autoComplete="off" type="email" id='email' name='email' className="form-control fs14"/>
                	            </div>
                	        </div>
                	        <div className="col">
                	            <div className="form-group">
                	               <label htmlFor="role" className="fw600 mb-0">Role</label>
                	               <select name='role' id="role" className="form-control fs14" onChange={e => this.handleInputChange(e)} value={new_user.role || ''}>
                                        <option className="d-none"/>
                                        <option value="Master">Master</option>
                                        {role_options}
                                    </select>
                	            </div>
                	        </div>
                	        <div className="col">
                	            <div className="form-group">
                	               <label htmlFor="new_password" className="fw600 mb-0">{this.state.edit ? 'New Password' : 'Password'}</label>
                	               <input value={new_user.new_password || ''} onChange={e => this.handleInputChange(e)} autoComplete="off" type="password" id='new_password' name='new_password' className="form-control fs14"/>
                	            </div>
                	        </div>
                	        <div className="col-auto my-auto text-right">
                	            {btn}
                	        </div>
                	    </div>
                	    {rows}
                	    {delete_popup}
                    </div> 
                </div>
    }
}

ReactDOM.render(<Settings/>, document.getElementById('settings'))