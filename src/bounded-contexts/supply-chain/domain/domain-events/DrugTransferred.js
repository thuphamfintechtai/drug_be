import { DomainEvent } from "../../../../shared-kernel/domain/DomainEvent.js";

export class DrugTransferred extends DomainEvent {
  constructor(nftId, fromUserId, toUserId, fromRole, toRole, quantity, invoiceNumber, transactionHash) {
    super();
    this.nftId = nftId;
    this.fromUserId = fromUserId;
    this.toUserId = toUserId;
    this.fromRole = fromRole;
    this.toRole = toRole;
    this.quantity = quantity;
    this.invoiceNumber = invoiceNumber;
    this.transactionHash = transactionHash;
  }
}

