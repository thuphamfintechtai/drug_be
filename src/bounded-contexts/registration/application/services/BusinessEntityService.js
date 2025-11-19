import { BusinessEntityFactory } from "../infrastructure/persistence/BusinessEntityFactory.js";

/**
 * Application service for business entity operations
 * Provides business profile retrieval for users
 */
export class BusinessEntityService {
  constructor(businessEntityRepository, businessEntityFactory) {
    this._businessEntityRepository = businessEntityRepository;
    this._businessEntityFactory = businessEntityFactory;
  }

  /**
   * Get business profile for a user
   * @param {User} user - User domain entity
   * @returns {Object|null} Formatted business profile or null if not found
   */
  async getBusinessProfile(user) {
    if (!user || !user.roleVO) {
      return null;
    }

    // Only for business roles
    if (!["pharma_company", "distributor", "pharmacy"].includes(user.role)) {
      return null;
    }

    try {
      // Get business entity using old BusinessEntityFactory from services
      // This uses the old Mongoose models
      const BusinessEntityFactoryOld = (await import("../../../../services/factories/BusinessEntityFactory.js")).BusinessEntityFactory;
      
      // Convert domain user to plain object for old factory
      const userObj = {
        _id: user.id,
        role: user.role,
        pharmaCompany: user.pharmaCompanyId,
        distributor: user.distributorId,
        pharmacy: user.pharmacyId,
      };

      const businessEntity = await BusinessEntityFactoryOld.getBusinessEntity(userObj);
      
      if (!businessEntity) {
        return null;
      }

      // Format profile
      const formattedProfile = BusinessEntityFactoryOld.formatBusinessProfile(businessEntity);
      
      // Add walletAddress from user if available
      if (formattedProfile && user.walletAddress) {
        formattedProfile.walletAddress = user.walletAddress;
      }

      return formattedProfile;
    } catch (error) {
      // If business entity not found, return null (not an error)
      console.log(`Business entity not found for user ${user.id} with role ${user.role}`);
      return null;
    }
  }
}

