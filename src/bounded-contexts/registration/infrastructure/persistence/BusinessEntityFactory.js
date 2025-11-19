// Infrastructure implementation of BusinessEntityFactory
// This creates actual Mongoose documents for business entities
import {
  PharmaCompanyModel,
  DistributorModel,
  PharmacyModel,
} from "./mongoose/schemas/BusinessEntitySchemas.js";
import crypto from "crypto";

export class BusinessEntityFactory {
  constructor() {}

  async createBusinessEntity(user, role, companyInfo, blockchainResult = null) {
    if (!user || !role) {
      throw new Error("User và role là bắt buộc");
    }

    const baseInfo = {
      user: user.id || user._id,
      name: companyInfo.name || user.fullName || "",
      licenseNo: companyInfo.licenseNo,
      taxCode: companyInfo.taxCode,
      address: companyInfo.address || user.address || "",
      country: companyInfo.country || user.country || "",
      contactEmail: companyInfo.contactEmail || user.email || "",
      contactPhone: companyInfo.contactPhone || user.phone || "",
      walletAddress: user.walletAddress,
      status: "active",
    };

    let entity;

    switch (role) {
      case "pharma_company": {
        entity = new PharmaCompanyModel({
          ...baseInfo,
          gmpCertNo: companyInfo.gmpCertNo || "",
        });
        break;
      }

      case "distributor": {
        entity = new DistributorModel({
          ...baseInfo,
        });
        break;
      }

      case "pharmacy": {
        entity = new PharmacyModel({
          ...baseInfo,
        });
        break;
      }

      default:
        throw new Error(`Role không hợp lệ: ${role}`);
    }

    await entity.save();

    // Return entity with additional helper methods to match domain expectations
    return {
      id: entity._id.toString(),
      _id: entity._id,
      name: entity.name,
      licenseNo: entity.licenseNo,
      taxCode: entity.taxCode,
      status: entity.status,
      gmpCertNo: entity.gmpCertNo,
      ...entity.toObject(),
    };
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

