var n = getUrlParameter('n')

class Expenses extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': [],
            'loaded': false,
            'check_all': false,
            'show_delete': false,
            'currentpage': 1,
            'popup_add': false,
            'search': false,
            'currentUser': {},
            'datalength': 0,
        }

        this.expensesSearch = this.expensesSearch.bind(this);
        this.checkRow = this.checkRow.bind(this);
        this.deleteRow = this.deleteRow.bind(this);
        this.toggle = this.toggle.bind(this);
        this.updateData = this.updateData.bind(this);
        this.paginationClick = this.paginationClick.bind(this);
    }

    componentDidMount() {
        var new_filters = { filters: [], sorts: [] }

        if (n) {
            new_filters['n'] = n
        }
        var po = this
        frappe.call({
            type: "GET",
            method: "vet_website.methods.get_current_user",
            args: {},
            callback: function (r) {
                if (r.message) {
                    po.setState({ 'currentUser': r.message });
                }
            }
        });

        sessionStorage.setItem(window.location.pathname, JSON.stringify(new_filters))
        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetexpenses.vetexpenses.get_expenses_list",
            args: { filters: new_filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'data': r.message.expenses, 'loaded': true, 'datalength': r.message.datalength });
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
            method: "vet_website.vet_website.doctype.vetexpenses.vetexpenses.get_expenses_list",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'data': r.message.expenses, 'loaded': true, 'datalength': r.message.datalength });
                }
            }
        });
        // }
    }

    expensesSearch(filters) {
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
            method: "vet_website.vet_website.doctype.vetexpenses.vetexpenses.get_expenses_list",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'data': r.message.expenses, 'loaded': true, 'filter': true, 'datalength': r.message.datalength });
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
            method: "vet_website.vet_website.doctype.vetexpenses.vetexpenses.delete_expenses",
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

    toggle(e, temp_name = undefined) {
        e.preventDefault()
        this.setState({ popup_add: !this.state.popup_add, temp_name: temp_name })
    }

    updateData(filters) {
        var po = this
        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetexpenses.vetexpenses.get_expenses_list",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'data': r.message.expenses, 'loaded': true });
                }
            }
        });
    }

    render() {
        var write = checkPermission('VetExpenses', this.state.currentUser, 'write')
        var reject = checkPermission('VetExpenses', this.state.currentUser, 'reject')
        var approve = checkPermission('VetExpenses', this.state.currentUser, 'approve')
        var sorts = [
            { 'label': 'Tanggal buat DESC', 'value': 'creation desc' },
            { 'label': 'Tanggal buat ASC', 'value': 'creation asc' },
            { 'label': 'Date DESC', 'value': 'expense_date desc' },
            { 'label': 'Date ASC', 'value': 'expenses_date asc' },
        ]

        var field_list = [
            { 'label': 'Expense Name', 'field': 'expense_name', 'type': 'char' },
            { 'label': 'Expense Date', 'field': 'expense_date', 'type': 'char' },
            { 'label': 'Product Name', 'field': 'product_name', 'type': 'char' },
            { 'label': 'Period', 'field': 'period', 'type': 'char' },
            // {'label': 'Quantity', 'field': 'quantity', 'type': 'char'},
            { 'label': 'Amount', 'field': 'price', 'type': 'char' },
            { 'label': 'Description', 'field': 'description', 'type': 'date' },
            { 'label': 'Status', 'field': 'status', 'type': 'char' },
            { 'label': 'Responsible Name', 'field': 'responsible_name', 'type': 'char' },
            { 'label': 'Warehouse Name', 'field': 'warehouse_name', 'type': 'char' },
        ]

        var delete_button, popup_add
        if (this.state.show_delete) {
            delete_button = (
                <div className="col-auto px-0">
                    <button className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={this.deleteRow}>Hapus</button>
                </div>
            )
        }

        if (this.state.popup_add) {
            popup_add = <PopupAdd write={write} reject={reject} approve={approve} name={this.state.temp_name} toggle={this.toggle} updateData={this.updateData} />
        }

        var row_style = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px' }
        var formStyle = { border: '1px solid #397DA6', color: '#397DA6' }
        if (this.state.loaded) {
            return (
                <div>
                    <div className="row mx-0" style={row_style}>
                        <div className="col-auto my-auto">
                            <div className="row">
                                <div className="col-auto">
                                    <a href="#" className="btn btn-outline-danger text-uppercase fs12 fwbold" onClick={this.toggle}><i className="fa fa-plus mr-2" />Tambah</a>
                                </div>
                                {delete_button}
                            </div>
                        </div>
                        <div className="col">
                            <input value={this.state.search || ''} className="form-control fs12" name="search" placeholder="Search..." style={formStyle} onChange={e => this.setState({ search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' ? this.expensesSearch(JSON.parse(sessionStorage.getItem(window.location.pathname))) : null} />
                        </div>
                        <div className="col-8">
                            <Filter sorts={sorts} searchAction={this.expensesSearch} field_list={field_list} filters={JSON.parse(sessionStorage.getItem(window.location.pathname))} />
                        </div>
                    </div>
                    <ExpensesList data={this.state.data} checkRow={this.checkRow} checkAll={() => this.checkAll()} check_all={this.state.check_all} filter={this.state.filter} toggle={this.toggle} paginationClick={this.paginationClick} currentpage={this.state.currentpage} datalength={this.state.datalength} />
                    {popup_add}
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

class PopupAdd extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'loaded': false,
            'data': {},
            'edit_mode': false,
        }

        this.handleInputChange = this.handleInputChange.bind(this)
        this.handleInputBlur = this.handleInputBlur.bind(this)
        this.formSubmit = this.formSubmit.bind(this)
    }

    componentDidMount() {
        var gr = this
        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetexpenses.vetexpenses.get_expenses",
            args: { name: this.props.name },
            cache: "force-cache",
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    if (r.message.expense.status == 'Draft' || !r.message.expense.status) {
                        var moment_date = moment()
                        r.message.expense.expense_date = moment_date.format('YYYY-MM-DD')
                        r.message.expense.period = moment_date.format('MM/YYYY')
                    }
                    gr.setState({ 'data': r.message.expense, 'productAll': r.message.productAll, 'userAll': r.message.userAll, 'cashAccounts': r.message.cashAccounts, 'expenseAccounts': r.message.expenseAccounts, 'warehouseAll': r.message.warehouseAll, 'journal_entry': r.message.journal_entry, 'loaded': true });
                }
            }
        });
        // var url = new URL(window.location.protocol+'//'+window.location.host)
        // var args = {name: this.props.name, cmd: "vet_website.vet_website.doctype.vetexpenses.vetexpenses.get_expenses"}
        // url.search = new URLSearchParams(args).toString()
        // fetch(url, {
        //     method: "GET",
        //     headers: {
        //         'Accept': 'application/json',
        //         'Content-Type': 'application/json',
        //         'Cache-Control': 'max-age=10'
        //     },
        //     }).then(function(response){
        //         if(response.status == 200){
        //             return response.json()
        //         }
        //     }, function(error){
        //         error.message
        //     }).then(function(r){
        //         if (r.message) {
        //             console.log(r.message);
        //             if (r.message.expense.status == 'Draft' || !r.message.expense.status) {
        //                 var moment_date = moment()
        //                 r.message.expense.expense_date = moment_date.format('YYYY-MM-DD')
        //                 r.message.expense.period = moment_date.format('MM/YYYY')
        //             }
        //             gr.setState({'data': r.message.expense, 'productAll': r.message.productAll, 'userAll': r.message.userAll, 'cashAccounts': r.message.cashAccounts, 'expenseAccounts': r.message.expenseAccounts, 'warehouseAll': r.message.warehouseAll, 'journal_entry': r.message.journal_entry, 'loaded': true});
        //         }
        // })
    }

    toggleEditMode(e) {
        e.preventDefault()
        this.setState({ edit_mode: !this.state.edit_mode })
    }

    formSubmit(e) {
        e.preventDefault()
        var new_data = this.state.data
        var th = this

        if (!new_data.status || new_data.status == 'Draft' || this.state.edit_mode) {
            var selected_product = this.state.productAll.find(i => i.product_name == new_data.product_name)
            // var selected_responsible = this.state.userAll.find(i => i.full_name == new_data.responsible)
            var selected_responsible = this.state.userAll.find(i => i.name == frappe.session.user)
            var selected_cash_account = this.state.cashAccounts.find(i => i.account_name == new_data.cash_account_name)
            var selected_expense_account = this.state.expenseAccounts.find(i => i.account_name == new_data.expense_account_name)
            var selected_warehouse = this.state.warehouseAll.find(i => i.gudang_name == new_data.warehouse)

            if (selected_product) {
                new_data.product = selected_product.name
            }
            new_data.responsible = selected_responsible.name
            new_data.cash_account = selected_cash_account.name
            new_data.expense_account = selected_expense_account.name
            if (selected_warehouse) {
                new_data.warehouse = selected_warehouse.name
            }
        }

        console.log(new_data)
        var args = { data: new_data }
        this.state.edit_mode ? args.saveOnly = true : false
        console.log(args)
        frappe.call({
            type: "POST",
            method: "vet_website.vet_website.doctype.vetexpenses.vetexpenses.submit_expense",
            args: args,
            callback: function (r) {
                if (r.message.expense) {
                    th.props.updateData(JSON.parse(sessionStorage.getItem(window.location.pathname)))
                    th.setState({ data: r.message.expense, edit_mode: false })
                }
                if (r.message.error) {
                    frappe.msgprint(r.message.error);
                }
            }
        });
    }

    handleInputChange(e, i = false) {
        const value = e.target.value
        const name = e.target.name
        var new_data = this.state.data

        new_data[name] = value

        if (name == 'product') {
            var product = this.state.productAll.find(p => p.product_name == value)
            new_data['product_name'] = value
            console.log(product)
            if (product) {
                new_data['product_name'] = product.product_name
                new_data['price'] = product.price
                if (product.stockable) {
                    var cash_account = document.getElementById('cash_account')
                    var expense_account = document.getElementById('expense_account')
                    cash_account.value = product.cash_account
                    expense_account.value = product.expense_account
                    new_data['cash_account'] = product.cash_account
                    new_data['expense_account'] = product.expense_account
                }
                else {
                    delete new_data['cash_account']
                    delete new_data['expense_account']
                }
            }
            else {
                new_data['price'] = 0
            }
        }
        if (name == 'cash_account') {
            console.log('CA')
            console.log(value)
            var account = this.state.cashAccounts.find(p => p.account_name == value)
            new_data['cash_account_name'] = value
            if (account) {
                new_data['cash_account_name'] = account.account_name
            }
        }
        if (name == 'expense_account') {
            console.log('EA')
            console.log(value)
            var account = this.state.expenseAccounts.find(p => p.account_name == value)
            new_data['expense_account_name'] = value
            if (account) {
                new_data['expense_account_name'] = account.account_name
            }
        }
        if (name == 'expense_date') {
            new_data['period'] = moment(value).format('MM/YYYY')
        }

        this.setState({ data: new_data })
    }

    handleInputBlur(e, list, i = false) {
        const value = e.target.value
        const name = e.target.name
        var new_data = this.state.data
        var selected = false

        if (name == 'product') {
            selected = list.find(i => i.product_name == value)
        } else if (name == 'responsible') {
            selected = list.find(i => i.full_name == value)
        } else if (name == 'warehouse') {
            selected = list.find(i => i.gudang_name == value)
        } else if (['cash_account', 'expense_account'].includes(name)) {
            if (e.target.readOnly) {
                selected = true
            }
            else {
                selected = list.find(i => i.account_name == value)
            }
        }

        if (!selected) {
            e.target.value = ''
            new_data[name] = ''
            if (name == 'product') {
                console.log('Halo')
                var cash_account = document.getElementById('cash_account')
                var expense_account = document.getElementById('expense_account')
                cash_account.value = ''
                expense_account.value = ''
                delete new_data['product']
                delete new_data['product_name']
                delete new_data['cash_account']
                delete new_data['cash_account_name']
                delete new_data['expense_account']
                delete new_data['expense_account_name']
            }
            if (['cash_account', 'expense_account'].includes(name)) {
                delete new_data[name + '_name']
            }

            this.setState({ data: new_data })
        }
    }

    refuseAction(e) {
        e.preventDefault()
        var th = this
        var data = this.state.data

        frappe.call({
            type: "POST",
            method: "vet_website.vet_website.doctype.vetexpenses.vetexpenses.refuse_expense",
            args: { name: data.name },
            callback: function (r) {
                if (r.message.expense) {
                    th.setState({ data: r.message.expense })
                }

                if (r.message.error) {
                    frappe.msgprint(r.message.error);
                }
            }
        });
    }

    deleteRow(i) {
        var new_data = Object.assign({}, this.state.data)
        if (new_data.products[i].name != undefined) {
            new_data.products[i].delete = true
        }
        else {
            new_data.products.splice(i, 1)
            console.log(new_data.products)
        }
        this.setState({ data: new_data })
    }

    render() {
        var maxwidth = { maxWidth: '65%', paddingTop: '100px' }
        var content
        var lh14 = { lineHeight: '14px' }
        var data = this.state.data
        var footerButton

        if (this.state.loaded) {

            if (data.status == 'Draft' || (this.props.name == undefined && data.name == undefined)) {
                footerButton = <div className="col-6">
                    <div className="row mx-0 flex-row-reverse">
                        <div className="col-auto my-auto">
                            <button type="submit" className="btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2" style={lh14}>Submit</button>
                        </div>
                    </div>
                </div>
            } else if (this.state.edit_mode) {
                footerButton = <div className="col-6">
                    <div className="row mx-0 flex-row-reverse">
                        <div className="col-auto my-auto">
                            <button type="submit" className="btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2" style={lh14}>Save</button>
                        </div>
                    </div>
                </div>
            } else if (data.status == 'Approved') {
                footerButton = <div className="col-6">
                    <div className="row mx-0 flex-row-reverse">
                        {this.props.approve ? <div className="col-auto my-auto"><button className="btn btn-sm btn-success fs12 text-uppercase h-100 px-3 fwbold py-2" style={lh14} type="submit">Approve</button></div> : false}
                        {this.props.reject ? <div className="col-auto my-auto"><button className="btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2" style={lh14} type="button" onClick={(e) => this.refuseAction(e)}>Reject</button></div> : false}
                        {this.props.write ? <div className="col-auto my-auto"><button className="btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2" style={lh14} type="button" onClick={(e) => this.toggleEditMode(e)}>Edit</button></div> : false}
                    </div>
                </div>
            }


            var list_status
            if (data.status != 'Refuse') {
                list_status = ['Draft', 'Approved', 'Paid']
            } else {
                list_status = ['Refuse']
            }

            var cursor = { cursor: 'pointer' }

            content = <form onSubmit={this.formSubmit}>
                <StatusRow statuses={list_status} current_status={data.status || 'Draft'} />
                <ExpenseMainForm edit_mode={this.state.edit_mode} data={data} productAll={this.state.productAll} userAll={this.state.userAll} cashAccounts={this.state.cashAccounts} expenseAccounts={this.state.expenseAccounts} warehouseAll={this.state.warehouseAll} journal_entry={this.state.journal_entry} handleInputChange={this.handleInputChange} handleInputBlur={this.handleInputBlur} footerButton={footerButton} />
            </form>
        } else {
            content = <div className="row justify-content-center" key='0'>
                <div className="col-10 col-md-8 text-center border rounded-lg py-4">
                    <p className="mb-0 fs24md fs16 fw600 text-muted">
                        <span><i className="fa fa-spin fa-circle-o-notch mr-3"></i>Loading...</span>
                    </p>
                </div>
            </div>
        }

        return <div className="menu-popup">
            <div className="container" style={maxwidth}>
                <i className="fa fa-times-circle text-danger fs20 float-right p-3" style={cursor} onClick={this.props.toggle} />
                <div className="bg-white p-5">
                    {content}
                </div>
            </div>
            <div className="menu-popup-close" onClick={this.props.toggle}></div>
        </div>
    }
}

