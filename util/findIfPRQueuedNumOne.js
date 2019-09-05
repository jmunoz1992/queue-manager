/*
* Determines if any of the labels in the PR has the first in the queue label.
* */

module.exports = dataLabels => {
    const firstInQueueLabel = 'QUEUED FOR MERGE #1';
    let isQueuedNumOne = false;
    for (let i = 0; i < dataLabels.length; i++) {
        const labelName = dataLabels[i].name;
        if (labelName === firstInQueueLabel) {
            isQueuedNumOne = true;
        }
    }
    return isQueuedNumOne;
}
