widget = {
	createMatrix(title, subtitle, jobResults) {
		const rows = Object.entries(jobResults).map(this.createRow);
		content = rows.length
		? `
			<div class="job-matrix">
			${rows.join('')}
			</div>
		`
		: '<div class="idle">Idle</div>';
		return $(`
			<h2 class="widget-title">${subtitle}</h2>
			${content}
		`);
	},

	createRow([label, states]) {
		const items = states.map(state => `<div class="job-matrix-bubbles-item ${state}"></div>`);
		const os = label.includes('win') ? 'windows' : 'linux';
		return `
			<div class="job-matrix-label">
				<span>${label}</span>
				<span style="margin-left: 0.25em;"><i class="fab fa-${os}"/></span>
			</div>
			<div class="job-matrix-bubbles">${items.join('')}</div>
		`;
	},
	//runs when we receive data from the job
	onData(el, data) {
		const { widgetTitle, subtitle, jobResults } = data;
		const content = this.createMatrix(widgetTitle, subtitle, jobResults);
		$('.content', el).html(content);
	}
};