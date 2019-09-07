export class Message {
  subject: string;
  headers: Map<string, any>;
  date_relative: string;
}

export type ThreadNode = Message[] | any[]; // not able to circular ref ThreadNode
export type MessageThread = ThreadNode[];
export type ThreadSet = MessageThread[];

