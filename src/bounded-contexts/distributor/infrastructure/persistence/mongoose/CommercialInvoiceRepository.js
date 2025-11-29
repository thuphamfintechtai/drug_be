import { ICommercialInvoiceRepository } from "../../../domain/repositories/ICommercialInvoiceRepository.js";
import { CommercialInvoiceModel } from "./schemas/CommercialInvoiceSchema.js";
import { CommercialInvoiceMapper } from "./mappers/CommercialInvoiceMapper.js";
import mongoose from "mongoose";

export class CommercialInvoiceRepository extends ICommercialInvoiceRepository {
  async findById(id) {
    if (!id) {
      return null;
    }

    // Try to find by ObjectId first
    if (mongoose.Types.ObjectId.isValid(id)) {
      const document = await CommercialInvoiceModel.findById(id)
        .populate({
          path: "fromDistributor",
          populate: {
            path: "distributor",
            model: "Distributor",
          },
        })
        .populate("toPharmacy")
        .populate("drug")
        .populate("proofOfPharmacy")
        .populate("nftInfo");
      return CommercialInvoiceMapper.toDomain(document);
    }

    // If not ObjectId, try to find by invoiceNumber (for backward compatibility)
    // This handles cases where UUID was used as invoiceId
      const document = await CommercialInvoiceModel.findOne({ invoiceNumber: id })
        .populate({
          path: "fromDistributor",
          populate: {
            path: "distributor",
            model: "Distributor",
          },
        })
        .populate("toPharmacy")
        .populate("drug")
        .populate("proofOfPharmacy")
        .populate("nftInfo");
    return CommercialInvoiceMapper.toDomain(document);
  }

  async findByInvoiceNumber(invoiceNumber) {
    const document = await CommercialInvoiceModel.findOne({ invoiceNumber })
      .populate({
        path: "fromDistributor",
        populate: {
          path: "distributor",
          model: "Distributor",
        },
      })
      .populate("toPharmacy")
      .populate("drug")
      .populate("proofOfPharmacy")
      .populate("nftInfo");
    return CommercialInvoiceMapper.toDomain(document);
  }

  async findByDistributor(distributorId, filters = {}) {
    let query = { fromDistributor: distributorId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.search) {
      query.$or = [
        { invoiceNumber: { $regex: filters.search, $options: "i" } },
        { batchNumber: { $regex: filters.search, $options: "i" } },
      ];
    }

    const documents = await CommercialInvoiceModel.find(query)
      .populate({
        path: "fromDistributor",
        populate: {
          path: "distributor",
          model: "Distributor",
        },
      })
      .populate({
        path: "toPharmacy",
        populate: {
          path: "pharmacy",
          model: "Pharmacy",
        },
      })
      .populate("drug")
      .populate("proofOfPharmacy")
      .populate("nftInfo")
      .sort({ createdAt: -1 });

    return documents.map(doc => CommercialInvoiceMapper.toDomain(doc));
  }

  async findByPharmacy(pharmacyId, filters = {}) {
    let query = { toPharmacy: pharmacyId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.search) {
      query.$or = [
        { invoiceNumber: { $regex: filters.search, $options: "i" } },
        { batchNumber: { $regex: filters.search, $options: "i" } },
      ];
    }

    const documents = await CommercialInvoiceModel.find(query)
      .populate({
        path: "fromDistributor",
        populate: {
          path: "distributor",
          model: "Distributor",
        },
      })
      .populate({
        path: "toPharmacy",
        populate: {
          path: "pharmacy",
          model: "Pharmacy",
        },
      })
      .populate("drug")
      .populate("proofOfPharmacy")
      .populate("nftInfo")
      .sort({ createdAt: -1 });

    return documents.map(doc => CommercialInvoiceMapper.toDomain(doc));
  }

