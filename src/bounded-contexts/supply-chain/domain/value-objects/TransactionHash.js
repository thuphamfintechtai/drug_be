import { ValueObject } from "../../../../shared-kernel/domain/ValueObject.js";

export class TransactionHash extends ValueObject {
  constructor(value) {
    super();
    if (!value || typeof value !== "string" || value.trim().length === 0) {
      throw new Error("TransactionHash không hợp lệ");
    }
    // Basic validation for Ethereum transaction hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(value.trim())) {
      throw new Error("TransactionHash không đúng định dạng");
    }
    this._value = value.trim();
  }

  static create(value) {
    return new TransactionHash(value);
  }

  get value() {
    return this._value;
  }

  valueEquals(other) {
    return this._value.toLowerCase() === other._value.toLowerCase();
  }

  toString() {
    return this._value;
  }
}

