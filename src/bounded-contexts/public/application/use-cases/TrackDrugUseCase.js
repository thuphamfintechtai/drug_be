import { TrackDrugDTO } from "../dto/TrackDrugDTO.js";

export class TrackDrugUseCase {
  constructor(
    nftRepository,
    drugInfoRepository,
    proofOfProductionRepository,
    proofOfDistributionRepository,
    proofOfPharmacyRepository,
    manufacturerInvoiceRepository,
    commercialInvoiceRepository,
    blockchainService,
    userRepository = null
  ) {
    this._nftRepository = nftRepository;
    this._drugInfoRepository = drugInfoRepository;
    this._proofOfProductionRepository = proofOfProductionRepository;
    this._proofOfDistributionRepository = proofOfDistributionRepository;
    this._proofOfPharmacyRepository = proofOfPharmacyRepository;
    this._manufacturerInvoiceRepository = manufacturerInvoiceRepository;
    this._commercialInvoiceRepository = commercialInvoiceRepository;
    this._blockchainService = blockchainService;
    this._userRepository = userRepository;
  }

  async execute(dto) {
    dto.validate();

    // Import models for direct queries (to match old logic)
    const { NFTInfoModel } = await import("../../../supply-chain/infrastructure/persistence/mongoose/schemas/NFTInfoSchema.js");
    const { ProofOfProductionModel } = await import("../../../supply-chain/infrastructure/persistence/mongoose/schemas/ProofOfProductionSchema.js");
    const { ManufacturerInvoiceModel } = await import("../../../supply-chain/infrastructure/persistence/mongoose/schemas/ManufacturerInvoiceSchema.js");
    const { ProofOfDistributionModel } = await import("../../../distributor/infrastructure/persistence/mongoose/schemas/ProofOfDistributionSchema.js");
    const { ProofOfPharmacyModel } = await import("../../../pharmacy/infrastructure/persistence/mongoose/schemas/ProofOfPharmacySchema.js");
    const { CommercialInvoiceModel } = await import("../../../distributor/infrastructure/persistence/mongoose/schemas/CommercialInvoiceSchema.js");
    const { PharmaCompanyModel } = await import("../../../registration/infrastructure/persistence/mongoose/schemas/BusinessEntitySchemas.js");

    // Find NFT with populated fields (like old logic)
    const nft = await NFTInfoModel.findOne({
      $or: [
        { tokenId: dto.tokenId },
        { serialNumber: dto.tokenId },
        { batchNumber: dto.tokenId }
      ]
    })
      .populate("drug", "tradeName atcCode genericName dosageForm strength packaging")
      .populate("owner", "username email fullName walletAddress")
      .populate("proofOfProduction")
      .lean();

    if (!nft) {
      throw new Error("Không tìm thấy NFT với tokenId này");
    }

    // Get blockchain history
    let blockchainHistory = [];
    try {
      blockchainHistory = await this._blockchainService.getTrackingHistory(nft.tokenId);
    } catch (error) {
      console.error("Lỗi khi lấy lịch sử blockchain:", error);
    }

    // Get production to have batchNumber
    let production = null;
    let batchNumber = nft.batchNumber;
    let productionId = null;

    if (nft.proofOfProduction) {
      productionId = nft.proofOfProduction._id || nft.proofOfProduction;
      
      if (nft.proofOfProduction._id) {
        production = nft.proofOfProduction;
      } else {
        production = await ProofOfProductionModel.findById(productionId).lean();
      }
      
      if (production && production.batchNumber) {
        batchNumber = production.batchNumber;
      }
    }

    // Find all NFTs in the same batch
    let batchNFTIds = [nft._id];
    if (batchNumber) {
      const batchNFTs = await NFTInfoModel.find({ batchNumber }).select("_id").lean();
      batchNFTIds = batchNFTs.map(n => n._id);
    }

    // Find all proofOfProduction in the same batch
    let batchProductionIds = [];
    if (productionId) {
      batchProductionIds.push(productionId);
    }
    if (batchNumber) {
      const batchProductions = await ProofOfProductionModel.find({ batchNumber }).select("_id").lean();
      const productionIds = batchProductions.map(p => p._id);
      batchProductionIds = [...batchProductionIds, ...productionIds];
      
      // Remove duplicates
      const uniqueIds = [];
      const seen = new Set();
      batchProductionIds.forEach(id => {
        const idStr = id.toString();
        if (!seen.has(idStr)) {
          seen.add(idStr);
          uniqueIds.push(id);
        }
      });
      batchProductionIds = uniqueIds;
    }

    // Find related invoices and proofs in supply chain (search by batch)
    const manufacturerInvoices = await ManufacturerInvoiceModel.find({
      $or: [
        batchNumber ? { batchNumber: batchNumber } : null,
        { nftInfo: { $in: batchNFTIds } },
        batchProductionIds.length > 0 ? { proofOfProduction: { $in: batchProductionIds } } : null,
      ].filter(Boolean),
    })
      .populate("fromManufacturer", "username email fullName walletAddress")
      .populate("toDistributor", "username email fullName walletAddress")
      .sort({ createdAt: -1 })
      .lean();
    
    const manufacturerInvoice = manufacturerInvoices[0] || null;
    const manufacturerInvoiceIds = manufacturerInvoices.map(inv => inv._id);

    const proofOfDistributions = await ProofOfDistributionModel.find({
      $or: [
        batchNumber ? { batchNumber: batchNumber } : null,
        manufacturerInvoiceIds.length > 0 ? { manufacturerInvoice: { $in: manufacturerInvoiceIds } } : null,
        batchProductionIds.length > 0 ? { proofOfProduction: { $in: batchProductionIds } } : null,
        { nftInfo: { $in: batchNFTIds } },
      ].filter(Boolean),
    })
      .populate("fromManufacturer", "username email fullName")
      .populate("toDistributor", "username email fullName")
      .sort({ createdAt: -1 })
      .lean();
    
    const proofOfDistribution = proofOfDistributions[0] || null;
    const proofOfDistributionIds = proofOfDistributions.map(pod => pod._id);

    // Find ProofOfPharmacy with proofOfDistribution or nftInfo in batch
    const proofOfPharmacies = await ProofOfPharmacyModel.find({
      $or: [
        batchNumber ? { batchNumber: batchNumber } : null,
        proofOfDistributionIds.length > 0 ? { proofOfDistribution: { $in: proofOfDistributionIds } } : null,
        { nftInfo: { $in: batchNFTIds } },
      ].filter(Boolean),
    })
      .populate("fromDistributor", "username email fullName")
      .populate("toPharmacy", "username email fullName")
      .sort({ createdAt: -1 })
      .lean();
    
    const proofOfPharmacy = proofOfPharmacies[0] || null;
    const proofOfPharmacyIds = proofOfPharmacies.map(pop => pop._id);

    // Find CommercialInvoice via nftInfo or proofOfPharmacy
    const commercialInvoices = await CommercialInvoiceModel.find({
      $or: [
        batchNumber ? { batchNumber: batchNumber } : null,
        { nftInfo: { $in: batchNFTIds } },
        proofOfPharmacyIds.length > 0 ? { proofOfPharmacy: { $in: proofOfPharmacyIds } } : null,
      ].filter(Boolean),
    })
      .populate("fromDistributor", "username email fullName walletAddress")
      .populate("toPharmacy", "username email fullName walletAddress")
      .sort({ createdAt: -1 })
      .lean();
    
    const commercialInvoice = commercialInvoices[0] || null;

    // Build journey from the information found
    const journey = [];
    
    if (production) {
      const productionWithManufacturer = await ProofOfProductionModel.findById(production._id || production)
        .populate("manufacturer", "name")
        .lean();
      
      journey.push({
        stage: "manufacturing",
        description: "Sản xuất",
        manufacturer: productionWithManufacturer?.manufacturer?.name || "N/A",
        date: production.mfgDate || production.createdAt,
        details: {
          quantity: production.quantity,
          mfgDate: production.mfgDate,
        },
      });
    } else if (nft.proofOfProduction) {
      const productionData = await ProofOfProductionModel.findById(nft.proofOfProduction)
        .populate("manufacturer", "name")
        .lean();
      if (productionData) {
        journey.push({
          stage: "manufacturing",
          description: "Sản xuất",
          manufacturer: productionData.manufacturer?.name || "N/A",
          date: productionData.mfgDate || productionData.createdAt,
          details: {
            quantity: productionData.quantity,
            mfgDate: productionData.mfgDate,
          },
        });
      }
    }

    if (manufacturerInvoice) {
      journey.push({
        stage: "transfer_to_distributor",
        description: "Chuyển giao cho Nhà phân phối",
        from: manufacturerInvoice.fromManufacturer?.fullName || manufacturerInvoice.fromManufacturer?.username || "N/A",
        to: manufacturerInvoice.toDistributor?.fullName || manufacturerInvoice.toDistributor?.username || "N/A",
        date: manufacturerInvoice.createdAt,
        invoiceNumber: manufacturerInvoice.invoiceNumber,
      });
    }

    if (proofOfDistribution) {
      journey.push({
        stage: "distributor_received",
        description: "Nhà phân phối đã nhận hàng",
        date: proofOfDistribution.distributionDate || proofOfDistribution.createdAt,
        status: proofOfDistribution.status,
      });
    }

    if (commercialInvoice) {
      journey.push({
        stage: "transfer_to_pharmacy",
        description: "Chuyển giao cho Nhà thuốc",
        from: commercialInvoice.fromDistributor?.fullName || commercialInvoice.fromDistributor?.username || "N/A",
        to: commercialInvoice.toPharmacy?.fullName || commercialInvoice.toPharmacy?.username || "N/A",
        date: commercialInvoice.createdAt,
        invoiceNumber: commercialInvoice.invoiceNumber,
      });
    }

    if (proofOfPharmacy) {
      journey.push({
        stage: "pharmacy_received",
        description: "Nhà thuốc đã nhận hàng",
        date: proofOfPharmacy.receiptDate || proofOfPharmacy.createdAt,
        status: proofOfPharmacy.status,
        supplyChainCompleted: proofOfPharmacy.supplyChainCompleted,
      });
    }

    // Basic NFT info (public info)
    const nftInfo = {
      tokenId: nft.tokenId,
      serialNumber: nft.serialNumber,
      batchNumber: nft.batchNumber,
      drug: {
        tradeName: nft.drug?.tradeName,
        atcCode: nft.drug?.atcCode,
        genericName: nft.drug?.genericName,
        dosageForm: nft.drug?.dosageForm,
        strength: nft.drug?.strength,
        packaging: nft.drug?.packaging,
      },
      mfgDate: nft.mfgDate,
      expDate: nft.expDate,
      status: nft.status,
      currentOwner: nft.owner ? {
        username: nft.owner.username,
        fullName: nft.owner.fullName,
      } : null,
    };

    return {
      nft: nftInfo,
      blockchainHistory,
      journey,
      supplyChain: {
        manufacturer: manufacturerInvoice?.fromManufacturer ? {
          name: manufacturerInvoice.fromManufacturer.fullName || manufacturerInvoice.fromManufacturer.username,
          email: manufacturerInvoice.fromManufacturer.email,
        } : null,
        distributor: commercialInvoice?.fromDistributor ? {
          name: commercialInvoice.fromDistributor.fullName || commercialInvoice.fromDistributor.username,
          email: commercialInvoice.fromDistributor.email,
        } : null,
        pharmacy: commercialInvoice?.toPharmacy ? {
          name: commercialInvoice.toPharmacy.fullName || commercialInvoice.toPharmacy.username,
          email: commercialInvoice.toPharmacy.email,
        } : null,
      },
    };
  }
}
