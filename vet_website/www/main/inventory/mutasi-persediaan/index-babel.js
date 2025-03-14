var product = getUrlParameter('product') || false
class MutasiPersediaan extends React.Component {
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
            // 'product': {},
            'gudang': {},
            // 'product_list': [],
            'gudang_list': [],
            'print_loading': false,
            'print_data': [],
            'list_year': []
        }

        this.setFilter = this.setFilter.bind(this);
        this.paginationClick = this.paginationClick.bind(this);
    }

    componentDidMount() {
            var td = this
        //     var args = { filters: [] }
        //     // if (product) {
        //     //     args.product = product

        //     //     frappe.call({
        //     //         type: "GET",
        //     //         method: "vet_website.vet_website.doctype.vetoperation.vetoperation.get_kartu_stok_list",
        //     //         args: { filters: args },
        //     //         callback: function (r) {
        //     //             if (r.message) {
        //     //                 console.log(r.message)
        //     //                 td.setState({ 'data': r.message.operation, 'loaded': true, 'datalength': r.message.datalength });
        //     //             }
        //     //         }
        //     //     });
        //     // }

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

    // kartuStokSearch(filters) {
    //     var td = this
    //     this.setState({
    //         currentpage: 1,
    //         loaded: false,
    //     });

    //     filters['currentpage'] = 1;
    //     filters['search'] = this.state.search
    //     sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))

    //     frappe.call({
    //         type: "GET",
    //         method: "vet_website.vet_website.doctype.vetoperation.vetoperation.get_kartu_stok_list",
    //         args: { filters: filters },
    //         callback: function (r) {
    //             if (r.message) {
    //                 td.setState({ 'data': r.message.operation, 'loaded': true, 'datalength': r.message.datalength });
    //             }
    //         }
    //     });
    // }

    filterChange(e) {
        var th = this
        var name = e.target.name
        var value = e.target.value
        if (name == 'month') {
            var stock_date
            this.setState({ month: value })
            stock_date = moment(this.state.year + '-' + value, 'YYYY-MM').add(1, 'month').format('YYYY-MM-DD')
            th.setState({ stock_date: stock_date })
        } else if (name == 'year') {
            var stock_date
            this.setState({ year: value })
            if (this.state.mode == 'annual') {
                stock_date = moment(value + '-12-31', 'YYYY-MM-DD').format('YYYY-MM-DD')
            } else {
                stock_date = moment(value + '-' + this.state.month, 'YYYY-MM').add(1, 'month').format('YYYY-MM-DD')
            }

            th.setState({ stock_date: stock_date })
        }
        // else if (name == 'product') {
        //     frappe.call({
        //         type: "GET",
        //         method: "vet_website.vet_website.doctype.vetoperation.vetoperation.get_product_list",
        //         args: { product_name: value },
        //         callback: function (r) {
        //             if (r.message) {
        //                 th.setState({ 'product_list': r.message });
        //             }
        //         }
        //     });
        // } 
        else if (name == 'gudang') {
            frappe.call({
                type: "GET",
                method: "vet_website.vet_website.doctype.vetoperation.vetoperation.get_gudang_list",
                args: { gudang_name: value },
                callback: function (r) {
                    if (r.message) {
                        console.log(r.message)
                        th.setState({ 'gudang_list': r.message });
                    }
                }
            });
        }
    }

    setMode(e) {
        var th = this
        var mode = e.target.value
        th.setState({ 'mode': mode, 'month': '', 'year': '' })
    }

    handleInputBlur(e) {
        const value = e.target.value
        var selected = false

        console.log('blur')

        // if (e.target.name == 'product') {
        //     if (this.state.product_list.length != 0) {
        //         selected = this.state.product_list[0]
        //     }
        // } else 
        if (e.target.name == 'gudang') {
            // if (this.state.gudang_list.length != 0) {
            //     selected = this.state.gudang_list[0]
            // }
            selected = this.state.gudang_list.find(p => p.gudang_name == value)
        }

        if (!selected) {
            e.target.value = ''

            // if (e.target.name == 'product') {
            //     this.setState({ product: {} })
            // } else 
            if (e.target.name == 'gudang') {
                this.setState({ gudang: {} })
            }
        } else {
            // if (e.target.name == 'product') {
            //     this.setState({ product: selected })
            // } else 
            if (e.target.name == 'gudang') {
                this.setState({ gudang: selected })
            }
        }
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

        // if (number * 30 > this.state.data.length) {
        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetoperation.vetoperation.get_mutasi_persediaan_list",
            args: { filters: filters, mode: td.state.mode, },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message)
                    td.setState({ 'data': r.message.mutasi_persediaan, 'loaded': true, 'datalength': r.message.datalength });
                }
            }
        });
        // }
    }

    setFilter(filters = false) {
        var td = this
        if (!filters) {
            filters = JSON.parse(sessionStorage.getItem(window.location.pathname))
        }
        console.log(this.state.mode)
        console.log(this.state.month)
        console.log(this.state.year)
        console.log(this.state.stock_date)
        console.log(this.state.gudang)
        if ((((this.state.mode == 'monthly' || this.state.mode == 'period') && this.state.month != '') || (this.state.mode == 'annual')) && this.state.year != '' && this.state.gudang.name) {
            td.setState({ 'loaded': false, 'currentpage': 1 })
            filters['currentpage'] = 1
            filters['search'] = this.state.search
            filters['stock_date'] = this.state.stock_date
            filters['gudang'] = this.state.gudang['name']
            sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))
            console.log(filters)
            frappe.call({
                type: "GET",
                method: "vet_website.vet_website.doctype.vetoperation.vetoperation.get_mutasi_persediaan_list",
                args: { filters: filters, mode: td.state.mode, },
                callback: function (r) {
                    if (r.message) {
                        console.log(r.message)
                        td.setState({ 'data': r.message.mutasi_persediaan, 'loaded': true, 'datalength': r.message.datalength });
                    }
                }
            });
        } else {
            frappe.msgprint(('Gudang, Month or Year must be selected'));
        }
    }

    getPrintData(is_excel=false) {
        var td = this

        if (!this.state.print_loading) {
            this.setState({ print_loading: true })
            if ((((this.state.mode == 'monthly' || this.state.mode == 'period') && this.state.month != '') || (this.state.mode == 'annual')) && this.state.year != '' && this.state.gudang.name) {
                frappe.call({
                    type: "GET",
                    method: "vet_website.vet_website.doctype.vetoperation.vetoperation.get_mutasi_persediaan_list",
                    args: { filters: JSON.parse(sessionStorage.getItem(window.location.pathname)), mode: td.state.mode, all: 1 },
                    callback: function (r) {
                        if (r.message) {
                            console.log(r.message)
                            td.setState({ 'print_data': r.message.mutasi_persediaan, 'loaded': true, 'datalength': r.message.datalength });
                            setTimeout(function() {
                                td.print(is_excel)
                            }, 3000);
                        }
                    }
                });
            } else {
                frappe.msgprint(('Gudang, Month or Year must be selected'));
            }
        }
    }

    print(is_excel=false) {
        var title = 'MutasiPersediaan-'
        var filters = JSON.parse(sessionStorage.getItem(window.location.pathname))

        if (filters.stock_date != undefined && this.state.mode != undefined) {
            if (this.state.mode == 'monthly') {
                var bulan = moment(this.state.year + '-' + this.state.month, 'YYYY-MM').format('MM-YYYY')
                console.log(bulan)
                title += 'Monthly-' + bulan
            } else if (this.state.mode == 'annual') {
                title += 'Annual-' + moment(filters.stock_date).format('YYYY')
            } else if (this.state.mode == 'period') {
                var sampai_bulan = moment(this.state.year + '-' + this.state.month, 'YYYY-MM').format('MM-YYYY')
                title += 'Periode-' + sampai_bulan
            }
        }

        if (is_excel) {
            var elt = document.getElementById('excel_page');
            var wb = XLSX.utils.table_to_book(elt, {
                sheet: "sheet1",
                raw: true,
            });
            var sheet = wb.Sheets[wb.SheetNames[0]];

            // for (let col of [0]) {
            //     this.formatColumn(sheet, col, 'dd-mm-yyyy')
            // }

            var sheetcols = [
                {wpx:90},
                {wpx:90},
                {wpx:90},
                {wpx:90},
                {wpx:90},
                {wpx:90},
                {wpx:90},
                {wpx:90},
                {wpx:90},
            ];
            
            sheet['!cols'] = sheetcols;

            XLSX.writeFile(wb, title + '.xlsx');
            this.setState({print_loading: false});
        } else {
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
    }

    render() {

        var sorts = [
            { 'label': 'Nama Product DESC', 'value': 'product_name desc' },
            { 'label': 'Nama Product ASC', 'value': 'product_name asc' },
            { 'label': 'Kode Product DESC', 'value': 'default_code desc' },
            { 'label': 'Kode Product ASC', 'value': 'default_code asc' },
        ]

        // var field_list = [
        //     { 'label': 'Product Name', 'field': 'product_name', 'type': 'char' },
        //     //  {'label': 'Uom Name', 'field': 'uom_name', 'type': 'char'},
        //     { 'label': 'Operation Number', 'field': 'parent', 'type': 'char' },
        //     { 'label': 'Quantity', 'field': 'quantity', 'type': 'char' },
        //     //  {'label': 'Quantity Done', 'field': 'quantity_done', 'type': 'char'},
        //     //  {'label': 'Inventory Value', 'field': 'inventory_value', 'type': 'char'},
        //     { 'label': 'Date', 'field': 'date', 'type': 'date' }
        // ]

        var row_style2 = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px', 'height': '72px' }
        var formStyle = { border: '1px solid #397DA6', color: '#397DA6' }
        // var product_options = [<option className="d-none" key="99999"></option>]
        var gudang_options = [<option className="d-none" key="99999"></option>]
        var month_options = [<option className="d-none" key="99999"></option>]
        var year_options = [<option className="d-none" key="99999"></option>]
        var i
        for (i = 0; i <= 11; i++) {
            var moment_month = moment(i + 1, 'M')
            // var moment_year = moment().add(-i, 'year')
            month_options.push(<option key={moment_month.format('MM')} value={moment_month.format('MM')}>{moment_month.format('MMMM')}</option>)
            // year_options.push(<option key={moment_year.format('YYYY')}>{moment_year.format('YYYY')}</option>)
        }

        this.state.list_year.forEach(function(e, index) {
            year_options.push(<option key={e}>{e}</option>)
        })
        
        // var formStyle = { border: '1px solid #397DA6', color: '#397DA6' }
        // var back_button = false
        // var color = { color: '#056EAD', cursor: 'pointer' }
        // if (document.referrer.includes('/main/inventory/products/edit?n=' + product)) {
        //     back_button = <span className="fs16 fw600 mr-auto my-auto" style={color} onClick={() => { history.back() }}><i className="fa fa-chevron-left mr-1" style={color}></i>Back</span>
        // }

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
                        <PDF data={chunk[i]} mode={this.state.mode} month={this.state.month} year={this.state.year}/>
                    )
                } else {
                    item_pdf.push(
                        <PDFListPage data={chunk[i]} pdfPage={i + 1}/>
                    )
                }
            }
        }

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

            // this.state.product_list.forEach((item, index) => product_options.push(<option value={item.product_name} key={index.toString()} />))
            this.state.gudang_list.forEach((item, index) => gudang_options.push(<option value={item.gudang_name} key={index.toString()} />))

            return (
                <div>
                    <div className="row mx-0" style={row_style2}>
                        <div className="col-auto my-auto">
                            <button type="button" className={this.state.print_loading ? "btn btn-outline-danger disabled text-uppercase fs12 fwbold mx-2" : "btn btn-outline-danger text-uppercase fs12 fwbold mx-2"} onClick={() => this.getPrintData()}>{this.state.print_loading ? (<span><i className="fa fa-spin fa-circle-o-notch mr-3" />Loading...</span>) : "Print"}</button>
                        </div>
                        <div className="col-auto my-auto">
                            <button type="button" className={this.state.print_loading ? "btn btn-outline-danger disabled text-uppercase fs12 fwbold mx-2" : "btn btn-outline-danger text-uppercase fs12 fwbold mx-2"} onClick={() => this.getPrintData(true)}>{this.state.print_loading ? (<span><i className="fa fa-spin fa-circle-o-notch mr-3" />Loading...</span>) : "Print Excel"}</button>
                        </div>
                        {/* <div className="col-2 my-auto">
                            <input name="product" placeholder="Product" list="products" className="form-control" defaultValue={this.state.product ? this.state.product.product_name : ''} onChange={e => this.filterChange(e)} onBlur={e => this.handleInputBlur(e)} />
                            <datalist id="products">
                                {product_options}
                            </datalist>
                        </div> */}
                        <div className="col my-auto">
                            <input value={this.state.search || ''} className="form-control fs12" name="search" placeholder="Search..." style={formStyle} onChange={e => this.setState({ search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' ? this.setFilter(JSON.parse(sessionStorage.getItem(window.location.pathname))) : null} />
                        </div>
                        <div className="col-2 my-auto">
                            <input name="gudang" placeholder="Gudang" list="gudang_list" className="form-control" defaultValue={this.state.gudang ? this.state.gudang.gudang_name : ''} onChange={e => this.filterChange(e)} onBlur={e => this.handleInputBlur(e)} />
                            <datalist id="gudang_list">
                                {gudang_options}
                            </datalist>
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
                        <div className="col my-auto">
                            <Filter sorts={sorts} searchAction={this.setFilter} field_list={[]} filters={JSON.parse(sessionStorage.getItem(window.location.pathname))} />
                        </div>
                        <div className="col-2 my-auto">
                            <button type="button" className="btn btn-outline-danger text-uppercase fs12 fwbold" onClick={() => this.setFilter()}>Set</button>
                        </div>
                    </div>
                    <MutasiPersediaanList items={this.state.data} paginationClick={this.paginationClick} currentpage={this.state.currentpage} datalength={this.state.datalength} />
                    {item_pdf}
                    <ExcelPage data={this.state.print_data} mode={this.state.mode} month={this.state.month} year={this.state.year} />
                </div>
            )

            // return (
            //     <div>
            //         <div className="row mx-0" style={row_style2}>
            //             <div className="col-auto">
            //                 {back_button}
            //                 <button type="button" className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={() => this.printPDF()}>Print</button>
            //             </div>
            //             <div className="col">
            //                 <input value={this.state.search || ''} className="form-control fs12" name="search" placeholder="Search..." style={formStyle} onChange={e => this.setState({ search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' ? this.stockMoveSearch(JSON.parse(sessionStorage.getItem(window.location.pathname))) : null} />
            //             </div>
            //             <div className="col-7 ml-auto">
            //                 <Filter sorts={sorts} searchAction={this.stockMoveSearch} field_list={field_list} filters={JSON.parse(sessionStorage.getItem(window.location.pathname))} />
            //             </div>
            //         </div>
            //         <StockMoveList items={this.state.data} paginationClick={this.paginationClick} currentpage={this.state.currentpage} datalength={this.state.datalength} />
            //         <PDF data={this.state.data} search={this.state.search} currentpage={this.state.currentpage} />
            //     </div>
            // )
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

class MutasiPersediaanList extends React.Component {
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
            // var list = this
            // const indexOfLastTodo = this.props.currentpage * 30;
            // const indexOfFirstTodo = indexOfLastTodo - 30;
            // var currentItems
            // ![false,''].includes(search)?
            // currentItems = items.filter(filterRow).slice(indexOfFirstTodo, indexOfLastTodo):
            // currentItems = items.slice(indexOfFirstTodo, indexOfLastTodo)
            items.forEach(function (item, index) {
                // if (currentItems.includes(item)){
                rows.push(
                    <MutasiPersediaanListRow key={index.toString()} item={item} />
                )
                // }
            })

            return (
                <div style={panel_style}>
                    <div className="row mx-0">
                        <div className="col row-header">
                            <div className="row mx-0 fs12 fw600">
                                {/* <div className="col-3 text-center">
                                    <span>Product</span>
                                </div> */}
                                <div className="col text-center">
                                    <span>Product Code</span>
                                </div>
                                <div className="col text-center">
                                    <span>Product Name</span>
                                </div>
                                <div className="col-1 text-center">
                                    <span>UOM</span>
                                </div>
                                <div className="col-1 text-center">
                                    <span>Awal</span>
                                </div>
                                <div className="col text-center">
                                    <span>Nilai Awal</span>
                                </div>
                                <div className="col-1 text-center">
                                    <span>Masuk</span>
                                </div>
                                <div className="col-1 text-center">
                                    <span>Keluar</span>
                                </div>
                                <div className="col-1 text-center">
                                    <span>Akhir</span>
                                </div>
                                <div className="col text-center">
                                    <span>Nilai Akhir</span>
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

class MutasiPersediaanListRow extends React.Component {
    // clickRow() {
    //     var pathname = "/main/inventory/operation/edit?n=" + this.props.item.parent
    //     window.location = pathname
    // }

    render() {

        var item = this.props.item
        // var date = item.date || item.creation
        // var moment_date = moment(date)

        return (
            <div className="row mx-0">
                <div className="col row-list row-list-link">
                    <div className="row mx-0 fs12 fw600">
                        {/* <div className="col-3 text-center">
                            <span>{item.product_name.replace(/&lt;/g, "<").replace(/&gt;/g, ">")}</span>
                        </div> */}
                        <div className="col text-center">
                            <span>{item.default_code}</span>
                        </div>
                        <div className="col text-center">
                            <span>{item.product_name}</span>
                        </div>
                        <div className="col-1 text-center">
                            <span>{item.uom_name}</span>
                        </div>
                        <div className="col-1 text-center">
                            <span>{formatter2.format(item.saldo_awal)}</span>
                        </div>
                        <div className="col text-center">
                            <span>{formatter2.format(item.nilai_awal)}</span>
                        </div>
                        <div className="col-1 text-center">
                            <span>{formatter2.format(item.masuk)}</span>
                        </div>
                        <div className="col-1 text-center">
                            <span>{formatter2.format(item.keluar)}</span>
                        </div>
                        <div className="col-1 text-center">
                            <span>{formatter2.format(item.saldo_akhir)}</span>
                        </div>
                        <div className="col text-center">
                            <span>{formatter2.format(item.nilai_akhir)}</span>
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
        // var search = this.props.search
        // function filterRow(row) {
        //     function filterField(field) {
        //         return field ? field.toString().replace(/&lt;/g, "<").replace(/&gt;/g, ">").includes(search) : false
        //     }
        //     var fields = [row.product_name, row.parent, row.quantity_done, row.from_name || 'Supplier', row.to_name || 'Customer', moment(row.date || row.creation).format('DD-MM-YYYY'), row.status]
        //     return ![false, ''].includes(search) ? fields.some(filterField) : true
        // }

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
        var subtitle = ''
        var filters = JSON.parse(sessionStorage.getItem(window.location.pathname))

        if (filters.stock_date != undefined && this.props.mode != undefined) {
            if (this.props.mode == 'monthly') {
                var bulan = moment(this.props.year + '-' + this.props.month, 'YYYY-MM').format('MM-YYYY')
                console.log(bulan)
                subtitle = 'Monthly ' + bulan
            } else if (this.props.mode == 'annual') {
                subtitle = 'Annual ' + moment(filters.stock_date).format('YYYY')
            } else if (this.props.mode == 'period') {
                var sampai_bulan = moment(this.props.year + '-' + this.props.month, 'YYYY-MM').format('MM-YYYY')
                subtitle = 'Periode ' + sampai_bulan
            }
        }

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
                    {/* <td className="py-1">{d.product_name}</td> */}
                    <td className="py-1">{d.default_code}</td>
                    <td className="py-1">{d.product_name}</td>
                    <td className="py-1">{d.uom_name}</td>
                    <td className="py-1">{formatter2.format(d.saldo_awal)}</td>
                    <td className="py-1">{formatter2.format(d.nilai_awal)}</td>
                    <td className="py-1">{formatter2.format(d.masuk)}</td>
                    <td className="py-1">{formatter2.format(d.keluar)}</td>
                    <td className="py-1">{formatter2.format(d.saldo_akhir)}</td>
                    <td className="py-1">{formatter2.format(d.nilai_akhir)}</td>
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
                                <p className="fwbold text-right text-uppercase fs28" style={invoice}>Mutasi Persediaan</p>
                                <p className="fw600 text-right text-uppercase fs14" style={invoice2}>{subtitle}</p>
                            </div>
                            <div className="col-12" style={borderStyle} />
                        </div>
                        <table className="fs12" style={row2}>
                            <thead className="text-uppercase" style={thead}>
                                <tr className="text-center">
                                    {/* <th className="fw700 py-2" width="182px">Product</th> */}
                                    <th className="fw700 py-2" width="62px">Product Code</th>
                                    <th className="fw700 py-2" width="63px">Product Name</th>
                                    <th className="fw700 py-2" width="63px">UOM</th>
                                    <th className="fw700 py-2" width="63px">Awal</th>
                                    <th className="fw700 py-2" width="63px">Nilai Awal</th>
                                    <th className="fw700 py-2" width="63px">Masuk</th>
                                    <th className="fw700 py-2" width="63px">Keluar</th>
                                    <th className="fw700 py-2" width="63px">Akhir</th>
                                    <th className="fw700 py-2" width="63px">Nilai Akhir</th>
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
                    {/* <td className="py-1">{d.product_name}</td> */}
                    <td className="py-1">{d.default_code}</td>
                    <td className="py-1">{d.product_name}</td>
                    <td className="py-1">{d.uom_name}</td>
                    <td className="py-1">{formatter2.format(d.saldo_awal)}</td>
                    <td className="py-1">{formatter2.format(d.nilai_awal)}</td>
                    <td className="py-1">{formatter2.format(d.masuk)}</td>
                    <td className="py-1">{formatter2.format(d.keluar)}</td>
                    <td className="py-1">{formatter2.format(d.saldo_akhir)}</td>
                    <td className="py-1">{formatter2.format(d.nilai_akhir)}</td>
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
        // var search = this.props.search
        // function filterRow(row) {
        //     function filterField(field) {
        //         return field ? field.toString().replace(/&lt;/g, "<").replace(/&gt;/g, ">").includes(search) : false
        //     }
        //     var fields = [row.product_name, row.parent, row.quantity_done, row.from_name || 'Supplier', row.to_name || 'Customer', moment(row.date || row.creation).format('DD-MM-YYYY'), row.status]
        //     return ![false, ''].includes(search) ? fields.some(filterField) : true
        // }

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
        var subtitle = ''
        var filters = JSON.parse(sessionStorage.getItem(window.location.pathname))

        if (filters != null && filters.stock_date != undefined && this.props.mode != undefined) {
            if (this.props.mode == 'monthly') {
                var bulan = moment(this.props.year + '-' + this.props.month, 'YYYY-MM').format('MM-YYYY')
                console.log(bulan)
                subtitle = 'Monthly ' + bulan
            } else if (this.props.mode == 'annual') {
                subtitle = 'Annual ' + moment(filters.stock_date).format('YYYY')
            } else if (this.props.mode == 'period') {
                var sampai_bulan = moment(this.props.year + '-' + this.props.month, 'YYYY-MM').format('MM-YYYY')
                subtitle = 'Periode ' + sampai_bulan
            }
        }

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
                    {/* <td className="py-1">{d.product_name}</td> */}
                    <td className="py-1" width="90px">{d.default_code}</td>
                    <td className="py-1" width="90px">{d.product_name}</td>
                    <td className="py-1" width="90px">{d.uom_name}</td>
                    <td className="py-1" width="90px">{formatter2.format(d.saldo_awal)}</td>
                    <td className="py-1" width="90px">{formatter2.format(d.nilai_awal)}</td>
                    <td className="py-1" width="90px">{formatter2.format(d.masuk)}</td>
                    <td className="py-1" width="90px">{formatter2.format(d.keluar)}</td>
                    <td className="py-1" width="90px">{formatter2.format(d.saldo_akhir)}</td>
                    <td className="py-1" width="90px">{formatter2.format(d.nilai_akhir)}</td>
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
                            <td colspan="2">Mutasi Persediaan</td>
                        </tr>
                        <tr>
                            <td colspan="3">{profile.address}</td>
                        </tr>
                        <tr>
                            <td colspan="3">Telp. : {profile.phone}</td>
                            <td colspan="2">{subtitle}</td>
                        </tr>
                        <tr></tr>
                        <tr></tr>
                        <tr className="text-center">
                            {/* <th className="fw700 py-2" width="182px">Product</th> */}
                            <th className="fw700 py-2" width="90px">Product Code</th>
                            <th className="fw700 py-2" width="90px">Product Name</th>
                            <th className="fw700 py-2" width="90px">UOM</th>
                            <th className="fw700 py-2" width="90px">Awal</th>
                            <th className="fw700 py-2" width="90px">Nilai Awal</th>
                            <th className="fw700 py-2" width="90px">Masuk</th>
                            <th className="fw700 py-2" width="90px">Keluar</th>
                            <th className="fw700 py-2" width="90px">Akhir</th>
                            <th className="fw700 py-2" width="90px">Nilai Akhir</th>
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

ReactDOM.render(<MutasiPersediaan />, document.getElementById('mutasi_persediaan_list'))