

var log4js = require('log4js');
var Logger=function(config,app){

	if(app){
		log4js.configure({
		    appenders: [
		        {
		            type: "dateFile",
		            filename: config.Logs.path+app+".log",
		            pattern: "-yyyy-MM-dd"
		        },
		        {
		            type: "console"
		        }
		    ],
		    replaceConsole: true
		});
	}
	this.log=log4js;
}

exports.Logger=Logger;
