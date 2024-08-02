// eslint-disable
import { gql } from '@apollo/client';

export const CREATE_OR_UPDATE_POLYGON = gql`
  mutation createOrUpdatePolygon($input: CreateOrUpdatePolygonInput!) {
    createOrUpdatePolygon(input: $input)
  }
`;

export const DELETE_POLYGON = gql`
  mutation deletePolygon($input: DeletePolygonInput!) {
    deletePolygon(input: $input)
  }
`;
