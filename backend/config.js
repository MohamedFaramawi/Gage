module.exports = {
	common : {
		DB : {
			host : "",
			user : "",
			pass : "",
			db : ""
		},
		App : {
			name : "gage_backend",
			port : 9004
		},
		Logs :{
			level : "info",
			path  : ""
		},
		EventsPool :{
			flushOutInMs:30000
		}
	},

	// Rest of environments are deep merged over `common`.
	local : {
		Logs :{
			level : "info",
			path  : ""
		}
		,
		EventsPool :{
			flushOutInMs:5000
		}
	},
	qa : {
		DB : {
			host : "",
			user : "",
			pass : "",
			db : ""
		}
	},
	prod : {
		DB : {
			host : "",
			user : "",
			pass : "",
			db : ""
		}
	}
};
