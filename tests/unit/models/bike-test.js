import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Pretender from 'pretender';

module('Unit | Model | bike', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.server = new Pretender();
  });

  hooks.afterEach(function () {
    this.server.shutdown();
  });

  test('model action with default and custom data', function (assert) {
    assert.expect(4);

    this.server.put('/bikes/:id/ride', (request) => {
      let data = JSON.parse(request.requestBody);

      assert.deepEqual(data, { myParam: 'My first param', defaultParam: 'ok' });
      assert.deepEqual(request.queryParams, {
        enduro: 'true',
        include: 'owner',
      });
      assert.strictEqual(
        request.url,
        '/bikes/1/ride?enduro=true&include=owner'
      );

      return [200, {}, 'true'];
    });

    const done = assert.async();
    const payload = { myParam: 'My first param' };
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('bike', { id: 1 });

    model
      .ride(payload, { queryParams: { enduro: true, include: 'owner' } })
      .then((response) => {
        assert.ok(response, true);
        done();
      });
  });

  test('model action pushes to store an object', function (assert) {
    assert.expect(5);

    this.server.put('/bikes/:id/ride', (request) => {
      const data = JSON.parse(request.requestBody);
      assert.deepEqual(data, { myParam: 'My first param', defaultParam: 'ok' });
      assert.strictEqual(request.url, '/bikes/1/ride');

      return [200, {}, '{ "bikes": { "id": 2 } }'];
    });

    const done = assert.async();
    const payload = { myParam: 'My first param' };
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('bike', { id: 1 });

    assert.strictEqual(store.peekAll('bike').length, 1);

    model.ride(payload).then((response) => {
      assert.strictEqual(response.id, '2');
      assert.strictEqual(store.peekAll('bike').length, 2);
      done();
    });
  });

  test('model action pushes to store an array of objects', function (assert) {
    assert.expect(6);

    this.server.put('/bikes/:id/ride', (request) => {
      const data = JSON.parse(request.requestBody);
      assert.deepEqual(data, { myParam: 'My first param', defaultParam: 'ok' });
      assert.strictEqual(request.url, '/bikes/1/ride');

      return [200, {}, '{ "bikes": [ {"id": 2 }, {"id": 3 } ] }'];
    });

    const done = assert.async();
    const payload = { myParam: 'My first param' };
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('bike', { id: 1 });

    assert.strictEqual(store.peekAll('bike').length, 1);

    model.ride(payload).then((response) => {
      assert.strictEqual(response[0].id, '2');
      assert.strictEqual(response[1].id, '3');
      assert.strictEqual(store.peekAll('bike').length, 3);
      done();
    });
  });

  test('model action set serialized errors in error object', function (assert) {
    assert.expect(1);

    const done = assert.async();
    const errorText = 'This name is taken';
    const error = {
      detail: errorText,
      source: { pointer: 'data/attributes/name' },
    };

    this.server.put('/bikes/:id/ride', () => {
      const payload = JSON.stringify({ errors: [error] });
      return [422, {}, payload];
    });

    const store = this.owner.lookup('service:store');
    const model = store.createRecord('bike', {
      id: 1,
      name: 'Mikael',
    });

    model.ride({ name: 'new-name' }).catch((error) => {
      assert.deepEqual(error.serializedErrors, { name: [errorText] });
      done();
    });
  });
});
