
exports.listFamilies = function(req, res, dbManager) {
	dbManager.listFamilies(function(result) {
		//console.log(result);
		res.json(result);
	});
};

exports.listComments = function(req, res, key, dbManager) {
	dbManager.listEventComments(key, function(result) {
		if(!result || result.length == 0) {
			return res.json({});
		}
		//console.log(result);
		var buff = new Buffer(result[0].details);
		res.json(JSON.parse(buff.toString()));
	});
}

exports.getDayEvents = function(res,family, dbManager,date) {
	dbManager.loadFamilyEventsByDay(family,date, function(result) {
		//console.log(result);
		res.json(toSeries("day", result, date));
	});
}

 exports.getMonthEvents=function(res,family,month,year,dbManager) {
	var today = new Date();
	dbManager.loadFamilyEventsByMonth(family,month,year, function(result) {
		res.json(toSeries("month", result, {month:month,year:year}));
	});
}

exports.getYearEvents=function(res,family, year,dbManager) {
	dbManager.loadFamilyEventsByYear(family,year, function(result) {
		res.json(toSeries("year", result, {year:year}));
	});
}

function toSeries(mode, result, key) {
	//console.log(result);
	series = {};
	for(var i = 0; i < result.length; i++) {
		item = result[i];
		var name = item.event;
		var x = parseInt(item.x);
		var y = parseInt(item.y);
		if(series[name] != undefined) {
			series[name].push([x, y])
		} else {
			series[name] = [[x, y]]
		}
	}
	seriesForChart = [];
	for(var item in series) {
		seriesForChart.push({
			name : item,
			data : series[item]
		});
	}
	return {
		key : key,
		mode : '' + mode + '',
		results : result,
		series : seriesForChart
	};
}