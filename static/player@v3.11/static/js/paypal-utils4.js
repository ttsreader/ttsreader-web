const SKU_ID = "SKU_TTSREADER_PREMIUM_1_YEAR__";  // Note: This is not random!
// Compatible with the same ID defined on our payments processing server.
const SKU_SUB_ID = "SKU_TTSREADER_PREMIUM_MONTHLY__";  // Note: This is not random!
// Compatible with the same ID defined on our payments processing server.

if (window.uid) {
  resetPayPalButtons(window.uid);
}

function resetPayPalButtons(uid) {
  resetPayPalPurchaseButton(uid);
  resetPayPalSubscriptionButton(uid);
  window.updateStateWithParentData({recurringTab: true});
}

function onSubscriptionComplete(subscriptionId, uid) {
  if (window.updateStateWithParentData) {
    window.updateStateWithParentData({subscriptionId});
  }

  firebase.database().ref('/subs/' + uid + "/" + subscriptionId).set({
    subscriptionId: subscriptionId,
    sku: SKU_SUB_ID,
    orderedOnDayEpoch: Math.floor(Date.now() / (1000 * 60 * 60 * 24)),
    state: "active",
  }).then(() => {
    console.log('Subscription saved');
  }).catch((err) => {
    console.log('Subscription save failed', err);
  });
}

function resetPayPalPurchaseButton(uid) {
  if (!uid) {
    return;
  }

  const sum = 39;
  const containerId = "paypal-button-container";

  document.getElementById(containerId).innerHTML = "";
  paypal.Buttons({
    style: {
      shape: 'pill',
      color: 'gold',
      layout: 'vertical',
      label: 'paypal'
    },
    createOrder: function (data, actions) {
      return actions.order.create({
        purchase_units: [{
          description: "TTSReader Premium 1 Year",
          custom_id: SKU_ID + uid,
          amount: {
            value: sum
          }
        }]
      });
    },
    onApprove: function (data, actions) {
      return actions.order.capture().then(function (details) {
        alert('Thank you!');
        if (window.gtag) {
          window.gtag('event', "purchase_tts_new", {value: '1'})
        }
      });
    }
  }).render('#' + containerId);
}

function resetPayPalSubscriptionButton(uid) {
  document.getElementById("paypal-button-container-subscription").innerHTML = "";
  paypal.Buttons({
    style: {
      shape: 'pill',
      color: 'gold',
      layout: 'vertical',
      label: 'paypal'
    },
    createSubscription: function (data, actions) {
      return actions.subscription.create({
        /* Creates the subscription */
        plan_id: 'P-82C30553N8925890NMZZWUTA',
        custom_id: SKU_SUB_ID + uid
      });
    },
    onApprove: function (data, actions) {
      alert('Thank you - order received.');
      console.log('subscriptionID: ' + data.subscriptionID); // You can add optional success message for the subscriber here
      if (window.gtag) {
        window.gtag('event', "purchase_ttsreader_sub_success", {value: '1'})
      }
      onSubscriptionComplete(data.subscriptionID, uid);
    },
    onCancel: function (data) {
      if (window.gtag) {
        window.gtag('event', "purchase_ttsreader_sub_canceled", {value: '1'})
      }
    },
  }).render('#paypal-button-container-subscription'); // Renders the PayPal button
}
