widget = {
  //runs when we receive data from the job
  createCategoryItem: ({ title, count, agents }) => {
    const createAgents = ({ picture_url }) => {
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
    //The parameters our job passed through are in the data object
    //el is our widget element, so our actions should all be relative to that
    const {
      widgetTitle,
      tickets: { unassignedCount, categories },
    } = data;

    if (widgetTitle) {
      $('.widget-title-title', el).text(widgetTitle);
    }

    const severityClass =
      unassignedCount <= 0
        ? 'ok'
        : unassignedCount <= 5
          ? 'problematic'
          : 'critical';
    const unassignedHTML = `
            <span>Unassigned:&nbsp;</span>
            <span class="widget-title-unassigned-count ${severityClass}">${unassignedCount}</span>
        `;
    $('.widget-title-unassigned', el).html(unassignedHTML);

    const content = categories.map(this.createCategoryItem).join('\n');

    $('.content', el).html(content);
  },
};
