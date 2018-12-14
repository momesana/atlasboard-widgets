const axios = require('axios');

const orderedStates = [undefined, 'success', 'unstable', 'failure'];

const isMoreSevere = (first, second) => orderedStates.indexOf(first) - orderedStates.indexOf(second) < 0;

const extractRunData = ({ result, builtOn, culprits }) => ({
	label: (builtOn.includes('docker') ? 'linux' : builtOn), // Fixme: use a mapping to rename, merge items
	value: result.toLowerCase(),
	culprits: culprits.map(({ id }) => id)
});

const getBuildResult = runData => {
	return runData.reduce((acc, { label, value, culprits }) => {
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
				url: `${baseUrl}/job/${matrixJob}/api/json?tree=builds[runs[builtOn,result,id,fullDisplayName,culprits[id]]]{,${numberOfItems}}`,
				auth: {
					username,
					password
				},
				headers: {
					Accept: 'application/json',
				}
			});

			const {jobResults, culprits} = response.data.builds
				.map(({runs}) => runs.map(extractRunData))
				.map(getBuildResult)
				.reduce((acc, { buildResult, culprits }) => {
					Object.entries(buildResult).forEach(([key, value]) => {
						acc.jobResults[key] = acc.jobResults[key] ? [...acc.jobResults[key], value] : [value];
						acc.culprits.add(...culprits);
					});
					return acc;
				}, { jobResults: {}, culprits: new Set() });

			jobCallback(null, {
				jobConfig: config,
				title: widgetTitle,
				subtitle: matrixJob,
				jobResults,
				culprits: [...culprits]
			});
		} catch (e) {
			console.error(e);
			jobCallback(e.message);
		}
	}
};