import { DomainException } from "../../../../shared-kernel/domain/DomainException.js";

export class InsufficientQuantityException extends DomainException {
  constructor(message = "Không đủ số lượng") {
    super(message);
  }
}

