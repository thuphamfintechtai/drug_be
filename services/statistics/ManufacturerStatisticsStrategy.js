import StatisticsStrategy from "./StatisticsStrategy.js";
import DrugInfo from "../../models/DrugInfo.js";
import NFTInfo from "../../models/NFTInfo.js";
import ProofOfProduction from "../../models/ProofOfProduction.js";
import ManufacturerInvoice from "../../models/ManufacturerInvoice.js";
import {
  getTodayRange,
  getWeekRange,
  getMonthRange,
  getYearRange,
  getDaysInRange,
  getMonthsInRange,
  getDaysDifference,
} from "./dateHelper.js";
import { calculateTotalQuantity, calculatePercentage } from "./queryHelper.js";

/**
 * Statistics Strategy cho Manufacturer (Pharma Company)
 */
export class ManufacturerStatisticsStrategy extends StatisticsStrategy {
  constructor(user, pharmaCompany) {
    super(user, pharmaCompany);
    this.manufacturerId = pharmaCompany._id;
  }

  /**
   * Lấy dashboard statistics
   */
  async getDashboard() {
    await this.validate();

    const { start: startOfToday } = getTodayRange();
    const { start: startOfWeek } = getWeekRange();
    const { start: startOfMonth } = getMonthRange();
    const { start: startOfYear } = getYearRange();

    // Thống kê sản phẩm
    const totalDrugs = await DrugInfo.countDocuments({ manufacturer: this.manufacturerId });
    const activeDrugs = await DrugInfo.countDocuments({
      manufacturer: this.manufacturerId,
      status: "active",
    });

    // Thống kê sản xuất
    const totalProductions = await ProofOfProduction.countDocuments({
      manufacturer: this.manufacturerId,
    });
    const productionsToday = await ProofOfProduction.countDocuments({
      manufacturer: this.manufacturerId,
      createdAt: { $gte: startOfToday },
    });
    const productionsThisWeek = await ProofOfProduction.countDocuments({
      manufacturer: this.manufacturerId,
      createdAt: { $gte: startOfWeek },
    });
    const productionsThisMonth = await ProofOfProduction.countDocuments({
      manufacturer: this.manufacturerId,
      createdAt: { $gte: startOfMonth },
    });

    // Thống kê số lượng sản xuất
    const productions = await ProofOfProduction.find({
      manufacturer: this.manufacturerId,
    });
    const totalQuantityProduced = calculateTotalQuantity(productions);
    const quantityThisMonth = calculateTotalQuantity(
      productions.filter((p) => p.createdAt >= startOfMonth)
    );

    // Thống kê NFT
    const companyDrugIds = await DrugInfo.find({ manufacturer: this.manufacturerId }).distinct("_id");
    const totalNFTs = await NFTInfo.countDocuments({ drug: { $in: companyDrugIds } });
    const nftsByStatus = {
      minted: await NFTInfo.countDocuments({ drug: { $in: companyDrugIds }, status: "minted" }),
      transferred: await NFTInfo.countDocuments({ drug: { $in: companyDrugIds }, status: "transferred" }),
      sold: await NFTInfo.countDocuments({ drug: { $in: companyDrugIds }, status: "sold" }),
      expired: await NFTInfo.countDocuments({ drug: { $in: companyDrugIds }, status: "expired" }),
      recalled: await NFTInfo.countDocuments({ drug: { $in: companyDrugIds }, status: "recalled" }),
    };

    // Thống kê chuyển giao
    const totalTransfers = await ManufacturerInvoice.countDocuments({
      fromManufacturer: this.user._id,
    });
    const transfersByStatus = {
      pending: await ManufacturerInvoice.countDocuments({
        fromManufacturer: this.user._id,
        status: "pending",
      }),
      sent: await ManufacturerInvoice.countDocuments({
        fromManufacturer: this.user._id,
        status: "sent",
      }),
      paid: await ManufacturerInvoice.countDocuments({
        fromManufacturer: this.user._id,
        status: "paid",
      }),
      cancelled: await ManufacturerInvoice.countDocuments({
        fromManufacturer: this.user._id,
        status: "cancelled",
      }),
    };

    // Thống kê theo thời gian (7 ngày gần nhất)
    const dailyProductions = [];
    const days = getDaysInRange(7);
    for (const { start: startOfDay, end: endOfDay } of days) {
      const count = await ProofOfProduction.countDocuments({
        manufacturer: this.manufacturerId,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });

      const dayProductions = await ProofOfProduction.find({
        manufacturer: this.manufacturerId,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });
      const quantity = calculateTotalQuantity(dayProductions);

      dailyProductions.push({
        date: startOfDay.toISOString().split("T")[0],
        count,
        quantity,
      });
    }

    // Thống kê top sản phẩm
    const topDrugs = await DrugInfo.aggregate([
      { $match: { manufacturer: this.manufacturerId } },
      {
        $lookup: {
          from: "nftinfos",
          localField: "_id",
          foreignField: "drug",
          as: "nfts",
        },
      },
      {
        $project: {
          drugName: "$tradeName",
          atcCode: "$atcCode",
          nftCount: { $size: "$nfts" },
          status: 1,
        },
      },
      { $sort: { nftCount: -1 } },
      { $limit: 5 },
    ]);

    return {
      overview: {
        totalDrugs,
        activeDrugs,
        totalProductions,
        totalQuantityProduced,
        totalNFTs,
        totalTransfers,
      },
      timeBased: {
        today: { productions: productionsToday },
        thisWeek: { productions: productionsThisWeek },
        thisMonth: { productions: productionsThisMonth, quantity: quantityThisMonth },
      },
      nfts: {
        total: totalNFTs,
        byStatus: nftsByStatus,
      },
      transfers: {
        total: totalTransfers,
        byStatus: transfersByStatus,
      },
      trends: {
        dailyProductions,
      },
      topProducts: topDrugs,
    };
  }

