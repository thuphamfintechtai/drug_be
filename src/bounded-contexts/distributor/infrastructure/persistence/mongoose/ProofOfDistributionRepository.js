import { IProofOfDistributionRepository } from "../../../domain/repositories/IProofOfDistributionRepository.js";
import { ProofOfDistributionModel } from "./schemas/ProofOfDistributionSchema.js";
import { ProofOfDistributionMapper } from "./mappers/ProofOfDistributionMapper.js";
import mongoose from "mongoose";

export class ProofOfDistributionRepository extends IProofOfDistributionRepository {
  async findById(id) {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    
    const document = await ProofOfDistributionModel.findById(id)
      .populate("fromManufacturer")
      .populate("toDistributor")
      .populate("manufacturerInvoice")
      .populate("proofOfProduction")
      .populate("nftInfo");
    return ProofOfDistributionMapper.toDomain(document);
  }

  async findByDistributor(distributorId, filters = {}) {
    let query = { toDistributor: distributorId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.batchNumber) {
      query.batchNumber = filters.batchNumber;
    }

    const documents = await ProofOfDistributionModel.find(query)
      .populate("fromManufacturer")
      .populate("toDistributor")
      .populate("manufacturerInvoice")
      .populate("proofOfProduction")
      .populate("nftInfo")
      .sort({ createdAt: -1 });

    return documents.map(doc => ProofOfDistributionMapper.toDomain(doc));
  }

  async findByManufacturer(manufacturerId, filters = {}) {
    let query = { fromManufacturer: manufacturerId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.batchNumber) {
      query.batchNumber = filters.batchNumber;
    }

    const documents = await ProofOfDistributionModel.find(query)
      .populate("fromDistributor")
      .populate("toDistributor")
      .populate("manufacturerInvoice")
      .populate("proofOfProduction")
      .populate("nftInfo")
      .sort({ createdAt: -1 });

    return documents.map(doc => ProofOfDistributionMapper.toDomain(doc));
  }

  async findByManufacturerInvoice(invoiceId) {
    const documents = await ProofOfDistributionModel.find({ manufacturerInvoice: invoiceId })
      .populate("fromManufacturer")
      .populate("toDistributor")
      .populate("manufacturerInvoice")
      .populate("proofOfProduction")
      .populate("nftInfo")
      .sort({ createdAt: -1 });
    return documents.map(doc => ProofOfDistributionMapper.toDomain(doc));
  }

  async save(proofOfDistribution) {
    const document = ProofOfDistributionMapper.toPersistence(proofOfDistribution);

    const isObjectId = proofOfDistribution.id && proofOfDistribution.id.length === 24 && /^[0-9a-fA-F]{24}$/.test(proofOfDistribution.id);

    if (isObjectId && document._id) {
      const updated = await ProofOfDistributionModel.findByIdAndUpdate(
        document._id,
        { $set: document },
        { new: true, runValidators: true }
      )
        .populate("fromManufacturer")
        .populate("toDistributor")
        .populate("manufacturerInvoice")
        .populate("proofOfProduction")
        .populate("nftInfo");
      return ProofOfDistributionMapper.toDomain(updated);
    } else {
      const created = await ProofOfDistributionModel.create(document);
      const saved = await ProofOfDistributionModel.findById(created._id)
        .populate("fromManufacturer")
        .populate("toDistributor")
        .populate("manufacturerInvoice")
        .populate("proofOfProduction")
        .populate("nftInfo");
      return ProofOfDistributionMapper.toDomain(saved);
    }
  }

  async delete(id) {
    await ProofOfDistributionModel.findByIdAndDelete(id);
    return true;
  }
}

