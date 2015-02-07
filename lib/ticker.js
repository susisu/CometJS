/*
 * CometJS / ticker.js
 * copyright (c) 2014 Susisu
 */

"use strict";

function end () {
    module.exports = Object.freeze({
        "ITicker"    : ITicker,
        "TickerEvent": TickerEvent
    });
}

var ev = require("electronvolt");


function ITicker() {
    ev.EventDispatcher.call(this);
}

ITicker.prototype = Object.create(ev.EventDispatcher.prototype, {
    "constructor": {
        "value"       : ITicker,
        "writable"    : true,
        "configurable": true
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
        "value": "TickerEvent.tick"
    }
});

Object.defineProperties(TickerEvent.prototype, {
    "clone": {
        "value": function () {
            return new TickerEvent(this.type, this.bubbles, this.cancelable);
        }
    },
    "toString": {
        "value": function () {
            return this.formatToString("TickerEvent", ["type", "bubbles", "cancelable"]);
        }
    }
})


end();
