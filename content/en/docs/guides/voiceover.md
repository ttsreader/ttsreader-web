---
title: "Generating Mp3 Files Voice Overs"
description: "How to generate mp3 audio files, voiceovers, and mix multiple voices with TTSReader"
date: 2023-08-21T13:59:39+01:00
lastmod: 2023-08-21T13:59:39+01:00
draft: false
images: []
menu:
  docs:
    parent: "guides"
weight: 111
toc: true
keywords: ["text-to-speech", "mp3", "audio", "voiceover", "voice over", "mix voices", "combine voices", "combine languages", "combine speeds"]
---

<br/>

## Quick Start

* Go to [ttsreader.com/player/](https://ttsreader.com/player/)
* Paste your text
* Select your language & preferred voice
* Click Play
* Make sure you like the text, voice & speed. If you don't - change them and click Play again - until it's perfect.
* You may add pauses by inserting the following text: `{{pause:1000}}` (with 2 curly brackets on each side) in the text. The number is the pause duration in milliseconds.
* You may use multiple languages, voices & speeds in the same file, by inserting the following text: `{{set: lang=en; name=Noah; rate=1.1}}` (with 2 curly brackets on each side) in the text. You do not need to remember that text - it is available in the voice selection dropdown. More on this subject will follow in the next sections.

<br/>

## NEW: Mix Languages, Voices & Speeds

You may use multiple languages, voices & speeds in the same file, by inserting the following text:


`{{set: lang=en; name=Noah; rate=1.1}}` (with 2 curly brackets on each side)


in the text. You do not need to remember that text - it is available in the voice selection dropdown - via the 'copy' button next to each voice.

Once the player reaches the setter text - it will set itself to the parameters specified by the setter - thus reading from that point on according to those params - language, voice & rate, until the next setter is reached. And so on.

This way you can mix unlimited languages, voices & speeds in the same file, eventually generating a single mp3 file with all the different languages, voices & speeds.

-> Here's a short demo showing combining voices, and reading speeds:

<br/>

<div class="videowrapper">
  <iframe style="display: block" src="https://www.youtube.com/embed/g8x4ZiWkguI?rel=0" title="Demo on combining multiple voices in text-to-speech with TTSReader" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen=""></iframe>
</div>

<br/>

-> And here's a short video showing HOW TO ACHIEVE THAT with TTSReader's controls::

<br/>

<div class="videowrapper">
  <iframe src="https://www.youtube.com/embed/F0EgHHb1tUI?rel=0" title="How to mix voices in text-to-speech with TTSReader" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen=""></iframe>
</div>



## Download the Synthesized Speech as an mp3 Audio File

On Windows machines, TTSReader can record in real time the synthesized speech, and save it as an mp3 audio file.

This is done by clicking the "Record" button, and then following the instructions on the screen.

Here's a hands-on video that shows how to do it. In short - simply click the "Record" button, then follow the instructions on the screen. When done click the "Record" button again, and the mp3 file will be generated and downloaded to your computer.

The only tricky part is Share popup window - there you have to select the 'Entire Screen' tab -> then click the screen image itself -> then make sure 'Share System Audio' is checked -> then click 'Share'.

Here's the short video showing it all in action:

<div class="videowrapper">
  <iframe style="display: block" src="https://www.youtube.com/embed/Xq09r01GetQ?rel=0" title="Generate audio mp3 files from synthesized speech with TTSReader" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen=""></iframe>
</div>

<br/>

When recording is done - click on the Record button again to stop recording. The mp3 file will be generated and downloaded to your computer.

<br/>



## When is a Commercial License Necessary?

A commercial license is necessary when using TTSReader within a business, or when using the generated audio for publishing. See more [here](/docs/guides/commercial/).

<br/>


## Upgrading to Premium

You can upgrade to premium [here](https://ttsreader.com/upgrade/).

<br/>


## Add pauses to the audio

You may add 1 second long pause by inserting the following text: `{{pause}}` (with 2 curly brackets on each side) in the text.

<br/>

## More voices

Need more voices? There are some more voices when using TTSReader on Edge browser - but mainly - we're working on adding more Premium Voices - which are AI most updated & natural sounding voices.

<p>- On mobile, you will find more voices using our <a href="/mobile/" target="_blank">text-to-speech mobile apps</a></p>

Also - you can use your own SAPI5 voices with TTSReader. Here's how:


<br/>

### Custom SAPI5 Voices

Using custom SAPI5 voices is possible on Windows using Firefox browser. See example here:

<div class="videowrapper">
  <iframe style="display: block" src="https://www.youtube.com/embed/Ke9YXAC4h64?rel=0" title="Speech Synthesis with SAPI5 voices using TTSReader" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen=""></iframe>
</div>
