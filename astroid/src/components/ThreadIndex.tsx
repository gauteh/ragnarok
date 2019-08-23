import { Component } from 'inferno';

import mousetrap from 'mousetrap';
import * as scrollto from 'scroll-to-element';
import * as moment from 'moment';
import * as cx from 'classnames';

import { stream } from 'ndjson-rxjs';
import { finalize, bufferCount, tap, take } from 'rxjs/operators';
import { Thread } from 'models';
import { getThreads } from 'hypocloid';

import './ThreadIndex.scss';

interface Props {
  query: string;
}

interface State {
  threads: Thread[];
  selected: string;
}

export class ThreadIndex extends Component<Props, State> {
  public state = {
    threads: new Array<Thread>(),
    selected: undefined
  };

  constructor(props, context) {
    super(props, context);

    mousetrap.bind ('j', () => {
      const idx = this.state.threads
        .findIndex ((t) => t.id === this.state.selected);

      if (idx >= 0 && idx < this.state.threads.length - 1) {
        this.selectThread (this.state.threads[idx + 1].id);
      }
    });

    mousetrap.bind ('k', () => {
      const idx = this.state.threads
        .findIndex ((t) => t.id === this.state.selected);

      if (idx > 0) {
        this.selectThread (this.state.threads[idx - 1].id);
      }
    });

    mousetrap.bind ('1', () =>
      this.selectThread (this.state.threads[0].id, true));

    mousetrap.bind ('0', () =>
      this.selectThread (this.state.threads[this.state.threads.length-1].id, true));

    this.loadThreads();
  }

  private selectThread (id: string, fast: boolean = false) {
    this.setState ({ selected: id });
    scrollto ("#t" + id, { align: 'middle', duration: fast ? 100 : 100 });
  }

  public loadThreads = () =>
  {
    console.log ('loading..:', this.props.query);
    this.state.threads.length = 0;
    getThreads (this.props.query).pipe (
      take (1000),
      tap ((e: Thread[]) => {
        this.state.threads.push (...e);
        this.setState ({
          threads: this.state.threads
        });

        if (this.state.threads.length % 1000 === 0) {
          console.log ("threads:", this.state.threads.length);
        }

        if (this.state.selected === undefined) {
          this.setState ({
            selected: e[0].id
          });
        }
      }),
      finalize (() => console.log ('done', this.state.threads.length))
    ).subscribe ();
  }

  public Rows (props) {
    const threads = props.threads;
    const selected = props.selected;

    const formatDate = (date: number): JSX.Element => {
      return (<span>{moment (new Date(date * 1000)).fromNow ()}</span>);
    };

    return (
      threads.map ( (thread) => (
        <tr id={"t" + thread.id}
          key={thread.id}
          class={cx ({
              'bg-primary': thread.id === selected,
              'ti-unread': thread.unread })}>
          <td class="ti-date">
            {formatDate (thread.newest_date)}
          </td>
          <td class="ti-authors">
            {thread.authors}
          </td>
          <td>
            <span class={
              cx ('badge', {
                'badge-primary': thread.unread,
                'badge-secondary': !thread.unread
                })}>
              {thread.total_messages}
            </span>
          </td>
          <td class="ti-subject">
            {thread.subject}
          </td>
        </tr>
      ))
    );
  }

  public render() {
    return (
      <div>
        <table class="ti table table-dark table-borderless table-sm">
          <this.Rows threads={this.state.threads} selected={this.state.selected}/>
        </table>

      </div>
    );
  }
}
