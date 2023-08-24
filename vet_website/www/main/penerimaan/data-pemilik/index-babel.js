// var tzOffset = new Date().getTimezoneOffset()
var tzOffset = 0
class PetOwner extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': [],
            'loaded': false,
            'check_all': false,
            'show_delete': false,
            'search': false,
            'currentpage': 1,
            'datalength': 0,
        }

        this.ownerSearch = this.ownerSearch.bind(this);
        this.checkRow = this.checkRow.bind(this);
        this.deleteRow = this.deleteRow.bind(this);
        this.paginationClick = this.paginationClick.bind(this);
    }

    componentDidMount() {
        var po = this
        var filters

        if (sessionStorage.getItem(window.location.pathname) != null && document.referrer.includes('/main/penerimaan/data-pemilik/edit')) {
            filters = JSON.parse(sessionStorage.getItem(window.location.pathname))
        } else {
            filters = { filters: [], sorts: [] }
        }

        if (filters.hasOwnProperty("currentpage")) {
            this.setState({ 'currentpage': filters['currentpage'] })
        }

        if (filters.hasOwnProperty("search")) {
            this.setState({ 'search': filters['search'] })
        }

        sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))
        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetpetowner.vetpetowner.get_pet_owner",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'data': r.message.pet_owner, 'loaded': true, 'datalength': r.message.datalength });
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
            method: "vet_website.vet_website.doctype.vetpetowner.vetpetowner.get_pet_owner",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'data': r.message.pet_owner, 'loaded': true, 'datalength': r.message.datalength });
                }
            }
        });
        // }
    }

    ownerSearch(filters) {
        var po = this

        this.setState({
            currentpage: 1,
            loaded: false,
        });

        filters['currentpage'] = 1;
        filters['search'] = this.state.search

        sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))

        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetpetowner.vetpetowner.get_pet_owner",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'data': r.message.pet_owner, 'datalength': r.message.datalength, 'loaded': true });
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
            method: "vet_website.vet_website.doctype.vetpetowner.vetpetowner.delete_pet_owner",
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

    printPDF() {
        var pdfid = 'pdf'
        var format = [559, 794]
        var th = this
        // var doc = new jsPDF({
        //     orientation: 'p',
        //     unit: 'pt',
        //     format: format,
        // });
        var source = document.getElementById(pdfid)
        var opt = {
            margin: [10, 0, 10, 0],
            filename: "DataPemilik-" + moment().format('MM-YYYY') + ".pdf",
            pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', '.row'] },
            html2canvas: { scale: 3 },
            jsPDF: { orientation: 'p', unit: 'pt', format: [559 * 0.754, 794 * 0.754] }
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
        var sorts = [
            { 'label': 'Tanggal Pendaftaran DESC', 'value': 'creation desc' },
            { 'label': 'Tanggal Pendaftaran ASC', 'value': 'creation asc' },
            { 'label': 'NIK DESC', 'value': 'nik desc' },
            { 'label': 'NIK ASC', 'value': 'nik asc' },
            { 'label': 'Nama Pemilik DESC', 'value': 'owner_name desc' },
            { 'label': 'Nama Pemilik ASC', 'value': 'owner_name asc' },
            { 'label': 'Piutang DESC', 'value': 'piutang desc' },
            { 'label': 'Piutang ASC', 'value': 'piutang asc' },
        ]
        var field_list = [
            { 'label': 'Tanggal Pendaftaran', 'field': 'creation', 'type': 'date' },
            { 'label': 'NIK', 'field': 'nik', 'type': 'char' },
            { 'label': 'Nama Pemilik', 'field': 'owner_name', 'type': 'char' },
            { 'label': 'Alamat', 'field': 'address', 'type': 'char' },
            { 'label': 'Telepon', 'field': 'phone', 'type': 'char' },
            { 'label': 'Email', 'field': 'email', 'type': 'char' },
            { 'label': 'Piutang', 'field': 'piutang', 'type': 'int' }
        ]

        var row_style = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px' }
        var delete_button
        if (this.state.show_delete) {
            delete_button = <button className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={this.deleteRow}>Hapus</button>
        }
        var formStyle = { border: '1px solid #397DA6', color: '#397DA6' }

        if (this.state.loaded) {
            return (
                <div>
                    <div className="row mx-0" style={row_style}>
                        <div className="col-auto">
                            <a href="/main/penerimaan/data-pemilik/form" className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2"><i className="fa fa-plus mr-2" />Tambah</a>
                            {delete_button}
                            <button type="button" className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={() => this.printPDF()}>Print</button>
                        </div>
                        <div className="col">
                            <input value={this.state.search || ''} className="form-control fs12" name="search" placeholder="Search..." style={formStyle} onChange={e => this.setState({ search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' ? this.ownerSearch(JSON.parse(sessionStorage.getItem(window.location.pathname))) : null} />
                        </div>
                        <div className="col-7">
                            <Filter sorts={sorts} searchAction={this.ownerSearch} field_list={field_list} filters={JSON.parse(sessionStorage.getItem(window.location.pathname))} />
                        </div>
                    </div>
                    <PetOwnerList owners={this.state.data} checkRow={this.checkRow} checkAll={() => this.checkAll()} check_all={this.state.check_all} paginationClick={this.paginationClick} currentpage={this.state.currentpage} datalength={this.state.datalength} />
                    <PDF data={this.state.data}/>
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


class PetOwnerList extends React.Component {
    render() {
        // var search = this.props.search
        // function filterOwner(owner) {
        //     function filterField(field) {
        //         return owner[field] ? owner[field].toString().includes(search) : false
        //     }
        //     var fields = ['creation', 'nik', 'owner_name', 'address', 'phone', 'email', 'debt']
        //     return ![false, ''].includes(search) ? fields.some(filterField) : true
        // }
        var owner_rows = []
        var panel_style = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px' }
        if (this.props.owners.length != 0) {
            // var number = 1
            // var pol = this
            // const indexOfLastTodo = this.props.currentpage * 30;
            // const indexOfFirstTodo = indexOfLastTodo - 30;
            // var currentItems
            // ![false,''].includes(search)?
            // currentItems = this.props.owners.filter(filterOwner).slice(indexOfFirstTodo, indexOfLastTodo):
            // currentItems = this.props.owners.slice(indexOfFirstTodo, indexOfLastTodo)

            this.props.owners.forEach(function (owner, index) {
                // if (currentItems.includes(owner)){
                owner_rows.push(
                    <PetOwnerListRow key={owner.name} owner={owner} checkRow={() => pol.props.checkRow(index)} />
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
                                <div className="col d-flex">
                                    <span className="my-auto">Tanggal Pendaftaran</span>
                                </div>
                                <div className="col-1 d-flex">
                                    <span className="my-auto">NIK</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">Nama Pemilik</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">Alamat</span>
                                </div>
                                <div className="col-2 d-flex">
                                    <span className="my-auto">Telepon</span>
                                </div>
                                <div className="col-2 d-flex">
                                    <span className="my-auto">Email</span>
                                </div>
                                <div className="col-2 d-flex">
                                    <span className="my-auto">Piutang</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {owner_rows}
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

class PetOwnerListRow extends React.Component {
    // clickRow() {
    //     var pathname = "/main/penerimaan/data-pemilik/edit?n=" + this.props.owner.name
    //     window.location = pathname
    // }

    render() {
        var checked = false
        if (this.props.owner.checked) {
            checked = true
        }

        return (
            <div className="row mx-0">
                <div className="col-auto pl-2 pr-3">
                    <input type="checkbox" className="d-block my-3" checked={checked} onChange={this.props.checkRow} />
                </div>
                <a href={"/main/penerimaan/data-pemilik/edit?n=" + this.props.owner.name} className="col row-list row-list-link">
                    <div className="row mx-0 fs12 fw600">
                        <div className="col d-flex">
                            <span className="my-auto">{moment(this.props.owner.creation).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss")}</span>
                        </div>
                        <div className="col-1 d-flex">
                            <span className="my-auto">{this.props.owner.nik}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{this.props.owner.owner_name}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{this.props.owner.address}</span>
                        </div>
                        <div className="col-2 d-flex">
                            <span className="my-auto">{this.props.owner.phone}</span>
                        </div>
                        <div className="col-2 d-flex">
                            <span className="my-auto">{this.props.owner.email}</span>
                        </div>
                        <div className="col-2 d-flex">
                            <span className="my-auto">{formatter.format(this.props.owner.debt)}</span>
                        </div>
                    </div>
                </a>
            </div>
        )
    }
}

class PDF extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            'profile': {},
            'loaded': false,
        }
    }

    componentDidMount() {
        var ci = this

        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetprofile.vetprofile.get_profile",
            args: {},
            callback: function (r) {
                if (r.message) {
                    ci.setState({ 'profile': r.message.profile, 'loaded': true });
                }
            }
        });
    }

    render() {

        var data = this.props.data
        var profile = this.state.profile
        console.log(data)
        var page_dimension = { width: 559, minHeight: 794, top: 0, right: 0, background: '#FFF', color: '#000', zIndex: -1 }
        var borderStyle = { border: '1px solid #000', margin: '15px 0' }
        var row2 = { margin: '0 -14px' }
        var th = { border: '1px solid #000' }
        var td = { borderLeft: '1px solid #000', borderRight: '1px solid #000' }
        var fs13 = { fontSize: 13 }
        var fs9 = { fontSize: 9 }
        var invoice = { letterSpacing: 0, lineHeight: '24px', marginBottom: 0, marginTop: 18 }
        var invoice2 = { letterSpacing: 0 }
        var thead = { background: '#d9d9d9', fontSize: 11 }
        var table_rows = []

        // const indexOfLastTodo = this.props.currentpage * 30;
        // const indexOfFirstTodo = indexOfLastTodo - 30;
        // var currentItems
        // ![false,''].includes(search)?
        // currentItems = data.filter(filterOwner).slice(indexOfFirstTodo, indexOfLastTodo):
        // currentItems = data.slice(indexOfFirstTodo, indexOfLastTodo)
        // currentItems = data.slice(0,30)
        data.forEach((d, index) => {
            table_rows.push(
                <tr key={d.name} style={fs9} className="text-center">
                    <td className="py-1">{moment(d.creation).format("DD-MM-YYYY")}</td>
                    <td className="py-1">{d.nik}</td>
                    <td className="py-1">{d.owner_name}</td>
                    <td className="py-1">{d.address}</td>
                    <td className="py-1">{d.phone}</td>
                    <td className="py-1">{d.email}</td>
                    <td className="py-1">{formatter.format(d.credit)}</td>
                </tr>
            )
        })

        if (this.state.loaded) {
            var image
            if (profile.image != undefined) {
                var image_style = { position: 'absolute', top: 0, left: 0, objectFit: 'cover', height: '100%' }
                image = <img src={profile.temp_image || profile.image} style={image_style} />
            } else {
                image = <img src={profile.temp_image} style={image_style} />
            }

            return (
                <div className="position-absolute d-none" style={page_dimension}>
                    <div id="pdf" className="px-4" style={page_dimension}>
                        <div className="row">
                            <div className="col-2 px-0">
                                {/* <img className="mt-3" src="/static/img/main/menu/naturevet_logo_2x.png"/> */}
                                {image}
                            </div>
                            <div className="col-6">
                                <p className="my-3 fwbold text-uppercase" style={fs13}>{profile.clinic_name}</p>
                                <p className="my-0" style={fs9}>{profile.address}</p>
                                <p className="my-0" style={fs9}>Telp. : {profile.phone}</p>
                            </div>
                            <div className="col-4 px-0">
                                <p className="fwbold text-right text-uppercase fs28" style={invoice}>Data Pemilik</p>
                                {/*<p className="fw600 text-right text-uppercase fs14" style={invoice2}>{moment().format("MM/YYYY")}</p>*/}
                            </div>
                            <div className="col-12" style={borderStyle} />
                        </div>
                        <table className="fs12" style={row2}>
                            <thead className="text-uppercase" style={thead}>
                                <tr className="text-center">
                                    <th className="fw700 py-2" width="79px">Tanggal Pendaftaran</th>
                                    <th className="fw700 py-2" width="79px">NIK</th>
                                    <th className="fw700 py-2" width="81px">Nama Pemilik</th>
                                    <th className="fw700 py-2" width="81px">Alamat</th>
                                    <th className="fw700 py-2" width="81px">Telepon</th>
                                    <th className="fw700 py-2" width="79px">Email</th>
                                    <th className="fw700 py-2" width="79px">Piutang</th>
                                </tr>
                            </thead>
                            <tbody>
                                {table_rows}
                            </tbody>
                        </table>
                    </div>
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

ReactDOM.render(<PetOwner />, document.getElementById('pet_owner_list'))