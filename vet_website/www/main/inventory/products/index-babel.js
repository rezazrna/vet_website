class Products extends React.Component {
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
            'category_list': [],
            'tag_list': [],
        }
        this.checkRow = this.checkRow.bind(this);
        this.deleteRow = this.deleteRow.bind(this);
        this.productSearch = this.productSearch.bind(this)
        this.paginationClick = this.paginationClick.bind(this);
    }

    componentDidMount() {
        var td = this
        var new_filters = { filters: [], sorts: [] }

        if (sessionStorage.getItem(window.location.pathname) != null && document.referrer.includes('/main/inventory/products/edit')) {
            new_filters = JSON.parse(sessionStorage.getItem(window.location.pathname))
        }

        if (new_filters.hasOwnProperty("currentpage")) {
            this.setState({ 'currentpage': new_filters['currentpage'] })
        }

        if (new_filters.hasOwnProperty("search")) {
            this.setState({ 'search': new_filters['search'] })
        }

        sessionStorage.setItem(window.location.pathname, JSON.stringify(new_filters))

        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetproduct.vetproduct.get_product_list",
            args: { filters: new_filters },
            callback: function (r) {
                console.log(r.message)
                if (r.message) {
                    td.setState({ 'data': r.message.product, 'loaded': true, 'datalength': r.message.datalength, 'category_list': r.message.category_list, 'tag_list': r.message.tag_list });
                }
            }
        });
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
            method: "vet_website.vet_website.doctype.vetproduct.vetproduct.get_product_list",
            args: { filters: filters },
            callback: function (r) {
                console.log(r.message)
                if (r.message) {
                    po.setState({ 'data': r.message.product, 'loaded': true, 'datalength': r.message.datalength, 'category_list': r.message.category_list, 'tag_list': r.message.tag_list });
                }
            }
        });
        // }
    }

    productSearch(filters) {
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
            method: "vet_website.vet_website.doctype.vetproduct.vetproduct.get_product_list",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    po.setState({ 'data': r.message.product, 'datalength': r.message.datalength, 'loaded': true, 'category_list': r.message.category_list, 'tag_list': r.message.tag_list });
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
            method: "vet_website.vet_website.doctype.vetproduct.vetproduct.delete_product",
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
            filename: "Products-" + moment().format('MM-YYYY') + ".pdf",
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
        var category_options = []
        var tag_options = []
        this.state.category_list.forEach(function (item) {
            category_options.push({'label': item.name, 'value': item.name})
        })
        this.state.tag_list.forEach(function (item) {
            tag_options.push({'label': item.name, 'value': item.name})
        })

        var sorts = [
            { 'label': 'Product DESC', 'value': 'product_name desc' },
            { 'label': 'Product ASC', 'value': 'product_name asc' },
            { 'label': 'Price DESC', 'value': 'price desc' },
            { 'label': 'Price ASC', 'value': 'price asc' },
        ]

        var field_list = [
            //  {'label': 'Internal Reference', 'field': 'default_code', 'type': 'char'},
            { 'label': 'Product Name', 'field': 'product_name', 'type': 'char' },
            { 'label': 'Category Name', 'field': 'category_name', 'type': 'select', 'options': category_options },
            //  {'label': 'UOM Name', 'field': 'uom_name', 'type': 'char'},
            { 'label': 'Price', 'field': 'price', 'type': 'int' },
            { 'label': 'Tag', 'field': 'tag', 'type': 'select', 'options': tag_options },
        ]

        var row_style2 = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px', 'height': '72px' }
        var formStyle = { border: '1px solid #397DA6', color: '#397DA6' }
        var delete_row
        var add_row = <a href="/main/inventory/products/form" className="btn btn-outline-danger text-uppercase fs12 fwbold"><i className="fa fa-plus mr-2" />Tambah</a>
        if (this.state.show_delete) {
            delete_row = <button className="btn btn-outline-danger text-uppercase fs12 fwbold" onClick={this.deleteRow}>Hapus</button>
        }

        if (this.state.loaded) {
            return (
                <div>
                    <div className="row mx-0" style={row_style2}>
                        <div className="col-auto">
                            {add_row}
                            {delete_row}
                            <button type="button" className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={() => this.printPDF()}>Print</button>
                        </div>
                        <div className="col">
                            <input value={this.state.search || ''} className="form-control fs12" name="search" placeholder="Search..." style={formStyle} onChange={e => this.setState({ search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' ? this.productSearch(JSON.parse(sessionStorage.getItem(window.location.pathname))) : null} />
                        </div>
                        <div className="col-7">
                            <Filter sorts={sorts} searchAction={this.productSearch} field_list={field_list} filters={JSON.parse(sessionStorage.getItem(window.location.pathname))} />
                        </div>
                    </div>
                    <ProductGrid items={this.state.data} checkRow={this.checkRow} checkAll={() => this.checkAll()} check_all={this.state.check_all} paginationClick={this.paginationClick} currentpage={this.state.currentpage} datalength={this.state.datalength} />
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

class ProductGrid extends React.Component {
    render() {
        // var search = this.props.search
        // function filterRow(row){
        //     function filterField(field){
        //         return field?field.toString().replace(/&lt;/g,"<").replace(/&gt;/g,">").toLowerCase().includes(search.toLowerCase()):false
        //     }
        //     var fields = [row.product_name, row.default_code, row.quantity, row.price]
        //     return ![false,''].includes(search)?fields.some(filterField):true
        // }
        var cols = []
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
                cols.push(
                    <ProductGridCol key={index.toString()} item={item} checkRow={() => list.props.checkRow(index)} />
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

class ProductGridCol extends React.Component {
    // clickRow() {
    //     var pathname = "/main/inventory/products/edit?n=" + encodeURIComponent(this.props.item.name)
    //     window.location = pathname
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

        var tags = []
        item.tags.forEach((t, index) => tags.push(<ProductTag key={t.name} label={t.tag_label} />))
        var product_name = item.product_name.replace(/&lt;/g, "<").replace(/&gt;/g, ">")
        return (
            <div className="col-12 col-md-6 mb-5">
                <div style={panel_style} className="text-center p-4 row mx-0">
                    <div className="col-12 mb-auto pb-4 d-flex text-truncate">
                        <input type="checkbox" className="my-auto mr-auto" checked={checked} onChange={this.props.checkRow} />
                        <a href={"/main/inventory/products/edit?n=" + encodeURIComponent(this.props.item.name)}><span className="fs16 fwbold text-uppercase mr-auto" title={product_name} style={cursor}>{product_name}</span></a>
                    </div>
                    <div className="col-12 my-auto">
                        <div className="row">
                            <div className="col-4">
                                <div style={div_image_style}>
                                    {image}
                                </div>
                            </div>
                            <div className="col-8">
                                <div className="row text-left mb-2">
                                    <div className="col-4">
                                        Price
                                    </div>
                                    <div className="col-auto px-0">
                                        :
                                    </div>
                                    <div className="col text-right">
                                        {formatter.format(item.price)}
                                    </div>
                                </div>
                                <div className="row text-left mb-2">
                                    <div className="col-4">
                                        On Hand
                                    </div>
                                    <div className="col-auto px-0">
                                        :
                                    </div>
                                    <div className="col text-right">
                                        {item.quantity}
                                    </div>
                                </div>
                                <div className="form-row text-left my-3">
                                    {tags}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

class ProductTag extends React.Component {
    render() {
        var tag_style = { background: '#056EAD', borderRadius: '3px', color: '#FFF', cursor: 'pointer' }
        return (
            <span className="p-1 mx-1 fs12 mb-1" style={tag_style}>
                #{this.props.label}
            </span>
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
                    <td className="py-1">{d.product_name}</td>
                    <td className="py-1">{d.quantity}</td>
                    <td className="py-1">{d.purchase_number}</td>
                    <td className="py-1">{d.sales_number}</td>
                    <td className="py-1">{d.uom_name}</td>
                    <td className="py-1">{d.default_code}</td>
                    <td className="py-1">{formatter.format(d.price)}</td>
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
                                <p className="fwbold text-right text-uppercase fs28" style={invoice}>Products</p>
                                {/*<p className="fw600 text-right text-uppercase fs14" style={invoice2}>{moment().format("MM/YYYY")}</p>*/}
                            </div>
                            <div className="col-12" style={borderStyle} />
                        </div>
                        <table className="fs12" style={row2}>
                            <thead className="text-uppercase" style={thead}>
                                <tr className="text-center">
                                    <th className="fw700 py-2" width="182px">Product</th>
                                    <th className="fw700 py-2" width="57px">On Hand</th>
                                    <th className="fw700 py-2" width="57px">Purchase</th>
                                    <th className="fw700 py-2" width="57px">Sales</th>
                                    <th className="fw700 py-2" width="67px">UOM</th>
                                    <th className="fw700 py-2" width="69px">Internal Reference</th>
                                    <th className="fw700 py-2" width="70px">Sale Price</th>
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

ReactDOM.render(<Products />, document.getElementById('products_list'))