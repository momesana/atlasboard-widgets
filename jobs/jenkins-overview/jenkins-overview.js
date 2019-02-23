/**
 * Job: jenkins-overview
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

module.exports = {

	/**
	 * Executed on job initialisation (only once)
	 * @param config
	 * @param dependencies
	 */
	onInit(config, dependencies) {
	},

	/**
	 * Executed every interval
	 * @param config
	 * @param dependencies
	 * @param jobCallback
	 */
	async onRun(config, dependencies, jobCallback) {
		try {
			const { globalAuth, authName = 'jenkins', ignoreList } = config;

			if (!globalAuth || !globalAuth[authName] ||
				!globalAuth[authName].accessToken || !globalAuth[authName].username) {
				return jobCallback('missing Jenkins credentials');
			}

			const { username, accessToken: password } = globalAuth[authName];
			const { relevantColorsOrdered: colors, numberOfItems, baseUrl } = config;

			const response = await axios({
				url: `${baseUrl}/api/json`,
				auth: {
					username,
					password
				},
				headers: {
					Accept: 'application/json',
				}
			});

			const sortByColorAndName = (job1, job2) => {
				return colors.indexOf(job1.color) - colors.indexOf(job2.color)
					|| job1.name.localeCompare(job2.name);
			};


			const { jobs } = response.data;
			const jenkinsBuilds = jobs
				.filter(({ color }) => colors.includes(color))
				.filter(({ name }) => !ignoreList.some(toIgnore => (new RegExp(toIgnore)).test(name)))
				.sort(sortByColorAndName)
				.slice(0, numberOfItems);

			jobCallback(null, { jobConfig: config, jenkinsBuilds }); // fixme: don't pass the credentials on
		} catch (e) {
			jobCallback(e.message);
		}
	}
};