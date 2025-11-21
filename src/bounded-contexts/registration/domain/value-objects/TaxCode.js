import { ValueObject } from "../../../../shared-kernel/domain/ValueObject.js";

export class TaxCode extends ValueObject {
  constructor(value) {
    super();
    if (!value || typeof value !== "string" || value.trim().length === 0) {
      throw new Error("TaxCode không hợp lệ");
    }
    this._value = value.trim().toUpperCase();
  }

  static create(value) {
    return new TaxCode(value);
  }

  get value() {
    return this._value;
  }

  valueEquals(other) {
    return this._value === other._value;
  }

  toString() {
    return this._value;
  }
}

