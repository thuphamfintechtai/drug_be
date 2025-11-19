import { DomainEvent } from "../../../../shared-kernel/domain/DomainEvent.js";

export class RegistrationRequestApproved extends DomainEvent {
  constructor(requestId, userId, role, reviewedBy) {
    super();
    this.requestId = requestId;
    this.userId = userId;
    this.role = role;
    this.reviewedBy = reviewedBy;
  }
}

