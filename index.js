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
		
		list_item.onclick = async () => {

			const fetchEntryRequest = new Request(`/entry/${entry.link}`, {
				method: 'GET',
				headers: new Headers({
					'Content-Type': 'text/plain'
				})
			});
			
		
			const response = await fetch(fetchEntryRequest)
			const entry_data_reader = response.body.getReader();

			var all_data = '';

			const onAllEntryDataAvailable = async () => {
				console.log(all_data);
			};

			const decoder = new TextDecoder();

			const processEntryData = async () => {

				const reader_rsp = await entry_data_reader.read();
				
				const new_data = reader_rsp.value;
				if (new_data) {
					all_data  = all_data + decoder.decode(new_data);
				}

				if (reader_rsp.done) {
					await onAllEntryDataAvailable();
				} else {
					await processEntryData();
				}
			}

			await processEntryData()
		};		
		
		list_element.appendChild(list_item);
	});
	
	return entries;
}

function load() {

	const fetchIndexRequest = new Request('index.json', {
		method: 'GET',
		headers: new Headers({
			'Content-Type': 'application/json'
		})
	});

	fetch(fetchIndexRequest)
	.then(bindIndexFromJson)
	.then(function(j){ console.log(j); });
}

load();