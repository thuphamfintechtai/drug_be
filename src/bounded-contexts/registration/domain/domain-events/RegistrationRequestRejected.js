import { DomainEvent } from "../../../../shared-kernel/domain/DomainEvent.js";

export class RegistrationRequestRejected extends DomainEvent {
  constructor(requestId, userId, role, reviewedBy, rejectionReason) {
    super();
    this.requestId = requestId;
    this.userId = userId;
    this.role = role;
    this.reviewedBy = reviewedBy;
    this.rejectionReason = rejectionReason;
  }
}

