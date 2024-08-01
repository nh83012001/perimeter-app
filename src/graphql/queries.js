// eslint-disable
import { gql } from '@apollo/client';

export const GET_MAP_SESSION = gql`
  query getMapSession($input: String!) {
    getMapSession(input: $input) {
      sessionId
      zoom
      center
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
