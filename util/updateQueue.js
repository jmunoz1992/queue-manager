/*
* Updates all the queue labels in all PRs.
* This update is triggered when one of these labels are removed from a PR.
* */

const { queueLabel } = require('./queueLabels');

module.exports = async (context, labelNumRemoved) => {
    const ownerRepoNumberInfo = context.issue();
    const repoPullRequests = await context.github.issues.listForRepo(ownerRepoNumberInfo);

    for (let i = 0; i < repoPullRequests.data.length; i++) {
        const prLabels = context.issue();
        prLabels.number = repoPullRequests.data[i].number;
        const pullRequestLabels = await context.github.issues.listLabelsOnIssue(prLabels);

        const updatedLabels = [];

        for (let j = 0; j < pullRequestLabels.data.length; j++) {
            const labelName = pullRequestLabels.data[j].name;
            const lastCharToInt = parseInt(labelName[labelName.length - 1]);

            if (labelName.includes(queueLabel) && !isNaN(lastCharToInt) && lastCharToInt > labelNumRemoved) {
                updatedLabels.push(queueLabel + (lastCharToInt - 1));
            } else {
                updatedLabels.unshift(labelName);
            }
        }

        if (updatedLabels.length > 0) {
            const replaceLabels = context.issue({  labels: updatedLabels });
            replaceLabels.number = repoPullRequests.data[i].number;

            const lastLabel = updatedLabels[updatedLabels.length - 1];
            const updatedLabelNum = parseInt(lastLabel.charAt(lastLabel.length - 1));

            if (!isNaN(updatedLabelNum)) {
                let message = 'Your PR is currently #' + updatedLabelNum + ' in the queue. ';

                if (updatedLabelNum === 1) {
                    message += 'You can now merge.';
                }

                const commentLabel = context.issue({ body: message });
                commentLabel.number = repoPullRequests.data[i].number;
                await context.github.issues.createComment(commentLabel);
            }

            await context.github.issues.replaceLabels(replaceLabels);
        }
    }
};
