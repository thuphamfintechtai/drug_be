import { ConfirmReceiptUseCase } from "../use-cases/ConfirmReceiptUseCase.js";
import { TransferToPharmacyUseCase } from "../use-cases/TransferToPharmacyUseCase.js";
import { CreateContractRequestUseCase } from "../use-cases/CreateContractRequestUseCase.js";
import { FinalizeContractAndMintUseCase } from "../use-cases/FinalizeContractAndMintUseCase.js";
import { ConfirmReceiptDTO } from "../dto/ConfirmReceiptDTO.js";
import { TransferToPharmacyDTO } from "../dto/TransferToPharmacyDTO.js";
import { CreateContractRequestDTO } from "../dto/CreateContractRequestDTO.js";
import { FinalizeContractDTO } from "../dto/FinalizeContractDTO.js";

export class DistributorApplicationService {
  constructor(
    manufacturerInvoiceRepository,
    commercialInvoiceRepository,
    proofOfDistributionRepository,
    nftRepository,
    proofOfProductionRepository,
    drugInfoRepository,
    contractRepository,
    contractBlockchainService,
    userRepository,
    eventBus
  ) {
    this._manufacturerInvoiceRepository = manufacturerInvoiceRepository;
    this._commercialInvoiceRepository = commercialInvoiceRepository;
    this._proofOfDistributionRepository = proofOfDistributionRepository;
    this._nftRepository = nftRepository;
    this._proofOfProductionRepository = proofOfProductionRepository;
    this._drugInfoRepository = drugInfoRepository;
    this._contractRepository = contractRepository;
    this._contractBlockchainService = contractBlockchainService;
    this._userRepository = userRepository;
    this._eventBus = eventBus;

    this._confirmReceiptUseCase = new ConfirmReceiptUseCase(
      manufacturerInvoiceRepository,
      proofOfDistributionRepository,
      nftRepository,
      proofOfProductionRepository,
      eventBus
    );

    this._transferToPharmacyUseCase = new TransferToPharmacyUseCase(
      drugInfoRepository,
      nftRepository,
      commercialInvoiceRepository,
      eventBus
    );

    this._createContractRequestUseCase = new CreateContractRequestUseCase(
      contractRepository,
      contractBlockchainService,
      userRepository
    );

    this._finalizeContractAndMintUseCase = new FinalizeContractAndMintUseCase(
      contractRepository,
      contractBlockchainService,
      userRepository,
      nftRepository
    );
  }

  async confirmReceipt(dto, distributorId) {
    return await this._confirmReceiptUseCase.execute(dto, distributorId);
  }

  async transferToPharmacy(
    distributorId,
    pharmacyId,
    drugId,
    tokenIds,
    invoiceNumber = null,
    invoiceDate = null,
    quantity = null,
    unitPrice = null,
    totalAmount = null,
    vatRate = null,
    vatAmount = null,
    finalAmount = null,
    notes = null
  ) {
    const resolvedPharmacyId = await this._resolvePharmacyUserId(pharmacyId);
    if (!resolvedPharmacyId) {
      throw new Error("Không xác định được pharmacy hợp lệ từ pharmacyId được cung cấp");
    }

    return await this._transferToPharmacyUseCase.execute(
      distributorId,
      resolvedPharmacyId,
      drugId,
      tokenIds,
      invoiceNumber,
      invoiceDate,
      quantity,
      unitPrice,
      totalAmount,
      vatRate,
      vatAmount,
      finalAmount,
      notes
    );
  }

  async saveTransferToPharmacyTransaction(
    distributorId,
    invoiceId,
    transactionHash,
    tokenIds
  ) {
    // Validate transactionHash format (basic check for Ethereum hash)
    if (!transactionHash || typeof transactionHash !== 'string') {
      throw new Error("transactionHash không hợp lệ");
    }
    if (!/^0x[a-fA-F0-9]{64}$/.test(transactionHash)) {
      throw new Error("transactionHash phải có định dạng Ethereum hash (0x + 64 hex chars)");
    }

    // Find invoice
    const invoice = await this._commercialInvoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw new Error(`Không tìm thấy invoice với ID: ${invoiceId}. Vui lòng kiểm tra lại invoiceId.`);
    }

    // Normalize IDs for comparison
    const normalizedDistributorId = distributorId ? String(distributorId).trim() : null;
    const normalizedFromDistributorId = invoice.fromDistributorId ? String(invoice.fromDistributorId).trim() : null;
    const invoicePharmacyId = invoice.toPharmacyId ? String(invoice.toPharmacyId).trim() : null;
    let normalizedPharmacyId = invoicePharmacyId;

    if (!normalizedPharmacyId) {
      normalizedPharmacyId = await this._getInvoicePharmacyId(invoiceId);
    }

    const normalizedPharmacyUserId = await this._resolvePharmacyUserId(normalizedPharmacyId);
    if (!normalizedPharmacyUserId) {
      throw new Error(
        `Không xác định được pharmacy gắn với invoice ${invoiceId}. ` +
        `Vui lòng kiểm tra lại dữ liệu trước khi lưu transaction.`
      );
    }

