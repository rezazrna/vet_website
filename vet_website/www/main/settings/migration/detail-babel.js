var id = getUrlParameter('n')

class MigrationDetail extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            data: {},
            loaded: false,
            show_only_error: false
        }
        this.toggleShowOnlyError = this.toggleShowOnlyError.bind(this)
    }
    
    componentDidMount(){
        var th = this
        
        frappe.call({
            type: "GET",
            method: "vet_website.methods.get_data_import",
            args: {name: id},
            callback: function(r){
                console.log(r.message)
                if(r.message.error){
                    frappe.msgprint(r.message.error)
                } else if(r.message.import){
                    th.setState({data: r.message.import, loaded: true})
                }
            }
        })
    }
    
    toggleShowOnlyError(){
        this.setState({show_only_error: !this.state.show_only_error})
    }
    
    render() {
        var panel_style = {background: '#FFFFFF', boxShadow: '0px 4px 23px rgba(0, 0, 0, 0.1)', padding: '2px 32px', marginBottom: '15px'}
        var rowMinHeight = {minHeight: '60px'}
        var buttonMode = []
        var color = {color: '#056EAD', cursor: 'pointer'}
        var color_red = {color: '#ED223A'}
        var color_green = {color: '#5FA630'}
        var status_label = {fontSize: 25, fontWeight: 'bold'}
        var backButton = <a href="/main/settings/migration" className="fs16 fw600 mr-auto my-auto" style={color}><i className="fa fa-chevron-left mr-1" style={color}></i>Back</a>
        
        if (this.state.loaded) {
            var status_style    
            ['Partial Success','Error'].includes(this.state.data.status)?
            status_style = Object.assign({}, status_label, color_red):
            this.state.data.status == 'Success'?
            status_style = Object.assign({}, status_label, color_green):
            status_style = Object.assign({}, status_label)
            
            buttonMode.push(<div key="998" className="col-auto d-flex my-auto mr-auto"><span style={status_style}>{this.state.data.status}</span></div>)
            
            buttonMode.push(<div key="999" className="col-auto d-flex mr-auto">{backButton}</div>)
            
            return <div>
                    	<div style={panel_style}>
                    		<div className="row mx-0 flex-row-reverse" style={rowMinHeight}>
                    			{buttonMode}
                    		</div>
                    	</div>
                    	<MigrationDetailDetail show_only_error={this.state.show_only_error} toggleShowOnlyError={this.toggleShowOnlyError} data={this.state.data}/>
                    </div>
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

function MigrationDetailDetail(props){
    var boxShadow = {boxShadow: "0px 4px 23px rgba(0, 0, 0, 0.1)", padding: '35px 25px'}
    var header_color = {color: '#1B577B'}
    var border = {border: '1px solid #CBD3DA'}
    var maxWidth = {maxWidth: 112}
    var cursor = {cursor: 'pointer'}
    var log_row = []
    props.data.import_log&&props.data.import_log.length > 0&&JSON.parse(props.data.import_log).length > 0?
    JSON.parse(props.data.import_log).filter(l => props.show_only_error?!l.success:l).forEach((l, index) => {
        log_row.push(
            <MigrationDetailDetailRow item={l} mode="log" key={index.toString()}/>
        )
    }):false
    var show_only_error
    props.data.import_log&&props.data.import_log.length > 0&&JSON.parse(props.data.import_log).filter(l => !l.success).length > 0?
    show_only_error = (
        <div className="row justify-content-end fs14 fw600 mx-0 mb-3" style={header_color}>
            <div className="col-auto">
                <span style={cursor} onClick={() => props.toggleShowOnlyError()}>
                {props.show_only_error?
                (<i className="fa fa-check-square fs16 mr-2"/>):
                (<i className="fa fa-square-o fs16 mr-2"/>)
                }
                Show only errors
                </span>
            </div>
        </div>
    ):false
    
    var log_detail = (
        <div>
            {show_only_error}
            <div className="row fs14 text-center fw600 mx-0" style={header_color}>
                <div className="col py-3" style={Object.assign({}, border, maxWidth)}>
                    Row No
                </div>
                <div className="col py-3" style={border}>
                    Row Status
                </div>
                <div className="col py-3" style={border}>
                    Message
                </div>
            </div>
            {log_row}
        </div>
    )
    
    var warning_row = []
    props.data.template_warnings&&props.data.template_warnings.length > 0&&JSON.parse(props.data.template_warnings).length > 0?
    JSON.parse(props.data.template_warnings).forEach((l, index) => {
        l.row?
        warning_row.push(
            <MigrationDetailDetailRow item={l} mode="warning" key={index.toString()}/>
        ):false
    }):false
    
    var warning_detail = (
        <div>
            <div className="row fs14 text-center fw600 mx-0" style={header_color}>
                <div className="col py-3" style={Object.assign({}, border, maxWidth)}>
                    Row No
                </div>
                <div className="col py-3" style={border}>
                    Message
                </div>
            </div>
            {warning_row}
        </div>
    )
    
    return(
        <div className="mb-3">
            <p className="fs18 fw600 mb-1">Master</p>
            <div style={boxShadow} className="bg-white">
                {log_row.length > 0?log_detail:false}
                {warning_row.length > 0?warning_detail:false}
            </div>
        </div>
    )
}

function MigrationDetailDetailRow(props){
    var maxWidth = {maxWidth: 112}
    var color = {color: '#787E84'}
    var color_red = {color: '#FF5858'}
    var color_green = {color: '#98D85B'}
    var border = {border: '1px solid #CBD3DA'}
    var status_circle = <i className="fa fa-circle mr-2" style={props.item.success?color_green:color_red}/>
    
    var error_messages = []
    if(props.item.messages&&props.item.messages.length > 0){
       props.item.messages.forEach(m => {
           var message_item = JSON.parse(m)
           
           error_messages.push(message_item.message.replace(/<b>/g,'').replace(/<\/b>/g,''))
       }) 
    }
    
    if (props.mode == 'log'){
        return(
            <div className="row fs14 fw600 mx-0" style={color}>
                <div className="col py-3 text-center" style={Object.assign({}, border, maxWidth)}>
                    {props.item.row_indexes}
                </div>
                <div className="col py-3" style={border}>
                    {status_circle} {props.item.success?'Inserted row for "'+props.item.docname+'"':'Error for row '+props.item.row_indexes}
                </div>
                <div className="col py-3" style={border}>
                    {props.item.success?'Document succesfully saved':error_messages}
                </div>
            </div>
        )
    } else if (props.mode == 'warning'){
        return(
            <div className="row fs14 fw600 mx-0" style={color}>
                <div className="col py-3 text-center" style={Object.assign({}, border, maxWidth)}>
                    {props.item.row}
                </div>
                <div className="col py-3" style={border}>
                    {props.item.message.replace(/<b>/g,'').replace(/<\/b>/g,'')}
                </div>
            </div>
        )
    }
}

var migration_detail = document.getElementById("migration_detail")
migration_detail?ReactDOM.render(<MigrationDetail/>, migration_detail):false