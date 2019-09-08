import { Component } from 'inferno';
import { ThreadNode, Message } from 'models';

import { PartView } from './PartView';

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
      <div class="card border-dark rounded-0 mb-2">
        <div class="card-header">
          <div class="row">
            <div class="col">
              <h5 class="card-title mb-2">
                { m.headers['Subject'] }
              </h5>
            </div>
            <div class="col col-lg-auto">
              <h5 class="card-title mb-2 text-right text-secondary">
                { m.date_relative }
              </h5>
            </div>
          </div>
          <h6 class="card-subtitle mb-2 text-muted">
            { m.headers['From'] }
          </h6>
          <h6>
            { m.tags
              .map (tag => (
                <span>
                  <span class="badge badge-pill badge-dark">
                    { tag }
                  </span>
                  &nbsp;
                </span>
              ))
            }
          </h6>
        </div>
        <div class="card-body">
          { m.body.map (p => <PartView part={ p } />) }
        </div>
      </div>);
  }
}

