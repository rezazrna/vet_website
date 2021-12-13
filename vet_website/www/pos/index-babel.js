var main = document.getElementById("main_pos")
var user = main.dataset.user
var pos_session_id = main.dataset.pos_session_id
// var tzOffset = new Date().getTimezoneOffset()
var tzOffset = 0

console.log(pos_session_id)

function countItemTotalPrice(item){
    var total = item.quantity*item.price
    return total - (total*item.discount/100)
}

function countItemsTotalPrice(items, with_discount=true){
    if(with_discount){
        return items.reduce((total,item) => total = total + countItemTotalPrice(item), 0)
    } else {
        return items.reduce((total,item) => total = total + (item.quantity*item.price), 0)
    }
    
}

class MainPOS extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            data: {
                currentOrders: false,
                allProduct: [],
                allCustomer: [],
                allPaymentMethod: [],
            },
            search: "",
            selectedOrder: false,
            loaded: false,
            loadedProducts: false,
            selectCustomer: false,
            historyTransaction: false,
            online: true,
            currentpage: 1,
            datalength: 0,
        }
        
        this.enterSearch = this.enterSearch.bind(this)
        this.changeSearch = this.changeSearch.bind(this)
        this.addProductToCurrentOrder = this.addProductToCurrentOrder.bind(this)
        this.addSessionOrder = this.addSessionOrder.bind(this)
        this.setSelectedOrder = this.setSelectedOrder.bind(this)
        this.deleteSessionOrder = this.deleteSessionOrder.bind(this)
        this.togglePayment = this.togglePayment.bind(this)
        this.setCustomer = this.setCustomer.bind(this)
        this.addPayment = this.addPayment.bind(this)
        this.setSelectedItem = this.setSelectedItem.bind(this)
        this.addPaymentValue = this.addPaymentValue.bind(this)
        this.validatePayment = this.validatePayment.bind(this)
        this.toggleEditItem = this.toggleEditItem.bind(this)
        this.addNewCustomer = this.addNewCustomer.bind(this)
        this.setSelectedPayment = this.setSelectedPayment.bind(this)
        this.deletePayment = this.deletePayment.bind(this)
        this.paginationClick = this.paginationClick.bind(this);
    }
    
    componentDidMount(){
        var th = this
        
        frappe.call({
            type: "GET",
            method: "vet_website.methods.get_pos_data",
            args: {name: pos_session_id},
            callback: function(r){
                if (r.message){
                    console.log(r.message)
                    th.getSession();
                    var new_data = Object.assign({}, th.state.data)
                    new_data.session = r.message.session
                    new_data.orders = r.message.orders.order
                    new_data.allProduct = r.message.allProduct.product,
                    new_data.allCustomer = r.message.allCustomer
                    new_data.allPaymentMethod = r.message.allPaymentMethod
                    th.setState({data: new_data, datalength: r.message.allProduct.datalength})
                }
            }
        })
        
        setInterval(() => {
            var url = "/api/method/vet_website.methods.ping"
            fetch(url, {
                method: "GET",
            }).then(async(response) => {
                if (!response.ok && this.state.online) {
                    this.setState({online: false})
                } else if (response.ok && !this.state.online) {
                    this.setState({online: true})
                }
            }).catch(e => this.setState({online: false}))
        }, 500)
        
        document.addEventListener('keydown', e => this.keyDown(e));
    }

    paginationClick(number) {
        var po = this

        this.setState({
          currentpage: Number(number),
          loadedProducts: false,
        });

        // if (number * 30 > this.state.data.length) {
            frappe.call({
                type: "GET",
                method:"vet_website.vet_website.doctype.vetproduct.vetproduct.get_product_list",
                args: {filters: {currentpage: this.state.currentpage, search: this.state.search}},
                callback: function(r){
                    if (r.message) {
                        var new_data = Object.assign({}, po.state.data)
                        new_data.allProduct = r.message.product 
                        po.setState({'data': new_data, 'loadedProducts': true, 'datalength': r.message.datalength});
                    }
                }
            });
        // }
    }
    
    keyDown(e){
        var new_data = Object.assign({}, this.state.data)
        var payment = new_data.currentOrders[this.state.selectedOrder].payment
        var edit_item = new_data.currentOrders[this.state.selectedOrder].edit_item
        if(payment && document.activeElement.id != 'product_search'){
            if(e.key.match(/\d/) != null){
                this.addPaymentValue(parseInt(e.key), "append")
            } else if(e.key == "Backspace"){
                this.addPaymentValue(0, "delete")
            }
        } else if (["quantity","discount"].includes(edit_item) && !this.state.selectCustomer && !this.state.historyTransaction && document.activeElement.id != 'product_search'){
            var selectedItem = new_data.currentOrders[this.state.selectedOrder].items[new_data.currentOrders[this.state.selectedOrder].selectedItem]
            if(edit_item == "quantity" && selectedItem){
                if(e.key.match(/\d/) != null){
                    console.log(selectedItem)
                    if (selectedItem.qty_edited){
                        selectedItem.quantity = parseInt(selectedItem.quantity.toString().concat(e.key))
                    } else {
                        e.key == '0'?this.deleteProductFromCurrentOrder(new_data.currentOrders[this.state.selectedOrder].selectedItem):false
                        selectedItem.quantity = parseInt(e.key)
                        selectedItem.qty_edited = true
                    }
                    
                } else if(e.key == "Backspace"){
                    var valueString = selectedItem.quantity.toString()
                    valueString.length>1?valueString = valueString.slice(0,-1):this.deleteProductFromCurrentOrder(new_data.currentOrders[this.state.selectedOrder].selectedItem)
                    selectedItem.quantity = parseInt(valueString)
                }
            } else if(edit_item == "discount" && selectedItem){
                if(e.key.match(/\d/) != null){
                    selectedItem.discount = parseInt(selectedItem.discount.toString().concat(e.key))
                    selectedItem.discount > 100?selectedItem.discount = 100:false
                    console.log(selectedItem.discount)
                } else if(e.key == "Backspace"){
                    var valueString = selectedItem.discount.toString()
                    valueString.length>1?valueString = valueString.slice(0,-1):valueString = "0"
                    console.log(valueString)
                    selectedItem.discount = parseInt(valueString)
                }
            }
            this.setState({data: new_data})
            this.saveSession(new_data.currentOrders)
        }
    }
    
    toggleEditItem(mode){
        var new_data = Object.assign({}, this.state.data)
        new_data.currentOrders[this.state.selectedOrder].edit_item == mode?new_data.currentOrders[this.state.selectedOrder].edit_item = false:new_data.currentOrders[this.state.selectedOrder].edit_item = mode
        this.setState({data: new_data})
    }
    
    getSession(){
        var th = this
        var session = sessionStorage.getItem('naturevetPOSSession'.concat(pos_session_id))
        if (session) {
            var new_data = Object.assign({}, this.state.data)
            new_data.currentOrders = JSON.parse(session)
            this.setState({data: new_data, selectedOrder: 0, loaded: true, loadedProducts: true})
        } else {
            frappe.call({
                type: "GET",
                method: "vet_website.methods.get_current_datetime",
                args: {},
                callback: function(r){
                    var new_data = Object.assign({}, th.state.data)
                    new_data.currentOrders = [{items: [], order_date: r.message, selectedItem: 0}]
                    th.setState({data: new_data, selectedOrder: 0, loaded: true, loadedProducts: true})
                    th.saveSession(new_data.currentOrders)
                }
            })
        }
    }
    
    setSelectedOrder(index){
        this.setState({selectedOrder: index});
    }
    
    togglePayment(index){
        var new_data = Object.assign({}, this.state.data)
        if(this.state.online){
            new_data.currentOrders[this.state.selectedOrder].payment?new_data.currentOrders[this.state.selectedOrder].payment=false:new_data.currentOrders[this.state.selectedOrder].payment=true
        }
        this.setState({data: new_data})
        // this.saveSession(new_data.currentOrders)
    }
    
    toggleSelectCustomer(){
        this.setState({selectCustomer: !this.state.selectCustomer})
    }
    
    toggleHistoryTransaction(){
        this.setState({historyTransaction: !this.state.historyTransaction})
    }
    
    saveSession(currentOrders){
        var value
        if(currentOrders){
            value = JSON.stringify(currentOrders)
            value = JSON.parse(value)
            value.forEach(v => v.payment = false)
            value = JSON.stringify(value)
        } else {
            value = JSON.stringify(this.state.data.currentOrders)
        }
        sessionStorage.setItem('naturevetPOSSession'.concat(pos_session_id), value)
    }
    
    closeInterface(){
        this.saveSession()
        window.location.href = "/main/kasir/pos-sessions"
    }
    
    addSessionOrder(){
        var th = this
        frappe.call({
            type: "GET",
            method: "vet_website.methods.get_current_datetime",
            args: {},
            callback: function(r){
                var new_data = Object.assign({}, th.state.data)
                new_data.currentOrders.push({items: [], order_date: r.message, selectedItem: 0})
                th.setState({data: new_data, selectedOrder: (new_data.currentOrders.length-1)})
                th.saveSession(new_data.currentOrders)
            }
        })
    }
    
    deleteSessionOrder(index){
        var th = this
        var new_data = Object.assign({}, this.state.data)
        var selectedOrder = this.state.selectedOrder
        new_data.currentOrders.splice(index, 1)
        if(new_data.currentOrders.length == 0){
            frappe.call({
                type: "GET",
                method: "vet_website.methods.get_current_datetime",
                args: {},
                callback: function(r){
                    new_data.currentOrders.push({items: [], order_date: r.message, selectedItem: 0})
                    th.setState({data: new_data, selectedOrder: (new_data.currentOrders.length-1)})
                    th.saveSession(new_data.currentOrders)
                }
            })
        } else {
            if(selectedOrder > new_data.currentOrders.length-1){
                selectedOrder = new_data.currentOrders.length-1
            }
            this.setState({data: new_data, selectedOrder: selectedOrder})
            this.saveSession(new_data.currentOrders)
        }
    }
    
    changeSearch(e){
        var search = e.target.value
        this.setState({search: search})
    }
    
    enterSearch(e){
        var search = e.target.value
        if(e.key == 'Enter' && search != ''){
            if(this.state.data.allProduct != undefined){
                this.paginationClick(1)
                // var allProduct = this.state.data.allProduct.slice()
                // allProduct = allProduct.filter(p => p.product_name.toLowerCase().includes(search.toLowerCase()) || p.default_code.toLowerCase().includes(search.toLowerCase()) || ![null,false,undefined].includes(p.barcode)?p.default_code.toLowerCase().includes(search.toLowerCase()):false)
                // this.addProductToCurrentOrder(allProduct[0])
                // this.setState({search: ''})
            }
        }
    }
    
    addProductToCurrentOrder(product){
        console.log(product)
        var new_data = Object.assign({}, this.state.data)
        var new_product = product
        
        product.discount = 0
        product.qty_edited = false
        var sameproduct = new_data.currentOrders[this.state.selectedOrder].items.find(p => p.name == new_product.name)
        if(sameproduct){
            sameproduct.quantity += 1
            sameproduct.qty_edited = false
            new_data.currentOrders[this.state.selectedOrder].selectedItem = new_data.currentOrders[this.state.selectedOrder].items.findIndex(a => a==sameproduct)
        } else {
            new_product.quantity = 1
            new_data.currentOrders[this.state.selectedOrder].items.push(new_product)
            new_data.currentOrders[this.state.selectedOrder].selectedItem = new_data.currentOrders[this.state.selectedOrder].items.length-1
        }
        new_data.currentOrders[this.state.selectedOrder].edit_item = 'quantity'
        
        this.setState({data: new_data})
        this.saveSession(new_data.currentOrders)
    }
    
    deleteProductFromCurrentOrder(index){
        var th = this
        var new_data = Object.assign({}, this.state.data)
        var selectedOrder = this.state.selectedOrder
        
        new_data.currentOrders[selectedOrder].items.splice(index, 1)
        if(new_data.currentOrders[selectedOrder].selectedItem > new_data.currentOrders[selectedOrder].items.length-1){
            new_data.currentOrders[selectedOrder].selectedItem = new_data.currentOrders[selectedOrder].items.length-1
            new_data.currentOrders[selectedOrder].selectedItem<0?new_data.currentOrders[selectedOrder].selectedItem=0:false
        }
        this.setState({data: new_data})
        this.saveSession(new_data.currentOrders)
    }
    
    setCustomer(customer){
        var new_data = Object.assign({}, this.state.data)
        new_data.currentOrders[this.state.selectedOrder].customer = customer
        this.setState({data: new_data, selectCustomer: false})
        this.saveSession(new_data.currentOrders)
    }
    
    addPayment(payment, value=0, method_type){
        var new_data = Object.assign({}, this.state.data)
        var order_total = countItemsTotalPrice(new_data.currentOrders[this.state.selectedOrder].items)
        
        payment!='Cash'?value=order_total:false
        
        if(new_data.currentOrders[this.state.selectedOrder].payments == undefined){
            var cashPayment = this.state.data.allPaymentMethod.find(p => p.name == payment)
            new_data.currentOrders[this.state.selectedOrder].payments = [{
                type: payment,
                value: 0,
                method_name: cashPayment.method_name,
                method_type: method_type,
            }]
        } else {
            var samePayment = new_data.currentOrders[this.state.selectedOrder].payments.find(p => p.type == payment)
            if (samePayment == null){
                var cashPayment = this.state.data.allPaymentMethod.find(p => p.name == payment)
                new_data.currentOrders[this.state.selectedOrder].payments.push({
                    type: payment,
                    value: 0,
                    method_name: cashPayment.method_name,
                    method_type: method_type
                })
            }
        }
        new_data.currentOrders[this.state.selectedOrder].selectedPayment = new_data.currentOrders[this.state.selectedOrder].payments.length-1
        
        if (payment != 'Cash' && new_data.currentOrders[this.state.selectedOrder].payments.find(p => p.type == 'Cash') == null){
            var cashPayment = this.state.data.allPaymentMethod.find(p => p.name == 'Cash')
            new_data.currentOrders[this.state.selectedOrder].payments.push({
                type: cashPayment.name,
                value: 0,
                method_name: cashPayment.method_name,
                method_type: cashPayment.method_type
            })
        }
        
        this.setState({data: new_data})
        this.saveSession(new_data.currentOrders)
    }
    
    setSelectedPayment(index){
        var new_data = Object.assign({}, this.state.data)
        new_data.currentOrders[this.state.selectedOrder].selectedPayment = index
        
        this.setState({data: new_data});
    }
    
    deletePayment(index){
        var new_data = Object.assign({}, this.state.data)
        var noncashPayment = new_data.currentOrders[this.state.selectedOrder].payments.find(p => p.type != 'Cash')
        var deletedPayment = new_data.currentOrders[this.state.selectedOrder].payments[index]
        
        if(deletedPayment.type == 'Cash' && noncashPayment != null){
            return false
        }
        
        new_data.currentOrders[this.state.selectedOrder].payments.splice(index, 1)
        if(new_data.currentOrders[this.state.selectedOrder].selectedPayment > new_data.currentOrders[this.state.selectedOrder].payments.length-1){
            new_data.currentOrders[this.state.selectedOrder].selectedPayment = new_data.currentOrders[this.state.selectedOrder].payments.length-1
        }
        
        this.setState({data: new_data});
        this.saveSession(new_data.currentOrders)
    }
    
    addPaymentValue(value=0, mode="add"){
        var new_data = Object.assign({}, this.state.data)
        var payments = new_data.currentOrders[this.state.selectedOrder].payments
        var selectedPayment = new_data.currentOrders[this.state.selectedOrder].selectedPayment
        
        console.log(payments)
        console.log(selectedPayment)
        
        var cashPayment = this.state.data.allPaymentMethod.find(p => p.name == 'Cash')
        
        if(payments == undefined || payments.length == 0){
            this.addPayment(cashPayment.name, 0, cashPayment.method_type)
            payments = new_data.currentOrders[this.state.selectedOrder].payments
            selectedPayment = new_data.currentOrders[this.state.selectedOrder].selectedPayment
        }
        
        console.log(payments)
        console.log(selectedPayment)
        
        if(mode == "add"){
            payments[selectedPayment].value += value
        } else if(mode == "append"){
            var valueString = payments[selectedPayment].value.toString().concat(value.toString())
            payments[selectedPayment].value = parseInt(valueString)
        } else if(mode == "delete"){
            var valueString = payments[selectedPayment].value.toString()
            console.log(valueString)
            if (valueString.length > 1){
                valueString = valueString.slice(0,-1)
            } else {
                valueString = "0"
            }
            payments[selectedPayment].value = parseInt(valueString)
        } else if(mode == "clear"){
            payments[selectedPayment].value = 0
        }
        this.setState({data: new_data})
        this.saveSession(new_data.currentOrders)
    }
    
    setSelectedItem(index){
        var new_data = Object.assign({}, this.state.data)
        new_data.currentOrders[this.state.selectedOrder].selectedItem = Number(index)
        new_data.currentOrders[this.state.selectedOrder].items[new_data.currentOrders[this.state.selectedOrder].selectedItem].qty_edited = false
        this.setState({data: new_data})
    }
    
    validatePayment(){
        var th = this
        var new_data = Object.assign({}, this.state.data)
        var total = countItemsTotalPrice(new_data.currentOrders[this.state.selectedOrder].items)
        var subtotal = countItemsTotalPrice(new_data.currentOrders[this.state.selectedOrder].items, false)
        if(new_data.currentOrders[this.state.selectedOrder].payments != undefined && new_data.currentOrders[this.state.selectedOrder].payments.reduce((total, p) => total = total + p.value, 0) >= total){
            console.log(new_data)
            
            var produk = []
            new_data.currentOrders[this.state.selectedOrder].items.forEach(item => {
                produk.push({
                    produk: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    disc: item.discount,
                    amount: countItemTotalPrice(item)
                })
            })
            
            var order_data = {
                session: pos_session_id,
                order_date: new_data.currentOrders[this.state.selectedOrder].order_date,
                produk: produk,
                subtotal: subtotal,
                total: total,
                potongan: subtotal - total,
                payment: new_data.currentOrders[this.state.selectedOrder].payments 
            }
            
            if(new_data.currentOrders[this.state.selectedOrder].customer){
                order_data.pet = new_data.currentOrders[this.state.selectedOrder].customer.name
                order_data.pet_owner = new_data.currentOrders[this.state.selectedOrder].customer.pet_owner.name
            }
            
            // "TODO: add payment"
            var already_exchange = false
            var payment_sum = order_data.payment.reduce((total, a) => total += a.value, 0)
            order_data.payment.forEach(p => {
                p.pos_session = pos_session_id
                if(p.type == 'Cash' && !already_exchange){
                    already_exchange = true
                    p.exchange = payment_sum - total
                }
            })
            
            console.log(order_data)
            
            frappe.call({
                type: "POST",
                method: "vet_website.vet_website.doctype.vetpossessions.vetpossessions.pos_add_order",
                args: {data: order_data},
                callback: function(r){
                    new_data.orders = r.message.orders.order
                    var newSelectedOrder = th.state.selectedOrder
                    new_data.currentOrders.splice(th.state.selectedOrder, 1)
                    if(new_data.currentOrders.length == 0){
                        new_data.currentOrders.push({items: [], order_date: r.message.datetime, selectedItem: 0})
                    } else {
                        if(th.state.selectedOrder > new_data.currentOrders.length-1){
                            newSelectedOrder = new_data.currentOrders.length-1
                        }
                    }
                    th.setState({data: new_data, selectedOrder: newSelectedOrder})
                    th.saveSession(new_data.currentOrders)
                }
            })
        }
    }
    
    addNewCustomer(data){
        var th = this
        
        frappe.call({
            type: "POST",
            method: "vet_website.vet_website.doctype.vetpossessions.vetpossessions.pos_add_customer",
            args: {data: data},
            callback: function(r){
                if (r.message){
                    console.log(r.message)
                    var new_data = Object.assign({}, th.state.data)
                    new_data.allCustomer = r.message
                    th.setState({data: new_data})
                }
            }
        })
    }
    
    render(){
        if(this.state.loaded){
            return(
                <div className="row">
                    <MainPOSHeader selectedOrder={this.state.selectedOrder} currentOrders={this.state.data.currentOrders} addSessionOrder={() => this.addSessionOrder()} setSelectedOrder={this.setSelectedOrder} deleteSessionOrder={() => this.deleteSessionOrder(this.state.selectedOrder)} closeInterface={() => this.closeInterface()}/>
                    {
                        this.state.data.currentOrders[this.state.selectedOrder].payment
                        ? <MainPOSPayment online={this.state.online} allPaymentMethod={this.state.data.allPaymentMethod} currentOrder={this.state.data.currentOrders[this.state.selectedOrder]} togglePayment={() => this.togglePayment(this.state.selectedOrder)} setSelectedPayment={this.setSelectedPayment} addPayment={this.addPayment} deletePayment={this.deletePayment} addPaymentValue={this.addPaymentValue} validatePayment={() => this.validatePayment()}/>
                        : 
                        [
                            <MainPOSSidepanel key="sidepanel" online={this.state.online} currentOrder={this.state.data.currentOrders[this.state.selectedOrder]} togglePayment={() => this.togglePayment(this.state.selectedOrder)} toggleSelectCustomer={() => this.toggleSelectCustomer()} toggleHistoryTransaction={() => this.toggleHistoryTransaction()} toggleEditItem={this.toggleEditItem} setSelectedItem={this.setSelectedItem}/>,
                            this.state.loadedProducts
                            ? <MainPOSProducts key="product" search={this.state.search} allProduct={this.state.data.allProduct} changeSearch={this.changeSearch} enterSearch={this.enterSearch} addProductToCurrentOrder={this.addProductToCurrentOrder} paginationClick={this.paginationClick} currentpage={this.state.currentpage} datalength={this.state.datalength}/>
                            : <div className="col px-0">
                                <div className="row justify-content-center" key='0'>
                                    <div className="col-10 col-md-8 text-center border rounded-lg py-4">
                                        <p className="mb-0 fs24md fs16 fw600 text-muted">
                                            <span><i className="fa fa-spin fa-circle-o-notch mr-3"></i>Loading...</span>
                                        </p>
                                    </div>
                                </div>
                                </div>
                        ]
                    }
                    {
                        this.state.selectCustomer?(<MainPOSCustomerSelector toggleSelectCustomer={() => this.toggleSelectCustomer()} addNewCustomer={this.addNewCustomer} allCustomer={this.state.data.allCustomer} setCustomer={this.setCustomer}/>):false
                    }
                    {
                        this.state.historyTransaction?(<MainPOSHistoryTransaction toggleHistoryTransaction={() => this.toggleHistoryTransaction()} orders={this.state.data.orders}/>):false
                    }
                </div>
            )
        } else {
            return <MainPOSLoading/>
        }
    }
}

