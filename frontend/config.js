module.exports = {
	common : {
		DB : {
			host : "",
			user : "",
			pass : "",
			db : ""
		},
		App : {
			name : "gage_frontend",
			port : 9005
		},
		Logs :{
			level : "info",
			path  : ""
		}
	},

	// Rest of environments are deep merged over `common`.

	local : {
		
		DB : {
			host : "",
			user : "",
			pass : "",
		},
		Logs :{
			level : "info",
			path  : ""
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