    if (!invoicePharmacyId || invoicePharmacyId !== normalizedPharmacyUserId) {
      invoice.updatePharmacy(normalizedPharmacyUserId);
    }

    // Check ownership
    if (normalizedFromDistributorId !== normalizedDistributorId) {
      throw new Error(
        `Bạn không có quyền cập nhật invoice này. ` +
        `Invoice thuộc về distributor: ${normalizedFromDistributorId || 'null'}, ` +
        `Distributor hiện tại: ${normalizedDistributorId || 'null'}`
      );
    }


    const currentChainTxHash = invoice.chainTxHash 
      ? (invoice.chainTxHash.value || invoice.chainTxHash.toString() || invoice.chainTxHash)
      : null;

    if (currentChainTxHash === transactionHash) {
      // Already processed, return current state
      return {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        chainTxHash: currentChainTxHash,
      };
    }

    // CRITICAL: Check invoice status
    // Allow "issued" or "sent" (sent can happen if blockchain event processed first)
    if (invoice.status !== "issued" && invoice.status !== "sent") {
      throw new Error(
        `Invoice phải ở trạng thái "issued" hoặc "sent" để lưu transaction. ` +
        `Trạng thái hiện tại: ${invoice.status}`
      );
    }

    // If invoice is already "sent" but chainTxHash doesn't match, it means blockchain event
    // processed it with a different transaction hash, or this is a duplicate call
    if (invoice.status === "sent" && currentChainTxHash && currentChainTxHash !== transactionHash) {
      throw new Error(
        `Invoice đã được xử lý với transaction hash khác: ${currentChainTxHash}. ` +
        `Transaction hash hiện tại: ${transactionHash}`
      );
    }

    // CRITICAL: Validate tokenIds match invoice.tokenIds exactly
    const invoiceTokenIds = invoice.tokenIds || [];
    const requestTokenIds = Array.isArray(tokenIds) ? tokenIds : [];
    
    if (invoiceTokenIds.length !== requestTokenIds.length) {
      throw new Error(`tokenIds không khớp với invoice. Invoice có ${invoiceTokenIds.length} tokenIds, request có ${requestTokenIds.length}`);
    }

    const invoiceTokenIdsSet = new Set(invoiceTokenIds.map(id => id.toString()));
    const requestTokenIdsSet = new Set(requestTokenIds.map(id => id.toString()));
    
    if (invoiceTokenIdsSet.size !== requestTokenIdsSet.size) {
      throw new Error("tokenIds có giá trị trùng lặp hoặc không khớp với invoice");
    }

    for (const tokenId of requestTokenIds) {
      if (!invoiceTokenIdsSet.has(tokenId.toString())) {
        throw new Error(`tokenId ${tokenId} không tồn tại trong invoice`);
      }
    }

    // Get NFTs and validate
    const nfts = await this._nftRepository.findByTokenIds(requestTokenIds);
    if (nfts.length !== requestTokenIds.length) {
      throw new Error("Không tìm thấy đầy đủ NFT tương ứng với tokenIds");
    }

    // Normalize IDs for comparison
    const normalizedDistributorIdForNFT = distributorId ? String(distributorId).trim() : null;
    // Check NFT ownership: NFT có thể đã được transfer trên blockchain trước đó
    // Nếu NFT đã thuộc về pharmacy, chỉ cần update transaction hash
    // Nếu NFT vẫn thuộc về distributor, thì transfer
    for (const nft of nfts) {
      const normalizedNftOwnerId = nft.ownerId ? String(nft.ownerId).trim() : null;
      
      // NFT phải thuộc về distributor (chưa transfer) hoặc pharmacy (đã transfer trên blockchain)
      if (normalizedNftOwnerId !== normalizedDistributorIdForNFT && 
          normalizedNftOwnerId !== normalizedPharmacyUserId) {
        throw new Error(
          `NFT với tokenId ${nft.tokenId} không thuộc về distributor hoặc pharmacy trong invoice. ` +
          `Owner hiện tại: ${normalizedNftOwnerId || 'null'}, ` +
          `Distributor ID: ${normalizedDistributorIdForNFT || 'null'}, ` +
          `Pharmacy ID (user): ${normalizedPharmacyUserId || 'null'}`
        );
      }
    }

    // Use database transaction to ensure atomicity
    const mongoose = await import("mongoose");
    const session = await mongoose.default.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Update invoice with transaction hash and mark as sent
        // Note: markAsSent already sets chainTxHash, so we don't need to call setChainTxHash separately
        invoice.markAsSent(transactionHash);
        await this._commercialInvoiceRepository.save(invoice, { session });

