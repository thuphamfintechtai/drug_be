import { ValueObject } from "../../../../shared-kernel/domain/ValueObject.js";

export class Email extends ValueObject {
  constructor(value) {
    super();
    if (!this.isValid(value)) {
      throw new Error("Email không hợp lệ");
    }
    this._value = value.toLowerCase().trim();
  }

  static create(value) {
    return new Email(value);
  }

  isValid(value) {
    if (!value || typeof value !== "string") {
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
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