class ExpenseMainForm extends React.Component {
    journalEntryClick(e) {
        e.stopPropagation()
        if (this.props.journal_entry && this.props.journal_entry.length > 0) {
            window.location.href = '/main/accounting/journal-entries/edit?n=' + this.props.journal_entry[0]
        }
    }

    render() {
        var bgstyle2 = { background: '#FFFFFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)' }
        var data = this.props.data
        var content
        var product_options = []
        // var period_options = []
        var responsible_options = []
        var cash_account_options = []
        var expense_account_options = []
        var warehouse_options = []
        var color = { color: '#056EAD' }
        var color2 = { color: '#868686' }
        var cursor = { cursor: 'pointer' }
        var input_style = { background: '#CEEDFF' }
        var input_style2 = { background: '#D6DCDF' }
        var cashAccounts = this.props.cashAccounts
        var expenseAccounts = this.props.expenseAccounts

        if (data.status == 'Draft' || (this.props.name == undefined && data.name == undefined) || this.props.edit_mode) {
            // var period_list = Array.apply(0, Array(12)).map((a,i) => moment().month(i).format('MM/YYYY'))

            this.props.productAll.forEach(function (item, index) {
                product_options.push(<option value={item.product_name} key={index.toString()} />)
            })

            this.props.userAll.forEach(function (item, index) {
                responsible_options.push(<option value={item.full_name} key={index.toString()} />)
            })

            this.props.warehouseAll.forEach((item, index) => warehouse_options.push(<option value={item.gudang_name} key={index.toString()} />))

            // period_list.forEach((i, index) => period_options.push(<option value={i} key={i}>{i}</option>))

            var readOnly = false
            var account_readOnly = false
            var filter_account = true
            var product_col_class = "col-12 px-2"
            var warehouse_input
            if (!['', undefined, false].includes(data.product)) {
                readOnly = true

                var stockable
                var current_product = this.props.productAll.find(p => p.product_name == data.product)
                if (current_product) {
                    stockable = current_product.stockable
                }

                if (stockable) {
                    filter_account = false
                    account_readOnly = true
                    product_col_class = "col-8 px-2"
                    warehouse_input = (
                        <div className="col-4 px-2">
                            <div className="form-group">
                                <label htmlFor="warehouse" className="fw600">Warehouse</label>
                                <input required style={input_style2} name='warehouse' list="warehouses" id="warehouse" className="form-control border-0 " onChange={this.props.handleInputChange} onBlur={e => this.props.handleInputBlur(e, this.props.warehouseAll)} />
                                <datalist id="warehouses">
                                    {warehouse_options}
                                </datalist>
                            </div>
                        </div>
                    )
                }
            }

            if (filter_account) {
                cashAccounts = cashAccounts.filter(a => a.account_code.match(/^1-11.*$/) && a.is_parent == 0 && a.account_type == 'Asset')
                expenseAccounts = expenseAccounts.filter(a => a.is_parent == 0 && (a.account_type == 'Expense' || a.account_code.match(/^2-.*$/)))
            }

            cashAccounts.forEach((item, index) => cash_account_options.push(<option value={item.account_name} key={index.toString()} />))
            expenseAccounts.forEach((item, index) => expense_account_options.push(<option value={item.account_name} key={index.toString()} />))

            content = <div className="form-row">
                <div className="col-6">
                    <div className="form-group mx-4">
                        <label htmlFor="expense" className="fw600">Expense</label>
                        <input required style={input_style} type="text" id="expense_name" name='expense_name' className="form-control border-0" onChange={this.props.handleInputChange} value={data.expense_name || ''} />
                    </div>
                    <div className="form-row mx-3">
                        {/*<div className={product_col_class}>
                				        <div className="form-group">
                        					<label htmlFor="product" className="fw600">Product</label>
                        					<input style={input_style2} name='product' list="products" id="product" className="form-control border-0 " onChange={this.props.handleInputChange} onBlur={e => this.props.handleInputBlur(e, this.props.productAll)} value={data.product_name || data.product || ''}/>
        									<datalist id="products">
        										{product_options}
        									</datalist>
                        				</div>
                				    </div>*/}
                        {warehouse_input}
                    </div>
                    <div className="form-group mx-3">
                        {/* <div className="col-6 px-2">
                    				    <div className="form-group">
                        					<label htmlFor="quantity" className="fw600">Quantity</label>
                        					<input required style={input_style} type="text" id="quantity" name='quantity' className="form-control border-0 " onChange={this.props.handleInputChange} value={data.quantity || ''}/>
                        				</div>
                				    </div> */}
                        <div className="col px-2">
                            <div className="form-group">
                                <label htmlFor="price" className="fw600">Amount</label>
                                <input readOnly={readOnly} required style={input_style} type="text" id="price" name='price' className="form-control border-0 " onChange={this.props.handleInputChange} value={data.price || ''} />
                            </div>
                        </div>
                    </div>
                    <div className="form-group mx-4">
                        <label htmlFor="description" className="fw600">Note</label>
                        <input style={input_style2} id="description" name='description' className="form-control border-0 " value={data.description || ''} onChange={this.props.handleInputChange} />
                    </div>
                </div>
                <div className="col-6">
                    <div className="form-row mx-3">
                        <div className="col-6 px-2">
                            <div className="form-group">
                                <label htmlFor="period" className="fw600">Period</label>
                                <input readOnly={true} required style={input_style2} id="period" name='period' className="form-control border-0 " value={data.period || ''} />
                                {/* <option/>
                                			    {period_options} */}
                                {/* </select> */}
                            </div>
                        </div>
                        <div className="col-6 px-2">
                            <div className="form-group">
                                <label htmlFor="date" className="fw600">Date</label>
                                <input required style={input_style2} type="date" id="expense_date" name='expense_date' className="form-control border-0 " onChange={this.props.handleInputChange} value={data.expense_date || ''} />
                            </div>
                        </div>
                    </div>
                    <div className="form-group mx-4">
                        <label htmlFor="responsible" className="fw600">Responsible</label>
                        <p className="fs16 px-0 mb-0">{this.props.userAll.find(u => u.name == frappe.session.user).full_name}</p>
                    </div>
                    <div className="form-group mx-4">
                        <label htmlFor="cash_account" className="fw600">Cash Account</label>
                        <input readOnly={account_readOnly} required style={input_style2} name='cash_account' list="cash_accounts" id="cash_account" className="form-control border-0 " onChange={this.props.handleInputChange} onBlur={e => this.props.handleInputBlur(e, this.props.cashAccounts)} value={data.cash_account_name || data.cash_account || ''} />
                        <datalist id="cash_accounts">
                            {cash_account_options}
                        </datalist>
                    </div>
                    <div className="form-group mx-4">
                        <label htmlFor="expense_account" className="fw600">Expense Account</label>
                        <input readOnly={account_readOnly} required style={input_style2} name='expense_account' list="expense_accounts" id="expense_account" className="form-control border-0 " onChange={this.props.handleInputChange} onBlur={e => this.props.handleInputBlur(e, this.props.expenseAccounts)} value={data.expense_account_name || data.expense_account || ''} />
                        <datalist id="expense_accounts">
                            {expense_account_options}
                        </datalist>
                    </div>
                </div>
            </div>

        } else {
            var inputPrice = <div className="col-6"><span className="fs16 px-0">{formatter.format(data.price)}</span></div>

            if ((data.status == 'Approved') && ['', undefined, false].includes(data.product)) {
                inputPrice = <input required style={input_style} type="text" id="price" name='price' className="form-control border-0 col-6" onChange={this.props.handleInputChange} value={data.price || ''} />
            }

            var journal_entry = (
                <div className="row mb-3 mx-4">
                    <div className="col-6 fs16 fw600">Journal Entry</div>
                    <div className="col-6"><img src="/static/img/main/menu/tautan.png" className="mx-2" onClick={e => this.journalEntryClick(e)} style={cursor} /></div>
                </div>
            )

            content = <div className="row" style={color}>
                <div className="col-6">
                    <div className="row mb-3 mx-4">
                        <div className="col-6 fs16 fw600">Expense</div>
                        <div className="col-6"><span className="fs16 px-0">{data.expense_name}</span></div>
                    </div>
                    {/*<div className="row mb-3 mx-4" style={color2}>
                                    <div className="col-6 fs16 fw600">Product</div>
                                    <div className="col-6"><span className="fs16 px-0">{data.product_name}</span></div>
                                </div>*/}
                    {/* <div className="row mb-3 mx-4">
                                    <div className="col-6 fs16 fw600">Quantity</div>
                                    <div className="col-6"><span className="fs16 px-0">{data.quantity}</span></div>
                                </div> */}
                    <div className="row mb-3 mx-4">
                        <div className="col-6 fs16 fw600">Amount</div>
                        <div className="col-6"><span className="fs16 px-0">{data.price}</span></div>
                    </div>
                    <div className="row mb-3 mx-4" style={color2}>
                        <div className="col-6 fs16 fw600">Description</div>
                        <div className="col-6"><span className="fs16 px-0">{data.description}</span></div>
                    </div>
                </div>
                <div className="col-6" style={color2}>
                    <div className="row mb-3 mx-4">
                        <div className="col-6 fs16 fw600">Period</div>
                        <div className="col-6"><span className="fs16 px-0">{data.period}</span></div>
                    </div>
                    <div className="row mb-3 mx-4">
                        <div className="col-6 fs16 fw600">Date</div>
                        <div className="col-6"><span className="fs16 px-0">{moment(data.expense_date).format("DD-MM-YYYY")}</span></div>
                    </div>
                    <div className="row mb-3 mx-4">
                        <div className="col-6 fs16 fw600">Responsible</div>
                        <div className="col-6"><span className="fs16 px-0">{data.responsible_name}</span></div>
                    </div>
                    <div className="row mb-3 mx-4">
                        <div className="col-6 fs16 fw600">Cash Account</div>
                        <div className="col-6"><span className="fs16 px-0">{data.cash_account_name}</span></div>
                    </div>
                    <div className="row mb-3 mx-4">
                        <div className="col-6 fs16 fw600">Expense Account</div>
                        <div className="col-6"><span className="fs16 px-0">{data.expense_account_name}</span></div>
                    </div>
                    {this.props.journal_entry && this.props.journal_entry.length > 0 ? journal_entry : false}
                </div>
            </div>
        }

        return <div>
            <p className="fs18 fw600 text-dark mb-0">{data.expense_name || 'Data Expense'}</p>
            <div style={bgstyle2} className="p-4">
                {content}
                <div className="row mt-5 mb-3 mx-3" style={color}>
                    <div className="col-6">
                        <div className="row">
                            <div className="col-auto fs20 fw600">
                                Total
                            </div>
                            <div className="col-5 fs20 fw600 text-right mr-3">
                                {data.quantity && data.price ? formatter.format(data.quantity * data.price) : 0}
                            </div>
                        </div>
                    </div>
                    {this.props.footerButton}
                </div>
            </div>
        </div>
    }
}


