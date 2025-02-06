// region: pdfparser:
function pdfToText(arrayBuffer, onProgress /*function(pagenum, totalpages) {}*/ ,onDone /*function (fulltext) {}*/) {
  loadPdf(arrayBuffer, onDone);
}

/*loadPdf(url, function(result) {
  console.log("onDone with result: ", result);
  document.getElementById("output_box").innerText = psToString(result);
});*/

/// onDone is a function that receives a json of paragraphs (str, transform, height)
function loadPdf(url, onDone) {
  let state = {
    pages: {},
    lines: [],   // {yTop, yBottom, xStart, xEnd, page, height}
    ps: [], //ps.text = "..."; ps.lineHeight = 10; ps.indent = 10;
    currentPage: 1,
  };

  let totalNumOfPages;

  // Asynchronous download of PDF
  let loadingTask = PDFJS.getDocument(url);
  loadingTask.promise.then(function(pdf) {
    totalNumOfPages = pdf.numPages;
    console.log('PDF loaded with ' + totalNumOfPages + " pages");
    appendNextPagesToLs(pdf, state, onDone);
  }, function (reason) {
    // PDF loading error
    console.error(reason);
  });
}





function appendNextPagesToLs(pdf, state, onDone) {
  pdf.getPage(state.currentPage).then(function (page) {
    state.pages[state.currentPage] = {lines: []};

    page.getTextContent().then(function (txtContent) {
      let textItems = txtContent.items;

      if (textItems.length>0) {
        // Deal with textItems[0]:
        appendBlockToPageLines(textItems[0], state, true);

        // Deal with the rest:
        if (textItems.length>1) {
          for (let i = 1; i < textItems.length; i++) {
            appendBlockToPageLines(textItems[i], state, false);
          }
        }
      }

      console.log(textItems);
      state.pages[state.currentPage].lines = sortLines(state.pages[state.currentPage].lines);

      if (state.currentPage<pdf.numPages) {
        state.currentPage++;
        appendNextPagesToLs(pdf, state, onDone);
      } else {
        if (onDone!=null && onDone!=undefined) {
          let ps = generateParagraphsFromLines(allLinesFromPages(state.pages, pdf.numPages));
          ps = removeFootersAndEmpty(ps);
          onDone(psToString(ps)); // TODO: stringify?
        }
      }
    });
  });
}

function allLinesFromPages(pages, total) {
  let lines = [];

  for (let i = 1; i<=total; i++) {
    let page = pages[i];
    lines.push(...page.lines);
  }

  return lines;
}

function removeFootersAndEmpty(ps) {
  let cleanPs = [];
  for (const p of ps) {
    if (!isParFooter(p) && !isParEmpty(p)) {
      cleanPs.push(p);
    }
  }
  return cleanPs;
}

function isParFooter(p) {
  if (p.pageEnd!=p.pageStart) {
    return false;
  }

  if (p.yTop<40) {
    return true;
  }

  return false;
}

function isParEmpty(p) {
  if (p.str.trim().length==0) {
    return true;
  }

  return false;
}

function generateParagraphsFromLines(lines) {
  let ps = [];

  if (lines==null || lines==undefined || lines.length==0) {
    return ps;
  }

  if (lines.length==1) {
    return lines;
  }

  ps.push(newParagraphFromLine(lines[0]));

  for (let i=0; i<lines.length; i++) {
    if (doesLineBelongToParagraph(ps[ps.length-1], lines[i])) {
      ps[ps.length-1] = glueLineToParagraph(ps[ps.length-1], lines[i]);
    } else {
      ps.push(newParagraphFromLine(lines[i]));
    }
  }

  return ps;
}

function newParagraphFromLine(line) {
  return {
    str: line.str,
    pageStart: line.page,
    pageEnd: line.page,
    height: line.height,
    xStart: line.xStart,
    xEnd: line.xEnd,
    yTop: line.yTop,
    yBottom: line.yBottom,
  }
}

function glueLineToParagraph(p, line) {
  return {
    str: p.str + line.str,
    pageStart: p.pageStart,
    pageEnd: line.page,
    height: p.height,
    xStart: Math.min(p.xStart, line.xStart),
    xEnd: Math.max(p.xEnd, line.xEnd),
    yTop: p.yTop,
    yBottom: line.yBottom,
  }
}

function sortLines(lines) {
  let sortedLines = [];

  if (lines==null || lines==undefined) {
    return [];
  }

  if (lines.length<=1) {
    return lines;
  }

  sortedLines = lines.sort(function (a,b) { return b.yBottom-a.yBottom; });
  return sortedLines;
}

function getNewLineBasedOnBlock(newBlock, pageNum) {
  return {
    page: pageNum,
    str: newBlock.str,
    height: newBlock.height,
    yTop: newBlock.transform[5],
    yBottom: newBlock.transform[5]-newBlock.height,
    xStart: newBlock.transform[4],
    xEnd: newBlock.transform[4] + newBlock.width
  };
}

function glueBlockToLine(line, newBlock) {
  let str = "";
  let height = Math.max(newBlock.height, line.height);
  let xEnd = 0;
  let xStart = 0;
  if (newBlock.transform[4]>line.xStart) {
    // Block comes after line
    xStart = line.xStart;
    xEnd = newBlock.transform[4] + newBlock.width;
    str = line.str;
    if (line.xEnd + height < newBlock.transform[4]) {
      str += " ";
    }
    str += newBlock.str;
  } else {
    // Block comes before line
    xStart = newBlock.transform[4];
    xEnd = line.xEnd;
    str = newBlock.str;
    if (newBlock.transform[4] + newBlock.width + height < line.xStart) {
      str += " ";
    }
    str += line.str;
  }

  return {
    page: line.page,
    str: str,
    height: height,
    yTop: Math.max(newBlock.transform[5], line.yTop),
    yBottom: Math.min(newBlock.transform[5]-newBlock.height, line.yBottom),
    xStart: xStart,
    xEnd: xEnd,
  };
}



