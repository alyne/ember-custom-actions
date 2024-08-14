import Model, { attr } from '@ember-data/model';
import { resourceAction } from 'ember-custom-actions';

export default class BridgeModel extends Model {
  @attr name;

  burnAll = resourceAction('burn', { method: 'GET' });
}
