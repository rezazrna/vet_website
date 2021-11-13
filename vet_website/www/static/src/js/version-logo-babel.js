class VersionLogo extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            show_detail_popup: false
        };
        
        this.toggleDetailPopup = this.toggleDetailPopup.bind(this)
    }
    
    toggleDetailPopup(){
        this.setState({show_detail_popup: !this.state.show_detail_popup})
    }
    
    render(){
        var logo="/static/img/main/menu/default-logo-development.png"
        var style = {cursor: 'pointer'}
        var onclick
        
        if(['alpha','beta','development'].includes(this.props.version)){
            logo="/static/img/main/menu/default-logo-"+this.props.version+".png"
            onclick = () => this.toggleDetailPopup()
        }
        else if(this.props.version == 'release'){
            logo="/static/img/main/menu/default-logo.png"
            var style = {}
        }
        
        var popup
        if(this.state.show_detail_popup){
            popup = <VersionDetailPopup togglePopup={() => this.toggleDetailPopup()}/>
        }
        
        return(
            <div>
                <img src={logo} style={style} onClick={onclick}/>
                {popup}
            </div>
        )
    }
}

class VersionDetailPopup extends React.Component {
    render(){
        var div_style = {color: '#49A4CD', borderRadius: '25px', maxHeight: '100vh',}
        var container_style = {maxWidth: '512px'}
        var content_style = {overflow: 'hidden', maxHeight: '100%'}
        var cursor = {cursor: 'pointer'}
        
        var slider_data = [
                {
                    image: "/static/img/main/menu/version-development.png",
                    title: "Development Version",
                    contents:[
                        "Aplikasi masih dalam tahap pengembangan oleh developper. Anda bisa menggunakan aplikasi untuk melakukan transaksi percobaan, tetapi tidak dapat digunakan untuk melakukan transaksi sungguhan."
                    ]
                },
                {
                    image: "/static/img/main/menu/version-alpha-beta.png",
                    title: "Alpha Version",
                    contents:[
                        "Aplikasi sudah selesai dari tahap development. Artinya semua fitur utama yang penting agar aplikasi dapat digunakan telah tersedia. Tetapi fitur-fitur pada aplikasi masih belum stabil, yaitu masih rawan timbul masalah/error.",
                        "Apabila aplikasi menggunakan data dummy, Anda bisa melakukan transaksi apapun untuk menguji keandalan sistem. Namun jika menggunakan data real, Anda diharapkan untuk berhati-hati saat melakukan transaksi. Yaitu dengan melakukan double check pada setiap transaksi yang Anda lakukan. Apakah data nya sudah tersimpan atau terkirim, apakah perhitungannya sudah benar, apakah data yang ditampilkan sudah benar dan sebagai nya.",
                        "Apabila Anda menemukan masalah atau error, harap segera laporkan ke developer kami dengan mengklik link ini.",
                    ]
                },
                {
                    image: "/static/img/main/menu/version-alpha-beta.png",
                    title: "Beta Version",
                    contents:[
                        "Aplikasi telah melalui beberapa tahap uji coba dan pemutakhiran. Selanjutnya aplikasi dapat digunakan oleh umum namun secara terbatas, baik dari segi jumlah pengguna maupun fitur nya.",
                        "Anda dapat melakukan berbagai transaksi yang tersedia di aplikasi, namun kami mohon maaf apabila masih terdapat masalah sehingga mengurangi kenyamanan Anda dalam melakukan transaksi. Apabila Anda menemukan masalah atau error, harap segera laporkan ke developer kami dengan mengklik link ini.",
                    ]
                },
                {
                    image: "/static/img/main/menu/version-release.png",
                    title: "Release Version",
                    contents:[
                        "Aplikasi siap untuk digunakan oleh sebanyak-banyak nya pengguna."
                    ]
                }
            ]
        
        return(
            <div className='menu-popup pt-0 d-flex' onClick={this.props.togglePopup}>
                <div className="container my-auto" onClick={event => event.stopPropagation()} style={container_style}>
                    <div className="bg-white p-3 d-flex flex-column" style={div_style}>
                        <div className="text-right">
                            <i className="fa fa-times fs40" style={cursor} onClick={this.props.togglePopup}/>
                        </div>
                        <div style={content_style}>
                            <div className="px-5">
                                <VersionDetailSlider slides={slider_data}/>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="menu-popup-close"/>
            </div>
        )
    }
}

class VersionDetailSlider extends React.Component {
    componentDidMount() {
        this.$el = $(this.el);
        this.$el.slick({
            infinite: false,
            prevArrow: "<button type='button' class='custom-slick-prev'><i class='fa fa-2x fa-chevron-left'></i></button>",
            nextArrow: "<button type='button' class='custom-slick-next'><i class='fa fa-2x fa-chevron-right'></i></button>"
            
            
        });
    }
    
    componentWillUnmount() {
        this.$el.slick('unslick');
    }
    
    render() {
        var slides = []
        if(this.props.slides.length != 0){
            this.props.slides.forEach((slide, index) => {
                var slide_content = []
                
                slide.contents.forEach((content, i) => {
                    slide_content.push(
                        <p key={i.toString()}>{content}</p>
                    )
                })
                
                slides.push(
                    <div key={index.toString()} className="p-3">
                        <div className="d-flex">
                            <img className="mx-auto" src={slide.image}/>
                        </div>
                        <p className="my-3 fs28 fwbold">{slide.title}</p>
                        <div className="text-justify fw500">
                            {slide_content}
                        </div>
                    </div>
                )
            })
        }
        
        return(
            <div ref={el => this.el = el}>
                {slides}
            </div>
        )
    }
}

var sidebar_logo = document.getElementById("sidebar_logo")

ReactDOM.render(<VersionLogo version={sidebar_logo.dataset.version}/>, sidebar_logo)