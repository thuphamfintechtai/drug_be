import { GetDrugDetailsDTO } from "../dto/GetDrugDetailsDTO.js";
import { DrugInfoModel } from "../../../supply-chain/infrastructure/persistence/mongoose/schemas/DrugInfoSchema.js";
import { NFTInfoModel } from "../../../supply-chain/infrastructure/persistence/mongoose/schemas/NFTInfoSchema.js";
import { ProofOfProductionModel } from "../../../supply-chain/infrastructure/persistence/mongoose/schemas/ProofOfProductionSchema.js";
import { ManufacturerInvoiceModel } from "../../../supply-chain/infrastructure/persistence/mongoose/schemas/ManufacturerInvoiceSchema.js";
import { CommercialInvoiceModel } from "../../../distributor/infrastructure/persistence/mongoose/schemas/CommercialInvoiceSchema.js";

export class GetDrugDetailsUseCase {
  constructor(drugInfoRepository) {
    this._drugInfoRepository = drugInfoRepository;
  }

  async execute(dto) {
    dto.validate();

    const drug = await DrugInfoModel.findById(dto.drugId)
      .populate("manufacturer", "name licenseNo taxCode country address contactEmail contactPhone walletAddress status");

    if (!drug) {
      throw new Error("Không tìm thấy thuốc");
    }

    // Lấy thông tin NFTs liên quan
    const nfts = await NFTInfoModel.find({ drug: dto.drugId })
      .select("tokenId serialNumber batchNumber status owner createdAt chainTxHash mfgDate expDate quantity unit")
      .populate("owner", "username email fullName role");

    // Lấy lịch sử sản xuất
    const productionHistory = await ProofOfProductionModel.find({ drug: dto.drugId })
      .populate("manufacturer", "name licenseNo")
      .sort({ createdAt: -1 });

    // Lấy lịch sử chuyển giao cho distributor
    const manufacturerInvoices = await ManufacturerInvoiceModel.find({})
      .populate({
        path: "proofOfProduction",
        match: { drug: dto.drugId },
        populate: { path: "drug" },
      })
      .populate("fromManufacturer", "username email fullName")
      .populate("toDistributor", "username email fullName")
      .sort({ createdAt: -1 });

    const filteredManufacturerInvoices = manufacturerInvoices.filter(
      (invoice) => invoice.proofOfProduction && invoice.proofOfProduction.drug
    );

    // Lấy lịch sử chuyển giao cho pharmacy
    const commercialInvoices = await CommercialInvoiceModel.find({ drug: dto.drugId })
      .populate("fromDistributor", "username email fullName")
      .populate("toPharmacy", "username email fullName")
      .populate("nftInfo")
      .sort({ createdAt: -1 });

    // Thống kê NFT theo status
    const nftStats = {
      total: nfts.length,
      byStatus: {
        minted: nfts.filter((nft) => nft.status === "minted").length,
        transferred: nfts.filter((nft) => nft.status === "transferred").length,
        sold: nfts.filter((nft) => nft.status === "sold").length,
        expired: nfts.filter((nft) => nft.status === "expired").length,
        recalled: nfts.filter((nft) => nft.status === "recalled").length,
      },
    };

    // Thống kê số lượng đã sản xuất
    const totalProduced = productionHistory.reduce((sum, prod) => sum + (prod.quantity || 0), 0);

    return {
      drug,
      nfts,
      nftStats,
      productionHistory,
      manufacturerInvoices: filteredManufacturerInvoices,
      commercialInvoices,
      statistics: {
        totalProduced,
        totalNFTs: nfts.length,
        totalManufacturerInvoices: filteredManufacturerInvoices.length,
        totalCommercialInvoices: commercialInvoices.length,
      },
    };
  }
}

