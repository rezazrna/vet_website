class Roles extends React.Component {
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
            'datalength': 0,
        }
        this.checkRow = this.checkRow.bind(this);
        this.deleteRow = this.deleteRow.bind(this);
        this.newRole = this.newRole.bind(this)
        this.toggleShowForm = this.toggleShowForm.bind(this)
        this.roleSearch = this.roleSearch.bind(this)
        this.paginationClick = this.paginationClick.bind(this);
    }

    componentDidMount() {
        var td = this
        frappe.call({
            type: "GET",
            method: 'vet_website.methods.get_roles',
            args: { filters: { 'currentpage': this.state.currentpage } },
            callback: function (r) {
                console.log(r.message)
                if (r.message) {
                    td.setState({ 'data': td.state.data.concat(r.message.roles), 'loaded': true, 'datalength': r.message.datalength });
                }
            }
        });
    }

    paginationClick(number) {
        console.log('Halo')
        var po = this
        var filters = {}

        this.setState({
            currentpage: Number(number),
            loaded: number * 30 <= this.state.data.length,
        });

        filters['currentpage'] = this.state.currentpage

        if (number * 30 > this.state.data.length) {
            frappe.call({
                type: "GET",
                method: 'vet_website.methods.get_roles',
                args: { filters: filters },
                callback: function (r) {
                    console.log(r.message)
                    if (r.message) {
                        po.setState({ 'data': po.state.data.concat(r.message.roles), 'loaded': true, 'datalength': r.message.datalength });
                    }
                }
            });
        }
    }

    roleSearch(filters) {
        var po = this
        filters['currentpage'] = this.state.currentpage
        frappe.call({
            type: "GET",
            method: 'vet_website.methods.get_roles',
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    po.setState({ 'data': po.state.data.concat(r.message.roles), 'datalength': r.message.datalength });
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

    deleteRow(e, enable = false) {
        e.preventDefault();
        var po = this
        var delete_data = this.state.data.filter((d) => d.checked)
        var delete_data_names = delete_data.map((d) => d.name)
        var args = { data: delete_data_names }
        if (enable) { args.enable = true }
        frappe.call({
            type: "GET",
            method: 'vet_website.methods.toggle_roles',
            args: args,
            callback: function (r) {
                if (r.message.success) {
                    var new_data = po.state.data.slice()
                    new_data.filter((d => d.checked)).forEach(d => {
                        d.disabled = enable ? 0 : 1
                        d.checked = 0
                    })
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

    newRole(data) {
        var th = this
        frappe.call({
            type: "POST",
            method: 'vet_website.methods.new_role',
            args: { data: data },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message)
                    var new_data = th.state.data.slice()
                    new_data.unshift(r.message)
                    th.setState({ data: new_data, show_form: false, show_edit: false });
                }
            }
        })
    }

    editRole(index, data) {
        var uom = this
        console.log(data)
        frappe.call({
            type: "POST",
            method: 'vet_website.methods.edit_role',
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
        var sorts = [
            { 'label': 'Name DESC', 'value': 'name desc' },
            { 'label': 'Name ASC', 'value': 'name asc' },
        ]

        var field_list = [
            { 'label': 'Name', 'field': 'name', 'type': 'char' },
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
            if (this.state.data.filter((d) => d.checked).every(d => d.disabled)) {
                delete_row = (
                    <div className="col-auto">
                        <button className="btn btn-outline-danger text-uppercase fs12 fwbold" onClick={e => this.deleteRow(e, true)}>Enable</button>
                    </div>
                )
            } else if (this.state.data.filter((d) => d.checked).every(d => !d.disabled)) {
                delete_row = (
                    <div className="col-auto">
                        <button className="btn btn-outline-danger text-uppercase fs12 fwbold" onClick={e => this.deleteRow(e)}>Disable</button>
                    </div>
                )
            }
        }

        if (this.state.show_form !== false) {
            if (this.state.show_form === 'new') {
                popup_form = <RolesPopupForm cancelAction={() => this.toggleShowForm(false)} submitAction={this.newRole} />
            }
            else if (this.state.data[this.state.show_form] != undefined) {
                popup_form = <RolesPopupForm data={this.state.data[this.state.show_form]} cancelAction={() => this.toggleShowForm(false)} submitAction={data => this.editRole(this.state.show_form, data)} />
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
                            <input className="form-control fs12" name="search" placeholder="Search..." style={formStyle} onChange={e => this.setState({ search: e.target.value })} />
                        </div>
                        <div className="col-7">
                            <Filter sorts={sorts} searchAction={this.roleSearch} field_list={field_list} />
                        </div>
                    </div>
                    <RolesList items={this.state.data} search={this.state.search} checkRow={this.checkRow} checkAll={() => this.checkAll()} check_all={this.state.check_all} toggleShowForm={this.toggleShowForm} paginationClick={this.paginationClick} currentpage={this.state.currentpage} datalength={this.state.datalength} />
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

class RolesList extends React.Component {
    render() {
        var search = this.props.search
        function filterRow(row) {
            function filterField(field) {
                return field ? field.toString().includes(search) : false
            }
            var fields = [row.category_name]
            return ![false, ''].includes(search) ? fields.some(filterField) : true
        }
        var rows = []
        var panel_style = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px' }
        var items = this.props.items

        if (items.length != 0) {
            var list = this
            const indexOfLastTodo = this.props.currentpage * 30;
            const indexOfFirstTodo = indexOfLastTodo - 30;
            var currentItems
            ![false, ''].includes(search) ?
                currentItems = items.filter(filterRow).slice(indexOfFirstTodo, indexOfLastTodo) :
                currentItems = items.slice(indexOfFirstTodo, indexOfLastTodo)

            items.forEach(function (item, index) {
                if (currentItems.includes(item)) {
                    rows.push(
                        <RolesListRow key={index.toString()} item={item} checkRow={() => list.props.checkRow(index)} toggleShowForm={() => list.props.toggleShowForm(index.toString())} />
                    )
                }
            })

            return (
                <div style={panel_style}>
                    <div className="row mx-0">
                        <div className="col-auto pl-2 pr-3">
                            <input type="checkbox" className="d-block my-3" checked={this.props.check_all} onChange={this.props.checkAll} />
                        </div>
                        <div className="col row-header">
                            <div className="row mx-0 fs12 fw600">
                                <div className="col-12 d-flex">
                                    <span className="my-auto">Role</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {rows}
                    <Pagination paginationClick={this.props.paginationClick} datalength={this.props.datalength} currentpage={this.props.currentpage} itemperpage='30' />
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

class RolesListRow extends React.Component {

    render() {
        var item = this.props.item
        var checked = false
        if (item.checked) {
            checked = true
        }

        return (
            <div className="row mx-0">
                <div className="col-auto pl-2 pr-3 d-flex">
                    <input type="checkbox" className="d-block my-auto" checked={checked} onChange={this.props.checkRow} />
                </div>
                <div className="col row-list row-list-link" onClick={this.props.toggleShowForm}>
                    <div className="row mx-0 fs12 fw600">
                        <div className="col-3 d-flex">
                            <span className={item.disabled ? "my-auto text-muted" : "my-auto text-dark"}>{item.role_name || item.name}</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

class RolesPopupForm extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': {
                'permissions': []
            },
            'doctype': [],
        }
    }

    componentDidMount() {
        if (this.props.data != undefined) {
            var new_data = Object.assign({}, this.props.data)
            new_data.permissions = []
            this.props.data.permissions.forEach(perm => {
                var new_perm = Object.assign({}, perm)
                if (new_perm.extra_permission) {
                    new_perm.extra_permission = new_perm.extra_permission.split(',')
                } else {
                    new_perm.extra_permission = []
                }
                new_data.permissions.push(new_perm)
            })
            this.setState({ data: new_data })
        }
        var th = this
        frappe.call({
            type: "GET",
            method: 'vet_website.methods.get_role_form',
            args: {},
            callback: function (r) {
                console.log(r.message)
                if (r.message) {
                    th.setState({ 'doctype': r.message.doctype, 'loaded': true });
                }
            }
        });
    }

    formSubmit(e) {
        e.preventDefault()
        this.props.submitAction(this.state.data)
    }

    changeInput(e, index = false) {
        var target = e.target
        var name = target.name
        var value = target.value
        var new_data = Object.assign({}, this.state.data)
        var role_fields = ['doctype_table', 'read', 'write', 'create', 'delete']
        if (role_fields.includes(name)) {
            if (name == 'doctype_table') {
                new_data.permissions[index][name] = value
            } else {
                if (new_data.permissions[index][name]) {
                    new_data.permissions[index][name] = 0
                }
                else {
                    new_data.permissions[index][name] = 1
                }
            }
        } else if (name == 'extra_permission') {
            new_data.permissions[index][name].push(value)
            e.target.value = ''
        } else {
            new_data[name] = value
        }
        this.setState({ data: new_data })
    }

    handleInputBlur(e, index) {
        const value = e.target.value
        const name = e.target.name
        var new_data = this.state.data
        var selected = false

        if (name == 'doctype_table') {
            selected = this.state.doctype.find(i => i.name == value)
        }

        if (!selected) {
            e.target.value = ''
            if (name == 'doctype_table') {
                new_data.permissions[index][name] = ''
            }

            this.setState({ data: new_data })
        }
    }

    addRole() {
        var new_data = Object.assign({}, this.state.data)
        new_data.permissions = this.state.data.permissions.slice()
        new_data.permissions.push({ extra_permission: [] })
        this.setState({ data: new_data })
    }

    deleteRole(index) {
        var new_data = Object.assign({}, this.state.data)
        new_data.permissions = this.state.data.permissions.slice()
        if (new_data.permissions.name) {
            new_data.permissions[index].deleted = 1
        } else {
            new_data.permissions.splice(index, 1)
        }

        this.setState({ data: new_data })
    }

    deleteRoleExtraPermission(index, ep_index) {
        var new_data = Object.assign({}, this.state.data)
        new_data.permissions = this.state.data.permissions.slice()
        new_data.permissions[index].extra_permission.splice(ep_index, 1)

        this.setState({ data: new_data })
    }

    render() {
        var th = this
        var readOnly = false
        var container_style = { marginTop: '50px', maxWidth: '1021px' }
        var input_style = { background: '#CEEDFF', color: '#056EAD' }
        var color_style = { color: '#056EAD' }
        var add_style = { cursor: 'pointer' }
        var border_style = { borderBottom: '1px solid #cacaca' }
        var button1_style = { minWidth: '147px', border: '1px solid #056EAD', background: '#056EAD', color: '#FFF' }
        var button2_style = { minWidth: '147px', border: '1px solid #056EAD', color: '#056EAD' }
        var extra_permission_style = { background: '#424A5D', color: '#FFFFFF', borderRadius: 8, padding: "12px 8px" }
        var extra_permissions_style = { background: '#318665', color: '#FFFFFF', borderRadius: 5, padding: "6px 12px" }
        if (this.props.readOnly != undefined) {
            readOnly = this.props.readOnly
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
            action_button = (
                <div className="row justify-content-center">
                    <div className="col-auto">
                        <button type="button" onClick={(e) => this.props.toggleReadOnly(e)} className="btn fs18 fw600 py-2" style={button1_style}>Edit</button>
                    </div>
                </div>
            )
        }
        var doctype_options = []
        var doctype_permissions = this.state.data.permissions.filter(d => !d.deleted).map(d => d.doctype_table)
        this.state.doctype.filter(d => !doctype_permissions.includes(d.name)).forEach(d => doctype_options.push(<option key={d.name}>{d.name}</option>))
        var doctype_list = <datalist id="doctype_list">{doctype_options}</datalist>

        var perm_row = []
        if (this.state.data.permissions && this.state.data.permissions.length > 0) {
            this.state.data.permissions.filter(d => !d.deleted).forEach((perm, index) => {
                var extra_permission_options = []
                var extra_permissions = []
                var extra_permission = th.state.doctype.find(dc => dc.name == perm.doctype_table)
                if (extra_permission) {
                    extra_permission.extra_permission.filter(ep => !perm.extra_permission.includes(ep)).forEach(ep => extra_permission_options.push(<option key={ep} value={ep}>{ep.toUpperCase()}</option>))
                }
                perm.extra_permission.forEach((ep, ep_index) => extra_permissions.push(<div key={ep} className="col-auto text-uppercase fs12"><div style={extra_permissions_style}>{ep}<i className="fa fa-times ml-2" style={add_style} onClick={() => th.deleteRoleExtraPermission(index.toString(), ep_index.toString())} /></div></div>))

                var extra_permission_field = (
                    <div className="form-row py-2">
                        <div className="col-8 offset-4" style={extra_permission_style}>
                            <div className="row">
                                <div className="col-3">
                                    <select disabled={readOnly} name="extra_permission" className="form-control fs12 border-0" onChange={e => th.changeInput(e, index.toString())}>
                                        <option value=''>Button</option>
                                        {extra_permission_options}
                                    </select>
                                </div>
                                {extra_permissions}
                            </div>
                        </div>
                    </div>
                )

                perm_row.push(
                    <div key={index.toString()}>
                        <div className="form-row py-2">
                            <div className="col-4">
                                <input readOnly={readOnly || perm.name} className="form-control fs12 border-0 rounded-0" type="text" name="doctype_table" required autoComplete="off" value={perm.doctype_table || ''} onChange={e => th.changeInput(e, index.toString())} onBlur={e => th.handleInputBlur(e, index.toString())} placeholder="Doctype" list="doctype_list" />
                            </div>
                            <div className="col text-center my-auto">
                                <input disabled={readOnly} type="checkbox" name="read" checked={perm.read == 1} onChange={e => th.changeInput(e, index.toString())} />
                            </div>
                            <div className="col text-center my-auto">
                                <input disabled={readOnly} type="checkbox" name="write" checked={perm.write == 1} onChange={e => th.changeInput(e, index.toString())} />
                            </div>
                            <div className="col text-center my-auto">
                                <input disabled={readOnly} type="checkbox" name="create" checked={perm.create == 1} onChange={e => th.changeInput(e, index.toString())} />
                            </div>
                            <div className="col text-center my-auto">
                                <input disabled={readOnly} type="checkbox" name="delete" checked={perm.delete == 1} onChange={e => th.changeInput(e, index.toString())} />
                            </div>
                            <div className="col text-center my-auto">
                                <i className="fa fa-trash fs16" style={Object.assign({}, add_style, color_style)} onClick={() => th.deleteRole(index.toString())} />
                            </div>
                        </div>
                        {extra_permission_options.length > 0 || extra_permissions.length > 0 ? extra_permission_field : false}
                    </div>
                )
            })
        }
        perm_row.push(
            <div className="form-row py-2" key="add">
                <div className="col-4">
                    <span style={Object.assign({}, add_style, color_style)} onClick={() => this.addRole()}><i className="fa fa-plus mr-2" />Tambah</span>
                </div>
            </div>
        )

        var input_name
        if (this.state.data.name) {
            input_name = <span className="fs20 text-dark fwbold">{this.state.data.role_name}</span>
        } else {
            input_name = <input readOnly={readOnly || this.state.data.name} className="form-control col-4 fs18 fwbold border-0 rounded-0" style={input_style} type="text" name="role_name" id="role_name" required autoComplete="off" value={this.state.data.role_name || ''} onChange={e => this.changeInput(e)} placeholder="Role Name" />
        }

        return (
            <div className='menu-popup pt-0 d-flex' onClick={this.props.cancelAction}>
                <div className="container my-auto" style={container_style} onClick={event => event.stopPropagation()}>
                    <form onSubmit={e => this.formSubmit(e)} className="p-5 bg-white">
                        {doctype_list}
                        <div className="form-row form-group">
                            {input_name}
                        </div>
                        <div className="form-row fs16 fw600 py-2" style={border_style}>
                            <div className="col-4">
                                Doctype
                            </div>
                            <div className="col text-center">
                                Read
                            </div>
                            <div className="col text-center">
                                Write
                            </div>
                            <div className="col text-center">
                                Create
                            </div>
                            <div className="col text-center">
                                Delete
                            </div>
                            <div className="col text-center my-auto" />
                        </div>
                        <div>
                            {perm_row}
                        </div>
                        {action_button}
                    </form>
                </div>
                <div className="menu-popup-close" />
            </div>
        )
    }
}

var roles = document.getElementById('roles')
if (roles != undefined) {
    ReactDOM.render(<Roles />, roles)
}