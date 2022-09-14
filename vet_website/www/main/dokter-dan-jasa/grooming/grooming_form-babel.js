var mode = document.getElementById('grooming_form').getAttribute('mode')
var list = document.getElementsByTagName("title")[0].innerHTML.split('/')
// var id = list[list.length - 1].replace(' ', '')
var id = getUrlParameter('n')
// var tzOffset = new Date().getTimezoneOffset()
var tzOffset = 0

class Grooming extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            'data': [],
            'loaded': false,
            'grooming_data': {
                'name': id,
                'service': 'Grooming',
                'action': 'Grooming'
            },
            'new_product': {},
            'checks': [],
            'show_actions': false,
            'currentUser': {},
        }

        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleInputBlur = this.handleInputBlur.bind(this);
        this.editGrooming = this.editGrooming.bind(this);
        this.addProductList = this.addProductList.bind(this);
        this.deleteProductList = this.deleteProductList.bind(this);
        this.handleInputChangeActions = this.handleInputChangeActions.bind(this);
        this.handleInputChangeNewAction = this.handleInputChangeNewAction.bind(this);
        this.addMarker = this.addMarker.bind(this);
        this.handleInputChangeProduct = this.handleInputChangeProduct.bind(this)
        this.pressEnter = this.pressEnter.bind(this)
        this.addCheck = this.addCheck.bind(this)
        this.deleteCheck = this.deleteCheck.bind(this)
        this.addAttachment = this.addAttachment.bind(this)
        this.deleteAttachment = this.deleteAttachment.bind(this)
        this.addMarker = this.addMarker.bind(this)
        this.resetMarker = this.resetMarker.bind(this)
        this.navigationAction = this.navigationAction.bind(this)
    }

    componentDidMount() {
        var gr = this
        var lastfilter = JSON.parse(sessionStorage.getItem('/main/dokter-dan-jasa/grooming'))

        frappe.call({
            type: "GET",
            method: "vet_website.methods.get_current_user",
            args: {},
            callback: function (r) {
                if (r.message) {
                    gr.setState({ 'currentUser': r.message });
                }
            }
        });

        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetgrooming.vetgrooming.get_name_list",
            args: { filters: lastfilter },
            callback: function (r) {
                if (r.message) {
                    gr.setState({ 'namelist': r.message });
                }
            }
        });

        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetgrooming.vetgrooming.get_grooming",
            args: { name: id },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message)
                    var checks = [
                        { 'label': 'Riwayat Vaksin', 'name': 'vaccine_history' },
                        { 'label': 'Riwayat Makanan', 'name': 'food_history' },
                        { 'label': 'Anamnese', 'name': 'anamnese' },
                        { 'label': 'Diagnosa Utama', 'name': 'diagnosa_utama' },
                        { 'label': 'Prognosa', 'name': 'prognosa' },
                        { 'label': 'Diagnosa Banding', 'name': 'diagnosa_banding' },
                        { 'label': 'BCS', 'name': 'bcs' },
                        { 'label': 'Vomit', 'name': 'vomit' },
                        { 'label': 'Ausc. L', 'name': 'auscl' },
                        { 'label': 'Ausc. H', 'name': 'ausch' },
                        { 'label': 'Pulsus', 'name': 'pulse' },
                        { 'label': 'Respirasi', 'name': 'respiration' },
                        { 'label': 'Abdomnal Palpasi Pain', 'name': 'abdominal_palpasi_pain' },
                        { 'label': 'Abdominal Palpasi Tension', 'name': 'abdominal_palpasi_tension' },
                        { 'label': 'Limfonodule', 'name': 'limfonodule' },
                        { 'label': 'Mukosa', 'name': 'mukosa' },
                        { 'label': 'Mata', 'name': 'mata' },
                        { 'label': 'Hidung', 'name': 'hidung' },
                        { 'label': 'Mulut', 'name': 'mulut' },
                        { 'label': 'Telinga', 'name': 'telinga' },
                        { 'label': 'Kulit', 'name': 'kulit' },
                        { 'label': 'Ekstremitas', 'name': 'ekstremitas' },
                        { 'label': 'Sensasi Refleks', 'name': 'reflex' },
                        { 'label': 'Lainnya', 'name': 'other' },
                        { 'label': 'Tindakan', 'name': 'action' },
                        { 'label': 'Lainnya Pemeriksaan', 'name': 'other_pemeriksaan' },
                        { 'label': 'Lainnya Diagnosa', 'name': 'other_diagnosa' },
                    ]

                    var new_checks = []

                    checks.forEach((c, index) => {
                        if (![null, undefined, '', 0].includes(r.message.grooming[c.name])) {
                            c.value = r.message.grooming[c.name]
                            new_checks.push(c)
                        }
                    })

                    var productLength = r.message.grooming.products.length
                    gr.setState({ 'data': r.message, 'loaded': true, 'productLength': productLength, 'checks': new_checks, });

                }
            }
        });

        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetgrooming.vetgrooming.get_all_products",
            args: {},
            callback: function (r) {
                console.log(r.message)
                if (r.message) {
                    var tempData = gr.state.data
                    tempData['products_all'] = r.message
                    gr.setState({ 'data': tempData });
                }
            }
        });

        $(document).on("keydown", ":input:not(textarea)", function (event) {
            return event.key != "Enter";
        });
    }

    navigationAction(name) {
        window.location.href = "/main/dokter-dan-jasa/grooming/edit?n=" + name
    }

    handleInputChange(event) {
        const value = event.target.value;
        const name = event.target.name;
        var new_data = this.state.data
        new_data.grooming[name] = value
        this.setState({ data: new_data });

        frappe.call({
            type: "POST",
            method: "vet_website.vet_website.doctype.vetgrooming.vetgrooming.autosave",
            args: { field: name, value: value, name: id },
            callback: function (r) {
                if (r.message != true) {
                    frappe.msgprint(r.message.error)
                }
            }
        });
    }

    handleInputChangeActions(event, i) {
        const value = event.target.value;
        const name = event.target.name;
        var new_data = this.state.data
        new_data.grooming.actions[i][name] = value
        this.setState({ data: new_data })

        console.log(new_data.grooming.actions)

        frappe.call({
            type: "POST",
            method: "vet_website.vet_website.doctype.vetgrooming.vetgrooming.autosave",
            args: { field: 'actions', value: new_data.grooming.actions[i], name: id },
            callback: function (r) {
                if (r.message != true) {
                    frappe.msgprint(r.message.error)
                }
            }
        });
    }

    handleInputChangeNewAction(event) {
        const value = event.target.value;
        const name = event.target.name;
        var new_data = Object.assign({}, this.state.data)
        if (new_data.grooming.new_actions == undefined) {
            new_data.grooming.new_actions = {}
        }
        new_data.grooming.new_actions[name] = value
        this.setState({ data: new_data })

        if (new_data.grooming.new_actions['date'] && new_data.grooming.new_actions['note']) {
            frappe.call({
                type: "POST",
                method: "vet_website.vet_website.doctype.vetgrooming.vetgrooming.autosave",
                args: { field: 'actions', value: new_data.grooming.new_actions, name: id },
                callback: function (r) {
                    if (r.message != true) {
                        frappe.msgprint(r.message.error)
                    }
                }
            });
        }
    }

    editGrooming(e) {
        e.preventDefault();
        var grooming_data = this.state.grooming_data
        var grooming = this.state.data.grooming
        var products = []
        var new_products = []
        var js = this

        grooming.products.forEach(function (item, index) {
            if (index < js.state.productLength) {
                var p = { 'product': item.product, 'quantity': item.quantity, 'name': item.name }
                if (item.delete) {
                    p.delete = item.delete
                }
                products.push(p)
            } else {
                var p = { 'product': item.product, 'quantity': item.quantity }
                new_products.push(p)
            }
        })

        grooming_data['new_products'] = new_products
        grooming_data['products'] = products
        grooming_data['new_actions'] = []
        grooming_data['actions'] = grooming.actions
        grooming_data['register_number'] = grooming.register_number
        grooming_data['pet'] = grooming.pet
        grooming_data['condition'] = grooming.condition
        grooming_data['temperature'] = grooming.temperature
        grooming_data['weight'] = grooming.weight
        grooming_data['description'] = grooming.description
        grooming_data['attachments'] = grooming.attachments
        grooming_data['marker'] = grooming.marker

        this.state.checks.forEach((c, index) => {
            if (!c.delete) {
                grooming_data[c.name] = c.value
            }
        })

        if (grooming.new_actions != undefined) {
            grooming_data['new_actions'] = [grooming.new_actions]
        }

        var args = { grooming_data: grooming_data }
        this.state.is_done ? args.is_done = true : false

        frappe.call({
            type: "POST",
            method: "vet_website.vet_website.doctype.vetgrooming.vetgrooming.edit_grooming",
            args: args,
            callback: function (r) {
                if (r.message.grooming) {
                    // window.location.pathname = "/main/dokter-dan-jasa/grooming"
                    window.location.reload()
                }
                if (r.message.error) {
                    frappe.msgprint(r.message.error);
                }
            }
        });
    }

    handleInputChangeProduct(e) {
        const value = e.target.value
        const name = e.target.name
        const id = e.target.id
        var new_product = this.state.new_product
        var aa = this
        var selected = false
        var realValue
        if (name == 'product') {
            this.state.data.products_all.forEach(function (item, index) {
                if (item.product_name == value) {
                    selected = true
                    realValue = item.name
                }
            })

            if (selected) {
                frappe.call({
                    type: "GET",
                    method: "vet_website.vet_website.doctype.vetapotik.vetapotik.get_product_details",
                    args: { name: realValue },
                    callback: function (r) {
                        if (r.message) {
                            if (new_product['quantity'] != undefined) {
                                r.message.product['quantity'] = new_product['quantity']
                            }
                            if (id == 'tindakan') {
                                r.message.product['quantity'] = 1
                                aa.setState({ new_product: r.message.product })
                                aa.addNewProductToList()
                                var qty = document.getElementById("quantity")
                                var selectProduct = document.getElementById("jasa")
                                var selectProductDokter = document.getElementById("tindakan")
                                qty.value = qty.defaultValue
                                selectProduct.value = ''
                                selectProductDokter.value = ''
                            } else {
                                aa.setState({ new_product: r.message.product })
                            }
                            // aa.setState({new_product: r.message.product})
                        }
                    }
                });
            }
        } else {
            new_product[name] = value
            this.setState({ new_product: new_product })
        }
    }

    addNewProductToList() {
        var new_product = this.state.new_product
        var new_data = this.state.data
        var ap = this
        console.log(new_data)
        frappe.call({
            type: "POST",
            method: "vet_website.vet_website.doctype.vetproduct.vetproduct.get_product",
            args: { name: new_product.name },
            callback: function (r) {
                if (r.message.product) {
                    var is_dokter = 0
                    r.message.product.product_category && r.message.product.product_category.is_dokter ? is_dokter = r.message.product.product_category.is_dokter : false
                    new_data.grooming.products.push({ 'product': new_product.name, 'quantity': new_product.quantity, 'product_name': r.message.product.product_name, 'price': r.message.product.price, 'is_dokter': is_dokter })
                    frappe.call({
                        type: "POST",
                        method: "vet_website.vet_website.doctype.vetgrooming.vetgrooming.autosave",
                        args: { field: 'products', value: new_data.grooming.products.filter(i => !i.deleted), name: id },
                        callback: function (r) {
                            if (r.message != true) {
                                frappe.msgprint(r.message.error)
                            }
                        }
                    });
                    ap.setState({ 'data': new_data })
                }
                if (r.message.error) {
                    frappe.msgprint(r.message.error);
                }
            }
        });

        this.setState({ data: new_data, new_product: {} })
    }

    pressEnter(e) {
        var new_product = this.state.new_product
        var onSelect = this.state.onSelect
        var ap = this

        if (e.key === 'Enter' || e.key == 'Tab') {
            e.preventDefault();
            if (new_product.name && new_product.name != '' && new_product.quantity != '0' && new_product.quantity) {
                this.addNewProductToList()

                var qty = document.getElementById("quantity")
                var selectProduct = document.getElementById("jasa")
                var selectProductDokter = document.getElementById("tindakan")
                qty.value = qty.defaultValue
                selectProduct.value = ''
                selectProductDokter.value = ''
            }

            document.getElementById("jasa").focus();
        }
    }

    addProductList(e) {
        e.preventDefault();
        var new_data = this.state.data
        var value = e.target.value
        var ap = this
        var selected = false
        var realValue
        if (value != undefined || value != '') {
            this.state.data.products_all.forEach(function (item, index) {
                if (item.product_name == value) {
                    selected = true
                    realValue = item.name
                }
            })

            if (selected) {
                e.target.selectedIndex = 0
                frappe.call({
                    type: "POST",
                    method: "vet_website.vet_website.doctype.vetproduct.vetproduct.get_product",
                    args: { name: realValue },
                    callback: function (r) {
                        if (r.message.product) {
                            new_data.grooming.products.push({ 'product': realValue, 'quantity': 1, 'product_name': r.message.product.product_name, 'price': r.message.product.price })
                            frappe.call({
                                type: "POST",
                                method: "vet_website.vet_website.doctype.vetgrooming.vetgrooming.autosave",
                                args: { field: 'products', value: new_data.grooming.products.filter(i => !i.deleted), name: id },
                                callback: function (r) {
                                    if (r.message != true) {
                                        frappe.msgprint(r.message.error)
                                    }
                                }
                            });
                            ap.setState({ 'data': new_data })
                        }
                        if (r.message.error) {
                            frappe.msgprint(r.message.error);
                        }
                    }
                });
                e.target.value = e.target.defaultValue
            }
        }
        else {
            new_data.grooming.products.push({ 'product': this.state.data.products_all[0]['name'] })
            this.setState({ 'data': new_data })
        }

    }

    deleteProductList(e, i) {
        e.preventDefault();
        var new_data = Object.assign({}, this.state.data)
        var current_product = new_data.grooming.products[i]
        if (current_product.name == undefined) {
            delete new_data.grooming.products[i]
        } else {
            new_data.grooming.products[i].delete = true
        }

        frappe.call({
            type: "POST",
            method: "vet_website.vet_website.doctype.vetgrooming.vetgrooming.autosave",
            args: { field: 'products', value: new_data.grooming.products.filter(i => !i.delete), name: id },
            callback: function (r) {
                if (r.message != true) {
                    frappe.msgprint(r.message.error)
                }
            }
        });
        this.setState({ 'data': new_data })
    }

    cancelGrooming(e) {
        e.preventDefault();
        frappe.call({
            type: "POST",
            method: "vet_website.vet_website.doctype.vetgrooming.vetgrooming.cancel_grooming",
            args: { name: id },
            callback: function (r) {
                if (r.message.success) {
                    window.location.pathname = "/main/dokter-dan-jasa/grooming"
                } else if (r.message.error) {
                    frappe.msgprint(r.message.error);
                }
            }
        });
    }

    handleInputBlur(e) {
        const value = e.target.value
        const name = e.target.name
        var new_data = this.state.data
        var limfonodule = ['Tidak Bengkak', 'Bengkak']
        var condition = ['Sehat', 'Sakit']
        var selected = false

        if (name == 'limfonodule') {
            limfonodule.forEach(function (item, index) {
                if (item == value) {
                    selected = true
                }
            })
        } else if (name == 'condition') {
            condition.forEach(function (item, index) {
                if (item == value) {
                    selected = true
                }
            })
        } else if (name == "product") {
            this.state.data.products_all.forEach(function (item, index) {
                if (item.product_name == value) {
                    selected = true
                }
            })
        }

        if (!selected) {
            e.target.value = ''

            if (name == 'limfonodule' || name == 'condition') {
                new_data.grooming[name] = ''
                this.setState({ data: new_data })
            }
        }
    }

    addCheck(data) {
        var checks = this.state.checks.slice()
        checks.push(data)
        this.setState({ checks: checks })
        frappe.call({
            type: "POST",
            method: "vet_website.vet_website.doctype.vetgrooming.vetgrooming.autosave",
            args: { field: data.name, value: data.value, name: id },
            callback: function (r) {
                if (r.message != true) {
                    frappe.msgprint(r.message.error)
                }
            }
        });
    }

    deleteCheck(i) {
        var checks = this.state.checks.slice()
        checks[i].delete = true
        this.setState({ checks: checks })
        frappe.call({
            type: "POST",
            method: "vet_website.vet_website.doctype.vetgrooming.vetgrooming.autosave",
            args: { field: checks[i]['name'], value: '', name: id },
            callback: function (r) {
                if (r.message != true) {
                    frappe.msgprint(r.message.error)
                }
            }
        });
    }

    addAttachment(data) {
        var vr = this
        var new_data = Object.assign({}, this.state.data)
        var name = data.attachment.name;
        var reader = new FileReader();
        reader.onload = function (e) {
            data.filename = name,
                data.dataurl = reader.result
            data.attachment = URL.createObjectURL(data.attachment)
            new_data.grooming.attachments.push(data)
            frappe.call({
                type: "POST",
                method: "vet_website.vet_website.doctype.vetgrooming.vetgrooming.autosave",
                args: { field: 'attachments', value: new_data.grooming.attachments.filter(i => !i.deleted), name: id },
                callback: function (r) {
                    if (r.message != true) {
                        frappe.msgprint(r.message.error)
                    }
                }
            });
            vr.setState({ data: new_data })
        }
        reader.readAsDataURL(data.attachment);
    }

    deleteAttachment(i) {
        var new_data = Object.assign({}, this.state.data)
        if (new_data.grooming.attachments[i].name != undefined) {
            new_data.grooming.attachments[i].deleted = true
        }
        else {
            new_data.grooming.attachments.splice(i, 1)
        }
        this.setState({ data: new_data })
        frappe.call({
            type: "POST",
            method: "vet_website.vet_website.doctype.vetgrooming.vetgrooming.autosave",
            args: { field: 'attachments', value: new_data.grooming.attachments.filter(i => !i.deleted), name: id },
            callback: function (r) {
                if (r.message != true) {
                    frappe.msgprint(r.message.error)
                }
            }
        });
    }

    addMarker(marker) {
        var new_data = Object.assign({}, this.state.data)
        new_data.grooming.marker = marker
        this.setState({ data: new_data })
        frappe.call({
            type: "POST",
            method: "vet_website.vet_website.doctype.vetgrooming.vetgrooming.autosave",
            args: { field: 'marker', value: new_data.grooming.marker, name: id },
            callback: function (r) {
                if (r.message != true) {
                    frappe.msgprint(r.message.error)
                }
            }
        });
    }

    resetMarker() {
        var new_data = Object.assign({}, this.state.data)
        frappe.call({
            type: "POST",
            method: "vet_website.vet_website.doctype.vetgrooming.vetgrooming.autosave",
            args: { field: 'marker_delete', value: new_data.grooming.marker, name: id },
            callback: function (r) {
                if (r.message != true) {
                    frappe.msgprint(r.message.error)
                }
            }
        });
        delete new_data.grooming.marker
        this.setState({ data: new_data })
    }

    toggleShowActions() {
        this.setState({ show_actions: !this.state.show_actions })
    }

    customerInvoiceClick() {
        var grooming = this.state.data.grooming
        if (grooming.customer_invoice && grooming.customer_invoice.length > 1) {
            window.location.href = '/main/kasir/customer-invoices?register_number=' + encodeURIComponent(grooming.register_number)
        } else if (grooming.customer_invoice && grooming.customer_invoice.length == 1) {
            window.location.href = '/main/kasir/customer-invoices/edit?n=' + encodeURIComponent(grooming.customer_invoice[0])
        }
    }

    render() {
        var panel_style = { background: '#FFFFFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', padding: '2px 32px', marginBottom: '15px' }
        var lineHeight_style = { lineHeight: '14px' }
        var buttonMode = []
        var grooming = this.state.data.grooming
        var color = { color: '#056EAD', cursor: 'pointer' }
        var backButton = <span className="fs16 fw600 mr-auto my-auto" style={color} onClick={() => window.location.href = '/main/dokter-dan-jasa/grooming'}><i className="fa fa-chevron-left mr-1" style={color}></i>Back</span>
        var statuses
        var cursor = { cursor: 'pointer' }
        var write = checkPermission('VetGrooming', this.state.currentUser, 'write')
        var lanjut = checkPermission('VetGrooming', this.state.currentUser, 'lanjut')
        var proses = checkPermission('VetGrooming', this.state.currentUser, 'proses')

        if (this.state.loaded) {
            var emptyDivStyle = { height: '64px' }
            buttonMode.push(<div className="col-auto p-0" style={emptyDivStyle} key="1000" />)
            if (grooming.status == 'Draft') {
                if (proses) {
                    buttonMode.push(
                        <div className="col-auto my-auto" key="process">
                            <button type="submit" id="to_done" className="btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2" style={lineHeight_style} onClick={() => this.setState({ is_done: true })}>Proses</button>
                        </div>
                    )
                }
                if (lanjut) {
                    buttonMode.push(
                        <div className="col-auto my-auto" key="1">
                            <button type="submit" id="to_checked" className="btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2" style={lineHeight_style}>Lanjut</button>
                        </div>
                    )
                }
                buttonMode.push(
                    <div className="col-auto my-auto" key="0">
                        <a href="#" className="btn btn-sm fs12 btn-outline-danger text-uppercase h-100 fwbold py-2" onClick={this.cancelGrooming}>Batalkan</a>
                    </div>
                )
            }
            else if (grooming.status == 'Checked' && proses) {
                buttonMode.push(
                    <div className="col-auto my-auto" key="1">
                        <button type="submit" id="to_done" className="btn btn-sm btn-danger fs12 text-uppercase h-100 px-3 fwbold py-2" style={lineHeight_style}>Proses</button>
                    </div>
                )
            }
            buttonMode.push(<div className="col-auto my-auto" key="9"><button type="button" className="btn btn-sm fs12 btn-outline-danger text-uppercase h-100 fwbold py-2" onClick={() => this.toggleShowActions()}>Kunjungan Berikutnya</button></div>)
            buttonMode.push(<div className="col-auto mr-auto px-0" key="spacer" />)
            if (grooming.status == 'Done') {
                buttonMode.push(
                    <div className="col-auto" key="customer-invoice" style={cursor} onClick={() => this.customerInvoiceClick()}>
                        <div className="row mx-0">
                            <div className="col-auto px-3">
                                <img className="d-block mx-auto mt-2 header-icon" src="/static/img/main/menu/cashier.png" />
                                <p className="mb-0 fs12 text-muted text-center">Customer Invoice</p>
                            </div>
                        </div>
                    </div>
                )
            }
            buttonMode.push(
                <div className="col-auto" key='spending'>
                    <div className="col-auto mr-auto" style={cursor}>
                        <div className="row mx-0">
                            <div className="col-auto px-3">
                                <img className="d-block mx-auto header-icon mt-2" src="/static/img/main/menu/spending.png" />
                                <p className="mb-0 fs12 text-muted text-center">Spending</p>
                            </div>
                            <div className="col-auto px-2 d-flex my-auto">
                                <span className="fs26 fw600">
                                    {formatter.format(this.state.data.total_spending)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )

            buttonMode.push(<div key="999" className="col-auto d-flex mr-auto">{backButton}</div>)

            if (this.state.data.grooming.status == 'Cancel') {
                statuses = ['Cancel']
            } else {
                statuses = ['Draft', 'Checked', 'Done']
            }

            var rekam_medis_class = "col-6"

            return <form id="grooming_form" onSubmit={(e) => this.editGrooming(e)}>
                <div style={panel_style}>
                    <div className="row mx-0 flex-row-reverse">
                        {buttonMode}
                    </div>
                </div>
                <div className="row justify-content-end">
                    <div className="col-auto">
                        <StatusRow statuses={statuses} current_status={grooming.status} />
                    </div>
                    <div className="col-auto">
                        <RecordNavigation currentname={id} namelist={this.state.namelist} navigationAction={this.navigationAction} />
                    </div>
                </div>
                <FormGrooming write={write} grooming={this.state.data.grooming} pet_owner={this.state.data.pet_owner} handleInputChange={e => this.handleInputChange(e)} />
                <div className="row">
                    <div className={rekam_medis_class}>
                        <Pengecekan write={write} grooming={this.state.data.grooming} handleInputChange={this.handleInputChange} grooming_data={this.state.grooming_data} handleInputBlur={this.handleInputBlur} addMarker={this.addMarker} markers={this.state.markers} addCheck={this.addCheck} deleteCheck={this.deleteCheck} checks={this.state.checks} deleteAttachment={this.deleteAttachment} addAttachment={this.addAttachment} resetMarker={this.resetMarker} toggleRekamMedisWide={() => this.toggleRekamMedisWide()} />
                    </div>
                    <div className="col-6">
                        <Jasa write={write} grooming={this.state.data.grooming} products_all={this.state.data.products_all} addProductList={this.addProductList} deleteProductList={this.deleteProductList} handleInputBlur={this.handleInputBlur} handleInputChangeProduct={this.handleInputChangeProduct} pressEnter={this.pressEnter} />
                        {this.state.show_actions ? <KunjunganBerikutnya write={write} grooming={this.state.data.grooming} handleInputChangeActions={this.handleInputChangeActions} handleInputChangeNewAction={e => this.handleInputChangeNewAction(e)} toggleShowActions={() => this.toggleShowActions()} /> : false}
                    </div>
                </div>
                <GroomingVersion version={this.state.data.version || []} />
            </form>
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

class FormGrooming extends React.Component {
    sourceClick(tipe) {
        if (tipe == 'penerimaan') {
            window.location.href = '/main/penerimaan/penerimaan-pasien/detail?n=' + this.props.grooming.reception
        } else if (tipe == 'pemilik') {
            window.location.href = '/main/penerimaan/data-pemilik/edit?n=' + this.props.grooming.pet_owner
        } else if (tipe == 'pasien') {
            window.location.href = '/main/penerimaan/data-pasien/edit?n=' + this.props.grooming.pet
        }
    }

    dokterClick() {
        if (this.props.grooming.tindakan_dokter && this.props.grooming.tindakan_dokter.length > 1) {
            window.location.href = "/main/dokter-dan-jasa/tindakan-dokter?register_number=" + encodeURIComponent(this.props.reception.register_number)
        } else if (this.props.grooming.tindakan_dokter && this.props.grooming.tindakan_dokter.length == 1) {
            window.location.href = "/main/dokter-dan-jasa/tindakan-dokter/edit?n=" + encodeURIComponent(this.props.grooming.tindakan_dokter[0])
        }
    }

    render() {
        var panel_style = { background: '#fff', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)' }
        var inputNoAntrian, inputNIP, inputNamaPasien, inputNamaPemilik, inputTanggalPendaftaran, inputNoRegistrasi, inputCatatan
        var grooming = this.props.grooming
        var pet_owner = this.props.pet_owner
        var cursor = { cursor: 'pointer' }
        var link_pemilik = <img src="/static/img/main/menu/tautan.png" className="mx-2" onClick={() => this.sourceClick('pemilik')} style={cursor} />
        var link_pasien = <img src="/static/img/main/menu/tautan.png" className="mx-2" onClick={() => this.sourceClick('pasien')} style={cursor} />
        var link_penerimaan = <img src="/static/img/main/menu/tautan.png" className="mx-2" onClick={() => this.sourceClick('penerimaan')} style={cursor} />
        var link_dokter = <img src="/static/img/main/menu/tautan.png" className="mx-2" onClick={() => this.dokterClick()} style={cursor} />

        var inputUser = <span className="fs16 px-2" id="owner">{frappe.session.user}{link_dokter}</span>

        if (mode == 'Detail' || !this.props.write) {
            inputNoAntrian = <span className="fs16 px-2" id="reception">{grooming ? grooming.queue + " / " + grooming.reception : ''}{link_penerimaan}</span>
            inputNIP = <span className="fs16 px-2" id="name_pet">{grooming ? grooming.pet : ''}</span>
            inputNamaPasien = <span className="fs16 px-2" id="pet_name">{grooming ? grooming.pet_name : ''}{link_pasien}</span>
            inputNamaPemilik = <span className="fs16 px-2" id="owner_name">{pet_owner ? pet_owner.owner_name : ''}{link_pemilik}</span>
            inputTanggalPendaftaran = <span className="fs16 px-2" name='reception_date'>{grooming ? moment(grooming.reception_date).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss") : ''}</span>
            inputNoRegistrasi = <span className="fs16 px-2" id="register_number">{grooming ? grooming.register_number : ''}</span>
            inputCatatan = <span className="fs16 px-2" id="description">{grooming ? grooming.description : ''}</span>
        } else if (mode == 'Edit' && this.props.write) {
            inputNoAntrian = <span className="fs16 px-2" id="reception">{grooming ? grooming.queue + " / " + grooming.reception : ''}{link_penerimaan}</span>
            inputNIP = <span className="fs16 px-2" id="name_pet">{grooming ? grooming.pet : ''}</span>
            inputNamaPasien = <span className="fs16 px-2" id="pet_name">{grooming ? grooming.pet_name : ''}{link_pasien}</span>
            inputNamaPemilik = <span className="fs16 px-2" id="owner_name">{pet_owner ? pet_owner.owner_name : ''}{link_pemilik}</span>
            inputTanggalPendaftaran = <span className="fs16 px-2" name='reception_date'>{grooming ? moment(grooming.reception_date).subtract(tzOffset, 'minute').format("YYYY-MM-DD HH:mm:ss") : ''}</span>
            inputNoRegistrasi = <span className="fs16 px-2" id="register_number">{grooming ? grooming.register_number : ''}</span>
            if (['Draft', 'Checked'].includes(grooming.status)) {
                inputCatatan = <textarea id="description" name='description' className="form-control border-0 lightbg" defaultValue={grooming.description} rows="3" onChange={this.props.handleInputChange}></textarea>
            }
            else {
                inputCatatan = <span className="fs16 px-2" id="description">{grooming ? grooming.description : ''}</span>
            }
        }

        return <div>
            <p className="fs18 fw600 text-dark mb-2">Data Pasien</p>
            <div style={panel_style} className="p-4 mb-4">
                <div className="form-row">
                    <div className="col-8">
                        <div className="form-row">
                            <div className="col-4">
                                <div className="form-group">
                                    <label htmlFor="no_antrian" className=" fw600">No Antrian / No Penerimaan</label>
                                    <div className="row mx-0">
                                        {inputNoAntrian}
                                    </div>
                                </div>
                            </div>
                            <div className="col-4">
                                <div className="form-group">
                                    <label htmlFor="nama_pasien" className=" fw600">Nama Pasien</label>
                                    <div className="row mx-0">
                                        {inputNamaPasien}
                                    </div>
                                </div>
                            </div>
                            <div className="col-4">
                                <div className="form-group">
                                    <label htmlFor="tanggal_pendaftaran" className=" fw600">Tanggal Pendaftaran</label>
                                    <div className="row mx-0">
                                        {inputTanggalPendaftaran}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="col-4">
                                <div className="form-group">
                                    <label htmlFor="no_registrasi_penerimaan" className=" fw600">No Pendaftaran</label>
                                    <div className="row mx-0">
                                        {inputNoRegistrasi}
                                    </div>
                                </div>
                            </div>
                            <div className="col-4">
                                <div className="form-group">
                                    <label htmlFor="nama_pemilik" className=" fw600">Nama Pemilik</label>
                                    <div className="row mx-0">
                                        {inputNamaPemilik}
                                    </div>
                                </div>
                            </div>
                            <div className="col-4">
                                <div className="form-group">
                                    <label htmlFor="owner" className=" fw600">Nama Dokter</label>
                                    <div className="row mx-0">
                                        {inputUser}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-4">
                        <div className="form-group">
                            <label htmlFor="description" className="fw600">Catatan</label>
                            <div className="row mx-0">
                                {inputCatatan}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }
}

class Jasa extends React.Component {
    render() {
        // var boxShadow_style = {background: '#fff', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)'}
        var boxShadow_style = { background: '#fff', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', padding: '10px 24px', height: 'calc(100vh - 475px)', maxHeight: 'unset', minHeight: '180px', overflowY: 'auto' }
        var tabPaneStyle = { height: '100%' }
        var grooming = this.props.grooming
        var groomingProductList = []
        var dokterProductList = []
        var js = this

        grooming.products.forEach(function (product, index) {
            if (product.delete == undefined && !product.is_dokter) {
                groomingProductList.push(<GroomingProductList write={js.props.write} product={product} status={grooming.status} products_all={js.props.products_all} key={index.toString()} deleteProductList={e => js.props.deleteProductList(e, index.toString())} register_number={grooming.register_number} tindakan_dokter={grooming.tindakan_dokter} />)
            } else if (product.delete == undefined && product.is_dokter) {
                dokterProductList.push(<GroomingProductList write={js.props.write} product={product} status={grooming.status} products_all={js.props.products_all} key={index.toString()} deleteProductList={e => js.props.deleteProductList(e, index.toString())} register_number={grooming.register_number} tindakan_dokter={grooming.tindakan_dokter} is_dokter={true} />)
            }
        })

        if (mode == 'Edit' && grooming.status == 'Draft' && this.props.write) {
            var option_product = [];
            var option_product_dokter = []
            this.props.products_all.forEach(function (item, index) {
                if (item.product_category && item.product_category.is_dokter) {
                    option_product_dokter.push(<option value={item.product_name} key={index.toString()} />)
                } else {
                    option_product.push(<option value={item.product_name} key={index.toString()} />)
                }
            });
            var select_style = { color: '#056EAD', border: '1px solid #056EAD' }
            var newProductSelect = <div className="row">
                <div className="col-10">
                    <input name='product' className="form-control fs14" style={select_style} onChange={e => this.props.handleInputChangeProduct(e)} onBlur={this.props.handleInputBlur} list="products" id="jasa" placeholder="Pilih Untuk Menambahkan" autoComplete="off" />
                    <datalist id="products">
                        {option_product}
                    </datalist>
                </div>
                <div className="col-2">
                    <input style={select_style} type="text" className="form-control input-sm text-center fs14 fw600" name="quantity" id="quantity" placeholder="0" onChange={e => this.props.handleInputChangeProduct(e)} onKeyDown={this.props.pressEnter} />
                </div>
            </div>

            var newProductDokterSelect = <div className="row">
                <div className="col-12">
                    <input name='product' className="form-control fs14" style={select_style} onChange={e => this.props.handleInputChangeProduct(e)} onBlur={this.props.handleInputBlur} list="products_dokter" id="tindakan" placeholder="Pilih Untuk Menambahkan" autoComplete="off" />
                    <datalist id="products_dokter">
                        {option_product_dokter}
                    </datalist>
                </div>
            </div>
        }

        return <div>
            <p className="mb-2 text-dark fs18 fw600">Jasa dan Tindakan</p>
            <div className="p-4 mb-3" style={boxShadow_style}>
                <ul className="nav nav-tabs nav-fill justify-content-around" id="groomingTab" role="tablist">
                    <li className="nav-item">
                        <a className="nav-link py-1 active px-0" id="jasa-tab" data-toggle="tab" href="#jasacontent" role="tab"><span>Jasa</span></a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link py-1 px-0" id="tindakan-tab" data-toggle="tab" href="#tindakancontent" role="tab"><span>Tindakan</span></a>
                    </li>
                </ul>
                <div className="tab-content" id="groomingTabContent">
                    <div className="tab-pane pt-4 pb-2 show active" id="jasacontent" role="tabpanel">
                        <div className="mb-3">
                            {newProductSelect}
                        </div>
                        <div>
                            <div id="product_list">
                                {groomingProductList}
                            </div>
                        </div>
                    </div>
                    <div className="tab-pane pt-4 pb-2" id="tindakancontent" role="tabpanel">
                        <div className="mb-3">
                            {newProductDokterSelect}
                        </div>
                        <div>
                            <div id="product_list">
                                {dokterProductList}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }
}

class GroomingProductList extends React.Component {
    dokterClick() {
        if (this.props.tindakan_dokter && this.props.tindakan_dokter.length > 1) {
            window.location.href = "/main/dokter-dan-jasa/tindakan-dokter?register_number=" + encodeURIComponent(this.props.register_number)
        } else if (this.props.tindakan_dokter && this.props.tindakan_dokter.length == 1) {
            window.location.href = "/main/dokter-dan-jasa/tindakan-dokter/edit?n=" + encodeURIComponent(this.props.tindakan_dokter[0])
        }
    }

    render() {
        var panel_style = { background: '#D2EEFF', padding: '10px 20px', color: '#056EAD' }
        var product = this.props.product
        var status = this.props.status
        var product_name
        var products_all = this.props.products_all
        var cursor = { cursor: 'pointer' }
        var deleteButton
        var totalProductPrice = product.price * product.quantity
        var link_dokter

        if (mode == 'Detail' || ['Checked', 'Done'].includes(status)) {
            product_name = <span className="fs14">{product.product_name}</span>
            link_dokter = <img src="/static/img/main/menu/tautan.png" className="mx-2" onClick={() => this.dokterClick()} style={cursor} />
        } else if (mode == 'Edit' && status == 'Draft') {
            var option_product = [];

            products_all.forEach(function (item, index) {
                option_product.push(<option value={item.name} key={index.toString()}>{item.product_name}</option>)
            });
            product_name = <span className="fs14">{product.product_name}</span>
            deleteButton = <i className="fa fa-2x fa-trash ml-auto" onClick={this.props.deleteProductList} style={cursor} />
        }
        return <div id={product.name} className="row mx-0 mb-3 fs12 fw600 grooming_products" style={panel_style}>
            <div className="col-12 mb-2">
                <div className="row">
                    <div className="col">
                        {product_name}{this.props.is_dokter ? link_dokter : false}
                    </div>
                    <div className="col-2 text-center d-flex">
                        {this.props.write ? deleteButton : false}
                    </div>
                </div>
            </div>
            <div className="col-12">
                <div className="row">
                    <div className="col-6">
                        <span>{product.quantity}</span><span className="mx-3">x</span><span>{formatter.format(product.price || 0)}</span>
                    </div>
                    <div className="col-6 text-right">
                        <span>{formatter.format(totalProductPrice || 0)}</span>
                    </div>
                </div>
            </div>
        </div>
    }
}

class Pengecekan extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            'new_check': {},
            'available_check': [
                { 'label': 'Riwayat Vaksin', 'name': 'vaccine_history' },
                { 'label': 'Riwayat Makanan', 'name': 'food_history' },
                { 'label': 'Anamnese', 'name': 'anamnese' },
                { 'label': 'Diagnosa Utama', 'name': 'diagnosa_utama' },
                { 'label': 'Prognosa', 'name': 'prognosa' },
                { 'label': 'Diagnosa Banding', 'name': 'diagnosa_banding' },
                { 'label': 'BCS', 'name': 'bcs' },
                { 'label': 'Vomit', 'name': 'vomit' },
                { 'label': 'Ausc. L', 'name': 'auscl' },
                { 'label': 'Ausc. H', 'name': 'ausch' },
                { 'label': 'Pulsus', 'name': 'pulse' },
                { 'label': 'Respirasi', 'name': 'respiration' },
                { 'label': 'Abdomnal Palpasi Pain', 'name': 'abdominal_palpasi_pain' },
                { 'label': 'Abdominal Palpasi Tension', 'name': 'abdominal_palpasi_tension' },
                { 'label': 'Limfonodule', 'name': 'limfonodule' },
                { 'label': 'Mukosa', 'name': 'mukosa' },
                { 'label': 'Mata', 'name': 'mata' },
                { 'label': 'Hidung', 'name': 'hidung' },
                { 'label': 'Mulut', 'name': 'mulut' },
                { 'label': 'Telinga', 'name': 'telinga' },
                { 'label': 'Kulit', 'name': 'kulit' },
                { 'label': 'Ekstremitas', 'name': 'ekstremitas' },
                { 'label': 'Sensasi Refleks', 'name': 'reflex' },
                { 'label': 'Lainnya', 'name': 'other' },
                { 'label': 'Tindakan', 'name': 'action' },
                { 'label': 'Lainnya Pemeriksaan', 'name': 'other_pemeriksaan' },
                { 'label': 'Lainnya Diagnosa', 'name': 'other_diagnosa' },
            ],
            'selected_check': false
        }
    }

    handleInputChangeProduct(e) {
        const value = e.target.value
        const name = e.target.name
        const id = e.target.id
        var new_check = this.state.new_check
        var aa = this


        if (name == 'field_name') {
            var checked = this.state.available_check.filter(c => c.label == value)
            if (checked.length != 0) {
                new_check.name = checked[0].name
                new_check.label = checked[0].label
                aa.setState({ new_check: new_check })
                var anamnese = document.getElementById("field_name_anamnese")
                var pemeriksaan = document.getElementById("field_name_pemeriksaan")
                var diagnosa = document.getElementById("field_name_diagnosa")
                if (id == 'field_name_anamnese') {
                    pemeriksaan.value = ''
                    diagnosa.value = ''
                }
                else if (id == 'field_name_pemeriksaan') {
                    anamnese.value = ''
                    diagnosa.value = ''
                }
                else if (id == 'field_name_diagnosa') {
                    anamnese.value = ''
                    pemeriksaan.value = ''
                }
            }
        } else if (name == 'field_value') {
            new_check.value = value
            this.setState({ new_check: new_check })
        }
    }

    handleInputBlur(e, list) {
        const value = e.target.value
        const name = e.target.name
        var new_check = this.state.new_check
        var selected = false

        if (name == "field_name") {
            list.forEach(function (item, index) {
                if (item.label == value) {
                    selected = true
                }
            })
        } else {
            list.forEach(function (item, index) {
                if (item == value) {
                    selected = true
                }
            })
        }

        if (!selected) {
            e.target.value = ''
            if (name == 'field_name') {
                new_check.name = ''
                this.setState({ new_check: new_check })
            }
        }
    }

    pressEnter(e) {
        var new_check = this.state.new_check

        if (e.key === 'Enter' || e.key == 'Tab') {
            e.preventDefault();
            if (new_check.name && new_check.name != '' && new_check.value != '' && new_check.value) {
                var field_value = document.getElementById("field_value")
                var anamnese = document.getElementById("field_name_anamnese")
                var pemeriksaan = document.getElementById("field_name_pemeriksaan")
                var diagnosa = document.getElementById("field_name_diagnosa")
                this.props.addCheck(this.state.new_check)
                field_value.value = ''
                anamnese.value = ''
                pemeriksaan.value = ''
                diagnosa.value = ''
                this.setState({ new_check: {} })
            }
        }
    }

    render() {
        // var boxShadow_style = {background: '#fff', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)'}
        var boxShadow_style = { background: '#fff', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', padding: '10px 24px', height: 'calc(100vh - 475px)', maxHeight: 'unset', minHeight: '180px', overflowY: 'auto' }
        var panel_style = { background: '#D2EEFF', padding: '10px 20px', color: '#056EAD', borderRadius: '5px' }
        var input_style = { color: '#056EAD', border: '1px solid #056EAD' }
        var fontColor = { color: '#6D7573' }
        var fontColor2 = { color: '#056EAD' }
        var cursor = { cursor: 'pointer' }
        var grooming = this.props.grooming
        var newCheckSelect, suhu, berat
        var marker = []
        var imgStyle = { width: '500px', height: '200px' }
        var enable_edit = false

        if (mode == 'Edit' && grooming.status == 'Draft' && this.props.write) {
            enable_edit = true
            var available_check_anamnese = []
            var available_check_pemeriksaan = []
            var available_check_diagnosa = []
            var anamnese_options = ['vaccine_history', 'food_history', 'bcs', 'vomit', 'auscl', 'ausch', 'temperature', 'weight', 'other']
            var pemeriksaan_options = ['pulse', 'respiration', 'abdominal_palpasi_pain', 'abdominal_palpasi_tension', 'limfonodule', 'mukosa', 'mata', 'hidung', 'mulut', 'telinga', 'kulit', 'ekstermitas', 'reflex', 'other_pemeriksaan']
            var diagnosa_options = ['diagnosa_utama', 'prognosa', 'diagnosa_banding', 'action', 'other_diagnosa']
            var check_name = this.props.checks.filter(c => c.delete == undefined).map(c => c.name)
            this.state.available_check.forEach(function (item, index) {
                if (!check_name.includes(item.name) && anamnese_options.includes(item.name)) {
                    available_check_anamnese.push(
                        <option value={item.label} key={index.toString()} />
                    )
                }
                else if (!check_name.includes(item.name) && pemeriksaan_options.includes(item.name)) {
                    available_check_pemeriksaan.push(
                        <option value={item.label} key={index.toString()} />
                    )
                }
                else if (!check_name.includes(item.name) && diagnosa_options.includes(item.name)) {
                    available_check_diagnosa.push(
                        <option value={item.label} key={index.toString()} />
                    )
                }
            })

            newCheckSelect = (
                <div className="row mb-3">
                    <div className="col-4 my-1">
                        <input autoComplete="off" name='field_name' list="anamnese_options" id="field_name_anamnese" className="form-control fs14 fw600" style={input_style} onChange={e => this.handleInputChangeProduct(e)} placeholder="Anamnese" onBlur={e => this.handleInputBlur(e, this.state.available_check.filter(i => anamnese_options.includes(i.name)))} />
                        <datalist id="anamnese_options">
                            {available_check_anamnese}
                        </datalist>
                    </div>
                    <div className="col-4 my-1">
                        <input autoComplete="off" name='field_name' list="pemeriksaan_options" id="field_name_pemeriksaan" className="form-control fs14 fw600" style={input_style} onChange={e => this.handleInputChangeProduct(e)} placeholder="Pemeriksaan" onBlur={e => this.handleInputBlur(e, this.state.available_check.filter(i => pemeriksaan_options.includes(i.name)))} />
                        <datalist id="pemeriksaan_options">
                            {available_check_pemeriksaan}
                        </datalist>
                    </div>
                    <div className="col-4 my-1">
                        <input autoComplete="off" name='field_name' list="diagnosa_options" id="field_name_diagnosa" className="form-control fs14 fw600" style={input_style} onChange={e => this.handleInputChangeProduct(e)} placeholder="Diagnosa" onBlur={e => this.handleInputBlur(e, this.state.available_check.filter(i => diagnosa_options.includes(i.name)))} />
                        <datalist id="diagnosa_options">
                            {available_check_diagnosa}
                        </datalist>
                    </div>
                    <div className="col-12 my-1">
                        <input style={input_style} type="text" className="form-control input-sm fs14 fw600" name="field_value" id="field_value" placeholder="Keterangan" onChange={e => this.handleInputChangeProduct(e)} onKeyDown={e => this.pressEnter(e)} />
                    </div>
                </div>
            )

            suhu = (
                <div className="col pr-0">
                    <div className="row">
                        <div className="col-4">
                            <label htmlFor="temperature" className="fw600 my-2" style={fontColor}>Suhu (C)</label>
                        </div>
                        <div className="col-6 pl-auto">
                            <input id="temperature" name="temperature" className="form-control border-0" placeholder="0" onChange={this.props.handleInputChange} required style={fontColor} value={grooming.temperature || ''} />
                        </div>
                    </div>
                </div>
            )
            berat = (
                <div className="col">
                    <div className="row">
                        <div className="col-4">
                            <label htmlFor="weight" className="fw600 my-2" style={fontColor}>Berat (kg)</label>
                        </div>
                        <div className="col-6 pl-auto">
                            <input id="weight" name="weight" className="form-control border-0" placeholder="0" onChange={this.props.handleInputChange} required style={fontColor} value={grooming.weight || ''} />
                        </div>
                    </div>
                </div>
            )
        }

        else if (['Checked', 'Done', 'Cancel'].includes(grooming.status) || !this.props.write) {
            suhu = (
                <div className="col-4 text-center">
                    <div className="row">
                        <div className="col-4">
                            <label htmlFor="temperature" className="fwbold my-2" style={fontColor2}>Suhu</label>
                        </div>
                        <div className="col-6 pl-auto">
                            <p style={fontColor2} className="mb-0 fw600 my-2">{grooming.temperature}</p>
                        </div>
                    </div>
                </div>
            )
            berat = (
                <div className="col-4 text-center">
                    <div className="row">
                        <div className="col-4">
                            <label htmlFor="weight" className="fwbold my-2" style={fontColor2}>Berat</label>
                        </div>
                        <div className="col-6 pl-auto">
                            <p style={fontColor2} className="mb-0 fw600 my-2">{grooming.weight}</p>
                        </div>
                    </div>
                </div>
            )
        }

        var checks_list = []
        this.props.checks.forEach((c, index) => {
            if (c.delete == undefined) {
                checks_list.push(<PengecekanList check={c} key={index.toString()} status={grooming.status} deleteCheck={() => this.props.deleteCheck(index.toString())} />)
            }
        })

        var layout_class = "col-12"

        return <div>
            <p className="mb-2 text-dark fs18 fw600">Pemeriksaan</p>
            <div className="p-4 mb-3" style={boxShadow_style}>
                <div className="row justify-content-around mb-3 mx-n1" style={panel_style}>
                    {suhu}
                    {berat}
                </div>
                <div className="row">
                    <div className={layout_class}>
                        {newCheckSelect}
                        {checks_list}
                    </div>
                    <div className={layout_class}>
                        <Attachments attachments={grooming.attachments} enable_edit={enable_edit} deleteAction={this.props.deleteAttachment} addAction={this.props.addAttachment} addMarker={this.props.addMarker} resetMarker={this.props.resetMarker} marker={grooming.marker} />
                    </div>
                </div>
            </div>
        </div>
    }
}

class PengecekanList extends React.Component {
    render() {
        var panel_style = { background: '#D2EEFF', padding: '10px 20px', color: '#056EAD', borderRadius: '5px' }
        var check = this.props.check
        var status = this.props.status
        var cursor = { cursor: 'pointer' }
        var deleteButton

        if (mode == 'Edit' && status == 'Draft') {
            deleteButton = <i className="fa fa-2x fa-trash my-auto" onClick={this.props.deleteCheck} style={cursor} />
        }
        return <div id={check.name} className="form-row mb-3 fs12 fw600 grooming_products" style={panel_style}>
            <div className="col-3">
                <span className="fs14">{check.label || check.name}</span>
            </div>
            <div className="col text-right">
                <span className="fs14">{check.value}</span>
            </div>
            <div className="col-auto text-center d-flex">
                {deleteButton}
            </div>
        </div>
    }
}

class KunjunganBerikutnya extends React.Component {
    render() {
        var boxShadow_style = { background: '#fff', borderRadius: 10, maxWidth: 480, boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)' }
        var cursor = { cursor: 'pointer' }
        var grooming = this.props.grooming
        var newActionRow
        var groomingActions = []
        var js = this

        if (mode == 'Edit' && ['Draft'].includes(grooming.status) && this.props.write) {
            newActionRow = (
                <div>
                    <div id="new_action" className="mx-0 mb-3 fs12 fw600 grooming_actions">
                        <div className="row mb-1">
                            <div className="col-6">
                                <label htmlFor="new_date" className="fw600">Tanggal</label>
                            </div>
                            <div className="col-6">
                                <input type="date" id="new_date" name='date' className="form-control fs14" onChange={grooming.actions.length == 0 ? this.props.handleInputChangeNewAction : e => this.props.handleInputChangeActions(e, 0)} defaultValue={grooming.actions.length != 0 ? grooming.actions[0]['date'] : ''} />
                            </div>
                        </div>
                        <div className="row mb-1">
                            <div className="col-6">
                                <label htmlFor="new_note" className="fw600">Catatan</label>
                            </div>
                            <div className="col-6">
                                <input name='note' id="new_note" className="form-control fs14 lightbg" placeholder="Masukkan bila ada" onChange={grooming.actions.length == 0 ? this.props.handleInputChangeNewAction : e => this.props.handleInputChangeActions(e, 0)} defaultValue={grooming.actions.length != 0 ? grooming.actions[0]['note'] : ''} />
                            </div>
                        </div>
                    </div>
                </div>

            )
        } else if ((mode == 'Detail' || grooming.status == 'Checked') && grooming.actions.length == 0 || !this.props.write) {
            groomingActions.push(
                <div className="col-auto d-flex" key='0'>
                    <span className="fs16 fw500 mx-auto">Tidak Ada Layanan Berjadwal</span>
                </div>)

            newActionRow = groomingActions
        } else {
            grooming.actions.forEach(function (item, index) {
                groomingActions.push(<GroomingActions write={js.props.write} action={item} status={grooming.status} handleInputChangeActions={e => js.props.handleInputChangeActions(e, index.toString())} key={index.toString()} />)
            })
            newActionRow = groomingActions
        }

        return <div className="menu-popup">
            <div className="container p-3" style={boxShadow_style}>
                <p className="fs18 fw600 text-dark">
                    Kunjungan Berikutnya
                    <i className="fa fa-times-circle text-danger fs20 float-right" style={cursor} onClick={this.props.toggleShowActions} />
                </p>
                <div className="p-2 mb-3">
                    <div>
                        <div id="action_list">
                            {newActionRow}
                        </div>
                    </div>
                </div>
            </div>
            <div className="menu-popup-close" onClick={this.props.toggleShowActions} />
        </div>
    }
}

class GroomingActions extends React.Component {
    render() {
        var action = this.props.action
        var status = this.props.status
        var actionDate, actionNote

        if (mode == 'Detail' || status == 'Done' || status == 'Checked' || !this.props.write) {
            actionDate = <p>{moment(action.date).format("DD-MM-YYYY hh:mm:ss")}</p>
            actionNote = <p className="mb-0">{action.note}</p>
        } else if (mode == 'Edit' && status == 'Draft' && this.props.write) {
            actionDate = <input required id="date" name='date' className="form-control border-0 datetimepicker datetimepicker-input fs14" data-toggle="datetimepicker" data-target="#date" defaultValue={action.date} onChange={this.props.handleInputChangeActions} /> //TODO tanggal belum bisa
            actionNote = <input required name='note' className="form-control fs14 border-0" defaultValue={action.note} onChange={this.props.handleInputChangeActions} />
        }

        return <div id={action.name} className="mb-3 fs14 grooming_actions">
            <div className="row">
                <div className="col-6">
                    <label htmlFor="date" className="fw600">Tanggal</label>
                </div>
                <div className="col-6">
                    {actionDate}
                </div>
            </div>
            <div className="row">
                <div className="col-6">
                    <label htmlFor="note" className="fw600">Catatan</label>
                </div>
                <div className="col-6">
                    {actionNote}
                </div>
            </div>
        </div>
    }
}

class Attachments extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            'show_list': false,
            'show_marker': false,
            'new_file': {}
        }
        this.addMarker = this.addMarker.bind(this)
        this.resetMarker = this.resetMarker.bind(this)
    }

    toggleShowList() {
        this.setState({ show_list: !this.state.show_list })
    }

    toggleShowMarker(marker) {
        if (['canine', 'feline'].includes(marker)) {
            this.setState({ show_marker: marker })
        }
        else {
            this.setState({ show_marker: false })
        }

    }

    clickFile() {
        if (this.$file != undefined) {
            var file = this.$file
            $(file).trigger('click');
        }
    }

    changeNewFile(e) {
        var target = e.target
        var name = target.name
        var value = target.value
        var new_file = Object.assign({}, this.state.new_file)
        if (name == 'attachment') {
            var img = event.target.files[0];
            new_file[name] = img
            this.setState({ new_file: new_file })
        }
        else {
            new_file[name] = value
            this.setState({ new_file: new_file })
        }
    }

    addAttachments() {
        if (this.state.new_file.attachment != undefined && ![undefined, ''].includes(this.state.new_file.title)) {
            this.props.addAction(this.state.new_file)
            this.setState({ show_list: false, new_file: {} })
        }
    }

    cancelAttachments() {
        this.setState({ show_list: false, new_file: {} })
    }

    addMarker(marker) {
        this.props.addMarker(marker)
        this.setState({ show_marker: false })
    }

    resetMarker() {
        this.props.resetMarker()
        this.setState({ show_marker: false })
    }

    render() {
        var panel_style = { background: '#D2EEFF', padding: '10px 18px', color: '#056EAD', borderRadius: '5px' }
        var buttonStyle = { background: '#076FAD', color: '#FFF' }
        var cursor = { cursor: 'pointer' }
        var attachment_buttons = []
        var att = this
        if (this.props.attachments.length != 0) {
            this.props.attachments.forEach((d, i) => {
                if (!d.deleted) {
                    attachment_buttons.push(<AttachmentsButton key={i.toString()} data={d} enable_edit={att.props.enable_edit} deleteAction={() => att.props.deleteAction(i.toString())} />)
                }
            })
        }

        var new_attachment_form, add_button, file_button
        if (this.state.new_file.attachment != undefined) {
            file_button = <button type="button" title="Tambah" className="btn btn-success fs12 fw600 rounded-lg px-3" onClick={() => this.addAttachments()}><i className="fa fa-check" /></button>
        }
        else {
            file_button = <button type="button" title="Pilih File" className="btn fs12 fw600 rounded-lg px-3" style={buttonStyle} onClick={() => this.clickFile()}><i className="fa fa-file" /></button>
        }

        if (this.props.enable_edit) {
            if (this.state.show_list) {
                new_attachment_form = (
                    <div className="col-12 py-3 rounded-lg bg-white mb-3">
                        <div className="form-row">
                            <div className="col">
                                <input type="text" name="title" id="title" className="form-control fs12" placeholder="Masukkan Judul" value={this.state.new_file.title || ''} onChange={e => this.changeNewFile(e)} />
                            </div>
                            <div className="col-auto">
                                <input type="file" className="d-none" name="attachment" ref={(ref) => this.$file = ref} onChange={e => this.changeNewFile(e)} />
                                {file_button}
                            </div>
                            <div className="col-auto">
                                <button type="button" title="Batal" className="btn btn-outline-danger fs12 fw600 rounded-lg px-3" onClick={() => this.cancelAttachments()}><i className="fa fa-times" /></button>
                            </div>
                        </div>
                    </div>
                )
            }
            else {
                if (this.props.marker == undefined) {
                    add_button = (
                        <div className="col-auto d-flex">
                            <button type="button" className="btn fs12 fw600 rounded-lg px-3 mx-1" style={buttonStyle} onClick={() => this.toggleShowMarker('feline')}><img src="/static/img/main/menu/cat-icon.png" /></button>
                            <button type="button" className="btn fs12 fw600 rounded-lg px-3 mx-1" style={buttonStyle} onClick={() => this.toggleShowMarker('canine')}><img src="/static/img/main/menu/dog-icon.png" /></button>
                            <button type="button" className="btn fs12 fw600 rounded-lg px-3 mx-1" style={buttonStyle} onClick={() => this.toggleShowList()}><i className="fa fa-plus mr-2" />Attachment</button>
                        </div>
                    )
                }
                else {
                    add_button = (
                        <div className="col-auto">
                            <button type="button" className="btn fs12 fw600 rounded-lg px-3 mx-1" style={buttonStyle} onClick={() => this.toggleShowList()}><i className="fa fa-plus mr-2" />Attachment</button>
                        </div>
                    )
                }
            }
        }

        var marker_panel
        if (this.props.marker != undefined) {
            var marker_delete_button
            if (this.props.enable_edit) {
                marker_delete_button = (
                    <div className="col-auto ml-auto mb-2"><i className="fa fa-2x fa-trash" style={cursor} onClick={e => { e.stopPropagation(); this.resetMarker() }} /></div>
                )
            }
            marker_panel = (
                <div className="form-row mb-3" style={panel_style} onClick={() => this.toggleShowMarker(this.props.marker.type)}>
                    {marker_delete_button}
                    <MarkerField readOnly={true} marker={this.props.marker} />
                </div>
            )
        }

        var attachment_panel
        if (attachment_buttons.length != 0) {
            attachment_panel = (
                <div className="form-row mb-3" style={panel_style}>{attachment_buttons}</div>
            )
        }

        var marker_add
        if (this.state.show_marker) {
            var container_style = { borderRadius: '10px' }
            marker_add = (
                <div className='menu-popup' onClick={() => this.toggleShowMarker(false)}>
                    <div className="container" style={container_style} onClick={event => event.stopPropagation()}>
                        <section className="px-5 py-4 bg-white rounded-lg">
                            <MarkerField readOnly={!this.props.enable_edit} marker={this.props.marker} type={this.state.show_marker} submitAction={this.addMarker} resetAction={this.resetMarker} />
                        </section>
                    </div>
                    <div className="menu-popup-close" />
                </div>
            )
        }

        return (
            <div>
                {attachment_panel}
                {marker_panel}
                <div className="row justify-content-end my-3">
                    {new_attachment_form}
                    {add_button}
                </div>
                {marker_add}
            </div>
        )
    }
}

class AttachmentsButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            'show_validation': false,
        }
    }

    toggleShowValidation() {
        this.setState({ 'show_validation': !this.state.show_validation })
    }

    render() {
        var d = this.props.data
        var buttonStyle = { background: '#076FAD', color: '#FFF' }
        var delete_icon, validation

        if (this.props.enable_edit) {
            delete_icon = (<i className="fa fa-trash ml-4" onClick={e => { e.stopPropagation(); this.toggleShowValidation() }} />)
        }

        if (this.state.show_validation) {
            var container_style = { borderRadius: '10px', maxWidth: '508px' }
            validation = (
                <div className='menu-popup' onClick={() => this.toggleShowValidation()}>
                    <div className="container" style={container_style} onClick={event => event.stopPropagation()}>
                        <section className="px-5 py-4 bg-white rounded-lg">
                            <p className="fs24 text-center mb-4">{'Apakah anda yakin akan menghapus ' + d.title + ' ?'}</p>
                            <div className="row justify-content-center">
                                <button className="btn py-1 px-2 px-lg-3 mr-5" style={buttonStyle} onClick={this.props.deleteAction}><p className="fs18 fs18md mb-0">Ya</p></button>
                                <button className="btn btn-danger py-1 px-2 px-lg-3" onClick={() => this.toggleShowValidation()}><p className="fs18 fs18md mb-0">Tidak</p></button>
                            </div>
                        </section>
                    </div>
                    <div className="menu-popup-close" />
                </div>
            )
        }

        return (
            <div className="col-auto my-1">
                {validation}
                <a title={d.title} className="btn fs12 fw600 rounded-lg px-3" style={buttonStyle} onClick={() => { window.open(d.attachment, '_blank') }}>{d.title}{delete_icon}</a>
            </div>
        )
    }
}

