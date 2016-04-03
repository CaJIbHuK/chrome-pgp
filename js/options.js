$(document).ready(function() {
	changePill("main_opt");

	$("#menu").children('ul').children('li').click(function(event) {
		changePill(event.currentTarget.id);
	});

});

function changePill(id) {
	chrome.runtime.sendMessage(chrome.runtime.id, {
		action: "get",
		id: id
	}, function(response) {
		changePillWithData(response.id, response.result);
	})
}

function changePillWithData(id, dataFromStorage) {

	$(".active").removeClass('active');
	var element = $("#" + id + "").addClass('active');

	$("#current-settings").remove();

	var context = getContext(id, dataFromStorage);

	var data = {
		title: context[0].main_title,
		settings: context[1]
	};

	var templateScript = $("#template").html();
	var template = Handlebars.compile(templateScript);
	$("#main_settings").append(template(data));

	initEvents(id);
}

function getContext(id, data) {
	if (id == "main_opt") {
		return [{
				main_title: "Main settings"
			},
			[{
				title: "Type of encryption",
				content: getContent("enc_type", data)
			}, {
				title: "",
				content: getContent("my_keys", data)
			}]
		];
	} else if (id == "keys_opt") {
		return [{
				main_title: "My keys"
			},
			[{
				title: "",
				content: getContent("pub_keys", data)
			}]
		];
	} else if (id == "gen_opt") {
		return [{
				main_title: "Key generation"
			},
			[{
				title: "",
				content: getContent("subject")
			}, {
				title: "",
				content: getContent("key_gen")
			}]
		];
	} else if (id == "about_opt") {
		return [{
				main_title: "About"
			},
			[{
				title: "Author",
				content: getContent("about")
			}]
		];
	}
}

function getContent(name, data = undefined) {

	if (name == "enc_type") {

		text = `
		<div id = "enc_type">
		<div class="form-group">
			<div class="radio enc-type">
	  			<label><input %state_mode_pass% id="mode_pass" class="mode" type="radio" name="optradio">Passpharse</label>
			</div>
			<div class="radio enc-type">
  				<label><input %state_mode_pgp% id="mode_pgp" class="mode" type="radio" name="optradio">PGP keys</label>
  			</div>
  		</div></div>`;

		if (data != undefined && data.hasOwnProperty("Mode")) {
			text = text.replace("%state_mode_pass%", (data.Mode == "mode_pass" ? "checked" : ""));
			text = text.replace("%state_mode_pgp%", (data.Mode == "mode_pgp" ? "checked" : ""));
		} else {
			text = text.replace("%state_mode_pass%", "");
			text = text.replace("%state_mode_pgp%", "");
		}

		return text;

	} else if (name == "pub_keys") {

		text = getPKTable();

		var tableRows = "";
		if (data != undefined && data.hasOwnProperty("PublicKeys")) {
			var publicKeys = data.PublicKeys;
			for (ids in publicKeys) {
				var name = ids.substring(0, ids.indexOf(":"));
				var email = ids.substring(ids.indexOf(":") + 1);

				tableRows += `
			      <tr id="tr_pk">
			        <td id="td_name">` + name + `</td>
			        <td id="td_email">` + email + `</td>
			        <td id="td_pk">` + publicKeys[ids] + `</td>
			      </tr>	`;
			}
		}

		return text.replace("%rows%", tableRows);

	} else if (name == "subject") {

		return `<div id="subject">
			<div class="form-group">
				<label for="subj_name" class="control-label col-md-2">Name:</label>
				<div class="col-md-8">
		 			<input type="text" class="form-control" id="subj_name" placeholder="John Smith">
		 		</div>
		 	</div>
		 	<div class="form-group">
				<label for="subj_email" class="control-label col-md-2">Email:</label>
				<div class="col-md-8">
		 			<input type="text" class="form-control" id="subj_email" placeholder="john@example.com">
			 	</div>
		 	</div>
		 	<div class="form-group">
				<label for="subj_passphrase" class="control-label col-md-2">Passpharse:</label>
				<div class="col-md-8">
		 			<input type="password" class="form-control" id="subj_passphrase" placeholder="key">
			 	</div>
		 	</div>
		 </div>`;

	} else if (name == "key_gen") {

		return `
		<div class="form-group">
			<div class="col-md-5">
				<label for="gen_priv_key" class="control-label">Private key:</label>
				<textarea class="form-control gen-key-text" rows="5" id="gen_priv_key" readonly></textarea>
			</div>
			<div class="col-md-5">
				<label for="gen_pub_key" class="control-label">Public key:</label>
				<textarea class="form-control gen-key-text" rows="5" id="gen_pub_key" readonly></textarea>
			</div>			
		</div>
		<div class="form-group btn-group col-md-5">

				<input type="button" class="btn btn-primary" id="generate" value="Generate"></input>
				<input type="reset" class="btn btn-primary" id="clear" value="Clear"></input>
				<input type="button" class="btn btn-success" id="save" value="Save"></input>
				<div id="preloader-container" class="hidden">
					<img id="loader" src="images/loader.gif">
				</div>
		</div>
		`;

	} else if (name == "my_keys") {

		var text = `
		<div class="form-group">
			<div class="col-md-5">
				<label for="my_priv_key" class="control-label">Private key:</label>
				<textarea class="form-control gen-key-text" rows="5" id="my_priv_key" readonly>%priv_key%</textarea>
			</div>
			<div class="col-md-5">
				<label for="my_pub_key" class="control-label">Public key:</label>
				<textarea class="form-control gen-key-text" rows="5" id="my_pub_key" readonly>%pub_key%</textarea>
			</div>			
		</div>
		<div class="form-group btn-group col-md-5">
			<input type="reset" class="btn btn-primary" id="clear_my_keys" value="Clear"></input>
			<input type="button" class="btn btn-success" id="save_my_keys" value="Save"></input>
		</div>`;

		if (data != undefined && data.hasOwnProperty("MyKeys")) {
			text = text.replace("%priv_key%", data.MyKeys.private_key);
			text = text.replace("%pub_key%", data.MyKeys.public_key);
		} else {
			text = text.replace("%priv_key%", "");
			text = text.replace("%pub_key%", "");
		}

		return text;

	} else if (name == "about") {

		return `Anton Zaslavskii`;
	};
}

