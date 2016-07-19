# Flux Fetch

## Installation

Install from the repo:

```
$ npm install --save flux-fetch
```

Import the package into your project:

```js
// Using ES6 modules
import fluxFetch from 'flux-fetch';

// Using CommonJS modules
var fluxFetch = require('flux-fetch').default;
```

NOTE: This will place `fetch`, `Request`, `Response`, and `Headers` in your global context
if they are not already there, e.g., if you are in Node.

## Usage

### fluxFetch(path, options)

#### Arguments

1. `path` *(String)*: The request URL
1. `options` *(Object = `{ fluxToken: String, ...others })`*: The custom options that you
ultimately want to get sent to `fetch`, in addition to the defaults set by `fluxFetch`.
For example:

  `fluxToken` *(String - **required**)*: The user's Flux CSRF token. Most likely, this is available
  as the `flux_token` cookie.

  `method` *(String - default: 'get')*: The request's HTTP method

  `body` *(any)*: The request payload. If the `content-type` header is set to something other than
  `application/json`, this will be provided as is. Otherwise, it will be JSON-stringified.
  **GET requests will fail if passed a body.**

  `headers` *(Object)*: A [Headers](https://developer.mozilla.org/en-US/docs/Web/API/Headers)
  object. To access a specific header, you can use `headers.get(header)`. Listing all headers is
  environment-specific, e.g., in Node you can use `headers.raw()` and in the browser you can
  iterate over the headers with `for...of`.

#### Returns

`(Promise --> Object: { status: Number, statusText: String, headers: Object, body?: any })`:
A promise that resolves to the response. If the response fails (i.e., the status is < 200 or
>= 300), it will reject with an error that has the same properties.

## Suggested Use

You may want to make another wrapper on top of `fluxFetch` that is custom to your app's particular
use case. This is particularly useful so that you don't always need to explicitly pass in the
current user's Flux token, as well as for common error handling.

For example:

```js
import cookie from 'js-cookie';
import fluxFetch from 'flux-fetch';

function request(url, options) {
  return fluxFetch(url, Object.assign({}, options, { fluxToken: cookie.get('flux_token') })
    .catch(handleRequestError);
}

function handleRequestError(error) {
  // e.g., check if the user is still logged in and send them back to lgoin if they're not
}
```

## Development

1. `git clone git@github.com:fluxio/flux-fetch.git`
1. `npm install`
1. `npm run test:watch` to run the tests on changes or `npm test` to run them once

## Publishing a New Version

1. Increment the version in `package.json` using [Semver](http://semver.org/)
1. `npm run prepublish`
1. `git add package.json && git commit -m 'Update to version <version>'`
1. `git tag v<version>`
1. `git push && git push --tags`
