var styles = {
    active: {background: '#056EAD', color: '#FFFFFF'},
    nonActive: {background: '#D2EEFF', color: '#056EAD'}
}

class Reporting extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': [],
            'data_ori': [],
            'loaded': false,
            'filters': {scale: 'day', type: 'line', grouped: 'no'},
        }
        
        this.reportSearch = this.reportSearch.bind(this);
    }
    
    componentDidMount() {
        var po = this
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetposorder.vetposorder.get_report",
            args: {filters: this.state.filters},
            callback: function(r){
                if (r.message) {
                    console.log(r.message);
                    po.setState({'data': r.message, 'data_ori': r.message, 'loaded': true});
                }
            }
        });
    }
    
    reportSearch(filters=false) {
        var po = this
        var new_filters = this.state.filters
        
        if (filters) {
	        new_filters['filters'] = filters['filters']
	        new_filters['group_by'] = filters['sort']
	        this.setState({filters: new_filters})
        }
        
        frappe.call({
            type: "GET",
            method:"vet_website.vet_website.doctype.vetposorder.vetposorder.get_report",
            args: {filters: new_filters},
            callback: function(r){
                if (r.message) {
                    po.setState({'data': r.message, loaded: true});
                }
            }
        });
    }
    
    changeInput(e) {
        var name = e.target.name
        var id = e.target.id
        var filters = this.state.filters
        
        if (filters[name] != id) {
        	filters[name] = id
	        this.setState({ filters: filters })
	        
        	if (name == 'scale') {
        		this.reportSearch()
	        }
        }
    }
    
    render() {
        var sorts = [
		                // {'label': 'Nama Pasien', 'value': 'pet_name'},
		                // {'label': 'Nama Pemilik', 'value': 'owner_name'},
		                {'label': 'Total', 'value': 'total'},
		                {'label': 'Subtotal', 'value': 'subtotal'},
		                {'label': 'Tanggal Order', 'value': 'order_date'},
		            ]
					
		var field_list = [
		                {'label': 'Nama Pasien', 'field': 'pet_name', 'type': 'char'},
		                {'label': 'Nama Pemilik', 'field': 'owner_name', 'type': 'char'},
		                {'label': 'Total', 'field': 'total', 'type': 'char'},
		                {'label': 'Subtotal', 'field': 'subtotal', 'type': 'char'},
		                {'label': 'Tanggal Order', 'field': 'order_date', 'type': 'date'},
		            ]
					
		var row_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px'}
		var monthStyle, dayStyle, lineStyle, barStyle, groupedStyle, stackedStyle
		var lineImg = 'lineWhite.png'
		var barImg = 'barBlue.png'
		var filters = this.state.filters
		
		if (filters.scale == 'day') {
		    dayStyle = styles.active
		    monthStyle = styles.nonActive
		} else {
		    dayStyle = styles.nonActive
		    monthStyle = styles.active
		}
		
		if (filters.type == 'line') {
		    lineStyle = styles.active
		    barStyle = styles.nonActive
		    lineImg = 'lineWhite.png'
		    barImg = 'barBlue.png'
		} else {
		    lineStyle = styles.nonActive
		    barStyle = styles.active
		    lineImg = 'lineBlue.png'
		    barImg = 'barWhite.png'
		}
		
		if (filters.grouped == 'yes') {
		    groupedStyle = styles.active
		    stackedStyle = styles.nonActive
		} else {
		    groupedStyle = styles.nonActive
		    stackedStyle = styles.active
		}
		
        if (this.state.loaded){
            return(
                <div>
                    <div className="row mx-0 justify-content-end" style={row_style}>
                        <div className="col-6 mr-2">
                            <Filter sorts={[]} searchAction={this.reportSearch} field_list={field_list} group_by={true}/>
                        </div>
                        <div className="col-auto">
                            <button className="btn mr-n1 fs14 px-4" name="scale" id="month" style={monthStyle} onClick={(e) => this.changeInput(e)}>Month</button>
                            <button className="btn ml-n1 fs14 px-4" name="scale" id="day" style={dayStyle} onClick={(e) => this.changeInput(e)}>Day</button>
                        </div>
                        <div className="col-auto">
                            <button className="btn mr-n1 fs14 px-4" name="type" id="line" style={lineStyle} onClick={(e) => this.changeInput(e)}>
                                <img src={"/static/img/main/menu/" + lineImg} name="type" id="line"/>
                            </button>
                            <button className="btn ml-n1 fs14 px-4" name="type" id="bar" style={barStyle} onClick={(e) => this.changeInput(e)}>
                                <img src={"/static/img/main/menu/" + barImg} name="type" id="bar"/>
                            </button>
                        </div>
                        <div className="col-auto">
                            <button className="btn mr-n1 fs14 px-4" name="grouped" id="yes" style={groupedStyle} onClick={(e) => this.changeInput(e)}>Grouped</button>
                            <button className="btn ml-n1 fs14 px-4" name="grouped" id="no" style={stackedStyle} onClick={(e) => this.changeInput(e)}>Stacked</button>
                        </div>
                    </div>
                    <ReportingChart data={this.state.data} filters={filters}/>
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


class ReportingChart extends React.Component {
    render() {
        var panel_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px', 'height': '700px'}
        var data = this.props.data
        
        return(
            <div style={panel_style}>
                <ChartOrder data={data} filters={this.props.filters}/>
            </div>
        )
    }
}

class ChartOrder extends React.Component {
    componentDidMount() {
    	var filters = this.props.filters
		var chart = this
		this.$el = $(this.el);
		
		var linechart = this.$el[0].getContext('2d');
		this.lineChart = new Chart(linechart, {
			type: filters.type,
			options: {
			    responsive: true,
                maintainAspectRatio: false,
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
						    // console.log(tooltipItem)
						    // console.log(data)
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
		var filters = this.props.filters
		if (this.props.data != undefined) {
			var labels = [];
			var total_order = [];
			this.props.data.forEach(function(item, index){
		        var label = moment(item.order_date).format('DD/MM')
		        if(!labels.includes(label)){
			        labels.push(label);
			    }
			    total_order.push({'x': label, 'y': item.total});
			});
			
			chart.lineChart.data = {
				labels: labels.sort((a, b) => b < a),
				datasets: [
				    {
        		        label: 'Jumlah Penjualan',
        				data: total_order,
        				backgroundColor: '#F7AB60',
        				borderColor: '#F7AB60',
        				borderWidth: 4,
        				pointRadius: 1,
        				fill: false,
        				spanGaps: true,
    		        }
		        ]
			};
			
			chart.lineChart.config.type = filters.type
			
			chart.lineChart.update();
		}
	}
    
    componentDidUpdate(prevProps) {
		this.updateChart();
	}
    
    render() {
        
        return(
            <canvas ref={el => this.el = el}/>
        )
    }
}

ReactDOM.render(<Reporting />, document.getElementById('reporting'))