module.exports = function () {
  var logger = require('simple-node-logger').createSimpleLogger(),
    util = require('util'),
    fs = require('fs'),
    os = require('os')

  var options = {
      apiVersion: 'v1', // default
      endpoint: 'https://vault.ch.lab.stockyard.io:8200',
      token: '/secret/vault_token'
    },
    vault = require('node-vault')(options),
    home = os.homedir(),
    defaultTokenLocation = '/secret/vault_token'

  /*
    private APIs
  */
//Do authenticate with vault token
  var authenticate = function() {
      var token_location = home ? defaultTokenLocation.replace(/^~($|\/|\\)/, `${home}$1`) : defaultTokenLocation;
      // even though we are not explicitly setting the token, the node-vault library sources it from the environment.
      console.log('vault token ', vault.token);
      if (typeof vault.token === "undefined" || vault.token === null) {
        vault.token = readTokenFile(token_location);
      } else {
        logger.info("Vault token already provided as VAULT_TOKEN environment variable.");
      }
      //return Promise
      return new Promise((resolve, reject) => {
        vault.tokenLookupSelf().then((result) => {
          logger.info("Successfully authenticated application %s");
          return resolve(result);
        }).catch((err) => {
          logger.error("Error authenticating application: %s", err.message);
          return reject(err);
        });
      });
    },
    //read all secrets under by project name
    readSecrets = function() {
      var path = util.format('secret/%s');
      //return Promise
      return new Promise((resolve, reject) => {
        vault.read(path).then((result) => {
          logger.log("info", "Successfully read secrets under %s", path);
          resolve(result);
        }).catch((err) => {
          logger.log("error", "Could not read secrets under %s with error: %s", path, err);
          reject(err);
        });
      });
    },
    //read a specific secret by keyName
    getSecretByKey = function(keyName) {
      return new Promise((resolve, reject) => {
        authenticate().then(() => {
          readSecrets().then((result) => {
            var secret = result.data[keyName];
            logger.log("info", "Successfully retrieved value of key %s", keyName)
            resolve(secret);
          }).catch((err) => {
            logger.log("error", "Could not get the value of key %s with error: %s", keyName, err);
            reject(err);
          });
        }).catch((err) => {
          logger.log("error", "Could not authenticate to the vault server: %s", err);
          reject(err);
        });
      });
    },
    readTokenFile = function(token_location) {
      var maxAttempts = 5;
      for (var i = 1; i <= maxAttempts; i++) {
        logger.log("info", "Attempt %d of reading Vault access token from %s", i, token_location);
        try {
          return fs.readFileSync(token_location, 'utf8');
        } catch (err) {
          if (i >= maxAttempts) throw err;
        }
      }
    };

  /*
    public APIs
  */
  var service = {
    getSecretByKey: getSecretByKey
  }

  return service
}
