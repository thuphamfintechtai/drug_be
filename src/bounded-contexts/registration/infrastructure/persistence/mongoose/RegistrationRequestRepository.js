import { IRegistrationRequestRepository } from "../../../domain/repositories/IRegistrationRequestRepository.js";
import { RegistrationRequestModel } from "./schemas/RegistrationRequestSchema.js";
import { RegistrationRequestMapper } from "./mappers/RegistrationRequestMapper.js";

export class RegistrationRequestRepository extends IRegistrationRequestRepository {
  async findById(id) {
    const document = await RegistrationRequestModel.findById(id).populate("user");
    return RegistrationRequestMapper.toDomain(document);
  }

  async findByUserId(userId) {
    const documents = await RegistrationRequestModel.find({ user: userId });
    return documents.map((doc) => RegistrationRequestMapper.toDomain(doc));
  }

  async findByStatus(status) {
    const documents = await RegistrationRequestModel.find({ status });
    return documents.map((doc) => RegistrationRequestMapper.toDomain(doc));
  }

  async findByRole(role) {
    const documents = await RegistrationRequestModel.find({ role });
    return documents.map((doc) => RegistrationRequestMapper.toDomain(doc));
  }

  async findByLicenseNoOrTaxCode(licenseNo, taxCode) {
    const document = await RegistrationRequestModel.findOne({
      $or: [
        { "companyInfo.licenseNo": licenseNo },
        { "companyInfo.taxCode": taxCode },
      ],
    });
    return RegistrationRequestMapper.toDomain(document);
  }

  async save(registrationRequest) {
    const document = RegistrationRequestMapper.toPersistence(registrationRequest);

    if (registrationRequest.id && !registrationRequest.id.includes("-")) {
      // Existing document - update
      const updated = await RegistrationRequestModel.findByIdAndUpdate(
        registrationRequest.id,
        { $set: document },
        { new: true, runValidators: true }
      );
      return RegistrationRequestMapper.toDomain(updated);
    } else {
      // New document - create
      const created = await RegistrationRequestModel.create(document);
      return RegistrationRequestMapper.toDomain(created);
    }
  }

  async delete(id) {
    await RegistrationRequestModel.findByIdAndDelete(id);
    return true;
  }

  async count() {
    return await RegistrationRequestModel.countDocuments();
  }

  async countByStatus(status) {
    return await RegistrationRequestModel.countDocuments({ status });
  }

  async countByRole(role) {
    return await RegistrationRequestModel.countDocuments({ role });
  }

  async countSinceDate(date) {
    return await RegistrationRequestModel.countDocuments({
      createdAt: { $gte: date },
    });
  }

  async findAll(filters = {}) {
    const query = {};
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.role) {
      query.role = filters.role;
    }

    const documents = await RegistrationRequestModel.find(query)
      .populate("user", "username email fullName walletAddress")
      .populate("reviewedBy", "username email")
      .sort({ createdAt: -1 });
    
    return documents.map((doc) => RegistrationRequestMapper.toDomain(doc));
  }

  async findWithUserDetails(id) {
    const document = await RegistrationRequestModel.findById(id)
      .populate("user", "username email fullName walletAddress phone country address")
      .populate("reviewedBy", "username email");
    
    return RegistrationRequestMapper.toDomain(document);
  }
}

