import { UploadIPFSUseCase } from "../use-cases/UploadIPFSUseCase.js";
import { MintNFTUseCase } from "../use-cases/MintNFTUseCase.js";
import { TransferToDistributorUseCase } from "../use-cases/TransferToDistributorUseCase.js";
import { UploadIPFSDTO } from "../dto/UploadIPFSDTO.js";
import { MintNFTDTO } from "../dto/MintNFTDTO.js";

export class ProductionApplicationService {
  constructor(
    drugInfoRepository,
    nftRepository,
    proofOfProductionRepository,
    manufacturerInvoiceRepository,
    ipfsService,
    eventBus
  ) {
    this._drugInfoRepository = drugInfoRepository;
    this._nftRepository = nftRepository;
    this._proofOfProductionRepository = proofOfProductionRepository;
    this._manufacturerInvoiceRepository = manufacturerInvoiceRepository;
    this._ipfsService = ipfsService;
    this._eventBus = eventBus;

    this._uploadIPFSUseCase = new UploadIPFSUseCase(ipfsService, eventBus);
    this._mintNFTUseCase = new MintNFTUseCase(
      drugInfoRepository,
      nftRepository,
      proofOfProductionRepository,
      eventBus
    );
    this._transferToDistributorUseCase = new TransferToDistributorUseCase(
      drugInfoRepository,
      nftRepository,
      manufacturerInvoiceRepository,
      proofOfProductionRepository,
      eventBus
    );
  }

  async uploadIPFS(dto, manufacturerId) {
    return await this._uploadIPFSUseCase.execute(dto, manufacturerId);
  }

  async mintNFT(dto, manufacturerId) {
    return await this._mintNFTUseCase.execute(dto, manufacturerId);
  }

