import { render } from 'inferno';
import { ThreadIndex } from './ThreadIndex';

it ('renders without crashing', () => {
  const div = document.createElement ("div");
  render (<ThreadIndex query="tag:inbox"/>, div);
});

