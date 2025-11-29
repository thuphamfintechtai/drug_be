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

    // Support search functionality
    if (filters.search) {
      const searchRegex = { $regex: filters.search, $options: "i" };
      const searchConditions = [
        { batchNumber: searchRegex },
      ];
      
      // Search in drug names - we'll need to find drug IDs first
      if (filters.search) {
        const { DrugInfoModel } = await import("../../../../supply-chain/infrastructure/persistence/mongoose/schemas/DrugInfoSchema.js");
        const matchingDrugs = await DrugInfoModel.find({
          $or: [
            { tradeName: searchRegex },
            { genericName: searchRegex },
            { atcCode: searchRegex },
          ],
        }).select("_id").lean();
        
        if (matchingDrugs.length > 0) {
          searchConditions.push({ drug: { $in: matchingDrugs.map(d => d._id) } });
        }
      }
      
      // Search in commercial invoice numbers
      const { CommercialInvoiceModel } = await import("../../../../distributor/infrastructure/persistence/mongoose/schemas/CommercialInvoiceSchema.js");
      const matchingInvoices = await CommercialInvoiceModel.find({
        invoiceNumber: searchRegex,
      }).select("_id").lean();
      
      if (matchingInvoices.length > 0) {
        searchConditions.push({ commercialInvoice: { $in: matchingInvoices.map(inv => inv._id) } });
      }
      
      if (searchConditions.length > 0) {
        query.$or = searchConditions;
      }
    }

    // Get total count before pagination
    const total = await ProofOfPharmacyModel.countDocuments(query);

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const skip = (page - 1) * limit;

    const documents = await ProofOfPharmacyModel.find(query)
      .populate("fromDistributor", "fullName username email")
      .populate("toPharmacy", "fullName username email")
      .populate("verifiedBy", "fullName username email")
      .populate("commercialInvoice", "invoiceNumber")
      .populate("proofOfDistribution")
      .populate("nftInfo")
      .populate("drug", "tradeName genericName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() to get plain objects for easier manipulation

    return {
      documents,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
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