  async transferToDistributor(
    manufacturerId,
    distributorId,
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
    return await this._transferToDistributorUseCase.execute(
      manufacturerId,
      distributorId,
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

  async getProductionHistory(manufacturerId, filters = {}) {
    const { ProofOfProductionModel } = await import(
      "../../infrastructure/persistence/mongoose/schemas/ProofOfProductionSchema.js"
    );

    const query = { manufacturer: manufacturerId };

    // if (filters.status) {
    //   query.status = filters.status;
    // }

    // if (filters.batchNumber) {
    //   query.batchNumber = { $regex: filters.batchNumber, $options: "i" };
    // }

    // if (filters.startDate && filters.endDate) {
    //   query.createdAt = {
    //     $gte: filters.startDate,
    //     $lte: filters.endDate,
    //   };
    // }

    const documents = await ProofOfProductionModel.find(query)
      .populate("drug")
      .sort({ createdAt: -1 });

    return documents.map((doc) => ({
      id: doc._id.toString(),
      batchNumber: doc.batchNumber,
      drug: doc.drug ? doc.drug.toObject() : null,
      quantity: doc.quantity,
      mfgDate: doc.mfgDate,
      expDate: doc.expDate,
      status: doc.status,
      chainTxHash: doc.chainTxHash,
      createdAt: doc.createdAt,
    }));
  }

  async getStatistics(manufacturerId) {
    // Import models for statistics
    const { DrugInfoModel } = await import(
      "../../infrastructure/persistence/mongoose/schemas/DrugInfoSchema.js"
    );
    const { ProofOfProductionModel } = await import(
      "../../infrastructure/persistence/mongoose/schemas/ProofOfProductionSchema.js"
    );
    const { ManufacturerInvoiceModel } = await import(
      "../../infrastructure/persistence/mongoose/schemas/ManufacturerInvoiceSchema.js"
    );
    const { NFTInfoModel } = await import(
      "../../infrastructure/persistence/mongoose/schemas/NFTInfoSchema.js"
    );

    // Count drugs
    const totalDrugs = await DrugInfoModel.countDocuments({
      manufacturer: manufacturerId,
    });
    const activeDrugs = await DrugInfoModel.countDocuments({
      manufacturer: manufacturerId,
      status: "active",
    });
    const inactiveDrugs = await DrugInfoModel.countDocuments({
      manufacturer: manufacturerId,
      status: "inactive",
    });

    // Count productions
    const totalProductions = await ProofOfProductionModel.countDocuments({
      manufacturer: manufacturerId,
    });

    // Count NFTs - only for drugs from this manufacturer
    const companyDrugIds = await DrugInfoModel.find({
      manufacturer: manufacturerId,
    }).distinct("_id");
    const nfts = await NFTInfoModel.find({
      drug: { $in: companyDrugIds },
    });

    const nftStatusStats = {
      minted: nfts.filter((nft) => nft.status === "minted").length,
      transferred: nfts.filter((nft) => nft.status === "transferred").length,
      sold: nfts.filter((nft) => nft.status === "sold").length,
      expired: nfts.filter((nft) => nft.status === "expired").length,
      recalled: nfts.filter((nft) => nft.status === "recalled").length,
    };

    // Count transfers
    const totalTransfers = await ManufacturerInvoiceModel.countDocuments({
      fromManufacturer: manufacturerId,
    });

    const transferStatusStats = {
      pending: await ManufacturerInvoiceModel.countDocuments({
        fromManufacturer: manufacturerId,
        status: "pending",
      }),
      sent: await ManufacturerInvoiceModel.countDocuments({
        fromManufacturer: manufacturerId,
        status: "sent",
      }),
      paid: await ManufacturerInvoiceModel.countDocuments({
        fromManufacturer: manufacturerId,
        status: "paid",
      }),
      cancelled: await ManufacturerInvoiceModel.countDocuments({
        fromManufacturer: manufacturerId,
        status: "cancelled",
      }),
    };

    return {
      drugs: {
        total: totalDrugs,
        active: activeDrugs,
        inactive: inactiveDrugs,
      },
      productions: {
        total: totalProductions,
      },
      nfts: {
        total: nfts.length,
        byStatus: nftStatusStats,
      },
      transfers: {
        total: totalTransfers,
        byStatus: transferStatusStats,
      },
    };
  }

  async getProfile(manufacturerId, user) {
    // Get business entity using repository
    const { BusinessEntityRepository } = await import(
      "../../../registration/infrastructure/persistence/BusinessEntityRepository.js"
    );
    const businessEntityRepo = new BusinessEntityRepository();

    const pharmaCompany = await businessEntityRepo.findByUserId(
      user.id || user._id?.toString(),
      "pharma_company"
    );

    // Get user info
    const { UserModel } = await import(
      "../../../identity-access/infrastructure/persistence/mongoose/schemas/UserSchema.js"
    );
    const userInfo = await UserModel.findById(user._id || user.id).select(
      "-password"
    );

    // Format pharma company
    let formattedPharmaCompany = null;
    if (pharmaCompany) {
      formattedPharmaCompany = {
        id: pharmaCompany.id || pharmaCompany._id?.toString(),
        name: pharmaCompany.name,
        licenseNo: pharmaCompany.licenseNo,
        taxCode: pharmaCompany.taxCode,
        status: pharmaCompany.status,
        walletAddress: pharmaCompany.walletAddress,
        ...(pharmaCompany.gmpCertNo && { gmpCertNo: pharmaCompany.gmpCertNo }),
      };
    }

    return {
      user: userInfo ? userInfo.toObject() : user,
      pharmaCompany: formattedPharmaCompany,
    };
  }

  async getDistributors(filters = {}) {
    const { DistributorModel } = await import(
      "../../../registration/infrastructure/persistence/mongoose/schemas/BusinessEntitySchemas.js"
    );

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

    const distributors = await DistributorModel.find(query)
      .populate("user", "username email fullName walletAddress")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await DistributorModel.countDocuments(query);

    return {
      distributors,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTransferHistory(manufacturerId, filters = {}) {
    const invoices =
      await this._manufacturerInvoiceRepository.findByManufacturer(
        manufacturerId,
        filters
      );
    
    // Get documents with populated distributor info
    const { ManufacturerInvoiceModel } = await import(
      "../../infrastructure/persistence/mongoose/schemas/ManufacturerInvoiceSchema.js"
    );
    
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
      .populate("toDistributor", "fullName username")
      .sort({ createdAt: -1 });
    
    // Map invoices with distributor info
    return invoices.map(invoice => {
      const doc = documents.find(d => d.invoiceNumber === invoice.invoiceNumber);
      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        fromManufacturerId: invoice.fromManufacturerId,
        toDistributorId: invoice.toDistributorId,
        drugId: invoice.drugId,
        proofOfProductionId: invoice.proofOfProductionId,
        nftInfoId: invoice.nftInfoId,
        invoiceDate: invoice.invoiceDate,
        quantity: invoice.quantity,
        unitPrice: invoice.unitPrice,
        totalAmount: invoice.totalAmount,
        vatRate: invoice.vatRate,
        vatAmount: invoice.vatAmount,
        finalAmount: invoice.finalAmount,
        notes: invoice.notes,
        status: invoice.status,
        chainTxHash: invoice.chainTxHash,
        tokenIds: invoice.tokenIds,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
        distributorName: doc?.toDistributor?.fullName || doc?.toDistributor?.username || null,
      };
    });
  }

  async getAvailableTokensForProduction(proofOfProductionId) {
    const proof = await this._proofOfProductionRepository.findById(
      proofOfProductionId
    );
    if (!proof) {
      throw new Error("ProofOfProduction không tồn tại");
    }

    const nfts = await this._nftRepository.findByProofOfProduction(
      proofOfProductionId
    );

    // Filter NFTs that can still be transferred (minted or transferred status)
    const availableNFTs = nfts.filter(
      (nft) => nft.status === "minted" || nft.status === "transferred"
    );

    return {
      proofOfProductionId: proof.id,
      batchNumber: proof.batchNumber,
      totalQuantity: proof.quantity,
      totalNFTs: nfts.length,
      availableNFTs: availableNFTs.length,
      tokenIds: availableNFTs.map((nft) => nft.tokenId),
    };
  }

  async getChartOneWeek(manufacturerId) {
    const { default: DateHelper } = await import(
      "../../../../shared-kernel/utils/DateHelper.js"
    );
    const { default: DataAggregationService } = await import(
      "../../../../shared-kernel/utils/DataAggregationService.js"
    );
    const { ProofOfProductionModel } = await import(
      "../../infrastructure/persistence/mongoose/schemas/ProofOfProductionSchema.js"
    );

    const { start: sevenDaysAgo } = DateHelper.getWeekRange();
    const productions = await ProofOfProductionModel.find({
      manufacturer: manufacturerId,
      createdAt: { $gte: sevenDaysAgo },
    })
      .populate("drug", "tradeName atcCode")
      .sort({ createdAt: -1 });

    // Group theo ngày
    const dailyStats =
      DataAggregationService.groupProductionsByDate(productions);

    return {
      productions,
      count: productions.length,
      from: sevenDaysAgo,
      to: new Date(),
      dailyStats,
    };
  }

  async getChartTodayYesterday(manufacturerId) {
    const { default: DateHelper } = await import(
      "../../../../shared-kernel/utils/DateHelper.js"
    );
    const { default: StatisticsCalculationService } = await import(
      "../../../../shared-kernel/utils/StatisticsCalculationService.js"
    );
    const { ProofOfProductionModel } = await import(
      "../../infrastructure/persistence/mongoose/schemas/ProofOfProductionSchema.js"
    );

    const { start: startOfToday } = DateHelper.getTodayRange();
    const { start: startOfYesterday } = DateHelper.getYesterdayRange();

    // Đếm số production của hôm qua
    const yesterdayCount = await ProofOfProductionModel.countDocuments({
      manufacturer: manufacturerId,
      createdAt: { $gte: startOfYesterday, $lt: startOfToday },
    });

    // Đếm số production của hôm nay
    const todayCount = await ProofOfProductionModel.countDocuments({
      manufacturer: manufacturerId,
      createdAt: { $gte: startOfToday },
    });

    // Tính chênh lệch và phần trăm thay đổi
    const { diff, percentChange } =
      StatisticsCalculationService.calculateTodayYesterdayStats(
        todayCount,
        yesterdayCount
      );

    const todayProductions = await ProofOfProductionModel.find({
      manufacturer: manufacturerId,
      createdAt: { $gte: startOfToday },
    })
      .populate("drug", "tradeName atcCode")
      .sort({ createdAt: -1 });

    return {
      todayCount,
      yesterdayCount,
      diff,
      percentChange,
      todayProductionsCount: todayProductions.length,
      todayProductions: todayProductions,
      period: {
        yesterdayFrom: startOfYesterday,
        yesterdayTo: new Date(startOfToday.getTime() - 1),
        todayFrom: startOfToday,
        now: new Date(),
      },
    };
  }

  async getProductionsByDateRange(manufacturerId, startDate, endDate) {
    const { default: DateHelper } = await import(
      "../../../../shared-kernel/utils/DateHelper.js"
    );
    const { default: DataAggregationService } = await import(
      "../../../../shared-kernel/utils/DataAggregationService.js"
    );
    const { default: StatisticsCalculationService } = await import(
      "../../../../shared-kernel/utils/StatisticsCalculationService.js"
    );
    const { ProofOfProductionModel } = await import(
      "../../infrastructure/persistence/mongoose/schemas/ProofOfProductionSchema.js"
    );
    const { BusinessEntityFactory } = await import(
      "../../../registration/infrastructure/persistence/BusinessEntityFactory.js"
    );

    const { start, end } = DateHelper.parseDateRange(startDate, endDate);

    // Query productions trong khoảng thời gian
    const productions = await ProofOfProductionModel.find({
      manufacturer: manufacturerId,
      createdAt: {
        $gte: start,
        $lte: end,
      },
    })
      .populate("drug", "tradeName atcCode")
      .sort({ createdAt: -1 });

    // Tính tổng số lượng sản xuất
    const totalQuantity = DataAggregationService.calculateTotalQuantity(
      productions,
      "quantity"
    );

    // Group theo ngày để dễ vẽ biểu đồ
    const dailyStats =
      DataAggregationService.groupProductionsByDate(productions);

    const days = DateHelper.getDaysDifference(start, end);

    return {
      dateRange: {
        from: start,
        to: end,
        days,
      },
      summary: {
        totalProductions: productions.length,
        totalQuantity,
        averagePerDay: StatisticsCalculationService.calculateAveragePerDay(
          productions.length,
          days
        ),
      },
      dailyStats,
      productions,
    };
  }

  async getDistributionsByDateRange(manufacturerId, startDate, endDate) {
    const { default: DateHelper } = await import(
      "../../../../shared-kernel/utils/DateHelper.js"
    );
    const { default: DataAggregationService } = await import(
      "../../../../shared-kernel/utils/DataAggregationService.js"
    );
    const { default: StatisticsCalculationService } = await import(
      "../../../../shared-kernel/utils/StatisticsCalculationService.js"
    );
    const { ProofOfDistributionModel } = await import(
      "../../../distributor/infrastructure/persistence/mongoose/schemas/ProofOfDistributionSchema.js"
    );

    const { start, end } = DateHelper.parseDateRange(startDate, endDate);

    // Query distributions trong khoảng thời gian
    const distributions = await ProofOfDistributionModel.find({
      fromManufacturer: manufacturerId,
      createdAt: {
        $gte: start,
        $lte: end,
      },
    }).sort({ createdAt: -1 });

    // Tính tổng số lượng
    const totalQuantity = DataAggregationService.calculateTotalQuantity(
      distributions,
      "quantity"
    );

    // Group theo ngày để dễ vẽ biểu đồ
    const dailyStats =
      DataAggregationService.groupDistributionsByDate(distributions);

    const days = DateHelper.getDaysDifference(start, end);

    return {
      dateRange: {
        from: start,
        to: end,
        days,
      },
      summary: {
        totalDistribution: distributions.length,
        totalQuantity,
        averagePerDay: StatisticsCalculationService.calculateAveragePerDay(
          distributions.length,
          days
        ),
      },
      dailyStats,
      distributions,
    };
  }

  async getTransfersByDateRange(manufacturerId, startDate, endDate) {
    const { default: DateHelper } = await import(
      "../../../../shared-kernel/utils/DateHelper.js"
    );
    const { default: DataAggregationService } = await import(
      "../../../../shared-kernel/utils/DataAggregationService.js"
    );
    const { default: StatisticsCalculationService } = await import(
      "../../../../shared-kernel/utils/StatisticsCalculationService.js"
    );
    const { ManufacturerInvoiceModel } = await import(
      "../../infrastructure/persistence/mongoose/schemas/ManufacturerInvoiceSchema.js"
    );

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

    // Query manufacturer invoices (chuyển giao cho distributor) trong khoảng thời gian
    const manufacturerInvoices = await ManufacturerInvoiceModel.find({
      fromManufacturer: manufacturerId,
      createdAt: {
        $gte: start,
        $lte: end,
      },
    })
      .populate("toDistributor", "username email fullName")
      .populate("drug", "tradeName atcCode")
      .sort({ createdAt: -1 });

    // Tính tổng số lượng
    const totalQuantity = DataAggregationService.calculateTotalQuantity(
      manufacturerInvoices,
      "quantity"
    );

    // Group theo ngày để dễ vẽ biểu đồ
    const dailyStats =
      DataAggregationService.groupInvoicesByDate(manufacturerInvoices);

    const days = DateHelper.getDaysDifference(start, end);

    return {
      dateRange: {
        from: start,
        to: end,
        days,
      },
      summary: {
        totalTransfers: manufacturerInvoices.length,
        totalQuantity,
        averagePerDay: StatisticsCalculationService.calculateAveragePerDay(
          manufacturerInvoices.length,
          days
        ),
      },
      dailyStats,
      transfers: manufacturerInvoices,
    };
  }

  async getIPFSStatus(manufacturerId, user) {
    // TODO: ManufactureIPFSStatusModel schema needs to be created
    throw new Error(
      "ManufactureIPFSStatus model chưa được migrate. Vui lòng liên hệ admin."
    );

    // const { PharmaCompanyModel } = await import(
    //   "../../registration/infrastructure/persistence/mongoose/schemas/BusinessEntitySchemas.js"
    // );
    // const ManufactureIPFSStatusModel = (
    //   await import("../../../../models/manufactureIPFSStatus.js")
    // ).default;

    const findManufacture = await PharmaCompanyModel.findOne({
      user: user._id || user.id,
    });

    if (!findManufacture) {
      throw new Error("Lỗi Không tìm thấy thông tin Manufacture");
    }

    const findManufactureIPFSStatus = await ManufactureIPFSStatusModel.find({
      manufacture: findManufacture._id,
    });

    if (!findManufactureIPFSStatus || findManufactureIPFSStatus.length === 0) {
      throw new Error("Lỗi Không tìm thấy thông tin IPFS của manufacture này");
    }

    return {
      manufacture: findManufacture,
      ipfsStatuses: findManufactureIPFSStatus,
    };
  }

  async getIPFSStatusUndone(manufacturerId, user) {
    // TODO: ManufactureIPFSStatusModel schema needs to be created
    throw new Error(
      "ManufactureIPFSStatus model chưa được migrate. Vui lòng liên hệ admin."
    );

    // const { PharmaCompanyModel } = await import(
    //   "../../registration/infrastructure/persistence/mongoose/schemas/BusinessEntitySchemas.js"
    // );
    // const ManufactureIPFSStatusModel = (
    //   await import("../../../../models/manufactureIPFSStatus.js")
    // ).default;

    const manufacturer = await PharmaCompanyModel.findOne({
      user: user._id || user.id,
    });

    if (!manufacturer) {
      throw new Error("Lỗi Không tìm thấy thông tin Manufacture");
    }

    // Find IPFS statuses that are not "SuccessFully"
    const manufacturerIPFSStatuses = await ManufactureIPFSStatusModel.find({
      manufacture: manufacturer._id,
      status: { $ne: "SuccessFully" },
    });

    if (!manufacturerIPFSStatuses || manufacturerIPFSStatuses.length === 0) {
      throw new Error("Lỗi Không tìm thấy thông tin IPFS của manufacture này");
    }

    return {
      manufacture: manufacturer,
      ipfsStatuses: manufacturerIPFSStatuses,
    };
  }
}
