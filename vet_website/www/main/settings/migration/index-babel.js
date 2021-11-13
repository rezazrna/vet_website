class Migration extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            master: [],
            computation: []
        }
        this.uploadAction = this.uploadAction.bind(this)
    }
    
    componentDidMount(){
        var th = this
        frappe.call({
            type: 'GET',
            method: 'vet_website.methods.get_migration_table',
            args: {},
            callback: function(r){
                console.log(r.message)
                if(r.message.master){
                    th.setState({master: r.message.master})
                }
                if(r.message.computation){
                    th.setState({computation: r.message.computation})
                }
            }
        })
    }
    
    uploadAction(e, type, index) {
        var th = this
        var img = e.target.files[0];
        
        var new_data = this.state[type].slice()
        var reader = new FileReader();
        reader.onload = function(e) {
            var update = {}
            new_data[index].filename = img.name,
            new_data[index].dataurl = reader.result
            frappe.call({
                type: "POST",
                method: "vet_website.methods.new_migration_upload",
                args: {data: new_data[index]},
                callback: function(r){
                    if (r.message.error){
                        frappe.msgprint(r.message.error)
                    } else if (r.message.import){
                        console.log(r.message.import)
                        new_data[index].import = r.message.import
                        update[type] = new_data
                        th.setState(update)
                        window.location.href = '/main/settings/migration/detail?n='+encodeURIComponent(r.message.import.name)
                    }
                }
            })
        }
        reader.readAsDataURL(img);
    }
    
    render(){
        return(
            <div>
                <MigrationGroup title="Master" type='master' data={this.state.master} uploadAction={this.uploadAction}/>
                <MigrationGroup title="Computation" type='computation' data={this.state.computation} uploadAction={this.uploadAction}/>
            </div>
        )
    }
}

function MigrationGroup(props){
    var boxShadow = {boxShadow: "0px 4px 23px rgba(0, 0, 0, 0.1)", padding: '35px 25px'}
    
    var items = []
    props.data.forEach((d, index) => items.push(<MigrationItem key={d.title} item={d} type={props.type} index={index.toString()} uploadAction={props.uploadAction}/>))
    
    return(
        <div className="mb-3">
            <p className="fs18 fw600 mb-1">{props.title}</p>
            <div style={boxShadow} className="bg-white">
                <div className="row">
                    {items}
                </div>
            </div>
        </div>
    )
}

function MigrationItem(props){
    var styles = {
        panel: {background: '#84D1FF',borderRadius: 10, color: '#056EAD', padding: '12px 15px'},
        downloadBtn: {background: '#2AA416', borderRadius: 3, color: '#FFF', padding: '4px 10px'},
        color: {color: '#056EAD'}
    }
    
    function downloadAction(e){
        e.preventDefault()
        props.item.doctype?window.open('/static/migration/'+props.item.doctype+'.csv'):false
    }
    
    return(
        <div className="col-4 mb-3">
            <div style={styles.panel}>
                <div className="row">
                    <div className="col-5 text-right">
                        <a href={props.item.link}>
                            <MigrationIcon title={props.item.title}/>
                        </a>
                    </div>
                    <div className="col-7 d-flex">
                        <a href={props.item.link} className="fs14 fw600 my-auto text-decoration-none" style={styles.color}>
                            {props.item.title}
                        </a>
                    </div>
                </div>
                <div className="row">
                    <div className="col-5 text-right">
                        <MigrationUpload uploadAction={props.uploadAction} index={props.index} type={props.type}/>
                    </div>
                    <div className="col-7">
                        <button type="button" className="btn fs12" style={styles.downloadBtn} onClick={e => downloadAction(e)}>Download Sample</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

class MigrationUpload extends React.Component {
    clickFile(){
        if(this.$file != undefined){
            var file = this.$file
            $(file).trigger('click');
        }
    }
    
    render(){
        var props = this.props
        var uploadBtn = {background: '#056EAD', borderRadius: 3, color: '#FFF', padding: '4px 10px'}
        
        return(
            <div>
                <input type="file" className="d-none" name="file" onChange={e => props.uploadAction(e, props.type, props.index)} ref={(ref) => this.$file = ref}/>
                <button type="button" className="btn fs12" style={uploadBtn} onClick={() => this.clickFile()}>Upload File</button>
            </div>
        )
    }
}

function MigrationIcon(props){
    var icon_name = props.title.replace(/ /g, '-').toLowerCase();
    ['Hutang Awal', 'Piutang Awal'].includes(props.title)?icon_name = 'hutang-piutang-awal':false
    return (
        <div className="my-3">
            <img src={"/static/img/main/migration/migration-"+icon_name+".png"}/>
        </div>
    )
}

var migration = document.getElementById('migration')
migration?ReactDOM.render(<Migration/>, migration):false