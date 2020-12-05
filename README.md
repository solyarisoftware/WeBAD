# WeBAD

WeBAD stay for **We**b **B**rowser **A**udio **D**etection/Speech Recording Events API.

Pronounce it *we-bad* or *web-ad*.

The concept is to experiment how to detect audio 
and especially speech in *continuous listening* mode, on the browser, 
simply using a Javascript program above the Web audio API.

The solution here proposed is to get the audio volume of the microphone in real-time, 
using a Web Audio API scriptprocessor that calculate RMS volume. 
A cyclic task, running every N msecs, does some logic above the current volume RMS sample 
and emits these javascript events:

- AUDIO VOLUME
  - `signal`  -> audio volume is high, so probably user is speaking
  - `silence` -> audio volume is pretty low, the mic is on but there is not speech
  - `mute`    -> audio volume is almost zero, the mic is off

- MICROPHONE STATUS
  - `unmutedmic`  -> microphone is UNMUTED (passing from OFF to ON)
  - `mutedmic` -> microphone is MUTED (passing from ON to OFF)

- RECORDING
  - `recordstart` -> speech recording START
  - `recordstop`  -> speech recording STOP (success, recording seems a valid speech)
  - `recordabort` -> speech recording ABORTED (because level is too low or audio duration length too short)

## Continuous listening vs push-to-talk  

You want to trigger events that need to face these scenarios: 

- **Continuous listening (without wake-word detection)**

  The best experience is maybe the *continuous listening* mode, 
  where audio is detected in real-time, 
  just talking in front of the PC (or the tablet/ mobile phone / handset).

  Namely: avoiding any wake-word detection algorithm, 

- Push-to-talk

  That's the traditional/safe way to generate audio messages 
  (see radio mobile/walkie-talkie). 
  The user push a button, start to talk, release the button when finished to talk.

  Note that push to talk could be implemented on the browser in two way:
  - SW
    Through a keyboard or a touch screen, the user press a key or touch a (button on the) screen to talk

  - HW
    The user press a real/hardware button, that maybe mute/un-mute an external mic.

On the basis of the microphone / hardware configuration available,
there are some different possible ways to proceed:

- Using the PC/handset internal microphone

  In this scenario, the goal is to get a speech generating `recordstart` and `recordstop` events.

- Using an external microphone, bound to a push-to-talk hardware button
 
  In this scenario, the continuous mode could be substituted by a push-to-talk experience,
  where user has to push a real button every time he want to submit a speech, 
  releasing the button when he explicitly want to terminate recording.
  To accomplish this case, the speech recording could start from the `unmutedmic` event
  and it could stop when the `mutedmic` event is triggered. 
 

### Signal level and generated events 

The microphone volume detected by the web Audio API scriptprocessor traces these states:

- `mute`
  The micro is closed, or muted (volume is `~= 0`), 
  - via software, by an operating system driver setting
  - via software, because the application set the mute state by example with a button on the GUI
  - via hardware, with an external mic input grounded by a push-to-talk button 

- `unmute`
  The micro is open, or unmuted 

- `silence` 
  The micro is open (volume is almost silence `< silence_threshold_value`), 
  containing just background noise, 
  not containing sufficient signal power that probabilistically correspond to speech

- `signal` 
  The signal level is pretty high, probabilistically corresponding to speech
 
- `clipping` 
  The signal level is too high (volume is  `~= 1`)

```
       volume
         ^
     1.0 |                                                                                                 
         |                                       █
         |               █                       █
         |               █                       █
clipping |               █                       █
  signal |           █ █ █                       █   █
    |    |         █ █ █ █ █   █             █   █ █ █                    █
    |    |         █ █ █ █ █   █             █   █ █ █                  █ █ █
  speech |         █ █ █ █ █ █ █             █   █ █ █                  █ █ █
    |    |       █ █ █ █ █ █ █ █ █           █   █ █ █              █   █ █ █ █
    |    |       █ █ █ █ █ █ █ █ █ █         █ █ █ █ █ █          █ █ █ █ █ █ █
  signal |       █ █ █ █ █ █ █ █ █ █ █       █ █ █ █ █ █          █ █ █ █ █ █ █  
 silence |   █   █ █ █ █ █ █ █ █ █ █ █ █     █ █ █ █ █ █ █      █ █ █ █ █ █ █ █ █
  unmute | █ █ █ █ █ █ █ █ █ █ █ █ █ █ █     █ █ █ █ █ █ █  █   █ █ █ █ █ █ █ █ █
mute 0.0 +------------------------------------------------------------------------> time  
```


