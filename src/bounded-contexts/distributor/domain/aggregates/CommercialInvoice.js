import { AggregateRoot } from "../../../../shared-kernel/domain/AggregateRoot.js";
import { InvoiceNumber } from "../../../supply-chain/domain/value-objects/InvoiceNumber.js";
import { Quantity } from "../../../supply-chain/domain/value-objects/Quantity.js";
import { Price } from "../../../supply-chain/domain/value-objects/Price.js";
import { TransactionHash } from "../../../supply-chain/domain/value-objects/TransactionHash.js";
import { DistributorToPharmacyTransfer } from "../domain-events/DistributorToPharmacyTransfer.js";
import crypto from "crypto";

export const CommercialInvoiceStatus = {
  DRAFT: "draft",
  ISSUED: "issued",
  SENT: "sent",
  PAID: "paid",
  CANCELLED: "cancelled",
};

export class CommercialInvoice extends AggregateRoot {
  constructor(
    id,
    fromDistributorId,
    toPharmacyId,
    drugId,
    proofOfPharmacyId = null,
    nftInfoId = null,
    invoiceNumber,
    invoiceDate,
    quantity,
    unitPrice = null,
    totalAmount = null,
    vatRate = null,
    vatAmount = null,
    finalAmount = null,
    status = CommercialInvoiceStatus.DRAFT,
    chainTxHash = null,
    tokenIds = [],
    supplyChainCompleted = false
  ) {
    super(id);
    this._fromDistributorId = fromDistributorId;
    this._toPharmacyId = toPharmacyId;
    this._drugId = drugId;
    this._proofOfPharmacyId = proofOfPharmacyId;
    this._nftInfoId = nftInfoId;
    this._invoiceNumber = invoiceNumber instanceof InvoiceNumber ? invoiceNumber : InvoiceNumber.create(invoiceNumber);
    this._invoiceDate = invoiceDate || new Date();
    this._quantity = quantity instanceof Quantity ? quantity : Quantity.create(quantity);
    this._unitPrice = unitPrice ? (unitPrice instanceof Price ? unitPrice : Price.create(unitPrice)) : null;
    this._totalAmount = totalAmount ? (totalAmount instanceof Price ? totalAmount : Price.create(totalAmount)) : null;
    this._vatRate = vatRate;
    this._vatAmount = vatAmount ? (vatAmount instanceof Price ? vatAmount : Price.create(vatAmount)) : null;
    this._finalAmount = finalAmount ? (finalAmount instanceof Price ? finalAmount : Price.create(finalAmount)) : null;
    this._status = status;
    this._chainTxHash = chainTxHash instanceof TransactionHash ? chainTxHash : (chainTxHash ? TransactionHash.create(chainTxHash) : null);
    this._tokenIds = tokenIds || [];
    this._supplyChainCompleted = supplyChainCompleted;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  static create(
    fromDistributorId,
    toPharmacyId,
    drugId,
    invoiceNumber,
    quantity,
    tokenIds = [],
    invoiceDate = null,
    proofOfPharmacyId = null,
    nftInfoId = null,
    unitPrice = null,
    totalAmount = null,
    vatRate = null,
    vatAmount = null,
    finalAmount = null
  ) {
    const id = crypto.randomUUID();
    const invoice = new CommercialInvoice(
      id,
      fromDistributorId,
      toPharmacyId,
      drugId,
      proofOfPharmacyId,
      nftInfoId,
      invoiceNumber,
      invoiceDate,
      quantity,
      unitPrice,
      totalAmount,
      vatRate,
      vatAmount,
      finalAmount,
      CommercialInvoiceStatus.DRAFT,
      null,
      tokenIds,
      false
    );

    // Emit domain event
    invoice.addDomainEvent(
      new DistributorToPharmacyTransfer(
        invoice.id,
        invoice.fromDistributorId,
        invoice.toPharmacyId,
        invoice.drugId,
        invoice.invoiceNumber,
        invoice.quantity.value,
        invoice.tokenIds
      )
    );

    return invoice;
  }

  get fromDistributorId() {
    return this._fromDistributorId;
  }

  get toPharmacyId() {
    return this._toPharmacyId;
  }

  get drugId() {
    return this._drugId;
  }

  get proofOfPharmacyId() {
    return this._proofOfPharmacyId;
  }

  get nftInfoId() {
    return this._nftInfoId;
  }

  get invoiceNumber() {
    return this._invoiceNumber.value;
  }

  get invoiceNumberVO() {
    return this._invoiceNumber;
  }

  get invoiceDate() {
    return this._invoiceDate;
  }

  get quantity() {
    return this._quantity.value;
  }

  get quantityVO() {
    return this._quantity;
  }

  get unitPrice() {
    return this._unitPrice ? this._unitPrice.value : null;
  }

  get totalAmount() {
    return this._totalAmount ? this._totalAmount.value : null;
  }

  get vatRate() {
    return this._vatRate;
  }

  get vatAmount() {
    return this._vatAmount ? this._vatAmount.value : null;
  }

  get finalAmount() {
    return this._finalAmount ? this._finalAmount.value : null;
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

  get tokenIds() {
    return [...this._tokenIds];
  }

  get supplyChainCompleted() {
    return this._supplyChainCompleted;
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  issue() {
    if (this._status !== CommercialInvoiceStatus.DRAFT) {
      throw new Error("Chỉ có thể issue invoice ở trạng thái draft");
    }
    this._status = CommercialInvoiceStatus.ISSUED;
    this._updatedAt = new Date();
  }

  markAsSent(chainTxHash = null) {
    if (this._status !== CommercialInvoiceStatus.ISSUED) {
      throw new Error("Chỉ có thể mark sent invoice ở trạng thái issued");
    }
    this._status = CommercialInvoiceStatus.SENT;
    if (chainTxHash) {
      this._chainTxHash = TransactionHash.create(chainTxHash);
    }
    this._updatedAt = new Date();
  }

  markAsPaid() {
    if (this._status !== CommercialInvoiceStatus.SENT) {
      throw new Error("Chỉ có thể mark paid invoice ở trạng thái sent");
    }
    this._status = CommercialInvoiceStatus.PAID;
    this._updatedAt = new Date();
  }

  setChainTxHash(chainTxHash) {
    this._chainTxHash = TransactionHash.create(chainTxHash);
    this._updatedAt = new Date();
  }

  completeSupplyChain() {
    this._supplyChainCompleted = true;
    this._updatedAt = new Date();
  }

  cancel() {
    if (this._status === CommercialInvoiceStatus.PAID) {
      throw new Error("Không thể hủy invoice đã paid");
    }
    this._status = CommercialInvoiceStatus.CANCELLED;
    this._updatedAt = new Date();
  }

  canBeTransferred() {
    return this._status === CommercialInvoiceStatus.ISSUED || this._status === CommercialInvoiceStatus.SENT;
  }
}

