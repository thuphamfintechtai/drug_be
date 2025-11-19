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

    return new ProofOfPharmacy(
      document._id.toString(),
      document.fromDistributor?.toString() || document.fromDistributor,
      document.toPharmacy?.toString() || document.toPharmacy,
      document.commercialInvoice?.toString() || null,
      document.proofOfDistribution?.toString() || null,
      document.nftInfo?.toString() || null,
      document.drug?.toString() || null,
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

    const document = {
      fromDistributor: aggregate.fromDistributorId,
      toPharmacy: aggregate.toPharmacyId,
      commercialInvoice: aggregate.commercialInvoiceId || null,
      proofOfDistribution: aggregate.proofOfDistributionId || null,
      nftInfo: aggregate.nftInfoId || null,
      drug: aggregate.drugId || null,
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

