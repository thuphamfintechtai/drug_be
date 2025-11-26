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
        .populate("fromDistributor")
        .populate("toPharmacy")
        .populate("drug")
        .populate("proofOfPharmacy")
        .populate("nftInfo");
      return CommercialInvoiceMapper.toDomain(document);
    }

    // If not ObjectId, try to find by invoiceNumber (for backward compatibility)
    // This handles cases where UUID was used as invoiceId
    const document = await CommercialInvoiceModel.findOne({ invoiceNumber: id })
      .populate("fromDistributor")
      .populate("toPharmacy")
      .populate("drug")
      .populate("proofOfPharmacy")
      .populate("nftInfo");
    return CommercialInvoiceMapper.toDomain(document);
  }

  async findByInvoiceNumber(invoiceNumber) {
    const document = await CommercialInvoiceModel.findOne({ invoiceNumber })
      .populate("fromDistributor")
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
      .populate("fromDistributor")
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
      .populate("fromDistributor")
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

  async save(invoice, options = {}) {
    const document = CommercialInvoiceMapper.toPersistence(invoice);
    const { session } = options;

    const isObjectId = invoice.id && invoice.id.length === 24 && /^[0-9a-fA-F]{24}$/.test(invoice.id);

    if (isObjectId && document._id) {
      const updateOptions = { new: true, runValidators: true };
      if (session) {
        updateOptions.session = session;
      }
      
      const updated = await CommercialInvoiceModel.findByIdAndUpdate(
        document._id,
        { $set: document },
        updateOptions
      )
        .populate("fromDistributor")
        .populate("toPharmacy")
        .populate("drug")
        .populate("proofOfPharmacy")
        .populate("nftInfo");
      return CommercialInvoiceMapper.toDomain(updated);
    } else {
      let created;
      if (session) {
        created = await CommercialInvoiceModel.create([document], { session });
      } else {
        created = await CommercialInvoiceModel.create([document]);
      }
      const savedDoc = created[0] || created;
      const saved = await CommercialInvoiceModel.findById(savedDoc._id)
        .populate("fromDistributor")
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

