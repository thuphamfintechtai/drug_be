import { ValueObject } from "../../../../shared-kernel/domain/ValueObject.js";

export const UserRole = {
  SYSTEM_ADMIN: "system_admin",
  PHARMA_COMPANY: "pharma_company",
  DISTRIBUTOR: "distributor",
  PHARMACY: "pharmacy",
  USER: "user",
};

export class Role extends ValueObject {
  constructor(value) {
    super();
    if (!this.isValid(value)) {
      throw new Error(`Role không hợp lệ: ${value}`);
    }
    this._value = value;
  }

  static create(value) {
    return new Role(value);
  }

  static systemAdmin() {
    return new Role(UserRole.SYSTEM_ADMIN);
  }

  static pharmaCompany() {
    return new Role(UserRole.PHARMA_COMPANY);
  }

  static distributor() {
    return new Role(UserRole.DISTRIBUTOR);
  }

  static pharmacy() {
    return new Role(UserRole.PHARMACY);
  }

  static user() {
    return new Role(UserRole.USER);
  }

  isValid(value) {
    return Object.values(UserRole).includes(value);
  }

  get value() {
    return this._value;
  }

  isAdmin() {
    return this._value === UserRole.SYSTEM_ADMIN;
  }

  isBusinessRole() {
    return [UserRole.PHARMA_COMPANY, UserRole.DISTRIBUTOR, UserRole.PHARMACY].includes(this._value);
  }

  valueEquals(other) {
    return this._value === other._value;
  }

  toString() {
    return this._value;
  }
}

