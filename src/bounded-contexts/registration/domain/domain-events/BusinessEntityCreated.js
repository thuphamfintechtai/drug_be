import { DomainEvent } from "../../../../shared-kernel/domain/DomainEvent.js";

export class BusinessEntityCreated extends DomainEvent {
  constructor(entityId, entityType, userId, name, licenseNo, taxCode) {
    super();
    this.entityId = entityId;
    this.entityType = entityType;
    this.userId = userId;
    this.name = name;
    this.licenseNo = licenseNo;
    this.taxCode = taxCode;
  }
}