function appendBlockToPageLines(newBlock, state, isNewPage) {
  if (newBlock==null || newBlock==undefined) {
    return;
  }

  if (state.pages[state.currentPage].lines.length==0 || isNewPage || !areLineAndBlockSameLine(state.pages[state.currentPage].lines[state.pages[state.currentPage].lines.length-1], newBlock)) {
    let newLine = getNewLineBasedOnBlock(newBlock, state.currentPage);
    state.pages[state.currentPage].lines.push(newLine);
    return;
  } else {
    state.pages[state.currentPage].lines[state.pages[state.currentPage].lines.length - 1] = glueBlockToLine(state.pages[state.currentPage].lines[state.pages[state.currentPage].lines.length - 1], newBlock);
  }
}

function areLineAndBlockSameLine(line, block) {
  let yBottom_block = block.transform[5] - block.height;
  let yTop_block = block.transform[5];

  if (yBottom_block >= line.yBottom && yBottom_block <= line.yTop) {
    return true;
  }

  if (line.yBottom >= yBottom_block && line.yBottom <= yTop_block) {
    return true;
  }

  return false;
}

function doesLineBelongToParagraph(p, line) {

  if (p.height!=line.height) {
    return false;
  }

  if (p.pageEnd==line.page) {
    // Are on same page -> is gap larger than height?
    if (p.yBottom - p.height > line.yTop ) {
      return false;
    }
  }

  return true;
}

function psToString(ps) {
  if (ps==null || ps==undefined || ps.length==0) {
    return "";
  }

  let ans = "";
  for (let i=0; i<ps.length; i++) {
    ans += ps[i].str + "\n\n";
  }

  return ans;
}

// endregion: pdfparser:
//TODO: websites, wiki, ...


// tts

  let Utils = {
  prepareTextForSynthesis: function (text) {
    let decodedText = text;
    decodedText = decodedText.replace("·", ", ");
    decodedText = decodedText.replace("- ", ", ");
    decodedText.trim();
    return decodedText;
  }
};


//Global constants:
const textBoxEl = document.getElementById('text_box');
const ALLOWED_EXTENSIONS = ['txt','json','html','pdf','rtf','epub'];
const DEFAULT_PLACEHOLDER = textBoxEl.getAttribute('placeholder');
const MAX_SEGMENT_LENGTH = 300;

//Global variables:
var shouldSpeak = false; //Can only be changed by pause/play button click or by finishing the whole text
var caretPos = 0;
var wholeText = "";
var lastMsgLength = 0;

var lastEndTime = 0;
var msg = new SpeechSynthesisUtterance('hello world');
msg.volume = 1; // 0 to 1
msg.rate = 0.9; // 0.1 to 10
msg.pitch = 1; //0 to 2
msg.lang = "en-GB";

//Global variables - for epub files.
var book = null;
var currentChapterIndexInApp = 0;
var totalNumberOfChapters = 0;
var isBookOn = false;
var bookTitle = "";

//Global Objects:
var dropbox = document.getElementById("text_box");
var syncCheckbox = document.querySelector('input[name=cloudSyncCheckbox]');
var interval = null;


//register DOM-Events listeners:
document.getElementById("select_language").addEventListener("change",updateVoice);
document.getElementById("select_speed").addEventListener("change",updateSpeed);

document.getElementById('files').addEventListener('change', handleFileSelect, false);

dropbox.addEventListener("dragenter", dragenter, false);
dropbox.addEventListener("dragleave", dragleave, false);
dropbox.addEventListener("dragover", dragover, false);
dropbox.addEventListener("drop", drop, false);

//Listeners to handlers - for epub readings:
document.getElementById("clearBtn").addEventListener("click", handleClearBtn);
document.getElementById("backBtn").addEventListener("click", handleBackBtn);
document.getElementById("nextBtn").addEventListener("click", handleNextBtn);

//Listeners to cloud & premium buttons:
document.getElementById("cloudDownloadBtn").addEventListener("click", handleCloudDownloadBtn);
document.getElementById("cloudUploadBtn").addEventListener("click", handleCloudUploadBtn);
syncCheckbox.addEventListener('change', handleSyncCheckboxToggle);
//document.getElementById('removeAdsBtn').addEventListener('click',invokePremiumDialog);

if (textBoxEl) {
  textBoxEl.addEventListener('keydown',(e)=>{
    if (shouldSpeak) {
      e.preventDefault();
    }
  });

  textBoxEl.addEventListener('input',(e)=>{
    if (shouldSpeak) { //i.e. talking -> do not allow input
      e.preventDefault();
    } else {
      wholeText = textBoxEl.value;
      if (retainUserData) {
        retainUserData(KEYS.wholeText, wholeText);
      }
    }
  });
}

//If no language was previously set - choose it by the interface language:
if (localStorage.getItem("selected_language")===null) { //Just set the default language, and it will update the UI accordingly onload
  switch ( localStorage.getItem("interfaceLang") ) {
    case ("de"):
      retainUserData(KEYS.selected_language,"de-DE");
      break;
    case ("es"):
      retainUserData(KEYS.selected_language,"es-ES");
      break;
    case ("fr"):
      retainUserData(KEYS.selected_language,"fr-FR");
      break;
    case ("ja"):
      retainUserData(KEYS.selected_language,"ja-JP");
      break;
    case ("it"):
      retainUserData(KEYS.selected_language,"it-IT");
      break;
    case ("zh"): //For chinese, I added both zh & cn
    case ("cn"): //For chinese, I added both zh & cn
      retainUserData(KEYS.selected_language,"zh-CN");
      break;
    default:
      retainUserData(KEYS.selected_language,"en-GB");
      break;
  }
}

