# TTSReader-Plugin

Make your webpages talk!
This is a simple plugin by [TTSReader](https://ttsreader.com/) that uses the [TTSReader engine on npm](https://www.npmjs.com/package/ttsreader) to read out loud any text on your webpage, while it follows along the text being read.

For UI there are 3 options:
1) Use your own custom buttons. Must button is [data-ttsreader-role="togglePlay"].
2) Use our UI controller in YOUR container (so you can control the position and display / hide).
3) Use our default UI for the controller.
Learn how to use the different options on our [plugin-guide page](https://ttsreader.com/plugin/).

## Import:
Simply place the following code into your webpage's `<head>` tag:
`<script src="https://unpkg.com/ttsreader-plugin/main.js" defer></script>`

Optional:
In order to NOT display the controls - you can add the following to the html:
`<ttsplugin style="display: none;"></ttsplugin>`

In order to get notified upon tts ready - add the following script:

      <script>
        window.ttspluginOnReadyListener = function() {
            // DO SOMETHING HERE...
            console.log('ttsplugin is ready');
        };
      </script>


## Test on your site from the developer's console:
```
let el = document.createElement('script')
el.setAttribute('src','https://ttsreader.com/_dev/mit/plugin/20260912/main.js');
el.setAttribute('defer',true);
document.head.appendChild(el);
```

## Developers - how to publish updates to this package?
- Develop in the `src` folder.
- Do a `build` by following instructions in the `README.md` in the top-root folder. (basically `npm run prepublish`).
- Update version in package.json in the dist folder.
- Then `cd dist` and run `npm publish`.
- It will publish just the content of dist, and not the whole project.

## License:

This is NOT an open-source package, but rather a software package you can use on your site, under the following conditions:
1) License is given to use it as is on your site, as described in this file. Do not copy or change.
2) General
   * This is NOT an open-source package.
   * It is published here to be used as a package only.
   * All rights reserved to WellSource Ltd. / Ronen Rabinovici - the developer.
3) What you may do with this package:
   * You may use this package without altering the code.
4) What you may not do with this package:
   * You may not use this package to create a competing product.
   * You may not use this package to create a similar product.
   * You may not use this package to create a derivative product.
   * You may not copy the code or any part of it.
   * You may not reverse-engineer it.