  /**
   * Tìm invoice có chứa tất cả tokenIds được chỉ định
   * @param {string} distributorId 
   * @param {string} pharmacyId 
   * @param {string} drugId 
   * @param {string[]} tokenIds 
   * @returns {Promise<CommercialInvoice|null>}
   */
  /**
   * Tính tổng số tokenIds đã chuyển cho pharmacy từ distributor với drug cụ thể
   * @param {string} distributorId 
   * @param {string} pharmacyId 
   * @param {string} drugId 
   * @returns {number} Tổng số tokenIds đã chuyển
   */
  async countTransferredTokenIds(distributorId, pharmacyId, drugId) {
    const documents = await CommercialInvoiceModel.find({
      fromDistributor: distributorId,
      toPharmacy: pharmacyId,
      drug: drugId,
      status: { $in: ["draft", "issued", "sent"] } // Chỉ tính các invoice đã được tạo/chuyển
    }).select("tokenIds");

    // Tính tổng số tokenIds từ tất cả invoices
    let totalCount = 0;
    for (const doc of documents) {
      if (doc.tokenIds && Array.isArray(doc.tokenIds)) {
        totalCount += doc.tokenIds.length;
      }
    }

    return totalCount;
  }

  async findByTokenIds(distributorId, pharmacyId, drugId, tokenIds) {
    if (!tokenIds || tokenIds.length === 0) {
      return null;
    }

    // Normalize tokenIds to strings
    const normalizedTokenIds = tokenIds.map(id => String(id).trim()).sort();
    
    // Tìm các invoice có chứa ít nhất một tokenId trong danh sách
    // Chỉ tìm invoice ở trạng thái draft hoặc issued (chưa sent) để tránh duplicate
    const documents = await CommercialInvoiceModel.find({
      fromDistributor: distributorId,
      toPharmacy: pharmacyId,
      drug: drugId,
      tokenIds: { $in: normalizedTokenIds },
      status: { $in: ["draft", "issued"] } // Chỉ check invoice chưa sent
    })
      .populate({
        path: "fromDistributor",
        populate: {
          path: "distributor",
          model: "Distributor",
        },
      })
      .populate("toPharmacy")
      .populate("drug")
      .populate("proofOfPharmacy")
      .populate("nftInfo")
      .sort({ createdAt: -1 });

    // Tìm invoice có chứa TẤT CẢ tokenIds (không thừa, không thiếu)
    for (const doc of documents) {
      const invoiceTokenIds = (doc.tokenIds || []).map(id => String(id).trim()).sort();
      
      // Check if invoice contains exactly the same tokenIds
      if (invoiceTokenIds.length === normalizedTokenIds.length &&
          invoiceTokenIds.every((tid, idx) => tid === normalizedTokenIds[idx])) {
        return CommercialInvoiceMapper.toDomain(doc);
      }
    }

    return null;
  }

