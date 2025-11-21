import { DomainException } from "../../../../shared-kernel/domain/DomainException.js";

export class RegistrationRequestNotFoundException extends DomainException {
  constructor(message = "Không tìm thấy yêu cầu đăng ký") {
    super(message);
  }
}

