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

	var data = {title:context[0].main_title,settings:context[1]};
	var templateScript = $("#template").html();
	var template = Handlebars.compile(templateScript);
	$("#main_settings").append(template(data));
}

function getContext(id){
	if (id == "main_opt"){
		return [{main_title:"Main settings"},
				[{title:"Type of encryption",content:getContent("enc_type")},
				{title:"HKP server",content:getContent("hkp_srv")}]];
	}
	else if (id == "keys_opt") {
		return [{main_title:"My keys"},[{title:"Public keys",content:getContent("pub_keys")}]];	
	}
	else if (id == "gen_opt") {
		return [{main_title:"Key generation"},[{title:"Subject"},{title:"Encryption"},{title:"Keys"}]];
	}
	else if (id == "about_opt"){
		return [{main_title:"About"},[{title:"Author"}]];
	}
}

function getContent(name){
	if (name == "enc_type"){
		return  `<div class="radio">
  <label><input type="radio" name="optradio">Passpharse</label>
</div>
<div class="radio">
  <label><input checked type="radio" name="optradio">PGP keys</label>
</div>`;
	}
	else if (name=="hkp_srv") {
		return `<input type="text" class="form-control" id="HKP_SRV">`;
	}
	else if (name=="pub_keys") {
		return getTableOfPubs();
	}
}

function getTableOfPubs(){
	// some actions with local storage...

	return `<div class="container">       
  <table class="table table-hover">
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
</div>`;
}

//       <tr>
//         <td>John</td>
//         <td>Doe</td>
//         <td>john@example.com</td>
//       </tr>
