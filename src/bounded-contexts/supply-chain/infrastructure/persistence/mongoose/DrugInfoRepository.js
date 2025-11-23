import { IDrugInfoRepository } from "../../../domain/repositories/IDrugInfoRepository.js";
import { DrugInfoModel } from "./schemas/DrugInfoSchema.js";
import { DrugInfoMapper } from "./mappers/DrugInfoMapper.js";
import mongoose from "mongoose";

export class DrugInfoRepository extends IDrugInfoRepository {
  async findById(id) {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    
    const document = await DrugInfoModel.findById(id).populate("manufacturer");
    return DrugInfoMapper.toDomain(document);
  }

  async findByATCCode(atcCode) {
    const document = await DrugInfoModel.findOne({ atcCode: atcCode.toUpperCase() });
    return DrugInfoMapper.toDomain(document);
  }

  async findByIdOrCodeOrName(identifier, manufacturerId = null) {
    // Try to find by ObjectId first
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      const document = await DrugInfoModel.findById(identifier).populate("manufacturer");
      if (document) {
        const drug = DrugInfoMapper.toDomain(document);
        // If manufacturerId is provided, verify ownership
        if (manufacturerId && drug) {
          const drugManufacturerId = String(drug.manufacturerId || "");
          const userManufacturerId = String(manufacturerId || "");
          if (drugManufacturerId === userManufacturerId) {
            return drug;
          }
        } else if (drug) {
          return drug;
        }
      }
    }

    // Try to find by ATC code
    const atcDocument = await DrugInfoModel.findOne({ atcCode: identifier.toUpperCase() }).populate("manufacturer");
    if (atcDocument) {
      const drug = DrugInfoMapper.toDomain(atcDocument);
      // If manufacturerId is provided, verify ownership
      if (manufacturerId && drug) {
        const drugManufacturerId = String(drug.manufacturerId || "");
        const userManufacturerId = String(manufacturerId || "");
        if (drugManufacturerId === userManufacturerId) {
          return drug;
        }
      } else if (drug) {
        return drug;
      }
    }

    // Try to find by tradeName (exact match or contains)
    const nameQuery = {
      $or: [
        { tradeName: identifier },
        { tradeName: { $regex: identifier, $options: "i" } },
        { genericName: { $regex: identifier, $options: "i" } }
      ]
    };
    
    if (manufacturerId) {
      nameQuery.manufacturer = manufacturerId;
    }

    const nameDocument = await DrugInfoModel.findOne(nameQuery).populate("manufacturer");
    if (nameDocument) {
      return DrugInfoMapper.toDomain(nameDocument);
    }

    // Try to extract ATC code from format like "VITAMIN C (N19092005)"
    const match = identifier.match(/\(([^)]+)\)/);
    if (match && match[1]) {
      const extractedCode = match[1].trim();
      const codeDocument = await DrugInfoModel.findOne({ atcCode: extractedCode.toUpperCase() }).populate("manufacturer");
      if (codeDocument) {
        const drug = DrugInfoMapper.toDomain(codeDocument);
        // If manufacturerId is provided, verify ownership
        if (manufacturerId && drug) {
          const drugManufacturerId = String(drug.manufacturerId || "");
          const userManufacturerId = String(manufacturerId || "");
          if (drugManufacturerId === userManufacturerId) {
            return drug;
          }
        } else if (drug) {
          return drug;
        }
      }
    }

    return null;
  }

  async findByManufacturer(manufacturerId) {
    const documents = await DrugInfoModel.find({ manufacturer: manufacturerId });
    return documents.map((doc) => DrugInfoMapper.toDomain(doc));
  }

  async save(drugInfo) {
    const document = DrugInfoMapper.toPersistence(drugInfo);

    // Check if it's a valid MongoDB ObjectId (existing document)
    const isObjectId = drugInfo.id && drugInfo.id.length === 24 && /^[0-9a-fA-F]{24}$/.test(drugInfo.id);

    if (isObjectId && document._id) {
      // Existing document - update
      const updated = await DrugInfoModel.findByIdAndUpdate(
        document._id,
        { $set: document },
        { new: true, runValidators: true }
      );
      return DrugInfoMapper.toDomain(updated);
    } else {
      // New document - create
      const created = await DrugInfoModel.create(document);
      return DrugInfoMapper.toDomain(created);
    }
  }

  async delete(id) {
    await DrugInfoModel.findByIdAndDelete(id);
    return true;
  }

  async findAll(filters = {}) {
    const query = {};
    
    // Filter by status
    if (filters.status) {
      query.status = filters.status;
    } else {
      // Default to active if no status filter
      query.status = "active";
    }

    const documents = await DrugInfoModel.find(query).populate("manufacturer", "name");
    return documents.map((doc) => DrugInfoMapper.toDomain(doc));
  }
}

