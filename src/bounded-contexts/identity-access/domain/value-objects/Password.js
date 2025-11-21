import { ValueObject } from "../../../../shared-kernel/domain/ValueObject.js";

export class PasswordHash extends ValueObject {
  constructor(hash) {
    super();
    if (!hash || typeof hash !== "string") {
      throw new Error("Password hash không hợp lệ");
    }
    this._hash = hash;
  }

  static create(hash) {
    return new PasswordHash(hash);
  }

  get hash() {
    return this._hash;
  }

  valueEquals(other) {
    return this._hash === other._hash;
  }

  toString() {
    return "[PasswordHash]";
  }
}

