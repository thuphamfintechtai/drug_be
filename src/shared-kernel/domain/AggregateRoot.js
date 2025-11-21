import { Entity } from "./Entity.js";
import { DomainEvent } from "./DomainEvent.js";

export class AggregateRoot extends Entity {
  constructor(id) {
    super(id);
    this._domainEvents = [];
  }

  get domainEvents() {
    return [...this._domainEvents];
  }

  raiseDomainEvent(event) {
    if (!(event instanceof DomainEvent)) {
      throw new Error("Event must be an instance of DomainEvent");
    }
    this._domainEvents.push(event);
  }

  clearDomainEvents() {
    this._domainEvents = [];
  }

  markDomainEventsAsHandled() {
    this.clearDomainEvents();
  }
}

