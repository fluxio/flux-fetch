import request from './request';

function fluxFetch(path, { fluxToken, headers, ...others } = {}) {
  if (!fluxToken) {
    throw new Error('Must provide a `fluxToken` to `fluxFetch`');
  }

  return request(path, {
    credentials: 'include',
    headers: {
      'flux-request-marker': 1,
      'flux-request-token': fluxToken,
      ...headers,
    },
    ...others,
  });
}

export default fluxFetch;
