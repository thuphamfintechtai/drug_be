export class IBusinessEntityRepository {
  async findByLicenseNo(licenseNo) {
    throw new Error("findByLicenseNo method must be implemented");
  }

  async findByTaxCode(taxCode) {
    throw new Error("findByTaxCode method must be implemented");
  }

  async findByLicenseNoOrTaxCode(licenseNo, taxCode) {
    throw new Error("findByLicenseNoOrTaxCode method must be implemented");
  }

  async findByUserId(userId, role) {
    throw new Error("findByUserId method must be implemented");
  }

  async save(businessEntity) {
    throw new Error("save method must be implemented");
  }

  async countPharmaCompanies() {
    throw new Error("countPharmaCompanies method must be implemented");
  }

  async countDistributors() {
    throw new Error("countDistributors method must be implemented");
  }

  async countPharmacies() {
    throw new Error("countPharmacies method must be implemented");
  }
}

