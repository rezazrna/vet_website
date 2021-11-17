class Pagination extends React.Component {
    componentDidMount() {
        var pager = this
        this.$el = $(this.el);
        if (this.props.datalength > this.props.itemperpage){
            this.$pager = this.$el.pagination({
                dataSource: new Array(Number(this.props.datalength)),
                pageNumber: Number(this.props.currentpage),
                pageSize: Number(this.props.itemperpage),
                showPrevious: false,
                showNext: false,
                callback: function(data, pagination) {
                    if ( pagination.pageNumber != Number(pager.props.currentpage) ) {
                        var mainpage = document.getElementsByClassName('main-page')
                        // // document.body.scrollTop = document.documentElement.scrollTop = 0;
                        mainpage[0]?mainpage[0].scrollTop = 0:false
                        pager.props.paginationClick(pagination.pageNumber)
                    }
                }
            })   
        }
    }
  
    componentDidUpdate(prevProps) {
        var pager = this
        if (this.props.datalength > this.props.itemperpage){
            this.$pager = this.$el.pagination({
                dataSource: new Array(Number(this.props.datalength)),
                pageNumber: Number(this.props.currentpage),
                pageSize: Number(this.props.itemperpage),
                showPrevious: false,
                showNext: false,
                callback: function(data, pagination) {
                    if ( pagination.pageNumber != Number(pager.props.currentpage) ) {
                        var mainpage = document.getElementsByClassName('main-page')
                        // document.body.scrollTop = document.documentElement.scrollTop = 0;
                        mainpage[0]?mainpage[0].scrollTop = 0:false
                        pager.props.paginationClick(pagination.pageNumber)
                    }
                }
            })
        }
        else {
            if(this.$pager != undefined){
                this.$pager.pagination('destroy');
            }
        }
    }

  componentWillUnmount() {
      if (this.$pager != undefined) {
          this.$pager.pagination('destroy');
      }
  }

  render() {
    return (
        <div className="row justify-content-center mt-5">
            <div className="payment-pagination" ref={el => this.el = el}>
            </div>
        </div>
    );
  }
}