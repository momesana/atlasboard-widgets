widget = {
    //runs when we receive data from the job

    createAgents: function({name, picture_url}) {
        return `
            <div class="agent">
	            <img src=${picture_url}>
	        </div>
        `;
    },

    createCategoryItem: function(name, count, agents) {
        const renderedAgents = agents.map(this.createAgents).join(' ');

        return `
          <div class="category">
              <div class="category-title">${name}</div>
              <div class="agents">${renderedAgents}</div>
              <div class=category-count><span>${count}</span></div>
          </div>
        `;
    },

    onData: function (el, data) {

        //The parameters our job passed through are in the data object
        //el is our widget element, so our actions should all be relative to that
        const {jobConfig: {title}, tickets} = data;

        if (title) {
            $('h2', el).text(title);
        }

        const {unassigned, onHold, waitingMoreThan24Hours} = tickets;
        const content = [
            this.createCategoryItem('unassigned', unassigned.count, unassigned.agents),
            this.createCategoryItem('on hold', onHold.count, onHold.agents),
            this.createCategoryItem('waiting > 24h', waitingMoreThan24Hours.count, waitingMoreThan24Hours.agents),

        ].join('\n');

        $('.content', el).html(content);
    }
};