/*
 * CometJS / music.js
 * copyright (c) 2014 Susisu
 */

 "use strict";

function end () {
    module.exports = Object.freeze({
        "Metronome": Metronome
    });
}

var ev = require("electronvolt");
var comet = {
    "ticker": require("./ticker.js")
};


// TODO: define music interface
function Metronome(Ticker, music, fps) {
    this._ticker       = new Ticker(1000 / 60); // 1/60 sec (if fps is larger than 60, change this)
    this._music        = music;
    this._fps          = fps;
    this._currentFrame = 0;
    this._onTick       = onTick.bind(this);
    this._onComplete   = onComplete.bind(this);
}

Object.defineProperties(Metronome.prototype, {
    "play": {
        "value": function (startFrame) {
            this._currentFrame = startFrame;

            this._music.play(startFrame / this._fps * 1000);
            this._music.addEventListener(MusicEvent.COMPLETE, this._onComplete);

            this._ticker.start();
            this._ticker.addEventListener(comet.ticker.TickerEvent.TICK, this._onTimer);
        }
    },
    "stop": {
        "value": function () {
            this._music.stop();
            this._music.removeEventListener(MusicEvent.COMPLETE, this._onComplete);

            this._ticker.reset();
            this._ticker.removeEventListener(comet.ticker.TickerEvent.TICK, this._onTimer);
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
        "value": "complete"
    },
    "TICK": {
        "value": "tick"
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
        "value": "complete"
    }
})


end();
