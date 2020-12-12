
var mediaStreamSource = null


function audioStream(stream) {
  // Create an AudioNode from the stream.
  mediaStreamSource = audioContext.createMediaStreamSource(stream);

  // Create a new volume meter and connect it.
  meter = createAudioMeter(audioContext);
  mediaStreamSource.connect(meter);

  // kick off the visual updating
  //drawLoop();

  audioDetection(DEFAULT_PARAMETERS_CONFIGURATION)

  audioRecorder(stream)
}

