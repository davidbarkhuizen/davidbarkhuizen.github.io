var host = window.location.host;
var origin = window.location.origin;
var path = window.location.pathname;

console.log(`host ${host}, origin ${origin}, path ${path}`);

var GET_JSON_OPTIONS = { method: 'GET', body: 'json', headers: {} };

var index
var index = [];

function bindIndexFromJson(response) {
	return response.json();
}

function load() {

	var request = new Request('index.json', {
		method: 'GET',
		headers: new Headers({
			'Content-Type': 'application/json'
		})
	});


	fetch(request)
	.then(bindIndexFromJson)
	.then(function(j){ console.log(j); });
}

load();