class JournalEntries extends React.Component {
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
        this.itemSearch = this.itemSearch.bind(this);
        this.expandCollapse = this.expandCollapse.bind(this);
        this.toggleShow = this.toggleShow.bind(this);
        this.paginationClick = this.paginationClick.bind(this);
    }

    componentDidMount() {
        var po = this
        var new_filters = { filters: [], sorts: [] }

        if (sessionStorage.getItem(window.location.pathname) != null && document.referrer.includes('/main/accounting/journal-entries')) {
            new_filters = JSON.parse(sessionStorage.getItem(window.location.pathname))
        }

        if (document.location.href.includes('?')) {
            var url = document.location.href,
                params = url.split('?')[1].split('='),
                key = params[0],
                value = params[1]
        }

        if (new_filters.hasOwnProperty("currentpage")) {
            this.setState({ 'currentpage': new_filters['currentpage'] })
        }

        if (new_filters.hasOwnProperty("search")) {
            this.setState({ 'search': new_filters['search'] })
        }

        if (params) {
            new_filters[key] = value
            sessionStorage.setItem(window.location.pathname, JSON.stringify(new_filters))

            this.itemSearch(new_filters)
        } else {
            sessionStorage.setItem(window.location.pathname, JSON.stringify(new_filters))

            frappe.call({
                type: "GET",
                method: "vet_website.vet_website.doctype.vetjournalentry.vetjournalentry.get_journal_entry_list",
                args: { filters: new_filters },
                callback: function (r) {
                    if (r.message) {
                        console.log(r.message)
                        po.setState({ 'data': r.message.journal_entries, 'journals': r.message.journals, 'loaded': true, 'datalength': r.message.datalength });
                    }
                }
            });
        }
    }

    paginationClick(number) {
        console.log('Halo')
        var po = this
        var filters = JSON.parse(sessionStorage.getItem(window.location.pathname))

        if (document.location.href.includes('?')) {
            var url = document.location.href,
                params = url.split('?')[1].split('='),
                key = params[0],
                value = params[1]
        }

        if (params) {
            filters[key] = value
        }

        this.setState({
            currentpage: Number(number),
            loaded: false,
        });

        filters['currentpage'] = this.state.currentpage

        sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))

        // if (number * 30 > this.state.data.length) {
        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetjournalentry.vetjournalentry.get_journal_entry_list",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    po.setState({ 'data': r.message.journal_entries, 'journals': r.message.journals, 'loaded': true, 'datalength': r.message.datalength });
                }
            }
        });
        // }
    }

    itemSearch(filters) {
        var po = this
        if (filters.sort != undefined) {
            filters.journal = filters.sort
        }

        this.setState({
            currentpage: 1,
            loaded: false,
        });

        filters['currentpage'] = 1;
        filters['search'] = this.state.search
        sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))

        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetjournalentry.vetjournalentry.get_journal_entry_list",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    po.setState({ 'data': r.message.journal_entries, 'loaded': true, 'datalength': r.message.datalength });
                }
            }
        });
    }

    expandCollapse(e, type) {
        e.preventDefault()
        var new_data = this.state.data
        var td = this
        new_data.forEach(function (item, index) {
            if (type == 'expand') {
                item.show = true

                if (!item.loaded) {
                    frappe.call({
                        type: "GET",
                        method: "vet_website.vet_website.doctype.vetjournalentry.vetjournalentry.get_journal_entry_detail",
                        args: { name: item.name },
                        callback: function (r) {
                            if (r.message) {
                                item.detail = r.message
                                item.loaded = true
                                td.setState({ data: new_data })
                            }
                        }
                    });
                }
            } else {
                item.show = false
            }
        })

        this.setState({ data: new_data })
    }

    toggleShow(e, index) {
        e.stopPropagation();
        var new_data = this.state.data
        var td = this

        new_data[index]['show'] = !new_data[index]['show']

        this.setState({ data: new_data })

        if (!new_data[index]['loaded']) {
            frappe.call({
                type: "GET",
                method: "vet_website.vet_website.doctype.vetjournalentry.vetjournalentry.get_journal_entry_detail",
                args: { name: new_data[index]['name'] },
                callback: function (r) {
                    if (r.message) {
                        new_data[index]['detail'] = r.message
                        new_data[index]['loaded'] = true
                        td.setState({ data: new_data })
                    }
                }
            });
        }
    }

    render() {

        var row_style = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px' }
        var formStyle = { border: '1px solid #397DA6', color: '#397DA6' }
        var backButton, tambahButton

        var field_list = [
            { 'label': 'Journal Entry Code', 'field': 'name', 'type': 'char' },
            { 'label': 'Period', 'field': 'period', 'type': 'char' },
            { 'label': 'Date', 'field': 'date', 'type': 'date' },
            { 'label': 'Journal Name', 'field': 'journal_name', 'type': 'char' },
            { 'label': 'Reference', 'field': 'reference', 'type': 'char' },
            { 'label': 'Status', 'field': 'status', 'type': 'char' },
        ]

        var sorts = [{ 'label': 'Pilih Journal', 'value': '' }]
        this.state.journals.forEach(j => sorts.push({ 'label': j.journal_name, 'value': j.name }))
        if (document.location.href.includes('?')) {
            var color = { color: '#056EAD', cursor: 'pointer' }
            backButton = <span className="fs16 fw600 mr-4 my-auto" style={color} onClick={() => { history.back() }}><i className="fa fa-chevron-left mr-1" style={color}></i>Back</span>
        } else {
            tambahButton = <a href="/main/accounting/journal-entries/form" className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2"><i className="fa fa-plus mr-2" />Tambah</a>
        }

        if (this.state.loaded) {
            return (
                <div>
                    <div className="row mx-0" style={row_style}>
                        <div className="col-auto">
                            {backButton}
                            {tambahButton}
                        </div>
                        <div className="col">
                            <input value={this.state.search || ''} className="form-control fs12" name="search" placeholder="Search..." style={formStyle} onChange={e => this.setState({ search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' ? this.itemSearch(JSON.parse(sessionStorage.getItem(window.location.pathname))) : null} />
                        </div>
                        <div className="col-7">
                            <Filter sorts={[]} searchAction={this.itemSearch} field_list={field_list} filters={JSON.parse(sessionStorage.getItem(window.location.pathname))} />
                        </div>
                    </div>
                    <JournalEntriesList data={this.state.data} expandCollapse={this.expandCollapse} toggleShow={this.toggleShow} paginationClick={this.paginationClick} currentpage={this.state.currentpage} datalength={this.state.datalength} />
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

class JournalEntriesList extends React.Component {
    render() {
        // var search = this.props.search
        // function filterRow(row) {
        //     function filterField(field) {
        //         return field ? field.toString().includes(search) : false
        //     }
        //     var fields = [row.name, row.period, moment(row.date).format("DD-MM-YYYY"), row.journal_name, row.reference, row.status]
        //     return ![false, ''].includes(search) ? fields.some(filterField) : true
        // }
        var rows = []
        var panel_style = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px' }
        var data = this.props.data
        var color = { color: '#056EAD' }
        var cursor = { cursor: 'pointer' }

        if (data.length != 0) {
            var cl = this
            // const indexOfLastTodo = this.props.currentpage * 30;
            // const indexOfFirstTodo = indexOfLastTodo - 30;
            // var currentItems
            // ![false,''].includes(search)?
            // currentItems = data.filter(filterRow).slice(indexOfFirstTodo, indexOfLastTodo):
            // currentItems = data.slice(indexOfFirstTodo, indexOfLastTodo)

            data.forEach(function (value, index) {
                // if (currentItems.includes(value)){
                rows.push(
                    <JournalEntriesListRow key={value.name} item={value} index={index.toString()} toggleShow={cl.props.toggleShow} />
                )
                // }
            })

            return (
                <div style={panel_style}>
                    <div className="row mx-0 justify-content-end fs14 fw600 mb-2" style={color}>
                        <span onClick={e => this.props.expandCollapse(e, 'expand')} style={cursor}>Expand All</span>
                        <span className="mx-3">|</span>
                        <span onClick={e => this.props.expandCollapse(e, 'collapse')} style={cursor}>Collapse All</span>
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

class JournalEntriesListRow extends React.Component {
    // clickRow() {
    //     var pathname = "/main/accounting/journal-entries/edit?n=" + this.props.item.name
    //     window.location = pathname
    // }

    // referenceClick(e) {
    //     e.stopPropagation()
    //     var reference = this.props.item.reference
    //     var regexes = [
    //         { regex: /(POSORDER-\d)/g, pathname: '/main/kasir/pos-order/form?n=' },
    //         { regex: /(PO\d)/g, pathname: '/main/purchases/purchase-order/edit?n=' },
    //         { regex: /(VCI-\d)/g, pathname: '/main/kasir/customer-invoices/edit?n=' },
    //         { regex: /(VOC-\d)/g, pathname: '/main/kasir/deposit?id=' },
    //         { regex: /(VE-\d)/g, pathname: '/main/accounting/expenses?n=' },
    //     ]
    //     regexes.forEach(r => {
    //         console.log(r.regex)
    //         if (reference.match(r.regex)) {
    //             window.location.href = r.pathname + reference
    //         }
    //     })
    // }

    render() {
        var item = this.props.item
        var row_style = { color: '#056EAD', background: '#84D1FF', 'boxShadow': '0px 6px 23px rgba(0, 0, 0, 0.1)', borderRadius: '5px', cursor: 'pointer' }
        var cursor = { cursor: 'pointer' }
        var chevron_class = "fa fa-chevron-down my-auto p-2 ml-auto d-block"
        var detail_row = []
        var style, total_detail
        var detail_style = { background: '#F5FBFF' }

        if (item.show && item.loaded) {
            if (item.detail.length != 0) {
                var total_debit = 0
                var total_credit = 0

                item.detail.forEach(function (value, index) {
                    if (value.debit != 0 || value.credit != 0) {
                        detail_row.push(
                            <JournalEntriesDetail key={value.name} item={value} />
                        )
                    }

                    total_debit += value.debit
                    total_credit += value.credit
                })

                var total_style = { background: '#CEEDFF', color: '#056EAD' }

                total_detail = <div className="row mx-0 fw600 mb-3 p-1 justify-content-end" style={total_style}>
                    <div className="col-5">
                        <div className="row">
                            <div className="col-6 text-right">
                                <span>{formatter2.format(total_debit)}</span>
                            </div>
                            <div className="col-6 text-right">
                                <span>{formatter2.format(total_credit)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            }

            chevron_class = "fa fa-chevron-up my-auto p-2 ml-auto d-block"
        }

        if (item.status == 'Unposted') {
            style = 'bg-warning'
        } else if (item.status == 'Posted') {
            style = 'bg-success'
        }

        var reHref = ''
        var reference = this.props.item.reference
        var regexes = [
            { regex: /(POSORDER-\d)/g, pathname: '/main/kasir/pos-order/form?n=' },
            { regex: /(PO\d)/g, pathname: '/main/purchases/purchase-order/edit?n=' },
            { regex: /(VCI-\d)/g, pathname: '/main/kasir/customer-invoices/edit?n=' },
            { regex: /(VOC-\d)/g, pathname: '/main/kasir/deposit?id=' },
            { regex: /(VE-\d)/g, pathname: '/main/accounting/expenses?n=' },
        ]
        regexes.forEach(r => {
            console.log(r.regex)
            if (reference.match(r.regex)) {
                reHref = r.pathname + reference
            }
        })

        var link_reference = <a href={reHref}><img src="/static/img/main/menu/tautan.png" className="mx-2" style={cursor} /></a>

        return (
            <div className="mb-3">
                <a href={"/main/accounting/journal-entries/edit?n=" + this.props.item.name} className="row mx-0 px-3 fs14 fw600 py-2 mb-2" style={row_style}>
                    <div className="col-auto text-center my-auto px-1">
                        <p className="bg-white mb-0 rounded-lg px-2 py-1 text-truncate">{item.name}</p>
                    </div>
                    <div className="col-auto text-center my-auto px-1">
                        <p className="bg-white mb-0 rounded-lg px-2 py-1 text-truncate">{item.period}</p>
                    </div>
                    <div className="col-2 d-flex fs12 fs18md my-auto px-1">
                        <span className="mx-auto">{moment(item.date).format("DD-MM-YYYY")}</span>
                    </div>
                    <div className="col d-flex fs18md my-auto px-1">
                        <span className="mx-auto">{item.journal_name}</span>
                    </div>
                    <div className="col-2 d-flex fs18md my-auto px-1">
                        <span className="mx-auto">{formatter2.format(item.amount)}</span>
                    </div>
                    <div className="col-1 d-flex fs18md mr-auto my-auto px-1">
                        <span className="ml-auto">{item.reference || ''}</span>{(item.reference || '').match(/(POSORDER-\d)|(PO\d)|(VCI-\d)|(VOC-\d)|(VE-\d)/g) ? link_reference : false}
                    </div>
                    <div className="col-2 d-flex fs18md mr-auto my-auto px-1">
                        <span className="ml-auto">{item.keterangan}</span>
                    </div>
                    <div className="col-2 d-flex flex-column px-1">
                        <span title={item.status} className={style + " fs12 rounded text-center text-white px-3 ml-auto d-block text-truncate"}>
                            {item.status}
                        </span>
                        <i className={chevron_class} style={cursor} onClick={e => this.props.toggleShow(e, this.props.index)} />
                    </div>
                </a>
                <div style={detail_style}>
                    {detail_row}
                    {total_detail}
                </div>
            </div>
        )
    }
}

class JournalEntriesDetail extends React.Component {
    render() {
        var color = { color: '#056EAD' }
        var item = this.props.item

        return (
            <div className="row mx-0 fw600 mb-3 p-1" style={color}>
                <div className="col-2">
                    <span>{item.account_code}</span>
                </div>
                <div className="col">
                    <span>{item.account_name}</span>
                </div>
                <div className="col-5">
                    <div className="row">
                        <div className="col-6 text-right">
                            <span>{formatter2.format(item.debit)}</span>
                        </div>
                        <div className="col-6 text-right">
                            <span>{formatter2.format(item.credit)}</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

ReactDOM.render(<JournalEntries />, document.getElementById('journal_entry_list'))