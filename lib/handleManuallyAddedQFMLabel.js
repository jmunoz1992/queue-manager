const { queueLabel, triggerLabel } = require('../util/queueLabels');

module.exports = async (context, isQueuedLabelAddedWithoutRequiredLabels) => {
    const theUnlabeledLabelName = context.payload.label.name;

    if (theUnlabeledLabelName.includes(queueLabel)) {
        const labelNumRemoved = parseInt(theUnlabeledLabelName[theUnlabeledLabelName.length - 1], 10);
        if (isNaN(labelNumRemoved)) return;

        const isDuplicateLabel = await checkIfDuplicatedQFMLabel(context, labelNumRemoved);
        const isDuplicateLabelAndNotBot = isDuplicateLabel && !context.isBot;
        const isMissingLabelsAndNotBot = isQueuedLabelAddedWithoutRequiredLabels && !context.isBot;

        if (isDuplicateLabelAndNotBot || isMissingLabelsAndNotBot) {
            await removeManuallyAddedQFMLabel(context);
            return true;
        }
    }

    return false;
};

async function checkIfDuplicatedQFMLabel(context, labelNumRemoved) {
    const repoPullRequests = await context.github.issues.listForRepo(context.issue());
    let labelNumRemovedCount = 0;

    for (let i = 0; i < repoPullRequests.data.length; i++) {
        const prLabels = context.issue();
        prLabels.number = repoPullRequests.data[i].number;
        const pullRequestLabels = await context.github.issues.listLabelsOnIssue(prLabels);

        for (let j = 0; j < pullRequestLabels.data.length; j++) {
            const labelName = pullRequestLabels.data[j].name;
            const lastCharToIntInLabel = parseInt(labelName[labelName.length - 1]);

            if (lastCharToIntInLabel === labelNumRemoved) {
                labelNumRemovedCount++;
            }
        }
    }

    if (labelNumRemovedCount > 1) {
        return true;
    } else {
        return false;
    }
}

async function removeManuallyAddedQFMLabel(context) {
    const pullRequestLabels = await context.github.issues.listLabelsOnIssue(context.issue());

    const updatedLabels = [];

    for (let j = 0; j < pullRequestLabels.data.length; j++) {
        const labelName = pullRequestLabels.data[j].name;

        if (!labelName.includes(queueLabel) && !labelName.includes(triggerLabel)) {
            updatedLabels.push(labelName)
        }
    }

    await context.github.issues.replaceLabels({ ...context.issue(), labels: updatedLabels });
    return;
}