class ExpensesList extends React.Component {
    render() {
        // var search = this.props.search
        // function filterRow(row) {
        //     function filterField(field) {
        //         return field ? field.toString().includes(search) : false
        //     }
        //     var fields = [moment(row.expense_date).format("DD-MM-YYYY"), row.expense_name, row.responsible, row.quantity * row.price, row.status]
        //     return ![false, ''].includes(search) ? fields.some(filterField) : true
        // }
        var expenses_rows = []
        var panel_style = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px' }
        var bgStyle = { background: '#CEEDFF', color: '#1B577B' }
        var total_expenses = 0


        if (this.props.data.length != 0 || !this.props.filter) {
            var pol = this

            // const indexOfLastTodo = this.props.currentpage * 30;
            // const indexOfFirstTodo = indexOfLastTodo - 30;
            // var currentItems
            // ![false,''].includes(search)?
            // currentItems = this.props.data.filter(filterRow).slice(indexOfFirstTodo, indexOfLastTodo):
            // currentItems = this.props.data.slice(indexOfFirstTodo, indexOfLastTodo)

            this.props.data.forEach(function (item, index) {
                // if (currentItems.includes(item)){
                expenses_rows.push(
                    <ExpensesListRow key={index.toString()} item={item} checkRow={() => pol.props.checkRow(index)} toggle={pol.props.toggle} />
                )

                total_expenses += item.quantity * item.price
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
                                <div className="col d-flex">
                                    <span className="my-auto">Date</span>
                                </div>
                                <div className="col-3 d-flex">
                                    <span className="my-auto">Expense</span>
                                </div>
                                <div className="col-3 d-flex">
                                    <span className="my-auto">Responsible</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">Total</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">Status</span>
                                </div>
                                <div className="col d-flex" />
                            </div>
                        </div>
                    </div>
                    {expenses_rows}
                    <div className="row justify-content-end py-2 fs12 fw600" style={bgStyle}>
                        <div className="col-2 d-flex">
                            <span className="my-auto">{formatter2.format(total_expenses)}</span>
                        </div>
                        <div className="col-2 d-flex">
                        </div>
                    </div>
                    <Pagination paginationClick={this.props.paginationClick} datalength={this.props.datalength} currentpage={this.props.currentpage} itemperpage='10' />
                </div>
            )
        } else {
            return (
                <div style={panel_style}>
                    <div className="row justify-content-center" key='0'>
                        <div className="col-10 col-md-8 text center border rounded-lg py-4">
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

class ExpensesListRow extends React.Component {
    journalEntryClick(e) {
        e.stopPropagation()
        if (this.props.item.journal_entry && this.props.item.journal_entry.length > 0) {
            window.location.href = '/main/accounting/journal-entries/edit?n=' + this.props.item.journal_entry[0]
        }
    }

    render() {
        var checked = false
        var item = this.props.item
        var cursor = { cursor: 'pointer' }

        if (this.props.item.checked) {
            checked = true
        }

        var link_je = <img src="/static/img/main/menu/tautan.png" className="mx-2" onClick={e => this.journalEntryClick(e)} style={cursor} />

        return (
            <div className="row mx-0" style={cursor}>
                <div className="col-auto pl-2 pr-3">
                    <input type="checkbox" className="d-block my-3" checked={checked} onChange={this.props.checkRow} />
                </div>
                <div className="col row-list" onClick={e => this.props.toggle(e, item.name)}>
                    <div className="row mx-0 fs12 fw600">
                        <div className="col d-flex">
                            <span className="my-auto">{moment(item.expense_date).format("DD-MM-YYYY")}</span>
                        </div>
                        <div className="col-3 d-flex">
                            <span className="my-auto">{item.expense_name}</span>
                        </div>
                        <div className="col-3 d-flex">
                            <span className="my-auto">{item.responsible}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{formatter2.format(item.quantity * item.price)}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{item.status}</span>
                        </div>
                        <div className="col d-flex">
                            {item.journal_entry && item.journal_entry.length > 0 ? link_je : false}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

ReactDOM.render(<Expenses />, document.getElementById('expenses_list'))