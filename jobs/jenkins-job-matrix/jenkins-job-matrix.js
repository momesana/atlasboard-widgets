const axios = require('axios');

const orderedStates = [undefined, 'success', 'unstable', 'failure'];

const isMoreSevere = (first, second) => orderedStates.indexOf(first) - orderedStates.indexOf(second) < 0;

const extractRunData = ({ result, builtOn }) => ({
	label: (builtOn.includes('docker') ? 'linux' : builtOn), // Fixme: use a mapping to rename, merge items
	value: result.toLowerCase()
});

const getBuildResult = runData => {

	return runData.reduce((acc, { label, value }) => {
		if (isMoreSevere(acc.buildResult[label], value)) {
			acc.buildResult[label] = value;
		}
		return acc;
	}, { buildResult: {} });
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
				url: `${baseUrl}/job/${matrixJob}/api/json?tree=builds[runs[builtOn,result,id,fullDisplayName]]{,${numberOfItems}}`,
				auth: {
					username,
					password
				},
				headers: {
					Accept: 'application/json',
				}
			});

			const {jobResults} = response.data.builds
				.map(({runs}) => runs.map(extractRunData))
				.map(getBuildResult)
				.reduce((acc, { buildResult }) => {
					Object.entries(buildResult).forEach(([key, value]) => {
						acc.jobResults[key] = acc.jobResults[key] ? [...acc.jobResults[key], value] : [value];
					});
					return acc;
				}, { jobResults: {} });

			jobCallback(null, {
				jobConfig: config,
				title: widgetTitle,
				subtitle: matrixJob,
				jobResults
			});
		} catch (e) {
			console.error(e);
			jobCallback(e.message);
		}
	}
};