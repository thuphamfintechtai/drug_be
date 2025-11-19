import { DomainException } from "../../../../shared-kernel/domain/DomainException.js";

export class DuplicateLicenseNumberException extends DomainException {
  constructor(message = "LicenseNo hoặc TaxCode đã được sử dụng") {
    super(message);
  }
}

