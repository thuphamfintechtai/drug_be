import { ConfirmReceiptUseCase } from "../use-cases/ConfirmReceiptUseCase.js";
import { ConfirmContractUseCase } from "../use-cases/ConfirmContractUseCase.js";
import { ConfirmReceiptDTO } from "../dto/ConfirmReceiptDTO.js";
import { ConfirmContractDTO } from "../dto/ConfirmContractDTO.js";

export class PharmacyApplicationService {
  constructor(
    commercialInvoiceRepository,
    proofOfPharmacyRepository,
    nftRepository,
    contractRepository,
    contractBlockchainService,
    userRepository,
    eventBus,
    drugInfoRepository = null
  ) {
    this._commercialInvoiceRepository = commercialInvoiceRepository;
    this._proofOfPharmacyRepository = proofOfPharmacyRepository;
    this._nftRepository = nftRepository;
    this._contractRepository = contractRepository;
    this._contractBlockchainService = contractBlockchainService;
    this._userRepository = userRepository;
    this._drugInfoRepository = drugInfoRepository;
    this._eventBus = eventBus;

    this._confirmReceiptUseCase = new ConfirmReceiptUseCase(
      commercialInvoiceRepository,
      proofOfPharmacyRepository,
      nftRepository,
      eventBus
    );

    this._confirmContractUseCase = new ConfirmContractUseCase(
      contractRepository,
      contractBlockchainService,
      userRepository
    );
  }

  async confirmReceipt(dto, pharmacyId) {
    return await this._confirmReceiptUseCase.execute(dto, pharmacyId);
  }

  async getInvoicesFromDistributor(pharmacyId, filters = {}) {
    return await this._commercialInvoiceRepository.findByPharmacy(
      pharmacyId,
      filters
    );
  }

  async getReceiptHistory(pharmacyId, filters = {}) {
    return await this._proofOfPharmacyRepository.findByPharmacy(
      pharmacyId,
      filters
    );
  }

  async getStatistics(pharmacyId) {
    // Import models for statistics
    const { CommercialInvoiceModel } = await import(
      "../../../distributor/infrastructure/persistence/mongoose/schemas/CommercialInvoiceSchema.js"
    );
    const { ProofOfPharmacyModel } = await import(
      "../../infrastructure/persistence/mongoose/schemas/ProofOfPharmacySchema.js"
    );
    const { NFTInfoModel } = await import(
      "../../../supply-chain/infrastructure/persistence/mongoose/schemas/NFTInfoSchema.js"
    );

    // Count invoices from distributor
    const totalInvoices = await CommercialInvoiceModel.countDocuments({
      toPharmacy: pharmacyId,
    });

    const invoiceStatusStats = {
      draft: await CommercialInvoiceModel.countDocuments({
        toPharmacy: pharmacyId,
        status: "draft",
      }),
      issued: await CommercialInvoiceModel.countDocuments({
        toPharmacy: pharmacyId,
        status: "issued",
      }),
      sent: await CommercialInvoiceModel.countDocuments({
        toPharmacy: pharmacyId,
        status: "sent",
      }),
      paid: await CommercialInvoiceModel.countDocuments({
        toPharmacy: pharmacyId,
        status: "paid",
      }),
      cancelled: await CommercialInvoiceModel.countDocuments({
        toPharmacy: pharmacyId,
        status: "cancelled",
      }),
    };

    // Count receipts
    const totalReceipts = await ProofOfPharmacyModel.countDocuments({
      toPharmacy: pharmacyId,
    });

    const receiptStatusStats = {
      pending: await ProofOfPharmacyModel.countDocuments({
        toPharmacy: pharmacyId,
        status: "pending",
      }),
      received: await ProofOfPharmacyModel.countDocuments({
        toPharmacy: pharmacyId,
        status: "received",
      }),
      verified: await ProofOfPharmacyModel.countDocuments({
        toPharmacy: pharmacyId,
        status: "verified",
      }),
      completed: await ProofOfPharmacyModel.countDocuments({
        toPharmacy: pharmacyId,
        status: "completed",
      }),
      rejected: await ProofOfPharmacyModel.countDocuments({
        toPharmacy: pharmacyId,
        status: "rejected",
      }),
    };

    // Count NFTs
    const nfts = await NFTInfoModel.find({
      owner: pharmacyId,
    });

    const nftStatusStats = {
      minted: nfts.filter((nft) => nft.status === "minted").length,
      transferred: nfts.filter((nft) => nft.status === "transferred").length,
      sold: nfts.filter((nft) => nft.status === "sold").length,
      expired: nfts.filter((nft) => nft.status === "expired").length,
      recalled: nfts.filter((nft) => nft.status === "recalled").length,
    };

    return {
      invoices: {
        total: totalInvoices,
        byStatus: invoiceStatusStats,
      },
      receipts: {
        total: totalReceipts,
        byStatus: receiptStatusStats,
      },
      transfers: {
        total: totalReceipts,
      },
      nfts: {
        total: nfts.length,
        byStatus: nftStatusStats,
      },
    };
  }

