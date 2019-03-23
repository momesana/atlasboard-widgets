const axios = require('axios');

module.exports = {

	/**
	 * Executed every interval
	 * @param config
	 * @param dependencies
	 * @param jobCallback
	 */
	onRun: async function (config, dependencies, jobCallback) {
		try {
			const { globalAuth, authName = 'bitbucket',
			        numberOfItems, baseUrl, projectName,
			        repoName, widgetTitle } = config;

			if (!globalAuth || !globalAuth[authName] || !globalAuth[authName].accessToken) {
				return jobCallback('missing BitBucket access token');
			}

			const { accessToken } = globalAuth[authName];
			const response = await axios({
				url: `${baseUrl}/rest/api/1.0/projects/${repoName.toUpperCase()}/repos/${projectName.toLowerCase()}/pull-requests`,
				headers: {
					Accept: 'application/json',
					Authorization: `Bearer ${accessToken}`
				}
			});

			const { data } = response;
			const jobConfig = {baseUrl, projectName, widgetTitle}

	        const reducer = (acc, pullRequest) => {
	            pullRequest.reviewers
	                       .filter(reviewer => reviewer.status === 'UNAPPROVED')
	                       .forEach(({user: {slug}}) => acc[slug] = [...(acc[slug] || []), pullRequest]);
	            return acc;
	        };

			const byReviewer = Object.entries(data.values.reduce(reducer, {}))
			                         .sort()
			                         .slice(0, numberOfItems)
			                         .map(([reviewer, pullRequests]) => ({reviewer, pullRequests}))
			                         .sort(({ pullRequests: pr1 }, { pullRequests: pr2}) => pr1.length - pr2.length);
			jobCallback(null, { jobConfig: config, byReviewer });
		} catch (e) {
			jobCallback(e.message);
		}
	}
};
