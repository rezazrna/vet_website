class PenjualanProduk extends React.Component {
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
            'list_year': [],
            'list_tags': [],
            'tag': '',
            'mode': '',
        }

        this.setFilter = this.setFilter.bind(this);
        this.paginationClick = this.paginationClick.bind(this);
        this.toggleShowDetail = this.toggleShowDetail.bind(this);
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

        frappe.call({
            type: "GET",
            method: "vet_website.methods.get_list_tag",
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    td.setState({ 'list_tags': r.message });
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
        } else if (name == 'tag') {
            th.setState({'tag': value})
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
            method: "vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.get_penjualan_produk",
            args: { filters: filters, mode: td.state.mode, tag: td.state.tag},
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
                method: "vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.get_penjualan_produk",
                args: { filters: filters, mode: td.state.mode, tag: td.state.tag},
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

    toggleShowDetail(i){
        var new_data = this.state.data.slice()
        var value = false
        if([undefined, false].includes(new_data[i].show_detail)){
            value = true
        }
        new_data[i].show_detail = value
        this.setState({data: new_data})
    }

    getPrintData() {
        var td = this

        if (!this.state.print_loading) {
            this.setState({ print_loading: true })
            if ((((this.state.mode == 'monthly' || this.state.mode == 'period') && this.state.month != '') || (this.state.mode == 'annual')) && this.state.year != '') {
                frappe.call({
                    type: "GET",
                    method: "vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.get_penjualan_produk",
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
        var title = 'PenjualanProduk-'
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
        var month_options = [<option className="d-none" key="99999" value="" disabled hidden>Month</option>]
        var year_options = [<option className="d-none" key="99999" value="" disabled hidden>Year</option>]
        var tags_options = [<option className="d-none" key="99999" value="" disabled hidden>Product Tag</option>]

        var i
        for (i = 0; i <= 11; i++) {
            var moment_month = moment(i + 1, 'M')
            month_options.push(<option key={moment_month.format('MM')} value={moment_month.format('MM')}>{moment_month.format('MMMM')}</option>)
        }

        this.state.list_year.forEach(function(e, index) {
            year_options.push(<option key={e}>{e}</option>)
        })

        this.state.list_tags.forEach(function(e, index) {
            tags_options.push(<option key={e.name}>{e.name}</option>)
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

            // var page_data = this.state.data.slice((this.state.currentpage - 1) * 30, this.state.currentpage * 30)

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
                                <option className="d-none" key="99999" value="" disabled hidden>Type</option>
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
                            <select name="tag" placeholder="Product Tag" className="form-control" value={this.state.tag} onChange={e => this.filterChange(e)}>
                                {tags_options}
                            </select>
                        </div>
                        <div className="col-2 my-auto">
                            <button type="button" className="btn btn-outline-danger text-uppercase fs12 fwbold" onClick={() => this.setFilter()}>Set</button>
                        </div>
                    </div>
                    <PenjualanProdukList items={this.state.data} paginationClick={this.paginationClick} currentpage={this.state.currentpage} datalength={this.state.datalength} toggleShowDetail={this.toggleShowDetail} />
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

class PenjualanProdukList extends React.Component {
    render() {
        var rows = []
        var panel_style = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px' }
        var items = this.props.items

        if (items.length != 0) {
            var th = this
            items.forEach(function (item, index) {
                rows.push(
                    <PenjualanProdukListRow key={index.toString()} item={item} toggleShowDetail={() => th.props.toggleShowDetail(index.toString())}/>
                )
            })

            return (
                <div style={panel_style}>
                    <div className="row mx-0">
                        <div className="col row-header">
                            <div className="row mx-0 fs12 fw600">
                                <div className="col text-center">
                                    <span>Kode</span>
                                </div>
                                <div className="col text-center">
                                    <span>Nama</span>
                                </div>
                                <div className="col text-center">
                                    <span>Kategori</span>
                                </div>
                                <div className="col text-center">
                                    <span>Supplier</span>
                                </div>
                                <div className="col text-center">
                                    <span>Jumlah</span>
                                </div>
                                <div className="col text-center">
                                    <span>UOM</span>
                                </div>
                                <div className="col text-center">
                                    <span>Total Harga</span>
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

class PenjualanProdukListRow extends React.Component {
    render() {
        var cursor = {cursor: 'pointer'}
        var detail_style = {padding: '10px 0'}

        var item = this.props.item
        var chevron_class = "fa fa-chevron-down my-auto"
        var detail_group

        if (item.show_detail) {
            chevron_class = "fa fa-chevron-up my-auto"
            var rows = []
            if(item.detail != undefined){
                item.detail.forEach((i, index) => rows.push(<PenjualanDetailRow item={i} key={index.toString()}/>))
            }
            detail_group = (
                <div style={detail_style}>
                    {rows}
                </div>
            )
        }

        return (
            <div className="row mx-0" style={cursor} onClick={this.props.toggleShowDetail}>
                <div className="col">
                    <div className="row row-list row-list-link mx-0 fs12 fw600">
                        <div className="col text-center">
                            <span>{item.product}</span>
                        </div>
                        <div className="col text-center">
                            <span>{item.product_name}</span>
                        </div>
                        <div className="col text-center">
                            <span>{item.category_name}</span>
                        </div>
                        <div className="col text-center">
                            <span>{item.supplier_name}</span>
                        </div>
                        <div className="col text-center">
                            <span>{formatter2.format(item.quantity)}</span>
                        </div>
                        <div className="col text-center">
                            <span>{item.uom_name}</span>
                        </div>
                        <div className="col text-center">
                            <span>{formatter2.format(item.total)}</span>
                        </div>
                        <div className="col-auto d-flex">
                            <i className={chevron_class}/>
                        </div>
                    </div>
                    {detail_group}
                </div>
            </div>
        )
    }
}

class PenjualanDetailRow extends React.Component {
    render(){
        var item = this.props.item
        var cursor = {cursor: 'pointer'}
        
        return(
            <div className="row mx-1 fs12 fw600">
                <div className="col text-center">
                    <span>
                        {item.invoice_name}
                        <a href={'/main/kasir/customer-invoices/edit?n=' + item.invoice_name}><img src="/static/img/main/menu/tautan.png" className="mx-2" style={cursor}/></a>
                    </span>
                </div>
                <div className="col text-center">
                    <span>{item.pet_owner}</span>
                </div>
                <div className="col text-center">
                    <span>{item.pet}</span>
                </div>
                <div className="col text-center">
                    <span>{formatter2.format(item.quantity)}</span>
                </div>
                <div className="col text-center">
                    <span>{formatter2.format(item.total)}</span>
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
                    <td className="py-1">{d.product_name}</td>
                    <td className="py-1">{d.category_name}</td>
                    <td className="py-1">{d.supplier_name}</td>
                    <td className="py-1">{formatter2.format(d.quantity)}</td>
                    <td className="py-1">{d.uom_name}</td>
                    <td className="py-1">{formatter2.format(d.total)}</td>
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
                                <p className="fwbold text-right text-uppercase fs28" style={invoice}>Penjualan Produk</p>
                            </div>
                            <div className="col-12" style={borderStyle} />
                        </div>
                        <table className="fs12" style={row2}>
                            <thead className="text-uppercase" style={thead}>
                                <tr className="text-center">
                                    <th className="fw700 py-2">Kode</th>
                                    <th className="fw700 py-2">Nama</th>
                                    <th className="fw700 py-2">Kategori</th>
                                    <th className="fw700 py-2">Supplier</th>
                                    <th className="fw700 py-2">Jumlah</th>
                                    <th className="fw700 py-2">UOM</th>
                                    <th className="fw700 py-2">Total Harga</th>
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

ReactDOM.render(<PenjualanProduk />, document.getElementById('penjualan_produk_list'))