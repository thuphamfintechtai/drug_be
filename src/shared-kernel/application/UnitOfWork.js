export class UnitOfWork {
  constructor() {
    this._aggregates = new Map();
    this._isCommitted = false;
  }

  registerNew(aggregate) {
    if (this._isCommitted) {
      throw new Error("Cannot register aggregate after commit");
    }
    this._aggregates.set(aggregate.id.toString(), {
      aggregate,
      status: "new",
    });
  }

  registerDirty(aggregate) {
    if (this._isCommitted) {
      throw new Error("Cannot register aggregate after commit");
    }
    if (!this._aggregates.has(aggregate.id.toString())) {
      this._aggregates.set(aggregate.id.toString(), {
        aggregate,
        status: "dirty",
      });
    } else {
      const entry = this._aggregates.get(aggregate.id.toString());
      entry.status = "dirty";
    }
  }

  registerRemoved(aggregate) {
    if (this._isCommitted) {
      throw new Error("Cannot register aggregate after commit");
    }
    this._aggregates.set(aggregate.id.toString(), {
      aggregate,
      status: "removed",
    });
  }

  getAggregates() {
    return Array.from(this._aggregates.values()).map((entry) => entry.aggregate);
  }

  async commit() {
    if (this._isCommitted) {
      throw new Error("UnitOfWork already committed");
    }
    this._isCommitted = true;
  }

  async rollback() {
    this._aggregates.clear();
    this._isCommitted = false;
  }
}

