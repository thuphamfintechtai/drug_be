import { DomainEvent } from "../../../../shared-kernel/domain/DomainEvent.js";

export class DistributorToPharmacyTransfer extends DomainEvent {
  constructor(invoiceId, fromDistributorId, toPharmacyId, drugId, invoiceNumber, quantity, tokenIds) {
    super("DistributorToPharmacyTransfer", new Date());
    this.invoiceId = invoiceId;
    this.fromDistributorId = fromDistributorId;
    this.toPharmacyId = toPharmacyId;
    this.drugId = drugId;
    this.invoiceNumber = invoiceNumber;
    this.quantity = quantity;
    this.tokenIds = tokenIds;
  }
}

