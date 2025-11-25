import { IDistributorPharmacyContractRepository } from "../../../domain/repositories/IDistributorPharmacyContractRepository.js";
import { DistributorPharmacyContractModel } from "./schemas/DistributorPharmacyContractSchema.js";
import { DistributorPharmacyContractMapper } from "./mappers/DistributorPharmacyContractMapper.js";
import mongoose from "mongoose";

export class DistributorPharmacyContractRepository extends IDistributorPharmacyContractRepository {
  async save(contract) {
    const document = DistributorPharmacyContractMapper.toPersistence(contract);
    
    if (document._id) {
      const updated = await DistributorPharmacyContractModel.findByIdAndUpdate(
        document._id,
        { $set: document },
        { new: true, runValidators: true }
      );
      return DistributorPharmacyContractMapper.toDomain(updated);
    } else {
      const created = await DistributorPharmacyContractModel.create(document);
      return DistributorPharmacyContractMapper.toDomain(created);
    }
  }

  async findById(contractId) {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(contractId)) {
      return null;
    }
    
    // Query document gốc trước để lấy raw ObjectId (fallback nếu populate fail)
    const rawDocument = await DistributorPharmacyContractModel.findById(contractId).lean();
    if (!rawDocument) {
      return null;
    }
    
    // Query document với populate
    const document = await DistributorPharmacyContractModel.findById(contractId)
      .populate("distributor", "_id name licenseNo taxCode")
      .populate("pharmacy", "_id name licenseNo taxCode");
    
    // Convert sang plain object
    const docObj = document ? (document.toObject ? document.toObject() : { ...document }) : rawDocument;
    
    // Nếu populate fail (distributor/pharmacy là null), dùng raw ObjectId
    if (!docObj.distributor && rawDocument.distributor) {
      docObj.distributor = rawDocument.distributor;
    }
    
    if (!docObj.pharmacy && rawDocument.pharmacy) {
      docObj.pharmacy = rawDocument.pharmacy;
    }
    
    return DistributorPharmacyContractMapper.toDomain(docObj);
  }

  async findByDistributorAndPharmacy(distributorId, pharmacyId) {
    const document = await DistributorPharmacyContractModel.findOne({
      distributor: distributorId,
      pharmacy: pharmacyId,
    })
      .populate("distributor", "_id name licenseNo taxCode")
      .populate("pharmacy", "_id name licenseNo taxCode")
      .sort({ createdAt: -1 });
    return DistributorPharmacyContractMapper.toDomain(document);
  }

  async findByDistributor(distributorId, filters = {}) {
    const query = { distributor: distributorId };
    
    if (filters.status) {
      query.status = filters.status;
    }

    const documents = await DistributorPharmacyContractModel.find(query)
      .populate("distributor", "_id name licenseNo taxCode")
      .populate("pharmacy", "_id name licenseNo taxCode")
      .sort({ createdAt: -1 });

    return documents.map(doc => DistributorPharmacyContractMapper.toDomain(doc));
  }

  async findByPharmacy(pharmacyId, filters = {}) {
    const query = { pharmacy: pharmacyId };
    
    if (filters.status) {
      query.status = filters.status;
    }

    const documents = await DistributorPharmacyContractModel.find(query)
      .populate("distributor", "_id name licenseNo taxCode")
      .populate("pharmacy", "_id name licenseNo taxCode")
      .sort({ createdAt: -1 });

    return documents.map(doc => DistributorPharmacyContractMapper.toDomain(doc));
  }

  async delete(contractId) {
    await DistributorPharmacyContractModel.findByIdAndDelete(contractId);
    return true;
  }
}

