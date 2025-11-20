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

    // Get manufacturer from drug's manufacturer field
    let manufacturerId = document.owner?.toString() || null;
    if (document.drug && document.drug.manufacturer) {
      manufacturerId = document.drug.manufacturer?.toString() || document.drug.manufacturer || manufacturerId;
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
      document.owner?.toString() || null,
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

    const document = {
      tokenId: aggregate.tokenId,
      drug: aggregate.drugId,
      serialNumber: aggregate.serialNumber,
      batchNumber: aggregate.batchNumber,
      quantity: aggregate.quantity,
      mfgDate: aggregate.mfgDate || null,
      expDate: aggregate.expDate || null,
      owner: aggregate.ownerId || null,
      status: aggregate.status,
      chainTxHash: aggregate.chainTxHash || null,
      ipfsUrl: aggregate.ipfsUrl || null,
      ipfsHash: aggregate.ipfsHash || null,
      metadata: aggregate.metadata || null,
      proofOfProduction: aggregate.proofOfProductionId || null,
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

