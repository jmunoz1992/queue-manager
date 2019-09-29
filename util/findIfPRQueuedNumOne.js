/*
* Determines if any of the labels in the PR has the first in the queue label.
* */

const { coreApprovalLabel, firstInQueueLabel, triggerLabel } = require('./queueLabels');

module.exports = dataLabels => {
    let isQueuedNumOneLabelAdded = false;
    let isTriggerLabelAdded = false;
    let isCoreApprovalLabelAdded = false;

    for (let i = 0; i < dataLabels.length; i++) {
        const labelName = dataLabels[i].name;
        if (labelName === firstInQueueLabel) {
          isQueuedNumOneLabelAdded = true;
        } else if (labelName === coreApprovalLabel) {
          isCoreApprovalLabelAdded = true;
        } else if (labelName === triggerLabel) {
          isTriggerLabelAdded = true;
        }
    }
    return isQueuedNumOneLabelAdded && isTriggerLabelAdded && isCoreApprovalLabelAdded;
}
