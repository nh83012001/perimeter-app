import { useLazyQuery } from '@apollo/client';
import { GET_MAP_SESSION } from '../graphql/queries';

export const useGetMapSession = () => {
  const [submitGetMapSession] = useLazyQuery(GET_MAP_SESSION, {});

  const getMapSession = (input) => {
    return submitGetMapSession({
      variables: { input },
    });
  };

  return {
    getMapSession,
  };
};
