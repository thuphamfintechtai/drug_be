import { AggregateRoot } from "../../../../shared-kernel/domain/AggregateRoot.js";
import { BatchNumber } from "../value-objects/BatchNumber.js";
import { DrugManufactured } from "../domain-events/DrugManufactured.js";
import crypto from "crypto";

export const ProductionStatus = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
};

export class ProofOfProduction extends AggregateRoot {
  constructor(
    id,
    manufacturerId,
    drugId,
    batchNumber,
    quantity,
    mfgDate = null,
    expDate = null,
    chainTxHash = null,
    status = ProductionStatus.PENDING
  ) {
    super(id);
    this._manufacturerId = manufacturerId;
    this._drugId = drugId;
    this._batchNumber = batchNumber instanceof BatchNumber ? batchNumber : BatchNumber.create(batchNumber);
    this._quantity = quantity;
    this._mfgDate = mfgDate || new Date();
    this._expDate = expDate;
    this._chainTxHash = chainTxHash;
    this._status = status;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  static create(
    manufacturerId,
    drugId,
    batchNumber,
    quantity,
    mfgDate = null,
    expDate = null
  ) {
    const id = crypto.randomUUID();
    const proof = new ProofOfProduction(
      id,
      manufacturerId,
      drugId,
      batchNumber,
      quantity,
      mfgDate,
      expDate,
      null,
      ProductionStatus.PENDING
    );

    // Emit domain event
    proof.addDomainEvent(
      new DrugManufactured(
        proof.id,
        proof.manufacturerId,
        proof.drugId,
        proof.batchNumber.value,
        proof.quantity
      )
    );

    return proof;
  }

  get manufacturerId() {
    return this._manufacturerId;
  }

  get drugId() {
    return this._drugId;
  }

  get batchNumber() {
    return this._batchNumber.value;
  }

  get batchNumberVO() {
    return this._batchNumber;
  }

  get quantity() {
    return this._quantity;
  }

  get mfgDate() {
    return this._mfgDate;
  }

  get expDate() {
    return this._expDate;
  }

  get chainTxHash() {
    return this._chainTxHash;
  }

  get status() {
    return this._status;
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  completeProduction(chainTxHash) {
    if (this._status === ProductionStatus.COMPLETED) {
      throw new Error("Production đã được hoàn thành");
    }

    this._status = ProductionStatus.COMPLETED;
    this._chainTxHash = chainTxHash;
    this._updatedAt = new Date();
  }

  markAsFailed() {
    this._status = ProductionStatus.FAILED;
    this._updatedAt = new Date();
  }

  isCompleted() {
    return this._status === ProductionStatus.COMPLETED;
  }

  isPending() {
    return this._status === ProductionStatus.PENDING;
  }
}

