/**
 * Module dependencies.
 */

var express = require('express'), events_pool = require('./lib/events_pool'), poolModule = require('generic-pool'), mysql = require('mysql'), db_manager = require('./lib/db_manager'), util = require('util'), os = require("os");

// Load Settings
var Settings = require('settings');
var CONFIG = new Settings(require('./config.js'));

// Setup Loggers
var log = require('./lib/logger');
logger = new log.Logger(CONFIG, "mgevents_backend").log.getLogger("Server");

var app = express.createServer();
var dbPool = poolModule.Pool({
	name : 'mysql',
	create : function(callback) {
		var connection = mysql.createConnection({
			host : CONFIG.DB.host,
			user : CONFIG.DB.user,
			password : CONFIG.DB.pass,
			database : CONFIG.DB.db,
		});
		//console.log(connection);
		connection.connect(function(err) {
			if(err) {
				console.log(err.code);
				console.log(err.fatal);
			}
		});
		// parameter order: err, resource
		// new in 1.0.6
		callback(null, connection);
	},
	destroy : function(connection) {
		connection.end();
	},
	max : 50,
	// optional. if you set this, make sure to drain() (see step 3)
	min : 2,
	// specifies how long a resource can stay idle in pool before being removed
	idleTimeoutMillis : 30000,
	// if true, logs via console.log - can also be a function
	log : false
});

var dbManager = new db_manager.DbManager(dbPool);
var eventsPool = new events_pool.EventsPool(dbManager, CONFIG.EventsPool.flushOutInMs);
eventsPool.on("flushed", function(stats) {
	logger.info("Saved To DB :", stats);
});
// Configuration
app.configure(function() {
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
});

app.configure('local', function() {
	app.use(express.errorHandler({
		dumpExceptions : true,
		showStack : true
	}));
});

app.configure('qa', function() {
	app.use(express.errorHandler({
		dumpExceptions : true,
		showStack : true
	}));
});

app.configure('prod', function() {
	app.use(express.errorHandler({
		dumpExceptions : true,
		showStack : true
	}));
});
// Recieving Events
app.put('/event/add', function(req, res) {
	console.log(req.body.event);
	eventsPool.add(JSON.parse(req.body.event));
	res.send("Recieved Event: " + JSON.stringify(req.body));
});

// Recieving Events
app.post('/event/add', function(req, res) {
	console.log(req.body.event);
	eventsPool.add(JSON.parse(req.body.event));
	res.send("Recieved Event: " + JSON.stringify(req.body));
});

var killSig = 'SIGTERM';
if(os.platform() == "win32") {
	killSig = 'WM_CLOSE';
}

process.on(killSig, function() {
	console.log("Closing");
	app.close();
});

app.on('close', function() {
	console.log("Closed");
});

app.listen(CONFIG.App.port, function() {
	console.log("Zues server listening on port %d in %s env", app.address().port, process.env.NODE_ENV);
});
