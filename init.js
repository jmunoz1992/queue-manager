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

var options = {
  apiVersion: 'v1', // default
  endpoint: 'https://vault.ch.lab.stockyard.io:8200',
  token: '025e456a-2389-2a20-e18c-768fbd11c315'
}

// get new instance of the client
var vault = require('node-vault')(options)

var PRIVATE_KEY
var APP_ID
var WEBHOOK_SECRET

vault.read('secret/QueueManagerGithubApp')
  .then((result) => {
    var data = result.data
    PRIVATE_KEY = data.PRIVATE_KEY
    APP_ID = data.APP_ID
    WEBHOOK_SECRET = data.WEBHOOK_SECRET

    console.log('export PRIVATE_KEY="' + PRIVATE_KEY.trim() + '"')
    console.log('export APP_ID="' + APP_ID.trim() + '"')
    console.log('export WEBHOOK_SECRET="' + WEBHOOK_SECRET.trim() + '"')
  })
  .catch(console.error)
