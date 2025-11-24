import { AggregateRoot } from "../../../../shared-kernel/domain/AggregateRoot.js";
import { BatchNumber } from "../../../supply-chain/domain/value-objects/BatchNumber.js";
import { Quantity } from "../../../supply-chain/domain/value-objects/Quantity.js";
import { TransactionHash } from "../../../supply-chain/domain/value-objects/TransactionHash.js";
import { DrugTransferred } from "../../../supply-chain/domain/domain-events/DrugTransferred.js";
import crypto from "crypto";

export const DistributionStatus = {
  PENDING: "pending",
  IN_TRANSIT: "in_transit",
  DELIVERED: "delivered",
  CONFIRMED: "confirmed",
  REJECTED: "rejected",
};

export class ProofOfDistribution extends AggregateRoot {
  constructor(
    id,
    fromManufacturerId,
    toDistributorId,
    manufacturerInvoiceId = null,
    proofOfProductionId = null,
    nftInfoId = null,
    distributionDate = null,
    distributedQuantity,
    batchNumber = null,
    status = DistributionStatus.PENDING,
    chainTxHash = null,
    transferTxHash = null,
    notes = null,
    tokenIds = [],
    manufacturerInfo = null
  ) {
    super(id);
    this._fromManufacturerId = fromManufacturerId;
    this._toDistributorId = toDistributorId;
    this._manufacturerInvoiceId = manufacturerInvoiceId;
    this._proofOfProductionId = proofOfProductionId;
    this._nftInfoId = nftInfoId;
    this._distributionDate = distributionDate || new Date();
    this._distributedQuantity = distributedQuantity instanceof Quantity ? distributedQuantity : Quantity.create(distributedQuantity);
    this._batchNumber = batchNumber instanceof BatchNumber ? batchNumber : (batchNumber ? BatchNumber.create(batchNumber) : null);
    this._status = status;
    this._chainTxHash = chainTxHash instanceof TransactionHash ? chainTxHash : (chainTxHash ? TransactionHash.create(chainTxHash) : null);
    this._transferTxHash = transferTxHash instanceof TransactionHash ? transferTxHash : (transferTxHash ? TransactionHash.create(transferTxHash) : null);
    this._notes = notes;
    this._createdAt = new Date();
    this._updatedAt = new Date();
    this._tokenIds = Array.isArray(tokenIds) ? tokenIds : [];
    this._manufacturerInfo = manufacturerInfo;
  }

  static create(
    fromManufacturerId,
    toDistributorId,
    distributedQuantity,
    manufacturerInvoiceId = null,
    proofOfProductionId = null,
    nftInfoId = null,
    distributionDate = null,
    batchNumber = null,
    tokenIds = [],
    manufacturerInfo = null
  ) {
    const id = crypto.randomUUID();
    const proof = new ProofOfDistribution(
      id,
      fromManufacturerId,
      toDistributorId,
      manufacturerInvoiceId,
      proofOfProductionId,
      nftInfoId,
      distributionDate,
      distributedQuantity,
      batchNumber,
      DistributionStatus.PENDING,
      null,
      null,
      null,
      Array.isArray(tokenIds) ? tokenIds : [],
      manufacturerInfo || null
    );

    // Emit domain event
    proof.raiseDomainEvent(
      new DrugTransferred(
        proof.id,
        proof.fromManufacturerId,
        proof.toDistributorId,
        proof.distributedQuantity.value
      )
    );

    return proof;
  }

  get fromManufacturerId() {
    return this._fromManufacturerId;
  }

  get toDistributorId() {
    return this._toDistributorId;
  }

  get manufacturerInvoiceId() {
    return this._manufacturerInvoiceId;
  }

  get proofOfProductionId() {
    return this._proofOfProductionId;
  }

  get nftInfoId() {
    return this._nftInfoId;
  }

  get distributionDate() {
    return this._distributionDate;
  }

  get distributedQuantity() {
    return this._distributedQuantity.value;
  }

  get distributedQuantityVO() {
    return this._distributedQuantity;
  }

  get batchNumber() {
    return this._batchNumber ? this._batchNumber.value : null;
  }

  get batchNumberVO() {
    return this._batchNumber;
  }

  get status() {
    return this._status;
  }

  get chainTxHash() {
    return this._chainTxHash ? this._chainTxHash.value : null;
  }

  get transferTxHash() {
    return this._transferTxHash ? this._transferTxHash.value : null;
  }

  get notes() {
    return this._notes;
  }

  get tokenIds() {
    return [...this._tokenIds];
  }

  get manufacturerInfo() {
    return this._manufacturerInfo;
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  confirmReceipt(chainTxHash = null) {
    if (this._status === DistributionStatus.CONFIRMED) {
      throw new Error("Distribution đã được confirm");
    }
    
    this._status = DistributionStatus.CONFIRMED;
    if (chainTxHash) {
      this._chainTxHash = TransactionHash.create(chainTxHash);
    }
    this._updatedAt = new Date();
  }

  markAsDelivered(chainTxHash = null) {
    this._status = DistributionStatus.DELIVERED;
    if (chainTxHash) {
      this._chainTxHash = TransactionHash.create(chainTxHash);
    }
    this._updatedAt = new Date();
  }

  markAsInTransit() {
    this._status = DistributionStatus.IN_TRANSIT;
    this._updatedAt = new Date();
  }

  setTransferTxHash(transferTxHash) {
    this._transferTxHash = TransactionHash.create(transferTxHash);
    this._updatedAt = new Date();
  }

  reject() {
    this._status = DistributionStatus.REJECTED;
    this._updatedAt = new Date();
  }

  isConfirmed() {
    return this._status === DistributionStatus.CONFIRMED;
  }
}

