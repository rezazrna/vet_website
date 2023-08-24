// var tzOffset = new Date().getTimezoneOffset()
var tzOffset = 0
var register_number = getUrlParameter('register_number')

class Apotik extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': [],
            'loaded': false,
            'check_all': false,
            'show_delete': false,
            'currentpage': 1,
            'search': false,
            'datalength': 0,
        }

        this.apotikSearch = this.apotikSearch.bind(this);
        this.checkRow = this.checkRow.bind(this);
        this.deleteRow = this.deleteRow.bind(this);
        this.paginationClick = this.paginationClick.bind(this);
    }

    componentDidMount() {
        var po = this
        var new_filters

        console.log(document.referrer)

        if (sessionStorage.getItem(window.location.pathname) != null && (document.referrer.includes('/main/farmasi/apotik/edit') || document.referrer.includes('/main/farmasi/apotik/detail'))) {
            new_filters = JSON.parse(sessionStorage.getItem(window.location.pathname))
        } else {
            new_filters = { filters: [], sorts: [] }
        }

        if (new_filters.hasOwnProperty("currentpage")) {
            this.setState({ 'currentpage': new_filters['currentpage'] })
        }

        if (new_filters.hasOwnProperty("search")) {
            this.setState({ 'search': new_filters['search'] })
        }

        if (register_number) {
            new_filters.filters.push(['register_number', '=', register_number])
        }

        sessionStorage.setItem(window.location.pathname, JSON.stringify(new_filters))

        console.log(new_filters)

        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetapotik.vetapotik.get_apotik_list",
            args: { filters: new_filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'data': r.message.apotik, 'loaded': true, 'datalength': r.message.datalength });
                }
            }
        });
    }

    apotikSearch(filters) {
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

        new_filters['currentpage'] = 1
        new_filters['search'] = this.state.search
        sessionStorage.setItem(window.location.pathname, JSON.stringify(new_filters))
        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetapotik.vetapotik.get_apotik_list",
            args: { filters: new_filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'data': r.message.apotik, 'loaded': true, 'filter': true, 'datalength': r.message.datalength });
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

        sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))

        // if (number * 30 > this.state.data.length) {
        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetapotik.vetapotik.get_apotik_list",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'data': r.message.apotik, 'loaded': true, 'datalength': r.message.datalength });
                }
            }
        });
        // }
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
            method: "vet_website.vet_website.doctype.vetapotik.vetapotik.delete_apotik",
            args: { data: delete_data_names },
            callback: function (r) {
                if (r.message.success) {
                    var new_data = po.state.data.filter((d => !d.checked))
                    po.setState({ data: new_data });
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

    render() {
        var status_options = [
            { label: 'Draft', value: 'Draft' },
            { label: 'Done', value: 'Done' },
            { label: 'Cancel', value: 'Cancel' },
        ]

        var sorts = [
            { 'label': 'Tanggal Pendaftaran DESC', 'value': 'creation desc' },
            { 'label': 'Tanggal Pendaftaran ASC', 'value': 'creation asc' },
            { 'label': 'ID DESC', 'value': 'name desc' },
            { 'label': 'ID ASC', 'value': 'name asc' },
            { 'label': 'No Pendaftaran DESC', 'value': 'register_number desc' },
            { 'label': 'No Pendaftaran ASC', 'value': 'register_number asc' },
            { 'label': 'Nama Pasien DESC', 'value': 'pet_name desc' },
            { 'label': 'Nama Pasien ASC', 'value': 'pet_name asc' },
            { 'label': 'NIP DESC', 'value': 'pet desc' },
            { 'label': 'NIP ASC', 'value': 'pet asc' },
            { 'label': 'Nama Pemilik DESC', 'value': 'owner_name desc' },
            { 'label': 'Nama Pemilik ASC', 'value': 'owner_name asc' },
            { 'label': 'Nama Dokter DESC', 'value': 'dokter desc' },
            { 'label': 'Nama Dokter ASC', 'value': 'dokter asc' },
        ]

        var field_list = [
            { 'label': 'Tanggal Pendaftaran', 'field': 'creation', 'type': 'date' },
            { 'label': 'ID', 'field': 'name', 'type': 'char' },
            { 'label': 'No Pendaftaran', 'field': 'register_number', 'type': 'char' },
            { 'label': 'Nama Pasien', 'field': 'pet_name', 'type': 'char' },
            { 'label': 'NIP', 'field': 'pet', 'type': 'char' },
            { 'label': 'Nama Pemilik', 'field': 'owner_name', 'type': 'char' },
            { 'label': 'Nama Dokter', 'field': 'dokter', 'type': 'char' },
            { 'label': 'Status', 'field': 'status', 'type': 'select', 'options': status_options },
            //  {'label': 'Catatan', 'field': 'description', 'type': 'char'},
            //  {'label': 'Warehouse', 'field': 'warehouse_name', 'type': 'char'},

        ]

        var row_style2 = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px' }
        var formStyle = { border: '1px solid #397DA6', color: '#397DA6' }
        var delete_row
        var add_button = (
            <button type="button" className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={() => window.location.pathname = "/main/farmasi/apotik/form"}><i className="fa fa-plus mr-2" />Tambah</button>
        )
        if (this.state.show_delete) {
            delete_row = (
                <button className="btn btn-outline-danger text-uppercase fs12 fwbold" onClick={this.deleteRow}>Hapus</button>
            )
        }

        if (this.state.loaded) {
            return (
                <div>
                    <div className="row mx-0" style={row_style2}>
                        <div className="col-auto">
                            {add_button}
                            {delete_row}
                        </div>
                        <div className="col">
                            <input value={this.state.search || ''} className="form-control fs12" name="search" placeholder="Search..." style={formStyle} onChange={e => this.setState({ search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' ? this.apotikSearch(JSON.parse(sessionStorage.getItem(window.location.pathname))) : null} />
                        </div>
                        <div className="col-7">
                            <Filter sorts={sorts} searchAction={this.apotikSearch} field_list={field_list} filters={JSON.parse(sessionStorage.getItem(window.location.pathname))} />
                        </div>
                    </div>
                    <ApotikList apotik={this.state.data} checkRow={this.checkRow} checkAll={() => this.checkAll()} check_all={this.state.check_all} filter={this.state.filter} paginationClick={this.paginationClick} currentpage={this.state.currentpage} datalength={this.state.datalength} />
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


class ApotikList extends React.Component {
    render() {
        // var search = this.props.search
        // function filterRow(row){
        //     function filterField(field){
        //         return field?field.toString().includes(search):false
        //     }
        //     var fields = [row.creation, row.name, row.register_number, row.pet.pet_name, row.pet.name, row.pet_owner.owner_name, row.dokter, row.status]
        //     return ![false,''].includes(search)?fields.some(filterField):true
        // }

        var apotik_rows = []
        var panel_style = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px' }
        var apotik = this.props.apotik

        if (apotik.length != 0 || !this.props.filter) {
            // var pol = this
            // const indexOfLastTodo = this.props.currentpage * 30;
            // const indexOfFirstTodo = indexOfLastTodo - 30;
            // var currentItems
            // ![false,''].includes(search)?
            // currentItems = apotik.filter(filterRow).slice(indexOfFirstTodo, indexOfLastTodo):
            // currentItems = apotik.slice(indexOfFirstTodo, indexOfLastTodo)
            apotik.forEach(function (a, index) {
                // if (currentItems.includes(a)){
                apotik_rows.push(
                    <ApotikListRow key={a.name} apotik={a} checkRow={() => pol.props.checkRow(index)} />
                )
                // }
            })

            return (
                <div style={panel_style}>
                    <div className="row mx-0">
                        <div className="col-auto pl-2 pr-3">
                            <input type="checkbox" className="d-block my-3" checked={this.props.check_all} onChange={this.props.checkAll} />
                        </div>
                        <div className="col row-header">
                            <div className="row mx-0 fs12 fw600">
                                <div className="col d-flex">
                                    <span className="my-auto">Tanggal Pendaftaran</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">ID</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">No Pendaftaran</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">Nama Pasien</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">NIP</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">Nama Pemilik</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">Nama Dokter</span>
                                </div>
                                <div className="col-1 d-flex">
                                    <span className="my-auto">Status</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {apotik_rows}
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

class ApotikListRow extends React.Component {
    // clickRow() {
    //     var type
    //     var apotik = this.props.apotik

    //     if (['Draft'].includes(apotik.status)) {
    //         type = 'edit'
    //     } else {
    //         type = 'detail'
    //     }

    //     var pathname = "/main/farmasi/apotik/" + type + "?n=" + apotik.name
    //     window.location = pathname
    // }

    render() {
        var checked = false
        if (this.props.apotik.checked) {
            checked = true
        }
        var statusClass
        var apotik = this.props.apotik

        if (apotik.status == 'Draft') {
            statusClass = 'bg-warning'
        } else if (apotik.status == 'Done') {
            statusClass = 'bg-success'
        } else if (apotik.status == 'Cancel') {
            statusClass = 'bg-danger'
        } else {
            statusClass = 'bg-secondary'
        }

        var tgl = <span className="my-auto">{apotik.reception ? moment(apotik.reception.reception_date).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss") : moment(apotik.creation).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss")}</span>

        var type
        var apotik = this.props.apotik

        if (['Draft'].includes(apotik.status)) {
            type = 'edit'
        } else {
            type = 'detail'
        }

        var pathname = "/main/farmasi/apotik/" + type + "?n=" + apotik.name

        return (
            <div className="row mx-0">
                <div className="col-auto pl-2 pr-3">
                    <input type="checkbox" className="d-block my-3" checked={checked} onChange={this.props.checkRow} />
                </div>
                <a href={pathname} className="col row-list row-list-link">
                    <div className="row mx-0 fs12 fw600">
                        <div className="col d-flex">
                            {/* <span className="my-auto">{moment(apotik.creation).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss")}</span> */}
                            {tgl}
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{apotik.name}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{apotik.register_number}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{apotik.pet.pet_name}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{apotik.pet.name}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{apotik.pet_owner.owner_name}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{apotik.dokter}</span>
                        </div>
                        <div className="col-1 d-flex">
                            <span className={statusClass + ' fs12 py-1 rounded-pill text-center text-white px-3 my-auto'}>
                                {apotik.status}
                            </span>
                        </div>
                    </div>
                </a>
            </div>
        )
    }
}

ReactDOM.render(<Apotik />, document.getElementById('apotik_list'))
