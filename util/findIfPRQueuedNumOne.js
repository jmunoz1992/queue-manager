/*
* Determines if any of the labels in the PR has the first in the queue label.
* */

const { firstInQueueLabel } = require('./queueLabels');

module.exports = dataLabels => {
    let isQueuedNumOne = false;
    for (let i = 0; i < dataLabels.length; i++) {
        const labelName = dataLabels[i].name;
        if (labelName === firstInQueueLabel) {
            isQueuedNumOne = true;
        }
    }
    return isQueuedNumOne;
}
