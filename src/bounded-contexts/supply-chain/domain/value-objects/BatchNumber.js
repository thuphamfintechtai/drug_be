import { ValueObject } from "../../../../shared-kernel/domain/ValueObject.js";

export class BatchNumber extends ValueObject {
  constructor(value) {
    super();
    if (!value || typeof value !== "string" || value.trim().length === 0) {
      throw new Error("BatchNumber không được để trống");
    }
    this._value = value.trim().toUpperCase();
  }

  get value() {
    return this._value;
  }

  equals(other) {
    if (!(other instanceof BatchNumber)) {
      return false;
    }
    return this._value === other._value;
  }

  static create(value) {
    return new BatchNumber(value);
  }
}
