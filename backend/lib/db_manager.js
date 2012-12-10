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

DbManager.prototype.insert = function(mg_event) {
	var self = this;
	self.dbPool.acquire(function(err, connection) {
		if(err) {
			throw new Error('Can not Acquire A new DB Connection');
		} else {
			params = {
				date : mg_event.date,
				hour : mg_event.hour,
				day : mg_event.day,
				month : mg_event.month,
				year : mg_event.year,
				event : mg_event.event,
				count : mg_event.count,
				details : mg_event.details,
				family : mg_event.family
			};
			var query = connection.query('INSERT INTO gage SET ?', params, function(err, result) {
				self.dbPool.release(connection);
				if(err) {
					logger.error(err, mg_event.toString());
				}
			});
			//logger.debug(query.sql);
			logger.info("Inserted Event - ", mg_event.toString());
		}
	});
}

DbManager.prototype.update = function(mg_event) {
	var self = this;
	self.dbPool.acquire(function(err, connection) {
		if(err) {
			throw new Error('Can not Acquire A new DB Connection');
		} else {
			var params = [mg_event.details, mg_event.count, mg_event.hour, mg_event.day, mg_event.month, mg_event.year, mg_event.event, mg_event.family]
			var query = connection.query('UPDATE gage SET details=? ,count=? WHERE hour=? AND day=? AND month=? AND year= ? AND event =? AND family=?', params, function(err, result) {
				self.dbPool.release(connection);
				if(err) {
					logger.error(err, mg_event.toString());
				}
			});
			//logger.debug(query.sql);
			logger.info("Updated Event - ", mg_event.toString());
		}
	});
}

DbManager.prototype.save = function(mg_event) {

	var self = this;
	var sql = "SELECT * FROM gage WHERE hour=? AND day=? AND month=? AND year=? AND event=? AND family=?";
	var params = [mg_event.hour, mg_event.day, mg_event.month, mg_event.year, mg_event.event, mg_event.family];
	self.dbPool.acquire(function(err, connection) {
		if(err) {
			throw new Error('Can not Acquire A new DB Connection');
		} else {
			//console.log("Last Executed Sql",query.sql);
			connection.query(sql, params, function(err, result) {
				self.dbPool.release(connection);
				if(err) {
					logger.error(err);
					return;
				}
				var mgObject = self.resultSetHandler(result);
				if(mgObject == undefined) {
					// save new
					mg_event.fillDetails();
					self.insert(mg_event);
				} else {
					// update existing
					mgObject.appenedEvents(mg_event.events);
					logger.info("Updating Family :'" + mgObject.family + "', Event :'" + mgObject.event + "' Current Count :" + mgObject.count + " with new count (+" + mg_event.count + ")=" + (mgObject.count + mg_event.count));
					mgObject.count += mg_event.count;
					self.update(mgObject);
				}
			});
		}
	});
}

DbManager.prototype.resultSetHandler = function(result) {
	if(result != undefined && result.length > 0) {
		//console.log("SQL result:", result);
		var MgEvent = require('../lib/mg_event').MgEvent;
		var mg = new MgEvent();
		mg.date = result[0].date;
		mg.hour = result[0].hour;
		mg.day = result[0].day;
		mg.month = result[0].month;
		mg.year = result[0].year;
		mg.event = result[0].event;
		mg.count = result[0].count;
		mg.details = result[0].details;
		mg.family = result[0].family;
		mg.fillEvents(result[0].details);
		return mg;
	} else {
		return undefined;
	}
}

DbManager.prototype.loadFamilyTodayEvents = function(family, today, callback) {
	var self = this;
	var sql = "SELECT event,count as y,hour as x from gage WHERE family=? AND day=? AND month=? AND year=? ORDER BY hour ASC";
	var params = [family, (today.getDate()), today.getMonth() + 1, today.getFullYear()];
	//console.log("Call back",callback);
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

DbManager.prototype.loadFamilyCurrentMonthEvents = function(family, today, callback) {
	var self = this;
	var sql = "SELECT event,sum(count) as y,day as x from gage WHERE family=? AND month=? AND year=? GROUP BY event,day ORDER BY day ASC";
	var params = [family, today.getMonth() + 1, today.getFullYear()];
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

DbManager.prototype.loadFamilyCurrentYearEvents = function(family, today, callback) {
	var self = this;
	var sql = "SELECT event,sum(count) as y,month as x from gage WHERE family=? AND year=? GROUP BY event,month ORDER BY month ASC ";
	var params = [family, today.getFullYear()];
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
	var sql = "Select family , sum(count) as count from gage group by family ORDER BY count desc";
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
