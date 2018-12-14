widget = {
	createMatrix(title, subtitle, jobResults) {
		return $(`
			<h2 class="widget-title">${subtitle}</h2>
			<div class="job-matrix">
				${Object.entries(jobResults).map(this.createRow).join('')}
			</div>
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
		const { title, subtitle, jobResults } = data;
		const content = this.createMatrix(title, subtitle, jobResults);
		$('.content', el).html(content);
	}
};