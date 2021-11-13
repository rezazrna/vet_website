class Journals extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            new_journal: {},
            data: [],
            accounts: [],
            loaded: false,
            currentUser: {}
        }
        this.journalSearch = this.journalSearch.bind(this)
        this.inputChange = this.inputChange.bind(this)
        this.inputBlur = this.inputBlur.bind(this)
        this.formSubmit = this.formSubmit.bind(this)
        this.editJournal = this.editJournal.bind(this)
        this.deleteJournal = this.deleteJournal.bind(this)
    }
    
    componentDidMount(){
        var th = this
        frappe.call({
            type: "GET",
            method:"vet_website.methods.get_current_user",
            args: {},
            callback: function(r){
                if (r.message) {
                    th.setState({'currentUser': r.message});
                }
            }
        });
        frappe.call({
            type: 'GET',
            method: 'vet_website.vet_website.doctype.vetjournal.vetjournal.get_coa_form',
            args: {},
            callback: function(r){
                if(r.message){
                    th.setState({accounts: r.message})
                }
            }
        })
        this.journalSearch({})
    }
    
    journalSearch(filters){
        var th = this
        frappe.call({
            type: 'GET',
            method: 'vet_website.vet_website.doctype.vetjournal.vetjournal.get_all_journal',
            args: {filters: filters},
            callback: function(r){
                if(r.message){
                    th.setState({data: r.message, loaded: true})
                }
            }
        })
    }
    
    editJournal(name){
        var journal = this.state.data.find(j => j.name == name)
        var new_journal = Object.assign({}, journal)
        this.setState({new_journal: new_journal})
    }
    
    deleteJournal(name){
        var th = this
        frappe.call({
            type: 'POST',
            method: 'vet_website.vet_website.doctype.vetjournal.vetjournal.delete_journal',
            args: {name: name},
            callback: function(r){
                if(r.message){
                    th.setState({data: r.message})
                }
            }
        })
    }
    
    inputChange(e){
        var name = e.target.name
        var value = e.target.value
        var new_journal = Object.assign({}, this.state.new_journal)
        new_journal[name] = value
        this.setState({new_journal: new_journal})
    }
    
    inputBlur(e){
        var name = e.target.name
        var value = e.target.value
        var new_journal = Object.assign({}, this.state.new_journal)
        if(['default_debit_account_name', 'default_credit_account_name'].includes(name)){
            var account = this.state.accounts.find(a => a.account_name == value)
            if(account){
                if(name == 'default_debit_account_name'){
                    new_journal.default_debit_account = account.name
                }
                if(name == 'default_credit_account_name'){
                    new_journal.default_credit_account = account.name
                }
            } else {
                if(name == 'default_debit_account_name'){
                    new_journal.default_debit_account = undefined
                    new_journal.default_debit_account_name = undefined
                }
                if(name == 'default_credit_account_name'){
                    new_journal.default_credit_account = undefined
                    new_journal.default_credit_account_name = undefined
                }
            }
            this.setState({new_journal: new_journal})
        }
    }
    
    formSubmit(e){
        e.preventDefault()
        var th = this
        var new_journal = this.state.new_journal
        frappe.call({
            type: 'POST',
            method: 'vet_website.vet_website.doctype.vetjournal.vetjournal.new_journal',
            args: {data: new_journal},
            callback: function(r){
                if(r.message){
                    th.setState({data: r.message, new_journal: {}})
                }
            }
        })
    }
    
    render(){
        
        var sorts = [
    					{'label': 'Nama Journal DESC', 'value': 'journal_name desc'},
    					{'label': 'Nama Journal ASC', 'value': 'journal_name asc'},
    					{'label': 'Code DESC', 'value': 'code desc'},
    					{'label': 'Code ASC', 'value': 'code asc'},
					]
					
		var field_list = [
		                {'label': 'Nama Journal', 'field': 'journal_name', 'type': 'char'},
		                {'label': 'Code', 'field': 'code', 'type': 'char'},
		            ]
		            
        var row_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '20px 32px 20px 12px', 'marginBottom': '18px'}
        var write = checkPermission('VetJournal', this.state.currentUser, 'write')
        return(
            <div>
                <div className="row mx-0" style={row_style}>
                    <div className="col-4 my-auto"/>
                    <div className="col-8">
                        <Filter sorts={sorts} searchAction={this.journalSearch} field_list={field_list}/>
                    </div>
                </div>
                <JournalsList write={write} accounts={this.state.accounts} new_journal={this.state.new_journal} data={this.state.data} inputChange={this.inputChange} formSubmit={this.formSubmit} deleteJournal={this.deleteJournal} editJournal={this.editJournal} inputBlur={this.inputBlur}/>
            </div>
        )
    }
}

