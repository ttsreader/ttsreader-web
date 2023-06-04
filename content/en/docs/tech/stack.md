---
title: "Tech Stack"
description: "About the technologies operating TTSReader"
lead: "About the technologies operating TTSReader"
date: 2023-02-12T15:22:20+01:00
lastmod: 2023-02-12T15:22:20+01:00
draft: false
images: []
menu:
  docs:
    parent: "tech"
weight: 310
toc: true
---

## Speech Synthesis Engines

- TTSReader uses primarily speech synthesis engines that are installed on your device and - or browser. We get access to them through the Web speech API.
- This is why different devices may show different voices.
- Chrome adds its own voices - thus generally having the largest variety.
- Firefox on Windows, allows using custom SAPI5 voices as well - so - you can even use your own voice to synthesize speech. See [this article with video](https://ttsreader.com/blog/2023/02/05/sapi5/) for more info. This is especially useful for people with speech difficulties, who can use their own voice to synthesize speech. In that case using [SpeechNinja](https://speechninja.co) is recommended.


## Hosting

Hosted on Google Cloud


## App technology

The app itself is built on JavaScript, using npm. The code behind it is not open source.

We are open sourcing the wrapper javascript library around the web speech API.

## Site technology

The website around the app, landing page, docs, etc. is based on [Doks](https://doks.netlify.app) which is an amazing open source Hugo theme. We found Doks to be simply a piece of art. Doks is powered by Hugo & npm in a great hybrid that brings a lot of power, beauty and efficiency to this template / Hugo theme.
