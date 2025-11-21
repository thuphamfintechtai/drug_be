export class ValueObject {
  equals(other) {
    if (other === null || other === undefined) {
      return false;
    }
    if (!(other instanceof ValueObject)) {
      return false;
    }
    if (this.constructor !== other.constructor) {
      return false;
    }
    return this.valueEquals(other);
  }

  valueEquals(other) {
    throw new Error("valueEquals must be implemented by subclasses");
  }

  toString() {
    return JSON.stringify(this);
  }
}

