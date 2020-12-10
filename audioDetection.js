/* eslint-env browser */

/**
 *
 * @see
 * https://stackoverflow.com/questions/9018771/how-to-best-determine-volume-of-a-signal
 * https://dsp.stackexchange.com/questions/46147/how-to-get-the-volume-level-from-pcm-audio-data
 *
 */ 


/**
 * module variables
 */ 
let status

let silenceItems = 0
let signalItems = 0
let speechStarted = false

let recordstartTime 
let prerecordingItems = 0

let speechVolumesList = [] 

/**
 * functions
 */

/*
 * average
 *
 * calculate the average value of an array of numbers
 *
 */ 
const average = (array) => array.reduce((a, b) => a + b) / array.length

const averageSignal = () => average(speechVolumesList).toFixed(4)

const maxSilenceItems = Math.round(MAX_INTERSPEECH_SILENCE_MSECS / SAMPLE_POLLING_MSECS)

const dispatchEvent = (eventName, eventData) => document.dispatchEvent(new CustomEvent( eventName, eventData ))

/**
 * mute
 *
 * Emits 2 custom events:
 *
 *  AUDIO SAMPLING:
 *    'mute'    -> audio volume is almost zero, the mic is off.
 *
 *  MICROPHONE:
 *    'mutedmic' -> microphone is MUTED (passing from ON to OFF)
 */
function mute(timestamp, duration) {

  const eventData = { 
    detail: { 
      status: 'mute',
      volume: meter.volume, 
      timestamp,
      duration
    } 
  }
  
  dispatchEvent( 'mute', eventData )
  
  // mic is muted (is closed)
  // trigger event on transition
  if (status !== 'mute') {
    dispatchEvent( 'mutedmic', eventData )
    status = 'mute'
  }  

}  


/**
 * signal
 *
 * Emits 3 custom events:
 *
 *  AUDIO SAMPLING:
 *    'signal'  -> audio volume is high, so probably user is speaking.
 *
 *  MICROPHONE:
 *    'unmutedmic'  -> microphone is UNMUTED (passing from OFF to ON)
 *
 *  RECORDING:
 *    'recordstart' -> speech recording START
 *
 */ 
function signal(timestamp, duration) {

  silenceItems = 0
  
  const eventData = { 
    detail: { 
      status: 'signal',
      volume: meter.volume, 
      timestamp,
      duration,
      items: ++ signalItems
    } 
  }
 
  if (! speechStarted) {

    dispatchEvent( 'recordstart', eventData )

    recordstartTime = timestamp
    speechStarted = true
    speechVolumesList = []
  }  

  speechVolumesList.push(meter.volume)

  dispatchEvent( 'signal', eventData )

  // mic is unmuted (is open)
  // trigger event on transition
  if (status === 'mute') {
    dispatchEvent( 'unmutedmic', eventData )
    status = 'signal'
  }  

}  

/**
 * silence
 *
 * Emits 3 custom events:
 *
 *  AUDIO SAMPLING:
 *    'silence' -> audio volume is pretty low, the mic is on but there is not speech.
 *
 *  MICROPHONE:
 *    'unmutedmic'  -> microphone is UNMUTED (passing from OFF to ON)
 *
 *  RECORDING:
 *    'recordstop'  -> speech recording STOP (success, recording seems a valid speech)
 *    'recordabort' -> speech recording ABORTED (because level is too low or audio duration length too short)
 *
 */ 
