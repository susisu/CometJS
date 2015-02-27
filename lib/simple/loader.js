/*
 * CometJS / simple / loader.js
 * copyright (c) 2015 Susisu
 */

"use strict";

function end () {
    module.exports = Object.freeze({
        "Loader": Loader
    });
}

var mlk = require("mlk");

var comet = {
    "simple": {
        "source": require("./source.js")
    }
};

function MLKLoader() {
}

MLKLoader.prototype = Object.create(Object.prototype, {
    "constructor": {
        "value"       : MLKLoader,
        "writable"    : true,
        "configurable": true
    }
    "load": {
        "value": function (script) {
            var global = Object.create(mlk.prelude);
            var state  = new State(60.0, 0.0, 0.0, 0.0 0.0, []);
            exportMLKDef(global, state);
            mlk.run(global, mlk.parse(script));
            return state.sources;
        }
    }
});

function State(fps, correction, interval, unitSize, currentTime, sources) {
    this.fps         = fps;
    this.correction  = correction;
    this.interval    = interval;
    this.unitSize    = unitSize;
    this.currentTime = currentTime;
    this.sources     = sources;
}

function exportMLKDef(target, state) {
}

end();