// Loading

function MainPOSLoading(props){
    return(
        <div className="pos-loading">
            <div className="pos-loading-title">
                Loading...
            </div>
        </div>
    )
}

// Header

function MainPOSHeader(props){
    var tabs = []
    props.currentOrders.forEach((o, index) => {
        var tabclass = "col-auto pos-tab"
        if (props.selectedOrder==index){
            tabclass = "col-auto pos-tab active"
        }
        tabs.push(
            <div className={tabclass} onClick={() => props.setSelectedOrder(index)} key={index.toString()}>
                <span className="pos-tab-number">{(index+1).toString()}</span>
                <span className="pos-tab-title">{o.customer?o.customer.pet_name||o.customer.pet_owner.owner_name:moment(o.order_date).subtract(tzOffset, 'minute').format('YYYY-MM-DD HH:mm:ss')}</span>
            </div>
        )
    })
    
    return(
        <div className="col-12 d-flex flex-column pos-header">
            <div className="row my-auto">
                <div className="col pos-header-title">
                    <span className="fs30 fwbold px-5">POS</span>
                </div>
                <div className="col">
                    <div className="row">
                        {tabs}
                        <div className="col-auto pos-tab" onClick={props.addSessionOrder}>
                            <span className="pos-tab-number"><i className="fa fa-plus"/></span>
                        </div>
                        <div className="col-auto pos-tab" onClick={props.deleteSessionOrder}>
                            <span className="pos-tab-number"><i className="fa fa-minus"/></span>
                        </div>
                    </div>
                </div>
                <div className="col-auto my-auto px-4 ml-auto">
                    <span className="fs18 fw600">{user}</span>
                </div>
                <div className="col-auto d-flex px-4 border-left">
                    <span className="pos-close fs18 my-auto fw600" onClick={props.closeInterface}>Close</span>
                </div>
            </div>
        </div>
    )
}

