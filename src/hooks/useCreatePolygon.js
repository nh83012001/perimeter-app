import { useMutation } from '@apollo/client';
import { CREATE_POLYGON } from '../graphql/mutations';

export const useCreatePolygon = () => {
  const [submitPolygon] = useMutation(CREATE_POLYGON, {});

  const createPolygon = (input) => {
    return submitPolygon({
      variables: { input },
    });
  };

  return {
    createPolygon,
  };
};
