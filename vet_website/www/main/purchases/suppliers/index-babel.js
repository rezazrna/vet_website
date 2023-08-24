class Suppliers extends React.Component {
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
        this.checkRow = this.checkRow.bind(this);
        this.deleteRow = this.deleteRow.bind(this);
        this.paginationClick = this.paginationClick.bind(this);
        this.supplierSearch = this.supplierSearch.bind(this);
    }

    componentDidMount() {
        var td = this
        var filters

        console.log(document.referrer)
        // console.log(document.referrer.includes('/main/penerimaan/penerimaan-pasien/detail'))

        if (sessionStorage.getItem(window.location.pathname) != null && document.referrer.includes('/main/purchases/suppliers/edit')) {
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
            method: "vet_website.vet_website.doctype.vetsupplier.vetsupplier.get_supplier_list",
            args: { filters: filters },
            callback: function (r) {
                console.log(r.message)
                if (r.message) {
                    td.setState({ 'data': r.message.supplier, 'loaded': true, 'datalength': r.message.datalength });
                }
            }
        });
    }

    supplierSearch(filters) {
        var po = this
        this.setState({
            currentpage: 1,
            loaded: false,
        });

        filters['currentpage'] = 1
        filters['search'] = this.state.search
        sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))

        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetsupplier.vetsupplier.get_supplier_list",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'data': r.message.supplier, 'loaded': true, 'datalength': r.message.datalength });
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
            method: "vet_website.vet_website.doctype.vetsupplier.vetsupplier.get_supplier_list",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'data': r.message.supplier, 'loaded': true, 'datalength': r.message.datalength });
                }
            }
        });
        // }
    }

    deleteRow(e) {
        e.preventDefault();
        var po = this
        var delete_data = this.state.data.filter((d) => d.checked)
        var delete_data_names = delete_data.map((d) => d.name)
        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetsupplier.vetsupplier.delete_supplier",
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
            filename: "Supplier-" + moment().format('MM-YYYY') + ".pdf",
            pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', '.row'] },
            html2canvas: { scale: 3 },
            jsPDF: { orientation: 'p', unit: 'pt', format: [559 * 0.754, 794 * 0.754] }
        }
        // html2pdf().set(opt).from(source).save()
        html2pdf().set(opt).from(source).toPdf().get('pdf').then(function (pdfObj) {
            // pdfObj has your jsPDF object in it, use it as you please!
            // For instance (untested):
            pdfObj.autoPrint();
            window.open(pdfObj.output('bloburl'), '_blank');
        });
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
        var row_style2 = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px', 'height': '72px' }
        var formStyle = { border: '1px solid #397DA6', color: '#397DA6' }
        var delete_button

        var sorts = [
            // 	{'label': 'Tanggal Buat DESC', 'value': 'creation desc'},
            // 	{'label': 'Tanggal Buat ASC', 'value': 'creation asc'},
            { 'label': 'Nama Supplier DESC', 'value': 'supplier_name desc' },
            { 'label': 'Nama Supplier ASC', 'value': 'supplier_name asc' },
            { 'label': 'Deposit DESC', 'value': 'credit desc' },
            { 'label': 'Deposit ASC', 'value': 'credit asc' },
            { 'label': 'Hutang DESC', 'value': 'debt desc' },
            { 'label': 'Hutang ASC', 'value': 'debt asc' },
        ]

        var field_list = [
            { 'label': 'Nama Supplier', 'field': 'supplier_name', 'type': 'char' },
            { 'label': 'Alamat', 'field': 'address', 'type': 'char' },
            //  {'label': 'Phone', 'field': 'phone', 'type': 'char'},
            //  {'label': 'Email', 'field': 'email', 'type': 'char'},
            //  {'label': 'Tanggal Buat', 'field': 'creation', 'type': 'date'},
            { 'label': 'Deposit', 'field': 'credit', 'type': 'int' },
            { 'label': 'Hutang', 'field': 'debt', 'type': 'int' },
        ]

        if (this.state.show_delete) {
            delete_button = <button className="btn btn-outline-danger text-uppercase fs12 fwbold" onClick={this.deleteRow}>Hapus</button>
        }

        if (this.state.loaded) {
            return (
                <div>
                    <div className="row mx-0" style={row_style2}>
                        <div className="col-auto my-auto">
                            <a href="/main/purchases/suppliers/form" className="btn btn-outline-danger text-uppercase fs12 fwbold"><i className="fa fa-plus mr-2" />Tambah</a>
                            {delete_button}
                            <button type="button" className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={() => this.printPDF()}>Print</button>
                        </div>
                        <div className="col">
                            <input value={this.state.search || ''} className="form-control fs12" name="search" placeholder="Search..." style={formStyle} onChange={e => this.setState({ search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' ? this.supplierSearch(JSON.parse(sessionStorage.getItem(window.location.pathname))) : null} />
                        </div>
                        <div className="col-7">
                            <Filter sorts={sorts} searchAction={this.supplierSearch} field_list={field_list} filters={JSON.parse(sessionStorage.getItem(window.location.pathname))} />
                        </div>
                    </div>
                    <SupplierGrid items={this.state.data} checkRow={this.checkRow} checkAll={() => this.checkAll()} check_all={this.state.check_all} paginationClick={this.paginationClick} currentpage={this.state.currentpage} datalength={this.state.datalength} />
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

class SupplierGrid extends React.Component {
    render() {
        // var search = this.props.search
        // function filterRow(row){
        //     function filterField(field){
        //         return field?field.toString().toLowerCase().includes(search.toLowerCase()):false
        //     }
        //     var fields = [row.supplier_name, row.address, row.debt, row.credit]
        //     return ![false,''].includes(search)?fields.some(filterField):true
        // }
        var cols = []
        var items = this.props.items

        if (items.length != 0) {
            var list = this
            // const indexOfLastTodo = this.props.currentpage * 30;
            // const indexOfFirstTodo = indexOfLastTodo - 30;
            // var currentItems
            // ![false,''].includes(search)?
            // currentItems = items.filter(filterRow).slice(indexOfFirstTodo, indexOfLastTodo):
            // currentItems = items.slice(indexOfFirstTodo, indexOfLastTodo)

            items.forEach(function (item, index) {
                // if (currentItems.includes(item)){
                cols.push(
                    <SupplierGridCol key={index.toString()} item={item} checkRow={() => list.props.checkRow(index)} />
                )
                // }
            })

            return (
                <div>
                    <div className="row mx-0">
                        {cols}
                    </div>
                    <Pagination paginationClick={this.props.paginationClick} datalength={this.props.datalength} currentpage={this.props.currentpage} itemperpage='10' />
                </div>
            )
        }
        else {
            return (
                <div>
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

class SupplierGridCol extends React.Component {
    // clickRow() {
    //     var pathname = "/main/purchases/suppliers/edit?n=" + this.props.item.name
    //     window.location = pathname
    // }

    // goToCredit(e, mode) {
    //     e.preventDefault()
    //     mode == 'debt' ? window.location.href = '/main/purchases/hutang?n=' + encodeURIComponent(this.props.item.name) :
    //         mode == 'credit' ? window.location.href = '/main/purchases/deposit?n=' + encodeURIComponent(this.props.item.name) :
    //             false
    // }

    render() {
        var panel_style = { height: '100%', minHeight: '215px', background: '#FFFFFF', color: '#056EAD', boxShadow: '0px 10px 40px rgba(0, 0, 0, 0.1)', borderRadius: '18px' }
        var cursor = { cursor: 'pointer' }
        var div_image_style = { position: 'relative', width: '100%', paddingTop: '100%', background: '#F1F1F1', filter: 'drop-shadow(0px 2px 15px rgba(0, 0, 0, 0.15))', backgroundImage: "url('/static/img/main/menu/product-no-image.png')", backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }
        var item = this.props.item
        var checked = false

        if (item.checked) {
            checked = true
        }

        var image
        if (item.image) {
            var image_style = { position: 'absolute', top: 0, left: 0, objectFit: 'cover', height: '100%' }
            image = <img src={item.image} style={image_style} />
        }

        return (
            <div className="col-4 mb-5">
                <div style={panel_style} className="text-center p-4 row mx-0">
                    <div className="col-12 mb-auto pb-4 d-flex text-truncate">
                        <input type="checkbox" className="my-auto mr-auto" checked={checked} onChange={this.props.checkRow} />
                        <a href={"/main/purchases/suppliers/edit?n=" + this.props.item.name}><span className="fs16 fwbold text-uppercase mr-auto" title={item.supplier_name} style={cursor} >{item.supplier_name}</span></a>
                    </div>
                    <div className="col-12 my-auto">
                        <div className="row">
                            <div className="col-4">
                                <div style={div_image_style}>
                                    {image}
                                </div>
                            </div>
                            <div className="col-8 my-auto">
                                <div className="row text-left mb-2">
                                    <div className="col-auto" style={cursor} onClick={() => window.location.href = "/main/purchases/purchase-order?supplier=" + item.name}>
                                        <p><img className="pr-2" src="/static/img/main/menu/purchases_blue.png"></img>{item.purchase_count}</p>
                                    </div>
                                    <div className="col-auto" style={cursor} onClick={() => window.location.href = "/main/purchases/purchase-order?supplier=" + item.name + "&unpaid=1"}>
                                        <p><img className="pr-2" src="/static/img/main/menu/invoice_blue.png"></img>{item.unpaid_purchase_count}</p>
                                    </div>
                                </div>
                                <div className="row text-left mb-2">
                                    <a className="col-auto fs14" href={'/main/purchases/deposit?n=' + encodeURIComponent(this.props.item.name)} style={cursor}>
                                        {'Deposit : ' + formatter.format(item.credit)}
                                    </a>
                                </div>
                                <div className="row text-left mb-2">
                                    <a className="col-auto fs14" href={'/main/purchases/hutang?n=' + encodeURIComponent(this.props.item.name)} style={cursor}>
                                        {'Hutang : ' + formatter.format(item.debt)}
                                    </a>
                                </div>
                                <div className="row text-left mb-2">
                                    <div className="col-auto fs14 text-uppercase">
                                        {item.address}
                                    </div>
                                </div>
                            </div>
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
        // currentItems = data.filter(filterRow).slice(indexOfFirstTodo, indexOfLastTodo):
        // currentItems = data.slice(indexOfFirstTodo, indexOfLastTodo)
        // currentItems = data.slice(0,30)
        data.forEach((d, index) => {
            table_rows.push(
                <tr key={d.name} style={fs9} className="text-center">
                    <td className="py-1">{d.supplier_name}</td>
                    <td className="py-1">{d.purchase_count}</td>
                    <td className="py-1">{d.unpaid_purchase_count}</td>
                    <td className="py-1">{formatter.format(d.credit)}</td>
                    <td className="py-1">{formatter.format(d.debt)}</td>
                    <td className="py-1">{d.description || '-'}</td>
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
                                {/* <img className="mt-3" src="/static/img/main/menu/naturevet_logo_2x.png"/> */}
                            </div>
                            <div className="col-6">
                                <p className="my-3 fwbold text-uppercase" style={fs13}>{profile.clinic_name}</p>
                                <p className="my-0" style={fs9}>{profile.address}</p>
                                <p className="my-0" style={fs9}>Telp. : {profile.phone}</p>
                            </div>
                            <div className="col-4 px-0">
                                <p className="fwbold text-right text-uppercase fs28" style={invoice}>Suppliers</p>
                                {/*<p className="fw600 text-right text-uppercase fs14" style={invoice2}>{moment().format("MM/YYYY")}</p>*/}
                            </div>
                            <div className="col-12" style={borderStyle} />
                        </div>
                        <table className="fs12" style={row2}>
                            <thead className="text-uppercase" style={thead}>
                                <tr className="text-center">
                                    <th className="fw700 py-2" width="75px">Nama Supplier</th>
                                    <th className="fw700 py-2" width="55px">Purchase</th>
                                    <th className="fw700 py-2" width="55px">Invoice</th>
                                    <th className="fw700 py-2" width="95px">Deposit</th>
                                    <th className="fw700 py-2" width="95px">Hutang</th>
                                    <th className="fw700 py-2" width="182px">Keterangan</th>
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

ReactDOM.render(<Suppliers />, document.getElementById('suppliers_list'))