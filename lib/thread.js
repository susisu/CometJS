/*
 * CometJS / thread.js
 * copyright (c) 2014 Susisu
 */

 "use strict";

function end () {
    module.exports = Object.freeze({
        "IThread"         : IThread,
        "ThreadScoreEvent": ThreadScoreEvent
    });
}

var ev = require("electronvolt");


function IThread() {

}

Object.defineProperties(IThread.prototype, {
    "init": {
        "value": function (initialFrame) {
            throw new Error("not implemented");
        }
    },
    "tick": {
        "value": function (currentFrame) {
            throw new Error("not implemented");
        }
    }
});


function ThreadScoreEvent(type, bubbles, cancelable, info) {
    ev.Event.call(this, type, bubbles, cancelable);
    this.info = info;
}

ThreadScoreEvent.prototype = Object.create(ev.Event.prototype, {
    "constructor": {
        "value"       : ThreadScoreEvent,
        "writable"    : true,
        "configurable": true
    }
});

Object.defineProperties(ThreadScoreEvent, {
    "UPDATE": {
        "value": "ThreadScoreEvent.update"
    }
});


end();
