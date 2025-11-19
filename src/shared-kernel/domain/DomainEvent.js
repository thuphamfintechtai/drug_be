export class DomainEvent {
  constructor() {
    this.occurredOn = new Date();
    this.eventId = this.generateEventId();
  }

  generateEventId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  get eventType() {
    return this.constructor.name;
  }
}

