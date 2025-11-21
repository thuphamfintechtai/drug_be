import { DrugInfo } from "../../../../domain/aggregates/DrugInfo.js";
import { DrugName } from "../../../../domain/value-objects/DrugName.js";
import { ATCCode } from "../../../../domain/value-objects/ATCCode.js";
import crypto from "crypto";

export class DrugInfoMapper {
  static toDomain(document) {
    if (!document) {
      return null;
    }

    const drugName = DrugName.create(
      document.tradeName,
      document.genericName || null
    );
    const atcCode = ATCCode.create(document.atcCode);

    return new DrugInfo(
      document._id.toString(),
      document.manufacturer?.toString() || document.manufacturer,
      drugName,
      atcCode,
      document.dosageForm || null,
      document.strength || null,
      document.route || null,
      document.packaging || null,
      document.storage || null,
      document.warnings || null,
      document.activeIngredients || [],
      document.status || "active"
    );
  }

  static toPersistence(aggregate) {
    if (!aggregate) {
      return null;
    }

    const document = {
      manufacturer: aggregate.manufacturerId,
      tradeName: aggregate.drugName,
      genericName: aggregate.genericName || null,
      atcCode: aggregate.atcCode,
      dosageForm: aggregate.dosageForm || null,
      strength: aggregate.strength || null,
      route: aggregate.route || null,
      packaging: aggregate.packaging || null,
      storage: aggregate.storage || null,
      warnings: aggregate.warnings || null,
      activeIngredients: aggregate.activeIngredients || [],
      status: aggregate.status || "active",
      updatedAt: aggregate.updatedAt || new Date(),
    };

    // Only include _id if it's a valid MongoDB ObjectId (24 hex chars)
    // UUID format (with dashes) will be treated as new document
    if (aggregate.id && aggregate.id.length === 24 && /^[0-9a-fA-F]{24}$/.test(aggregate.id)) {
      document._id = aggregate.id;
    }

    return document;
  }
}