//Generate dynamic (supported) voices list:
//https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices
  //document.getElementById("play_button").disabled = true;
  wsGlobals.TtsEngine.setListener({
    onInit: () => {
      console.log("initiated");
      document.getElementById("play_button").disabled = false;
      generateVoicesList(wsGlobals.TtsEngine.voices);
      loadStoredVoice();
      console.log("finished init");
    },

    onStart: () => console.log('got to onStart'),

    onDone: () => {onDoneHandler();},
  });
  wsGlobals.TtsEngine.init();

function onDoneHandler() {
  console.log('got to onDone');
  lastEndTime = Date.now();
  //console.log('Finished in ' + event.elapsedTime + ' seconds.');
  if (shouldSpeak) { //i.e. successfully ended message, not paused, move caret forward and initiate next segment of speech if not at end of text
    console.log('should continue');
    setCaretPosition(caretPos + lastMsgLength);
    console.log('syccess on caret = ', caretPos, " of ", wholeText.length);
    if ( caretPos < wholeText.length ) {
      speakOut();
    } else {  //i.e. read the whole text, reached the end
      debugger;
      goToBeginning();
      var isReplayLoop = false; //TODO: replay loop checkbox option
      if (!isReplayLoop) {  //pause as it reached the end and replay is not wanted
        shouldSpeak = false;
        showPausedUi();
      } else {
        speakOut(); //Replay from beginning.
      }
    }
  } else { //Paused on purpose
    if (caretPos >= wholeText.length) { //if caret is at the end caretPos == wholeText.length
      goToBeginning();
    }
  }
}

//Now, that the voices list is generated -> we can load user's retained data:
loadUserPrefs();


//region: global data / storage helper methods:
function persistDynamicBookData() {
  retainUserData(KEYS.isBookOn, isBookOn);
  retainUserData(KEYS.currentChapterIndexInApp, currentChapterIndexInApp);
  retainUserData(KEYS.totalNumberOfChapters, totalNumberOfChapters);
  retainUserData(KEYS.bookTitle, bookTitle);
}

function loadUserPrefs() {
  if (window.isPremium && isPremium()){
    //Allow / set premium enabled stuff.
    //Deal only with app elements. Site elements were dealt with previously on general-site level script.
    document.getElementById('removeAdsBtn').style.display = "none";
  }

  if (localStorage.getItem("shouldCloudSync")=="true"){
    syncCheckbox.checked = true;
  }

  //Load previously selected language / voice:
  //loadStoredVoice();

  //Load voice speed (rate):
  if (localStorage.getItem("select_speed")===null) {
    retainUserData(KEYS.select_speed,"0.9");
  }
  loadStoredRate();

  //Load the text itself:
  isBookOn = localStorage.getItem(KEYS.isBookOn);
  currentChapterIndexInApp = localStorage.getItem(KEYS.currentChapterIndexInApp);
  totalNumberOfChapters = localStorage.getItem(KEYS.totalNumberOfChapters);
  bookTitle = localStorage.getItem(KEYS.bookTitle);
  if (!bookTitle) {
    bookTitle = "";
  }

  if (totalNumberOfChapters!=null && currentChapterIndexInApp!=null) {
    totalNumberOfChapters = parseInt(totalNumberOfChapters);
    currentChapterIndexInApp = parseInt(currentChapterIndexInApp);

    var text = localStorage.getItem(chapterIndexToStorageKey(currentChapterIndexInApp));

    if (isBookOn=='true' && currentChapterIndexInApp!=null && totalNumberOfChapters!=null && text) {
      if (totalNumberOfChapters>0) {
        loadChapter(currentChapterIndexInApp);
        setCaretPositionFromLocalStorage();
        return;
      }
    }
  }

  //If we got here -> we failed to load book -> load whole text:
  if (localStorage.getItem("wholeText")!=null) {
    wholeText = localStorage.getItem("wholeText");
    if (wholeText) {
      textBoxEl.value = wholeText;
      setCaretPositionFromLocalStorage();
    } else {
      textBoxEl.value = "Hello. How are you? Edit this text, or upload a file. Click 'PLAY', and I will read it out loud for you.";
      setCaretPosition(0, true);
    }
    return;
  }


  caretPos = parseInt(localStorage.getItem("caretPos"));

  if (caretPos) {
    if (caretPos > localStorage.getItem("wholeText").length) {
      console.log('BUG!! How can caretPos be larger than text length Genius???');
      setCaretPosition(0);
    }
  }
  setCaretPosition(0);
}

