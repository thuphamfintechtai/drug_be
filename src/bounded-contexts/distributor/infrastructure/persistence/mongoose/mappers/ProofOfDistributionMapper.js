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

    const extractId = (value) => {
      if (!value) return null;
      if (typeof value === "string") return value;
      if (value._id) return value._id.toString();
      if (value.toString) {
        const str = value.toString();
        if (/^[0-9a-fA-F]{24}$/.test(str)) {
          return str;
        }
      }
      return null;
    };

    // Kiểm tra xem fromManufacturer có được populate không (PharmaCompany có properties như name, licenseNo, contactEmail)
    const isPopulatedManufacturer = document.fromManufacturer && 
      typeof document.fromManufacturer === "object" && 
      document.fromManufacturer._id &&
      (document.fromManufacturer.name || document.fromManufacturer.licenseNo || document.fromManufacturer.contactEmail);

    const manufacturerInfo = isPopulatedManufacturer
      ? {
          id: extractId(document.fromManufacturer),
          name: document.fromManufacturer.name || null,
          email: document.fromManufacturer.contactEmail || null,
          licenseNo: document.fromManufacturer.licenseNo || null,
          taxCode: document.fromManufacturer.taxCode || null,
          address: document.fromManufacturer.address || null,
          country: document.fromManufacturer.country || null,
          contactPhone: document.fromManufacturer.contactPhone || null,
        }
      : null;

    // Lấy manufacturerId - nếu đã populate thì lấy từ _id, nếu không thì lấy từ giá trị gốc
    const manufacturerId = document.fromManufacturer 
      ? (isPopulatedManufacturer 
          ? extractId(document.fromManufacturer) 
          : (typeof document.fromManufacturer === "string" 
              ? document.fromManufacturer 
              : extractId(document.fromManufacturer)))
      : null;

    const tokenIds =
      (document.manufacturerInvoice && document.manufacturerInvoice.tokenIds) ||
      [];

    return new ProofOfDistribution(
      document._id.toString(),
      manufacturerId,
      extractId(document.toDistributor),
      extractId(document.manufacturerInvoice),
      extractId(document.proofOfProduction),
      extractId(document.nftInfo),
      document.distributionDate || null,
      document.distributedQuantity || 0,
      document.batchNumber || null,
      document.status || DistributionStatus.PENDING,
      document.chainTxHash || null,
      document.transferTxHash || null,
      document.notes || null,
      tokenIds,
      manufacturerInfo
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

