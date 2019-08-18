import { Component } from 'inferno';
import { addOne } from '../utils/math';
import { Visualizer } from './Visualizer';
import { Button } from 'inferno-bootstrap';

import { stream } from 'ndjson-rxjs';
import * as moment from 'moment';
import { of } from 'rxjs';
import { finalize, mergeMap, bufferCount, tap, take } from 'rxjs/operators';

import './Incrementer.scss';

interface Props {
	name: string;
}

export class Thread {
  public id: string = '';
  public authors: string[] = [];
  public subject: string = '';
  public date: number = 0;
}

/*
 * The first interface defines prop shape
 * The second interface defines state shape
 */
export class Incrementer extends Component<Props, { value: number, threads: Thread[] }> {
	public state = {
		value: 1,
		threads: new Array<Thread>()
	};

  private host = 'http://localhost:8088';
  private query = 'gaute';

	constructor(props, context) {
		super(props, context);
	}

	public loadThreads = () =>
  {
    console.log ('loading..:', this.query);
    this.state.threads.length = 0;
    stream (this.host + '/threads/' + this.query).pipe (
      bufferCount(100),
      tap ((e: Thread[]) => {
				this.state.threads.push (...e);

				this.setState ({
					value: 0,
					threads: this.state.threads
				});
      }),
      finalize (() => console.log ('done', this.state.threads.length))
    ).subscribe ();
  }

  public formatDate(i: number): string {
    return moment (new Date(i * 1000)).fromNow ();
  }

	public Rows (props) {
		const threads = props.threads;
		return (
			threads.map ( (thread) => (
				<tr key={thread.id}>
					<td>
						{thread.authors}
					</td>
					<td>
						{thread.subject}
					</td>
				</tr>
			))
		);
	}

	public render() {
		return (
			<div>
				<Button onClick={this.loadThreads}>Load</Button>

				<table class="table table-dark table-striped table-borderless table-sm">
					<this.Rows threads={this.state.threads} />
				</table>

			</div>
		);
	}
}
