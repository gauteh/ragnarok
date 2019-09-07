import { Component } from 'inferno';
import { ThreadNode, Message } from 'models';

interface Props {
  message: ThreadNode
}

interface State {}

export class MessageView extends Component<Props, State> {
  public state = {};

  constructor (props, context) {
    super (props, context);
  }

  public render () {
    const m = this.props.message[0];
    return (
      <div class="card border-dark rounded-sm">
        <div class="card-header">
          <h5 class="card-title mb-2">
            { m.headers['Subject'] }
          </h5>
          <h6 class="card-subtitle mb-2 text-muted">
            { m.headers['From'] }
          </h6>
          <h6>
            { m.date_relative }
          </h6>
        </div>
      </div>);
  }
}

