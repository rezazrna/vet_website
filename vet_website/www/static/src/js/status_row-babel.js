class StatusRow extends React.Component {
    render() {
        var status = []
        var cs = this
        var active = true
        var statusMargin = {marginBottom: '-20px'}
        
        this.props.statuses.forEach(function(stat, index) {
            var statusChecker
            
            if (active) {
                statusChecker = 'active'
            }
            
            if (cs.props.current_status == stat) {
                active = false
            }
            
            var ellipsis = <i className="fa fa-lg fa-ellipsis-h"></i>
            var check = <div className="status-col-check"><i className="fa fa-2x fa-check-circle"></i></div>
            
            status.push(
                <div title={stat} className={"col-auto status-col2 " + statusChecker} key={index.toString()}>
        			<div className="status-col-connector">
        			</div>
        			<p className="status-col-title mb-0">
        				{stat}
        			</p>
        		</div>
                )
        })
        
        return <div className="row justify-content-end">
                	<div className="col-auto px-0 d-flex" style={statusMargin}>
                		{status}
                	</div>
                </div>
    }
}