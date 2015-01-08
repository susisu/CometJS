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
            this._music.addEventListener("complete", this._onComplete);

            this._ticker.start();
            this._ticker.addEventListener(comet.ticker.TickerEvent.TICK, this._onTimer);
        }
    },
    "stop": {
        "value": function () {
            this._music.stop();
            this._music.removeEventListener("complete", this._onComplete);

            this._ticker.reset();
            this._ticker.removeEventListener(comet.ticker.TickerEvent.TICK, this._onTimer);
        }
    }
});

function onTick(event) {
    while (this._music.position / 1000 * this._fps > this._currentFrame) {
        this._currentFrame++;
        this.dispatchEvent(new ev.Event("tick"));
    }
}

function onComplete(event) {
    this.stop();
    this.dispatchEvent(new ev.Event("complete"));
}


end();
