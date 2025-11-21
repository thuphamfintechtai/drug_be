import { AggregateRoot } from "../../../../shared-kernel/domain/AggregateRoot.js";
import { BatchNumber } from "../../../supply-chain/domain/value-objects/BatchNumber.js";
import { Quantity } from "../../../supply-chain/domain/value-objects/Quantity.js";
import { TransactionHash } from "../../../supply-chain/domain/value-objects/TransactionHash.js";
import { DrugDelivered } from "../domain-events/DrugDelivered.js";
import crypto from "crypto";

export const PharmacyReceiptStatus = {
  PENDING: "pending",
  RECEIVED: "received",
  CONFIRMED: "confirmed",
  REJECTED: "rejected",
};

export class ProofOfPharmacy extends AggregateRoot {
  constructor(
    id,
    fromDistributorId,
    toPharmacyId,
    commercialInvoiceId = null,
    proofOfDistributionId = null,
    nftInfoId = null,
    drugId = null,
    receiptDate = null,
    receivedQuantity,
    batchNumber = null,
    receivedBy = null,
    receiptAddress = null,
    qualityCheck = null,
    notes = null,
    status = PharmacyReceiptStatus.PENDING,
    chainTxHash = null
  ) {
    super(id);
    this._fromDistributorId = fromDistributorId;
    this._toPharmacyId = toPharmacyId;
    this._commercialInvoiceId = commercialInvoiceId;
    this._proofOfDistributionId = proofOfDistributionId;
    this._nftInfoId = nftInfoId;
    this._drugId = drugId;
    this._receiptDate = receiptDate || new Date();
    this._receivedQuantity = receivedQuantity instanceof Quantity ? receivedQuantity : Quantity.create(receivedQuantity);
    this._batchNumber = batchNumber instanceof BatchNumber ? batchNumber : (batchNumber ? BatchNumber.create(batchNumber) : null);
    this._receivedBy = receivedBy;
    this._receiptAddress = receiptAddress;
    this._qualityCheck = qualityCheck;
    this._notes = notes;
    this._status = status;
    this._chainTxHash = chainTxHash instanceof TransactionHash ? chainTxHash : (chainTxHash ? TransactionHash.create(chainTxHash) : null);
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  static create(
    fromDistributorId,
    toPharmacyId,
    receivedQuantity,
    commercialInvoiceId = null,
    proofOfDistributionId = null,
    nftInfoId = null,
    drugId = null,
    receiptDate = null,
    batchNumber = null,
    receivedBy = null,
    receiptAddress = null,
    qualityCheck = null,
    notes = null
  ) {
    const id = crypto.randomUUID();
    const proof = new ProofOfPharmacy(
      id,
      fromDistributorId,
      toPharmacyId,
      commercialInvoiceId,
      proofOfDistributionId,
      nftInfoId,
      drugId,
      receiptDate,
      receivedQuantity,
      batchNumber,
      receivedBy,
      receiptAddress,
      qualityCheck,
      notes,
      PharmacyReceiptStatus.PENDING,
      null
    );

    // Emit domain event
    proof.addDomainEvent(
      new DrugDelivered(
        proof.id,
        proof.fromDistributorId,
        proof.toPharmacyId,
        proof.drugId,
        proof.receivedQuantity.value
      )
    );

    return proof;
  }

  get fromDistributorId() {
    return this._fromDistributorId;
  }

  get toPharmacyId() {
    return this._toPharmacyId;
  }

  get commercialInvoiceId() {
    return this._commercialInvoiceId;
  }

  get proofOfDistributionId() {
    return this._proofOfDistributionId;
  }

  get nftInfoId() {
    return this._nftInfoId;
  }

  get drugId() {
    return this._drugId;
  }

  get receiptDate() {
    return this._receiptDate;
  }

  get receivedQuantity() {
    return this._receivedQuantity.value;
  }

  get receivedQuantityVO() {
    return this._receivedQuantity;
  }

  get batchNumber() {
    return this._batchNumber ? this._batchNumber.value : null;
  }

  get batchNumberVO() {
    return this._batchNumber;
  }

  get receivedBy() {
    return this._receivedBy ? { ...this._receivedBy } : null;
  }

  get receiptAddress() {
    return this._receiptAddress ? { ...this._receiptAddress } : null;
  }

  get qualityCheck() {
    return this._qualityCheck ? { ...this._qualityCheck } : null;
  }

  get notes() {
    return this._notes;
  }

  get status() {
    return this._status;
  }

  get chainTxHash() {
    return this._chainTxHash ? this._chainTxHash.value : null;
  }

  get chainTxHashVO() {
    return this._chainTxHash;
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  confirmReceipt(chainTxHash = null) {
    if (this._status === PharmacyReceiptStatus.CONFIRMED) {
      throw new Error("Receipt đã được confirm");
    }
    
    this._status = PharmacyReceiptStatus.CONFIRMED;
    if (chainTxHash) {
      this._chainTxHash = TransactionHash.create(chainTxHash);
    }
    this._updatedAt = new Date();
  }

  markAsReceived() {
    this._status = PharmacyReceiptStatus.RECEIVED;
    this._updatedAt = new Date();
  }

  setChainTxHash(chainTxHash) {
    this._chainTxHash = TransactionHash.create(chainTxHash);
    this._updatedAt = new Date();
  }

  reject() {
    this._status = PharmacyReceiptStatus.REJECTED;
    this._updatedAt = new Date();
  }

  isConfirmed() {
    return this._status === PharmacyReceiptStatus.CONFIRMED;
  }
}

