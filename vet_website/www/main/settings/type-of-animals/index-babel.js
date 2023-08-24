class TypeOfAnimals extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            new_type: {},
            data: [],
            loaded: false,
            currentUser: {}
        }
        this.petTypeSearch = this.petTypeSearch.bind(this)
        this.inputChange = this.inputChange.bind(this)
        this.formSubmit = this.formSubmit.bind(this)
        this.editPetType = this.editPetType.bind(this)
        this.deletePetType = this.deletePetType.bind(this)
    }
    
    componentDidMount(){
        var th = this
        frappe.call({
            type: "GET",
            method:"vet_website.methods.get_current_user",
            args: {},
            callback: function(r){
                if (r.message) {
                    th.setState({'currentUser': r.message});
                }
            }
        });
        this.petTypeSearch({})
    }
    
    petTypeSearch(filters){
        var th = this
        frappe.call({
            type: 'GET',
            method: 'vet_website.vet_website.doctype.vetpettype.vetpettype.get_all_pet_type',
            args: {filters: filters},
            callback: function(r){
                if(r.message){
                    console.log(r.message)
                    th.setState({data: r.message, loaded: true})
                }
            }
        })
    }
    
    editPetType(name){
        var new_type = Object.assign({}, this.state.new_type)
        var pet_type = this.state.data.find(p => p.name == name)
        var items = pet_type.type_name.split('/')
        new_type.name = pet_type.name
        new_type.type = items[0]
        new_type.race = items[1]||''
        this.setState({new_type: new_type})
    }
    
    deletePetType(name){
        var th = this
        frappe.call({
            type: 'POST',
            method: 'vet_website.vet_website.doctype.vetpettype.vetpettype.delete_pet_type',
            args: {name: name},
            callback: function(r){
                if(r.message){
                    th.setState({data: r.message})
                }
            }
        })
    }
    
    inputChange(e){
        var name = e.target.name
        var value = e.target.value
        var new_type = Object.assign({}, this.state.new_type)
        new_type[name] = value
        this.setState({new_type: new_type})
    }
    
    formSubmit(e){
        e.preventDefault()
        var th = this
        var new_type = this.state.new_type
        var type_name
        new_type.race?type_name=[new_type.type, new_type.race].join('/'):type_name=new_type.type
        if(new_type.name){
            frappe.call({
                type: 'POST',
                method: 'vet_website.vet_website.doctype.vetpettype.vetpettype.edit_pet_type',
                args: {name: new_type.name, type_name: type_name},
                callback: function(r){
                    if(r.message){
                        th.setState({data: r.message, new_type: {}})
                    }
                }
            })
        } else {
            frappe.call({
                type: 'POST',
                method: 'vet_website.vet_website.doctype.vetpettype.vetpettype.new_pet_type',
                args: {type_name: type_name},
                callback: function(r){
                    if(r.message){
                        th.setState({data: r.message, new_type: {}})
                    }
                }
            })
        }
    }
    
    render(){
        var sorts = [
    					{'label': 'Jenis Hewan DESC', 'value': 'type desc'},
    					{'label': 'Jenis Hewan ASC', 'value': 'type asc'},
    					{'label': 'Ras Hewan DESC', 'value': 'race desc'},
    					{'label': 'Ras Hewan ASC', 'value': 'race asc'},
					]
					
		var field_list = [
		                {'label': 'Ras Hewan', 'field': 'race', 'type': 'char'},
		            ]
		            
        var row_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px'}
        var write = checkPermission('VetPetType', this.state.currentUser, 'write')
        return(
            <div>
                <div className="row mx-0" style={row_style}>
                    <div className="col-4 my-auto"/>
                    <div className="col-8">
                        <Filter sorts={sorts} searchAction={this.petTypeSearch} field_list={field_list}/>
                    </div>
                </div>
                <TypeOfAnimalsList write={write} new_type={this.state.new_type} data={this.state.data} inputChange={this.inputChange} formSubmit={this.formSubmit} deletePetType={this.deletePetType} editPetType={this.editPetType}/>
            </div>
        )
    }
}

function TypeOfAnimalsList(props){
    var panel_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px'}
    var rows = []
    
    props.data.forEach(d => rows.push(<TypeOfAnimalsListRow key={d.type_name} write={props.write} item={d} deletePetType={props.deletePetType} editPetType={props.editPetType}/>))
    
    return(
        <div>
            <p className="fs18 fw600 mb-2">Type Of Animals</p>
            <div style={panel_style}>
                <form className="row mb-3" onSubmit={e => props.formSubmit(e)}>
                    <div className="col-4">
                        <label htmlFor="type" className="fs14 fw600">Jenis Hewan</label>
                        <input className="form-control fs14" id="type" name="type" required value={props.new_type.type||''} onChange={e => props.inputChange(e)}/>
                    </div>
                    <div className="col-6">
                        <label htmlFor="race" className="fs14 fw600">Ras Hewan</label>
                        <input className="form-control fs14" id="race" name="race" value={props.new_type.race||''} onChange={e => props.inputChange(e)}/>
                    </div>
                    <div className="col-2 d-flex">
                        <button type="submit" className="btn btn-block btn-danger fs12 fwbold mt-auto">{props.new_type.name?'Simpan':(<span><i className="fa fa-plus mr-2"/>Tambah</span>)}</button>
                    </div>
                </form>
                {rows}
            </div>
        </div>
    )
}

function TypeOfAnimalsListRow(props){
    var row_style = {background: '#84D1FF', borderRadius: 4, color: '#056EAD'}
    var cursor = {cursor: 'pointer'}
    var items = props.item.type_name.split('/')
    return(
        <div style={row_style} className="fs16 fw600 px-3 py-2 mb-2">
            <div className="row">
                <div className="col-4">
                    {items[0]}
                </div>
                <div className="col-6">
                    {items[1]||''}
                </div>
                <div className="col-2 text-right fs18">
                    {props.write?<i className="fa fa-edit mx-2" style={cursor} onClick={() => props.editPetType(props.item.name)}/>:false}
                    <i className="fa fa-trash mx-2" style={cursor} onClick={() => props.deletePetType(props.item.name)}/>
                </div>
            </div>
        </div>
    )
}

var toa = document.getElementById('type_of_animals')
toa?ReactDOM.render(<TypeOfAnimals/>,toa):false