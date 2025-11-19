import { DomainEvent } from "../../../../shared-kernel/domain/DomainEvent.js";

export class DrugManufactured extends DomainEvent {
  constructor(drugId, manufacturerId, batchNumber, quantity, mfgDate, expDate) {
    super();
    this.drugId = drugId;
    this.manufacturerId = manufacturerId;
    this.batchNumber = batchNumber;
    this.quantity = quantity;
    this.mfgDate = mfgDate;
    this.expDate = expDate;
  }
}

