export class IEventBus {
  async publish(event) {
    throw new Error("publish method must be implemented");
  }

  async subscribe(eventType, handler) {
    throw new Error("subscribe method must be implemented");
  }
}

