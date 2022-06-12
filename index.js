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

const httpGET = async (url, content_type) =>
	fetch(new Request(url, {
		method: 'GET',
		headers: new Headers({
			'Content-Type': content_type,
			'pragma' : 'no-cache',
			'cache-control': 'no-cache'
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

const onclick = async (entry, mdReader, mdWriter, push = true) => {
	
	const response = await httpGET(`/entries/${entry.fileName}`, CONTENT_TYPES.TEXT_PLAIN);
	
	if (push) {
		var searchParams = new URLSearchParams(window.location.search)
		searchParams.set("fileName", entry.fileName);
		var newRelativePathQuery = window.location.pathname + '?' + searchParams.toString();
		history.pushState(entry.fileName, '', newRelativePathQuery);
	}

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
	<a href="/entries/${entry.fileName}" onclick="return false;">${entry.title}</a>
</div>`;	

	const item = document.createElement('div');
	item.innerHTML = template;
	
	item.onclick = () => { onclick(entry, mdReader, mdWriter, true); };
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
	const rsp = await httpGET('index.json', CONTENT_TYPES.APP_JSON);
	return await rsp.json();
};

const loadFileName = async (fileName, mdReader, mdWriter, push) => {
	const entry = dataModel.entries.find(it => it.fileName == fileName);

	if (entry) {
		onclick(entry, mdReader, mdWriter, push)
	}	
};

const processQueryString = async (mdReader, mdWriter) => {

	let params = (new URL(document.location)).searchParams;
	let fileName = params.get("fileName");
	
	await loadFileName(fileName, mdReader, mdWriter);
};

const enter = (mdReader, mdWriter) => 
	fetchDataModel()
	.then((dataModel) => bindDataModel(dataModel, mdReader, mdWriter))
	.then(() => {
		addEventListener('popstate', event => {
			// TODO retrieve from cache, do not make new server request
			loadFileName(event.state, mdReader, mdWriter, false);
		})
	})
	.then(() => processQueryString(mdReader, mdWriter));

window.enter = enter;