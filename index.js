/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */

var owner = 'jmunoz1992'; // insert owner's github username here
var repo = 'test-wip-app'; // insert repo you want to test here

/*
* Change the below label vars based on the queue labels in your PR
* */
var triggerLabel = 'READY_FOR_MERGE';
var queueLabel = 'QUEUED FOR MERGE #';
var firstInQueueLabel = 'QUEUED FOR MERGE #1';
var fullQueueLabel = 'QUEUE IS CURRENTLY FULL';


/*
* The below comment will appear on the PR when the assignee tries to queue to merge, but the queue is full
* */
var commentWhenQueueIsFull =
    'Sorry, the queue is currently full. ' +
    'Please remove the `READY_FOR_MERGE` label and add this label in a few minutes when the queue is free. ' +
    'Please also remove the `QUEUE IS CURRENTLY FULL` label.';

module.exports = app => {
  app.log('Yay, the app was loaded!');

  /*
  * When the trigger label is added, a queue label will also be added depending on the next open spot in the queue.
  * If all queue labels are being used, then a label indicating that the queue is full will be added to the PR, along with a helpful comment.
  * The individual will need to remove the trigger label, and add this label in a few minutes to re-apply for the queue.
  * */
  app.on('pull_request.labeled', async context => {
    if (context.payload.label.name === triggerLabel) {
      const repoPullRequests = await context.github.issues.listForRepo({ owner: owner, repo: repo });
      const repoLabels = await context.github.issues.listLabelsForRepo({ owner: owner, repo: repo });

      const totalQueuedLabels = getTotalQueueLabelsLength(repoLabels);

      let labelToSet = firstInQueueLabel;
      let labelNum = 1;

      for (let i = 0; i < repoPullRequests.data.length; i++) {
        const prNumber = repoPullRequests.data[i].number;

        const pullRequestLabels = await context.github.issues.listLabelsOnIssue({ owner: owner, repo: repo, number: prNumber });

        for (let j = 0; j < pullRequestLabels.data.length; j++) {
          const labelName = pullRequestLabels.data[j].name;

          if (labelName === queueLabel + totalQueuedLabels) {
            labelToSet = fullQueueLabel;
            await context.github.issues.createComment({
              owner: owner,
              repo: repo,
              number: context.payload.number,
              body: commentWhenQueueIsFull
            });
          } else if (labelToSet !== fullQueueLabel && labelName.includes(queueLabel)) {
            const currentQueueNum = parseInt(labelName[labelName.length - 1], 10);

            if (currentQueueNum >= labelNum) {
              labelNum = currentQueueNum + 1;
            }

            labelToSet = queueLabel + labelNum
          }
        }
      }

        const issueLabel = context.issue({ labels: [labelToSet] });
        return context.github.issues.addLabels(issueLabel);
      }
  })

  /*
  * When a label is removed, the PRs containing any queue labels will be updated.
  * */
  app.on('pull_request.unlabeled', async context => {
    const theUnlabeledLabelName = context.payload.label.name;

    if (theUnlabeledLabelName.includes(queueLabel)) {
      const labelNumRemoved = parseInt(theUnlabeledLabelName[theUnlabeledLabelName.length - 1], 10);

      if (isNaN(labelNumRemoved)) return;

      await updateQueue(context, labelNumRemoved);
    }
  })

  /*
  * When any changes are made to a PR, there will be checks to see if the PR contains the first in the queue label.
  * If the PR contains this label, then the PR is good to merge. If it does not contain this label, the PR cannot be merged.
  * */
  app.on([
    'pull_request.opened',
    'pull_request.edited',
    'pull_request.labeled',
    'pull_request.unlabeled',
    'pull_request.synchronize',
    'pull_request.reopened'
  ], async context => {
    const prNumber = context.payload.number;
    const labelsOnPR = await context.github.issues.listLabelsOnIssue({owner: owner, repo: repo, number: prNumber});
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

    if (findIfPRQueuedNumOne(labelsOnPR.data)) {
      checkOptions.status = 'completed';
      checkOptions.conclusion = 'success';
      checkOptions.completed_at = new Date().toISOString();
      checkOptions.output.title = 'Ready to merge';
      checkOptions.output.summary = 'Ready to merge';
    }

    return context.github.checks.create(context.repo(checkOptions));
  });

  /*
  * Determines if any of the labels in the PR has the first in the queue label.
  * */
  findIfPRQueuedNumOne = function(dataLabels) {
    let isQueuedNumOne = false;
    for (let i = 0; i < dataLabels.length; i++) {
      const labelName = dataLabels[i].name;
      if (labelName === firstInQueueLabel) {
        isQueuedNumOne = true;
      }
    }
    return isQueuedNumOne;
  };

  /*
  * Determines how many queue labels are there for the given repo
  * */
  getTotalQueueLabelsLength = function(repoLabels) {
    let totalQueueLabelsLength = 0;
    for (let i = 0; i < repoLabels.data.length; i++) {
      const label = repoLabels.data[i].name;

      if (label.includes(queueLabel)) {
        totalQueueLabelsLength++;
      }
    }
    return totalQueueLabelsLength;
  };

  /*
  * Updates all the queue labels in all PRs.
  * This update is triggered when one of these labels are removed from a PR.
  * */
  updateQueue = async function(context, labelNumRemoved) {
    const repoPullRequests = await context.github.issues.listForRepo({ owner: owner, repo: repo });
    for (let i = 0; i < repoPullRequests.data.length; i++) {
      const prNumber = repoPullRequests.data[i].number;

      const pullRequestLabels = await context.github.issues.listLabelsOnIssue({ owner: owner, repo: repo, number: prNumber });

      const updatedLabels = [];

      for (let j = 0; j < pullRequestLabels.data.length; j++) {
        const labelName = pullRequestLabels.data[j].name;
        const lastCharToInt = parseInt(labelName[labelName.length - 1]);

        if (labelName.includes(queueLabel) && !isNaN(lastCharToInt) && lastCharToInt > labelNumRemoved) {
          updatedLabels.push(queueLabel + (lastCharToInt - 1));
        } else {
          updatedLabels.push(labelName);
        }
      }

      if (updatedLabels.length > 0) {
        await context.github.issues.replaceLabels({ owner: owner, repo: repo, number: prNumber, labels: updatedLabels });
      }
    }
  };
}
