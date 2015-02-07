/*
 * CometJS / game.js
 * copyright (c) 2014 Susisu
 */

"use strict";

function end () {
    module.exports = Object.freeze({
        "Game"     : Game,
        "GameState": GameState,
        "GameEvent": GameEvent
    });
}

var ev = require("electronvolt");
var comet = {
    "music" : require("./music.js"),
    "score" : require("./score.js"),
    "thread": require("./thread.js")
};


var GameState = Object.freeze({
    "RUNNING": "running",
    "WAITING": "waiting"
});

function Game(ticker, fps, frameOffset, threads, music) {
    this._frameOffset = frameOffset;
    this._threads     = threads.slice();
    this._metronome   = new comet.music.Metronome(ticker, music, fps);

    this._state = GameState.WAITING;

    this._onMetronomeTick     = onMetronomeTick.bind(this);
    this._onMetronomeComplete = onMetronomeComplete.bind(this);
    this._onThreadScoreUpdate = onThreadScoreUpdate.bind(this);
}

Object.defineProperties(Game.prototype, {
    "score": {
        "get": function () {
            return this._score;
        }
    },
    "state": {
        "get": function () {
            return this._state;
        }
    },
    "start": {
        "value": function (startFrame) {
            if (this._state = GameState.WAITING) {
                this._state = GameState.RUNNING;

                for (var i = 0; i < this._threads.length; i++) {
                    this._threads[i].init(startFrame + this._frameOffset);
                    this._threads[i].addEventListener(
                        comet.score.ScoreUpdateEvent.UPDATE,
                        this._onThreadScoreUpdate
                    );
                }
                this._metronome.addEventListener(comet.music.MetronomeEvent.TICK, this._onMetronomeTick);
                this._metronome.addEventListener(comet.music.MetronomeEvent.COMPLETE, this._onMetronomeComplete);
                this._metronome.start(startFrame);
            }
        }
    },
    "stop": {
        "value": function () {
            if (this._state = GameState.RUNNING) {
                for (var i = 0; i < this._threads.length; i++) {
                    this._threads[i].removeEventListener(
                        comet.score.ScoreUpdateEvent.UPDATE,
                        this._onThreadScoreUpdate
                    );
                }

                this._metronome.removeEventListener(comet.music.MetronomeEvent.TICK, this._onMetronomeTick);
                this._metronome.removeEventListener(comet.music.MetronomeEvent.COMPLETE, this._onMetronomeComplete);
                this._metronome.stop();

                this._state = GameState.WAITING;
            }
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

function onThreadScoreUpdate(event) {
    this.dispatchEvent(event);
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
            return this.formatToString("GameEvent", ["type", "bubbles", "cancelable"]);
        }
    }
});


end();
