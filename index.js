var host = window.location.host;
var origin = window.location.origin;
var path = window.location.pathname;

console.log(`host ${host}, origin ${origin}, path ${path}`);

var GET_JSON_OPTIONS = { method: 'GET', body: 'json', headers: {} };

const contentPanelHeader = document.getElementById('content-panel-header');
const contentPanelBody = document.getElementById('content-panel-body');

const renderEntry = (entry, text) => {

	const heading = document.createElement('h1');
	var heading_text = document.createTextNode(entry.title);
	heading.appendChild(heading_text);

	contentPanelHeader.innerHTML = '';				
	contentPanelHeader.appendChild(heading);

	var body_text = document.createTextNode(text);
	contentPanelBody.innerHTML = '';				
	contentPanelBody.appendChild(body_text);
};

const bindIndexFromJson = async (response) => {

	const list_element = document.getElementById('nav-panel');
	const content_element = document.getElementById('content-panel');

	const meta_data = await response.json();

	document.title = meta_data.title;

	var selectFirst = null;

	meta_data.entries.sort(item => new Date(item.date)).reverse().forEach(entry => {
		
		const item = document.createElement("div");
		item.classList.add('index-item');

		item.setAttribute('x-index-title', entry.title);
		
		const item_text = document.createTextNode(`${entry.title} (${entry.date})`);		
		item.appendChild(item_text);
		
		const onclick = async () => {

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

				const currentlySelectedIndexItem = document.querySelectorAll(`.selected.index-item`)[0];
				console.log(currentlySelectedIndexItem);
				if (currentlySelectedIndexItem) {
					currentlySelectedIndexItem.classList.remove('selected');
				}				

				const toSelect = document.querySelectorAll(`.index-item[x-index-title='${entry.title}']`)[0]
				console.log(toSelect);
				toSelect.classList.add('selected');

				renderEntry(entry, text, content_element);
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
		
		item.onclick = onclick;
		
		if (!selectFirst) {
			selectFirst = onclick;
		}


		list_element.appendChild(item);
	});

	await selectFirst();
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