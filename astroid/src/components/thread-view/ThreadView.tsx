import { Component, createRef } from 'inferno';

import mousetrap from 'mousetrap';
import moment from 'moment';
import cx from 'classnames';

import { switchMap, tap } from 'rxjs/operators';
import { Thread, Message } from 'models';
import * as hypo from 'hypocloid';

import './ThreadView.scss';

interface Props {
  thread: string
}

interface State {
  thread: Thread;
  messages: Message[][][];
}

export class ThreadView extends Component<Props, State> {
  public state = {
    thread: undefined,
    messages: new Array<Message[][]>()
  };

  constructor(props, context) {
    super(props, context);

    hypo.getThreads (this.props.thread).pipe (
      switchMap (t => hypo.getMessages (this.props.thread)
        .pipe (tap (m =>
          this.setState ({
            thread: t[0],
            messages: m })
        )))
    ).subscribe ();
  }

  public render() {
    console.log (this.state.messages);

    return (
      <div>
        <div class="card messages">
          { this.state.messages.length > 0 && this.state.messages[0].map (m =>
            <div class="card">
              <h5 class="card-title">
                { m[0].headers['Subject'] }
              </h5>
            </div>)
          }

        </div>
      </div>
    );
  }
}

