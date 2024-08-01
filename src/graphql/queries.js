// eslint-disable
import { gql } from '@apollo/client';

export const GET_MAP_SESSION = gql`
  query getMapSession($input: String!) {
    getMapSession(input: $input) {
      sessionId
      polygons {
        polygonId
        type
        properties {
          name
        }
        geometry {
          coordinates
          type
        }
      }
    }
  }
`;
