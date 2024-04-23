import Model, { attr } from '@ember-data/model';
import { modelAction } from 'ember-custom-actions';

export default class BikeModel extends Model {
  @attr name;

  ride = modelAction('ride', { method: 'PUT', data: { defaultParam: 'ok' } });
}
