import { DomainEvent } from "../../../../shared-kernel/domain/DomainEvent.js";

export class ManufacturerToDistributorTransfer extends DomainEvent {
  constructor(invoiceId, fromManufacturerId, toDistributorId, drugId, invoiceNumber, quantity, tokenIds) {
    super("ManufacturerToDistributorTransfer", new Date());
    this.invoiceId = invoiceId;
    this.fromManufacturerId = fromManufacturerId;
    this.toDistributorId = toDistributorId;
    this.drugId = drugId;
    this.invoiceNumber = invoiceNumber;
    this.quantity = quantity;
    this.tokenIds = tokenIds;
  }
}

