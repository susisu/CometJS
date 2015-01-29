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


function Simple(sources) {
    this.sources = sources;
}

Object.defineProperties(Simple.prototype, {
    "makeThreads": {
        "value": function (options) {
            if (this.options.length < this.sources.length) {
                throw new Error("");
            }
            var threads = [];
            for (var i = 0; i < this.sources.length; i++) {
                var source = this.sources[i];
                var option = options[i];
                var noteThread = new NoteThread(
                    source.noteSource,
                    option.inputDevice,
                    option.speedMultiplier,
                    option.entityBuilder.noteEntityBuilder
                );
                var longNoteThread = new LongNoteThread(
                    source.longNoteSource,
                    option.inputDevice,
                    option.speedMultiplier,
                    option.entityBuilder.longNoteEntityBuilder
                );
                threads.push(noteThread, longNoteThread);
            }
            return threads;
        }
    }
});


function ThreadOption(inputDevice, stdDuration, speedMultiplier, entityBuilder) {
    this.inputDevice     = inputDevice;
    this.stdDuration     = stdDuration;
    this.speedMultiplier = speedMultiplier;
    this.entityBuilder   = entityBuilder;
}

function EntityBuilder(noteEntityBuilder, longNoteEntityBuilder) {
    this.noteEntityBuilder     = noteEntityBuilder;
    this.longNoteEntityBuilder = longNoteEntityBuilder;
}

function NoteThread(source, inputDevice, stdDuration, speedMultiplier, entityBuilder) {
    this._source        = source;
    this._inputDevice   = inputDevice;
    this._stdDuration   = stdDuration;
    this._entityBuilder = entityBuilder;
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


function LongNoteThread(source, inputDevice, stdDuration, speedMultiplier, entityBuilder) {
    this._source        = source;
    this._inputDevice   = inputDevice;
    this._stdDuration   = stdDuration;
    this._entityBuilder = entityBuilder;
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


function Source(noteSource, longNoteSource) {
    this.noteSource     = noteSource;
    this.longNoteSource = longNoteSource;
}

Object.defineProperties(Source.prototype, {
    "init": {
        "value": function (stdDuration, speedMultiplier) {
            this.noteSource.init(stdDuration, speedMultiplier);
            this.longNoteSource.init(stdDuration, speedMultiplier);
        }
    }
});

function NoteSource(notes, speedChanges, propertyChanges) {
    this.notes           = notes;
    this.speedChanges    = speedChanges;
    this.propertyChanges = propertyChanges;
}

Object.defineProperties(NoteSource.prototype, {
    "init": {
        "value": function (stdDuration, speedMultiplier) {
            // should it be stable?
            this.speedChanges.sort(byFrames);
            this.propertyChanges.sort(byFrames);

            this.notes.sort(byHitFrames);

            var numSpeedChanges = this.speedChanges.length;
            var numNotes        = this.notes.length;

            var noteIndex;
            var speedChangeIndex = 0;

            for (noteIndex = 0; noteIndex < numNotes; noteIndex++) {
                var note = this.notes[noteIndex];

                while (speedChangeIndex < 0 || (speedChangeIndex < numSpeedChanges
                    && this.speedChanges[speedChangeIndex].frame < note.hitFrame)) {
                    speedChangeIndex++;
                }
                speedChangeIndex--;

                var currentSpeed    = speedChangeIndex < 0 ? 1.0 : this.speedChanges[speedChangeIndex].speed;
                var currentFrame    = note.hitFrame;
                var currentPosition = 0.0;

                while (currentPosition > -1.0) {
                    currentFrame--;

                    while (speedChangeIndex >= 0 && currentFrame < this.speedChanges[speedChangeIndex].frame) {
                        speedChangeIndex--;

                        if (speedChangeIndex < 0) {
                            currentSpeed = 1.0
                        }
                        else {
                            currentSpeed = this.speedChanges[speedChangeIndex].speed;
                        }
                    }

                    currentPosition -= currentSpeed * note.relSpeed * speedMultiplier / stdDuration;
                }

                note.appearFrame   = currentFrame;
                note.posCorrection = currentPos + 1.0;
            }

            this.notes.sort(byAppearFrames);
        }
    }
});

function LongNoteSource(longNotes, speedChanges, propertyChanges) {
    this.longNotes       = longNotes;
    this.speedChanges    = speedChanges;
    this.propertyChanges = propertyChanges;
}

Object.defineProperties(LongNoteSource.prototype, {
    "init": {
        "value": function (stdDuration, speedMultiplier) {
            
        }
    }
});


function Note(hitFrame, relSpeed, properties) {
    this.hitFrame      = hitFrame;
    this.relSpeed      = relSpeed;
    this.appearFrame   = 0;
    this.posCorrection = 0;
    this.properties    = properties;
}

function LongNote(hitFrame, endFrame, relSpeed, properties) {
    this.hitFrame      = hitFrame;
    this.endFrame      = endFrame;
    this.relSpeed      = relSpeed;
    this.appearFrame   = 0;
    this.length        = 0;
    this.posCorrection = 0;
    this.properties    = properties;
}

function SpeedChange(frame, speed) {
    this.frame = frame;
    this.speed = speed;
}

function PropertyChange(frame, name, value) {
    this.frame = frame;
    this.name  = name;
    this.value = value;
}

function byFrames(x, y) {
    return x.frame - y.frame;
}

function byHitFrames(x, y) {
    return x.hitFrame - y.hitFrame;
}

function byAppearFrames(x, y) {
    return x.appearFrame - y.appearFrame;
}


end();
