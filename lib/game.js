/*
 * CometJS / game.js
 * copyright (c) 2014 Susisu
 */

 "use strict";

function end () {
    module.exports = Object.freeze({
        "Game"     : Game,
        "GameEvent": GameEvent
    });
}

var ev = require("electronvolt");
var comet = {
    "music": require("./music.js")
};


function Game(threads, music, fps, frameOffset) {
    this._threads     = threads.slice();
    this._metronome   = new comet.music.Metronome(music, fps);
    this._frameOffset = frameOffset;

    this._onMetronomeTick     = onMetronomeTick.bind(this);
    this._onMetronomeComplete = onMetronomeComplete.bind(this);
}

Object.defineProperties(Game.prototype, {
    "start": {
        "value": function (startFrame) {
            for (var i = 0; i < this._threads.length; i++) {
                this._threads[i].init(startFrame + this._frameOffset);
            }
            this._metronome.addEventListener(comet.music.MusicEvent.TICK, this._onMetronomeTick);
            this._metronome.addEventListener(comet.music.MusicEvent.COMPLETE, this._onMetronomeComplete);
            this._metronome.start(startFrame);
        }
    },
    "stop": {
        "value": function () {
            this._metronome.removeEventListener(comet.music.MusicEvent.TICK, this._onMetronomeTick);
            this._metronome.removeEventListener(comet.music.MusicEvent.COMPLETE, this._onMetronomeComplete);
            this._metronome.stop();
        }
    }
});

function onMetronomeTick(event) {
    for (var i = 0; i < this._threads.length; i++) {
        this._threads[i].tick(event.currentFrame + this._frameOffset);
    }
}

function onMetronomeComplete(event) {
    this.stop();
    this.dispatchEvent(new GameEvent(GameEvent.COMPLETE));
}


function GameEvent(type, bubbles, cancelable) {
    ev.Event.call(this, type, bubbles, cancelable);
}

GameEvent.prototype = Object.create(ev.Event.prototype, {
    "constructor": {
        "value"       : GameEvent,
        "writable"    : true,
        "configurable": true
    }
});

Object.defineProperties(GameEvent, {
    "COMPLETE": {
        "value": "GameEvent.complete"
    }
});

Object.defineProperties(GameEvent.prototype, {
    "clone": {
        "value": function () {
            return new GameEvent(this.type, this.bubbles, this.cancelable);
        }
    },
    "toString": {
        "value": function () {
            return this.formatToString("GameEvent", "type", "bubbles", "cancelable");
        }
    }
});


end();
