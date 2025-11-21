import { ValueObject } from "../../../../shared-kernel/domain/ValueObject.js";

export class TokenId extends ValueObject {
  constructor(value) {
    super();
    if (!value || typeof value !== "string" || value.trim().length === 0) {
      throw new Error("TokenId không được để trống");
    }
    this._value = value.trim();
  }

  get value() {
    return this._value;
  }

  equals(other) {
    if (!(other instanceof TokenId)) {
      return false;
    }
    return this._value === other._value;
  }

  static create(value) {
    return new TokenId(value);
  }
}

