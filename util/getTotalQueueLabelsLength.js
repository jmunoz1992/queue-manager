/*
* Determines how many queue labels are there for the given repo
* */

const { queueLabel } = require('./queueLabels');

module.exports = repoLabels => {
    let totalQueueLabelsLength = 0;
    for (let i = 0; i < repoLabels.data.length; i++) {
        const label = repoLabels.data[i].name;

        if (label.includes(queueLabel)) {
            totalQueueLabelsLength++;
        }
    }
    return totalQueueLabelsLength;
};
