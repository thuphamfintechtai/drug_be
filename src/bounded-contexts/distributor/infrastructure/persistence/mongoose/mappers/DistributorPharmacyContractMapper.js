import { DistributorPharmacyContract, ContractStatus } from "../../../../domain/aggregates/DistributorPharmacyContract.js";

export class DistributorPharmacyContractMapper {
  static toDomain(document) {
    if (!document) {
      return null;
    }

    return new DistributorPharmacyContract(
      document._id.toString(),
      document.distributor?.toString() || document.distributor,
      document.pharmacy?.toString() || document.pharmacy,
      document.contractFileUrl || null,
      document.contractFileName || null,
      document.status || ContractStatus.PENDING,
      document.distributorWalletAddress || null,
      document.pharmacyWalletAddress || null,
      document.blockchainTxHash || null,
      document.blockchainStatus || null,
      document.tokenId || null,
      document.createdAt || null,
      document.updatedAt || null,
      document.distributorSignedAt || null,
      document.pharmacySignedAt || null
    );
  }

  static toPersistence(aggregate) {
    if (!aggregate) {
      return null;
    }

    const document = {
      distributor: aggregate.distributorId,
      pharmacy: aggregate.pharmacyId,
      contractFileUrl: aggregate.contractFileUrl,
      contractFileName: aggregate.contractFileName,
      status: aggregate.status,
      distributorWalletAddress: aggregate.distributorWalletAddress,
      pharmacyWalletAddress: aggregate.pharmacyWalletAddress,
      blockchainTxHash: aggregate.blockchainTxHash,
      blockchainStatus: aggregate.blockchainStatus,
      tokenId: aggregate.tokenId,
      distributorSignedAt: aggregate.distributorSignedAt,
      pharmacySignedAt: aggregate.pharmacySignedAt,
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

