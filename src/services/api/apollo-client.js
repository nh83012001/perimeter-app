import { ApolloClient, HttpLink, from, InMemoryCache } from '@apollo/client';
import { onError } from '@apollo/client/link/error';

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
      ),
    );
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

const httpLink = new HttpLink({
  uri: import.meta.env.VITE_GRAPHQL_ENDPOINT,
});

const getApolloClient = () => {
  return new ApolloClient({
    link: from([errorLink, httpLink]),
    cache: new InMemoryCache(),
  });
};

export default getApolloClient;
