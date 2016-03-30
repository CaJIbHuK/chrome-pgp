$(function() {

  setEncType();

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
            EncDec(actionType, data, key)
          }

        });
    });
}

function EncDec(actionType, data, key) {
  if (actionType == "encrypt") {

    options = {
      data: data,
      passwords: [key]
    };

    openpgp.encrypt(options).then(function(ciphertext) {
      result = ciphertext.data;
      $('#result').val(result.replace("\nComment: http://openpgpjs.org", ""));
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

function setEncType() {

  chrome.storage.local.get("Mode", function(items) {

    if (items.hasOwnProperty("Mode")) {
      var formKey = $("#form_key");
      var formPGP = $("#form_pgp");

      switch (items.Mode) {
        case "mode_pass":
          if (formKey.hasClass('hidden')) {
            formKey.removeClass('hidden');
          }
          formPGP.addClass('hidden');
          break;
        case "mode_pgp":
          if (formPGP.hasClass('hidden')) {
            formPGP.removeClass('hidden');
          }
          formKey.addClass('hidden');
          break;
        default:
          break;
      };

      initEvents(items.Mode);
    }
  })
}

function initEvents(mode) {
  switch (mode) {
    case "mode_pgp":

      chrome.storage.local.get("PublicKeys", function(items) {
        if (items.hasOwnProperty("PublicKeys")) {
          var ids = Object.keys(items.PublicKeys);
          $("#subject").data("ids", ids);
        }
      });

      $("#subject").keyup(function(event) {
        var ids = $(event.currentTarget).data("ids");
        var dropdown = $("#search_dropdown");
        var text = event.currentTarget.value;
        if (text.length > 0) {
          var restr = ".*[" + text.split("").join("].*[") + "].*";

          var re = new RegExp(restr, "i");
          ids = ids.filter(function(element, index, array) {
            return re.test(element);
          });

          ids = ids.sort(function(a, b) {
            var indexA = a.substring(text);
            var indexB = b.substring(text);

            if (indexA != -1 && indexA < indexB)
              return 1;
            if (indexA != -1 && indexA > indexB)
              return -1;
            return 0;
          });

          dropdown.hide();
          dropdown.html("");
          for (id in ids) {
            dropdown.append("<li role='presentation'><a role='menuitem' tabindex='-1' href='#''>" + ids[id] + "</a></li>");
          }

          dropdown.children('li');
          dropdown.show();

        } else {
          dropdown.hide();
        }

      });

      break;
    default:
      // statements_def
      break;
  }
}