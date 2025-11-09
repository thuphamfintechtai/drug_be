import StatisticsStrategy from "./StatisticsStrategy.js";
import NFTInfo from "../../models/NFTInfo.js";
import ProofOfPharmacy from "../../models/ProofOfPharmacy.js";
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
import { calculatePercentage } from "./queryHelper.js";

/**
 * Statistics Strategy cho Pharmacy
 */
export class PharmacyStatisticsStrategy extends StatisticsStrategy {
  constructor(user, pharmacy) {
    super(user, pharmacy);
    this.pharmacyId = pharmacy._id;
  }

  /**
   * Lấy dashboard statistics
   */
  async getDashboard() {
    await this.validate();

    // Thống kê đơn hàng nhận từ distributor
    const totalInvoicesReceived = await CommercialInvoice.countDocuments({
      toPharmacy: this.user._id,
    });
    const invoicesReceivedByStatus = {
      draft: await CommercialInvoice.countDocuments({
        toPharmacy: this.user._id,
        status: "draft",
      }),
      issued: await CommercialInvoice.countDocuments({
        toPharmacy: this.user._id,
        status: "issued",
      }),
      sent: await CommercialInvoice.countDocuments({
        toPharmacy: this.user._id,
        status: "sent",
      }),
      paid: await CommercialInvoice.countDocuments({
        toPharmacy: this.user._id,
        status: "paid",
      }),
    };

    // Thống kê biên nhận
    const totalReceipts = await ProofOfPharmacy.countDocuments({
      toPharmacy: this.user._id,
    });
    const receiptsByStatus = {
      pending: await ProofOfPharmacy.countDocuments({
        toPharmacy: this.user._id,
        status: "pending",
      }),
      received: await ProofOfPharmacy.countDocuments({
        toPharmacy: this.user._id,
        status: "received",
      }),
      verified: await ProofOfPharmacy.countDocuments({
        toPharmacy: this.user._id,
        status: "verified",
      }),
      completed: await ProofOfPharmacy.countDocuments({
        toPharmacy: this.user._id,
        status: "completed",
      }),
    };

    // Thống kê NFT
    const totalNFTs = await NFTInfo.countDocuments({ owner: this.user._id });
    const nftsByStatus = {
      minted: await NFTInfo.countDocuments({
        owner: this.user._id,
        status: "minted",
      }),
      transferred: await NFTInfo.countDocuments({
        owner: this.user._id,
        status: "transferred",
      }),
      sold: await NFTInfo.countDocuments({
        owner: this.user._id,
        status: "sold",
      }),
      expired: await NFTInfo.countDocuments({
        owner: this.user._id,
        status: "expired",
      }),
    };

    // Thống kê chuỗi cung ứng hoàn chỉnh
    const completedSupplyChains = await CommercialInvoice.countDocuments({
      toPharmacy: this.user._id,
      supplyChainCompleted: true,
    });

    // Thống kê theo thời gian (7 ngày gần nhất)
    const dailyStats = [];
    const days = getDaysInRange(7);
    for (const { start: startOfDay, end: endOfDay } of days) {
      const invoicesReceived = await CommercialInvoice.countDocuments({
        toPharmacy: this.user._id,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });

      const receipts = await ProofOfPharmacy.countDocuments({
        toPharmacy: this.user._id,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });

      dailyStats.push({
        date: startOfDay.toISOString().split("T")[0],
        invoicesReceived,
        receipts,
      });
    }

    const completionRate =
      totalInvoicesReceived > 0
        ? calculatePercentage(completedSupplyChains, totalInvoicesReceived)
        : "0";

    return {
      overview: {
        totalInvoicesReceived,
        totalReceipts,
        totalNFTs,
        completedSupplyChains,
      },
      invoicesReceived: {
        total: totalInvoicesReceived,
        byStatus: invoicesReceivedByStatus,
      },
      receipts: {
        total: totalReceipts,
        byStatus: receiptsByStatus,
      },
      nfts: {
        total: totalNFTs,
        byStatus: nftsByStatus,
      },
      supplyChain: {
        completed: completedSupplyChains,
        completionRate,
      },
      trends: {
        dailyStats,
      },
    };
  }

  /**
   * Lấy supply chain statistics (không áp dụng cho pharmacy)
   */
  async getSupplyChainStats() {
    await this.validate();
    return {
      message: "Supply chain statistics không khả dụng cho pharmacy",
    };
  }

  /**
   * Lấy quality statistics
   */
  async getQualityStats() {
    await this.validate();

    const receipts = await ProofOfPharmacy.find({
      toPharmacy: this.user._id,
    });

    let totalQualityChecks = 0;
    let passedQualityChecks = 0;
    let failedQualityChecks = 0;

    receipts.forEach((receipt) => {
      if (receipt.qualityCheck) {
        totalQualityChecks++;
        // Kiểm tra condition: "excellent" hoặc "good" được coi là passed
        if (receipt.qualityCheck.condition === "excellent" || receipt.qualityCheck.condition === "good") {
          passedQualityChecks++;
        } else if (receipt.qualityCheck.condition === "poor") {
          failedQualityChecks++;
        }
      }
    });

    const qualityPassRate = calculatePercentage(passedQualityChecks, totalQualityChecks);

    const now = new Date();
    const expiredNFTs = await NFTInfo.countDocuments({
      owner: this.user._id,
      expDate: { $lt: now },
      status: { $ne: "expired" },
    });

    const thirtyDaysFromNow = getThirtyDaysFromNow();
    const expiringSoonNFTs = await NFTInfo.countDocuments({
      owner: this.user._id,
      expDate: { $gte: now, $lte: thirtyDaysFromNow },
      status: { $ne: "expired" },
    });

    return {
      qualityChecks: {
        total: totalQualityChecks,
        passed: passedQualityChecks,
        failed: failedQualityChecks,
        passRate: qualityPassRate,
      },
      expiration: {
        expired: expiredNFTs,
        expiringSoon: expiringSoonNFTs,
      },
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

    const pendingActions = await ProofOfPharmacy.countDocuments({
      toPharmacy: this.user._id,
      status: "pending",
    });

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
      const receipts = await ProofOfPharmacy.countDocuments({
        toPharmacy: this.user._id,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      });

      trends.push({
        month,
        productions: 0,
        transfers: 0,
        receipts,
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

    const receipts = await ProofOfPharmacy.find({
      toPharmacy: this.user._id,
      createdAt: { $gte: start, $lte: end },
    });

    let totalDays = 0;
    let count = 0;

    receipts.forEach((receipt) => {
      if (receipt.supplyChainCompleted && receipt.completedAt) {
        const days = getDaysDifference(receipt.createdAt, receipt.completedAt);
        totalDays += days;
        count++;
      }
    });

    return {
      avgReceiptToCompletionDays: count > 0 ? (totalDays / count).toFixed(2) : 0,
      totalReceipts: receipts.length,
      completedSupplyChains: count,
    };
  }

  /**
   * Lấy compliance statistics
   */
  async getComplianceStats() {
    await this.validate();

    const receipts = await ProofOfPharmacy.find({
      toPharmacy: this.user._id,
    });

    const totalRecords = receipts.length;
    const receiptsWithTx = receipts.filter((r) => r.receiptTxHash);
    const blockchainTransactions = receiptsWithTx.length;

    const missingData = [];
    const missingQualityCheck = receipts.filter((r) => !r.qualityCheck).length;
    if (missingQualityCheck > 0) {
      missingData.push({
        field: "qualityCheck",
        count: missingQualityCheck,
      });
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
    return { owner: this.user._id };
  }
}