function getPKTable() {

	var table = `
	<div class="form-group" id="pk_table">
		<div class="container col-md-12">       
	  		<table class="table table-hover" id="pk_table">
	    		<thead>
	      			<tr>
	        			<th>Name</th>
			        	<th>Email</th>
	        			<th>Public key</th>
	      			</tr>
	    		</thead>
	    		<tbody> %rows%
	    		</tbody>
	  		</table>
		</div>
	</div>
	<div class="form-group btn-group col-md-5 btn-group-pk">		
  		<input type="button" class="btn btn-primary" id="clear" value="Clear"></input>		
  		<input type="button" class="btn btn-danger hidden" id="confirm" value="Delete"></input>
		<input type="button" class="btn btn-primary" id="del" value="Select"></input>		
	</div>
	`;

	return table;
}

function initEvents(id) {
	if (id == "main_opt") {

		//enc mode change event
		$(".mode").change(function(event) {
			$(".mode:checked").each(function(index, el) {
				el.checked = false;
			});
			event.currentTarget.checked = true;

			var data = {
				Mode: event.currentTarget.id
			};
			chrome.runtime.sendMessage(chrome.runtime.id, {
				action: "set",
				data: data
			}, function(response) {
				console.log(response);
			})
		});

		//my keys events
		var myPubKeyText = document.getElementById("my_pub_key");
		var myPrivKeyText = document.getElementById("my_priv_key");

		myPubKeyText.addEventListener("dragover", function(event) {
			event.preventDefault(); // отменяем действие по умолчанию
		}, false);

		myPrivKeyText.addEventListener("dragover", function(event) {
			event.preventDefault(); // отменяем действие по умолчанию
		}, false);

		myPrivKeyText.addEventListener("drop", function(event) {
			dropFiles(event, addMyPrivKey);
		}, false);

		myPubKeyText.addEventListener("drop", function(event) {
			dropFiles(event, addMyPubKey);
		}, false);

		$("#clear_my_keys").click(function(event) {
			clearKeys("MyKeys", "main_opt");
		});

		$("#save_my_keys").click(function(event) {
			if ($("#my_priv_key").val() && $("#my_pub_key").val()) {
				saveTextAsFile("my_priv_key", "my_private_key.txt");
				saveTextAsFile("my_pub_key", "my_public_key.txt");
			}
		});

	} else if (id == "keys_opt") {

		//work with PK table
		$("#del").click(function(event) {
			$(".btn-group-pk").children('input').each(function(index, el) {
				$(el).addClass('hidden');
			});

			$("#confirm").removeClass('hidden');

			$("[id=tr_pk]").unbind('click');
			$("[id=tr_pk]").click(function(event) {
				if ($(event.currentTarget).hasClass('danger')) {
					$(event.currentTarget).removeClass('danger');
				} else {
					$(event.currentTarget).addClass('danger');
				}
			});
		});

		$("#confirm").click(function(event) {
			$(".btn-group-pk").children('input').each(function(index, el) {
				$(el).removeClass('hidden');
			});

			$("#confirm").addClass('hidden');

			$("[id=tr_pk]").unbind('click');
			$("[id=tr_pk]").click(function(event) {
				var row = $(event.currentTarget);
				var textPK = $(event.currentTarget).children('#td_pk').text();
				var modal = $("#edit_modal");
				$("#edit_name").text(row.children('#td_name').text());
				$("#edit_email").text(row.children('#td_email').text());
				$("#edit_field").text(textPK);

				modal.modal();
			});
			var keys = [];
			$("[id=tr_pk][class=danger]").each(function(index, el) {
				keys.push($(el).children('#td_name').text() + ":" + $(el).children('#td_email').text());
			});
			removePK(keys);
		});

		$("#clear").click(function(event) {
			clearKeys("PublicKeys", "keys_opt");
		});

		//drag n drop files
		var pkTable = document.getElementById("pk_table");
		pkTable.addEventListener("dragover", function(event) {
			event.preventDefault(); // отменяем действие по умолчанию
		}, false);

		pkTable.addEventListener("drop", function(event) {

			event.preventDefault();

			var reader = new FileReader();
			reader.onload = function(event) {
				var content = event.target.result;
				try {
					addNewPK(content);
				} catch (e) {
					console.log(e);
				}
			}

			var files = event.dataTransfer.files;
			var len = files.length;
			for (var i = 0; i < len; i++) {

				reader.readAsText(files[i]);

				console.log("Filename: " + files[i].name);
				console.log("Type: " + files[i].type);
				console.log("Size: " + files[i].size + " bytes");
			}
		}, false);

		//modal with details about keys
		$("[id=tr_pk]").click(function(event) {
			var row = $(event.currentTarget);
			var textPK = $(event.currentTarget).children('#td_pk').text();
			var modal = $("#edit_modal");
			$("#edit_name").text(row.children('#td_name').text());
			$("#edit_email").text(row.children('#td_email').text());
			$("#edit_field").text(textPK);

			modal.modal();
		});

		$("#close_span").click(function(event) {
			$("#edit_modal").modal('hide');
		});

		$("#download_pk").unbind('click');
		$("#download_pk").click(function(event) {
			saveTextAsFile("edit_field", "public_key(" + $("#edit_name").text() + ").txt");
		});

	} else if (id == "gen_opt") {

		//generation of keys
		$("#generate").click(function(event) {

			if (validateForm(event)) {
				data = {
					userIds: [{
						name: $("#subj_name").val(),
						email: $("#subj_email").val()
					}],
					numBits: 4096,
					passphrase: $("#subj_passphrase").val() //protects a private key
				};

				var openpgp = window.openpgp;

				$("#preloader-container").removeClass('hidden');

				try {
					openpgp.generateKey(data).then(function(key) {
						$("#gen_priv_key").val(key.privateKeyArmored);
						$("#gen_pub_key").val(key.publicKeyArmored);

						$("#preloader-container").addClass('hidden');
					});
				} catch (error) {
					$("#preloader-container").addClass('hidden');
					alert(error);
				}
			}
		});

		//saving of keys (downloading)
		$("#save").click(function(event) {
			if ($("#gen_priv_key").val() && $("#gen_pub_key").val()) {
				saveTextAsFile("gen_priv_key", "private_key.txt");
				saveTextAsFile("gen_pub_key", "public_key.txt");
			}
		});

		//check wether required fields are empty
		$("[input],[type='text'],[type='password']").change(function(event) {
			if (event.currentTarget.value == "") {
				matchAsEmpty(event.currentTarget);
			} else {
				matchAsEmpty(event.currentTarget, true);
			}
		});

	} else if (id == "about_opt") {}
}

