import { IEventBus } from "./IEventBus.js";

export class InMemoryEventBus extends IEventBus {
  constructor() {
    super();
    this._handlers = new Map();
  }

  async publish(event) {
    const eventType = event.constructor.name;
    const handlers = this._handlers.get(eventType) || [];
    
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Error handling event ${eventType}:`, error);
        // Continue processing other handlers
      }
    }
  }

  async subscribe(eventType, handler) {
    if (!this._handlers.has(eventType)) {
      this._handlers.set(eventType, []);
    }
    this._handlers.get(eventType).push(handler);
  }
}

