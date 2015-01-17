/*
 * CometJS / simple.js
 * copyright (c) 2014 Susisu
 */

"use strict";

function end () {
    module.exports = Object.freeze({
        "Simple"      : Simple,
        "ThreadOption": ThreadOption
    });
}

var comet = {
    "input" : require("./input.js"),
    "score" : require("./score.js"),
    "thread": require("./thread.js")
};


function Simple(source) {

}

Object.defineProperties(Simple.prototype, {
    "makeThreads": {
        "value": function (options) {
            // return threads
        }
    }
});


function ThreadOption(inputDevice, stdDuration, speedMultiplier) {
    this.inputDevice     = inputDevice;
    this.stdDuration     = stdDuration;
    this.speedMultiplier = speedMultiplier;
}


function NoteThread(source, inputDevice) {
    this._source      = source;
    this._inputDevice = inputDevice;
}

NoteThread.prototype = Object.create(comet.thread.IThread.prototype, {
    "constructor" : NoteThread,
    "writable"    : true,
    "configurable": true
});

Object.defineProperties(NoteThread.prototype, {
    "init": {
        "value": function (initialFrame) {

        }
    },
    "tick": {
        "value": function (currentFrame) {

        }
    }
});


function LongNoteThread(source, inputDevice) {
    this._source      = source;
    this._inputDevice = inputDevice;
}

LongNoteThread.prototype = Object.create(comet.thread.IThread.prototype, {
    "constructor" : LongNoteThread,
    "writable"    : true,
    "configurable": true
});

Object.defineProperties(LongNoteThread.prototype, {
    "init": {
        "value": function (initialFrame) {

        }
    },
    "tick": {
        "value": function (currentFrame) {
            
        }
    }
});


end();
