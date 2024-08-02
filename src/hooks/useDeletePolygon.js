import { useMutation } from '@apollo/client';
import { DELETE_POLYGON } from '../graphql/mutations';

export const useDeletePolygon = () => {
  const [submitDeletePolygon] = useMutation(DELETE_POLYGON, {});

  const deletePolygon = (input) => {
    return submitDeletePolygon({
      variables: { input },
    });
  };

  return {
    deletePolygon,
  };
};
