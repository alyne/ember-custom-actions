import Component from '@glimmer/component';
import { tracked, cached } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { later } from '@ember/runloop';

export default class PageSectionsExamplesBurnActionComponent extends Component {
  @service store;
  @service server;

  @tracked pending = false;
  @tracked burned = false;

  constructor() {
    super(...arguments);

    this.server.server.get('/bridges/burn', () => {
      return [200, {}, 'true'];
    });
  }

  @cached
  get bridge() {
    return this.store.createRecord('bridge');
  }

  @action
  burnedObserver() {
    if (this.burned == true) {
      later(() => {
        this.burned = false;
      }, 3000);
    }
  }

  @action
  burn() {
    this.pending = true;

    later(() => {
      this.bridge.burnAll().then(() => {
        this.burned = true;
        this.pending = false;
      });
    }, 500);
  }
}
