'use strict'

/*
 Install Expedia CA files
*/
var rootCas = require('ssl-root-cas').inject()
const fs = require('fs');


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
  token: process.env.VAULT_TOKEN
}

// get new instance of the client
var vault = require('node-vault')(options)

var APP_ID
var WEBHOOK_SECRET

vault.read('secret/QueueManagerGithubApp')
  .then((result) => {
    var data = result.data
    APP_ID = data.APP_ID
    WEBHOOK_SECRET = data.WEBHOOK_SECRET

    // write to a new file named 2pac.txt
    fs.writeFileSync('private_key.pem', data.PRIVATE_KEY, (err) => {
      // throws an error, you could also catch it here
      if (err) throw err
    })

    console.log('export APP_ID="' + APP_ID.trim() + '"')
    console.log('export WEBHOOK_SECRET="' + WEBHOOK_SECRET.trim() + '"')
  })
  .catch(console.error)