function JournalsList(props){
    var panel_style = {'background': '#FFFFFF', 'boxShadow': '0px 4px 23px rgba(0, 0, 0, 0.1)', 'padding': '40px 32px'}
    var rows = []
    
    props.data.forEach(d => rows.push(<JournalsListRow key={d.name} item={d} write={props.write} deleteJournal={props.deleteJournal} editJournal={props.editJournal}/>))
    
    var code = (
        <div className="col">
            <label htmlFor="code" className="fs14 fw600">Code</label>
            <input className="form-control fs14" id="code" name="code" required value={props.new_journal.code||''} onChange={e => props.inputChange(e)}/>
        </div>
    )
    
    var account_options = []
    props.accounts.forEach(a => account_options.push(<option key={a.name}>{a.account_name}</option>))
    
    return(
        <div>
            <p className="fs18 fw600 mb-2">Journals</p>
            <div style={panel_style}>
                <form className="row mb-3" onSubmit={e => props.formSubmit(e)}>
                    {props.new_journal.name?false:code}
                    <div className="col">
                        <label htmlFor="journal_name" className="fs14 fw600">Nama Journal</label>
                        <input className="form-control fs14" id="journal_name" name="journal_name" required value={props.new_journal.journal_name||''} onChange={e => props.inputChange(e)}/>
                    </div>
                    <div className="col">
                        <label htmlFor="type" className="fs14 fw600">Type</label>
                        <select className="form-control fs14" id="type" name="type" required value={props.new_journal.type||''} onChange={e => props.inputChange(e)}>
                            <option>Sale</option>
                            <option>Sale Refund</option>
                            <option>Purchase</option>
                            <option>Purchase Refund</option>
                            <option>Bank</option>
                            <option>Cash</option>
                            <option>General</option>
                            <option>Situation</option>
                        </select>
                    </div>
                    <datalist id="accounts">
                        {account_options}
                    </datalist>
                    <div className="col">
                        <label htmlFor="default_debit_account_name" className="fs14 fw600">Default Debit Account</label>
                        <input list="accounts" className="form-control fs14" id="default_debit_account_name" name="default_debit_account_name" value={props.new_journal.default_debit_account_name||props.new_journal.default_debit_account||''} onChange={e => props.inputChange(e)} onBlur={e => props.inputBlur(e)}/>
                    </div>
                    <div className="col">
                        <label htmlFor="default_credit_account_name" className="fs14 fw600">Default Credit Account</label>
                        <input list="accounts" className="form-control fs14" id="default_credit_account_name" name="default_credit_account_name" value={props.new_journal.default_credit_account_name||props.new_journal.default_credit_account||''} onChange={e => props.inputChange(e)} onBlur={e => props.inputBlur(e)}/>
                    </div>
                    <div className="col d-flex">
                        <button type="submit" className="btn btn-block btn-danger fs12 fwbold mt-auto">{props.new_journal.name?'Simpan':(<span><i className="fa fa-plus mr-2"/>Tambah</span>)}</button>
                    </div>
                </form>
                {rows}
            </div>
        </div>
    )
}

function JournalsListRow(props){
    var row_style = {background: '#84D1FF', borderRadius: 4, color: '#056EAD'}
    var cursor = {cursor: 'pointer'}
    var item = props.item
    return(
        <div style={row_style} className="fs16 fw600 px-3 py-2 mb-2">
            <div className="row">
                <div className="col my-auto">
                    {item.code}
                </div>
                <div className="col my-auto">
                    {item.type}
                </div>
                <div className="col my-auto">
                    {item.journal_name}
                </div>
                <div className="col my-auto">
                    {item.default_debit_account_name||item.default_debit_account}
                </div>
                <div className="col my-auto">
                    {item.default_credit_account_name||item.default_credit_account}
                </div>
                <div className="col text-right fs18">
                    {props.write?<i className="fa fa-edit mx-2" style={cursor} onClick={() => props.editJournal(item.name)}/>:false}
                    <i className="fa fa-trash mx-2" style={cursor} onClick={() => props.deleteJournal(item.name)}/>
                </div>
            </div>
        </div>
    )
}

var journals = document.getElementById('journals')
journals?ReactDOM.render(<Journals/>,journals):false