const handleLabelAdditionUpdate = require('./lib/handleLabelAdditionUpdate');
const handleLabelRemovalUpdate = require('./lib/handleLabelRemovalUpdate');
const handlePullRequestMergeCheck = require('./lib/handlePullRequestMergeCheck');
const handlePullRequestClosed = require('./lib/handlePullRequestClosed');

module.exports = app => {
  app.log('Yay, the app was loaded!');

  // listen to all relevant pull request label actions
  app.on('pull_request.labeled', handleLabelAdditionUpdate.bind(app));

  // listen to all relevant pull request unlabel actions
  app.on('pull_request.unlabeled', handleLabelRemovalUpdate.bind(app));

  // listen to all relevant pull request actions
  app.on([
    'pull_request.opened',
    'pull_request.edited',
    'pull_request.labeled',
    'pull_request.unlabeled',
    'pull_request.synchronize',
    'pull_request.reopened'
  ], handlePullRequestMergeCheck.bind(app));

  // listen to all relevant pull request merge or closed actions
  app.on('pull_request.closed', handlePullRequestClosed.bind(app));
};
