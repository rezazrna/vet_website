class ClosingBook extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'year': moment().format('YYYY'),
            'min_date': moment(moment().format('YYYY') + '-01' + '-01', 'YYYY-MM-DD').format('YYYY-MM-DD'),
            'max_date': moment(moment().format('YYYY') + '-12' + '-31', 'YYYY-MM-DD').format('YYYY-MM-DD'),
            'loading': false,
        }
    }
    
    closingBook() {
        var th = this
        if (!this.state.loading) {
            if(this.state.year != ''){
                this.setState({'loading': true})
                console.log(this.state.min_date, this.state.max_date)
                frappe.call({
                    type: "GET",
                    method:"vet_website.vet_website.doctype.vetcoa.vetcoa.close_book",
                    args: {min_date: this.state.min_date, max_date: this.state.max_date},
                    callback: function(r){
                        if (r.message) {
                            console.log(r.message)
                            if (r.message.error) {
                                frappe.msgprint(r.message.error);
                            } else {
                                th.setState({'loading': false})
                                frappe.msgprint('Berhasil')
                            }
                        }
                    }
                });
            } else{
                frappe.msgprint('Pilih tahun terlebih dahulu');
            }
        }
    }

    resetAccount() {
        var th = this
        if (!this.state.loading) {
            if(this.state.year != ''){
                this.setState({'loading': true})
                console.log(this.state.year)
                frappe.call({
                    type: "GET",
                    method:"vet_website.vet_website.doctype.vetcoa.vetcoa.reset_account_company_results",
                    args: {year: this.state.year},
                    callback: function(r){
                        if (r.message) {
                            console.log(r.message)
                            if (r.message.error) {
                                frappe.msgprint(r.message.error);
                            } else {
                                th.setState({'loading': false})
                                frappe.msgprint('Berhasil')
                            }
                        }
                    }
                });
            } else{
                frappe.msgprint('Pilih tahun terlebih dahulu');
            }
        }
    }

    handleInputOnChange(e) {
        var th = this
        var name = e.target.name
        var value = e.target.value
        console.log(name, value)
        if (name == 'year') {
            var min_date = moment(value + '-01' + '-01', 'YYYY-MM-DD').format('YYYY-MM-DD')
            var max_date = moment(value + '-12' + '-31', 'YYYY-MM-DD').format('YYYY-MM-DD')
            th.setState({ year: value, min_date: min_date, max_date: max_date})
        }
    }
    
    render() {
		var box_style = {background: '#FFFFFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', padding: '80px 0'}
        var width_style = {width: '450px'}
        var year_options = []
        for(var i = 0; i <= 11; i++){
            var moment_year = moment().add(-i, 'year')
            year_options.push(<option key={moment_year.format('YYYY')}>{moment_year.format('YYYY')}</option>)
        }

        return(
            <div style={box_style}>
                <div className="row justify-content-center">
                    <div className="col-auto" style={width_style}>
                        <h1 className="text-center mb-5">Proses Tutup Tahun</h1>
                        <p>Proses Tutup Tahun Buku adalah proses penutupan data transaksi pada akun-akun yang terdapat dalam Laporan Laba/(Rugi)</p>
                        <p>Apabila terdapat perubahan data pada bulan yang telah berlalu maka anda diwajibkan untuk melakukan proses tutup tahun buku kembali.</p>
                        <p>Apabila terdapat stok minus maka diwajibkan untuk melakukan perhitungan stok (stock opname).</p>
                        <div className="row mx-0 mb-3">
                            <span className="my-auto">Akhir periode: Desember</span>
                            <div className="col-auto my-auto">
                                <select name="year" className="form-control" value={this.state.year} onChange={e => this.handleInputOnChange(e)}>
                                    {year_options}
                                </select>
                            </div>
                        </div>
                        <div className="row mx-0 mb-3">
                            <span className="my-auto">{'Periode Akutansi: ' +  moment(this.state.min_date).format("DD-MM-YYYY") + ' s/d ' + moment(this.state.max_date).format("DD-MM-YYYY")}</span>
                        </div>
                        <div className="row justify-content-center">
                            <button className={this.state.loading
                                ? "btn btn-outline-danger text-uppercase fs12 fwbold mx-2 disabled"
                                : "btn btn-outline-danger text-uppercase fs12 fwbold mx-2"} onClick={e => this.closingBook(e)}>{this.state.loading
                                ? (<span><i className="fa fa-spin fa-circle-o-notch mr-3"/>Loading...</span>)
                                : "Proses"}</button>
                            {/* <button className={this.state.loading
                                ? "btn btn-outline-danger text-uppercase fs12 fwbold mx-2 disabled"
                                : "btn btn-outline-danger text-uppercase fs12 fwbold mx-2"} onClick={e => this.resetAccount(e)}>{this.state.loading
                                ? (<span><i className="fa fa-spin fa-circle-o-notch mr-3"/>Loading...</span>)
                                : "Reset Akun Tanpa Closing"}</button> */}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

ReactDOM.render(<ClosingBook/>, document.getElementById('closing_book_menu'))