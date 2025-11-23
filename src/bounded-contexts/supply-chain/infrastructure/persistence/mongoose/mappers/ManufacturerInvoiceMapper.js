import { ManufacturerInvoice } from "../../../../domain/aggregates/ManufacturerInvoice.js";
import { InvoiceNumber } from "../../../../domain/value-objects/InvoiceNumber.js";
import { Quantity } from "../../../../domain/value-objects/Quantity.js";
import { Price } from "../../../../domain/value-objects/Price.js";
import { TransactionHash } from "../../../../domain/value-objects/TransactionHash.js";
import { InvoiceStatus } from "../../../../domain/aggregates/ManufacturerInvoice.js";

export class ManufacturerInvoiceMapper {
  static toDomain(document) {
    if (!document) {
      return null;
    }

    // Handle populated objects - extract _id if it's an object
    const getObjectId = (field) => {
      if (!field) return null;
      if (typeof field === 'object' && field._id) {
        return field._id.toString();
      }
      if (typeof field === 'object' && field.toString) {
        return field.toString();
      }
      if (typeof field === 'string') {
        return field;
      }
      return field;
    };

    return new ManufacturerInvoice(
      document._id.toString(),
      getObjectId(document.fromManufacturer),
      getObjectId(document.toDistributor),
      getObjectId(document.drug),
      getObjectId(document.proofOfProduction),
      getObjectId(document.nftInfo),
      document.invoiceNumber,
      document.invoiceDate || null,
      document.quantity || 0,
      document.unitPrice || null,
      document.totalAmount || null,
      document.vatRate || null,
      document.vatAmount || null,
      document.finalAmount || null,
      document.notes || null,
      document.status || InvoiceStatus.PENDING,
      document.chainTxHash || null,
      document.tokenIds || []
    );
  }

  static toPersistence(aggregate) {
    if (!aggregate) {
      return null;
    }

    const document = {
      fromManufacturer: aggregate.fromManufacturerId,
      toDistributor: aggregate.toDistributorId,
      drug: aggregate.drugId,
      proofOfProduction: aggregate.proofOfProductionId || null,
      nftInfo: aggregate.nftInfoId || null,
      invoiceNumber: aggregate.invoiceNumber,
      invoiceDate: aggregate.invoiceDate || null,
      quantity: aggregate.quantity,
      unitPrice: aggregate.unitPrice || null,
      totalAmount: aggregate.totalAmount || null,
      vatRate: aggregate.vatRate || null,
      vatAmount: aggregate.vatAmount || null,
      finalAmount: aggregate.finalAmount || null,
      notes: aggregate.notes || null,
      status: aggregate.status,
      chainTxHash: aggregate.chainTxHash || null,
      tokenIds: aggregate.tokenIds || [],
      batchNumber: null, // Will be set from related NFT or ProofOfProduction
      updatedAt: aggregate.updatedAt || new Date(),
    };

    // Only include _id if it's a valid MongoDB ObjectId
    const isObjectId = aggregate.id && aggregate.id.length === 24 && /^[0-9a-fA-F]{24}$/.test(aggregate.id);
    if (isObjectId) {
      document._id = aggregate.id;
    }

    return document;
  }
}

