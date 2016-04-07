chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		console.log(sender.tab ?
			"from a content script:" + sender.tab.url :
			"from the extension");

		if (request.action == "set") {

			chrome.storage.local.set(request.data, function() {
				console.log("Saved:" + data.toString());
			});

			sendResponse({
				result: "saved"
			});

		} else if (request.action == "get") {

			if (request.hasOwnProperty("id")) {
				chrome.storage.local.get(getNeededProps(request.id), function(items) {
					sendResponse({
						id: request.id,
						result: items
					});
				});
			} else {
				chrome.storage.local.get(request.data, function(items) {
					sendResponse({
						result: items
					});
				});
			}
		} else if (request.action == "remove") {

			chrome.storage.local.remove(request.data, function() {
				sendResponse({
					result: "removed"
				});
			});
		}

		return true;
	});

function getNeededProps(id) {
	switch (id) {
		case "main_opt":
			return ["Mode", "MyKeys"];
		case "keys_opt":
			return ["PublicKeys"];
		case "gen_opts":
			return [""];
		case "about_opt":
			return [""];
		default:
			return [""];
	}
}
