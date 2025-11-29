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
    const { NFTInfoModel } = await import(
      "../../../supply-chain/infrastructure/persistence/mongoose/schemas/NFTInfoSchema.js"
    );
    const { ProofOfProductionModel } = await import(
      "../../../supply-chain/infrastructure/persistence/mongoose/schemas/ProofOfProductionSchema.js"
    );
    const { ManufacturerInvoiceModel } = await import(
      "../../../supply-chain/infrastructure/persistence/mongoose/schemas/ManufacturerInvoiceSchema.js"
    );
    const { ProofOfDistributionModel } = await import(
      "../../../distributor/infrastructure/persistence/mongoose/schemas/ProofOfDistributionSchema.js"
    );
    const { ProofOfPharmacyModel } = await import(
      "../../../pharmacy/infrastructure/persistence/mongoose/schemas/ProofOfPharmacySchema.js"
    );
    const { CommercialInvoiceModel } = await import(
      "../../../distributor/infrastructure/persistence/mongoose/schemas/CommercialInvoiceSchema.js"
    );
    const { PharmaCompanyModel } = await import(
      "../../../registration/infrastructure/persistence/mongoose/schemas/BusinessEntitySchemas.js"
    );

    // Find NFT with populated fields (like old logic)
    const query = {
      $or: [
        { tokenId: dto.tokenId },
        { serialNumber: dto.tokenId },
        { batchNumber: dto.tokenId },
      ],
    };

    console.log("Tracking NFT với query:", JSON.stringify(query));

    const nft = await NFTInfoModel.findOne(query)
      .populate(
        "drug",
        "tradeName atcCode genericName dosageForm strength packaging"
      )
      .populate("owner", "username email fullName walletAddress")
      .populate("proofOfProduction")
      .lean();

    if (!nft) {
      // Check if any NFT exists with similar tokenId for better error message
      const similarNFT = await NFTInfoModel.findOne({
        tokenId: { $regex: dto.tokenId, $options: "i" },
      })
        .select("tokenId")
        .lean();
      const errorMessage = similarNFT
        ? `Không tìm thấy NFT với tokenId "${dto.tokenId}". Có thể bạn muốn tìm "${similarNFT.tokenId}"?`
        : `Không tìm thấy NFT với tokenId "${dto.tokenId}"`;
      throw new Error(errorMessage);
    }

    // Get blockchain history
    let blockchainHistory = [];
    try {
      blockchainHistory = await this._blockchainService.getTrackingHistory(
        nft.tokenId
      );
    } catch (error) {
      console.error("Lỗi khi lấy lịch sử blockchain:", error);
    }

    // Get production to have batchNumber
    let production = null;
    let batchNumber = nft.batchNumber;
    let productionId = null;

    if (nft.proofOfProduction) {
      productionId = nft.proofOfProduction._id || nft.proofOfProduction;

      if (nft.proofOfProduction._id && nft.proofOfProduction.manufacturer) {
        production = nft.proofOfProduction;
      } else {
        production = await ProofOfProductionModel.findById(productionId)
          .populate("manufacturer", "name") // Populate manufacturer for later use
          .lean();
      }

      if (production && production.batchNumber) {
        batchNumber = production.batchNumber;
      }
    }

    // Find all NFTs in the same batch
    let batchNFTIds = [nft._id];
    if (batchNumber) {
      const batchNFTs = await NFTInfoModel.find({ batchNumber })
        .select("_id")
        .lean();
      batchNFTIds = batchNFTs.map((n) => n._id);
    }

    // Find all proofOfProduction in the same batch
    let batchProductionIds = [];
    if (productionId) {
      batchProductionIds.push(productionId);
    }
    if (batchNumber) {
      const batchProductions = await ProofOfProductionModel.find({
        batchNumber,
      })
        .select("_id")
        .lean();
      const productionIds = batchProductions.map((p) => p._id);
      batchProductionIds = [...batchProductionIds, ...productionIds];

      // Remove duplicates
      const uniqueIds = [];
      const seen = new Set();
      batchProductionIds.forEach((id) => {
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
        batchProductionIds.length > 0
          ? { proofOfProduction: { $in: batchProductionIds } }
          : null,
      ].filter(Boolean),
    })
      .populate("fromManufacturer", "name licenseNo taxCode contactEmail contactPhone address country") // PharmaCompany fields
      .populate("toDistributor", "username email fullName walletAddress") // User fields
      .sort({ createdAt: -1 })
      .lean();

    const manufacturerInvoice = manufacturerInvoices[0] || null;
    const manufacturerInvoiceIds = manufacturerInvoices.map((inv) => inv._id);

    const proofOfDistributions = await ProofOfDistributionModel.find({
      $or: [
        batchNumber ? { batchNumber: batchNumber } : null,
        manufacturerInvoiceIds.length > 0
          ? { manufacturerInvoice: { $in: manufacturerInvoiceIds } }
          : null,
        batchProductionIds.length > 0
          ? { proofOfProduction: { $in: batchProductionIds } }
          : null,
        { nftInfo: { $in: batchNFTIds } },
      ].filter(Boolean),
    })
      .populate("fromManufacturer", "name licenseNo taxCode contactEmail contactPhone address country") // PharmaCompany fields
      .populate("toDistributor", "username email fullName") // User fields
      .sort({ createdAt: -1 })
      .lean();

    const proofOfDistribution = proofOfDistributions[0] || null;
    const proofOfDistributionIds = proofOfDistributions.map((pod) => pod._id);

    // Find ProofOfPharmacy with proofOfDistribution or nftInfo in batch
    const proofOfPharmacies = await ProofOfPharmacyModel.find({
      $or: [
        batchNumber ? { batchNumber: batchNumber } : null,
        proofOfDistributionIds.length > 0
          ? { proofOfDistribution: { $in: proofOfDistributionIds } }
          : null,
        { nftInfo: { $in: batchNFTIds } },
      ].filter(Boolean),
    })
      .populate("fromDistributor", "username email fullName")
      .populate("toPharmacy", "username email fullName")
      .sort({ createdAt: -1 })
      .lean();

    const proofOfPharmacy = proofOfPharmacies[0] || null;
    const proofOfPharmacyIds = proofOfPharmacies.map((pop) => pop._id);

    // Find CommercialInvoice via nftInfo or proofOfPharmacy
    const commercialInvoices = await CommercialInvoiceModel.find({
      $or: [
        batchNumber ? { batchNumber: batchNumber } : null,
        { nftInfo: { $in: batchNFTIds } },
        proofOfPharmacyIds.length > 0
          ? { proofOfPharmacy: { $in: proofOfPharmacyIds } }
          : null,
      ].filter(Boolean),
    })
      .populate("fromDistributor", "username email fullName walletAddress")
      .populate("toPharmacy", "username email fullName walletAddress")
      .populate("nftInfo", "batchNumber") // Populate nftInfo to get batchNumber
      .sort({ createdAt: -1 })
      .lean();

    const commercialInvoice = commercialInvoices[0] || null;

    // Get Business Entity names for enriched data
    const { DistributorModel, PharmacyModel } = await import(
      "../../../registration/infrastructure/persistence/mongoose/schemas/BusinessEntitySchemas.js"
    );

    // Collect all User IDs to query Business Entities
    const distributorUserIds = [
      ...new Set([
        ...manufacturerInvoices.map(inv => inv.toDistributor?._id?.toString()).filter(Boolean),
        ...proofOfDistributions.map(pod => pod.toDistributor?._id?.toString()).filter(Boolean),
        ...proofOfPharmacies.map(pop => pop.fromDistributor?._id?.toString()).filter(Boolean),
        ...commercialInvoices.map(ci => ci.fromDistributor?._id?.toString()).filter(Boolean),
      ]),
    ];

    const pharmacyUserIds = [
      ...new Set([
        ...proofOfPharmacies.map(pop => pop.toPharmacy?._id?.toString()).filter(Boolean),
        ...commercialInvoices.map(ci => ci.toPharmacy?._id?.toString()).filter(Boolean),
      ]),
    ];

    // fromManufacturer is PharmaCompany entity ID, not User ID
    // Also include production.manufacturer
    const extractManufacturerId = (manufacturer) => {
      if (!manufacturer) return null;
      if (manufacturer._id) return manufacturer._id.toString();
      if (typeof manufacturer === 'object' && manufacturer.toString) return manufacturer.toString();
      if (typeof manufacturer === 'string') return manufacturer;
      return null;
    };

    const manufacturerEntityIds = [
      ...new Set([
        ...manufacturerInvoices.map(inv => extractManufacturerId(inv.fromManufacturer)).filter(Boolean),
        ...proofOfDistributions.map(pod => extractManufacturerId(pod.fromManufacturer)).filter(Boolean),
        production ? extractManufacturerId(production.manufacturer) : null,
        nft.proofOfProduction ? extractManufacturerId(nft.proofOfProduction.manufacturer) : null,
      ].filter(Boolean)),
    ];

    // Query Business Entities
    const distributors = distributorUserIds.length > 0
      ? await DistributorModel.find({ user: { $in: distributorUserIds } }).select("user name").lean()
      : [];

    const pharmacies = pharmacyUserIds.length > 0
      ? await PharmacyModel.find({ user: { $in: pharmacyUserIds } }).select("user name").lean()
      : [];

    // Query PharmaCompany directly by entity ID (not by user)
    const manufacturers = manufacturerEntityIds.length > 0
      ? await PharmaCompanyModel.find({ _id: { $in: manufacturerEntityIds } }).select("_id name").lean()
      : [];

    // Create maps for quick lookup
    const distributorNameMap = new Map();
    distributors.forEach(dist => {
      const userId = dist.user ? (dist.user.toString ? dist.user.toString() : String(dist.user)) : null;
      if (userId && dist.name) {
        distributorNameMap.set(userId, dist.name);
      }
    });

    const pharmacyNameMap = new Map();
    pharmacies.forEach(pharm => {
      const userId = pharm.user ? (pharm.user.toString ? pharm.user.toString() : String(pharm.user)) : null;
      if (userId && pharm.name) {
        pharmacyNameMap.set(userId, pharm.name);
      }
    });

    const manufacturerNameMap = new Map();
    manufacturers.forEach(manu => {
      const entityId = manu._id ? (manu._id.toString ? manu._id.toString() : String(manu._id)) : null;
      if (entityId && manu.name) {
        manufacturerNameMap.set(entityId, manu.name);
      }
    });

    // Build journey from the information found
    const journey = [];

    if (production) {
      const productionWithManufacturer = await ProofOfProductionModel.findById(
        production._id || production
      )
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
      const productionData = await ProofOfProductionModel.findById(
        nft.proofOfProduction
      )
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
      const fromManufacturerEntityId = manufacturerInvoice.fromManufacturer?._id?.toString() || manufacturerInvoice.fromManufacturer?.toString();
      const toDistributorUserId = manufacturerInvoice.toDistributor?._id?.toString() || manufacturerInvoice.toDistributor?.toString();
      
      // fromManufacturer is PharmaCompany, has 'name' field
      const fromName = manufacturerNameMap.get(fromManufacturerEntityId) ||
        manufacturerInvoice.fromManufacturer?.name ||
        "N/A";
      
      const toName = distributorNameMap.get(toDistributorUserId) ||
        manufacturerInvoice.toDistributor?.fullName ||
        manufacturerInvoice.toDistributor?.username ||
        "N/A";

      journey.push({
        stage: "transfer_to_distributor",
        description: "Chuyển giao cho Nhà phân phối",
        from: fromName,
        to: toName,
        date: manufacturerInvoice.createdAt,
        invoiceNumber: manufacturerInvoice.invoiceNumber,
        details: {
          invoiceId: manufacturerInvoice._id?.toString(),
          quantity: manufacturerInvoice.quantity,
          batchNumber: manufacturerInvoice.batchNumber,
        },
      });
    }

    if (proofOfDistribution) {
      const distributorUserId = proofOfDistribution.toDistributor?._id?.toString() || proofOfDistribution.toDistributor?.toString();
      const distributorName = distributorNameMap.get(distributorUserId) ||
        proofOfDistribution.toDistributor?.fullName ||
        proofOfDistribution.toDistributor?.username ||
        "N/A";
      
      // fromManufacturer in proofOfDistribution is also PharmaCompany
      const fromManufacturerEntityId = proofOfDistribution.fromManufacturer?._id?.toString() || proofOfDistribution.fromManufacturer?.toString();
      const manufacturerName = manufacturerNameMap.get(fromManufacturerEntityId) ||
        proofOfDistribution.fromManufacturer?.name ||
        null;

      journey.push({
        stage: "distributor_received",
        description: "Nhà phân phối đã nhận hàng",
        distributor: distributorName,
        from: manufacturerName || "N/A", // Add manufacturer name
        date: proofOfDistribution.distributionDate || proofOfDistribution.createdAt,
        status: proofOfDistribution.status,
        details: {
          proofId: proofOfDistribution._id?.toString(),
          receivedQuantity: proofOfDistribution.receivedQuantity,
          batchNumber: proofOfDistribution.batchNumber,
        },
      });
    }

    if (commercialInvoice) {
      const fromDistributorUserId = commercialInvoice.fromDistributor?._id?.toString() || commercialInvoice.fromDistributor?.toString();
      const toPharmacyUserId = commercialInvoice.toPharmacy?._id?.toString() || commercialInvoice.toPharmacy?.toString();
      
      const fromName = distributorNameMap.get(fromDistributorUserId) ||
        commercialInvoice.fromDistributor?.fullName ||
        commercialInvoice.fromDistributor?.username ||
        "N/A";
      
      const toName = pharmacyNameMap.get(toPharmacyUserId) ||
        commercialInvoice.toPharmacy?.fullName ||
        commercialInvoice.toPharmacy?.username ||
        "N/A";

      // Get batchNumber from commercialInvoice, or fallback to related NFT or proofOfPharmacy
      let invoiceBatchNumber = commercialInvoice.batchNumber;
      if (!invoiceBatchNumber) {
        // Try to get from populated nftInfo
        if (commercialInvoice.nftInfo) {
          invoiceBatchNumber = commercialInvoice.nftInfo.batchNumber || 
            (typeof commercialInvoice.nftInfo === 'object' && commercialInvoice.nftInfo.batchNumber) ||
            null;
        }
        // Fallback to main nft batchNumber
        if (!invoiceBatchNumber) {
          invoiceBatchNumber = nft.batchNumber || batchNumber;
        }
        // Or from proofOfPharmacy if available
        if (!invoiceBatchNumber && proofOfPharmacy) {
          invoiceBatchNumber = proofOfPharmacy.batchNumber;
        }
      }

      journey.push({
        stage: "transfer_to_pharmacy",
        description: "Chuyển giao cho Nhà thuốc",
        from: fromName,
        to: toName,
        date: commercialInvoice.createdAt,
        invoiceNumber: commercialInvoice.invoiceNumber,
        details: {
          invoiceId: commercialInvoice._id?.toString(),
          quantity: commercialInvoice.quantity,
          batchNumber: invoiceBatchNumber,
          status: commercialInvoice.status,
        },
      });
    }

    if (proofOfPharmacy) {
      const pharmacyUserId = proofOfPharmacy.toPharmacy?._id?.toString() || proofOfPharmacy.toPharmacy?.toString();
      const pharmacyName = pharmacyNameMap.get(pharmacyUserId) ||
        proofOfPharmacy.toPharmacy?.fullName ||
        proofOfPharmacy.toPharmacy?.username ||
        "N/A";

      journey.push({
        stage: "pharmacy_received",
        description: "Nhà thuốc đã nhận hàng",
        pharmacy: pharmacyName,
        date: proofOfPharmacy.receiptDate || proofOfPharmacy.createdAt,
        status: proofOfPharmacy.status,
        supplyChainCompleted: proofOfPharmacy.supplyChainCompleted,
        details: {
          receiptId: proofOfPharmacy._id?.toString(),
          receivedQuantity: proofOfPharmacy.receivedQuantity,
          batchNumber: proofOfPharmacy.batchNumber,
        },
      });
    }

    // Resolve currentOwner - owner can be User ID or Business Entity ID
    let currentOwner = null;
    
    // First, try to get from nft.owner field
    if (nft.owner) {
      // Check if owner is populated User object
      if (nft.owner._id || nft.owner.username) {
        // Owner is a User
        const ownerUserId = nft.owner._id?.toString() || nft.owner.toString();
        const businessName = distributorNameMap.get(ownerUserId) || 
                           pharmacyNameMap.get(ownerUserId) || 
                           null;
        
        currentOwner = {
          _id: ownerUserId,
          username: nft.owner.username || null,
          fullName: nft.owner.fullName || businessName || null,
          name: businessName || nft.owner.fullName || nft.owner.username || null,
          email: nft.owner.email || null,
          walletAddress: nft.owner.walletAddress || null,
        };
      } else {
        // Owner might be a Business Entity ID (ObjectId string)
        const ownerId = nft.owner.toString ? nft.owner.toString() : String(nft.owner);
        
        // Try to find in manufacturerNameMap (PharmaCompany)
        if (manufacturerNameMap.has(ownerId)) {
          currentOwner = {
            _id: ownerId,
            name: manufacturerNameMap.get(ownerId),
            type: "pharma_company",
          };
        } else {
          // Try to query Business Entities to find the owner
          const { PharmaCompanyModel, DistributorModel, PharmacyModel } = await import(
            "../../../registration/infrastructure/persistence/mongoose/schemas/BusinessEntitySchemas.js"
          );
          
          const mongoose = await import("mongoose");
          if (mongoose.default.Types.ObjectId.isValid(ownerId)) {
            // Try PharmaCompany
            const pharmaCompany = await PharmaCompanyModel.findById(ownerId).select("name user").lean();
            if (pharmaCompany) {
              currentOwner = {
                _id: ownerId,
                name: pharmaCompany.name || null,
                type: "pharma_company",
              };
            } else {
              // Try Distributor
              const distributor = await DistributorModel.findById(ownerId).select("name user").lean();
              if (distributor) {
                currentOwner = {
                  _id: ownerId,
                  name: distributor.name || null,
                  type: "distributor",
                };
              } else {
                // Try Pharmacy
                const pharmacy = await PharmacyModel.findById(ownerId).select("name user").lean();
                if (pharmacy) {
                  currentOwner = {
                    _id: ownerId,
                    name: pharmacy.name || null,
                    type: "pharmacy",
                  };
                }
              }
            }
          }
        }
      }
    }
    
    // If owner is still null, try to infer from journey (last step in supply chain)
    if (!currentOwner && proofOfPharmacy) {
      // If pharmacy received, owner is likely the pharmacy
      const toPharmacyUserId = proofOfPharmacy.toPharmacy?._id?.toString() || proofOfPharmacy.toPharmacy?.toString();
      if (toPharmacyUserId) {
        const pharmacyName = pharmacyNameMap.get(toPharmacyUserId) || 
                           proofOfPharmacy.toPharmacy?.fullName || 
                           proofOfPharmacy.toPharmacy?.username || 
                           null;
        
        currentOwner = {
          _id: toPharmacyUserId,
          username: proofOfPharmacy.toPharmacy?.username || null,
          fullName: proofOfPharmacy.toPharmacy?.fullName || pharmacyName || null,
          name: pharmacyName || proofOfPharmacy.toPharmacy?.fullName || proofOfPharmacy.toPharmacy?.username || null,
          email: proofOfPharmacy.toPharmacy?.email || null,
        };
      }
    } else if (!currentOwner && proofOfDistribution) {
      // If distributor received but not pharmacy, owner is likely the distributor
      const toDistributorUserId = proofOfDistribution.toDistributor?._id?.toString() || proofOfDistribution.toDistributor?.toString();
      if (toDistributorUserId) {
        const distributorName = distributorNameMap.get(toDistributorUserId) || 
                               proofOfDistribution.toDistributor?.fullName || 
                               proofOfDistribution.toDistributor?.username || 
                               null;
        
        currentOwner = {
          _id: toDistributorUserId,
          username: proofOfDistribution.toDistributor?.username || null,
          fullName: proofOfDistribution.toDistributor?.fullName || distributorName || null,
          name: distributorName || proofOfDistribution.toDistributor?.fullName || proofOfDistribution.toDistributor?.username || null,
          email: proofOfDistribution.toDistributor?.email || null,
        };
      }
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
      currentOwner: currentOwner,
    };

    return {
      nft: nftInfo,
      blockchainHistory,
      journey,
      supplyChain: {
        manufacturer: manufacturerInvoice?.fromManufacturer
          ? (() => {
              const entityId = manufacturerInvoice.fromManufacturer._id?.toString() || manufacturerInvoice.fromManufacturer.toString();
              const name = manufacturerNameMap.get(entityId) ||
                manufacturerInvoice.fromManufacturer.name ||
                "N/A";
              return {
                name,
                email: manufacturerInvoice.fromManufacturer.contactEmail || null,
              };
            })()
          : null,
        distributor: commercialInvoice?.fromDistributor
          ? (() => {
              const userId = commercialInvoice.fromDistributor._id?.toString() || commercialInvoice.fromDistributor.toString();
              const name = distributorNameMap.get(userId) ||
                commercialInvoice.fromDistributor.fullName ||
                commercialInvoice.fromDistributor.username ||
                "N/A";
              return {
                name,
                email: commercialInvoice.fromDistributor.email || null,
              };
            })()
          : null,
        pharmacy: commercialInvoice?.toPharmacy
          ? (() => {
              const userId = commercialInvoice.toPharmacy._id?.toString() || commercialInvoice.toPharmacy.toString();
              const name = pharmacyNameMap.get(userId) ||
                commercialInvoice.toPharmacy.fullName ||
                commercialInvoice.toPharmacy.username ||
                "N/A";
              return {
                name,
                email: commercialInvoice.toPharmacy.email || null,
              };
            })()
          : null,
      },
    };
  }
}
