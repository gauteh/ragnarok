import { api } from './api';

import { concat, from, merge, interval, Observable, Subject } from 'rxjs';
import { map, shareReplay, finalize, buffer, filter, tap, bufferCount, bufferToggle, partition, window, scan, skipWhile } from 'rxjs/operators';

import ndjson from 'can-ndjson-stream';

import { Thread } from 'models';

export function getThreads (query: string): Observable<Thread[]>
{
   const stream = Observable.create ((observer) => {
     fetch (api + '/threads/' + query)
       .then ((response) => ndjson (response.body))
       .then ((stream) => {
         const reader = stream.getReader ();

         const read = ({done, value}) => {
           if (!done) {
             observer.next (value);
             reader.read().then (read);
           } else {
             observer.complete ();
           }
         };

         reader.read().then (read);
       });
  });

  const first = stream.pipe (filter ((_, i) => i < 150), bufferCount (10));
  const last  = stream.pipe (filter ((_, i) => i >= 150), bufferCount (5000));

  return merge (first, last) as Observable<Thread[]>;
}

