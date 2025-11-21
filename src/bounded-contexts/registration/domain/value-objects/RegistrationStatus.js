import { ValueObject } from "../../../../shared-kernel/domain/ValueObject.js";

export const Status = {
  PENDING: "pending",
  APPROVED_PENDING_BLOCKCHAIN: "approved_pending_blockchain",
  APPROVED: "approved",
  BLOCKCHAIN_FAILED: "blockchain_failed",
  REJECTED: "rejected",
};

export class RegistrationStatus extends ValueObject {
  constructor(value) {
    super();
    if (!this.isValid(value)) {
      throw new Error(`RegistrationStatus không hợp lệ: ${value}`);
    }
    this._value = value;
  }

  static create(value) {
    return new RegistrationStatus(value);
  }

  static pending() {
    return new RegistrationStatus(Status.PENDING);
  }

  static approvedPendingBlockchain() {
    return new RegistrationStatus(Status.APPROVED_PENDING_BLOCKCHAIN);
  }

  static approved() {
    return new RegistrationStatus(Status.APPROVED);
  }

  static blockchainFailed() {
    return new RegistrationStatus(Status.BLOCKCHAIN_FAILED);
  }

  static rejected() {
    return new RegistrationStatus(Status.REJECTED);
  }

  isValid(value) {
    return Object.values(Status).includes(value);
  }

  get value() {
    return this._value;
  }

  isPending() {
    return this._value === Status.PENDING;
  }

  isApproved() {
    return this._value === Status.APPROVED;
  }

  canBeReviewed() {
    return this._value === Status.PENDING;
  }

  valueEquals(other) {
    return this._value === other._value;
  }

  toString() {
    return this._value;
  }
}

