var express = require('express');
var spark = require('spark');
var request = require('request');

var eventHandler = function() {
  this.eventName = 'Get Muni Data';
  // Settings for getting the Muni times
  this.agency = 'sf-muni';
  this.route = 12;
  this.stop = 5853;
  // Spark Device info
  this.deviceId = '55ff6c065075555359331787';
  this.deviceFunctionName = 'showMuniData';
};
eventHandler.prototype.listenForEvents = function() {
  var _this = this;
  spark.onEvent(this.eventName, function() {
    _this.callMuniApi();
  });
};
eventHandler.prototype.callMuniApi = function() {
  var baseURL = 'http://restbus.info/api';
  var url = baseURL + '/agencies/' + this.agency + '/routes/' + this.route + '/stops/' + this.stop + '/predictions';
  var _this = this;
  request(url, function(error, response, body) {
    if(error) {
      console.log(error);
    }
    if (!error && response.statusCode == 200) {
      _this.parseJSONResponse(JSON.parse(body));
    }
  });
};
eventHandler.prototype.parseJSONResponse = function(json) {
  var nextBuses = json[0]['values'];
  var nextBus = nextBuses[0];
  var minutesUntilNextBus = nextBus['minutes'];
  var _this = this;
  // get the spark device
  spark.getDevice(this.deviceId, function(err, device) {
    if(err) {
      console.log(err);
    }
    _this.sendMinutesToSparkDevice(device, minutesUntilNextBus);
  });
};
eventHandler.prototype.sendMinutesToSparkDevice = function(device, minutes) {
  console.log(minutes);
  device.callFunction(this.deviceFunctionName, minutes.toString(), function(err, data) {
     console.log('function called');
     if (err) {
       console.log('An error occurred:', err);
     } else {
       console.log('Function called succesfully:', data);
     }
  })
}

module.exports = eventHandler;
