const axios = require('axios');

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
      const { numberOfItems, baseUrl, job, descriptionFilter } = config;
      const response = await axios({
        url: `${baseUrl}/job/${job}/api/json?tree=builds[description,duration]`,
        auth: {
          username,
          password
        },
        headers: {
          Accept: 'application/json',
        }
      });

      const buildTimes = response.data.builds
          .filter(({ description }) => description && description.includes(descriptionFilter))
          .map(({duration}) => parseInt(duration))
          .slice(0, numberOfItems);

      jobCallback(null, {
        jobConfig: config,
        title: job,
        buildTimes
      });
    } catch (e) {
      console.error(e);
      jobCallback(e.message);
    }
  }
};