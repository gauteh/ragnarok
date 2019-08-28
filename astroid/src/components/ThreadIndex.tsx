import { Component, createRef } from 'inferno';

import mousetrap from 'mousetrap';
import moment from 'moment';
import cx from 'classnames';

import { finalize, tap } from 'rxjs/operators';
import { Thread } from 'models';
import * as hypo from 'hypocloid';

import { findDOMNode } from 'inferno-extras';
import { renderToString } from 'inferno-server';
import ClusterizeJS from 'clusterize.js';

import { ThreadSearch } from './ThreadSearch';

import 'clusterize.js/clusterize.css';
import './ThreadIndex.scss';

interface Props {
  query: string;
}

interface State {
  query: string,
  threads: Thread[];
  selected: string;
  searchVisible: boolean;
}

export class ThreadIndex extends Component<Props, State> {
  public state = {
    query: "",
    threads: new Array<Thread>(),
    selected: undefined,
    searchVisible: false
  };

  clusterize = null;
  scrollElem = null;
  contentElem = null;
  rowHeight = 27; // px

  threadSearch = null;

  constructor(props, context) {
    super(props, context);

    this.threadSearch = createRef();
    this.state.query = props.query;

    mousetrap.bind ('j', () => {
      const idx = this.state.threads
        .findIndex ((t) => t.id === this.state.selected);

      if (idx >= 0 && idx < this.state.threads.length - 1) {
        this.unselectThread (this.state.selected);
        this.selectThread (this.state.threads[idx + 1].id, idx+1);
      }
    });

    mousetrap.bind ('k', () => {
      const idx = this.state.threads
        .findIndex ((t) => t.id === this.state.selected);

      if (idx > 0) {
        this.unselectThread (this.state.selected);
        this.selectThread (this.state.threads[idx - 1].id, idx-1);
      }
    });

    mousetrap.bind ('1', () => {
      this.unselectThread (this.state.selected);
      this.selectThread (this.state.threads[0].id, 0)
    });

    mousetrap.bind ('0', () => {
      this.unselectThread (this.state.selected);
      this.selectThread (this.state.threads[this.state.threads.length-1].id, this.state.threads.length-1)
    });

    mousetrap.bind ('/', () => {
      this.setState ({ searchVisible: true });
      setTimeout (() => {
        /* we use setTimeout to avoid the keybinding to
         * be entered into the field. */
        this.threadSearch.current.focus ();
      });
    });

    this.queryChanged = this.queryChanged.bind (this);
    this.hideSearch = this.hideSearch.bind (this);
  }

  private unselectThread (id: string) {
    /* XXX: if we somehow managed to scroll out of the
     * current cluster without unselecting the thread
     * this row will still have the selected class. */
    const el = document.getElementById ("t" + id);
    el.classList.remove ("bg-primary");
    this.setState ({ selected: undefined });
  }

  private selectThread (id: string, idx: number) {
    this.setState ({ selected: id });
    const el = document.getElementById ("t" + id);
    if (el !== null) {
      el.classList.add ("bg-primary");
      el.scrollIntoView ({behavior: 'smooth', block: 'center'});
    } else {
      /* the row is not present in the DOM, scroll and let clusterize callback
       * fix the selected state. */
      this.scrollElem.scroll ({ top: idx * this.rowHeight, behavior: 'auto' });
    }
  }

  componentDidMount () {
    const scrollElem = findDOMNode(this.scrollElem);
    const contentElem = findDOMNode(this.contentElem);

    const rows = this.Rows({threads: this.state.threads, selected: this.state.selected}).map (renderToString);

    this.clusterize = new ClusterizeJS({
      rows: rows,
      scrollElem: scrollElem,
      contentElem: contentElem,
      show_no_data_row: false,
      callbacks: {
        clusterChanged: () => {
          /* the element may not be present in DOM when user initiated scroll
           * so we have to re-select it */
          if (this.state.selected !== undefined) {
            const el = document.getElementById ("t" + this.state.selected);
            if (el !== null) {
              el.classList.add ("bg-primary");
            }
          }
        }}
    });

    this.setState ({query: this.props.query});
    this.loadThreads(this.props.query);
  }

  componentWillUnmount() {
    if (this.clusterize) {
      this.clusterize.destroy(true);
      this.clusterize = null;
    }
  }

  public queryChanged (q: string): void {
    if (q !== this.state.query) {
      this.setState ({query: q});
      this.loadThreads (q);
    }
  }

  public hideSearch (): void {
    this.setState ({ searchVisible: false });
  }

  public loadThreads = (query: string) =>
  {
    console.log ('loading..:', query);
    this.state.threads.length = 0;
    this.setState ({threads: [], selected: undefined});
    this.clusterize.clear ();

    const start = new Date ();
    hypo.getThreads (query).pipe (
      tap ((e: Thread[]) => {
        this.state.threads.push (...e);
        this.setState ({
          threads: this.state.threads
        });

        // if (this.state.threads.length % 1000 === 0) {
          console.log ("threads:", this.state.threads.length);
        // }

        if (this.state.selected === undefined) {
          this.setState ({
            selected: e[0].id
          });
        }

        const rows = this.Rows({threads: e, selected: this.state.selected}).map (renderToString);
        this.clusterize.append (rows);
      }),
      finalize (() => console.log ('done: ', this.state.threads.length, 'in', (new Date().getTime() - start.getTime()) / 1000, ' seconds.'))
    ).subscribe ();
  }

  public Rows (props) {
    const threads = props.threads;
    const selected = props.selected;

    const formatDate = (date: number): JSX.Element => {
      return (<span>{moment (new Date(date * 1000)).fromNow ()}</span>);
    };

    return (
      threads.map ((thread) => (
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
        <ThreadSearch
          ref={this.threadSearch}
          visible={ this.state.searchVisible }
          query={ this.state.query }
          queryChanged={ this.queryChanged }
          escaped={ this.hideSearch }/>

        <div
          ref={node => {
            this.scrollElem = node;
          }}
            class="clusterize-scroll">
            <table class="ti table table-dark table-borderless table-sm">
              <tbody ref={node => { this.contentElem = node }}
              class="clusterize-content">
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}
