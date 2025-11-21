export class Entity {
  constructor(id) {
    if (id === null || id === undefined) {
      throw new Error("Entity must have an id");
    }
    this._id = id;
  }

  get id() {
    return this._id;
  }

  equals(other) {
    if (other === null || other === undefined) {
      return false;
    }
    if (!(other instanceof Entity)) {
      return false;
    }
    return this._id === other._id;
  }
}

