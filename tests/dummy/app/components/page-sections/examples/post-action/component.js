import Component from '@glimmer/component';
import { tracked, cached } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { later } from '@ember/runloop';

export default class PageSectionsExamplesPostActionComponent extends Component {
  @service store;
  @service server;

  @tracked pending = false;

  constructor() {
    super(...arguments);

    this.server.server.post('/posts/:id/publish', (request) => {
      const post = this.store.peekRecord('post', request.params.id);
      const data = post.serialize({ includeId: true });
      data.data.attributes.published = true;

      return [200, {}, JSON.stringify(data)];
    });
  }

  @cached
  get post() {
    return this.store.createRecord('post', { id: 1 });
  }

  @action
  publishedObserver() {
    if (this.post.published === true) {
      later(() => {
        this.store.push({
          data: {
            id: '1',
            type: 'post',
            attributes: {
              published: false,
            },
          },
        });
      }, 3000);
    }
  }

  @action
  publish(post) {
    this.pending = true;

    later(() => {
      post.publish().then(() => {
        this.pending = false;
      });
    }, 500);
  }
}
