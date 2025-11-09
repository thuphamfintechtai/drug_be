import StatisticsStrategy from "./StatisticsStrategy.js";
import NFTInfo from "../../models/NFTInfo.js";
import ProofOfDistribution from "../../models/ProofOfDistribution.js";
import ManufacturerInvoice from "../../models/ManufacturerInvoice.js";
import CommercialInvoice from "../../models/CommercialInvoice.js";
import {
  getTodayRange,
  getWeekRange,
  getMonthRange,
  getDaysInRange,
  getMonthsInRange,
  getDaysDifference,
  getThirtyDaysFromNow,
} from "./dateHelper.js";
import { calculateTotalQuantity, calculatePercentage } from "./queryHelper.js";

/**
 * Statistics Strategy cho Distributor
 */
export class DistributorStatisticsStrategy extends StatisticsStrategy {
  constructor(user, distributor) {
    super(user, distributor);
    this.distributorId = distributor._id;
  }

  /**
   * Lấy dashboard statistics
   */
  async getDashboard() {
    await this.validate();

    const { start: startOfToday } = getTodayRange();
    const { start: startOfWeek } = getWeekRange();
    const { start: startOfMonth } = getMonthRange();

    // Thống kê đơn hàng nhận từ manufacturer
    const totalInvoicesReceived = await ManufacturerInvoice.countDocuments({
      toDistributor: this.user._id,
    });
    const invoicesReceivedByStatus = {
      pending: await ManufacturerInvoice.countDocuments({
        toDistributor: this.user._id,
        status: "pending",
      }),
      sent: await ManufacturerInvoice.countDocuments({
        toDistributor: this.user._id,
        status: "sent",
      }),
      paid: await ManufacturerInvoice.countDocuments({
        toDistributor: this.user._id,
        status: "paid",
      }),
    };

    // Thống kê phân phối
    const totalDistributions = await ProofOfDistribution.countDocuments({
      toDistributor: this.user._id,
    });
    const distributionsByStatus = {
      pending: await ProofOfDistribution.countDocuments({
        toDistributor: this.user._id,
        status: "pending",
      }),
      confirmed: await ProofOfDistribution.countDocuments({
        toDistributor: this.user._id,
        status: "confirmed",
      }),
      delivered: await ProofOfDistribution.countDocuments({
        toDistributor: this.user._id,
        status: "delivered",
      }),
    };

    // Thống kê chuyển giao cho pharmacy
    const totalTransfersToPharmacy = await CommercialInvoice.countDocuments({
      fromDistributor: this.user._id,
    });
    const transfersToPharmacyByStatus = {
      draft: await CommercialInvoice.countDocuments({
        fromDistributor: this.user._id,
        status: "draft",
      }),
      sent: await CommercialInvoice.countDocuments({
        fromDistributor: this.user._id,
        status: "sent",
      }),
      paid: await CommercialInvoice.countDocuments({
        fromDistributor: this.user._id,
        status: "paid",
      }),
    };

    // Thống kê NFT
    const totalNFTs = await NFTInfo.countDocuments({ owner: this.user._id });
    const nftsByStatus = {
      transferred: await NFTInfo.countDocuments({
        owner: this.user._id,
        status: "transferred",
      }),
      sold: await NFTInfo.countDocuments({
        owner: this.user._id,
        status: "sold",
      }),
    };

    // Thống kê theo thời gian (7 ngày gần nhất)
    const dailyStats = [];
    const days = getDaysInRange(7);
    for (const { start: startOfDay, end: endOfDay } of days) {
      const invoicesReceived = await ManufacturerInvoice.countDocuments({
        toDistributor: this.user._id,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });

      const transfersToPharmacy = await CommercialInvoice.countDocuments({
        fromDistributor: this.user._id,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });

      dailyStats.push({
        date: startOfDay.toISOString().split("T")[0],
        invoicesReceived,
        transfersToPharmacy,
      });
    }

    return {
      overview: {
        totalInvoicesReceived,
        totalDistributions,
        totalTransfersToPharmacy,
        totalNFTs,
      },
      invoicesReceived: {
        total: totalInvoicesReceived,
        byStatus: invoicesReceivedByStatus,
      },
      distributions: {
        total: totalDistributions,
        byStatus: distributionsByStatus,
      },
      transfersToPharmacy: {
        total: totalTransfersToPharmacy,
        byStatus: transfersToPharmacyByStatus,
      },
      nfts: {
        total: totalNFTs,
        byStatus: nftsByStatus,
      },
      trends: {
        dailyStats,
      },
    };
  }

