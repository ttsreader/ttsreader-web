---
title: "Teach Once, Pronounce Forever: The Pronunciation Dictionary Story"
description: "How we built a 'memory' for the TTS engine, allowing you to permanently teach it how to pronounce unique names, brands, and jargon."
excerpt: "It's frustrating to fix the same pronunciation error every time. This is the story of the Pronunciation Dictionary, our solution for creating a persistent, custom language model for your account."
date: 2026-01-08T11:20:00+02:00
lastmod: 2026-01-11T10:20:00+02:00
draft: true
weight: 50
images: []
categories: ["Features", "Story"]
tags: ["pronunciation", "dictionary", "customization", "workflow", "accuracy"]
contributors: ["Amiel"]
pinned: false
homepage: false
---

*By Amiel | Jan 11, 2026*

![An icon of a book with a speech bubble, representing a pronunciation dictionary.](img.webp)

There's a specific kind of frustration that comes from hearing a computer mispronounce a word you use every day. It could be your company's name, a technical acronym, or your own last name.

This led us to develop the **Pronunciation Dictionary**: a tool that lets you teach our engine how to speak *your* language, and have it remember forever.

### The Goal: A Smarter, More Personal Engine

The idea was to move from temporary fixes to permanent solutions. You shouldn't have to tell the engine how to pronounce "TTSReader" every time you write about it. You should be able to instruct it once and trust that it will be applied from then on.

This meant building a persistent, browser level 'memory' for the TTS engine.

### How It Works: Your Personal Language Layer

The Pronunciation Dictionary is a powerful, server-side feature that modifies the TTS process itself.

1.  **A Rule-Based System:** At its core, the dictionary is a simple key-value store saved to your user profile. The 'key' is the word as it's written (e.g., "gnocchi"), and the 'value' is a phonetic or simplified spelling that the engine can pronounce correctly (e.g., "nyoh-kee").
2.  **Server-Side Pre-processing:** When you ask TTSReader to synthesize text, our backend doesn't immediately send it to the neural TTS engine. First, it scans the text and compares it against your personal dictionary.
3.  **Applying the Rules:** If any of your keys are found, they are replaced with your custom values. This corrected text is then sent to the synthesis engine.

It's a permanent upgrade to your personal TTS experience.

### Real-World Scenarios: Consistency and Respect

This feature is a game-changer for professionals and individuals who value accuracy.

*   **The Corporation and Brand Identity:** A company's marketing team adds their company name ("AcmeCorp"), product names ("Chrono-Widget"), and CEO's name ("Siobhan Smith") to the dictionary. Now, every audio file they generate—from global ad campaigns to internal training videos—has perfect, consistent, on-brand pronunciation. It's a matter of professionalism.
*   **The Medical Professional and Precision:** A doctor who creates audio summaries for patients uses the dictionary to add complex drug names and medical terminology. This ensures the information their patients hear is always clear and accurate, which is critical for safety and understanding.
*   **The User with a Unique Name:** For someone whose name is constantly mispronounced by automated systems, this feature is about respect. They can teach the engine how to say their name correctly once. From then on, the audio they create feels truly personal and customized.

The Pronunciation Dictionary transforms our engine from a generic tool into your personal narrator, one that learns from you and speaks your language.

