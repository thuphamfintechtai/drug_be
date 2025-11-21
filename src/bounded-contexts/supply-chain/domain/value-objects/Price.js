import { ValueObject } from "../../../../shared-kernel/domain/ValueObject.js";

export class Price extends ValueObject {
  constructor(amount, currency = "VND") {
    super();
    if (amount === null || amount === undefined || amount < 0) {
      throw new Error("Price phải là số dương");
    }
    this._amount = Number(amount);
    this._currency = currency ? currency.trim().toUpperCase() : "VND";
  }

  static create(amount, currency = "VND") {
    return new Price(amount, currency);
  }

  get amount() {
    return this._amount;
  }

  get currency() {
    return this._currency;
  }

  multiply(quantity) {
    return new Price(this._amount * quantity, this._currency);
  }

  add(other) {
    if (this._currency !== other._currency) {
      throw new Error("Không thể cộng price với currency khác nhau");
    }
    return new Price(this._amount + other._amount, this._currency);
  }

  valueEquals(other) {
    return this._amount === other._amount && this._currency === other._currency;
  }

  toString() {
    return `${this._amount} ${this._currency}`;
  }
}

