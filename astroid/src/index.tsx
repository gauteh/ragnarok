import { Component, render, createRef, VNode } from 'inferno';
import { cloneVNode } from 'inferno-clone-vnode';
import * as mousetrap from 'mousetrap';
import { ThreadIndex } from './components/thread-index/ThreadIndex';
import { ThreadView } from './components/thread-view/ThreadView';

import 'bootstrap/dist/css/bootstrap.css';
import './main.css';

const container = document.getElementById('app');

interface State {
  active: number;
  buffers: VNode[];
}

class Astroid extends Component<any, any> {
  public state = {
    active: 0,
    buffers: []
  };

  constructor(props, context) {
    super(props, context);

    mousetrap.bind ('q', () => {
      window.close (); // has no effect outside electron
    });

    mousetrap.bind ('b', () => {
      this.setState ({ active: (this.state.active + 1) % (this.state.buffers.length) });
    });

    mousetrap.bind ('B', () => {
      this.setState ({ active: (this.state.active - 1) % (this.state.buffers.length) });
    });

    mousetrap.bind ('x', () => {
      if (this.state.buffers.length > 1) {
        this.setState ({
          buffers: this.state.buffers.splice (this.state.active, 1),
          active: this.state.active % this.state.buffers.length
        });
      } else {
        window.close ();
      }
    });

    this.state.buffers =[
      <ThreadIndex query="tag:inbox"
        buffer={this.state.buffers.length}
        active={this.state.active}
        add={this.addComponent} />] ;
  }

  public addComponent = (c: VNode) =>
  {
    const v = cloneVNode (c, {
      'buffer': this.state.buffers.length,
      'active': this.state.active,
      'add': this.addComponent });

    this.state.buffers.push (v);

    this.setState ({
      buffers: this.state.buffers,
      active: this.state.buffers.length - 1 });
  }

  public render() {
    this.state.buffers.forEach (c =>
      c.props.active = this.state.active);

    return (
      <div>
        { this.state.buffers[this.state.active] }
      </div>
    );
  }
}

render(<Astroid />, container);