function loadStoredVoice() {
  var voiceName = "";
  var defaultVoice = 'Google UK English Male';

  let storedVoice = localStorage.getItem("selected_voice");
  if (storedVoice) {
    voiceName = storedVoice;
    if (!isVoiceAvailable(voiceName)) {
      voiceName = "";
    }
  }

  if (!voiceName) {
    // Try default for Win Desktops:
    let defaultEnglishVoices = wsGlobals.TtsEngine.voices.filter(function (voice) {
      if (voice.voiceURI.toLowerCase().includes("microsoft") && voice.voiceURI.toLowerCase().includes("david")) {
        return voice;
      }
    });

    if (defaultEnglishVoices && defaultEnglishVoices.length == 1) {
      voiceName = defaultEnglishVoices[0].name;
    }
  }

  if (!voiceName) {
    // Try default for Mac Desktops:
    let defaultEnglishVoices = wsGlobals.TtsEngine.voices.filter(function (voice) {
      if (voice.voiceURI.toLowerCase().includes("daniel")) {
        return voice;
      }
    });

    if (defaultEnglishVoices && defaultEnglishVoices.length >= 1) {
      voiceName = defaultEnglishVoices[0].name;
    }
  }

  if (!voiceName) {
    // Try default for Mac Desktops:
    let defaultEnglishVoices = wsGlobals.TtsEngine.voices.filter(function (voice) {
      if (voice.voiceURI.toLowerCase().includes("alex")) {
        return voice;
      }
    });

    if (defaultEnglishVoices && defaultEnglishVoices.length >= 1) {
      voiceName = defaultEnglishVoices[0].name;
    }
  }

  if (!voiceName) {
    // Try default for Chrome desktop:
    let defaultEnglishVoices = wsGlobals.TtsEngine.voices.filter(function (voice) {
      if (voice.voiceURI.toLowerCase().includes("google") && (voice.voiceURI.toLowerCase().includes(" uk ") || voice.voiceURI.toLowerCase().includes(" gb ")) && voice.voiceURI.toLowerCase().includes(" male")) {
        return voice;
      }
    });

    if (defaultEnglishVoices && defaultEnglishVoices.length >= 1) {
      voiceName = defaultEnglishVoices[0].name;
    }
  }

  if (!voiceName) {
    // Try any en-uk voice for mobiles:
    let defaultEnglishVoices = wsGlobals.TtsEngine.voices.filter(function (voice) {
      let lang = voice.lang.toLowerCase().replace("_", "-").replace("-gb", -"uk");
      if (lang == "en-uk") {
        return voice;
      }
    });

    if (defaultEnglishVoices && defaultEnglishVoices.length >= 1) {
      voiceName = defaultEnglishVoices[0].name;
    }
  }

  if (!voiceName) {
    let defaultEnglishVoices = wsGlobals.TtsEngine.voices.filter(function (voice) {
      let lang = voice.lang.toLowerCase();
      if (lang.startsWith("en")) {
        return voice;
      }
    });

    if (defaultEnglishVoices && defaultEnglishVoices.length >= 1) {
      voiceName = defaultEnglishVoices[0].name;
    }
  }

  if (!voiceName) {
    voiceName = wsGlobals.TtsEngine.voice.name;
  }

  setVoice(voiceName); //Sets it to msg & storage;
  //By now, the stored voice is one available, so set it to the UI:
  selectElement("select_language",localStorage.getItem("selected_voice"));
}

function loadStoredRate() {
  selectElement("select_speed",localStorage.getItem("select_speed"));
}

function setCaretPositionFromLocalStorage() {
  if (!localStorage.getItem("caretPos")) {
    setCaretPosition(0);
    return;
  }

  caretPos = parseInt(localStorage.getItem("caretPos"));
  if (caretPos > localStorage.getItem("wholeText").length) {
    console.log('BUG!! How can caretPos be larger than text length Genius???');
    setCaretPosition(0, true);
  } else {
    setCaretPosition(caretPos, true);
  }
}

function setCaretPosition(pos, doNotFocus) {
  //debugger;
  caretPos = pos;
  retainUserData(KEYS.caretPos, caretPos.toString());
  setSelectionRange(pos, pos);

  if (doNotFocus) {
    return;
  }

  scrollToViewCaret();
}

function updateVoice() {
  setVoice(select_language.value);
}

/*function updateLanguage() {
    retainUserData(KEYS.selected_language,select_language.value);
    if( window.chrome !== null && window.chrome !== undefined && TtsEngine.voices !== null && TtsEngine.voices !== undefined) {
        switch ( select_language.value ) {
            case ("en-GB"):
                msg.voice = TtsEngine.voices.filter(function(voice) { return voice.name == 'Google UK English Male'; })[0];
                break;
            default:
                msg.voice = TtsEngine.voices.filter(function(voice) { return voice.lang == select_language.value; })[0];
                break;
        }
    }
    msg.lang = select_language.value;
}*/

function updateSpeed() {
  retainUserData(KEYS.select_speed, "" + select_speed.value);
  console.log(select_speed.value);
  msg.rate = parseFloat(select_speed.value);
}

function setVoice(voiceName) {
  if (wsGlobals.TtsEngine.voices.filter(function(voice) {return voice.name == voiceName;}).length>0) {
    msg.voice = wsGlobals.TtsEngine.voices.filter(function (voice) {
      return voice.name === voiceName;
    })[0];
    //msg.lang = msg.voice.lang;

    retainUserData(KEYS.selected_voice,msg.voice.name);
    retainUserData(KEYS.selected_language,msg.lang);

  } else if (voiceName!=='Google UK English Male') {
    voiceName = 'Google UK English Male';
    setVoice('Google UK English Male');
  }
}

function clearBookFromLocalStorage() {
  for (var i=0; i<totalNumberOfChapters; i++) {
    try { removeUserData(chapterIndexToStorageKey(i)); }
    catch(err) {console.log(err.message)}
  }
}

function resetSpeechVariables() {
  //TODO: Use ttsreader's logic...
  setCaretPosition(0);
  textBoxEl.value = '';
}

function resetStoredBookVariables() {
  clearBookFromLocalStorage();

  book = null;
  currentChapterIndexInApp = 0;
  totalNumberOfChapters = 0;
  isBookOn = false;
  bookTitle = "";

  persistDynamicBookData();
}
//endregion

