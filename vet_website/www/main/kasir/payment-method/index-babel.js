class PaymentMethod extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': [],
            'loaded': false,
            'check_all': false,
            'show_delete': false,
            'currentpage': 1,
            'show_form': false,
            'account_list': [],
            'search': false,
            'currentUser': {},
            'datalength': 0,
        }

        this.checkRow = this.checkRow.bind(this);
        this.toggleShowForm = this.toggleShowForm.bind(this)
        this.listSearch = this.listSearch.bind(this)
        this.deleteRow = this.deleteRow.bind(this);
        this.newPaymentMethod = this.newPaymentMethod.bind(this)
    }

    componentDidMount() {
        var td = this
        var filters = { filters: [], sorts: [] }

        console.log(document.referrer)
        // console.log(document.referrer.includes('/main/penerimaan/penerimaan-pasien/detail'))

        // if (sessionStorage.getItem(window.location.pathname) != null) {
        //     filters = JSON.parse(sessionStorage.getItem(window.location.pathname))
        // } else {
        //     filters = {filters: [], sorts: []}
        // }

        // if (filters.hasOwnProperty("currentpage")) {
        //     this.setState({'currentpage': filters['currentpage']})
        // }

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

        sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))

        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetpaymentmethod.vetpaymentmethod.get_payment_method_list",
            args: { filters: filters },
            callback: function (r) {
                console.log(r.message)
                if (r.message) {
                    td.setState({ 'data': r.message.list, 'account_list': r.message.account_list, 'loaded': true, 'datalength': r.message.datalength });
                }
            }
        });
    }

    listSearch(filters) {
        var th = this
        this.setState({
            currentpage: 1,
            loaded: false,
        });

        filters['currentpage'] = 1;
        filters['search'] = this.state.search
        sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))
        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetpaymentmethod.vetpaymentmethod.get_payment_method_list",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    th.setState({ 'data': r.message.list, 'account_list': r.message.account_list, 'datalength': r.message.datalength, 'loaded': true });
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

        if (number * 30 > this.state.data.length) {
            frappe.call({
                type: "GET",
                method: "vet_website.vet_website.doctype.vetpaymentmethod.vetpaymentmethod.get_payment_method_list",
                args: { filters: filters },
                callback: function (r) {
                    if (r.message) {
                        po.setState({ 'data': r.message.list, 'account_list': r.message.account_list, 'datalength': r.message.datalength, 'loaded': true });
                    }
                }
            });
        }
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
        this.setState({ show_form: value })
    }

    deleteRow(e) {
        e.preventDefault();
        var po = this
        var delete_data = this.state.data.filter((d) => d.checked)
        var delete_data_names = delete_data.map((d) => d.name)
        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetpaymentmethod.vetpaymentmethod.delete_payment_method",
            args: { data: delete_data_names },
            callback: function (r) {
                if (r.message.success) {
                    var new_data = po.state.data.filter((d => !d.checked))
                    po.setState({ data: new_data, check_all: false, show_delete: false });
                }
            }
        });
    }

    newPaymentMethod(data) {
        var th = this
        console.log(data)
        frappe.call({
            type: "POST",
            method: "vet_website.vet_website.doctype.vetpaymentmethod.vetpaymentmethod.new_payment_method",
            args: { data: data },
            callback: function (r) {
                if (r.message) {
                    var new_data = th.state.data.slice()
                    r.message.account_name = th.state.account_list.find(a => a.name == data.account).account_name
                    new_data.unshift(r.message)
                    th.setState({ data: new_data, show_form: false });
                }
            }
        })
    }

    editPaymentMethod(index, data) {
        var uom = this
        console.log(data)
        frappe.call({
            type: "POST",
            method: "vet_website.vet_website.doctype.vetpaymentmethod.vetpaymentmethod.edit_payment_method",
            args: { data: data },
            callback: function (r) {
                console.log(r.message)
                if (r.message) {
                    var new_data = uom.state.data.slice()
                    r.message.account_name = uom.state.account_list.find(a => a.name == data.account).account_name
                    new_data[index] = r.message
                    uom.setState({ data: new_data, show_form: false });
                }
            }
        })
    }

    render() {
        var write = checkPermission('VetPaymentMethod', this.state.currentUser, 'write')
        var type_options = []
        this.state.data.forEach(d => !type_options.map(o => o.value).includes(d.method_type) ? type_options.push({ label: d.method_type, value: d.method_type }) : false)

        var sorts = [
            { 'label': 'Name DESC', 'value': 'method_name desc' },
            { 'label': 'Name ASC', 'value': 'method_name asc' },
        ]

        var field_list = [
            { 'label': 'Nama', 'field': 'method_name', 'type': 'char' },
            { 'label': 'Type', 'field': 'method_type', 'type': 'select', 'options': type_options },
        ]

        var row_style2 = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px', 'height': '72px' }
        var formStyle = { border: '1px solid #397DA6', color: '#397DA6' }
        var delete_row, popup_form
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

        if (this.state.show_form !== false) {
            if (this.state.show_form === 'new') {
                popup_form = <PaymentMethodPopupForm write={write} cancelAction={() => this.toggleShowForm(false)} submitAction={this.newPaymentMethod} account_list={this.state.account_list} />
            }
            else if (this.state.data[this.state.show_form] != undefined) {
                popup_form = <PaymentMethodPopupForm write={write} data={this.state.data[this.state.show_form]} cancelAction={() => this.toggleShowForm(false)} submitAction={data => this.editPaymentMethod(this.state.show_form, data)} account_list={this.state.account_list} />
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
                            </div>
                        </div>
                        <div className="col">
                            <input value={this.state.search || ''} className="form-control fs12" name="search" placeholder="Search..." style={formStyle} onChange={e => this.setState({ search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' ? this.listSearch(JSON.parse(sessionStorage.getItem(window.location.pathname))) : null} />
                        </div>
                        <div className="col-7">
                            <Filter sorts={sorts} searchAction={this.listSearch} field_list={field_list} filters={JSON.parse(sessionStorage.getItem(window.location.pathname))} />
                        </div>
                    </div>
                    <PaymentMethodList items={this.state.data} checkRow={this.checkRow} checkAll={() => this.checkAll()} check_all={this.state.check_all} toggleShowForm={this.toggleShowForm} paginationClick={this.paginationClick} currentpage={this.state.currentpage} datalength={this.state.datalength} />
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

class PaymentMethodList extends React.Component {
    render() {
        // var search = this.props.search
        // function filterRow(row){
        //     function filterField(field){
        //         return field?field.toString().includes(search):false
        //     }
        //     var fields = [row.method_name, row.account_name, row.account_type]
        //     return ![false,''].includes(search)?fields.some(filterField):true
        // }
        var rows = []
        var panel_style = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px' }
        var items = this.props.items

        console.log(this.props)

        if (items.length != 0) {
            var list = this
            // const indexOfLastTodo = this.props.currentpage * 30;
            // const indexOfFirstTodo = indexOfLastTodo - 30;
            // var currentItems
            // ![false,''].includes(search)?
            // currentItems = items.filter(filterRow).slice(indexOfFirstTodo, indexOfLastTodo):
            // currentItems = items.slice(indexOfFirstTodo, indexOfLastTodo)

            items.forEach(function (item, index) {
                // if(currentItems.includes(item)){
                rows.push(
                    <PaymentMethodListRow key={index.toString()} item={item} checkRow={() => list.props.checkRow(index)} toggleShowForm={() => list.props.toggleShowForm(index.toString())} />
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
                                    <span className="my-auto">Name</span>
                                </div>
                                <div className="col-4 d-flex">
                                    <span className="my-auto">Account</span>
                                </div>
                                <div className="col-4 d-flex">
                                    <span className="my-auto">Type</span>
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

class PaymentMethodListRow extends React.Component {

    render() {
        var checked = false
        if (this.props.item.checked) {
            checked = true
        }
        var item = this.props.item
        var imgStyle = { maxWidth: 24, maxHeight: 24, marginRight: 10, filter: "brightness(0)" }
        var icon

        if (item.method_type == 'Cash') {
            icon = <img style={imgStyle} src="/static/img/main/menu/method-cash.png" />
        } else if (item.method_type == 'Card') {
            icon = <img style={imgStyle} src="/static/img/main/menu/method-card.png" />
        } else if (item.method_type == 'Deposit Customer' || item.method_type == 'Deposit Supplier') {
            icon = <img style={imgStyle} src="/static/img/main/menu/method-deposit.png" />
        }

        return (
            <div className="row mx-0">
                <div className="col-auto pl-2 pr-3">
                    <input type="checkbox" className="d-block my-3" checked={checked} onChange={this.props.checkRow} />
                </div>
                <div className="col row-list row-list-link" onClick={this.props.toggleShowForm}>
                    <div className="row mx-0 fs12 fw600">
                        <div className="col-4 d-flex">
                            <span className="my-auto">{item.method_name}</span>
                        </div>
                        <div className="col-4 d-flex">
                            <span className="my-auto">{item.account_name}</span>
                        </div>
                        <div className="col-4 d-flex">
                            {icon}
                            <span className="my-auto">{item.method_type}</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

class PaymentMethodPopupForm extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': {},
        }
    }

    componentDidMount() {
        if (this.props.data != undefined) {
            var new_data = Object.assign({}, this.props.data)
            new_data.account = new_data.account_name
            this.setState({ data: new_data })
        }
    }

    formSubmit(e) {
        e.preventDefault()
        var new_data = this.state.data
        new_data.account = this.props.account_list.find(i => i.account_name == new_data.account).name
        this.props.submitAction(new_data)
    }

    changeInput(e) {
        var target = e.target
        var name = target.name
        var value = target.value
        var new_data = Object.assign({}, this.state.data)

        new_data[name] = value
        this.setState({ data: new_data })
    }

    inputBlur(e, list) {
        const value = e.target.value
        const name = e.target.name
        var new_data = Object.assign({}, this.state.data)
        var selected = false
        console.log(value)

        if (name == "account") {
            list.forEach(function (item, index) {
                if (item.account_name == value) {
                    selected = true
                }
            })
        }
        if (!selected) {
            e.target.value = ''
            if (name == "account") {
                new_data[name] = ''
                this.setState({ data: new_data })
            }
        }
    }

    render() {
        console.log(this.props)
        var container_style = { marginTop: '50px', maxWidth: '915px' }
        var panel_style = { borderRadius: '8px' }
        var input_style = { background: '#CEEDFF' }
        var button1_style = { minWidth: '147px', border: '1px solid #056EAD', background: '#056EAD', color: '#FFF' }
        var button2_style = { minWidth: '147px', border: '1px solid #056EAD', color: '#056EAD' }
        var button_title = 'Tambah'

        var account_list = []
        this.props.account_list.forEach((um, index) => account_list.push(<option value={um.account_name} key={index.toString()} />))

        if (this.state.data.name != undefined) {
            button_title = 'Ubah'
        }

        var readOnly = !this.props.write || false

        return (
            <div className='menu-popup pt-0 d-flex' onClick={this.props.cancelAction}>
                <div className="container my-auto" style={container_style} onClick={event => event.stopPropagation()}>
                    <form onSubmit={e => this.formSubmit(e)} className="p-5 bg-white" style={panel_style}>
                        <div className="form-group">
                            <label htmlFor="method_name" className="fs18 fw600">Name</label>
                            <input readOnly={readOnly} className="form-control fs18 border-0" style={input_style} type="text" name="method_name" id="method_name" required autoComplete="off" value={this.state.data.method_name || ''} onChange={e => this.changeInput(e)} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="account" className="fs18 fw600">Account</label>
                            <input readOnly={readOnly} className="form-control fs18 border-0" style={input_style} type="text" name="account" id="account" required autoComplete="off" value={this.state.data.account || ''} onChange={e => this.changeInput(e)} onBlur={e => this.inputBlur(e, this.props.account_list)} list="account_list" />
                            <datalist id="account_list">
                                {account_list}
                            </datalist>
                        </div>
                        <div className="form-group mb-5">
                            <label htmlFor="method_type" className="fs18 fw600">Type</label>
                            <select disabled={readOnly} className="form-control fs18 border-0" style={input_style} name="method_type" id="method_type" required value={this.state.data.method_type || ''} onChange={e => this.changeInput(e)}>
                                <option value='' />
                                <option>Cash</option>
                                <option>Card</option>
                                <option>Deposit Customer</option>
                                <option>Deposit Supplier</option>
                            </select>
                        </div>
                        <div className="row justify-content-center">
                            <div className="col-auto">
                                {this.props.write ? <button type="submit" className="btn fs18 fw600 py-2" style={button1_style}>{button_title}</button> : false}
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

ReactDOM.render(<PaymentMethod />, document.getElementById('payment_method'))