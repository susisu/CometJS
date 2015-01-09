/*
 * CometJS / comet.js
 * copyright (c) 2014 Susisu
 */

"use strict";

function end () {
    module.exports = Object.freeze(mergeObjects([
        {},
        require("./game.js"),
        require("./thread.js"),
        require("./music.js"),
        require("./ticker.js")
    ]));
}


function mergeObjects (objects) {
    var merged = {};
    objects.forEach(function (object) {
        for (var key in object) {
            if (merged.hasOwnProperty(key)){
                throw new Error("names conflicted: " + String(key));
            }
            else {
                merged[key] = object[key];
            }
        }
    });
    return merged;
}


end();
