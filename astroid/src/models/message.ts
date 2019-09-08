export class Message {
  subject: string;
  headers: Map<string, any>;
  date_relative: string;
  tags: string[];
  body: Part[];
}

export class Part {
  id: number | string;

  encstatus?: any;
  sigstatus?: any;

  /* XXX: these are all props with - in between */
  'content-type': string;
  content_type: string;
  content_disposition?: string;
  content_id?: string;

  content: string | Part[] | { headers: Map<string, any>, body: Part };

  filename?: string;
  content_charset?: string;
  content_length?: number;
  content_transfer_encoding?: string;
}

/* ThreadNode is sort of an tuple with the message and an array
 * of its replies */
export type ThreadNode = [Message, any[]]; // not able to circular ref ThreadNode

/* MessageThread is an array of top-level messages */
export type MessageThread = ThreadNode[];

/* ThreadSet is an array of MessageThreads which are shown */
export type ThreadSet = MessageThread[];

