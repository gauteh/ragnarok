import { api } from './api';

import { from, Observable } from 'rxjs';
import { MessageThread } from 'models';

export function getMessages (query: string): Observable<any>
{
  return from (fetch (api + '/messages/' + query)
               .then ((response) => {
                 return response.json () as Promise<any>;
               }));
}