  async trackDrugByTokenId(pharmacyId, tokenId) {
    // Use injected repositories if available, otherwise create new instances
    const { PublicTrackingApplicationService } = await import(
      "../../../public/application/services/PublicTrackingApplicationService.js"
    );
    const { BlockchainService } = await import(
      "../../../public/infrastructure/blockchain/BlockchainService.js"
    );

    // Use injected drugInfoRepository if available
    let drugInfoRepo = this._drugInfoRepository;
    if (!drugInfoRepo) {
      const { DrugInfoRepository } = await import(
        "../../../supply-chain/infrastructure/persistence/mongoose/DrugInfoRepository.js"
      );
      drugInfoRepo = new DrugInfoRepository();
    }

    // Create other repositories as needed
    const { ProofOfProductionRepository } = await import(
      "../../../supply-chain/infrastructure/persistence/mongoose/ProofOfProductionRepository.js"
    );
    const { ProofOfDistributionRepository } = await import(
      "../../../distributor/infrastructure/persistence/mongoose/ProofOfDistributionRepository.js"
    );
    const { ManufacturerInvoiceRepository } = await import(
      "../../../supply-chain/infrastructure/persistence/mongoose/ManufacturerInvoiceRepository.js"
    );
    const { CommercialInvoiceRepository } = await import(
      "../../../distributor/infrastructure/persistence/mongoose/CommercialInvoiceRepository.js"
    );

    // Use PublicTrackingService to get tracking info
    const publicTrackingService = new PublicTrackingApplicationService(
      this._nftRepository,
      drugInfoRepo,
      new ProofOfProductionRepository(),
      new ProofOfDistributionRepository(),
      this._proofOfPharmacyRepository,
      new ManufacturerInvoiceRepository(),
      new CommercialInvoiceRepository(),
      new BlockchainService()
    );

    return await publicTrackingService.trackDrugByTokenId(tokenId);
  }

  async getDrugs(pharmacyId, filters = {}) {
    // Use injected repository if available, otherwise create new instance
    let repo = this._drugInfoRepository;
    if (!repo) {
      const DrugInfoRepository = (
        await import(
          "../../../supply-chain/infrastructure/persistence/mongoose/DrugInfoRepository.js"
        )
      ).DrugInfoRepository;
      repo = new DrugInfoRepository();
    }

    const drugs = await repo.findAll(filters);

    // Filter by status if provided
    let filtered = drugs;
    if (filters.status) {
      filtered = filtered.filter((d) => d.status === filters.status);
    }

    // Filter by search if provided
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.drugName?.toLowerCase().includes(searchLower) ||
          (d.genericName &&
            d.genericName.toLowerCase().includes(searchLower)) ||
          d.atcCode?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }

