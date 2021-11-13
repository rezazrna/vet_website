var id = getUrlParameter('n')

class Products extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            'data': {},
            'new_tag': {},
            'loaded': false,
            'edit_mode': false,
            'show_category_detail': false,
            'readOnly': true,
            'currentUser': {}
        }
        
        this.changeInput = this.changeInput.bind(this)
        this.inputBlur = this.inputBlur.bind(this)
        this.deleteTag = this.deleteTag.bind(this)
        this.addTag = this.addTag.bind(this)
        this.navigationAction = this.navigationAction.bind(this)
        this.toggleReadOnly = this.toggleReadOnly.bind(this)
    }
    
    componentDidMount() {
        var lastfilter = JSON.parse(sessionStorage.getItem('/main/inventory/products'))
        var gr = this
        frappe.call({
            type: "GET",
            method:"vet_website.methods.get_current_user",
            args: {},
            callback: function(r){
                if (r.message) {
                    gr.setState({'currentUser': r.message});
                }
            }
        });
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetproduct.vetproduct.get_product_list",
            args: {filters: lastfilter},
            callback: function(r){
                if (r.message) {
                    var namelist = r.message.product.map(r => r.name)
                    gr.setState({'namelist': namelist});
                }
            }
        })
        var args = {}
        if(id != undefined){
            args = {name: id}
        }
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetproduct.vetproduct.get_product_form",
            args: args,
            callback: function(r){
                if (r.message) {
                    console.log(r.message)
                    var update = {'loaded': true, 'uom_list': r.message.uom_list, 'category_list': r.message.category_list, 'tag_list': r.message.tag_list, 'supplier_list': r.message.supplier_list}
                    if(r.message.product != undefined){
                        update.data = Object.assign({}, r.message.product)
                        update.original_data = Object.assign({}, r.message.product)
                        update.original_data.suppliers = r.message.product.suppliers.slice()
                        update.original_data.suppliers.push({})
                        update.original_data.tags = r.message.product.tags.slice()
                        update.data.suppliers.push({})
                        update.data.pack.push({})
                        console.log(update)
                    }
                    else {
                        update.data = {active: 1, tags: [], suppliers: [{}], pack: [{}]}
                    }
                    console.log(update)
                    gr.setState(update);
                }
            }
        });
    }
    
    navigationAction(name){
        window.location.href="/main/inventory/products/edit?n="+name
    }
    
    changeEditMode(e) {
        e.preventDefault();
        document.getElementById("product_form").reset();
        if(this.state.edit_mode){
            var data = Object.assign({}, this.state.original_data)
            this.setState({edit_mode: !this.state.edit_mode, data: data})
        }
        else{
            this.setState({edit_mode: !this.state.edit_mode})
        }
    }
    
    toggleShowCategoryDetail(){
        this.setState({show_category_detail: !this.state.show_category_detail})
    }
    
    toggleReadOnly(e){
        e.preventDefault()
        this.setState({readOnly: !this.state.readOnly})
    }
    
    changeInput(e, i=false){
        var target = e.target
        var name = target.name
        var value = target.value
        var new_data = Object.assign({}, this.state.data)
        var selected = false
        var ci = this
        
        if (['product_uom','product_category'].includes(name)) {
            if (name == 'product_uom') {
                var selectedUom = this.state.uom_list.find(i => i.uom_name == value)
                
                if (selectedUom) {
                    new_data[name] = selectedUom.name
                }
                
                this.setState({data: new_data})
            } else {
                var selectedCategory = this.state.category_list.find(i => i.category_name == value)
                
                if (selectedCategory) {
                    new_data[name] = selectedCategory.name
                }
                
                this.setState({data: new_data})
            }
        } else if (['active','is_pack'].includes(name)) {
            if(this.state.data[name]){
                new_data[name] = 0
            }
            else{
                new_data[name] = 1
            }
            this.setState({data: new_data})
        }
        else if (name == 'image') {
            var img = target.files[0];
            this.newImage(img)
        }
        else if(name == 'tags') {
            var new_tag = Object.assign({}, this.state.new_tag)
            var selectedTag = this.state.tag_list.find(i => i.label == value)
            
            if (selectedTag) {
                new_tag['tag_id'] = selectedTag.name
                new_tag['tag_label'] = selectedTag.label
            }
            
            this.setState({new_tag: new_tag})
        }
        else if (name == 'supplier') {
	        selected = this.state.supplier_list.find(i => i.supplier_name == value)
	        if (selected) {
	            frappe.call({
	                type: "GET",
	                method:"vet_website.vet_website.doctype.vetsupplier.vetsupplier.get_supplier",
	                args: {name: selected.name},
	                callback: function(r){
	                    if (r.message) {
	                        if (Object.keys(new_data.suppliers[i]).filter(n => !['supplier', 'supplier_name'].includes(n)).length === 0) {
	                            new_data.suppliers.push({})
	                        }
	                        new_data.suppliers[i].supplier_name = r.message.supplier.supplier_name
	                        new_data.suppliers[i].supplier = r.message.supplier.name
	                        ci.setState({data: new_data})
	                    }
	                }
	            });
	        }
	       // else {
	       //     new_data.suppliers[i].supplier_name = value
	       //     new_data.suppliers[i].supplier = value
	       //     this.setState({data: new_data})
	       // }
	    } else if (['min_quantity', 'purchase_price'].includes(name)) {
	        if (Object.keys(new_data.suppliers[i]).length === 0) {
                new_data.suppliers.push({})
            }
            
	        new_data.suppliers[i][name] = value
	        this.setState({data: new_data})
	    } else if (['harga_pack', 'quantity_pack'].includes(name)) {
	        if (Object.keys(new_data.pack[i]).length === 0) {
                new_data.pack.push({})
            }
            
	        new_data.pack[i][name] = value
	        this.setState({data: new_data})
	    } else{
            new_data[name] = value
            this.setState({data: new_data})
        }
    }
    
    inputBlur(e, list, i=false) {
        const value = e.target.value
        const name = e.target.name
        var new_data = Object.assign({}, this.state.data)
    	var selected = false
    	
    	if (['product_uom'].includes(name)) {
    	    list.forEach(function(item, index) {
        	    if (item.uom_name == value) {
        	        selected = true
        	    }
        	})
    	} 
    	
    	if (name == 'product_category') {
    	    list.forEach(function(item, index) {
        	    if (item.category_name == value) {
        	        selected = true
        	    }
        	})
    	} 
    	
    	if (name == 'tags') {
    	    list.forEach(function(item, index) {
        	    if (item.label == value) {
        	        selected = true
        	    }
        	})
    	}
    	
    	if (name == 'supplier') {
    	    selected = list.find(i => i.supplier_name == value)
    	}
    	
    	if (!selected) {
    		e.target.value = ''
    		if (['product_category'].includes(name)) {
        		new_data[name] = ''
    		    this.setState({data: new_data})
    		}
    		else if(name == 'tags'){
    		    this.setState({new_tag: {}})
    		}
    		else if(name == 'supplier'){
    		    delete new_data.suppliers[i].supplier
    		    delete new_data.suppliers[i].supplier_name
    		    this.setState({data: new_data})
    		}
    	}
    }
    
    formSubmit(e){
        e.preventDefault()
        var uom = this
        var method
        if(id != undefined){
            method = 'edit_product'
        }
        else{
            method = 'new_product'
        }
        var new_data = this.state.data
        new_data.pack = new_data.pack.filter(i => i.quantity_pack)
        console.log(new_data)
        frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vetproduct.vetproduct."+method,
            args: {data: new_data},
            callback: function(r){
                if (r.message) {
                    window.location.href = "/main/inventory/products/edit?n=" + encodeURIComponent(r.message.name)
                }
            }
        })
    }
    
    newImage(file) {
        var vr = this
        var new_data = Object.assign({}, this.state.data)
        var name = file.name;
        var reader = new FileReader();
        reader.onload = function(e) {
            new_data.filename = file.name,
            new_data.dataurl = reader.result
            new_data.temp_image =  URL.createObjectURL(file)
            vr.setState({'data': new_data})
        }
        reader.readAsDataURL(file);
    }
    
    addTag(e){
        var new_data = Object.assign({}, this.state.data)
        var new_tag = Object.assign({}, this.state.new_tag)
        if (e.key === 'Enter' && new_tag.tag_id) {
        	e.preventDefault();
        	new_data.tags.push(new_tag)
        	new_tag = {}
        	e.target.value = ''
        	this.setState({data: new_data, new_tag: new_tag})
        }
    }
    
    deleteTag(i){
        var new_data = Object.assign({}, this.state.data)
        if(new_data.tags[i].name != undefined){
            new_data.tags[i].delete = true
        }
        else{
            new_data.tags.splice(i, 1)
        }
        this.setState({data: new_data})
    }
    
    editCategory(data){
        var uom = this
        frappe.call({
            type: "POST",
            method:"vet_website.vet_website.doctype.vetproductcategory.vetproductcategory.edit_category",
            args: {data: data},
            callback: function(r){
                if (r.message) {
                    window.location.reload()
                }
            }
        })
    }
    
    render() {
        var panel_style = {background: '#FFFFFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', padding: '2px 32px', marginBottom: '15px'}
        var rowMinHeight = {minHeight: '60px'}
        var lineHeight_style = {lineHeight: '14px'}
        var buttonMode = []
        var color = {color: '#056EAD', cursor: 'pointer'}
        var backButton = <span className="fs16 fw600 mr-auto my-auto" style={color} onClick={() => window.location.href='/main/inventory/products'}><i className="fa fa-chevron-left mr-1" style={color}></i>Back</span>
        var cursor = {cursor: 'pointer'}
        var write = checkPermission('VetProduct', this.state.currentUser, 'write')
        
        var on_hand = (
            <div className="col-auto mr-4" style={cursor} key="on_hand" onClick={() => window.location.href = '/main/inventory/inventory?product='+this.state.data.name}>
                <div className="row mx-0">
                    <div className="col-auto px-0">
                        <img className="d-block mx-auto header-icon mt-2" src="/static/img/main/menu/product-on-hand.png"/>
                        <p className="mb-0 fs12 text-muted text-center">On Hand</p>
                    </div>
                    <div className="col-auto px-2 d-flex my-auto">
                        <span className="my-auto fs26 fw600">
                            {this.state.data.quantity}
                        </span>
                    </div>
                </div>
            </div>
        )
        
        var move = (
            <div className="col-auto mr-5" style={cursor} key="move" onClick={() => window.location.href = '/main/inventory/stock-move?product='+this.state.data.name}>
                <div className="row mx-0">
                    <div className="col-auto px-0">
                        <img className="d-block mx-auto header-icon mt-2" src="/static/img/main/menu/product-move.png"/>
                        <p className="mb-0 fs12 text-muted text-center">Move</p>
                    </div>
                </div>
            </div>
        )
        
        var purchase = (
            <div className="col-auto mr-4" style={cursor} key="purchase" onClick={() => window.location.href = '/main/purchases/purchase-order?product='+this.state.data.name}>
                <div className="row mx-0">
                    <div className="col-auto px-0">
                        <img className="d-block mx-auto header-icon mt-2" src="/static/img/main/menu/product-purchase.png"/>
                        <p className="mb-0 fs12 text-muted text-center">Purchase</p>
                    </div>
                    <div className="col-auto px-2 d-flex my-auto">
                        <span className="my-auto fs26 fw600">
                            {this.state.data.purchase_number}
                        </span>
                    </div>
                </div>
            </div>
        )
        
        var sales = (
            <div className="col-auto mr-auto" style={cursor} key="sales">
                <div className="row mx-0">
                    <div className="col-auto px-0">
                        <img className="d-block mx-auto header-icon mt-2" src="/static/img/main/menu/product-sales.png"/>
                        <p className="mb-0 fs12 text-muted text-center">Sales</p>
                    </div>
                    <div className="col-auto px-2 d-flex my-auto">
                        <span className="my-auto fs26 fw600">
                            0
                        </span>
                    </div>
                </div>
            </div>
        )
        
        if (this.state.loaded) {
            
            if(this.state.edit_mode || id == undefined){
                if(id != undefined){
                    buttonMode.push(
                        <div className="col-auto d-flex my-auto" key="0">
            				<a href="#" className="d-block btn btn-sm fs12 btn-outline-danger text-uppercase fwbold py-2 px-4" onClick={e => this.changeEditMode(e)}>Batalkan</a>
            			</div>
                    )
                }
                else {
                    buttonMode.push(
                        <div className="col-auto d-flex my-auto" key="0">
            				<a href="#" className="d-block btn btn-sm fs12 btn-outline-danger text-uppercase fwbold py-2 px-4" onClick={() => window.location.href='/main/inventory/products'}>Batalkan</a>
            			</div>
                    )
                }
                
                buttonMode.push(
                        <div className="col-auto d-flex my-auto" key="1">
            				<button type="submit" className="d-block btn btn-sm btn-danger fs12 text-uppercase fwbold py-2 px-4">Simpan</button>
            			</div>
                    )
                if(id != undefined){
                    buttonMode.push(sales,purchase,move,on_hand )
                }
            }
            else{
                if(write){buttonMode.push(<div key="3" className="col-auto d-flex my-auto"><button className="btn btn-sm btn-danger fs12 fwbold text-uppercase py-2 px-4" onClick={e => this.changeEditMode(e)} type="button">Edit</button></div>)}
                buttonMode.push(sales,purchase,move,on_hand )
            }
            buttonMode.push(<div key="999" className="col-auto d-flex mr-auto">{backButton}</div>)
            
            var category_detail
            if(this.state.show_category_detail){
                category_detail = <ProductCategoriesPopupForm data={this.state.category_list.find(c => c.name == this.state.data.product_category)} uom_list={this.state.uom_list} cancelAction={() => this.toggleShowCategoryDetail()} submitAction={(data) => this.editCategory(data)} readOnly={this.state.readOnly} toggleReadOnly={(e) => this.toggleReadOnly(e)}/>
            }
            
            return(
                <div>
                    <form id="product_form" onSubmit={(e) => this.formSubmit(e)}>
                    	<div style={panel_style}>
                    		<div className="row mx-0 flex-row-reverse" style={rowMinHeight}>
                    			{buttonMode}
                    		</div>
                    	</div>
                    	<RecordNavigation currentname={this.state.data.name} namelist={this.state.namelist} navigationAction={this.navigationAction} zero_margin={true}/>
                    	<ProductForm data={this.state.data} uom_list={this.state.uom_list} category_list={this.state.category_list} supplier_list={this.state.supplier_list} tag_list={this.state.tag_list} new_tag={this.state.new_tag} edit_mode={this.state.edit_mode} changeInput={this.changeInput} inputBlur={this.inputBlur} addTag={this.addTag} deleteTag={this.deleteTag} toggleShowCategoryDetail={() => this.toggleShowCategoryDetail()} show_category_detail={this.state.show_category_detail}/>
                    </form>
                    {category_detail}
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

class ProductForm extends React.Component {
    clickFile(){
        var edit_mode = this.props.data.name == undefined || this.props.edit_mode
        if(this.$file != undefined && edit_mode){
            var file = this.$file
            $(file).trigger('click');
        }
    }
    
    render(){
        var data = this.props.data
        var uom_list = this.props.uom_list
        var category_list = this.props.category_list
        var tag_list = this.props.tag_list
        var new_tag = this.props.new_tag
        var panel_style = {background: '#FFFFFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', padding: '35px 50px', marginBottom: '15px', minHeight: 'calc(100vh - 180px)'}
        var div_image_style = {position: 'relative', width: '100px', paddingTop: '100%', background: '#F1F1F1', filter: 'drop-shadow(0px 2px 15px rgba(0, 0, 0, 0.15))', backgroundImage: "url('/static/img/main/menu/product-no-image.png')", backgroundPosition: 'center', backgroundRepeat: 'no-repeat'}
        var color = {color: '#056EAD'}
        var cursor = {cursor: 'pointer'}
        var input_style = {background: '#CEEDFF', color: '#056EAD'}
        
        var image
        if(data != undefined && (data.image != undefined || data.temp_image != undefined)){
            var image_style = {position: 'absolute', top: 0, left: 0, objectFit: 'cover', height: '100%'}
            image = <img src={data.image || data.temp_image} style={image_style}/>
        }
        
        var uom_options = []
        if (id == undefined) {
            uom_list.forEach((l, index) => uom_options.push(<option value={l.uom_name} key={l.name} />))
        } else {
            var selected_uom = uom_list.find(i => i.name == data.product_uom)
            var uom_master
            if (selected_uom.unit_master == undefined) {
                uom_master = uom_list.filter(i => i.unit_master == data.product_uom || i.name == data.product_uom)
            } else {
                uom_master = uom_list.filter(i => i.unit_master == selected_uom.unit_master || i.name == selected_uom.unit_master)
            }
            
            console.log(uom_master)
            
            uom_master.forEach((l, index) => uom_options.push(<option value={l.uom_name} key={l.name} />))
        }
        
        var category_options = []
        if(category_list.length != 0){
            category_list.forEach((l, index) => category_options.push(<option value={l.category_name} key={l.name} />))
        }
        
        var tag_options = []
        if(tag_list.length != 0){
            var tag_map = data.tags.filter(t => !t.delete).map(t => t.tag_id)
            tag_list.filter(t => !tag_map.includes(t.name)).forEach((l, index) => tag_options.push(<option value={l.label} key={l.name} />))
        }
        
        var uom_datalist = (
            <datalist id="uom">
                {uom_options}
            </datalist>
        )
        
        var category_datalist = (
            <datalist id="category">
                {category_options}
            </datalist>
        )
        
        var tag_datalist = (
            <datalist id="tags">
                {tag_options}
            </datalist>
        )
        
        var default_product_uom = uom_list.filter(u => u.name == data.product_uom)
        if(default_product_uom.length != 0){
            default_product_uom = default_product_uom[0].uom_name
        }
        var default_product_category = category_list.filter(c => c.name == data.product_category)
        if(default_product_category.length != 0){
            default_product_category = default_product_category[0].category_name
        }
        
        var edit_mode = this.props.data.name == undefined || this.props.edit_mode
        var product_name, product_uom, price, barcode, default_code, product_category, tags, category_link, quantity_pack, harga_pack
        if (edit_mode) {
            div_image_style.cursor = 'pointer'
            product_name = <input required type="text" name="product_name" id="product_name" autoComplete="off" placeholder="Product Name" className="form-control fs20 fwbold px-0 py-1 h-auto border-0" value={data.product_name||''} style={input_style} onChange={e => this.props.changeInput(e)}/>
            if (this.props.data.name == undefined) {
                product_uom = <input required type="text" name="product_uom" id="product_uom" autoComplete="off" placeholder="Unit Of Measurement" className="form-control fs14 p-0 h-auto" list="uom" defaultValue={default_product_uom||''} onChange={e => this.props.changeInput(e)} onBlur={e => this.props.inputBlur(e, uom_list)}/>
            } else {
                product_uom = <span className="d-block fw600">{default_product_uom||'Product UOM'}</span>
            }
            price = <input required type="text" name="price" id="price" autoComplete="off" placeholder="Sale Price" className="form-control fs14 p-0 h-auto" value={data.price||''} onChange={e => this.props.changeInput(e)}/>
            barcode = <input type="text" name="barcode" id="barcode" autoComplete="off" placeholder="Barcode" className="form-control fs14 p-0 h-auto" value={data.barcode||''} onChange={e => this.props.changeInput(e)}/>
            default_code = !data.name?<input required type="text" name="default_code" id="default_code" autoComplete="off" placeholder="Default Code" className="form-control fs14 p-0 h-auto" value={data.default_code||''} onChange={e => this.props.changeInput(e)}/>:<span className="d-block fw600">{data.default_code||'Internal Reference'}</span>
            product_category = <input required type="text" name="product_category" id="product_category" autoComplete="off" placeholder="Product Category" className="form-control fs14 p-0 h-auto" list="category" defaultValue={default_product_category||''} onChange={e => this.props.changeInput(e)} onBlur={e => this.props.inputBlur(e, category_list)}/>
            tags = <input type="text" name="tags" id="tags" autoComplete="off" placeholder="Tags" className="form-control fs14 p-0 h-auto" list="tags" defaultValue={new_tag.tag_id||''} onChange={e => this.props.changeInput(e)} onBlur={e => this.props.inputBlur(e, tag_list)} onKeyDown={e => this.props.addTag(e)}/>
            quantity_pack = <input type="text" name="quantity_pack" id="quantity_pack" className="form-control fs14 p-0 h-auto" value={data.quantity_pack||''} onChange={e => this.props.changeInput(e)}/>
            harga_pack = <input type="text" name="harga_pack" id="harga_pack" className="form-control fs14 p-0 h-auto" value={data.harga_pack||''} onChange={e => this.props.changeInput(e)}/>
        } else {
            product_name = <span className="fs20 fwbold text-uppercase d-block" style={color}>{data.product_name||'Product Name'}</span>
            product_uom = <span className="d-block fw600">{default_product_uom||'Product UOM'}</span>
            price = <span className="d-block fw600">{formatter.format(data.price)||formatter.format(0)}</span>
            barcode = <span className="d-block fw600">{data.barcode}</span>
            default_code = <span className="d-block fw600">{data.default_code||'Internal Reference'}</span>
            product_category = <span className="fw600">{default_product_category||'Product Category'}</span>
            category_link = (
                <span className="mx-3" style={cursor} onClick={this.props.toggleShowCategoryDetail}>
	                <img src="/static/img/main/menu/tautan.png"/>
	            </span>
            )
        }
        
        var product_tags = []
        data.tags.forEach((t, index) => {
            if(!t.delete){
                product_tags.push(<ProductTag key={t.name||index.toString()} label={t.tag_label} edit_mode={edit_mode} deleteAction={() => this.props.deleteTag(index.toString())}/>)
            }
        })
        
        return(
            <div style={panel_style}>
                {uom_datalist}
                {category_datalist}
                {tag_datalist}
                <div className="row mb-5">
                    <div className="col-auto">
                        <input type="file" className="d-none" accept="image/*" name="image" onChange={e => this.props.changeInput(e)} ref={(ref) => this.$file = ref}/>
                        <div style={div_image_style} onClick={() => this.clickFile()}>
                            {image}
                        </div>
                    </div>
                    <div className="col">
                        <div className="row mb-4">
                            <div className="col-4 pb-4">
                                {product_name}
                            </div>
                            <div className="col-8">
                                <div className="row">
                                    <div className="col-4 offset-8 mb-2">
                                        {tags}
                                    </div>
                                    <div className="col-auto ml-auto">
                                        {product_tags}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row" style={color}>
                            <div className="col-6">
                                <div className="form-row mx-0">
                                    <label htmlFor="product_uom" className="fw600 col-5">Unit Of Measurement</label>
                                    <div className="col-6">
                                        {product_uom}
                                    </div>
                                </div>
                                <div className="form-row mx-0">
                                    <label htmlFor="price" className="fw600 col-5">Sale Price</label>
                                    <div className="col-6">
                                        {price}
                                    </div>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="form-row mx-0">
                                    <label htmlFor="active" className="fw600 col-5">Active</label>
                                    <div className="col-6">
                                        <input type="checkbox" className="my-auto mr-auto" name="active" id="active" disabled={!edit_mode} checked={data.active == 1} onChange={e => this.props.changeInput(e)}/>
                                    </div>
                                </div>
                                <div className="form-row mx-0">
                                    <label htmlFor="barcode" className="fw600 col-5">EAN13 Barcode</label>
                                    <div className="col-6">
                                        {barcode}
                                    </div>
                                </div>
                                <div className="form-row mx-0">
                                    <label htmlFor="default_code" className="fw600 col-5">Internal Reference</label>
                                    <div className="col-6">
                                        {default_code}
                                    </div>
                                </div>
                                <div className="form-row mx-0">
                                    <label htmlFor="product_category" className="fw600 col-5">Category</label>
                                    <div className="col-6">
                                        {product_category}{category_link}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-6">
                        <ProductSupplierList supplier_list={this.props.supplier_list} list={data.suppliers} edit_mode={edit_mode} changeInput={this.props.changeInput} inputBlur={this.props.inputBlur}/>
                    </div>
                    <div className="col-6">
                        <ProductPack list={data.pack} edit_mode={edit_mode} changeInput={this.props.changeInput} />
                    </div>
                </div>
            </div>
        )
    }
}

class ProductPack extends React.Component {
    render() {
        var list = this.props.list
        var rows = []
        
        var rendered_list = []
        if (this.props.edit_mode) {
            rendered_list = list
        } else {
            rendered_list = list.filter(i => i.quantity_pack)
        }
        
        if (rendered_list.length != 0){
            var sl = this
            var bgStyle = {background: '#F5FBFF'}
            rendered_list.forEach(function(l, index){
                var required = false
                if(Object.keys(l).filter(n => !['quantity_pack', 'harga_pack'].includes(n)).length != 0){
                    required = true
                }
                
                var quantity_pack = <span className="my-auto">{l.quantity_pack||''}</span>
                var harga_pack = <span className="my-auto">{l.harga_pack||''}</span>
                
                if (sl.props.edit_mode) {
                    quantity_pack = <input required={required} autoComplete="off" placeholder="0" name='quantity_pack' id="quantity_pack" style={bgStyle} className="form-control border-0 fs14 fw600 px-0 text-center" onChange={e => sl.props.changeInput(e, index)} defaultValue={l.quantity_pack||''}/>
                    harga_pack = <input required={required} autoComplete="off" placeholder="0" name='harga_pack' id="harga_pack" style={bgStyle} className="form-control border-0 fs14 fw600 px-0 text-center" onChange={e => sl.props.changeInput(e, index)} defaultValue={l.harga_pack||''}/>
                }
                
                
                rows.push(
                    <div className="row mx-0" key={index.toString()}>
                		<div className="col row-list" style={bgStyle}>
                			<div className="row mx-0 fs12 fw600">
                				<div className="col-6 text-center">
                					{quantity_pack}
                				</div>
                				<div className="col-6 text-center">
                					{harga_pack}
                				</div>
                			</div>
                		</div>
                	</div>
                )
            })
        } else {
            rows = (
                <div className="row justify-content-center" key='0'>
                    <div className="col-12">
                        <div className="text-center border rounded-lg py-4">
                            <p className="mb-0 fs24md fs16 fw600 text-muted">
                                <span>Item tidak ditemukan</span>
                            </p>
                        </div>
                    </div>
                </div>
            )
        }
        
        return(
            <div>
    			<div className="row mx-0 fs12 fw600 row-header">
    				<div className="col-6 text-center">
    					<span className="my-auto">Quantity</span>
    				</div>
    				<div className="col-6 text-center">
    					<span className="my-auto">Harga</span>
    				</div>
    			</div>
    			{rows}
    		</div>
        )
    }
}

class ProductSupplierList extends React.Component {
    render() {
        var list = this.props.list
        var supplier_list = this.props.supplier_list
        var rows = []
        
        var supplier_options = []
        if(supplier_list.length != 0){
            supplier_list.forEach((l, index) => supplier_options.push(<option value={l.supplier_name} key={l.name} />))
        }
        var supplier_datalist = (
            <datalist id="supplier">
                {supplier_options}
            </datalist>
        )
        
        var rendered_list = []
        
        if (this.props.edit_mode) {
            rendered_list = list
        } else {
            rendered_list = list.filter(i => i.supplier_name)
        }
        
        if (rendered_list.length != 0){
            var sl = this
            rendered_list.forEach(function(l, index){
                rows.push(
                    <ProductSupplierListRow key={index.toString()} item={l} edit_mode={sl.props.edit_mode} changeInput={e => sl.props.changeInput(e, index.toString())} inputBlur={e => sl.props.inputBlur(e, supplier_list, index.toString())}/>
                )
            })
        }
        else{
            rows = (
                <div className="row justify-content-center" key='0'>
                    <div className="col-12">
                        <div className="text-center border rounded-lg py-4">
                            <p className="mb-0 fs24md fs16 fw600 text-muted">
                                <span>Item tidak ditemukan</span>
                            </p>
                        </div>
                    </div>
                </div>
            )
        }
        return(
            <div>
                {supplier_datalist}
    			<div className="row mx-0 fs12 fw600 row-header">
    				<div className="col-6">
    					<span className="my-auto">Supplier</span>
    				</div>
    				<div className="col-3 text-center">
    					<span className="my-auto">Minimal Quantity</span>
    				</div>
    				<div className="col-3 text-center">
    					<span className="my-auto">Purchase Price</span>
    				</div>
    			</div>
    			{rows}
    		</div>
        )
    }
}

class ProductSupplierListRow extends React.Component {
    render() {
        var bgStyle = {background: '#F5FBFF'}
        var item = this.props.item
        var supplier, min_quantity, purchase_price
        var edit_mode = this.props.edit_mode
        var required = false
        if(Object.keys(item).filter(n => !['supplier', 'supplier_name'].includes(n)).length != 0){
            required = true
        }
        
        
        if(edit_mode){
            supplier = <input required={required} autoComplete="off" placeholder="Supplier" name='supplier' list="supplier" id="supplier" style={bgStyle} className="form-control border-0 fs14 fw600 px-0" onChange={this.props.changeInput} onBlur={this.props.inputBlur} defaultValue={item.supplier_name||item.supplier_label||item.supplier||''}/>
            min_quantity = <input required={required} autoComplete="off" placeholder="0" name='min_quantity' id="min_quantity" style={bgStyle} className="form-control border-0 fs14 fw600 px-0 text-center" onChange={this.props.changeInput} defaultValue={item.min_quantity||''}/>
            purchase_price = <input required={required} autoComplete="off" placeholder="0" name='purchase_price' id="purchase_price" style={bgStyle} className="form-control border-0 fs14 fw600 px-0 text-center" onChange={this.props.changeInput} defaultValue={item.purchase_price||''}/>
        }
        else {
            supplier = <span className="my-auto">{item.supplier_name||item.supplier}</span>
            min_quantity = <span className="my-auto">{item.min_quantity}</span>
            purchase_price = <span className="my-auto">{item.purchase_price}</span>
        }
        
        return(
            <div className="row mx-0">
        		<div className="col row-list" style={bgStyle}>
        			<div className="row mx-0 fs12 fw600">
        				<div className="col-6">
        					{supplier}
        				</div>
        				<div className="col-3 text-center">
        					{min_quantity}
        				</div>
        				<div className="col-3 text-center">
        					{purchase_price}
        				</div>
        			</div>
        		</div>
        	</div>
        )
    }
}

class ProductTag extends React.Component {
    render(){
        var tag_style = {background: '#056EAD', borderRadius: '3px', color: '#FFF'}
        var cursor = {cursor: 'pointer'}
        var delete_button
        if(this.props.edit_mode){
            delete_button = <i className="fa fa-trash ml-2" style={cursor} onClick={this.props.deleteAction}/>
        }
        else{
            tag_style.cursor= 'pointer'
        }
        return(
            <span className="p-1 mx-1 fs12 mb-1" style={tag_style}>
                #{this.props.label}{delete_button}
            </span>
        )
    }
}

ReactDOM.render(<Products />, document.getElementById('products_form'))