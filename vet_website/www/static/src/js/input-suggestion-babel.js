class InputSuggestion extends React.Component {
    render() {
        if (this.props.suggestions.suggestions.length != 0) {
            var suggestion_rows = []
            this.props.suggestions.suggestions.forEach(function(row,index){
                suggestion_rows.push(
                    <div className="suggestion-row" key={index.toString()} onClick={row.onClick}>{ row.label }</div>
                )
            })
            suggestion_rows.push(
                <div className="suggestion-row" key="999999" onClick={this.props.searchAction}><i className="fa fa-search mr-2"></i>Search More</div>
            )
        }
        
        return(
            <div className="suggestion-container" onClick={e => e.stopPropagation()}>
                <div className="suggestion-list">
                	{suggestion_rows}
                </div>
                <div className="suggestion-close" onClick={this.props.closeSuggestion}/>
            </div>
        )
    }
}