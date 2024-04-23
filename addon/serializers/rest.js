import RESTSerializer from '@ember-data/serializer/rest';
import { deprecate } from '@ember/debug';

export default class extends RESTSerializer {
  constructor() {
    super(...arguments);

    deprecate(
      'Using ember-custom-actions `RestSerializer` is no longer required and this class will be removed.',
      false,
      {
        id: 'ember-custom-actions.deprecate-jsonapi-serializer',
        until: '3.0.0',
      }
    );
  }
}
