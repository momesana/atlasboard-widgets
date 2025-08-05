widget = {
  onInit(el) {
    this.cachedRenderer = new CachedRenderer(
      {
        title: ({ value, el }) => $('.widget-title', el).text(value),
        content: ({ value, el }) => $('.reviewer', el).html(value),
      },
      el,
    );
  },

  createReviewerItem: (config, reviewer, pullRequests) => {
    try {
      const { baseUrl, projectName } = config;
      const rx = new RegExp(`^.*${projectName}-(\\d+)(.*)$`);
      const createPullRequestItem = (pullRequest) => {
        try {
          const {
            title,
            toRef: { displayId: branch },
            properties,
            links,
          } = pullRequest;

          const stripPrefix = (title) => {
            const [_, id, rawText] = title.match(rx);
            const text = rawText.replace(/^[: /]*/, ''); // strip away unnecessary leading characters

            return {
              id,
              text: text?.length ? text : '(no description &#9785;)',
            };
          };

          const { id, text } = stripPrefix(title);

          const url = links?.self?.[0]?.href ?? '';

          const openTaskCount =
            properties.openTaskCount > 0
              ? `
                        <div class="pull-requests-item-tasks">
                        <i class="far fa-check-square"></i>
                        <span>${properties.openTaskCount}</span>
                        </div>
                    `
              : '';

          return `
                        <div class="pull-requests-item" title="${title}">
                            <div class="pull-requests-item-ticket">
                                <a href="${url}" class="pull-requests-item-ticket-text">${text}</a>
                            </div>
                            <div class="pull-requests-item-branch">
                                <img class="pull-requests-item-branch-icon"
                                     src="/widgets/resources?resource=atlasboard-widgets/bitbucket/Git-Icon-White.png"/>
                                <a href="${url}"> ${projectName}-${id} </a> &rarr; ${branch} ${openTaskCount}
                            </div>
                        </div>
                    `;
        } catch (e) {
          console.error(e);
          console.error('happened for', pullRequest);
          return null;
        }
      };

      return `
                <div class="reviewer-item">
                    <div class="reviewer-item-avatar">
                        <img class="avatar-circle" src="${baseUrl}/users/${reviewer}/avatar.png"/>
                    </div>
                    <div class="reviewer-item-pull-requests">
                    ${pullRequests.map(createPullRequestItem).join('\n')}
                    </div>
                </div>
            `;
    } catch (e) {
      console.error(e);
      console.error('happened for', reviewer);
      return null;
    }
  },

  render: function (el, widgetTitle, content) {
    if (this.widgetTitle !== widgetTitle) {
      this.widgetTitle = widgetTitle;
      $('.widget-title', el).text(this.widgetTitle);
    }

    if (this.content !== content) {
      this.content = content;
      $('.reviewer, el').html(this.content);
    }
  },

  onData: function (el, data) {
    const { byReviewer, jobConfig } = data;
    const { widgetTitle: title } = jobConfig;

    content = byReviewer
      .map(({ reviewer, pullRequests }) =>
        this.createReviewerItem(jobConfig, reviewer, pullRequests),
      )
      .filter((pullRequest) => Boolean(pullRequest)) // filter away null values
      .join('');

    this.cachedRenderer.update(
      {
        title,
        content,
      },
      el,
    );
  },
};
