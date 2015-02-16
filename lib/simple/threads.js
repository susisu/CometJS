/*
 * CometJS / simple / threads.js
 * copyright (c) 2014 Susisu
 */

"use strict";

function end () {
    module.exports = Object.freeze({
        "NoteThread"    : NoteThread,
        "LongNoteThread": LongNoteThread
    });
}

var comet = {
    "thread" : require("../thread.js")
};

function NoteThread(source, inputDevice, hitRange, stdDuration, speedMultiplier, entityBuilder) {
    this._source          = source.clone();
    this._inputDevice     = inputDevice;
    this._hitRange        = hitRange;
    this._stdDuration     = stdDuration;
    this._speedMultiplier = speedMultiplier;
    this._entityBuilder   = entityBuilder;

    this._entities            = null;
    this._noteIndex           = 0;
    this._speed               = 1.0;
    this._speedChangeIndex    = 0;
    this._propertyChangeIndex = 0;
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
            this._entities            = [];
            this._noteIndex           = 0;
            this._speed               = 1.0;
            this._speedChangeIndex    = 0;
            this._propertyChangeIndex = 0;

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
            var numEntities = this._entities.length;
            for (var i = 0; i < numEntities; i++) {
                var entity = this._entities[i];
                entity.t += this._speed * entity.relSpeed * this._speedMultiplier / this._stdDuration;
                entity.frame++;
                if (entity.frame >= this._hitRange) {
                    if (dispatchEvent) {
                        // dispatch a judgement event
                    }
                    entity.kill();
                    this._entities.splice(i, 1);
                    numEntities--;
                    i--;
                }
            }
        }
    },
    "_createEntities": {
        "value": function (currentFrame) {
            while (this._noteIndex < this._source.notes.length
                && this._source.notes[this._noteIndex].appearFrame === currentFrame) {
                if (this._entityBuilder) {
                    var note   = this._source.notes[this._noteIndex];
                    var entity = this._entityBuilder.createNoteEntity(
                        -1.0 + note.posCorrection,
                        note.relSpeed,
                        note.appearFrame - note.hitFrame,
                        note.properties
                    );
                    this._insertEntity(entity);
                }
                this._noteIndex++;
            }
        }
    },
    "_insertEntity": {
        "value": function (entity) {
            for (var i = 0; i < this._entities.length; i++) {
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
            while (this._speedChangeIndex < this._source.speedChanges.length
                && this._source.speedChanges[this._speedChangeIndex].frame === currentFrame) {
                this._speed = this._source.speedChanges[this._speedChangeIndex].speed;
                this._speedChangeIndex++;
            }
        }
    },
    "_changeProperties": {
        "value": function (currentFrame) {
            while (this._propertyChangeIndex < this._source.propertyChanges.length
                && this._source.propertyChanges[this._propertyChangeIndex].frame === currentFrame) {
                var propertyChange = this._source.propertyChanges[this._propertyChangeIndex];
                for (var i = 0; i < _entities.length; i++) {
                    _entities.setProperty(propertyChange.name, propertyChange.value);
                }
                this._propertyChangeIndex++;
            }
        }
    }
});


function LongNoteThread(source, inputDevice, hitRange, stdDuration, speedMultiplier, entityBuilder) {
    this._source          = source.clone();
    this._inputDevice     = inputDevice;
    this._hitRange        = hitRange;
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


end();