//region: UI helper methods:
function scrollToViewCaret() {
  textBoxEl.blur();textBoxEl.focus();
  const event = new Event('keypress');
  textBoxEl.dispatchEvent(event);
  return;
  /*document.getElementById("text_box_mirror").value = wholeText.substring(0,caretPos);
  if (document.getElementById("text_box_mirror").scrollHeight > 341) {
      document.getElementById("text_box").scrollTop = document.getElementById("text_box_mirror").scrollHeight-100;
  } else {
      document.getElementById("text_box").scrollTop = 0;
  }*/
}

function showUiDropboxActivated() {
  textBoxEl.classList.add('activated');
  textBoxEl.setAttribute('placeholder',"Drop Files Here");
}

function showUiDropboxDeactivated() {
  textBoxEl.classList.remove('activated');
  textBoxEl.setAttribute('placeholder',DEFAULT_PLACEHOLDER);
}

function setSelectionRange(selectionStart, selectionEnd) {
  var input = textBoxEl;
  if (input.setSelectionRange) {
    input.setSelectionRange(selectionStart, selectionEnd);
  } else if (input.createTextRange) {
    var range = input.createTextRange();
    range.collapse(true);
    range.moveEnd('character', selectionEnd);
    range.moveStart('character', selectionStart);
    range.select();
  }
  input.blur();
  input.focus();
}

function selectElement(elementId,valueToSelect) {
  var element = document.getElementById(elementId);
  element.value = getClosestValue(elementId, valueToSelect);
}

function showPlayingUi() {
  document.getElementById("speak_button_new").className = "glyphicon glyphicon-pause btn-glyph";
  document.getElementById("speak_button_new").blur();
}

function showPausedUi() {
  document.getElementById("speak_button_new").className = "glyphicon glyphicon-play btn-glyph";
  textBoxEl.focus();
}

function updateBookUi(isBookOn) {
  if (isBookOn) {
    document.getElementById('bookHeader').style.display = 'block';
    document.getElementById('backBtn').style.display = 'inline-block';
    document.getElementById('nextBtn').style.display = 'inline-block';

    document.getElementById('bookTitleLabel').innerText = bookTitle;
    document.getElementById('chapterNumberLabel').innerText = currentChapterIndexInApp + 1;
    document.getElementById('totalChaptersLabel').innerText = totalNumberOfChapters;
  } else {
    document.getElementById('bookHeader').style.display = 'none';
    document.getElementById('backBtn').style.display = 'none';
    document.getElementById('nextBtn').style.display = 'none';
  }
}

//endregion.

//region: Action handlers:

function handleCloudDownloadBtn() {
  if (isSignedIn()) {
    syncFromFirebase();
    return;
  } else {
    invokeSignInDialog();
  }
}

function handleCloudUploadBtn() {
  if (isSignedIn()) {
    syncToFirebase();
    return;
  } else {
    invokeSignInDialog();
  }
}


function handleSyncCheckboxToggle() {
  if (syncCheckbox.checked) {
    if (isSignedIn()) {
      localStorage.setItem("shouldCloudSync", "true");
      syncToFirebase();
      return;
    } else {
      //Do not allow checked if not signedin:
      syncCheckbox.checked = false;
      invokeSignInDialog();
    }
  } else {
    localStorage.setItem("shouldCloudSync", "false");
  }
}

function handleClearBtn () {
  resetStoredBookVariables();
  resetSpeechVariables();
  updateBookUi(isBookOn);
}

function handleBackBtn () {
  setCaretPosition(0);
  if (currentChapterIndexInApp>0) {
    loadChapter(--currentChapterIndexInApp);
  }
}

function handleNextBtn () {
  setCaretPosition(0);
  if (currentChapterIndexInApp<totalNumberOfChapters-1) {
    loadChapter(++currentChapterIndexInApp);
  }
}

function clearText() {
  text_box.value = "";
  wholeText = "";
  retainUserData(KEYS.wholeText, "");
  goToBeginning();
}

function goToBeginning() {
  wholeText = textBoxEl.value;
  lastMsgLength = 0;
  setCaretPosition(0);
  if (shouldSpeak) { //i.e. terminate whatever is in buffer, so to start from beginning
    wsGlobals.TtsEngine.stop();
  }
}

//The following function triggered when play/pause button is clicked
function startOrPause() {
  //If shouldSpeak=true, then it means that the reader is actually reading, then button should pause it.
  if (!shouldSpeak) { //Play:
    //updateLanguage(); //Make sure language is the correct one...
    msg.rate = parseFloat(select_speed.value);
    wholeText = textBoxEl.value || "";
    wholeText = wholeText.trim();
    if (!wholeText.includes(" ") && (wholeText.toLowerCase().startsWith("https://") || wholeText.toLowerCase().startsWith("http://"))) {
      let el = document.getElementById("url_input_box");
      if (el) {
        el.value = wholeText;
        playUrl();
        return;
      }
    } else if (wholeText) { //Caret position is not at the end by definition here (see above 2 lines making sure of that)
      shouldSpeak = true;
      showPlayingUi();
      //Make sure caret is at place not at end, in case caret was moved by user, when not playing, set it to user's choice:
      if (textBoxEl.selectionStart == wholeText.length) {
        setCaretPosition(0);
      } else {
        setCaretPosition(textBoxEl.selectionStart);
      }
      speakOut();
    } else { //There is no text in the box...
      alert ('Please write something for me to read :)'); //TODO: instead of alert - perhaps speak it out?
    }
  } else {    //Pause:
    shouldSpeak = false;
    wsGlobals.TtsEngine.stop();
    showPausedUi();
    //No need to move carret, as it never forwarded (it only forwards upon successful end)
  }

  try {
    if (window.gtag && window.gtag instanceof Function) {
      window.gtag('event', "legacy_player_click_togglePlay", {value: '1'})
    }
  } catch (e) {
  }
}

