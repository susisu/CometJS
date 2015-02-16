/*
 * CometJS / simple.js
 * copyright (c) 2014 Susisu
 */

"use strict";

function end () {
    module.exports = Object.freeze({
        "source" : comet.simple.source,
        "threads": comet.simple.threads,

        "Simple"        : Simple,
        "ThreadOption"  : ThreadOption
    });
}

var comet = {
    "simple": {
        "source" : require("./simple/source.js"),
        "threads": require("./simple/threads.js")
    }
};

function Simple(sources) {
    this.sources = sources;
}

Object.defineProperties(Simple.prototype, {
    "makeThreads": {
        "value": function (options) {
            var sources = this.sources.map(function (source) { return source.clone(); });
            if (this.options.length < sources.length) {
                throw new Error("");
            }
            var threads = [];
            for (var i = 0; i < sources.length; i++) {
                var source = sources[i];
                var option = options[i];
                var noteThread = new comet.simple.threads.NoteThread(
                    source.noteSource,
                    option.inputDevice,
                    option.hitRange,
                    option.speedMultiplier,
                    option.noteEntityBuilder
                );
                var longNoteThread = new comet.simple.threads.LongNoteThread(
                    source.longNoteSource,
                    option.inputDevice,
                    option.hitRange,
                    option.speedMultiplier,
                    option.longNoteEntityBuilder
                );
                threads.push(noteThread, longNoteThread);
            }
            return threads;
        }
    }
});

function ThreadOption(inputDevice, hitRange, stdDuration, speedMultiplier, noteEntityBuilder, longNoteEntityBuilder) {
    this.inputDevice           = inputDevice;
    this.hitRange              = hitRange;
    this.stdDuration           = stdDuration;
    this.speedMultiplier       = speedMultiplier;
    this.noteEntityBuilder     = noteEntityBuilder;
    this.longNoteEntityBuilder = longNoteEntityBuilder;
}

end();
