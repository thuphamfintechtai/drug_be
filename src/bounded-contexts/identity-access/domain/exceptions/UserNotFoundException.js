import { DomainException } from "../../../../shared-kernel/domain/DomainException.js";

export class UserNotFoundException extends DomainException {
  constructor(message = "Người dùng không tồn tại") {
    super(message);
  }
}

