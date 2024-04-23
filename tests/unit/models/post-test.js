import ArrayProxy from '@ember/array/proxy';
import ObjectProxy from '@ember/object/proxy';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Pretender from 'pretender';

module('Unit | Model | post', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.server = new Pretender();
  });

  hooks.afterEach(function () {
    this.server.shutdown();
  });

  test('model action', function (assert) {
    assert.expect(3);

    this.server.post('/posts/:id/publish', (request) => {
      const data = JSON.parse(request.requestBody);
      assert.deepEqual(data, { myParam: 'My first param' });
      assert.strictEqual(request.url, '/posts/1/publish');

      return [200, {}, 'true'];
    });

    const done = assert.async();
    const payload = { myParam: 'My first param' };
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('post', { id: 1 });

    model.publish(payload).then((response) => {
      assert.ok(response, true);
      done();
    });
  });

  test('model action pushes to store an object', function (assert) {
    assert.expect(5);

    this.server.post('/posts/:id/publish', (request) => {
      const data = JSON.parse(request.requestBody);
      assert.deepEqual(data, { myParam: 'My first param' });
      assert.strictEqual(request.url, '/posts/1/publish');

      return [200, {}, '{"data": {"id": 2, "type": "Post"}}'];
    });

    const done = assert.async();
    const payload = { myParam: 'My first param' };
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('post', { id: 1 });

    assert.strictEqual(store.peekAll('post').length, 1);

    model.publish(payload).then((response) => {
      assert.strictEqual(response.id, '2');
      assert.strictEqual(store.peekAll('post').length, 2);
      done();
    });
  });

  test('model action pushes to store an array of objects', function (assert) {
    assert.expect(6);

    this.server.post('/posts/:id/publish', (request) => {
      const data = JSON.parse(request.requestBody);
      assert.deepEqual(data, { myParam: 'My first param' });
      assert.strictEqual(request.url, '/posts/1/publish');

      return [
        200,
        {},
        '{"data": [{"id": 2, "type": "posts"}, {"id": 3, "type": "posts"}] }',
      ];
    });

    const done = assert.async();
    const payload = { myParam: 'My first param' };
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('post', { id: 1 });

    assert.strictEqual(store.peekAll('post').length, 1);

    model.publish(payload).then((response) => {
      assert.strictEqual(response[0].id, '2');
      assert.strictEqual(response[1].id, '3');
      assert.strictEqual(store.peekAll('post').length, 3);
      done();
    });
  });

  test('resource action', function (assert) {
    assert.expect(3);

    this.server.post('/posts/list', (request) => {
      const data = JSON.parse(request.requestBody);
      assert.deepEqual(data, { myParam: 'My first param' });
      assert.strictEqual(request.url, '/posts/list');

      return [200, {}, 'true'];
    });

    const done = assert.async();
    const payload = { myParam: 'My first param' };
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('post', { id: 1 });

    model.list(payload).then((response) => {
      assert.ok(response, true);
      done();
    });
  });

  test('resource action with params in GET', function (assert) {
    assert.expect(4);

    this.server.get('/posts/search', (request) => {
      assert.strictEqual(
        request.url,
        '/posts/search?showAll=true&my-param=My%20first%20param'
      );
      assert.strictEqual(request.requestHeaders.test, 'Custom header');
      assert.deepEqual(request.queryParams, {
        'my-param': 'My first param',
        showAll: 'true',
      });

      return [200, {}, 'true'];
    });

    const done = assert.async();
    const payload = { myParam: 'My first param' };
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('post', { id: 1 });

    model
      .search(payload, { ajaxOptions: { headers: { test: 'Custom header' } } })
      .then((response) => {
        assert.ok(response, true);
        done();
      });
  });

  test('resource action pushes to store', function (assert) {
    assert.expect(5);

    this.server.post('/posts/list', (request) => {
      const data = JSON.parse(request.requestBody);
      assert.deepEqual(data, { myParam: 'My first param' });
      assert.strictEqual(request.url, '/posts/list');

      return [
        200,
        {},
        '{"data": [{"id": "2", "type": "post"},{"id": "3", "type": "post"}]}',
      ];
    });

    const done = assert.async();
    const payload = { myParam: 'My first param' };
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('post', { id: 1 });

    assert.strictEqual(store.peekAll('post').length, 1);

    model.list(payload).then((response) => {
      assert.strictEqual(response.length, 2);
      assert.strictEqual(store.peekAll('post').length, 3);
      done();
    });
  });

  test('responseTypes', async function (assert) {
    assert.expect(6);

    this.server.post('/posts/list', (request) => {
      assert.strictEqual(request.url, '/posts/list');

      return [
        200,
        {},
        '{"data": [{"id": "2", "type": "post"},{"id": "3", "type": "post"}]}',
      ];
    });

    const store = this.owner.lookup('service:store');
    const model = store.createRecord('post');

    let promise;
    await (promise = model.list());
    let promiseArray;
    await (promiseArray = model.list(null, { responseType: 'array' }));
    let promiseObject;
    await (promiseObject = model.list(null, { responseType: 'object' }));

    assert.strictEqual(promise.constructor, Promise);
    assert.strictEqual(promiseArray.constructor.superclass, ArrayProxy);
    assert.strictEqual(promiseObject.constructor.superclass, ObjectProxy);
  });

  test('model action set serialized errors in error object', function (assert) {
    assert.expect(1);

    const done = assert.async();
    const errorText = 'This name is taken';
    const error = {
      detail: errorText,
      source: { pointer: 'data/attributes/name' },
    };

    this.server.post('/posts/:id/publish', () => {
      const payload = JSON.stringify({ errors: [error] });
      return [422, {}, payload];
    });

    const store = this.owner.lookup('service:store');
    const model = store.createRecord('post', { id: 1, name: 'Mikael' });

    model.publish({ name: 'new-name' }).catch((error) => {
      assert.deepEqual(error.serializedErrors, { name: [errorText] });
      done();
    });
  });

  test('custom headers in non-customAction', function (assert) {
    assert.expect(2);

    this.server.get('/posts/search', (request) => {
      assert.strictEqual(request.requestHeaders.testHeader, 'ok');
      return [200, {}, 'true'];
    });

    const done = assert.async();
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('post');

    model.search().then((response) => {
      assert.ok(response, true);
      done();
    });
  });
});
