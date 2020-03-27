const config = require('config');

const Problem = require('api-problem');

const keycloak = require('../../components/keycloak');
const KeyCloakServiceClientManager = require('../../components/keyCloakServiceClientMgr');
const RealmAdminService = require('../../components/realmAdminSvc');

const keycloakRouter = require('express').Router();

// fetches all the service clients for all KC realms
// current user must have role GETOK_ADMIN
keycloakRouter.get('/serviceClients', keycloak.protect('realm:GETOK_ADMIN'), async (req, res) => {

  const [devClients, testClients, prodClients] = await Promise.all([
    getClientsFromEnv('dev'),
    getClientsFromEnv('test'),
    getClientsFromEnv('prod')
  ]);

  // join them all into one array
  var result = devClients.concat(testClients, prodClients);

  if (result === null) {
    return new Problem(404).send(res);
  } else {
    res.status(200).json(result);
  }
});


/**
 * @function getClientsFromEnv
 * Utility function to call the KC service to get service clients for a KC realm
 * @param {string} kcEnv The KC env
 * @returns {object[]} An array of service clients
 */
function getClientsFromEnv(kcEnv){

  const realmKey = `serviceClient.keycloak.${kcEnv}`;
  const {
    endpoint: realmBaseUrl,
    username: clientId,
    password: clientSecret,
    realm: realmId
  } = config.get(realmKey);

  const realmSvc = new RealmAdminService({ realmBaseUrl, clientId, clientSecret, realmId });
  const kcScMgr = new KeyCloakServiceClientManager(realmSvc);

  return kcScMgr.fetchAllClients(kcEnv);
}

module.exports = keycloakRouter;
