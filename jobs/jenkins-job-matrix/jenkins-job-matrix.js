const axios = require('axios');

const orderedStates = [undefined, 'success', 'building', 'unstable', 'failure'];

const isMoreSevere = (first, second) => orderedStates.indexOf(first) - orderedStates.indexOf(second) < 0;

const filterByName = (nameFilter, runData) => (
    runData.filter(({fullDisplayName}) => nameFilter.test(fullDisplayName))
);

const extractRunData = ({ result, builtOn }) => ({
	label: (builtOn.includes('docker') ? 'linux' : builtOn), // Fixme: use a mapping to rename, merge items
	value: result ? result.toLowerCase() : 'building'
});

const getBuildResult = runData => {

	return runData.reduce((acc, { label, value }) => {
		if (isMoreSevere(acc[label], value)) {
			acc[label] = value;
		}
		return acc;
	}, {});
};

module.exports = {

	onInit(config, dependencies) {
	},

	onRun: async function (config, dependencies, jobCallback) {
		try {
			const { globalAuth, authName = 'jenkins', nameFilter = '.*' } = config;

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

            nameFilterRegex = new RegExp(nameFilter);
			const jobResults = response.data.builds
				.map(({ runs }) => filterByName(nameFilterRegex, runs))
				.map(( runs ) => runs.map(extractRunData))
				.map(getBuildResult)
				.reduce((acc, cur) => {
					Object.entries(cur).forEach(([key, value]) =>
						acc[key] = acc[key] ? [...acc[key], value] : [value]);
					return acc;
				}, {});

			jobCallback(null, {
				widgetTitle,
				subtitle: matrixJob,
				jobResults
			});
		} catch (e) {
			console.error(e);
			jobCallback(e.message);
		}
	}
};