function validateForm(event) {
	result = true;
	$("[input],[type='text'],[type='password']").each(function(index, el) {
		if (el.value.length == 0) {
			result = false;
			matchAsEmpty(el);
		} else {
			matchAsEmpty(el, true);
		}
	})

	return result;
}

function matchAsEmpty(el, cancel = false) {
	if (cancel) {
		var container = $(el).closest('.form-group');
		if (container.hasClass('has-error'))
			container.removeClass('has-error');
	} else
		$(el).closest('.form-group').addClass('has-error');
}

//add or update pk value
function addNewPK(content) {
	var openpgp = window.openpgp;
	var obj = openpgp.key.readArmored(content);

	if (obj.hasOwnProperty("err") && obj.err.length > 0) {
		var errors = obj.err;
		for (var i = 0; i < errors.length; i++) {
			console.log(errors[i]);
		}
		alert("Something went wrong! Look for errors in log!")
		return;
	}

	if (obj.keys[0].isPublic()) {
		var messageData = {};
		var ids = obj.keys[0].getUserIds()[0];
		var email = ids.substring(ids.lastIndexOf(" ") + 1);
		var name = ids.substring(0, ids.lastIndexOf(" "));
		var jsonKey = name + ":" + email.substring(1, email.length - 1);

		chrome.runtime.sendMessage(chrome.runtime.id, {
			action: "get",
			data: "PublicKeys"
		}, function(response) {
			var publicKeys = response.result["PublicKeys"] || {};
			publicKeys[jsonKey] = content;
			chrome.runtime.sendMessage(chrome.runtime.id, {
				action: "set",
				data: {
					"PublicKeys": publicKeys
				}
			}, function(response) {
				console.log(response.result);
				clearCurrentSubject();
				changePill("keys_opt");
			})
		});
	} else {
		throw new Error("Is not a public key!");
	}
}

