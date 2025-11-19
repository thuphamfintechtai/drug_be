// Simple Dependency Injection Container
export class Container {
  constructor() {
    this._services = new Map();
    this._singletons = new Map();
  }

  register(name, factory, singleton = false) {
    this._services.set(name, { factory, singleton });
    return this;
  }

  resolve(name) {
    const service = this._services.get(name);

    if (!service) {
      throw new Error(`Service ${name} not found`);
    }

    if (service.singleton) {
      if (!this._singletons.has(name)) {
        this._singletons.set(name, service.factory(this));
      }
      return this._singletons.get(name);
    }

    return service.factory(this);
  }

  has(name) {
    return this._services.has(name);
  }
}