function dragenter(e) {
  e.stopPropagation();
  e.preventDefault();
  showUiDropboxActivated();
}

function dragover(e) {
  e.stopPropagation();
  e.preventDefault();
}

function dragleave(e) {
  showUiDropboxDeactivated();
}

function drop(e) {
  e.stopPropagation();
  e.preventDefault();

  handleFiles(e.dataTransfer.files);
  showUiDropboxDeactivated();
}

function handleFileSelect(evt) {
  var files = evt.target.files; // FileList object
  handleFiles(files);
}


//endregion.

//region: Open files methods:
function handleFiles(files) {
  if (shouldSpeak) {
    startOrPause();
  }

  var file = files[0];
  var extension = file.name.split('.')[file.name.split('.').length-1];

  switch (extension) {
    case 'txt':
    case 'json':
    case 'rtf':
      loadTextFile(file);
      break;
    case 'pdf':
      if (!window.PDFJS) {
        fetchJsFile("js/pdf.min.js", function() {
          loadPdfFile(file);
        });
      } else {
        loadPdfFile(file);
      }
      break;
    case 'epub':
      if (!window.ePub) {
        fetchJsFile("js/zip.min.js", function() {
          fetchJsFile("https://cdn.jsdelivr.net/epub.js/0.2.15/epub.min.js", function() {
            loadEpubFile(file);
          });
        });
      } else {
        loadEpubFile(file);
      }
      break;
    default:
      alert('File not supported. Try text / pdf / epub files.');
  }
}

function loadEpubFile(file) {
  var reader = new FileReader();
  reader.onload = function(e) {
    loadEpub(e.target.result);
  }.bind(this);

  reader.readAsArrayBuffer(file);
}

function loadTextFile(file) {
  var reader = new FileReader ();
  reader.onloadend = function (ev) {
    dropbox.value = this.result;
    wholeText = textBoxEl.value;
    retainUserData(KEYS.wholeText, wholeText);
    setCaretPosition(0);
  };
  reader.readAsText(file);
}

function loadPdfFile(file) {
  //Convert PDF file to ArrayBuffer and handle it:
  var reader = new FileReader();

  // Closure to capture the file information.
  reader.onload = function (ev) {
    pdfToText(this.result,
      function(pagenum, totalpages) {
        var percentage = Math.round(pagenum/totalpages * 100);
        dropbox.value = 'Loading file: ' + percentage + '%';
      },
      function (fulltext) {
        dropbox.value = fulltext;
        wholeText = textBoxEl.value;
        retainUserData(KEYS.wholeText, wholeText);
        setCaretPosition(0);
      }
    );
  };

  reader.readAsArrayBuffer(file);
}

function loadEpub(url) {
  resetStoredBookVariables();
  book = ePub({ bookPath: url });

  //book.open();
  book.getMetadata().then(function(meta){
    bookTitle = meta.bookTitle;
  });

  book.renderTo("area");
  // Replace area with the id for your div to put the book in

  var chapterIndex = 0;
  var lastLocationCfi = "";

  book.on('renderer:locationChanged', function(locationCfi){
    if (lastLocationCfi != locationCfi) {
      lastLocationCfi = locationCfi;
      console.log(locationCfi);
      var iText = document.getElementById('area').getElementsByTagName('IFRAME')[0].contentWindow.document.body.innerText;
      if (iText.length>0) {
        console.log("chapter text length = " + iText.length);
        retainUserData(chapterIndexToStorageKey(chapterIndex), iText);
        if (chapterIndex==0) {
          setCaretPosition(0)
          loadChapter(0);
        }
        chapterIndex++;
        totalNumberOfChapters = chapterIndex;
        updateBookUi(true);
        persistDynamicBookData();
      }
    }
    book.nextChapter();
  });
}

function loadChapter(index) {
  wholeText = localStorage.getItem(chapterIndexToStorageKey(index));
  textBoxEl.value = wholeText;
  retainUserData(KEYS.wholeText,wholeText);

  currentChapterIndexInApp = index;
  isBookOn = true;

  updateBookUi(true);
  persistDynamicBookData();
}

function findFileType(name) {
  if (name.indexOf('.epub')!=(-1)) {
    return 'epub';
  }

  if (name.indexOf('.txt')!=(-1) || name.indexOf('.json')!=(-1)) {
    return 'txt';
  }

  if (name.indexOf('.pdf')!=(-1)) {
    return 'pdf';
  }
}

//endregion.

//region: Speech runtime & management methods:

msg.onboundary = function(e) {
  console.log('onboundary reached');
};

function speakOut() {
  var remainingText = wholeText.substring(caretPos);
  var SILENCE_CODE = "{{pause}}";
  var indexOfPause = remainingText.indexOf(SILENCE_CODE);

  if (indexOfPause==0) {
    lastMsgLength = SILENCE_CODE.length;
    setTimeout(function () {
      onDoneHandler();
    }, 1000);

    return;
  }

  if (indexOfPause > -1) {
    remainingText = remainingText.substring(0, indexOfPause);
  }

  var endOfSegment = findSegment(remainingText.slice(0,MAX_SEGMENT_LENGTH));
  msg.text = remainingText.slice(0,endOfSegment);
  lastMsgLength = msg.text.length;

  //Mark message that is going to be read
  setSelectionRange(caretPos,caretPos + endOfSegment-1);
  //Once it's ended - it will be unmarked.

  var charsToTrim = ' #.,"/<>()?;:_”“';
  var NEW_LINE="\n";
  while ((charsToTrim.indexOf(msg.text[0]) != -1 || NEW_LINE==msg.text.substring(0,2)) && msg.text.length>0) {
    msg.text=msg.text.slice(1);
  }//Make sure sentence starts...

  if (msg.text.length > 0) {
    wsGlobals.TtsEngine.setVoiceByUri(msg.voice.voiceURI);
    wsGlobals.TtsEngine.setRate(msg.rate);
    wsGlobals.TtsEngine.speakOut(msg.text);
    //console.log('Cut at: ' + endOfSegment);
    //console.log('Say: ' + msg.text);
    //console.log('Next: ' + remainingText);
  } else { //for some reson... as it was all punctuation marks... i.e. caret was not moved either
    onDoneHandler();
  }
}

