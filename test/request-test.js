import expect, { spyOn, restoreSpies } from 'expect';

import request from '../src/request';

describe('#request', function() {
  beforeEach(function() {
    this.headers = new global.Headers({
      'content-type': 'SOME CONTENT TYPE',
    });

    this.defaultResponse = {
      status: 200,
      json: () => {},
      text: () => {},
      formData: () => {},
      headers: this.headers,
    };

    spyOn(global, 'fetch').andReturn(Promise.resolve(this.defaultResponse));
  });

  afterEach(function() {
    restoreSpies();
  });

  it('should call fetch', function() {
    request('/FOO');

    expect(global.fetch).toHaveBeenCalled('/FOO', {});
  });

  it('should be able to add headers and other fields to the request', function() {
    request('/FOO', {
      method: 'post',
      headers: { foo: 'bar' },
      lalala: 'another field',
    });

    expect(global.fetch).toHaveBeenCalledWith('/FOO', {
      method: 'post',
      headers: {
        'content-type': 'application/json',
        foo: 'bar',
      },
      lalala: 'another field',
    });
  });

  describe('when the request has a body', function() {
    describe('when the method is not set', function() {
      it('should throw an error', function() {
        const makeRequest = () => request('/some_endpoint', { body: { foo: 'bar' } });

        expect(makeRequest).toThrow('Only `GET` requests can contain a `body`');
      });
    });

    describe('when the method is set to GET', function() {
      it('should throw an error', function() {
        const makeRequest = () => (
          request('/some_endpoint', { method: 'get', body: { foo: 'bar' } })
        );

        expect(makeRequest).toThrow('Only `GET` requests can contain a `body`');
      });
    });

    describe('when the method is set to something other than GET', function() {
      describe('when the content-type is set to application/json', function() {
        it('should send the request with the JSON-stringified payload', function() {
          const body = { foo: 'bar' };
          request('/FOO', {
            body,
            method: 'post',
            headers: { 'content-type': 'application/json; charset=utf-8' },
          });

          expect(global.fetch).toHaveBeenCalledWith('/FOO', {
            headers: { 'content-type': 'application/json; charset=utf-8' },
            method: 'post',
            body: JSON.stringify(body),
          });
        });
      });

      describe('when the content-type is set to something else', function() {
        it('should send the request with the original content-type and payload', function() {
          const body = { foo: 'bar' };

          request('/FOO', {
            body,
            method: 'post',
            headers: { 'content-type': 'test/content-type' },
          });

          expect(global.fetch).toHaveBeenCalledWith('/FOO', {
            headers: { 'content-type': 'test/content-type' },
            method: 'post',
            body: { foo: 'bar' },
          });
        });
      });

      describe('when the content-type is not set', function() {
        it('should send the request as a JSON request', function() {
          const body = { foo: 'bar' };
          request('/FOO', {
            body,
            method: 'post',
          });

          expect(global.fetch).toHaveBeenCalledWith('/FOO', {
            headers: { 'content-type': 'application/json' },
            method: 'post',
            body: JSON.stringify(body),
          });
        });
      });
    });

    it('should be able to add additional headers', function() {
      request('/FOO', {
        method: 'post',
        body: 'BODY',
        headers: { foo: 'bar' },
      });

      expect(global.fetch).toHaveBeenCalledWith('/FOO', {
        method: 'post',
        body: JSON.stringify('BODY'),
        headers: {
          'content-type': 'application/json',
          foo: 'bar',
        },
      });
    });
  });

  describe('when the request succeeds', function() {
    describe('when the payload is JSON', function() {
      beforeEach(function() {
        this.headers.set('content-type', 'application/json; charset=utf-8');

        global.fetch.andReturn(Promise.resolve({
          ...this.defaultResponse,
          json: () => 'JSON PAYLOAD',
        }));
      });

      it('should resolve the body to the JSON payload', function(done) {
        const response = request('/FOO');

        response
          .then(res => {
            expect(res).toInclude({ body: 'JSON PAYLOAD' });
          })
          .then(done, done);
      });
    });

    describe('when the payload is multipart/form-data', function() {
      beforeEach(function() {
        this.headers.set('content-type', 'multipart/form-data');

        global.fetch.andReturn(Promise.resolve({
          ...this.defaultResponse,
          formData: () => 'FORMDATA PAYLOAD',
        }));
      });

      it('should resolve the body to the FormData payload', function(done) {
        const response = request('/FOO');

        response
          .then(res => {
            expect(res).toInclude({ body: 'FORMDATA PAYLOAD' });
          })
          .then(done, done);
      });
    });

    describe('when the payload is something else', function() {
      beforeEach(function() {
        this.headers.set('content-type', 'another/content-type');

        global.fetch.andReturn(Promise.resolve({
          ...this.defaultResponse,
          text: () => 'TEXT PAYLOAD',
        }));
      });

      it('should resolve the body to the text payload', function(done) {
        const response = request('/FOO');

        response
          .then(res => {
            expect(res).toInclude({ body: 'TEXT PAYLOAD' });
          })
          .then(done, done);
      });
    });

    it('should resolve to the parsed response', function(done) {
      this.headers.set('foo', 'bar');
      this.headers.set('content-type', 'test/content-type');

      global.fetch.andReturn(Promise.resolve({
        ...this.defaultResponse,
        status: 202,
        statusText: 'test status text',
        text: () => 'RESPONSE BODY',
      }));

      const response = request('/somewhere');

      response
        .then(res => {
          expect(res).toInclude({
            status: 202,
            statusText: 'test status text',
            body: 'RESPONSE BODY',
          });

          expect(res.headers.get('foo')).toEqual('bar');
          expect(res.headers.get('content-type')).toEqual('test/content-type');
        })
        .then(done, done);
    });
  });

  describe('when the request fails', function() {
    it('should throw the error from the response', function(done) {
      global.fetch.andReturn(Promise.resolve({
        ...this.defaultResponse,
        status: 500,
        statusText: 'The response has failed!!!',
        text: () => 'ERROR BODY',
      }));

      const response = request('/FOO');

      response
        .then(
          () => (new Error('`response` should have thrown an error')),
          err => {
            expect(err.message).toEqual('The response has failed!!!');
            expect(err.status).toEqual(500);
            expect(err.statusText).toEqual('The response has failed!!!');
            expect(err.body).toEqual('ERROR BODY');
            expect(err.headers).toEqual(this.headers);
          }
        )
        .then(done, done);
    });
  });
});
