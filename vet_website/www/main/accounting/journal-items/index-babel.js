var accountParams = getUrlParameter('account')
var ji = document.getElementById('journal_item_list')
var gl = document.getElementById('general_ledger_list')

class JournalItems extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'data': [],
            'print_data': [],
            'loaded': false,
            'check_all': false,
            'show_delete': false,
            'currentpage': 1,
            'journals': [],
            'search': false,
            'datalength': 0,
            'print_loading': false,
            'account': this.props.account,
            'account_input': '',
            'coaAll': [],
            'month': '',
            'min_month': '',
            'year': '',
            'min_date': '',
            'max_date': '',
            'journal_date': '',
            'remove_storage': true,
            'saldo_awal': 0,
            'list_year': []
        }
        this.checkRow = this.checkRow.bind(this);
        this.deleteRow = this.deleteRow.bind(this);
        this.itemSearch = this.itemSearch.bind(this);
        this.paginationClick = this.paginationClick.bind(this);
    }

    componentDidMount() {
        var po = this
        var new_filters = { filters: [], sorts: [] }

        console.log('masuk component')
        console.log(window.location.pathname)
        console.log(sessionStorage.getItem(window.location.pathname))
        console.log(document.referrer)

        if (sessionStorage.getItem(window.location.pathname) != null) {
            new_filters = JSON.parse(sessionStorage.getItem(window.location.pathname))

            if (new_filters.hasOwnProperty("currentpage")) {
                this.setState({ 'currentpage': new_filters['currentpage'] })
            }
    
            if (new_filters.hasOwnProperty("search")) {
                this.setState({ 'search': new_filters['search'] })
            }

            if (new_filters.hasOwnProperty("journal_date")) {
                this.setState({ 
                    'journal_date': new_filters['journal_date'],
                    'max_date': new_filters['journal_date'],
                    'month': moment(new_filters['journal_date'], 'YYYY-MM-DD').subtract(1, 'month').format('MM'),
                    'year': moment(new_filters['journal_date'], 'YYYY-MM-DD').format('YYYY')
                })
            }

            if (new_filters.hasOwnProperty("journal_min_date")) {
                this.setState({ 
                    'journal_min_date': new_filters['journal_min_date'],
                    'min_date': new_filters['journal_min_date'],
                    'min_month': moment(new_filters['journal_min_date'], 'YYYY-MM-DD').format('MM'),
                })
            }

            if (new_filters.hasOwnProperty("mode")) {
                this.setState({ 'mode': new_filters['mode'] })
            }
        }

        if (this.state.account != undefined) {
            new_filters.account = this.state.account
        }

        sessionStorage.setItem(window.location.pathname, JSON.stringify(new_filters))
        console.log('new_filters')
        console.log(new_filters)
        console.log(this.state.account)
        console.log(accountParams)

        if (gl != undefined && accountParams == undefined) {
            frappe.call({
                type: "GET",
                method: "vet_website.vet_website.doctype.vetjournalitem.vetjournalitem.get_coa_all",
                args: {},
                callback: function (r) {
                    if (r.message) {
                        console.log(r.message);
                        po.setState({ 'coaAll': r.message.coaAll, 'loaded': true});
                    }
                }
            });   
        } 

        if (gl == undefined || accountParams != undefined || new_filters.hasOwnProperty("journal_date")) {
            frappe.call({
                type: "GET",
                method: "vet_website.vet_website.doctype.vetjournalitem.vetjournalitem.get_journal_item_list",
                args: { filters: new_filters, is_gl: gl != undefined ? 1 : 0},
                callback: function (r) {
                    if (r.message) {
                        console.log(r.message);
                        po.setState({ 'data': r.message.journal_items, 'journals': r.message.journals, 'loaded': true, 'datalength': r.message.datalength, 'coaAll': r.message.coaAll, 'saldo_awal': r.message.saldo_awal});
                    }
                }
            });
        }

        window.addEventListener('beforeunload', (e) => {
            console.log('before unload')
            if (this.state.remove_storage) {
                sessionStorage.removeItem(window.location.pathname)
            }
        });

        frappe.call({
            type: "GET",
            method: "vet_website.methods.get_list_year",
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'list_year': r.message });
                }
            }
        });
    }

    paginationClick(number) {
        var po = this
        var filters = JSON.parse(sessionStorage.getItem(window.location.pathname))

        this.setState({
            currentpage: Number(number),
            loaded: false,
        });

        filters['currentpage'] = this.state.currentpage
        filters['mode'] = this.state.mode

        console.log('simpan filters')
        console.log(window.location.pathname)
        console.log(filters)

        sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))

        // if (number * 30 > this.state.data.length) {
        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetjournalitem.vetjournalitem.get_journal_item_list",
            args: { filters: filters, is_gl: gl != undefined ? 1 : 0},
            callback: function (r) {
                if (r.message) {
                    console.log(r.message);
                    po.setState({ 'data': r.message.journal_items, 'journals': r.message.journals, 'loaded': true, 'datalength': r.message.datalength, 'coaAll': r.message.coaAll, 'saldo_awal': r.message.saldo_awal});
                }
            }
        });
        // }
    }

    itemSearch(filters) {
        if (filters.sort != undefined) {
            filters.journal = filters.sort
        }
        console.log('account')
        console.log(this.state.account)
        if (this.state.account != undefined && filters.account == undefined) {
            filters.account = this.state.account
        }
        var po = this
        this.setState({
            currentpage: 1,
            loaded: false,
        });

        filters['currentpage'] = 1;
        filters['search'] = this.state.search
        filters['mode'] = this.state.mode
        sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))

        console.log('filters')
        console.log(filters)

        frappe.call({
            type: "GET",
            method: "vet_website.vet_website.doctype.vetjournalitem.vetjournalitem.get_journal_item_list",
            args: { filters: filters, is_gl: gl != undefined ? 1 : 0},
            callback: function (r) {
                if (r.message) {
                    console.log(r.message)
                    po.setState({ 'data': r.message.journal_items, 'journals': r.message.journals, 'loaded': true, 'datalength': r.message.datalength, 'coaAll': r.message.coaAll, 'saldo_awal': r.message.saldo_awal});
                }
            }
        });
    }

    handleInputChange(e) {
        const value = e.target.value
        var selected = this.state.coaAll.find(i => i.account_name == value)

        console.log(value)
    	
    	if (selected) {
    	    var tempFilters = JSON.parse(sessionStorage.getItem(window.location.pathname))
            tempFilters.account = selected.name
            this.setState({account: selected.name, account_input: selected.account_name})
            this.itemSearch(tempFilters)
    	} else {
            this.setState({account_input: value})
        }
    }

    handleInputBlur(e) {
        const value = e.target.value
    	var selected = false
    	
    	selected = this.state.coaAll.find(i => i.account_name == value)
    	
    	if (!selected) {
    	    e.target.value = ''
            this.setState({account: undefined, account_input : ''})
    	} else {
            var tempFilters = JSON.parse(sessionStorage.getItem(window.location.pathname))
            tempFilters.account = selected.name
            this.setState({account: selected.name, account_input: selected.account_name})
            this.itemSearch(tempFilters)
        }
    }

    setMode(e) {
        var th = this
        var mode = e.target.value
        th.setState({ 'mode': mode, 'min_month': '', 'month': '',
         'year': '', 'journal_min_date': undefined, 'journal_date': undefined,
         'min_date': '', 'max_date': ''
        })
    }

    filterChange(e) {
        var th = this
        var name = e.target.name
        var value = e.target.value
        if (name == 'min_month') {
            var journal_min_date
            this.setState({ min_month: value })
            journal_min_date = moment(this.state.year + '-' + value + '-01', 'YYYY-MM-DD').format('YYYY-MM-DD')
            th.setState({ journal_min_date: journal_min_date })
        } else if (name == 'month') {
            var journal_date
            this.setState({ month: value })
            journal_date = moment(this.state.year + '-' + value, 'YYYY-MM').add(1, 'month').format('YYYY-MM-DD')
            th.setState({ journal_date: journal_date })
        } else if (name == 'year') {
            var journal_date
            this.setState({ year: value })
            if (this.state.mode == 'annual') {
                journal_date = moment(value + '-12-31', 'YYYY-MM-DD').format('YYYY-MM-DD')
            } else {
                journal_date = moment(value + '-' + this.state.month, 'YYYY-MM').add(1, 'month').format('YYYY-MM-DD')
            }

            th.setState({ journal_date: journal_date })
        } else if (name == 'min_date') {
            th.setState({min_date: value, journal_min_date: value})
        } else if (name == 'max_date') {
            th.setState({max_date: value, journal_date: value})
        }
    }

    setFilter(filters = false) {
        var td = this
        if (!filters) {
            filters = JSON.parse(sessionStorage.getItem(window.location.pathname))
        }
        console.log(this.state.mode)
        console.log(this.state.month)
        console.log(this.state.min_month)
        console.log(this.state.year)
        console.log(this.state.journal_date)
        console.log(this.state.min_date)
        console.log(this.state.max_date)
        if ((((this.state.mode == 'monthly' && this.state.month != '') ||
         (this.state.mode == 'period' && this.state.month != '' && this.state.min_month != '')
          || (this.state.mode == 'annual')) && this.state.year != '') ||
          (this.state.mode == 'daily' && this.state.min_date != '' && this.state.max_date != '')) {
            filters['journal_date'] = this.state.journal_date
            filters['journal_min_date'] = this.state.journal_min_date
            sessionStorage.setItem(window.location.pathname, JSON.stringify(filters))
            console.log(filters)
            this.itemSearch(filters)
            // frappe.call({
            //     type: "GET",
            //     method: "vet_website.vet_website.doctype.vetjournalitem.vetjournalitem.get_journal_item_list",
            //     args: { filters: filters, mode: td.state.mode, },
            //     callback: function (r) {
            //         if (r.message) {
            //             console.log(r.message)
            //             td.setState({'data': r.message.journal_items, 'journals': r.message.journals, 'loaded': true, 'datalength': r.message.datalength, 'coaAll': r.message.coaAll});
            //         }
            //     }
            // });
        } else {
            frappe.msgprint(('Date or Month or Year must be selected'));
        }
    }

    changeRemoveStorage(value) {
        this.setState({'remove_storage': value})
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
            method: "vet_website.vet_website.doctype.vetjournalitem.vetjournalitem.delete_journal_item",
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

    getPrintData() {
        var po = this

        if (!this.state.print_loading) {
            var filters = JSON.parse(sessionStorage.getItem(window.location.pathname))

            filters['mode'] = this.state.mode

            this.setState({
                print_loading: true,
            });

            frappe.call({
                type: "GET",
                method: "vet_website.vet_website.doctype.vetjournalitem.vetjournalitem.get_journal_item_list",
                args: { filters: filters, all_page: true, is_gl: gl != undefined ? 1 : 0},
                callback: function (r) {
                    if (r.message) {
                        console.log(r.message);
                        po.setState({print_data: r.message.journal_items, saldo_awal: r.message.saldo_awal});
                        setTimeout(function() {
                            po.printPDF()
                        }, 3000);
                        
                    }
                }
            });
        }
    }

    async printPDF() {
        var pdfid = 'pdf'
        var format = [559, 794]
        var th = this
        // var doc = new jsPDF({
        //     orientation: 'p',
        //     unit: 'pt',
        //     format: format,
        // });
        var title = gl != undefined ? 'GeneralLedger-' : 'JournalItem-'
        var filters = JSON.parse(sessionStorage.getItem(window.location.pathname))

        if (filters.journal_date != undefined && this.state.mode != undefined) {
            tanggal = ''
            if (this.state.mode == 'monthly') {
                var bulan = moment(this.state.year + '-' + this.state.month, 'YYYY-MM').format('MM-YYYY')
                console.log(bulan)
                title += 'Monthly-' + bulan
            } else if (this.state.mode == 'annual') {
                title += 'Annual-' + moment(filters.journal_date).format('YYYY')
            } else if (this.state.mode == 'period') {
                var sampai_bulan = moment(this.state.year + '-' + this.state.month, 'YYYY-MM').format('MM-YYYY')
                title += 'Periode-' + moment(filters.journal_min_date).format('MM-YYYY') + '-' + sampai_bulan
            } else if (this.state.mode == 'daily') {
                title += 'Tanggal-' + moment(filters.journal_min_date).format('DD-MM-YYYY') + '-' + moment(filters.journal_date).format('DD-MM-YYYY')
            }
        } else if (filters.filters.some((element) => element[0] == 'period')) {
            var period = filters.filters.find((e) => e[0] == 'period')
            if (period[1] == '=') {
                tanggal = period[2]
            } else if (period[1] == '!=') {
                tanggal = 'Tidak-Sama-Dengan ' + period[2]
            } else if (period[1] == 'like') {
                tanggal = 'Seperti-' + period[2].replaceAll('%', '')
            } else if (period[1] == 'not like') {
                tanggal = 'Tidak-Seperti-' + period[2].replaceAll('%', '')
            }
            title += 'Periode-' + period[2].replaceAll('%', '')
        } else if (filters.filters.some((element) => element[0] == 'date')) {
            var date = filters.filters.find((e) => e[0] == 'date')
            var tanggal = ''
            if (date[1] == 'between') {
                tanggal = date[2] + ' - ' + date[3]
            } else if (date[1] == '=') {
                tanggal = date[2]
            } else if (date[1] == '!=') {
                tanggal = 'Tidak-Sama-Dengan-' + date[2]
            } else if (date[1] == '>') {
                tanggal = 'Lebih-Dari-' + date[2]
            } else if (date[1] == '>=') {
                tanggal = 'Lebih-Dari-Sama-Dengan-' + date[2]
            } else if (date[1] == '<') {
                tanggal = 'Kurang-Dari-' + date[2]
            } else if (date[1] == '<=') {
                tanggal = 'Kurang-Dari-Sama-Dengan-' + date[2]
            }
            title += 'Tanggal-' + tanggal
        }

        // var source = document.getElementById(pdfid)
        var elements = Array.from(document.querySelectorAll('div[id^="pdf-"]'))
        var opt = {
            margin: [10, 0, 10, 0],
            filename: title + ".pdf",
            pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', '.row'] },
            html2canvas: { scale: 3 },
            jsPDF: { orientation: 'p', unit: 'pt', format: [559 * 0.754, 794 * 0.754] }
        }

        console.log(elements)

        // const doc = new jsPDF(opt.jsPDF);
        // for(let i = 0; i < elements.length; i++){
        //     console.log('berhasil')
        //     console.log(i)
        //     const page = elements[i];
        //     const pageImage = await html2pdf().from(page).set(opt).outputImg();
        //     if(i != 0) {
        //         doc.addPage();
        //     }
        //     doc.addImage(pageImage.src, 'jpeg');
        // }
        // doc.save().then(e => {
        //     this.setState({print_loading: false})
        // });

        var worker = html2pdf()
            .set(opt)
            .from(elements[0])

        if (elements.length > 1) {
            worker = worker.toPdf() // worker is now a jsPDF instance

            // add each element/page individually to the PDF render process
            elements.slice(1).forEach((element, index) => {
            worker = worker
                .get('pdf')
                .then(pdf => {
                    console.log('masuk pak eko')
                    console.log(index)
                    pdf.addPage()
                })
                .from(element)
                // .toContainer()
                // .toCanvas()
                .toPdf()
            })
        }

        worker = worker.save().then(e => {
            this.setState({print_loading: false})
        })

        // html2pdf().set(opt).from(source).save()
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

        var row_style = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px' }
        var formStyle = { border: '1px solid #397DA6', color: '#397DA6' }
        var input_style = {background: '#CEEDFF'}
        var delete_button, back_button, account_dropdown, mode_options, sd_period, month_select, year_select, set_button, min_month_select, min_date_input, max_date_input
        var account_options = []
        var account_name = ''

        if (this.state.show_delete) {
            delete_button = <button className="btn btn-outline-danger text-uppercase fs12 fwbold mx-2" onClick={() => frappe.msgprint("Journal Item tidak bisa dihapus karena akan menyebabkan Journal Entry tidak balance, jika ingin menghapus lakukan lewat Journal Entry")}>Hapus</button>
        }

        var field_list = [
            //  {'label': 'Journal Name', 'field': 'journal_name', 'type': 'char'},
            { 'label': 'Period', 'field': 'period', 'type': 'char' },
            { 'label': 'Date', 'field': 'date', 'type': 'date' },
            { 'label': 'Reference', 'field': 'reference', 'type': 'char' },
            { 'label': 'Debit', 'field': 'debit', 'type': 'char' },
            { 'label': 'Credit', 'field': 'credit', 'type': 'char' },
            //  {'label': 'Status', 'field': 'status', 'type': 'char'},
        ]

        var sorts = [{ 'label': 'Pilih Journal', 'value': '' }]
        this.state.journals.forEach(j => sorts.push({ 'label': j.journal_name, 'value': j.name }))

        var print_button = <button type="button" 
            className={this.state.print_loading
                ? "btn btn-outline-danger disabled text-uppercase fs12 fwbold mx-2"
                : "btn btn-outline-danger text-uppercase fs12 fwbold mx-2"} 
            onClick={() => this.getPrintData()}>{this.state.print_loading
                ?(<span><i className="fa fa-spin fa-circle-o-notch mr-3"/>Loading...</span>)
                :"Print"}</button>

        var month_options = [<option className="d-none" key="99999"></option>]
        var year_options = [<option className="d-none" key="99999"></option>]
        var i
        for (i = 0; i <= 11; i++) {
            var moment_month = moment(i + 1, 'M')
            // var moment_year = moment().add(-i, 'year')
            month_options.push(<option key={moment_month.format('MM')} value={moment_month.format('MM')}>{moment_month.format('MMMM')}</option>)
            // year_options.push(<option key={moment_year.format('YYYY')}>{moment_year.format('YYYY')}</option>)
        }

        this.state.list_year.forEach(function(e, index) {
            year_options.push(<option key={e}>{e}</option>)
        })

        if (this.state.loaded) {
            if (this.state.account != undefined) {
                var color = { color: '#056EAD', cursor: 'pointer' }
                back_button = <span className="fs16 fw600 mr-4 my-auto" style={color} onClick={() => { history.back() }}><i className="fa fa-chevron-left mr-1" style={color}></i>Back</span>
                var coa = this.state.coaAll.find((e) => e.name == this.state.account)
                account_name = coa != undefined ? coa.account_name : ''
            }
    
            if (gl != undefined) {
                field_list = []
                if (accountParams == undefined) {
                    this.state.coaAll.forEach(function(item, index) {
                        account_options.push(<option value={item.account_name} key={index.toString()} />)
                    })

                    account_dropdown = <div className="col-2">
                                    <input style={input_style} name='account' list="list_account" id="account" className="form-control border-0 " onChange={e => this.handleInputChange(e)} onBlur={e => this.handleInputBlur(e)} value={this.state.account_input}/>
                                    <datalist id="list_account">
                                        {account_options}
                                    </datalist>
                                </div>
                }

                if (this.state.mode == 'monthly' || this.state.mode == 'period') {

                    if (this.state.mode == 'period') {
                        sd_period = <div className="col-auto my-auto mx-auto">
                            s/d
                        </div>

                        min_month_select = <div className="col-2 my-auto">
                            <select name="min_month" placeholder="Month" className="form-control" value={this.state.min_month} onChange={e => this.filterChange(e)}>
                                {month_options}
                            </select>
                        </div>
                    }
    
                    month_select = <div className="col-2 my-auto">
                        <select name="month" placeholder="Month" className="form-control" value={this.state.month} onChange={e => this.filterChange(e)}>
                            {month_options}
                        </select>
                    </div>
                }

                mode_options = <div className="col-2 my-auto">
                                    <select name="mode" placeholder="Periode" className="form-control" value={this.state.mode} onChange={e => this.setMode(e)}>
                                        <option className="d-none" key="99999"></option>
                                        <option value="daily">Daily</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="annual">Annual</option>
                                        <option value="period">Period</option>
                                    </select>
                                </div>

                if (this.state.mode == 'daily') {
                    min_date_input = <div className="col-2 my-auto">
                        <input type="date" id="min_date" name='min_date' className="form-control" onChange={e => this.filterChange(e)} value={this.state.min_date}/>
                    </div>

                    max_date_input = <div className="col-2 my-auto">
                        <input type="date" id="max_date" name='max_date' className="form-control" onChange={e => this.filterChange(e)} value={this.state.max_date}/>
                    </div>
                } else {
                    year_select = <div className="col-2 my-auto">
                                <select name="year" placeholder="Year" className="form-control" value={this.state.year} onChange={e => this.filterChange(e)}>
                                    {year_options}
                                </select>
                            </div>
                }

                set_button = <div className="col-2 my-auto">
                            <button type="button" className="btn btn-outline-danger text-uppercase fs12 fwbold" onClick={() => this.setFilter()}>Set</button>
                        </div>
            }

            var item_pdf = []

            if (this.state.print_data.length > 0) {
                var chunk = []
                for (i = 0; i < this.state.print_data.length; i += (i == 0 ? 12 : 33)) {
                    chunk.push(this.state.print_data.slice(i, i + (i == 0 ? 12 : 33)));
                }

                console.log(chunk)

                for (i = 0; i < chunk.length; i++) {
                    if (i == 0) {
                        console.log('masuk pdf page pertama')
                        item_pdf.push(
                            <PDF data={chunk[i]} account_name={account_name} account={this.state.account} mode={this.state.mode} month={this.state.month} year={this.state.year} datalength={this.state.datalength} saldo_awal={this.state.saldo_awal}/>
                        )
                    } else {
                        item_pdf.push(
                            <PDFListPage data={chunk[i]} account={this.state.account} datalength={this.state.datalength} pdfPage={i + 1}/>
                        )
                    }
                }
            }

            return (
                <div>
                    <div className="row mx-0" style={row_style}>
                        <div className="col-auto my-auto">
                            {back_button}
                            {delete_button}
                            {print_button}
                        </div>
                        <div className="col">
                            <input value={this.state.search || ''} className="form-control fs12" name="search" placeholder="Search..." style={formStyle} onChange={e => this.setState({ search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' ? this.itemSearch(JSON.parse(sessionStorage.getItem(window.location.pathname))) : null} />
                        </div>
                        {account_dropdown}
                        {mode_options}
                        {year_select}
                        {min_month_select}
                        {sd_period}
                        {month_select}
                        {min_date_input}
                        {max_date_input}
                        {set_button}
                        <div className="col">
                            <Filter sorts={[]} searchAction={this.itemSearch} field_list={field_list} filters={JSON.parse(sessionStorage.getItem(window.location.pathname))} />
                        </div>
                    </div>
                    <JournalItemsList account={this.state.account} data={this.state.data} checkRow={this.checkRow} checkAll={() => this.checkAll()} check_all={this.state.check_all} paginationClick={this.paginationClick} currentpage={this.state.currentpage} datalength={this.state.datalength} changeRemoveStorage={(value) => this.changeRemoveStorage(value)} saldo_awal={this.state.saldo_awal}/>
                    {item_pdf}
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

class JournalItemsList extends React.Component {
    render() {
        // var search = this.props.search
        // function filterRow(row) {
        //     function filterField(field) {
        //         return field ? field.toString().includes(search) : false
        //     }
        //     var fields = [row.period, moment(row.date).format("DD-MM-YYYY"), row.account_name, row.reference, row.debit, row.credit]
        //     return ![false, ''].includes(search) ? fields.some(filterField) : true
        // }

        var item_rows = []
        var panel_style = { 'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px 40px 12px' }
        var data = this.props.data
        var account_col
        if (data.length != 0) {
            var ji = this
            // var total = 0
            // data.sort((a, b) => a.creation > b.creation).forEach(d => {
            //     if(['Asset','Expense'].includes(d.account_type)){
            //         total = total + (d.debit - d.credit)
            //         d.computed_total = total
            //     }
            //     else{
            //         total = total + (d.credit - d.debit)
            //         d.computed_total = total
            //     }
            // })
            // const indexOfLastTodo = this.props.currentpage * 30;
            // const indexOfFirstTodo = indexOfLastTodo - 30;
            // var currentItems
            // ![false,''].includes(search)?
            // currentItems = data.filter(filterRow).slice(indexOfFirstTodo, indexOfLastTodo):
            // currentItems = data.slice(indexOfFirstTodo, indexOfLastTodo)
            
            if (this.props.account != undefined) {
                account_col = (
                    <div className="col d-flex">
                        <span className="my-auto">Total</span>
                    </div>
                )

                // var saldo_awal = 0

                // if(['Asset','Expense'].includes(data[0].account_type)){
                //     saldo_awal = data[0].total + (data[0].credit - data[0].debit)
                // }
                // else{
                //     saldo_awal = data[0].total + (data[0].debit - data[0].credit)
                // }

                // if (data.length > 0 && data[0].debit > 0) {
                //     saldo_awal = data[0].total - data[0].debit
                // } else if (data.length > 0 && data[0].credit > 0) {
                //     saldo_awal = data[0].total + data[0].credit
                // } else if (data.length > 0) {
                //     saldo_awal = data[0].total
                // }

                item_rows.push(
                    <div className="row mx-0">
                        <div className="col row-list row-list-link">
                            <div className="row mx-0 fs12 fw600">
                                <div className="col-1 d-flex">
                                    <span className="my-auto"></span>
                                </div>
                                <div className="col-1 d-flex">
                                    <span className="my-auto"></span>
                                </div>
                                <div className="col-1 d-flex">
                                    <span className="my-auto"></span>
                                </div>
                                <div className="col-1 d-flex">
                                    <span className="my-auto"></span>
                                </div>
                                <div className="col-2 d-flex">
                                    <span className="my-auto"></span>
                                </div>
                                <div className="col-3 d-flex">
                                    <span className="my-auto"></span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto"></span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto"></span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">{formatter2.format(this.props.saldo_awal)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            console.log(this.props.datalength)

            if (this.props.datalength > 0) {
                data.forEach(function (item, index) {
                    // if (item.debit != 0 || item.credit != 0) {
                        // if (currentItems.includes(item)){
                        item_rows.push(
                            <JournalItemsListRow account={ji.props.account} key={item.name} item={item} checkRow={() => ji.props.checkRow(index)} changeRemoveStorage={(value) => ji.props.changeRemoveStorage(value)} />
                        )
                        // }
                    // }
                })
            }

            return (
                <div style={panel_style}>
                    <div className="row mx-0">
                        <div className="col-auto pl-2 pr-3">
                            <input type="checkbox" className="d-block my-3" checked={this.props.check_all} onChange={this.props.checkAll} />
                        </div>
                        <div className="col row-header">
                            <div className="row mx-0 fs12 fw600">
                                <div className="col-1 d-flex">
                                    <span className="my-auto">Period</span>
                                </div>
                                <div className="col-1 d-flex">
                                    <span className="my-auto">Effective Date</span>
                                </div>
                                <div className="col-1 d-flex">
                                    <span className="my-auto">Reference</span>
                                </div>
                                <div className="col-1 d-flex">
                                    <span className="my-auto">Journal Entry</span>
                                </div>
                                <div className="col-2 d-flex">
                                    <span className="my-auto">Keterangan</span>
                                </div>
                                <div className="col-3 d-flex">
                                    <span className="my-auto">Account</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">Debit</span>
                                </div>
                                <div className="col d-flex">
                                    <span className="my-auto">Credit</span>
                                </div>
                                {account_col}
                            </div>
                        </div>
                    </div>
                    {item_rows}
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

class JournalItemsListRow extends React.Component {
    clickRow() {
        var th = this
        this.props.changeRemoveStorage(false)
        setTimeout(function(){
            var href = "/main/accounting/journal-entries/edit?n=" + th.props.item.parent
            window.location.href = href
        }, 500);
    }

    render() {
        var item = this.props.item
        var checked = false
        var account_col
        if (item.checked) {
            checked = true
        }

        if (this.props.account != undefined) {
            account_col = (
                <div className="col d-flex">
                    <span className="my-auto">{formatter2.format(item.total || item.computed_total || 0)}</span>
                </div>
            )
        }

        return (
            <div className="row mx-0">
                <div className="col-auto pl-2 pr-3">
                    <input type="checkbox" className="d-block my-3" checked={checked} onChange={this.props.checkRow} />
                </div>
                <div className="col row-list row-list-link" onClick={() => this.clickRow()}>
                    <div className="row mx-0 fs12 fw600">
                        <div className="col-1 d-flex">
                            <span className="my-auto">{item.period}</span>
                        </div>
                        <div className="col-1 d-flex">
                            <span className="my-auto">{moment(item.date).format("DD-MM-YYYY")}</span>
                        </div>
                        <div className="col-1 d-flex">
                            <span className="my-auto">{item.reference}</span>
                        </div>
                        <div className="col-1 d-flex">
                            <span className="my-auto">{item.parent}</span>
                        </div>
                        <div className="col-2 d-flex">
                            <span className="my-auto">{item.keterangan}</span>
                        </div>
                        <div className="col-3 d-flex">
                            <span className="my-auto">{item.account_name}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{formatter2.format(item.debit)}</span>
                        </div>
                        <div className="col d-flex">
                            <span className="my-auto">{formatter2.format(item.credit)}</span>
                        </div>
                        {account_col}
                    </div>
                </div>
            </div>
        )
    }
}

class PDF extends React.Component {
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
            method: "vet_website.vet_website.doctype.vetprofile.vetprofile.get_profile",
            args: {},
            callback: function (r) {
                if (r.message) {
                    ci.setState({ 'profile': r.message.profile, 'loaded': true });
                }
            }
        });
    }

    render() {
        // var search = this.props.search
        // function filterRow(row) {
        //     function filterField(field) {
        //         return field ? field.toString().includes(search) : false
        //     }
        //     var fields = [row.period, moment(row.date).format("DD-MM-YYYY"), row.account_name, row.reference, row.debit, row.credit]
        //     return ![false, ''].includes(search) ? fields.some(filterField) : true
        // }

        var data = this.props.data
        var profile = this.state.profile
        console.log(data)
        var page_dimension = { width: 559, top: 0, right: 0, background: '#FFF', color: '#000', zIndex: -1 }
        var borderStyle = { border: '1px solid #000', margin: '15px 0' }
        var row2 = { margin: '0 -14px' }
        var th = { border: '1px solid #000' }
        var td = { borderLeft: '1px solid #000', borderRight: '1px solid #000' }
        var fs13 = { fontSize: 13 }
        var fs9 = { fontSize: 9 }
        var invoice = { letterSpacing: 0, lineHeight: '24px', marginBottom: 0, marginTop: 18 }
        var invoice2 = { letterSpacing: 0 }
        var invoice3 = { letterSpacing: 0, marginBottom: 0 }
        var thead = { background: '#d9d9d9', fontSize: 11 }
        var table_rows = []
        var subtitle = ''
        var filters = JSON.parse(sessionStorage.getItem(window.location.pathname))

        if (filters != undefined) {
            if (filters.journal_date != undefined && this.props.mode != undefined) {
                tanggal = ''
                if (this.props.mode == 'monthly') {
                    var bulan = moment(this.props.year + '-' + this.props.month, 'YYYY-MM').format('MM-YYYY')
                    subtitle = 'Monthly ' + bulan
                } else if (this.props.mode == 'annual') {
                    subtitle = 'Annual ' + moment(filters.journal_date).format('YYYY')
                } else if (this.state.mode == 'period') {
                    var sampai_bulan = moment(this.state.year + '-' + this.state.month, 'YYYY-MM').format('MM-YYYY')
                    subtitle = 'Periode ' + moment(filters.journal_min_date).format('MM-YYYY') + '-' + sampai_bulan
                } else if (this.state.mode == 'daily') {
                    subtitle = 'Tanggal ' + moment(filters.journal_min_date).format('DD-MM-YYYY') + '-' + moment(filters.journal_date).format('DD-MM-YYYY')
                }
            } else if (filters.filters.some((element) => element[0] == 'period')) {
                var period = filters.filters.find((e) => e[0] == 'period')
                if (period[1] == '=') {
                    tanggal = period[2]
                } else if (period[1] == '!=') {
                    tanggal = 'Tidak Sama Dengan ' + period[2]
                } else if (period[1] == 'like') {
                    tanggal = 'Seperti ' + period[2].replaceAll('%', '')
                } else if (period[1] == 'not like') {
                    tanggal = 'Tidak Seperti ' + period[2].replaceAll('%', '')
                }
                subtitle += 'Periode ' + period[2].replaceAll('%', '')
            } else if (filters.filters.some((element) => element[0] == 'date')) {
                var date = filters.filters.find((e) => e[0] == 'date')
                var tanggal = ''
                if (date[1] == 'between') {
                    tanggal = date[2] + ' - ' + date[3]
                } else if (date[1] == '=') {
                    tanggal = date[2]
                } else if (date[1] == '!=') {
                    tanggal = 'Tidak Sama Dengan ' + date[2]
                } else if (date[1] == '>') {
                    tanggal = 'Lebih Dari ' + date[2]
                } else if (date[1] == '>=') {
                    tanggal = 'Lebih Dari Sama Dengan ' + date[2]
                } else if (date[1] == '<') {
                    tanggal = 'Kurang Dari ' + date[2]
                } else if (date[1] == '<=') {
                    tanggal = 'Kurang Dari Sama Dengan ' + date[2]
                }
                subtitle += 'Tanggal ' + tanggal
            }
        }

        // const indexOfLastTodo = this.props.currentpage * 30;
        // const indexOfFirstTodo = indexOfLastTodo - 30;
        // var currentItems
        // ![false,''].includes(search)?
        // currentItems = data.filter(filterRow).slice(indexOfFirstTodo, indexOfLastTodo):
        // currentItems = data.slice(indexOfFirstTodo, indexOfLastTodo)
        // // currentItems = data.slice(0,30)

        if (this.props.account != undefined && data.length != 0) {
            // var saldo_awal = 0

            // if(['Asset','Expense'].includes(data[0].account_type)){
            //     saldo_awal = data[0].total + (data[0].credit - data[0].debit)
            // }
            // else{
            //     saldo_awal = data[0].total + (data[0].debit - data[0].credit)
            // }

            // if (data.length > 0 && data[0].debit > 0) {
            //     saldo_awal = data[0].total + data[0].debit
            // } else if (data.length > 0 && data[0].credit > 0) {
            //     saldo_awal = data[0].total - data[0].credit
            // } else if (data.length > 0) {
            //     saldo_awal = data[0].total
            // }

            table_rows.push(
                <tr key='999999' style={fs9}>
                    <td className="py-1" width="89px"></td>
                    <td className="py-1" width="88px"></td>
                    <td className="py-1" width="88px"></td>
                    <td className="py-1" width="88px"></td>
                    <td className="py-1" width="202px"></td>
                    <td className="py-1" width="90px"></td>
                    <td className="py-1" width="90px"></td>
                    <td className="py-1" width="90px">{formatter2.format(this.props.saldo_awal)}</td>
                </tr>
            )
        }

        if (this.props.datalength > 0) {
            data.forEach((d, index) => {
                var account_col
                if (this.props.account != undefined) {
                    account_col = (
                        <td className="py-1" width="90px">{formatter2.format(d.total || d.computed_total || 0)}</td>
                    )
                }
    
                table_rows.push(
                    <tr key={d.name} style={fs9}>
                        <td className="py-1" width="89px">{moment(d.date).format('DD-MM-YYYY')}</td>
                        <td className="py-1" width="88px">{d.reference}</td>
                        <td className="py-1" width="88px">{d.parent}</td>
                        <td className="py-1" width="88px">{d.keterangan}</td>
                        <td className="py-1" width="202px">{d.account_name}</td>
                        <td className="py-1" width="90px">{formatter2.format(d.debit)}</td>
                        <td className="py-1" width="90px">{formatter2.format(d.credit)}</td>
                        {account_col}
                    </tr>
                )
            })
        }

        var account_name

        if (this.props.account_name) {
            account_name = <p className="fw600 text-right text-uppercase fs14" style={invoice2}>{this.props.account_name}</p>
        }

        if (this.state.loaded) {
            var image, account_col
            if (profile.image != undefined) {
                var image_style = { position: 'absolute', top: 0, left: 0, objectFit: 'cover', height: '100%' }
                image = <img src={profile.temp_image || profile.image} style={image_style} />
            } else {
                image = <img src={profile.temp_image} style={image_style} />
            }

            if (this.props.account != undefined) {
                account_col = (
                    <th className="fw700 py-1" width="90px">Total</th>
                )
            }

            return (
                <div className="position-absolute d-none" style={page_dimension}>
                    <div id="pdf-1" className="px-4" style={page_dimension}>
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
                                <p className="fwbold text-right text-uppercase fs28" style={invoice}>{this.props.account ? 'General Ledger' : 'Journal'}</p>
                                {account_name}
                                <p className="fw600 text-right text-uppercase fs14" style={invoice2}>{subtitle}</p>
                            </div>
                            <div className="col-12" style={borderStyle} />
                        </div>
                        <table className="fs12" style={row2}>
                            <thead className="text-uppercase" style={thead}>
                                <tr className="text-center">
                                    <th className="fw700 py-2" width="89px">Tanggal</th>
                                    <th className="fw700 py-2" width="88px">Reference</th>
                                    <th className="fw700 py-2" width="88px">Journal</th>
                                    <th className="fw700 py-2" width="88px">Keterangan</th>
                                    <th className="fw700 py-2" width="202px">Account</th>
                                    <th className="fw700 py-2" width="90px">Debit</th>
                                    <th className="fw700 py-2" width="90px">Credit</th>
                                    {account_col}
                                </tr>
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

class PDFListPage extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        var data = this.props.data
        var page_dimension = { width: 559, top: 0, right: 0, background: '#FFF', color: '#000', zIndex: -1 }
        var row2 = { margin: '0 -14px' }
        var fs9 = { fontSize: 9 }
        var table_rows = []

        if (this.props.datalength > 0) {
            data.forEach((d, index) => {
                var account_col
                if (this.props.account != undefined) {
                    account_col = (
                        <td className="py-1" width="90px">{formatter2.format(d.total || d.computed_total || 0)}</td>
                    )
                }
    
                table_rows.push(
                    <tr key={d.name} style={fs9}>
                        <td className="py-1" width="89px">{moment(d.date).format('DD-MM-YYYY')}</td>
                        <td className="py-1" width="88px">{d.reference}</td>
                        <td className="py-1" width="88px">{d.parent}</td>
                        <td className="py-1" width="88px">{d.keterangan}</td>
                        <td className="py-1" width="202px">{d.account_name}</td>
                        <td className="py-1" width="90px">{formatter2.format(d.debit)}</td>
                        <td className="py-1" width="90px">{formatter2.format(d.credit)}</td>
                        {account_col}
                    </tr>
                )
            })
        }

        return (
            <div className="position-absolute d-none" style={page_dimension}>
                <div id={"pdf-"+this.props.pdfPage} className="px-4" style={page_dimension}>
                    <table className="fs12" style={row2}>
                        <tbody>
                            {table_rows}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }
}

if (ji != undefined) {
    ReactDOM.render(<JournalItems />, document.getElementById('journal_item_list'))
}
if (gl != undefined) {
    ReactDOM.render(<JournalItems account={accountParams} />, document.getElementById('general_ledger_list'))
}
