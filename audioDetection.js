/* eslint-env browser */

/**
 *
 * @see
 * https://stackoverflow.com/questions/9018771/how-to-best-determine-volume-of-a-signal
 * https://dsp.stackexchange.com/questions/46147/how-to-get-the-volume-level-from-pcm-audio-data
 *
 */ 


/**
 * volumeState
 *
 * volume range state of a single sample. Possible values:
 *
 *   'mute'
 *   'silence'
 *   'signal'
 *   'clipping' TODO
 *
 */ 
let volumeState = 'mute'

let speechStarted = false

let silenceItems = 0
let signalItems = 0

let speechstartTime 
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
      event: 'mute',
      volume: meter.volume, 
      timestamp,
      duration
    } 
  }
  
  dispatchEvent( 'mute', eventData )
  
  // mic is muted (is closed)
  // trigger event on transition
  if (volumeState !== 'mute') {
    dispatchEvent( 'mutedmic', eventData )
    volumeState = 'mute'
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
 *    'speechstart' -> speech START
 *
 */ 
function signal(timestamp, duration) {

  silenceItems = 0
  
  const eventData = { 
    detail: { 
      event: 'signal',
      volume: meter.volume, 
      timestamp,
      duration,
      items: ++ signalItems
    } 
  }
 
  if (! speechStarted) {

    dispatchEvent( 'speechstart', eventData )

    speechstartTime = timestamp
    speechStarted = true
    speechVolumesList = []
  }  

  speechVolumesList.push(meter.volume)

  dispatchEvent( 'signal', eventData )

  // mic is unmuted (is open)
  // trigger event on transition
  if (volumeState === 'mute') {
    dispatchEvent( 'unmutedmic', eventData )
    volumeState = 'signal'
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
 *    'speechstop'  -> speech recording STOP (success, recording seems a valid speech)
 *    'speechabort' -> speech recording ABORTED (because level is too low or audio duration length too short)
 *
 */ 
function silence(timestamp, duration) {

  signalItems = 0

  const eventData = { 
    detail: { 
      event: 'silence',
      volume: meter.volume, 
      timestamp,
      duration,
      items: ++ silenceItems
    } 
  }
 
  dispatchEvent( 'silence', eventData )

  // mic is unmuted (goes ON)
  // trigger event on transition
  if (volumeState === 'mute') {
    dispatchEvent( 'unmutedmic', eventData )
    volumeState = 'silence'
  }  

  //
  // after a MAX_INTERSPEECH_SILENCE_MSECS 
  // a virdict event is generated:
  //   speechabort if audio chunck is to brief or at too low volume 
  //   speechstop  if audio chunk appears to be a valid speech
  //
  if ( speechStarted && (silenceItems === maxSilenceItems) ) {

    const signalDuration = duration - MAX_INTERSPEECH_SILENCE_MSECS
    const averageSignalValue = averageSignal()

    // speech abort 
    // signal duration too short
    if ( signalDuration < MIN_SIGNAL_DURATION ) {

      eventData.detail.abort = `signal duration (${signalDuration}) < MIN_SIGNAL_DURATION (${MIN_SIGNAL_DURATION})`
      dispatchEvent( 'speechabort', eventData )
    }  

    // speech abort
    // signal level too low
    else if (averageSignalValue < MIN_AVERAGE_SIGNAL_VOLUME) {

      eventData.detail.abort = `signal average volume (${averageSignalValue}) < MIN_AVERAGE_SIGNAL_VOLUME (${MIN_AVERAGE_SIGNAL_VOLUME})`
      dispatchEvent( 'speechabort', eventData )
    }  

    // speech stop
    // audio chunk appears to be a valid speech
    else {

      dispatchEvent( 'speechstop', eventData )
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
  const duration = timestamp - speechstartTime

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
 *    'prespeechstart' -> speech prerecording START
 *
 * Every prespeechstartMsecs milliseconds, 
 * in SYNC with the main sampling (every timeoutMsecs milliseconds)
 *
 * @param {Number} prespeechstartMsecs
 * @param {Number} timeoutMsecs
 *
 */ 
function prerecording( prespeechstartMsecs, timeoutMsecs ) {
  
  ++ prerecordingItems

  const eventData = { 
    detail: { 
      //event: 'prespeechstart',
      volume: meter.volume, 
      timestamp: Date.now(),
      items: prerecordingItems
    } 
  }

  // emit event 'prespeechstart' every prespeechstartMsecs.
  // considering that prespeechstartMsecs is a multimple of timeoutMsecs   
  if ( (prerecordingItems * timeoutMsecs) >= prespeechstartMsecs) {
    
    // emit the event if speech is not started   
    if ( !speechStarted )
      dispatchEvent( 'prespeechstart', eventData )

    prerecordingItems = 0
  }  

}  


/**
 * audio speech detection
 *
 * emit these DOM custom events: 
 *
 *  AUDIO SAMPLING:
 *    'clipping' -> TODO, audio volume is clipping (~1), 
 *                  probably user is speaking, but volume produces distorsion
 *    'signal'   -> audio volume is high, so probably user is speaking.
 *    'silence'  -> audio volume is pretty low, the mic is on but there is not speech.
 *    'mute'     -> audio volume is almost zero, the mic is off.
 *
 *  MICROPHONE:
 *    'unmutedmic'  -> microphone is UNMUTED (passing from OFF to ON)
 *    'mutedmic'    -> microphone is MUTED (passing from ON to OFF)
 *
 *  RECORDING:
 *    'prespeechstart' -> speech prerecording START
 *    'speechstart'    -> speech START
 *    'speechstop'     -> speech STOP (success, recording seems a valid speech)
 *    'speechabort'    -> speech ABORTED (because level is too low or audio duration length too short)
 *
 *
 * @param {Object} config 
 * @see DEFAULT_PARAMETERS_CONFIGURATION object in audioDetectionConfig.js 
 *
 * @see https://javascript.info/dispatch-events
 *
 */

function audioDetection(config) {

  setTimeout( 
    () => {

      prerecording( config.prespeechstartMsecs, config.timeoutMsecs )

      // to avoid feedback, recording could be suspended 
      // when the system play audio with a loudspeakers
      if (config.recordingEnabled) {

        sampleThresholdsDecision(config.muteVolume, config.speakingMinVolume)
      }  

      // recursively call this function
      audioDetection(config)

    }, 
    config.timeoutMsecs 
  )

}


//export { audioDetection }

