/**
 * audioDetectionConfig.js
 *
 * configuration parameters
 */

/*
 
SAMPLE_POLLING_MSECS

polling time clock in milliseconds. Is the sampling rate to run speech detection calculations.

          █                   
      █   █   █               
      █   █   █   █         
      █   █   █   █   █        
  █   █   █   █   █   █   █    
  █   █   █   █   █   █   █   █    
  █   █   █   █   █   █   █   █   █    
  █   █   █   █   █   █   █   █   █   █   █ 
  █   █   █   █   █   █   █   █   █   █   █   █
  <--><--><--><--><--><--><--><--><--><--><--><-->                   
  ^   ^   ^   ^   ^   ^   ^   ^   ^   ^   ^   ^
  |   |   |   |   |   |   |   |   |   |   |   |

*/
const SAMPLE_POLLING_MSECS = 50

/*
 
MAX_INTERSPEECH_SILENCE_MSECS

elapsed time in milliseconds of silence (pause) between continuous blocks of signal.
This is to decide when to stop recording of a speech made by multiple audio chunks separated by pauses.

That elapsed is used also to decide if a full speech is concluded, generating event 'stoprecording'.

      █  chunk 1                    █
    █ █ █       █             █     █ █ chunk 2      █
    █ █ █ █ █   █   █         █   █ █ █              █ chunk 3
    █ █ █ █ █ █ █ █ █       █ █   █ █ █              █ █   █
  █ █ █ █ █ █ █ █ █ █ █     █ █   █ █ █              █ █ █ █
  █ █ █ █ █ █ █ █ █ █ █     █ █ █ █ █ █ █            █ █ █ █ █ █
  █ █ █ █ █ █ █ █ █ █ █ █   █ █ █ █ █ █ █ █          █ █ █ █ █ █ █
  █ █ █ █ █ █ █ █ █ █ █ █   █ █ █ █ █ █ █ █          █ █ █ █ █ █ █ █
  █ █ █ █ █ █ █ █ █ █ █ █   █ █ █ █ █ █ █ █          █ █ █ █ █ █ █ █
                         <->               <-------->               <-------->
  ^                                         silence                   silence ^
  |                                            ^                         ^    |
  speechstart                                  |                         |    speechstop 
                                               |                         |
                                 MAX_INTERSPEECH_SILENCE_MSECS    POST_SPEECH_MSECS
*/                                                      
const MAX_INTERSPEECH_SILENCE_MSECS = 600
const POST_SPEECH_MSECS = MAX_INTERSPEECH_SILENCE_MSECS


/*
 
PRERECORDSTART_MSECS

elapsed time in milliseconds before the speechstart event.


              █   chunk 1                     █
            █ █ █       █             █     █ █              █
            █ █ █ █ █   █   █         █   █ █ █ chunk 2      █
            █ █ █ █ █ █ █ █ █       █ █   █ █ █              █ █   █ chunk 3
          █ █ █ █ █ █ █ █ █ █ █     █ █   █ █ █              █ █ █ █
          █ █ █ █ █ █ █ █ █ █ █     █ █ █ █ █ █ █            █ █ █ █ █ █
          █ █ █ █ █ █ █ █ █ █ █ █   █ █ █ █ █ █ █ █          █ █ █ █ █ █ █
          █ █ █ █ █ █ █ █ █ █ █ █   █ █ █ █ █ █ █ █          █ █ █ █ █ █ █ █
          █ █ █ █ █ █ █ █ █ █ █ █   █ █ █ █ █ █ █ █          █ █ █ █ █ █ █ █
<-------->                       <->               <-------->               <--------> 
^ silence ^                                                                           ^
|    ^    |                                                                           |
|    |    speechstart                                                        speechstop  
|    |
| PRERECORDSTART_MSECS             
|              
prerecordstart

*/                                                      
const PRERECORDSTART_MSECS = 600

/*
 
MIN_SIGNAL_DURATION 

minimum elapsed time in millisecond for an audio signal block.
In terms of speech, it corresponds to a letter spelling ('b'), 
a number splelling ('two'), a 'yes'/'no' speech.

It could be usefule to purge out background clicks/noises.
If a signal block chain sample length is less than that value, 
the event 'abortrecording' is generated.

      █                                
    █ █ █       █ chunk 1     █      
    █ █ █ █ █   █   █         █ chunk 2     █
    █ █ █ █ █ █ █ █ █       █ █           █ █
  █ █ █ █ █ █ █ █ █ █ █     █ █           █ █ chunk 3
  █ █ █ █ █ █ █ █ █ █ █     █ █ █       █ █ █
  █ █ █ █ █ █ █ █ █ █ █ █   █ █ █       █ █ █
  █ █ █ █ █ █ █ █ █ █ █ █   █ █ █       █ █ █
  █ █ █ █ █ █ █ █ █ █ █ █   █ █ █       █ █ █
                            <--->       <--->   
                              ^
                              |
                       MIN_SIGNAL_DURATION  
*/
const MIN_SIGNAL_DURATION = 400


/*
 
VOLUME_MUTE
VOLUME_SILENCE
VOLUME_SIGNAL

Volume Thresholds levels, for 

signal (speech)
silence (background noise)
mute (microphone off)

*/
const VOLUME_SIGNAL = 0.02
const VOLUME_SILENCE = 0.001
const VOLUME_MUTE = 0.0001

/*
 
MIN_AVERAGE_SIGNAL_VOLUME
Minimum volume vale (in average) of a signal block chain.
It is to calculate if a signal block contains speech or just noise.

If a signal block chain sample doesn't exceed that threshold value, 
the event 'abortrecording' is generated.

*/
const MIN_AVERAGE_SIGNAL_VOLUME = 0.04


const DEFAULT_PARAMETERS_CONFIGURATION = {

  timeoutMsecs: SAMPLE_POLLING_MSECS,
  
  prespeechstartMsecs: PRERECORDSTART_MSECS,
  
  speakingMinVolume: VOLUME_SIGNAL, 
  
  silenceVolume: VOLUME_SILENCE,
  
  muteVolume: VOLUME_MUTE,

  recordingEnabled: true

}

