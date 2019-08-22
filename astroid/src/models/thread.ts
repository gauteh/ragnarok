export class Thread {
  public id: string = '';
  public authors: string[] = [];
  public subject: string = '';
  public newest_date: number = 0;
  public oldest_date: number = 0;
  public total_messages: number = 0;
  public unread: boolean = false;
  public tags: string[] = [];
}

