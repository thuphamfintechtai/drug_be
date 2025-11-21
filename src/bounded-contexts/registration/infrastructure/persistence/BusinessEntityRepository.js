import { IBusinessEntityRepository } from "../../domain/repositories/IBusinessEntityRepository.js";
import {
  PharmaCompanyModel,
  DistributorModel,
  PharmacyModel,
} from "./mongoose/schemas/BusinessEntitySchemas.js";

export class BusinessEntityRepository extends IBusinessEntityRepository {
  async findByLicenseNo(licenseNo) {
    // Check all entity types
    let entity = await PharmaCompanyModel.findOne({ licenseNo });
    if (entity) return { type: "pharma_company", entity };

    entity = await DistributorModel.findOne({ licenseNo });
    if (entity) return { type: "distributor", entity };

    entity = await PharmacyModel.findOne({ licenseNo });
    if (entity) return { type: "pharmacy", entity };

    return null;
  }

  async findByTaxCode(taxCode) {
    // Check all entity types
    let entity = await PharmaCompanyModel.findOne({ taxCode });
    if (entity) return { type: "pharma_company", entity };

    entity = await DistributorModel.findOne({ taxCode });
    if (entity) return { type: "distributor", entity };

    entity = await PharmacyModel.findOne({ taxCode });
    if (entity) return { type: "pharmacy", entity };

    return null;
  }

  async findByLicenseNoOrTaxCode(licenseNo, taxCode) {
    const byLicense = await this.findByLicenseNo(licenseNo);
    if (byLicense) return byLicense;

    const byTax = await this.findByTaxCode(taxCode);
    if (byTax) return byTax;

    return null;
  }

  async findByUserId(userId, role) {
    switch (role) {
      case "pharma_company":
        return await PharmaCompanyModel.findOne({ user: userId });
      case "distributor":
        return await DistributorModel.findOne({ user: userId });
      case "pharmacy":
        return await PharmacyModel.findOne({ user: userId });
      default:
        return null;
    }
  }

  async save(businessEntity) {
    // Business entity is already saved by BusinessEntityFactory
    // This method is here for interface compliance
    return businessEntity;
  }

  async countPharmaCompanies() {
    return await PharmaCompanyModel.countDocuments();
  }

  async countDistributors() {
    return await DistributorModel.countDocuments();
  }

  async countPharmacies() {
    return await PharmacyModel.countDocuments();
  }
}

