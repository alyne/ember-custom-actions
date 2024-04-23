import Component from '@glimmer/component';
import { action } from '@ember/object';
import { next } from '@ember/runloop';

export default class ScrollToComponent extends Component {
  get offset() {
    return this.args.offset ?? -65;
  }

  @action
  onClick() {
    next(() => {
      const element = document.querySelector(this.args.href);
      const position = element.offsetTop + this.offset;

      window.scroll({ top: position, behavior: 'smooth' });
    });
  }
}