## Speech recording rules

### Push-to-talk recording

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

    ^                                                              ^   
    |                                                              |
    unmutemic                                                      mutemic
    <--------------------------- recording ------------------------>
```

```javascript
document.addEventListener('mutedmic', event => startRecording(event) )
document.addEventListener('unmutedmic', event => stopRecording(event) )
```


### Continuous-listening recording

The continuous listening mode is more challenging. A speech is usually determined 
by a sequence of signal chunks (letter/words/sentences) interlaced by pauses (silence).

signal -> pause -> signal -> pause -> ... -> signal -> silence

In this scenario:

- `recordstart` event is generated when a first speech chunk start 
- `recordstop` event is generated when a successive speech is followed by a pause long `PAUSE_LAG` msecs
- `recordabort` event is generated when an initial speech chunk has too low volume or is too short.

```
             █ chunk 1
           █ █
         █ █ █                           
       █ █ █ █ █   █                   chunk 2       █
       █ █ █ █ █   █ █        █       █              █      chunk 3
       █ █ █ █ █ █ █ █        █ █   █ █ █            █ █   █
     █ █ █ █ █ █ █ █ █ █ █    █ █ █ █ █ █ █          █ █ █ █ █ █ █
     ^                    ^                 ^                     ^        ^    
     |                    |                 |                     |        |  
     recordstart          silence           silence               silence  recordstop
     <------------------------------ recording ---------------------------->
```

```javascript
document.addEventListener('recordstart', event => startRecording(event) )
document.addEventListener('recordstop', event => stopRecording(event) )
document.addEventListener('recordabort', event => abortRecording(event) )
```

### All events and signal states

```
                                                                                            ^
                                                                                            |
                                                                                          clipping
                                        █                                                   | 
                █                       █                                clipping threshold v    
----------------█-----------------------█--------------------------------------------------- 
                █                       █                                                   ^ 
            █ █ █                       █   █                                               |
          █ █ █ █ █   █             █   █ █ █                    █                          |
          █ █ █ █ █   █   █         █   █ █ █                  █ █ █                        |
          █ █ █ █ █ █ █ █ █         █   █ █ █                  █ █ █                        |
        █ █ █ █ █ █ █ █ █ █ █       █   █ █ █          █   █   █ █ █ █                signal/speech
        █ █ █ █ █ █ █ █ █ █ █       █ █ █ █ █ █        █ █ █   █ █ █ █                      |
        █ █ █ █ █ █ █ █ █ █ █ █     █ █ █ █ █ █ █      █ █ █ █ █ █ █ █                      |
        █ █ █ █ █ █ █ █ █ █ █ █     █ █ █ █ █ █ █      █ █ █ █ █ █ █ █ █                    |
        █ █ █ █ █ █ █ █ █ █ █ █     █ █ █ █ █ █ █      █ █ █ █ █ █ █ █ █                    |
        █ █ █ █ █ █ █ █ █ █ █ █     █ █ █ █ █ █ █      █ █ █ █ █ █ █ █ █ signal threshold   v
--------█-█-█-█-█-█-█-█-█-█-█-█-----█-█-█-█-█-█-█------█-█-█-█-█-█-█-█-█-------------------- 
    █   █ █ █ █ █ █ █ █ █ █ █ █     █ █ █ █ █ █ █      █ █ █ █ █ █ █ █ █                    ^
  █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █    █ █ █ █ █ █ █ █ █ █ background noise   |   
  ^     ^----------------------^    ^------------^    ^-----------------^       ^ ^         v 
  |     |                      |    |            |    |                 |       | |
  |     SIGNAL                 |    SIGNAL       |    SIGNAL            |       | |
  |     |                      |                 |                      |       | |
  |     |                      silence           silence                silence | |
  |     |                                                               lag     | |
  unmutemic                                                                     | mutemic
        ^                                                                       ^
        |                                                                       |
        recordstart                                                             recordstop