  /**
   * Lấy supply chain statistics
   */
  async getSupplyChainStats() {
    await this.validate();

    const uniqueManufacturers = await ManufacturerInvoice.distinct("fromManufacturer", {
      toDistributor: this.user._id,
    });

    const uniquePharmacies = await CommercialInvoice.distinct("toPharmacy", {
      fromDistributor: this.user._id,
    });

    const invoicesReceived = await ManufacturerInvoice.find({
      toDistributor: this.user._id,
    });
    const totalQuantityReceived = calculateTotalQuantity(invoicesReceived);

    const invoicesSent = await CommercialInvoice.find({
      fromDistributor: this.user._id,
    });
    const totalQuantitySent = calculateTotalQuantity(invoicesSent);

    // Thống kê thời gian trung bình
    const distributions = await ProofOfDistribution.find({
      toDistributor: this.user._id,
    });

    let totalDaysToTransfer = 0;
    let transferCount = 0;

    for (const distribution of distributions) {
      const commercialInvoice = await CommercialInvoice.findOne({
        fromDistributor: this.user._id,
        createdAt: { $gte: distribution.createdAt },
      });
      if (commercialInvoice) {
        const daysDiff = getDaysDifference(distribution.createdAt, commercialInvoice.createdAt);
        totalDaysToTransfer += daysDiff;
        transferCount++;
      }
    }

    const avgDaysToTransfer = transferCount > 0 ? totalDaysToTransfer / transferCount : 0;

    return {
      uniqueManufacturers: uniqueManufacturers.length,
      uniquePharmacies: uniquePharmacies.length,
      totalQuantityReceived,
      totalQuantitySent,
      avgDaysToTransfer: avgDaysToTransfer.toFixed(2),
      inventory: totalQuantityReceived - totalQuantitySent,
    };
  }

  /**
   * Lấy alerts statistics
   */
  async getAlertsStats() {
    await this.validate();

    const now = new Date();
    const thirtyDaysFromNow = getThirtyDaysFromNow();

    const expired = await NFTInfo.countDocuments({
      owner: this.user._id,
      expDate: { $lt: now },
      status: { $ne: "expired" },
    });

    const expiringSoon = await NFTInfo.countDocuments({
      owner: this.user._id,
      expDate: { $gte: now, $lte: thirtyDaysFromNow },
      status: { $ne: "expired" },
    });

    const pendingActions =
      (await ManufacturerInvoice.countDocuments({
        toDistributor: this.user._id,
        status: "pending",
      })) +
      (await ProofOfDistribution.countDocuments({
        toDistributor: this.user._id,
        status: "pending",
      }));

    return {
      expired,
      expiringSoon,
      recalled: 0,
      pendingActions,
    };
  }

  /**
   * Lấy blockchain statistics
   */
  async getBlockchainStats() {
    await this.validate();

    const filter = { owner: this.user._id };
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
      const transfers = await CommercialInvoice.countDocuments({
        fromDistributor: this.user._id,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      });

      trends.push({
        month,
        productions: 0,
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

    const distributions = await ProofOfDistribution.find({
      toDistributor: this.user._id,
      createdAt: { $gte: start, $lte: end },
    });

    let totalDays = 0;
    let count = 0;

    for (const distribution of distributions) {
      const commercialInvoice = await CommercialInvoice.findOne({
        fromDistributor: this.user._id,
        createdAt: { $gte: distribution.createdAt },
      });
      if (commercialInvoice) {
        const days = getDaysDifference(distribution.createdAt, commercialInvoice.createdAt);
        totalDays += days;
        count++;
      }
    }

    return {
      avgDistributionToTransferDays: count > 0 ? (totalDays / count).toFixed(2) : 0,
      totalDistributions: distributions.length,
    };
  }

  /**
   * Lấy compliance statistics
   */
  async getComplianceStats() {
    await this.validate();

    const distributions = await ProofOfDistribution.find({
      toDistributor: this.user._id,
    });

    const totalRecords = distributions.length;
    const distributionsWithTx = distributions.filter((d) => d.chainTxHash);
    const blockchainTransactions = distributionsWithTx.length;

    return {
      blockchainTransactions,
      totalRecords,
      complianceRate: calculatePercentage(blockchainTransactions, totalRecords),
      missingData: [],
    };
  }

  /**
   * Lấy filter cho queries
   */
  getFilter() {
    return { owner: this.user._id };
  }
}

