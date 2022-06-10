var host = window.location.host;
var origin = window.location.origin;
var path = window.location.pathname;

console.log(`host ${host}, origin ${origin}, path ${path}`);

const getElementRefs = () => {

	const getRef = (id) => document.getElementById(id);

	return {
		contentPanel: getRef('content-panel'),
		contentPanelHeader: getRef('content-panel-header'),
		contentPanelBody: getRef('content-panel-body'),
		navPanel: getRef('nav-panel')
	};	
};

const element = getElementRefs();

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

const renderEntry = (entry, text, mdReader, mdWriter) => {

	const heading = document.createElement('h1');
	var heading_text = document.createTextNode(entry.title);
	heading.appendChild(heading_text);

	element.contentPanelHeader.innerHTML = '';				
	element.contentPanelHeader.appendChild(heading);

	var parsed = mdReader.parse(text);
	var renderedHTML = mdWriter.render(parsed);
	element.contentPanelBody.innerHTML = renderedHTML;				
};

const renderIndexItem = (entry, mdReader, mdWriter) => {

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

			renderEntry(entry, text, mdReader, mdWriter);
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
	
	element.navPanel.appendChild(item);

	return onclick;
};

const bindMetaData = (metaData, mdReader, mdWriter) => {

	document.title = metaData.title;

	return metaData.entries
		.sort(item => new Date(item.date))
		.reverse()
		.map(entry => renderIndexItem(entry, mdReader, mdWriter));
}

const fetchinitialDataModel = async () => { 
	const rsp = await get('index.json', CONTENT_TYPES.APP_JSON);
	return await rsp.json();
};

const enter = (mdReader, mdWriter) => 
	fetchinitialDataModel()
	.then((data) => bindMetaData(data, mdReader, mdWriter))
	.then((onclicks) => onclicks[0]());

// enter();

window.enter = enter;