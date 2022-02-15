class ProductCategories extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': [],
            'loaded': false,
            'check_all': false,
            'show_delete': false,
            'show_form': false,
            'currentpage': 1,
            'search': false,
            'currentUser': {},
            'datalength': 0,
        }
        this.checkRow = this.checkRow.bind(this);
        this.deleteRow = this.deleteRow.bind(this);
        this.newCategory = this.newCategory.bind(this)
        this.toggleShowForm = this.toggleShowForm.bind(this)
        this.categorySearch = this.categorySearch.bind(this)
        this.paginationClick = this.paginationClick.bind(this);
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
        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetproductcategory.vetproductcategory.get_category_list",
            args: { filters: new_filters },
            callback: function (r) {
                console.log(r.message)
                if (r.message) {
                    td.setState({ 'data': r.message.product_category, 'loaded': true, 'datalength': r.message.datalength });
                }
            }
        });
    }

    paginationClick(number) {
        console.log('Halo')
        var po = this
        var filters = JSON.parse(sessionStorage.getItem(window.location.pathname)) || { filters: [], sorts: [] }

        this.setState({
            currentpage: Number(number),
            loaded: false,
        });

        filters['currentpage'] = this.state.currentpage

        sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))

        // if (number * 30 > this.state.data.length) {
        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetproductcategory.vetproductcategory.get_category_list",
            args: { filters: filters },
            callback: function (r) {
                console.log(r.message)
                if (r.message) {
                    po.setState({ 'data': r.message.product_category, 'loaded': true, 'datalength': r.message.datalength });
                }
            }
        });
        // }
    }

    categorySearch(filters) {
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
            method: "vet_website.vet_website.doctype.vetproductcategory.vetproductcategory.get_category_list",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    po.setState({ 'data': r.message.product_category, 'datalength': r.message.datalength, 'loaded': true });
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
            method: "vet_website.vet_website.doctype.vetproductcategory.vetproductcategory.delete_category",
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
        this.setState({ show_form: value })
    }

    newCategory(data) {
        var uom = this
        frappe.call({
            type: "POST",
            method: "vet_website.vet_website.doctype.vetproductcategory.vetproductcategory.new_category",
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

    editCategory(index, data) {
        var uom = this
        frappe.call({
            type: "POST",
            method: "vet_website.vet_website.doctype.vetproductcategory.vetproductcategory.edit_category",
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

    render() {
        var write = checkPermission('VetProductCategory', this.state.currentUser, 'write')
        var sorts = [
            { 'label': 'Product Category DESC', 'value': 'category_name desc' },
            { 'label': 'Product Category ASC', 'value': 'category_name asc' },
        ]

        var field_list = [
            { 'label': 'Product Category', 'field': 'category_name', 'type': 'char' },
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
                popup_form = <ProductCategoriesPopupForm cancelAction={() => this.toggleShowForm(false)} submitAction={this.newCategory} uom_list={this.state.data} />
            }
            else if (this.state.data[this.state.show_form] != undefined) {
                popup_form = <ProductCategoriesPopupForm write={write} data={this.state.data[this.state.show_form]} cancelAction={() => this.toggleShowForm(false)} submitAction={data => this.editCategory(this.state.show_form, data)} uom_list={this.state.data} />
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
                            <input value={this.state.search || ''} className="form-control fs12" name="search" placeholder="Search..." style={formStyle} onChange={e => this.setState({ search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' ? this.categorySearch(JSON.parse(sessionStorage.getItem(window.location.pathname))) : null} />
                        </div>
                        <div className="col-7">
                            <Filter sorts={sorts} searchAction={this.categorySearch} field_list={field_list} filters={JSON.parse(sessionStorage.getItem(window.location.pathname))} />
                        </div>
                    </div>
                    <ProductCategoriesList items={this.state.data} checkRow={this.checkRow} checkAll={() => this.checkAll()} check_all={this.state.check_all} toggleShowForm={this.toggleShowForm} paginationClick={this.paginationClick} currentpage={this.state.currentpage} datalength={this.state.datalength} />
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

class ProductCategoriesList extends React.Component {
    render() {
        // var search = this.props.search
        // function filterRow(row){
        //     function filterField(field){
        //         return field?field.toString().includes(search):false
        //     }
        //     var fields = [row.category_name]
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
                    <ProductCategoriesListRow key={index.toString()} item={item} checkRow={() => list.props.checkRow(index)} toggleShowForm={() => list.props.toggleShowForm(index.toString())} />
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
                                <div className="col-3 d-flex">
                                    <span className="my-auto">Product Category</span>
                                </div>
                                <div className="col-4 d-flex">
                                    <span className="my-auto">Inventory</span>
                                </div>
                                <div className="col-5">
                                    <div className="row">
                                        <div className="col d-flex">
                                            <span className="my-auto">Layanan</span>
                                        </div>
                                        <div className="col d-flex">
                                            <span className="my-auto">Tindak Lanjut</span>
                                        </div>
                                        <div className="col d-flex">
                                            <span className="my-auto">Lainnya</span>
                                        </div>
                                    </div>
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

class ProductCategoriesListRow extends React.Component {

    render() {
        var item = this.props.item
        var checked = false
        if (item.checked) {
            checked = true
        }

        var inventory = [
            { label: 'Can be Sold', name: 'can_be_sold' },
            { label: 'Can be Purchased', name: 'can_be_purchased' },
            { label: 'Stockable', name: 'stockable' },
        ]
        inventory = inventory.filter(i => item[i.name] == 1).map(i => i.label).join(', ')

        var layanan = [
            { label: 'Dokter', name: 'is_dokter' },
            { label: 'Grooming', name: 'is_grooming' },
        ]
        layanan = layanan.filter(i => item[i.name] == 1).map(i => i.label).join(', ')

        var tindak_lanjut = [
            { label: 'Operasi', name: 'is_operasi' },
            { label: 'USG', name: 'is_usg' },
            { label: 'Radiologi', name: 'is_radiologi' },
            { label: 'Laboratorium', name: 'is_laboratorium' },
        ]
        tindak_lanjut = tindak_lanjut.filter(i => item[i.name] == 1).map(i => i.label).join(', ')

        var lainnya = [
            { label: 'Tindakan', name: 'is_tindakan' },
            { label: 'Rawat', name: 'is_rawat' },
        ]
        lainnya = lainnya.filter(i => item[i.name] == 1).map(i => i.label).join(', ')

        return (
            <div className="row mx-0">
                <div className="col-auto pl-2 pr-3 d-flex">
                    <input type="checkbox" className="d-block my-auto" checked={checked} onChange={this.props.checkRow} />
                </div>
                <div className="col row-list row-list-link" onClick={this.props.toggleShowForm}>
                    <div className="row mx-0 fs12 fw600">
                        <div className="col-3 d-flex">
                            <span className="my-auto">{item.category_name}</span>
                        </div>
                        <div className="col-4 d-flex">
                            <span className="my-auto">{inventory}</span>
                        </div>
                        <div className="col-5">
                            <div className="row">
                                <div className="col d-flex">
                                    <span className="my-auto">{layanan}</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">{tindak_lanjut}</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">{lainnya}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

class ProductCategoriesPopupForm extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': {},
            'accounts': [],
        }
    }

    componentDidMount() {
        if (this.props.data != undefined) {
            this.setState({ data: this.props.data })
        }
        var p = this
        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetproductcategory.vetproductcategory.get_category_form",
            args: {},
            callback: function (r) {
                if (r.message) {
                    p.setState({ 'accounts': r.message.accounts });
                }
            }
        });
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

        if (name != 'category_name' && !['income_account', 'stock_input_account', 'stock_output_account'].includes(name)) {
            if (this.state.data[name]) {
                new_data[name] = 0
            }
            else {
                new_data[name] = 1
            }
        } else if (['income_account', 'stock_input_account', 'stock_output_account'].includes(name)) {
            var account = this.state.accounts.find(a => a.name == value || a.account_name == value)
            if (account) {
                new_data[name] = account.name
                new_data[name + "_name"] = account.account_name
            }
            else {
                new_data[name] = value
                new_data[name + "_name"] = value
            }
            this.setState({ data: new_data })
        }
        else {
            new_data[name] = value
        }
        this.setState({ data: new_data })
    }

    handleInputBlur(e) {
        const value = e.target.value
        const name = e.target.name
        var new_data = this.state.data
        var selected = false

        if (['income_account', 'stock_input_account', 'stock_output_account'].includes(name)) {
            selected = this.state.accounts.find(i => i.account_name == value)
        }

        if (!selected) {
            e.target.value = ''
            if (['income_account', 'stock_input_account', 'stock_output_account'].includes(name)) {
                new_data[name] = ''
                new_data[name + "_name"] = ''
            } else {
                new_data[name] = ''
            }

            this.setState({ data: new_data })
        }
    }

    render() {
        var readOnly = false
        var container_style = { marginTop: '50px', maxWidth: '1021px' }
        var input_style = { background: '#CEEDFF', color: '#056EAD' }
        var color_style = { color: '#056EAD' }
        var button1_style = { minWidth: '147px', border: '1px solid #056EAD', background: '#056EAD', color: '#FFF' }
        var button2_style = { minWidth: '147px', border: '1px solid #056EAD', color: '#056EAD' }
        if (this.props.readOnly != undefined) {
            readOnly = this.props.readOnly
        }
        if (!this.props.write) {
            readOnly = true
        }
        var action_button
        if (!readOnly) {
            action_button = (
                <div className="row justify-content-center">
                    <div className="col-auto">
                        <button type="submit" className="btn fs18 fw600 py-2" style={button1_style}>Simpan</button>
                    </div>
                    <div className="col-auto">
                        <button type="button" className="btn fs18 fw600 py-2" style={button2_style} onClick={this.props.cancelAction}>Batal</button>
                    </div>
                </div>
            )
        } else {
            if (!this.props.write) {
                action_button = (
                    <div className="row justify-content-center">
                        <div className="col-auto">
                            <button type="button" className="btn fs18 fw600 py-2" style={button2_style} onClick={this.props.cancelAction}>Batal</button>
                        </div>
                    </div>
                )
            } else {
                action_button = (
                    <div className="row justify-content-center">
                        <div className="col-auto">
                            <button type="button" onClick={(e) => this.props.toggleReadOnly(e)} className="btn fs18 fw600 py-2" style={button1_style}>Edit</button>
                        </div>
                    </div>
                )
            }
        }
        var income_account_options = []
        var input_account_options = []
        var output_account_options = []
        var income_account_name, stock_input_account_name, stock_output_account_name

        var filtered_accounts = this.state.accounts.filter(a => a.is_parent == 0)

        if (filtered_accounts.length != 0) {
            var persediaan_account = this.state.accounts.find(i => i.account_code == '1-17000').name
            filtered_accounts.filter(a => a.account_type == 'Income').forEach(a => income_account_options.push(<option key={a.name} value={a.name}>{a.account_name}</option>))
            filtered_accounts.filter(a => a.account_type == 'Asset' && a.account_parent == persediaan_account).forEach(a => input_account_options.push(<option key={a.name} value={a.name}>{a.account_name}</option>))
            filtered_accounts.filter(a => a.account_type == 'Expense').forEach(a => output_account_options.push(<option key={a.name} value={a.name}>{a.account_name}</option>))

            var income_account = filtered_accounts.find(a => a.name == this.state.data.income_account || a.account_name == this.state.data.income_account)
            if (income_account != undefined) {
                income_account_name = this.state.data.income_account_name || income_account.account_name
            }
            var stock_input_account = filtered_accounts.find(a => a.name == this.state.data.stock_input_account || a.account_name == this.state.data.stock_input_account)
            if (stock_input_account != undefined) {
                stock_input_account_name = this.state.data.stock_input_account_name || stock_input_account.account_name
            }
            var stock_output_account = filtered_accounts.find(a => a.name == this.state.data.stock_output_account || a.account_name == this.state.data.stock_output_account)
            if (stock_output_account != undefined) {
                stock_output_account_name = this.state.data.stock_output_account_name || stock_output_account.account_name
            }
        }
        var income_account_list = <datalist id="income_account">{income_account_options}</datalist>
        var input_account_list = <datalist id="input_account">{input_account_options}</datalist>
        var output_account_list = <datalist id="output_account">{output_account_options}</datalist>

        var stock_input_account_field, stock_output_account_field
        if (this.state.data.stockable) {
            stock_input_account_field = (
                <div className="mb-2">
                    <label htmlFor="stock_input_account" className="my-auto fw600" style={color_style}>Inventory Account</label>
                    <input list="input_account" readOnly={readOnly} className="form-control fs14 fw600 border-0 rounded-0" style={input_style} type="text" name="stock_input_account" id="stock_input_account" autoComplete="off" value={stock_input_account_name || this.state.data.stock_input_account || ''} onChange={e => this.changeInput(e)} onBlur={e => this.handleInputBlur(e)} placeholder="Stock Input Account" />
                </div>
            )
            stock_output_account_field = (
                <div className="mb-2">
                    <label htmlFor="stock_output_account" className="my-auto fw600" style={color_style}>COGS Account</label>
                    <input list="output_account" readOnly={readOnly} className="form-control fs14 fw600 border-0 rounded-0" style={input_style} type="text" name="stock_output_account" id="stock_output_account" autoComplete="off" value={stock_output_account_name || this.state.data.stock_output_account || ''} onChange={e => this.changeInput(e)} onBlur={e => this.handleInputBlur(e)} placeholder="COGS Account" />
                </div>
            )
        }

        return (
            <div className='menu-popup pt-0 d-flex' onClick={this.props.cancelAction}>
                <div className="container my-auto" style={container_style} onClick={event => event.stopPropagation()}>
                    <form onSubmit={e => this.formSubmit(e)} className="p-5 bg-white">
                        {income_account_list}
                        {input_account_list}
                        {output_account_list}
                        <div className="form-row form-group">
                            <input readOnly={readOnly} className="form-control col-4 fs24 fwbold border-0 rounded-0" style={input_style} type="text" name="category_name" id="category_name" required autoComplete="off" value={this.state.data.category_name || ''} onChange={e => this.changeInput(e)} placeholder="Name" />
                            <div className="form-row justify-content-between col-8 mx-0">
                                <div className="col-4 d-flex">
                                    <input disabled={readOnly} type="checkbox" name="can_be_sold" id="can_be_sold" className="mr-2" checked={this.state.data.can_be_sold == 1} onChange={e => this.changeInput(e)} />
                                    <label htmlFor="can_be_sold" className="my-auto fw600" style={color_style}>Can be Sold</label>
                                </div>
                                <div className="col-4 d-flex">
                                    <input disabled={readOnly} type="checkbox" name="can_be_purchased" id="can_be_purchased" className="mr-2" checked={this.state.data.can_be_purchased == 1} onChange={e => this.changeInput(e)} />
                                    <label htmlFor="can_be_purchased" className="my-auto fw600" style={color_style}>Can be Purchased</label>
                                </div>
                                <div className="col-4 d-flex">
                                    <input disabled={readOnly} type="checkbox" name="stockable" id="stockable" className="mr-2" checked={this.state.data.stockable == 1} onChange={e => this.changeInput(e)} />
                                    <label htmlFor="stockable" className="my-auto fw600" style={color_style}>Stockable</label>
                                </div>
                            </div>
                        </div>
                        <div className="form-row form-group">
                            <span className="fs20 fwbold text-underline text-uppercase" style={color_style}>Layanan dan Tindakan</span>
                        </div>
                        <div className="form-row justify-content-between mb-5">
                            <div className="col-3">
                                <div className="form-row form-group">
                                    <span className="fs18 fwbold" style={color_style}>Layanan</span>
                                </div>
                                <div className="form-row mb-2">
                                    <label htmlFor="is_grooming" className="my-auto fw600" style={color_style}>Grooming</label>
                                    <input disabled={readOnly} type="checkbox" name="is_grooming" id="is_grooming" className="col-auto ml-auto" checked={this.state.data.is_grooming == 1} onChange={e => this.changeInput(e)} />
                                </div>
                                <div className="form-row mb-2">
                                    <label htmlFor="is_dokter" className="my-auto fw600" style={color_style}>Dokter</label>
                                    <input disabled={readOnly} type="checkbox" name="is_dokter" id="is_dokter" className="col-auto ml-auto" checked={this.state.data.is_dokter == 1} onChange={e => this.changeInput(e)} />
                                </div>
                            </div>
                            <div className="col-3">
                                <div className="form-row form-group">
                                    <span className="fs18 fwbold" style={color_style}>Tindak Lanjut</span>
                                </div>
                                <div className="form-row mb-2">
                                    <label htmlFor="is_operasi" className="my-auto fw600" style={color_style}>Operasi</label>
                                    <input disabled={readOnly} type="checkbox" name="is_operasi" id="is_operasi" className="col-auto ml-auto" checked={this.state.data.is_operasi == 1} onChange={e => this.changeInput(e)} />
                                </div>
                                <div className="form-row mb-2">
                                    <label htmlFor="is_usg" className="my-auto fw600" style={color_style}>USG</label>
                                    <input disabled={readOnly} type="checkbox" name="is_usg" id="is_usg" className="col-auto ml-auto" checked={this.state.data.is_usg == 1} onChange={e => this.changeInput(e)} />
                                </div>
                                <div className="form-row mb-2">
                                    <label htmlFor="is_radiologi" className="my-auto fw600" style={color_style}>Radiologi</label>
                                    <input disabled={readOnly} type="checkbox" name="is_radiologi" id="is_radiologi" className="col-auto ml-auto" checked={this.state.data.is_radiologi == 1} onChange={e => this.changeInput(e)} />
                                </div>
                                <div className="form-row mb-2">
                                    <label htmlFor="is_laboratorium" className="my-auto fw600" style={color_style}>Laboratorium</label>
                                    <input disabled={readOnly} type="checkbox" name="is_laboratorium" id="is_laboratorium" className="col-auto ml-auto" checked={this.state.data.is_laboratorium == 1} onChange={e => this.changeInput(e)} />
                                </div>
                            </div>
                            <div className="col-3">
                                <div className="form-row form-group">
                                    <span className="fs18 fwbold" style={color_style}>Lainnya</span>
                                </div>
                                <div className="form-row mb-2">
                                    <label htmlFor="is_tindakan" className="my-auto fw600" style={color_style}>Tindakan</label>
                                    <input disabled={readOnly} type="checkbox" name="is_tindakan" id="is_tindakan" className="col-auto ml-auto" checked={this.state.data.is_tindakan == 1} onChange={e => this.changeInput(e)} />
                                </div>
                                <div className="form-row mb-2">
                                    <label htmlFor="is_rawat" className="my-auto fw600" style={color_style}>Rawat</label>
                                    <input disabled={readOnly} type="checkbox" name="is_rawat" id="is_rawat" className="col-auto ml-auto" checked={this.state.data.is_rawat == 1} onChange={e => this.changeInput(e)} />
                                </div>
                                <div className="form-row mb-2">
                                    <label htmlFor="is_obat" className="my-auto fw600" style={color_style}>Obat</label>
                                    <input disabled={readOnly} type="checkbox" name="is_obat" id="is_obat" className="col-auto ml-auto" checked={this.state.data.is_obat == 1} onChange={e => this.changeInput(e)} />
                                </div>
                                <div className="form-row mb-2">
                                    <label htmlFor="is_racikan" className="my-auto fw600" style={color_style}>Racikan</label>
                                    <input disabled={readOnly} type="checkbox" name="is_racikan" id="is_racikan" className="col-auto ml-auto" checked={this.state.data.is_racikan == 1} onChange={e => this.changeInput(e)} />
                                </div>
                                <div className="form-row mb-2">
                                    <label htmlFor="is_makanan" className="my-auto fw600" style={color_style}>Makanan</label>
                                    <input disabled={readOnly} type="checkbox" name="is_makanan" id="is_makanan" className="col-auto ml-auto" checked={this.state.data.is_makanan == 1} onChange={e => this.changeInput(e)} />
                                </div>
                            </div>
                        </div>
                        <div className="form-row form-group">
                            <span className="fs20 fwbold text-underline text-uppercase" style={color_style}>Accounts</span>
                        </div>
                        <div className="form-row justify-content-between mb-5">
                            <div className="col-4">
                                <div className="mb-2">
                                    <label htmlFor="income_account" className="my-auto fw600" style={color_style}>Income Account</label>
                                    <input list="income_account" readOnly={readOnly} className="form-control fs14 fw600 border-0 rounded-0" style={input_style} type="text" name="income_account" id="income_account" autoComplete="off" value={income_account_name || this.state.data.income_account || ''} onChange={e => this.changeInput(e)} onBlur={e => this.handleInputBlur(e)} placeholder="Income Account" />
                                </div>
                            </div>
                            <div className="col-4">
                                {stock_input_account_field}
                            </div>
                            <div className="col-4">
                                {stock_output_account_field}
                            </div>
                        </div>
                        {action_button}
                    </form>
                </div>
                <div className="menu-popup-close" />
            </div>
        )
    }
}

var product_categories_list = document.getElementById('product_categories_list')
if (product_categories_list != undefined) {
    ReactDOM.render(<ProductCategories />, product_categories_list)
}