```


## Architecture

```
     +---------------------+   +--------------------------+
     | browser             |   | external microphone      |
     | internal microphone |   | with push to talk button |
     |                     |   |                          |
     +-----------+---------+   +-------------+------------+
                 | 1                         | 2
+----------------v---------------------------v----------------+
| web browser                                                 |
|  +-------------------------------------------------------+  |
|  |                         WeBAD                         |  |
|  |  +-------------+   +-------------+   +-------------+  |  |
|  |  |             |   |             |   |             |  |  |
|  |  |  volume     |   |  audio      |   |  speech     |  |  |
|  |  |  detection  +--->  detection  +--->  detection  |  |  |
|  |  |             |   |             |   |             |  |  |
|  |  +-------------+   +-------------+   +-------------+  |  |
|  |                                                       |  |
|  |                 emit javascript events                |  |
|  +------+--+--+------------+--+-------------+--+--+------+  |
|         |  |  |            |  |             |  |  |         |
|         v  v  v            v  v             v  v  v         |
|         signal             unmutedmic       recordstart     |
|         silence            mutedmic         recordstop      |
|         mute                                recordabort     |
|         |  |  |            |  |             |  |  |         |
|      +--v--v--v------------v--v-------------v--v--v--+      |
|      |            Web  Media Recording API           |      |
|      +------------+----------+---------+-------------+      |
|                   |          |         |                    |
|           +-------v-------+  |         |                    |
|           | audio message |  |         |                    |
|           +---------------+  |         |                    |
|                     +--------v------+  |                    |
|                     | audio message |  |                    |
|                     +---------------+  |                    |
|                                +-------v-------+            |
|                                | audio message |            |
|                                +---------------+            |
+-------------------------------------------------------------+

```


## video demo

- Demo shows triggering of events: 
  `mute`, `silence`, `mute`, `startrecording`, `stoprecording` 
  on Windows 10, Brave (~Chrome) browser

  https://youtu.be/P0JY_U8ZUKU

- Demo shows triggering of `mutedmic` e `unmutedmic`, 
  on Windows 10 PC, Brave (~Chrome) browser, using system settings

  https://youtu.be/ZUWuLqENtZ8


## Serve demo page using HTTPS 

Memo to run the demo:
```
http-server --ssl --cert selfsigned.cert --key selfsigned.key --port 8443
$ http-server --ssl --cert selfsigned.cert --key selfsigned.key --port 8443
Starting up http-server, serving ./ through https
Available on:
  https://127.0.0.1:8443
  https://192.168.1.134:8443
Hit CTRL-C to stop the server
```

On the browser: `https://192.168.1.134:8443/demo.html`

## console log (excerpt)

