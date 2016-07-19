import expect, { spyOn, restoreSpies } from 'expect';

import fluxFetch from '../src/flux-fetch';
import * as requestModule from '../src/request';

describe('#fluxFetch', function() {
  beforeEach(function() {
    spyOn(requestModule, 'default').andReturn(Promise.resolve('RESPONSE'));
  });

  afterEach(function() {
    restoreSpies();
  });

  describe('without a fluxToken', function() {
    it('should fail', function() {
      const request = () => fluxFetch('/some_endpoint');

      expect(request).toThrow('Must provide a `fluxToken` to `fluxFetch`');
    });
  });

  describe('with a fluxToken', function() {
    it('should set the necessary request options', function() {
      fluxFetch('/some_endpoint', { fluxToken: 'FAKE_FLUX_TOKEN' });

      expect(requestModule.default).toHaveBeenCalledWith('/some_endpoint', {
        credentials: 'include',
        headers: {
          'flux-request-marker': 1,
          'flux-request-token': 'FAKE_FLUX_TOKEN',
        },
      });
    });

    it('should be able to add additional fields', function() {
      fluxFetch('/some_endpoint', {
        fluxToken: 'FLUX_TOKEN',
        bar: 'baz',
        headers: {
          foo: 'bar',
        },
      });

      expect(requestModule.default).toHaveBeenCalledWith('/some_endpoint', {
        bar: 'baz',
        credentials: 'include',
        headers: {
          foo: 'bar',
          'flux-request-marker': 1,
          'flux-request-token': 'FLUX_TOKEN',
        },
      });
    });

    it('should return the response', function(done) {
      const response = fluxFetch('/some_endpoint', {
        fluxToken: 'FLUX_TOKEN',
      });

      response
        .then(res => {
          expect(res).toEqual('RESPONSE');
        })
        .then(done, done.fail);
    });
  });
});
