/*
* When a label is removed, the PRs containing any queue labels will be updated.
* */

const updateQueue = require('../util/updateQueue');
const { queueLabel } = require('../util/queueLabels');
const handleManuallyAddedQFMLabel = require('./handleManuallyAddedQFMLabel');


module.exports = async context => {
    const theUnlabeledLabelName = context.payload.label.name;

    if (theUnlabeledLabelName.includes(queueLabel)) {
        const labelNumRemoved = parseInt(theUnlabeledLabelName[theUnlabeledLabelName.length - 1], 10);
        if (isNaN(labelNumRemoved)) return;

        await handleManuallyAddedQFMLabel(context);
        await updateQueue(context, labelNumRemoved);
    }

    return;
};
