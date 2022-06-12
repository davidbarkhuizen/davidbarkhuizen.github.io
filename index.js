var host = window.location.host;
var origin = window.location.origin;
var path = window.location.pathname;

console.log(`host ${host}, origin ${origin}, path ${path}`);

var dataModel = null;

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

const renderEntryHeader = (title, summary, keywords, date) =>
`<div>
	<div>${date} [${keywords.join(', ')}]</div>
	<div>${title}</div>
	<div>${summary}</div>
</div>`;

const renderAndSetEntry = (entry, text, mdReader, mdWriter) => {

	element.contentPanelHeader.innerHTML = renderEntryHeader(
		entry.title,
		entry.summary,
		entry.keywords,
		entry.date
	);				

	var parsed = mdReader.parse(text);
	var renderedHTML = mdWriter.render(parsed);
	element.contentPanelBody.innerHTML = renderedHTML;				
};

const onclick = async (entry, mdReader, mdWriter) => {
	
	const response = await get(`/entries/${entry.fileName}`, CONTENT_TYPES.TEXT_PLAIN);
	
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

		renderAndSetEntry(entry, text, mdReader, mdWriter);
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

const renderIndexItem = (entry, mdReader, mdWriter) => {

	const tooltip = 
`${entry.date} [${entry.keywords.join(', ')}]
${entry.title}
${entry.summary}
`;

	const template = 
`<div class="index-item" x-index-title="${entry.title}" title="${tooltip}">
	<span>${entry.title}<span>
</div>`;	

	const item = document.createElement('div');
	item.innerHTML = template;
	
	item.onclick = () => { onclick(entry, mdReader, mdWriter); };
	element.navPanel.appendChild(item);
};

const renderNavPanel = (dataModel, mdReader, mdWriter) => {

	dataModel.entries
		.map(entry => renderIndexItem(entry, mdReader, mdWriter));
};

const bindDataModel = (pDataModel, mdReader, mdWriter) => {

	document.title = pDataModel.title;

	pDataModel.entries.sort(item => new Date(item.date))

	pDataModel.entries
		.sort(item => new Date(item.date))
		.reverse();

	dataModel = pDataModel;

	renderNavPanel(pDataModel, mdReader, mdWriter);
}

const fetchDataModel = async () => { 
	const rsp = await get('index.json', CONTENT_TYPES.APP_JSON);
	return await rsp.json();
};

const processQueryString = async (mdReader, mdWriter) => {

	let params = (new URL(document.location)).searchParams;
	let fileName = params.get("fileName");
	
	const entry = dataModel.entries.find(it => it.fileName == fileName);

	if (entry) {
		onclick(entry, mdReader, mdWriter)
	}	
};

const enter = (mdReader, mdWriter) => 
	fetchDataModel()
	.then((dataModel) => bindDataModel(dataModel, mdReader, mdWriter))
	.then(() => processQueryString(mdReader, mdWriter));

window.enter = enter;