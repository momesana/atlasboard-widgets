widget = {
	createPullRequestItem: (config, pullRequest) => {
		const { baseUrl, projectName } = config;
		const { title, author: { user: { slug } }, toRef: { displayId: branch }, reviewers } = pullRequest;
		const rx = new RegExp(`^(?:.*\\/)?${projectName}-(\\d+)(.*)$`);
		const stripPrefix = title => {
			const [_, id, text] = title.match(rx);
			return {
				id,
				text: text.replace(/^[: /]*/, '') // strip away unnecessary leading characters
			};
		};

		const reviewerStateMapping = {
			"APPROVED": "reviewer-approved",
			"NEEDS_WORK": "reviewer-needs-work"
		};

		const reviewerImages = reviewers.map(reviewer =>
			`<img class="avatar-circle ${reviewerStateMapping[reviewer.status]}"
				  src="${baseUrl}/users/${reviewer.user.slug}/avatar.png"/>`)
			.join('');

		const { id, text } = stripPrefix(title);
		return `
			<div class="pull-requests-item">
	            <div class="pull-requests-item-avatar">
	                <img class="avatar-circle" src="${baseUrl}/users/${slug}/avatar.png"/>
	            </div>
	            <div class="pull-requests-item-content">
	            	<div class="pull-requests-item-content-ticket">
						<span class="pull-requests-item-content-ticket-text">${text}</span>
	            	</div>
	            	<div class="pull-requests-item-content-branch">
	            		<img class="pull-requests-item-content-branch-icon"
	            			 src="/widgets/resources?resource=atlasboard-widgets/bitbucket/Git-Icon-White.png"/>
						${projectName}-${id} &rarr; ${branch} ${reviewerImages}
	            	</div>
	            </div>
	        </div>
		`;
	},


	onData: function (el, data) {
		const { pullRequests, jobConfig } = data;
		const pullRequestsEl = $('.pull-requests', el);
		const { numberOfItems, widgetTitle } = jobConfig;

		$('.widget-title', el).text(widgetTitle);

		const content = pullRequests
			.slice(0, numberOfItems)
			.map(pullRequest => this.createPullRequestItem(jobConfig, pullRequest))
			.join('');

		pullRequestsEl.html(content);
	}
};