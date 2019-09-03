import { of } from 'rxjs';

import { render } from 'inferno';
import { Thread } from 'models';
import { ThreadIndex } from '../ThreadIndex';

import * as hypo from 'hypocloid';
jest.mock ('hypocloid');


it ('renders without crashing', () => {
  (hypo.getThreads as jest.Mock).mockReturnValue (
    of ([
      new Thread ()
    ]));

  const div = document.createElement ("div");
  render (<ThreadIndex add={jest.fn()} query="tag:inbox"/>, div);
});

