# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from . import __version__ as app_version

app_name = "vet_website"
app_title = "Vet Website"
app_publisher = "bikbuk"
app_description = "Vet Website"
app_icon = "octicon octicon-file-directory"
app_color = "grey"
app_email = "admin@bikbuk.com"
app_license = "MIT"

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/vet_website/css/vet_website.css"
# app_include_js = "/static/src/js/vet-boot.js"

# include js, css files in header of web template
web_include_css = [
					"https://fonts.googleapis.com/css?family=Rubik:300,300i,400,400i,500,500i,700,700i,900,900i&display=swap",
					"https://fonts.googleapis.com/css?family=Open+Sans:300,300i,400,400i,600,600i,700,700i,800,800i&display=swap",
					"https://cdnjs.cloudflare.com/ajax/libs/tempusdominus-bootstrap-4/5.0.1/css/tempusdominus-bootstrap-4.min.css",
					"/static/src/slick/slick.css",
					"/static/src/slick/slick-theme.css",
					"/static/src/css/pagination.css",
					"/static/src/css/font.css",
					"/static/src/css/sidebar.css",
					"/static/src/css/pos.css",
					"/static/src/css/vet.css",
				]
web_include_js = [
					"https://unpkg.com/react@16/umd/react.development.js",
    				"https://unpkg.com/react-dom@16/umd/react-dom.development.js",
    				"https://unpkg.com/babel-standalone@6/babel.min.js",
					"https://unpkg.com/xlsx@0.15.1/dist/xlsx.full.min.js",
					"/assets/frappe/node_modules/moment/min/moment.min.js",
					"https://cdnjs.cloudflare.com/ajax/libs/tempusdominus-bootstrap-4/5.0.1/js/tempusdominus-bootstrap-4.min.js",
					"https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.3/Chart.min.js",
					"https://html2canvas.hertzen.com/dist/html2canvas.js",
					"https://cdnjs.cloudflare.com/ajax/libs/jspdf/1.5.3/jspdf.debug.js",
					"/static/src/js/html2pdf.js",
					"/static/src/slick/slick.js",
					"/static/src/js/pagination.min.js",
					"/static/src/js/sidebar.js",
					"/static/src/js/vet.js",
				]

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "main/penerimaan"

# website user home page (by Role)
# role_home_page = {
#	"Role": "home_page"
# }

# Website user home page (by function)
get_website_user_home_page = "vet_website.methods.get_home_page"
# boot_session = "vet_website.methods.get_home_page"

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Installation
# ------------

# before_install = "vet_website.install.before_install"
# after_install = "vet_website.install.after_install"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "vet_website.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
#	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"vet_website.methods.run_every_two_mins"
# 	],
# 	# "daily": [
# 	# 	"vet_website.tasks.daily"
# 	# ],
# 	# "hourly": [
# 	# 	"vet_website.tasks.hourly"
# 	# ],
# 	# "weekly": [
# 	# 	"vet_website.tasks.weekly"
# 	# ]
# 	# "monthly": [
# 	# 	"vet_website.tasks.monthly"
# 	# ]
# 	"cron": {
# 		"0/2 * * * *": [
# 			"vet_website.methods.run_every_two_mins"
# 		],
# 	}
# }

# Testing
# -------

# before_tests = "vet_website.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "vet_website.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "vet_website.task.get_dashboard_data"
# }

