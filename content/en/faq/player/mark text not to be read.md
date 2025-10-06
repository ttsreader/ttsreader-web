---
title: "How can I mark text such that it will NOT be read?"
description: "I want some of the text to be ignored by the reader, how can I do that?"
date: 2025-09-08T15:12:22+01:00
lastmod: 2025-09-08T15:12:22+01:00
draft: false
images: []
menu:
  faq:
    parent: "player"
weight: 501
toc: false
---

## Question

I want some of the text to be ignored by the reader, how can I do that?

## Answer

Simply wrap the text you want to be ignored with double curly braces and the word 'skip:' as such `{{skip:` and `}}` for closure. Make sure all the text to be ignore AND the wrappers are in the same single paragraph (i.e. no line breaks).

For example:
```
This is a sample text.

{{skip: This text will be ignored by the reader.}}

Read. {{skip: This text will also be ignored.}} Read some more.

This text will be read.
```
