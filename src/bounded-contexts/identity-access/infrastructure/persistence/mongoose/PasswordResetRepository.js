import { IPasswordResetRepository } from "../../../domain/repositories/IPasswordResetRepository.js";
import PasswordResetModel from "./schemas/PasswordResetSchema.js";

/**
 * Mongoose implementation of IPasswordResetRepository
 */
export class PasswordResetRepository extends IPasswordResetRepository {
  async findById(id) {
    const document = await PasswordResetModel.findById(id)
      .populate("user", "username email fullName role")
      .populate("reviewedBy", "username email");
    return document ? this._toDomain(document) : null;
  }

  async findByToken(token) {
    const document = await PasswordResetModel.findOne({ token })
      .populate("user", "username email fullName role");
    return document ? this._toDomain(document) : null;
  }

  async findByUserId(userId, filters = {}) {
    const query = { user: userId };
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.used !== undefined) {
      query.used = filters.used;
    }
    const documents = await PasswordResetModel.find(query)
      .populate("user", "username email fullName role")
      .populate("reviewedBy", "username email")
      .sort({ createdAt: -1 });
    return documents.map(doc => this._toDomain(doc));
  }

  async findAll(filters = {}) {
    const query = {};
    
    if (filters.used !== undefined) {
      query.used = filters.used === "true" || filters.used === true;
    }
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.expired === "true") {
      query.expiresAt = { $lt: new Date() };
    } else if (filters.expired === "false") {
      query.expiresAt = { $gte: new Date() };
    }

    const documents = await PasswordResetModel.find(query)
      .populate("user", "username email fullName role")
      .populate("reviewedBy", "username email")
      .populate({
        path: "user",
        populate: [
          { path: "pharmaCompany", select: "name licenseNo taxCode" },
          { path: "distributor", select: "name licenseNo taxCode" },
          { path: "pharmacy", select: "name licenseNo taxCode" },
        ],
      })
      .sort({ createdAt: -1 });

    let results = documents.map(doc => this._toDomain(doc));

    // Filter theo role nếu có
    if (filters.role) {
      results = results.filter(req => req.user && req.user.role === filters.role);
    }

    return results;
  }

  async create(data) {
    // Create a plain object that will be used to create domain entity
    return {
      id: null,
      userId: data.userId,
      token: data.token,
      expiresAt: data.expiresAt,
      used: false,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      verificationInfo: data.verificationInfo || null,
      status: "pending",
      reviewedBy: null,
      reviewedAt: null,
      newPassword: null,
    };
  }

  async save(passwordReset) {
    const document = {
      user: passwordReset.userId,
      token: passwordReset.token,
      expiresAt: passwordReset.expiresAt,
      used: passwordReset.used || false,
      ipAddress: passwordReset.ipAddress,
      userAgent: passwordReset.userAgent,
      verificationInfo: passwordReset.verificationInfo,
      status: passwordReset.status || "pending",
      reviewedBy: passwordReset.reviewedBy,
      reviewedAt: passwordReset.reviewedAt,
      newPassword: passwordReset.newPassword,
    };

    const isObjectId = passwordReset.id && passwordReset.id.length === 24 && /^[0-9a-fA-F]{24}$/.test(passwordReset.id);

    if (isObjectId && passwordReset.id) {
      const updated = await PasswordResetModel.findByIdAndUpdate(
        passwordReset.id,
        { $set: document },
        { new: true, runValidators: true }
      )
        .populate("user", "username email fullName role")
        .populate("reviewedBy", "username email");
      return this._toDomain(updated);
    } else {
      const created = await PasswordResetModel.create(document);
      const saved = await PasswordResetModel.findById(created._id)
        .populate("user", "username email fullName role")
        .populate("reviewedBy", "username email");
      return this._toDomain(saved);
    }
  }

  async delete(id) {
    await PasswordResetModel.findByIdAndDelete(id);
    return true;
  }

  async deletePendingByUserId(userId) {
    await PasswordResetModel.deleteMany({
      user: userId,
      used: false,
      status: "pending",
    });
    return true;
  }

  async count(filters = {}) {
    const query = {};
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.used !== undefined) {
      query.used = filters.used;
    }
    return await PasswordResetModel.countDocuments(query);
  }

  _toDomain(document) {
    if (!document) return null;

    return {
      id: document._id.toString(),
      userId: document.user?._id?.toString() || document.user?.toString(),
      token: document.token,
      expiresAt: document.expiresAt,
      used: document.used,
      ipAddress: document.ipAddress,
      userAgent: document.userAgent,
      verificationInfo: document.verificationInfo,
      status: document.status,
      reviewedBy: document.reviewedBy?._id?.toString() || document.reviewedBy?.toString() || null,
      reviewedAt: document.reviewedAt,
      newPassword: document.newPassword,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      // Populated data
      user: document.user ? {
        id: document.user._id?.toString() || document.user.toString(),
        username: document.user.username,
        email: document.user.email,
        fullName: document.user.fullName,
        role: document.user.role,
        pharmaCompany: document.user.pharmaCompany,
        distributor: document.user.distributor,
        pharmacy: document.user.pharmacy,
      } : null,
      reviewedByUser: document.reviewedBy ? {
        id: document.reviewedBy._id?.toString() || document.reviewedBy.toString(),
        username: document.reviewedBy.username,
        email: document.reviewedBy.email,
      } : null,
      // Helper methods
      markAsUsed() {
        this.used = true;
      },
      approve(reviewedBy, newPassword = null) {
        this.status = "approved";
        this.reviewedBy = reviewedBy;
        this.reviewedAt = new Date();
        if (newPassword) {
          this.newPassword = newPassword;
        }
      },
      reject(reviewedBy) {
        this.status = "rejected";
        this.reviewedBy = reviewedBy;
        this.reviewedAt = new Date();
      },
    };
  }
}

