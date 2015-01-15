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


end();
