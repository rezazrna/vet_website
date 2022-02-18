class Kandang extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': [],
            'loaded': false,
            'new_kandang': {},
            'show_popup_delete': false,
            'show_popup_activate': false,
            'currentpage': 1,
            'search': false,
            'currentUser': {},
            'datalength': 0,
        }
        this.listSearch = this.listSearch.bind(this);
        this.toggleAddKandang = this.toggleAddKandang.bind(this)
        this.handleInputChange = this.handleInputChange.bind(this)
        this.formSubmit = this.formSubmit.bind(this)
        this.toggleShowPopupDelete = this.toggleShowPopupDelete.bind(this)
        this.toggleShowPopupActivate = this.toggleShowPopupActivate.bind(this)
        this.changeCageState = this.changeCageState.bind(this)
        this.deleteCage = this.deleteCage.bind(this)
        this.paginationClick = this.paginationClick.bind(this);
        this.editKandang = this.editKandang.bind(this)
    }

    componentDidMount() {
        var td = this
        sessionStorage.setItem(window.location.pathname, JSON.stringify({ filters: [], sorts: [] }))

        frappe.call({
            type: "GET",
            method: "vet_website.methods.get_current_user",
            args: {},
            callback: function (r) {
                if (r.message) {
                    td.setState({ 'currentUser': r.message });
                }
            }
        });

        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetkandang.vetkandang.get_kandang_list",
            args: { filters: { 'currentpage': this.state.currentpage } },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message)
                    td.setState({ 'data': r.message.kandang, 'loaded': true, 'datalength': r.message.datalength });
                }
            }
        });
    }

    paginationClick(number) {
        console.log('Halo')
        var po = this
        var filters = JSON.parse(sessionStorage.getItem(window.location.pathname))

        this.setState({
            currentpage: Number(number),
            loaded: false,
        });

        filters['currentpage'] = this.state.currentpage

        // if (number * 30 > this.state.data.length) {
        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetkandang.vetkandang.get_kandang_list",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message)
                    po.setState({ 'data': r.message.kandang, 'loaded': true, 'datalength': r.message.datalength });
                }
            }
        });
        // }
    }

    listSearch(filters) {
        var td = this

        sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))

        this.setState({
            currentpage: 1,
            loaded: false,
        });

        filters['currentpage'] = 1;
        filters['search'] = this.state.search

        console.log(filters)
        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetkandang.vetkandang.get_kandang_list",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message)
                    td.setState({ 'data': r.message.kandang, 'loaded': true, 'datalength': r.message.datalength });
                }
            }
        });
    }

    toggleAddKandang(e) {
        e.preventDefault()
        if (this.state.show_add) {
            this.setState({ show_add: !this.state.show_add, new_kandang: {} })
        } else {
            this.setState({ show_add: true })
        }
    }

    handleInputChange(e) {
        var name = e.target.name
        var value = e.target.value
        var new_kandang = this.state.new_kandang

        new_kandang[name] = value
        this.setState({ new_kandang: new_kandang })
    }

    editKandang(index) {
        var new_kandang = {
            name: this.state.data[index].name,
            cage_name: this.state.data[index].cage_name,
            cage_location: this.state.data[index].cage_location,
            cage_size: this.state.data[index].cage_size,
        }

        this.setState({ new_kandang: new_kandang, show_add: true })
    }

    formSubmit(e) {
        e.preventDefault()
        var td = this
        console.log(this.state.new_kandang)
        frappe.call({
            type: "POST",
            method: "vet_website.vet_website.doctype.vetkandang.vetkandang.submit_kandang",
            args: { data: this.state.new_kandang },
            callback: function (r) {
                if (r.message) {
                    td.setState({ 'data': r.message.kandang, 'loaded': true, 'show_add': false, 'new_kandang': {} });
                }
            }
        });
    }

    toggleShowPopupActivate(value) {
        this.setState({ show_popup_activate: value })
    }

    toggleShowPopupDelete(value) {
        this.setState({ show_popup_delete: value })
    }

    changeCageState(i) {
        var kd = this
        frappe.call({
            type: "POST",
            method: "vet_website.vet_website.doctype.vetkandang.vetkandang.toggle_status",
            args: { name: this.state.data[i].name },
            callback: function (r) {
                if (r.message) {
                    var data = kd.state.data.slice()
                    data[i].status = r.message
                    kd.setState({ data: data, show_popup_activate: false })
                }
            }
        });
    }

    deleteCage(i) {
        var kd = this
        var kandang = [this.state.data[i].name]

        frappe.call({
            type: "POST",
            method: "vet_website.vet_website.doctype.vetkandang.vetkandang.delete_kandang",
            args: { data: kandang },
            callback: function (r) {
                if (r.message) {
                    var data = kd.state.data.slice()
                    data.splice(i, 1)
                    kd.setState({ data: data, show_popup_delete: false })
                }
            }
        });
    }

    render() {
        // var search = this.state.search
        // function filterRow(row) {
        //     function filterField(field) {
        //         return field ? field.toString().includes(search) : false
        //     }
        //     var fields = [row.cage_name, row.status, row.cage_size, row.cage_location, moment(row.masuk_kandang_date).format('DD-MM-YYYY HH:mm'), row.pet_name, row.owner_name]
        //     return ![false, ''].includes(search) ? fields.some(filterField) : true
        // }
        var kd = this
        var row_style2 = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px' }
        var formStyle = { border: '1px solid #397DA6', color: '#397DA6' }
        var sorts = [
            { 'label': 'Tanggal Masuk DESC', 'value': 'masuk_kandang_date desc' },
            { 'label': 'Tanggal Masuk ASC', 'value': 'masuk_kandang_date asc' }
        ]

        var field_list = [
            { 'label': 'Nama Kandang', 'field': 'cage_name', 'type': 'char' },
            //  {'label': 'No Pendaftaran', 'field': 'register_number', 'type': 'char'},
            {
                'label': 'Status', 'field': 'status', 'type': 'select', 'options': [
                    { 'label': 'Available', 'value': 'Available' },
                    { 'label': 'In Use', 'value': 'In Use' },
                ]
            },
            {
                'label': 'Ukuran', 'field': 'cage_size', 'type': 'select', 'options': [
                    { 'label': 'Besar', 'value': 'Besar' },
                    { 'label': 'Kecil', 'value': 'Kecil' },
                ]
            },
            { 'label': 'Nama Pasien', 'field': 'pet_name', 'type': 'char' },
            { 'label': 'Nama Pemilik', 'field': 'owner_name', 'type': 'char' },
            { 'label': 'Lokasi Kandang', 'field': 'cage_location', 'type': 'char' },
            { 'label': 'Tanggal Masuk', 'field': 'masuk_kandang_date', 'type': 'date' }
        ]

        var kandang_row = []
        var add_kandang

        // 		const indexOfLastTodo = this.state.currentpage * 30;
        //         const indexOfFirstTodo = indexOfLastTodo - 30;
        //         var currentItems
        //         ![false,''].includes(search)?
        //         currentItems = this.state.data.filter(filterRow).slice(indexOfFirstTodo, indexOfLastTodo):
        //         currentItems = this.state.data.slice(indexOfFirstTodo, indexOfLastTodo)

        this.state.data.forEach(function (item, index) {
            //  if (currentItems.includes(item)){
            kandang_row.push(<KandangRow write={checkPermission('VetKandan', kd.state.currentUser, 'write')} kandang={item} key={index.toString()} index={index.toString()} show_popup_delete={kd.state.show_popup_delete} show_popup_activate={kd.state.show_popup_activate} editKandang={kd.editKandang} toggleShowPopupDelete={kd.toggleShowPopupDelete} toggleShowPopupActivate={kd.toggleShowPopupActivate} changeCageState={kd.changeCageState} deleteCage={kd.deleteCage} />)
            //  }
        })

        if (this.state.show_add) {
            add_kandang = <AddKandang new_kandang={this.state.new_kandang} toggleAddKandang={this.toggleAddKandang} formSubmit={this.formSubmit} handleInputChange={this.handleInputChange} />
        }

        if (this.state.loaded) {
            return (
                <div>
                    <div className="row mx-0" style={row_style2}>
                        <div className="col-auto">
                            <a href="#" onClick={this.toggleAddKandang} className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2"><i className="fa fa-plus mr-2"></i>Tambah</a>
                        </div>
                        <div className="col">
                            <input value={this.state.search || ''} className="form-control fs12" name="search" placeholder="Search..." style={formStyle} onChange={e => this.setState({ search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' ? this.listSearch(JSON.parse(sessionStorage.getItem(window.location.pathname))) : null} />
                        </div>
                        <div className="col-8">
                            <Filter sorts={sorts} searchAction={this.listSearch} field_list={field_list} filters={JSON.parse(sessionStorage.getItem(window.location.pathname))} />
                        </div>
                    </div>
                    <div className="row p-4">
                        {kandang_row}
                    </div>
                    <Pagination paginationClick={this.paginationClick} datalength={this.state.datalength} currentpage={this.state.currentpage} itemperpage='10' />
                    {add_kandang}
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

class AddKandang extends React.Component {
    handleInputBlur(e) {
        var value = e.target.value

        if (!['Besar', 'Kecil'].includes(value)) {
            e.target.value = ''
        }
    }

    render() {
        var maxwidth = { maxWidth: '483px' }

        return (
            <div className="menu-popup">
                <div className="container" style={maxwidth}>
                    <div className="bg-white p-4">
                        <div className="text-center fs20 fw600 mb-4">Kandang Baru</div>
                        <form onSubmit={this.props.formSubmit}>
                            <div className="form-group mb-4">
                                <label htmlFor="cage_name" className="fw600">Nama Kandang</label>
                                <div className="row mx-0">
                                    <input required id="cage_name" name='cage_name' className="form-control border-0 lightbg" value={this.props.new_kandang.cage_name || ''} onChange={this.props.handleInputChange} placeholder="Masukkan Di Sini" autoComplete="off" />
                                </div>
                            </div>
                            <div className="form-group mb-4">
                                <label htmlFor="cage_location" className="fw600">Lokasi</label>
                                <div className="row mx-0">
                                    <input required id="cage_location" name='cage_location' className="form-control border-0 lightbg" value={this.props.new_kandang.cage_location || ''} onChange={this.props.handleInputChange} placeholder="Masukkan Di Sini" />
                                </div>
                            </div>
                            <div className="form-group mb-4">
                                <label htmlFor="cage_size" className="fw600">Ukuran</label>
                                <div className="row mx-0">
                                    <input required id="cage_size" name='cage_size' className="form-control border-0 lightbg" value={this.props.new_kandang.cage_size || ''} onChange={this.props.handleInputChange} placeholder="Masukkan Di Sini" list="size_list" autoComplete="off" onBlur={(e) => this.handleInputBlur(e)} />
                                    <datalist id="size_list">
                                        <option value="Besar" />
                                        <option value="Kecil" />
                                    </datalist>
                                </div>
                            </div>
                            <div className="row justify-content-center">
                                <div className="col-auto d-flex mt-4">
                                    <button type="submit" className="d-block btn btn-sm btn-danger fs12 text-uppercase fwbold py-2 px-4">Lanjut</button>
                                </div>
                                <div className="col-auto d-flex mt-4">
                                    <a href="#" className="d-block btn btn-sm fs12 btn-outline-danger text-uppercase fwbold py-2 px-4" onClick={this.props.toggleAddKandang}>Batalkan</a>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
                <div className="menu-popup-close" onClick={this.props.toggleAddKandang}></div>
            </div>
        )
    }
}

class KandangRow extends React.Component {
    render() {
        var style, detail, boxStyle, available, available_style, delete_button, inactive_button, action_buttons, popup
        var kandang = this.props.kandang
        var detail_style = { background: '#F5FBFF', color: '#056EAD', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', borderRadius: '10px', padding: '0.5rem 0.5rem 0.5rem 3rem', margin: '0 0 0 -2rem' }
        var delete_style = { background: '#FF1010', color: '#FFF', border: '1px solid #FF1010', cursor: 'pointer' }
        var inactive_style = { background: '#FFF', color: '#FF1010', border: '1px solid #FF1010', cursor: 'pointer' }
        var edit_style = { background: '#FFF', color: '#056ead', border: '1px solid #056ead', cursor: 'pointer' }

        if ((this.props.index % 2) === 0) {
            style = { padding: '0px 8px 0px 25px', marginBottom: '30px' }
        } else {
            style = { padding: '0px 25px 0px 8px', marginBottom: '30px' }
        }

        if (kandang.status == 'Active') {
            boxStyle = { background: '#FFF', padding: '5px', color: '#056EAD', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', height: '100%', borderRadius: '10px', zIndex: '1' }

            detail = <div className="col-5 text-center d-flex" style={detail_style}>
                <img className="m-auto" src="/static/img/main/menu/active_kandang.png"></img>
            </div>

            if (kandang.register_number) {
                available_style = { background: '#FF1010', color: '#FFF' }
                available = <div className="col-5 px-0 mb-3" style={available_style}>
                    <p className="m-0 text-center text-truncate">In Use</p>
                </div>
            } else {
                available_style = { background: '#027823', color: '#FFF' }
                available = <div className="col-5 px-0 mb-3" style={available_style}>
                    <p className="m-0 text-center text-truncate">Available</p>
                </div>
            }
        } else {
            boxStyle = { background: '#E1E1E1', padding: '5px', color: '#056EAD', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', height: '140px', borderRadius: '10px', zIndex: '1' }
            detail = <div className="col-5 text-center d-flex" style={detail_style}>
                <img className="m-auto" src="/static/img/main/menu/inactive_kandang.png"></img>
            </div>

        }

        if (kandang.register_number) {
            detail = <div className="col-5" style={detail_style}>
                <div className="row">
                    <div className="col-12">
                        {/*<p className="fw600">Sehat</p>*/}
                    </div>
                    <div className="col-12">
                        <p className="text-right">{moment(kandang.masuk_kandang_date).format('DD-MM-YYYY HH:mm')}</p>
                    </div>
                </div>
                <div className="row justify-content-center">
                    <div className="col-auto">
                        <p><img className="pr-2" src="/static/img/main/menu/pet_kandang.png"></img>{kandang.pet_name}</p>
                        <p><img className="pr-2" src="/static/img/main/menu/owner_kandang.png"></img>{kandang.owner_name}</p>
                    </div>
                </div>
            </div>
        }
        else {
            delete_button = <div className="col-auto mb-3 px-1">
                <i title="Delete" className="fa fa-trash p-1 rounded" style={delete_style} onClick={() => this.props.toggleShowPopupDelete(this.props.index)}></i>
            </div>
            if (this.props.show_popup_delete === this.props.index) {
                var title = 'Apa anda yakin ingin menghapus ' + kandang.cage_name + ' ?'
                popup = <Popup title={title} cancelAction={() => this.props.toggleShowPopupDelete(false)} confirmAction={() => this.props.deleteCage(this.props.index)} />
            }
            if (kandang.status == 'Active') {
                inactive_style.width = '24px'
                inactive_button = <div className="col-auto mb-3 px-1">
                    <i title="Deactivate" className="fa fa-ban p-1 rounded text-center" style={inactive_style} onClick={() => this.props.toggleShowPopupActivate(this.props.index)}></i>
                </div>
                if (this.props.show_popup_activate === this.props.index) {
                    var title = 'Apa anda yakin ingin menonaktikan ' + kandang.cage_name + ' ?'
                    popup = <Popup title={title} cancelAction={() => this.props.toggleShowPopupActivate(false)} confirmAction={() => this.props.changeCageState(this.props.index)} />
                }
            }
            else {
                inactive_style.color = '#027823'
                inactive_style.border = '1px solid #027823'
                inactive_button = <div className="col-auto mb-3 px-1">
                    <i title="Activate" className="fa fa-check p-1 rounded" style={inactive_style} onClick={() => this.props.toggleShowPopupActivate(this.props.index)}></i>
                </div>
                if (this.props.show_popup_activate === this.props.index) {
                    var title = 'Apa anda yakin ingin mengaktikan ' + kandang.cage_name + ' ?'
                    popup = <Popup title={title} cancelAction={() => this.props.toggleShowPopupActivate(false)} confirmAction={() => this.props.changeCageState(this.props.index)} />
                }
            }

            action_buttons = (
                <div className="col-auto px-0 ml-auto">
                    <div className="row mx-0 justify-content-end">
                        {this.props.write ? <div className="col-auto mb-3 px-1"><i title="Edit" className="fa fa-pencil p-1 rounded" style={edit_style} onClick={() => this.props.editKandang(this.props.index)}></i></div> : false}
                        {this.props.write ? inactive_button : false}
                        {delete_button}
                    </div>
                </div>
            )
        }

        return (
            <div className="col-6" style={style}>
                <div className="row h-100">
                    <div className="col-6 mx-0 fs14 fw600" style={boxStyle}>
                        <div className="row mx-0">
                            {available}
                            {action_buttons}
                        </div>
                        <p className="text-center fs18 fw600">{kandang.cage_name}</p>
                        <div className="row justify-content-center">
                            <div className="col-auto">
                                <p><img className="pr-2" src="/static/img/main/menu/tipe_kandang.png"></img> {kandang.cage_location}</p>
                            </div>
                            <div className="col-auto">
                                <p><img className="pr-2" src="/static/img/main/menu/ukuran_kandang.png"></img>{kandang.cage_size}</p>
                            </div>
                        </div>
                    </div>
                    {detail}
                </div>
                {popup}
            </div>
        )
    }
}

class Popup extends React.Component {
    render() {
        var container_style = { borderRadius: '10px', maxWidth: '508px' }
        var buttonStyle = { background: '#076FAD', color: '#FFF' }

        return (
            <div className='menu-popup' onClick={this.props.cancelAction}>
                <div className="container" style={container_style} onClick={e => e.stopPropagation()}>
                    <section className="px-5 py-4 bg-white rounded-lg">
                        <p className="fs24 text-center mb-4">{this.props.title}</p>
                        <div className="row justify-content-center">
                            <button type="button" className="btn py-1 px-2 px-lg-3 mr-5" style={buttonStyle} onClick={this.props.confirmAction}><p className="fs18 fs18md mb-0">Ya</p></button>
                            <button type="button" className="btn btn-danger py-1 px-2 px-lg-3" onClick={this.props.cancelAction}><p className="fs18 fs18md mb-0">Tidak</p></button>
                        </div>
                    </section>
                </div>
                <div className="menu-popup-close" />
            </div>
        )
    }
}


ReactDOM.render(<Kandang />, document.getElementById('kandang_list'))