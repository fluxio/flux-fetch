// Places `fetch`, `Request`, `Response`, and `Headers` on the global context if they're
// not already there.
import 'isomorphic-fetch';

function parseResponse(response) {
  const payloadType = response.headers.get('content-type') || '';
  let body = null;

  // The mime-type may, for example, include a charset
  if (payloadType.search(/application\/json/i) !== -1) {
    body = response.json();
  } else if (payloadType.search(/multipart\/form-data/i) !== -1) {
    body = response.formData();
  } else {
    body = response.text();
  }

  return {
    body,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  };
}

function handleError(response) {
  const { status, statusText, headers, body } = response;

  if (status < 200 || status >= 300) {
    const error = new Error(statusText || body);

    error.status = status;
    error.statusText = statusText;
    error.headers = headers;
    error.body = body;

    throw error;
  }

  return response;
}

function request(path, { method = 'get', body, headers = {}, ...others } = {}) {
  let payload = null;

  if (body && method.toLowerCase() === 'get') {
    throw new Error('Only `GET` requests can contain a `body`');
  }

  const contentType = headers['content-type'] || headers['Content-Type'] ||
    headers['Content-type'] || 'application/json';

  if (contentType.search(/application\/json/) !== -1 && body) {
    payload = { body: JSON.stringify(body) };
  } else if (body) {
    payload = { body };
  }

  return fetch(path, {
    method,
    headers: {
      ...headers,
      'content-type': contentType,
    },
    ...payload,
    ...others,
  })
    .then(parseResponse)
    .then(handleError);
}

export default request;
