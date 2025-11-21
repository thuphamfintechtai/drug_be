import { DomainEvent } from "../../../../shared-kernel/domain/DomainEvent.js";

export class PasswordResetRequested extends DomainEvent {
  constructor(userId, email, token) {
    super();
    this.userId = userId;
    this.email = email;
    this.token = token;
  }
}