  async searchDrugByATCCode(atcCode) {
    // Use injected repository if available, otherwise create new instance
    let repo = this._drugInfoRepository;
    if (!repo) {
      const DrugInfoRepository = (
        await import(
          "../../../supply-chain/infrastructure/persistence/mongoose/DrugInfoRepository.js"
        )
      ).DrugInfoRepository;
      repo = new DrugInfoRepository();
    }

    const drug = await repo.findByATCCode(atcCode);

    if (!drug) {
      throw new Error(`Không tìm thấy thuốc với ATC code ${atcCode}`);
    }

    return drug;
  }

  async getProfile(pharmacyId, user) {
    // Get business entity
    const { BusinessEntityFactory } = await import(
      "../../../registration/infrastructure/persistence/BusinessEntityFactory.js"
    );
    const pharmacy =
      await BusinessEntityFactory.getBusinessEntityWithValidation(
        user,
        "pharmacy"
      );

    // Get user info
    const { UserModel } = await import(
      "../../../identity-access/infrastructure/persistence/mongoose/schemas/UserSchema.js"
    );
    const userInfo = await UserModel.findById(user._id || user.id).select(
      "-password"
    );

    return {
      user: userInfo ? userInfo.toObject() : user,
      pharmacy: pharmacy ? pharmacy.toObject() : pharmacy,
    };
  }

  async getChartOneWeek(pharmacyId) {
    const { default: DateHelper } = await import(
      "../../../../shared-kernel/utils/DateHelper.js"
    );
    const { default: DataAggregationService } = await import(
      "../../../../shared-kernel/utils/DataAggregationService.js"
    );
    const { CommercialInvoiceModel } = await import(
      "../../../distributor/infrastructure/persistence/mongoose/schemas/CommercialInvoiceSchema.js"
    );

    const { start: sevenDaysAgo } = DateHelper.getWeekRange();
    const invoices = await CommercialInvoiceModel.find({
      toPharmacy: pharmacyId,
      createdAt: { $gte: sevenDaysAgo },
    })
      .populate("fromDistributor", "username email fullName")
      .populate("drug", "tradeName atcCode")
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

  async getChartTodayYesterday(pharmacyId) {
    const { default: DateHelper } = await import(
      "../../../../shared-kernel/utils/DateHelper.js"
    );
    const { default: StatisticsCalculationService } = await import(
      "../../../../shared-kernel/utils/StatisticsCalculationService.js"
    );
    const { CommercialInvoiceModel } = await import(
      "../../../distributor/infrastructure/persistence/mongoose/schemas/CommercialInvoiceSchema.js"
    );

    const { start: startOfToday } = DateHelper.getTodayRange();
    const { start: startOfYesterday } = DateHelper.getYesterdayRange();

    // Đếm số invoice của hôm qua
    const yesterdayCount = await CommercialInvoiceModel.countDocuments({
      toPharmacy: pharmacyId,
      createdAt: { $gte: startOfYesterday, $lt: startOfToday },
    });

    // Đếm số invoice của hôm nay
    const todayCount = await CommercialInvoiceModel.countDocuments({
      toPharmacy: pharmacyId,
      createdAt: { $gte: startOfToday },
    });

    // Tính chênh lệch và phần trăm thay đổi
    const { diff, percentChange } =
      StatisticsCalculationService.calculateTodayYesterdayStats(
        todayCount,
        yesterdayCount
      );

    const todayInvoices = await CommercialInvoiceModel.find({
      toPharmacy: pharmacyId,
      createdAt: { $gte: startOfToday },
    })
      .populate("fromDistributor", "username email fullName")
      .populate("drug", "tradeName atcCode")
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

  async getInvoicesByDateRange(pharmacyId, startDate, endDate) {
    const { default: DateHelper } = await import(
      "../../../../shared-kernel/utils/DateHelper.js"
    );
    const { default: DataAggregationService } = await import(
      "../../../../shared-kernel/utils/DataAggregationService.js"
    );
    const { default: StatisticsCalculationService } = await import(
      "../../../../shared-kernel/utils/StatisticsCalculationService.js"
    );
    const { CommercialInvoiceModel } = await import(
      "../../../distributor/infrastructure/persistence/mongoose/schemas/CommercialInvoiceSchema.js"
    );

    const { start, end } = DateHelper.parseDateRange(startDate, endDate);

    // Query invoices trong khoảng thời gian
    const invoices = await CommercialInvoiceModel.find({
      toPharmacy: pharmacyId,
      createdAt: {
        $gte: start,
        $lte: end,
      },
    })
      .populate("fromDistributor", "username email fullName")
      .populate("drug", "tradeName atcCode")
      .sort({ createdAt: -1 });

    // Tính tổng số lượng
    const totalQuantity = DataAggregationService.calculateTotalQuantity(
      invoices,
      "quantity"
    );

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
        averagePerDay: StatisticsCalculationService.calculateAveragePerDay(
          invoices.length,
          days
        ),
      },
      dailyStats,
      invoices,
    };
  }

