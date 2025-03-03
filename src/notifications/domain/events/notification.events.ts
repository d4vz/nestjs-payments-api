export class NotificationSentEvent {
  constructor(
    public readonly userId: string,
    public readonly type: string,
    public readonly message: string,
  ) {}
}

export class EmailSentEvent {
  constructor(
    public readonly to: string,
    public readonly subject: string,
    public readonly body: string,
  ) {}
}

export class SmsSentEvent {
  constructor(
    public readonly to: string,
    public readonly message: string,
  ) {}
}
