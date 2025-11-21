import { DomainEvent } from "../../../../shared-kernel/domain/DomainEvent.js";

export class UserLoggedIn extends DomainEvent {
  constructor(userId, email, role, ipAddress) {
    super();
    this.userId = userId;
    this.email = email;
    this.role = role;
    this.ipAddress = ipAddress;
  }
}

