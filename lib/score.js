/*
 * CometJS / score.js
 * copyright (c) 2014 Susisu
 */

"use strict";

function end () {
    module.exports = Object.freeze({
        "ScoreUpdateInfo" : ScoreUpdateInfo,
        "ScoreUpdateEvent": ScoreUpdateEvent
    });
}

var ev = require("electronvolt");


function ScoreUpdateInfo(type, values) {
    this.type   = type;
    this.values = values;
}


function ScoreUpdateEvent(type, bubbles, cancelable, info) {
    ev.Event.call(this, type, bubbles, cancelable);
    this.info = info;
}

ScoreUpdateEvent.prototype = Object.create(ev.Event.prototype, {
    "constructor": {
        "value"       : ScoreUpdateEvent,
        "writable"    : true,
        "configurable": true
    }
});

Object.defineProperties(ScoreUpdateEvent, {
    "UPDATE": {
        "value": "ScoreUpdateEvent.update"
    }
});

Object.defineProperties(ScoreUpdateEvent.prototype, {
    "clone": {
        "value": function () {
            return new ScoreUpdateEvent(this.type, this.bubbles, this.cancelable, this.info);
        }
    },
    "toString": {
        "value": function () {
            return this.formatToString("ScoreUpdateEvent", ["type", "bubbles", "cancelable", "info"]);
        }
    }
});


end();
