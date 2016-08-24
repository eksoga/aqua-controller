var moment = require('moment');
var config = require('./config');

var beginON = moment(config.get('scheduler:light:beginON'), "hh:mm");
var finishON = moment(config.get('scheduler:light:finishON'), "hh:mm");
var beginOFF = moment(config.get('scheduler:light:beginOFF'), "hh:mm");
var finishOFF = moment(config.get('scheduler:light:finishOFF'), "hh:mm");

if (beginON.isAfter(finishON)) {
    finishON.add(1, 'day');
}
if (finishON.isAfter(beginOFF)) {
    beginOFF.add(1, 'day');
}
if (beginOFF.isAfter(finishOFF)) {
    finishOFF.add(1, 'day');
}

console.log(beginON.format());
console.log(finishON.format());
console.log(beginOFF.format());
console.log(finishOFF.format());


console.log(finishON.diff(beginON, 'seconds'));
console.log(finishOFF.diff(beginOFF, 'seconds'));

var current = moment();
var pin = 0;

if (current.diff(beginON, 'seconds') > finishON.diff(beginON, 'seconds')) {

} else {
    pin
}

console.log(current.diff(beginON, 'seconds'));
console.log(current.diff(beginOFF, 'seconds'));


