$(".sidebar-menu-list-item").each(function(e){
    var href = $(this).attr("href");
    var parent = $(this).parents(".sidebar-menu-list-dropdown")
    if(href == "/main/settings" && window.location.pathname == href){
        $(this).addClass("active");
        parent.addClass("active");
    } else if ( window.location.pathname.includes(href) && href != "/main/settings"){
        $(this).addClass("active");
        parent.addClass("active");
    }
});

$(".sidebar-menu-list-dropdown").click(function(e){
    if ($(this).hasClass("active")) {
        $(this).removeClass("active");
    }
    else {
        $(this).addClass("active");
    }
});

$(".sidebar-menu-list-dropdown").each(function(e){
    var href = $(this).find(".sidebar-menu-list-dropdown-link").attr("href");
    if ( window.location.pathname.includes(href) ){
        $(this).addClass("active");
    }
});

$(".sidebar-menu-list-dropdown").children().click(function(e){
    e.stopPropagation();
});

$("#sidebar-toggler").click(function(){
    toggleSidebarToggler()
})

$(".sidebar-overlay-close").click(function() {
    if($(".sidebar-overlay").hasClass('show')){
        toggleSidebarOverlay()
        toggleSidebarToggler()
    }
})

function toggleSidebarToggler(){
    var sidebar_toggler = $("#sidebar-toggler")
    if($(sidebar_toggler).hasClass('active')){
        $(sidebar_toggler).removeClass('active')
        toggleSidebarOverlay()
    }
    else{
        $(sidebar_toggler).addClass('active')
        toggleSidebarOverlay(true)
    }
}

function toggleSidebarOverlay(toggle=false){
    var sidebar_overlay = $(".sidebar-overlay")
    if(!sidebar_overlay.hasClass('show') && toggle){
        console.log('show sidebar')
        sidebar_overlay.addClass('show')
    }
    else if(sidebar_overlay.hasClass('show') && !toggle){
        console.log('hide sidebar')
        sidebar_overlay.removeClass('show')
    }
}

function checkAvailableMenu(user, element){
    function checkAvailableSubmenu(element, permissions){
        var list_active = [false]
        var doctype = $(element).data('doctype')
        var admin_only = $(element).data('admin_only')
        var children = $(element).children(".sidebar-menu-list-group, .sidebar-menu-list-item")
        if (children.length > 0){
            children.each(function(e){
                list_active.push(checkAvailableSubmenu(this, permissions))
            })
        } else if (doctype && permissions.find(p => p.doctype_table == doctype && p.read == 1)){
            list_active.push(true)
        } else if (admin_only) {
            list_active.push(false)
        }
        return list_active.some(a => a)
    }
    if(user.roles){
        var roles = user.roles.map(r => r.role)
        if (roles.includes("System Manager")){
            return true
        } else {
            var permissions = []
            user.roles.forEach(r => {
                if(r.permissions){
                    permissions = permissions.concat(r.permissions)
                }
            })
            return checkAvailableSubmenu(element, permissions)
        }
    } else {
        return false
    }
}

frappe.call({
    type: "GET",
    method: 'vet_website.methods.get_current_user',
    args: {},
    callback: function(r){
        if (r && r.message) {
            $(".sidebar-menu-list-dropdown").each(function(e){
                if(!checkAvailableMenu(r.message, this)){
                    $(this).detach()
                }
            })
            $(".sidebar-menu-list-group").each(function(e){
                if(!checkAvailableMenu(r.message, this)){
                    $(this).detach()
                }
            })
            $(".sidebar-menu-list-item").each(function(e){
                if(!checkAvailableMenu(r.message, this)){
                    $(this).detach()
                }
            })
            $(".sidebar-menu-list").removeClass("d-none")
        }
    }
})