import { RegistrationRequest } from "../../../../domain/aggregates/RegistrationRequest.js";
import { CompanyInfo } from "../../../../domain/entities/CompanyInfo.js";
import crypto from "crypto";

export class RegistrationRequestMapper {
  static toDomain(document) {
    if (!document) {
      return null;
    }

    const companyInfo = document.companyInfo
      ? CompanyInfo.create(
          crypto.randomUUID(), // Temporary ID for entity
          document.companyInfo.name || "",
          document.companyInfo.licenseNo || "",
          document.companyInfo.taxCode || "",
          document.companyInfo.address || "",
          document.companyInfo.country || "",
          document.companyInfo.contactEmail || "",
          document.companyInfo.contactPhone || "",
          document.companyInfo.gmpCertNo || ""
        )
      : null;

    // Preserve populated user and reviewedBy objects for response
    const userId = document.user?._id ? document.user._id.toString() : (document.user?.toString() || document.user);
    const reviewedById = document.reviewedBy?._id ? document.reviewedBy._id.toString() : (document.reviewedBy?.toString() || document.reviewedBy || null);

    const request = new RegistrationRequest(
      document._id.toString(),
      userId,
      document.role,
      companyInfo,
      document.status,
      reviewedById,
      document.reviewedAt || null,
      document.rejectionReason || null,
      document.contractAddress || null,
      document.transactionHash || null,
      document.blockchainRetryCount || 0,
      document.blockchainLastAttempt || null
    );

    // Store populated objects for response
    if (document.user && typeof document.user === 'object' && !document.user._id) {
      // Already an object
      request._populatedUser = document.user;
    } else if (document.user && typeof document.user === 'object') {
      // Populated object
      request._populatedUser = {
        _id: document.user._id,
        username: document.user.username,
        email: document.user.email,
        fullName: document.user.fullName,
        walletAddress: document.user.walletAddress,
        phone: document.user.phone,
        country: document.user.country,
        address: document.user.address,
      };
    }

    if (document.reviewedBy && typeof document.reviewedBy === 'object') {
      request._populatedReviewedBy = {
        _id: document.reviewedBy._id,
        username: document.reviewedBy.username,
        email: document.reviewedBy.email,
      };
    }

    // Store timestamps from document
    if (document.createdAt) {
      request._createdAt = document.createdAt;
    }
    if (document.updatedAt) {
      request._updatedAt = document.updatedAt;
    }

    return request;
  }

  static toPersistence(aggregate) {
    if (!aggregate) {
      return null;
    }

    const document = {
      _id: aggregate.id,
      user: aggregate.userId,
      role: aggregate.role,
      status: aggregate.status,
      companyInfo: aggregate.companyInfo
        ? {
            name: aggregate.companyInfo.name,
            licenseNo: aggregate.companyInfo.licenseNo,
            taxCode: aggregate.companyInfo.taxCode,
            address: aggregate.companyInfo.address,
            country: aggregate.companyInfo.country,
            contactEmail: aggregate.companyInfo.contactEmail,
            contactPhone: aggregate.companyInfo.contactPhone,
            gmpCertNo: aggregate.companyInfo.gmpCertNo || "",
          }
        : null,
      reviewedBy: aggregate.reviewedBy || undefined,
      reviewedAt: aggregate.reviewedAt || undefined,
      rejectionReason: aggregate.rejectionReason || undefined,
      contractAddress: aggregate.contractAddress || undefined,
      transactionHash: aggregate.transactionHash || undefined,
      blockchainRetryCount: aggregate.blockchainRetryCount || 0,
      blockchainLastAttempt: aggregate.blockchainLastAttempt || undefined,
      updatedAt: aggregate.updatedAt || new Date(),
    };

    // Only include _id if it's a new document
    if (!aggregate.id || aggregate.id === "undefined" || aggregate.id.includes("-")) {
      delete document._id;
    }

    return document;
  }
}

