import { BusinessEntityFactory } from "../../infrastructure/persistence/BusinessEntityFactory.js";

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
      // Use businessEntityRepository to find entity by userId and role
      const businessEntity = await this._businessEntityRepository.findByUserId(user.id, user.role);
      
      if (!businessEntity) {
        return null;
      }

      // Format profile using BusinessEntityFactory
      const formattedProfile = BusinessEntityFactory.formatBusinessProfile(businessEntity);
      
      // Add walletAddress from user if available
      if (formattedProfile && user.walletAddress) {
        formattedProfile.walletAddress = user.walletAddress;
      }

      return formattedProfile;
    } catch (error) {
      // If business entity not found, return null (not an error)
      console.log(`Business entity not found for user ${user.id} with role ${user.role}:`, error.message);
      return null;
    }
  }
}

