/*
 * CometJS / util.js
 * copyright (c) 2014 Susisu
 */

"use strict";

function end () {
    module.exports = Object.freeze({
        "stableSort": stableSort
    });
}


function stableSort(array, compare) {
    var n = array.length;
    switch (n) {
        case 0:
        case 1:
            return array.slice();
        // a bit fast
        case 2:
            return compare(array[0], array[1]) <= 0 ? [array[0], array[1]] : [array[1], array[0]];
        default:
            return merge(
                stableSort(array.slice(0, n >> 1), compare),
                stableSort(array.slice(n >> 1), compare),
                compare
            );
    }
}

function merge(x, y, compare) {
    var n = x.length, m = y.length;
    var result = new Array(n + m);
    var i = 0, j = 0;
    while (i < n && j < m) {
        if (compare(x[i], y[j]) <= 0) {
            result[i + j] = x[i];
            i++;
        }
        else {
            result[i + j] = y[j];
            j++;
        }
    }
    while (i < n) {
        result[i + j] = x[i];
        i++;
    }
    while (j < m) {
        result[i + j] = y[j];
        j++;
    }
    return result;
}


end();