class MarkerField extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            'marker': {
                'type': 'canine',
                'markers': []
            },
        }
    }

    componentDidMount() {
        if (this.props.marker != undefined) {
            var marker = Object.assign({}, this.props.marker)
            this.setState({ marker: marker })
        }
        else if (this.props.marker == undefined && ['canine', 'feline'].includes(this.props.type)) {
            var marker = Object.assign({}, this.state.marker)
            marker.type = this.props.type
            this.setState({ marker: marker })
        }
    }

    submitMarker() {
        this.props.submitAction(this.state.marker);
    }

    resetMarker() {
        this.props.resetAction();
    }

    clickArea(e) {
        if (!this.props.readOnly) {
            var marker = Object.assign({}, this.state.marker)
            var rect = e.target.getBoundingClientRect();
            var x = e.clientX - rect.left - 7;
            var x_percent = (x * 100) / rect.width;
            var y = e.clientY - rect.top - 7;
            var y_percent = (y * 100) / rect.height;
            var new_marker = { x: x_percent + '%', y: y_percent + '%' }

            marker.markers.push(new_marker)
            this.setState({ marker: marker })
        }
    }

    render() {
        var boxShadow_style = { background: '#fff', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)' }

        var markers = this.state.marker.markers
        var marker_list = []
        if (markers != undefined && markers.length != 0) {
            markers.forEach((marker, index) => marker_list.push(<Marker x={marker.x} y={marker.y} description={marker.description} key={index.toString()} />))
        }

        var marker_field_class
        if (this.props.type == 'feline' || this.state.marker.type == 'feline') {
            marker_field_class = 'marker-field-cat'
        }
        else {
            marker_field_class = 'marker-field-dog'
        }

        var action_button
        if (!this.props.readOnly) {
            action_button = (
                <div className="row">
                    <div className="col-auto ml-auto">
                        <button type="button" className="btn btn-success fs12 fw600 rounded-lg px-3 mx-1" onClick={() => this.submitMarker()}>Submit</button>
                        <button type="button" className="btn btn-danger fs12 fw600 rounded-lg px-3 mx-1" onClick={() => this.resetMarker()}>Reset</button>
                    </div>
                </div>
            )
        }

        return (
            <div className="w-100">
                {action_button}
                <div className={'marker-field ' + marker_field_class} onClick={e => this.clickArea(e)}>
                    {marker_list}
                </div>
            </div>
        )
    }
}

