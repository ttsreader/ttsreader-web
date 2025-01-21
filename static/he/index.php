<!DOCTYPE html>

<html class="no-js consumer" lang="en"> <!-- Page Specific -->
<head>
	<meta http-equiv="content-type" content="text/html; charset=UTF-8" />
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link href="https://speechlogger.appspot.com/images/icon.ico" rel="icon" type="image/x-icon"> 
	<!-- TODO: import language file => and then import language specific header file -->
	<!-- TODO: change the following to language specific + add fb support -->
	<meta content="Fun & accurate text-to-speech reader online. Natural voices, multilingual. Real time. Free & always will be." name="description"/>  
	<title>TTSReader | Reads Out Loud for You</title>

	<style>
		body {
		  overflow-x: hidden;
		  margin: 0;
		  background: url('wood_texture.jpg');
		}
		
		#content {
		  max-width: 960px;
		  min-height: 90%;
		  font-family: Arial, Helvetica, sans-serif ;
		  line-height: 160%;
		  margin: auto auto;
		}
		
		#header {
			position: relative;
			height: 175px;
		}
		
		#phonograph_img {
			width: 140px;
			height: 175px;
			background: url('phonograph_small_crayon.png');
			background-size:100%;
			display: block;
			position: absolute;
			left: 10px;
			z-index: -99;
		}
		
		#phonograph_credit {
			width: 140px;
			height: 175px;
			display: block;
			position: absolute;
			left: 10px;
			border-radius: 20px;
		}
		
		#logo_container {
		  width: 100%;
		  height: 150px;
		}
		
		#logo {
		  display: block;
		  position: static;
		  width: 100%;
		  max-width: 500px;
		  height: 150px;
		  margin: 10px auto;
		  margin-top: 10px;      
		  background-image: url('https://speechlogger.appspot.com/images/20150607_long_header.png');
		  background-repeat: no-repeat;
		  background-color: transparent;
		  background-size: contain;
		}	
		
		#access {
		  display: block;
		  width: 100%;
		  line-height:220%;
		}

		#access ul {    
		  list-style: none;
		  text-align: center;
		  font-weight: bold;
		  font-size: 110%;
		  padding: 0;
		}

		#access li {
		  display: inline-block;
		  margin: 5px 16px;
		  background-color: rgba(151, 209, 253, 0.4); 
		  border: 1px gray;
		  border-radius: 20px;
		  padding: 7px 20px;
		  box-shadow: 0 3px 3px rgba(0,0,0,0.5);  
		}

		#access li:hover {
		  cursor: pointer;
		  background-color: rgba(151, 209, 253, 1);
		}

		#access li > a {
			color: black;
			text-decoration: none;
		}
				
		h1,h2 {
			text-align: center;
			line-height: 150%;
		}
		
		h1 {
			vertical-align: middle;
			text-shadow: 2px 2px #FFFFFF;
			color: #7D0303;
		}
		
		h2 {
			clear: both;
			opacity: 0.8;
		}
		
		.ad_728x15 {
			clear: both;
			width: 728px;
			height: 15px;
			margin: 20px auto;
		}
		
		.ad_728x90 {
			clear: both;
			width: 728px;
			height: 90px;
			margin: 20px auto;
		}
		
		.ad_120x600 {
			width: 120px;
			height: 600px;
			position: absolute;
			right: -150px;
			bottom: 0;
		}
		
		.addthis_sharing_toolbox {
			position: absolute;
			top: 20px;
			right: 20px;
			margin-left: auto;
			margin-right: auto;
		}
		
		#application {
			position: relative;
			clear: both;
			max-width: 90%;
			padding: 20px;
			border-radius: 10px 10px 10px 10px;
			margin: 0 auto;
			background-color: rgb(255, 236, 199);
		}
		
		#buttons_row {
			text-align: center;
			height: 100px;
			margin: 20px auto;
			margin-top: 0;
			width: 100%;
			position: relative;
		}
		
		#speak_button {
			opacity: 0.8;
			width: 100px;
			height: 100px;
			margin: 0 auto;
			background-color: transparent;
			background-image: url('start_button.png');
			cursor: pointer;
			border-radius: 50px;
		}
		
		#speak_button:hover {
			opacity: 1;
		}
		
		#left_buttons {
			position: absolute;
			top: 0;
			left: 0;
			width: 33%;
			text-align: center;
		}

		#reset_button {
			opacity: 0.8;
			width: 100px;
			height: 100px;
			margin: 0 auto;
			background-color: transparent;
			background-image: url('reset_button.png');
			cursor: pointer;
			border-radius: 50px;
		}
		
		#reset_button:hover {
			opacity: 1;
		}
		
		#right_buttons {
			position: absolute;
			top: 30px;
			right: 0;
			width: 33%;
			text-align: center;
		}
		
		#text_box {
			height: 300px;
			background-color: white;
			padding: 20px;
			overflow-y: scroll;
		}
		
		/* text_box scrollbar */
		#text_box::-webkit-scrollbar {
			width: 16px;
		}
		 
		/* Track */
		#text_box::-webkit-scrollbar-track {
			-webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3); 
			-webkit-border-radius: 10px;
			border-radius: 10px;
		}
		 
		/* Handle */
		#text_box::-webkit-scrollbar-thumb {
			-webkit-border-radius: 10px;
			border-radius: 10px;
			background: rgba(0,0,0,0.3); 
			-webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.5); 
		}
		#text_box::-webkit-scrollbar-thumb:hover {
			-webkit-border-radius: 10px;
			border-radius: 10px;
			background: rgba(0,0,0,0.6); 
			-webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.5); 
		}
		
		#footer {
		  width: 100%;
		  background-color: #7D0303;
		}

		#footer_menu {
			text-align: center;	
			width: 100%;
			border-top: solid 1px gray;
		}

		#footer_menu a {
			display: inline-block;
			padding: 10px 20px;
			margin: 0 20px;
			border-radius: 20px;
			font-weight: bold;
			color: rgb(255, 236, 199);
		}

		#languageLinks a {
		  display: inline-block;
		  padding: 10px 10px;
		  margin: 0 2px;
		  border-radius: 20px;
		  font-weight: normal;
		  color: green;
		}

		#footer_menu a:hover {
			background-color: rgb(255, 236, 199);
			color: black;
		}
		
		
	</style>
	
