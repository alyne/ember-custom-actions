import Model, { attr } from '@ember-data/model';
import { modelAction } from 'ember-custom-actions';

export default class UserModel extends Model {
  @attr name;

  profile = modelAction('profile', { responseType: 'object', method: 'get' });
}
