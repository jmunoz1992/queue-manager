'use strict'

/*
 Install Expedia CA files
*/
var rootCas = require('ssl-root-cas').inject()

rootCas
  .addFile(__dirname + '/ssl/Internal2015C1.crt')
  .addFile(__dirname + '/ssl/ExpediaRoot2015.crt')
  .addFile(__dirname + '/ssl/ExpediaMSCAChain.pem')
  .addFile(__dirname + '/ssl/ExpediaMSCARoot.pem')
;

require('https').globalAgent.options.ca = rootCas

var vaultService = require('./vault.js')()

vaultService.getSecretByKey('APP_ID')
  .then((result) => {
    console.log('result ', result)
  }).catch((err) => {
    console.log('there was an error ', err)
    process.exit(1)
  })
