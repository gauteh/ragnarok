import { Component, createRef, VNode } from 'inferno';
import cx from 'classnames';

import { BufferComponent, BufferProps, Keybindings } from '../buffer';
import Quill from 'quill';

interface Props extends BufferProps { }
interface State { }

import 'quill/dist/quill.snow.css';
import './Composer.scss';

export class Composer
  extends BufferComponent<Props, State>
{
  public state = {};
  editor: Quill;

  constructor(props, context) {
    super(props, context);

  }

  componentDidMount() {
    this.editor = new Quill('#editor', {
      modules: { toolbar: '#toolbar' },
      theme: 'snow'
    });
  }

  public render() {
    return (
      <div class={cx ({ 'd-none' : !this.props.active })}>
        <div class="editor card border-dark ml-auto mr-auto">
          <div class="row">
            <div class="col">
              <div class="input-group">
                <div class="rounded-0 input-group-prepend">
                  <span class="rounded-0 input-group-text">@</span>
                </div>
                <input type="email" class="rounded-0 form-control" placeholder="Recipient" />
                <button class="btn rounded-0 bg-primary text-light">Send</button>
              </div>
            </div>
          </div>

          <div>
            <div id="toolbar">
              <button class="ql-bold">Bold</button>
              <button class="ql-italic">Italic</button>
            </div>
            <div id="editor">
              <p>Hello</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

