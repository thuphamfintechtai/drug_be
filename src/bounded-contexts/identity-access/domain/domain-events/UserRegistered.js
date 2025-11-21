import { DomainEvent } from "../../../../shared-kernel/domain/DomainEvent.js";

export class UserRegistered extends DomainEvent {
  constructor(userId, email, role, username) {
    super();
    this.userId = userId;
    this.email = email;
    this.role = role;
    this.username = username;
  }
}

