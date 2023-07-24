const SKU_ID = "SKU_TTSREADER_PREMIUM_1_YEAR__";  // Note: This is not random!
                  // Compatible with the same ID defined on our payments processing server.

function resetPayPalButton(sum, uid, containerId) {
  if (!uid) {
    return;
  }

  document.getElementById(containerId).innerHTML = "";
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
        if (window.gtag) {
          window.gtag('event', "purchase_tts_new" ,{value:'1'})
        }
      });
    }
  }).render('#'+containerId);
}
