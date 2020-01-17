// handler.js
const { serverless } = require('@probot/serverless-lambda');
const appFn = require('./index');
module.exports.probot = serverless(appFn);
