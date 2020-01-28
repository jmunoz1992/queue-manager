var serverlessSDK = require('./serverless_sdk/index.js')
serverlessSDK = new serverlessSDK({
tenantId: 'jasmineesplagomunoz',
applicationName: 'queue-manager',
appUid: 'undefined',
tenantUid: 'undefined',
deploymentUid: '04417f3e-2d1c-4421-9526-c3d8fd4b0439',
serviceName: 'queue-manager',
stageName: 'dev',
pluginVersion: '3.2.7'})
const handlerWrapperArgs = { functionName: 'queue-manager-dev-router', timeout: 6}
try {
  const userHandler = require('./handler.js')
  module.exports.handler = serverlessSDK.handler(userHandler.probot, handlerWrapperArgs)
} catch (error) {
  module.exports.handler = serverlessSDK.handler(() => { throw error }, handlerWrapperArgs)
}
