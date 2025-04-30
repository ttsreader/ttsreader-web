window.app = window.app || {};

class AppRecorder {
  MEDIA_CONSTRAINTS = {
    video: { width: 3, height: 2 },
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      sampleRate: 44100
    }
  };

  TIME_OUT_LIMIT_IN_MINUTES = 60;

  MinutesToMs = (minutes) => minutes*60*1000;

  downloadUrl = function(url) {
    const a = document.createElement('A');
    a.href = url;
    a.download = 'recording.webm';
    a.click();
    a.remove();
  }

  inputParams = {
    optionalOutputAudioElement: null,
    optionalDownloadButton: null,
    optionalOnStart: null,
    optionalOnDone: null,
    optionalOnError: null,
  }

  isRecording = false;
  recordedChunks = [];
  mediaRecorder;
  audioBlobUrl;
  globalTimeout;
  sourceMediaStream;

  constructor(params) {
    if (params) {
      this.inputParams = {...this.inputParams, ...params}
    }
  }

  setUrlToDomElements = (url) => {
    if (this.inputParams.optionalDownloadButton) {
      this.inputParams.optionalDownloadButton.download = 'recording.webm';
      this.inputParams.href = url;
    }

    if (this.inputParams.optionalOutputAudioElement) {
      this.inputParams.optionalOutputAudioElement.src = url;
    }
  }

  saveBlob = (blob) => {
    this.audioBlobUrl = URL.createObjectURL(blob);
    this.setUrlToDomElements(this.audioBlobUrl);
    if (this.inputParams.optionalOnDone) {
      this.inputParams.optionalOnDone(this.audioBlobUrl);
    }
  }

  downloadBlob = () => {
    this.downloadUrl(this.audioBlobUrl);
  }

  toggleCapture = () => {
    if (this.isRecording) {
      this.stopCapture();
    } else {
      this.startCapture();
    }
  }

  stopCapture = () => {
    console.log('stopCapture');
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
    }
    if (this.sourceMediaStream && this.sourceMediaStream.getTracks()) {
      this.sourceMediaStream.getTracks().forEach(function (track) {
        track.stop();
      });
    }

    this.isRecording = false;
    clearTimeout(this.globalTimeout);
  }

  startCapture = () => {
    console.log('startCapture');
    let instance = this;

    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      navigator.mediaDevices.getDisplayMedia(instance.MEDIA_CONSTRAINTS)
        .catch(err => {
          console.error("Error:" + err);
          return;
        })
        .then((stream) => {
          instance.sourceMediaStream = stream;
          instance.handleStream(new MediaStream(stream.getAudioTracks()));
          instance.isRecording = true; // Only if successful
          if (instance.inputParams.optionalOnStart) {
            instance.inputParams.optionalOnStart();
          }
          this.globalTimeout = setTimeout(
            this.stopCapture, instance.MinutesToMs(instance.TIME_OUT_LIMIT_IN_MINUTES)
          );
          stream.addEventListener('inactive', (event) => {
            instance.stopCapture();
          });
        });


    }
  }

  handleStream = (stream) => {
    if (!stream) {
      return;
    }

    // var videoOptions = {mimeType: 'video/webm;codecs=vp9'};
    // if (!MediaRecorder.isTypeSupported(videoOptions.mimeType)) {
    //   console.log(videoOptions.mimeType + ' is not Supported');
    //   videoOptions = {mimeType: 'video/webm;codecs=vp8'};
    //   if (!MediaRecorder.isTypeSupported(videoOptions.mimeType)) {
    //     console.log(videoOptions.mimeType + ' is not Supported');
    //     videoOptions = {mimeType: 'video/webm'};
    //     if (!MediaRecorder.isTypeSupported(videoOptions.mimeType)) {
    //       console.log(videoOptions.mimeType + ' is not Supported');
    //       videoOptions = {mimeType: ''};
    //     }
    //   }
    // }

    let audioOptions = {mimeType: 'audio/webm;codecs=opus'};
    if (!MediaRecorder.isTypeSupported(audioOptions.mimeType)) {
      console.log(audioOptions.mimeType + ' is not Supported');
      audioOptions = {mimeType: 'audio/webm;codecs=vorbis'};
      if (!MediaRecorder.isTypeSupported(audioOptions.mimeType)) {
        console.log(audioOptions.mimeType + ' is not Supported');
        audioOptions = {mimeType: 'audio/webm'};
        if (!MediaRecorder.isTypeSupported(audioOptions.mimeType)) {
          console.log(audioOptions.mimeType + ' is not Supported');
          audioOptions = {mimeType: ''};
        }
      }
    }

    this.mediaRecorder = new MediaRecorder(stream, audioOptions);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = (e) => {
      let blob = new Blob(this.recordedChunks, { 'type' : 'audio/webm;codecs=opus' });
      this.recordedChunks = [];
      this.saveBlob(blob);
    };

    this.mediaRecorder.start();
  }

}

