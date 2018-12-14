widget = {
  createChart: function (buildTimes) {
    return `
        <div>${buildTimes.join(' ')}
        </div>`;
  },

  //runs when we receive data from the job
  onData: function (el, data) {
    const { title, buildTimes } = data;
    const content = this.createChart(buildTimes);

    $('.content', el).html(content);  }
};