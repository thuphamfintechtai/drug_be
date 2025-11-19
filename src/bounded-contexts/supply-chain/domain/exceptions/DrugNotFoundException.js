import { DomainException } from "../../../../shared-kernel/domain/DomainException.js";

export class DrugNotFoundException extends DomainException {
  constructor(message = "Không tìm thấy thuốc") {
    super(message);
  }
}

