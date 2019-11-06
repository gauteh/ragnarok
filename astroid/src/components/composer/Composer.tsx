import { Component, createRef, VNode } from 'inferno';
import cx from 'classnames';

import { BufferComponent, BufferProps, Keybindings } from '../buffer';
import Quill from 'quill';

interface Props extends BufferProps { }

enum EditorState {
    Editing = 0,
    Preview,
    Sending
}

interface State {
  editorState: EditorState;
}

import 'quill/dist/quill.snow.css';
import './Composer.scss';

export class Composer
  extends BufferComponent<Props, State>
{
  public state = { editorState: EditorState.Editing };
  editor: Quill;

  constructor(props, context) {
    super(props, context);
  }

  componentDidMount() {
    if (this.state.editorState === EditorState.Editing) {
      this.editor = new Quill('#editor', {
        modules: { toolbar: '#toolbar' },
        theme: 'snow'
      });
    }
  }

  public componentDidUpdate (lastProps: Props, lastState, snapshot) {
    console.log (this.state);
    if (this.state.editorState === EditorState.Editing) {
      this.editor = new Quill('#editor', {
        modules: { toolbar: '#toolbar' },
        theme: 'snow'
      });
    }
  }

  public preview = (event) => {
    console.log("preview");
    if (this.state.editorState === EditorState.Editing) {
      this.setState ({ editorState: EditorState.Preview });
    } else if (this.state.editorState === EditorState.Preview) {
      this.setState ({ editorState: EditorState.Editing });
    }
  }

  public send = (event) => {
    console.log("sending");
    if (this.state.editorState !== EditorState.Sending) {
      this.setState ({ editorState: EditorState.Sending });
    }
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
                <button
                  onClick={ this.preview }
                  class={ cx('btn rounded-0 bg-primary text-light',
                  { 'd-none': this.state.editorState === EditorState.Sending })}>

                  { this.state.editorState === EditorState.Editing ?
                    "Preview" :
                      this.state.editorState === EditorState.Preview ?
                        "Edit" : false }

                </button>
                <button
                  onClick={ this.send }
                  class={cx('btn', 'rounded-0', 'text-light',
                            { 'bg-warning': this.state.editorState !== EditorState.Sending,
                              'bg-danger': this.state.editorState === EditorState.Sending
                            })}>
                  { this.state.editorState !== EditorState.Sending ?
                    "Send" : "Abort" }
                </button>
              </div>
            </div>
          </div>
          <div>
            {
              this.state.editorState === EditorState.Editing ?
              (
                <div>
                  <div id="toolbar">
                    <button class="ql-bold">Bold</button>
                    <button class="ql-italic">Italic</button>
                  </div>
                  <div id="editor">
                    <p>Hello</p>
                  </div>
                </div>
              ) : false
            }
          </div>
        </div>
      </div>
    );
  }
}

