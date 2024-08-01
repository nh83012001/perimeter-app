// eslint-disable
import { gql } from '@apollo/client';

export const GET_MAP_SESSION = gql`
  query getMapSession($input: GetMapSessionInput!) {
    getMapSession(input: $input) {
      sessionId
      polygons {
        polygonId
        name
        coordinates
      }
    }
  }
`;
