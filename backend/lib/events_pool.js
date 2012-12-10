var sys = require('util'), events = require('events'), mg_event = require('../lib/mg_event');
var uuid = require('node-uuid');
var log = require('../lib/logger');

var logger = new log.Logger().log.getLogger("Events Pool");

var pool = {};
//Not An Array , When an array used it caused a deadlock

var defaultFlushOut = 5000;
//5 sec

function EventsPool(dbManager, flushOut) {
	if(false === (this instanceof EventsPool)) {
		return new EventsPool();
	}
	events.EventEmitter.call(this);
	var self = this;
	setInterval(function() {
		self.flush(dbManager);
	}, flushOut ? flushOut : defaultFlushOut);
}

sys.inherits(EventsPool, events.EventEmitter);

EventsPool.prototype.flush = function(dbManager) {
	var self = this;
	if(Object.keys(pool).length == 0) {
		logger.info("Events Pool Is Empty");
		return;
	}
	logger.info("Flushing " + Object.keys(pool).length + " events");
	// copy the bool
	pool_copy = pool;
	// clear events pool
	pool = {};
	rounded_events = roundEvents(pool_copy);
	//console.log(rounded_events);
	//logger.info("Going To Save To DB ",stats);
	for(key in rounded_events.events) {
		//console.log("Saving Pool key:" + key);
		dbManager.save(rounded_events.events[key]);
	}
	self.emit("flushed", rounded_events.stats);
}

EventsPool.prototype.add = function(event) {
	if(event == undefined) {
		return;
	}
	logger.info("Added new event to the pool", new Date(parseInt(event.time)), event);
	pool[uuid.v1()] = event;
}
/**
 Group samve events on same hour together
 **/
function roundEvents(eventsPool) {
	mg_events = {};
	stats = {};
	for(key in eventsPool) {
		currentEvent = eventsPool[key];
		var v = new mg_event.MgEvent();
		//logger.info("currentEvent ",currentEvent);
		v.fill(currentEvent);
		//logger.info(v);
		keyx = v.getKey();
		if(mg_events[keyx] != undefined) {
			var exsiting = mg_events[keyx];
			for(var i = 0; i < v.events.length; i++) {
				//console.log("Key "+v.events[i]+" event");
				exsiting.events.push(v.events[i]);
				exsiting.count = exsiting.count + 1;
			}
			//console.log(JSON.stringify(exsiting.events));
			exsiting.fillDetails(exsiting.events);
			mg_events[keyx] = exsiting;
			stats[exsiting.event] = exsiting.count;
		} else {
			mg_events[keyx] = v;
			stats[v.event] = v.count;
		}
	}
	return {
		events : mg_events,
		stats : stats
	};
}

exports.EventsPool = EventsPool;
