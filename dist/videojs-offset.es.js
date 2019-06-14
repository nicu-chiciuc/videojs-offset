/*! @name videojs-offset @version 2.1.2 @license MIT */
import videojs from 'video.js';

var version = "2.1.2";

var defaults = {}; // Cross-compatibility for Video.js 5 and 6.

var registerPlugin = videojs.registerPlugin || videojs.plugin; // const dom = videojs.dom || videojs;

/**
 * Checks whether the clip should be ended.
 *
 * @function onPlayerTimeUpdate
 *
 */

var onPlayerTimeUpdate = function onPlayerTimeUpdate() {
  var _this = this;

  var curr = this.currentTime();

  if (curr < 0) {
    this.currentTime(0);
    this.play();
  }

  if (this._offsetEnd > 0 && curr > this._offsetEnd - this._offsetStart) {
    this.pause();
    this.trigger('ended'); // Re-bind to timeupdate next time the video plays

    this.one('play', function () {
      _this.on('timeupdate', onPlayerTimeUpdate);
    });

    if (!this._restartBeginning) {
      this.currentTime(this._offsetEnd - this._offsetStart);
    } else {
      this.trigger('loadstart');
      this.currentTime(0);
    }
  }
};
/**
 * Function to invoke when the player is ready.
 *
 * This is a great place for your plugin to initialize itself. When this
 * function is called, the player will have its DOM and child components
 * in place.
 *
 * @function onPlayerReady
 * @param    {Player} player
 *           A Video.js player.
 * @param    {Object} [options={}]
 *           An object of options left to the plugin author to define.
 */


var onPlayerReady = function onPlayerReady(player, options) {
  // Bind this handler right away after player ready,
  // when live videos are in autoplay videojs 5
  // does not trigger play event at the beginning
  player.on('timeupdate', onPlayerTimeUpdate);
};
/**
 * A video.js plugin.
 *
 * In the plugin function, the value of `this` is a video.js `Player`
 * instance. You cannot rely on the player being in a "ready" state here,
 * depending on how the plugin is invoked. This may or may not be important
 * to you; if not, remove the wait for "ready"!
 *
 * @function offset
 * @param    {Object} [options={}]
 *           An object of options left to the plugin author to define.
 */


var offset = function offset(options) {
  var _this2 = this;

  options = options || {};
  var Player = this.constructor;
  this._offsetStart = parseFloat(options.start || '0');
  this._offsetEnd = parseFloat(options.end || '0');
  this._restartBeginning = options.restart_beginning || false;

  this.duration = function () {
    if (this._offsetEnd !== undefined && this._offsetStart !== undefined) {
      if (this._offsetEnd > 0) {
        return this._offsetEnd - this._offsetStart;
      }

      return Player.prototype.duration.apply(this, arguments) - this._offsetStart;
    }

    return Player.prototype.duration.apply(this, arguments);
  };

  this.currentTime = function (seconds) {
    if (seconds !== undefined) {
      return Player.prototype.currentTime.call(this, seconds + this._offsetStart) - this._offsetStart;
    }

    return Player.prototype.currentTime.apply(this, arguments) - this._offsetStart;
  };

  this.currentTime = function (seconds) {
    if (seconds !== undefined) {
      if (this._offsetStart !== undefined) {
        return Player.prototype.currentTime.call(this, seconds + this._offsetStart);
      }

      return Player.prototype.currentTime.call(this, seconds);
    }

    if (this._offsetStart !== undefined) {
      return Player.prototype.currentTime.apply(this) - this._offsetStart;
    }

    return Player.prototype.currentTime.apply(this);
  };

  this.remainingTime = function () {
    return this.duration() - this.currentTime();
  };

  this.startOffset = function () {
    return this._offsetStart;
  };

  this.endOffset = function () {
    if (this._offsetEnd > 0) {
      return this._offsetEnd;
    }

    return this.duration();
  };

  this.buffered = function () {
    var buff = Player.prototype.buffered.call(this);
    var ranges = [];

    for (var i = 0; i < buff.length; i++) {
      ranges[i] = [Math.max(0, buff.start(i) - this._offsetStart), Math.min(Math.max(0, buff.end(i) - this._offsetStart), this.duration())];
    }

    return videojs.createTimeRanges(ranges);
  };

  this.disposeOffset = function () {
    _this2.off('timeupdate', onPlayerTimeUpdate);
  };

  this.ready(function () {
    onPlayerReady(_this2, videojs.mergeOptions(defaults, options));
  });
  this.one('dispose', this.disposeOffset);
};

console.log('trying to register the offset plugin'); // Register the plugin with video.js.

registerPlugin('offset', offset); // Include the version number.

offset.VERSION = version;

export default offset;