```

silence 1606583471392 10  0.003169284 -50
silence 1606583471476 11  0.003678703 -49
silence 1606583471558 12  0.004238884 -47
RECORDING START
SIGNAL  1606583471640 1   0.011130118 -39 ██
SIGNAL  1606583471726 2   0.093003371 -21 ██████████████████
SIGNAL  1606583471807 3   0.135126087 -17 ███████████████████████████
SIGNAL  1606583471888 4   0.147303816 -17 █████████████████████████████
SIGNAL  1606583471971 5   0.110780564 -19 ██████████████████████
SIGNAL  1606583472053 6   0.077362200 -22 ███████████████
SIGNAL  1606583472135 7   0.051323664 -26 ██████████
SIGNAL  1606583472216 8   0.035841229 -29 ███████
SIGNAL  1606583472298 9   0.023777803 -32 ████
SIGNAL  1606583472387 10  0.046829950 -27 █████████
SIGNAL  1606583472470 11  0.137570663 -17 ███████████████████████████
SIGNAL  1606583472552 12  0.160574726 -16 ████████████████████████████████
SIGNAL  1606583472634 13  0.106528554 -19 █████████████████████
SIGNAL  1606583472716 14  0.074392862 -23 ██████████████
SIGNAL  1606583472798 15  0.114328135 -19 ██████████████████████
SIGNAL  1606583472881 16  0.079839601 -22 ███████████████
SIGNAL  1606583472965 17  0.067010825 -23 █████████████
SIGNAL  1606583473047 18  0.073485472 -23 ██████████████
SIGNAL  1606583473135 19  0.051709419 -26 ██████████
SIGNAL  1606583473217 20  0.092753694 -21 ██████████████████
SIGNAL  1606583473300 21  0.092452036 -21 ██████████████████
SIGNAL  1606583473382 22  0.114292916 -19 ██████████████████████
SIGNAL  1606583473464 23  0.147740638 -17 █████████████████████████████
SIGNAL  1606583473545 24  0.151739035 -16 ██████████████████████████████
SIGNAL  1606583473627 25  0.119704092 -18 ███████████████████████
SIGNAL  1606583473710 26  0.079414140 -22 ███████████████
SIGNAL  1606583473793 27  0.052684963 -26 ██████████
SIGNAL  1606583473875 28  0.036791875 -29 ███████
SIGNAL  1606583473957 29  0.085473214 -21 █████████████████
SIGNAL  1606583474041 30  0.069822456 -23 █████████████
SIGNAL  1606583474122 31  0.108942277 -19 █████████████████████
SIGNAL  1606583474205 32  0.082516853 -22 ████████████████
SIGNAL  1606583474287 33  0.105864857 -20 █████████████████████
SIGNAL  1606583474370 34  0.070232909 -23 ██████████████
SIGNAL  1606583474452 35  0.088423122 -21 █████████████████
SIGNAL  1606583474534 36  0.079493683 -22 ███████████████
SIGNAL  1606583474616 37  0.093004632 -21 ██████████████████
SIGNAL  1606583474697 38  0.113127166 -19 ██████████████████████
SIGNAL  1606583474780 39  0.079659070 -22 ███████████████
SIGNAL  1606583474863 40  0.052847455 -26 ██████████
SIGNAL  1606583474945 41  0.036905349 -29 ███████
SIGNAL  1606583475029 42  0.024483762 -32 ████
SIGNAL  1606583475111 43  0.016243028 -36 ███
SIGNAL  1606583475194 44  0.010775957 -39 ██
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

silence 1606583475857 8   0.004476706 -47
silence 1606583475943 9   0.003678702 -49
silence 1606583476028 10  0.004149900 -48
silence 1606583476110 11  0.004223898 -47
silence 1606583476198 12  0.004649533 -47
silence 1606583476280 13  0.003785960 -48
silence 1606583476368 14  0.003742043 -49
RECORDING START
SIGNAL  1606583476459 1   0.094886370 -20 ██████████████████
SIGNAL  1606583476547 2   0.144821317 -17 ████████████████████████████
SIGNAL  1606583476630 3   0.101134127 -20 ████████████████████
SIGNAL  1606583476712 4   0.067094446 -23 █████████████
SIGNAL  1606583476794 5   0.046854554 -27 █████████
SIGNAL  1606583476876 6   0.031084268 -30 ██████
SIGNAL  1606583476958 7   0.021707304 -33 ████
SIGNAL  1606583477040 8   0.013681016 -37 ██
silence 1606583477128 1   0.009553963 -40
silence 1606583477210 2   0.006021380 -44
silence 1606583477293 3   0.004318002 -47
silence 1606583477375 4   0.006236917 -44
silence 1606583477456 5   0.004355472 -47
silence 1606583477538 6   0.005018261 -46
silence 1606583477620 7   0.004187944 -48
RECORDING ABORT
Error reason             : signal duration (611) < MIN_SIGNAL_DURATION (700)
Total Duration in msecs  : 1161
Signal Duration in msecs : 611
Average Signal level     : 0.0652
Average Signal dB        : -24

silence 1606583477705 8   0.005247298 -46
silence 1606583477788 9   0.005002713 -46
silence 1606583477869 10  0.004804194 -46
RECORDING START
SIGNAL  1606583480420 1   0.091071086 -21 ██████████████████
SIGNAL  1606583480503 2   0.160458414 -16 ████████████████████████████████
SIGNAL  1606583480586 3   0.112054095 -19 ██████████████████████
SIGNAL  1606583480668 4   0.074338976 -23 ██████████████
SIGNAL  1606583480750 5   0.049317995 -26 █████████
SIGNAL  1606583480832 6   0.032718566 -30 ██████
SIGNAL  1606583480914 7   0.022848595 -33 ████
SIGNAL  1606583480996 8   0.015158225 -36 ███
SIGNAL  1606583481077 9   0.010056276 -40 ██
silence 1606583481159 1   0.007225368 -43
silence 1606583481241 2   0.007065454 -43
SIGNAL  1606583481324 1   0.010269605 -40 ██
SIGNAL  1606583481407 2   0.011462841 -39 ██
SIGNAL  1606583481489 3   0.013908580 -37 ██
silence 1606583481572 1   0.009712880 -40
silence 1606583481654 2   0.006913196 -43
silence 1606583481735 3   0.008786999 -41
silence 1606583481816 4   0.008154145 -42
SIGNAL  1606583481926 1   0.011119918 -39 ██
silence 1606583482009 1   0.008500690 -41
silence 1606583482092 2   0.009422355 -41
silence 1606583482175 3   0.008503675 -41
silence 1606583482257 4   0.007532468 -42
silence 1606583482340 5   0.008574968 -41
silence 1606583482423 6   0.007613792 -42
silence 1606583482506 7   0.007681328 -42
RECORDING STOP
Total Duration in msecs  : 2086
Signal Duration in msecs : 1536
Average Signal level     : 0.0473
Average Signal dB        : -27

silence 1606583482598 8   0.006516270 -44
silence 1606583482680 9   0.008323560 -42
silence 1606583482762 10  0.009014556 -41
RECORDING START
SIGNAL  1606583482855 1   0.010591813 -40 ██
SIGNAL  1606583482938 2   0.011537645 -39 ██
silence 1606583483024 1   0.009621478 -40
silence 1606583483108 2   0.006719037 -43
silence 1606583483190 3   0.006885541 -43
silence 1606583483272 4   0.007841863 -42
silence 1606583483354 5   0.005909827 -45
silence 1606583483435 6   0.004969057 -46
silence 1606583483517 7   0.004062877 -48
RECORDING ABORT
Error reason             : signal duration (112) < MIN_SIGNAL_DURATION (700)
Total Duration in msecs  : 662
Signal Duration in msecs : 112
Average Signal level     : 0.0111
Average Signal dB        : -39

silence 1606583483600 8   0.004910713 -46
silence 1606583483683 9   0.005344311 -45
silence 1606583483765 10  0.005013475 -46
silence 1606583484746 22  0.005962545 -44
RECORDING START
SIGNAL  1606583484828 1   0.010574964 -40 ██
silence 1606583484911 1   0.008990976 -41
silence 1606583484993 2   0.008978051 -41
silence 1606583485075 3   0.006903398 -43
silence 1606583485157 4   0.006374691 -44
SIGNAL  1606583485239 1   0.062778418 -24 ████████████
SIGNAL  1606583485321 2   0.146286860 -17 █████████████████████████████
SIGNAL  1606583485404 3   0.244475090 -12 ████████████████████████████████████████████████
SIGNAL  1606583485485 4   0.213673155 -13 ██████████████████████████████████████████
SIGNAL  1606583485568 5   0.141755137 -17 ████████████████████████████
SIGNAL  1606583485650 6   0.094043254 -21 ██████████████████
SIGNAL  1606583485732 7   0.062390216 -24 ████████████
SIGNAL  1606583485814 8   0.043569415 -27 ████████
SIGNAL  1606583485896 9   0.028904840 -31 █████
SIGNAL  1606583485977 10  0.019176061 -34 ███
SIGNAL  1606583486060 11  0.012721791 -38 ██
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

## Where is the code?

Coming soon!


## Acknowledgments

- I used the volume-meter scriptprocessor of the great Chris Wilson's repo: https://github.com/cwilso/volume-meter

## License

MIT (c) Giorgio Robino

---
