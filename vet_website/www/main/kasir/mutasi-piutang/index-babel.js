class MutasiPiutang extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': [],
            'loaded': true,
            'currentpage': 1,
            'search': false,
            'datalength': 0,
            'print_loading': false,
            'print_data': [],
        }

        this.paginationClick = this.paginationClick.bind(this);
    }

    componentDidMount() {
        sessionStorage.setItem(window.location.pathname, JSON.stringify({ filters: [], sorts: [] }))
    }

    paginationClick(number) {
        var td = this
        var filters = JSON.parse(sessionStorage.getItem(window.location.pathname))

        this.setState({
            currentpage: Number(number),
            loaded: false,
        });

        filters['currentpage'] = Number(number)

        sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))

        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.get_mutasi_piutang",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message)
                    td.setState({ 'data': r.message.data, 'loaded': true, 'datalength': r.message.datalength });
                }
            }
        });
    }

    getPrintData() {
        var td = this

        if (!this.state.print_loading) {
            this.setState({ print_loading: true })
            frappe.call({
                type: "GET",
                method: "vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.get_mutasi_piutang",
                args: { filters: JSON.parse(sessionStorage.getItem(window.location.pathname)), all: 1 },
                callback: function (r) {
                    if (r.message) {
                        console.log(r.message)
                        td.setState({ 'print_data': r.message.data, 'loaded': true, 'datalength': r.message.datalength });
                        setTimeout(function() {
                            td.printPDF()
                        }, 3000);
                    }
                }
            });
        }
    }

    printPDF() {
        var title = 'MutasiPiutang'

        // var pdfid = 'pdf'
        // var source = document.getElementById(pdfid)
        var elements = Array.from(document.querySelectorAll('div[id^="pdf-"]'))
        var opt = {
            margin: [10, 0, 10, 0],
            filename: title + ".pdf",
            pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', '.row'] },
            html2canvas: { scale: 3 },
            jsPDF: { orientation: 'p', unit: 'pt', format: [559 * 0.754, 794 * 0.754] }
        }
        var worker = html2pdf()
            .set(opt)
            .from(elements[0])

        if (elements.length > 1) {
            worker = worker.toPdf()

            elements.slice(1).forEach((element, index) => {
            worker = worker
                .get('pdf')
                .then(pdf => {
                    console.log('masuk pak eko')
                    console.log(index)
                    pdf.addPage()
                })
                .set(opt)
                .from(element)
                // .toContainer()
                .toCanvas()
                .toPdf()
            })
        }

        worker = worker.save().then(e => {
            this.setState({print_loading: false})
        })
        // html2pdf().set(opt).from(source).save()
        // this.setState({ print_loading: false })
    }

    render() {

        var row_style2 = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px', 'height': '72px' }
        var formStyle = { border: '1px solid #397DA6', color: '#397DA6' }

        var item_pdf = []

        if (this.state.print_data.length > 0) {
            var chunk = []
            for (i = 0; i < this.state.print_data.length; i += (i == 0 ? 255 : 275)) {
                chunk.push(this.state.print_data.slice(i, i + (i == 0 ? 255 : 275)));
            }

            console.log(chunk)

            for (i = 0; i < chunk.length; i++) {
                if (i == 0) {
                    console.log('masuk pdf page pertama')
                    item_pdf.push(
                        <PDF data={chunk[i]}/>
                    )
                } else {
                    item_pdf.push(
                        <PDFListPage data={chunk[i]} pdfPage={i + 1}/>
                    )
                }
            }
        }

        if (this.state.loaded) {
            return (
                <div>
                    <div className="row mx-0" style={row_style2}>
                        <div className="col-auto my-auto">
                            <button type="button" className={this.state.print_loading ? "btn btn-outline-danger disabled text-uppercase fs12 fwbold mx-2" : "btn btn-outline-danger text-uppercase fs12 fwbold mx-2"} onClick={() => this.getPrintData()}>{this.state.print_loading ? (<span><i className="fa fa-spin fa-circle-o-notch mr-3" />Loading...</span>) : "Print"}</button>
                        </div>
                        <div className="col-2 my-auto">
                            <input value={this.state.search || ''} className="form-control fs12" name="search" placeholder="Search..." style={formStyle} onChange={e => this.setState({ search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' ? this.setFilter(JSON.parse(sessionStorage.getItem(window.location.pathname))) : null} />
                        </div>
                    </div>
                    <MutasiPiutangList items={this.state.data} paginationClick={this.paginationClick} currentpage={this.state.currentpage} datalength={this.state.datalength} />
                    {item_pdf}
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

class MutasiPiutangList extends React.Component {
    render() {
        var rows = []
        var panel_style = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px' }
        var items = this.props.items

        if (items.length != 0) {
            items.forEach(function (item, index) {
                rows.push(
                    <MutasiPiutangListRow key={index.toString()} item={item} />
                )
            })

            return (
                <div style={panel_style}>
                    <div className="row mx-0">
                        <div className="col row-header">
                            <div className="row mx-0 fs12 fw600">
                                <div className="col text-center">
                                    <span>ID Pemilik</span>
                                </div>
                                <div className="col text-center">
                                    <span>Nama Pemilik</span>
                                </div>
                                <div className="col text-center">
                                    <span>Nilai Awal</span>
                                </div>
                                <div className="col text-center">
                                    <span>Debit</span>
                                </div>
                                <div className="col text-center">
                                    <span>Credit</span>
                                </div>
                                <div className="col text-center">
                                    <span>Nilai Akhir</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {rows}
                    <Pagination paginationClick={this.props.paginationClick} datalength={this.props.datalength} currentpage={this.props.currentpage} itemperpage='30' />
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

class MutasiPiutangListRow extends React.Component {
    render() {

        var item = this.props.item

        return (
            <div className="row mx-0">
                <div className="col row-list row-list-link">
                    <div className="row mx-0 fs12 fw600">
                        <div className="col text-center">
                            <span>{item.name}</span>
                        </div>
                        <div className="col text-center">
                            <span>{item.owner_name}</span>
                        </div>
                        <div className="col text-center">
                            <span>{formatter2.format(item.awal)}</span>
                        </div>
                        <div className="col text-center">
                            <span>{formatter2.format(item.debit)}</span>
                        </div>
                        <div className="col text-center">
                            <span>{formatter2.format(item.credit)}</span>
                        </div>
                        <div className="col text-center">
                            <span>{formatter2.format(item.akhir)}</span>
                        </div>
                    </div>
                </div>
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
        var page_dimension = { width: 559, minHeight: 794, top: 0, right: 0, background: '#FFF', color: '#000', zIndex: -1 }
        var borderStyle = { border: '1px solid #000', margin: '15px 0' }
        var row2 = { width: '100%' }
        var th = { border: '1px solid #000' }
        var td = { borderLeft: '1px solid #000', borderRight: '1px solid #000' }
        var fs13 = { fontSize: 13 }
        var fs9 = { fontSize: 9 }
        var invoice = { letterSpacing: 0, lineHeight: '24px', marginBottom: 0, marginTop: 18 }
        var invoice2 = { letterSpacing: 0 }
        var thead = { background: '#d9d9d9', fontSize: 11 }
        var table_rows = []

        data.forEach((d, index) => {
            table_rows.push(
                <tr key={d.name} style={fs9} className="text-center">
                    <td className="py-1">{d.name}</td>
                    <td className="py-1">{d.owner_name}</td>
                    <td className="py-1">{formatter2.format(d.awal)}</td>
                    <td className="py-1">{formatter2.format(d.debit)}</td>
                    <td className="py-1">{formatter2.format(d.credit)}</td>
                    <td className="py-1">{formatter2.format(d.akhir)}</td>
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
                    <div id="pdf-1" className="px-4" style={page_dimension}>
                        <div className="row">
                            <div className="col-2 px-0">
                                {image}
                            </div>
                            <div className="col-6">
                                <p className="my-3 fwbold text-uppercase" style={fs13}>{profile.clinic_name}</p>
                                <p className="my-0" style={fs9}>{profile.address}</p>
                                <p className="my-0" style={fs9}>Telp. : {profile.phone}</p>
                            </div>
                            <div className="col-4 px-0">
                                <p className="fwbold text-right text-uppercase fs28" style={invoice}>Mutasi Piutang</p>
                                <p className="fw600 text-right text-uppercase fs14" style={invoice2}></p>
                            </div>
                            <div className="col-12" style={borderStyle} />
                        </div>
                        <table className="fs12" style={row2}>
                            <thead className="text-uppercase" style={thead}>
                                <tr className="text-center">
                                    <th className="fw700 py-2" width="62px">ID Pemilik</th>
                                    <th className="fw700 py-2" width="63px">Nama Pemilik</th>
                                    <th className="fw700 py-2" width="63px">Awal</th>
                                    <th className="fw700 py-2" width="63px">Debit</th>
                                    <th className="fw700 py-2" width="63px">Credit</th>
                                    <th className="fw700 py-2" width="63px">Akhir</th>
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

class PDFListPage extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        var data = this.props.data
        var page_dimension = { width: 559, minHeight: 794, top: 0, right: 0, background: '#FFF', color: '#000', zIndex: -1 }
        var row2 = { width: '100%' }
        var fs9 = { fontSize: 9 }
        var table_rows = []

        data.forEach((d, index) => {
            table_rows.push(
                <tr key={d.name} style={fs9} className="text-center">
                    <td className="py-1">{d.name}</td>
                    <td className="py-1">{d.owner_name}</td>
                    <td className="py-1">{formatter2.format(d.awal)}</td>
                    <td className="py-1">{formatter2.format(d.debit)}</td>
                    <td className="py-1">{formatter2.format(d.credit)}</td>
                    <td className="py-1">{formatter2.format(d.akhir)}</td>
                </tr>
            )
        })

        return (
            <div className="position-absolute d-none" style={page_dimension}>
                <div id={"pdf-"+this.props.pdfPage} className="px-4" style={page_dimension}>
                    <table className="fs12" style={row2}>
                        <tbody>
                            {table_rows}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }
}

ReactDOM.render(<MutasiPiutang />, document.getElementById('mutasi_piutang_list'))