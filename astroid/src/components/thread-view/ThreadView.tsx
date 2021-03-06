import { Component, createRef } from 'inferno';

import mousetrap from 'mousetrap';
import moment from 'moment';
import cx from 'classnames';

import { switchMap, tap } from 'rxjs/operators';
import { Thread, ThreadNode, MessageThread } from 'models';
import * as hypo from 'hypocloid';

import { BufferComponent, Keybindings, BufferProps } from '../buffer';
import { MessageView } from './MessageView';

import './ThreadView.scss';

interface Props extends BufferProps {
  thread: string
}

interface State {
  thread: Thread;
  messages: MessageThread;
}

export class ThreadView
  extends BufferComponent<Props, State>
{
  public state = {
    thread: undefined,
    messages: []
  };

  messagesElem = null;

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

    this.keys.add ('j', () => {
      this.messagesElem.scroll ({
        current: 40,
        behavior: 'auto'});
    });
  }

  public flatThreadNode = (t: ThreadNode): ThreadNode[] =>
  {
    return [t].concat (...t[1].map(this.flatThreadNode));
  }

  public render() {
    return (
      <div class={cx ({ 'd-none' : !this.props.active })}>
        <div
          class="messages ml-auto mr-auto mt-0"
          ref={ node => this.messagesElem = node }>
          { this.state.messages
            .map (
              tn => this.flatThreadNode(tn)
              .map (
                t => <MessageView message={t} />
              ))
          }
        </div>
      </div>
    );
  }
}

