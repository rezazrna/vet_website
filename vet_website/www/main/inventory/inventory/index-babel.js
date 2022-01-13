var gudang = getUrlParameter('gudang') || false
var product = getUrlParameter('product') || false
class Inventory extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': [],
            'loaded': false,
            'valuation': this.props.valuation || false,
            'currentpage': 1,
            'datalength': 0,
        }
        this.inventorySearch = this.inventorySearch.bind(this);
        this.toggleShowQuantityGroup = this.toggleShowQuantityGroup.bind(this)
        this.paginationClick = this.paginationClick.bind(this);
    }
    
    componentDidMount() {
        var td = this
        var valuation
        var args = {group_by: 'product'}
        if(gudang){
            args.gudang = gudang
        }
        if(product){
            args.product = product
        }
        if(this.props.valuation){
            valuation = true
        }

        args['filters'] = []

        sessionStorage.setItem(window.location.pathname, JSON.stringify(args))

        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetproductquantity.vetproductquantity.get_quantity_list",
            args: {filters: args, valuation: valuation},
            callback: function(r){
                if (r.message) {
                    console.log(r.message)
                    td.setState({'data': r.message.product_quantity, 'loaded': true, 'datalength': r.message.datalength});
                }
            }
        });
    }
    
    paginationClick(number) {
        var po = this
        var filters = JSON.parse(sessionStorage.getItem(window.location.pathname))
        var valuation

        if(this.props.valuation){
            valuation = true
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
                method:"vet_website.vet_website.doctype.vetproductquantity.vetproductquantity.get_quantity_list",
                args: {filters: filters, valuation: valuation},
                callback: function(r){
                    if (r.message) {
                        console.log(r.message)
                        po.setState({'data': r.message.product_quantity, 'loaded': true, 'datalength': r.message.datalength});
                    }
                }
            });
        // }
    }
    
    inventorySearch(filters) {
        var td = this
        var valuation
        filters.group_by = 'product'
        if(gudang){
            filters.gudang = gudang
        }
        if(this.state.valuation){
            valuation = true
        }

        this.setState({
            currentpage: 1,
            loaded: false,
          });

        filters['currentpage'] = 1

        sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))

        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetproductquantity.vetproductquantity.get_quantity_list",
            args: {filters: filters, valuation: valuation},
            callback: function(r){
                if (r.message) {
                    td.setState({'data': r.message.product_quantity, 'datalength': r.message.datalength, 'loaded': true});
                }
            }
        });
    }
    
    showQuantityGroup(i) {
        var td = this
        var new_data = this.state.data.slice()
        var filters = {product: this.state.data[i].product.name, group_by: 'gudang'}
        if(gudang){
            filters.gudang = gudang
        }
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetproductquantity.vetproductquantity.get_quantity_list",
            args: {filters: filters},
            callback: function(r){
                if (r.message) {
                    console.log(r.message);
                    if(r.message.product_quantity.length != 0){
                        new_data[i].quantity_group = r.message.product_quantity
                    }
                    td.setState({'data': new_data});
                }
            }
        });
    }
    
    toggleShowQuantityGroup(i){
        var new_data = this.state.data.slice()
        var value = false
        if([undefined, false].includes(new_data[i].show_group)){
            value = true
            this.showQuantityGroup(i)
        }
        var new_data = this.state.data.slice()
        new_data[i].show_group = value
        this.setState({data: new_data})
    }
    
    printPDF() {
        var pdfid = 'pdf'
        var format = [559,794]
        var th = this
        // var doc = new jsPDF({
        //     orientation: 'p',
        //     unit: 'pt',
        //     format: format,
        // });
        var source = document.getElementById(pdfid)
        var opt = {
            margin: [10, 0, 10, 0],
            filename: "Inventory-"+moment().format('MM-YYYY')+".pdf",
            pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', '.row'] },
            html2canvas: {scale: 3},
            jsPDF: {orientation: 'p', unit: 'pt', format: [559*0.754,794*0.754]}
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
        
        var sorts = [
    					{'label': 'Product Name DESC', 'value': 'product_name desc'},
    					{'label': 'Product ASC', 'value': 'product_name asc'},
    					{'label': 'Quantity DESC', 'value': 'quantity desc'},
    					{'label': 'Quantity ASC', 'value': 'quantity asc'},
					]
					
		var field_list = [
		                {'label': 'Product Name', 'field': 'product_name', 'type': 'char'},
		                {'label': 'Quantity', 'field': 'quantity', 'type': 'char'},
		                {'label': 'Gudang Name', 'field': 'gudang_name', 'type': 'char'},
		                {'label': 'Inventory Value', 'field': 'inventory_value', 'type': 'char'}
		            ]
		
		var row_style2 = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '2px', 'marginBottom': '18px', 'height': '72px'}
		var color = {color: '#056EAD', cursor: 'pointer'}
		var cursor = {cursor: 'pointer'}
        var back_button, print_button, pdf
        if(document.referrer.includes('/main/inventory/warehouse') || document.referrer.includes('/main/inventory/products/edit?n='+product)){
            back_button = <span className="fs16 fw600 mr-auto my-auto" style={color} onClick={() => {history.back()}}><i className="fa fa-chevron-left mr-1" style={color}></i>Back</span>
        }
        
        var product_info, col_class
        if(!this.state.valuation){
            product_info = (
                <div className="col-auto ml-auto" style={cursor} key="product-info" onClick={() => window.location.pathname = "/main/inventory/products"}>
                    <div className="row mx-0">
                        <div className="col-auto px-0">
                            <img className="d-block mx-auto header-icon mt-2" src="/static/img/main/menu/product-info.png"/>
                            <p className="mb-0 fs12 text-muted text-center">Informasi Produk</p>
                        </div>
                    </div>
                </div>
            )
        }
        else {
            col_class = "ml-auto"
        }
        
        if(!product){
            print_button = <button type="button" className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={() => this.printPDF()}>Print</button>
            pdf = <PDF data={this.state.data} valuation={this.props.valuation} currentpage={this.state.currentpage}/>
        }
        
        if (this.state.loaded){
            return(
                <div>
                    <div className="row mx-0" style={row_style2}>
                        <div className="col-auto my-auto">
                            {back_button}
                            {print_button}
                        </div>
                        {product_info}
                        <div className={"col-6 my-auto "+col_class}>
                            <Filter sorts={sorts} searchAction={this.inventorySearch} field_list={field_list} filters={JSON.parse(sessionStorage.getItem(window.location.pathname))}/>
                        </div>
                    </div>
                    <InventoryList items={this.state.data} valuation={this.state.valuation} toggleShowQuantityGroup={this.toggleShowQuantityGroup} paginationClick={this.paginationClick} currentpage={this.state.currentpage} datalength={this.state.datalength}/>
                    {pdf}
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

class InventoryList extends React.Component {
    render() {
        var rows = []
        var panel_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px'}
        var items = this.props.items
        
        if (items.length != 0 ){
            var list = this
            // const indexOfLastTodo = this.props.currentpage * 30;
            // const indexOfFirstTodo = indexOfLastTodo - 30;
            // const currentItems = this.props.items.slice(indexOfFirstTodo, indexOfLastTodo)
            
            items.forEach(function(item, index){
                // if (currentItems.includes(item)){
                    rows.push(
                        <InventoryListRow valuation={list.props.valuation} key={index.toString()} item={item} toggleShowQuantityGroup={() => list.props.toggleShowQuantityGroup(index.toString())}/>
                    )
                // }
            })
            
            return(
                <div style={panel_style}>
                	{rows}
                	<Pagination paginationClick={this.props.paginationClick} datalength={this.props.datalength} currentpage={this.props.currentpage} itemperpage='10'/>
                </div>
            )
        }
        else {
            return(
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

class InventoryListRow extends React.Component {
    render() {
        var row_style = {color: '#056EAD', background: '#84D1FF', 'boxShadow': '0px 6px 23px rgba(0, 0, 0, 0.1)', borderRadius: '5px'}
        var detail_style = {background: '#F5FBFF', padding: '20px 0'}
        var cursor = {cursor: 'pointer'}
        var empty_width = {width: '14px'}
        var color = {color: '#056EAD'}
        var color2 = {color: '#787E84'}
        var quantity_list_group_style = {background: '#D2EEFF', padding: '14px 7px', margin: '10px 15px'}
        var item = this.props.item
        var chevron_class = "fa fa-chevron-down my-auto"
        var quantity_group
        var total_valuation, total_valuation_col
        if(item.show_group){
            var rows = []
            var purchase_rows = []
            var quantity_list_header, quantity_list_group
            chevron_class = "fa fa-chevron-up my-auto"
            if(item.quantity_group != undefined){
                item.quantity_group.forEach((i, index) => rows.push(<InventoryQuantityRow item={i} key={index.toString()}/>))
            }
            if(item.purchase_list != undefined && item.purchase_list.length != 0){
                item.purchase_list.sort((a,b) => {return moment(a.creation).format('YYYY-MM-DD HH-mm-ss') > moment(b.creation).format('YYYY-MM-DD HH-mm-ss')}).forEach((q, index) => purchase_rows.push(<InventoryQuantityMoveRow item={q} key={index.toString()}/>))
                quantity_list_header = (
                    <div className="row mx-0 my-1 fw600 justify-content-end">
                        <div className="col">
                            <span style={color}>Valuation</span>
                        </div>
                        <div className="col-2 text-right">
                            <span>Purchase Date</span>
                        </div>
                        <div className="col-2 text-right">
                            <span>Value per Unit</span>
                        </div>
                        <div className="col-2 text-right">
                            <span>Product Quantity</span>
                        </div>
                        <div className="col-2 text-right">
                            <span>Total Value</span>
                        </div>
                        <div className="col-auto d-flex">
        				    <div style={empty_width}/>
        				</div>
        			</div>
                )
                quantity_list_group = (
                    <div style={quantity_list_group_style}>
                        {quantity_list_header}
                        {purchase_rows}
                    </div>
                )
            }
            quantity_group = (
                <div style={detail_style}>
                    {rows}
                    {quantity_list_group}
                </div>
            )
        }
        
        if(item.purchase_list != undefined && item.purchase_list.length != 0){
            total_valuation = item.purchase_list.map(pl => pl.quantity_stocked*pl.price).reduce((a,b) => a+b, 0)
            total_valuation_col = (
                <div className="col-2 d-flex mr-3">
					<span className="ml-auto my-auto">{formatter2.format(total_valuation)}</span>
				</div>
            )
        }
        
        var barcode
        if(!this.props.valuation){
            barcode = (
                <div className="col text-center">
					<p className="bg-white mb-0 rounded-lg px-2 py-1 text-truncate">{item.product.barcode||item.product.default_code||'\xa0'}</p>
				</div>
            )
        }
        
        return(
            <div className="mb-2">
    			<div className="row mx-0 fs14 fw600 py-2" style={row_style}>
    			    {barcode}
    				<div className="col-7 d-flex">
    					<span className="my-auto">{item.product.product_name}</span>
    				</div>
    				<div className="col d-flex">
    					<span className="ml-auto my-auto">{formatter2.format(item.quantity)}</span>
    				</div>
    				{total_valuation_col}
    				<div className="col-auto d-flex">
    				    <i className={chevron_class} style={cursor} onClick={this.props.toggleShowQuantityGroup}/>
    				</div>
    			</div>
    			{quantity_group}
			</div>
        )
    }
}

class InventoryQuantityRow extends React.Component {
    render(){
        var span_width = {width: '14px'}
        var color = {color: '#056EAD'}
        var item = this.props.item
        
        var quantity_list
        // var quantities = []
        // if(item.quantity_list != undefined && item.quantity_list.length != 0){
        //     var color2 = {color: '#787E84'}
        //     var empty_width_style = {width: '14px'}
        //     item.quantity_list.forEach((m, index) => quantities.push(<InventoryQuantityMoveRow item={m} key={index.toString()}/>))
        //     quantity_list = (
        //         <div className="col-12 my-1">
        //             <div className="row my-1 fw600 justify-content-end" style={color2}>
        //                 <div className="col-2 text-right">
        //                     <span>Product Quantity</span>
        //                 </div>
        //                 <div className="col-2 text-right">
        //                     <span>Value per Unit</span>
        //                 </div>
        //                 <div className="col-2 text-right">
        //                     <span>Total Value</span>
        //                 </div>
        //                 <div className="col-auto d-flex">
        // 				    <div style={empty_width_style}/>
        // 				</div>
        //             </div>
        //             {quantities}
        //         </div>
        //     )
        // }
        
        return(
            <div className="row mx-0 fw600" style={color}>
                <div className="col-8">
                    <span>{item.gudang_name}</span>
                </div>
                <div className="col text-right">
                    <span>{item.quantity}</span>
                </div>
                <div className="col-auto">
                    <p className="mb-0" style={span_width}/>
                </div>
                {quantity_list}
            </div>
        )
    }
}

class InventoryQuantityMoveRow extends React.Component {
    render(){
        var span_width = {width: '14px'}
        var color = {color: '#787E84'}
        var item = this.props.item
        var moment_date = moment(item.date)
        var empty_width_style = {width: '14px'}
        var quantity = item.quantity_stocked||item.quantity_receive||0
        var moment_date = moment(item.creation)
        return(
            <div className="row mx-0 fwnormal justify-content-end" style={color}>
                <div className="col-2 text-right">
                    <span>{moment_date.format('DD-MM-YYYY')}</span>
                </div>
                <div className="col-2 text-right">
                    <span>{formatter2.format(item.price)}</span>
                </div>
                <div className="col-2 text-right">
                    <span>{quantity+" "+item.uom_name}</span>
                </div>
                <div className="col-2 text-right">
                    <span>{formatter2.format(item.price*quantity)}</span>
                </div>
                <div className="col-auto d-flex">
				    <div style={empty_width_style}/>
				</div>
            </div>
        )
    }
}

class PDF extends React.Component{
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
            method:"vet_website.vet_website.doctype.vetprofile.vetprofile.get_profile",
            args: {},
            callback: function(r){
                if (r.message) {
                    ci.setState({'profile': r.message.profile, 'loaded': true});
                }
            }
        });
    }

    render(){
        var data = this.props.data
        var profile = this.state.profile
        var valuation = this.props.valuation
        console.log(data)
        var page_dimension = {width: 559, minHeight: 794, top:0, right: 0, background: '#FFF', color: '#000', zIndex: -1}
        var borderStyle = {border: '1px solid #000', margin: '15px 0'}
        var row2 = {margin: '0 -14px'}
        var th = {border: '1px solid #000'}
        var td = {borderLeft: '1px solid #000', borderRight: '1px solid #000'}
        var fs13 = {fontSize: 13}
        var fs9 = {fontSize: 9}
        var invoice = {letterSpacing: 0, lineHeight: '24px', marginBottom: 0, marginTop: 18}
        var invoice2 = {letterSpacing: 0}
        var thead = {background: '#d9d9d9', fontSize: 11}
        var table_rows = []
        
        // const indexOfLastTodo = this.props.currentpage * 30;
        // const indexOfFirstTodo = indexOfLastTodo - 30;
        // const currentItems = data.slice(indexOfFirstTodo, indexOfLastTodo)
        // currentItems = data.slice(0,30)
        data.forEach((d, index) => {
            if(valuation){
                var first = true
                if(d.purchase_list != undefined && d.purchase_list.length != 0){
                    d.purchase_list.sort((a,b) => {return moment(a.creation).format('YYYY-MM-DD HH-mm-ss') > moment(b.creation).format('YYYY-MM-DD HH-mm-ss')}).forEach(pl => {
                        var quantity = pl.quantity_stocked||pl.quantity_receive||0
                        table_rows.push(
                            <tr key={pl.name} style={fs9} className="text-center">
                                <td className="py-1">{first?d.product.product_name:''}</td>
                                <td className="py-1">{moment(pl.creation).format('DD-MM-YYYY')}</td>
                                <td className="py-1">{formatter.format(pl.price)}</td>
                                <td className="py-1">{formatter2.format(quantity)}</td>
                                <td className="py-1">{formatter.format(pl.price*quantity)}</td>
                            </tr>
                        )
                    })
                }
            } else {
                table_rows.push(
                    <tr key={d.name} style={fs9} className="text-center">
                        <td className="py-1">{d.product.barcode||d.product.default_code}</td>
                        <td className="py-1">{d.product.product_name}</td>
                        <td className="py-1">{formatter2.format(d.quantity)}</td>
                    </tr>
                )
            }
        })
        
        var thead_row = (
            <tr className="text-center">
	            <th className="fw700 py-2" width="100px">Kode</th>
	            <th className="fw700 py-2" width="400px" >Product</th>
	            <th className="fw700 py-2" width="59px" >Qty</th>
	        </tr>
        )
        
        if(valuation){
            thead_row = (
                <tr className="text-center">
                    <th className="fw700 py-2" width="231px" >Product</th>
    	            <th className="fw700 py-2" width="82px">Purchase Date</th>
    	            <th className="fw700 py-2" width="82px">Value per Unit</th>
    	            <th className="fw700 py-2" width="82px" >Product Qty</th>
    	            <th className="fw700 py-2" width="82px" >Total Value</th>
    	        </tr>
            )
        }

        if (this.state.loaded) {
            var image
            if (profile.image != undefined){
                var image_style = {position: 'absolute', top: 0, left: 0, objectFit: 'cover', height: '100%'}
                image = <img src={profile.temp_image || profile.image} style={image_style}/>
            } else {
                image = <img src={profile.temp_image} style={image_style} />
            }

            return(
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
                                <p className="fwbold text-right text-uppercase fs28" style={invoice}>Inventory</p>
                                {/*<p className="fw600 text-right text-uppercase fs14" style={invoice2}>{moment().format("MM/YYYY")}</p>*/}
                            </div>
                            <div className="col-12" style={borderStyle}/>
                        </div>
                        <table className="fs12" style={row2}>
                            <thead className="text-uppercase" style={thead}>
                                {thead_row}
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

var inventory_list = document.getElementById('inventory_list')
if(inventory_list != undefined){
    ReactDOM.render(<Inventory />, inventory_list)
}

var valuation_list = document.getElementById('valuation_list')
if(valuation_list != undefined){
    ReactDOM.render(<Inventory valuation={true}/>, valuation_list)
}