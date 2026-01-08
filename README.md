To publish - not so easy -
1. 1st build the player...
2. Then - copy whatever needed to static - in 4 places: /player/, /embeds/player/, /images/, /audio/ ...
3. Then build here 'npm run build'
4. Then - move from /static/player/ index.html to REPLACE the generated index.html...

<h1 align="center">
  TTSReader
</h1>

<h3 align="center">
  Free Text to Speech (TTS) Online
</h3>

<p style="text-align: center">
  READS OUT LOUD WEBPAGES, TEXTS, PDFS & EBOOKS WITH NATURAL SOUNDING VOICES. NO NEED TO DOWNLOAD OR INSTALL. SIMPLY PASTE THE TEXT (LINK, OR FILE) AND CLICK PLAY.
  <br/>
  <b>Published on <a href="https://ttsreader.com">https://ttsreader.com</a></b>
</p>

# Useful commands:
- `npm install` - install dependencies - run once after cloning
- `npm start` - start local development server
- `npm run build` - build production version -> /public/ folder

# How to translate:
- [link](_readme/translate.md)

# Write new blog posts steps:
- [link](_readme/write_blog.md)

## TODO:

1. Understand and facilitate Google's 'structured data' for SEO. As explained here:
   - https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data (intro)
   - https://developers.google.com/search/docs/appearance/structured-data/search-gallery (all the types)
2. Make deployment easier. Currently we have to merge between 3 projects.
3.

Website built on a fork of the amazing [doks.netlify.app](https://doks.netlify.app/) Hugo - NPM template
