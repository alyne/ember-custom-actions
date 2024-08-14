import Component from '@glimmer/component';
import { inject as service } from '@ember/service';

export default class ModelActionComponent extends Component {
  @service store;

  get post() {
    return this.store.createRecord('post', { id: 1 });
  }

  get status() {
    return this.post.publish();
  }
}
