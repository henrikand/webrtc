/*
 *  Copyright (c) 2014 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

/* More information about these options at jshint.com/docs/options */
/* jshint browser: true, camelcase: true, curly: true, devel: true, eqeqeq: true, forin: false, globalstrict: true, quotmark: single, undef: true, unused: strict */


// https://gist.github.com/stephband/f032a69c54f3a5d0ebf9
// https://github.com/mdn/audio-buffer

/*
For the latency test, if you pass the following constraints to getUserMedia,
you will get back latency around 20ms for a loopback call:

var constraints = { audio: { optional: [{ echoCancellation: false }] } };

getUserMedia(constraints, gotStreamCb, gotStreamFailedCb);
*/

'use strict';

addTestSuite("AudioLoopbackTest", loopbackTest);

function loopbackTest() {
  doGetUserMedia({audio:true}, function(stream) {
    reportSuccess("getUserMedia succeeded.");
    // Create a new MediaStreamAudioSourceNode object, given a media stream.
    var sourceNode = audioContext.createMediaStreamSource(stream);

    checkLoopback(sourceNode);
  });
}

function checkLoopback(source) {
  trace("Speak into microphone and verify audio in loopback...");
  source.connect(audioContext.destination);
  setTimeout(function(){
    source.disconnect(audioContext.destination);
    reportSuccess("Loopback audio succeeded.");
    checkLatency(source);
  }, 1000);
}

function checkLatency(source) {
  var processFunc = function(event) {
    var inputBuffer = event.inputBuffer;
    var outputBuffer = event.outputBuffer;
    var inputData = inputBuffer.getChannelData(0);
    var outputData = outputBuffer.getChannelData(0);
    var index = 0;

    ++frame;

    if (frame > 12) {
      source.disconnect(scriptNode);
      scriptNode.disconnect(audioContext.destination);
      checkLatencyFinish(outputTimes, inputTimes);
    }

    var len = inputBuffer.length;

    if (frame % 3 - 1 === 0) {
      outputData[0] = 1;
      outputData[1] = 1;
      index = len * frame + len;
      trace("adding pulse at " + index);
      outputTimes.push(index);
    } else {
      outputData[0] = 0;
      outputData[1] = 0;
    }

    var n = -1;
    if (frame > 0) {
      while (++n < len) {
        if (Math.abs(inputData[n]) > threshold) {
          index = len * frame + n - len;
          trace("pulse detected at " + index);
          inputTimes.push(index);
          return;
        }
      }
    }

  };

  var threshold = 0.125;  // -18 dBFS
  var bufferLength = 16384;

  var scriptNode = audioContext.createScriptProcessor(bufferLength, 1, 1);
  var frame = -1;
  var inputTimes = [];
  var outputTimes = [];

  scriptNode.onaudioprocess = processFunc;
  source.connect(scriptNode);
  scriptNode.connect(audioContext.destination);

  // reportSuccess("Media stream source exists using a sample rate of " +
  //  audioContext.sampleRate);
  // return true;
}

function checkLatencyFinish(outputTimes, inputTimes) {
  console.log(outputTimes, inputTimes);

  if (inputTimes.length == 0) {
    reportError("Latency measurement failed: no signal is detected.");
  }

  if (outputTimes.length < inputTimes.length) {
    reportError("Latency measurement failed: too many signals detected.");
  }

  if (outputTimes.length > inputTimes.length) {
    reportError("Latency measurement failed: too few signals detected.");
  }

  // reportSuccess("Latency measurement succeeded.");
  testSuiteFinished();
}


