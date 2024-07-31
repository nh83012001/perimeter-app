import { ApolloClient, HttpLink, from, InMemoryCache } from '@apollo/client';

const httpLink = new HttpLink({
  uri: import.meta.env.VITE_GRAPHQL_ENDPOINT,
});

const getApolloClient = () => {
  return new ApolloClient({
    link: from([httpLink]),
    cache: new InMemoryCache({ addTypename: false }),
  });
};

export default getApolloClient;
