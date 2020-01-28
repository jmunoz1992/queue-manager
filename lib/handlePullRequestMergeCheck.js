/*
* When any changes are made to a PR,
* there will be checks to see if the PR contains the QUEUED FOR MERGE #1 label, CORE APPROVED, and READY FOR MERGE labels.
* If the PR contains these labels, then the PR is good to merge.
* If it does not contain these labels, the PR cannot be merged.
* */

const findIfPRQueuedNumOne = require('../util/findIfPRQueuedNumOne');

module.exports = async context => {
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
}