</head>

<body>
	<div id="content">
	
		<!--<div id="logo_container">
			<a id="logo" href="https://ttsreader.appspot.com/"></a>
		</div>-->
		
		<div id="header">
			<div class="addthis_sharing_toolbox"></div> <!-- Go to www.addthis.com/dashboard to customize your tools -->
			<a id="phonograph_img" href="https://commons.wikimedia.org/wiki/File:VictorVPhonograph.jpg#/media/File:VictorVPhonograph.jpg" title="Victor Phonograph, by Norman Bruderhofer - Collection of John Lampert-Hopkins. Licensed under CC BY-SA 2.5 via Wikimedia Commons"></a>
			<a id="phonograph_credit" href="https://commons.wikimedia.org/wiki/File:VictorVPhonograph.jpg#/media/File:VictorVPhonograph.jpg" title="Victor Phonograph, by Norman Bruderhofer - Collection of John Lampert-Hopkins. Licensed under CC BY-SA 2.5 via Wikimedia Commons"></a>
			<h1><br>TTSReader<br>Reads Text Out Loud</h1>
		</div>

		<h2>Fun & accurate text-to-speech reader online. Natural voices, multilingual. Real time.  &nbsp;&nbsp;  Free & always will be. Enjoy listening.</h2>
		
		<div class="ad_728x15 ad">
			<script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
			<!-- ad_728x15_notepad -->
			<ins class="adsbygoogle"
				 style="display:inline-block;width:728px;height:15px"
				 data-ad-client="ca-pub-5030295218223297"
				 data-ad-slot="8822269200"></ins>
			<script>
			(adsbygoogle = window.adsbygoogle || []).push({});
			</script>
		</div>
		
		<div id="application">
		
			<div class="ad_120x600 ad">
				<script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
				<!-- ad_120x600 -->
				<ins class="adsbygoogle"
					style="display:inline-block;width:120px;height:600px"
					data-ad-client="ca-pub-5030295218223297"
					data-ad-slot="8519560801"></ins>
				<script>
				(adsbygoogle = window.adsbygoogle || []).push({});
				</script>
			</div>

			<!-- TODO: enable color change:
			<div id="colorpicker"> 
				<div class="colorButtons colorGradientBack"><input type="color" id="favcolor" onchange="changeColor('custom');"></div>
				<div class="colorButtons blueBack" onclick="changeColor('blue')"></div>
				<div class="colorButtons greenBack" onclick="changeColor('green')"></div>
				<div class="colorButtons redBack" onclick="changeColor('red')"></div>
				<div class="colorButtons whiteBack" onclick="changeColor('white')"></div>
			</div>
			-->
			
			<div id="buttons_row">
			<!-- TODO: enable mp3 download
			<div id="download_mp3_button"></div>
			-->
				<div id = "left_buttons">
					<div id="reset_button" onclick="reset();" title="Start from Beginning"></div>
				</div>
				
				<div id="speak_button" onclick="startOrPause();" title="Play / Pause"></div>
				
				<div id = "right_buttons">
					<select id="select_language" onchange="updateLanguage();">
						<option value="en-GB" selected="true">UK English</option>
						<option value="en-US">US English</option>
						<option value="es-ES">Español</option>
						<option value="fr-FR">Français</option>
						<option value="it-IT">Italiano</option>
						<option value="de-DE">Deutsch</option>
						<option value="ja-JP">日本語</option>
						<option value="ko-KR">한국의</option>
						<option value="zh-CN">中国的</option>
					</select> &nbsp;&nbsp;
					<select id="select_speed" onchange="updateSpeed();">
						<option value=0.9>Normal Speed</option>
						<option value=0.7>Slow</option>
						<option value=1.3>Fast</option>
					</select>				
				</div>
			</div>
			
			<div id="text_box" contenteditable="true">
			</div>		
		</div>

		<div class="ad_728x90 ad">
		<script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
		<!-- ad_728x90 -->
		<ins class="adsbygoogle"
			 style="display:inline-block;width:728px;height:90px"
			 data-ad-client="ca-pub-5030295218223297"
			 data-ad-slot="9173644800"></ins>
		<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
		</div> 
		
		<div class="ad_728x15 ad">
			<script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
			<!-- ad_728x15_notepad -->
			<ins class="adsbygoogle"
				 style="display:inline-block;width:728px;height:15px"
				 data-ad-client="ca-pub-5030295218223297"
				 data-ad-slot="8822269200"></ins>
			<script>
			(adsbygoogle = window.adsbygoogle || []).push({});
			</script>
		</div>
	</div>
	
	<div id="footer">
		<div id="footer_menu">
			<a id="contact_us" href="mailto:admin@speechlogger.com" target="_blank">Contact Us</a> 
			<!--
			<br>
			<div id="languageLinks">
			  <b><a>Interface Languages:</a></b>
			  <a href="https://speechlogger.appspot.com/en/">English</a>
			  <a href="https://speechlogger.appspot.com/es/">español</a>
			  <a href="https://speechlogger.appspot.com/fr/">français</a>
			  <a href="https://speechlogger.appspot.com/de/">Deutsch</a>
			  <a href="https://speechlogger.appspot.com/ru/">России</a>
			  <a href="https://speechlogger.appspot.com/ja/">日本語</a>
			  <a href="https://speechlogger.appspot.com/zh/">中國</a>
			  <a href="https://speechlogger.appspot.com/ro/">română</a>
			  <a href="https://speechlogger.appspot.com/he/">עברית</a>
			</div>
			-->
		</div>
	</div>

	<script>
		if (!('speechSynthesis' in window)) {
		// Synthesis not supported. 
			alert('Speech Synthesis is not supported by your browser. Switch to Chrome.');
		} 
		
		<!-- TODO: save locally language and preferences... -->
		var shouldSpeak = false;
		var wholeText = document.getElementById("text_box").innerText;
		var counter = 0;
		var lastStartTime = 0;
		var lastEndTime = 0;
		var msg = new SpeechSynthesisUtterance('hello world');
		msg.volume = 1; // 0 to 1
		msg.rate = 0.9; // 0.1 to 10
		msg.pitch = 1; //0 to 2
		msg.lang = "en-GB";

		msg.onstart = function(e) {
			var expectedTime = msg.text.length * 100 / msg.rate;
			lastStartTime = Date.now();
			setTimeout(function(){ 
				if ((Date.now()-expectedTime-900) >= lastEndTime && shouldSpeak) { //i.e. end was not fired since we began, & not because paused
					speechSynthesis.cancel();
				}
			}, expectedTime + 1000);
		};
		
		msg.onend = function(e) {
			lastEndTime = Date.now();
			console.log('Finished in ' + event.elapsedTime + ' seconds.');
			if ( wholeText.length>0 && shouldSpeak ) speakOut();
			else { //finished narrating the wholetext, or paused on purpose
				shouldSpeak = false;
				document.getElementById("speak_button").style.backgroundImage = "url('start_button.png')";
				if (wholeText.length == 0) counter = 0;
			}
		};
		
		msg.onerror = function(e) {
			speechSynthesis.cancel();
			if (shouldSpeak) speakOut();
		};
		 
		msg.onboundary = function(e) {
			console.log('onboundary reached');
		};
		
		
		function updateLanguage() {
			var e = document.getElementById("select_language");
			msg.lang = e.options[e.selectedIndex].value;
		}
		
		function updateSpeed() {
			var e = document.getElementById("select_speed");
			msg.rate = e.options[e.selectedIndex].value;
		}
		
		function reset() {
			counter = 0;
			wholeText = document.getElementById("text_box").innerText;
			if (shouldSpeak) {
				speechSynthesis.cancel();
			}
		}
		
		function startOrPause() {
			if (!shouldSpeak) { //Start speaking:
				if ((counter==0 && document.getElementById("text_box").innerText.length>0) || wholeText.length>0) {
					document.getElementById("speak_button").style.backgroundImage = "url('pause_button.png')";
					shouldSpeak = true;
					speakOut();
				} else {
					alert ('Please write something for me to read :)');
				}
			} else {    //Pause:
				shouldSpeak = false;
				speechSynthesis.cancel();
				wholeText = msg.text + wholeText;
				//counter = counter - msg.text.length;
				document.getElementById("speak_button").style.backgroundImage = "url('start_button.png')";
			}
		}
		
		function speakOut() {
		<!-- TODO: websites, wiki, upload files, ... -->
			if (counter == 0) {
				wholeText = document.getElementById("text_box").innerText;
			}
			var endOfSegment = findSegment(wholeText.slice(0,200));
			msg.text = wholeText.slice(0,endOfSegment);
			var allowedStartingChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
			while (allowedStartingChars.indexOf(msg.text[0]) == -1 && msg.text.length>0) { 
				msg.text=msg.text.slice(1);
			}//Make sure sentence starts...
			
			wholeText = wholeText.slice(endOfSegment);
			counter = counter + endOfSegment;
			
			if (msg.text.length > 0 && shouldSpeak) { 
				speechSynthesis.speak(msg);
				console.log('Cut at: ' + endOfSegment);
				console.log('Say: ' + msg.text);
				console.log('Next: ' + wholeText);
			} else {
				if (wholeText.length>0 && shouldSpeak) speakOut();
				else { 
					counter = 0;
					shouldSpeak = false;
					document.getElementById("speak_button").style.backgroundImage = "url('start_button.png')";
				}
			}
		}
		
		function findSegment(str) {
			var i = str.length+1;
			var temp = -1;
			temp = str.indexOf("\n");  if (temp>-1 && temp < i) i = temp+1; //Find the first break of sentence;
			temp = str.indexOf(". ");  if (temp>-1 && temp < i) i = temp+2;
			temp = str.indexOf("! ");  if (temp>-1 && temp < i) i = temp+2;
			temp = str.indexOf("? ");  if (temp>-1 && temp < i) i = temp+2;
			temp = str.indexOf(": ");  if (temp>-1 && temp < i) i = temp+2;
			temp = str.indexOf(".\n"); if (temp>-1 && temp < i) i = temp+2;
			temp = str.indexOf("!\n"); if (temp>-1 && temp < i) i = temp+2;
			temp = str.indexOf("?\n"); if (temp>-1 && temp < i) i = temp+2;
			temp = str.indexOf(":\n"); if (temp>-1 && temp < i) i = temp+2;
			temp = str.indexOf(".[");  if (temp>-1 && temp < i) i = temp+2;
			temp = str.indexOf("![");  if (temp>-1 && temp < i) i = temp+2;
			temp = str.indexOf("?[");  if (temp>-1 && temp < i) i = temp+2;
			temp = str.indexOf(":[");  if (temp>-1 && temp < i) i = temp+2;
			
			if (i<=str.length) return i;
			//Otherwise continue:
			
			temp = str.indexOf(", ");  if (temp>-1 && temp < i) i = temp+2;
			temp = str.indexOf("(");   if (temp>-1 && temp < i) i = temp+1;
			temp = str.indexOf(")");   if (temp>-1 && temp < i) i = temp+1;
			temp = str.indexOf("[");   if (temp>-1 && temp < i) i = temp+1;
			temp = str.indexOf("]");   if (temp>-1 && temp < i) i = temp+1;
			if (i<=str.length) return i;
			//Otherwise continue:
			
			temp = str.indexOf(" ");  if (temp>-1 && temp < i) i = temp+1;
			if (i<=str.length) return i;
			//Otherwise continue:
			
			i = str.length;
			return i;
		}
		
		/* TODO:
			Timeout - to cancel speech
			pause on ".", "?", "...", "Line breaks"
			Either native only, or stop and restart other voices, otherwise it stops after ~2 lines...
		*/
		
	</script>
	
	<script>		
	//Google analytics
	  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
	  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
	  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
	  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

	  ga('create', 'UA-47292499-1', 'speechlogger.appspot.com');
	  ga('send', 'pageview');
	</script>
	<!-- Go to www.addthis.com/dashboard to customize your tools -->
	<script type="text/javascript" src="//s7.addthis.com/js/300/addthis_widget.js#pubid=ra-4fe89bcc181f95ed" async="async"></script>
</body>
</html>