function MainPOSHeaderTab(props){
    return(
        <div className="col-12 d-flex flex-column pos-header">
            <div className="row my-auto">
                <div className="col pos-header-title">
                    <span className="fs30 fwbold px-5">POS</span>
                </div>
                <div className="col-auto my-auto px-4 ml-auto">
                    <span className="fs18 fw600">{user}</span>
                </div>
                <div className="col-auto d-flex px-4 border-left">
                    <span className="fs18 my-auto fw600">Close</span>
                </div>
            </div>
        </div>
    )
}

// Products

function MainPOSProducts(props){
    var products = []
    if(props.allProduct != undefined){
        var allProduct = props.allProduct
        // if(![false,undefined,""].includes(props.search)){
        //     allProduct = props.allProduct.filter(p => [null,false,undefined].includes(p.barcode)?p.product_name.toLowerCase().includes(props.search.toLowerCase()) || p.default_code.toLowerCase().includes(props.search.toLowerCase()):p.product_name.toLowerCase().includes(props.search.toLowerCase()) || p.default_code.toLowerCase().includes(props.search.toLowerCase()) || p.barcode.toLowerCase().includes(props.search.toLowerCase()))
        // }
        allProduct.forEach((p, index) => products.push(<MainPOSProductsItem key={index.toString()} product={p}  addProductToCurrentOrder={() => props.addProductToCurrentOrder(p)}/>))
    }
    
    return(
        <div className="col px-0">
            <div className="pos-product px-3">
                <MainPOSSearchBar search={props.search} changeSearch={props.changeSearch} enterSearch={props.enterSearch}/>
                <div className="row pos-product-grid justify-content-around">
                    {products}
                    <Pagination paginationClick={props.paginationClick} datalength={props.datalength} currentpage={props.currentpage} itemperpage='30'/>
                </div>
            </div>
        </div>
    )
}

