import { AggregateRoot } from "../../../../shared-kernel/domain/AggregateRoot.js";
import { InvoiceNumber } from "../value-objects/InvoiceNumber.js";
import { Quantity } from "../value-objects/Quantity.js";
import { Price } from "../value-objects/Price.js";
import { TransactionHash } from "../value-objects/TransactionHash.js";
import { ManufacturerToDistributorTransfer } from "../domain-events/ManufacturerToDistributorTransfer.js";
import crypto from "crypto";

export const InvoiceStatus = {
  PENDING: "pending",
  ISSUED: "issued",
  SENT: "sent",
  CONFIRMED: "confirmed",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

export class ManufacturerInvoice extends AggregateRoot {
  constructor(
    id,
    fromManufacturerId,
    toDistributorId,
    drugId,
    proofOfProductionId = null,
    nftInfoId = null,
    invoiceNumber,
    invoiceDate,
    quantity,
    unitPrice = null,
    totalAmount = null,
    vatRate = null,
    vatAmount = null,
    finalAmount = null,
    notes = null,
    status = InvoiceStatus.PENDING,
    chainTxHash = null,
    tokenIds = []
  ) {
    super(id);
    this._fromManufacturerId = fromManufacturerId;
    this._toDistributorId = toDistributorId;
    this._drugId = drugId;
    this._proofOfProductionId = proofOfProductionId;
    this._nftInfoId = nftInfoId;
    this._invoiceNumber = invoiceNumber instanceof InvoiceNumber ? invoiceNumber : InvoiceNumber.create(invoiceNumber);
    this._invoiceDate = invoiceDate || new Date();
    this._quantity = quantity instanceof Quantity ? quantity : Quantity.create(quantity);
    this._unitPrice = unitPrice ? (unitPrice instanceof Price ? unitPrice : Price.create(unitPrice)) : null;
    this._totalAmount = totalAmount ? (totalAmount instanceof Price ? totalAmount : Price.create(totalAmount)) : null;
    this._vatRate = vatRate;
    this._vatAmount = vatAmount ? (vatAmount instanceof Price ? vatAmount : Price.create(vatAmount)) : null;
    this._finalAmount = finalAmount ? (finalAmount instanceof Price ? finalAmount : Price.create(finalAmount)) : null;
    this._notes = notes;
    this._status = status;
    this._chainTxHash = chainTxHash instanceof TransactionHash ? chainTxHash : (chainTxHash ? TransactionHash.create(chainTxHash) : null);
    this._tokenIds = tokenIds || [];
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  static create(
    fromManufacturerId,
    toDistributorId,
    drugId,
    invoiceNumber,
    quantity,
    tokenIds = [],
    invoiceDate = null,
    proofOfProductionId = null,
    nftInfoId = null,
    unitPrice = null,
    totalAmount = null,
    vatRate = null,
    vatAmount = null,
    finalAmount = null,
    notes = null
  ) {
    const id = crypto.randomUUID();
    const invoice = new ManufacturerInvoice(
      id,
      fromManufacturerId,
      toDistributorId,
      drugId,
      proofOfProductionId,
      nftInfoId,
      invoiceNumber,
      invoiceDate,
      quantity,
      unitPrice,
      totalAmount,
      vatRate,
      vatAmount,
      finalAmount,
      notes,
      InvoiceStatus.PENDING,
      null,
      tokenIds
    );

    // Emit domain event
    invoice.raiseDomainEvent(
      new ManufacturerToDistributorTransfer(
        invoice.id,
        invoice.fromManufacturerId,
        invoice.toDistributorId,
        invoice.drugId,
        invoice.invoiceNumber,
        invoice.quantity.value,
        invoice.tokenIds
      )
    );

    return invoice;
  }

  get fromManufacturerId() {
    return this._fromManufacturerId;
  }

  get toDistributorId() {
    return this._toDistributorId;
  }

  get drugId() {
    return this._drugId;
  }

  get proofOfProductionId() {
    return this._proofOfProductionId;
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

  get tokenIds() {
    return [...this._tokenIds];
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  issue() {
    if (this._status !== InvoiceStatus.PENDING) {
      throw new Error("Chỉ có thể issue invoice ở trạng thái pending");
    }
    this._status = InvoiceStatus.ISSUED;
    this._updatedAt = new Date();
  }

  send(chainTxHash = null) {
    if (this._status !== InvoiceStatus.ISSUED) {
      throw new Error("Chỉ có thể send invoice ở trạng thái issued");
    }
    this._status = InvoiceStatus.SENT;
    if (chainTxHash) {
      this._chainTxHash = TransactionHash.create(chainTxHash);
    }
    this._updatedAt = new Date();
  }

  confirm() {
    if (this._status !== InvoiceStatus.SENT) {
      throw new Error("Chỉ có thể confirm invoice ở trạng thái sent");
    }
    this._status = InvoiceStatus.CONFIRMED;
    this._updatedAt = new Date();
  }

  markAsDelivered(chainTxHash = null) {
    if (this._status !== InvoiceStatus.CONFIRMED) {
      throw new Error("Chỉ có thể mark delivered invoice ở trạng thái confirmed");
    }
    this._status = InvoiceStatus.DELIVERED;
    if (chainTxHash) {
      this._chainTxHash = TransactionHash.create(chainTxHash);
    }
    this._updatedAt = new Date();
  }

  setChainTxHash(chainTxHash) {
    this._chainTxHash = TransactionHash.create(chainTxHash);
    this._updatedAt = new Date();
  }

  cancel() {
    if (this._status === InvoiceStatus.DELIVERED) {
      throw new Error("Không thể hủy invoice đã delivered");
    }
    this._status = InvoiceStatus.CANCELLED;
    this._updatedAt = new Date();
  }

  isPending() {
    return this._status === InvoiceStatus.PENDING;
  }

  canBeTransferred() {
    return this._status === InvoiceStatus.ISSUED || this._status === InvoiceStatus.CONFIRMED;
  }
}

