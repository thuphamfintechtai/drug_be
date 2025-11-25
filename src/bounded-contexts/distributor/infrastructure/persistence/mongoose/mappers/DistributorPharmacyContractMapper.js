import { DistributorPharmacyContract, ContractStatus } from "../../../../domain/aggregates/DistributorPharmacyContract.js";

export class DistributorPharmacyContractMapper {
  /**
   * Helper function để extract ID từ value (có thể là ObjectId, string, hoặc populated object)
   */
  static extractId(value) {
    if (!value) return null;
    
    // Nếu là string, trả về trực tiếp
    if (typeof value === 'string') {
      return value;
    }
    
    // Nếu là object (populated object hoặc Mongoose document)
    if (typeof value === 'object') {
      // Ưu tiên _id (luôn có trong populated object)
      if (value._id) {
        // _id có thể là ObjectId hoặc string
        return value._id.toString ? value._id.toString() : String(value._id);
      }
      
      // Nếu không có _id, thử id getter (Mongoose)
      if (value.id !== undefined && value.id !== null) {
        const idValue = value.id;
        if (typeof idValue === 'string') {
          return idValue;
        }
        if (idValue && typeof idValue.toString === 'function') {
          return idValue.toString();
        }
        return String(idValue);
      }
    }
    
    // Nếu có toString() và là ObjectId hợp lệ
    if (value && typeof value.toString === 'function') {
      const str = value.toString();
      // Kiểm tra xem có phải là ObjectId hợp lệ không (24 ký tự hex)
      if (str && /^[0-9a-fA-F]{24}$/.test(str)) {
        return str;
      }
    }
    
    return null;
  }

  static toDomain(document) {
    if (!document) {
      return null;
    }

    // Xử lý distributorId và pharmacyId bằng helper function
    const distributorId = this.extractId(document.distributor);
    const pharmacyId = this.extractId(document.pharmacy);

    // Debug logging (có thể xóa sau)
    if (!distributorId || !pharmacyId) {
      console.log("Debug DistributorPharmacyContractMapper.toDomain:", {
        distributorType: typeof document.distributor,
        distributorValue: document.distributor,
        distributorHasId: !!document.distributor?._id,
        distributorIdValue: document.distributor?._id,
        extractedDistributorId: distributorId,
        pharmacyType: typeof document.pharmacy,
        pharmacyValue: document.pharmacy,
        pharmacyHasId: !!document.pharmacy?._id,
        pharmacyIdValue: document.pharmacy?._id,
        extractedPharmacyId: pharmacyId,
      });
    }

    return new DistributorPharmacyContract(
      document._id.toString(),
      distributorId,
      pharmacyId,
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