function handleEndOfText() {
  if (isBookOn) {
    handleNextBtn();
  } else {
    //TODO: ttsreader logic...
  }
}

(function (){
  var btn = document.getElementById("insertPauseBtn");
  if (btn!=null && btn!=undefined) {
    function insertPause() {
      setCaretPosition(textBoxEl.selectionStart);
      wholeText = textBoxEl.value;
      wholeText = wholeText.substring(0, caretPos) + " {{pause}} " + wholeText.substring(caretPos);
      textBoxEl.value = wholeText;
      setCaretPosition(caretPos);
      retainUserData(KEYS.wholeText, wholeText);
      scrollToViewCaret();
    }

    btn.addEventListener('click', function (ev) {
      insertPause();
    });
  }
}());
//endregion.

//region: generic 'static' methods:
function findSegment(str) {

  var temp = -1;
  var validIndexes = [];

  //Find the first break of sentence;
  temp = str.indexOf("\n");
  if (temp>-1) validIndexes.push(temp);

  temp = findFirstRealPeriod(str);
  if (temp>-1) validIndexes.push(temp);

  temp = str.indexOf("!");
  if (temp>-1) validIndexes.push(temp);

  temp = str.indexOf("?");
  if (temp>-1) validIndexes.push(temp);

  if (validIndexes.length>0) {
    temp = Math.min.apply(null,validIndexes);
    if (temp>-1) {
      return temp+1;
    }
  }

  //A strong break was NOT found, so, only if text is too long - we'll look for a softer break - and postpone it to the last:
  if (str.length<MAX_SEGMENT_LENGTH) {
    return str.length+1
  }

  temp = str.lastIndexOf(",");   if (temp>-1) return temp+1;

  //We'll look for an even weaker break:
  temp = Math.max(str.indexOf("("),
    str.indexOf(")"),
    str.indexOf("{"),
    str.indexOf("}"),
    str.indexOf("["),
    str.indexOf("]"));

  if (temp>-1) {
    return temp+1;
  }

  //Finally, we'll just cut it at the last space there:
  temp = str.lastIndexOf(" ");
  if (temp>-1) {
    return temp+1;
  }

  return str.length+1;
}

function findFirstRealPeriod(str){
  for(var i=0; i<str.length;i++) {
    if (str.charAt(i) === ".") {
      //debugger;
      if (i<str.length-1 && "0123456789".indexOf(str.charAt(i+1))!=-1) {
        continue; // ie not a real period, as it is followed by a digit.
      }

      if (i>1 && str.charAt(i-2)==".") {
        continue;
      }


      if (i>2) {
        let sub2 = str.substring(i-2,i).toLowerCase();
        if (sub2=="mr" || sub2=="ms" || sub2=="dr") {
          continue;
        }
      }

      if (i<str.length-1 && ("   [({])}").indexOf(str.charAt(i+1))!=-1 || str.charAt(i+1)=="\n") {
        return i;
      }
    }
  }

  return -1; // -1 if not found
}

function getClosestValue(selectElementId, value) {
  var element = document.getElementById(selectElementId);
  var distance = null;
  var closestValue = element.options[0].value;

  for (var i=0; i<element.options.length; i++) {
    var iValue = element.options[i].value;
    if (iValue== value) {
      return value;
    } else {
      var d = Math.abs(element.options[i].value - value);
      if (distance==null) {
        distance = d;
        closestValue = iValue;
      } else if (d< distance) {
        distance = d;
        closestValue = iValue;
      }
    }
  }
  return closestValue;
}

function sortList(list) {
  if (list == undefined || list==null) {
    return list;
  }

  if( Object.prototype.toString.call( list ) === '[object Array]' ) {
    return list.sort(function (a, b) {
      var nameA = a[1].toUpperCase(); // ignore upper and lowercase
      var nameB = b[1].toUpperCase(); // ignore upper and lowercase
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }

      // names must be equal
      return 0;
    });
  }
}
//endregion.

//region: Specific voice / languages related methods:
function generateVoicesList() {
  var generatedList = [];

  for (var i=0; i<wsGlobals.TtsEngine.voices.length; i++) {
    var item = ["", ""];
    var iVoice = wsGlobals.TtsEngine.voices[i];
    item[0] = iVoice.name;   //Value = voice's name, which is unique (at least up till now).
    if (wsGlobals.TtsEngine.voices.filter(function(voice) {
      return (voice.lang.split('-')[0] == iVoice.lang.split('-')[0]) ;
    }).length > 1) {
      item[1] = codeToLanguage(iVoice.lang) + ", " + cleanName(iVoice.name);
    } else {
      item[1] = codeToLanguage(iVoice.lang);
    }

    if (item[1].length == 0) {
      item[1] = iVoice.name;
    }

    var name = iVoice.name.toLowerCase();
    var postfix = "";
    if (name.includes('google') || name.includes('microsoft') || iVoice.voiceURI.toString().toLowerCase().includes('microsoft')) {
      postfix = " **";
    }

    item[1] += postfix;

    generatedList[i] = item;
  }

  generatedList = sortList(generatedList);

  //console.log(generatedList);

  for (var i = 0; i < generatedList.length; i++) {
    document.getElementById('select_language').options[i+1] = new Option(generatedList[i][1], generatedList[i][0]); // (text,value)
  }

  return generatedList;
}


