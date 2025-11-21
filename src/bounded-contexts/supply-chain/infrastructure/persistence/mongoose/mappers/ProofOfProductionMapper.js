import { ProofOfProduction } from "../../../../domain/aggregates/ProofOfProduction.js";
import { BatchNumber } from "../../../../domain/value-objects/BatchNumber.js";
import { ProductionStatus } from "../../../../domain/aggregates/ProofOfProduction.js";

export class ProofOfProductionMapper {
  static toDomain(document) {
    if (!document) {
      return null;
    }

    return new ProofOfProduction(
      document._id.toString(),
      document.manufacturer?.toString() || document.manufacturer,
      document.drug?.toString() || document.drug,
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

    const document = {
      manufacturer: aggregate.manufacturerId,
      drug: aggregate.drugId,
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

