class Rabies extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': [],
            'loaded': true,
            'currentpage': 1,
            'search': '',
            'datalength': 0,
            'mode': 'monthly',
            'month': moment().format('MM'),
            'month_to': moment().format('MM'),
            'year': moment().format('YYYY'),
            'print_loading': false,
            'print_data': [],
            'period_label': '',
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
                    td.setState({ 'list_year': r.message });
                }
            }
        });

        sessionStorage.setItem(window.location.pathname, JSON.stringify({ filters: [], sorts: [] }))
        this.setFilter()
    }

    filterChange(e) {
        this.setState({ [e.target.name]: e.target.value })
    }

    setMode(e) {
        this.setState({ 'mode': e.target.value })
    }

    getDateRange() {
        var mode = this.state.mode
        var year = this.state.year
        var month = this.state.month
        var month_to = this.state.month_to

        if (!year) {
            return { error: 'Tahun harus dipilih' }
        }

        if (mode == 'annual') {
            return {
                min_date: year + '-01-01',
                max_date: year + '-12-31',
                label: 'Tahun ' + year,
                title: 'Annual-' + year,
            }
        }

        if (!month || (mode == 'period' && !month_to)) {
            return { error: 'Bulan harus dipilih' }
        }

        var start = moment(year + '-' + month, 'YYYY-MM')

        if (mode == 'period') {
            var end = moment(year + '-' + month_to, 'YYYY-MM')
            if (end.isBefore(start)) {
                return { error: 'Bulan akhir tidak boleh sebelum bulan awal' }
            }
            return {
                min_date: start.format('YYYY-MM-DD'),
                max_date: end.endOf('month').format('YYYY-MM-DD'),
                label: start.format('MMMM') + ' s/d ' + end.format('MMMM YYYY'),
                title: 'Periode-' + start.format('MM') + '-' + end.format('MM-YYYY'),
            }
        }

        return {
            min_date: start.format('YYYY-MM-DD'),
            max_date: start.clone().endOf('month').format('YYYY-MM-DD'),
            label: start.format('MMMM YYYY'),
            title: 'Monthly-' + start.format('MM-YYYY'),
        }
    }

    loadData(filters) {
        var td = this

        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetrekammedis.vetrekammedis.get_rabies",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    td.setState({ 'data': r.message.data, 'loaded': true, 'datalength': r.message.datalength });
                }
            }
        });
    }

    paginationClick(number) {
        var filters = JSON.parse(sessionStorage.getItem(window.location.pathname))

        this.setState({
            currentpage: Number(number),
            loaded: false,
        });

        filters['currentpage'] = Number(number)
        sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))
        this.loadData(filters)
    }

    setFilter() {
        var range = this.getDateRange()

        if (range.error) {
            frappe.msgprint(range.error);
            return
        }

        var filters = JSON.parse(sessionStorage.getItem(window.location.pathname))
        filters['currentpage'] = 1
        filters['search'] = this.state.search
        filters['min_date'] = range.min_date
        filters['max_date'] = range.max_date
        filters['label'] = range.label
        filters['title'] = range.title
        sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))

        this.setState({ 'loaded': false, 'currentpage': 1 })
        this.loadData(filters)
    }

    getPrintData(is_excel=false) {
        var td = this
        var filters = JSON.parse(sessionStorage.getItem(window.location.pathname))

        if (this.state.print_loading) {
            return
        }

        if (!filters.min_date) {
            frappe.msgprint('Klik Set terlebih dahulu');
            return
        }

        this.setState({ print_loading: true })
        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetrekammedis.vetrekammedis.get_rabies",
            args: { filters: filters, all: 1 },
            callback: function (r) {
                if (r.message) {
                    td.setState({ 'print_data': r.message.data, 'period_label': filters.label }, function () {
                        td.printPDF(filters.title, is_excel)
                    });
                } else {
                    td.setState({ print_loading: false })
                }
            }
        });
    }

    printPDF(period_title, is_excel=false) {
        var title = 'LaporanRabies-' + period_title

        if (is_excel) {
            var elt = document.getElementById('excel_page');
            var wb = XLSX.utils.table_to_book(elt, {
                sheet: "sheet1",
                raw: true,
            });
            var sheet = wb.Sheets[wb.SheetNames[0]];

            var sheetcols = [
                {wpx:90},
                {wpx:90},
                {wpx:90},
                {wpx:90},
            ];

            sheet['!cols'] = sheetcols;

            XLSX.writeFile(wb, title + '.xlsx');
            this.setState({print_loading: false});
        } else {
            var td = this
            var pdfid = 'pdf'
            var source = document.getElementById(pdfid)
            var opt = {
                margin: [10, 0, 10, 0],
                filename: title + ".pdf",
                pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', '.row'] },
                html2canvas: { scale: 3 },
                jsPDF: { orientation: 'p', unit: 'pt', format: [559 * 0.754, 794 * 0.754] }
            }
            html2pdf().set(opt).from(source).save().then(function () {
                td.setState({ print_loading: false })
            })
        }
    }

    render() {

        var row_style2 = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '16px 24px', 'marginBottom': '18px' }
        var formStyle = { border: '1px solid #397DA6', color: '#397DA6' }
        var month_options = [<option className="d-none" key="99999"></option>]
        var year_options = [<option className="d-none" key="99999"></option>]

        var i
        for (i = 0; i <= 11; i++) {
            var moment_month = moment(i + 1, 'M')
            month_options.push(<option key={moment_month.format('MM')} value={moment_month.format('MM')}>{moment_month.format('MMMM')}</option>)
        }

        this.state.list_year.forEach(function(e, index) {
            year_options.push(<option key={e} value={e}>{e}</option>)
        })

        var filter_item = "mr-2 my-1"
        var width_search = { width: 200 }
        var width_mode = { width: 120 }
        var width_month = { width: 140 }
        var width_year = { width: 100 }
        var sd_style = { color: '#397DA6' }
        var month_select, month_to_select

        if (this.state.mode == 'monthly' || this.state.mode == 'period') {
            month_select = <div className={filter_item} style={width_month}>
                <select name="month" className="form-control fs12" style={formStyle} value={this.state.month} onChange={e => this.filterChange(e)}>
                    {month_options}
                </select>
            </div>
        }

        if (this.state.mode == 'period') {
            month_to_select = [
                <div key="sd" className={filter_item + " fs12 fw600"} style={sd_style}>s/d</div>,
                <div key="month_to" className={filter_item} style={width_month}>
                    <select name="month_to" className="form-control fs12" style={formStyle} value={this.state.month_to} onChange={e => this.filterChange(e)}>
                        {month_options}
                    </select>
                </div>
            ]
        }

        var print_class = "btn btn-outline-danger text-uppercase fs12 fwbold ml-2 my-1" + (this.state.print_loading ? " disabled" : "")
        var print_loading = <span><i className="fa fa-spin fa-circle-o-notch mr-2" />Loading...</span>

        var filter_bar = (
            <div className="d-flex flex-wrap align-items-center" style={row_style2}>
                <div className={filter_item} style={width_search}>
                    <input value={this.state.search || ''} className="form-control fs12" name="search" placeholder="Cari nama pemilik..." style={formStyle} onChange={e => this.setState({ search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' ? this.setFilter() : null} />
                </div>
                <div className={filter_item} style={width_mode}>
                    <select name="mode" className="form-control fs12" style={formStyle} value={this.state.mode} onChange={e => this.setMode(e)}>
                        <option value="monthly">Monthly</option>
                        <option value="annual">Annual</option>
                        <option value="period">Period</option>
                    </select>
                </div>
                {month_select}
                {month_to_select}
                <div className={filter_item} style={width_year}>
                    <select name="year" className="form-control fs12" style={formStyle} value={this.state.year} onChange={e => this.filterChange(e)}>
                        {year_options}
                    </select>
                </div>
                <div className="my-1">
                    <button type="button" className="btn btn-outline-danger text-uppercase fs12 fwbold" onClick={() => this.setFilter()}>Set</button>
                </div>
                <div className="ml-auto d-flex">
                    <button type="button" className={print_class} onClick={() => this.getPrintData()}>{this.state.print_loading ? print_loading : "Print"}</button>
                    <button type="button" className={print_class} onClick={() => this.getPrintData(true)}>{this.state.print_loading ? print_loading : "Print Excel"}</button>
                </div>
            </div>
        )

        var content
        if (this.state.loaded) {
            content = <RabiesList items={this.state.data} paginationClick={this.paginationClick} currentpage={this.state.currentpage} datalength={this.state.datalength} />
        } else {
            content = (
                <div className="row justify-content-center" key='0'>
                    <div className="col-10 col-md-8 text-center border rounded-lg py-4">
                        <p className="mb-0 fs24md fs16 fw600 text-muted">
                            <span><i className="fa fa-spin fa-circle-o-notch mr-3"></i>Loading...</span>
                        </p>
                    </div>
                </div>
            )
        }

        return (
            <div>
                {filter_bar}
                {content}
                <PDF data={this.state.print_data} period_label={this.state.period_label} />
                <ExcelPage data={this.state.print_data} period_label={this.state.period_label} />
            </div>
        )
    }
}

class RabiesList extends React.Component {
    render() {
        var rows = []
        var panel_style = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px' }
        var items = this.props.items

        if (items.length != 0) {
            items.forEach(function (item, index) {
                rows.push(
                    <RabiesListRow key={index.toString()} item={item} />
                )
            })

            return (
                <div style={panel_style}>
                    <div className="row mx-0">
                        <div className="col row-header">
                            <div className="row mx-0 fs12 fw600">
                                <div className="col text-center">
                                    <span>Tanggal</span>
                                </div>
                                <div className="col text-center">
                                    <span>Nama Hewan</span>
                                </div>
                                <div className="col text-center">
                                    <span>Nama Pemilik</span>
                                </div>
                                <div className="col text-center">
                                    <span>Alamat</span>
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

class RabiesListRow extends React.Component {
    render() {

        var item = this.props.item

        return (
            <div className="row mx-0">
                <div className="col row-list row-list-link">
                    <div className="row mx-0 fs12 fw600">
                        <div className="col text-center">
                            <span>{item.invoice_date}</span>
                        </div>
                        <div className="col text-center">
                            <span>{item.pet_name}</span>
                        </div>
                        <div className="col text-center">
                            <span>{item.owner_name}</span>
                        </div>
                        <div className="col text-center">
                            <span>{item.address}</span>
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
                    <td className="py-1">{d.invoice_date}</td>
                    <td className="py-1">{d.pet_name}</td>
                    <td className="py-1">{d.owner_name}</td>
                    <td className="py-1">{d.address}</td>
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
                                <p className="fwbold text-right text-uppercase fs28" style={invoice}>Laporan Rabies</p>
                                <p className="text-right my-0" style={fs9}>{this.props.period_label}</p>
                            </div>
                            <div className="col-12" style={borderStyle} />
                        </div>
                        <table className="fs12" style={row2}>
                            <thead className="text-uppercase" style={thead}>
                                <tr className="text-center">
                                    <th className="fw700 py-2">Tanggal</th>
                                    <th className="fw700 py-2">Nama Hewan</th>
                                    <th className="fw700 py-2">Nama Pemilik</th>
                                    <th className="fw700 py-2">Alamat</th>
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

class ExcelPage extends React.Component {
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
                    <td className="py-1">{d.invoice_date}</td>
                    <td className="py-1">{d.pet_name}</td>
                    <td className="py-1">{d.owner_name}</td>
                    <td className="py-1">{d.address}</td>
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
                <table id="excel_page" border="1" className="position-absolute d-none">
                    <thead className="text-uppercase" style={thead}>
                        <tr>
                            <td rowspan="3">{image}</td>
                            <td colspan="3">{profile.clinic_name}</td>
                            <td colspan="2">Laporan Rabies {this.props.period_label}</td>
                        </tr>
                        <tr></tr>
                        <tr></tr>
                        <tr className="text-center">
                            <th className="fw700 py-2">Tanggal</th>
                            <th className="fw700 py-2">Nama Hewan</th>
                            <th className="fw700 py-2">Nama Pemilik</th>
                            <th className="fw700 py-2">Alamat</th>
                        </tr>
                    </thead>
                    <tbody>
                        {table_rows}
                    </tbody>
                </table>
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

ReactDOM.render(<Rabies />, document.getElementById('rabies_list'))