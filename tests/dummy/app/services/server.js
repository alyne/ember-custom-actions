import Service from '@ember/service';
import Pretender from 'pretender';

export default class ServerService extends Service {
  constructor() {
    super(...arguments);
    this.server = new Pretender();
  }
}
