import { Component, createRef } from 'inferno';

import mousetrap from 'mousetrap';
import moment from 'moment';
import cx from 'classnames';

import { switchMap, tap } from 'rxjs/operators';
import { Thread, ThreadNode, MessageThread } from 'models';
import * as hypo from 'hypocloid';

import { MessageView } from './MessageView';

import './ThreadView.scss';

interface Props {
  thread: string
}

interface State {
  thread: Thread;
  messages: MessageThread;
}

export class ThreadView extends Component<Props, State> {
  public state = {
    thread: undefined,
    messages: []
  };

  constructor(props, context) {
    super(props, context);

    hypo.getThreads (this.props.thread).pipe (
      switchMap (t => hypo.getMessages (this.props.thread)
        .pipe (tap (m =>
          this.setState ({
            thread: t[0],
            messages: m[0] }) // we only anticipate one thread
        )))
    ).subscribe ();
  }

  public render() {
    return (
      <div>
        <div class="messages">
          { this.state.messages.map (
              m => <MessageView message={m} />
            )
          }
        </div>
      </div>
    );
  }
}

