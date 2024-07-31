import React, { createContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import { ApolloProvider } from '@apollo/client';

import getApolloClient from './apollo-client';

const AppApolloContext = createContext({});

export default function AppApolloProvider({ children }) {
  const apolloClient = useMemo(() => getApolloClient(), []);

  return (
    <AppApolloContext.Provider value={apolloClient}>
      <ApolloProvider client={apolloClient}>{children}</ApolloProvider>
    </AppApolloContext.Provider>
  );
}

AppApolloProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
