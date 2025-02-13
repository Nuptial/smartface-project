import Keycloak from 'keycloak-js';

const keycloakConfig = {
    url: 'http://localhost:8080',
    realm: 'master',
    clientId: 'next-client'
};

const keycloak = new Keycloak(keycloakConfig);

export default keycloak; 