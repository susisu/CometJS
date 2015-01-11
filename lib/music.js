/*
 * CometJS / music.js
 * copyright (c) 2014 Susisu
 */

 "use strict";

function end () {
    module.exports = Object.freeze({
        "Metronome"     : Metronome,
        "MetronomeEvent": MetronomeEvent,
        "Music"         : Music,
        "MusicEvent"    : MusicEvent
    });
}

var ev = require("electronvolt");
var comet = {
    "ticker": require("./ticker.js")
};


var MetronomeState = Object.freeze({
    "RUNNING": "running",
    "WAITING": "waiting"
});

function Metronome(ticker, music, fps) {
    this._ticker       = ticker;
    this._music        = music;
    this._fps          = fps;
    this._currentFrame = 0;

    this._state = MetronomeState.WAITING;

    this._onTick     = onTick.bind(this);
    this._onComplete = onComplete.bind(this);
}

Object.defineProperties(Metronome.prototype, {
    "start": {
        "value": function (startFrame) {
            if (this._state === MetronomeState.WAITING) {
                this._state = MetronomeState.RUNNING;

                this._currentFrame = startFrame;

                this._music.play(startFrame / this._fps * 1000);
                this._music.addEventListener(MusicEvent.COMPLETE, this._onComplete);

                this._ticker.addEventListener(comet.ticker.TickerEvent.TICK, this._onTick);
            }
        }
    },
    "stop": {
        "value": function () {
            if (this._state === MetronomeState.RUNNING) {
                this._music.stop();
                this._music.removeEventListener(MusicEvent.COMPLETE, this._onComplete);

                this._ticker.removeEventListener(comet.ticker.TickerEvent.TICK, this._onTick);

                this._state = MetronomeState.WAITING;
            }
        }
    }
});

function onTick(event) {
    while (this._music.position / 1000 * this._fps > this._currentFrame) {
        this._currentFrame++;
        this.dispatchEvent(new MetronomeEvent(MetronomeEvent.TICK, false, false, this._currentFrame));
    }
}

function onComplete(event) {
    this.stop();
    this.dispatchEvent(new MetronomeEvent(MetronomeEvent.COMPLETE));
}


function MetronomeEvent(type, bubbles, cancelable, currentFrame) {
    ev.Event.call(this, type, bubbles, cancelable);
    this.currentFrame = currentFrame;
}

MetronomeEvent.prototype = Object.create(ev.Event.prototype, {
    "constructor": {
        "value"       : MetronomeEvent,
        "writable"    : true,
        "configurable": true
    }
});

Object.defineProperties(MetronomeEvent, {
    "COMPLETE": {
        "value": "MetronomeEvent.complete"
    },
    "TICK": {
        "value": "MetronomeEvent.tick"
    }
});

Object.defineProperties(MetronomeEvent.prototype, {
    "clone": {
        "value": function () {
            return new MetronomeEvent(this.type, this.bubbles, this.cancelable, this.currentFrame);
        }
    },
    "toString": {
        "value": function () {
            return this.fromatToString("MetronomeEvent", "type", "bubbles", "cancelable", "currentFrame");
        }
    }
});

function Music() {

}

Object.defineProperties(Music.prototype, {
    "length": {
        "get": function () {
            throw new Error("not implemented");
        }
    },
    "position": {
        "get": function () {
            throw new Error("not implemented");
        }
    },
    "start": {
        "value": function (startTime) {
            throw new Error("not implemented");
        }
    },
    "stop": {
        "value": function () {
            throw new Error("not implemented");
        }
    }
});


function MusicEvent(type, bubbles, cancelable) {
    ev.Event.call(this, type, bubbles, cancelable);
}

MusicEvent.prototype = Object.create(ev.Event.prototype, {
    "constructor": {
        "value"       : MusicEvent,
        "writable"    : true,
        "configurable": true
    }
});

Object.defineProperties(MusicEvent, {
    "COMPLETE": {
        "value": "MusicEvent.complete"
    }
});

Object.defineProperties(MusicEvent.prototype, {
    "clone": {
        "value": function () {
            return new MusicEvent(this.type, this.bubbles, this.cancelable);
        }
    },
    "toString": {
        "value": function () {
            return this.fromatToString("MusicEvent", "type", "bubbles", "cancelable");
        }
    }
});


end();