function silence(timestamp, duration) {

  signalItems = 0

  const eventData = { 
    detail: { 
      status: 'silence',
      volume: meter.volume, 
      timestamp,
      duration,
      items: ++ silenceItems
    } 
  }
 
  dispatchEvent( 'silence', eventData )

  // mic is unmuted (goes ON)
  // trigger event on transition
  if (status === 'mute') {
    dispatchEvent( 'unmutedmic', eventData )
    status = 'silence'
  }  

  //
  // after a MAX_INTERSPEECH_SILENCE_MSECS 
  // a virdict event is generated:
  // recordabort, if audio chunck is to brief or at too low volume 
  // recordstop, if audio chunk appears to be a valid speech
  //
  if ( speechStarted && (silenceItems === maxSilenceItems) ) {

    const signalDuration = duration - MAX_INTERSPEECH_SILENCE_MSECS
    const averageSignalValue = averageSignal()

    // record abort 
    // signal duration too short
    if ( signalDuration < MIN_SIGNAL_DURATION ) {

      eventData.detail.abort = `signal duration (${signalDuration}) < MIN_SIGNAL_DURATION (${MIN_SIGNAL_DURATION})`
      dispatchEvent( 'recordabort', eventData )
    }  

    // record abort
    // signal level too low
    else if (averageSignalValue < MIN_AVERAGE_SIGNAL_VOLUME) {

      eventData.detail.abort = `signal average volume (${averageSignalValue}) < MIN_AVERAGE_SIGNAL_VOLUME (${MIN_AVERAGE_SIGNAL_VOLUME})`
      dispatchEvent( 'recordabort', eventData )
    }  

    // record stop
    // audio chunk appears to be a valid speech
    else {

      dispatchEvent( 'recordstop', eventData )
    }  

    speechStarted = false
  }  

}  

/**
 
    volume level
0.0 .---->-.----->--.-------->--.-------->--.------> 1.0
    ^      ^        ^           ^           ^
    |      |        |           |           |
    mute   unmute   silence     speaking    clipping
               
*/ 

function sampleThresholdsDecision(muteVolume, speakingMinVolume) {

  const timestamp = Date.now()
  const duration = timestamp - recordstartTime

  //
  // MUTE
  // mic is OFF/mute (volume is ~0)
  //
  if (meter.volume < muteVolume )

    mute(timestamp, duration) 

  //
  // SIGNAL
  // audio detection, maybe it's SPEECH
  //
  else if (meter.volume > speakingMinVolume )

    signal(timestamp, duration)

  //
  // SILENCE
  // mic is ON. Audio level is low (background noise)
  //
  else //(meter.volume < config.silenceVolume )

    silence(timestamp, duration)

}


/**
 * prerecording
 *
 * Emits the event:
 *
 *  RECORDING:
 *    'prerecordstart' -> speech prerecording START
 *
 * Every prerecordstartMsecs milliseconds, 
 * in SYNC with the main sampling (every timeoutMsecs milliseconds)
 *
 * @param {Number} prerecordstartMsecs
 * @param {Number} timeoutMsecs
 *
 */ 
function prerecording( prerecordstartMsecs, timeoutMsecs ) {
  
  const timestamp = Date.now()

  const eventData = { 
    detail: { 
      status: 'prerecordstart',
      volume: meter.volume, 
      timestamp,
      //duration,
      items: ++ prerecordingItems
    } 
  }

  // emit event 'prerecordstart' every prerecordstartMsecs.
  // considering that prerecordstartMsecs is a multimple of timeoutMsecs   
  if ( (prerecordingItems * timeoutMsecs) >= prerecordstartMsecs) {
    
    dispatchEvent( 'prerecordstart', eventData )

    prerecordingItems = 0
  }  

}  


/**
 * audio speech detection
 *
 * emit these DOM custom events: 
 *
 *  AUDIO SAMPLING:
 *    'signal'  -> audio volume is high, so probably user is speaking.
 *    'silence' -> audio volume is pretty low, the mic is on but there is not speech.
 *    'mute'    -> audio volume is almost zero, the mic is off.
 *
 *  MICROPHONE:
 *    'unmutedmic'  -> microphone is UNMUTED (passing from OFF to ON)
 *    'mutedmic' -> microphone is MUTED (passing from ON to OFF)
 *
 *  RECORDING:
 *    'recordstart' -> speech recording START
 *    'recordstop'  -> speech recording STOP (success, recording seems a valid speech)
 *    'recordabort' -> speech recording ABORTED (because level is too low or audio duration length too short)
 *
 *
 * @param {Object} config 
 *
 * @see https://javascript.info/dispatch-events
 *
 */

function audioDetection(config=DEFAULT_PARAMETERS_CONFIGURATION) {

  setTimeout( 
    () => {

      prerecording( config.prerecordstartMsecs, config.timeoutMsecs )

      sampleThresholdsDecision(config.muteVolume, config.speakingMinVolume)

      // recursively call this function
      audioDetection()

    }, 
    config.timeoutMsecs 
  )

}


//export { audioDetection }

