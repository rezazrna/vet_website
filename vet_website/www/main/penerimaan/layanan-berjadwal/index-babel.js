// var tzOffset = new Date().getTimezoneOffset()
var tzOffset = 0

class ScheduledService extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': [],
            'loaded': false,
            'check_all': false,
            'show_delete': false,
            'currentpage': 1,
            'search': false,
            'datalength': 0,
            'pet_type_list': []
        }

        this.scheduledSearch = this.scheduledSearch.bind(this);
        this.checkRow = this.checkRow.bind(this);
        this.deleteRow = this.deleteRow.bind(this);
        this.paginationClick = this.paginationClick.bind(this);
    }

    componentDidMount() {
        var po = this
        var filters

        // if (sessionStorage.getItem(window.location.pathname) != null) {
        //     filters = JSON.parse(sessionStorage.getItem(window.location.pathname))
        // } else {
            var firstDate = moment().subtract(7, 'days').format("YYYY-MM-DD");
            var lastDate = moment().add(7, 'days').format("YYYY-MM-DD");
            filters = { filters: [
                ['schedule_date', 'between', [firstDate, lastDate]]
            ], sorts: [] }
        // }

        if (document.location.href.includes('?')) {
            var url = document.location.href,
                params = url.split('?')[1].split('='),
                key = params[0],
                value = params[1]
        }

        if (filters.hasOwnProperty("currentpage")) {
            this.setState({ 'currentpage': filters['currentpage'] })
        }

        if (filters.hasOwnProperty("search")) {
            this.setState({ 'search': filters['search'] })
        }

        if (params) {
            filters[key] = value
            sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))
            this.scheduledSearch(filters)
        } else {
            sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))
            frappe.call({
                type: "GET",
                method: "vet_website.vet_website.doctype.vetscheduledservice.vetscheduledservice.get_scheduled_service_list",
                args: { filters: filters },
                callback: function (r) {
                    if (r.message) {
                        console.log(r.message);
                        po.setState({ 'data': r.message.scheduled, 'loaded': true, 'datalength': r.message.datalength, 'pet_type_list': r.message.pet_type_list });
                    }
                }
            });
        }
    }

    scheduledSearch(filters) {
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
            method: "vet_website.vet_website.doctype.vetscheduledservice.vetscheduledservice.get_scheduled_service_list",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'data': r.message.scheduled, 'filter': true, 'loaded': true, 'datalength': r.message.datalength, 'pet_type_list': r.message.pet_type_list });
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
            method: "vet_website.vet_website.doctype.vetscheduledservice.vetscheduledservice.get_scheduled_service_list",
            args: { filters: filters },
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'data': r.message.scheduled, 'filter': true, 'loaded': true, 'datalength': r.message.datalength, 'pet_type_list': r.message.pet_type_list });
                }
            }
        });
        // }
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
            method: "vet_website.vet_website.doctype.vetscheduledservice.vetscheduledservice.delete_scheduled_servicer",
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

    render() {
        var pet_types = []
        this.state.pet_type_list.forEach(function (item) {
            pet_types.push({'label': item.type_name, 'value': item.name})
        })

        var sorts = [
            { 'label': 'NIP DESC', 'value': 'pet desc' },
            { 'label': 'NIP ASC', 'value': 'pet asc' },
            { 'label': 'Nama Pasien DESC', 'value': 'pet_name desc' },
            { 'label': 'Nama Pasien ASC', 'value': 'pet_name asc' },
            { 'label': 'Nama Pemilik DESC', 'value': 'pet_owner_name desc' },
            { 'label': 'Nama Pemilik ASC', 'value': 'pet_owner_name asc' },
        ]
        var field_list = [
            { 'label': 'NIP', 'field': 'pet', 'type': 'char' },
            { 'label': 'Nama Pasien', 'field': 'pet_name', 'type': 'char' },
            { 'label': 'Nama Pemilik', 'field': 'pet_owner_name', 'type': 'char' },
            { 'label': 'Telepon', 'field': 'pet_owner_phone', 'type': 'char' },
            { 'label': 'Jenis Hewan', 'field': 'type_name', 'type': 'select', 'options': pet_types },
            { 'label': 'Tanggal Jadwal', 'field': 'schedule_date', 'type': 'date' },
            { 'label': 'Catatan', 'field': 'description', 'type': 'char'},
        ]

        var backButton, delete_button
        if (this.state.show_delete) {
            delete_button = <button className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={this.deleteRow}>Hapus</button>
        }

        if (document.location.href.includes('?')) {
            var color = { color: '#056EAD', cursor: 'pointer' }
            backButton = <span className="fs16 fw600 mr-4 my-auto" style={color} onClick={() => { history.back() }}><i className="fa fa-chevron-left mr-1" style={color}></i>Back</span>
        }

        var row_style = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px' }
        var formStyle = { border: '1px solid #397DA6', color: '#397DA6' }
        if (this.state.loaded) {
            return (
                <div>
                    <div className="row mx-0" style={row_style}>
                        <div className="col-auto my-autos">
                            {backButton}
                        </div>
                        <div className="col">
                            <input value={this.state.search || ''} className="form-control fs12" name="search" placeholder="Search..." style={formStyle} onChange={e => this.setState({ search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' ? this.scheduledSearch(JSON.parse(sessionStorage.getItem(window.location.pathname))) : null} />
                        </div>
                        <div className="col-7">
                            <Filter sorts={sorts} searchAction={this.scheduledSearch} field_list={field_list} filters={JSON.parse(sessionStorage.getItem(window.location.pathname))} />
                        </div>
                    </div>
                    <ScheduledServiceList schedules={this.state.data} checkRow={this.checkRow} checkAll={() => this.checkAll()} check_all={this.state.check_all} filter={this.state.filter} paginationClick={this.paginationClick} currentpage={this.state.currentpage} datalength={this.state.datalength} />
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


class ScheduledServiceList extends React.Component {
    render() {
        // var search = this.props.search
        // function filterRow(row){
        //     function filterField(field){
        //         return field?field.toString().includes(search):false
        //     }
        //     var fields = [row.create_date, row.pet, row.pet_name, row.register_number, row.pet_owner_name, row.pet_owner_phone, row.type_name, row.service, row.schedule_date, row.status]
        //     return ![false,''].includes(search)?fields.some(filterField):true
        // }
        var schedule_rows = []
        var panel_style = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px' }
        var col_style2 = { width: '95px' }

        if (this.props.schedules.length != 0 || !this.props.filter) {
            // var pol = this
            // const indexOfLastTodo = this.props.currentpage * 30;
            // const indexOfFirstTodo = indexOfLastTodo - 30;
            // var currentItems
            // ![false,''].includes(search)?
            // currentItems = this.props.schedules.filter(filterRow).slice(indexOfFirstTodo, indexOfLastTodo):
            // currentItems = this.props.schedules.slice(indexOfFirstTodo, indexOfLastTodo)

            this.props.schedules.forEach(function (schedule, index) {
                // if (currentItems.includes(schedule)){
                schedule_rows.push(
                    <ScheduledServiceListRow key={schedule.name} schedule={schedule} checkRow={() => pol.props.checkRow(index)} />
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
                                <div className="col d-flex">
                                    <span className="my-auto">Tanggal Jadwal</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">NIP</span>
                                </div>
                                <div className="col-1 d-flex">
                                    <span className="my-auto">Nama Pasien</span>
                                </div>
                                <div className="col-1 d-flex">
                                    <span className="my-auto">Nama Pemilik</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">Telepon</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">Jenis Hewan</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">Catatan</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">Rekam Medis</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {schedule_rows}
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

class ScheduledServiceListRow extends React.Component {
    // clickRow() {
    //     var pathname = "/main/penerimaan/layanan-berjadwal/form?n="+this.props.schedule.name
    //     window.location = pathname
    // }

    render() {
        var checked = false
        var scheduled_service = this.props.schedule
        var col_style = { width: '95px' }
        var type
        var cursor = {cursor: 'pointer'}

        if (this.props.schedule.checked) {
            checked = true
        }

        if (scheduled_service.status == 'Draft') {
            type = 'bg-warning'
        } else if (scheduled_service.status == 'Done') {
            type = 'bg-success'
        } else {
            type = 'secondary'
        }

        return (
            <div className="row mx-0">
                <div className="col-auto pl-2 pr-3">
                    <input type="checkbox" className="d-block my-3" checked={checked} onChange={this.props.checkRow} />
                </div>
                <div className="col row-list">
                    <div className="row mx-0 fs12 fw600">
                        <div className="col d-flex">
                            <span className="my-auto">{moment(scheduled_service.schedule_date).format("YYYY-MM-DD")}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{scheduled_service.pet}</span>
                        </div>
                        <div className="col-1 d-flex">
                            <span className="my-auto">{scheduled_service.pet_name}</span>
                        </div>
                        <div className="col-1 d-flex">
                            <span className="my-auto">{scheduled_service.pet_owner_name}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{scheduled_service.pet_owner_phone}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{scheduled_service.type_name}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{scheduled_service.description}</span>
                        </div>
                        <div className="col d-flex">
                            <a href={"/main/rekam-medis/rekam-medis?pet=" + scheduled_service.pet} ><img src="/static/img/main/menu/tautan.png" className="mx-2" style={cursor}/></a>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

ReactDOM.render(<ScheduledService />, document.getElementById('scheduled_service_list'))