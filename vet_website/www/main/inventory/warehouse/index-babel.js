class Warehouse extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': [],
            'loaded': false,
            'check_all': false,
            'show_delete': false,
            'currentpage': 1,
            'show_form': false,
            'search': false,
            'currentUser': {},
            'datalength': 0,
        }
        this.checkRow = this.checkRow.bind(this);
        this.deleteRow = this.deleteRow.bind(this);
        this.newGudang = this.newGudang.bind(this)
        this.toggleShowForm = this.toggleShowForm.bind(this)
        this.gudangSearch = this.gudangSearch.bind(this)
    }

    componentDidMount() {
        var td = this
        var new_filters = { filters: [], sorts: [] }


        frappe.call({
            type: "GET",
            method: "vet_website.methods.get_current_user",
            args: {},
            callback: function (r) {
                if (r.message) {
                    td.setState({ 'currentUser': r.message });
                }
            }
        });

        sessionStorage.setItem(window.location.pathname, JSON.stringify(new_filters))
        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetgudang.vetgudang.get_gudang_list",
            args: { filters: new_filters },
            callback: function (r) {
                console.log(r.message)
                if (r.message) {
                    td.setState({ 'data': r.message.gudang, 'loaded': true, 'datalength': r.message.datalength });
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
            method: "vet_website.vet_website.doctype.vetgudang.vetgudang.get_gudang_list",
            args: { filters: filters },
            callback: function (r) {
                console.log(r.message)
                if (r.message) {
                    po.setState({ 'data': r.message.gudang, 'loaded': true, 'datalength': r.message.datalength });
                }
            }
        });
        // }
    }

    gudangSearch(filters) {
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
            method: "vet_website.vet_website.doctype.vetgudang.vetgudang.get_gudang_list",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    po.setState({ 'data': r.message.gudang, 'datalength': r.message.datalength, 'loaded': true });
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
            method: "vet_website.vet_website.doctype.vetgudang.vetgudang.delete_gudang",
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

    toggleShowForm(value) {
        var write = checkPermission('VetGudang', this.state.currentUser, 'write')
        if (!['new', false].includes(value) && write) {
            this.setState({ show_form: value })
        } else if (['new', false].includes(value)) {
            this.setState({ show_form: value })
        }
    }

    newGudang(data) {
        var uom = this
        frappe.call({
            type: "POST",
            method: "vet_website.vet_website.doctype.vetgudang.vetgudang.new_gudang",
            args: { data: data },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message)
                    var new_data = uom.state.data.slice()
                    new_data.unshift(r.message)
                    uom.setState({ data: new_data, show_form: false, show_edit: false });
                }
            }
        })
    }

    editGudang(index, data) {
        var uom = this
        frappe.call({
            type: "POST",
            method: "vet_website.vet_website.doctype.vetgudang.vetgudang.edit_gudang",
            args: { data: data },
            callback: function (r) {
                if (r.message) {
                    var new_data = uom.state.data.slice()
                    new_data[index] = r.message
                    uom.setState({ data: new_data, show_form: false, show_edit: false });
                }
            }
        })
    }

    setDefault(name) {
        var th = this
        frappe.call({
            type: "POST",
            method: "vet_website.vet_website.doctype.vetgudang.vetgudang.set_default_gudang",
            args: { name: name },
            callback: function (r) {
                if (r.message.success) {
                    var filters = JSON.parse(sessionStorage.getItem(window.location.pathname))
                    th.gudangSearch(filters)
                } else if (r.message.error) {
                    frappe.msgprint(r.message.error)
                }
            }
        })
    }

    render() {
        var sorts = [
            { 'label': 'Nama Gudang DESC', 'value': 'gudang_name desc' },
            { 'label': 'Nama Gudang ASC', 'value': 'gudang_name asc' },
        ]

        var field_list = [
            { 'label': 'Nama Gudang', 'field': 'gudang_name', 'type': 'char' },
        ]

        var row_style2 = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px', 'height': '72px' }
        var formStyle = { border: '1px solid #397DA6', color: '#397DA6' }
        var delete_row, popup_form, default_button
        var add_row = (
            <div className="col-auto">
                <button className="btn btn-outline-danger text-uppercase fs12 fwbold" onClick={() => this.toggleShowForm('new')}><i className="fa fa-plus mr-2" />Tambah</button>
            </div>
        )
        if (this.state.show_delete) {
            delete_row = (
                <div className="col-auto">
                    <button className="btn btn-outline-danger text-uppercase fs12 fwbold" onClick={this.deleteRow}>Hapus</button>
                </div>
            )
        }
        var checked_default = this.state.data.filter(d => d.checked).map(d => d.is_default)
        if (checked_default.length == 1 && !checked_default.includes(1)) {
            default_button = (
                <div className="col-auto">
                    <button className="btn btn-outline-danger text-uppercase fs12 fwbold" type="button" onClick={() => this.setDefault(this.state.data.filter(d => d.checked)[0].name)}>Set Default</button>
                </div>
            )
        }

        if (this.state.show_form !== false) {
            if (this.state.show_form === 'new') {
                popup_form = <GudangPopupForm cancelAction={() => this.toggleShowForm(false)} submitAction={this.newGudang} uom_list={this.state.data} />
            }
            else if (this.state.data[this.state.show_form] != undefined) {
                popup_form = <GudangPopupForm data={this.state.data[this.state.show_form]} cancelAction={() => this.toggleShowForm(false)} submitAction={data => this.editGudang(this.state.show_form, data)} uom_list={this.state.data} />
            }
        }

        if (this.state.loaded) {
            return (
                <div>
                    <div className="row mx-0" style={row_style2}>
                        <div className="col-auto">
                            <div className="row">
                                {add_row}
                                {delete_row}
                                {default_button}
                            </div>
                        </div>
                        <div className="col">
                            <input value={this.state.search || ''} className="form-control fs12" name="search" placeholder="Search..." style={formStyle} onChange={e => this.setState({ search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' ? this.gudangSearch(JSON.parse(sessionStorage.getItem(window.location.pathname))) : null} />
                        </div>
                        <div className="col-7">
                            <Filter sorts={sorts} searchAction={this.gudangSearch} field_list={field_list} filters={JSON.parse(sessionStorage.getItem(window.location.pathname))} />
                        </div>
                    </div>
                    <WarehouseGrid items={this.state.data} checkRow={this.checkRow} checkAll={() => this.checkAll()} check_all={this.state.check_all} toggleShowForm={this.toggleShowForm} paginationClick={this.paginationClick} currentpage={this.state.currentpage} datalength={this.state.datalength} />
                    {popup_form}
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

class WarehouseGrid extends React.Component {
    render() {
        // var search = this.props.search
        // function filterRow(row){
        //     function filterField(field){
        //         return field?field.toString().includes(search):false
        //     }
        //     var fields = [row.gudang_name]
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
                    <WarehouseGridCol key={index.toString()} item={item} checkRow={() => list.props.checkRow(index)} toggleShowForm={() => list.props.toggleShowForm(index.toString())} />
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

class WarehouseGridCol extends React.Component {

    goToPage(e, key) {
        e.preventDefault()
        var url

        url = '/main/inventory/operation?' + key + '=' + encodeURIComponent(this.props.item.name);

        window.location.href = url
    }

    render() {
        var panel_style = { height: '100%', minHeight: '215px', background: '#FFFFFF', color: '#056EAD', boxShadow: '0px 10px 40px rgba(0, 0, 0, 0.1)', borderRadius: '18px' }
        var cursor = { cursor: 'pointer', verticalAlign: 'middle' }
        var border_left = { borderLeft: '2px solid #056EAD' }
        var border_right = { borderRight: '2px solid #056EAD' }
        var counterStyle = { marginTop: '-1rem', verticalAlign: 'middle' }
        var item = this.props.item
        var checked = false
        var receipts_counter, delivery_orders_counter

        if (item.checked) {
            checked = true
        }

        if (item.total_receipts != 0) {
            receipts_counter = <span className="record-count badge badge-danger rounded-circle fs10 fw600 float-right" style={counterStyle}>{item.total_receipts}</span>
        }
        if (item.total_delivery_orders != 0) {
            delivery_orders_counter = <span className="record-count badge badge-danger rounded-circle fs10 fw600 float-right" style={counterStyle}>{item.total_delivery_orders}</span>
        }

        return (
            <div className="col-4 mb-5">
                <div style={panel_style} className="text-center p-4 row mx-0">
                    <div className="col-12 mb-auto d-flex">
                        <input type="checkbox" className="my-auto mr-auto" checked={checked} onChange={this.props.checkRow} />
                        <span className="fs16 fwbold text-uppercase mr-auto" style={cursor} onClick={this.props.toggleShowForm}>{item.gudang_name}</span>
                        {item.is_default ? <i className="fa fa-home fs18 my-auto" /> : false}
                    </div>
                    <div className="col-12 my-auto">
                        <div className="row">
                            <div className="col-3 px-2">
                                <div style={cursor} onClick={(e) => this.goToPage(e, 'receipts')}>
                                    {receipts_counter}
                                    <img src="/static/img/main/menu/receipts.png" className="img img-fluid" />
                                    <span className="fs10 d-block mt-2">Receipts</span>
                                </div>
                            </div>
                            <div className="col-3 px-2" style={border_right}>
                                <div style={cursor} onClick={(e) => this.goToPage(e, 'delivery_orders')}>
                                    {delivery_orders_counter}
                                    <img src="/static/img/main/menu/delivery-orders.png" className="img img-fluid" />
                                    <span className="fs10 d-block mt-2">Delivery Orders</span>
                                </div>
                            </div>
                            <div className="col-3 px-2" style={border_left}>
                                <div style={cursor}>
                                    <img src="/static/img/main/menu/adjustment.png" className="img img-fluid" />
                                    <span className="fs10 d-block mt-2">Adjustment</span>
                                </div>
                            </div>
                            <div className="col-3 px-2">
                                <div style={cursor} onClick={() => window.location.href = "/main/inventory/inventory?gudang=" + item.name}>
                                    <img src="/static/img/main/menu/inventory.png" className="img img-fluid" />
                                    <span className="fs10 d-block mt-2">Inventory</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

class GudangPopupForm extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': {},
        }
    }

    componentDidMount() {
        if (this.props.data != undefined) {
            this.setState({ data: this.props.data })
        }
    }

    formSubmit(e) {
        e.preventDefault()
        this.props.submitAction(this.state.data)
    }

    changeInput(e) {
        var target = e.target
        var name = target.name
        var value = target.value
        var new_data = Object.assign({}, this.state.data)

        console.log(value)
        new_data[name] = value
        this.setState({ data: new_data })
    }

    render() {
        var container_style = { maxWidth: '713px' }
        var input_style = { background: '#CEEDFF', color: '#056EAD' }
        var color_style = { color: '#056EAD' }
        var panel_style = { borderRadius: '20px' }
        var button1_style = { minWidth: '147px', border: '1px solid #056EAD', background: '#056EAD', color: '#FFF' }
        var button2_style = { minWidth: '147px', border: '1px solid #056EAD', color: '#056EAD' }

        return (
            <div className='menu-popup pt-0 d-flex' onClick={this.props.cancelAction}>
                <div className="container my-auto" style={container_style} onClick={event => event.stopPropagation()}>
                    <form onSubmit={e => this.formSubmit(e)} className="p-5 bg-white" style={panel_style}>
                        <div className="form-row mb-5">
                            <input className="form-control col-8 mx-auto fs44 fwbold border-0 rounded-0" style={input_style} type="text" name="gudang_name" id="gudang_name" required autoComplete="off" value={this.state.data.gudang_name || ''} onChange={e => this.changeInput(e)} placeholder="Name" />
                        </div>
                        <div className="row justify-content-center">
                            <div className="col-auto">
                                <button type="submit" className="btn fs18 fw600 py-2" style={button1_style}>Simpan</button>
                            </div>
                            <div className="col-auto">
                                <button type="button" className="btn fs18 fw600 py-2" style={button2_style} onClick={this.props.cancelAction}>Batal</button>
                            </div>
                        </div>
                    </form>
                </div>
                <div className="menu-popup-close" />
            </div>
        )
    }
}

ReactDOM.render(<Warehouse />, document.getElementById('warehouse_list'))