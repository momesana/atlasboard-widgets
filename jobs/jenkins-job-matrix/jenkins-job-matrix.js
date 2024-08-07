const axios = require('axios');

const orderedStates = [undefined, 'success', 'building', 'unstable', 'failure'];

const isMoreSevere = (first, second) => orderedStates.indexOf(first) - orderedStates.indexOf(second) < 0;

const filterByName = (nameFilter, runData = []) => (
    runData.filter(({fullDisplayName}) => nameFilter.test(fullDisplayName))
);

const extractRunData = (data) => ({
	...data,
	label: (data.builtOn.includes('docker') ? 'linux' : data.builtOn), // Fixme: use a mapping to rename, merge items
	value: data.result?.toLowerCase() ?? 'building',
});

const getBuildResult = runData => {

	return runData.reduce((acc, item) => {
		if (isMoreSevere(acc[item.label], item.value)) {
		    acc[item.label] = item;
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
			const jobUrl = `${baseUrl}/job/${matrixJob}`;
			const response = await axios({
				url: `${jobUrl}/api/json?tree=builds[runs[builtOn,result,id,fullDisplayName]]{,${numberOfItems}}`,
				auth: {
					username,
					password
				},
				headers: {
					Accept: 'application/json',
				}
			});

            nameFilterRegex = new RegExp(nameFilter);
			const runResults = response.data.builds
				.map(({ runs }) => filterByName(nameFilterRegex, runs))
				.map(( items ) => items.map(item => extractRunData(item, jobUrl)))
				.map(getBuildResult)
				.reduce((acc, cur) => {
					Object.entries(cur).forEach(([key, value]) =>
						acc[key] = acc[key] ? [...acc[key], value] : [value]);
					return acc;
				}, {});

			jobCallback(null, {
				widgetTitle,
				subtitle: matrixJob,
				jobUrl,
				runResults,
			});
		} catch (e) {
			console.error(e);
			jobCallback(e.message);
		}
	}
};
