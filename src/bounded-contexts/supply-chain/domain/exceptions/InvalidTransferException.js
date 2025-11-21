import { DomainException } from "../../../../shared-kernel/domain/DomainException.js";

export class InvalidTransferException extends DomainException {
  constructor(message = "Chuyển giao không hợp lệ") {
    super(message);
  }
}

