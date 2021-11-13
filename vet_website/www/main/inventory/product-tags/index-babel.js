class ProductTags extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': [],
            'loaded': false,
            'show_delete': false,
            'filters': {search: []},
            'tambah': false
        }
        
        this.productTagsSearch = this.productTagsSearch.bind(this);
        this.checkRow = this.checkRow.bind(this);
        this.deleteRow = this.deleteRow.bind(this);
        this.removeFromList = this.removeFromList.bind(this);
        this.toggleTambah = this.toggleTambah.bind(this);
    }
    
    componentDidMount() {
        var po = this
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetproducttags.vetproducttags.get_all_tags",
            args: {},
            callback: function(r){
                if (r.message) {
                    console.log(r.message);
                    po.setState({'tag_list': r.message, 'loaded': true});
                }
            }
        });
    }
    
    productTagsSearch(filters, search=false) {
        var po = this
        var filter = this.state.filters
        var realFilter
        
        if (search) {
            filter.search.push(filters.search)
            this.setState({filters: filter})
            
            realFilter = filter
        } else {
            if (filter.search) {
                filters.search = filter.search
            }
            this.setState({filters: filters})
            
            realFilter = filters
        }
        
        var new_data = this.state.data.slice()
        
        console.log(realFilter)
        
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetproducttags.vetproducttags.get_product_tags_list",
            args: {filters: realFilter},
            callback: function(r){
                if (r.message) {
                    console.log(r.message, 'inini');
                    r.message.forEach(m => {
                        if(!new_data.map(d => d.name).includes(m.name)){
                            new_data.push(m)
                        } else {
                            var index = new_data.findIndex(i => i.name == m.name)
                            new_data[index] = m
                        }
                    })
                    po.setState({'data': new_data, 'filter': true,});
                }
            }
        });
    }
    
    deleteRow(e) {
        e.preventDefault();
        var po = this
        var delete_data = this.state.data.filter((d) => d.checked)
        var delete_data_names = delete_data.map((d) => d.name)
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetproducttags.vetproducttags.delete_producttags",
            args: {data: delete_data_names},
            callback: function(r){
                if (r.message.success) {
                    var new_data = po.state.data.filter((d => !d.checked))
                    po.setState({data: new_data, check_all: false, show_delete: false});
                }
            }
        });
    }
    
    checkRow(i) {
        var new_data = this.state.data.slice()
        if(!new_data[i].checked){
            new_data[i].checked = true
            this.setState({data: new_data})
        }
        else {
            new_data[i].checked = false
            this.setState({data: new_data})
        }
        this.getCheckedRow()
    }
    
    getCheckedRow(e) {
        var checked_row = this.state.data.filter((d) => {
            return d.checked
        })
        
        if(checked_row.length == 0){
            this.setState({show_delete: false})
        }
        else {
            this.setState({show_delete: true})
        }
    }
    
    changeInput(e){
        var target = e.target
        var name = target.name
        var value = target.value
        var selected = false
        
        if (name == 'tag') {
            selected = this.state.tag_list.find(i => i.label == value)
            
            if (selected) {
                var filters = {'search': value}
                this.productTagsSearch(filters, true)
            }
        }
    }
    
    inputBlur(e, list) {
        const value = e.target.value
        const name = e.target.name
    	var selected = false
    	
    	if (name == 'tag') {
    	    selected = list.find(i => i.label == value)
    	}
    	
    	if (!selected) {
    		e.target.value = ''
    	}
    }
    
    removeFromList(index) {
        var new_data = this.state.data.slice()
        new_data.splice(index,1)
        this.setState({data: new_data})
    }
    
    toggleTambah(e) {
        this.setState({tambah: !this.state.tambah})
    }
    
    render() {
		var tag_options = []
		var search_style = {"fontFamily": "Open Sans, FontAwesome"}
		var tambah
					
		var delete_button
		if(this.state.show_delete){
		    delete_button = (
		        <div className="col-auto">
		            <button className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={this.deleteRow}>Hapus</button>
		        </div>
		    )
		}
		
        var row_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px'}
        if (this.state.loaded){
            
            this.state.tag_list.forEach(function(item, index) {
                tag_options.push(<option value={item.label} key={index.toString()}/>)
            })
            
            console.log(this.state)
            
            if (this.state.tambah) {
                tambah = <PopupTambah toggleTambah={this.toggleTambah} />
            }
            
            return(
                <div>
                    <div className="row mx-0" style={row_style}>
                        <div className="col-6 my-auto">
                            <div className="row">
                                <div className="col-auto">
                                    <a href="#" className="btn btn-outline-danger text-uppercase fs12 fwbold" onClick={this.toggleTambah}><i className="fa fa-plus mr-2"/>Tambah</a>
                                </div>
                                {delete_button}
                                <div className="col-auto ml-auto">
                                    <input type="text" name="tag" id="tag" placeholder="&#xF002;    Cari" className="form-control form-control-sm fs14" style={search_style} list="tags" onChange={e => this.changeInput(e)} onBlur={e => this.inputBlur(e, this.state.tag_list)} autoComplete="off"/>
                                    <datalist id="tags">
                                        {tag_options}
                                    </datalist>
                                </div>
                            </div>
                        </div>
                        <div className="col-6">
                            <SearchBar sorts={[]} searchAction={this.productTagsSearch} show_search={false} show_date={true}/>
                        </div>
                    </div>
                    <ProductTagsList data={this.state.data} checkRow={this.checkRow} filter={this.state.filter} removeFromList={this.removeFromList}/>
                    {tambah}
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

class PopupTambah extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': {},
        }
    }
    
    formSubmit(e){
        e.preventDefault()
        
        console.log(this.state.data)
        
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetproducttags.vetproducttags.create_tag",
            args: {data: this.state.data},
            callback: function(r){
                if (r.message) {
                    console.log(r.message);
                    window.location.reload()
                }
            }
        });
    }
    
    changeInput(e){
        var target = e.target
        var name = target.name
        var value = target.value
        var new_data = Object.assign({}, this.state.data)
        
        console.log(value)
        new_data[name] = value
        this.setState({data: new_data})
    }
    
    render(){
        var container_style = {maxWidth: '713px'}
        var input_style = {background: '#CEEDFF', color: '#056EAD'}
        var color_style = {color: '#056EAD'}
        var panel_style = {borderRadius: '20px'}
        var button1_style = {minWidth: '147px', border: '1px solid #056EAD', background: '#056EAD', color: '#FFF'}
        var button2_style = {minWidth: '147px', border: '1px solid #056EAD', color: '#056EAD'}
        
        return(
            <div className='menu-popup pt-0 d-flex' onClick={this.props.toggleTambah}>
                <div className="container my-auto" style={container_style} onClick={event => event.stopPropagation()}>
                	<form onSubmit={e => this.formSubmit(e)} className="p-5 bg-white" style={panel_style}>
                	    <div className="form-row mb-5">
                	        <input className="form-control col-8 mx-auto fs44 fwbold border-0 rounded-0" style={input_style} type="text" name="label" id="label" required autoComplete="off" onChange={e => this.changeInput(e)} placeholder="Tag Name"/>
                	    </div>
                	    <div className="row justify-content-center">
                	        <div className="col-auto">
                	            <button type="submit" className="btn fs18 fw600 py-2" style={button1_style}>Simpan</button>
                	        </div>
                	        <div className="col-auto">
                	            <button type="button" className="btn fs18 fw600 py-2" style={button2_style} onClick={this.props.toggleTambah}>Batal</button>
                	        </div>
                	    </div>
                	</form>
                </div>
                <div className="menu-popup-close"/>
            </div>
        )
    }
}