  async save(invoice, options = {}) {
    const document = CommercialInvoiceMapper.toPersistence(invoice);
    const { session } = options;

    const isObjectId = invoice.id && invoice.id.length === 24 && /^[0-9a-fA-F]{24}$/.test(invoice.id);

    if (isObjectId && document._id) {
      // Update existing invoice
      const updateOptions = { new: true, runValidators: true };
      if (session) {
        updateOptions.session = session;
      }
      
      const updated = await CommercialInvoiceModel.findByIdAndUpdate(
        document._id,
        { $set: document },
        updateOptions
      )
        .populate({
          path: "fromDistributor",
          populate: {
            path: "distributor",
            model: "Distributor",
          },
        })
        .populate("toPharmacy")
        .populate("drug")
        .populate("proofOfPharmacy")
        .populate("nftInfo");
      return CommercialInvoiceMapper.toDomain(updated);
    } else {
      // Create new invoice
      // Check if invoiceNumber already exists to prevent duplicate
      if (document.invoiceNumber) {
        const existingQuery = { invoiceNumber: document.invoiceNumber };
        if (session) {
          // Use session for consistency
          const existing = await CommercialInvoiceModel.findOne(existingQuery).session(session);
          if (existing) {
            // Invoice với invoiceNumber này đã tồn tại, update thay vì tạo mới
            const updateOptions = { new: true, runValidators: true, session };
            
            const updated = await CommercialInvoiceModel.findByIdAndUpdate(
              existing._id,
              { $set: document },
              updateOptions
            )
              .populate({
                path: "fromDistributor",
                populate: {
                  path: "distributor",
                  model: "Distributor",
                },
              })
              .populate("toPharmacy")
              .populate("drug")
              .populate("proofOfPharmacy")
              .populate("nftInfo");
            return CommercialInvoiceMapper.toDomain(updated);
          }
        } else {
          const existing = await CommercialInvoiceModel.findOne(existingQuery);
          if (existing) {
            // Invoice với invoiceNumber này đã tồn tại, update thay vì tạo mới
            const updateOptions = { new: true, runValidators: true };
            
            const updated = await CommercialInvoiceModel.findByIdAndUpdate(
              existing._id,
              { $set: document },
              updateOptions
            )
              .populate({
                path: "fromDistributor",
                populate: {
                  path: "distributor",
                  model: "Distributor",
                },
              })
              .populate("toPharmacy")
              .populate("drug")
              .populate("proofOfPharmacy")
              .populate("nftInfo");
            return CommercialInvoiceMapper.toDomain(updated);
          }
        }
      }
      
      // Check for duplicate by tokenIds, distributor, pharmacy, drug (within transaction if session provided)
      const duplicateQuery = {
        fromDistributor: document.fromDistributor,
        toPharmacy: document.toPharmacy,
        drug: document.drug,
        tokenIds: { $all: document.tokenIds, $size: document.tokenIds.length },
        status: { $in: ["draft", "issued"] } // Chỉ check invoice chưa sent
      };
      
      if (session) {
        const existingByTokenIds = await CommercialInvoiceModel.findOne(duplicateQuery).session(session);
        if (existingByTokenIds) {
          // Invoice với cùng tokenIds đã tồn tại, update thay vì tạo mới
          const updateOptions = { new: true, runValidators: true, session };
          
          const updated = await CommercialInvoiceModel.findByIdAndUpdate(
            existingByTokenIds._id,
            { $set: document },
            updateOptions
          )
            .populate({
              path: "fromDistributor",
              populate: {
                path: "distributor",
                model: "Distributor",
              },
            })
            .populate("toPharmacy")
            .populate("drug")
            .populate("proofOfPharmacy")
            .populate("nftInfo");
          return CommercialInvoiceMapper.toDomain(updated);
        }
      } else {
        const existingByTokenIds = await CommercialInvoiceModel.findOne(duplicateQuery);
        if (existingByTokenIds) {
          // Invoice với cùng tokenIds đã tồn tại, update thay vì tạo mới
          const updateOptions = { new: true, runValidators: true };
          
          const updated = await CommercialInvoiceModel.findByIdAndUpdate(
            existingByTokenIds._id,
            { $set: document },
            updateOptions
          )
            .populate({
              path: "fromDistributor",
              populate: {
                path: "distributor",
                model: "Distributor",
              },
            })
            .populate("toPharmacy")
            .populate("drug")
            .populate("proofOfPharmacy")
            .populate("nftInfo");
          return CommercialInvoiceMapper.toDomain(updated);
        }
      }
      
      // Create new invoice - no duplicate found
      let created;
      if (session) {
        created = await CommercialInvoiceModel.create([document], { session });
      } else {
        created = await CommercialInvoiceModel.create([document]);
      }
      const savedDoc = created[0] || created;
      const saved = await CommercialInvoiceModel.findById(savedDoc._id)
        .populate({
          path: "fromDistributor",
          populate: {
            path: "distributor",
            model: "Distributor",
          },
        })
        .populate("toPharmacy")
        .populate("drug")
        .populate("proofOfPharmacy")
        .populate("nftInfo");
      return CommercialInvoiceMapper.toDomain(saved);
    }
  }

  async delete(id) {
    await CommercialInvoiceModel.findByIdAndDelete(id);
    return true;
  }
}

