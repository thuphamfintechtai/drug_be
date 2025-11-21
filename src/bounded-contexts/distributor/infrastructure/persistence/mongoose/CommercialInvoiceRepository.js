import { ICommercialInvoiceRepository } from "../../../domain/repositories/ICommercialInvoiceRepository.js";
import { CommercialInvoiceModel } from "./schemas/CommercialInvoiceSchema.js";
import { CommercialInvoiceMapper } from "./mappers/CommercialInvoiceMapper.js";

export class CommercialInvoiceRepository extends ICommercialInvoiceRepository {
  async findById(id) {
    const document = await CommercialInvoiceModel.findById(id)
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
      .populate("toPharmacy")
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
      .populate("toPharmacy")
      .populate("drug")
      .populate("proofOfPharmacy")
      .populate("nftInfo")
      .sort({ createdAt: -1 });

    return documents.map(doc => CommercialInvoiceMapper.toDomain(doc));
  }

  async save(invoice) {
    const document = CommercialInvoiceMapper.toPersistence(invoice);

    const isObjectId = invoice.id && invoice.id.length === 24 && /^[0-9a-fA-F]{24}$/.test(invoice.id);

    if (isObjectId && document._id) {
      const updated = await CommercialInvoiceModel.findByIdAndUpdate(
        document._id,
        { $set: document },
        { new: true, runValidators: true }
      )
        .populate("fromDistributor")
        .populate("toPharmacy")
        .populate("drug")
        .populate("proofOfPharmacy")
        .populate("nftInfo");
      return CommercialInvoiceMapper.toDomain(updated);
    } else {
      const created = await CommercialInvoiceModel.create(document);
      const saved = await CommercialInvoiceModel.findById(created._id)
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

