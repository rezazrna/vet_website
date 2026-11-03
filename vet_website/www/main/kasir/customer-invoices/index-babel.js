// var tzOffset = new Date().getTimezoneOffset()
var tzOffset = 0
var petOwner = getUrlParameter('petOwner')
var petAll = getUrlParameter('petAll')
var session = getUrlParameter('session')
var register_number = getUrlParameter('register_number')
class CustomerInvoice extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': [],
            'print_data': [],
            'loaded': false,
            'check_all': false,
            'show_delete': false,
            'currentpage': 1,
            'search': false,
            'datalength': 0,
            'print_loading': false,
        }

        this.invoiceSearch = this.invoiceSearch.bind(this);
        this.checkRow = this.checkRow.bind(this);
        this.deleteRow = this.deleteRow.bind(this);
        this.openRow = this.openRow.bind(this);
        this.paginationClick = this.paginationClick.bind(this);
    }

    componentDidMount() {
        var po = this
        var filters

        console.log(document.referrer)
        // console.log(document.referrer.includes('/main/penerimaan/penerimaan-pasien/detail'))

        if (sessionStorage.getItem(window.location.pathname) != null && (document.referrer.includes('/main/kasir/customer-invoices/edit') || document.referrer.includes('/main/kasir/rawat-inap-invoices/edit'))) {
            filters = JSON.parse(sessionStorage.getItem(window.location.pathname))
        } else {
            filters = { filters: [], sorts: [] }
            if (!petOwner) {
                this.props.rawat_inap
                    ? filters.filters.push(['is_rawat_inap', '=', '1'])
                    : filters.filters.push(['is_rawat_inap', '=', '0'])
            }
        }

        if (document.location.href.includes('?')) {
            var url = document.location.href,
                params = url.split('?')[1].split('='),
                key = params[0],
                value = params[1]
        }

        if (filters.hasOwnProperty("currentpage")) {
            this.setState({ 'currentpage': filters['currentpage'] })
        }

        if (filters.hasOwnProperty("search")) {
            this.setState({ 'search': filters['search'] })
        }

        if (params) {
            filters[key] = value
            sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))
            this.invoiceSearch(filters)
        } else {
            if (session) {
                filters.session = session
            }
            if (register_number) {
                filters.filters.push(['register_number', '=', register_number])
            }
            if (petAll) {
                filters.filters.push(['pet', '=', petAll])
            }

            sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))

            frappe.call({
                type: "GET",
                method: "vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.get_invoice_list",
                args: { filters: filters },
                callback: function (r) {
                    if (r.message) {
                        console.log(r.message);
                        po.setState({ 'data': r.message.customer_invoice, 'loaded': true, 'datalength': r.message.datalength });
                    }
                }
            });
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
            method: "vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.get_invoice_list",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'data': r.message.customer_invoice, 'loaded': true, 'datalength': r.message.datalength });
                }
            }
        });
        // }
    }

    invoiceSearch(filters) {
        var new_filters = Object.assign({}, filters)
        filters.filters
            ? new_filters.filters = filters.filters.slice()
            : new_filters.filters = []
        // console.log(new_filters)
        // console.log(new_filters.filters.includes(['is_rawat_inap', '=', '1']))
        // console.log(new_filters.filters.includes(['is_rawat_inap', '=', '0']))
        // if (!petOwner && !new_filters.filters.includes(['is_rawat_inap', '=', '1']) && !new_filters.filters.includes(['is_rawat_inap', '=', '0'])) {
        //     this.props.rawat_inap
        //     ? new_filters.filters.push(['is_rawat_inap', '=', '1'])
        //     : new_filters.filters.push(['is_rawat_inap', '=', '0'])
        // }
        if (session) {
            new_filters.session = session
        }
        if (register_number) {
            new_filters.filters.push(['register_number', '=', register_number])
        }
        if (petAll) {
            new_filters.filters.push(['pet', '=', petAll])
        }
        var po = this

        this.setState({
            currentpage: 1,
            loaded: false,
        });

        new_filters['currentpage'] = 1
        new_filters['search'] = this.state.search
        sessionStorage.setItem(window.location.pathname, JSON.stringify(new_filters))

        console.log(new_filters)

        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.get_invoice_list",
            args: { filters: new_filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    if (new_filters.sorts && new_filters.sorts.length > 0) {
                        new_filters.sorts.forEach(s => {
                            var sort_split = s.split(' ')
                            if (sort_split[0] == 'deposit') {
                                if (sort_split[1] == 'asc') {
                                    r.message.customer_invoice.sort((a, b) => (a.credit - a.all_remaining) - (b.credit - b.all_remaining))
                                } else if (sort_split[1] == 'desc') {
                                    r.message.customer_invoice.sort((a, b) => (b.credit - b.all_remaining) - (a.credit - a.all_remaining))
                                }
                            }

                            if (sort_split[0] == 'remaining') {
                                if (sort_split[1] == 'asc') {
                                    if (po.props.rawat_inap) {
                                        r.message.customer_invoice.sort((a, b) => (a.remaining - a.credit) - (b.remaining - b.credit))
                                    } else {
                                        r.message.customer_invoice.sort((a, b) => a.remaining - b.remaining)
                                    }
                                } else if (sort_split[1] == 'desc') {
                                    if (po.props.rawat_inap) {
                                        r.message.customer_invoice.sort((a, b) => (b.remaining - b.credit) - (a.remaining - a.credit))
                                    } else {
                                        r.message.customer_invoice.sort((a, b) => b.remaining - a.remaining)
                                    }
                                }
                            }
                        })
                    }
                    po.setState({ 'data': r.message.customer_invoice, loaded: true, 'datalength': r.message.datalength });
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
            method: "vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.delete_customer_invoice",
            args: { data: delete_data_names },
            callback: function (r) {
                if (r.message.success) {
                    var new_data = po.state.data.filter((d => !d.checked))
                    po.setState({ data: new_data, check_all: false, show_delete: false });
                }
            }
        });
    }

    openRow(e) {
        e.preventDefault();
        var po = this
        var data = this.state.data.filter((d) => d.checked && d.status == 'Draft').reverse()
        var data_names = data.map((d) => d.name)
        frappe.call({
            type: "POST",
            method: "vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.open_invoice_from_list",
            args: { name_list: data_names },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message)
                    var new_data = po.state.data.slice()
                    r.message.forEach(data => {
                        var index = new_data.findIndex(d => d.name == data.name)
                        if (index >= 0) {
                            new_data[index] = data
                        }
                    })
                    po.setState({ data: new_data, check_all: false, show_delete: false });
                }
            }
        });
    }

    joinRow() {
        var th = this
        var checked = this.state.data.filter(d => d.checked)
        console.log(checked)
        var join_available = checked.every((c, index, allChecked) => {
            if (c.status == 'Done') {
                return false
            }
            if (index === 0) {
                return true
            } else {
                return (c.owner === allChecked[index - 1].owner && c.status === allChecked[index - 1].status);
            }
        })

        if (!join_available) {
            frappe.msgprint('Tidak bisa menggabung invoice. Invoice harus memilik pemilik dan status yang sama dan tidak dalam status "Done"')
        } else {
            frappe.call({
                type: "POST",
                method: "vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.join_invoice",
                args: { name_list: checked.map(d => d.name), datetime: moment().format('YYYY-MM-DD HH:mm:ss') },
                callback: function (r) {
                    if (r.message.error) {
                        frappe.msgprint(r.message.error)
                    } else if (r.message.success) {
                        th.invoiceSearch(JSON.parse(sessionStorage.getItem(window.location.pathname)))
                    }
                }
            });
        }
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

    getPrintData() {
        var po = this

        if (!this.state.print_loading) {
            var filters = JSON.parse(sessionStorage.getItem(window.location.pathname))

            this.setState({
                print_loading: true,
            });

            frappe.call({
                type: "GET",
                method: "vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.get_invoice_list",
                args: { filters: filters, all_page: true},
                callback: function (r) {
                    if (r.message) {
                        console.log(r.message);
                        po.setState({print_data: r.message.customer_invoice});
                        setTimeout(function() {
                            po.printPDF()
                        }, 3000);
                    }
                }
            });
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
        var elements = Array.from(document.querySelectorAll('div[id^="pdf-"]'))
        // var source = document.getElementById(pdfid)
        var opt = {
            margin: [10, 0, 10, 0],
            filename: "CustomerInvoice-" + moment().format('MM-YYYY') + ".pdf",
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
        // html2pdf().set(opt).from(source).toPdf().get('pdf').then(function (pdfObj) {
        //     // pdfObj has your jsPDF object in it, use it as you please!
        //     // For instance (untested):
        //     th.setState({print_loading: false})
        //     pdfObj.autoPrint();
        //     window.open(pdfObj.output('bloburl'), '_blank');
        // });
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
        var status_options = [
            { label: 'Draft', value: 'Draft' },
            { label: 'Open', value: 'Open' },
            { label: 'Paid', value: 'Paid' },
            { label: 'Refund', value: 'Refund' },
            { label: 'Cancel', value: 'Cancel' },
            { label: 'Done', value: 'Done' },
        ]

        var sorts = [
            { 'label': 'ID DESC', 'value': 'name desc' },
            { 'label': 'ID ASC', 'value': 'name asc' },
            { 'label': 'Tanggal Invoice DESC', 'value': 'invoice_date desc' },
            { 'label': 'Tanggal Invoice ASC', 'value': 'invoice_date asc' },
            { 'label': 'Nama Pemilik DESC', 'value': 'owner_name desc' },
            { 'label': 'Nama Pemilik ASC', 'value': 'owner_name asc' },
            { 'label': 'Nama Pasien DESC', 'value': 'pet_name desc' },
            { 'label': 'Nama Pasien ASC', 'value': 'pet_name asc' },
            { 'label': 'Responsible DESC', 'value': 'user_name desc' },
            { 'label': 'Responsible ASC', 'value': 'user_name asc' },
            { 'label': 'Total DESC', 'value': 'total desc' },
            { 'label': 'Total ASC', 'value': 'total asc' },
            { 'label': 'Remaining DESC', 'value': 'remaining desc' },
            { 'label': 'Remaining ASC', 'value': 'remaining asc' },
        ]

        if (this.props.rawat_inap) {
            sorts.push({ 'label': 'Deposit DESC', 'value': 'deposit desc' })
            sorts.push({ 'label': 'Deposit ASC', 'value': 'deposit asc' },)
        }

        var field_list = [
            { 'label': 'ID', 'field': 'name', 'type': 'char' },
            { 'label': 'Tanggal', 'field': 'invoice_date', 'type': 'date' },
            //  {'label': 'Tanggal Refund', 'field': 'refund_date', 'type': 'date'},
            //  {'label': 'No Pendaftaran', 'field': 'register_number', 'type': 'char'},
            { 'label': 'Nama Pemilik', 'field': 'owner_name', 'type': 'char' },
            { 'label': 'Nama Pasien', 'field': 'pet_name', 'type': 'char' },
            { 'label': 'Responsible', 'field': 'user_name', 'type': 'char' },
            //  {'label': 'Source Document', 'field': 'origin', 'type': 'char'},
            { 'label': 'Total', 'field': 'total', 'type': 'int' },
            { 'label': 'Remaining', 'field': 'remaining', 'type': 'int' },
            //  {'label': 'Subtotal', 'field': 'subtotal', 'type': 'char'},
            { 'label': 'Status', 'field': 'status', 'type': 'select', 'options': status_options },

        ]

        if (this.props.rawat_inap) {
            field_list.push({ 'label': 'Deposit', 'field': 'deposit', 'type': 'int' })
        }

        var row_style = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px' }
        var formStyle = { border: '1px solid #397DA6', color: '#397DA6' }
        var delete_button, backButton, openButton, joinButton
        var add_button = (
            <button type="button" className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={() => window.location.pathname = "/main/kasir/customer-invoices/form"}><i className="fa fa-plus mr-2" />Tambah</button>
        )
        if (this.state.show_delete) {
            delete_button = <button className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={this.deleteRow}>Hapus</button>
        }
        var checked = this.state.data.filter(d => d.checked)
        if (checked.every(d => d.status == 'Draft') && checked.length != 0) {
            openButton = <button className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={this.openRow}>Open</button>
        }
        if (checked.length > 1) {
            joinButton = <button type="button" className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={() => this.joinRow()}>Gabung</button>
        }
        if (document.location.href.includes('?')) {
            var color = { color: '#056EAD', cursor: 'pointer' }
            backButton = <span className="fs16 fw600 mr-4 my-auto" style={color} onClick={() => { history.back() }}><i className="fa fa-chevron-left mr-1" style={color}></i>Back</span>
        }
        if (this.state.loaded) {
            var item_pdf = []

            if (this.state.print_data.length > 0) {
                var chunk = []
                for (var i = 0; i < this.state.print_data.length; i += (i == 0 ? 255 : 275)) {
                    chunk.push(this.state.print_data.slice(i, i + (i == 0 ? 255 : 275)));
                }

                console.log(chunk)

                for (i = 0; i < chunk.length; i++) {
                    if (i == 0) {
                        console.log('masuk pdf page pertama')
                        item_pdf.push(
                            <PDF data={chunk[i]} rawat_inap={this.props.rawat_inap}/>
                        )
                    } else {
                        item_pdf.push(
                            <PDFListPage data={chunk[i]} pdfPage={i + 1}/>
                        )
                    }
                }
            }

            return (
                <div>
                    <div className="row mx-0" style={row_style}>
                        <div className="col-auto">
                            {backButton}
                            {this.props.rawat_inap ? false : add_button}
                            {delete_button}
                            {openButton}
                            {joinButton}
                            <button type="button" className={this.state.print_loading
                                ? "btn btn-outline-danger text-uppercase fs12 fwbold mx-2 disabled"
                                : "btn btn-outline-danger text-uppercase fs12 fwbold mx-2"} onClick={() => this.getPrintData()}>{
                                    this.state.print_loading
                                    ? (<span><i className="fa fa-spin fa-circle-o-notch mr-3"/>Loading...</span>)
                                    : "Print"
                                }</button>
                        </div>
                        <div className="col">
                            <input value={this.state.search || ''} className="form-control fs12" name="search" placeholder="Search..." style={formStyle} onChange={e => this.setState({ search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' ? this.invoiceSearch(JSON.parse(sessionStorage.getItem(window.location.pathname))) : null} />
                        </div>
                        <div className="col-7">
                            <Filter sorts={sorts} searchAction={this.invoiceSearch} field_list={field_list} filters={JSON.parse(sessionStorage.getItem(window.location.pathname))} />
                        </div>
                    </div>
                    <CustomerInvoiceList invoices={this.state.data} checkRow={this.checkRow} checkAll={() => this.checkAll()} check_all={this.state.check_all} paginationClick={this.paginationClick} currentpage={this.state.currentpage} rawat_inap={this.props.rawat_inap} datalength={this.state.datalength} />
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


class CustomerInvoiceList extends React.Component {
    render() {
        // var search = this.props.search
        var rawat_inap = this.props.rawat_inap
        // function filterRow(row){
        //     function filterField(field){
        //         return field?field.toString().includes(search):false
        //     }
        //     var fields = [moment(row.is_refund ? row.refund_date : row.invoice_date).format("YYYY-MM-DD HH:mm:ss"), row.name, row.owner_name, row.pet_name, row.user_name, row.remaining>0?row.remaining:0, row.status]
        //     rawat_inap?fields.push(row.credit>0?row.credit:0):false
        //     return ![false,''].includes(search)?fields.some(filterField):true
        // }
        var invoice_rows = []
        var panel_style = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px' }
        var col_style = { width: '35px' }

        if (this.props.invoices.length != 0) {
            var pol = this
            // const indexOfLastTodo = this.props.currentpage * 30;
            // const indexOfFirstTodo = indexOfLastTodo - 30;
            // var currentItems
            // ![false,''].includes(search)?
            // currentItems = this.props.invoices.filter(filterRow).slice(indexOfFirstTodo, indexOfLastTodo):
            // currentItems = this.props.invoices.slice(indexOfFirstTodo, indexOfLastTodo)
            this.props.invoices.forEach(function (invoice, index) {
                // if (currentItems.includes(invoice)){
                invoice_rows.push(
                    <CustomerInvoiceListRow key={invoice.name} rawat_inap={pol.props.rawat_inap} invoice={invoice} checkRow={() => pol.props.checkRow(index)} />
                )
                // }
            })

            var deposit = <div className="col d-flex">
                <span className="my-auto">Deposit</span>
            </div>

            return (
                <div style={panel_style}>
                    <div className="row mx-0">
                        <div className="col-auto pl-2 pr-3">
                            <input type="checkbox" className="d-block my-3" checked={this.props.check_all} onChange={this.props.checkAll} />
                        </div>
                        <div className="col row-header">
                            <div className="row mx-0 fs12 fw600">
                                <div className="col d-flex">
                                    <span className="my-auto">ID</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">Tanggal</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">Nama Pemilik</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">Nama Pasien</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">Responsible</span>
                                </div>
                                {this.props.rawat_inap ? deposit : false}
                                <div className="col d-flex">
                                    <span className="my-auto">Total</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">Remaining</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="m-auto">Status</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {invoice_rows}
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

class CustomerInvoiceListRow extends React.Component {
    // clickRow() {
    //     var pathname = "/main/kasir/customer-invoices/edit?n=" + this.props.invoice.name
    //     this.props.rawat_inap ? pathname = "/main/kasir/rawat-inap-invoices/edit?n=" + this.props.invoice.name : false
    //     window.location = pathname
    // }

    render() {
        var checked = false
        if (this.props.invoice.checked) {
            checked = true
        }
        var invoice = this.props.invoice
        var style

        if (invoice.status == 'Draft') {
            style = 'bg-warning'
        } else if (invoice.status == 'Open') {
            style = 'bg-info'
        } else if (['Paid', 'Refund', 'Done'].includes(invoice.status)) {
            style = 'bg-success'
            if (invoice.status == 'Refund') {
                invoice.status = 'Paid'
            }
        } else if (invoice.status == 'Cancel') {
            style = 'bg-danger'
        }

        if (invoice.is_refund) {
            var icon_refund = <img src="/static/img/main/menu/refund.png" className="mr-2"></img>
        }

        var remaining = 0
        var credit = invoice.credit
        // if (invoice.is_rawat_inap){
        //     remaining = invoice.remaining - invoice.credit
        //     credit = invoice.credit - invoice.all_remaining
        //     remaining<0?remaining=0:false
        //     credit<0?credit=0:false
        // } else {
        //     invoice.remaining>0?remaining=invoice.remaining:0
        // }
        credit < 0 ? credit = 0 : false
        invoice.remaining > 0 ? remaining = invoice.remaining : 0

        var deposit = <div className="col d-flex">
            <span className="my-auto">{formatter.format(credit)}</span>
        </div>

        var pathname = ''
        if (this.props.rawat_inap) {
            pathname = "/main/kasir/rawat-inap-invoices/edit?n=" + this.props.invoice.name
        } else {
            pathname = "/main/kasir/customer-invoices/edit?n=" + this.props.invoice.name
        }

        return (
            <div className="row mx-0">
                <div className="col-auto pl-2 pr-3">
                    <input type="checkbox" className="d-block my-3" checked={checked} onChange={this.props.checkRow} />
                </div>
                <a href={pathname} className="col row-list row-list-link">
                    <div className="row mx-0 fs12 fw600">
                        <div className="col d-flex">
                            <span className="my-auto">{invoice.name}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{moment(invoice.is_refund ? invoice.refund_date : invoice.invoice_date).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss")}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{invoice.owner_name}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{invoice.pet_name}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{invoice.user_name}</span>
                        </div>
                        {this.props.rawat_inap ? deposit : false}
                        <div className="col d-flex">
                            <span className="my-auto">{formatter.format(invoice.all_total || invoice.total)}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{formatter.format(remaining)}</span>
                        </div>
                        <div className="col d-flex">
                            <span className={style + " fs12 py-1 rounded-pill text-center text-white px-3 m-auto"}>
                                {icon_refund}{invoice.status}
                            </span>
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
        var rawat_inap = this.props.rawat_inap || false
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
                    <td className="py-1">{d.name}</td>
                    <td className="py-1">{moment(d.is_refund ? d.refund_date : d.invoice_date).subtract(tzOffset, 'minute').format("DD-MM-YYYY")}</td>
                    <td className="py-1">{d.owner_name}</td>
                    <td className="py-1">{d.pet_name}</td>
                    <td className="py-1">{formatter.format(d.total)}</td>
                    <td className="py-1">{formatter.format(d.remaining)}</td>
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
                    <div id="pdf-1" className="px-4" style={page_dimension}>
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
                                <p className="fwbold text-right text-uppercase fs28" style={invoice}>{rawat_inap ? "Rawat Inap Invoice" : "Customer Invoice"}</p>
                                <p className="fw600 text-right text-uppercase fs14" style={invoice2}>{moment().format("MM/YYYY")}</p>
                            </div>
                            <div className="col-12" style={borderStyle} />
                        </div>
                        <table className="fs12" style={row2}>
                            <thead className="text-uppercase" style={thead}>
                                <tr className="text-center">
                                    <th className="fw700 py-2" width="58px" >ID</th>
                                    <th className="fw700 py-2" width="91px" >Tanggal</th>
                                    <th className="fw700 py-2" width="101px" >Nama Pemilik</th>
                                    <th className="fw700 py-2" width="101px" >Nama Pasien</th>
                                    <th className="fw700 py-2" width="73px" >Total</th>
                                    <th className="fw700 py-2" width="73px" >Remaining</th>
                                    <th className="fw700 py-2" width="62px" >Status</th>
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
        var row2 = { margin: '0 -14px' }
        var fs9 = { fontSize: 9 }
        var table_rows = []

        data.forEach((d, index) => {
            table_rows.push(
                <tr key={d.name} style={fs9} className="text-center">
                    <td className="py-1" width="58px" >{d.name}</td>
                    <td className="py-1" width="91px" >{moment(d.is_refund ? d.refund_date : d.invoice_date).subtract(tzOffset, 'minute').format("DD-MM-YYYY")}</td>
                    <td className="py-1" width="101px" >{d.owner_name}</td>
                    <td className="py-1" width="101px" >{d.pet_name}</td>
                    <td className="py-1" width="73px" >{formatter.format(d.total)}</td>
                    <td className="py-1" width="73px" >{formatter.format(d.remaining)}</td>
                    <td className="py-1" width="62px" >{d.status}</td>
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

document.getElementById('customer_invoice_list') ? ReactDOM.render(<CustomerInvoice />, document.getElementById('customer_invoice_list')) : false

document.getElementById('rawat_inap_invoice_list') ? ReactDOM.render(<CustomerInvoice rawat_inap={true} />, document.getElementById('rawat_inap_invoice_list')) : false