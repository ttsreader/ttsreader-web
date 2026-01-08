---
title: "TTSReader's Text-To-Speech API"
description: "REST API to Speech Synthesis, Automation"
lead: "Single endpoint to ALL the best AI Speech Engines: OpenAI, Azure, Google, ElevenLabs, and more. Simplest to set up, fast, and powerful."
date: 2025-05-16T08:50:23+02:00
lastmod: 2025-12-28T08:50:23+02:00
draft: false
images: []
sitemap:
  priority: 0.9
---
<br/>

<strong>EXCITING!! Coming 2026 - TTSReader's API is Finally Here!!!</strong>

Happy to let you know that our initial public Text-To-Speech-API is now available for you. It uses the exact same endpoint as our very own TTSReader Player, that serves thousands of users every day. That means zero latency, 100% reliability.

<h2>TTS API - Zero to Hero in Less Than a Minute</h2>

Go to [https://ttsreader.com/player/](https://ttsreader.com/player/) - open the left sidebar menu - select the "API ACCESS" menu item - click 'Generate API Key' - then - TTSReader will generate the API call using the real TTSReader Endpoint - and your Real generated API Key. All you have to do is copy that code, use your own text and that's it - you're ready to go! That's ALL there is to it - and it all takes less than a minute!

<h2>Why Choose TTSReader's API?</h2>
<p>There are many APIs out there - why would you choose TTSReader's? Good question! Here's exactly why:</p>

Its main advantages:
1. Super simple and straightforward. No complex setup. Get going in less than a minute - that includes generating your API key, setting up payment method and actually testing it.
2. Extremely affordable. For example - you can purchase 3 Miliion characters from TTSReader, for just $39 - whereas buying the same from Azure would cost you $45. Most other vendors would cost even more. Our prices go even lower if you purchase more.
3. Highest quality AI voices, for multipurpose use cases. You can use ANY Azure Neural AI voice - with our API - simply by specifying the voice's display name. Literally - there are more than 600 available voices. See Azure's voice gallery here - <a href="https://speech.azure.cn/portal/voicegallery" target="_blank" style="color: #007bff;">https://speech.azure.cn/portal/voicegallery</a>
4. All payments are either prepaid - or based on a monthly subscription with a pre-fixed amount. No surprises, no unexpected bills. Need more? No problem - only you decide AHEAD of time - how much you want to purchase.
5. *Low Latency* - the API is super fast, it's the exact same endpoint as our TTSReader Player - so - it's super fast.
6. *Super Reliable* - 100% uptime, just like our TTSReader Player. You enjoy our very own backend infrastructure, that serves thousands of users every day - so - it's rock solid reliable.

<h3>More Info & Example Code</h3>

<style>
:root {
  --primary-color: #ff6b6b;
  --text-color-secondary: #aaa;
  --card-background: #2d3748;
  --border-color: #4a5568;
}
</style>

<!-- Code Examples with secret -->
<div style="padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);">
  <h3 style="margin-bottom: 20px;">API Examples</h3>

  <!-- CURL Example -->
  <div style="margin-bottom: 25px;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <h4 style="margin: 0;">cURL Example</h4>
    </div>
    <pre style="background: #1e1e1e; color: #d4d4d4; padding: 15px; border-radius: 6px; overflow-x: auto; font-size: 13px; line-height: 1.4;">curl -X POST "https://ttsreader.com/api/ttsSync" \
-H "Authorization: Bearer UAPI-<span style="color: #4fc3f7;">YOUR_SECRET_KEY</span>" \
-H "Content-Type: application/json" \
--data '{"text": "Hello world, this is a test from TTSReader API.","lang": "en-US", "voice": "Nova Premium", "rate":1, "quality": "48khz_192kbps" }' \
--output "hello.mp3"</pre>
  </div>

  <!-- JavaScript Example -->
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <h4 style="margin: 0;">JavaScript Example</h4>
    </div>
    <pre style="background: #1e1e1e; color: #d4d4d4; padding: 15px; border-radius: 6px; overflow-x: auto; font-size: 13px; line-height: 1.4;">
    <span style="color: #569cd6;">const</span> <span style="color: #9cdcfe;">response</span> = <span style="color: #569cd6;">await</span> <span style="color: #dcdcaa;">fetch</span>(<span style="color: #ce9178;">'https://ttsreader.com/api/ttsSync'</span>, {
        <span style="color: #9cdcfe;">method:</span> <span style="color: #ce9178;">'POST'</span>,
        <span style="color: #9cdcfe;">headers:</span> {
            <span style="color: #ce9178;">'Authorization'</span>: <span style="color: #ce9178;">'Bearer UAPI-<span style="color: #4fc3f7;">YOUR_SECRET_KEY</span>'</span>,
            <span style="color: #ce9178;">'Content-Type'</span>: <span style="color: #ce9178;">'application/json'</span>
        },
        <span style="color: #9cdcfe;">body:</span> <span style="color: #dcdcaa;">JSON.stringify</span>({
            <span style="color: #9cdcfe;">text:</span> <span style="color: #ce9178;">"Hello world, this is a test from TTSReader API."</span>,
            <span style="color: #9cdcfe;">lang:</span> <span style="color: #ce9178;">"en-US"</span>,
            <span style="color: #9cdcfe;">voice:</span> <span style="color: #ce9178;">"Nova Premium"</span>,
            <span style="color: #9cdcfe;">quality:</span> <span style="color: #ce9178;">"48khz_192kbps"</span>,
            <span style="color: #9cdcfe;">rate:</span> <span style="color: #b5cea8;">1</span>
        })
    });
</pre>
</div>

  <br/>
  <h3 style="margin-bottom: 15px;">API Parameters</h3>
  <ul style="line-height: 1.8; margin-left: 20px;">
    <li><b>text</b> (required): The text to convert to speech</li>
    <li><b>lang</b> (required): Language code (e.g., "en-US", "es-ES")</li>
    <li><b>voice</b> (required): The name of the voice is as shown in the voice-selector UI. In addition ALL Azure's Neural AI voices are supported. So, you're welcome to go to Azure's voice gallery at <a href="https://speech.azure.cn/portal/voicegallery" target="_blank" style="color: #007bff;">https://speech.azure.cn/portal/voicegallery</a> and select a voice from there.</li>
    <li><b>rate</b> (optional): Speech rate (0.5 to 2.0, default: 1.0)</li>
    <li><b>quality</b> (optional): "48khz_192kbps" or empty (which defaults to 24kHz)</li>
  </ul>
  <br/>
</div>

<br/>

<!-- API Documentation -->
<div style="padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid var(--border-color);">
  <h3 style="margin-bottom: 15px;">Important Notes</h3>
  <ul style="line-height: 1.8; margin-left: 20px;list-style: disc;">
    <li>Limit characters to a few thousands (exact limit is unknown, but 5k characters is safe), as this is synchronous API, that times out after 5 minutes. So, if it can generate the MP3 within 5 minutes it will - otherwise it will time out before MP3 is ready - but since the AI is started - it will consume credits.</li>
    <li>Async API is coming soon for long-texts, and for supporting multiple voices in a single file.</li>
    <li>The ttsSync endpoint does not support voice-setters (ie: {{set: voice, language, rate}}) within the text. So, a single voice - set in the API request.</li>
    <li>The name of the voice is as shown in the voice-selector UI. In addition ALL Azure's Neural AI voices are supported. So, you're welcome to go to Azure's voice gallery at <a href="https://speech.azure.cn/portal/voicegallery" target="_blank" style="color: #007bff;">https://speech.azure.cn/portal/voicegallery</a> and select a voice from there.</li>
    <li>If you need anything else, or have feedback, suggestions, please let us know at <span style="color: orangered;">contact@ttsreader.com</span></li>
  </ul>
</div>

<div style="text-align: center; margin-bottom: 30px;">
<button style="padding: 10px 30px; border-radius: 10px; font-size: large;" onclick="window.location.href='/player/'">GET TEXT TO SPEECH API NOW</button>
</div>
