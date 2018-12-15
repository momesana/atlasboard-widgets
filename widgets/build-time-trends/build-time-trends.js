widget = {
	createChart: function (canvas, job, durations, labels) {
		new Chart(canvas, {
			type: 'line',
			options: {
				maintainAspectRatio: false,
				scales: {
					yAxes: [{
						scaleLabel: {
							display: true,
							labelString: 'duration in hours'
						}
					}]
				}
			},
			data: {
				labels,
				datasets: [{
					label: job,
					backgroundColor: "rgba(255,99,132,0.2)",
					borderColor: "rgba(255,99,132,1)",
					fill: true,
					borderWidth: 2,
					pointRadius: 5,
					hoverBackgroundColor: "rgba(255,99,132,0.4)",
					hoverBorderColor: "rgba(255,99,132,1)",
					data: durations,
				}]
			}
		});
	},

	onData: function (el, data) {
		const { job, title, buildTimeDetails } = data;
		$('h2.widget-title', el).text(`${title}: ${job}`);
		const canvas = $('canvas', el);
		const { durations, labels } = buildTimeDetails.reduce((acc, { duration, displayName, timestamp }) => {
			acc.durations.push(duration / 3600000);
			acc.labels.push(dateFormat(new Date(timestamp), `ddd dd.mm`));
			return acc;
		}, { durations: [], labels: [] });
		this.createChart(canvas, job, durations, labels);
	}
};

