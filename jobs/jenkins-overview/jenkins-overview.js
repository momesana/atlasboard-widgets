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
   * Executed every interval
   * @param config
   * @param dependencies
   * @param jobCallback
   */
  async onRun(config, _dependencies, jobCallback) {
    try {
      const {
        globalAuth,
        authName = 'jenkins',
        widgetTitle,
        allGreenMessage,
        needClaim,
      } = config;

      if (
        !globalAuth ||
        !globalAuth[authName] ||
        !globalAuth[authName].accessToken ||
        !globalAuth[authName].username
      ) {
        return jobCallback('missing Jenkins credentials');
      }

      const { username, accessToken: password } = globalAuth[authName];
      const { relevantColorsOrdered: colors, numberOfItems, baseUrl } = config;

      const request = async (url) =>
        await axios({
          url,
          auth: {
            username,
            password,
          },
          headers: {
            Accept: 'application/json',
          },
        });

      const sortByColorAndName = (job1, job2) => {
        return (
          colors.indexOf(job1.color) - colors.indexOf(job2.color) ||
          job1.name.localeCompare(job2.name)
        );
      };

      const transform_data = ({ name, color, url }) => ({
        color: color.replace('_anime', ''),
        isBuilding: color.includes('_anime'),
        name,
        url,
      });

      const get_claimed_by = async (url) => {
        const resp = await request(
          `${url}api/json?tree=actions[claimedBy],runs[url]`,
        );
        const { runs, actions } = resp.data;
        if (runs) {
          const claimedBy = [].concat.apply(
            [],
            await Promise.all(runs.map(({ url }) => get_claimed_by(url))),
          );
          return Array.from(new Set(claimedBy));
        }
        return actions.map(({ claimedBy }) => claimedBy).filter((x) => x);
      };

      const check_claim_status = async (data) => {
        const { url } = data;
        if (needClaim) {
          const claimedBy = await get_claimed_by(`${url}lastCompletedBuild/`);
          return { hasClaim: claimedBy.length > 0, ...data };
        }
        return { hasClaim: false, ...data };
      };

      const response = await request(`${baseUrl}/api/json`);
      const { jobs } = response.data;
      const preSelection = jobs
        .filter(({ color }) => Boolean(color))
        .map(transform_data)
        .filter(({ color }) => colors.includes(color))
        .map(check_claim_status);

      const jenkinsBuilds = (await Promise.all(preSelection))
        .filter(({ hasClaim }) => !hasClaim)
        .sort(sortByColorAndName)
        .slice(0, numberOfItems);

      jobCallback(null, { widgetTitle, jenkinsBuilds, allGreenMessage });
    } catch (e) {
      jobCallback(e.message);
    }
  },
};
