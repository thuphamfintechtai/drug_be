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
    return await this._transferToPharmacyUseCase.execute(
      distributorId,
      pharmacyId,
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
    // Find invoice
    const invoice = await this._commercialInvoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw new Error("Không tìm thấy invoice");
    }

    // Check ownership
    if (invoice.fromDistributorId !== distributorId) {
      throw new Error("Bạn không có quyền cập nhật invoice này");
    }

    // Update invoice with transaction hash
    invoice.setChainTxHash(transactionHash);
    invoice.markAsSent(transactionHash);

    // Update NFTs with transaction hash and transfer to pharmacy
    const nfts = await this._nftRepository.findByTokenIds(tokenIds);
    for (const nft of nfts) {
      nft.setMintTransaction(transactionHash);
      nft.transfer(invoice.toPharmacyId, transactionHash);
      await this._nftRepository.save(nft);
    }

    await this._commercialInvoiceRepository.save(invoice);

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      chainTxHash: invoice.chainTxHash,
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
    // Get business entity
    const BusinessEntityFactory = (await import("../../../../services/factories/BusinessEntityFactory.js")).BusinessEntityFactory;
    const distributor = await BusinessEntityFactory.getBusinessEntityWithValidation(user, "distributor");
    
    // Get user info
    const { UserModel } = await import("../../../identity-access/infrastructure/persistence/mongoose/schemas/UserSchema.js");
    const userInfo = await UserModel.findById(user._id || user.id).select("-password");

    return {
      user: userInfo ? userInfo.toObject() : user,
      distributor: distributor ? distributor.toObject() : distributor,
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

  async createContractRequest(dto, distributorId, distributorPrivateKey) {
    return await this._createContractRequestUseCase.execute(dto, distributorId, distributorPrivateKey);
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
}

