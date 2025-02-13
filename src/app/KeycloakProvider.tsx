'use client';

import { ReactKeycloakProvider } from "@react-keycloak/web";
import type { AuthProviderProps } from "@react-keycloak/core";
import type Keycloak from "keycloak-js";
import keycloak from "../config/keycloak";

type ExtendedAuthProviderProps = AuthProviderProps<Keycloak> & {
  children: React.ReactNode;
};

const Provider = ReactKeycloakProvider as React.ComponentType<ExtendedAuthProviderProps>;

const eventLogger = (event: unknown, error: unknown) => {
  console.log('onKeycloakEvent', event);
  if (error) {
    console.error('onKeycloakError', error);
  }
};

const loadingComponent = (
  <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    Loading...
  </div>
);

export default function KeycloakProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider
      authClient={keycloak}
      onEvent={eventLogger}
      LoadingComponent={loadingComponent}
      initOptions={{
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window?.location.origin + '/silent-check-sso.html',
        pkceMethod: 'S256',
        checkLoginIframe: false
      }}
    >
      {children}
    </Provider>
  );
} 