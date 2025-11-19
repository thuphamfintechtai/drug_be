import { ValueObject } from "../../../../shared-kernel/domain/ValueObject.js";

export class CompanyName extends ValueObject {
  constructor(value) {
    super();
    if (!value || typeof value !== "string" || value.trim().length === 0) {
      throw new Error("CompanyName không hợp lệ");
    }
    this._value = value.trim();
  }

  static create(value) {
    return new CompanyName(value);
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

