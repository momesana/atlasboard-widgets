const axios = require('axios');

const fetchTicketsWaitingForAgent = async (accessToken, baseUrl) => {
	const response = await axios({
		url: `${baseUrl}/api/tickets?with_messages=false&with_loaded_linked_tickets=false&status=awaiting_agent&API-TOKEN=${accessToken}`,
		headers: {
			Accept: 'application/json',
		}
	});

	return response.data;
};

module.exports = {
	onInit(config, dependencies) {
	},

	async onRun(config, dependencies, jobCallback) {
		try {
			const { globalAuth, authName = 'deskpro' } = config;

			if (!globalAuth || !globalAuth[authName] || !globalAuth[authName].accessToken) {
				return jobCallback('missing deskpro credentials');
			}

			const { accessToken } = globalAuth[authName];
			const { baseUrl } = config;
			const result = await fetchTicketsWaitingForAgent(accessToken, baseUrl);
			const ticketsAwaitingAgent = Object.values(result.tickets);

			const tickets = {
				all: ticketsAwaitingAgent,
				unassigned: ticketsAwaitingAgent.filter(ticket => !ticket.date_first_agent_assign),
				onHold: ticketsAwaitingAgent.filter(ticket => Boolean(ticket.is_hold)),
				waitingMoreThan24Hours: ticketsAwaitingAgent.filter(({ date_user_waiting_ts_ms }) => {
					const waiting_in_hours = (Date.now() - date_user_waiting_ts_ms) / 3600000;
					return waiting_in_hours > 24;
				}),
			};

			const { widgetTitle: title } = config;
			const jobConfig = { title };

			jobCallback(null, { jobConfig, tickets });
		} catch (e) {
			jobCallback(e.message);
		}
	}

};