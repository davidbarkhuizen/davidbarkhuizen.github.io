var host = window.location.host;
var origin = window.location.origin;
var path = window.location.pathname;

console.log(`host ${host}, origin ${origin}, path ${path}`);

var GET_JSON_OPTIONS = { method: 'GET', body: 'json', headers: {} };

var index = [];

const bindIndexFromJson = async (response) => {

	const list_element = document.getElementById('nav-panel');

	const entries = await response.json();
	
	entries.forEach(entry => {
		
		const list_item = document.createElement("li");
		const item_text = document.createTextNode(entry.title);
		list_item.appendChild(item_text);

		console.log(list_item);
		
		list_element.appendChild(list_item);
	});
	
	return entries;
}

function load() {

	const request = new Request('index.json', {
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