  /**
   * Lấy supply chain statistics
   */
  async getSupplyChainStats() {
    await this.validate();

    const totalTransfers = await ManufacturerInvoice.countDocuments({
      fromManufacturer: this.user._id,
    });

    const uniqueDistributors = await ManufacturerInvoice.distinct("toDistributor", {
      fromManufacturer: this.user._id,
    });

    const invoices = await ManufacturerInvoice.find({
      fromManufacturer: this.user._id,
    });
    const totalQuantityTransferred = calculateTotalQuantity(invoices);

    // Thống kê thời gian trung bình từ sản xuất đến chuyển giao
    const productions = await ProofOfProduction.find({
      manufacturer: this.manufacturerId,
    });

    let totalDaysToTransfer = 0;
    let transferCount = 0;

    for (const production of productions) {
      const relatedInvoice = await ManufacturerInvoice.findOne({
        proofOfProduction: production._id,
      });
      if (relatedInvoice) {
        const daysDiff = getDaysDifference(production.createdAt, relatedInvoice.createdAt);
        totalDaysToTransfer += daysDiff;
        transferCount++;
      }
    }

    const avgDaysToTransfer = transferCount > 0 ? totalDaysToTransfer / transferCount : 0;

    const transfersByStatus = {
      pending: await ManufacturerInvoice.countDocuments({
        fromManufacturer: this.user._id,
        status: "pending",
      }),
      sent: await ManufacturerInvoice.countDocuments({
        fromManufacturer: this.user._id,
        status: "sent",
      }),
      paid: await ManufacturerInvoice.countDocuments({
        fromManufacturer: this.user._id,
        status: "paid",
      }),
    };

    return {
      totalTransfers,
      uniqueDistributors: uniqueDistributors.length,
      totalQuantityTransferred,
      avgDaysToTransfer: avgDaysToTransfer.toFixed(2),
      transfersByStatus,
    };
  }

  /**
   * Lấy alerts statistics
   */
  async getAlertsStats() {
    await this.validate();

    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const companyDrugIds = await DrugInfo.find({
      manufacturer: this.manufacturerId,
    }).distinct("_id");

    const expired = await NFTInfo.countDocuments({
      drug: { $in: companyDrugIds },
      expDate: { $lt: now },
      status: { $ne: "expired" },
    });

    const expiringSoon = await NFTInfo.countDocuments({
      drug: { $in: companyDrugIds },
      expDate: { $gte: now, $lte: thirtyDaysFromNow },
      status: { $ne: "expired" },
    });

    const recalled = await NFTInfo.countDocuments({
      drug: { $in: companyDrugIds },
      status: "recalled",
    });

    const pendingActions = await ManufacturerInvoice.countDocuments({
      fromManufacturer: this.user._id,
      status: "pending",
    });

    return {
      expired,
      expiringSoon,
      recalled,
      pendingActions,
    };
  }

