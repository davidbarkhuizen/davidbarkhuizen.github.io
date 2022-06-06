var host = window.location.host;
var origin = window.location.origin;
var path = window.location.pathname;

console.log(`host ${host}, origin ${origin}, path ${path}`);

var GET_JSON_OPTIONS = { method: 'GET', body: 'json', headers: {} };

const bindIndexFromJson = async (response) => {

	const list_element = document.getElementById('nav-panel');
	const content_element = document.getElementById('content-panel');

	const meta_data = await response.json();

	document.title = meta_data.title;

	meta_data.entries.sort(item => new Date(item.date)).reverse().forEach(entry => {
		
		const list_item = document.createElement("div");
		
		const item_text = document.createTextNode(`${entry.title} (${entry.date})`);		
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

			var data_buffer = new Uint8Array(0);

			const onAllEntryDataAvailable = async () => {
				const text = decoder.decode(data_buffer);				

				const content_div = document.createElement("div");
				const content = document.createTextNode(text);
				content_div.appendChild(content);

				content_element.innerHTML = '';				
				content_element.appendChild(content_div);
			};

			const decoder = new TextDecoder();

			const processEntryData = async () => {

				const reader_rsp = await entry_data_reader.read();
				
				const new_data = reader_rsp.value;
				if (new_data) {
					const merged = new Uint8Array(data_buffer.length + new_data.length);
					merged.set(data_buffer);
					merged.set(new_data, data_buffer.length);
					data_buffer = merged
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
}

function load() {

	const fetchIndexRequest = new Request('index.json', {
		method: 'GET',
		headers: new Headers({
			'Content-Type': 'application/json'
		})
	});

	fetch(fetchIndexRequest)
	.then(bindIndexFromJson);
}

load();