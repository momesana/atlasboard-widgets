const axios = require('axios');

const fetchData = async (baseUrl, username, password, job, descriptionFilters, numberOfItems) => {
    const response = await axios({
        url: `${baseUrl}/job/${job}/api/json?tree=builds[description,duration,displayName,timestamp]`,
        auth: {
            username,
            password
        },
        headers: {
            Accept: 'application/json',
        }
    });

    return {
        job,
        data: response.data
                      .builds
                      .filter(({ description }) => description && (!Object.keys(descriptionFilters).includes(job)
                                                                   || description.includes(descriptionFilters[job])))
                      .map(({ duration, displayName, timestamp }) => ({ duration, displayName, timestamp }))
                      .slice(0, numberOfItems)
                      .reverse(),
    };
};

module.exports = {

	onRun: async function (config, dependencies, jobCallback) {
		try {
			const { globalAuth, authName = 'jenkins' } = config;

			if (!globalAuth || !globalAuth[authName] ||
				!globalAuth[authName].accessToken || !globalAuth[authName].username) {
				return jobCallback('missing Jenkins credentials');
			}

			const { username, accessToken: password } = globalAuth[authName];
			const { numberOfItems, baseUrl, jobs, descriptionFilters, widgetTitle} = config;

            const fetchForJob = job => fetchData(baseUrl, username, password, job, descriptionFilters, numberOfItems);
			const buildTimeDetails = await Promise.all(jobs.map(fetchForJob));

			jobCallback(null, {
				title: widgetTitle,
				buildTimeDetails
			});

		} catch (e) {
			console.error(e);
			jobCallback(e.message);
		}
	}
};