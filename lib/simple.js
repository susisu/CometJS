/*
 * CometJS / simple.js
 * copyright (c) 2014 Susisu
 */

"use strict";

function end () {
    module.exports = Object.freeze({
        "Simple"        : Simple,
        "ThreadOption"  : ThreadOption,
        "NoteThread"    : NoteThread,
        "LongNoteThread": LongNoteThread
    });
}

var comet = {
    "input" : require("./input.js"),
    "score" : require("./score.js"),
    "thread": require("./thread.js"),
    "util"  : require("./util.js")
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
                var noteThread = new NoteThread(
                    source.noteSource,
                    option.inputDevice,
                    option.speedMultiplier,
                    option.noteEntityBuilder
                );
                var longNoteThread = new LongNoteThread(
                    source.longNoteSource,
                    option.inputDevice,
                    option.speedMultiplier,
                    option.longNoteEntityBuilder
                );
                threads.push(noteThread, longNoteThread);
            }
            return threads;
        }
    }
});

function ThreadOption(inputDevice, stdDuration, speedMultiplier, noteEntityBuilder, longNoteEntityBuilder) {
    this.inputDevice           = inputDevice;
    this.stdDuration           = stdDuration;
    this.speedMultiplier       = speedMultiplier;
    this.noteEntityBuilder     = noteEntityBuilder;
    this.longNoteEntityBuilder = longNoteEntityBuilder;
}


function NoteThread(source, inputDevice, stdDuration, speedMultiplier, entityBuilder) {
    this._source          = source;
    this._inputDevice     = inputDevice;
    this._stdDuration     = stdDuration;
    this._speedMultiplier = speedMultiplier;
    this._entityBuilder   = entityBuilder;

    this._entities         = null;
    this._noteIndex        = 0;
    this._speed            = 1.0;
    this._speedChangeIndex = 0;
}

NoteThread.prototype = Object.create(comet.thread.IThread.prototype, {
    "constructor": {
        "value"       : NoteThread,
        "writable"    : true,
        "configurable": true
    }
});

Object.defineProperties(NoteThread.prototype, {
    "init": {
        "value": function (initialFrame) {
            this._source.init(this._stdDuration, this._speedMultiplier);
            this._entities         = [];
            this._noteIndex        = 0;
            this.speed             = 1.0;
            this._speedChangeIndex = 0;

            var currentFrame = Math.min(
                this._source.notes.length        > 0 ? this._source.notes[0].appearFrame  : initialFrame,
                this._source.speedChanges.length > 0 ? this._source.speedChanges[0].frame : initialFrame
            );
            while (currentFrame <= initialFrame) {
                this._initTick(currentFrame);
                currentFrame++;
            }
        }
    },
    "tick": {
        "value": function (currentFrame) {
            this._moveEntities(true);
            this._createEntities(currentFrame);
            this._changeSpeed(currentFrame);
            this._changeProperties(currentFrame);
        }
    },
    "_initTick": {
        "value": function (currentFrame) {
            this._moveEntities(false);
            this._createEntities(currentFrame);
            this._changeSpeed(currentFrame);
            this._changeProperties(currentFrame);
        }
    },
    "_moveEntities": {
        "value": function (dispatchEvent) {

        }
    },
    "_createEntities": {
        "value": function (currentFrame) {
            var numNotes = this._source.notes.length;
            while (this._noteIndex < numNotes && this._source.notes[this._noteIndex].appearFrame == currentFrame) {
                if (this._entityBuilder) {
                    var note   = this._source.notes[this._noteIndex];
                    var entity = this._entityBuilder.createNoteEntity(
                        -1.0 + note.posCorrection,
                        note.relSpeed,
                        note.appearFrame - note.hitFrame,
                        cloneObject(note.properties)
                    );
                    this._insertEntity(entity);
                }
                this._noteIndex++;
            }
        }
    },
    "_insertEntity": {
        "value": function (entity) {
            var numEntities = this._entities.length;
            for (var i = 0; i < numEntities; i++) {
                if (entity.frame > this._entities[i].frame) {
                    this._entities.splice(i, 0, entity);
                    return;
                }
            }
            this._entities.push(entity);
        }
    },
    "_changeSpeed": {
        "value": function (currentFrame) {

        }
    },
    "_changeProperties": {
        "value": function (currentFrame) {

        }
    }
});


function LongNoteThread(source, inputDevice, stdDuration, speedMultiplier, entityBuilder) {
    this._source          = source;
    this._inputDevice     = inputDevice;
    this._stdDuration     = stdDuration;
    this._speedMultiplier = speedMultiplier;
    this._entityBuilder   = entityBuilder;
}

LongNoteThread.prototype = Object.create(comet.thread.IThread.prototype, {
    "constructor": {
        "value"       : LongNoteThread,
        "writable"    : true,
        "configurable": true
    }
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
    "clone": {
        "value": function () {
            return new Source(this.noteSource.clone(), this.longNoteSource.clone());
        }
    },
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
    "clone": {
        "value": function () {
            return new LongNoteSource(
                this.notes.map(function (note) { return note.clone(); }),
                this.speedChanges.map(function (speedChange) { return speedChange.clone(); }),
                this.propertyChanges.map(function (propertyChange) { return propertyChange.clone(); })

            );
        }
    },
    "init": {
        "value": function (stdDuration, speedMultiplier) {
            this.speedChanges    = comet.util.stableSort(this.speedChanges, byFrames);
            this.propertyChanges = comet.util.stableSort(this.propertyChanges, byFrames);

            this.notes = comet.util.stableSort(this.notes, byHitFrames);

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

            this.notes = comet.util.stableSort(this.notes, byAppearFrames);
        }
    }
});

