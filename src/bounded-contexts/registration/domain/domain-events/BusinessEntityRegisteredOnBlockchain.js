import { DomainEvent } from "../../../../shared-kernel/domain/DomainEvent.js";

export class BusinessEntityRegisteredOnBlockchain extends DomainEvent {
  constructor(entityId, entityType, transactionHash, contractAddress) {
    super();
    this.entityId = entityId;
    this.entityType = entityType;
    this.transactionHash = transactionHash;
    this.contractAddress = contractAddress;
  }
}

