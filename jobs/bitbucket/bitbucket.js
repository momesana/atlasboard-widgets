/* global process */

const axios = require('axios');

const filters = {
	'default': () => true,
	'filter-needs-work': pullRequest => pullRequest.reviewers.some(reviewer => reviewer.status === 'NEEDS_WORK' || pullRequest.properties.openTaskCount > 0),
	'filter-no-reviewer': pullRequest => !pullRequest.reviewers || !pullRequest.reviewers.length
};

const fetchNextPage = async (accessToken, url) => {

    const response = await axios({
        url: `${url}`,
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`
        }
    });

    return response.data;
};

const fetchAll = async (config) => {

    const {
        globalAuth,
            authName = 'bitbucket',
            numberOfItems,
            baseUrl,
            projectName,
            filterType,
            repoName
    } = config;

    const {accessToken} = globalAuth[authName];
    const urlWithoutReqParams =
        `${baseUrl}/rest/api/1.0/projects/${repoName.toUpperCase()}/repos/${projectName.toLowerCase()}/pull-requests`;

    const pullRequests = [];
    let nextStartPage = null;
    let isLastPage = false;

    while (!isLastPage && pullRequests.length < numberOfItems) {
        const url = urlWithoutReqParams + (nextStartPage ? `?start=${nextStartPage}` : '');
        const data = await fetchNextPage(accessToken, url);
        const {values, isLastPage: isLast, nextPageStart: nextPage} = data;
        nextStartPage = nextPage;
        isLastPage = isLast;
        pullRequests.push(...values.filter(filters[filterType || 'default']));
    }

    return pullRequests.slice(0, numberOfItems);
};

module.exports = {
	onInit: function (config, dependencies) {
	},

	onRun: async function (config, dependencies, jobCallback) {
		try {
			const {globalAuth, authName = 'bitbucket', baseUrl, projectName, widgetTitle} = config;

            if (!globalAuth || !globalAuth[authName] || !globalAuth[authName].accessToken) {
                return jobCallback('missing BitBucket access token');
            }

            const pullRequests = await fetchAll(config);
            const jobConfig = {
                widgetTitle,
                baseUrl,
                projectName
            };

            jobCallback(null, {jobConfig, pullRequests});
        } catch (e) {
            jobCallback(e.message);
        }
    }
};
