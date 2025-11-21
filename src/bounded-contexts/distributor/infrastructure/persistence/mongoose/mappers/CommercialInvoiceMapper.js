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

    return new CommercialInvoice(
      document._id.toString(),
      document.fromDistributor?.toString() || document.fromDistributor,
      document.toPharmacy?.toString() || document.toPharmacy,
      document.drug?.toString() || document.drug,
      document.proofOfPharmacy?.toString() || null,
      document.nftInfo?.toString() || null,
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
      document.supplyChainCompleted || false
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

