export const api = 'http://localhost:8088';

import { Observable } from 'rxjs';

import { stream } from 'ndjson-rxjs';
import { bufferCount } from 'rxjs/operators';
import { Thread } from 'models';

export function getThreads (query: string): Observable<Thread[]>
{
  return stream (api + '/threads/' + query)
  .pipe (
    bufferCount (100)
  );
}

