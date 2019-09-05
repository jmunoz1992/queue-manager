/*
* When the trigger label is added, a queue label will also be added depending on the next open spot in the queue.
* If all queue labels are being used, then a label indicating that the queue is full will be added to the PR, along with a helpful comment.
* The individual will need to remove the trigger label, and add this label in a few minutes to re-apply for the queue.
* */


const getTotalQueueLabelsLength = require('../util/getTotalQueueLabelsLength');

const { triggerLabel, queueLabel, firstInQueueLabel, fullQueueLabel } = require('../util/queueLabels');

module.exports = async context => {
    // The below comment will appear on the PR when the assignee tries to queue to merge but the queue is full.
    const commentWhenQueueIsFull =
        'Sorry, the queue is currently full. ' +
        'Please remove the `READY FOR MERGE` label and add this label in a few minutes when the queue is free. ' +
        'Please also remove the `QUEUE IS CURRENTLY FULL` label.';

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
}
