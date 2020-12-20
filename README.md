# WeBAD

**WeBAD** stay for **We**b **B**rowser **A**udio **D**etection/Speech Recording Events API.

Pronounce it *we-bad* or *web-ad*.

## How to detect speech, on the browser?

You want to use the browser as a voice interface "frontend". 
Specifically you want to detect the user speech messages.

WeBAD supply a solution for two specific scenarios:

1. **Hardware-button push-to-talk**
 
   The user press a real/hardware button, that mute/un-mute an external mic.
   You want to record the audio blob from when the user push the button, 
   to when the user release the button! 

2. **Continuous listening**

   The speech is detected in real-time, 
   just talking in front of the PC (or the tablet/ mobile phone / handset).
   Namely: **avoiding any wake-word detection algorithm**.
   You want to record the audio blob from when the user start to talk, 
   to when the user finish the spoken utterance! 

   | [![](https://img.youtube.com/vi/aY1eZLPZhDw/0.jpg)](https://www.youtube.com/watch?v=aY1eZLPZhDw&feature=youtu.be "continuous listening mode speech detection on a mobile phone, using WeBAD")|
   |:--:|
   | Instant gratification video demo: continuous listening mode using WeBAD |


## What's a speech message?

Consider user talking with the computer. I define *speech* an audio message 
(a binary Blob in some codec format) to be elaborated by some backend voicebot logic. 

In terms of syntactical analysis, for *speech* I mean the pronunciation of 
- A letter, a number, a monosyllable (the minimal pronounceable item), by example: *1*, *3*, *I*, *c*, *yes*, *hey*
- A single word. Examples: *Alexa*, *isn't*, *smart*, *CRSU123456K*, *ILM-67Z-5643*
- An entire utterance. Example: "*Hey Google, I'm in love with you*", "*Please computer, open your heart!*"

The pronunciation of an entire spoken sentence could be considered as 
a sequences of audio signal blocks, I call *chunks*, interspersed by pauses (silence).

Consider the sentence: 

```
I'm in love with you
```

It contains a sequence of:

- Signal chunks 

  In fact the sentence is composed by 5 words (sentences)
  ```
  I'm     in    love     with    you
  ___     __    ____     ____    ___ 
  ^       ^     ^        ^       ^
  signal chunks

  ```

- Inter-speech silences 

  There are 5 silence segments: 4 inter-word pauses.
  ```
  I'm     in    love     with    you
     _____  ____    _____    ____   
     ^      ^       ^        ^       
     silence chunks
  ```

So a speech could be considered as a sequence of one or more signal chunks 
separated by silence chunks. Please note that the complete speech includes also: 

- An initial silence (I call *prespeech-lag*). 
  That's because we need to preserve the envelope curve starting from silence, 
  to let a speech-to-text engine to transcript successfully the sentence.

- a final silence (I call *postspeech-lag*).
  That's a tricky configuration tuning we'll see. 
  The question is: after how many millisecond of pause after a sequence of words, 
  we consider terminated the spoken sentence? 

We will see that a speech message (made by WeBAD) always includes prespeech-lag and postspeech-lag.

```
     I'm     in    love     with    you
_____   _____  ____    _____    ____   _____
^                                      ^
prespeech-lag                          postspeech-lag
```


## Some different speech detection VUI approaches

Assuming that we want to use a web browser, let's see some possible scenarios:

- (1) Wake word detection

  Currently this is considered the common way to push speech messages on a voice interfaced system.
  Wake word detection, especially if you want to have your own custom word sequences, 
  need a specialized training of a neural net and a CPU-intensive run-time engine 
  that has to run on the browser. 

  > WeBAD just escapes from wake word approach. Some solutions in [references](#references)

- (2) Push-to-talk

  That's the traditional reliable way to generate audio messages 
  (see radio mobile/walkie-talkie). 
  The user push a button, start to talk, release the button when finished to talk.
  Note that push to talk could be implemented on the browser in two way:

  - (2.1) Software-button (web page *hotkey*) 

    That's the simplest approach on GUI interface. Consider a web browser, 
    on a mobile device you have a touch interface, 
    on a personal computer  you have a keyboard/mouse.
    So you can have an HTML button (hotkey) that, when pressed, triggers a recording. 
    Through a keyboard or a touch screen, 
    the user press a key or touch a (button on the) screen to talk.
    But that is not a touch-less / keyboard-less solution.

  - (2.2) **Hardware push-button**

    The user press a real/hardware push-button, that mute/un-mute an external mic.
    Here a simplified schematics about how the mic setup:

    - Normally-closed push-button 

      PTT push-button short-circuited to ground (default): exit signal is ~0

      ```
         .-----------+-----------. (+) 
         |           |           |
      .--+--.        +           .------>                   
      | mic |        |                    jack out male mono (mini jack 3.5mm)
      .--+--.        |           .------>        
         |           +           |
         .-----------+-----------. ground
                     ^
                     |
                     normally-closed PTT push-button 

      ```

    - Open (pressed) push-button 

      When the user want to talk, he push the PTT push-button.
      The exit signal become >> 0

      ```
         .-----------+-----------. (+) 
         |           |           |
      .--+--.        +           .------>                   
      | mic |          /                  jack out male mono (mini jack 3.5mm)
      .--+--.         /          .------>        
         |           +           |
         .-----------+-----------. ground
                     ^
                     |
                     Open PTT push-button
      ```

  - (2.3) **Hardware USB/Bluetooth foot-switch**

    That's a smart "hands-free" solution, maybe useful in industrial operations. 

    One ore more foot-switches act as HW hotkeys.
    An USBi (or Bluetooth) temporary foot-switch (e.g. I successfully experimented 
    [this](http://www.pcsensor.com/foot-switch/usb-metal-single-foot-pedal-switch-for-industrial-machinery-smart-control-factory-test.html)), 
    when pressed generates a `keydown` / `touchstart` HTML DOM event.
    When released the pedal generates a `keyup` / `touchend` HTML DOM event.

    This push-to-talk solution is very interesting also because the low CPU/power consumption.
    This case falls into the previous 2.1.
    BTW the pedal could be substituted by and hand-keyboard too.

- (3) **Continuous listening** (without wake-word detection)

  A better voice-interface user experience is maybe through a *continuous listening* mode, 
  where audio is detected in real-time, 
  just talking in front of the PC (or the tablet/ mobile phone / handset).
  Namely: avoiding any wake-word detection algorithm.

WeBAD focuses on the two last scenarios (2.2) and (3).


## Which are the possible applications?

- **Mobile device voice-interface client for operators that can't use the touch-screen**

  The target scenario is a situation where the user can't easily touch the screen of a mobile device.
  The voice interface is through an external micro equipped with a push-to talk button. 

- **Browser-based voice-interface client for a personal assistant**

  Continuous listening is, in my opinion, probably the more natural 
  voice-based interface for a conversational personal assistant.
  Just because it mimic a human-to-human turn-taking.

  It's applicable when the user is in front of a personal computer 
  (or a mobile phone) in a pretty quiet environment, 
  by example in a room apartment or a quite office, or inside a vehicle.


## WeBAD Event-bus API solution  

The technical solution here proposed is a javascript program running on the browser 
to get the audio volume of the microphone in real-time, 
using a Web Audio API script processor that calculate RMS volume. 

A cyclic task, running every N msecs, 
does some logic above the current volume RMS sample 
and generates these javascript events:

- AUDIO VOLUME EVENTS

  Low-level events for track the volume of the current audio sample:

  | event | description | 
  | :---: | ----------- |
  | `mute` | audio volume is almost zero, the mic is off |
  | `silence` | audio volume is pretty low, the mic is on but there is not speech |
  | `signal` | audio volume is high, so probably user is speaking |
  | `clipping` | audio volume is too high, clipping. **TODO** |

- MICROPHONE STATUS EVENTS

  Low-level events to track if micro is enabled (unmuted) or if it's disabled (volume is 0):

  | event | description | 
  | :---: | ----------- |
  | `unmutedmic`| microphone is unmuted (passing from OFF to ON)|
  | `mutedmic`| microphone is muted (passing from ON to OFF)|

- RECORDING EVENTS

  Events for recording audio/speech:

  | event | description | 
  | :---: | ----------- |
  | `prespeechstart`| speech START|
  | `speechstart`| speech of first signal chunk START|
  | `speechstop`| speech STOP (success, speech seems a valid speech)|
  | `speechabort`| speech ABORTED (because level is too low or audio duration length too short)|


### Signal level state tracking

The microphone volume is detected by WeBAD, 
that trigger events and maintains a current state, with this discrete values:

| signal level | description |
| :----------: | ----------- |
| `mute`       | The microphone is closed, or muted (volume is ~= 0). Via software, by an operating system driver setting. Via software, because the application set the mute state by example with a button on the GUI. Via hardware, with an external mic input grounded by a push-to-talk button |
| `unmute`     | The micro is open, or unmuted |
| `silence`    | The microphone is open. Volume is almost silence (less than silence_threshold_value), containing just background noise, not containing sufficient signal power that probabilistically correspond to speech |
| `signal`     | The signal level is pretty high, probabilistically corresponding to speech |
| `clipping`   | The signal level is too high (volume is ~= 1). **TODO** |

```
       volume
         ^
     1.0 +-----------------------------------------------------------------------
         |                                       █
         |               █                       █
clipping |               █                       █
         |               █                       █
  signal |           █ █ █                       █   █
    |    |         █ █ █ █ █   █             █   █ █ █                    █
    |    |         █ █ █ █ █   █             █   █ █ █                  █ █ █
  speech |         █ █ █ █ █ █ █             █   █ █ █                  █ █ █
    |    |       █ █ █ █ █ █ █ █ █           █   █ █ █              █   █ █ █ █
    |    |       █ █ █ █ █ █ █ █ █ █         █ █ █ █ █ █          █ █ █ █ █ █ █
  signal |       █ █ █ █ █ █ █ █ █ █ █       █ █ █ █ █ █          █ █ █ █ █ █ █  
 silence |   █   █ █ █ █ █ █ █ █ █ █ █ █     █ █ █ █ █ █ █      █ █ █ █ █ █ █ █ █
  unmute | █ █ █ █ █ █ █ █ █ █ █ █ █ █ █     █ █ █ █ █ █ █  █   █ █ █ █ █ █ █ █ █
mute 0.0 +------------------------------------------------------------------------>
                                                                         time (sec)
```

### All events and states

```
----------------------------------------------------------------------------------
                                                                                  ^
                                                                               clipping
                                        █                                         v    
----------------█-----------------------█----------------------------------------- 
                █                       █                                         ^ 
            █ █ █                       █   █                                     |
          █ █ █ █ █   █             █   █ █ █                    █                |
          █ █ █ █ █   █   █         █   █ █ █                  █ █ █              |
          █ █ █ █ █ █ █ █ █         █   █ █ █                  █ █ █              |
        █ █ █ █ █ █ █ █ █ █ █       █   █ █ █          █   █   █ █ █        signal/speech
        █ █ █ █ █ █ █ █ █ █ █       █ █ █ █ █ █        █ █ █   █ █ █              |
        █ █ █ █ █ █ █ █ █ █ █ █     █ █ █ █ █ █ █      █ █ █ █ █ █ █              |
        █ █ █ █ █ █ █ █ █ █ █ █     █ █ █ █ █ █ █      █ █ █ █ █ █ █ █            |
        █ █ █ █ █ █ █ █ █ █ █ █     █ █ █ █ █ █ █      █ █ █ █ █ █ █ █            |
        █ █ █ █ █ █ █ █ █ █ █ █     █ █ █ █ █ █ █      █ █ █ █ █ █ █ █            v
--------█-█-█-█-█-█-█-█-█-█-█-█-----█-█-█-█-█-█-█------█-█-█-█-█-█-█-█------------ 
    █   █ █ █ █ █ █ █ █ █ █ █ █     █ █ █ █ █ █ █      █ █ █ █ █ █ █ █        background
  █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █    █ █ █ █ █ █ █ █ █  █  █    noise
----------------------------------------------------------------------------------
^ ^     ^                      ^    ^            ^     ^                ^         ^ ^     
| |     |                      |    |            |     |                |         | |
| |     speechstart            |    signal       |     signal           |         | |
| |                            silence           silence                silence   | |
| |                                                                     lag       | |
| prespeechstart                                                         speechstop |
unmutemic                                                                     mutemic
```

## Recording modes

On the basis of the microphone / hardware configuration available,
there are some different possible ways to record speech:

- Using an external microphone, bound to a push-to-talk hardware push-button

  In this scenario, the continuous mode could be substituted by a push-to-talk experience,
  where user has to press a real push-button every time he want to submit a speech, 
  releasing the button when he explicitly want to terminate recording.
  To accomplish this case we use two different events:

  - `unmutedmic` start speech recording 
  - `mutedmic` stop speech recording. 

- Using the PC/handset internal microphone

  In this scenario, the goal is to get a speech from generated events:

  - `prespeechstart` start speech recording 
  - `speechstop` stop speech recording


### HW-button push-to-talk recording

Push to talk is simple. It's the user that decides when the speech begin
and when the speech end, just pressing and releasing the button!
 
- `unmutedmic` event starts recording 
- `mutedmic` event stop recording
 
```
            █ chunk 1
          █ █
        █ █ █                           
      █ █ █ █ █   █                   chunk 2       █
      █ █ █ █ █   █ █        █       █              █      chunk 3
      █ █ █ █ █ █ █ █        █ █   █ █ █            █ █   █
    █ █ █ █ █ █ █ █ █ █ █    █ █ █ █ █ █ █          █ █ █ █ █ █ █
^                                                                   ^   
|                                                                   |
unmutemic                                                     mutemic

<-------------------- speech recording message --------------------->
```

```javascript
document.addEventListener('umutedmic', event => {
  // start audio recording 
})

document.addEventListener('mutedmic', event => {
  // stop recording 
  // process the speech
})
```

### Continuous-listening recording

The continuous listening mode is challenging. A speech is usually determined 
by a sequence of signal chunks (letter/words/sentences) interlaced by pauses (silence).

prespeech-lag -> signal -> pause -> signal -> pause -> ... -> signal -> postspeech-lag

In this scenario:

- `prespeechstart` event is generated some milliseconds before the first signal chunk start
- `speechstart` event is generated when a first speech chunk start 
- `speechstop` event is generated when a successive speech is followed by a pause long *postspeech-lag* msecs
- `speechabort` event is generated when an initial speech chunk has too low volume or is too short.

```
                 █ chunk 1
               █ █
             █ █ █                           
           █ █ █ █ █   █                   chunk 2       █
           █ █ █ █ █   █ █        █       █              █      chunk 3
           █ █ █ █ █ █ █ █        █ █   █ █ █            █ █   █
         █ █ █ █ █ █ █ █ █ █ █    █ █ █ █ █ █ █          █ █ █ █ █ █ █
^^                            ^                 ^                     ^        ^
||                            |                 |                     |        |
|silence                      silence           silence               silence  |
|                                                                              |
prespeechstart                                                        speechstop

<------------------------- speech recording message --------------------------->
```

```javascript
document.addEventListener('prespeechstart', event => { 
  // start audio recording 
})

document.addEventListener('speechstop', event => {
  // stop recording the speech
})

document.addEventListener('speechabort', event => {
  // audio recording is not a valid speech
  // restart recording the speech 
  // (stop and start again)
})
```

#### Preemptive-recording algorithm 

`speechstart` event could seem a good candidate to start speech recording, 
as soon a signal (exceeding of a threshold) is detected in the `audioDetection()` 
function loop, every e.g. 50 msecs.

But that's naive because in that way the recording start "abruptly", 
possibly truncating few milliseconds of the initial speech.
 
The adopted solution is, instead of recording from the `speechstart` event,
to foresee a cyclic emission of `prespeechstart` events (e.g. every 500 msecs). 

The recording repeatedly starts when `prespeechstart` event triggers.
The preemptive started recording continue until the real start of the first signal chunk (`speechstart`)
and continue until `speechstop` event that successfully end the speech recording.
Or the `speechabort` event terminates the recording, re-enabling the `prespeechstart` clock.

```
                █ chunk 1
              █ █
            █ █ █                           
          █ █ █ █ █   █                  chunk 2      █
          █ █ █ █ █   █ █       █       █             █      chunk 3
          █ █ █ █ █ █ █ █       █ █   █ █ █           █ █   █
        █ █ █ █ █ █ █ █ █ █ █   █ █ █ █ █ █ █         █ █ █ █ █ █ █
^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ sample clock
^       ^       ^       ^       ^       ^       ^       ^       ^       ^ prespeech clock     
|                                               |                       |
prespeechstart                                  deleted prespeechstart  speechstop
```

So we have to clock in-sync: 
- sample-clock: the base time clock (every `SAMPLE_POLLING_MSECS`)
- prespeech-clock: implemented as a multiple of sample-clock

The preemptive-recording solution is not perfect. 
Suppose that sample-clock is set to 50 msecs and prespeech-clock (prespeech-lag) is set to 500 msecs.
The initial chunk of a speech occurs in a random instant within the range 0-500 msecs.
The worst case is when `prespeechstart` `speechstart` overlap, as shown in figure here below:

```
        █ chunk 1
      █ █
    █ █ █                           
  █ █ █ █ █   █                               █
  █ █ █ █ █   █ █       █       █             █                
  █ █ █ █ █ █ █ █       █ █   █ █ █           █ █   █
█ █ █ █ █ █ █ █ █ █ █   █ █ █ █ █ █ █         █ █ █ █ █ █ █
^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ sample clock
^       ^       ^       ^       ^       ^       ^       ^       ^ prespeech clock     
|
speechstart
^
|
prespeechstart                                                                    
```

## Parameters tuning

The WeBAD algorithm is based upon a set of configuration parameters:

| parameter | description | default value |
| :-------: | ----------- | :-----------: |
| `SAMPLE_POLLING_MSECS` | polling time clock in milliseconds. Is the sampling rate to run speech detection calculations | 50 |
| `MAX_INTERSPEECH_SILENCE_MSECS` | elapsed time in milliseconds of silence (pause) between continuous blocks of signal | 600 |
| `POST_SPEECH_MSECS` | elapsed time in milliseconds of silence after the last speech chunk | 600 |
| `PRE_RECORDSTART_MSECS` | elapsed time in milliseconds before the `speechstart` event | 600 |
| `MIN_SIGNAL_DURATION` | minimum elapsed time in millisecond for an audio signal block | 400 |
| `MIN_AVERAGE_SIGNAL_VOLUME` | minimum volume vale (in average) of a signal block chain | 0.04 | 
| `VOLUME_SIGNAL` | Volume threshold level for signal | 0.02 |
| `VOLUME_MUTE` |  Volume threshold level for no-signal (~0) | 0.00001 |


## Architecture

```
     +---------------------+   +--------------------------+
     | browser             |   | external microphone      |
     | internal microphone |   | with push to talk button |
     |                     |   |                          |
     +-----------+---------+   +-------------+------------+
                 | 1                         | 2
+----------------v---------------------------v----------------+
|          web browser on a mobile device or a PC             |
|                                                             |
|  +-------------------------------------------------------+  |
|  |                         WeBAD                         |  |
|  |  +-------------+   +-------------+   +-------------+  |  |
|  |  |             |   |             |   |             |  |  |
|  |  |  volume     |   |  levels     |   |  speech     |  |  |
|  |  |  detection  +--->  classifier +--->  detection  |  |  |
|  |  |             |   |             |   |             |  |  |
|  |  +-------------+   +-------------+   +-------------+  |  |
|  |                                                       |  |
|  |                 emit javascript events                |  |
|  +------+--+--+------------+--+-------------+--+--+------+  |
|         |  |  |            |  |             |  |  |         |
|         v  v  v            v  v             v  v  v         |
|         signal             unmutedmic       speechstart     |
|         silence            mutedmic         speechstop      |
|         mute                                speechabort     |
|         |  |  |            |  |             |  |  |         |
|      +--v--v--v------------v--v-------------v--v--v--+      |
|      |            Web  Media Recording API           |      |
|      +------------+----------+---------+-------------+      |
|                   |          |         |                    |
|           +-------v-------+  |         |                    |
|           | audio message |  |         |                    |
|           +---------------+  |         |                    |
|                   | +--------v------+  |                    |
|                   | | audio message |  |                    |
|                   | +---------------+  |                    |
|                   |          | +-------v-------+            |
|                   |          | | audio message |            |
|                   |          | +---------------+            |
+-------------------|----------|---------|--------------------+
                    |          |         |
                    |          |         |
+-------------------v----------v---------v--------------------+
|                                                             |
|              backend server/homebase processing             |
|                                                             |
+-------------------------------------------------------------+

```

## Installation

```bash
$ git clone https://github.com/solyarisoftware/webad
```

## Run the demo 

On top of the WeBAD javascript library, 
this repository supply a web page demo that shows how manage events generated by WeBAD.
A very basic web page:
- shows events changes 
- record speech in real-time and plays the recorded audio/speech as soon the recording finish.

You can run the demo on your localhost, by example using firefox browser (suggested choice):

```bash
$ cd webad
$ firefox demo.html
```

Or you can run the demo through an HTTPS server (for security reasons, Web Audio API doesn't run on HTTP). 

To serve HTTPS static pages, I'm happy with [http-server package](https://github.com/http-party/http-server), 
using with this setup (of course you need an SSL certificate, maybe self-signed):

```
$ npm install -g http-server

$ http-server --ssl --cert selfsigned.cert --key selfsigned.key --port 8443

Starting up http-server, serving ./ through https
Available on:
  https://<your_server_IP>:8443
  https://<your_server_IP>:8443
Hit CTRL-C to stop the server
```

On the browser, goto the page: `https://<your_server_IP>:8443/demo.html`

The demo optionally print console logs details.
Be aware that console.logs are CPU-consuming (e.g. with console.log every `SAMPLE_POLLING_MSECS` msecs). 
Use them just for debug. 

Example of a successful recording:
```
silence 1606583471392 10  0.003169284 -50
silence 1606583471476 11  0.003678703 -49
silence 1606583471558 12  0.004238884 -47
RECORDING START
signal  1606583471640 1   0.011130118 -39 ██
signal  1606583471726 2   0.093003371 -21 ██████████████████
signal  1606583471807 3   0.135126087 -17 ███████████████████████████
signal  1606583471888 4   0.147303816 -17 █████████████████████████████
signal  1606583471971 5   0.110780564 -19 ██████████████████████
signal  1606583472053 6   0.077362200 -22 ███████████████
signal  1606583472135 7   0.051323664 -26 ██████████
signal  1606583472216 8   0.035841229 -29 ███████
signal  1606583472298 9   0.023777803 -32 ████
signal  1606583472387 10  0.046829950 -27 █████████
signal  1606583472470 11  0.137570663 -17 ███████████████████████████
signal  1606583472552 12  0.160574726 -16 ████████████████████████████████
signal  1606583472634 13  0.106528554 -19 █████████████████████
signal  1606583472716 14  0.074392862 -23 ██████████████
signal  1606583472798 15  0.114328135 -19 ██████████████████████
signal  1606583472881 16  0.079839601 -22 ███████████████
signal  1606583472965 17  0.067010825 -23 █████████████
signal  1606583473047 18  0.073485472 -23 ██████████████
signal  1606583473135 19  0.051709419 -26 ██████████
signal  1606583473217 20  0.092753694 -21 ██████████████████
signal  1606583473300 21  0.092452036 -21 ██████████████████
signal  1606583473382 22  0.114292916 -19 ██████████████████████
signal  1606583473464 23  0.147740638 -17 █████████████████████████████
signal  1606583473545 24  0.151739035 -16 ██████████████████████████████
signal  1606583473627 25  0.119704092 -18 ███████████████████████
signal  1606583473710 26  0.079414140 -22 ███████████████
signal  1606583473793 27  0.052684963 -26 ██████████
signal  1606583473875 28  0.036791875 -29 ███████
signal  1606583473957 29  0.085473214 -21 █████████████████
signal  1606583474041 30  0.069822456 -23 █████████████
signal  1606583474122 31  0.108942277 -19 █████████████████████
signal  1606583474205 32  0.082516853 -22 ████████████████
signal  1606583474287 33  0.105864857 -20 █████████████████████
signal  1606583474370 34  0.070232909 -23 ██████████████
signal  1606583474452 35  0.088423122 -21 █████████████████
signal  1606583474534 36  0.079493683 -22 ███████████████
signal  1606583474616 37  0.093004632 -21 ██████████████████
signal  1606583474697 38  0.113127166 -19 ██████████████████████
signal  1606583474780 39  0.079659070 -22 ███████████████
signal  1606583474863 40  0.052847455 -26 ██████████
signal  1606583474945 41  0.036905349 -29 ███████
signal  1606583475029 42  0.024483762 -32 ████
signal  1606583475111 43  0.016243028 -36 ███
signal  1606583475194 44  0.010775957 -39 ██
silence 1606583475275 1   0.007525253 -42
silence 1606583475356 2   0.004992406 -46
silence 1606583475438 3   0.005017556 -46
silence 1606583475521 4   0.003328749 -50
silence 1606583475602 5   0.004969294 -46
silence 1606583475686 6   0.005062652 -46
silence 1606583475768 7   0.005429598 -45
RECORDING STOP
Total Duration in msecs  : 4128
Signal Duration in msecs : 3578
Average Signal level     : 0.0819
Average Signal dB        : -22
```

Example of another successful recording:
```

silence 1606583483600 8   0.004910713 -46
silence 1606583483683 9   0.005344311 -45
silence 1606583483765 10  0.005013475 -46
silence 1606583484746 22  0.005962545 -44
RECORDING START
signal  1606583484828 1   0.010574964 -40 ██
silence 1606583484911 1   0.008990976 -41
silence 1606583484993 2   0.008978051 -41
silence 1606583485075 3   0.006903398 -43
silence 1606583485157 4   0.006374691 -44
signal  1606583485239 1   0.062778418 -24 ████████████
signal  1606583485321 2   0.146286860 -17 █████████████████████████████
signal  1606583485404 3   0.244475090 -12 ████████████████████████████████████████████████
signal  1606583485485 4   0.213673155 -13 ██████████████████████████████████████████
signal  1606583485568 5   0.141755137 -17 ████████████████████████████
signal  1606583485650 6   0.094043254 -21 ██████████████████
signal  1606583485732 7   0.062390216 -24 ████████████
signal  1606583485814 8   0.043569415 -27 ████████
signal  1606583485896 9   0.028904840 -31 █████
signal  1606583485977 10  0.019176061 -34 ███
signal  1606583486060 11  0.012721791 -38 ██
silence 1606583486142 1   0.008884101 -41
silence 1606583486227 2   0.005893894 -45
silence 1606583486309 3   0.005564636 -45
silence 1606583486390 4   0.005798743 -45
silence 1606583486472 5   0.006387892 -44
silence 1606583486555 6   0.005898863 -45
silence 1606583486637 7   0.008493331 -41
RECORDING STOP
Total Duration in msecs  : 1809
Signal Duration in msecs : 1259
Average Signal level     : 0.0900
 
```

Example of an aborted recording:
```
silence 1606583476198 12  0.004649533 -47
silence 1606583476280 13  0.003785960 -48
silence 1606583476368 14  0.003742043 -49
RECORDING START
signal  1606583476459 1   0.094886370 -20 ██████████████████
signal  1606583476547 2   0.144821317 -17 ████████████████████████████
signal  1606583476630 3   0.101134127 -20 ████████████████████
signal  1606583476712 4   0.067094446 -23 █████████████
signal  1606583476794 5   0.046854554 -27 █████████
signal  1606583476876 6   0.031084268 -30 ██████
signal  1606583476958 7   0.021707304 -33 ████
signal  1606583477040 8   0.013681016 -37 ██
silence 1606583477128 1   0.009553963 -40
silence 1606583477210 2   0.006021380 -44
silence 1606583477293 3   0.004318002 -47
silence 1606583477375 4   0.006236917 -44
silence 1606583477456 5   0.004355472 -47
silence 1606583477538 6   0.005018261 -46
silence 1606583477620 7   0.004187944 -48
RECORDING ABORT
Error reason             : signal duration (611) < MIN_signal_DURATION (700)
Total Duration in msecs  : 1161
Signal Duration in msecs : 611
Average Signal level     : 0.0652
Average Signal dB        : -24
```

### Browser issues when using the (demo) web audio APIs

- Firefox 👏👏👏👏

  All run smoothly! Tested on:
  - Windows 10 personal computer
  - Linux Ubuntu 20.04 Desktop
  - Recent Android v.10 mobile phone

- Chrome/Brave

  A bunch of issues:

  - `The AudioContext was not allowed to start. It must be resumed (or created) after a user gesture on the page. https://goo.gl/7K7WLu`

    See: https://developers.google.com/web/updates/2017/09/autoplay-policy-changes#webaudio
    Workaround found: The browser needs user to push an button to allow Web Audio API. 
    Weird for me / To be investigated. 

  - `Failed to execute 'stop' on 'MediaRecorder': The MediaRecorder's state is 'inactive'`
 
    MediaRecorder stop raise the error above. 
    Workaround found (see: demoAudioRecorder.js).


## Use WeBAD library in your application

- Just insert in your HTML these files:

  ```html
  <html>
    <body>
      <script src="volume-meter.js"></script>
      <script src="audioDetectionConfig.js"></script>
      <script src="audioDetection.js"></script>
      <script src="audioStream.js"></script>
    </body>
  </html>
  ```

- Manage events generated by WeBAD in your web browser application.
 
  The `demoAudioDetectionListeners.js` show how WeBAD events are consumed. 


## To do

- Demo web page
  - add input boxes for significant parameters, 
    allowing to modify parameters in real-time

  - the demo web page could act as a **parameter setting tuning tool**.
    Interactive parameter changes would transform the demo into a tool to tune/calibrate parameters

  - made a visually decent page 

  - add a push-to-talk hotkey demo

  - add optionally an 'enable audio input' / 'disable audio input' button.

- Add clipping event

- Better explain the parameter tuning issues

- Please Giorgio, remove global vars and transform the ugly "all-see-all" javascript files in ES6 JS modules!

- WeBAD just triggers above listed events. 
  What is now out of scope of this release:
  - how to use events to record the audio recordings
  - how to use/process blob audio messages 
    (probably you want to send them to a backend server via socketio or websockets).
    A better solution could be to provide the speech result as data payload of a final `speechaudioavailable`.
    To be investigated.


## Discussion

- **Push-to-talk versus continuous listening**

  Push-to-talk is a simple UX. WeBAD solve the external mic + HW push-button case. 
  Just catch `unmutedmic` event to start recording, `mutedmic` event to stop recording.
  That's easy!

  Continuous listening is hard! Not just technically, but above all from the UX perspective.
  The proposed solution is just a rough proof-of-concept.

- **Does continuous listening includes wake-word UX?**

  An interesting plus point of continuous listening is that it "includes" the wake word mechanics.
  In a standard wake-word approach, the voicebot is activated with a unique associated wake-word.
  Two common examples are:

  - *Alexa, do this...*
  - *Ok Google, do that...*

  But with continuous listening, the computer-side interlocutor 
  is no more determined by a single wake word itself, but it's part of the utterance
  to be elaborated by the voicebot. 
  That's smart because WeBAD is now a single interface for multiple *interlocutor-bots*. 

  Suppose a voice metabot (main bot) made by different component voicebots, 
  maybe each one dedicated to specific skills.
  The user could invoke each different subsystems in an natural way:

  - *Computer, please slow down velocity*
  - *Alexa, what time is it?*
  - *Ok Google, tell-me a joke*

- **But WeBAD doesn't make any real speech detection**

  That's honestly true. 
  The algorithm I implemented assumes that audio detection match with speech detection. 
  That's true just in restricted contexts, by example because user is equipped 
  with an external proximity mic that capture mainly his voice.
  In general detected signal chunks can contain any audio, any sound, not just speech.
  So the signal chunk detection could ne improved with a real *speech detector*, 
  maybe implemented as a simple realtime ML classifier that distinguish basically two classes: 'speech' / 'nospeech'.
  To be investigated.

- **WeBAD doesn't make any speech recognition / speech understanding**

  WeBAD doesn't make any text transcript with an ASR engine, 
  That's out of scope of current project.
  We here need just to collect the audio input, from a web browser client, 
  to be submitted to a backend engine. See also the [Architecture](#architecture) paragraph.

- **Does WeBAD continuous listening allows barge-in mode?**

  The current implementation assumes a "common" turn-based half-duplex human-computer interaction. 
  Honestly this is a simplistic / not so natural way humans conversate.
  So in theory WeBAD run in a true continuous mode, allowing a barge-in, 
  but just in case the computer audio feedback (a response / chatbot turn  reply) is played on headphones.
  Audio played back through loudspeakers create an issue, because it re-enter in the microphone, 
  creating at the end of the day a feedback / infinite loop.
  That's why the demo require a rigid half-duplex mode: when the computer talk, the continuous listening is suspended. 
  Any idea to solve the issue?

- **CPU usage**

  How to measure the CPU usage?


## How to contribute

Any contribute is welcome. Maybe you want to: 
- open a new discussion a specific topic opening a post [here](https://github.com/solyarisoftware/WeBAD/discussions)
- contact me via [e-mail](mailto:giorgio.robino@gmail.com)

## References / related projects

- Silence detection

  [Web Audio API: how can I detect speech and record until silence, with or without a Push-To-Talk button](https://stackoverflow.com/questions/62114251/web-audio-api-how-can-i-detect-speech-and-record-until-silence-with-or-without/62212935#62212935)


- How to use AudioWorklets

  https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_AudioWorklet

- Volume detection using FFT

  https://github.com/otalk/hark

- Volume detection using P5
-
  https://p5js.org/reference/#/p5.Amplitude

- Hotkeys

  [Speechly Guidelines for Creating Productive Voice-Enabled Apps](https://www.speechly.com/blog/voice-application-design-guide/)
  [Why hasn’t the iPhone moment happened yet for voice UIs](https://www.speechly.com/blog/real-time-voice-user-interfaces/)

- Wake word detection - some solutions
 
  - Howl
    https://github.com/castorini/howl
    https://arxiv.org/pdf/2008.09606.pdf
  - Snowboy
    https://github.com/kitt-ai/snowboy 
  - Raven
    https://github.com/rhasspy/rhasspy-wake-raven 
  - Mycroft Precise
    https://github.com/MycroftAI/mycroft-precise
  - Porcupine
    https://picovoice.ai/blog/offline-voice-ai-in-a-web-browser/


## Credits

- Foundation component: I used the volume-meter Web Audio API script processor,
  written by Chris Wilson here available: https://github.com/cwilso/volume-meter 
  👏👏👏👏


## License

[MIT](LICENSE.txt) (c) Giorgio Robino

---
