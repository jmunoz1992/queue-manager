/*
* When the trigger label is added, a queue label will also be added depending on the next open spot in the queue.
* If all queue labels are being used, then a label indicating that the queue is full will be added to the PR, along with a helpful comment.
* The individual will need to remove the trigger label, and add this label in a few minutes to re-apply for the queue.
* The trigger label can only be added when the core approved label has been added to the PR.
* */

const getTotalQueueLabelsLength = require('../util/getTotalQueueLabelsLength');

const { triggerLabel, queueLabel, firstInQueueLabel, coreApprovalLabel } = require('../util/queueLabels');
const handleLabelRemovalUpdate = require('./handleLabelRemovalUpdate');


module.exports = async context => {
    const ownerRepoNumberInfo = context.issue();
    const labelsOnPR = await context.github.issues.listLabelsOnIssue(ownerRepoNumberInfo);

    const isQueuedLabelAddedWithoutRequiredLabels = checkIfQueuedLabelIsAddedWithoutRequiredLabels(context, ownerRepoNumberInfo, labelsOnPR);

    if (isQueuedLabelAddedWithoutRequiredLabels) {
        await sendQueueLabelCommentToPR(context);
        return;
    }

    if (context.payload.label.name === triggerLabel) {
        const coreApprovalCheck = checkCoreApprovedLabelIsOnPR(context, ownerRepoNumberInfo, labelsOnPR);

        if(!coreApprovalCheck) {
            await sendCoreApprovalCommentNeededToPR(context);
            return;
        }

        await addNextInQueueLabel(context, ownerRepoNumberInfo);
        return;
    }
};

function checkIfQueuedLabelIsAddedWithoutRequiredLabels (context, ownerRepoNumberInfo, labelsOnPR) {
    const checkIfQueuedLabelIsAdded = context.payload.label.name.includes(queueLabel);
    const checkIfPRContainsReadyForMergeLabel = labelsOnPR.data.filter(label => label.name === triggerLabel).length > 0;
    const checkIfPRContainsCoreApprovedLabel = labelsOnPR.data.filter(label => label.name === coreApprovalLabel).length > 0;

    return checkIfQueuedLabelIsAdded && (!checkIfPRContainsReadyForMergeLabel || !checkIfPRContainsCoreApprovedLabel);
}

async function sendQueueLabelCommentToPR (context) {
    const queueLabelComment =
        'The `QUEUED FOR MERGE` label should only be added by the queue-manager bot. ' +
        'Please only add the `CORE APPROVED` and `READY FOR MERGE` labels if you intend to queue your PR to merge.';

    const queueLabelCommentLabel = context.issue({ body: queueLabelComment });
    queueLabelCommentLabel.number = context.payload.number;

    await context.github.issues.createComment(queueLabelCommentLabel);
    await handleLabelRemovalUpdate(context);

    return;
}

function checkCoreApprovedLabelIsOnPR (context, ownerRepoNumberInfo, labelsOnPR) {
    return labelsOnPR.data.filter(label => label.name === coreApprovalLabel).length > 0;
}

async function sendCoreApprovalCommentNeededToPR (context) {
    const coreApprovalComment =
        'The PR needs to have the `CORE APPROVED` label first before adding the `READY FOR MERGE` label. ' +
        'A core approver must approve this PR and add the `CORE APPROVED` label to this PR.';

    const coreApprovalCommentLabel = context.issue({ body: coreApprovalComment });
    coreApprovalCommentLabel.number = context.payload.number;
    await context.github.issues.createComment(coreApprovalCommentLabel);
    await context.github.issues.removeLabel({ ...context.issue(), name: triggerLabel });

    return;
}

async function addNextInQueueLabel (context, ownerRepoNumberInfo) {
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
            const isQueueFull = labelName === queueLabel + totalQueuedLabels;

            if (isQueueFull) {
                await addQueueIsFullComment(context);
                return;
            } else if (labelName.includes(queueLabel)) {
                const currentQueueNum = parseInt(labelName[labelName.length - 1], 10);

                if (currentQueueNum >= labelNum) {
                    labelNum = currentQueueNum + 1;
                }

                labelToSet = queueLabel + labelNum
            }
        }
    }

    let commentQueueNum = 'Your PR is currently #' + labelNum + ' in the queue. ';

    if (labelNum === 1) {
        commentQueueNum += 'You can now merge.';
    }

    const commentLabel = context.issue({ body: commentQueueNum });
    commentLabel.number = context.payload.number;
    await context.github.issues.createComment(commentLabel);

    const issueLabel = context.issue({ labels: [labelToSet] });
    return context.github.issues.addLabels(issueLabel);
}

async function addQueueIsFullComment (context) {

    // The below comment will appear on the PR when the assignee tries to queue to merge but the queue is full.
    const commentWhenQueueIsFull =
      'Sorry, the queue is currently full. ' +
      'Please add the `READY FOR MERGE` label in a few minutes when the queue is free. ';

    const commentLabel = context.issue({ body: commentWhenQueueIsFull });
    commentLabel.number = context.payload.number;
    await context.github.issues.createComment(commentLabel);
    await context.github.issues.replaceLabels({ ...context.issue(), labels: ['CORE APPROVED'] });
}