function MainPOSProductsItem(props){
    return(
        <div className="col-4 col-xl-3 pos-product-grid-col">
            <div className="pos-product-grid-item" onClick={props.addProductToCurrentOrder}>
                <div className="row mx-0">
                    <div className="col-auto ml-auto pos-product-grid-item-price">
                        {props.product.price!=undefined?formatter.format(props.product.price):formatter.format(0)}
                    </div>
                </div>
                <div className="pos-product-grid-item-image-wrapper">
                    {props.product.image?(<img className="pos-product-grid-item-image" src={props.product.image}/>):(<img className="pos-product-grid-item-image" src="/static/img/main/menu/pos-item-noimage.png"/>)}
                </div>
                <p className="fs12 fw600 text-truncate text-uppercase px-2 pos-color1 pt-2 mb-0">{props.product.product_name}</p>
            </div>
        </div>
    )
}

function MainPOSSearchBar(props){
    return(
        <div className="row pos-product-searchbar">
            <div className="col-auto ml-auto d-flex">
                <div className="pos-product-search-wrapper my-auto">
                    <input type="text" id="product_search" name="search" className="pos-product-search" autoComplete="off" placeholder="Cari" value={props.search||""} onChange={e => props.changeSearch(e)} onKeyDown={e => props.enterSearch(e)}/>
                </div>
            </div>
        </div>
    )
}

// Sidepanel

function MainPOSSidepanel(props){
    var items = []
    var total_display
    if(props.currentOrder.items != undefined && props.currentOrder.items.length != 0){
        var total = countItemsTotalPrice(props.currentOrder.items)
        props.currentOrder.items.forEach((p, index) => items.push(<MainPOSSidepanelList key={index.toString()} active={props.currentOrder.selectedItem == index?true:false} product={p} setSelectedItem={() => props.setSelectedItem(index)}/>))
        total_display = <div className="row"><div className="pos-sidepanel-total col-auto pl-0 mt-2 ml-auto fs18 fw600 ">Total<span className="px-2">:</span>{formatter.format(total)}</div></div>
    }
    
    return(
        <div className="col pos-sidepanel d-flex flex-column px-0">
            <div className="h-100 px-3 overflow-auto">
                {items}
                {total_display}
            </div>
            <MainPOSSidepanelControl edit_item={props.currentOrder.edit_item} online={props.online} togglePayment={props.togglePayment} toggleSelectCustomer={props.toggleSelectCustomer} toggleEditItem={props.toggleEditItem} toggleHistoryTransaction={props.toggleHistoryTransaction} customer={props.currentOrder.customer}/>
        </div>
    )
}

function MainPOSSidepanelList(props){
    var listClass = "row pos-sidepanel-item"
    if(props.active){
        listClass = "row pos-sidepanel-item active"
    }
    
    return(
        <div className={listClass} onClick={props.setSelectedItem}>
            <div className="col-12 px-0">
                <p className="text-truncate text-uppercase fs18 fw600 mb-0">{props.product.product_name}</p>
            </div>
            <div className="col px-0">
                <span className="fs14 fw600">{"@ "+props.product.quantity+" "+props.product.uom_name+" x "+formatter2.format(props.product.price)} {props.product.discount>0?" discount "+props.product.discount+"%":false}</span>
            </div>
            <div className="col-auto px-0">
                <span className="fs14 fw600">{formatter.format(countItemTotalPrice(props.product))} </span>
            </div>
        </div>
    )
}

