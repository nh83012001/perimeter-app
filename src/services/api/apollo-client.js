import { ApolloClient, HttpLink, from, InMemoryCache } from '@apollo/client';

import { setContext } from '@apollo/client/link/context';

import { onError } from '@apollo/client/link/error';

import setHeaders from './auth/set-headers';
import networkErrorHandler from './error/networkErrorHandler';

const httpLink = new HttpLink({
  uri: import.meta.env.VITE_GRAPHQL_ENDPOINT,
});

const authLink = setContext(setHeaders);
const errorLink = onError(networkErrorHandler);

const getApolloClient = () => {
  return new ApolloClient({
    link: from([authLink, errorLink, httpLink]),
    cache: new InMemoryCache({ addTypename: false }),
  });
};

export default getApolloClient;
