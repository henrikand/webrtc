/*
 *  Copyright (c) 2014 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

/* More information about these options at jshint.com/docs/options */
/* jshint browser: true, camelcase: true, curly: true, devel: true, eqeqeq: true, forin: false, globalstrict: true, quotmark: single, undef: true, unused: strict */

// https://github.com/mdn/audio-buffer

'use strict';

addTestSuite("AudioLoopbackTest", loopbackTest);

function loopbackTest() {
  var constraints = { audio: { optional: [{ echoCancellation: false }] } };
  // var constraints = { audio: true };
  doGetUserMedia(constraints, function(stream) {
    reportSuccess("getUserMedia succeeded.");
    // Create a new MediaStreamAudioSourceNode object, given a media stream.
    var sourceNode = audioContext.createMediaStreamSource(stream);

    checkLoopback(sourceNode);
  });
}

function checkLoopback(source) {
  reportSuccess("Loopback audio succeeded.");
  checkLatency(source);
  /*
  trace("Speak into microphone and verify audio in loopback...");
  source.connect(audioContext.destination);
  setTimeout(function(){
    source.disconnect(audioContext.destination);
    reportSuccess("Loopback audio succeeded.");
    checkLatency(source);
  }, 1000); */
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
        var absLevel = Math.abs(inputData[n]);
        if (absLevel > threshold) {
          index = len * frame + n - len;
          trace("pulse detected at " + index + " (" + absLevel + ')');
          inputTimes.push(index);
          return;
        }
      }
    }

  };

  // var threshold = 0.125;  // -18 dBFS
  var threshold = 0.1  ;  // -20 dBFS
  // var threshold = 0.05  ;  // -26 dBFS
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

  if (inputTimes.length != outputTimes.length) {
    trace("Please try to increase the volume and try again.");
    return reportFatal(
      "Latency measurement failed: non-perfect signal detection.");
  }

  var latencyTimes = [];
  for (var i in inputTimes) {
    latencyTimes.push(inputTimes[i] - outputTimes[i]);
  }
  console.log(latencyTimes);

  var min = Math.min.apply(Math, latencyTimes);
  var max = Math.max.apply(Math, latencyTimes);
  var range = max - min;
  console.log(min, max);
  if (range > 128) {
    trace("Latency range=" + range);
    return reportFatal(
      "Latency variation is too large. Please repeat the test.");
  }

  var avg = 0;
  for (var j in latencyTimes) {
    avg += latencyTimes[j];
  }
  avg = avg / latencyTimes.length;
  trace("Average latency in samples=" + avg);
  trace("Average latency in milliseconds="
    + Math.round(avg / audioContext.sampleRate * 1000));


  // reportSuccess("Latency measurement succeeded.");
  testSuiteFinished();
}


