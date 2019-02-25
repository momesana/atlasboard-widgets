const axios = require('axios');
const assert = require('assert');

const fetchTicketsWaitingForAgent = async (accessToken, baseUrl, page = 1) => {
    const response = await axios({
        url: `${baseUrl}/api/tickets?page=${page}&with_messages=false&with_loaded_linked_tickets=false&status=awaiting_agent&API-TOKEN=${accessToken}`,
        headers: {
            Accept: 'application/json',
        }
    });

    return response.data;
};

const fetchAll = async (accessToken, baseUrl, maximumNumberOfItems) => {
    let tickets = [];
    let currentPage = 0;

    while (true) {
        const result = await fetchTicketsWaitingForAgent(accessToken, baseUrl, ++currentPage);
        const {page, per_page, total} = result;
        assert(currentPage === page);
        tickets = [...tickets, ...Object.values(result.tickets)];
        const pageCount = Math.ceil(total / per_page);

        if (currentPage >= pageCount || tickets.length >= maximumNumberOfItems) {
            break;
        }
    }

    return tickets.slice(0, maximumNumberOfItems);
};

const stripAgent = ({agent: {name, picture_url}}) => ({
   name,
   picture_url
});

const countFrequency = (acc, agent) => {
    const key = JSON.stringify(agent);
    if (acc[key]) {
        acc[key]++;
    } else {
        acc[key] = 1;
    }
    return acc;
};

const processAgents = (data) => {
    const rawAgents = data.map(stripAgent);
    agents = Object.entries(rawAgents.reduce(countFrequency, {}))
                 .map(([agent, count]) => [count, agent])
                 .sort()
                 .reverse()
                 .map(([count, agent]) => {
                    const {name, picture_url} = JSON.parse(agent);
                    return {name, picture_url, count}
                 });

    return {
        "count": data.length,
        agents,
    }
};

module.exports = {
    onInit(config, dependencies) {
    },

    async onRun(config, dependencies, jobCallback) {
        try {
            const {globalAuth, widgetTitle, authName = 'deskpro', numberOfItems = 150} = config;

            if (!globalAuth || !globalAuth[authName] || !globalAuth[authName].accessToken) {
                return jobCallback('missing deskpro credentials');
            }

            const {accessToken} = globalAuth[authName];
            const {baseUrl} = config;
            const ticketsAwaitingAgent = await fetchAll(accessToken, baseUrl, numberOfItems);

            const tickets = {
                unassigned: processAgents(ticketsAwaitingAgent.filter(ticket => !ticket.date_first_agent_assign)),
                onHold: processAgents(ticketsAwaitingAgent.filter(ticket => Boolean(ticket.is_hold))),
                waitingMoreThan24Hours: processAgents(ticketsAwaitingAgent.filter(({date_user_waiting_ts_ms}) => {
                    const waiting_in_hours = (Date.now() - date_user_waiting_ts_ms) / 3600000;
                    return waiting_in_hours > 24;
                })),
            };

            const {widgetTitle: title} = config;
            const jobConfig = {title};

            jobCallback(null, {jobConfig, tickets});
        } catch (e) {
            jobCallback(e.message);
        }
    }

};