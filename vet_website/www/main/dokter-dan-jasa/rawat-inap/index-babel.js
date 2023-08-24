// var tzOffset = new Date().getTimezoneOffset()
var tzOffset = 0
var register_number = getUrlParameter('register_number')

class RawatInap extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': [],
            'loaded': false,
            'check_all': false,
            'show_delete': false,
            'show_add': false,
            'currentpage': 1,
            'search': false,
            'currentUser': {},
            'datalength': 0,
        }

        this.rawatInapSearch = this.rawatInapSearch.bind(this);
        this.checkRow = this.checkRow.bind(this);
        this.deleteRow = this.deleteRow.bind(this);
        this.paginationClick = this.paginationClick.bind(this);
    }

    componentDidMount() {
        var po = this
        var new_filters = { filters: [], sorts: [] }

        if (sessionStorage.getItem(window.location.pathname) != null && (document.referrer.includes('/main/dokter-dan-jasa/rawat-inap/detail') || document.referrer.includes('/main/dokter-dan-jasa/rawat-inap/edit'))) {
            new_filters = JSON.parse(sessionStorage.getItem(window.location.pathname))
        }

        if (register_number) {
            new_filters.filters.push(['register_number', '=', register_number])
        }

        if (new_filters.hasOwnProperty("currentpage")) {
            this.setState({ 'currentpage': new_filters['currentpage'] })
        }

        if (new_filters.hasOwnProperty("search")) {
            this.setState({ 'search': new_filters['search'] })
        }

        sessionStorage.setItem(window.location.pathname, JSON.stringify(new_filters))
        frappe.call({
            type: "GET",
            method: "vet_website.methods.get_current_user",
            args: {},
            callback: function (r) {
                if (r.message) {
                    po.setState({ 'currentUser': r.message });
                }
            }
        });
        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetrawatinap.vetrawatinap.get_rawat_inap_list",
            args: { filters: new_filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'data': r.message.rawat_inap, 'loaded': true, 'datalength': r.message.datalength });
                }
            }
        });
    }

    paginationClick(number) {
        var po = this
        var filters = JSON.parse(sessionStorage.getItem(window.location.pathname))

        this.setState({
            currentpage: Number(number),
            loaded: false,
        });

        filters['currentpage'] = this.state.currentpage
        filters['search'] = this.state.search
        sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))

        // if (number * 30 > this.state.data.length) {
        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetrawatinap.vetrawatinap.get_rawat_inap_list",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'data': r.message.rawat_inap, 'loaded': true, 'datalength': r.message.datalength });
                }
            }
        });
        // }
    }

    rawatInapSearch(filters) {
        var po = this
        var new_filters = Object.assign({}, filters)
        filters.filters ? new_filters.filters = filters.filters.slice() : new_filters.filters = []
        if (register_number) {
            new_filters.filters.push(['register_number', '=', register_number])
        }


        this.setState({
            currentpage: 1,
            loaded: false,
        });

        new_filters['currentpage'] = 1;
        new_filters['search'] = this.state.search
        sessionStorage.setItem(window.location.pathname, JSON.stringify(new_filters))

        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetrawatinap.vetrawatinap.get_rawat_inap_list",
            args: { filters: new_filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'data': r.message.rawat_inap, 'loaded': true, 'datalength': r.message.datalength });
                }
            }
        });
    }

    checkAll() {
        if (this.state.data.length != 0) {
            if (!this.state.check_all) {
                var new_data = this.state.data.slice()
                new_data.forEach((d, index) => {
                    d.checked = true
                })
                this.setState({ data: new_data, check_all: true })
            }
            else {
                var new_data = this.state.data.slice()
                new_data.forEach((d, index) => {
                    d.checked = false
                })
                this.setState({ data: new_data, check_all: false })
            }
            this.getCheckedRow()
        }
    }

    deleteRow(e) {
        e.preventDefault();
        var po = this
        var delete_data = this.state.data.filter((d) => d.checked)
        var delete_data_names = delete_data.map((d) => d.name)
        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetawatinap.vetrawatinap.delete_rawat_inap",
            args: { data: delete_data_names },
            callback: function (r) {
                if (r.message.success) {
                    var new_data = po.state.data.filter((d => !d.checked))
                    po.setState({ data: new_data, check_all: false, show_delete: false });
                }
            }
        });
    }

    checkRow(i) {
        var new_data = this.state.data.slice()
        if (!new_data[i].checked) {
            new_data[i].checked = true
            this.setState({ data: new_data })
        }
        else {
            new_data[i].checked = false
            this.setState({ data: new_data, check_all: false })
        }
        this.getCheckedRow()
    }

    getCheckedRow(e) {
        var checked_row = this.state.data.filter((d) => {
            return d.checked
        })

        if (checked_row.length == 0) {
            this.setState({ show_delete: false })
        }
        else {
            this.setState({ show_delete: true })
        }
    }

    toggleShowAdd() {
        this.setState({ show_add: !this.state.show_add })
    }

    render() {
        var tambah_tindakan = checkPermission('VetRawatInap', this.state.currentUser, 'tambah tindakan')
        var status_options = [
            { label: 'Draft', value: 'Draft' },
            { label: 'On Progress', value: 'On Progress' },
            { label: 'Done', value: 'Done' },
        ]

        var sorts = [
            { 'label': 'Tanggal masuk DESC', 'value': 'creation desc' },
            { 'label': 'Tanggal masuk ASC', 'value': 'creation asc' },
            { 'label': 'ID DESC', 'value': 'name desc' },
            { 'label': 'ID ASC', 'value': 'name asc' },
            { 'label': 'No Pendaftaran DESC', 'value': 'register_number desc' },
            { 'label': 'No Pendaftaran ASC', 'value': 'register_number asc' },
            { 'label': 'Nama Pasien DESC', 'value': 'pet_name desc' },
            { 'label': 'Nama Pasien ASC', 'value': 'pet_name asc' },
            { 'label': 'Nama Pemilik DESC', 'value': 'owner_name desc' },
            { 'label': 'Nama Pemilik ASC', 'value': 'owner_name asc' },
            { 'label': 'Rujukan Dari Dokter DESC', 'value': 'dokter_reference desc' },
            { 'label': 'Rujukan Dari Dokter ASC', 'value': 'dokter_reference asc' },
        ]
        var field_list = [
            { 'label': 'Tanggal Masuk', 'field': 'creation', 'type': 'date' },
            { 'label': 'ID', 'field': 'name', 'type': 'char' },
            { 'label': 'No Pendaftaran', 'field': 'register_number', 'type': 'char' },
            { 'label': 'Nama Pasien', 'field': 'pet_name', 'type': 'char' },
            { 'label': 'Nama Pemilik', 'field': 'owner_name', 'type': 'char' },
            { 'label': 'Rujukan Dari Dokter', 'field': 'dokter_reference', 'type': 'char' },
            { 'label': 'Status', 'field': 'status', 'type': 'select', 'options': status_options },
        ]

        var delete_button
        if (this.state.show_delete) {
            delete_button = <button className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={this.deleteRow}>Hapus</button>
        }
        var addStyle = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px' }
        var formStyle = { border: '1px solid #397DA6', color: '#397DA6' }
        var show_add_popup
        if (this.state.show_add) {
            show_add_popup = <PopupTindakanBaru togglePopupTindakan={() => this.toggleShowAdd()} />
        }
        var add_button = <button type="button" className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={() => this.toggleShowAdd()}><i className="fa fa-plus mr-2"></i>Tambah</button>

        if (this.state.loaded) {
            return (
                <div>
                    <div className="row mx-0" style={addStyle}>
                        <div className="col-auto my-auto">
                            {tambah_tindakan ? add_button : false}
                            {delete_button}
                        </div>
                        <div className="col">
                            <input value={this.state.search || ''} className="form-control fs12" name="search" placeholder="Search..." style={formStyle} onChange={e => this.setState({ search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' ? this.rawatInapSearch(JSON.parse(sessionStorage.getItem(window.location.pathname))) : null} />
                        </div>
                        <div className="col-7">
                            <Filter sorts={sorts} searchAction={this.rawatInapSearch} field_list={field_list} filters={JSON.parse(sessionStorage.getItem(window.location.pathname))} />
                        </div>
                    </div>
                    <RawatInapList rawat_inap={this.state.data} checkRow={this.checkRow} checkAll={() => this.checkAll()} check_all={this.state.check_all} paginationClick={this.paginationClick} currentpage={this.state.currentpage} datalength={this.state.datalength} />
                    {show_add_popup}
                </div>
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


class RawatInapList extends React.Component {
    render() {
        // var search = this.props.search
        // function filterRow(row) {
        //     function filterField(field) {
        //         return field ? field.toString().includes(search) : false
        //     }
        //     var fields = [row.creation, row.name, row.register_number, row.pet_name, row.owner_name, row.dokter_reference, row.status]
        //     return ![false, ''].includes(search) ? fields.some(filterField) : true
        // }
        var rawat_inap_rows = []
        var panel_style = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px' }
        var col_style = { 'width': '40px' }
        var rawat_inap = this.props.rawat_inap

        if (rawat_inap.length != 0) {
            // var number = 1
            // var pol = this
            // const indexOfLastTodo = this.props.currentpage * 30;
            // const indexOfFirstTodo = indexOfLastTodo - 30;
            // var currentItems
            // ![false,''].includes(search)?
            // currentItems = rawat_inap.filter(filterRow).slice(indexOfFirstTodo, indexOfLastTodo):
            // currentItems = rawat_inap.slice(indexOfFirstTodo, indexOfLastTodo)
            rawat_inap.forEach(function (item, index) {
                // if (currentItems.includes(item)){
                rawat_inap_rows.push(
                    <RawatInapListRow key={item.name} item={item} checkRow={() => pol.props.checkRow(index)} />
                )
                // }
                // number++
            })

            return (
                <div style={panel_style}>
                    <div className="row mx-0">
                        <div className="col-auto pl-2 pr-3">
                            <input type="checkbox" className="d-block my-3" checked={this.props.check_all} onChange={this.props.checkAll} />
                        </div>
                        <div className="col row-header">
                            <div className="row mx-0 fs12 fw600">
                                <div className="col-2 d-flex">
                                    <span className="my-auto">Tgl Masuk</span>
                                </div>
                                <div className="col-1 d-flex">
                                    <span className="my-auto">ID</span>
                                </div>
                                <div className="col-1 d-flex">
                                    <span className="my-auto">No Pendaftaran</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">Nama Pasien</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">Nama Pemilik</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">Rujukan Dari Dokter</span>
                                </div>
                                <div className="col-1 d-flex">
                                    <span className="my-auto">Status</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {rawat_inap_rows}
                    <Pagination paginationClick={this.props.paginationClick} datalength={this.props.datalength} currentpage={this.props.currentpage} itemperpage='10' />
                </div>
            )
        }
        else {
            return (
                <div style={panel_style}>
                    <div className="row justify-content-center" key='0'>
                        <div className="col-10 col-md-8 text-center border rounded-lg py-4">
                            <p className="mb-0 fs24md fs16 fw600 text-muted">
                                <span>Item tidak ditemukan</span>
                            </p>
                        </div>
                    </div>
                </div>
            )
        }
    }
}

class RawatInapListRow extends React.Component {
    // clickRow() {
    //     var type
    //     var item = this.props.item

    //     if (['Draft', 'On Progress'].includes(item.status)) {
    //         type = 'edit'
    //     } else {
    //         type = 'detail'
    //     }

    //     var pathname = "/main/dokter-dan-jasa/rawat-inap/" + type + "?n=" + item.name
    //     window.location = pathname
    // }

    render() {
        var checked = false
        if (this.props.item.checked) {
            checked = true
        }
        var item = this.props.item
        var statusClass

        if (item.status == 'Draft') {
            statusClass = 'bg-warning'
        } else if (item.status == 'Done') {
            statusClass = 'bg-success'
        } else if (item.status == 'On Progress') {
            statusClass = 'bg-info'
        }

        var row_style = {}
        if (item.pet_status == 'Nonactive') {
            row_style = { 'color': '#BEBEBE' }
        }

        var type
        var item = this.props.item

        if (['Draft', 'On Progress'].includes(item.status)) {
            type = 'edit'
        } else {
            type = 'detail'
        }

        var pathname = "/main/dokter-dan-jasa/rawat-inap/" + type + "?n=" + item.name

        return (
            <div className="row mx-0">
                <div className="col-auto pl-2 pr-3">
                    <input type="checkbox" className="d-block my-3" checked={checked} onChange={this.props.checkRow} />
                </div>
                <a href={pathname} className="col row-list row-list-link" style={row_style}>
                    <div className="row mx-0 fs12 fw600">
                        <div className="col-2 d-flex">
                            <span className="my-auto">{moment(item.creation).format("YYYY-MM-DD HH:mm:ss")}</span>
                        </div>
                        <div className="col-1 d-flex">
                            <span className="my-auto">{item.name}</span>
                        </div>
                        <div className="col-1 d-flex">
                            <span className="my-auto">{item.register_number}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{item.pet_name}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{item.owner_name}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{item.dokter_reference}</span>
                        </div>
                        <div className="col-1 d-flex">
                            <span className={statusClass + ' fs12 py-1 rounded-pill text-center text-white px-3 my-auto'}>
                                {item.status}
                            </span>
                        </div>
                    </div>
                </a>
            </div>
        )
    }
}

class PopupTindakanBaru extends React.Component {
    render() {
        var maxwidth = { maxWidth: '35%', paddingTop: '300px' }
        var cursor = { cursor: 'pointer' }
        var label_color = { color: '#056EAD' }
        return (
            <div className="menu-popup">
                <div className="container" style={maxwidth}>
                    <div className="bg-white p-5">
                        <div className="row mx-0">
                            <div className="col-3 text-center">
                                <div style={cursor} onClick={() => window.location.href = '/main/dokter-dan-jasa/rawat-inap/form?time=pagi'}>
                                    <img className="mt-auto mx-auto" src={"/static/img/main/menu/pagi_nolabel_active.png"} />
                                    <p className="fs22 fw600 mb-0" style={label_color}>Pagi</p>
                                </div>
                            </div>
                            <div className="col-3 text-center">
                                <div style={cursor} onClick={() => window.location.href = '/main/dokter-dan-jasa/rawat-inap/form?time=siang'}>
                                    <img className="mt-auto mx-auto" src={"/static/img/main/menu/siang_nolabel_active.png"} />
                                    <p className="fs22 fw600 mb-0" style={label_color}>Siang</p>
                                </div>
                            </div>
                            <div className="col-3 text-center">
                                <div style={cursor} onClick={() => window.location.href = '/main/dokter-dan-jasa/rawat-inap/form?time=sore'}>
                                    <img className="mt-auto mx-auto" src={"/static/img/main/menu/sore_nolabel_active.png"} />
                                    <p className="fs22 fw600 mb-0" style={label_color}>Sore</p>
                                </div>
                            </div>
                            <div className="col-3 text-center">
                                <div style={cursor} onClick={() => window.location.href = '/main/dokter-dan-jasa/rawat-inap/form?time=malam'}>
                                    <img className="mt-auto mx-auto" src={"/static/img/main/menu/malam_nolabel_active.png"} />
                                    <p className="fs22 fw600 mb-0" style={label_color}>Malam</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="menu-popup-close" onClick={this.props.togglePopupTindakan}></div>
            </div>
        )
    }
}

ReactDOM.render(<RawatInap />, document.getElementById('rawat_inap_list'))