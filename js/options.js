$(document).ready(function() {
	ChangePill("main_opt");

	$("#menu").children('ul').children('li').click(function(event) {
		ChangePill(event.currentTarget.id);
	});

});

function ChangePill(id) {
	$(".active").removeClass('active');
	var element = $("#" + id + "").addClass('active');

	$("#current-settings").remove();

	var context = getContext(id);

	var data = {
		title: context[0].main_title,
		settings: context[1]
	};
	var templateScript = $("#template").html();
	var template = Handlebars.compile(templateScript);
	$("#main_settings").append(template(data));

	initEvents(id);
}

function getContext(id) {
	if (id == "main_opt") {
		return [{
				main_title: "Main settings"
			},
			[{
				title: "Type of encryption",
				content: getContent("enc_type")
			}]
		];
	} else if (id == "keys_opt") {
		return [{
				main_title: "My keys"
			},
			[{
				title: "",
				content: getContent("pub_keys")
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

function getContent(name) {
	if (name == "enc_type") {
		return `
		<div id = "enc_type">
		<div class="form-group">
			<div class="radio enc-type">
	  			<label><input type="radio" name="optradio">Passpharse</label>
			</div>
			<div class="radio enc-type">
  				<label><input checked type="radio" name="optradio">PGP keys</label>
  			</div>
  		</div></div>`;
	} else if (name == "pub_keys") {
		return getTableOfPubs();
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
		 </div>`
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
	} else if (name == "about") {
		return `Anton Zaslavskii`;
	}
}

function getTableOfPubs() {
	// some actions with local storage...

	return `
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
	    		<tbody>
	    		</tbody>
	  		</table>
		</div>
	</div>
	<div class="form-group btn-group col-md-5">
		<div class="btn-group">
			<button type="button" class="btn btn-success dropdown-toggle" data-toggle="dropdown">
	    		Add <span class="caret"></span></button>
	    	<ul class="dropdown-menu" role="menu">
	      		<li><a id="add_text" href="#">Text</a></li>
	      		<li><a id="add_file" href="#">File</a></li>
	    	</ul>
  		</div>
  		<input type="button" class="btn btn-primary" id="modify" value="Modify"></input>		
		<input type="button" class="btn btn-danger" id="del" value="Delete"></input>		
	</div>
	`;
}
// <input type="button" class="btn btn-success" id="add" value="Add"></input>

function initEvents(id) {
	if (id == "main_opt") {

	} else if (id == "keys_opt") {

		$("#add_text").click(function(event) {

		});

		$("#add_file").click(function(event) {
			addPKFile();
		});


		//drag n drop files
		var pkTable = document.getElementById("pk_table");
		pkTable.addEventListener("dragover", function(event) {
			event.preventDefault(); // отменяем действие по умолчанию
		}, false);

		pkTable.addEventListener("drop", function(event) {
			// отменяем действие по умолчанию
			event.preventDefault();

			var reader = new FileReader();
			reader.onload = function(event) {
				var content = event.target.result;
				try {
					var openpgp = window.openpgp;
					var obj = openpgp.key.readArmored(content);
					if (obj.keys[0].isPublic()) {
						var ids = obj.keys[0].getUserIds()[0];
						var email = ids.substr(ids.lastIndexOf(" ") + 1);
						var name = ids.substr(0, ids.lastIndexOf(" "));
						var jsonKey = "pk[" + name + ":" + email + "]";


						chrome.runtime.sendMessage(chrome.runtime.id, {
							action: "get",
							key: jsonKey,
							value:""
						}, function(response) {
							console.log(response.farewell);
						});


						chrome.runtime.sendMessage(chrome.runtime.id, {
							action: "set",
							key: jsonKey,
							value: content
						}, function(response) {
							console.log(response.farewell);
						});
						// localStorage[jsonKey]=obj;

					} else {
						throw new Error("Is not a public key!");
					}

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



	} else if (id == "gen_opt") {

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

		$("#save").click(function(event) {
			if ($("#gen_priv_key").val() && $("#gen_pub_key").val()) {
				saveTextAsFile("gen_priv_key", "private_key.txt");
				saveTextAsFile("gen_pub_key", "public_key.txt");
			}
		});

		$("[input],[type='text'],[type='password']").change(function(event) {
			if (event.currentTarget.value == "") {
				matchAsEmpty(event.currentTarget);
			} else {
				matchAsEmpty(event.currentTarget, true);
			}
		});
	} else if (id == "about_opt") {
		// alert('');
	}
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


function addPKFile() {

}

function matchAsEmpty(el, cancel = false) {
	if (cancel) {
		var container = $(el).closest('.form-group')
		if (container.hasClass('has-error'))
			container.removeClass('has-error');
	} else
		$(el).closest('.form-group').addClass('has-error');
}



//       <tr>
//         <td>John</td>
//         <td>Doe</td>
//         <td>john@example.com</td>
//       </tr>