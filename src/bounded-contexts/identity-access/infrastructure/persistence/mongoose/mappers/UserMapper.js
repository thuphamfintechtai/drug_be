import { User } from "../../../../domain/aggregates/User.js";

export class UserMapper {
  static toDomain(document) {
    if (!document) {
      return null;
    }

    return new User(
      document._id.toString(),
      document.username,
      document.email,
      document.password,
      document.role,
      document.status,
      document.fullName,
      document.phone,
      document.country,
      document.address,
      document.walletAddress,
      document.avatar,
      document.pharmaCompany?.toString() || null,
      document.distributor?.toString() || null,
      document.pharmacy?.toString() || null,
      document.isAdmin || false
    );
  }

  static toPersistence(aggregate) {
    if (!aggregate) {
      return null;
    }

    const document = {
      _id: aggregate.id,
      username: aggregate.username,
      email: aggregate.email,
      password: aggregate.passwordHash,
      role: aggregate.role,
      status: aggregate.status,
      fullName: aggregate.fullName,
      phone: aggregate.phone,
      country: aggregate.country,
      address: aggregate.address,
      walletAddress: aggregate.walletAddress,
      avatar: aggregate.avatar,
      isAdmin: aggregate.isAdmin,
      pharmaCompany: aggregate.pharmaCompanyId || undefined,
      distributor: aggregate.distributorId || undefined,
      pharmacy: aggregate.pharmacyId || undefined,
      updatedAt: aggregate.updatedAt || new Date(),
    };

    // Only include _id if it's a new document (MongoDB will generate)
    if (!aggregate.id || aggregate.id === "undefined") {
      delete document._id;
    }

    return document;
  }
}