function removePK(keys) {
	chrome.runtime.sendMessage(chrome.runtime.id, {
		action: "get",
		data: "PublicKeys"
	}, function(response) {
		var publicKeys = response.result["PublicKeys"] || {};
		for (var i = 0; i < keys.length; i++) {
			if (publicKeys.hasOwnProperty(keys[i])) {
				delete publicKeys[keys[i]];
			}
		}

		chrome.runtime.sendMessage(chrome.runtime.id, {
			action: "set",
			data: {
				"PublicKeys": publicKeys
			}
		}, function(response) {
			console.log(response.result);
			clearCurrentSubject();
			changePill("keys_opt");
		})
	});
}

function clearKeys(type, pill) {
	chrome.runtime.sendMessage(chrome.runtime.id, {
		action: "get",
		data: "type"
	}, function(response) {
		var keys = response.result[type] || {};
		for (key in keys) {
			delete keys[key];
		}
		var data = {};
		data[type] = keys;

		chrome.runtime.sendMessage(chrome.runtime.id, {
			action: "set",
			data: data
		}, function(response) {
			console.log(response.result);
			clearCurrentSubject();
			changePill(pill);
		})
	});
}

function dropFiles(event, callback) {

	event.preventDefault();

	var reader = new FileReader();
	reader.onload = function(event) {
		var content = event.target.result;
		try {
			callback(content);
		} catch (e) {
			console.log(e);
		}
	}

	var files = event.dataTransfer.files;
	var len = files.length;
	for (var i = 0; i < len; i++) {

		reader.readAsText(files[i]);

		console.log("Filename: " + files[i].name);
		console.log("Type: " + files[i].type);
		console.log("Size: " + files[i].size + " bytes");
	}
}

function addMyKey(text, type) {
	chrome.runtime.sendMessage(chrome.runtime.id, {
		action: "get",
		data: "MyKeys"
	}, function(response) {
		var myKeys = response.result["MyKeys"] || {};
		myKeys[type] = text;
		var data = {
			"MyKeys": myKeys
		};

		chrome.runtime.sendMessage(chrome.runtime.id, {
			action: "set",
			data: data
		}, function(response) {
			console.log(response.result);
			changePill("main_opt")
		})
	});
}

function addMyPubKey(text) {
	addMyKey(text, "public_key");
}

function addMyPrivKey(text) {
	addMyKey(text, "private_key");
}

function clearCurrentSubject() {

	chrome.runtime.sendMessage(chrome.runtime.id, {
		action: "set",
		data: {
			"CurrentSubject": null
		}
	}, function(response) {
		console.log(response.result);
	})

}