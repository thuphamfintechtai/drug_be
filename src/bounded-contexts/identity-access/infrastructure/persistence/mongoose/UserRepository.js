import { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import { UserModel } from "./schemas/UserSchema.js";
import { UserMapper } from "./mappers/UserMapper.js";
import mongoose from "mongoose";

export class UserRepository extends IUserRepository {
  async findById(id) {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    
    const document = await UserModel.findById(id);
    return UserMapper.toDomain(document);
  }

  async findByEmail(email) {
    const document = await UserModel.findOne({ email: email.toLowerCase().trim() });
    return UserMapper.toDomain(document);
  }

  async findByUsername(username) {
    const document = await UserModel.findOne({ username });
    return UserMapper.toDomain(document);
  }

  async findByEmailOrUsername(email, username) {
    const document = await UserModel.findOne({
      $or: [{ email: email.toLowerCase().trim() }, { username }],
    });
    return UserMapper.toDomain(document);
  }

  async save(user) {
    const document = UserMapper.toPersistence(user);

    if (user.id && !user.id.includes("-")) {
      // Existing document - update
      const updated = await UserModel.findByIdAndUpdate(
        user.id,
        { $set: document },
        { new: true, runValidators: true }
      );
      return UserMapper.toDomain(updated);
    } else {
      // New document - create
      const created = await UserModel.create(document);
      return UserMapper.toDomain(created);
    }
  }

  async delete(id) {
    await UserModel.findByIdAndDelete(id);
    return true;
  }

  async count() {
    return await UserModel.countDocuments();
  }

  async countByRole(role) {
    return await UserModel.countDocuments({ role });
  }

  async countByStatus(status) {
    return await UserModel.countDocuments({ status });
  }

  async findAll(query = {}, options = {}) {
    const { skip = 0, limit = 10 } = options;
    const documents = await UserModel.find(query)
      .select("-password")
      .populate("pharmaCompany", "name licenseNo taxCode")
      .populate("distributor", "name licenseNo taxCode")
      .populate("pharmacy", "name licenseNo taxCode")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    return documents.map(doc => UserMapper.toDomain(doc));
  }

  async count(query = {}) {
    return await UserModel.countDocuments(query);
  }
}

