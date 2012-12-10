var sys = require('util'), events = require('events');

function MgEvent() {
	if(false === (this instanceof MgEvent)) {
		return new MgEvent();
	}
	events.EventEmitter.call(this);
	this.date = null;
	this.hour = 0;
	this.day = 0;
	this.month = 0;
	this.year = 0;
	this.event = "";
	this.family = "";
	this.count = 0;
	this.details = null;
	this.events = [];
	this.count = 0;
}

sys.inherits(MgEvent, events.EventEmitter);

MgEvent.prototype.getKey = function() {
	var self = this;
	return self.family + "-" + self.event + '-' + self.hour + "-" + self.day + "-" + self.month + "-" + self.year;
}

MgEvent.prototype.init = function(date, hour, day, month, year, event, count, details, family) {
	var self = this;
	self.date = date;
	self.hour = hour;
	self.day = day;
	self.month = month;
	self.year = year;
	self.event = event;
	self.count = count;
	self.details = details
	self.family = family
}

MgEvent.prototype.addEvent = function(event_json) {
	var self = this;
	self.events.push({
		time : event_json.time,
		comments : '' + event_json.comments + ''
	});
	self.fillDetails(self.events);
}

MgEvent.prototype.appenedEvents = function(events_map) {
	var self = this;
	for(eventItem in events_map) {
		self.events.push({
			time : events_map[eventItem].time,
			comments : '' + events_map[eventItem].comments + ''
		})
	}
	self.fillDetails(self.events);
}

MgEvent.prototype.fillDetails = function(events) {
	var self = this;
	if(events == null || events == undefined) {
		self.details = new Buffer(JSON.stringify(self.events));
	} else {
		self.details = new Buffer(JSON.stringify(events));
	}
}

MgEvent.prototype.fillEvents = function(buffer) {
	var self = this;
	var buff = new Buffer(buffer);
	self.events = JSON.parse(buff.toString());
}

MgEvent.prototype.fill = function(event) {
	var self = this;
	var date = new Date(parseInt(event.time));
	self.date = date;
	self.hour = date.getHours();
	self.day = date.getDate();
	self.month = date.getMonth() + 1;
	self.year = date.getFullYear();
	self.event = '' + event.event + '';
	self.family = '' + event.family!=undefined?event.family:'Global';
	self.count = 1;
	self.addEvent(event);
}

MgEvent.prototype.toString = function() {
	var self = this;
	//return "Family :"+self.family+", Event ="+self.event+" , Date :"+self.date+" , Hour :"+self.hour+", Day :"+self.day+" , Month :"+self.month+" , Year :"+self.year+" , Count :"+self.count;
	var d = {
		family : self.family,
		event : self.event,
		count : self.count,
		date : self.date,
		hour : self.hour,
		day : self.day,
		month : self.month,
		year : self.year
	};
	return JSON.stringify(d);
}

exports.MgEvent = MgEvent;
