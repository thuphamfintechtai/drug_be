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
    let drug = null;

    // Try to find by ObjectId first
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      const document = await DrugInfoModel.findById(identifier).populate("manufacturer");
      if (document) {
        drug = DrugInfoMapper.toDomain(document);
      }
    }

    // Try to find by ATC code if not found yet
    if (!drug) {
      const atcDocument = await DrugInfoModel.findOne({ atcCode: identifier.toUpperCase() }).populate("manufacturer");
      if (atcDocument) {
        drug = DrugInfoMapper.toDomain(atcDocument);
      }
    }

    // Try to extract ATC code from format like "VITAMIN C (N19092005)" if not found yet
    if (!drug) {
      const match = identifier.match(/\(([^)]+)\)/);
      if (match && match[1]) {
        const extractedCode = match[1].trim();
        const codeDocument = await DrugInfoModel.findOne({ atcCode: extractedCode.toUpperCase() }).populate("manufacturer");
        if (codeDocument) {
          drug = DrugInfoMapper.toDomain(codeDocument);
        }
      }
    }

    // Try to find by tradeName (exact match or contains) if not found yet
    if (!drug) {
      // Extract name part before parentheses if exists
      const namePart = identifier.split('(')[0].trim();
      
      const nameQuery = {
        $or: [
          { tradeName: namePart },
          { tradeName: identifier },
          { tradeName: { $regex: namePart, $options: "i" } },
          { tradeName: { $regex: identifier, $options: "i" } },
          { genericName: { $regex: namePart, $options: "i" } },
          { genericName: { $regex: identifier, $options: "i" } }
        ]
      };

      const nameDocument = await DrugInfoModel.findOne(nameQuery).populate("manufacturer");
      if (nameDocument) {
        drug = DrugInfoMapper.toDomain(nameDocument);
      }
    }

    // If drug found and manufacturerId is provided, verify ownership
    if (drug && manufacturerId) {
      const drugManufacturerId = String(drug.manufacturerId || "");
      const userManufacturerId = String(manufacturerId || "");
      if (drugManufacturerId !== userManufacturerId) {
        // Return null if ownership doesn't match (will throw permission error in use case)
        return null;
      }
    }

    return drug;
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

