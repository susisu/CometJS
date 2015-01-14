/*
 * CometJS / score.js
 * copyright (c) 2014 Susisu
 */

 "use strict";

function end () {
    module.exports = Object.freeze({
        "IScore"    : IScore
    });
}


function IScore() {

}

Object.defineProperties(IScore.prototype, {
    "clone": {
        "value": function () {
            throw new Error("not implemented");
        }
    },
    "update": {
        "value": function (info) {
            throw new Error("not implemented");
        }
    }
});


end();
