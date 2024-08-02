import { useMutation } from '@apollo/client';
import { EDIT_POLYGON } from '../graphql/mutations';

export const useEditPolygon = () => {
  const [submitEditPolygon] = useMutation(EDIT_POLYGON, {});

  const editPolygon = (input) => {
    return submitEditPolygon({
      variables: { input },
    });
  };

  return {
    editPolygon,
  };
};
