import { IDistributorPharmacyContractRepository } from "../../../domain/repositories/IDistributorPharmacyContractRepository.js";
import { DistributorPharmacyContractModel } from "./schemas/DistributorPharmacyContractSchema.js";
import { DistributorPharmacyContractMapper } from "./mappers/DistributorPharmacyContractMapper.js";

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
    const document = await DistributorPharmacyContractModel.findById(contractId)
      .populate("distributor", "name licenseNo taxCode")
      .populate("pharmacy", "name licenseNo taxCode");
    return DistributorPharmacyContractMapper.toDomain(document);
  }

  async findByDistributorAndPharmacy(distributorId, pharmacyId) {
    const document = await DistributorPharmacyContractModel.findOne({
      distributor: distributorId,
      pharmacy: pharmacyId,
    })
      .populate("distributor", "name licenseNo taxCode")
      .populate("pharmacy", "name licenseNo taxCode")
      .sort({ createdAt: -1 });
    return DistributorPharmacyContractMapper.toDomain(document);
  }

  async findByDistributor(distributorId, filters = {}) {
    const query = { distributor: distributorId };
    
    if (filters.status) {
      query.status = filters.status;
    }

    const documents = await DistributorPharmacyContractModel.find(query)
      .populate("distributor", "name licenseNo taxCode")
      .populate("pharmacy", "name licenseNo taxCode")
      .sort({ createdAt: -1 });

    return documents.map(doc => DistributorPharmacyContractMapper.toDomain(doc));
  }

  async findByPharmacy(pharmacyId, filters = {}) {
    const query = { pharmacy: pharmacyId };
    
    if (filters.status) {
      query.status = filters.status;
    }

    const documents = await DistributorPharmacyContractModel.find(query)
      .populate("distributor", "name licenseNo taxCode")
      .populate("pharmacy", "name licenseNo taxCode")
      .sort({ createdAt: -1 });

    return documents.map(doc => DistributorPharmacyContractMapper.toDomain(doc));
  }

  async delete(contractId) {
    await DistributorPharmacyContractModel.findByIdAndDelete(contractId);
    return true;
  }
}

