$(function() {
  $('#encrypt').click(function() {
    pasteSelection("encrypt");
  });
  $('#decrypt').click(function() {
    pasteSelection("decrypt");
  });
});

function pasteSelection(actionType) {
  chrome.tabs.query({
      active: true,
      windowId: chrome.windows.WINDOW_ID_CURRENT
    },
    function(tab) {
      chrome.tabs.sendMessage(tab[0].id, {
          method: "getSelection"
        },
        function(response) {

          var openpgp = window.openpgp; // use as CommonJS, AMD, ES6 module or via window.openpgp

          if (openpgp.getWorker() == undefined)
            openpgp.initWorker({
              path: 'js/openpgp.worker.min.js'
            });


          var key = $("#key").val();
          var data = response.data;
          var result;
          if (key.length > 0 && data.length > 0) {
            EncDec(actionType,data,key)
          }

        });
    });
}

function EncDec(actionType,data,key) {
  if (actionType == "encrypt") {

    options = {
      data: data,
      passwords: [key]
    };

    openpgp.encrypt(options).then(function(ciphertext) {
      result = ciphertext.data;
      $('#result').val(result.replace("\nComment: http://openpgpjs.org",""));
    });

  } else if (actionType == "decrypt") {

    options = {
      message: openpgp.message.readArmored(data),
      password: key
    };

    openpgp.decrypt(options).then(function(plaintext) {
      result = plaintext.data;
      $('#result').val(result);
    });
  }
}