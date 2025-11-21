import { ValueObject } from "../../../../shared-kernel/domain/ValueObject.js";

export class Quantity extends ValueObject {
  constructor(value, unit = null) {
    super();
    if (value === null || value === undefined || value < 0) {
      throw new Error("Quantity phải là số dương");
    }
    this._value = Number(value);
    this._unit = unit ? unit.trim() : null;
  }

  static create(value, unit = null) {
    return new Quantity(value, unit);
  }

  get value() {
    return this._value;
  }

  get unit() {
    return this._unit;
  }

  add(other) {
    if (this._unit !== other._unit) {
      throw new Error("Không thể cộng quantity với đơn vị khác nhau");
    }
    return new Quantity(this._value + other._value, this._unit);
  }

  subtract(other) {
    if (this._unit !== other._unit) {
      throw new Error("Không thể trừ quantity với đơn vị khác nhau");
    }
    if (this._value < other._value) {
      throw new Error("Không đủ quantity để trừ");
    }
    return new Quantity(this._value - other._value, this._unit);
  }

  isGreaterThan(other) {
    if (this._unit !== other._unit) {
      throw new Error("Không thể so sánh quantity với đơn vị khác nhau");
    }
    return this._value > other._value;
  }

  valueEquals(other) {
    return this._value === other._value && this._unit === other._unit;
  }

  toString() {
    return this._unit ? `${this._value} ${this._unit}` : this._value.toString();
  }
}

