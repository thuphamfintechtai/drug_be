import { DomainEvent } from "../../../../shared-kernel/domain/DomainEvent.js";

export class DrugDelivered extends DomainEvent {
  constructor(proofId, fromDistributorId, toPharmacyId, drugId, quantity) {
    super("DrugDelivered", new Date());
    this.proofId = proofId;
    this.fromDistributorId = fromDistributorId;
    this.toPharmacyId = toPharmacyId;
    this.drugId = drugId;
    this.quantity = quantity;
  }
}

