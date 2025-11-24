import { IManufacturerInvoiceRepository } from "../../../domain/repositories/IManufacturerInvoiceRepository.js";
import { ManufacturerInvoiceModel } from "./schemas/ManufacturerInvoiceSchema.js";
import { ManufacturerInvoiceMapper } from "./mappers/ManufacturerInvoiceMapper.js";
import mongoose from "mongoose";

export class ManufacturerInvoiceRepository extends IManufacturerInvoiceRepository {
  async findById(id) {
    if (!id) {
      return null;
    }

    let document = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      document = await ManufacturerInvoiceModel.findById(id)
        .populate("fromManufacturer")
        .populate("toDistributor")
        .populate("drug")
        .populate("proofOfProduction")
        .populate("nftInfo");
    }

    if (!document) {
      document = await ManufacturerInvoiceModel.findOne({ externalId: id })
        .populate("fromManufacturer")
        .populate("toDistributor")
        .populate("drug")
        .populate("proofOfProduction")
        .populate("nftInfo");
    }

    return ManufacturerInvoiceMapper.toDomain(document);
  }

  async findByInvoiceNumber(invoiceNumber) {
    const document = await ManufacturerInvoiceModel.findOne({ invoiceNumber })
      .populate("fromManufacturer")
      .populate("toDistributor")
      .populate("drug")
      .populate("proofOfProduction")
      .populate("nftInfo");
    return ManufacturerInvoiceMapper.toDomain(document);
  }

  async findByManufacturer(manufacturerId, filters = {}) {
    let query = { fromManufacturer: manufacturerId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.search) {
      query.$or = [
        { invoiceNumber: { $regex: filters.search, $options: "i" } },
        { batchNumber: { $regex: filters.search, $options: "i" } },
      ];
    }

    const documents = await ManufacturerInvoiceModel.find(query)
      .populate("fromManufacturer")
      .populate("toDistributor")
      .populate("drug")
      .populate("proofOfProduction")
      .populate("nftInfo")
      .sort({ createdAt: -1 });

    return documents.map(doc => ManufacturerInvoiceMapper.toDomain(doc));
  }

  async findByDistributor(distributorId, filters = {}) {
    // Ensure distributorId is converted to ObjectId if it's a valid ObjectId string
    let queryDistributorId = distributorId;
    if (mongoose.Types.ObjectId.isValid(distributorId)) {
      queryDistributorId = new mongoose.Types.ObjectId(distributorId);
    }
    
    let query = { toDistributor: queryDistributorId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.search) {
      query.$or = [
        { invoiceNumber: { $regex: filters.search, $options: "i" } },
        { batchNumber: { $regex: filters.search, $options: "i" } },
      ];
    }

    // Get raw documents first to preserve ObjectIds even if populate fails
    const rawDocuments = await ManufacturerInvoiceModel.find(query)
      .lean()
      .sort({ createdAt: -1 });

    // Then get populated documents
    const documents = await ManufacturerInvoiceModel.find(query)
      .populate("fromManufacturer")
      .populate("toDistributor")
      .populate("drug")
      .populate("proofOfProduction")
      .populate("nftInfo")
      .sort({ createdAt: -1 });

    // Merge: use populated data if available, otherwise use raw ObjectId
    return documents.map((doc, index) => {
      const rawDoc = rawDocuments[index];
      // If populate returned null, restore original ObjectId from raw document
      if (!doc.fromManufacturer && rawDoc && rawDoc.fromManufacturer) {
        doc.fromManufacturer = rawDoc.fromManufacturer;
      }
      if (!doc.toDistributor && rawDoc && rawDoc.toDistributor) {
        doc.toDistributor = rawDoc.toDistributor;
      }
      if (!doc.drug && rawDoc && rawDoc.drug) {
        doc.drug = rawDoc.drug;
      }
      return ManufacturerInvoiceMapper.toDomain(doc);
    });
  }

  async findByDrug(drugId) {
    const documents = await ManufacturerInvoiceModel.find({ drug: drugId })
      .populate("fromManufacturer")
      .populate("toDistributor")
      .populate("drug")
      .populate("proofOfProduction")
      .populate("nftInfo")
      .sort({ createdAt: -1 });
    return documents.map(doc => ManufacturerInvoiceMapper.toDomain(doc));
  }

  async save(invoice) {
    const document = ManufacturerInvoiceMapper.toPersistence(invoice);

    const isObjectId = invoice.id && invoice.id.length === 24 && /^[0-9a-fA-F]{24}$/.test(invoice.id);

    if (isObjectId && document._id) {
      const updated = await ManufacturerInvoiceModel.findByIdAndUpdate(
        document._id,
        { $set: document },
        { new: true, runValidators: true }
      )
        .populate("fromManufacturer")
        .populate("toDistributor")
        .populate("drug")
        .populate("proofOfProduction")
        .populate("nftInfo");
      return ManufacturerInvoiceMapper.toDomain(updated);
    } else {
      const created = await ManufacturerInvoiceModel.create(document);
      const saved = await ManufacturerInvoiceModel.findById(created._id)
        .populate("fromManufacturer")
        .populate("toDistributor")
        .populate("drug")
        .populate("proofOfProduction")
        .populate("nftInfo");
      return ManufacturerInvoiceMapper.toDomain(saved);
    }
  }

  async delete(id) {
    await ManufacturerInvoiceModel.findByIdAndDelete(id);
    return true;
  }
}

