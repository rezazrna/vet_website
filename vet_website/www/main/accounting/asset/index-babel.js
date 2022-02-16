class Asset extends React.Component {
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

        this.assetSearch = this.assetSearch.bind(this);
        this.checkRow = this.checkRow.bind(this);
        this.deleteRow = this.deleteRow.bind(this);
        this.paginationClick = this.paginationClick.bind(this);
    }

    componentDidMount() {
        var po = this
        var new_filters = { filters: [], sorts: [] }

        if (sessionStorage.getItem(window.location.pathname) != null && document.referrer.includes('/main/accounting/asset/edit')) {
            new_filters = JSON.parse(sessionStorage.getItem(window.location.pathname))
        }

        if (new_filters.hasOwnProperty("currentpage")) {
            this.setState({ 'currentpage': new_filters['currentpage'] })
        }

        if (new_filters.hasOwnProperty("search")) {
            this.setState({ 'search': filters['search'] })
        }

        sessionStorage.setItem(window.location.pathname, JSON.stringify(new_filters))
        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetasset.vetasset.get_asset_list",
            args: { filters: new_filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'data': r.message.asset, 'loaded': true, 'datalength': r.message.datalength });
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
            method: "vet_website.vet_website.doctype.vetasset.vetasset.get_asset_list",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'data': r.message.asset, 'loaded': true, 'datalength': r.message.datalength });
                }
            }
        });
        // }
    }

    assetSearch(filters) {
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
            method: "vet_website.vet_website.doctype.vetasset.vetasset.get_asset_list",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'data': r.message.asset, loaded: true, 'datalength': r.message.datalength });
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
            method: "vet_website.vet_website.doctype.vetasset.vetasset.delete_asset",
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

    render() {
        var sorts = [
            { 'label': 'Tanggal Dibuat DESC', 'value': 'creation desc' },
            { 'label': 'Tanggal Dibuat ASC', 'value': 'creation asc' },
            { 'label': 'Tanggal Asset DESC', 'value': 'asset_date desc' },
            { 'label': 'Tanggal Asset ASC', 'value': 'asset_date asc' },
            { 'label': 'Book Value DESC', 'value': 'book_value desc' },
            { 'label': 'Book Value ASC', 'value': 'book_value asc' },
        ]

        var field_list = [
            { 'label': 'Asset Name', 'field': 'asset_name', 'type': 'char' },
            { 'label': 'Period', 'field': 'period', 'type': 'char' },
            { 'label': 'Method', 'field': 'method', 'type': 'char' },
            { 'label': 'Book Value', 'field': 'book_value', 'type': 'char' },
            { 'label': 'Acquistion_date', 'field': 'acquistion_date', 'type': 'date' },
            { 'label': 'Original Value', 'field': 'original_value', 'type': 'char' },
            { 'label': 'Asset Date', 'field': 'asset_date', 'type': 'date' },
            { 'label': 'Residual Value', 'field': 'residual_value', 'type': 'char' },
            { 'label': 'Duration', 'field': 'duration', 'type': 'char' },
            { 'label': 'Status', 'field': 'status', 'type': 'char' },
        ]

        var row_style = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px' }
        var formStyle = { border: '1px solid #397DA6', color: '#397DA6' }
        var delete_button
        var add_button = (
            <button type="button" className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={() => window.location.pathname = "/main/accounting/asset/form"}><i className="fa fa-plus mr-2" />Tambah</button>
        )
        if (this.state.show_delete) {
            delete_button = <button className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={this.deleteRow}>Hapus</button>
        }

        if (this.state.loaded) {
            return (
                <div>
                    <div className="row mx-0" style={row_style}>
                        <div className="col-auto">
                            {add_button}
                            {delete_button}
                        </div>
                        <div className="col">
                            <input value={this.state.search || ''} className="form-control fs12" name="search" placeholder="Search..." style={formStyle} onChange={e => this.setState({ search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' ? this.assetSearch(JSON.parse(sessionStorage.getItem(window.location.pathname))) : null} />
                        </div>
                        <div className="col-8">
                            <Filter sorts={sorts} searchAction={this.assetSearch} field_list={field_list} filters={JSON.parse(sessionStorage.getItem(window.location.pathname))} />
                        </div>
                    </div>
                    <AssetList data={this.state.data} checkRow={this.checkRow} checkAll={() => this.checkAll()} check_all={this.state.check_all} paginationClick={this.paginationClick} currentpage={this.state.currentpage} datalength={this.state.datalength} />
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


class AssetList extends React.Component {
    render() {
        // var search = this.props.search
        // function filterRow(row) {
        //     function filterField(field) {
        //         return field ? field.toString().includes(search) : false
        //     }
        //     var fields = [row.asset_name, row.book_value, row.status, moment(row.first_depreciation_date).format("DD-MM-YYYY")]
        //     return ![false, ''].includes(search) ? fields.some(filterField) : true
        // }
        var asset_rows = []
        var panel_style = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px' }

        if (this.props.data.length != 0) {
            var pol = this

            // const indexOfLastTodo = this.props.currentpage * 30;
            // const indexOfFirstTodo = indexOfLastTodo - 30;
            // var currentItems
            // ![false,''].includes(search)?
            // currentItems = this.props.data.filter(filterRow).slice(indexOfFirstTodo, indexOfLastTodo):
            // currentItems = this.props.data.slice(indexOfFirstTodo, indexOfLastTodo)

            this.props.data.forEach(function (item, index) {
                // if (currentItems.includes(item)) {
                asset_rows.push(
                    <AssetListRow key={item.name} item={item} checkRow={() => pol.props.checkRow(index)} />
                )
                // }
            })

            return (
                <div style={panel_style}>
                    <div className="row mx-0">
                        <div className="col-auto pl-2 pr-3">
                            <input type="checkbox" className="d-block my-3" checked={this.props.check_all} onChange={this.props.checkAll} />
                        </div>
                        <div className="col row-header">
                            <div className="row mx-0 fs12 fw600">
                                <div className="col-4 d-flex">
                                    <span className="my-auto">Asset Name</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">First Depreciation Date</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">Book Value</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">Status</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {asset_rows}
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

class AssetListRow extends React.Component {
    clickRow() {
        var pathname = "/main/accounting/asset/edit?n=" + this.props.item.name
        window.location = pathname
    }

    render() {
        var checked = false
        if (this.props.item.checked) {
            checked = true
        }
        var item = this.props.item

        return (
            <div className="row mx-0">
                <div className="col-auto pl-2 pr-3">
                    <input type="checkbox" className="d-block my-3" checked={checked} onChange={this.props.checkRow} />
                </div>
                <div className="col row-list row-list-link" onClick={() => this.clickRow()}>
                    <div className="row mx-0 fs12 fw600">
                        <div className="col-4 d-flex">
                            <span className="my-auto">{item.asset_name}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{moment(item.first_depreciation_date).format("DD-MM-YYYY")}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{formatter2.format(item.book_value)}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{item.status}</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

ReactDOM.render(<Asset />, document.getElementById('asset_list'))