var accountParams = getUrlParameter('account')

class JournalItems extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': [],
            'loaded': false,
            'check_all': false,
            'show_delete': false,
            'currentpage': 1,
            'journals': [],
            'search': false,
            'datalength': 0,
        }
        this.checkRow = this.checkRow.bind(this);
        this.deleteRow = this.deleteRow.bind(this);
        this.itemSearch = this.itemSearch.bind(this);
        this.paginationClick = this.paginationClick.bind(this);
    }

    componentDidMount() {
        var po = this
        var new_filters = { filters: [], sorts: [] }

        if (this.props.account != undefined) {
            new_filters.filters.push(['account', '=', this.props.account])
        }

        sessionStorage.setItem(window.location.pathname, JSON.stringify(new_filters))
        console.log('new_filters')
        console.log(new_filters)
        console.log(this.props.account)
        console.log(accountParams)
        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetjournalitem.vetjournalitem.get_journal_item_list",
            args: { filters: new_filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'data': r.message.journal_items, 'journals': r.message.journals, 'loaded': true, 'datalength': r.message.datalength });
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
            method: "vet_website.vet_website.doctype.vetjournalitem.vetjournalitem.get_journal_item_list",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'data': r.message.journal_items, 'journals': r.message.journals, 'loaded': true, 'datalength': r.message.datalength });
                }
            }
        });
        // }
    }

    itemSearch(filters) {
        if (filters.sort != undefined) {
            filters.journal = filters.sort
        }
        if (this.props.account != undefined) {
            filters.account = this.props.account
        }
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
            method: "vet_website.vet_website.doctype.vetjournalitem.vetjournalitem.get_journal_item_list",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    po.setState({ 'data': r.message.journal_items, 'loaded': true, 'datalength': r.message.datalength });
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
            method: "vet_website.vet_website.doctype.vetjournalitem.vetjournalitem.delete_journal_item",
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
            filename: "JournalItem-" + moment().format('MM-YYYY') + ".pdf",
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

        var row_style = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px' }
        var formStyle = { border: '1px solid #397DA6', color: '#397DA6' }
        var delete_button, back_button
        if (this.state.show_delete) {
            delete_button = <button className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={() => frappe.msgprint("Journal Item tidak bisa dihapus karena akan menyebabkan Journal Entry tidak balance, jika ingin menghapus lakukan lewat Journal Entry")}>Hapus</button>
        }
        if (this.props.account != undefined) {
            var color = { color: '#056EAD', cursor: 'pointer' }
            back_button = <span className="fs16 fw600 mr-4 my-auto" style={color} onClick={() => { history.back() }}><i className="fa fa-chevron-left mr-1" style={color}></i>Back</span>
        }

        var field_list = [
            //  {'label': 'Journal Name', 'field': 'journal_name', 'type': 'char'},
            { 'label': 'Period', 'field': 'period', 'type': 'char' },
            { 'label': 'Date', 'field': 'date', 'type': 'date' },
            { 'label': 'Reference', 'field': 'reference', 'type': 'char' },
            //  {'label': 'Status', 'field': 'status', 'type': 'char'},
        ]

        var sorts = [{ 'label': 'Pilih Journal', 'value': '' }]
        this.state.journals.forEach(j => sorts.push({ 'label': j.journal_name, 'value': j.name }))

        if (this.state.loaded) {
            return (
                <div>
                    <div className="row mx-0" style={row_style}>
                        <div className="col-auto my-auto">
                            {back_button}
                            {delete_button}
                            <button type="button" className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={() => this.printPDF()}>Print</button>
                        </div>
                        <div className="col">
                            <input value={this.state.search || ''} className="form-control fs12" name="search" placeholder="Search..." style={formStyle} onChange={e => this.setState({ search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' ? this.itemSearch(JSON.parse(sessionStorage.getItem(window.location.pathname))) : null} />
                        </div>
                        <div className="col-7">
                            <Filter sorts={[]} searchAction={this.itemSearch} field_list={field_list} filters={JSON.parse(sessionStorage.getItem(window.location.pathname))} />
                        </div>
                    </div>
                    <JournalItemsList account={this.props.account} data={this.state.data} checkRow={this.checkRow} checkAll={() => this.checkAll()} check_all={this.state.check_all} paginationClick={this.paginationClick} currentpage={this.state.currentpage} datalength={this.state.datalength} />
                    <PDF data={this.state.data} search={this.state.search} currentpage={this.state.currentpage} />
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

class JournalItemsList extends React.Component {
    render() {
        // var search = this.props.search
        // function filterRow(row) {
        //     function filterField(field) {
        //         return field ? field.toString().includes(search) : false
        //     }
        //     var fields = [row.period, moment(row.date).format("DD-MM-YYYY"), row.account_name, row.reference, row.debit, row.credit]
        //     return ![false, ''].includes(search) ? fields.some(filterField) : true
        // }

        var item_rows = []
        var panel_style = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px' }
        var data = this.props.data
        var account_col
        if (data.length != 0) {
            var ji = this
            // var total = 0
            // data.sort((a, b) => a.creation > b.creation).forEach(d => {
            //     if(['Asset','Expense'].includes(d.account_type)){
            //         total = total + (d.debit - d.credit)
            //         d.computed_total = total
            //     }
            //     else{
            //         total = total + (d.credit - d.debit)
            //         d.computed_total = total
            //     }
            // })
            // const indexOfLastTodo = this.props.currentpage * 30;
            // const indexOfFirstTodo = indexOfLastTodo - 30;
            // var currentItems
            // ![false,''].includes(search)?
            // currentItems = data.filter(filterRow).slice(indexOfFirstTodo, indexOfLastTodo):
            // currentItems = data.slice(indexOfFirstTodo, indexOfLastTodo)
            data.forEach(function (item, index) {
                if (item.debit != 0 || item.credit != 0) {
                    // if (currentItems.includes(item)){
                    item_rows.push(
                        <JournalItemsListRow account={ji.props.account} key={item.name} item={item} checkRow={() => ji.props.checkRow(index)} />
                    )
                    // }
                }
            })

            if (this.props.account != undefined) {
                account_col = (
                    <div className="col d-flex">
                        <span className="my-auto">Total</span>
                    </div>
                )
            }

            return (
                <div style={panel_style}>
                    <div className="row mx-0">
                        <div className="col-auto pl-2 pr-3">
                            <input type="checkbox" className="d-block my-3" checked={this.props.check_all} onChange={this.props.checkAll} />
                        </div>
                        <div className="col row-header">
                            <div className="row mx-0 fs12 fw600">
                                <div className="col d-flex">
                                    <span className="my-auto">Period</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">Effective Date</span>
                                </div>
                                <div className="col-4 d-flex">
                                    <span className="my-auto">Account</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">Reference</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">Debit</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">Credit</span>
                                </div>
                                {account_col}
                            </div>
                        </div>
                    </div>
                    {item_rows}
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

class JournalItemsListRow extends React.Component {
    clickRow() {
        var href = "/main/accounting/journal-entries/edit?n=" + this.props.item.parent
        window.location.href = href
    }

    render() {
        var item = this.props.item
        var checked = false
        var account_col
        if (item.checked) {
            checked = true
        }

        if (this.props.account != undefined) {
            account_col = (
                <div className="col d-flex">
                    <span className="my-auto">{formatter2.format(item.total || item.computed_total || 0)}</span>
                </div>
            )
        }

        return (
            <div className="row mx-0">
                <div className="col-auto pl-2 pr-3">
                    <input type="checkbox" className="d-block my-3" checked={checked} onChange={this.props.checkRow} />
                </div>
                <div className="col row-list row-list-link" onClick={() => this.clickRow()}>
                    <div className="row mx-0 fs12 fw600">
                        <div className="col d-flex">
                            <span className="my-auto">{item.period}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{moment(item.date).format("DD-MM-YYYY")}</span>
                        </div>
                        <div className="col-4 d-flex">
                            <span className="my-auto">{item.account_name}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{item.reference}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{formatter2.format(item.debit)}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{formatter2.format(item.credit)}</span>
                        </div>
                        {account_col}
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
        var search = this.props.search
        function filterRow(row) {
            function filterField(field) {
                return field ? field.toString().includes(search) : false
            }
            var fields = [row.period, moment(row.date).format("DD-MM-YYYY"), row.account_name, row.reference, row.debit, row.credit]
            return ![false, ''].includes(search) ? fields.some(filterField) : true
        }

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
        // // currentItems = data.slice(0,30)
        data.forEach((d, index) => {
            table_rows.push(
                <tr key={d.name} style={fs9}>
                    <td className="py-1">{moment(d.date).format('DD-MM-YYYY')}</td>
                    <td className="py-1">{d.reference}</td>
                    <td className="py-1">{d.account_name}</td>
                    <td className="py-1">{formatter.format(d.debit)}</td>
                    <td className="py-1">{formatter.format(d.credit)}</td>
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
                                <p className="fwbold text-right text-uppercase fs28" style={invoice}>Journal</p>
                                <p className="fw600 text-right text-uppercase fs14" style={invoice2}>{moment().format("MM/YYYY")}</p>
                            </div>
                            <div className="col-12" style={borderStyle} />
                        </div>
                        <table className="fs12" style={row2}>
                            <thead className="text-uppercase" style={thead}>
                                <tr className="text-center">
                                    <th className="fw700 py-2" width="89px" >Tanggal</th>
                                    <th className="fw700 py-2" width="88px" >Reference</th>
                                    <th className="fw700 py-2" width="202px" >Account</th>
                                    <th className="fw700 py-2" width="90px" >Debit</th>
                                    <th className="fw700 py-2" width="90px" >Credit</th>
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

var ji = document.getElementById('journal_item_list')
var gl = document.getElementById('general_ledger_list')
if (ji != undefined) {
    ReactDOM.render(<JournalItems />, document.getElementById('journal_item_list'))
}
if (gl != undefined) {
    ReactDOM.render(<JournalItems account={accountParams} />, document.getElementById('general_ledger_list'))
}
