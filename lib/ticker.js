/*
 * CometJS / ticker.js
 * copyright (c) 2014 Susisu
 */

 "use strict";

function end () {
    module.exports = Object.freeze({
        "Ticker"     : Ticker,
        "TickerEvent": TickerEvent
    });
}

var ev = require("electronvolt");


function Ticker(interval) {
    ev.EventDispatcher.call(this);
    this.interval = interval;
}

Ticker.prototype = Object.create(ev.EventDispatcher.prototype, {
    "constructor": {
        "value"       : Ticker,
        "writable"    : true,
        "configurable": true
    }
});

Object.defineProperties(Ticker.prototype, {
    "start": {
        "value": function () {
            throw Error("not implemented");
        }
    },
    "stop": {
        "value": function () {
            throw Error("not implemented");
        }
    }
});


function TickerEvent(type, bubbles, cancelable) {
    ev.Event.call(this, type, bubbles, cancelable);
}

TickerEvent.prototype = Object.create(ev.Event.prototype, {
    "constructor": {
        "value"       : TickerEvent,
        "writable"    : true,
        "configurable": true
    }
});

Object.defineProperties(TickerEvent, {
    "TICK": {
        "value": "tick"
    }
});


end();
