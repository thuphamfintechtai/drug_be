import { ValueObject } from "../../../../shared-kernel/domain/ValueObject.js";

export const Status = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  BANNED: "banned",
  PENDING: "pending",
};

export class UserStatus extends ValueObject {
  constructor(value) {
    super();
    if (!this.isValid(value)) {
      throw new Error(`UserStatus không hợp lệ: ${value}`);
    }
    this._value = value;
  }

  static create(value) {
    return new UserStatus(value);
  }

  static active() {
    return new UserStatus(Status.ACTIVE);
  }

  static inactive() {
    return new UserStatus(Status.INACTIVE);
  }

  static banned() {
    return new UserStatus(Status.BANNED);
  }

  static pending() {
    return new UserStatus(Status.PENDING);
  }

  isValid(value) {
    return Object.values(Status).includes(value);
  }

  get value() {
    return this._value;
  }

  isActive() {
    return this._value === Status.ACTIVE;
  }

  canLogin() {
    return this._value === Status.ACTIVE;
  }

  valueEquals(other) {
    return this._value === other._value;
  }

  toString() {
    return this._value;
  }
}

