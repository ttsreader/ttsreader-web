# Goal: Translating the website

## 1st step - Work on the main landing page - just in English - so that strings are coded and not hard-coded
- Location of the html file: `layouts/index.html`
- All strings there should be replaced with the coded version - that goes in the pattern of: `{{ i18n "string" }}`
- All the coded strings should be in the file `i18n/en.yaml`
- Search "get-started" both in `layouts/index.html` and in the file `i18n/en.yaml` for an example of how it's done.

## 2nd step - translate the main page into Spanish

- Copy the file `i18n/en.yaml` into `i18n/es.yaml`
- Translate the strings in `i18n/es.yaml` - Please be careful! As many strings should be taken from the existing Spanish site.

# Switching translation on / off:

- Make sure multilingualMode = true in 'Params.options.multilingualMode' in the file /config/params.toml
- In /config/config.toml - make sure 'disableLanguages' is empty or has the languages you do NOT want to show.