class ProductTagsList extends React.Component {
    render() {
        var product_tag_column = []
        var panel_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px'}
        
        if (this.props.data.length != 0 || !this.props.filter){
            var pol = this
            this.props.data.forEach(function(item, index){
                product_tag_column.push(
                    <ProductTagsListColumn item={item} checkRow={() => pol.props.checkRow(index)} key={item.name} removeFromList={() => pol.props.removeFromList(index.toString())}/>
                )
            })
            return(
            	<div className="row mx-0">
            		{product_tag_column}
            	</div>
            )
        } else {
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

class ProductTagsListColumn extends React.Component {
    render() {
        var checked = false
        var item = this.props.item
        var tag_style = {background: '#056EAD', borderRadius: '3px', color: '#FFF'}
        var onHandStyle = {background: '#3F91C9', borderRadius: '3px', color: '#FFF'}
        var penjualanStyle = {background: '#F7AB60', borderRadius: '3px', color: '#FFF'}
        var pembelianStyle = {background: '#53B386', borderRadius: '3px', color: '#FFF'}
        var panel_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px'}
        var blueStyle = {'color': '#056EAD', 'cursor': 'pointer'}
        var onHandRow = []
        var penjualanRow = []
        var pembelianRow = []
        
        item.onHandList.forEach(function(item, index) {
            onHandRow.push(
                <div key={index.toString()}>{formatter2.format(item.on_hand_quantity) + ' ' + item.uom}</div>
                )
                
            penjualanRow.push(
                <div key={index.toString()}>{formatter2.format(item.penjualan_quantity) + ' ' + item.uom}</div>
                )
        })
        
        item.pembelianList.forEach(function(item, index) {
            pembelianRow.push(
                <div key={index.toString()}>{formatter2.format(item.quantity) + ' ' + item.uom}</div>
            )
        })
        
        if (this.props.item.checked){
            checked = true
        }
        
        return(
            <div className="col-4 mb-3">
                <div className="p-2 h-100" style={panel_style}>
            		<div className="row mx-0">
            		    <div className="col-auto my-auto mr-auto">
                			<input style={blueStyle} type="checkbox" className="d-block my-3" checked={checked} onChange={this.props.checkRow}/>
                		</div>
                		<div className="col-auto my-auto">
                			<i style={blueStyle} className="fa fs20 fa-times" onClick={this.props.removeFromList}/>
                		</div>
            		</div>
            		<div className="text-center mb-3">
            		    <span className="p-2 fs18" style={tag_style}>#{item.label}</span>
            		</div>
                    <ProductTagsChart sales_list={item.sales_list} purchase_list={item.purchase_list}/>
                    <div style={onHandStyle} className="mx-5 mb-3">
                        <div className="text-center fw600 py-2">On Hand</div>
                        <div className="row mx-0">
                            <div className="col-6 mb-2">
                                {onHandRow}
                            </div>
                            <div className="col-6 my-auto">
                                <div>{formatter.format(item.on_hand_price)}</div>
                            </div>
                        </div>
                    </div>
                    <div className="row mx-5 mb-3 justify-content-between">
                        <div className="col-5" style={penjualanStyle}>
                            <div className="fw600 my-2">Penjualan</div>
                            {penjualanRow}
                            <div className="mb-2">{formatter.format(item.penjualan_price)}</div>
                        </div>
                        <div className="col-5" style={pembelianStyle}>
                            <div className="fw600 my-2">Pembelian</div>
                            {pembelianRow}
                            <div className="mb-2">{formatter.format(item.pembelian_price)}</div>
                        </div>
                    </div>
                </div>
        	</div>
        )
    }
}

class ProductTagsChart extends React.Component {
    componentDidMount() {
		var chart = this
		this.$el = $(this.el);
		
		var linechart = this.$el[0].getContext('2d');
		this.lineChart = new Chart(linechart, {
			type: 'line',
			options: {
				scales: {
					yAxes: [{
					    offset: true,
						ticks: {
							padding: 10,
							beginAtZero: true,
						},
						gridLines: {
							display: true,
							color: '#056EAD',
							lineWidth: 3,
							drawOnChartArea: false,
							drawTicks: false,
						},
					}],
					xAxes: [{
					    offset: true,
					    ticks: {
							padding: 10,
						},
						gridLines: {
							display: true,
							color: '#056EAD',
							lineWidth: 3,
							drawOnChartArea: false,
							drawTicks: false,
						},
					}],
				},
				legend: {
					display: false
				},
				tooltips: {
				    mode: 'x',
					callbacks: {
						title: function(tooltipItem, data) {
						    console.log(tooltipItem)
						    console.log(data)
                            return data.datasets[tooltipItem[0].datasetIndex].data[tooltipItem[0].index].x;
                        },
                        label: function(tooltipItem, data) {
							return data.datasets[tooltipItem.datasetIndex].label +": "+ formatter.format(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].y);
						}
					}
				}
			}
		});
		this.updateChart();
	}
	
	updateChart() {
		var chart = this
		if (this.props.sales_list != undefined && this.props.purchase_list != undefined) {
			var labels = [];
			var total_sales = [];
			var total_purchases = [];
			this.props.sales_list.sort((a, b) => moment(b.creation)< moment(a.creation)).forEach(function(item, index){
		        var label = moment(item.creation).format('MM/DD')
		        if(!labels.includes(label)){
			        labels.push(label);
			    }
			    total_sales.push({'x': label, 'y': item.total});
			});
			
			this.props.purchase_list.sort((a, b) => moment(b.creation)< moment(a.creation)).forEach(function(item, index){
			    var label = moment(item.creation).format('MM/DD')
		        if(!labels.includes(label)){
			        labels.push(label);
			    }
			    total_purchases.push({'x': label, 'y': item.total});
			});
			
			chart.lineChart.data = {
				labels: labels.sort((a, b) => b < a),
				datasets: [
				    {
        		        label: 'Jumlah Penjualan',
        				data: total_sales,
        				backgroundColor: '#F7AB60',
        				borderColor: '#F7AB60',
        				borderWidth: 4,
        				pointRadius: 1,
        				fill: false,
        				spanGaps: true,
    		        },{
        		        label: 'Jumlah Pembelian',
        				data: total_purchases,
        				backgroundColor: '#53B386',
        				borderColor: '#53B386',
        				borderWidth: 4,
        				pointRadius: 1,
        				fill: false,
        				spanGaps: true,
        		    }
		        ]
			};
			
			chart.lineChart.update();
		}
	}
    
    componentDidUpdate(prevProps) {
		if (prevProps.sales_list != this.props.sales_list || prevProps.purchase_list != this.props.purchase_list) {
			this.updateChart();
		}
	}
    
    render() {
        
        return(
            <canvas ref={el => this.el = el}/>
        )
    }
}

ReactDOM.render(<ProductTags />, document.getElementById('product_tags_list'))