//данный код инжектируется в загруженную страницу (см параметры в манифесте content_scripts)
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.hasOwnProperty("action")) {
      processAction(request.action, function(result) {
        sendResponse({
          result: result
        });
      });
    };
  });



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

    $("#selection_container").data({
      selection: selection
    });

    switch (settings.Mode) {
      case "mode_pass":
        var data = {
          mode: "mode_pass",
          action: actionType,
          selection: selected
        };

        $("#passphrase_modal").data(data);
        $("#passphrase_modal").toggle(true);
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
<div id="passphrase_modal" class="modal">
  <!-- Modal content -->
  <div class="modal-content">
  <h4 class="modal-title">Enter your passphrase to unlock private key</h4>
  <input type="password" class="form-control" id="passphrase"></input>
  <div><button type="button" class="btn btn-default" id="passphrase_cancel" data-dismiss="modal">Cancel</button>
  <button type="button" class="btn btn-success" id="passphrase_ok">OK</button></div>
  <div id="selection_container"></div>
  </div></div>

  <!-- The Modal -->
<div id="pgp_modal" class="modal modal-pgp">
<!-- Modal content -->
<div class="modal-content modal-content-pgp">
<h2 id="result_label">Result:</h2>
<textarea class="form-control" id="pgp_result"></textarea>
<button type="button" class="btn btn-default" id="pgp_close" data-dismiss="modal">Close</button>
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
    $("#passphrase_modal").data(undefined);
    $("#passphrase_modal").toggle(false);

    chrome.runtime.sendMessage(chrome.runtime.id, {
      action: action,
      data: data
    }, function(response) {
      replaceResult(response.result);
    });
  });

  $("#passphrase_cancel").click(function(e) {
    $("#passphrase_modal").data(undefined);
    $("#passphrase_modal").toggle(false);
  });
}


function replaceResult(result) {
  // var selection = $("#selection_container").data("selection");
  // var range = selection.getRangeAt(0);
  // range.deleteContents();
  // var fragment = document.createElement("pre");
  // fragment.innerHTML = result;
  // range.insertNode(fragment);

  $("#pgp_modal").toggle(true);
  $("#pgp_result").val(result);
  $("#pgp_close").click(function(e) {
    $("#pgp_modal").toggle(false);
    $("#pgp_result").val("");
  });
  $("#selection_container").data(undefined);
}
