class PiutangBeredar extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': [],
            'print_data': [],
            'loaded': false,
            'search': false,
            'currentpage': 1,
            'datalength': 0,
            'print_loading': false,
        }
        this.piutangSearch = this.piutangSearch.bind(this);
        this.paginationClick = this.paginationClick.bind(this);
    }
    
    componentDidMount() {
        var po = this
        var filters

        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.get_customer_open_invoice",
            args: {},
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'data': r.message.data, 'loaded': true, 'datalength': r.message.datalength });
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

        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.get_customer_open_invoice",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'data': r.message.data, 'loaded': true, 'datalength': r.message.datalength });
                }
            }
        });
    }

    piutangSearch(filters) {
        var new_filters = Object.assign({}, filters)
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
            method: "vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.get_customer_open_invoice",
            args: { filters: new_filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'data': r.message.data, loaded: true, 'datalength': r.message.datalength });
                }
            }
        });
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
                method: "vet_website.vet_website.doctype.vetcustomerinvoice.vetcustomerinvoice.get_customer_open_invoice",
                args: { filters: filters, all_page: true },
                callback: function (r) {
                    if (r.message) {
                        console.log(r.message);
                        po.setState({print_data: r.message.data});
                        setTimeout(function() {
                            po.printPDF()
                        }, 3000);
                    }
                }
            });
        }
    }

    printPDF() {
        var elements = Array.from(document.querySelectorAll('div[id^="pdf-"]'))
        var opt = {
            margin: [10, 0, 10, 0],
            filename: "PiutangBeredar-" + moment().format('MM-YYYY') + ".pdf",
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

        console.log('mulai worker')
        worker = worker.save().then(e => {
            console.log('setelah')
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
		var row_style2 = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '2px', 'marginBottom': '18px', 'height': '72px'}
        var formStyle = { border: '1px solid #397DA6', color: '#397DA6' }
        
        var print_button = <button type="button" className={this.state.print_loading
            ? "btn btn-outline-danger text-uppercase fs12 fwbold mx-2 disabled"
            : "btn btn-outline-danger text-uppercase fs12 fwbold mx-2"} onClick={() => this.getPrintData()}>Print</button>

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
                        <PDF data={chunk[i]} valuation={this.props.valuation}/>
                    )
                } else {
                    item_pdf.push(
                        <PDFListPage data={chunk[i]} pdfPage={i + 1} valuation={this.props.valuation}/>
                    )
                }
            }
        }
        
        if (this.state.loaded){
            return(
                <div>
                    <div className="row mx-0" style={row_style2}>
                        <div className="col-auto my-auto">
                            {print_button}
                        </div>
                        <div className="col-4 my-auto">
                            <input value={this.state.search || ''} className="form-control fs12" name="search" placeholder="Search..." style={formStyle} onChange={e => this.setState({ search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' ? this.piutangSearch(JSON.parse(sessionStorage.getItem(window.location.pathname))) : null} />
                        </div>
                    </div>
                    <PiutangList items={this.state.data} paginationClick={this.paginationClick} currentpage={this.state.currentpage} datalength={this.state.datalength}/>
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

class PiutangList extends React.Component {
    render() {
        var rows = []
        var panel_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px'}
        var items = this.props.items
        
        if (items.length != 0 ){
            var list = this
            
            items.forEach(function(item, index){
                rows.push(
                    <PiutangListRow key={index.toString()} item={item}/>
                )
            })
            
            return(
                <div style={panel_style}>
                	{rows}
                	<Pagination paginationClick={this.props.paginationClick} datalength={this.props.datalength} currentpage={this.props.currentpage} itemperpage='10'/>
                </div>
            )
        }
        else {
            return(
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

class PiutangListRow extends React.Component {
    render() {
        var row_style = {color: '#056EAD', background: '#84D1FF', 'boxShadow': '0px 6px 23px rgba(0, 0, 0, 0.1)', borderRadius: '5px'}
        var detail_style = {background: '#F5FBFF', padding: '20px 0'}
        var color = {color: '#056EAD'}
        var item = this.props.item
        var invoice_group

        var rows = []

        item.invoices.forEach((i, index) => rows.push(<InvoiceRow item={i} key={index.toString()}/>))

        var total = item.invoices.reduce((total, b) => total + (b.all_total || b.total), 0)
        var total_remaining = item.invoices.reduce((total, b) => total + b.remaining, 0)

        invoice_group = (
            <div style={detail_style}>
                <div className="row mx-0 fs14 fw600" style={color}>
                    <div className="col d-flex">
                        <span className="my-auto">No Invoice</span>
                    </div>
                    <div className="col d-flex">
                        <span className="my-auto">Tanggal</span>
                    </div>
                    <div className="col d-flex">
                        <span className="my-auto">Nama Hewan</span>
                    </div>
                    <div className="col d-flex">
                        <span className="my-auto">Total</span>
                    </div>
                    <div className="col d-flex">
                        <span className="my-auto">Remaining</span>
                    </div>
                </div>
                {rows}
            </div>
        )
        
        return(
            <div className="mb-2">
    			<div className="row mx-0 fs14 fw600 py-2" style={row_style}>
    				<div className="col d-flex">
    					<span className="my-auto">{item.name}</span>
    				</div>
                    <div className="col d-flex">
    					<span className="my-auto">{item.owner_name}</span>
    				</div>
                    <div className="col d-flex"></div>
    				<div className="col d-flex">
    					<span className="my-auto">{formatter2.format(total)}</span>
    				</div>
                    <div className="col d-flex">
    					<span className="my-auto">{formatter2.format(total_remaining)}</span>
    				</div>
    			</div>
    			{invoice_group}
			</div>
        )
    }
}

class InvoiceRow extends React.Component {
    render(){
        var invoice = this.props.item
        
        return(
            <div className="row mx-0 fs14 fw600">
                <div className="col d-flex">
                    <span className="my-auto">{invoice.name}</span>
                </div>
                <div className="col d-flex">
                    <span className="my-auto">{moment(invoice.is_refund ? invoice.refund_date : invoice.invoice_date).subtract(0, 'minute').format("YYYY-MM-DD HH:mm:ss")}</span>
                </div>
                <div className="col d-flex">
                    <span className="my-auto">{invoice.pet_name}</span>
                </div>
                <div className="col d-flex">
                    <span className="my-auto">{formatter.format(invoice.all_total || invoice.total)}</span>
                </div>
                <div className="col d-flex">
                    <span className="my-auto">{formatter.format(invoice.remaining)}</span>
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
            var total = d.invoices.reduce((total, b) => total + (b.all_total || b.total), 0)
            var total_remaining = d.invoices.reduce((total, b) => total + b.remaining, 0)

            table_rows.push(
                <tr key={d.name} style={fs9} className="text-center">
                    <td className="py-1">{d.name}</td>
                    <td className="py-1">{d.owner_name}</td>
                    <td className="py-1"></td>
                    <td className="py-1">{formatter.format(total)}</td>
                    <td className="py-1">{formatter.format(total_remaining)}</td>
                </tr>
            )

            d.invoices.forEach((i, count) => {
                table_rows.push(
                    <tr key={i.name} style={fs9} className="text-center">
                        <td className="py-1">{i.name}</td>
                        <td className="py-1">{moment(i.is_refund ? i.refund_date : i.invoice_date).subtract(0, 'minute').format("DD-MM-YYYY")}</td>
                        <td className="py-1">{i.pet_name}</td>
                        <td className="py-1">{formatter.format(i.total)}</td>
                        <td className="py-1">{formatter.format(i.remaining)}</td>
                    </tr>
                )
            })

            table_rows.push(
                <tr className="text-center">
                    <td className="py-1"></td>
                    <td className="py-1"></td>
                    <td className="py-1"></td>
                    <td className="py-1"></td>
                    <td className="py-1"></td>
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
                                <p className="fwbold text-right text-uppercase fs28" style={invoice}>{"Piutang Beredar"}</p>
                                <p className="fw600 text-right text-uppercase fs14" style={invoice2}>{moment().format("MM/YYYY")}</p>
                            </div>
                            <div className="col-12" style={borderStyle} />
                        </div>
                        <table className="fs12" style={row2}>
                            <thead className="text-uppercase" style={thead}>
                                <tr className="text-center">
                                    <th className="fw700 py-2" width="58px" >ID</th>
                                    <th className="fw700 py-2" width="91px" >Tanggal</th>
                                    <th className="fw700 py-2" width="101px" >Nama Pasien</th>
                                    <th className="fw700 py-2" width="73px" >Total</th>
                                    <th className="fw700 py-2" width="73px" >Remaining</th>
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
        var row2 = { width: '100%'}
        var fs9 = { fontSize: 9 }
        var table_rows = []

        data.forEach((d, index) => {
            var total = d.invoices.reduce((total, b) => total + (b.all_total || b.total), 0)
            var total_remaining = d.invoices.reduce((total, b) => total + b.remaining, 0)

            table_rows.push(
                <tr key={d.name} style={fs9} className="text-center">
                    <td className="py-1">{d.name}</td>
                    <td className="py-1">{d.owner_name}</td>
                    <td className="py-1"></td>
                    <td className="py-1">{formatter.format(total)}</td>
                    <td className="py-1">{formatter.format(total_remaining)}</td>
                </tr>
            )

            d.invoices.forEach((i, count) => {
                table_rows.push(
                    <tr key={i.name} style={fs9} className="text-center">
                        <td className="py-1">{i.name}</td>
                        <td className="py-1">{moment(i.is_refund ? i.refund_date : i.invoice_date).subtract(0, 'minute').format("DD-MM-YYYY")}</td>
                        <td className="py-1">{i.pet_name}</td>
                        <td className="py-1">{formatter.format(i.total)}</td>
                        <td className="py-1">{formatter.format(i.remaining)}</td>
                    </tr>
                )
            })

            table_rows.push(
                <tr className="text-center">
                    <td className="py-1"></td>
                    <td className="py-1"></td>
                    <td className="py-1"></td>
                    <td className="py-1"></td>
                    <td className="py-1"></td>
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

ReactDOM.render(<PiutangBeredar />, document.getElementById('piutang_beredar_list'))