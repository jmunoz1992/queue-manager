/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = app => {
  // Your code here
  app.log('Yay, the app was loaded!');

  app.on('issues.opened', async context => {
    const issueComment = context.issue({ body: 'Thanks for opening this issue!' });
    return context.github.issues.createComment(issueComment)
  })

  app.on('pull_request.labeled', async context => {
    if (context.payload.label.name === 'READY_FOR_MERGE') {
      const repoPullRequests = await context.github.issues.listForRepo({owner: 'jmunoz1992', repo: 'test-wip-app'});
      const repoLabels = await context.github.issues.listLabelsForRepo({owner: 'jmunoz1992', repo: 'test-wip-app'});

      const totalQueuedLabels = getTotalQueueLabelsLength(repoLabels);

      let labelToSet = 'QUEUED FOR MERGE #1';
      let labelNum = 1;

      for (let i = 0; i < repoPullRequests.data.length; i++) {
        const number = repoPullRequests.data[i].number;
        // TODO FIND WAY TO GET REPO AND OWNER?
        const pullRequestLabels = await context.github.issues.listLabelsOnIssue({owner: 'jmunoz1992', repo: 'test-wip-app', number: number});

        for (let j = 0; j < pullRequestLabels.data.length; j++) {
          const labelName = pullRequestLabels.data[j].name;

          if (labelName === 'QUEUED FOR MERGE #' + totalQueuedLabels) {
            labelToSet = 'QUEUE IS CURRENTLY FULL';
          } else if (labelToSet !== 'QUEUE IS CURRENTLY FULL' && labelName.includes('QUEUED FOR MERGE #')) {
            const currentQueueNum = parseInt(labelName[labelName.length - 1], 10);

            if (currentQueueNum >= labelNum) {
              labelNum = currentQueueNum + 1;
            }

            labelToSet = 'QUEUED FOR MERGE #' + labelNum
          }
        }
      }

        const issueLabel = context.issue({ labels: [labelToSet] });
        return context.github.issues.addLabels(issueLabel);
      }
  })

  getTotalQueueLabelsLength = function(repoLabels) {
    let totalQueueLabelsLength = 0;
    for (let i = 0; i < repoLabels.data.length; i++) {
      const label = repoLabels.data[i].name;

      if (label.includes('QUEUED FOR MERGE #')) {
        totalQueueLabelsLength++;
      }
    }
    return totalQueueLabelsLength;
  };

  app.on('pull_request.unlabeled', async context => {
    const theUnlabeledLabelName = context.payload.label.name;

    if (theUnlabeledLabelName.includes('QUEUED FOR MERGE #')) {
      const labelNumRemoved = parseInt(theUnlabeledLabelName[theUnlabeledLabelName.length - 1], 10);

      if (isNaN(labelNumRemoved)) return;

      const repoLabels = await context.github.issues.listLabelsForRepo({owner: 'jmunoz1992', repo: 'test-wip-app'});
      const totalQueuedLabels = getTotalQueueLabelsLength(repoLabels);

      if (labelNumRemoved < totalQueuedLabels) {
        await updateBegAndMiddleQueue(context, labelNumRemoved);
      } else if(labelNumRemoved === totalQueuedLabels) {
        await updateEndOfQueue(context, labelNumRemoved);
      }
    }
  })

  updateEndOfQueue = async function(context, labelNumRemoved) {
    const repoPullRequests = await context.github.issues.listForRepo({owner: 'jmunoz1992', repo: 'test-wip-app'});

    let fullLabelReplacementFound = false;

    for (let i = 0; i < repoPullRequests.data.length; i++) {
      const prNumber = repoPullRequests.data[i].number;

      // TODO FIND WAY TO GET REPO AND OWNER?
      const pullRequestLabels = await context.github.issues.listLabelsOnIssue({owner: 'jmunoz1992', repo: 'test-wip-app', number: prNumber});

      const updatedLabels = [];

      for (let j = 0; j < pullRequestLabels.data.length; j++) {
        const labelName = pullRequestLabels.data[j].name;

        if (labelName.includes('QUEUE IS CURRENTLY FULL') && !fullLabelReplacementFound) {
          updatedLabels.push('QUEUED FOR MERGE #' + labelNumRemoved);
          fullLabelReplacementFound = true;
        } else {
          updatedLabels.push(labelName);
        }
      }

      if (updatedLabels.length > 0) {
        await context.github.issues.replaceLabels({ owner:'jmunoz1992', repo:'test-wip-app', number: prNumber, labels: updatedLabels });
      }
    }
  }

  updateBegAndMiddleQueue = async function(context, labelNumRemoved) {
    const repoPullRequests = await context.github.issues.listForRepo({owner: 'jmunoz1992', repo: 'test-wip-app'});
    for (let i = 0; i < repoPullRequests.data.length; i++) {
      const prNumber = repoPullRequests.data[i].number;

      // TODO FIND WAY TO GET REPO AND OWNER?
      const pullRequestLabels = await context.github.issues.listLabelsOnIssue({owner: 'jmunoz1992', repo: 'test-wip-app', number: prNumber});

      const updatedLabels = [];

      for (let j = 0; j < pullRequestLabels.data.length; j++) {
        const labelName = pullRequestLabels.data[j].name;
        const lastCharToInt = parseInt(labelName[labelName.length - 1]);

        if (labelName.includes('QUEUED FOR MERGE #') && !isNaN(lastCharToInt) && lastCharToInt > labelNumRemoved) {
          updatedLabels.push('QUEUED FOR MERGE #' + (lastCharToInt - 1));
        } else {
          updatedLabels.push(labelName);
        }
      }

      if (updatedLabels.length > 0) {
        await context.github.issues.replaceLabels({ owner:'jmunoz1992', repo:'test-wip-app', number: prNumber, labels: updatedLabels });
      }
    }
  };

  app.on([
    'pull_request.opened',
    'pull_request.edited',
    'pull_request.labeled',
    'pull_request.unlabeled',
    'pull_request.synchronize',
    'pull_request.reopened'
  ], async context => {
    const number = context.payload.number;
    const labelsOnPR = await context.github.issues.listLabelsOnIssue({owner: 'jmunoz1992', repo: 'test-wip-app', number: number});
    const pullRequest = context.payload.pull_request;
    const checkOptions = {
      name: 'QUEUE CHECKER',
      head_sha: pullRequest.head.sha,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      output: {
        title: 'Need to be #1 in queue to merge',
        summary: 'Need to be #1 in queue to merge',
        text: 'Need to be #1 in queue to merge'
      }
    };

    if (findIfQueuedNumOne(labelsOnPR.data)) {
      checkOptions.status = 'completed';
      checkOptions.conclusion = 'success';
      checkOptions.completed_at = new Date().toISOString();
      checkOptions.output.title = 'Ready to merge';
      checkOptions.output.summary = 'Ready to merge';
    }

    return context.github.checks.create(context.repo(checkOptions));
  });

  findIfQueuedNumOne = function(dataLabels) {
    let isQueuedNumOne = false;
    for (let i = 0; i < dataLabels.length; i++) {
      const labelName = dataLabels[i].name;
      if (labelName === 'QUEUED FOR MERGE #1') {
        isQueuedNumOne = true;
      }
    }
    return isQueuedNumOne;
  }

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
