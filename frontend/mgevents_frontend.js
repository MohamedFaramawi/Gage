/**
 * Module dependencies.
 */

var express = require('express'), routes = require('./routes'), ajax = require('./routes/ajax'), poolModule = require('generic-pool'), mysql = require('mysql')
db_manager = require('./lib/db_manager'),moment=require('moment');

// Load Settings
var Settings = require('settings');
var CONFIG = new Settings(require('./config.js'));

// Setup Loggers
var log=require('./lib/logger');
logger=new log.Logger(CONFIG,"mgevents_frontend").log.getLogger("Server");

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

// Configuration
app.configure(function() {
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jshtml');
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser());
	app.use(require('stylus').middleware({
		src : __dirname + '/public'
	}));
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
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
	app.use(express.errorHandler());
});
// Routes
app.get('/', function(req, res) {
	routes.index(req, res, dbManager);
});

app.get('/ajax/Now', function(req, res) {
	var d=new Date();
	res.json({day:d.getDate(),month:d.getMonth()+1,year:d.getFullYear()});
});

app.get('/ajax/listFamilies', function(req, res) {
	ajax.listFamilies(req, res, dbManager);
});

app.get('/ajax/listDayEvents/:family/:date', function(req, res) {
	var d=moment(req.params.date);
	console.log(d);
	ajax.getDayEvents(res,req.params.family,dbManager,d.toDate());
});

app.get('/ajax/listMonthEvents/:family/:month/:year', function(req, res) {
	ajax.getMonthEvents(res, req.params.family,req.params.month,req.params.year, dbManager);
});

app.get('/ajax/listYearEvents/:family/:year', function(req, res) {
	ajax.getYearEvents(res,req.params.family, req.params.year, dbManager);
});

app.post('/ajax/listComments', function(req, res) {
	ajax.listComments(req, res, JSON.parse(req.body.key), dbManager);
});

app.listen(CONFIG.App.port, function() {
	console.log("Atom server listening on port %d in %s env", app.address().port, process.env.NODE_ENV);
});
