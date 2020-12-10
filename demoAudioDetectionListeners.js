/* eslint-env browser */

const dB = (signal) => - Math.round( 20 * Math.log10( 1 / signal ) ) 

/**
 * speechDetectionListeners
 *
 */ 

function hystogramLine( value ) {

  const maxCharsperLine = 200
  const valueInChars = maxCharsperLine * value 
  const char = '█'

  return char.repeat(valueInChars) 

}  


function showConfiguration() {

  document.querySelector('#SAMPLE_POLLING_MSECS').textContent = SAMPLE_POLLING_MSECS
  document.querySelector('#MAX_INTERSPEECH_SILENCE_MSECS').textContent = MAX_INTERSPEECH_SILENCE_MSECS
  document.querySelector('#MIN_SIGNAL_DURATION').textContent = MIN_SIGNAL_DURATION
  document.querySelector('#VOLUME_SIGNAL').textContent = VOLUME_SIGNAL
  document.querySelector('#VOLUME_SILENCE').textContent = VOLUME_SILENCE
  document.querySelector('#VOLUME_MUTE').textContent = VOLUME_MUTE
  document.querySelector('#MIN_AVERAGE_SIGNAL_VOLUME').textContent = MIN_AVERAGE_SIGNAL_VOLUME

}  


//
// signal handler
//
document.addEventListener('signal', event => {

  const volume = event.detail.volume.toFixed(9)
  const timestamp = event.detail.timestamp
  const items = event.detail.items.toString().padEnd(3)
  const dBV = dB(event.detail.volume)

  const line = hystogramLine(volume)

  if (debuglog)
    console.log(`signal  ${timestamp} ${items} ${volume} ${dBV} ${line}`)

  document.querySelector('#audiostatuscell').style.background = 'green'
  document.querySelector('#audiostatuscell').style.color = 'black'
  document.querySelector('#audiostatus').style.background = 'green'
  document.querySelector('#audiostatus').textContent = 'signal'

  //const theDiv = document.getElementById('log')
  //const content = document.createTextNode(text)
  //theDiv.appendChild(content)

})

//
// silence handler
//
document.addEventListener('silence', event => {

  const volume = event.detail.volume.toFixed(9)
  const timestamp = event.detail.timestamp
  const items = event.detail.items.toString().padEnd(3)
  const dBV = dB(event.detail.volume)

  if (debuglog)
    console.log(`silence ${timestamp} ${items} ${volume} ${dBV}`)

  document.querySelector('#audiostatuscell').style.background = 'black'
  document.querySelector('#audiostatuscell').style.color = 'white'
  document.querySelector('#audiostatus').style.background = 'black'
  document.querySelector('#audiostatus').textContent = 'silence'

})

//
// mute handler
//
document.addEventListener('mute', event => {

  const volume = event.detail.volume.toFixed(9)
  const timestamp = event.detail.timestamp
  const dBV = dB(event.detail.volume)

  if (debuglog)
    console.log(`mute    ${timestamp} ${volume} ${dBV}`)

  document.querySelector('#audiostatus').textContent = 'mute'

})


//
// prespeechstart handler
//
document.addEventListener('prespeechstart', event => {

  if (debuglog) {
    
    //const volume = event.detail.volume.toFixed(9)
    const timestamp = event.detail.timestamp
    //const dBV = dB(event.detail.volume)

    //console.log(`%cPRE SPEECH START    ${timestamp} ${volume} ${dBV}`, 'color:yellow')
    console.log(`%cPRE SPEECH START   ${timestamp}`, 'color:blue')

  }  
  
  restartRecording()

})


//
// speechstart handler
//
document.addEventListener('speechstart', event => {

  if (debuglog) {
  
    //speechstartTime = event.detail.timestamp
    console.log('%cSPEECH START', 'color:greenyellow')
  }  

  document.querySelector('#recordingcell').style.background = 'green'
  document.querySelector('#recordingcell').style.color = 'white'
  document.querySelector('#recording').style.background = 'green'
  document.querySelector('#recording').style.color = 'white'
  document.querySelector('#recording').textContent = 'start'

  //startRecording()

})

//
// speechstop handler
//
document.addEventListener('speechstop', event => {

  const duration = event.detail.duration

  if (debuglog) {
    
    const averageSignalLevel = averageSignal()
    
    console.log('%cSPEECH STOP', 'color:lime')
    console.log(`Total Duration in msecs  : ${duration}`)
    console.log(`Signal Duration in msecs : ${duration - MAX_INTERSPEECH_SILENCE_MSECS }`)
    console.log(`Average Signal level     : ${averageSignalLevel}`)
    console.log(`Average Signal dB        : ${dB(averageSignalLevel)}`)
    console.log(' ')
  }  

  document.querySelector('#recordingcell').style.color = 'white'
  document.querySelector('#recordingcell').style.background = 'black'
  document.querySelector('#recording').style.color = 'white'
  document.querySelector('#recording').style.background = 'black'
  document.querySelector('#recording').textContent = `stop. len: ${duration} msecs`

  stopRecording()

})

//
// speechabort handler
//
document.addEventListener('speechabort', event => {

  const abort = event.detail.abort

  if (debuglog) {
    
    const duration = event.detail.duration
    const averageSignalLevel = averageSignal()
    
    console.log('%cSPEECH ABORT', 'color:red')
    console.log(`Abort reason             : ${abort}`)
    console.log(`Total Duration in msecs  : ${duration}`)
    console.log(`Signal Duration in msecs : ${duration - MAX_INTERSPEECH_SILENCE_MSECS }`)
    console.log(`Average Signal level     : ${averageSignalLevel}`)
    console.log(`Average Signal dB        : ${dB(averageSignalLevel)}`)
    console.log(' ')
  }  

  document.querySelector('#recordingcell').style.color = 'white'
  document.querySelector('#recordingcell').style.background = 'red'
  document.querySelector('#recording').style.color = 'white'
  document.querySelector('#recording').style.background = 'red'
  document.querySelector('#recording').textContent = `abort. ${abort}`

  abortRecording()

})

//
// mutedmic handler
//
document.addEventListener('mutedmic', event => {

  document.querySelector('#microphonestatus').textContent = 'muted (off)'
  document.querySelector('#microphonestatus').style.background = 'red'
  document.querySelector('#microphonestatuscell').style.background = 'red'

  console.log('%cMICROPHONE MUTED', 'color:red')
  console.log(' ')

})

//
// unmutedmic handler
//
document.addEventListener('unmutedmic', event => {

  document.querySelector('#microphonestatus').textContent = 'unmuted (on)'
  document.querySelector('#microphonestatus').style.background = 'green'
  document.querySelector('#microphonestatuscell').style.background = 'green'

  console.log('%cMICROPHONE UNMUTED', 'color:green')
  console.log(' ')

})


showConfiguration()