class Marker extends React.Component {
    render() {
        var markerStyle = {
            position: 'absolute',
            top: this.props.y,
            left: this.props.x,
        }

        return (
            <i className="fa fa-lg fa-times text-danger" style={markerStyle} title={this.props.description} />
        )
    }
}

class GroomingVersion extends React.Component {
    render() {
        var row_version = []
        var heightStyle = { 'height': '50px' }

        this.props.version.forEach(function (item, index) {
            if (item.data.changed != undefined && item.data['changed'].length != 0) {
                var owner = <span className="fw700">{item.owner}</span>
                var extra = <span> changed value of</span>
                var desc = ''
                item.data['changed'].forEach(function (item, index) {
                    desc = desc.concat(" " + item[0] + " from " + (item[1] || 'empty') + " to " + item[2] + ",")
                })
                var changed = <span className="fw700">{desc}</span>
                var date = <span>{' - ' + moment(item.creation).format("dddd, MMMM Do YYYY, h:mm:ss a")}</span>
                // var date = <span>{' - ' + moment(item.creation).format("DD-MM-YYYY HH:mm:ss")}</span>
                // var date = <span>{' - ' + moment_date(item.creation).fromNow()}</span>
                row_version.push(
                    <div className="row mx-0" key={index.toString()}>
                        <div className="col-auto px-0">
                            <div className="side-marker" />
                        </div>
                        <div className="col pt-2" style={heightStyle}>
                            {owner}{extra}{changed}{date}
                        </div>
                    </div>
                )
            }
        })

        return <div className="mt-2">
            {row_version}
        </div>
    }
}

ReactDOM.render(<Grooming />, document.getElementById("grooming_form"));