// eslint-disable
import { gql } from '@apollo/client';

export const CREATE_SESSION_SETTINGS = gql`
  mutation createSessionSettings($input: CreateSessionInput!) {
    createSessionSettings(input: $input)
  }
`;

export const EDIT_SESSION_SETTINGS = gql`
  mutation editSessionSettings($input: EditSessionInput!) {
    editSessionSettings(input: $input)
  }
`;

export const CREATE_POLYGON = gql`
  mutation createPolygon($input: CreatePolygonInput!) {
    createPolygon(input: $input)
  }
`;

export const EDIT_POLYGON = gql`
  mutation editPolygon($input: EditPolygonInput!) {
    editPolygon(input: $input)
  }
`;

export const DELETE_POLYGON = gql`
  mutation deletePolygon($input: DeletePolygonInput!) {
    deletePolygon(input: $input)
  }
`;
