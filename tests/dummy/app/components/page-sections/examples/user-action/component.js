import Component from '@glimmer/component';
import { tracked, cached } from '@glimmer/tracking';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { later } from '@ember/runloop';

export default class PageSectionsExamplesUserActionComponent extends Component {
  @service store;
  @service server;

  @tracked pending = false;

  constructor() {
    super(...arguments);

    this.server.server.get('/users/:id/profile', (request) => {
      let user = this.store.peekRecord('user', request.params.id);
      let data = user.serialize({ includeId: true });
      data.data.attributes.name = 'Ember Custom Actions';
      return [200, {}, JSON.stringify(data)];
    });
  }

  @cached
  get user() {
    return this.store.createRecord('user', { id: 1 });
  }

  @action
  nameObserver() {
    if (this.user.name) {
      later(() => {
        this.store.push({
          data: {
            id: '1',
            type: 'user',
            attributes: {
              name: null,
            },
          },
        });
      }, 3000);
    }
  }

  @action
  generate(user) {
    this.pending = true;

    later(() => {
      user.profile().then(() => {
        this.pending = false;
      });
    }, 500);
  }
}
