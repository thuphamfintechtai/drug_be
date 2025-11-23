import { ProofOfProduction } from "../../../../domain/aggregates/ProofOfProduction.js";
import { BatchNumber } from "../../../../domain/value-objects/BatchNumber.js";
import { ProductionStatus } from "../../../../domain/aggregates/ProofOfProduction.js";
import mongoose from "mongoose";

export class ProofOfProductionMapper {
  static toDomain(document) {
    if (!document) {
      return null;
    }

    // Handle manufacturer - could be ObjectId or populated object
    let manufacturerId = null;
    if (document.manufacturer) {
      if (typeof document.manufacturer === 'object' && document.manufacturer._id) {
        // Populated object
        manufacturerId = document.manufacturer._id.toString();
      } else if (typeof document.manufacturer === 'object' && document.manufacturer.toString) {
        // ObjectId
        manufacturerId = document.manufacturer.toString();
      } else if (typeof document.manufacturer === 'string') {
        // Already a string
        manufacturerId = document.manufacturer;
      }
    }

    // Handle drug - could be ObjectId or populated object
    let drugId = null;
    if (document.drug) {
      if (typeof document.drug === 'object' && document.drug._id) {
        // Populated object
        drugId = document.drug._id.toString();
      } else if (typeof document.drug === 'object' && document.drug.toString) {
        // ObjectId
        drugId = document.drug.toString();
      } else if (typeof document.drug === 'string') {
        // Already a string
        drugId = document.drug;
      }
    }

    return new ProofOfProduction(
      document._id.toString(),
      manufacturerId,
      drugId,
      document.batchNumber || "",
      document.quantity || 0,
      document.mfgDate || null,
      document.expDate || null,
      document.chainTxHash || null,
      document.status || ProductionStatus.PENDING
    );
  }

  static toPersistence(aggregate) {
    if (!aggregate) {
      return null;
    }

    // Ensure drugId is a string/ObjectId, not an object
    let drugId = aggregate.drugId;
    if (drugId) {
      if (typeof drugId === 'object') {
        // If it's a populated object, extract the _id
        if (drugId._id) {
          drugId = drugId._id.toString();
        } else if (drugId.toString) {
          drugId = drugId.toString();
        }
      }
      // Convert string to ObjectId if valid
      if (typeof drugId === 'string' && mongoose.Types.ObjectId.isValid(drugId)) {
        drugId = new mongoose.Types.ObjectId(drugId);
      }
    }

    // Ensure manufacturerId is a string/ObjectId, not an object
    let manufacturerId = aggregate.manufacturerId;
    if (manufacturerId) {
      if (typeof manufacturerId === 'object') {
        // If it's a populated object, extract the _id
        if (manufacturerId._id) {
          manufacturerId = manufacturerId._id.toString();
        } else if (manufacturerId.toString) {
          manufacturerId = manufacturerId.toString();
        }
      }
      // Convert string to ObjectId if valid
      if (typeof manufacturerId === 'string' && mongoose.Types.ObjectId.isValid(manufacturerId)) {
        manufacturerId = new mongoose.Types.ObjectId(manufacturerId);
      }
    }

    const document = {
      manufacturer: manufacturerId,
      drug: drugId,
      batchNumber: aggregate.batchNumber,
      quantity: aggregate.quantity,
      mfgDate: aggregate.mfgDate || null,
      expDate: aggregate.expDate || null,
      chainTxHash: aggregate.chainTxHash || null,
      status: aggregate.status,
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

