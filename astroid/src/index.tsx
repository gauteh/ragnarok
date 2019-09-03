import { Component, render, createRef } from 'inferno';
import * as mousetrap from 'mousetrap';
import { ThreadIndex } from './components/thread-index/ThreadIndex';
import { ThreadView } from './components/thread-view/ThreadView';

import 'bootstrap/dist/css/bootstrap.css';
import './main.css';

const container = document.getElementById('app');

class Astroid extends Component<any, any> {
  buffers = null;
  active = 0;

  constructor(props, context) {
    super(props, context);

    this.buffers = createRef ();

    mousetrap.bind ('q', () => {
      window.close (); // has no effect outside electron
    });

    mousetrap.bind ('b', () => {
      this.active = (this.active + 1) % (this.buffers.current.children.length);
      this.updateVisible ();
    });
  }

  public addComponent = (c: JSX.Element) =>
  {
    const target = document.createElement ('div');
    target.classList.add ("hidden");
    this.buffers.current.appendChild (target);
    render (c, target);

    this.updateVisible ();
  }

  public updateVisible () {
    console.log ("active:", this.active);

    for (let i = 0; i < this.buffers.current.children.length; i++) {
      const c = this.buffers.current.children[i];
        console.log (c, i);
        if (i === this.active) {
          c.classList.remove ("hidden");
        } else {
          if (!c.classList.contains ("hidden")) {
            c.classList.add ("hidden");
          }
        }
    }
  }

  public render() {
    return (
      <div ref={ this.buffers }>
        <ThreadIndex add={this.addComponent} query="tag:inbox"/>
      </div>
    );
  }
}

render(<Astroid />, container);

