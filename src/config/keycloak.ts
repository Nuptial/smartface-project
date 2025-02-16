import Keycloak from 'keycloak-js';

const keycloakConfig = {
    url: 'http://localhost:9090',
    realm: 'master',
    clientId: 'next-client',
    credentials: {
        secret: undefined
    },
    checkLoginIframe: false,
    enableLogging: true
};

const keycloak = new Keycloak(keycloakConfig);

export default keycloak; 