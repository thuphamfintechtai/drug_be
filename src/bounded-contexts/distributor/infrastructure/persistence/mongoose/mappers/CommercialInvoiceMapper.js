import { CommercialInvoice } from "../../../../domain/aggregates/CommercialInvoice.js";
import { InvoiceNumber } from "../../../../../supply-chain/domain/value-objects/InvoiceNumber.js";
import { Quantity } from "../../../../../supply-chain/domain/value-objects/Quantity.js";
import { Price } from "../../../../../supply-chain/domain/value-objects/Price.js";
import { TransactionHash } from "../../../../../supply-chain/domain/value-objects/TransactionHash.js";
import { CommercialInvoiceStatus } from "../../../../domain/aggregates/CommercialInvoice.js";

export class CommercialInvoiceMapper {
  static toDomain(document) {
    if (!document) {
      return null;
    }

    // Helper function to extract ID from populated or non-populated field
    const extractId = (value) => {
      if (!value) return null;
      if (typeof value === "string") {
        return value;
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

    const pharmacyDoc = document.toPharmacy;
    const populatedPharmacy = pharmacyDoc && pharmacyDoc.pharmacy;

    const pharmacyInfo = pharmacyDoc
      ? {
          id: extractId(populatedPharmacy) || extractId(pharmacyDoc),
          name:
            (populatedPharmacy && populatedPharmacy.name) ||
            pharmacyDoc.fullName ||
            pharmacyDoc.username ||
            null,
          code:
            (populatedPharmacy && (populatedPharmacy.licenseNo || populatedPharmacy.taxCode)) ||
            null,
        }
      : null;

    return new CommercialInvoice(
      document._id.toString(),
      extractId(document.fromDistributor),
      extractId(document.toPharmacy),
      extractId(document.drug),
      extractId(document.proofOfPharmacy),
      extractId(document.nftInfo),
      document.invoiceNumber,
      document.invoiceDate || null,
      document.quantity || 0,
      document.unitPrice || null,
      document.totalAmount || null,
      document.vatRate || null,
      document.vatAmount || null,
      document.finalAmount || null,
      document.status || CommercialInvoiceStatus.DRAFT,
      document.chainTxHash || null,
      document.tokenIds || [],
      document.supplyChainCompleted || false,
      pharmacyInfo
    );
  }

  static toPersistence(aggregate) {
    if (!aggregate) {
      return null;
    }

    const document = {
      fromDistributor: aggregate.fromDistributorId,
      toPharmacy: aggregate.toPharmacyId,
      drug: aggregate.drugId,
      proofOfPharmacy: aggregate.proofOfPharmacyId || null,
      nftInfo: aggregate.nftInfoId || null,
      invoiceNumber: aggregate.invoiceNumber,
      invoiceDate: aggregate.invoiceDate || null,
      quantity: aggregate.quantity,
      unitPrice: aggregate.unitPrice || null,
      totalAmount: aggregate.totalAmount || null,
      vatRate: aggregate.vatRate || null,
      vatAmount: aggregate.vatAmount || null,
      finalAmount: aggregate.finalAmount || null,
      status: aggregate.status,
      chainTxHash: aggregate.chainTxHash || null,
      tokenIds: aggregate.tokenIds || [],
      supplyChainCompleted: aggregate.supplyChainCompleted || false,
      batchNumber: null, // Will be set from related NFT
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

