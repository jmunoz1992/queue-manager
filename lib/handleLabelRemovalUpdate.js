/*
* When a label is removed, the PRs containing any queue labels will be updated.
* */

const updateQueue = require('../util/updateQueue');

const { queueLabel } = require('../util/queueLabels');

module.exports = async context => {
    const theUnlabeledLabelName = context.payload.label.name;

    if (theUnlabeledLabelName.includes(queueLabel)) {
        const labelNumRemoved = parseInt(theUnlabeledLabelName[theUnlabeledLabelName.length - 1], 10);
        if (isNaN(labelNumRemoved)) return;

        const ownerRepoNumberInfo = context.issue();
        const repoPullRequests = await context.github.issues.listForRepo(ownerRepoNumberInfo);
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

        const isQueuedLabelAddedByBot = await checkIfQueuedLabelWasRemovedByBot();
        if (isQueuedLabelAddedByBot) return;

        await updateQueue(context, labelNumRemoved);
    }
};

async function checkIfQueuedLabelWasRemovedByBot() {
    const ownerRepoNumberInfo = context.issue();
    const repoPullRequests = await context.github.issues.listForRepo(ownerRepoNumberInfo);
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

    if (labelNumRemovedCount === 1) {
        return true;
    } else {
        return false;
    }
}
