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
		 			<input type="text" class="form-control" id="subj_passphrase" placeholder="key">
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
		</div>
		`;
	} else if (name == "about") {
		return `Anton Zaslavskii`;
	}
}

function getTableOfPubs() {
	// some actions with local storage...

	return `
	<div class="form-group">
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
	</div>`;
}

function initEvents(id) {
	if (id == "main_opt") {
		// alert('');
	} else if (id == "keys_opt") {
		// alert('');
	} else if (id == "gen_opt") {

		$("#generate").click(function(event) {
			if (validateForm(event)){
				data = {
					userIds:[{name:$("#subj_name").val(),email:$("#subj_email").val()}],
					numBits:4096,
					passphrase:$("#subj_passphrase").val() //protects a private key
				};
				result = generateKeys(data);
				$("#gen_priv_key").val(result.privKey);
				$("#gen_pub_key").val(result.pubKey);
			}
		});

		$("[input],[type='text']").change(function(event) {
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
	$("[input],[type='text']").each(function(index, el) {
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
		var container = $(el).closest('.form-group')
		if (container.hasClass('has-error'))
		container.removeClass('has-error');
	} else
		$(el).closest('.form-group').addClass('has-error');
}

function generateKeys(data){
	result = {privKey:undefined, pubKey:undefined};
	
	var openpgp = window.openpgp; // use as CommonJS, AMD, ES6 module or via window.openpgp

	if (openpgp.getWorker() == undefined)
		openpgp.initWorker({
			path: 'openpgp.worker.min.js'
		});

	openpgp.generateKey(data).then( function(key){
		result.privKey = key.privateKeyArmored;
		result.pubKey = key.publicKeyArmored;
	},function(){alert("упс")})
	return result;
}

//       <tr>
//         <td>John</td>
//         <td>Doe</td>
//         <td>john@example.com</td>
//       </tr>