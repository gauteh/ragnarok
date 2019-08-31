import { Component, createRef } from 'inferno';
import cx from 'classnames';

import './ThreadSearch.scss';

interface Props {
  visible: boolean;
  query: string;
  queryChanged: (q: string) => void;
  escaped: () => void;
}

interface State {
  query: string;
}

export class ThreadSearch extends Component<Props, State> {
  public state = {
    query: ""
  };

  input = null;

  constructor(props, context) {
    super(props, context);
    this.handleChange = this.handleChange.bind (this);
    this.handleKey = this.handleKey.bind (this);
    this.focus = this.focus.bind (this);

    this.input = createRef ();
  }

  componentDidMount () {
    this.setState ({ query: this.props.query });
  }

  public handleChange (event) {
    this.setState ({query: event.target.value });
  }

  public focus () {
    this.input.current.focus ();
    this.input.current.select ();
  }

  public handleKey (event) {
    if (event.key === "Enter") {
      this.props.queryChanged (this.state.query);
    } else if (event.key === "Escape") {
      this.props.escaped ();
    }
  }

  public render() {
    return (
      <div class={cx ({'hidden': !this.props.visible})}>
        <div class="input-group">
          <div class="input-group-prepend">
            <span class="input-group-text text-primary bg-dark">&gt;</span>
          </div>

          <input class="form-control bg-dark text-light"
            ref={this.input}
            type="text"
            value={ this.state.query }
            onInput={ this.handleChange }
            onKeyDown={ this.handleKey }
          />
        </div>
      </div>
    );
  }
}
