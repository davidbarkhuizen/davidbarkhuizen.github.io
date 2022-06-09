var host = window.location.host;
var origin = window.location.origin;
var path = window.location.pathname;

console.log(`host ${host}, origin ${origin}, path ${path}`);

const elementRefs = () => {

	const getRef = (id) => document.getElementById(id);

	return {
		contentPanel: getRef('content-panel'),
		contentPanelHeader: getRef('content-panel-header'),
		contentPanelBody: getRef('content-panel-body'),
		navPanel: getRef('nav-panel')
	};	
};

const ref = elementRefs();

const CONTENT_TYPES = Object.freeze({
	APP_JSON: 'application/json',
	TEXT_PLAIN: 'text/plain'
});

const get = async (url, content_type) =>
	fetch(new Request(url, {
		method: 'GET',
		headers: new Headers({
			'Content-Type': content_type
		})
	}));

const renderEntry = (entry, text) => {

	const heading = document.createElement('h1');
	var heading_text = document.createTextNode(entry.title);
	heading.appendChild(heading_text);

	ref.contentPanelHeader.innerHTML = '';				
	ref.contentPanelHeader.appendChild(heading);

	var body_text = document.createTextNode(text);
	ref.contentPanelBody.innerHTML = '';				
	ref.contentPanelBody.appendChild(body_text);
};

const bindIndexFromJsonResponse = async (response) => {

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
		
			const response = await get(`/entry/${entry.link}`, CONTENT_TYPES.TEXT_PLAIN);
			const entry_data_reader = response.body.getReader();

			var data_buffer = new Uint8Array(0);

			const onAllEntryDataAvailable = async () => {
				const text = decoder.decode(data_buffer);

				const currentlySelectedIndexItem = document.querySelectorAll(`.selected.index-item`)[0];
				if (currentlySelectedIndexItem) {
					currentlySelectedIndexItem.classList.remove('selected');
				}				

				const toSelect = document.querySelectorAll(`.index-item[x-index-title='${entry.title}']`)[0]
				toSelect.classList.add('selected');

				renderEntry(entry, text);
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


		ref.navPanel.appendChild(item);
	});

	await selectFirst();
}

const enter = () => 
	get('index.json', CONTENT_TYPES.APP_JSON)
	.then(bindIndexFromJsonResponse);

enter();