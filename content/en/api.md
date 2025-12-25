---
title: "TTSReader's Text-To-Speech API"
description: "REST API to Speech Synthesis, Automation"
lead: "Single endpoint to ALL the best AI Speech Engines: OpenAI, Azure, Google, ElevenLabs, and more. Simplest to set up, fast, and powerful."
date: 2025-05-16T08:50:23+02:00
lastmod: 2025-12-25T08:50:23+02:00
draft: false
images: []
sitemap:
  priority: 0.9
---
<br/>

<strong>EXCITING!! Coming 2026 - TTSReader's API is Finally Here!!!</strong>

<h3>Get Started in Less Than a Minute!</h3>

Go to https://ttsreader.com/player/ - open the left sidebar menu - select the "API ACCESS" menu item - click 'Generate API Key' - and you're ready to go! That's ALL there is to it!

<h3>More Info</h3>

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