function MainPOSSidepanelControl(props){
    
    function HistoryIcon(props){
        var style = {
            display: "inline-block",
            width: 20 || props.width,
            height: 20 || props.height,
        }
        
        return(<div style={style} className={props.className}>
            <svg preserveAspectRatio="xMaxYMid" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.03692 10.9016C1.71251 15.3089 5.50017 18.7111 10.0326 18.7111C15.0403 18.7111 19.1376 14.5621 19.1376 9.49278C19.1376 4.42351 15.0403 0.274414 10.0326 0.274414C8.61909 0.274271 7.22495 0.607474 5.96066 1.24762C4.69636 1.88777 3.59665 2.81728 2.74865 3.9625V0.274414H0.93039L0.927658 6.72856H7.30113V4.88452H4.38754C5.66224 3.22488 7.7582 2.11846 10.0344 2.11846C14.0388 2.11846 17.3166 5.43773 17.3166 9.49278C17.3166 13.5478 14.0388 16.8689 10.0326 16.8689C6.50262 16.8689 3.54078 14.2919 2.88705 10.9016H1.03692Z" fill="#3C505C"/>
                <path d="M9.12446 4.88477V9.77148L12.038 13.7343L13.4948 12.6307L10.9454 9.21919V4.88477" fill="#3C505C"/>
            </svg>
        </div>)
    }
    
    function PaymentIcon(props){
        var style = {
            display: "inline-block",
            width: 51 || props.width,
            height: 51 || props.height,
        }
        
        return (<div style={style} className={props.className}>
            <svg preserveAspectRatio="xMaxYMid" viewBox="0 0 51 51" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="25.002" cy="25.248" rx="25.002" ry="25" fill="#3C505C"/>
                <path d="M20.5934 12.748L17.5011 15.8324L27.5457 25.873L17.5011 35.9137L20.5934 38.998L33.7524 25.873L20.5934 12.748Z" fill="#E5E8EA"/>
            </svg>
        </div>)
    }
    
    function QtyIcon(props){
        var style = {
            display: "inline-block",
            width: 24 || props.width,
            height: 24 || props.height,
        }
        var fill1 = "#3C505C"
        var fill2 = "#E5E8EA"
        
        if(props.className.includes("active")){
            fill1 = "#FFF"
            fill2 = "#5FA631"
        }
        
        return(<div style={style} className={props.className}>
            <svg preserveAspectRatio="xMaxYMid" viewBox="0 0 24 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.5202 11.2506C14.4758 9.6213 12.6971 8.64844 10.762 8.64844C8.82693 8.64844 7.04819 9.6213 6.00397 11.2506L3.48736 15.1765C3.06981 15.8278 2.87715 16.5804 2.9301 17.3523C2.98304 18.1243 3.27681 18.8433 3.77953 19.4319C4.28261 20.0199 4.94735 20.4219 5.70188 20.5944C6.4564 20.7669 7.22987 20.6932 7.93853 20.3817L7.98599 20.3606C9.76915 19.5925 11.8068 19.5996 13.5853 20.3817C14.0441 20.5834 14.5302 20.6854 15.0207 20.6854C15.2874 20.6854 15.5557 20.6551 15.8215 20.5946C16.576 20.4223 17.2407 20.0203 17.744 19.4321C18.2469 18.844 18.5408 18.1249 18.5939 17.3526C18.6471 16.5804 18.4544 15.828 18.0369 15.1764L15.5202 11.2506Z" fill={fill1}/>
                <path d="M13.5237 14.2361V15.6405H11.183V17.9811H9.77868V15.6405H7.43806V14.2361H9.77868V11.8955H11.183V14.2361H13.5237Z" fill={fill2}/>
                <path d="M4.16562 11.2458C4.9143 10.9582 5.48307 10.3549 5.7671 9.54691C6.0375 8.77805 6.01536 7.91002 5.70459 7.10255C5.39365 6.29561 4.82806 5.63688 4.11197 5.24749C3.35975 4.83862 2.53333 4.77204 1.78589 5.06014C0.282153 5.6383 -0.407914 7.49654 0.2478 9.20338C0.771593 10.5619 1.99325 11.4195 3.22835 11.4195C3.54373 11.4195 3.85999 11.3635 4.16562 11.2458Z" fill={fill1}/>
                <path d="M9.04881 8.16963C10.9287 8.16963 12.4581 6.42719 12.4581 4.28545C12.4581 2.14318 10.9287 0.400391 9.04881 0.400391C7.16914 0.400391 5.6399 2.14318 5.6399 4.28545C5.6399 6.42719 7.16914 8.16963 9.04881 8.16963Z" fill={fill1}/>
                <path d="M14.936 9.12342H14.9362C15.2254 9.21939 15.5204 9.26525 15.8141 9.26525C17.1851 9.26525 18.5211 8.26743 19.0309 6.73394C19.3245 5.85122 19.3052 4.91785 18.9765 4.10595C18.6327 3.25598 17.9954 2.63905 17.1819 2.36865C16.3682 2.09825 15.4883 2.21105 14.704 2.68597C13.9548 3.13964 13.3807 3.87575 13.0875 4.75848C12.4686 6.62062 13.2979 8.57873 14.936 9.12342Z" fill={fill1}/>
                <path d="M22.116 8.67034L22.1155 8.66981C20.8191 7.71217 18.8803 8.12724 17.7932 9.59556C16.7072 11.0646 16.877 13.0395 18.1715 13.9979C18.6435 14.3476 19.2013 14.5148 19.7722 14.5148C20.7672 14.5148 21.8024 14.0069 22.4944 13.073C23.5803 11.604 23.4106 9.62903 22.116 8.67034Z" fill={fill1}/>
            </svg>
        </div>)
    }
    
    var styles = {
        mw40: {width: "40%"},
        mw50: {width: "50%"},
        mw60: {width: "60%"},
    }
    
    function DiscountIcon(props){
        var style = {
            display: "inline-block",
            width: 23 || props.width,
            height: 23 || props.height,
        }
        var fill = "#3C505C"
        
        props.className.includes("active")?fill = "#FFF":false
        
        return(<div style={style} className={props.className}>
            <svg preserveAspectRatio="xMaxYMid" viewBox="0 0 23 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.7058 9.95046L21.1673 3.79606C21.1288 3.66142 21.0808 3.5364 21.023 3.42103L18.3016 6.14245C18.6575 6.90211 18.5324 7.83485 17.9074 8.45992C17.1093 9.25802 15.8207 9.25807 15.0225 8.45992C14.2243 7.66177 14.2244 6.37314 15.0225 5.57504C15.6476 4.94997 16.5803 4.82494 17.34 5.18079L20.0614 2.45937C19.946 2.40162 19.821 2.35362 19.6864 2.31513L13.532 0.776586C12.8397 0.603511 12.0992 0.805417 11.5895 1.31508L0.598171 12.3064C-0.199932 13.1045 -0.199977 14.3931 0.598171 15.1913L8.29116 22.8843C9.08931 23.6824 10.3779 23.6824 11.176 22.8843L22.1673 11.8929C22.677 11.3832 22.879 10.6428 22.7058 9.95046ZM8.29116 8.45992C9.08931 7.66177 10.3779 7.66177 11.176 8.45992C11.9742 9.25807 11.9742 10.5466 11.176 11.3448C10.3779 12.1429 9.08935 12.143 8.29116 11.3448C7.49297 10.5467 7.49306 9.25802 8.29116 8.45992ZM12.1377 18.0761C11.3395 18.8742 10.0509 18.8743 9.25277 18.0761C8.45463 17.278 8.45467 15.9894 9.25277 15.1913C10.0509 14.3931 11.3395 14.3931 12.1377 15.1913C12.9358 15.9894 12.9358 17.2779 12.1377 18.0761ZM14.6168 13.4634L5.96222 14.425C5.74858 14.448 5.54712 14.3705 5.40583 14.2292C5.30066 14.124 5.22881 13.9836 5.21095 13.824C5.1701 13.4507 5.43869 13.1145 5.81195 13.0727L14.4666 12.1111C14.8394 12.0716 15.176 12.3388 15.2178 12.7121C15.2587 13.0854 14.9901 13.4216 14.6168 13.4634Z" fill={fill}/>
            </svg>
        </div>)
    }
    
    function PriceIcon(props){
        var style = {
            display: "inline-block",
            width: 23 || props.width,
            height: 23 || props.height,
        }
        
        return(<div style={style} className={props.className}>
            <svg preserveAspectRatio="xMaxYMid" viewBox="0 0 24 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="-0.000423431" y="0.333984" width="23.2099" height="13.9259" rx="1.54733" fill="#3C505C"/>
                <path d="M4.07241 2.76872C4.7161 2.76872 5.20918 2.88426 5.55166 3.11532C5.89413 3.34226 6.06537 3.69712 6.06537 4.17988C6.06537 4.4811 5.99522 4.7266 5.85493 4.91641C5.71877 5.10209 5.52071 5.24857 5.26076 5.35585C5.34741 5.46313 5.43819 5.58692 5.53309 5.72721C5.62799 5.86337 5.72083 6.00779 5.81161 6.16046C5.90651 6.309 5.99729 6.4658 6.08394 6.63085C6.17059 6.79177 6.25105 6.95063 6.32532 7.10742H5.24219C5.16379 6.96713 5.08333 6.82478 5.00081 6.68036C4.92241 6.53594 4.83989 6.39565 4.75324 6.25949C4.67071 6.12332 4.58819 5.99541 4.50567 5.87575C4.42314 5.75197 4.34062 5.64056 4.25809 5.54153H3.78152V7.10742H2.81599V2.88013C3.02642 2.83887 3.24305 2.80998 3.46586 2.79348C3.6928 2.77697 3.89499 2.76872 4.07241 2.76872ZM4.12812 3.5919C4.05797 3.5919 3.99402 3.59396 3.93625 3.59809C3.88261 3.60221 3.83103 3.60634 3.78152 3.61047V4.77406H4.05385C4.41695 4.77406 4.6769 4.72867 4.8337 4.63789C4.99049 4.54711 5.06889 4.39238 5.06889 4.17369C5.06889 3.96326 4.98843 3.81471 4.82751 3.72806C4.67071 3.63729 4.43758 3.5919 4.12812 3.5919ZM9.21567 5.50439C9.21567 5.21969 9.15172 4.99274 9.02381 4.82357C8.89589 4.65027 8.70609 4.56362 8.45439 4.56362C8.37187 4.56362 8.29553 4.56775 8.22539 4.576C8.15524 4.58012 8.09747 4.58631 8.05209 4.59457V6.25949C8.10985 6.29662 8.18412 6.32757 8.2749 6.35233C8.3698 6.37708 8.46471 6.38946 8.55961 6.38946C8.99699 6.38946 9.21567 6.09444 9.21567 5.50439ZM10.1564 5.47964C10.1564 5.73133 10.1255 5.96034 10.0636 6.16665C10.0017 6.37296 9.91094 6.55038 9.79128 6.69893C9.67162 6.84747 9.52308 6.963 9.34565 7.04553C9.16822 7.12805 8.96398 7.16931 8.73291 7.16931C8.605 7.16931 8.48534 7.15694 8.37393 7.13218C8.26252 7.10742 8.15524 7.07235 8.05209 7.02696V8.25244H7.12988V3.96326C7.2124 3.9385 7.30731 3.91581 7.41459 3.89517C7.52187 3.87042 7.63328 3.84979 7.74881 3.83328C7.86847 3.81678 7.98813 3.8044 8.10779 3.79615C8.23158 3.78377 8.34917 3.77758 8.46058 3.77758C8.72878 3.77758 8.9681 3.81884 9.17854 3.90136C9.38898 3.97976 9.5664 4.09323 9.71082 4.24178C9.85524 4.38619 9.96458 4.56362 10.0389 4.77406C10.1172 4.98449 10.1564 5.21969 10.1564 5.47964Z" fill="#E5E8EA"/>
            </svg>
        </div>)
    }
    
    var styles = {
        mw40: {width: "40%"},
        mw50: {width: "50%"},
        mw60: {width: "60%"},
    }
    
    return(
        <div className="pos-sidepanel-control mt-auto">
            <table className="mb-2">
                <tbody>
                    <tr>
                        <td style={styles.mw50} className="pos-sidepanel-button" onClick={props.toggleSelectCustomer}>
                            <i className="fa fa-user fs22 mr-2"/><span className="fs12 fw600">{props.customer?props.customer.pet_name||props.customer.pet_owner.owner_name:"Customer"}</span>
                        </td>
                        <td style={styles.mw50} className="pos-sidepanel-button" onClick={props.toggleHistoryTransaction}>
                            <HistoryIcon className="mr-2"/><span className="fs12 fw600">History Transaction</span>
                        </td>
                    </tr>
                </tbody>
            </table>
            <table>
                <tbody>
                    <tr>
                        {
                            props.online?(<td style={styles.mw60} rowSpan="3" className="pos-sidepanel-button text-center" onClick={props.togglePayment}><PaymentIcon className="mb-3"/><div className="fs18 fw600">Payment</div></td>):(<td style={styles.mw60} rowSpan="3" className="pos-sidepanel-button disabled text-center"><div className="fs18 fw600">No Connection</div></td>)
                        }
                        <td style={styles.mw40} className={props.edit_item=="quantity"?"pos-sidepanel-button active px-4":"pos-sidepanel-button px-4"} onClick={() => props.toggleEditItem("quantity")}>
                            <QtyIcon className={props.edit_item=="quantity"?"mr-2 active":"mr-2"}/><span className="fs12 fw600">Qty</span>
                        </td>
                    </tr>
                    <tr>
                        <td style={styles.mw40} className={props.edit_item=="discount"?"pos-sidepanel-button active px-4":"pos-sidepanel-button px-4"} onClick={() => props.toggleEditItem("discount")}>
                            <DiscountIcon className={props.edit_item=="discount"?"mr-2 active":"mr-2"}/><span className="fs12 fw600">Discount</span>
                        </td>
                    </tr>
                    <tr>
                        <td style={styles.mw40} className="pos-sidepanel-button disabled px-4">
                            <PriceIcon className="mr-2"/><span className="fs12 fw600">Price</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

// Payment

function MainPOSPayment(props){
    var order = props.currentOrder
    
    function DoubleChevronIcon(props){
        var style = {
            display: "inline-block",
            width: 20 || props.width,
            height: 25 || props.height,
        }
        
        if(props.direction == "left"){
            return(<div style={style} className={props.className}>
                <svg preserveAspectRatio="xMidYMax" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M15.1226 17.636L7.88662 9.45122L15.1226 1.26646L14.0048 0L5.67134 9.45595L14.0048 18.9024L15.1226 17.636Z" fill="#767370"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M9.45117 18.1086L2.21524 9.92388L9.45117 1.73912L8.33346 0.472656L-4.76837e-05 9.9286L8.33346 19.3751L9.45117 18.1086Z" fill="#767370"/>
                </svg>
            </div>)
        } else if(props.direction == "right"){
            return(<div style={style} className={props.className}>
                <svg preserveAspectRatio="xMidYMax" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M0.249512 17.636L7.48545 9.45122L0.249512 1.26646L1.36722 0L9.70073 9.45595L1.36722 18.9024L0.249512 17.636Z" fill="#767370"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M5.9209 18.1086L13.1568 9.92388L5.9209 1.73912L7.03861 0.472656L15.3721 9.9286L7.03861 19.3751L5.9209 18.1086Z" fill="#767370"/>
                </svg>
            </div>)
        }
    }
    
    var total_display
    var payment
    var payments = []
    var order_total = 0
    var payment_method_list = []
    if(order != undefined && order.items.length != 0){
        order_total = countItemsTotalPrice(order.items)
    }
    
    console.log(order.payments)
    
    if (order.payments != undefined && order.payments.length != 0){
        var payment_styles = {
            margin: {margin: "40px 0"},
            unselected_color: {color: "#8a8a8a"},
            type_color: {color: "#3C505C"},
            paid_color: {color: "#056EAD"},
            exchange_color: {color: "#5FA631", textAlign: "center"},
            type_bg: {background: "#3C505C", color: "#FFF", padding: "13px 0", borderTopLeftRadius: 5, borderBottomLeftRadius: 5},
            unselected_type_bg: {background: "#DCD9D7", color: "#6D7573", padding: "13px 0", borderTopLeftRadius: 5, borderBottomLeftRadius: 5},
            paid_bg: {color: "#056EAD", border:"2px solid #056EAD", padding: "13px 0", borderRadius: 3, overflow: "hidden"},
            exchange_bg: {background: "#5FA631", color: "#FFF", padding: "13px 0", borderTopRightRadius: 5, borderBottomRightRadius: 5, overflow: "hidden"},
            unselected_exchange_bg: {background: "#DCD9D7", color: "#6D7573", padding: "13px 0", borderTopRightRadius: 5, borderBottomRightRadius: 5, overflow: "hidden"},
            empty: {width: 18},
            pointer: {cursor: 'pointer'}
        }
        
        order.payments.forEach((p, index) => {
            var currentExchange = order.payments.slice(0,index+1).reduce((a,b) => a += b.value, 0)-order_total
            var totalExchange = order.payments.reduce((a,b) => a += b.value, 0)-order_total
            
            payments.push(
                <div className="row mx-0 my-1" key={index.toString()}>
                    <div className="col text-uppercase fs20 fw600 text-center my-auto" style={order.selectedPayment==index?payment_styles.type_bg:payment_styles.unselected_type_bg} onClick={() => props.setSelectedPayment(index)}>
                        {p.method_name || p.type}
                    </div>
                    <div className="col fs20 fw600 text-center" style={payment_styles.paid_bg}>
                        {formatter2.format(p.value)}
                    </div>
                    <div className="col fs20 fw600 text-center my-auto" style={order.selectedPayment==index?payment_styles.exchange_bg:payment_styles.unselected_exchange_bg}>
                        {p.type=='Cash'&&totalExchange>0?formatter2.format(totalExchange):currentExchange<0&&index+1==order.payments.length?formatter.format(currentExchange):'\xa0'}
                    </div>
                    <div className="col-auto d-flex">
                        <i className="fa fa-trash fs18 my-auto" style={payment_styles.pointer} onClick={() => props.deletePayment(index)}/>
                    </div>
                </div>
            )
        })
        
        payment = <div className="px-3" style={payment_styles.margin}>
            <div className="row mx-0">
                <div className="col fs18 fw600 text-center" style={payment_styles.type_color}>
                    Tipe
                </div>
                <div className="col fs18 fw600 text-center" style={payment_styles.paid_color}>
                    Dibayar
                </div>
                <div className="col fs18 fw600 text-center" style={payment_styles.exchange_color}>
                    Kembali
                </div>
                <div className="col-auto">
                    <div style={payment_styles.empty}/>
                </div>
            </div>
            {payments}
        </div>
    } else {
        total_display = <div className="pos-payment-order-total">{formatter.format(order_total)}</div>
    }
    
    if(props.allPaymentMethod != undefined && props.allPaymentMethod.length > 0){
        props.allPaymentMethod.forEach(p => {
            payment_method_list.push(<div key={p.name} className="pos-payment-method-button" onClick={() => props.addPayment(p.name, 0, p.method_type)}>{p.method_name}</div>)
        })
    }
    
    return(
        <div className="col-12 px-0 pos-payment">
            <div className="container px-0">
                <div className="pos-payment-panel">
                    <div className="row">
                        <div className="col-auto">
                            <div className="pos-payment-button" onClick={props.togglePayment}><DoubleChevronIcon className="mr-2" direction="left"/>Back</div>
                        </div>
                        <div className="col text-center pos-color1 fs38 fwbold">
                            Payment
                        </div>
                        {props.online?(<div className="col-auto"><div className="pos-payment-button" onClick={props.validatePayment}>Validate<DoubleChevronIcon direction="right" className="ml-2"/></div></div>):(<div className="col-auto d-flex"><p className="my-auto fs16 fw600">No Connection</p></div>)}
                    </div>
                    <div className="row">
                        <div className="col-4 py-4">
                            <p className="text-center pos-color1">Please Select A Payment Method</p>
                            {payment_method_list}
                        </div>
                        <div className="col-8">
                            {total_display}
                            {payment}
                            <MainPOSPaymentNumpad addPaymentValue={props.addPaymentValue}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function MainPOSPaymentNumpad(props){
    function DeleteIcon(props){
        var style = {
            display: "inline-block",
            width: 38 || props.width,
            height: 38 || props.height,
        }
        
        return(<div style={style} className={props.className}>
            <svg preserveAspectRatio="xMaxYMid" viewBox="0 0 42 31" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M36.6388 1.75098H14.4102L2.44092 15.4301L14.4102 29.1093H36.6388C37.5458 29.1093 38.4156 28.749 39.057 28.1077C39.6983 27.4663 40.0586 26.5965 40.0586 25.6895V5.17077C40.0586 4.26378 39.6983 3.39394 39.057 2.75261C38.4156 2.11127 37.5458 1.75098 36.6388 1.75098V1.75098Z" stroke="#056EAD" strokeWidth="3.41979" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M31.5094 10.3008L21.25 20.5601" stroke="#056EAD" strokeWidth="3.41979" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21.25 10.3008L31.5094 20.5601" stroke="#056EAD" strokeWidth="3.41979" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </div>)
    }
    
    var styles = {
        mw29: {width: "29%"},
        mw14: {width: "14%"},
    }
    
    return(
        <div className="pl-5">
            <table className="pos-payment-numpad">
                <tbody>
                    <tr>
                        <td style={styles.mw14} className="pos-payment-numpad-button fs44 fw600" onClick={() => props.addPaymentValue(1, "append")}>1</td>
                        <td style={styles.mw14} className="pos-payment-numpad-button fs44 fw600" onClick={() => props.addPaymentValue(2, "append")}>2</td>
                        <td style={styles.mw14} className="pos-payment-numpad-button fs44 fw600" onClick={() => props.addPaymentValue(3, "append")}>3</td>
                        <td style={styles.mw29} className="pos-payment-numpad-button fs24 fw600" onClick={() => props.addPaymentValue(500)}>+500</td>
                        <td style={styles.mw29} className="pos-payment-numpad-button fs24 fw600" onClick={() => props.addPaymentValue(10000)}>+10.000</td>
                    </tr>
                    <tr>
                        <td style={styles.mw14} className="pos-payment-numpad-button fs44 fw600" onClick={() => props.addPaymentValue(4, "append")}>4</td>
                        <td style={styles.mw14} className="pos-payment-numpad-button fs44 fw600" onClick={() => props.addPaymentValue(5, "append")}>5</td>
                        <td style={styles.mw14} className="pos-payment-numpad-button fs44 fw600" onClick={() => props.addPaymentValue(6, "append")}>6</td>
                        <td style={styles.mw29} className="pos-payment-numpad-button fs24 fw600" onClick={() => props.addPaymentValue(1000)}>+1.000</td>
                        <td style={styles.mw29} className="pos-payment-numpad-button fs24 fw600" onClick={() => props.addPaymentValue(20000)}>+20.000</td>
                    </tr>
                    <tr>
                        <td style={styles.mw14} className="pos-payment-numpad-button fs44 fw600" onClick={() => props.addPaymentValue(7, "append")}>7</td>
                        <td style={styles.mw14} className="pos-payment-numpad-button fs44 fw600" onClick={() => props.addPaymentValue(8, "append")}>8</td>
                        <td style={styles.mw14} className="pos-payment-numpad-button fs44 fw600" onClick={() => props.addPaymentValue(9, "append")}>9</td>
                        <td style={styles.mw29} className="pos-payment-numpad-button fs24 fw600" onClick={() => props.addPaymentValue(2000)}>+2.000</td>
                        <td style={styles.mw29} className="pos-payment-numpad-button fs24 fw600" onClick={() => props.addPaymentValue(50000)}>+50.000</td>
                    </tr>
                    <tr>
                        <td style={styles.mw14} className="pos-payment-numpad-button fs44 fw600" onClick={() => props.addPaymentValue(0, "clear")}>C</td>
                        <td style={styles.mw14} className="pos-payment-numpad-button fs44 fw600" onClick={() => props.addPaymentValue(0, "append")}>0</td>
                        <td style={styles.mw14} className="pos-payment-numpad-button fs44 fw600" onClick={() => props.addPaymentValue(0, "delete")}><DeleteIcon/></td>
                        <td style={styles.mw29} className="pos-payment-numpad-button fs24 fw600" onClick={() => props.addPaymentValue(5000)}>+5.000</td>
                        <td style={styles.mw29} className="pos-payment-numpad-button fs24 fw600" onClick={() => props.addPaymentValue(100000)}>+100.000</td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

// CustomerSelector

class MainPOSCustomerSelector extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            page: 1,
            search: "",
            sort: "",
            show_form: false,
            newCustomer: {}
        }
        this.paginationClick = this.paginationClick.bind(this);
        this.formSubmit = this.formSubmit.bind(this);
        this.changeCustomer = this.changeCustomer.bind(this);
    }
    
    paginationClick(number) {
        this.setState({page: Number(number)});
    }
    
    changeSearch(e){
        var search = e.target.value
        this.setState({search: search})
    }
    
    changeSort(e){
        var sort = e.target.value
        this.setState({sort: sort})
    }
    
    changeCustomer(e){
        var name = e.target.name
        var value = e.target.value
        var newCustomer = Object.assign({}, this.state.newCustomer)
        newCustomer[name] = value
        this.setState({newCustomer: newCustomer})
    }
    
    formSubmit(e){
        e.preventDefault()
        this.props.addNewCustomer(this.state.newCustomer)
        this.setState({newCustomer: {}, show_form: false})
    }
    
    toggleShowForm(mode){
        mode?this.setState({show_form: mode}):this.setState({show_form: !this.state.show_form})
    }
    
    render() {
        function CloseIcon(props){
            var style = {
                display: "inline-block",
                width: 26 || props.width,
                height: 26 || props.height,
            }
            
            return(<div style={style} className={props.className}>
                <svg preserveAspectRatio="xMaxYMid" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M26 13C26 16.4478 24.6304 19.7544 22.1924 22.1924C19.7544 24.6304 16.4478 26 13 26C9.55219 26 6.24558 24.6304 3.80761 22.1924C1.36964 19.7544 0 16.4478 0 13C0 9.55219 1.36964 6.24558 3.80761 3.80761C6.24558 1.36964 9.55219 0 13 0C16.4478 0 19.7544 1.36964 22.1924 3.80761C24.6304 6.24558 26 9.55219 26 13ZM19.2628 7.88775C19.4153 7.73518 19.501 7.52826 19.501 7.3125C19.501 7.09674 19.4153 6.88982 19.2628 6.73725C19.1102 6.58468 18.9033 6.49897 18.6875 6.49897C18.4717 6.49897 18.2648 6.58468 18.1122 6.73725L13 11.8511L7.88775 6.73725C7.81221 6.66171 7.72253 6.60178 7.62382 6.5609C7.52512 6.52002 7.41933 6.49897 7.3125 6.49897C7.20567 6.49897 7.09988 6.52002 7.00118 6.5609C6.90247 6.60178 6.81279 6.66171 6.73725 6.73725C6.66171 6.81279 6.60178 6.90247 6.5609 7.00118C6.52002 7.09988 6.49897 7.20567 6.49897 7.3125C6.49897 7.41933 6.52002 7.52512 6.5609 7.62382C6.60178 7.72253 6.66171 7.81221 6.73725 7.88775L11.8511 13L6.73725 18.1122C6.58468 18.2648 6.49897 18.4717 6.49897 18.6875C6.49897 18.9033 6.58468 19.1102 6.73725 19.2628C6.88982 19.4153 7.09674 19.501 7.3125 19.501C7.52826 19.501 7.73518 19.4153 7.88775 19.2628L13 14.1489L18.1122 19.2628C18.1878 19.3383 18.2775 19.3982 18.3762 19.4391C18.4749 19.48 18.5807 19.501 18.6875 19.501C18.7943 19.501 18.9001 19.48 18.9988 19.4391C19.0975 19.3982 19.1872 19.3383 19.2628 19.2628C19.3383 19.1872 19.3982 19.0975 19.4391 18.9988C19.48 18.9001 19.501 18.7943 19.501 18.6875C19.501 18.5807 19.48 18.4749 19.4391 18.3762C19.3982 18.2775 19.3383 18.1878 19.2628 18.1122L14.1489 13L19.2628 7.88775Z" fill="#FF0000"/>
                </svg>
            </div>)
        }
        
        function CustomerRow(props){
            var styles = {
                panel: {background: "#84D1FF", borderRadius: 4, color: "#056EAD", cursor: "pointer"}
            }
            return (
                <div style={styles.panel} className="px-3 py-2 mb-2" onClick={props.setCustomer}>
                    <div className="row fs20 fw600">
                        <div className="col-4">
                            {props.pet.pet_name}
                        </div>
                        <div className="col-4">
                            {props.pet.pet_owner.owner_name}
                        </div>
                        <div className="col-4">
                            {props.pet.pet_owner.phone}
                        </div>
                    </div>
                </div>
            )
        }
        
        var styles = {
            panel: {background: "#FFF", borderRadius: 10, padding: "12px 26px", maxHeight: "95vh"},
            header_panel: {background: "#056EAD", borderRadius: 4, color: "#FFF"},
            pointer: {cursor: "pointer"},
            button: {background: "#056EAD", color: "#FFF"},
            overflow: {overflow: "hidden auto"}
        }
        
        var customer_rows = []
        var filteredItems = this.props.allCustomer
        if(![false,undefined,''].includes(this.state.search)){
            // filteredItems = filteredItems.filter(c => c.pet_name.toLowerCase().includes(this.state.search.toLowerCase()))
            filteredItems = filteredItems.filter(c => c.pet_owner.owner_name.toLowerCase().includes(this.state.search.toLowerCase()))
        }
        if(this.state.sort == "pet_name"){
            filteredItems = filteredItems.sort((a, b) => {
                if(a.pet_name < b.pet_name) { return -1; }
                if(a.pet_name > b.pet_name) { return 1; }
                return 0;
            })
        } else if(this.state.sort == "owner_name"){
            filteredItems = filteredItems.sort((a, b) => {
                if(a.pet_owner.owner_name < b.pet_owner.owner_name) { return -1; }
                if(a.pet_owner.owner_name > b.pet_owner.owner_name) { return 1; }
                return 0;
            })
        } else {
            filteredItems = filteredItems.sort((a, b) => {
                if(moment(a.register_date) < moment(b.register_date)) { return 1; }
                if(moment(a.register_date) > moment(b.register_date)) { return -1; }
                return 0;
            })
        }
        const indexOfLastTodo = this.state.page * 10;
        const indexOfFirstTodo = indexOfLastTodo - 10;
        const currentItems = filteredItems.slice(indexOfFirstTodo, indexOfLastTodo)
        
        currentItems.forEach((c, index) => customer_rows.push(<CustomerRow key={index.toString()} pet={c} setCustomer={() => this.props.setCustomer(c)}/>))
        
        if(customer_rows.length == 0){
            customer_rows.push(
                <div className="row justify-content-center my-5" key='0'>
                    <div className="col-10 col-md-8 text-center border rounded-lg py-4">
                        <p className="mb-0 fs24md fs16 fw600 text-muted">
                            <span>Item tidak ditemukan</span>
                        </p>
                    </div>
                </div>
            )
        }
        
        return(
            <div className="menu-popup">
                <div className="container">
                    <div style={styles.panel} className="d-flex flex-column">
                        <div className="text-right">
                            <a onClick={this.props.toggleSelectCustomer} style={styles.pointer}>
                                <CloseIcon/>
                            </a>
                        </div>
                        <div className="row my-3 mx-0">
                            <div className="col-auto">
                                <button type="button" className="btn fs12 fw600" style={styles.button} onClick={() => this.toggleShowForm()}>Tambah Customer{this.state.show_form?<i className="fa fa-chevron-up ml-2"/>:<i className="fa fa-chevron-down ml-2"/>}</button>
                            </div>
                            <div className="col-4 ml-auto">
                                <input type="text" name="search" className="form-control fs12" placeholder="Cari Nama Pemilik" value={this.state.search} onChange={e => this.changeSearch(e)}/>
                            </div>
                            <div className="col-auto">
                                <select name="sort" className="form-control fs12" placeholder="Sort By" value={this.state.sort} onChange={e => this.changeSort(e)}>
                                    <option value="">Sort by...</option>
                                    <option value="pet_name">Nama Pasien</option>
                                    <option value="owner_name">Nama Pemilik</option>
                                </select>
                            </div>
                        </div>
                        {this.state.show_form?(<CustomerForm formSubmit={this.formSubmit} changeCustomer={this.changeCustomer} newCustomer={this.state.newCustomer}/>):false}
                        <div style={styles.overflow}>
                            <div style={styles.header_panel} className="px-3 py-2 mb-2">
                                <div className="row fs20 fw600">
                                    <div className="col-4">
                                        Nama Hewan
                                    </div>
                                    <div className="col-4">
                                        Nama Pemilik
                                    </div>
                                    <div className="col-4">
                                        No. Telepon
                                    </div>
                                </div>
                            </div>
                            {customer_rows}
                        </div>
                        <Pagination paginationClick={this.paginationClick} datalength={filteredItems.length} currentpage={this.state.page} itemperpage='10'/>
                    </div>
                </div>
                <div className="menu-popup-close" onClick={this.props.toggleSelectCustomer}/>
            </div>
        )
    }
}

class CustomerForm extends React.Component{
    render(){
        var props = this.props
        
        return (
            <form className="row mx-0 mb-3" onSubmit={e => props.formSubmit(e)}>
                <div className="col">
                    <input type="text" placeholder="Nama Hewan" name="pet_name" className="form-control fs12" value={props.newCustomer.pet_name||''} onChange={e => props.changeCustomer(e)} required/>
                </div>
                <div className="col">
                    <input type="text" placeholder="Nama Pemilik" name="owner_name" className="form-control fs12" value={props.newCustomer.owner_name||''} onChange={e => props.changeCustomer(e)} required/>
                </div>
                <div className="col">
                    <input type="text" placeholder="No Telepon" name="phone" className="form-control fs12" value={props.newCustomer.phone||''} onChange={e => props.changeCustomer(e)} required/>
                </div>
                <div className="col-auto">
                    <button type="submit" className="btn text-white pos-bg1"><i className="fa fa-plus"/></button>
                </div>
            </form>
        )
    }
}

// History Transaction

class MainPOSHistoryTransaction extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            page: 1,
            search: "",
            sort: "pet_name",
        }
        this.paginationClick = this.paginationClick.bind(this);
    }
    
    paginationClick(number) {
        this.setState({page: Number(number)});
    }
    
    changeSearch(e){
        var search = e.target.value
        this.setState({search: search})
    }
    
    changeOrderDate(e){
        var order_date = e.target.value
        this.setState({order_date: order_date})
    }
    
    changeSort(e){
        var sort = e.target.value
        this.setState({sort: sort})
    }
    
    render() {
        function CloseIcon(props){
            var style = {
                display: "inline-block",
                width: 26 || props.width,
                height: 26 || props.height,
            }
            
            return(<div style={style} className={props.className}>
                <svg preserveAspectRatio="xMaxYMid" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M26 13C26 16.4478 24.6304 19.7544 22.1924 22.1924C19.7544 24.6304 16.4478 26 13 26C9.55219 26 6.24558 24.6304 3.80761 22.1924C1.36964 19.7544 0 16.4478 0 13C0 9.55219 1.36964 6.24558 3.80761 3.80761C6.24558 1.36964 9.55219 0 13 0C16.4478 0 19.7544 1.36964 22.1924 3.80761C24.6304 6.24558 26 9.55219 26 13ZM19.2628 7.88775C19.4153 7.73518 19.501 7.52826 19.501 7.3125C19.501 7.09674 19.4153 6.88982 19.2628 6.73725C19.1102 6.58468 18.9033 6.49897 18.6875 6.49897C18.4717 6.49897 18.2648 6.58468 18.1122 6.73725L13 11.8511L7.88775 6.73725C7.81221 6.66171 7.72253 6.60178 7.62382 6.5609C7.52512 6.52002 7.41933 6.49897 7.3125 6.49897C7.20567 6.49897 7.09988 6.52002 7.00118 6.5609C6.90247 6.60178 6.81279 6.66171 6.73725 6.73725C6.66171 6.81279 6.60178 6.90247 6.5609 7.00118C6.52002 7.09988 6.49897 7.20567 6.49897 7.3125C6.49897 7.41933 6.52002 7.52512 6.5609 7.62382C6.60178 7.72253 6.66171 7.81221 6.73725 7.88775L11.8511 13L6.73725 18.1122C6.58468 18.2648 6.49897 18.4717 6.49897 18.6875C6.49897 18.9033 6.58468 19.1102 6.73725 19.2628C6.88982 19.4153 7.09674 19.501 7.3125 19.501C7.52826 19.501 7.73518 19.4153 7.88775 19.2628L13 14.1489L18.1122 19.2628C18.1878 19.3383 18.2775 19.3982 18.3762 19.4391C18.4749 19.48 18.5807 19.501 18.6875 19.501C18.7943 19.501 18.9001 19.48 18.9988 19.4391C19.0975 19.3982 19.1872 19.3383 19.2628 19.2628C19.3383 19.1872 19.3982 19.0975 19.4391 18.9988C19.48 18.9001 19.501 18.7943 19.501 18.6875C19.501 18.5807 19.48 18.4749 19.4391 18.3762C19.3982 18.2775 19.3383 18.1878 19.2628 18.1122L14.1489 13L19.2628 7.88775Z" fill="#FF0000"/>
                </svg>
            </div>)
        }
        
        function OrderRow(props){
            var styles = {
                panel: {background: "#84D1FF", borderRadius: 4, color: "#056EAD"}
            }
            return (
                <div style={styles.panel} className="px-3 py-2 mb-2">
                    <div className="row fs20 fw600">
                        <div className="col-3">
                            {props.order.order_date}
                        </div>
                        <div className="col-3">
                        </div>
                        
                        <div className="col-3">
                            {props.order.owner_name}
                        </div>
                        <div className="col-3">
                            {formatter.format(props.order.total)}
                        </div>
                    </div>
                </div>
            )
        }
        
        var styles = {
            panel: {background: "#FFF", borderRadius: 10, padding: "12px 26px", maxHeight: "95vh"},
            pointer: {cursor: "pointer"},
            button: {background: "#056EAD", color: "#FFF"},
            overflow: {overflow: "hidden auto"}
        }
        
        var order_rows = []
        var filteredItems = this.props.orders
        if(![false,undefined,''].includes(this.state.search)){
            filteredItems = filteredItems.filter(c => c.owner_name && c.owner_name.toLowerCase().includes(this.state.search.toLowerCase()))
        }
        if(![false,undefined,''].includes(this.state.order_date)){
            filteredItems = filteredItems.filter(c => moment(this.state.order_date) < moment(c.order_date) && moment(this.state.order_date).add(1, 'day') > moment(c.order_date))
        }
        if(this.state.sort == "owner_name"){
            filteredItems = filteredItems.sort((a, b) => {
                if(a.owner_name < b.owner_name) { return -1; }
                if(a.owner_name > b.owner_name) { return 1; }
                return 0;
            })
        }
        const indexOfLastTodo = this.state.page * 10;
        const indexOfFirstTodo = indexOfLastTodo - 10;
        const currentItems = filteredItems.slice(indexOfFirstTodo, indexOfLastTodo)
        
        currentItems.forEach((c, index) => order_rows.push(<OrderRow key={index.toString()} order={c}/>))
        
        if(order_rows.length == 0){
            order_rows.push(
                <div className="row justify-content-center my-5" key='0'>
                    <div className="col-10 col-md-8 text-center border rounded-lg py-4">
                        <p className="mb-0 fs24md fs16 fw600 text-muted">
                            <span>Item tidak ditemukan</span>
                        </p>
                    </div>
                </div>
            )
        }
        
        return(
            <div className="menu-popup">
                <div className="container">
                    <div style={styles.panel} className="d-flex flex-column">
                        <div className="text-right">
                            <a onClick={this.props.toggleHistoryTransaction} style={styles.pointer}>
                                <CloseIcon/>
                            </a>
                        </div>
                        <div className="row my-3 mx-0">
                            <div className="col-2 ml-auto">
                                <input type="date" name="order_date" className="form-control fs12" value={this.state.order_date||""} onChange={e => this.changeOrderDate(e)}/>
                            </div>
                            <div className="col-4">
                                <input type="text" name="search" className="form-control fs12" placeholder="Search Customer" value={this.state.search} onChange={e => this.changeSearch(e)}/>
                            </div>
                            <div className="col-auto">
                                <select name="sort" className="form-control fs12" placeholder="Sort By" value={this.state.sort} onChange={e => this.changeSort(e)}>
                                    <option value="date">Tanggal</option>
                                    <option value="owner_name">Nama Pemilik</option>
                                </select>
                            </div>
                        </div>
                        <div style={styles.overflow}>
                            {order_rows}
                        </div>
                        <Pagination paginationClick={this.paginationClick} datalength={filteredItems.length} currentpage={this.state.page} itemperpage='10'/>
                    </div>
                </div>
                <div className="menu-popup-close" onClick={this.props.toggleHistoryTransaction}/>
            </div>
        )
    }
}

console.log(main)
main?ReactDOM.render(<MainPOS/>, main):false
