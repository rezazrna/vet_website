var pet = getUrlParameter('pet')
// var tzOffset = new Date().getTimezoneOffset()
var tzOffset = 0
var checks = [
    { 'label': 'Riwayat Vaksin', 'name': 'vaccine_history' },
    { 'label': 'Riwayat Makanan', 'name': 'food_history' },
    { 'label': 'Anamnese', 'name': 'anamnese' },
    { 'label': 'Diagnosa Utama', 'name': 'diagnosa_utama' },
    { 'label': 'Prognosa', 'name': 'prognosa' },
    { 'label': 'Diagnosa Banding', 'name': 'diagnosa_banding' },
    { 'label': 'BCS', 'name': 'bcs' },
    { 'label': 'Vomit', 'name': 'vomit' },
    { 'label': 'Ausc. L', 'name': 'auscl' },
    { 'label': 'Ausc. H', 'name': 'ausch' },
    { 'label': 'Pulsus', 'name': 'pulse' },
    { 'label': 'Respirasi', 'name': 'respiration' },
    { 'label': 'Abdomnal Palpasi Pain', 'name': 'abdominal_palpasi_pain' },
    { 'label': 'Abdominal Palpasi Tension', 'name': 'abdominal_palpasi_tension' },
    { 'label': 'Limfonodule', 'name': 'limfonodule' },
    { 'label': 'Mukosa', 'name': 'mukosa' },
    { 'label': 'Mata', 'name': 'mata' },
    { 'label': 'Hidung', 'name': 'hidung' },
    { 'label': 'Mulut', 'name': 'mulut' },
    { 'label': 'Telinga', 'name': 'telinga' },
    { 'label': 'Kulit', 'name': 'kulit' },
    { 'label': 'Ekstremitas', 'name': 'ekstremitas' },
    { 'label': 'Sensasi Refleks', 'name': 'reflex' },
    { 'label': 'Lainnya', 'name': 'other' },
    { 'label': 'Tindakan', 'name': 'action' },
    { 'label': 'Suhu', 'name': 'temperature' },
    { 'label': 'Berat', 'name': 'weight' },
]

