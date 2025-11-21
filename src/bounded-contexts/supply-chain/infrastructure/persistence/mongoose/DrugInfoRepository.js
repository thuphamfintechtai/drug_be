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

