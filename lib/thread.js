/*
 * CometJS / thread.js
 * copyright (c) 2014 Susisu
 */

 "use strict";

function end () {
    module.exports = Object.freeze({
        "Thread": Thread
    });
}


function Thread() {

}

Object.defineProperties(Thread.prototype, {
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


end();
