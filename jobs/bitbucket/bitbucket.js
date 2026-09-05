/* global process */

const axios = require("axios");

const filters = {
    default: () => true,
    "filter-needs-work": pullRequest =>
        pullRequest.reviewers.some(
            reviewer =>
                reviewer.status === "NEEDS_WORK" || pullRequest.properties.openTaskCount > 0,
        ),
    "filter-no-reviewer": pullRequest => !pullRequest.reviewers || !pullRequest.reviewers.length,
};

const isTeamMember = (teamMemberSet, user) =>
    Boolean(
        user &&
        [user.slug, user.name, user.emailAddress]
            .filter(Boolean)
            .some(identifier => teamMemberSet.has(identifier.toLowerCase())),
    );

const teamFilter = teamMembers => {
    if (!teamMembers || !teamMembers.length) {
        return () => true;
    }

    const teamMemberSet = new Set(teamMembers.map(member => member.toLowerCase()));

    return pullRequest =>
        (pullRequest.reviewers || []).some(reviewer => isTeamMember(teamMemberSet, reviewer.user));
};

const fetchNextPage = async (accessToken, url) => {
    const response = await axios({
        url: `${url}`,
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    });

    return response.data;
};

const fetchAll = async config => {
    const {
        globalAuth,
        authName = "bitbucket",
        numberOfItems,
        baseUrl,
        projectName,
        filterType,
        repoName,
        teamMembers,
    } = config;

    const { accessToken } = globalAuth[authName];
    const urlWithoutReqParams = `${baseUrl}/rest/api/1.0/projects/${repoName.toUpperCase()}/repos/${projectName.toLowerCase()}/pull-requests`;

    const matchesFilterType = filters[filterType || "default"];
    const matchesTeam = teamFilter(teamMembers);

    const pullRequests = [];
    let nextStartPage = null;
    let isLastPage = false;

    while (!isLastPage && pullRequests.length < numberOfItems) {
        const url = urlWithoutReqParams + (nextStartPage ? `?start=${nextStartPage}` : "");
        const data = await fetchNextPage(accessToken, url);
        const { values, isLastPage: isLast, nextPageStart: nextPage } = data;
        nextStartPage = nextPage;
        isLastPage = isLast;
        pullRequests.push(
            ...values.filter(
                pullRequest => matchesFilterType(pullRequest) && matchesTeam(pullRequest),
            ),
        );
    }

    return pullRequests.slice(0, numberOfItems);
};

module.exports = {
    onRun: async (config, _dependencies, jobCallback) => {
        try {
            const {
                globalAuth,
                authName = "bitbucket",
                baseUrl,
                projectName,
                widgetTitle,
            } = config;

            if (!globalAuth || !globalAuth[authName] || !globalAuth[authName].accessToken) {
                return jobCallback("missing BitBucket access token");
            }

            const pullRequests = await fetchAll(config);
            const jobConfig = {
                widgetTitle,
                baseUrl,
                projectName,
            };

            jobCallback(null, { jobConfig, pullRequests });
        } catch (e) {
            jobCallback(e.message);
        }
    },
};
