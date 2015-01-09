/*
 * CometJS / input.js
 * copyright (c) 2014 Susisu
 */

 "use strict";

function end () {
    module.exports = Object.freeze({
        "InputDeviceEvent": InputDeviceEvent
    });
}

var ev = require("electronvolt");


function InputDeviceEvent(type, bubbles, cancelable) {
    ev.Event.call(this, type, bubbles, cancelable);
}

InputDeviceEvent.prototype = Object.create(ev.Event.prototype, {
    "constructor": {
        "value"       : InputDeviceEvent,
        "writable"    : true,
        "configurable": true
    }
});

Object.defineProperties(InputDeviceEvent, {
    "STATE_CHANGE": {
        "value": "stateChange"
    },
    "NOT_HANDLED": {
        "value": "notHandled"
    }
});

Object.defineProperties(InputDeviceEvent.prototype, {
    "clone": {
        "value": function () {
            return new InputDeviceEvent(this.type, this.bubbles, this.cancelable);
        }
    },
    "toString": {
        "value": function () {
            return this.formatToString("InputDeviceEvent", "type", "bubbles", "cancelable");
        }
    }
});


end();
