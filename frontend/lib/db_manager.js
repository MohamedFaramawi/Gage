var sys = require('util'), events = require('events')
var log = require('../lib/logger');
var logger = new log.Logger().log.getLogger("DB Manager");

function DbManager(dbPool) {
	if(false === (this instanceof DbManager)) {
		return new DbManager();
	}
	this.dbPool = dbPool;
	events.EventEmitter.call(this);
}

sys.inherits(DbManager, events.EventEmitter);

DbManager.prototype.loadFamilyEventsByDay = function(family, today, callback) {
	var self = this;
	var sql = "SELECT event,count as y,hour as x from gage WHERE family=? AND day=? AND month=? AND year=? ORDER BY hour ASC";
	var params = [family, (today.getDate()), today.getMonth() + 1, today.getFullYear()];
	self.dbPool.acquire(function(err, connection) {
		if(err) {
			throw new Error('Can not Acquire A new DB Connection');
		} else {
			connection.query(sql, params, function(err, result) {
				self.dbPool.release(connection);
				if(err) {
					logger.error(err);
					return;
				}
				//console.log("SQL Result",result);
				callback(result);
			});
		}
	});
}

DbManager.prototype.loadFamilyEventsByMonth = function(family,month,year, callback) {
	var self = this;
	var sql = "SELECT event,sum(count) as y,day as x from gage WHERE family=? AND month=? AND year=? GROUP BY event,day ORDER BY day ASC";
	var params = [family,month,year];
	//console.log("Call back",callback);
	self.dbPool.acquire(function(err, connection) {
		if(err) {
			throw new Error('Can not Acquire A new DB Connection');
		} else {
			connection.query(sql, params, function(err, result) {
				self.dbPool.release(connection);
				if(err) {
					logger.error(err);
				}
				//console.log("SQL Result",result);
				callback(result);
			});
		}
	});
}

DbManager.prototype.loadFamilyEventsByYear = function(family, year, callback) {
	var self = this;
	var sql = "SELECT event,sum(count) as y,month as x from gage WHERE family=? AND year=? GROUP BY event,month ORDER BY month ASC ";
	var params = [family, year];
	//console.log("Call back",callback);
	self.dbPool.acquire(function(err, connection) {
		if(err) {
			throw new Error('Can not Acquire A new DB Connection');
		} else {
			connection.query(sql, params, function(err, result) {
				self.dbPool.release(connection);
				if(err) {
					logger.error(err);
				}
				//console.log("SQL Result",result);
				callback(result);
			});
		}
	});
}

DbManager.prototype.listEvents = function(callback) {
	var self = this;
	var sql = "Select DISTINCT(event) , sum(count) as count from gage group by event ORDER BY count desc";
	//console.log("Call back",callback);
	self.dbPool.acquire(function(err, connection) {
		if(err) {
			throw new Error('Can not Acquire A new DB Connection');
		} else {
			connection.query(sql, [], function(err, result) {
				self.dbPool.release(connection);
				if(err) {
					logger.error(err);
				}
				//console.log("SQL Result",result);
				callback(result);
			});
		}
	});
}

DbManager.prototype.listEventComments = function(key, callback) {
	var self = this;
	var sql = "Select details FROM gage WHERE event=? AND hour=? AND day=? AND month=? AND year=?";
	//console.log("Call back",callback);
	self.dbPool.acquire(function(err, connection) {
		if(err) {
			throw new Error('Can not Acquire A new DB Connection');
		} else {
			connection.query(sql, [key.event, key.hour, key.day, key.month, key.year], function(err, result) {
				self.dbPool.release(connection);
				if(err) {
					logger.error(err);
				}
				callback(result);
			});
		}
	});
}

DbManager.prototype.listFamilies = function(callback) {
	var self = this;
	var sql = "Select family  FROM gage GROUP BY family ORDER BY family ASC";
	//console.log("Call back",callback);
	self.dbPool.acquire(function(err, connection) {
		if(err) {
			throw new Error('Can not Acquire A new DB Connection');
		} else {
			connection.query(sql, [], function(err, result) {
				self.dbPool.release(connection);
				if(err) {
					logger.error(err);
				}
				//console.log("SQL Result",result);
				callback(result);
			});
		}
	});
}

exports.DbManager = DbManager;
