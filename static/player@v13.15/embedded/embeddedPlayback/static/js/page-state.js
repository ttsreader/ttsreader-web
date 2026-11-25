let licenseInterpretations = {
  UNKNOWN: "UNKNOWN",
  NONE: "NONE",  // Queried Google (if prev was 2.0.1) and queried SN and got response none from both
  LIFETIME: "LIFETIME",  // Queried Google (if prev was 2.0.1) and this was the response
  SUBSCRIPTION: "SUBSCRIPTION",  // Queried SN - or got notified by SN - and this was the response + there's enough time till renewal
  SUBSCRIPTION_SOON_OVER: "SUBSCRIPTION_SOON_OVER", // // Queried SN - or got notified by SN - and the expiration date is soon (± a month)
  SUBSCRIPTION_OVER: "SUBSCRIPTION_OVER", // Queried SN - or got notified by SN - and the expiration date is over
}

let classNamesForUiUpdates = {
  showWhenOffline: "offline",
  showWhenLoading: "loading",
  showWhenLoaded: "loaded",
  showWhenSignedIn: "signed-in",
  showWhenSignedOut: "signed-out",
  showWhenLicenseNone: "license-none",
  showWhenLicenseExpired: "license-expired",
  showWhenLicenseLife: "license-life",
  showWhenLicenseSoonToExpire: "license-soon-to-expire",
  showWhenLicenseUnknown: "license-unknown",
  showWhenLicenseSubscriptionValid: "license-subscription-valid",
}

let memoryEpochLicense = Number.parseFloat("" + localStorage.getItem("epochLicenseExpirationDateInSecs"));
memoryEpochLicense = isNaN(memoryEpochLicense) ? -1 : memoryEpochLicense;

let pageState = {
  isOffline: !window.navigator.onLine,
  loading: true,
  email: "",
  uid: "",
  epochLicenseExpirationDateInSecs: memoryEpochLicense  // -1 = unknown, 0 = none, 3000000000 or above = life
}

window.addEventListener('online', () => updatePageStateWithParams({isOffline: false}));
window.addEventListener('offline', () => updatePageStateWithParams({isOffline: true}));

function updatePageStateWithParams(params) {
  console.log('updating state with: ', params);
  if (!params) {
    params = {};
  }

  let props = Object.getOwnPropertyNames(params);

  if (props && props.length>0) {
    for (const key of props) {
      if (params[key]!=undefined) {
        if (key=="epochLicenseExpirationDateInSecs") {
          let latestEpoch = Math.max(pageState[key], params[key]);
          pageState[key] = latestEpoch;
          localStorage.setItem("epochLicenseExpirationDateInSecs", pageState[key]);
          if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
            // Published extension:
            chrome.runtime.sendMessage("nncconplehmbkbhkgkodmnkfaflopkji", {message: "epochLicenseExpirationDateInSecs", data: latestEpoch}, function(){});
          }

        } else {
          pageState[key] = params[key];
        }
      }
    }
  }

  console.log('new state: ', pageState);
  updateUiByState(pageState);
}

function interpretLicenseState(epochToExpirationSecs) {
  const ONE_MONTH_IN_SECONDS = 3600 * 24 * 30;

  if (!epochToExpirationSecs) {
    return licenseInterpretations.NONE;
  } else if (epochToExpirationSecs<0) {
    return licenseInterpretations.UNKNOWN;
  } else if (epochToExpirationSecs>=3000000000) {
    return licenseInterpretations.LIFETIME;
  } else {
    let timeInSecsTillExpiration = epochToExpirationSecs - Date.now()/1000 ;
    if (timeInSecsTillExpiration<=0) {
      return licenseInterpretations.SUBSCRIPTION_OVER;
    } else if (timeInSecsTillExpiration >= ONE_MONTH_IN_SECONDS) {
      return licenseInterpretations.SUBSCRIPTION;
    } else {
      return licenseInterpretations.SUBSCRIPTION_SOON_OVER;
    }
  }
}

