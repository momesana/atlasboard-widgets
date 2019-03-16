widget = {
    createPullRequestItem: (config, pullRequest) => {
        try {
            const {baseUrl, projectName} = config;
            const {title, author: {user: {slug}}, toRef: {displayId: branch}, reviewers, properties} = pullRequest;
            const rx = new RegExp(`^.*${projectName}-(\\d+)(.*)$`);

            const stripPrefix = title => {
                const [_, id, rawText] = title.match(rx);
                const text = rawText.replace(/^[: /]*/, '');  // strip away unnecessary leading characters

                return {
                    id,
                    text: (text && text.length) ? text: '(no description &#9785;)'
                };
            };

            const reviewerStateMapping = {
                "APPROVED": "reviewer-approved",
                "NEEDS_WORK": "reviewer-needs-work"
            };

            const reviewerImages = reviewers.map(reviewer =>
                `<div class="wrapper">
					<img class="avatar-circle ${reviewerStateMapping[reviewer.status]}"
					  src="${baseUrl}/users/${reviewer.user.slug}/avatar.png"/>
				</div>
				`).join('');

            const openTaskCount = (properties.openTaskCount > 0) ? `
                <div class="pull-requests-item-content-tasks">
			    <i class="far fa-check-square"></i>
			    <span>${properties.openTaskCount}</span>
                </div>
			` : '';

            const {id, text} = stripPrefix(title);

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
						${projectName}-${id} &rarr; ${branch} ${reviewerImages} ${openTaskCount}
	            	</div>
	            </div>
	        </div>
		`;
        } catch (e) {
			console.warn(e);
			console.warn('happened for', pullRequest);
            return null;
        }
    },


    onData: function (el, data) {
        const {pullRequests, jobConfig} = data;
        const pullRequestsEl = $('.pull-requests', el);
        const {widgetTitle} = jobConfig;

        $('.widget-title', el).text(widgetTitle);

        const content = pullRequests
            .map(pullRequest => this.createPullRequestItem(jobConfig, pullRequest))
            .filter(pullRequest => Boolean(pullRequest)) // filter away null values
            .join('');

        pullRequestsEl.html(content);
    }
};