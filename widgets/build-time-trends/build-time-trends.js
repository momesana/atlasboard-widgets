widget = {
  createChart: (canvas, buildTimeDetails) => {
    const chartColors = [
      'rgb(54, 162, 235)', // blue
      'rgb(255, 99, 132)', // red
      'rgb(75, 192, 192)', // green
      'rgb(255, 205, 86)', // yellow
      'rgb(153, 102, 255)', // purple
      'rgb(255, 159, 64)', // orange
      'rgb(231,233,237)', // grey
    ];

    const colors = chartColors.map((color) => ({
      backgroundColor: Chart.helpers.color(color).alpha(0.2).rgbString(),
      borderColor: color,
      pointBackgroundColor: color,
    }));

    const buildDurations = (data) =>
      data.reduce((acc, { duration, timestamp }) => {
        acc.push({
          x: new Date(timestamp),
          y: duration / 3600000,
        });
        return acc;
      }, []);

    const buildJobData = ({ job, data }, index) =>
      Object.assign(
        {
          label: job,
          fill: true,
          borderWidth: 2,
          pointRadius: 5,
          data: buildDurations(data),
        },
        colors[index % colors.length],
      );

    new Chart(canvas, {
      type: 'line',
      options: {
        maintainAspectRatio: false,
        scales: {
          yAxes: [
            {
              scaleLabel: {
                display: true,
                labelString: 'duration in hours',
              },
            },
          ],
          xAxes: [
            {
              type: 'time',
              time: {
                unit: 'day',
              },
            },
          ],
        },
      },
      data: {
        datasets: buildTimeDetails.map(buildJobData),
      },
    });
  },

  onData: function (el, data) {
    const { title, buildTimeDetails } = data;
    $('h2.widget-title', el).text(`${title}`);
    const canvas = $('canvas', el);
    this.createChart(canvas, buildTimeDetails);
  },
};
