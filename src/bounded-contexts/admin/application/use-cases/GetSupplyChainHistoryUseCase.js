import { GetSupplyChainHistoryDTO } from "../dto/GetSupplyChainHistoryDTO.js";
import { ProofOfProductionModel } from "../../../supply-chain/infrastructure/persistence/mongoose/schemas/ProofOfProductionSchema.js";
import { ManufacturerInvoiceModel } from "../../../supply-chain/infrastructure/persistence/mongoose/schemas/ManufacturerInvoiceSchema.js";
import { ProofOfDistributionModel } from "../../../distributor/infrastructure/persistence/mongoose/schemas/ProofOfDistributionSchema.js";
import { CommercialInvoiceModel } from "../../../distributor/infrastructure/persistence/mongoose/schemas/CommercialInvoiceSchema.js";
import { ProofOfPharmacyModel } from "../../../pharmacy/infrastructure/persistence/mongoose/schemas/ProofOfPharmacySchema.js";
import { NFTInfoModel } from "../../../supply-chain/infrastructure/persistence/mongoose/schemas/NFTInfoSchema.js";

export class GetSupplyChainHistoryUseCase {
  async execute(dto) {
    dto.validate();

    const filter = {};

    if (dto.drugId) {
      filter.drug = dto.drugId;
    }

    if (dto.status) {
      filter.status = dto.status;
    }

    if (dto.startDate || dto.endDate) {
      filter.createdAt = {};
      if (dto.startDate) {
        filter.createdAt.$gte = dto.startDate;
      }
      if (dto.endDate) {
        filter.createdAt.$lte = dto.endDate;
      }
    }

    // Lấy lịch sử từ tất cả các stages
    const supplyChainHistory = [];

    // 1. Proof of Production (Manufacturing)
    const productions = await ProofOfProductionModel.find(
      dto.drugId ? { drug: dto.drugId } : {}
    )
      .populate("manufacturer", "name licenseNo")
      .populate("drug", "tradeName atcCode")
      .sort({ createdAt: -1 })
      .skip(dto.getSkip())
      .limit(dto.limit);

    for (const production of productions) {
      supplyChainHistory.push({
        stage: "manufacturing",
        stageName: "Sản xuất",
        id: production._id,
        drug: production.drug,
        manufacturer: production.manufacturer,
        quantity: production.quantity,
        mfgDate: production.mfgDate,
        expDate: production.expDate,
        chainTxHash: production.chainTxHash,
        createdAt: production.createdAt,
      });
    }

    // 2. Manufacturer Invoice (Manufacturer → Distributor)
    const manufacturerInvoices = await ManufacturerInvoiceModel.find(filter)
      .populate("fromManufacturer", "username email fullName")
      .populate("toDistributor", "username email fullName")
      .populate("nftInfo")
      .populate({
        path: "proofOfProduction",
        populate: { path: "drug", select: "tradeName atcCode" },
      })
      .sort({ createdAt: -1 })
      .skip(dto.getSkip())
      .limit(dto.limit);

    for (const invoice of manufacturerInvoices) {
      supplyChainHistory.push({
        stage: "transfer_to_distributor",
        stageName: "Chuyển giao cho Nhà phân phối",
        id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        drug: invoice.proofOfProduction?.drug || null,
        fromManufacturer: invoice.fromManufacturer,
        toDistributor: invoice.toDistributor,
        quantity: invoice.quantity,
        status: invoice.status,
        chainTxHash: invoice.chainTxHash,
        createdAt: invoice.createdAt,
      });
    }

    // 3. Proof of Distribution (Distributor received)
    const distributions = await ProofOfDistributionModel.find({})
      .populate("fromManufacturer", "username email fullName")
      .populate("toDistributor", "username email fullName")
      .populate("manufacturerInvoice")
      .sort({ createdAt: -1 })
      .skip(dto.getSkip())
      .limit(dto.limit);

    for (const distribution of distributions) {
      supplyChainHistory.push({
        stage: "distributor_received",
        stageName: "Nhà phân phối đã nhận hàng",
        id: distribution._id,
        fromManufacturer: distribution.fromManufacturer,
        toDistributor: distribution.toDistributor,
        distributedQuantity: distribution.distributedQuantity,
        distributionDate: distribution.distributionDate,
        status: distribution.status,
        chainTxHash: distribution.chainTxHash,
        createdAt: distribution.createdAt,
      });
    }

    // 4. Commercial Invoice (Distributor → Pharmacy)
    const commercialInvoices = await CommercialInvoiceModel.find(filter)
      .populate("fromDistributor", "username email fullName")
      .populate("toPharmacy", "username email fullName")
      .populate("drug", "tradeName atcCode")
      .populate("nftInfo")
      .sort({ createdAt: -1 })
      .skip(dto.getSkip())
      .limit(dto.limit);

    for (const invoice of commercialInvoices) {
      supplyChainHistory.push({
        stage: "transfer_to_pharmacy",
        stageName: "Chuyển giao cho Nhà thuốc",
        id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        drug: invoice.drug,
        fromDistributor: invoice.fromDistributor,
        toPharmacy: invoice.toPharmacy,
        quantity: invoice.quantity,
        status: invoice.status,
        chainTxHash: invoice.chainTxHash,
        createdAt: invoice.createdAt,
      });
    }

    // 5. Proof of Pharmacy (Pharmacy received)
    const pharmacyProofs = await ProofOfPharmacyModel.find({})
      .populate("fromDistributor", "username email fullName")
      .populate("toPharmacy", "username email fullName")
      .populate("commercialInvoice")
      .sort({ createdAt: -1 })
      .skip(dto.getSkip())
      .limit(dto.limit);

    for (const proof of pharmacyProofs) {
      supplyChainHistory.push({
        stage: "pharmacy_received",
        stageName: "Nhà thuốc đã nhận hàng",
        id: proof._id,
        fromDistributor: proof.fromDistributor,
        toPharmacy: proof.toPharmacy,
        receivedQuantity: proof.receivedQuantity,
        receiptDate: proof.receiptDate,
        status: proof.status,
        receiptTxHash: proof.receiptTxHash,
        supplyChainCompleted: proof.supplyChainCompleted,
        createdAt: proof.createdAt,
      });
    }

    // Sắp xếp theo thời gian
    supplyChainHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Nếu có tokenId, filter theo tokenId
    let filteredHistory = supplyChainHistory;
    if (dto.tokenId) {
      const nft = await NFTInfoModel.findOne({ tokenId: dto.tokenId });
      if (nft) {
        filteredHistory = supplyChainHistory.filter((item) => {
          if (item.drug && item.drug._id) {
            return item.drug._id.toString() === nft.drug.toString();
          }
          return false;
        });
      }
    }

    return {
      history: filteredHistory.slice(0, dto.limit),
      pagination: {
        page: dto.page,
        limit: dto.limit,
        total: filteredHistory.length,
        pages: Math.ceil(filteredHistory.length / dto.limit),
      },
    };
  }
}

