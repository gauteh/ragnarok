import { Component, createRef } from 'inferno';
import { Part } from 'models';
import sanitizeHtml from 'sanitize-html';

import './PartView.scss';

const MultiPartAlternative = (mp) => (
  <div>
    { <PartView part={mp.content[mp.content.length-1]} /> }
  </div>
);

const MultiPartMixed = (mp) => (
  <div>
    { mp.content.map (p => <PartView part={p} />) }
  </div>
);

export class PartView extends Component<{part: Part}, any> {
  public state = {};

  iframe = null;

  constructor (props, context) {
    super (props, context);

    this.iframe = createRef ();
  }

  iframeLoaded = () => {
    const h = this.iframe.current.contentWindow.document.body.scrollHeight;
    this.iframe.current.style.height = h.toString() + 'px';
  }

  public render () {
    const part = this.props.part;

    if (part['content-type'].startsWith ("multipart/alternative")) {

      return MultiPartAlternative (part);

    } else if (part['content-type'].startsWith ("multipart/mixed")) {

      return MultiPartMixed (part);

    } else if (part['content-type'].startsWith ("text/html")) {

      return (
        <div
          dangerouslySetInnerHTML={{__html: sanitizeHtml (part.content,
          {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img', 'style' ])
          }
          )}}>
        </div>
      );

    } else if (part['content-type'].startsWith ("text/plain")) {

      return (
        <div>
          <p>
            <pre class="content">
              { part.content }
            </pre>
          </p>
        </div>
      );

    } else {

      return (
        <div class="alert alert-primary">
          Cannot render type: { part['content-type'] }
        </div>
      );

    }
  }
}

