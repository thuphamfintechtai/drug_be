import { ValueObject } from "../../../../shared-kernel/domain/ValueObject.js";

export class WalletAddress extends ValueObject {
  constructor(value) {
    super();
    if (!value || typeof value !== "string" || value.trim().length === 0) {
      throw new Error("WalletAddress không hợp lệ");
    }
    // Basic validation - should be valid Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(value.trim())) {
      throw new Error("WalletAddress không đúng định dạng");
    }
    this._value = value.trim();
  }

  static create(value) {
    return new WalletAddress(value);
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

