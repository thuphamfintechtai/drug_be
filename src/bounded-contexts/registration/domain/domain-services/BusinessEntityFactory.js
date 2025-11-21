// This is a domain service that creates business entities
// The actual implementations will be in infrastructure layer
export class BusinessEntityFactory {
  constructor(businessEntityRepository) {
    this._businessEntityRepository = businessEntityRepository;
  }

  async createBusinessEntity(user, role, companyInfo, blockchainResult) {
    // This method will be implemented in infrastructure layer
    // as it needs to interact with repositories
    throw new Error("createBusinessEntity must be implemented in infrastructure layer");
  }

  static formatBusinessProfile(entity) {
    if (!entity) return null;

    return {
      id: entity.id || entity._id,
      name: entity.name,
      licenseNo: entity.licenseNo,
      taxCode: entity.taxCode,
      status: entity.status,
      ...(entity.gmpCertNo && { gmpCertNo: entity.gmpCertNo }),
    };
  }
}

