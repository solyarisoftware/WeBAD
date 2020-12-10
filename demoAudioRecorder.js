/* eslint-env browser */
var recorder = null

let audioPlay = true

// This example uses MediaRecorder to record from a live audio stream,
// and uses the resulting blob as a source for an audio element.
//
// The relevant functions in use are:
//
// navigator.mediaDevices.getUserMedia -> to get audio stream from microphone
// MediaRecorder (constructor) -> create MediaRecorder instance for a stream
// MediaRecorder.ondataavailable -> event to listen to when the recording is ready
// MediaRecorder.start -> start recording
// MediaRecorder.stop -> stop recording (this will generate a blob of data)
// URL.createObjectURL -> to create a URL from a blob, which we can use as audio src


function audioRecorder(stream) {

  recorder = new MediaRecorder(stream)

  // listen to dataavailable, 
  // which gets triggered whenever we have
  // an audio blob available
  recorder.addEventListener('dataavailable', onRecordingReady)

}


function onRecordingReady(e) {

  // audio play just if recording is not aborted
  if (audioPlay) {

    const audio = document.getElementById('audio')
    // e.data contains a blob representing the recording
    audio.src = URL.createObjectURL(e.data)
    audio.play()
  
  }  

}


function startRecording() {
  recorder.start()
}

/**
 * restartRecording
 *
 * abort and start
 */ 
function restartRecording() {
  recorder.stop()
  audioPlay = false
  recorder.start()
}

function stopRecording() {
  // Stopping the recorder will eventually trigger the `dataavailable` event and we can complete the recording process
  recorder.stop()
  audioPlay = true
}


function abortRecording() {
  // Stopping the recorder will eventually trigger the `dataavailable` event and we can complete the recording process
  recorder.stop()
  audioPlay = false
}

