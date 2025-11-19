import { ValueObject } from "../../../../shared-kernel/domain/ValueObject.js";

export class DrugName extends ValueObject {
  constructor(tradeName, genericName = null) {
    super();
    if (!tradeName || typeof tradeName !== "string" || tradeName.trim().length === 0) {
      throw new Error("TradeName không hợp lệ");
    }
    this._tradeName = tradeName.trim();
    this._genericName = genericName ? genericName.trim() : null;
  }

  static create(tradeName, genericName = null) {
    return new DrugName(tradeName, genericName);
  }

  get tradeName() {
    return this._tradeName;
  }

  get genericName() {
    return this._genericName;
  }

  valueEquals(other) {
    return (
      this._tradeName === other._tradeName &&
      this._genericName === other._genericName
    );
  }

  toString() {
    return this._genericName ? `${this._tradeName} (${this._genericName})` : this._tradeName;
  }
}

