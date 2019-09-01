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
  clusterrows = [];
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
        this.unselectThread (this.state.selected, idx);
        this.selectThread (this.state.threads[idx + 1].id, idx+1);
      }
    });

    mousetrap.bind ('k', () => {
      const idx = this.state.threads
        .findIndex ((t) => t.id === this.state.selected);

      if (idx > 0) {
        this.unselectThread (this.state.selected, idx);
        this.selectThread (this.state.threads[idx - 1].id, idx-1);
      }
    });

    mousetrap.bind ('1', () => {
      const idx = this.state.threads
        .findIndex ((t) => t.id === this.state.selected);
      this.unselectThread (this.state.selected, idx);
      this.selectThread (this.state.threads[0].id, 0)
    });

    mousetrap.bind ('0', () => {
      const idx = this.state.threads
        .findIndex ((t) => t.id === this.state.selected);

      this.unselectThread (this.state.selected, idx);

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

  private unselectThread (id: string, idx: number) {
    /* XXX: if we somehow managed to scroll out of the
     * current cluster without unselecting the thread
     * this row will still have the selected class. */
    this.setState ({ selected: undefined });

    const el = document.getElementById ("t" + id);
    if (el !== null) {
      const t = this.state.threads[idx];
      el.outerHTML = renderToString (
        this.Row ({thread: t, selected: false}));
      this.clusterrows[idx] = el.outerHTML;
    }
  }

  private selectThread (id: string, idx: number) {
    this.setState ({ selected: id });

    const t = this.state.threads[idx];

    const newr = renderToString (
      this.Row ({thread: t, selected: true}));
    this.clusterrows[idx] = newr;

    /* it is too slow to call clusterize.update (...) with the new rows. we
     * keep this array updated as well so that we can easily remove or
     * re-render on other changes (tags, deleted) which we can allow to go
     * slower (at least in the beginning).
     *
     * ideally we would be able to use the internal array from clusterize so that we
     * don't have multiple arrays with all the threads. also note that stroing
     * an array of DOM nodes would take about 5x more memory than storing the
     * strings.
     * */

    const el = document.getElementById ("t" + id);
    if (el !== null) {
      el.scrollIntoView ({behavior: 'auto', block: 'center'});
      el.outerHTML = newr;
    } else {
      /* the row is not present in the DOM, scroll and let clusterize callback
       * fix the selected state. */
      this.scrollElem.scroll ({
        top: idx * this.rowHeight,
        behavior: 'auto' });
    }
  }

  componentDidMount () {
    const scrollElem = findDOMNode(this.scrollElem);
    const contentElem = findDOMNode(this.contentElem);

    this.clusterize = new ClusterizeJS({
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
              const t = this.state.threads.find(t => t.id === this.state.selected);
              el.outerHTML = renderToString (
                this.Row ({thread: t, selected: true}));
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
    this.clusterrows = [];

    const start = new Date ();
    hypo.getThreads (query).pipe (
      tap ((e: Thread[]) => {
        this.state.threads.push (...e);

        const selected = this.state.selected === undefined ?
          e[0].id : this.state.selected;

        this.setState ({
          threads: this.state.threads,
          selected: selected
        });

        const rows = this.Rows({
          threads: e,
          selected: this.state.selected})
          .map (renderToString);

        this.clusterrows.push (...rows);
        this.clusterize.append (rows);

        console.log ("threads:", this.state.threads.length);
      }),
      finalize (() => console.log ('done: ', this.state.threads.length, 'in', (new Date().getTime() - start.getTime()) / 1000, ' seconds.'))
    ).subscribe ();
  }

  public Row (props) {
    const thread = props.thread;
    const selected = props.selected;

    const formatDate = (date: number): JSX.Element => {
      return (<span>{moment (new Date(date * 1000)).fromNow ()}</span>);
    };

    const ignoreTags = new Set (['unread', 'important']);

    return (
      <tr id={"t" + thread.id}
      key={thread.id}
      class={cx ({
        'bg-primary': selected,
        'text-muted': !selected && !thread.unread })}>
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
            <td class="ti-tags">
              { thread.tags
                .filter (tag => !ignoreTags.has (tag))
                .map (tag => (
                  <span>
                    <span class="badge badge-pill badge-light">
                      { tag }
                    </span>
                    &nbsp;
                  </span>
                ))
              }
            </td>
            <td class="ti-subject">
              {thread.subject}
            </td>
          </tr>
    );
  }

  public Rows (props) {
    const threads = props.threads;
    const selected = props.selected;

    return (
      threads.map ((thread) =>
        this.Row({
          thread: thread,
          selected: false}))
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
