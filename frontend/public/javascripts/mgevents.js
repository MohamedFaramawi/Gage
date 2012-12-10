(function(mgevents, $) {

	var eventsJs = {

		chart : null,

		context:null,

		family:null,

		currentMonth:null,

		currentYear:null,

		currentDay:null,

		currentDate:null,

		serverDate:null,

		isLoading:false,

		chartChartOptions : {
			chart : {
				type : 'line',
				renderTo : 'chart',
				marginRight : 100,
				marginBottom : 50
			},
			plotOptions : {
				series : {
					cursor : 'pointer',
					point : {
						events : {
							click : function() {

							}
						}
					}
				}
			},
			title : {
				text : ""
			},
			xAxis : {
				title : {
					text : ""
				}
			},
			yAxis : {
				title : {
					text : 'Count'
				},

			},
			legend : {
				enabled :true,
				layout : 'horizontal',
				align : 'center',
				verticalAlign : 'top',
				x : 10,
				y : 20,
				borderWidth : 0
			},
			series : []
		},

		init : function() {
			eventsJs.context="day";
			eventsJs.getServerDate();
		},

		getServerDate:function(){
			$.ajax({
				url : "ajax/Now",
				context : document.body
			}).done(function(data) {
				var d=moment(data.year+"-"+data.month+"-"+data.day,"YYYY-MM-DD");
				eventsJs.serverDate=d;
				eventsJs.currentDate=d;
				eventsJs.currentMonth=eventsJs.serverDate.month()+1;
				eventsJs.currentDay=eventsJs.serverDate.date();
				eventsJs.currentYear=eventsJs.serverDate.year();
				console.log(eventsJs.serverDate);
			});
		},

		loadAllFamilies : function() {
			$.ajax({
				url : "ajax/listFamilies",
				context : document.body
			}).done(function(data) {
				if(data && data.length>0){
					eventsJs.family=data[0].family;
					eventsJs.loadDayEvents(null,eventsJs.family);
				}
				
				for( i =0; i<data.length ; i++) {
					var cssClass="";
					if(i==0){
						cssClass="active";
						eventsJs.family=data[i].family;
						$(".mn_family").html(data[i].family);
					}
					var item = '<li class="'+cssClass+'"><a data-id="'+data[i].family+'" class="event_family" href="#"> ' + data[i].family + ' </a></li>';
					$(".dropdown-menu").append(item);
				}
						$(".event_family").click(function(){
						$("li").removeClass("active");
						$(this).parent().addClass("active");
						$(".mn_family").html($(this).data("id"));
						eventsJs.family=$(this).data("id");
						// To Do Respect Context When Changing Families
						if(eventsJs.context=="day"){
							var dstr=eventsJs.currentYear+"-"+eventsJs.currentMonth+"-"+eventsJs.currentDay;
							console.log(dstr);
							var xd=moment(dstr,"YYYY-MM-DD");
							console.log(xd);
							eventsJs.loadDayEvents(xd,eventsJs.family);
						}
						if(eventsJs.context=="month"){
							eventsJs.loadMonthEvents(eventsJs.currentMonth,eventsJs.currentYear,eventsJs.family);
						}
						if(eventsJs.context=="year"){
							eventsJs.loadYearEvents(eventsJs.currentYear,eventsJs.family);
						}
				});

			});
		},

		loadTable:function(timeFrame,results){
			var rows=results.length;
			columns=[];
			columns.push({ "sTitle": "Event" });
			var colsTotal=24;
			var timeSeriesStart=1;
			var timeSeriesEnd=24;
			var addOne=false;
			if(timeFrame=="Hour"){
				colsTotal=24;
				addOne=true;
			}
			if(timeFrame=="Day"){
				colsTotal=31;
				timeSeriesStart=1;
				timeSeriesEnd=31;
			}
			if(timeFrame=="Month"){				
				colsTotal=12;
				timeSeriesStart=1;
				timeSeriesEnd=12;
			}
			for(var i=0;i<colsTotal;i++){
				if(timeFrame=="Hour"){
					columns.push({ "sTitle": ''+i+'' });
				}
				else{
					columns.push({ "sTitle": ''+(i+1)+'' });
				}
			}
			columns.push({ "sTitle": "Total" });
			//console.log(columns.length);
			var rows=[];
			for(var i=0;i<results.length;i++){
				var data=[];
				data.push(results[i].name);
				var total=eventsJs.convertHourlySeriesToTableRows(results[i].data,timeSeriesStart,timeSeriesEnd,data,addOne);
				data.push(total);
				rows.push(data);
			}
			//console.log(rows);
			$('#dataTable').html( '<table cellpadding="0" cellspacing="0" border="0" class="display" id="example"></table>' );
			$('#example').dataTable( {	"aaData": rows,
				"aoColumns": columns,
				"bPaginate": false,
				"bFilter": false,
				"bInfo": false,
				"bAutoWidth" : false
			} );
		},

		convertHourlySeriesToTableRows:function(series,start,end,cols,addOne){
			var currentIndex=start;
			var total=0;
			for(var j=0;j<series.length;j++){
				var point=series[j];
				var index=point[0];
				if(addOne){
					index++;
				}
				var val=point[1];
				//console.log("current index "+currentIndex);
				//console.log("point index "+index);
				if( j==0 && index!=start){
					cols.push("");
				}
				if(index>currentIndex){
				  var itemsToAdd=index-currentIndex;
				  var colsAdded=0;
				  for(var i=1;i<itemsToAdd;i++){
				  	colsAdded++;
					cols.push("");
				  }
				  //console.log("add extra "+colsAdded+" empty cols");
				}
				currentIndex=index;
				cols.push(val);
				total+=val;
			}
			// handle end of time
			if(currentIndex!=end){
				var itemsToAdd=end-currentIndex;
				  var colsAdded=0;
				  for(var i=1;i<=itemsToAdd;i++){
				  	colsAdded++;
					cols.push("");
				  }
				  //console.log("add extra "+colsAdded+" empty cols");
			}
			//console.log("col size "+cols.length);
			return total;
		},

		toggleTableColsVisb:function(from,to,isVisb){
			var oTable = $('#example').dataTable();
			for(var i=from;i<=to;i++){
				oTable.fnSetColumnVis( i, isVisb);
			}
		},

		loadComments : function(event, d) {
			//console.log(event)
			var key = {
				event : event.point.series.name,
				hour : event.point.x,
				day : d.date(),
				month : d.month() + 1,
				year : d.year()
			};
			data = 'key=' + JSON.stringify(key);
			//console.log(data);
			$.ajax({
				type : 'POST',
				url : "ajax/listComments",
				data : data,
				success : function(data) {
					$("#event_key").text(key.event+" Events Occurred at Hour " + key.hour + " Of Day " + key.month + "-" + key.day + "-" + key.year + " ");
					var x = "";
					$("#events_list_body").html("");
					for(var i = 0; i < data.length; i++) {
						var d = new moment(parseInt(data[i].time));
						x += "<tr><td>" +  key.hour +":"+d.format("mm:ss") + "</td><td>" + data[i].comments + "</td></tr>";

					}
					$("#events_list_body").append(x);
					$("#events_list").click();
				},
				dataType : "json"
			});
		},

		loadDayEvents:function(day,family){
			eventsJs.isLoading=true;
			if(day!=null){
				eventsJs.currentDate=day;
				eventsJs.currentMonth=day.month()+1;
				eventsJs.currentDay=day.date();
				eventsJs.currentYear=day.year();
				var dstr=eventsJs.currentYear+"-"+eventsJs.currentMonth+"-"+eventsJs.currentDay;
							console.log(dstr);
			}
			
			$.ajax({
				url : "ajax/listDayEvents/"+family+"/"+(day==null?eventsJs.serverDate.format("M-DD-YYYY"):day.format("M-DD-YYYY")),
				context : document.body
			}).done(function(data) {
				eventsJs.loadTable("Hour",data.series);
				eventsJs.toggleTableColsVisb(1,13,true);
				eventsJs.toggleTableColsVisb(14,24,false);
				$("#table_filter1").text("Show Events From 00:00 To 12:00");
				$("#table_filter1").addClass("active");
				$("#table_filter2").text("Show Events From 13:00 To 23:00");
				var d = day == null ? eventsJs.serverDate : day;
				var options = eventsJs.chartChartOptions;
				options.title.text = family+" Events By Hours For Day " + d.format("M-DD-YYYY");
				options.xAxis.title.text = "Hours";
				options.series = data.series;
				options.plotOptions.series.point.events.click = function(event) {
					eventsJs.loadComments(event, d);
				}
				eventsJs.chart = new Highcharts.Chart(options);
				eventsJs.isLoading=false;
			});
		},

		loadMonthEvents : function(month,year,family) {
			eventsJs.isLoading=true;
			if(month!=null){
				eventsJs.currentMonth=month;
			}
			if(year!=null){
				eventsJs.currentYear=year;
			}
			$.ajax({
				url : "ajax/listMonthEvents/"+family+"/"+(month==null?eventsJs.currentMonth:month)+"/"+(year==null?eventsJs.currentYear:year),
				context : document.body
			}).done(function(data) {
				eventsJs.loadTable("Day",data.series);
				eventsJs.toggleTableColsVisb(1,15,true);
				eventsJs.toggleTableColsVisb(16,31,false);
				$("#table_filter1").text("Show Events From Day 1 To Day 15");
				$("#table_filter1").addClass("active");
				$("#table_filter2").text("Show Events From Day 16 To Day 31");
				eventsJs.chart.destroy();
				var options = eventsJs.chartChartOptions;
				options.title.text = family+" Events By Days For Month " + (month==null?eventsJs.currentMonth:month) + " Year "+(year==null?eventsJs.currentYear:year);
				options.xAxis.title.text = "Days";
				options.series = data.series;
				options.plotOptions.series.point.events.click = function(event) {
					var dstr=eventsJs.currentYear+"-"+eventsJs.currentMonth+"-"+event.point.x;
					var xd = moment(dstr,"YYYY-MM-DD");
					console.log(dstr);
					$(".btn").removeClass("active");
					$("#btn_custom").addClass("active");
					eventsJs.context="day";
					eventsJs.loadDayEvents(xd,eventsJs.family);
				}
				eventsJs.chart = new Highcharts.Chart(options);
				eventsJs.isLoading=false;
			});
		},

		loadYearEvents : function(year,family) {
			eventsJs.isLoading=true;
			if(year!=null){
				eventsJs.currentYear=year;
			}
			$.ajax({
				url : "ajax/listYearEvents/"+family+"/"+(year==null?eventsJs.serverDate.year():year),
				context : document.body
			}).done(function(data) {
				eventsJs.loadTable("Month",data.series);
				eventsJs.toggleTableColsVisb(1,6,true);
				eventsJs.toggleTableColsVisb(7,12,false);
				$("#table_filter1").text("Show Events From Month 1 To Month 6");
				$("#table_filter1").addClass("active");
				$("#table_filter2").text("Show Events From Month 7 To Month 12");
				eventsJs.chart.destroy();
				var options = eventsJs.chartChartOptions;
				options.title.text = family+"Events By Months For Year " + (year==null?eventsJs.serverDate.year():year);
				options.xAxis.title.text = "Months";
				options.series = data.series;
				options.plotOptions.series.point.events.click = function(event) {
					$(".btn").removeClass("active");
					$("#btn_custom").addClass("active");
					eventsJs.context="month";
					eventsJs.loadMonthEvents(event.point.x,eventsJs.currentYear,eventsJs.family);
				}
				eventsJs.chart = new Highcharts.Chart(options);
				eventsJs.isLoading=false;
			});
		},

		refresh:function(){
			if(eventsJs.isLoading){
				return;
			}
			console.log("refreshing");
			if(eventsJs.context=="year"){
				eventsJs.loadYearEvents(eventsJs.currentYear,eventsJs.family);
			}
			else if(eventsJs.context=="month"){
				eventsJs.loadMonthEvents(eventsJs.currentMonth,eventsJs.currentYear,eventsJs.family);
			}
			else if(eventsJs.context=="day"){
				eventsJs.loadDayEvents(eventsJs.currentDate,eventsJs.family);
			}
		}
	}
	$(document).ready(function() {
		eventsJs.init();
		eventsJs.loadAllFamilies();
		setInterval(eventsJs.refresh,30000);
		$("#btn_month").click(function() {
			$(".btn").removeClass("active");
			$("#btn_month").addClass("active");
			eventsJs.context="month";
			eventsJs.loadMonthEvents(null,null,eventsJs.family);
		});

		$("#btn_today").click(function() {
			$(".btn").removeClass("active");
			$("#btn_today").addClass("active");
			eventsJs.context="day";
			eventsJs.loadDayEvents(null,eventsJs.family);
		});

		$("#btn_year").click(function() {
			$(".btn").removeClass("active");
			$("#btn_year").addClass("active");
			eventsJs.context="year";
			eventsJs.loadYearEvents(null,eventsJs.family);
		});

		$("#table_filter1").click(function(){
			$("#table_filter2").removeClass("active");
			$(this).addClass("active");
			if(eventsJs.context=="day"){
				eventsJs.toggleTableColsVisb(14,24,false);
				eventsJs.toggleTableColsVisb(1,13,true);
				
			}
			if(eventsJs.context=="month"){
				eventsJs.toggleTableColsVisb(16,31,false);
				eventsJs.toggleTableColsVisb(1,15,true);
				
			}

			if(eventsJs.context=="year"){
				eventsJs.toggleTableColsVisb(7,12,false);
				eventsJs.toggleTableColsVisb(1,6,true);
				
			}
		});
		$("#table_filter2").click(function(){
			$("#table_filter1").removeClass("active");
			$(this).addClass("active");
						if(eventsJs.context=="day"){
				eventsJs.toggleTableColsVisb(1,13,false);
				eventsJs.toggleTableColsVisb(14,24,true);
			}
			if(eventsJs.context=="month"){
				eventsJs.toggleTableColsVisb(1,15,false);
				eventsJs.toggleTableColsVisb(16,31,true);
			}

			if(eventsJs.context=="year"){
				eventsJs.toggleTableColsVisb(1,6,false);
				eventsJs.toggleTableColsVisb(7,12,true);
			}
		});
	});
})(window.mgevents = window.mgevents || {}, jQuery);
