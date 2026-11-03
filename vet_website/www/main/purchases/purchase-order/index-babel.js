var product = getUrlParameter('product') || false
var supplier = getUrlParameter('supplier') || false
var unpaid = getUrlParameter('unpaid') == 1 ? 1 : 0
class PurchaseOrder extends React.Component {
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
            'status_list': [],
        }

        this.purchaseSearch = this.purchaseSearch.bind(this);
        this.checkRow = this.checkRow.bind(this);
        this.deleteRow = this.deleteRow.bind(this);
        this.paginationClick = this.paginationClick.bind(this);
    }

    componentDidMount() {
        var po = this
        var filters = {}

        console.log(document.referrer)
        // console.log(document.referrer.includes('/main/penerimaan/penerimaan-pasien/detail'))

        if (sessionStorage.getItem(window.location.pathname) != null && document.referrer.includes('/main/purchases/purchase-order/edit')) {
            filters = JSON.parse(sessionStorage.getItem(window.location.pathname))
        } else {
            filters = { filters: [], sorts: [] }
        }

        if (product) {
            filters.product = product
        }
        if (supplier) {
            filters.supplier = supplier
        }
        if (unpaid == 1) {
            filters.unpaid = unpaid
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
            method: "vet_website.vet_website.doctype.vetpurchase.vetpurchase.get_purchase_order_list",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'data': r.message.purchase, 'loaded': true, 'datalength': r.message.datalength, 'status_list': r.message.status_list.split('\n') });
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
            method: "vet_website.vet_website.doctype.vetpurchase.vetpurchase.get_purchase_order_list",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'data': r.message.purchase, 'loaded': true, 'datalength': r.message.datalength, 'status_list': r.message.status_list.split('\n') });
                }
            }
        });
        // }
    }

    purchaseSearch(filters) {
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
            method: "vet_website.vet_website.doctype.vetpurchase.vetpurchase.get_purchase_order_list",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'data': r.message.purchase, 'filter': true, 'datalength': r.message.datalength, 'loaded': true, 'status_list': r.message.status_list.split('\n') });
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
            method: "vet_website.vet_website.doctype.vetpurchase.vetpurchase.delete_purchase",
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
            filename: "PurchaseOrder-" + moment().format('MM-YYYY') + ".pdf",
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
        var status_options = []
        this.state.status_list.forEach(function (item) {
            status_options.push({'label': item, 'value': item})
        })

        var color = { color: '#056EAD', cursor: 'pointer' }
        var sorts = [
            { 'label': 'Tanggal DESC', 'value': 'order_date desc' },
            { 'label': 'Tanggal ASC', 'value': 'order_date asc' },
            { 'label': 'ID DESC', 'value': 'name desc' },
            { 'label': 'ID ASC', 'value': 'name asc' },
            { 'label': 'Supplier DESC', 'value': 'supplier_name desc' },
            { 'label': 'Supplier ASC', 'value': 'supplier_name asc' },
            // 	{'label': 'Tanggal buat DESC', 'value': 'creation desc'},
            // 	{'label': 'Tanggal buat ASC', 'value': 'creation asc'},
            { 'label': 'Total DESC', 'value': 'total desc' },
            { 'label': 'Total ASC', 'value': 'total asc' },
        ]

        var field_list = [
            { 'label': 'ID', 'field': 'name', 'type': 'char' },
            { 'label': 'Tanggal', 'field': 'order_date', 'type': 'date' },
            //  {'label': 'Refund Date', 'field': 'refund_date', 'type': 'date'},
            { 'label': 'Supplier', 'field': 'supplier_name', 'type': 'char' },
            { 'label': 'Paid', 'field': 'paid', 'type': 'int' },
            { 'label': 'Total', 'field': 'total', 'type': 'int' },
            //  {'label': 'Deliver To', 'field': 'deliver_to_name', 'type': 'char'},
            { 'label': 'Status', 'field': 'status', 'type': 'select', 'options': status_options },
        ]

        var delete_button
        if (this.state.show_delete) {
            delete_button = (
                <div className="col-auto">
                    <button className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={this.deleteRow}>Hapus</button>
                </div>
            )
        }
        var back_button
        if (supplier && document.referrer.includes('/main/purchases/suppliers')) {
            back_button = (
                <div className="col-auto">
                    <span className="fs16 fw600 mr-auto my-auto" style={color} onClick={() => { history.back() }}><i className="fa fa-chevron-left mr-1" style={color}></i>Back</span>
                </div>
            )
        }

        var print_button, pdf
        if (!product) {
            print_button = <button type="button" className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={() => this.printPDF()}>Print</button>
            pdf = <PDF data={this.state.data}/>
        }

        var row_style = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px' }
        var formStyle = { border: '1px solid #397DA6', color: '#397DA6' }
        if (this.state.loaded) {
            return (
                <div>
                    <div className="row mx-0" style={row_style}>
                        <div className="col-auto my-auto">
                            <div className="row">
                                {back_button}
                                <div className="col-auto">
                                    <a href="/main/purchases/purchase-order/form" className="btn btn-outline-danger text-uppercase fs12 fwbold"><i className="fa fa-plus mr-2" />Tambah</a>
                                </div>
                                {delete_button}
                                {print_button}
                            </div>
                        </div>
                        <div className="col">
                            <input value={this.state.search || ''} className="form-control fs12" name="search" placeholder="Search..." style={formStyle} onChange={e => this.setState({ search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' ? this.purchaseSearch(JSON.parse(sessionStorage.getItem(window.location.pathname))) : null} />
                        </div>
                        <div className="col-7">
                            <Filter sorts={sorts} searchAction={this.purchaseSearch} field_list={field_list} filters={JSON.parse(sessionStorage.getItem(window.location.pathname))} />
                        </div>
                    </div>
                    {pdf}
                    <PurchaseOrderList data={this.state.data} checkRow={this.checkRow} checkAll={() => this.checkAll()} check_all={this.state.check_all} filter={this.state.filter} currentpage={this.state.currentpage} paginationClick={this.paginationClick} datalength={this.state.datalength} />
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


class PurchaseOrderList extends React.Component {
    render() {
        // var search = this.props.search
        // function filterRow(row){
        //     function filterField(field){
        //         return field?field.toString().includes(search):false
        //     }
        //     var fields
        //     product?
        //     fields = [moment(row.is_refund == 1 ? row.refund_date : row.order_date).format("DD-MM-YYYY"), row.name, row.purchase_product.product_name, row.purchase_product.quantity, row.purchase_product.quantity_receive, row.purchase_product.uom_name, row.purchase_product.price, row.total, row.status]:
        //     fields = [moment(row.is_refund == 1 ? row.refund_date : row.order_date).format("DD-MM-YYYY"), row.name, row.supplier, row.paid, row.total, row.status]
        //     return ![false,''].includes(search)?fields.some(filterField):true
        // }

        var purchase_rows = []
        var panel_style = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px' }

        if (this.props.data.length != 0 || !this.props.filter) {
            var pol = this
            // const indexOfLastTodo = this.props.currentpage * 30;
            // const indexOfFirstTodo = indexOfLastTodo - 30;
            // var currentItems
            // ![false,''].includes(search)?
            // currentItems = this.props.data.filter(filterRow).slice(indexOfFirstTodo, indexOfLastTodo):
            // currentItems = this.props.data.slice(indexOfFirstTodo, indexOfLastTodo)
            this.props.data.forEach(function (item, index) {
                // if (currentItems.includes(item)){
                purchase_rows.push(
                    <PurchaseOrderListRow key={item.name} item={item} checkRow={() => pol.props.checkRow(index)} />
                )
                // }    
            })

            if (product) {
                return (
                    <div style={panel_style}>
                        <div className="row mx-0">
                            <div className="col-auto pl-2 pr-3">
                                <input type="checkbox" className="d-block my-3" checked={this.props.check_all} onChange={this.props.checkAll} />
                            </div>
                            <div className="col row-header">
                                <div className="row mx-0 fs12 fw600">
                                    <div className="col d-flex">
                                        <span className="my-auto">Tanggal</span>
                                    </div>
                                    <div className="col d-flex">
                                        <span className="my-auto">ID</span>
                                    </div>
                                    <div className="col d-flex">
                                        <span className="my-auto">Product</span>
                                    </div>
                                    <div className="col-1 d-flex">
                                        <span className="my-auto">Quantity</span>
                                    </div>
                                    <div className="col-1 d-flex">
                                        <span className="my-auto">Quantity Received</span>
                                    </div>
                                    <div className="col-1 d-flex">
                                        <span className="my-auto">UOM</span>
                                    </div>
                                    <div className="col d-flex">
                                        <span className="my-auto">Unit Price</span>
                                    </div>
                                    <div className="col d-flex">
                                        <span className="my-auto">Subtotal</span>
                                    </div>
                                    <div className="col-2 d-flex">
                                        <span className="m-auto">Status</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {purchase_rows}
                        <Pagination paginationClick={this.props.paginationClick} datalength={this.props.datalength} currentpage={this.props.currentpage} itemperpage='10' />
                    </div>
                )
            }
            else {
                return (
                    <div style={panel_style}>
                        <div className="row mx-0">
                            <div className="col-auto pl-2 pr-3">
                                <input type="checkbox" className="d-block my-3" checked={this.props.check_all} onChange={this.props.checkAll} />
                            </div>
                            <div className="col row-header">
                                <div className="row mx-0 fs12 fw600">
                                    <div className="col d-flex">
                                        <span className="my-auto">Tanggal</span>
                                    </div>
                                    <div className="col d-flex">
                                        <span className="my-auto">ID</span>
                                    </div>
                                    <div className="col d-flex">
                                        <span className="my-auto">Supplier</span>
                                    </div>
                                    <div className="col-2 d-flex">
                                        <span className="my-auto">Remaining</span>
                                    </div>
                                    <div className="col-2 d-flex">
                                        <span className="my-auto">Total</span>
                                    </div>
                                    <div className="col-2 d-flex">
                                        <span className="m-auto">Status</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {purchase_rows}
                        <Pagination paginationClick={this.props.paginationClick} datalength={this.props.datalength} currentpage={this.props.currentpage} itemperpage='10' />
                    </div>
                )
            }
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

class PurchaseOrderListRow extends React.Component {
    // clickRow() {
    //     var pathname = "/main/purchases/purchase-order/edit?n=" + this.props.item.name
    //     window.location = pathname
    // }

    render() {
        var checked = false
        var item = this.props.item
        var type
        var cursor = { cursor: 'pointer' }

        if (this.props.item.checked) {
            checked = true
        }
        var style

        if (['Draft', 'Purchase Order', 'RFQ'].includes(item.status)) {
            style = 'bg-warning'
        } else if (item.status == 'Receive') {
            style = 'bg-info'
        } else if (['Paid', 'Refund', 'Done'].includes(item.status)) {
            style = 'bg-success'
            if (item.status == 'Refund') {
                item.status = 'Paid'
            }
        } else if (item.status == 'Cancel') {
            style = 'bg-danger'
        }

        if (item.is_refund) {
            var icon_refund = <img src="/static/img/main/menu/refund.png" className="mr-2"></img>
        }

        if (product) {
            return (
                <div className="row mx-0" style={cursor}>
                    <div className="col-auto pl-2 pr-3">
                        <input type="checkbox" className="d-block my-3" checked={checked} onChange={this.props.checkRow} />
                    </div>
                    <a className="col row-list" href={"/main/purchases/purchase-order/edit?n=" + this.props.item.name}>
                        <div className="row mx-0 fs12 fw600">
                            <div className="col d-flex">
                                <span className="my-auto">{moment(item.is_refund == 1 ? item.refund_date : item.order_date).format("DD-MM-YYYY")}</span>
                            </div>
                            <div className="col d-flex">
                                <span className="my-auto">{item.name}</span>
                            </div>
                            <div className="col d-flex">
                                <span className="my-auto">{item.purchase_product.product_name}</span>
                            </div>
                            <div className="col-1 d-flex">
                                <span className="my-auto">{item.purchase_product.quantity}</span>
                            </div>
                            <div className="col-1 d-flex">
                                <span className="my-auto">{item.purchase_product.quantity_receive}</span>
                            </div>
                            <div className="col-1 d-flex">
                                <span className="my-auto">{item.purchase_product.uom_name}</span>
                            </div>
                            <div className="col d-flex">
                                <span className="my-auto">{formatter.format(item.purchase_product.price)}</span>
                            </div>
                            <div className="col d-flex">
                                <span className="my-auto">{formatter.format(item.total)}</span>
                            </div>
                            <div className="col-2 d-flex">
                                <span title={item.status} className={style + " fs12 py-1 rounded-pill text-center text-white px-3 m-auto d-block text-truncate"}>
                                    {icon_refund}{item.status}
                                </span>
                            </div>
                        </div>
                    </a>
                </div>
            )
        }
        else {
            return (
                <div className="row mx-0" style={cursor}>
                    <div className="col-auto pl-2 pr-3">
                        <input type="checkbox" className="d-block my-3" checked={checked} onChange={this.props.checkRow} />
                    </div>
                    <a  href={"/main/purchases/purchase-order/edit?n=" + this.props.item.name} className="col row-list">
                        <div className="row mx-0 fs12 fw600">
                            <div className="col d-flex">
                                <span className="my-auto">{moment(item.is_refund == 1 ? item.refund_date : item.order_date).format("DD-MM-YYYY")}</span>
                            </div>
                            <div className="col d-flex">
                                <span className="my-auto">{item.name}</span>
                            </div>
                            <div className="col d-flex">
                                <span className="my-auto">{item.supplier}</span>
                            </div>
                            <div className="col-2 d-flex">
                                <span className="my-auto">{formatter.format(item.total - item.paid)}</span>
                            </div>
                            <div className="col-2 d-flex">
                                <span className="my-auto">{formatter.format(item.total)}</span>
                            </div>
                            <div className="col-2 d-flex">
                                <span title={item.status} className={style + " fs12 py-1 rounded-pill text-center text-white px-3 m-auto d-block text-truncate"}>
                                    {icon_refund}{item.status}
                                </span>
                            </div>
                        </div>
                    </a>
                </div>
            )
        }
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
        var profile = this.state.profile
        var data = this.props.data
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
                    <td className="py-1">{moment(d.is_refund == 1 ? d.refund_date : d.order_date).format("DD-MM-YYYY")}</td>
                    <td className="py-1">{d.supplier}</td>
                    <td className="py-1">{d.name}</td>
                    <td className="py-1">{formatter.format(d.paid)}</td>
                    <td className="py-1">{formatter.format(d.total)}</td>
                    <td className="py-1">{d.status}</td>
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
                                <p className="fwbold text-right text-uppercase fs28" style={invoice}>Purchase Order</p>
                                <p className="fw600 text-right text-uppercase fs14" style={invoice2}>{moment().format("MM/YYYY")}</p>
                            </div>
                            <div className="col-12" style={borderStyle} />
                        </div>
                        <table className="fs12" style={row2}>
                            <thead className="text-uppercase" style={thead}>
                                <tr className="text-center">
                                    <th className="fw700 py-2" width="78px">Tanggal</th>
                                    <th className="fw700 py-2" width="165px" >Supplier</th>
                                    <th className="fw700 py-2" width="66px" >ID</th>
                                    <th className="fw700 py-2" width="92px" >Paid</th>
                                    <th className="fw700 py-2" width="92px" >Total</th>
                                    <th className="fw700 py-2" width="66px" >Status</th>
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

ReactDOM.render(<PurchaseOrder />, document.getElementById('purchase_order_list'))