function updateUiByState(newState) {

  let labelEls = document.querySelectorAll("[data-ws-label]");
  if (labelEls && labelEls.length>0) {
    for (const el of labelEls) {
      if (el.getAttribute("data-ws-label")=="epochAsDate") {
        var options = { year: 'numeric', month: 'long', day: 'numeric' };
        el.innerText = (new Date(1000 * newState.epochLicenseExpirationDateInSecs)).toLocaleDateString("en-US", options)
      } else {
        el.innerText = newState[el.getAttribute("data-ws-label")];
      }
    }
  }

  let keys = Object.getOwnPropertyNames(classNamesForUiUpdates);
  if (!keys || keys.length==0) {
    return;
  }

  let classesToHideOrShow = [];
  let classesToShow = [];
  for (const key of keys) {
    classesToHideOrShow.push(classNamesForUiUpdates[key]);
  }

  if (newState.isOffline) {
    classesToShow.push(classNamesForUiUpdates.showWhenOffline);
  }

  if (newState.loading) {
    classesToShow.push(classNamesForUiUpdates.showWhenLoading);
  } else {
    classesToShow.push(classNamesForUiUpdates.showWhenLoaded);
  }

  if (newState.uid) {
    classesToShow.push(classNamesForUiUpdates.showWhenSignedIn);
  } else {
    classesToShow.push(classNamesForUiUpdates.showWhenSignedOut);
  }

  let licenseState = interpretLicenseState(newState.epochLicenseExpirationDateInSecs);

  if (licenseState==licenseInterpretations.NONE) {
    classesToShow.push(classNamesForUiUpdates.showWhenLicenseNone);
  } else if (licenseState==licenseInterpretations.UNKNOWN) {
    classesToShow.push(classNamesForUiUpdates.showWhenLicenseUnknown);
  } else if (licenseState==licenseInterpretations.LIFETIME) {
    classesToShow.push(classNamesForUiUpdates.showWhenLicenseLife);
  } else if (licenseState==licenseInterpretations.SUBSCRIPTION) {
    classesToShow.push(classNamesForUiUpdates.showWhenLicenseSubscriptionValid);
  } else if (licenseState==licenseInterpretations.SUBSCRIPTION_OVER) {
    classesToShow.push(classNamesForUiUpdates.showWhenLicenseExpired);
  } else if (licenseState==licenseInterpretations.SUBSCRIPTION_SOON_OVER) {
    classesToShow.push(classNamesForUiUpdates.showWhenLicenseSoonToExpire);
  }

  let elements = document.querySelectorAll("[data-ws-show-if]");
  for (const element of elements) {
    let attr = element.getAttribute('data-ws-show-if');
    if (!attr) {
      continue;
    }

    let conditions = attr.split(" ");

    let shouldShowEl = false;
    for (const condition of conditions) {
      if (classesToShow.includes(condition)) {
        shouldShowEl = true;
        break;
      }
    }

    element.style.display = shouldShowEl ? "" : "none";
  }

}

function setPremiumLife() {

}

function addOneYearToLicense() {
  let todayInSecs = (new Date()).getTime()/1000;
  let latestExpiration = pageState.epochLicenseExpirationDateInSecs || 0;
  if (todayInSecs > latestExpiration) {
    latestExpiration = todayInSecs;
  }
  latestExpiration += (3600*24*365);
  updatePageStateWithParams({
    epochLicenseExpirationDateInSecs: latestExpiration
  });
}

function onMessageReceivedFromExtension(reply) {
  if (reply) {
    console.log('snx reply = ', reply);
    if (reply.version) {
      if (reply.version == 1) {
        hasExtension = true;
        console.log('sn extension version == 1 ', reply.version);
        setPremiumLife(); // TODO: register life premium if signed in
      } else {
        console.log('sn extension version: ', reply.version);
      }
    } else {
      console.log('sn extension reply does not include version: ', reply);
    }

    if (reply.licenseEpochSecsExpiration) {
      console.log('license: ', reply.licenseEpochSecsExpiration);
      if (reply.licenseEpochSecsExpiration >= 3000000000) {
        setPremiumLife(); // TODO: register life premium if signed in
      } else if (reply.licenseEpochSecsExpiration > pageState.epochLicenseExpirationDateInSecs) {
        updatePageStateWithParams({
          epochLicenseExpirationDateInSecs: reply.licenseEpochSecsExpiration
        })
      }
    } else {
      console.log('no license type from extension');
    }
  }
}





if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
  chrome.runtime.sendMessage("nncconplehmbkbhkgkodmnkfaflopkji", {message: "version"}, onMessageReceivedFromExtension);
}