  async getReceiptsByDateRange(pharmacyId, startDate, endDate) {
    const { default: DateHelper } = await import(
      "../../../../shared-kernel/utils/DateHelper.js"
    );
    const { default: DataAggregationService } = await import(
      "../../../../shared-kernel/utils/DataAggregationService.js"
    );
    const { default: StatisticsCalculationService } = await import(
      "../../../../shared-kernel/utils/StatisticsCalculationService.js"
    );

    const { start, end } = DateHelper.parseDateRange(startDate, endDate);

    // Query receipts trong khoảng thời gian
    const receipts = await this._proofOfPharmacyRepository.findByPharmacy(
      pharmacyId,
      {
        startDate: start,
        endDate: end,
      }
    );

    // Convert to array if needed
    const receiptsArray = Array.isArray(receipts)
      ? receipts
      : [receipts].filter(Boolean);

    // Tính tổng số lượng
    const totalQuantity = DataAggregationService.calculateTotalQuantity(
      receiptsArray,
      "receivedQuantity"
    );

    // Group theo ngày để dễ vẽ biểu đồ
    const dailyStats =
      DataAggregationService.groupReceiptsByDate(receiptsArray);

    const days = DateHelper.getDaysDifference(start, end);

    return {
      dateRange: {
        from: start,
        to: end,
        days,
      },
      summary: {
        totalReceipts: receiptsArray.length,
        totalQuantity,
        averagePerDay: StatisticsCalculationService.calculateAveragePerDay(
          receiptsArray.length,
          days
        ),
      },
      dailyStats,
      receipts: receiptsArray,
    };
  }

  async getDistributionHistory(pharmacyId, filters = {}) {
    // This is the same as receipt history for pharmacy
    return await this.getReceiptHistory(pharmacyId, filters);
  }

  async confirmContract(dto, pharmacyId, pharmacyPrivateKey) {
    return await this._confirmContractUseCase.execute(
      dto,
      pharmacyId,
      pharmacyPrivateKey
    );
  }

  async getContracts(pharmacyId, filters = {}) {
    return await this._contractRepository.findByPharmacy(pharmacyId, filters);
  }

  async getContractDetail(pharmacyId, contractId) {
    const contract = await this._contractRepository.findById(contractId);

    if (!contract) {
      throw new Error("Không tìm thấy contract");
    }

    if (contract.pharmacyId !== pharmacyId) {
      throw new Error("Bạn không có quyền xem contract này");
    }

    return contract;
  }

  async getContractInfoFromBlockchain(pharmacyAddress, distributorAddress) {
    return await this._contractBlockchainService.getContractInfoByPharmacy(
      pharmacyAddress,
      distributorAddress
    );
  }
}
