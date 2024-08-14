import Model, { attr } from '@ember-data/model';
import { modelAction, resourceAction } from 'ember-custom-actions';

export default class PostModel extends Model {
  @attr name;
  @attr('boolean', { defaultValue: false }) published;

  publish = modelAction('publish', { responseType: 'object' });
  list = resourceAction('list');
  search = resourceAction('search', {
    method: 'GET',
    normalizeOperation: 'dasherize',
    queryParams: { showAll: true },
    headers: { testHeader: 'ok' },
  });
}
