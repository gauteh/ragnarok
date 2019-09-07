export class Message {
  subject: string;
  headers: Map<string, any>;
  date_relative: string;
  tags: string[];
  body: any;
}

/* ThreadNode is sort of an tuple with the message and an array
 * of its replies */
export type ThreadNode = [Message, any[]]; // not able to circular ref ThreadNode

/* MessageThread is an array of top-level messages */
export type MessageThread = ThreadNode[];

/* ThreadSet is an array of MessageThreads which are shown */
export type ThreadSet = MessageThread[];

