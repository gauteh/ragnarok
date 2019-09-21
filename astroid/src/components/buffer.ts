import { Component, VNode } from 'inferno'
import mousetrap from 'mousetrap';

export class Keybinding {
  map: string;
  to:  () => void;
}

export class Keybindings {
  keys: Keybinding[] = [];

  public add (map: string, to: () => void) {
    this.keys.push ({ map: map, to: to });
  }

  public bindkeys () {
    for (const k of this.keys) {
      mousetrap.bind (k.map, k.to);
    }
  }

  public unbindkeys () {
    for (const k of this.keys) {
      mousetrap.unbind (k.map);
    }
  }
}

export interface BufferProps {
  active: boolean;
  add: (c: VNode) => void;
}

export class BufferComponent<Props extends BufferProps, State>
  extends Component<Props, State>
{
  keys: Keybindings = new Keybindings ();

  public componentDidMount () {
    if (this.props.active) {
      this.keys.bindkeys ();
    }
  }

  public componentWillUnmount () {
    this.keys.unbindkeys ();
  }

  public componentDidUpdate (lastProps: Props, lastState, snapshot) {
    if (this.props.active !== lastProps.active) {
      if (this.props.active) {
        this.keys.bindkeys ();
      } else {
        this.keys.unbindkeys ();
      }
    }
  }
}


