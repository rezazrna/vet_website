var product = getUrlParameter('product') || false
class StockMove extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': [],
            'loaded': false,
            'currentpage': 1,
            'search': false,
            'datalength': 0,
        }

        this.stockMoveSearch = this.stockMoveSearch.bind(this);
        this.paginationClick = this.paginationClick.bind(this);
    }

    componentDidMount() {
        var td = this
        var args = { filters: [], sorts: [] }
        if (product) {
            args.product = product
        }

        sessionStorage.setItem(window.location.pathname, JSON.stringify(args))

        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetoperation.vetoperation.get_stock_move_list",
            args: { filters: args },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message)
                    td.setState({ 'data': r.message.operation, 'loaded': true, 'datalength': r.message.datalength });
                }
            }
        });
    }

    stockMoveSearch(filters) {
        var td = this
        this.setState({
            currentpage: 1,
            loaded: false,
        });

        filters['currentpage'] = 1;
        filters['search'] = this.state.search
        sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))

        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetoperation.vetoperation.get_stock_move_list",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    td.setState({ 'data': r.message.operation, 'loaded': true, 'datalength': r.message.datalength });
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
            method: "vet_website.vet_website.doctype.vetoperation.vetoperation.get_stock_move_list",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message)
                    po.setState({ 'data': r.message.operation, 'loaded': true, 'datalength': r.message.datalength });
                }
            }
        });
        // }
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
            filename: "StockMove-" + moment().format('MM-YYYY') + ".pdf",
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
            { 'label': 'Date DESC', 'value': 'creation desc' },
            { 'label': 'Date ASC', 'value': 'creation asc' },
            { 'label': 'Receive Date DESC', 'value': 'receive_date desc' },
            { 'label': 'Receive Date ASC', 'value': 'receive_date asc' },
            { 'label': 'Reference DESC', 'value': 'reference desc' },
            { 'label': 'Reference ASC', 'value': 'reference asc' },
        ]

        var field_list = [
            { 'label': 'Product Name', 'field': 'product_name', 'type': 'char' },
            //  {'label': 'Uom Name', 'field': 'uom_name', 'type': 'char'},
            { 'label': 'Operation Number', 'field': 'parent', 'type': 'char' },
            { 'label': 'Quantity', 'field': 'quantity', 'type': 'char' },
            //  {'label': 'Quantity Done', 'field': 'quantity_done', 'type': 'char'},
            //  {'label': 'Inventory Value', 'field': 'inventory_value', 'type': 'char'},
            { 'label': 'Receive Date', 'field': 'receive_date', 'type': 'date' },
            { 'label': 'Date', 'field': 'date', 'type': 'date' }
        ]

        var row_style2 = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px', 'height': '72px' }
        var formStyle = { border: '1px solid #397DA6', color: '#397DA6' }
        var back_button = false
        var color = { color: '#056EAD', cursor: 'pointer' }
        if (document.referrer.includes('/main/inventory/products/edit?n=' + product)) {
            back_button = <span className="fs16 fw600 mr-auto my-auto" style={color} onClick={() => { history.back() }}><i className="fa fa-chevron-left mr-1" style={color}></i>Back</span>
        }

        if (this.state.loaded) {
            return (
                <div>
                    <div className="row mx-0" style={row_style2}>
                        <div className="col-auto">
                            {back_button}
                            <button type="button" className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={() => this.printPDF()}>Print</button>
                        </div>
                        <div className="col">
                            <input value={this.state.search || ''} className="form-control fs12" name="search" placeholder="Search..." style={formStyle} onChange={e => this.setState({ search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' ? this.stockMoveSearch(JSON.parse(sessionStorage.getItem(window.location.pathname))) : null} />
                        </div>
                        <div className="col-7 ml-auto">
                            <Filter sorts={sorts} searchAction={this.stockMoveSearch} field_list={field_list} filters={JSON.parse(sessionStorage.getItem(window.location.pathname))} />
                        </div>
                    </div>
                    <StockMoveList items={this.state.data} paginationClick={this.paginationClick} currentpage={this.state.currentpage} datalength={this.state.datalength} />
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

class StockMoveList extends React.Component {
    render() {
        // var search = this.props.search
        // function filterRow(row){
        //     function filterField(field){
        //         return field?field.toString().replace(/&lt;/g,"<").replace(/&gt;/g,">").includes(search):false
        //     }
        //     var fields = [row.product_name, row.parent, row.quantity_done, row.from_name || 'Supplier', row.to_name || 'Customer', moment(row.date || row.creation).format('DD-MM-YYYY'), row.status]
        //     return ![false,''].includes(search)?fields.some(filterField):true
        // }
        var rows = []
        var panel_style = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px' }
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
                rows.push(
                    <StockMoveListRow key={index.toString()} item={item} />
                )
                // }
            })

            return (
                <div style={panel_style}>
                    <div className="row mx-0">
                        <div className="col row-header">
                            <div className="row mx-0 fs12 fw600">
                                <div className="col-3 text-center">
                                    <span>Product</span>
                                </div>
                                <div className="col text-center">
                                    <span>Operation ID</span>
                                </div>
                                <div className="col-1 text-center">
                                    <span>Qty</span>
                                </div>
                                <div className="col text-center">
                                    <span>From</span>
                                </div>
                                <div className="col text-center">
                                    <span>To</span>
                                </div>
                                <div className="col text-center">
                                    <span>Date</span>
                                </div>
                                <div className="col text-center">
                                    <span>Receive Date</span>
                                </div>
                                <div className="col text-center">
                                    <span>Status</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {rows}
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

class StockMoveListRow extends React.Component {
    // clickRow() {
    //     var pathname = "/main/inventory/operation/edit?n=" + this.props.item.parent
    //     window.location = pathname
    // }

    render() {

        var item = this.props.item
        var date = item.date || item.creation
        var moment_date = moment(date)
        var from_name = item.from_name == undefined
            ? item.reference.match(/^VCI-.*$/) || item.reference.match(/^POSORDER.*$/)
                ? 'Customer'
                : 'Supplier'
            : item.from_name
        var to_name = item.to_name == undefined
            ? item.reference.match(/^VCI-.*$/) || item.reference.match(/^POSORDER.*$/)
                ? 'Customer'
                : 'Supplier'
            : item.to_name

        return (
            <div className="row mx-0">
                <a href={"/main/inventory/operation/edit?n=" + this.props.item.parent} className="col row-list row-list-link">
                    <div className="row mx-0 fs12 fw600">
                        <div className="col-3 text-center">
                            <span>{item.product_name != undefined ? item.product_name.replace(/&lt;/g, "<").replace(/&gt;/g, ">") : ''}</span>
                        </div>
                        <div className="col text-center">
                            <span>{item.parent}</span>
                        </div>
                        <div className="col-1 text-center">
                            <span>{item.quantity_done}</span>
                        </div>
                        <div className="col text-center">
                            <span>{from_name}</span>
                        </div>
                        <div className="col text-center">
                            <span>{to_name}</span>
                        </div>
                        <div className="col text-center">
                            <span>{moment_date.format('DD-MM-YYYY')}</span>
                        </div>
                        <div className="col text-center">
                            <span>{item.receive_date ?  moment(item.receive_date).format('DD-MM-YYYY') : '-'}</span>
                        </div>
                        <div className="col text-center">
                            <span>{item.status}</span>
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
        // currentItems = data.filter(filterRow).slice(indexOfFirstTodo, indexOfLastTodo):
        // currentItems = data.slice(indexOfFirstTodo, indexOfLastTodo)
        // currentItems = data.slice(0,30)
        data.forEach((d, index) => {
            var from_name = d.from_name == undefined
            ? d.reference.match(/^VCI-.*$/) || d.reference.match(/^POSORDER.*$/)
                ? 'Customer'
                : 'Supplier'
            : d.from_name
            var to_name = d.to_name == undefined
                ? d.reference.match(/^VCI-.*$/) || d.reference.match(/^POSORDER.*$/)
                    ? 'Customer'
                    : 'Supplier'
                : d.to_name

            table_rows.push(
                <tr key={d.name} style={fs9} className="text-center">
                    <td className="py-1">{d.product_name}</td>
                    <td className="py-1">{d.name}</td>
                    <td className="py-1">{d.quantity}</td>
                    <td className="py-1">{from_name}</td>
                    <td className="py-1">{to_name}</td>
                    <td className="py-1">{moment(d.date).format('DD-MM-YYYY')}</td>
                    <td className="py-1">{d.receive_date ? moment(d.receive_date).format('DD-MM-YYYY') : '-'}</td>
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
                                <p className="fwbold text-right text-uppercase fs28" style={invoice}>Stock Move</p>
                                {/*<p className="fw600 text-right text-uppercase fs14" style={invoice2}>{moment().format("MM/YYYY")}</p>*/}
                            </div>
                            <div className="col-12" style={borderStyle} />
                        </div>
                        <table className="fs12" style={row2}>
                            <thead className="text-uppercase" style={thead}>
                                <tr className="text-center">
                                    <th className="fw700 py-2" width="182px">Product</th>
                                    <th className="fw700 py-2" width="62px">Operation ID</th>
                                    <th className="fw700 py-2" width="63px">Qty</th>
                                    <th className="fw700 py-2" width="63px">From</th>
                                    <th className="fw700 py-2" width="63px">To</th>
                                    <th className="fw700 py-2" width="63px">Date</th>
                                    <th className="fw700 py-2" width="63px">Receive Date</th>
                                    <th className="fw700 py-2" width="63px">Status</th>
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

ReactDOM.render(<StockMove />, document.getElementById('stock_move_list'))