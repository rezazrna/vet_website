class RecordNavigation extends React.Component {
    render(){
        var margin = {marginBottom: '-20px'}
        var buttons
        var rowclass = "row justify-content-end"
        var leftclass = "navigation-button button-left"
        var rightclass = "navigation-button button-right"
        var currentname = this.props.currentname
        var namelist = this.props.namelist
        if(currentname != undefined){
            var leftClick, rightClick
            if (namelist == undefined){
                leftclass = "navigation-button disabled button-left"
                leftClick = e => e.preventDefault()
                rightclass = "navigation-button disabled button-right"
                rightClick = e => e.preventDefault()
            }
            else{
                leftClick = () => this.props.navigationAction(namelist[namelist.indexOf(currentname)-1])
                rightClick = () => this.props.navigationAction(namelist[namelist.indexOf(currentname)+1])
                if(namelist.indexOf(currentname) == 0){
                    leftclass = "navigation-button disabled button-left"
                    leftClick = e => e.preventDefault()
                }
                if(namelist.indexOf(currentname) == namelist.length-1){
                    rightclass = "navigation-button disabled button-right"
                    rightClick = e => e.preventDefault()
                }
            }
            buttons = (
                <div className="col-auto d-flex">
            		<div className={leftclass} onClick={leftClick}/>
            		<div className={rightclass} onClick={rightClick}/>
            	</div>
            )
        }
        
        if(this.props.zero_margin == true){
            margin.marginBottom = 15
        }
        
        return(
            <div className={rowclass}>
                <div className="col-auto px-0 d-flex" style={margin}>
                    {buttons}
                </div>
            </div>
        )
    }
}