import { IProofOfProductionRepository } from "../../../domain/repositories/IProofOfProductionRepository.js";
import { ProofOfProductionModel } from "./schemas/ProofOfProductionSchema.js";
import { ProofOfProductionMapper } from "./mappers/ProofOfProductionMapper.js";

export class ProofOfProductionRepository extends IProofOfProductionRepository {
  async findById(id) {
    const document = await ProofOfProductionModel.findById(id)
      .populate("manufacturer")
      .populate("drug");
    return ProofOfProductionMapper.toDomain(document);
  }

  async findByManufacturer(manufacturerId) {
    const documents = await ProofOfProductionModel.find({ manufacturer: manufacturerId })
      .populate("manufacturer")
      .populate("drug")
      .sort({ createdAt: -1 });
    return documents.map(doc => ProofOfProductionMapper.toDomain(doc));
  }

  async findByDrug(drugId) {
    const documents = await ProofOfProductionModel.find({ drug: drugId })
      .populate("manufacturer")
      .populate("drug")
      .sort({ createdAt: -1 });
    return documents.map(doc => ProofOfProductionMapper.toDomain(doc));
  }

  async findByBatchNumber(batchNumber) {
    const documents = await ProofOfProductionModel.find({ batchNumber })
      .populate("manufacturer")
      .populate("drug")
      .sort({ createdAt: -1 });
    return documents.map(doc => ProofOfProductionMapper.toDomain(doc));
  }

  async save(proofOfProduction) {
    const document = ProofOfProductionMapper.toPersistence(proofOfProduction);

    const isObjectId = proofOfProduction.id && proofOfProduction.id.length === 24 && /^[0-9a-fA-F]{24}$/.test(proofOfProduction.id);

    if (isObjectId && document._id) {
      const updated = await ProofOfProductionModel.findByIdAndUpdate(
        document._id,
        { $set: document },
        { new: true, runValidators: true }
      )
        .populate("manufacturer")
        .populate("drug");
      return ProofOfProductionMapper.toDomain(updated);
    } else {
      const created = await ProofOfProductionModel.create(document);
      const saved = await ProofOfProductionModel.findById(created._id)
        .populate("manufacturer")
        .populate("drug");
      return ProofOfProductionMapper.toDomain(saved);
    }
  }

  async delete(id) {
    await ProofOfProductionModel.findByIdAndDelete(id);
    return true;
  }
}

