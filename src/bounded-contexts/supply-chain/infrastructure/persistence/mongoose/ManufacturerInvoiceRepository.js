import { IManufacturerInvoiceRepository } from "../../../domain/repositories/IManufacturerInvoiceRepository.js";
import { ManufacturerInvoiceModel } from "./schemas/ManufacturerInvoiceSchema.js";
import { ManufacturerInvoiceMapper } from "./mappers/ManufacturerInvoiceMapper.js";

export class ManufacturerInvoiceRepository extends IManufacturerInvoiceRepository {
  async findById(id) {
    const document = await ManufacturerInvoiceModel.findById(id)
      .populate("fromManufacturer")
      .populate("toDistributor")
      .populate("drug")
      .populate("proofOfProduction")
      .populate("nftInfo");
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
    let query = { toDistributor: distributorId };

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

