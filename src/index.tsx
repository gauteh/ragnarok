import { Component, render } from 'inferno';
import { ThreadIndex } from './components/ThreadIndex';

import 'bootstrap/dist/css/bootstrap.css';
import './main.css';

const container = document.getElementById('app');

class Astroid extends Component<any, any> {
	constructor(props, context) {
		super(props, context);
	}

	public render() {
		return (
			<div>
				<ThreadIndex query="tag:inbox"/>
			</div>
		);
	}
}

render(<Astroid />, container);
