import { useMutation } from '@apollo/client';
import { CREATE_OR_UPDATE_POLYGON } from '../graphql/mutations';

export const useCreateOrUpdatePolygon = () => {
  const [submitPolygon] = useMutation(CREATE_OR_UPDATE_POLYGON, {});

  const createOrUpdatePolygon = (input) => {
    return submitPolygon({
      variables: { input },
    });
  };

  return {
    createOrUpdatePolygon,
  };
};
