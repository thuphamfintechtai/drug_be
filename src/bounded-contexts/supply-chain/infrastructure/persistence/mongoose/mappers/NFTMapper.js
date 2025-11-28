import { NFT } from "../../../../domain/aggregates/NFT.js";
import { TokenId } from "../../../../domain/value-objects/TokenId.js";
import { BatchNumber } from "../../../../domain/value-objects/BatchNumber.js";
import { IPFSHash } from "../../../../domain/value-objects/IPFSHash.js";
import { NFTStatus } from "../../../../domain/aggregates/NFT.js";

export class NFTMapper {
  static toDomain(document) {
    if (!document) {
      return null;
    }

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
        if (/^[0-9a-fA-F]{24}$/.test(str)) {
          return str;
        }
      }
      return null;
    };

    const ownerId = extractId(document.owner);
    let manufacturerId = ownerId;
    if (document.drug && document.drug.manufacturer) {
      manufacturerId = extractId(document.drug.manufacturer) || manufacturerId;
    }

    const ipfsHash = document.ipfsHash || document.ipfsUrl
      ? IPFSHash.create(
          document.ipfsHash || (document.ipfsUrl ? document.ipfsUrl.split("/").pop() : ""),
          document.ipfsUrl
        )
      : null;

    // Extract drugId - handle both populated and non-populated cases
    let drugId = null;
    if (document.drug) {
      if (typeof document.drug === 'string') {
        drugId = document.drug;
      } else if (document.drug._id) {
        drugId = document.drug._id.toString();
      } else if (document.drug.toString) {
        // For Mongoose ObjectId, toString() should work
        const drugStr = document.drug.toString();
        // Validate it's a valid ObjectId format
        if (/^[0-9a-fA-F]{24}$/.test(drugStr)) {
          drugId = drugStr;
        }
      }
    }

    // Extract proofOfProductionId - handle both populated and non-populated cases
    let proofOfProductionId = null;
    if (document.proofOfProduction) {
      if (typeof document.proofOfProduction === 'string') {
        proofOfProductionId = document.proofOfProduction;
      } else if (document.proofOfProduction._id) {
        proofOfProductionId = document.proofOfProduction._id.toString();
      } else if (document.proofOfProduction.toString) {
        // For Mongoose ObjectId, toString() should work
        const proofStr = document.proofOfProduction.toString();
        // Validate it's a valid ObjectId format
        if (/^[0-9a-fA-F]{24}$/.test(proofStr)) {
          proofOfProductionId = proofStr;
        }
      }
    }

    return new NFT(
      document._id.toString(),
      document.tokenId,
      drugId,
      manufacturerId || document.owner?.toString() || null,
      document.batchNumber || "",
      document.serialNumber || "",
      document.quantity || 1,
      document.mfgDate || null,
      document.expDate || null,
      ownerId,
      document.chainTxHash || null,
      ipfsHash,
      document.metadata || null,
      proofOfProductionId,
      document.status || NFTStatus.MINTED
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
      tokenId: aggregate.tokenId,
      drug: normalizeId(aggregate.drugId),
      serialNumber: aggregate.serialNumber,
      batchNumber: aggregate.batchNumber,
      quantity: aggregate.quantity,
      mfgDate: aggregate.mfgDate || null,
      expDate: aggregate.expDate || null,
      owner: normalizeId(aggregate.ownerId),
      status: aggregate.status,
      chainTxHash: aggregate.chainTxHash || null,
      ipfsUrl: aggregate.ipfsUrl || null,
      ipfsHash: aggregate.ipfsHash || null,
      metadata: aggregate.metadata || null,
      proofOfProduction: normalizeId(aggregate.proofOfProductionId),
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

