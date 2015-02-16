/*
 * CometJS / simple / source.js
 * copyright (c) 2014 Susisu
 */

"use strict";

function end () {
    module.exports = Object.freeze({
        "Source": Source,

        "NoteSource"    : NoteSource,
        "LongNoteSource": LongNoteSource,

        "Note"          : Note,
        "LongNote"      : LongNote,
        "SpeedChange"   : SpeedChange,
        "PropertyChange": PropertyChange
    });
}

var comet = {
    "util": require("../util.js")
};

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

function byFrames(x, y) {
    return x.frame - y.frame;
}

function bySpawnFrames(x, y) {
    return x.spawnFrame - y.spawnFrame;
}


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

            this.notes = comet.util.stableSort(this.notes, byFrames);

            var numSpeedChanges = this.speedChanges.length;
            var numNotes        = this.notes.length;

            var noteIndex;
            var speedChangeIndex = 0;

            for (noteIndex = 0; noteIndex < numNotes; noteIndex++) {
                var note = this.notes[noteIndex];

                while (speedChangeIndex < 0 || (speedChangeIndex < numSpeedChanges
                    && this.speedChanges[speedChangeIndex].frame < note.frame)) {
                    speedChangeIndex++;
                }
                speedChangeIndex--;

                var currentSpeed    = speedChangeIndex < 0 ? 1.0 : this.speedChanges[speedChangeIndex].speed;
                var currentFrame    = note.frame;
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

                note.spawnFrame   = currentFrame;
                note.posCorrection = currentPos + 1.0;
            }

            this.notes = comet.util.stableSort(this.notes, bySpawnFrames);
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

            this.longNotes = comet.util.stableSort(this.longNotes, byFrames);

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

                    if (longNote.frame <= currentFrame) {
                        currentLength += currentSpeed * longNote.relSpeed * speedMultiplier / stdDuration;
                    }
                    else {
                        currentPosition -= currentSpeed * longNote.relSpeed * speedMultiplier / stdDuration;
                    }
                }

                longNote.spawnFrame   = currentFrame;
                longNote.length        = currentLength;
                longNote.posCorrection = currentPosition + 1.0;
            }

            this.longNotes = comet.util.stableSort(this.longNotes, bySpawnFrames);
        }
    }
});


function Note(frame, relSpeed, properties) {
    this.frame         = frame;
    this.relSpeed      = relSpeed;
    this.properties    = cloneObject(properties);

    this.spawnFrame    = frame;
    this.posCorrection = 0;
}

Object.defineProperties(Note.prototype, {
    "clone": {
        "value": function () {
            var note = new Note(this.frame, this.relSpeed, cloneObject(this.properties));
            note.spawnFrame    = this.spawnFrame;
            note.posCorrection = this.posCorrection;
            return note;
        }
    }
});

function LongNote(frame, endFrame, relSpeed, properties) {
    this.frame         = frame;
    this.endFrame      = endFrame;
    this.relSpeed      = relSpeed;
    this.properties    = cloneObject(properties);

    this.spawnFrame    = frame;
    this.length        = 0;
    this.posCorrection = 0;
}

Object.defineProperties(LongNote.prototype, {
    "clone": {
        "value": function () {
            var longNote = new LongNote(this.frame, this.endFrame, this.relSpeed, cloneObject(this.properties));
            longNote.spawnFrame    = this.spawnFrame;
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


end();
