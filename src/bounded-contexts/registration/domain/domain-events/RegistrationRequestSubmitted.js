import { DomainEvent } from "../../../../shared-kernel/domain/DomainEvent.js";

export class RegistrationRequestSubmitted extends DomainEvent {
  constructor(requestId, userId, role, licenseNo, taxCode) {
    super();
    this.requestId = requestId;
    this.userId = userId;
    this.role = role;
    this.licenseNo = licenseNo;
    this.taxCode = taxCode;
  }
}

