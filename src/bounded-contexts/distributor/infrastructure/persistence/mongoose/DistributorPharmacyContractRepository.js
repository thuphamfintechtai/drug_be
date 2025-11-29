import { IDistributorPharmacyContractRepository } from "../../../domain/repositories/IDistributorPharmacyContractRepository.js";
import { DistributorPharmacyContractModel } from "./schemas/DistributorPharmacyContractSchema.js";
import { DistributorPharmacyContractMapper } from "./mappers/DistributorPharmacyContractMapper.js";
import mongoose from "mongoose";

export class DistributorPharmacyContractRepository extends IDistributorPharmacyContractRepository {
  async save(contract, options = {}) {
    const { session } = options;
    const document = DistributorPharmacyContractMapper.toPersistence(contract);
    
    if (document._id) {
      // Update existing contract
      const updateOptions = { new: true, runValidators: true };
      if (session) {
        updateOptions.session = session;
      }
      
      const updated = await DistributorPharmacyContractModel.findByIdAndUpdate(
        document._id,
        { $set: document },
        updateOptions
      );
      return DistributorPharmacyContractMapper.toDomain(updated);
    } else {
      // Create new contract - check duplicate trước khi tạo
      const { DistributorModel } = await import("../../../../registration/infrastructure/persistence/mongoose/schemas/BusinessEntitySchemas.js");
      
      // Normalize distributorId để check duplicate (có thể là userId hoặc entityId)
      // Nhưng lưu userId vào contract (không normalize khi lưu)
      let distributorEntity = await DistributorModel.findById(document.distributor).lean();
      if (!distributorEntity) {
        distributorEntity = await DistributorModel.findOne({ user: document.distributor }).lean();
      }
      const normalizedDistributorId = distributorEntity ? distributorEntity._id.toString() : document.distributor;
      
      // Check duplicate với cả user ID và entity ID (để tìm được contract dù lưu userId hay entityId)
      const existingQuery = {
        $or: [
          { distributor: normalizedDistributorId },
          { distributor: document.distributor }
        ],
        pharmacy: document.pharmacy,
      };
      
      // Query với session nếu có
      let existingQueryBuilder = DistributorPharmacyContractModel.findOne(existingQuery);
      if (session) {
        existingQueryBuilder = existingQueryBuilder.session(session);
      }
      const existing = await existingQueryBuilder;
      
      if (existing) {
        // Contract đã tồn tại, update thay vì tạo mới
        const updateOptions = { new: true, runValidators: true };
        if (session) {
          updateOptions.session = session;
        }
        
        // Giữ nguyên distributorId (userId) khi update
        const updated = await DistributorPharmacyContractModel.findByIdAndUpdate(
          existing._id,
          { $set: document },
          updateOptions
        );
        return DistributorPharmacyContractMapper.toDomain(updated);
      }
      
      // Tạo mới contract với userId (không normalize)
      // document.distributor đã là userId từ CreateContractRequestUseCase
      
      let created;
      if (session) {
        created = await DistributorPharmacyContractModel.create([document], { session });
      } else {
        created = await DistributorPharmacyContractModel.create([document]);
      }
      const savedDoc = created[0] || created;
      return DistributorPharmacyContractMapper.toDomain(savedDoc);
    }
  }

  async findById(contractId) {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(contractId)) {
      return null;
    }
    
    // Query document gốc trước để lấy raw ObjectId (fallback nếu populate fail)
    const rawDocument = await DistributorPharmacyContractModel.findById(contractId).lean();
    if (!rawDocument) {
      return null;
    }
    
    // Query document với populate
    const document = await DistributorPharmacyContractModel.findById(contractId)
      .populate("distributor", "_id name licenseNo taxCode")
      .populate("pharmacy", "_id name licenseNo taxCode");
    
    // Convert sang plain object
    const docObj = document ? (document.toObject ? document.toObject() : { ...document }) : rawDocument;
    
    // Nếu populate fail (distributor/pharmacy là null), dùng raw ObjectId
    if (!docObj.distributor && rawDocument.distributor) {
      docObj.distributor = rawDocument.distributor;
    }
    
    if (!docObj.pharmacy && rawDocument.pharmacy) {
      docObj.pharmacy = rawDocument.pharmacy;
    }
    
    return DistributorPharmacyContractMapper.toDomain(docObj);
  }

  async findByDistributorAndPharmacy(distributorId, pharmacyId) {
    // Normalize distributorId: có thể là user ID hoặc entity ID
    const { DistributorModel } = await import("../../../../registration/infrastructure/persistence/mongoose/schemas/BusinessEntitySchemas.js");
    
    // Tìm distributor entity từ user ID hoặc entity ID
    let distributorEntity = await DistributorModel.findById(distributorId).lean();
    if (!distributorEntity) {
      distributorEntity = await DistributorModel.findOne({ user: distributorId }).lean();
    }
    
    // Nếu tìm thấy distributor entity, dùng entity ID để query
    // Nếu không tìm thấy, vẫn dùng distributorId gốc (có thể là entity ID hợp lệ)
    const normalizedDistributorId = distributorEntity ? distributorEntity._id.toString() : distributorId;
    
    // Query với cả user ID và entity ID để đảm bảo tìm thấy contract
    const document = await DistributorPharmacyContractModel.findOne({
      $or: [
        { distributor: normalizedDistributorId },
        { distributor: distributorId }
      ],
      pharmacy: pharmacyId,
    })
      .populate("distributor", "_id name licenseNo taxCode")
      .populate("pharmacy", "_id name licenseNo taxCode")
      .sort({ createdAt: -1 });
    return DistributorPharmacyContractMapper.toDomain(document);
  }

  async findByDistributor(distributorId, filters = {}) {
    const query = { distributor: distributorId };
    
    if (filters.status) {
      query.status = filters.status;
    }

    const documents = await DistributorPharmacyContractModel.find(query)
      .populate("distributor", "_id name licenseNo taxCode")
      .populate("pharmacy", "_id name licenseNo taxCode")
      .sort({ createdAt: -1 });

    return documents.map(doc => DistributorPharmacyContractMapper.toDomain(doc));
  }

  async findByPharmacy(pharmacyId, filters = {}) {
    const query = { pharmacy: pharmacyId };
    
    if (filters.status) {
      query.status = filters.status;
    }

    const documents = await DistributorPharmacyContractModel.find(query)
      .populate("distributor", "_id name licenseNo taxCode")
      .populate("pharmacy", "_id name licenseNo taxCode")
      .sort({ createdAt: -1 });

    return documents.map(doc => DistributorPharmacyContractMapper.toDomain(doc));
  }

  async delete(contractId) {
    await DistributorPharmacyContractModel.findByIdAndDelete(contractId);
    return true;
  }
}

