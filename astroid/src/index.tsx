import { Component, render } from 'inferno';
import * as mousetrap from 'mousetrap';
import { ThreadIndex } from './components/thread-index/ThreadIndex';

import 'bootstrap/dist/css/bootstrap.css';
import './main.css';

const container = document.getElementById('app');

class Astroid extends Component<any, any> {
  constructor(props, context) {
    super(props, context);

    mousetrap.bind ('q', () => {
      window.close (); // has no effect outside electron
    });
  }

  public render() {
    return (
      <div>
        <ThreadIndex query="tag:inbox"/>
      </div>
    );
  }
}

render(<Astroid />, container);

