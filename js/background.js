chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		console.log(sender.tab ?
			"from a content script:" + sender.tab.url :
			"from the extension");
		if (request.action == "set") {
			localStorage[request.key] = request.value;
			sendResponse({farewell: "saved"});
		}else if (request.action=="get") {
			sendResponse({farewell:localStorage[request.key]});
		}
	});