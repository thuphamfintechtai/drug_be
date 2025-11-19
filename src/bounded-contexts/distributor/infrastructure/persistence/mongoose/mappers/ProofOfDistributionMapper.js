import { ProofOfDistribution } from "../../../../domain/aggregates/ProofOfDistribution.js";
import { BatchNumber } from "../../../../../supply-chain/domain/value-objects/BatchNumber.js";
import { Quantity } from "../../../../../supply-chain/domain/value-objects/Quantity.js";
import { TransactionHash } from "../../../../../supply-chain/domain/value-objects/TransactionHash.js";
import { DistributionStatus } from "../../../../domain/aggregates/ProofOfDistribution.js";

export class ProofOfDistributionMapper {
  static toDomain(document) {
    if (!document) {
      return null;
    }

    return new ProofOfDistribution(
      document._id.toString(),
      document.fromManufacturer?.toString() || document.fromManufacturer,
      document.toDistributor?.toString() || document.toDistributor,
      document.manufacturerInvoice?.toString() || null,
      document.proofOfProduction?.toString() || null,
      document.nftInfo?.toString() || null,
      document.distributionDate || null,
      document.distributedQuantity || 0,
      document.batchNumber || null,
      document.status || DistributionStatus.PENDING,
      document.chainTxHash || null,
      document.transferTxHash || null,
      document.notes || null
    );
  }

  static toPersistence(aggregate) {
    if (!aggregate) {
      return null;
    }

    const document = {
      fromManufacturer: aggregate.fromManufacturerId,
      toDistributor: aggregate.toDistributorId,
      manufacturerInvoice: aggregate.manufacturerInvoiceId || null,
      proofOfProduction: aggregate.proofOfProductionId || null,
      nftInfo: aggregate.nftInfoId || null,
      distributionDate: aggregate.distributionDate || null,
      distributedQuantity: aggregate.distributedQuantity,
      batchNumber: aggregate.batchNumber || null,
      status: aggregate.status,
      chainTxHash: aggregate.chainTxHash || null,
      transferTxHash: aggregate.transferTxHash || null,
      notes: aggregate.notes || null,
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

