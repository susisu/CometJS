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


function Loader() {

}

Loader.prototype = Object.create(Object.prototype, {
    "constructor": {
        "writable"    : true,
        "configurable": true,
        "value"       : Loader
    },
    "load": {
        "value": function (script) {
            var prog = mlk.parse("", script);
            // try {
                mlk.run(mlk.prelude, prog);
            // }
            // catch (error) {
            //     console.log(error.toString());
            // }
        }
    }
});


end();
