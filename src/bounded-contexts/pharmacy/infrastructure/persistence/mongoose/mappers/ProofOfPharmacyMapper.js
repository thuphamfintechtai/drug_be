import { ProofOfPharmacy } from "../../../../domain/aggregates/ProofOfPharmacy.js";
import { BatchNumber } from "../../../../../supply-chain/domain/value-objects/BatchNumber.js";
import { Quantity } from "../../../../../supply-chain/domain/value-objects/Quantity.js";
import { TransactionHash } from "../../../../../supply-chain/domain/value-objects/TransactionHash.js";
import { PharmacyReceiptStatus } from "../../../../domain/aggregates/ProofOfPharmacy.js";

export class ProofOfPharmacyMapper {
  static toDomain(document) {
    if (!document) {
      return null;
    }

    // Helper function to extract ID from populated or non-populated field
    const extractId = (value) => {
      if (!value) return null;
      if (typeof value === "string") {
        return value.trim();
      }
      if (value._id) {
        return value._id.toString();
      }
      if (value.toString) {
        const str = value.toString();
        // Check if it's a valid ObjectId format (24 hex chars)
        if (/^[0-9a-fA-F]{24}$/.test(str)) {
          return str;
        }
      }
      return null;
    };

    return new ProofOfPharmacy(
      document._id.toString(),
      extractId(document.fromDistributor) || document.fromDistributor,
      extractId(document.toPharmacy) || document.toPharmacy,
      extractId(document.commercialInvoice) || null,
      extractId(document.proofOfDistribution) || null,
      extractId(document.nftInfo) || null,
      extractId(document.drug) || null,
      document.receiptDate || null,
      document.receivedQuantity || 0,
      document.batchNumber || null,
      document.receivedBy || null,
      document.receiptAddress || null,
      document.qualityCheck || null,
      document.notes || null,
      document.status || PharmacyReceiptStatus.PENDING,
      document.chainTxHash || null
    );
  }

  static toPersistence(aggregate) {
    if (!aggregate) {
      return null;
    }

    // Helper function to normalize ID to string/ObjectId
    const normalizeId = (id) => {
      if (!id) return null;
      if (typeof id === 'string') {
        const trimmed = id.trim();
        // Return null if empty string
        if (trimmed === '') return null;
        // Return as-is if valid ObjectId format
        if (/^[0-9a-fA-F]{24}$/.test(trimmed)) {
          return trimmed;
        }
        return trimmed;
      }
      // If it's an object, try to extract _id or toString
      if (id && typeof id === 'object') {
        if (id._id) {
          return id._id.toString();
        }
        if (id.toString) {
          const str = id.toString();
          if (/^[0-9a-fA-F]{24}$/.test(str)) {
            return str;
          }
        }
        // If it's a complex object, return null to avoid casting error
        return null;
      }
      // For other types, convert to string
      const str = String(id).trim();
      return str === '' ? null : str;
    };

    const document = {
      fromDistributor: normalizeId(aggregate.fromDistributorId),
      toPharmacy: normalizeId(aggregate.toPharmacyId),
      commercialInvoice: normalizeId(aggregate.commercialInvoiceId),
      proofOfDistribution: normalizeId(aggregate.proofOfDistributionId),
      nftInfo: normalizeId(aggregate.nftInfoId),
      drug: normalizeId(aggregate.drugId),
      receiptDate: aggregate.receiptDate || null,
      receivedQuantity: aggregate.receivedQuantity,
      batchNumber: aggregate.batchNumber || null,
      receivedBy: aggregate.receivedBy || null,
      receiptAddress: aggregate.receiptAddress || null,
      qualityCheck: aggregate.qualityCheck || null,
      notes: aggregate.notes || null,
      status: aggregate.status,
      chainTxHash: aggregate.chainTxHash || null,
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

