import JSONAPISerializer from '@ember-data/serializer/json-api';
import { deprecate } from '@ember/debug';

export default class extends JSONAPISerializer {
  constructor() {
    super(...arguments);

    deprecate(
      'Using ember-custom-actions `JSONAPISerializer` is no longer required and this class will be removed.',
      false,
      {
        id: 'ember-custom-actions.deprecate-jsonapi-serializer',
        until: '3.0.0',
      }
    );
  }
}