        // Update NFTs with transaction hash
        // If NFT already belongs to pharmacy (transferred on blockchain), just update transaction hash
        // If NFT still belongs to distributor, transfer it
        await Promise.all(
          nfts.map(async (nft) => {
            const nftOwnerId = nft.ownerId ? String(nft.ownerId).trim() : null;
            const shouldTransfer = nftOwnerId === normalizedDistributorIdForNFT;
            
            // Set transaction hash if not already set (for NFTs already transferred on blockchain)
            // or always set for new transfers
            if (!nft.chainTxHash || shouldTransfer) {
              nft.setMintTransaction(transactionHash);
            }
            
            // Only transfer if NFT still belongs to distributor
            if (shouldTransfer) {
              nft.transfer(normalizedPharmacyUserId, transactionHash);
            }
            // If NFT already transferred on blockchain, no need to transfer again
            
            await this._nftRepository.save(nft, { session });
          })
        );
      });
    } finally {
      await session.endSession();
    }

    // Reload invoice to get updated state
    const updatedInvoice = await this._commercialInvoiceRepository.findById(invoiceId);

    return {
      invoiceId: updatedInvoice.id,
      invoiceNumber: updatedInvoice.invoiceNumber,
      status: updatedInvoice.status,
      chainTxHash: updatedInvoice.chainTxHash,
    };
  }

  async getInvoicesFromManufacturer(distributorId, filters = {}) {
    return await this._manufacturerInvoiceRepository.findByDistributor(distributorId, filters);
  }

  async getInvoiceDetail(distributorId, invoiceId) {
    const invoice = await this._manufacturerInvoiceRepository.findById(invoiceId);
    
    if (!invoice) {
      throw new Error("Không tìm thấy invoice");
    }

    if (invoice.toDistributorId !== distributorId) {
      throw new Error("Bạn không có quyền xem invoice này");
    }

    // Get tokenIds from NFTs
    let tokenIds = invoice.tokenIds || [];
    if (tokenIds.length === 0 && invoice.nftInfoId) {
      // Try to get from nftInfo if available
      const nft = await this._nftRepository.findById(invoice.nftInfoId);
      if (nft) {
        tokenIds = [nft.tokenId];
      }
    }

    return {
      ...invoice,
      tokenIds,
    };
  }

  async getDistributionHistory(distributorId, filters = {}) {
    return await this._proofOfDistributionRepository.findByDistributor(distributorId, filters);
  }

  async getTransferToPharmacyHistory(distributorId, filters = {}) {
    return await this._commercialInvoiceRepository.findByDistributor(distributorId, filters);
  }

  async getStatistics(distributorId) {
    // Import mongoose models for statistics
    const { ManufacturerInvoiceModel } = await import("../../../supply-chain/infrastructure/persistence/mongoose/schemas/ManufacturerInvoiceSchema.js");
    const { ProofOfDistributionModel } = await import("../../infrastructure/persistence/mongoose/schemas/ProofOfDistributionSchema.js");
    const { CommercialInvoiceModel } = await import("../../infrastructure/persistence/mongoose/schemas/CommercialInvoiceSchema.js");
    const { NFTInfoModel } = await import("../../../supply-chain/infrastructure/persistence/mongoose/schemas/NFTInfoSchema.js");

    // Count invoices from manufacturer
    const totalInvoices = await ManufacturerInvoiceModel.countDocuments({
      toDistributor: distributorId,
    });

    const invoiceStatusStats = {
      pending: await ManufacturerInvoiceModel.countDocuments({
        toDistributor: distributorId,
        status: "pending",
      }),
      sent: await ManufacturerInvoiceModel.countDocuments({
        toDistributor: distributorId,
        status: "sent",
      }),
      paid: await ManufacturerInvoiceModel.countDocuments({
        toDistributor: distributorId,
        status: "paid",
      }),
    };

    // Count distributions
    const totalDistributions = await ProofOfDistributionModel.countDocuments({
      toDistributor: distributorId,
    });

    const distributionStatusStats = {
      pending: await ProofOfDistributionModel.countDocuments({
        toDistributor: distributorId,
        status: "pending",
      }),
      in_transit: await ProofOfDistributionModel.countDocuments({
        toDistributor: distributorId,
        status: "in_transit",
      }),
      delivered: await ProofOfDistributionModel.countDocuments({
        toDistributor: distributorId,
        status: "delivered",
      }),
      confirmed: await ProofOfDistributionModel.countDocuments({
        toDistributor: distributorId,
        status: "confirmed",
      }),
      rejected: await ProofOfDistributionModel.countDocuments({
        toDistributor: distributorId,
        status: "rejected",
      }),
    };

    // Count transfers to pharmacy
    const totalTransfersToPharmacy = await CommercialInvoiceModel.countDocuments({
      fromDistributor: distributorId,
    });

    const transferStatusStats = {
      draft: await CommercialInvoiceModel.countDocuments({
        fromDistributor: distributorId,
        status: "draft",
      }),
      sent: await CommercialInvoiceModel.countDocuments({
        fromDistributor: distributorId,
        status: "sent",
      }),
      paid: await CommercialInvoiceModel.countDocuments({
        fromDistributor: distributorId,
        status: "paid",
      }),
    };

    // Count NFTs
    const nfts = await NFTInfoModel.find({
      owner: distributorId,
    });

    const nftStatusStats = {
      transferred: nfts.filter((nft) => nft.status === "transferred").length,
      sold: nfts.filter((nft) => nft.status === "sold").length,
    };

    return {
      invoices: {
        total: totalInvoices,
        byStatus: invoiceStatusStats,
      },
      distributions: {
        total: totalDistributions,
        byStatus: distributionStatusStats,
      },
      transfersToPharmacy: {
        total: totalTransfersToPharmacy,
        byStatus: transferStatusStats,
      },
      nfts: {
        total: nfts.length,
        byStatus: nftStatusStats,
      },
    };
  }

  async trackDrugByTokenId(distributorId, tokenId) {
    const PublicTrackingApplicationService = (await import("../../../public/application/services/PublicTrackingApplicationService.js")).PublicTrackingApplicationService;
    const TrackDrugUseCase = (await import("../../../public/application/use-cases/TrackDrugUseCase.js")).TrackDrugUseCase;
    const publicBlockchainService = (await import("../../../public/infrastructure/blockchain/BlockchainService.js")).BlockchainService;

    // Use PublicTrackingService to get tracking info
    const publicTrackingService = new PublicTrackingApplicationService(
      this._nftRepository,
      this._drugInfoRepository,
      this._proofOfProductionRepository,
      this._proofOfDistributionRepository,
      null, // proofOfPharmacyRepository not needed here
      this._manufacturerInvoiceRepository,
      this._commercialInvoiceRepository,
      new publicBlockchainService()
    );

    const TrackDrugDTO = (await import("../../../public/application/dto/TrackDrugDTO.js")).TrackDrugDTO;
    const dto = new TrackDrugDTO(tokenId);
    
    return await publicTrackingService.trackDrugByTokenId(tokenId);
  }

  async getDrugs(distributorId, filters = {}) {
    // Get all drugs (distributor can see all active drugs)
    const drugs = await this._drugInfoRepository.findAll(filters);
    
    // Filter by status if provided
    let filtered = drugs;
    if (filters.status) {
      filtered = filtered.filter(d => d.status === filters.status);
    }
    
    // Filter by search if provided
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(d => 
        d.drugName?.toLowerCase().includes(searchLower) ||
        (d.genericName && d.genericName.toLowerCase().includes(searchLower)) ||
        d.atcCode?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }

  async searchDrugByATCCode(atcCode) {
    const drug = await this._drugInfoRepository.findByATCCode(atcCode);
    
    if (!drug) {
      throw new Error(`Không tìm thấy thuốc với ATC code ${atcCode}`);
    }

    return drug;
  }

  async getProfile(distributorId, user) {
    // Get business entity using repository
    const { BusinessEntityRepository } = await import(
      "../../../registration/infrastructure/persistence/BusinessEntityRepository.js"
    );
    const businessEntityRepo = new BusinessEntityRepository();
    
    const distributor = await businessEntityRepo.findByUserId(
      user.id || user._id?.toString(),
      "distributor"
    );

    // Get user info
    const { UserModel } = await import(
      "../../../identity-access/infrastructure/persistence/mongoose/schemas/UserSchema.js"
    );
    const userInfo = await UserModel.findById(user._id || user.id).select(
      "-password"
    );

    // Format distributor
    let formattedDistributor = null;
    if (distributor) {
      formattedDistributor = {
        id: distributor.id || distributor._id?.toString(),
        name: distributor.name,
        licenseNo: distributor.licenseNo,
        taxCode: distributor.taxCode,
        status: distributor.status,
        walletAddress: distributor.walletAddress,
      };
    }

    return {
      user: userInfo ? userInfo.toObject() : user,
      distributor: formattedDistributor,
    };
  }

  async getPharmacies(filters = {}) {
    const { PharmacyModel } = await import("../../../registration/infrastructure/persistence/mongoose/schemas/BusinessEntitySchemas.js");
    
    const query = { status: filters.status || "active" };
    
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { licenseNo: { $regex: filters.search, $options: "i" } },
        { taxCode: { $regex: filters.search, $options: "i" } },
      ];
    }

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const skip = (page - 1) * limit;

    const pharmacies = await PharmacyModel.find(query)
      .populate("user", "username email fullName walletAddress")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await PharmacyModel.countDocuments(query);

    return {
      pharmacies,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getChartOneWeek(distributorId) {
    const DateHelper = (await import("../../../../shared-kernel/utils/DateHelper.js")).default;
    const DataAggregationService = (await import("../../../../shared-kernel/utils/DataAggregationService.js")).default;
    const { ManufacturerInvoiceModel } = await import("../../../supply-chain/infrastructure/persistence/mongoose/schemas/ManufacturerInvoiceSchema.js");

    const { start: sevenDaysAgo } = DateHelper.getWeekRange();
    const invoices = await ManufacturerInvoiceModel.find({
      toDistributor: distributorId,
      createdAt: { $gte: sevenDaysAgo },
    })
      .populate("fromManufacturer", "username email fullName")
      .populate("proofOfProduction")
      .sort({ createdAt: -1 });

    // Group theo ngày
    const dailyStats = DataAggregationService.groupInvoicesByDate(invoices);

    return {
      invoices,
      count: invoices.length,
      from: sevenDaysAgo,
      to: new Date(),
      dailyStats,
    };
  }

  async _getInvoicePharmacyId(invoiceId) {
    if (!invoiceId) {
      return null;
    }

    const mongoose = await import("mongoose");
    const objectId = String(invoiceId).trim();
    if (!mongoose.default.Types.ObjectId.isValid(objectId)) {
      return null;
    }

    const { CommercialInvoiceModel } = await import("../../infrastructure/persistence/mongoose/schemas/CommercialInvoiceSchema.js");
    const rawInvoice = await CommercialInvoiceModel.findById(objectId).select("toPharmacy").lean();
    return rawInvoice?.toPharmacy ? rawInvoice.toPharmacy.toString() : null;
  }

  async _resolvePharmacyUserId(pharmacyId) {
    if (!pharmacyId) {
      return null;
    }

    const normalizedId = String(pharmacyId).trim();
    const mongoose = await import("mongoose");
    if (!mongoose.default.Types.ObjectId.isValid(normalizedId)) {
      return normalizedId;
    }

    const { PharmacyModel } = await import("../../../registration/infrastructure/persistence/mongoose/schemas/BusinessEntitySchemas.js");
    const pharmacyEntity = await PharmacyModel.findById(normalizedId).select("user");
    if (pharmacyEntity?.user) {
      return pharmacyEntity.user.toString();
    }

    return normalizedId;
  }

  async getChartTodayYesterday(distributorId) {
    const DateHelper = (await import("../../../../shared-kernel/utils/DateHelper.js")).default;
    const StatisticsCalculationService = (await import("../../../../shared-kernel/utils/StatisticsCalculationService.js")).default;
    const { ManufacturerInvoiceModel } = await import("../../../supply-chain/infrastructure/persistence/mongoose/schemas/ManufacturerInvoiceSchema.js");

    const { start: startOfToday } = DateHelper.getTodayRange();
    const { start: startOfYesterday } = DateHelper.getYesterdayRange();

    // Đếm số invoice của hôm qua
    const yesterdayCount = await ManufacturerInvoiceModel.countDocuments({
      toDistributor: distributorId,
      createdAt: { $gte: startOfYesterday, $lt: startOfToday },
    });

    // Đếm số invoice của hôm nay
    const todayCount = await ManufacturerInvoiceModel.countDocuments({
      toDistributor: distributorId,
      createdAt: { $gte: startOfToday },
    });

    // Tính chênh lệch và phần trăm thay đổi
    const { diff, percentChange } = StatisticsCalculationService.calculateTodayYesterdayStats(
      todayCount,
      yesterdayCount
    );

    const todayInvoices = await ManufacturerInvoiceModel.find({
      toDistributor: distributorId,
      createdAt: { $gte: startOfToday },
    })
      .populate("fromManufacturer", "username email fullName")
      .populate("proofOfProduction")
      .sort({ createdAt: -1 });

    return {
      todayCount,
      yesterdayCount,
      diff,
      percentChange,
      todayInvoicesCount: todayInvoices.length,
      todayInvoices: todayInvoices,
      period: {
        yesterdayFrom: startOfYesterday,
        yesterdayTo: new Date(startOfToday.getTime() - 1),
        todayFrom: startOfToday,
        now: new Date(),
      },
    };
  }

  async getInvoicesByDateRange(distributorId, startDate, endDate) {
    const DateHelper = (await import("../../../../shared-kernel/utils/DateHelper.js")).default;
    const DataAggregationService = (await import("../../../../shared-kernel/utils/DataAggregationService.js")).default;
    const StatisticsCalculationService = (await import("../../../../shared-kernel/utils/StatisticsCalculationService.js")).default;
    const { ManufacturerInvoiceModel } = await import("../../../supply-chain/infrastructure/persistence/mongoose/schemas/ManufacturerInvoiceSchema.js");

    const { start, end } = DateHelper.parseDateRange(startDate, endDate);

    // Query invoices từ manufacturer trong khoảng thời gian
    const invoices = await ManufacturerInvoiceModel.find({
      toDistributor: distributorId,
      createdAt: {
        $gte: start,
        $lte: end,
      },
    })
      .populate("fromManufacturer", "username email fullName")
      .populate("proofOfProduction")
      .sort({ createdAt: -1 });

    // Tính tổng số lượng
    const totalQuantity = DataAggregationService.calculateTotalQuantity(invoices, 'quantity');

    // Group theo ngày để dễ vẽ biểu đồ
    const dailyStats = DataAggregationService.groupInvoicesByDate(invoices);

    const days = DateHelper.getDaysDifference(start, end);

    return {
      dateRange: {
        from: start,
        to: end,
        days,
      },
      summary: {
        totalInvoices: invoices.length,
        totalQuantity,
        averagePerDay: StatisticsCalculationService.calculateAveragePerDay(invoices.length, days),
      },
      dailyStats,
      invoices,
    };
  }

  async getDistributionsByDateRange(distributorId, startDate, endDate) {
    const DateHelper = (await import("../../../../shared-kernel/utils/DateHelper.js")).default;
    const DataAggregationService = (await import("../../../../shared-kernel/utils/DataAggregationService.js")).default;
    const StatisticsCalculationService = (await import("../../../../shared-kernel/utils/StatisticsCalculationService.js")).default;
    const { ProofOfDistributionModel } = await import("../../infrastructure/persistence/mongoose/schemas/ProofOfDistributionSchema.js");

    const { start, end } = DateHelper.parseDateRange(startDate, endDate);

    // Query distributions trong khoảng thời gian
    const distributions = await ProofOfDistributionModel.find({
      toDistributor: distributorId,
      createdAt: {
        $gte: start,
        $lte: end,
      },
    })
      .populate("fromManufacturer", "username email fullName")
      .populate("manufacturerInvoice")
      .sort({ createdAt: -1 });

    // Tính tổng số lượng
    const totalQuantity = DataAggregationService.calculateTotalQuantity(distributions, 'distributedQuantity');

    // Group theo ngày để dễ vẽ biểu đồ
    const dailyStats = DataAggregationService.groupDistributionsByDate(distributions);

    const days = DateHelper.getDaysDifference(start, end);

    return {
      dateRange: {
        from: start,
        to: end,
        days,
      },
      summary: {
        totalDistributions: distributions.length,
        totalQuantity,
        averagePerDay: StatisticsCalculationService.calculateAveragePerDay(distributions.length, days),
      },
      dailyStats,
      distributions,
    };
  }

  async getTransfersToPharmacyByDateRange(distributorId, startDate, endDate) {
    const DateHelper = (await import("../../../../shared-kernel/utils/DateHelper.js")).default;
    const DataAggregationService = (await import("../../../../shared-kernel/utils/DataAggregationService.js")).default;
    const StatisticsCalculationService = (await import("../../../../shared-kernel/utils/StatisticsCalculationService.js")).default;
    const { CommercialInvoiceModel } = await import("../../infrastructure/persistence/mongoose/schemas/CommercialInvoiceSchema.js");

    if (!startDate || !endDate) {
      throw new Error("Vui lòng cung cấp startDate và endDate");
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (start > end) {
      throw new Error("startDate phải nhỏ hơn hoặc bằng endDate");
    }

    // Query commercial invoices (chuyển giao cho pharmacy) trong khoảng thời gian
    const commercialInvoices = await CommercialInvoiceModel.find({
      fromDistributor: distributorId,
      createdAt: {
        $gte: start,
        $lte: end,
      },
    })
      .populate("toPharmacy", "username email fullName")
      .populate("drug", "tradeName atcCode")
      .sort({ createdAt: -1 });

    // Tính tổng số lượng
    const totalQuantity = DataAggregationService.calculateTotalQuantity(commercialInvoices, 'quantity');

    // Group theo ngày để dễ vẽ biểu đồ
    const dailyStats = DataAggregationService.groupInvoicesByDate(commercialInvoices);

    const days = DateHelper.getDaysDifference(start, end);

    return {
      dateRange: {
        from: start,
        to: end,
        days,
      },
      summary: {
        totalTransfers: commercialInvoices.length,
        totalQuantity,
        averagePerDay: StatisticsCalculationService.calculateAveragePerDay(commercialInvoices.length, days),
      },
      dailyStats,
      transfers: commercialInvoices,
    };
  }

  async createContractRequest(dto, distributorId, distributorPrivateKey = null) {
    return await this._createContractRequestUseCase.execute(
      dto,
      distributorId,
      distributorPrivateKey
    );
  }

  async finalizeContractAndMint(dto, distributorId, distributorPrivateKey) {
    return await this._finalizeContractAndMintUseCase.execute(dto, distributorId, distributorPrivateKey);
  }

  async getContracts(distributorId, filters = {}) {
    return await this._contractRepository.findByDistributor(distributorId, filters);
  }

  async getContractDetail(distributorId, contractId) {
    const contract = await this._contractRepository.findById(contractId);
    
    if (!contract) {
      throw new Error("Không tìm thấy contract");
    }

    if (contract.distributorId !== distributorId) {
      throw new Error("Bạn không có quyền xem contract này");
    }

    return contract;
  }

  async getContractInfoFromBlockchain(distributorAddress, pharmacyAddress) {
    return await this._contractBlockchainService.getContractInfoByDistributor(distributorAddress, pharmacyAddress);
  }

  async getMonthlyTrends(distributorId, months = 6) {
    const { ManufacturerInvoiceModel } = await import("../../../supply-chain/infrastructure/persistence/mongoose/schemas/ManufacturerInvoiceSchema.js");
    const { CommercialInvoiceModel } = await import("../../infrastructure/persistence/mongoose/schemas/CommercialInvoiceSchema.js");
    const { ProofOfDistributionModel } = await import("../../infrastructure/persistence/mongoose/schemas/ProofOfDistributionSchema.js");

    // Validate months parameter
    const numMonths = parseInt(months);
    if (isNaN(numMonths) || numMonths < 1 || numMonths > 24) {
      throw new Error("Số tháng phải từ 1 đến 24");
    }
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - numMonths);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    // Query invoices from manufacturer
    const invoicesFromManufacturer = await ManufacturerInvoiceModel.find({
      toDistributor: distributorId,
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ createdAt: 1 });

    // Query distributions
    const distributions = await ProofOfDistributionModel.find({
      toDistributor: distributorId,
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ createdAt: 1 });

    // Query transfers to pharmacy
    const transfersToPharmacy = await CommercialInvoiceModel.find({
      fromDistributor: distributorId,
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ createdAt: 1 });

    // Group by month
    const monthlyData = {};

    // Initialize all months
    for (let i = 0; i < numMonths; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = {
        month: monthKey,
        year: date.getFullYear(),
        monthNumber: date.getMonth() + 1,
        invoicesReceived: 0,
        invoicesReceivedQuantity: 0,
        distributions: 0,
        distributionsQuantity: 0,
        transfersToPharmacy: 0,
        transfersToPharmacyQuantity: 0,
      };
    }

    // Aggregate invoices from manufacturer
    invoicesFromManufacturer.forEach(invoice => {
      const date = new Date(invoice.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].invoicesReceived++;
        monthlyData[monthKey].invoicesReceivedQuantity += invoice.quantity || 0;
      }
    });

    // Aggregate distributions
    distributions.forEach(dist => {
      const date = new Date(dist.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].distributions++;
        monthlyData[monthKey].distributionsQuantity += dist.distributedQuantity || 0;
      }
    });

    // Aggregate transfers to pharmacy
    transfersToPharmacy.forEach(transfer => {
      const date = new Date(transfer.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].transfersToPharmacy++;
        monthlyData[monthKey].transfersToPharmacyQuantity += transfer.quantity || 0;
      }
    });

    // Convert to array and sort by month (oldest first)
    const trends = Object.values(monthlyData).sort((a, b) => {
      return a.month.localeCompare(b.month);
    });

    return {
      dateRange: {
        from: startDate,
        to: endDate,
        months: numMonths,
      },
      summary: {
        totalInvoicesReceived: invoicesFromManufacturer.length,
        totalInvoicesReceivedQuantity: invoicesFromManufacturer.reduce((sum, inv) => sum + (inv.quantity || 0), 0),
        totalDistributions: distributions.length,
        totalDistributionsQuantity: distributions.reduce((sum, dist) => sum + (dist.distributedQuantity || 0), 0),
        totalTransfersToPharmacy: transfersToPharmacy.length,
        totalTransfersToPharmacyQuantity: transfersToPharmacy.reduce((sum, trans) => sum + (trans.quantity || 0), 0),
      },
      trends,
    };
  }

  async getDashboardStats(distributorId) {
    const DateHelper = (await import("../../../../shared-kernel/utils/DateHelper.js")).default;
    const StatisticsCalculationService = (await import("../../../../shared-kernel/utils/StatisticsCalculationService.js")).default;
    const { ManufacturerInvoiceModel } = await import("../../../supply-chain/infrastructure/persistence/mongoose/schemas/ManufacturerInvoiceSchema.js");
    const { CommercialInvoiceModel } = await import("../../infrastructure/persistence/mongoose/schemas/CommercialInvoiceSchema.js");
    const { ProofOfDistributionModel } = await import("../../infrastructure/persistence/mongoose/schemas/ProofOfDistributionSchema.js");
    const { NFTInfoModel } = await import("../../../supply-chain/infrastructure/persistence/mongoose/schemas/NFTInfoSchema.js");

    // Get date ranges
    const { start: startOfToday } = DateHelper.getTodayRange();
    const { start: startOfYesterday } = DateHelper.getYesterdayRange();
    const { start: sevenDaysAgo } = DateHelper.getWeekRange();

    // === INVOICES FROM MANUFACTURER ===
    const totalInvoicesReceived = await ManufacturerInvoiceModel.countDocuments({
      toDistributor: distributorId,
    });

    const todayInvoicesReceived = await ManufacturerInvoiceModel.countDocuments({
      toDistributor: distributorId,
      createdAt: { $gte: startOfToday },
    });

    const yesterdayInvoicesReceived = await ManufacturerInvoiceModel.countDocuments({
      toDistributor: distributorId,
      createdAt: { $gte: startOfYesterday, $lt: startOfToday },
    });

    const weekInvoicesReceived = await ManufacturerInvoiceModel.countDocuments({
      toDistributor: distributorId,
      createdAt: { $gte: sevenDaysAgo },
    });

    const { diff: invoicesDiff, percentChange: invoicesPercentChange } = 
      StatisticsCalculationService.calculateTodayYesterdayStats(todayInvoicesReceived, yesterdayInvoicesReceived);

    // Invoices by status
    const invoicesByStatus = {
      pending: await ManufacturerInvoiceModel.countDocuments({
        toDistributor: distributorId,
        status: "pending",
      }),
      issued: await ManufacturerInvoiceModel.countDocuments({
        toDistributor: distributorId,
        status: "issued",
      }),
      sent: await ManufacturerInvoiceModel.countDocuments({
        toDistributor: distributorId,
        status: "sent",
      }),
      paid: await ManufacturerInvoiceModel.countDocuments({
        toDistributor: distributorId,
        status: "paid",
      }),
    };

    // === DISTRIBUTIONS ===
    const totalDistributions = await ProofOfDistributionModel.countDocuments({
      toDistributor: distributorId,
    });

    const todayDistributions = await ProofOfDistributionModel.countDocuments({
      toDistributor: distributorId,
      createdAt: { $gte: startOfToday },
    });

    const yesterdayDistributions = await ProofOfDistributionModel.countDocuments({
      toDistributor: distributorId,
      createdAt: { $gte: startOfYesterday, $lt: startOfToday },
    });

    const weekDistributions = await ProofOfDistributionModel.countDocuments({
      toDistributor: distributorId,
      createdAt: { $gte: sevenDaysAgo },
    });

    const { diff: distributionsDiff, percentChange: distributionsPercentChange } = 
      StatisticsCalculationService.calculateTodayYesterdayStats(todayDistributions, yesterdayDistributions);

    // Distributions by status
    const distributionsByStatus = {
      pending: await ProofOfDistributionModel.countDocuments({
        toDistributor: distributorId,
        status: "pending",
      }),
      in_transit: await ProofOfDistributionModel.countDocuments({
        toDistributor: distributorId,
        status: "in_transit",
      }),
      delivered: await ProofOfDistributionModel.countDocuments({
        toDistributor: distributorId,
        status: "delivered",
      }),
      confirmed: await ProofOfDistributionModel.countDocuments({
        toDistributor: distributorId,
        status: "confirmed",
      }),
    };

    // === TRANSFERS TO PHARMACY ===
    const totalTransfersToPharmacy = await CommercialInvoiceModel.countDocuments({
      fromDistributor: distributorId,
    });

    const todayTransfersToPharmacy = await CommercialInvoiceModel.countDocuments({
      fromDistributor: distributorId,
      createdAt: { $gte: startOfToday },
    });

    const yesterdayTransfersToPharmacy = await CommercialInvoiceModel.countDocuments({
      fromDistributor: distributorId,
      createdAt: { $gte: startOfYesterday, $lt: startOfToday },
    });

    const weekTransfersToPharmacy = await CommercialInvoiceModel.countDocuments({
      fromDistributor: distributorId,
      createdAt: { $gte: sevenDaysAgo },
    });

    const { diff: transfersDiff, percentChange: transfersPercentChange } = 
      StatisticsCalculationService.calculateTodayYesterdayStats(todayTransfersToPharmacy, yesterdayTransfersToPharmacy);

    // Transfers by status
    const transfersByStatus = {
      draft: await CommercialInvoiceModel.countDocuments({
        fromDistributor: distributorId,
        status: "draft",
      }),
      sent: await CommercialInvoiceModel.countDocuments({
        fromDistributor: distributorId,
        status: "sent",
      }),
      paid: await CommercialInvoiceModel.countDocuments({
        fromDistributor: distributorId,
        status: "paid",
      }),
    };

    // === NFTs ===
    const totalNFTs = await NFTInfoModel.countDocuments({
      owner: distributorId,
    });

    const nftsByStatus = {
      minted: await NFTInfoModel.countDocuments({
        owner: distributorId,
        status: "minted",
      }),
      transferred: await NFTInfoModel.countDocuments({
        owner: distributorId,
        status: "transferred",
      }),
      sold: await NFTInfoModel.countDocuments({
        owner: distributorId,
        status: "sold",
      }),
    };

    // === RECENT ACTIVITIES ===
    const recentInvoices = await ManufacturerInvoiceModel.find({
      toDistributor: distributorId,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("fromManufacturer", "username email fullName")
      .lean();

    const recentTransfers = await CommercialInvoiceModel.find({
      fromDistributor: distributorId,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("toPharmacy", "username email fullName")
      .lean();

    return {
      overview: {
        invoicesReceived: {
          total: totalInvoicesReceived,
          today: todayInvoicesReceived,
          yesterday: yesterdayInvoicesReceived,
          thisWeek: weekInvoicesReceived,
          todayVsYesterday: {
            diff: invoicesDiff,
            percentChange: invoicesPercentChange,
          },
          byStatus: invoicesByStatus,
        },
        distributions: {
          total: totalDistributions,
          today: todayDistributions,
          yesterday: yesterdayDistributions,
          thisWeek: weekDistributions,
          todayVsYesterday: {
            diff: distributionsDiff,
            percentChange: distributionsPercentChange,
          },
          byStatus: distributionsByStatus,
        },
        transfersToPharmacy: {
          total: totalTransfersToPharmacy,
          today: todayTransfersToPharmacy,
          yesterday: yesterdayTransfersToPharmacy,
          thisWeek: weekTransfersToPharmacy,
          todayVsYesterday: {
            diff: transfersDiff,
            percentChange: transfersPercentChange,
          },
          byStatus: transfersByStatus,
        },
        nfts: {
          total: totalNFTs,
          byStatus: nftsByStatus,
        },
      },
      recentActivities: {
        recentInvoices: recentInvoices.map(inv => ({
          id: inv._id,
          invoiceNumber: inv.invoiceNumber,
          manufacturer: inv.fromManufacturer,
          quantity: inv.quantity,
          status: inv.status,
          createdAt: inv.createdAt,
        })),
        recentTransfers: recentTransfers.map(trans => ({
          id: trans._id,
          invoiceNumber: trans.invoiceNumber,
          pharmacy: trans.toPharmacy,
          quantity: trans.quantity,
          status: trans.status,
          createdAt: trans.createdAt,
        })),
      },
      timestamp: new Date(),
    };
  }
}

