import { Observable } from '@apollo/client';

import {
  handleAppServerError,
  captureAppMessage,
  HANDLED_ERROR,
} from 'errorHandling';

function handleApolloNetworkError(operation, networkError) {
  if (!networkError) {
    return null;
  }
  handleAppServerError(networkError, operation?.operationName);

  // The return propagates the error to the part that initiated the request. So it can also be handled locally if needed.
  return new Observable((observer) => {
    observer.error(new Error(HANDLED_ERROR));
  });
}

function handleGraphQlErrors(graphQLErrors) {
  if (!graphQLErrors) {
    return;
  }
  graphQLErrors.forEach(({ message }) => {
    captureAppMessage(message);
  });
}

export default function networkErrorHandler({
  graphQLErrors,
  networkError,
  operation,
}) {
  handleGraphQlErrors(graphQLErrors);
  return handleApolloNetworkError(operation, networkError);
}
