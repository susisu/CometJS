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
            // return threads
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

function NoteSource(notes, speedChanges, propertyChanges) {
    this.notes           = notes;
    this.speedChanges    = speedChanges;
    this.propertyChanges = propertyChanges;
}

function NoteSource(longNotes, speedChanges, propertyChanges) {
    this.longNotes       = longNotes;
    this.speedChanges    = speedChanges;
    this.propertyChanges = propertyChanges;
}

function Note(hitFrame, relSpeed, properties) {
    this.hitFrame      = hitFrame;
    this.relSpeed      = relSpeed;
    this.appearFrame   = 0;
    this.posCorrection = 0;
    this.properties    = properties;
}

Object.defineProperties(Note.prototype, {
    "frame": {
        "get": function () {
            return this.hitFrame;
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
    this.properties    = properties;
}

Object.defineProperties(LongNote.prototype, {
    "frame": {
        "get": function () {
            return this.hitFrame;
        }
    }
});

function SpeedChange(frame, speed) {
    this.frame = frame;
    this.speed = speed;
}

function PropertyChange(frame, name, value) {
    this.frame = frame;
    this.name  = name;
    this.value = value;
}


end();
