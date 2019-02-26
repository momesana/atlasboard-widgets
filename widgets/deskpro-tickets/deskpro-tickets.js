widget = {
    //runs when we receive data from the job
    createCategoryItem: function({title, count, agents}) {
        const createAgents = ({name, picture_url}) => {
            return `
                <div class="agent">
                    <img src=${picture_url}>
                </div>
            `;
        };

        const renderedAgents = agents.map(createAgents).join(' ');

        return `
          <div class="category">
              <div class="category-title">${title}</div>
              <div class="agents">${renderedAgents}</div>
              <div class=category-count><span>${count}</span></div>
          </div>
        `;
    },

    onData: function (el, data) {
        console.dir(data);

        //The parameters our job passed through are in the data object
        //el is our widget element, so our actions should all be relative to that
        const {jobConfig: {title}, tickets: {unassignedCount, categories}} = data;

        if (title) {
            $('h2.widget-title', el).text(title);
        }

        const content = categories.map(this.createCategoryItem).join('\n');

        $('.content', el).html(content);
    }
};