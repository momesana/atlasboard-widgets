/* global process */
/**
 * Job: bitbucket
 *
 * Expected configuration:
 *
 * ## PLEASE ADD AN EXAMPLE CONFIGURATION FOR YOUR JOB HERE
 * { 
 *   myconfigKey : [ 
 *     { serverUrl : 'localhost' } 
 *   ]
 * }
 */

const axios = require('axios');

const filters = {
	'default': () => true,
	'filter-needs-work': pullRequest => pullRequest.reviewers.some(reviewer => reviewer.status === 'NEEDS_WORK' || pullRequest.properties.openTaskCount > 0),
	'filter-needs-review': pullRequest => pullRequest.reviewers.some(reviewer => reviewer.status === 'UNAPPROVED'),
	'filter-no-reviewer': pullRequest => !pullRequest.reviewers || !pullRequest.reviewers.length
};

module.exports = {

	/**
	 * Executed on job initialisation (only once)
	 * @param config
	 * @param dependencies
	 */
	onInit: function (config, dependencies) {
	},

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
			         filterType, repoName, widgetTitle } = config;

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
			const pullRequests = data.values.filter(filters[filterType || 'default'])
			                                .slice(0, numberOfItems);
			jobCallback(null, { jobConfig: config, pullRequests });
		} catch (e) {
			jobCallback(e.message);
		}
	}
};