function LongNoteSource(longNotes, speedChanges, propertyChanges) {
    this.longNotes       = longNotes;
    this.speedChanges    = speedChanges;
    this.propertyChanges = propertyChanges;
}

Object.defineProperties(LongNoteSource.prototype, {
    "clone": {
        "value": function () {
            return new LongNoteSource(
                this.longNotes.map(function (longNote) { return longNote.clone(); }),
                this.speedChanges.map(function (speedChange) { return speedChange.clone(); }),
                this.propertyChanges.map(function (propertyChange) { return propertyChange.clone(); })

            );
        }
    },
    "init": {
        "value": function (stdDuration, speedMultiplier) {
            this.speedChanges    = comet.util.stableSort(this.speedChanges, byFrames);
            this.propertyChanges = comet.util.stableSort(this.propertyChanges, byFrames);

            this.longNotes = comet.util.stableSort(this.longNotes, byHitFrames);

            var numSpeedChanges = this.speedChanges.length;
            var numLongNotes    = this.longNotes.length;

            var longNoteIndex;
            var speedChangeIndex = 0;

            for (longNoteIndex = 0; longNoteIndex < numLongNotes; longNoteIndex++) {
                var longNote = this.longNotes[longNoteIndex];

                while (speedChangeIndex < 0 || (speedChangeIndex < numSpeedChanges
                    && this.speedChanges[speedChangeIndex].frame < longNote.endFrame)) {
                    speedChangeIndex++;
                }
                speedChangeIndex--;

                var currentSpeed    = speedChangeIndex < 0 ? 1.0 : this.speedChanges[speedChangeIndex].speed;
                var currentFrame    = longNote.endFrame;
                var currentPosition = 0.0;
                var currentLength   = 0.0;

                while (currentPosition > -1.0) {
                    currentFrame--;

                    while (speedChangeIndex >= 0 && currentFrame < this.speedChanges[speedChangeIndex].frame) {
                        speedChangeIndex--;

                        if (speedChangeIndex < 0) {
                            currentSpeed = 1.0;
                        }
                        else {
                            currentSpeed = this.speedChanges[speedChangeIndex].speed;
                        }
                    }

                    if (longNote.hitFrame <= currentFrame) {
                        currentLength += currentSpeed * longNote.relSpeed * speedMultiplier / stdDuration;
                    }
                    else {
                        currentPosition -= currentSpeed * longNote.relSpeed * speedMultiplier / stdDuration;
                    }
                }

                longNote.appearFrame   = currentFrame;
                longNote.length        = currentLength;
                longNote.posCorrection = currentPosition + 1.0;
            }

            this.longNotes = comet.util.stableSort(this.longNotes, byAppearFrames);
        }
    }
});


function Note(hitFrame, relSpeed, properties) {
    this.hitFrame      = hitFrame;
    this.relSpeed      = relSpeed;
    this.appearFrame   = 0;
    this.posCorrection = 0;
    this.properties    = cloneObject(properties);
}

Object.defineProperties(Note.prototype, {
    "clone": {
        "value": function () {
            var note = new Note(this.hitFrame, this.relSpeed, cloneObject(this.properties));
            note.appearFrame   = this.appearFrame;
            note.posCorrection = this.posCorrection;
            return note;
        }
    }
});

function LongNote(hitFrame, endFrame, relSpeed, properties) {
    this.hitFrame      = hitFrame;
    this.endFrame      = endFrame;
    this.relSpeed      = relSpeed;
    this.appearFrame   = 0;
    this.length        = 0;
    this.posCorrection = 0;
    this.properties    = cloneObject(properties);
}

Object.defineProperties(LongNote.prototype, {
    "clone": {
        "value": function () {
            var longNote = new LongNote(this.hitFrame, this.endFrame, this.relSpeed, cloneObject(this.properties));
            longNote.appearFrame   = this.appearFrame;
            longNote.length        = this.length;
            longNote.posCorrection = this.posCorrection;
            return longNote;
        }
    }
});

function SpeedChange(frame, speed) {
    this.frame = frame;
    this.speed = speed;
}

Object.defineProperties(SpeedChange.prototype, {
    "clone": {
        "value": function () {
            return new SpeedChange(this.frame, this.speed);
        }
    }
});

function PropertyChange(frame, name, value) {
    this.frame = frame;
    this.name  = name;
    this.value = value;
}

Object.defineProperties(PropertyChange.prototype, {
    "clone": {
        "value": function () {
            return new PropertyChange(this.frame, this.name, this.value);
        }
    }
});

function byFrames(x, y) {
    return x.frame - y.frame;
}

function byHitFrames(x, y) {
    return x.hitFrame - y.hitFrame;
}

function byAppearFrames(x, y) {
    return x.appearFrame - y.appearFrame;
}


function cloneObject(object) {
    if (typeof object !== "object" || object === null) {
        return object;
    }
    else {
        var copy = {};
        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                copy[key] = object[key];
            }
        }
        return copy;
    }
}


end();
