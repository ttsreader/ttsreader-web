const SKU_ID = "SKU_TTSREADER_PREMIUM_1_YEAR__";  // Note: This is not random!
                  // Compatible with the same ID defined on our payments processing server.

function resetPayPalButton(sum, uid) {
  if (!uid) {
    return;
  }

  document.getElementById("paypal-button-container").innerHTML = "";
  paypal.Buttons({
    createOrder: function(data, actions) {
      return actions.order.create({
        purchase_units: [{
          custom_id: SKU_ID + uid,
          amount: {
            value: sum
          }
        }]
      });
    },
    onApprove: function(data, actions) {
      return actions.order.capture().then(function(details) {
        //alert('Transaction completed by ' + details.payer.name.given_name);
        if (addOneYearToLicense) {
          addOneYearToLicense();
        }

        try {
          if (window.gtag) {
            if (document.referrer) {
              let referrer = document.referrer.toLowerCase();
              if (referrer.includes('legacy')) {
                window.gtag('event', "purchase_tts_upgrade_from_legacy", {value: '1'})
              } else if (referrer.includes('player')) {
                window.gtag('event', "purchase_tts_upgrade_from_new", {value: '1'})
              } else {
                referrer = referrer.replace('https://', '');
                referrer = referrer.replace('ttsreader.com/', '');
                referrer = referrer.replace("/", "_");
                if (referrer.includes("?")) {
                  let index = referrer.indexOf("?");
                  referrer = referrer.substring(0, index);
                }
                if (referrer.includes("#")) {
                  let index = referrer.indexOf("#");
                  referrer = referrer.substring(0, index);
                }
                referrer.replace(" ", "_");
                // Clean referrer such that it includes only characters, numbers & underscore:
                referrer = referrer.replace(/[\W]+/g,"");

                window.gtag('event', "purchase_" + referrer, {value: '1'})
              }
            } else {
              window.gtag('event', "purchase_tts_upgrade_from_unknown2", {value: '1'})
            }
          }
        } catch (e) {
        }

        alert('Thank you! Your payment was successful. It may take a few seconds till the servers get the data.');
      });
    }
  }).render('#paypal-button-container');
}
