var express = require('express');
var _ = require('underscore');
var router = express.Router();
//var read = [];
//var reading = [];
var data = [];
var isAppdata =false;
var types=[];
var Client = require("ibmiotf");
var current_type="+";
var current_id="+";



/* GET home page. */
router.get('/', function(req, res, next) {
	 console.log("org id:"+ req.query.org_id)
	 if(req.query.auth_key && req.query.auth_token){
		var obj ={
		  "org": req.query.auth_key.split('-')[1],
		  "id": new Date().getTime()+"",
		  "auth-key": req.query.auth_key,
		  "auth-token": req.query.auth_token
		}
		appClient = new Client.IotfApplication(obj);
		appClient.connect();

		appClient.on("connect", function () {
			res.redirect('/status');
		});

		appClient.on("deviceEvent", function (deviceType, deviceId, eventType, format, payload) {
			var obj = {};
			payload = JSON.parse(payload);
			obj.id = deviceId;
			obj.type = deviceType;
			obj.light = payload.d.light;
			//obj.light = payload.d.temperature;

			// console.log("Meeting room "+deviceId+" on Floor "+deviceType+" is "+obj.d.light+"\"");
			console.log("Meeting room "+deviceId+" on Floor "+deviceType+" is "+obj+"\"");
			
			// data.push(obj.id, obj.type, obj.d.light);
			
			var info = _.find(data,function(itm){return itm.id == deviceId && itm.type == deviceType});

 			if(!info){
				data.push(obj);
				/* info.id = obj.id;
				info.type = obj.type;
				info.light = obj.d.light; */
			}
			else
			{
				info.Light = obj.light;
			}
		});

		appClient.on("error", function (err) {
				console.log("Error : "+err);
		});
	 }
	 else{
		res.render('user', { title: 'Diamler Reservation Application'});//,data,selected:req.query.type});
	 }

});

/* GET Device Status page. */
router.get('/status', function(req, res, next) {
	if(typeof appClient != 'undefined'){
		if (req.query.type && current_type != req.query.type  ){
			data =[];
			appClient.unsubscribeToDeviceStatus(current_type, current_id);
			current_type = req.query.type;
			current_id = "";
		}
		if (req.query.id && current_id != req.query.id ){
			data =[];
			appClient.unsubscribeToDeviceStatus(current_type, current_id);
			current_id = req.query.id;
		}

		appClient.subscribeToDeviceEvents(current_type||"+",current_id||"+","+","json");
		res.render('status', { title: 'Diamler Reservation Application' ,data,types,selected:current_type});
	}
	else{
		res.redirect('/');
	}

});
router.get('/status/data', function(req, res, next) {
    res.json(data);
});
router.get('/status/type', function(req, res, next) {
	appClient.getAllDeviceTypes().then (function onSuccess (response) {
		
				types = _.pluck(response.results,"id");
				res.json(types);
				
		}, function onError (error) {

			console.log("Fail");
			console.log(error);
			res.json(types)
		}
		);
});
module.exports = router;
