var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
//var fs = require('fs');
var path = require('path');
//var sensor = require('ds18x20');
//var moment = require('moment');

var spawn = require('child_process').spawn;
var child_process = require('child_process');

var config = require('./config');

var proc;
/*
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
*/


app.use('/', express.static(path.join(__dirname, 'temp')));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

var sockets = {};
//moment.locale('ru');
//var currentTimeStr = moment().format('LLLL');

io.on('connection', function(socket) {

    sockets[socket.id] = socket;
    console.log("Total clients connected : ", Object.keys(sockets).length);

    /*socket.emit('currentTime', currentTimeStr);
    socket.emit('clientInit', config.get('channels'));

    socket.on('disconnect', function() {
        delete sockets[socket.id];
    });

    socket.on('dimming', function(data) {
        socket.broadcast.emit('dimming', data);
        config.set('channels:' + data.channel + ':value', data.value);
        config.save();
    });
    */
    socket.on('get-picture', function() {
        console.log("get-picture");
        /*fs.watchFile('./temp/image_stream.jpg', function(current, previous) {
            //fs.unwatchFile('./temp/image_stream.jpg');
            io.sockets.emit('picture', 'image_stream.jpg?_t=' + (Math.random() * 100000));
            //if (proc) proc.kill();
        });*/
        var args = [
            //"-t", "0",
            //"-tl", "1000",
            "-w", "640",
            "-h", "480",
            //"-a", "4",
            //"-a", "%Y-%m-%d %X",
            //"-o", "./temp/image_stream.jpg",
            "-o", "-",
        ];

        proc = spawn('raspistill', args);
        /*
        proc.on('exit', function () {
            console.log("send picture");
            fs.readFile("./temp/image_stream.jpg", function(err, buffer){
                io.sockets.emit('picture', buffer.toString('base64'));
            });
        });
        */
        proc.stdout.on('data', function(data) {
            console.log('stdout: ${dt}');
            socket.emit('picture', {image: true, data});
        });
        proc.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
        });

        /*
        var cmd = 'raspistill ' + args.join(' ');
        child_process.exec(cmd,
            { encoding: 'base64'},
            function (err, stdout, stderr) {
                if (err) {
                    console.log('This is error!!!');
                    throw err;
                }
                console.log("Send picture >>>");
                //console.log(stdout);
                io.sockets.emit('picture', stdout);
            });
        */
  });

});

http.listen(config.get('port'), function() {
    console.log('listening on *:' + config.get('port'));
});
/*
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

*/