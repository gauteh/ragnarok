import { api } from './api';

import { from, Observable } from 'rxjs';
import { Message } from 'models';

export function getMessages (query: string): Observable<Message[][][]>
{
  return from (fetch (api + '/messages/' + query)
    .then ((response) => response.json () as Promise<Message[][][]>));
}

