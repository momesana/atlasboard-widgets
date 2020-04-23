widget = {
	getSignForColor(color) {
		const defaultSign = '&#10004;';
		return color === 'red' ? '&#9760;' : (color === 'yellow') ? '&#9888;' : defaultSign;
	},

	createAllOkItem(message) {
		return $(`
        <div class="jenkins-all-green"><div>${message}</div></div>
      `);
	},

	createJobOverview(jenkinsBuilds) {
		return jenkinsBuilds.map(({ name, color, isBuilding }) => {
			const sign = this.getSignForColor(color);
			const statusBuilding = isBuilding ? 'status-building' : '';
			return `<div class="jenkins-job-item status-${color} ${statusBuilding}">${sign} ${name}</div>`;
		}).join('');

	},

	onData(el, data) {
		const { jenkinsBuilds, widgetTitle, allGreenMessage } = data;

		$(el.closest('.widget-container')).css({
			display: 'flex',
			'flex-direction': 'column'
		});

		$('.widget-title', el).text(widgetTitle);

		if (!jenkinsBuilds.length) {
			$('.content', el).html(this.createAllOkItem(allGreenMessage));
		} else {
			$('.content', el).html(this.createJobOverview(jenkinsBuilds));
		}
	}
};