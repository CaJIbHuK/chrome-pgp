//данный код инжектируется в загруженную страницу (см параметры в манифесте content_scripts)


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (window.location.href !== request.pageUrl)
      return;

    if (request.hasOwnProperty("action"))
      processAction(request.action);
  }
);



$(document).ready(function() {
  // $("head").append(getStaticFilesHTML());
  document.addEventListener("contextmenu", function(e) {
    if (e.ctrlKey && !e.altKey) {
      e.preventDefault();
      processAction("encrypt");
    } else if (e.ctrlKey && e.altKey) {
      e.preventDefault();
      processAction("decrypt");
    }
  });

  $("body").append(getModalHtml());
  $("#passphrase_modal").toggle(false);
  $("#pgp_modal").toggle(false);
  initModalEvents();
});


function processAction(actionType) {
  chrome.runtime.sendMessage(chrome.runtime.id, {
    action: "get",
    data: ["Mode", "CurrentPassphrase", "CurrentSubject", "PublicKeys"]
  }, function(response) {
    prepareData(response.result, actionType);
  });
}

function prepareData(settings, actionType) {

  if (settings.hasOwnProperty("Mode")) {

    var selection = window.getSelection();
    var selected = selection.toString();
    if (actionType === "decrypt")
      selected = formatSelected(selected);

    if (selected === "") {
      alert(
        "Nothing is selected! Probably, you can't use pgp in this text area."
      );
      return;
    }


    switch (settings.Mode) {
      case "mode_pass":
        var data = {
          mode: "mode_pass",
          action: actionType,
          selection: selected
        };

        $("#passphrase_modal").data(data);
        $("#passphrase_modal").toggle(true);
        $("body").addClass('lock-pgp');
        break;
      case "mode_pgp":
        if (settings.hasOwnProperty("CurrentSubject") && !settings.CurrentSubject) {
          alert(
            "You should pick a subject of your message in popup dialog of an Extention!"
          );
          return;
        }

        if (!settings.hasOwnProperty("PublicKeys")) {
          alert(
            "There aren't any public keys in local storage!"
          );
          return;
        }

        if (settings.hasOwnProperty("CurrentPassphrase")) {
          var data = {
            mode: "mode_pgp",
            selection: selected,
            passphrase: settings.CurrentPassphrase,
            pk: settings.PublicKeys[settings.CurrentSubject]
          };

          chrome.runtime.sendMessage(chrome.runtime.id, {
            action: actionType,
            data: data
          }, function(
            response) {
            replaceResult(response.result);
          });

        } else {

          var data = {
            mode: "mode_pgp",
            action: actionType,
            selection: selected,
            pk: settings.PublicKeys[settings.CurrentSubject]
          };

          $("#passphrase_modal").data(data);
          $("#passphrase_modal").toggle(true);
          $("body").addClass('lock-pgp');
        }

        break;
      default:
        return;
    }
  }
}

function getModalHtml() {
  var text =
    `<!-- The Modal -->
<div id="passphrase_modal" class="modal modal-pgp">
  <!-- Modal content -->
  <div class="modal-content-pgp">
  <h4 class="modal-title-pgp" id="passphrase_label">Enter passphrase:</h4>
  <h5 class="modal-title-pgp" id="passphrase_label_help">(in PGP mode - key to unlock private key. Otherwise, shared key)</h5>
  <input type="password" class="form-control-pgp" id="passphrase"></input>
  <div><button type="button" class="btn-pgp btn-default-pgp" id="passphrase_cancel" data-dismiss="modal">Cancel</button>
  <button type="button" class="btn-pgp btn-success-pgp" id="passphrase_ok">OK</button></div>
  <div id="selection_container"></div>
  </div></div>

  <!-- The Modal -->
<div id="pgp_modal" class="modal modal-pgp">
<!-- Modal content -->
<div class="modal-content modal-content-pgp">
<span class="close-pgp" id="pgp_close">x</span>
<h2 class="modal-title-pgp" id="result_label">Result:</h2>
<textarea class="form-control-pgp" id="pgp_result"></textarea>
<button type="button" class="btn-pgp btn-default-pgp" id="pgp_copy" data-dismiss="modal">Copy&Close</button>
</div></div>
  `;

  return text;
}

function initModalEvents() {

  $("#passphrase_ok").click(function(e) {
    var data = $("#passphrase_modal").data();
    var action = data.action;
    delete data.action;
    data.passphrase = $("#passphrase").val();
    $("#passphrase").val("");
    $("#passphrase_modal").removeData();
    $("#passphrase_modal").toggle(false);
    $("body").removeClass('lock-pgp');

    chrome.runtime.sendMessage(chrome.runtime.id, {
      action: action,
      data: data
    }, function(response) {
      replaceResult(response.result);
    });
  });

  $("#passphrase_cancel").click(function(e) {
    $("#passphrase").val("");
    $("#passphrase_modal").removeData();
    $("#passphrase_modal").toggle(false);
    $("body").removeClass('lock-pgp');
  });

  $("#passphrase_modal").bind("keyup", function(event) {
    if (event.keyCode == 27)
      $("#passphrase_cancel").click();
    else if (event.keyCode == 13)
      $("#passphrase_ok").click();
  });


  $("#pgp_close").click(function(e) {
    $("#pgp_modal").toggle(false);
    $("#pgp_result").val("");
    $("body").removeClass('lock-pgp');
  });
  $("#pgp_modal").bind("keyup", function(e) {
    if (e.keyCode == 27)
      $("#pgp_close").click();
  });

  $("#pgp_copy").click(function(event) {
    var result = document.getElementById('pgp_result');
    result.select();
    document.execCommand("copy");
    $("#pgp_close").click();
  });

}


function replaceResult(result) {
  if (!document.execCommand("insertText", false, result)) {
    $("#pgp_modal").toggle(true);
    $("body").addClass('lock-pgp');
    $("#pgp_result").val(result);
  }
}

function formatSelected(text) {
  return text.replace("-----BEGIN PGP MESSAGE-----",
    "-----BEGIN PGP MESSAGE-----\n");
}
