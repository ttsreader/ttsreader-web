All posts are written in markdown format.

All posts are located in /content/en/
If it's a blog post it goes under: /content/en/{name-of-post-url}/ - index.md, -image1.webp, etc.
Documentation posts go under: /content/en/docs/... with the same structure as blog posts.

Every md file starts with front matter - eg - for content/en/blog/new-bug-in-google-chrome-voices/index.md here's its fm:

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


Here's a link to our blog: https://ttsreader.com/blog/
And we also have the user guides here: https://ttsreader.com/docs/guides/
Here's how my author's page looks like: https://ttsreader.com/contributors/ronen-rabinovici/
(FYI - did you see our Stories section? https://ttsreader.com/categories/stories/ )

Each post should have:
Title
Description
Promotional Image (optional, as most of my blogs don't have that, but, we'd like to)
Author
Date
- ... also additional front matter - you'll see in the attached md file - all meta data for the post - simply replace them in the md file.
  Content (in the file comes below the meta data) - well structured content, with section headlines as appropriate, embedded images, links - and if relevant we can also embed YouTube videos (which we'll upload to our channel)

Each post is one .md file - it's a simple text file with the extension md. Should be edited with a simple text editor (notepad as an example), not Word. See attached the .md file that corresponds to https://ttsreader.com/blog/new-single-click-export-text-to-audio-feature/ - I suggest use it as your template and replace in it your own meta data and content.

In md files, there is simple markup for the following:
- links: You will see there how links are constructed: [visible text](link-url) - eg: [TTSReader's new text-to-speech reader](https://ttsreader.com/player/)
- images: ![image_file_name_including_extension](image_file_name_including_extension image-description) - eg:
  ![export_button.jpg](export_button.jpg 'New export text-to-audio button')
- Titles:
  # Some h1 Title
  ## Some Header 2 (section title)
  ### Header 3
... etc.
- Line breaks: <br/>

[Note: All images should be relatively size optimized - ie jpegs or webp (webp is even better) - and if possible no wider than 1000px. If your image editor can export to small size jpegs - that's great. If not - you can send the images to yourself via WhatsApp. Then - download the images from WhatsApp to your PC. It's now size optimized (as WhatsApp compresses images to save bandwidth)]
