widget = {
  createMatrix({ runResults, jobUrl }) {
    const rows = Object.entries(runResults).map((item) =>
      this.createRow(item, jobUrl),
    );
    content = rows.length
      ? `
			<div class="job-matrix">
			${rows.join('')}
			</div>
		`
      : `<div class="idle">Idle</div>`;
    return $(content);
  },

  createRow([label, data], jobUrl) {
    console.log(data);
    const items = data.map(
      (item) => `
			<a title="${item.fullDisplayName}"
			   href="${jobUrl}/${item.id}"
			   target=”_blank”
			   class="job-matrix-bubbles-item ${item.value}"
			/>
		`,
    );
    const os = label.includes('win')
      ? 'windows'
      : label.includes('macos')
        ? 'apple'
        : 'linux';
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
    const { subtitle, runResults, jobUrl } = data;
    $('.widget-title').html(`
			<h2 class="widget-title">
				<a href="${jobUrl}" target="_blank">${subtitle}</a>
			</h2>
		`);
    $('.content', el).html(this.createMatrix({ runResults, jobUrl }));
  },
};
