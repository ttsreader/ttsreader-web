
let firebaseConfig = {
  apiKey: "AIzaSyDqtWayB72nqpH81RMSEgUzFDN1ES0hrcY",
  authDomain: "ttsreader.firebaseapp.com",
  databaseURL: "https://ttsreader.firebaseio.com",
  projectId: "ttsreader",
  messagingSenderId: "656667743185"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

firebase.auth().onAuthStateChanged(function(user) {
  //window.globalMethods.closeModalById("modalSigninVertical");
  if (user) {
    updatePageStateWithParams({
      loading: false,
      uid: user.uid,
      email: user.email
    });
  } else {
    updatePageStateWithParams({
      loading: false,
      uid: user ? user.uid : ""
    });
  }


  if (user) {
    resetPayPalButton(9, user.uid);

    // User is signed in.
    console.log('user signed in ', user);

    listenToDatabaseData(user.uid);

    // let pathWithoutDomain = window.location.href.split("//")[1].split("/")[1];
    // const urlParams = new URLSearchParams(window.location.search);
    // const langParam = urlParams.get('lng');
  } else {
    // No user is signed in.
    console.log('user signed out');
    if (pageState.email) {
      toggleSignIn();
    }
    //document.getElementById("iframeWhenSignedIn").style.display = "none";
    //document.querySelector("main").style.display = "block";
  }

});

function listenToDatabaseData(uid) {
    firebase.database().ref('/users/' + uid).on('value', (snapshot) => {
      let data = snapshot.val();
      console.log('got user data from db: ', data);
      if (data.isPremium) {
        updatePageStateWithParams({
          isPremium: true,
          //epochLicenseExpirationDateInSecs: doc.data() ? (doc.data().hasOwnProperty("epochLicenseExpirationDateInSecs") ? doc.data().epochLicenseExpirationDateInSecs : 0) : 0
        });
      }
    });

    firebase.database().ref('/purchases/' + uid).on('value', (snapshot) => {
      let data = snapshot.val();
      console.log('got purchases data from db: ', data);
      // TODO:
      updatePageStateWithParams({
        //epochLicenseExpirationDateInSecs: doc.data() ? (doc.data().hasOwnProperty("epochLicenseExpirationDateInSecs") ? doc.data().epochLicenseExpirationDateInSecs : 0) : 0
      });
    });
}

