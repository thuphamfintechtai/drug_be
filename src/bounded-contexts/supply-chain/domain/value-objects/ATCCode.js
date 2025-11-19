import { ValueObject } from "../../../../shared-kernel/domain/ValueObject.js";

export class ATCCode extends ValueObject {
  constructor(value) {
    super();
    if (!value || typeof value !== "string" || value.trim().length === 0) {
      throw new Error("ATC Code không hợp lệ");
    }
    this._value = value.trim().toUpperCase();
  }

  static create(value) {
    return new ATCCode(value);
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

