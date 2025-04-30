---
title: "New Bug in Google Chrome Voices"
description: "New bug in Google voices on Chrome on Windows - description and solutions"
excerpt: "New bug in Google voices on Chrome on Windows - description and solutions"
date: 2025-04-28T09:19:42+01:00
lastmod: 2025-04-28T09:19:42+01:00
draft: false
weight: 50
images: []
categories: ["News"]
tags: ["development", "bug", "web-speech-api"]
contributors: ["Ronen Rabinovici"]
pinned: false
homepage: false
---

## TL;DR

- **Affected Systems**: Some Chrome browsers on Some Windows 11
- **Symptoms**: Google voices do not read past the first sentence.
- **Prevalence**: This affects circa 25% of Chrome users.
- **Workarounds**:
  - Select non-Google voices
  - Use Microsoft Edge
  - Use the new TTSReader player at [https://ttsreader.com/player/](https://ttsreader.com/player/) with premium voices, that are server-side generated and thus not affected by this bug.


## Description of the bug

A new bug has been affecting the Web-Speech-API and its users - including [TTSReader's Text-to-Speech Player](https://ttsreader.com/) since early April 2025. Some say it has been introduced due to updates on Chrome or on Windows OS. It manifests itself as Google's voices don't fire their callback events as they should according to the webspeech API spec - and thus can't read more than a single utterance at a time.

The way it shows on TTSReader Legacy is that the voice reads the first sentence, and then stops. It doesn't read the rest of the text.
The new player knows to recognize the bug - and on affected systems - it will switch to a different voice that is not affected by this bug.

The bug is known to Google - and they're working on a fix. See discussion here: [Chromium Issues Tracker - SpeechSynthesis Events Not Firing](https://issues.chromium.org/issues/409717085)

## Solutions

1) Use Microsoft Edge - it has the best voices available on Windows. Specifically, the Christopher voice is excellent, as well as other Microsoft voices. This is a great solution both for the [Legacy player](https://ttsreader.com/legacy/) as well as the [New player](https://ttsreader.com/player/).
2) Use the new [TTSReader player](https://ttsreader.com/player/) - it has premium voices that are not affected by this bug. The new premium voices are excellent and are server-side generated, so they are not affected by this bug. They are smooth and expressive.
3) Lastly, you may use Chrome with non-Google voices. But the previous two options are better.

We would love to hear your feedback! Please join our Discord community and let us know what you think about the new player and the premium voices. Your feedback is invaluable to us as we continue to improve our service. Specifically now - we're entering a boost in development and we need you to direct us to make the best text-to-speech player in the world for you. [Join TTSReader's community](https://discord.gg/GQT5f5kM)

Much appreciated,

Ronen, founder.