function cleanName(name) {
  var clean = name;

  name = name.toLowerCase();

  if (name.includes('google')) {
    if (name.includes('female')) {
      clean = "Female";
    } else if (name.includes('male')) {
      clean = "Male";
    } else {
      clean = "G";
    }
  }

  return clean;
}

function codeToLanguage(code) {
  //Get code to dictionary's standard:
  code = code.replace('_','-');

  var dictionary = [
    ['en',    'English, US'],
    ['en-US', 'English, US'],
    ['id-ID', 'Bahasa, Indonesia'],
    ['ms-MY', 'Bahasa, Melayu'],
    ['bg-BG', 'Bulgarian'],
    ['cs-CZ', 'Czech'],
    ['da-DK', 'Danish, Denmark'],
    ['de-DE', 'Deutsch'],
    ['nl-NL', 'Dutch, Netherlands'],
    ['nl-BE', 'Dutch, Belgium'],
    ['en-AU', 'English, Australia'],
    ['en-CA', 'English, Canada'],
    ['en-IN', 'English, India'],
    ['en-IE', 'English, Ireland'],
    ['en-NZ', 'English, New Zealand'],
    ['en-ZA', 'English, S. Africa'],
    ['en-GB', 'English, UK'],
    ['en-US', 'English, US'],
    ['es-AR', 'español, Argentina'],
    ['es-BO', 'español, Bolivia'],
    ['es-CL', 'español, Chile'],
    ['es-CO', 'español, Colombia'],
    ['es-CR', 'español, Costa Rica'],
    ['es-EC', 'español, Ecuador'],
    ['es-SV', 'español, El Salvador'],
    ['es-ES', 'español, España'],
    ['es-US', 'español, Estados Unidos'],
    ['es-GT', 'español, Guatemala'],
    ['es-HN', 'español, Honduras'],
    ['es-MX', 'español, México'],
    ['es-NI', 'español, Nicaragua'],
    ['es-PA', 'español, Panamá'],
    ['es-PY', 'español, Paraguay'],
    ['es-PE', 'español, Perú'],
    ['es-PR', 'español, Puerto Rico'],
    ['es-DO', 'español, R. Dominicana'],
    ['es-UY', 'español, Uruguay'],
    ['es-VE', 'español, Venezuela'],
    ['fr-FR', 'français'],
    ['fr-CA', 'français, Canada'],
    ['hi-IN', 'Hindi'],
    ['is-IS', 'Icelandic'],
    ['zu-ZA', 'IsiZulu'],
    ['it-IT', 'italiano'],
    ['it-CH', 'italiano, Svizzera'],
    ['ko-KR', 'Korean'],
    ['hu-HU', 'Magyar'],
    ['nb-NO', 'Norwegian'],
    ['pl-PL', 'Polski'],
    ['pt-BR', 'Português, Brasil'],
    ['pt-PT', 'Português, Portugal'],
    ['ro-RO', 'română'],
    ['ru-RU', 'России'],
    ['sr-RS', 'Serbian'],
    ['sk-SK', 'Slovak'],
    ['fi-FI', 'Suomi'],
    ['sv-SE', 'Svenska'],
    ['th-TH', 'Thai'],
    ['tr-TR', 'Turkish'],
    ['el-GR', 'Ελληνικά'],
    ['zh-CN', '普通话 (中国大陆)'],
    ['zh-HK', '普通话 (香港)'],
    ['zh-TW', '中文 (台灣)'],
    ['cmn-Hans-CN', '普通话 (中国大陆)'],
    ['cmn-Hans-HK', '普通话 (香港)'],
    ['cmn-Hant-TW', '中文 (台灣)'],
    ['yue-Hant-HK', '粵語 (香港)'],
    ['ja-JP', '日本語'],
    ['he-IL', 'עברית'],
    ['ar-DZ', 'العربية, Algeria'],
    ['ar-EG', 'العربية, Egypt'],
    ['ar-IQ', 'العربية, Iraq'],
    ['ar-JO', 'العربية, Jordan'],
    ['ar-KW', 'العربية, Kuwait'],
    ['ar-LB', 'العربية, Lebanon'],
    ['ar-MA', 'العربية, Morocco'],
    ['ar-QA', 'العربية, Qatar'],
    ['ar-SA', 'العربية, Saudi Arabia'],
    ['ar-AE', 'العربية, UAE']
  ];

  for (var i = 0; i < dictionary.length; i++) {
    if (dictionary[i][0] == code) {
      return dictionary[i][1];
    }
  }

  //If we got here -> code was not found, then search for language alone:
  for (var i = 0; i < dictionary.length; i++) {
    if (dictionary[i][0].split('-')[0] == code.split('-')[0]) {
      return dictionary[i][1].split(',')[0];
    }
  }

  //If we got here -> neither code nor language were found, return input:
  return code;
}

function getVoiceByLanguage(language) {
  if (wsGlobals.TtsEngine.voices.filter(function(voice) { return voice.lang == language; }).length > 0) {
    return wsGlobals.TtsEngine.voices.filter(function (voice) {return voice.lang == language;})[0].name;
  } else {
    return "";
  }
}

function isVoiceAvailable(voiceName) {
  if (wsGlobals.TtsEngine.voices.filter(function(voice) { return voice.name == voiceName; }).length > 0) {
    return true;
  } else {
    return false;
  }
}



//endregion.