class RekamMedis extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': [],
            'loaded': false,
            'check_all': false,
            'show_delete': false,
            'expand_all': false,
            'currentpage': 1,
            'search': false,
            'datalength': 0,
        }

        this.rekamMedisSearch = this.rekamMedisSearch.bind(this);
        this.checkRow = this.checkRow.bind(this);
        this.deleteRow = this.deleteRow.bind(this);
        this.expandRow = this.expandRow.bind(this);
        this.expandAll = this.expandAll.bind(this);
        this.paginationClick = this.paginationClick.bind(this);
    }

    componentDidMount() {
        var po = this
        var new_filters = { filters: [], sorts: [] }

        if (sessionStorage.getItem(window.location.pathname) != null && (document.referrer.includes('/main/rekam-medis/rekam-medis/detail'))) {
            new_filters = JSON.parse(sessionStorage.getItem(window.location.pathname))
        }

        if (new_filters.hasOwnProperty("currentpage")) {
            this.setState({ 'currentpage': new_filters['currentpage'] })
        }

        if (new_filters.hasOwnProperty("search")) {
            this.setState({ 'search': filters['search'] })
        }

        if (document.location.href.includes('?')) {
            var url = document.location.href,
                params = url.split('?')[1].split('='),
                key = params[0],
                value = params[1]
        }

        if (params) {
            new_filters[key] = value
            sessionStorage.setItem(window.location.pathname, JSON.stringify(new_filters))
            this.rekamMedisSearch(new_filters)
        } else {
            sessionStorage.setItem(window.location.pathname, JSON.stringify(new_filters))
            frappe.call({
                type: "GET",
                method: "vet_website.vet_website.doctype.vetrekammedis.vetrekammedis.get_rekam_medis_list",
                args: { filters: new_filters },
                callback: function (r) {
                    if (r.message) {
                        console.log(r.message);
                        po.setState({ 'data': r.message.rekam_medis, 'loaded': true, 'datalength': r.message.datalength });
                    }
                }
            });
        }
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

        sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))

        // if (number * 30 > this.state.data.length) {
        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetrekammedis.vetrekammedis.get_rekam_medis_list",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'data': r.message.rekam_medis, 'loaded': true, 'datalength': r.message.datalength });
                }
            }
        });
        // }
    }

    rekamMedisSearch(filters) {
        if (pet) {
            filters.pet = pet
        }
        var po = this

        this.setState({
            currentpage: 1,
            loaded: false,
        });

        filters['currentpage'] = 1
        filters['search'] = this.state.search
        sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))
        console.log('filters', filters)
        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetrekammedis.vetrekammedis.get_rekam_medis_list",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'data': r.message.rekam_medis, 'loaded': true, 'datalength': r.message.datalength });
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
            method: "vet_website.vet_website.doctype.vetrekammedis.vetrekammedis.delete_rekam_medis",
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

    expandRow(i, condition = null) {
        var aa = this
        var new_data = this.state.data.slice()
        if ([true, false].includes(condition)) {
            new_data[i].expand = condition
        }
        if (!new_data[i].expand) {
            if (new_data[i].attachments == undefined) {
                frappe.call({
                    type: "GET",
                    method: "vet_website.vet_website.doctype.vetrekammedis.vetrekammedis.get_rekam_medis",
                    args: { name: new_data[i].name },
                    callback: function (r) {
                        if (r.message) {
                            new_data[i].attachments = r.message.attachments
                            new_data[i].marker = r.message.marker
                            new_data[i].expand = true
                            new_data[i].analisa_layanan_obat = r.message.analisa_layanan_obat
                            aa.setState({ data: new_data })
                            aa.checkExpand()
                        }
                    }
                });
            }
            else {
                new_data[i].expand = true
                this.setState({ data: new_data })
                this.checkExpand()
            }

        }
        else {
            new_data[i].expand = false
            this.setState({ data: new_data })
            this.checkExpand()
        }
    }

    expandAll() {
        if (this.state.data.length != 0) {
            var new_data = this.state.data.slice()
            new_data.forEach((d, index) => {
                d.expand = false
            })
            this.setState({ data: new_data, expand_all: false })
        }
    }

    checkExpand() {
        var is_all_expanded = this.state.data.every((d) => d.expand)
        if (is_all_expanded) {
            this.setState({ expand_all: true })
        }
        else {
            this.setState({ expand_all: false })
        }
    }

    render() {
        var service_options = []
        this.state.data.forEach(d => !service_options.map(o => o.value).includes(d.service) ? service_options.push({ label: d.service, value: d.service }) : false)

        var sorts = [
            { 'label': 'Tanggal Rekam Medis DESC', 'value': 'record_date desc' },
            { 'label': 'Tanggal Rekam Medis ASC', 'value': 'record_date asc' },
            { 'label': 'ID DESC', 'value': 'name desc' },
            { 'label': 'ID ASC', 'value': 'name asc' },
            // 	{'label': 'No Pendaftaran DESC', 'value': 'register_number desc'},
            // 	{'label': 'No Pendaftaran', 'value': 'register_number asc'},
        ]

        var field_list = [
            { 'label': 'Tanggal Rekam Medis', 'field': 'record_date', 'type': 'date' },
            //  {'label': 'No Registrasi', 'field': 'register_number', 'type': 'char'},
            //  {'label': 'No. Antrian', 'field': 'reception', 'type': 'char'},
            { 'label': 'ID', 'field': 'name', 'type': 'char' },
            { 'label': 'Layanan', 'field': 'service', 'type': 'select', 'options': service_options },
            { 'label': 'Nama Pasien', 'field': 'pet_name', 'type': 'char' },
            { 'label': 'Nama Pemilik', 'field': 'pet_owner_name', 'type': 'char' },
            { 'label': 'Nama Dokter', 'field': 'nama_dokter', 'type': 'char' },
            //  {'label': 'Kondisi Akhir', 'field': 'last_condition', 'type': 'char'},
        ]

        var row_style = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px' }
        var formStyle = { border: '1px solid #397DA6', color: '#397DA6' }
        var delete_button, backButton

        if (this.state.show_delete) {
            delete_button = <button className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={this.deleteRow}>Hapus</button>
        }

        if (document.location.href.includes('?')) {
            var color = { color: '#056EAD', cursor: 'pointer' }
            backButton = <span className="fs16 fw600 mr-4 my-auto" style={color} onClick={() => { history.back() }}><i className="fa fa-chevron-left mr-1" style={color}></i>Back</span>
        }

        var content
        if (pet) {
            content = <RekamMedisListExpandable data={this.state.data} expandRow={this.expandRow} expandAll={() => this.expandAll()} expand_all={this.state.expand_all} paginationClick={this.paginationClick} currentpage={this.state.currentpage} datalength={this.state.datalength} />
        }
        else {
            content = <RekamMedisList data={this.state.data} checkRow={this.checkRow} checkAll={() => this.checkAll()} check_all={this.state.check_all} paginationClick={this.paginationClick} currentpage={this.state.currentpage} datalength={this.state.datalength} />
        }

        if (this.state.loaded) {
            return (
                <div>
                    <div className="row mx-0" style={row_style}>
                        <div className="col-auto my-auto">
                            {backButton}
                            {delete_button}
                        </div>
                        <div className="col">
                            <input value={this.state.search || ''} className="form-control fs12" name="search" placeholder="Search..." style={formStyle} onChange={e => this.setState({ search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' ? this.rekamMedisSearch(JSON.parse(sessionStorage.getItem(window.location.pathname))) : null} />
                        </div>
                        <div className="col-7">
                            <Filter sorts={sorts} searchAction={this.rekamMedisSearch} field_list={field_list} filters={JSON.parse(sessionStorage.getItem(window.location.pathname))} />
                        </div>
                    </div>
                    {content}
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


class RekamMedisList extends React.Component {
    render() {
        var search = this.props.search
        // function filterRow(row) {
        //     function filterField(field) {
        //         return field ? field.toString().includes(search) : false
        //     }
        //     var fields = [moment(row.record_date).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss"), row.name, row.service, row.pet_name, row.nama_dokter, row.pet_owner_name, row.temperature, row.weight]
        //     return ![false, ''].includes(search) ? fields.some(filterField) : true
        // }
        var rekam_medis_rows = []
        var panel_style = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px' }
        var col_style = { width: '25px' }
        if (this.props.data.length != 0) {
            var pol = this
            // const indexOfLastTodo = this.props.currentpage * 30;
            // const indexOfFirstTodo = indexOfLastTodo - 30;
            // var currentItems
            // ![false,''].includes(search)?
            // currentItems = this.props.data.filter(filterRow).slice(indexOfFirstTodo, indexOfLastTodo):
            // currentItems = this.props.data.slice(indexOfFirstTodo, indexOfLastTodo)

            this.props.data.forEach(function (item, index) {
                // if (currentItems.includes(item)){
                rekam_medis_rows.push(
                    <RekamMedisListRow key={item.name} data={item} checkRow={() => pol.props.checkRow(index)} />
                )
                // }
            })

            return (
                <div style={panel_style}>
                    <div className="row mx-0">
                        <div className="col-auto pl-2 pr-3 d-flex">
                            <input type="checkbox" className="d-block my-3" checked={this.props.check_all} onChange={this.props.checkAll} />
                        </div>
                        <div className="col row-header">
                            <div className="row mx-0 fs12 fw600">
                                <div className="col d-flex">
                                    <span className="my-auto">Tgl Rekam Medis</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">ID</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">Layanan</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">Nama Pasien</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">Nama Dokter</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">Nama Pemilik</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">Suhu (C)</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">Berat (Kg)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {rekam_medis_rows}
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

class RekamMedisListRow extends React.Component {
    clickRow() {
        var pathname = "/main/rekam-medis/rekam-medis/detail?n=" + this.props.data.name
        window.location = pathname
    }

    render() {
        var checked = false
        if (this.props.data.checked) {
            checked = true
        }
        var data = this.props.data
        var number_style = { width: '25px' }
        var color_style = { color: '#787E84' }

        return (
            <div className="row mx-0">
                <div className="col-auto pl-2 pr-3 d-flex">
                    <input type="checkbox" className="d-block my-3" checked={checked} onChange={this.props.checkRow} />
                </div>
                <div className="col row-list row-list-link" onClick={() => this.clickRow()}>
                    <div className="row mx-0 fs12 fw600" style={color_style}>
                        <div className="col d-flex">
                            <span className="my-auto">{moment(data.record_date).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss")}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{data.name}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{data.service}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{data.pet_name}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{data.nama_dokter}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{data.pet_owner_name}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{data.temperature}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{data.weight}</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

class RekamMedisListExpandable extends React.Component {
    render() {
        var rekam_medis_rows = []
        var panel_style = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '5px 32px 40px 22px' }
        var col_style = { width: '25px' }
        if (this.props.data.length != 0) {
            var pol = this
            // const indexOfLastTodo = this.props.currentpage * 30;
            // const indexOfFirstTodo = indexOfLastTodo - 30;
            // const currentItems = this.props.data.slice(indexOfFirstTodo, indexOfLastTodo)

            this.props.data.forEach(function (item, index) {
                // if (currentItems.includes(item)) {
                rekam_medis_rows.push(
                    <RekamMedisListRowExpandable key={item.name} data={item} expandRow={() => pol.props.expandRow(index.toString())} />
                )
                // }
            })

            var collapse_link
            var thr_expand = this.props.data.find(d => d.expand)
            if (thr_expand) {
                collapse_link = <a href="#" onClick={this.props.expandAll}>Collapse All</a>
            }

            return (
                <div style={panel_style}>
                    <div className="text-right py-3">
                        {collapse_link}
                    </div>
                    {rekam_medis_rows}
                    <Pagination paginationClick={this.props.paginationClick} datalength={this.props.datalength} currentpage={this.props.currentpage} itemperpage='10' />
                </div>
            )
        }
        else {
            panel_style = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 22px' }
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

class RekamMedisListRowExpandable extends React.Component {
    clickRow() {
        var pathname = "/main/rekam-medis/rekam-medis/detail?n=" + this.props.data.name
        window.location = pathname
    }

    render() {
        var data = this.props.data
        var number_style = { width: '25px' }

        var row_detail
        var chevron = <i className="fa fa-chevron-down" />
        if (data.expand) {
            row_detail = <RekamMedisListRowExpandableDetail data={data} />
            chevron = <i className="fa fa-chevron-up" />
        }

        return (
            <div className="row mx-0">
                <div className="col-auto px-0">
                    <div className="side-marker" />
                </div>
                <div className="col">
                    <div className="row mx-0 fw600 row-list row-list-expandable" onClick={this.props.expandRow}>
                        <div className="col-2 d-flex">
                            <span className="my-auto">{moment(data.record_date).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss")}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{data.service}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{data.condition}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{data.nama_dokter}</span>
                        </div>
                        <div className="col-auto d-flex">
                            {chevron}
                        </div>
                    </div>
                    {row_detail}
                </div>
            </div>
        )
    }
}

class RekamMedisListRowExpandableDetail extends React.Component {
    render() {
        var data = this.props.data
        var rowsLeft = []
        var rowsRight = []
        var padding = { padding: '10px 0' }

        var check_list_style = { overflowY: 'auto', maxHeight: '362px' }

        var check_list = []
        checks.forEach((c, index) => {
            if (![undefined, '', '-', null].includes(data[c.name])) {
                check_list.push(
                    <div className="row" style={padding} key={index.toString()}>
                        <div className="col-4">
                            <span className="fw600">{c.label}</span>
                        </div>
                        <div className="col text-right">
                            <span>{data[c.name]}</span>
                        </div>
                    </div>
                )
            }
        })

        var attachment_buttons = []
        if (data.attachments != undefined && data.attachments.length != 0) {
            data.attachments.forEach((a, i) => {
                var buttonStyle = { background: '#076FAD', color: '#FFF' }
                attachment_buttons.push(
                    <div className="col-auto my-1" key={i.toString()}>
                        <a title={a.title} className="btn fs14 fw600 rounded-lg px-3" style={buttonStyle} onClick={() => { window.open(a.attachment, '_blank') }}>{a.title}</a>
                    </div>
                )
            })
        }

        var split = Math.ceil(this.props.data.analisa_layanan_obat.length / 2)

        this.props.data.analisa_layanan_obat.forEach(function (item, index) {
            if (marker) {
                if ((index + 1) <= split) {
                    rowsLeft.push(<AnalisaLayananObatList item={item} key={index.toString()} />)
                } else {
                    rowsRight.push(<AnalisaLayananObatList item={item} key={index.toString()} />)
                }
            } else {
                rowsLeft.push(<AnalisaLayananObatList item={item} key={index.toString()} />)
            }
        })

        var marker
        if (data.marker != undefined && data.marker.markers != undefined && data.marker.markers.length != 0) {
            var div_absolute = { position: 'absolute', overflow: 'hidden auto', top: '0', left: '0', right: '0', bottom: '0' }
            marker = <MarkerField marker={data.marker} readOnly={true} />
            return (
                <div className="row mx-0">
                    <div className="col-12">
                        <div className="my-3">
                            <div className="row-detail-content">
                                <div className="row">
                                    <div className="col-6 position-relative">
                                        <div>
                                            <div>
                                                <div className="row-detail-header">
                                                    Hasil Pemeriksaan
                                                </div>
                                                <div className="row mx-0">
                                                    <div className="col-12">
                                                        {check_list}
                                                    </div>
                                                </div>
                                                <div className="row" style={padding}>
                                                    {attachment_buttons}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="row-detail-header">
                                                    Analisa Layanan dan Obat
                                                </div>
                                                <div className="row">
                                                    <div className="col-12">
                                                        {rowsLeft}
                                                    </div>
                                                    <div className="col-12">
                                                        {rowsRight}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        {marker}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
        else {
            return (
                <div className="row mx-0">
                    <div className="col-6">
                        <div className="my-3">
                            <div className="row-detail-header">
                                Hasil Pemeriksaan
                            </div>
                            <div className="row-detail-content py-0">
                                <div className="row">
                                    <div className="col-12">
                                        <div className="row">
                                            <div className="col-12" style={check_list_style}>
                                                {check_list}
                                            </div>
                                        </div>
                                        <div className="row" style={padding}>
                                            {attachment_buttons}
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        {marker}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-6">
                        <div className="my-3">
                            <div className="row-detail-header">
                                Analisa Layanan dan Obat
                            </div>
                            <div className="row-detail-content py-0">
                                <div className="row">
                                    <div className="col-12">
                                        {rowsLeft}
                                    </div>
                                    <div className="col-12">
                                        {rowsRight}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
    }
}

class AnalisaLayananObatList extends React.Component {
    render() {
        var item = this.props.item
        var note
        var product_name = []
        var quantity = []
        var noteStyle = { color: '#056EAD', background: '#fff' }

        var padding = { padding: 10 }

        if (!item.uom_name) {
            item.uom_name = ''
        }

        if (item.type == 'Obat') {
            if (item.note) {
                note = <div className="row fs14 mx-0 mt-2" style={noteStyle}>
                    <div className="col-auto pr-0">
                        <p className="mb-0">Catatan</p>
                    </div>
                    <div className="col-auto">
                        <p className="mb-0">:</p>
                    </div>
                    <div className="col pl-0">
                        <p className="mb-0">{item.note}</p>
                    </div>
                </div>
            }

            product_name.push(<p className="mb-0" key="999">{item.product_name}</p>)
            quantity.push(<p className="mb-0" key="999">{item.quantity + ' ' + item.uom_name}</p>)

            item.product_racikan.forEach(function (item, index) {
                product_name.push(<p className="mb-0" key={index.toString()}>{item.product_name}</p>)
                quantity.push(<p className="mb-0" key={index.toString()}>{item.quantity + ' ' + item.uom_name}</p>)
            })
        } else {
            product_name.push(<p className="mb-0" key="999">{item.product_name}</p>)
            quantity.push(<p className="mb-0" key="999">{item.quantity + ' ' + item.uom_name}</p>)
        }

        return (
            <div className="col" style={padding}>
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
        if (this.props.marker != undefined) {
            var marker = Object.assign({}, this.props.marker)
            this.setState({ marker: marker })
        }
        else if (this.props.marker == undefined && ['canine', 'feline'].includes(this.props.type)) {
            var marker = Object.assign({}, this.state.marker)
            marker.type = this.props.type
            this.setState({ marker: marker })
        }
    }

    submitMarker() {
        this.props.submitAction(this.state.marker);
    }

    resetMarker() {
        this.props.resetAction();
    }

    clickArea(e) {
        if (!this.props.readOnly) {
            var marker = Object.assign({}, this.state.marker)
            var rect = e.target.getBoundingClientRect();
            var x = e.clientX - rect.left - 7;
            var x_percent = (x * 100) / rect.width;
            var y = e.clientY - rect.top - 7;
            var y_percent = (y * 100) / rect.height;
            var new_marker = { x: x_percent + '%', y: y_percent + '%' }

            marker.markers.push(new_marker)
            this.setState({ marker: marker })
        }
    }

    render() {
        var boxShadow_style = { background: '#fff', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)' }

        var markers = this.state.marker.markers
        var marker_list = []
        if (markers != undefined && markers.length != 0) {
            markers.forEach((marker, index) => marker_list.push(<Marker x={marker.x} y={marker.y} description={marker.description} key={index.toString()} />))
        }

        var marker_field_class
        if (this.props.type == 'feline' || this.state.marker.type == 'feline') {
            marker_field_class = 'marker-field-cat'
        }
        else {
            marker_field_class = 'marker-field-dog'
        }

        var action_button
        if (!this.props.readOnly) {
            action_button = (
                <div className="row">
                    <div className="col-auto ml-auto">
                        <button type="button" className="btn btn-success fs12 fw600 rounded-lg px-3 mx-1" onClick={() => this.submitMarker()}>Submit</button>
                        <button type="button" className="btn btn-danger fs12 fw600 rounded-lg px-3 mx-1" onClick={() => this.resetMarker()}>Reset</button>
                    </div>
                </div>
            )
        }

        return (
            <div className="w-100">
                {action_button}
                <div className={'marker-field ' + marker_field_class} onClick={e => this.clickArea(e)}>
                    {marker_list}
                </div>
            </div>
        )
    }
}

class Marker extends React.Component {
    render() {
        var markerStyle = {
            position: 'absolute',
            top: this.props.y,
            left: this.props.x,
        }

        return (
            <i className="fa fa-lg fa-times text-danger" style={markerStyle} title={this.props.description} />
        )
    }
}

ReactDOM.render(<RekamMedis />, document.getElementById('rekam_medis_list'))