$(function() {
  setEncType();
});

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
          restoreSubject();
          break;
        default:
          break;
      }

      initEvents(items.Mode);
    }
  });
}

function initEvents(mode) {

  switch (mode) {
    case "mode_pgp":
      initPGPEvents();
      break;
    case "mode_pass":
      break;
    default:
      break;
  }

}

function initPGPEvents() {

  chrome.storage.local.get("PublicKeys", function(items) {
    if (items.hasOwnProperty("PublicKeys")) {
      var ids = Object.keys(items.PublicKeys);
      $("#subject").data("ids", ids);
      $("#subject").data("pks", items.PublicKeys);
    }

  });

  $("#subject").keyup(function(event) {
    var ids = $(event.currentTarget).data("ids");
    var dropdown = $("#search_dropdown");
    var text = event.currentTarget.value;

    if (text.length > 0) {

      var re = new RegExp(".*[" + text.split("").join("].*[") + "].*", "i");
      ids = ids.filter(function(element, index, array) {
        return re.test(element);
      });

      ids = ids.sort(function(a, b) {
        var indexA = a.search(text);
        var indexB = b.search(text);

        console.log(a);
        console.log(indexA);

        console.log(b);
        console.log(indexB);

        //fix
        if (indexA == -1 && indexB == -1)
          return 0;
        if (indexA == -1)
          return 1;
        if (indexB == -1)
          return -1;

        return indexA - indexB;
      });

      dropdown.hide();
      dropdown.html("");
      for (var id in ids) {
        dropdown.append(
          "<li role='presentation'><a role='menuitem' tabindex='-1' class='search-option' href='#''>" +
          ids[id] + "</a></li>");
      }

      //choice event
      $(".search-option").click(makeChoice);

      dropdown.show();

    } else {
      dropdown.hide();
    }
  });
}

function makeChoice(event) {

  $("#subject").val(event.currentTarget.text);

  changeLookSelected();

  //set curr pub key
  var data = {
    "CurrentSubject": event.currentTarget.text
  };

  chrome.storage.local.set(data, function() {
    console.log("Current subject has been modified successfully!");
  });

  $("#search_dropdown").hide();
}

function changeLookSelected() {

  $("#subject").attr("readonly", true);

  //to clear a curr pub key
  $("#glyph_remove").removeClass('hidden');
  $("#glyph_remove").click(function(event) {
    var data = {
      "CurrentSubject": null
    };
    chrome.storage.local.remove("CurrentPassphrase");

    chrome.storage.local.set(data, function() {
      $("#subject").val("");
      $("#subject").attr("readonly", false);
      $("#glyph_remove").addClass('hidden');
      $("#glyph_remove").unbind('click');
      console.log("Current subject has been cleared!");
    });
  });

}

function restoreSubject() {
  chrome.storage.local.get("CurrentSubject", function(items) {
    if (items.hasOwnProperty("CurrentSubject") && items.CurrentSubject !==
      null) {
      $("#subject").val(items.CurrentSubject);
      changeLookSelected();
    }
  });
}
