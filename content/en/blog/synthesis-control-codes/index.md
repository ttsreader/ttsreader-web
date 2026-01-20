---
title: "Controlling Speech Synthesis with TTSReader Codes"
description: "A technical guide to using special codes in TTSReader to control pacing, skip sections, and set voice parameters directly within your text."
excerpt: "Learn how to use TTSReader's special codes—{{pause}}, {{skip}}, and {{set}}—to fine-tune the rhythm, content, and voice of your synthesized audio."
date: 2026-01-08T12:05:00+02:00
lastmod: 2026-01-08T12:05:00+02:00
draft: true
weight: 50
images: []
categories: ["How-To", "Technical Guide"]
tags: ["codes", "ssml", "synthesis control", "pause", "skip", "set"]
contributors: ["Amiel"]
pinned: false
homepage: false
---

*By Amiel | Jan 8, 2026*

While our UI provides high-level control over voice and speed, fine-grained control over the speech synthesis process often requires embedding instructions directly within the text. TTSReader employs a simple, intuitive set of codes for this purpose. These codes function as a lightweight, user-friendly alternative to more verbose markup languages like SSML.

This guide provides a technical breakdown of each code and its primary use cases.

## `{{pause}}`: Controlling Pacing and Rhythm

The `pause` code instructs the synthesis engine to insert a moment of silence.

### Syntax
*   `{{pause}}`: Inserts a default, short pause (similar to a comma or the end of a sentence).
*   `{{pause:NUMBER_IN_MS}}`: Inserts a pause of a specific duration, where `NUMBER_IN_MS` is an integer representing milliseconds.

### Use Cases
*   **Dramatic Effect:** In storytelling or narration, insert a `{{pause:1500}}` before a key reveal.
*   **Separating Concepts:** Use a `{{pause}}` to create a clear separation between distinct ideas or list items, improving comprehension.
*   **Simulating Natural Speech:** Add short pauses to mimic natural breathing patterns and improve the overall rhythm of the generated audio.

**Example:**
`First, we will discuss the problem. {{pause:1000}} Then, we will outline the solution.`

## `{{skip}}`: Excluding Text from Synthesis

The `skip` code allows you to mark sections of text that should be ignored by the synthesis engine.

### Syntax
*   `{{skip: Text to be ignored... }}`: The engine will not read any of the text contained within the braces after the `skip:` keyword.

### Use Cases
*   **Internal Notes:** Leave comments, instructions, or metadata for yourself within the text that you don't want in the final audio. `{{skip: Check this source later }}`
*   **Hiding Citations:** Keep reference links or citations in your text for completeness, but prevent them from being read aloud. `The study concluded that... {{skip: (Smith et al., 2022) }}`
*   **Abridged Content:** Create a "reader's version" of a document by wrapping longer, less critical sections in `skip` codes.

## `{{set}}`: Dynamic Voice Control

The `set` code is the most powerful of the three, allowing you to modify voice parameters mid-synthesis. This is the key to creating dialogues and other advanced audio effects.

### Syntax
*   `{{set: ... }}`: The content of the `set` code is a JSON object specifying the voice, pitch, rate, and other parameters.

**Important:** Due to its complexity, we strongly advise against writing the `set` code manually. The correct way to use it is to:
1.  Select a voice and its parameters in the TTSReader player.
2.  Click the "copy" button next to the voice selection.
3.  Paste the generated `{{set:...}}` code into your text at the point where you want the voice to change.

### Use Cases
*   **Multi-Voice Dialogues:** Assign a different voice to each character in a script.
*   **Emphasis:** Briefly switch to a voice with a higher pitch or slower rate to emphasize a word or sentence.
*   **Narrator and Character:** Use one voice for narration and a different voice for quoted dialogue.

## Example in Practice

Here is a simple example combining all three codes:

```
{{set: ...voice for Narrator... }}
The detective looked at the evidence.
{{skip: Note to self: describe the evidence later }}
He turned to his partner. {{pause:800}}
{{set: ...voice for Detective... }}
"I think I know who did it."
```

These codes provide a powerful layer of control, enabling developers and content creators to move beyond basic synthesis and produce highly polished, dynamic audio content.

