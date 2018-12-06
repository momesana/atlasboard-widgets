/**
 * Job: jenkins-job-matrix
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

const getRunData = async function (username, password, url) {

	const response = await axios({
		url: `${url}/api/json`,
		auth: {
			username,
			password
		},
		headers: {
			Accept: 'application/json',
		}
	});

	const { result, builtOn, culprits } = response.data;

	return {
		label: (builtOn.includes('docker') ? 'linux' : builtOn), // Fixme: use a mapping to rename, merge items
		value: result.toLowerCase(),
		culprits: culprits.map(({ fullName }) => fullName)
	};
};

const getBuildData = async function (username, password, url) {

	const response = await axios({
		url: `${url}/api/json`,
		auth: {
			username,
			password
		},
		headers: {
			Accept: 'application/json',
		}
	});

	const results = await Promise.all(
		response.data.runs.map(({ url }) => getRunData(username, password, url))
	);

	const orderedStates = [undefined, 'success', 'unstable', 'failure'];

	const isMoreSevere = (first, second) =>
		orderedStates.indexOf(first) - orderedStates.indexOf(second) < 0;

	return results.reduce((acc, { label, value, culprits }) => {
		if (isMoreSevere(acc.buildResult[label], value)) {
			acc.buildResult[label] = value;
		}
		acc.culprits.push(...culprits);
		return acc;
	}, { buildResult: {}, culprits: [] });
};

module.exports = {

	onInit(config, dependencies) {
	},

	onRun: async function (config, dependencies, jobCallback) {
		try {
			const { globalAuth, authName = 'jenkins' } = config;

			if (!globalAuth || !globalAuth[authName] ||
				!globalAuth[authName].accessToken || !globalAuth[authName].username) {
				return jobCallback('missing Jenkins credentials');
			}

			const { username, accessToken: password } = globalAuth[authName];
			const { numberOfItems, baseUrl, widgetTitle, matrixJob } = config;

			const response = await axios({
				url: `${baseUrl}/job/${matrixJob}/api/json`,
				auth: {
					username,
					password
				},
				headers: {
					Accept: 'application/json',
				}
			});

			const urls = response.data.builds
				.slice(0, numberOfItems)
				.map(build => build.url);

			const buildResults = await Promise
				.all(urls.map(url => getBuildData(username, password, url)));

			const { jobResults, culprits } = buildResults.reduce((acc, { buildResult, culprits }) => {
				Object.entries(buildResult).forEach(([key, value]) => {
					acc.jobResults[key] = acc.jobResults[key] ? [...acc.jobResults[key], value] : [value];
					acc.culprits.add(...culprits);
				});
				return acc;
			}, { jobResults: {}, culprits: new Set() });

			jobCallback(null, { jobConfig: config, title: widgetTitle, subtitle: matrixJob, jobResults, culprits: [...culprits] });
		} catch (e) {
			console.error(e);
			jobCallback(e.message);
		}
	}
};