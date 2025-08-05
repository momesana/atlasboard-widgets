widget = {
  onInit(el) {
    this.cachedRenderer = new CachedRenderer(
      {
        title: ({ value, el }) => $('.widget-title', el).text(value),
        content: ({ value, el }) => $('.content', el).html(value),
      },
      el,
    );
  },

  getSignForColor(color) {
    const defaultSign = '&#10004;';
    return color === 'red'
      ? '&#9760;'
      : color === 'yellow'
        ? '&#9888;'
        : defaultSign;
  },

  createAllOkItem(message) {
    return $(`
        <div class="jenkins-all-green"><div>${message}</div></div>
      `);
  },

  createJobOverview(jenkinsBuilds) {
    return jenkinsBuilds
      .map(({ name, color, isBuilding }) => {
        const sign = this.getSignForColor(color);
        const statusBuilding = isBuilding ? 'status-building' : '';
        return `<div class="jenkins-job-item status-${color} ${statusBuilding}">${sign} ${name}</div>`;
      })
      .join('');
  },

  onData(el, data) {
    const { jenkinsBuilds, widgetTitle: title, allGreenMessage } = data;
    this.cachedRenderer.update(
      {
        title,
        content: jenkinsBuilds.length
          ? this.createJobOverview(jenkinsBuilds)
          : this.createAllOkItem(allGreenMessage),
      },
      el,
    );
  },
};
