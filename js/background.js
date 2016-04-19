var timer;
var openpgp = window.openpgp; // use as CommonJS, AMD, ES6 module or via window.openpgp
setOpenpgpConfig();

chrome.runtime.onStartup.addListener(function() {
	chrome.storage.local.remove("CurrentPassphrase");
});

createContextMenuItems();

chrome.runtime.onInstalled.addListener(function(details) {
	chrome.storage.local.set({
		Mode: "mode_pgp"
	});
});

chrome.runtime.onSuspend.addListener(function() {
	chrome.storage.local.remove("CurrentPassphrase");
});

chrome.storage.onChanged.addListener(function(changes, area) {
	if (!changes.hasOwnProperty("CurrentPassphrase") && !changes.hasOwnProperty(
			"MyKeys")) {
		console.log(changes);
	} else {
		console.log("Modified:" + Object.keys(changes));
	}
});


function createContextMenuItems() {
	var properties = {
		type: 'normal',
		id: 'encrypt',
		title: 'Encrypt selected (ctrl+right mouse)',
		contexts: ["selection"]
	};

	chrome.contextMenus.create(properties);

	properties = {
		type: 'normal',
		id: 'decrypt',
		title: 'Decrypt selected (ctrl+alt+right mouse)',
		contexts: ["selection"]
	};

	chrome.contextMenus.create(properties);
}

chrome.contextMenus.onClicked.addListener(function(info, tab) {
	if (info.selectionText !== "")
		chrome.tabs.sendMessage(tab.id, {
			action: info.menuItemId,
			pageUrl: info.pageUrl
		});
});

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {

		if (!checkSenderID(sender.id)) {
			alert("This app or extension can't send communicate with 'Easy OTG PGP!'");
			sendResponse({
				result: undefined
			});
		}

		console.log(sender.tab ?
			"from a content script:" + sender.tab.url :
			"from the extension");

		if (request.action == "set") {

			chrome.storage.local.set(request.data);

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

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {

		if (!checkSenderID(sender.id)) {
			alert("This app or extension can't send communicate with 'Easy OTG PGP!'");
			sendResponse({
				result: undefined
			});
		}


		if (request.hasOwnProperty("action") && request.hasOwnProperty("data")) {

			if (request.action !== "encrypt" && request.action !== "decrypt") {
				return;
			}
			try {

				if (openpgp.getWorker() === undefined)
					openpgp.initWorker({
						path: 'js/openpgp.worker.min.js'
					});

				getOptions(request.action, request.data, function(opts) {
					if (request.action == "encrypt") {

						opts.data = request.data.selection;

						openpgp.encrypt(opts).then(function(ciphertext) {
							var results = {
								result: ciphertext.data
							};
							sendResponse(results);
						}).catch(function(error) {
							console.log(error);
							alert("Encryption failed!");
						});


					} else if (request.action == "decrypt") {

						try {
							opts.message = openpgp.message.readArmored(request.data.selection);
						} catch (e) {
							throw new Error("Inappropriate format of PGP message!");
						}

						openpgp.decrypt(opts).then(function(plaintext) {

							var results = {
								result: plaintext.data
							};
							if (plaintext.hasOwnProperty('signatures'))
								results.valid = plaintext.signatures[0].valid;
							sendResponse(results);
						}).catch(function(error) {
							console.log(error);
							alert("Decryption failed!");
						});

					}
				});
			} catch (e) {
				alert(e);
			}

		}

		return true;
	}
);

function getOptions(actionType, settings, callback) {

	var options;

	switch (settings.mode) {
		case "mode_pass":

			var key = settings.passphrase;

			if (actionType == "encrypt") {
				options = {
					passwords: [key],
				};
			} else if (actionType == "decrypt") {
				options = {
					password: key,
				};
			}
			try {
				callback(options);
			} catch (e) {
				throw e;
			}
			break;
		case "mode_pgp":

			chrome.storage.local.get(["MyKeys"],
				function(items) {
					try {
						if (settings.passphrase === "") {
							alert("No password entered!");
							chrome.storage.local.remove("CurrentPassphrase");
							return;
						}

						if (settings.passphrase) {
							chrome.storage.local.set({
								"CurrentPassphrase": settings.passphrase
							});
							if (timer)
								clearTimeout(timer);
							timer = setTimeout(function() {
									chrome.storage.local.remove("CurrentPassphrase");
								},
								5 * 60000);


							if (items.hasOwnProperty("MyKeys")) {
								var pubk;
								var privk;

								pubk = openpgp.key.readArmored(settings.pk)
									.keys;
								privk = openpgp.key.readArmored(items.MyKeys.private_key)
									.keys[0];

								if (!privk.decrypt(settings.passphrase)) {
									chrome.storage.local.remove("CurrentPassphrase");
									throw new Error("Invalid passphrase!");
								}

								if (actionType == "encrypt") {
									options = {
										publicKeys: pubk,
										privateKeys: privk,
										armor: true
									};
								} else if (actionType == "decrypt") {
									options = {
										privateKey: privk,
										publicKeys: pubk,
										format: 'utf8'
									};
								}
							}
							try {
								callback(options);
							} catch (e) {
								throw e;
							}
						}
					} catch (e) {
						alert(e);
					}
				});
			break;

		default:
			break;
	}
}

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

function checkSenderID(id) {
	//todo: list of permitted extenstion IDs fron chrome.storage.local
	//fiiling the list using options.html
	return id === chrome.runtime.id;
}

function setOpenpgpConfig() {
	openpgp.config.aead_protect = true;
	openpgp.config.show_comment = false;
	openpgp.config.show_version = false;
}
