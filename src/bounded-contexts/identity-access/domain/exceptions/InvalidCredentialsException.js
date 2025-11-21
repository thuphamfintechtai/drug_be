import { DomainException } from "../../../../shared-kernel/domain/DomainException.js";

export class InvalidCredentialsException extends DomainException {
  constructor(message = "Email hoặc mật khẩu không đúng") {
    super(message);
  }
}

