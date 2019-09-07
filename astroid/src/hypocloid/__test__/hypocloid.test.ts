import * as hypo from '../';

describe ('messages api', () => {
  test ('can fetch all messages', async () => {
    (global as any).fetch = require ('node-fetch');
    const b = await hypo.getMessages ("tag:inbox").toPromise();

    expect (b.length).toBeGreaterThanOrEqual (1);
  });
});


