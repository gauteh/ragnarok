import { Component, render } from 'inferno';
import mousetrap from 'mousetrap';
import { ThreadIndex } from './components/ThreadIndex';

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
        <ThreadIndex query="astrid"/>
      </div>
    );
  }
}

render(<Astroid />, container);

