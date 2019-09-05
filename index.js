/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */

const findIfPRQueuedNumOne = require('./util/findIfPRQueuedNumOne');
const getTotalQueueLabelsLength = require('./util/getTotalQueueLabelsLength');
const updateQueue = require('./util/updateQueue');

const { triggerLabel, queueLabel, firstInQueueLabel, fullQueueLabel } = require('./util/queueLabels');

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
      const ownerRepoNumberInfo = context.issue();

      const repoPullRequests = await context.github.issues.listForRepo(ownerRepoNumberInfo);
      const repoLabels = await context.github.issues.listLabelsForRepo(ownerRepoNumberInfo);

      const totalQueuedLabels = getTotalQueueLabelsLength(repoLabels);

      let labelToSet = firstInQueueLabel;
      let labelNum = 1;

      for (let i = 0; i < repoPullRequests.data.length; i++) {
        ownerRepoNumberInfo.number = repoPullRequests.data[i].number;
        const pullRequestLabels = await context.github.issues.listLabelsOnIssue(ownerRepoNumberInfo);

        for (let j = 0; j < pullRequestLabels.data.length; j++) {
          const labelName = pullRequestLabels.data[j].name;

          if (labelName === queueLabel + totalQueuedLabels) {
            labelToSet = fullQueueLabel;

            const commentLabel = context.issue({ body: commentWhenQueueIsFull });
            commentLabel.number = context.payload.number;
            await context.github.issues.createComment(commentLabel);

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
    const ownerRepoNumberInfo = context.issue();
    const labelsOnPR = await context.github.issues.listLabelsOnIssue(ownerRepoNumberInfo);
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
}
