widget = {
  onInit(el) {
    this.cachedRenderer = new CachedRenderer(
      {
        title: ({ value, el }) => $('.widget-title', el).text(value),
        content: ({ value, el }) => $('.pull-requests', el).html(value),
      },
      el,
    );
  },
  createPullRequestItem: (config, pullRequest) => {
    try {
      const { baseUrl, projectName } = config;
      const {
        title,
        author: {
          user: { slug },
        },
        toRef: { displayId: branch },
        reviewers,
        properties,
        links,
      } = pullRequest;
      const rx = new RegExp(`^.*${projectName}-(\\d+)(.*)$`);

      const stripPrefix = (title) => {
        const [_, id, rawText] = title.match(rx);
        const text = rawText.replace(/^[: /]*/, ''); // strip away unnecessary leading characters

        return {
          id,
          text: text?.length ? text : '(no description &#9785;)',
        };
      };

      const reviewerStateMapping = {
        APPROVED: 'reviewer-approved',
        NEEDS_WORK: 'reviewer-needs-work',
      };

      const reviewerImages = reviewers
        // for some reason the backend changes the order of the reviewers randomly so we have to sort it
        .toSorted((r1, r2) => {
          const primary = r1.status.localeCompare(r2.status);
          return primary !== 0
            ? primary
            : r1.user.emailAddress.localeCompare(r2.user.emailAddress);
        })
        .map(
          (reviewer) =>
            `<div class="wrapper">
                    <img class="avatar-circle ${reviewerStateMapping[reviewer.status]}"
                      src="${baseUrl}/users/${reviewer.user.slug}/avatar.png"/>
                </div>
                `,
        )
        .join('');

      const openTaskCount =
        properties.openTaskCount > 0
          ? `
                <div class="pull-requests-item-content-tasks">
                <i class="far fa-check-square"></i>
                <span>${properties.openTaskCount}</span>
                </div>
            `
          : '';

      const { id, text } = stripPrefix(title);
      const url = links?.self?.[0]?.href ?? '';

      return `
            <div class="pull-requests-item" title="${title}">
                <div class="pull-requests-item-avatar">
                    <img class="avatar-circle" src="${baseUrl}/users/${slug}/avatar.png"/>
                </div>
                <div class="pull-requests-item-content">
                    <div class="pull-requests-item-content-ticket">
                        <a href="${url}" class="pull-requests-item-content-ticket-text">${text}</a>
                    </div>
                    <div class="pull-requests-item-content-branch">
                        <img class="pull-requests-item-content-branch-icon"
                             src="/widgets/resources?resource=atlasboard-widgets/bitbucket/Git-Icon-White.png"/>
                        <a href="${url}">${projectName}-${id}</a> &rarr; ${branch} ${reviewerImages} ${openTaskCount}
                    </div>
                </div>
            </div>
        `;
    } catch (e) {
      console.warn(e);
      console.warn('happened for', pullRequest);
      return null;
    }
  },

  onData: function (el, data) {
    const { pullRequests, jobConfig } = data;
    const { widgetTitle: title } = jobConfig;
    const content = pullRequests
      .map((pullRequest) => this.createPullRequestItem(jobConfig, pullRequest))
      .filter((pullRequest) => Boolean(pullRequest)) // filter away null values
      .join('');
    this.cachedRenderer.update({ title, content }, el);
  },
};