  /**
   * Lấy blockchain statistics
   */
  async getBlockchainStats() {
    await this.validate();

    const companyDrugIds = await DrugInfo.find({
      manufacturer: this.manufacturerId,
    }).distinct("_id");

    const filter = { drug: { $in: companyDrugIds } };
    const totalNFTs = await NFTInfo.countDocuments(filter);
    const nftsWithTxHash = await NFTInfo.countDocuments({
      ...filter,
      chainTxHash: { $exists: true, $ne: null },
    });

    const nftsByStatus = {
      minted: await NFTInfo.countDocuments({ ...filter, status: "minted" }),
      transferred: await NFTInfo.countDocuments({ ...filter, status: "transferred" }),
      sold: await NFTInfo.countDocuments({ ...filter, status: "sold" }),
      expired: await NFTInfo.countDocuments({ ...filter, status: "expired" }),
      recalled: await NFTInfo.countDocuments({ ...filter, status: "recalled" }),
    };

    const blockchainCoverage = calculatePercentage(nftsWithTxHash, totalNFTs);

    return {
      totalNFTs,
      nftsWithTxHash,
      blockchainCoverage: `${blockchainCoverage}%`,
      nftsByStatus,
    };
  }

  /**
   * Lấy monthly trends
   */
  async getMonthlyTrends(months = 6) {
    await this.validate();

    const monthsData = getMonthsInRange(months);
    const trends = [];

    for (const { start: startOfMonth, end: endOfMonth, month } of monthsData) {
      const productions = await ProofOfProduction.countDocuments({
        manufacturer: this.manufacturerId,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      });

      const transfers = await ManufacturerInvoice.countDocuments({
        fromManufacturer: this.user._id,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      });

      trends.push({
        month,
        productions,
        transfers,
        receipts: 0,
      });
    }

    return trends;
  }

  /**
   * Lấy performance metrics
   */
  async getPerformanceMetrics(startDate, endDate) {
    await this.validate();

    const start = startDate ? new Date(startDate) : new Date();
    start.setMonth(start.getMonth() - 1);
    start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const productions = await ProofOfProduction.find({
      manufacturer: this.manufacturerId,
      createdAt: { $gte: start, $lte: end },
    });

    let totalDays = 0;
    let count = 0;

    for (const production of productions) {
      const invoice = await ManufacturerInvoice.findOne({
        proofOfProduction: production._id,
      });
      if (invoice) {
        const days = getDaysDifference(production.createdAt, invoice.createdAt);
        totalDays += days;
        count++;
      }
    }

    return {
      avgProductionToTransferDays: count > 0 ? (totalDays / count).toFixed(2) : 0,
      totalProductions: productions.length,
    };
  }

  /**
   * Lấy compliance statistics
   */
  async getComplianceStats() {
    await this.validate();

    const productions = await ProofOfProduction.find({
      manufacturer: this.manufacturerId,
    });

    const totalRecords = productions.length;
    const productionsWithTx = productions.filter((p) => p.chainTxHash);
    const blockchainTransactions = productionsWithTx.length;

    const missingData = [];
    const missingBatchNumber = productions.filter((p) => !p.batchNumber).length;
    const missingExpDate = productions.filter((p) => !p.expDate).length;

    if (missingBatchNumber > 0) {
      missingData.push({ field: "batchNumber", count: missingBatchNumber });
    }
    if (missingExpDate > 0) {
      missingData.push({ field: "expDate", count: missingExpDate });
    }

    return {
      blockchainTransactions,
      totalRecords,
      complianceRate: calculatePercentage(blockchainTransactions, totalRecords),
      missingData,
    };
  }

  /**
   * Lấy filter cho queries
   */
  getFilter() {
    return { manufacturer: this.manufacturerId };
  }

  /**
   * Lấy product analytics
   */
  async getProductAnalytics() {
    await this.validate();

    const drugs = await DrugInfo.find({ manufacturer: this.manufacturerId });

    const productStats = await Promise.all(
      drugs.map(async (drug) => {
        const nfts = await NFTInfo.find({ drug: drug._id });
        const productions = await ProofOfProduction.find({ drug: drug._id });
        const totalQuantity = calculateTotalQuantity(productions);

        const nftsByStatus = {
          minted: nfts.filter((n) => n.status === "minted").length,
          transferred: nfts.filter((n) => n.status === "transferred").length,
          sold: nfts.filter((n) => n.status === "sold").length,
          expired: nfts.filter((n) => n.status === "expired").length,
          recalled: nfts.filter((n) => n.status === "recalled").length,
        };

        return {
          drugId: drug._id,
          tradeName: drug.tradeName,
          atcCode: drug.atcCode,
          status: drug.status,
          totalProductions: productions.length,
          totalQuantity,
          totalNFTs: nfts.length,
          nftsByStatus,
        };
      })
    );

    return {
      products: productStats,
      totalProducts: productStats.length,
    };
  }
}

