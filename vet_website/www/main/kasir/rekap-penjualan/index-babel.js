class RekapPenjualan extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': [],
            'loaded': true,
            'currentpage': 1,
            'search': false,
            'datalength': 0,
            'month': '',
            'year': '',
            'print_loading': false,
            'print_data': [],
            'list_year': []
        }

        this.setFilter = this.setFilter.bind(this);
        this.paginationClick = this.paginationClick.bind(this);
    }

    componentDidMount() {
        var td = this

        frappe.call({
            type: "GET",
            method: "vet_website.methods.get_list_year",
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    td.setState({ 'list_year': r.message });
                }
            }
        });

        sessionStorage.setItem(window.location.pathname, JSON.stringify({ filters: [], sorts: [] }))
    }

    filterChange(e) {
        var th = this
        var name = e.target.name
        var value = e.target.value
        if (name == 'month') {
            var invoice_date
            this.setState({ month: value })
            invoice_date = moment(this.state.year + '-' + value, 'YYYY-MM').add(1, 'month').format('YYYY-MM-DD')
            th.setState({ invoice_date: invoice_date })
        } else if (name == 'year') {
            var invoice_date
            this.setState({ year: value })
            if (this.state.mode == 'annual') {
                invoice_date = moment(value + '-12-31', 'YYYY-MM-DD').format('YYYY-MM-DD')
            } else {
                invoice_date = moment(value + '-' + this.state.month, 'YYYY-MM').add(1, 'month').format('YYYY-MM-DD')
            }

            th.setState({ invoice_date: invoice_date })
        }
    }

    setMode(e) {
        var th = this
        var mode = e.target.value
        th.setState({ 'mode': mode, 'month': '', 'year': '' })
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
            method: "vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.get_rekap_penjualan",
            args: { filters: filters, mode: td.state.mode, },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message)
                    td.setState({ 'data': r.message.data, 'loaded': true, 'datalength': r.message.datalength });
                }
            }
        });
    }

    setFilter(filters = false) {
        var td = this
        if (!filters) {
            filters = JSON.parse(sessionStorage.getItem(window.location.pathname))
        }
        console.log(this.state.mode)
        console.log(this.state.month)
        console.log(this.state.year)
        console.log(this.state.invoice_date)
        console.log(this.state.gudang)
        if ((((this.state.mode == 'monthly' || this.state.mode == 'period') && this.state.month != '') || (this.state.mode == 'annual')) && this.state.year != '') {
            td.setState({ 'loaded': false, 'currentpage': 1 })
            filters['currentpage'] = 1
            filters['search'] = this.state.search
            filters['invoice_date'] = this.state.invoice_date
            sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))
            console.log(filters)
            frappe.call({
                type: "GET",
                method: "vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.get_rekap_penjualan",
                args: { filters: filters, mode: td.state.mode, },
                callback: function (r) {
                    if (r.message) {
                        console.log(r.message)
                        td.setState({ 'data': r.message.data, 'loaded': true, 'datalength': r.message.datalength });
                    }
                }
            });
        } else {
            frappe.msgprint(('Month or Year must be selected'));
        }
    }

    getPrintData() {
        var td = this

        if (!this.state.print_loading) {
            this.setState({ print_loading: true })
            if ((((this.state.mode == 'monthly' || this.state.mode == 'period') && this.state.month != '') || (this.state.mode == 'annual')) && this.state.year != '') {
                frappe.call({
                    type: "GET",
                    method: "vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.get_rekap_penjualan",
                    args: { filters: JSON.parse(sessionStorage.getItem(window.location.pathname)), mode: td.state.mode, all: 1 },
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
            } else {
                frappe.msgprint(('Month or Year must be selected'));
            }
        }
    }

    printPDF() {
        var title = 'RekapPenjualan-'
        var filters = JSON.parse(sessionStorage.getItem(window.location.pathname))

        if (filters.invoice_date != undefined && this.state.mode != undefined) {
            if (this.state.mode == 'monthly') {
                var bulan = moment(this.state.year + '-' + this.state.month, 'YYYY-MM').format('MM-YYYY')
                console.log(bulan)
                title += 'Monthly-' + bulan
            } else if (this.state.mode == 'annual') {
                title += 'Annual-' + moment(filters.invoice_date).format('YYYY')
            } else if (this.state.mode == 'period') {
                var sampai_bulan = moment(this.state.year + '-' + this.state.month, 'YYYY-MM').format('MM-YYYY')
                title += 'Periode-' + sampai_bulan
            }
        }

        var pdfid = 'pdf'
        var source = document.getElementById(pdfid)
        var opt = {
            margin: [10, 0, 10, 0],
            filename: title + ".pdf",
            pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', '.row'] },
            html2canvas: { scale: 3 },
            jsPDF: { orientation: 'p', unit: 'pt', format: [559 * 0.754, 794 * 0.754] }
        }
        html2pdf().set(opt).from(source).save()
        this.setState({ print_loading: false })
    }

    render() {

        var row_style2 = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px', 'height': '72px' }
        var formStyle = { border: '1px solid #397DA6', color: '#397DA6' }
        var month_options = [<option className="d-none" key="99999"></option>]
        var year_options = [<option className="d-none" key="99999"></option>]

        var i
        for (i = 0; i <= 11; i++) {
            var moment_month = moment(i + 1, 'M')
            month_options.push(<option key={moment_month.format('MM')} value={moment_month.format('MM')}>{moment_month.format('MMMM')}</option>)
        }

        this.state.list_year.forEach(function(e, index) {
            year_options.push(<option key={e}>{e}</option>)
        })

        if (this.state.loaded) {
            var month_select, sd_period

            if (this.state.mode == 'monthly' || this.state.mode == 'period') {

                if (this.state.mode == 'period') {
                    sd_period = <div className="col-auto my-auto mx-auto">
                        s/d
                    </div>
                }

                month_select = <div className="col-2 my-auto">
                    <select name="month" placeholder="Month" className="form-control" value={this.state.month} onChange={e => this.filterChange(e)}>
                        {month_options}
                    </select>
                </div>
            }

            return (
                <div>
                    <div className="row mx-0" style={row_style2}>
                        <div className="col-auto my-auto">
                            <button type="button" className={this.state.print_loading ? "btn btn-outline-danger disabled text-uppercase fs12 fwbold mx-2" : "btn btn-outline-danger text-uppercase fs12 fwbold mx-2"} onClick={() => this.getPrintData()}>{this.state.print_loading ? (<span><i className="fa fa-spin fa-circle-o-notch mr-3" />Loading...</span>) : "Print"}</button>
                        </div>
                        <div className="col-2 my-auto">
                            <input value={this.state.search || ''} className="form-control fs12" name="search" placeholder="Search..." style={formStyle} onChange={e => this.setState({ search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' ? this.setFilter(JSON.parse(sessionStorage.getItem(window.location.pathname))) : null} />
                        </div>
                        <div className="col-2 my-auto">
                            <select name="mode" placeholder="Periode" className="form-control" value={this.state.mode} onChange={e => this.setMode(e)}>
                                <option className="d-none" key="99999"></option>
                                <option value="monthly">Monthly</option>
                                <option value="annual">Annual</option>
                                <option value="period">Period</option>
                            </select>
                        </div>
                        {sd_period}
                        {month_select}
                        <div className="col-2 my-auto">
                            <select name="year" placeholder="Year" className="form-control" value={this.state.year} onChange={e => this.filterChange(e)}>
                                {year_options}
                            </select>
                        </div>
                        <div className="col-2 my-auto">
                            <button type="button" className="btn btn-outline-danger text-uppercase fs12 fwbold" onClick={() => this.setFilter()}>Set</button>
                        </div>
                    </div>
                    <RekapPenjualanList items={this.state.data} paginationClick={this.paginationClick} currentpage={this.state.currentpage} datalength={this.state.datalength} />
                    <PDF data={this.state.print_data} />
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

class RekapPenjualanList extends React.Component {
    render() {
        var rows = []
        var panel_style = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px' }
        var items = this.props.items

        if (items.length != 0) {
            items.forEach(function (item, index) {
                rows.push(
                    <RekapPenjualanListRow key={index.toString()} item={item} />
                )
            })

            return (
                <div style={panel_style}>
                    <div className="row mx-0">
                        <div className="col row-header">
                            <div className="row mx-0 fs12 fw600">
                                <div className="col text-center">
                                    <span>No Invoice</span>
                                </div>
                                <div className="col text-center">
                                    <span>Tanggal</span>
                                </div>
                                <div className="col text-center">
                                    <span>ID Pemilik</span>
                                </div>
                                <div className="col text-center">
                                    <span>Nama Pemilik</span>
                                </div>
                                <div className="col text-center">
                                    <span>Jumlah Item</span>
                                </div>
                                <div className="col text-center">
                                    <span>Sub Total</span>
                                </div>
                                <div className="col text-center">
                                    <span>Total Akhir</span>
                                </div>
                                <div className="col text-center">
                                    <span>Terbayar</span>
                                </div>
                                <div className="col text-center">
                                    <span>Sisa</span>
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

class RekapPenjualanListRow extends React.Component {
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
                            <span>{moment(item.is_refund ? item.refund_date : item.invoice_date).format("YYYY-MM-DD HH:mm:ss")}</span>
                        </div>
                        <div className="col text-center">
                            <span>{item.owner}</span>
                        </div>
                        <div className="col text-center">
                            <span>{item.owner_name}</span>
                        </div>
                        <div className="col text-center">
                            <span>{item.all_quantity}</span>
                        </div>
                        <div className="col text-center">
                            <span>{formatter2.format((item.all_subtotal || item.subtotal))}</span>
                        </div>
                        <div className="col text-center">
                            <span>{formatter2.format((item.all_total || item.total))}</span>
                        </div>
                        <div className="col text-center">
                            <span>{formatter2.format(item.paid)}</span>
                        </div>
                        <div className="col text-center">
                            <span>{formatter2.format(item.remaining)}</span>
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
                    <td className="py-1">{moment(d.is_refund ? d.refund_date : d.invoice_date).format("YYYY-MM-DD HH:mm:ss")}</td>
                    <td className="py-1">{d.owner}</td>
                    <td className="py-1">{d.owner_name}</td>
                    <td className="py-1">{d.all_quantity}</td>
                    <td className="py-1">{formatter2.format(d.subtotal)}</td>
                    <td className="py-1">{formatter2.format(d.total)}</td>
                    <td className="py-1">{formatter2.format(d.paid)}</td>
                    <td className="py-1">{formatter2.format(d.remaining)}</td>
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
                                {image}
                            </div>
                            <div className="col-6">
                                <p className="my-3 fwbold text-uppercase" style={fs13}>{profile.clinic_name}</p>
                                <p className="my-0" style={fs9}>{profile.address}</p>
                                <p className="my-0" style={fs9}>Telp. : {profile.phone}</p>
                            </div>
                            <div className="col-4 px-0">
                                <p className="fwbold text-right text-uppercase fs28" style={invoice}>Rekap Penjualan</p>
                            </div>
                            <div className="col-12" style={borderStyle} />
                        </div>
                        <table className="fs12" style={row2}>
                            <thead className="text-uppercase" style={thead}>
                                <tr className="text-center">
                                    <th className="fw700 py-2">No Invoice</th>
                                    <th className="fw700 py-2">Tanggal</th>
                                    <th className="fw700 py-2">ID Pemilik</th>
                                    <th className="fw700 py-2">Nama Pemilik</th>
                                    <th className="fw700 py-2">Jumlah Item</th>
                                    <th className="fw700 py-2">Sub Total</th>
                                    <th className="fw700 py-2">Total Akhir</th>
                                    <th className="fw700 py-2">Terbayar</th>
                                    <th className="fw700 py-2">Sisa</th>
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

ReactDOM.render(<RekapPenjualan />, document.getElementById('rekap_penjualan_list'))