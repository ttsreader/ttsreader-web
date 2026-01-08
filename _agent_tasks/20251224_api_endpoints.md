Your missions are:

#1 - Create new endpoints for opening our API to the users.

ALL new endpoints should adhere to the standards and current rtdb structure as explained in /README.md
Do not change rtdb structure.

For every new endpoint, create a new file in /functions/functionNewEndpointName.js and add it to the index.js file.

All endpoints should be protected by the auth middleware as specified in /README.md

All endpoints follow this signature (could be POST or GET):
curl -X POST "https://us-central1-ttsreader.cloudfunctions.net/functionNewEndpointName" \
    -H "Authorization: Bearer eyJhbGcxMaYuFaWmkS6VBfMABB_Ngu8e6qGxoGMqLd5f6sXG1SQyaz6f8avVxZI5DAn27DmfT-bzEyx1LemVitULMBztOgZUMZ7HhjXV4OnkWYp-p7-G8CbRsI1D1qnSZ3pliK16ZTpFPbzaIOwf598y6tT92skYo17fPGO16jJOvh5GTc4gQZFJjyHvsNq8TVBLbQlkuh6004LDU-O2uqRfTFIo9V2mzFANBsTAopJsJ59nFOe9aFhPbc9WDY08ciTb39kXyo99Gzm8RYVdYWn5EbVbRla7Gluc-VASlVl6ALsSwjuZXw" \
    -H "Content-Type: application/json"  \
    --data '{"name": "value" }'

For every new endpoint file, also write the curl commands to run above its name - 2 curls: one to test locally and one on production.

New endpoints to create:
- functionGenerateApiSecret | POST | empty body | Create a new secret for the API (random 20 chars long, only a-zA-Z0-9) - place it in 2 places in rtdb via update() as specified in /README.md. The places in rtdb are /uapi/{newSecret}:{uid} and /users_server_data/{uid}/uapi:{newSecret}
- functionSetWebhookUrl | POST | {"url":"https://mydomain.com/mywebhook"} | Set the webhook URL for the user. Store it in /users_server_data/{uid}/webhook
- functionGetWebhookUrl | GET | empty body | Get the webhook URL for the user.
- functionWebhookHealthTest | GET | empty body | Send a test webhook message to the user's webhook URL (get it from rtdb after user authentication)
- functionGetTtsTaskStatus | GET | {"taskId":"1234567890"} | Get the status of a specific TTS task for the authenticated user. From rtdb /exports/{uid}/{taskId} return status and ALL other info in that node if exists, return 'not_found' otherwise.
- functionRemoveTtsTask | POST | {"taskId":"1234567890"} | Remove a specific TTS task for the authenticated user - this is rather complex - as there are a few ordered & dependent stages: (1) remove the MP3 from its azure storage (the task id maps to the blob name in azure storage /tts-outputs/taskID/ - remove that folder and all its contents), (2) find whether the user has a podcast channel - if yes - get the RSS feed for that channel and remove the episode with the same task id from the feed. Then update podcast RSS on azure storage. (3) remove the task from rtdb /exports/{uid}/{taskId}

#2 - update functionTTS.js and functionTtsLong.js to send notifications
- Create a new helper function in /functions/helpers/ that sends notifications to users if needed.
  The function should take the following parameters [if no email, and no webhookUrl simply returns]
  - uid:
  - data: an object, with the following properties:
    - message:
    - taskId:
    - additionalInfo: {...}
    - trigger: // eg: 'tts', 'ttsLong'
    - endCode: 0 | 1 | -1 => 0=success, 1=failed, -1=unknown/not applicable
  - webhookUrl: optional,
  - email: optional,
  - name: optional, // for email header

- Use the helper function in functionTTS.js and on functionTtsLong.js ONLY IF THE REQUEST CAME with a param in the body: isToSendWebhook: true (So - you'll need to keep a flag for that) && IF USER HAS WEBHOOK IN THEIR RTDB NODE; Location in both functions is upon task completion (successful or failed).
