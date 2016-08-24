var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var path = require('path');
var sensor = require('ds18x20');
var moment = require('moment');

var spawn = require('child_process').spawn;
var config = require('./config');

var proc;
var sensorObjects = [];

var sensorLib = require("node-dht-sensor");

function findSensors(){
    var sensors = [];
	var pins = config.get('sensorsPins');
	for (var pinId in pins) {
        if (pins[pinId].type == "DHT") {
            sensorObjects.push({
                address: pinId,
                model: pins[pinId].model,
                temperature: null,
                humidity: null,
                read: function() {
                    var data = sensorLib.readSpec(this.model, this.address);
                    this.temperature = data.temperature.toFixed(1)
                    this.humidity = data.humidity.toFixed(1)
                    return this;
                }
            });
        } else if (pins[pinId].type == "DS18X20") {
            let sensors = sensor.list();
            if (sensors.length) {
                for (let i = 0; i < sensors.length; i++){
                    sensorObjects.push({
                        address: sensors[i],
                        temperature: null,
                        read: function() {
                            this.temperature = sensor.get(this.address);
                            return this;
                        }

                    });
                }
            }
        }
    }
    return sensorObjects;
}

function readSensors() {
    if (sensorObjects.length == 0){
        findSensors();
    }
    
    var dataSensors = [];
    for (let i = 0; i < sensorObjects.length; i++){
        let sensor = sensorObjects[i].read();
        dataSensors.push({
            address: sensor.address,
            temperature: sensor.temperature,
            humidity: sensor.humidity,
            name: null,
        });
    }

    return dataSensors;
}



app.use('/', express.static('/tmp'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

var sockets = {};
moment.locale('ru');
var currentTimeStr = moment().format('LLLL');

io.on('connection', function(socket) {

    sockets[socket.id] = socket;
    console.log("Total clients connected : ", Object.keys(sockets).length);

    socket.emit('currentTime', currentTimeStr);
    socket.emit('clientInit', config.get('channels'));

    socket.on('disconnect', function() {
        delete sockets[socket.id];
    });

    socket.on('dimming', function(data) {
        socket.broadcast.emit('dimming', data);
        config.set('channels:' + data.channel + ':value', data.value);
        config.save();
    });

    socket.on('get-picture', function() {
        console.log("get-picture");
        fs.watchFile('/tmp/image_stream.jpg', function(current, previous) {
            fs.unwatchFile('/tmp/image_stream.jpg');
            io.sockets.emit('picture', 'image_stream.jpg?_t=' + (Math.random() * 100000));
            if (proc) proc.kill();
        });
        var args = [
            "-w", "640",
            "-h", "480",
            "-o", "/tmp/image_stream.jpg",
        ];
        proc = spawn('raspistill', args);
  });

});

http.listen(config.get('port'), function() {
    console.log('listening on *:' + config.get('port'));
});

var timerId = setInterval(function() {
    var t = readSensors();
    io.sockets.emit('tempChange', t);
}, 3000);

var timeTimerId = setInterval(function() {
    var t = moment().format('LLLL');
    if (t.localeCompare(currentTimeStr) !== 0) {
        currentTimeStr = t;
        io.sockets.emit('currentTime', currentTimeStr);
    }
}, 1000);

