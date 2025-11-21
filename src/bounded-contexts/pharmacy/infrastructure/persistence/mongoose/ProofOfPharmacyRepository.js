import { IProofOfPharmacyRepository } from "../../../domain/repositories/IProofOfPharmacyRepository.js";
import { ProofOfPharmacyModel } from "./schemas/ProofOfPharmacySchema.js";
import { ProofOfPharmacyMapper } from "./mappers/ProofOfPharmacyMapper.js";
import mongoose from "mongoose";

export class ProofOfPharmacyRepository extends IProofOfPharmacyRepository {
  async findById(id) {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    
    const document = await ProofOfPharmacyModel.findById(id)
      .populate("fromDistributor")
      .populate("toPharmacy")
      .populate("commercialInvoice")
      .populate("proofOfDistribution")
      .populate("nftInfo")
      .populate("drug");
    return ProofOfPharmacyMapper.toDomain(document);
  }

  async findByPharmacy(pharmacyId, filters = {}) {
    let query = { toPharmacy: pharmacyId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.batchNumber) {
      query.batchNumber = filters.batchNumber;
    }

    // Support date range filtering
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.createdAt.$lte = filters.endDate;
      }
    }

    const documents = await ProofOfPharmacyModel.find(query)
      .populate("fromDistributor")
      .populate("toPharmacy")
      .populate("commercialInvoice")
      .populate("proofOfDistribution")
      .populate("nftInfo")
      .populate("drug")
      .sort({ createdAt: -1 });

    return documents.map(doc => ProofOfPharmacyMapper.toDomain(doc));
  }

  async findByDistributor(distributorId, filters = {}) {
    let query = { fromDistributor: distributorId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.batchNumber) {
      query.batchNumber = filters.batchNumber;
    }

    const documents = await ProofOfPharmacyModel.find(query)
      .populate("fromDistributor")
      .populate("toPharmacy")
      .populate("commercialInvoice")
      .populate("proofOfDistribution")
      .populate("nftInfo")
      .populate("drug")
      .sort({ createdAt: -1 });

    return documents.map(doc => ProofOfPharmacyMapper.toDomain(doc));
  }

  async findByCommercialInvoice(invoiceId) {
    const documents = await ProofOfPharmacyModel.find({ commercialInvoice: invoiceId })
      .populate("fromDistributor")
      .populate("toPharmacy")
      .populate("commercialInvoice")
      .populate("proofOfDistribution")
      .populate("nftInfo")
      .populate("drug")
      .sort({ createdAt: -1 });
    return documents.map(doc => ProofOfPharmacyMapper.toDomain(doc));
  }

  async save(proofOfPharmacy) {
    const document = ProofOfPharmacyMapper.toPersistence(proofOfPharmacy);

    const isObjectId = proofOfPharmacy.id && proofOfPharmacy.id.length === 24 && /^[0-9a-fA-F]{24}$/.test(proofOfPharmacy.id);

    if (isObjectId && document._id) {
      const updated = await ProofOfPharmacyModel.findByIdAndUpdate(
        document._id,
        { $set: document },
        { new: true, runValidators: true }
      )
        .populate("fromDistributor")
        .populate("toPharmacy")
        .populate("commercialInvoice")
        .populate("proofOfDistribution")
        .populate("nftInfo")
        .populate("drug");
      return ProofOfPharmacyMapper.toDomain(updated);
    } else {
      const created = await ProofOfPharmacyModel.create(document);
      const saved = await ProofOfPharmacyModel.findById(created._id)
        .populate("fromDistributor")
        .populate("toPharmacy")
        .populate("commercialInvoice")
        .populate("proofOfDistribution")
        .populate("nftInfo")
        .populate("drug");
      return ProofOfPharmacyMapper.toDomain(saved);
    }
  }

  async delete(id) {
    await ProofOfPharmacyModel.findByIdAndDelete(id);
    return true;
  }
}

