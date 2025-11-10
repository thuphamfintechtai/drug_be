import StatisticsStrategy from "./StatisticsStrategy.js";
import NFTInfo from "../../models/NFTInfo.js";
import ManufacturerInvoice from "../../models/ManufacturerInvoice.js";
import ProofOfProduction from "../../models/ProofOfProduction.js";
import ProofOfDistribution from "../../models/ProofOfDistribution.js";
import ProofOfPharmacy from "../../models/ProofOfPharmacy.js";
import { getMonthsInRange, getThirtyDaysFromNow, getDaysDifference } from "./dateHelper.js";
import { calculatePercentage } from "./queryHelper.js";

class AdminStatisticsStrategy extends StatisticsStrategy {
  constructor(user) {
    super(user, null);
  }

  async validate() {
    if (!this.user || this.user.role !== "system_admin") {
      throw new Error("Chỉ có system_admin mới có thể xem thống kê này");
    }
    return true;
  }

  async getAlertsStats() {
    await this.validate();

    const now = new Date();
    const thirtyDaysFromNow = getThirtyDaysFromNow();

    const [expired, expiringSoon, recalled, pendingManufacturer, pendingDistribution, pendingPharmacy] =
      await Promise.all([
        NFTInfo.countDocuments({ expDate: { $lt: now }, status: { $ne: "expired" } }),
        NFTInfo.countDocuments({
          expDate: { $gte: now, $lte: thirtyDaysFromNow },
          status: { $ne: "expired" },
        }),
        NFTInfo.countDocuments({ status: "recalled" }),
        ManufacturerInvoice.countDocuments({ status: "pending" }),
        ProofOfDistribution.countDocuments({ status: "pending" }),
        ProofOfPharmacy.countDocuments({ status: "pending" }),
      ]);

    return {
      expired,
      expiringSoon,
      recalled,
      pendingActions: pendingManufacturer + pendingDistribution + pendingPharmacy,
    };
  }

  async getBlockchainStats() {
    await this.validate();

    const filter = {};
    const [totalNFTs, nftsWithTxHash, minted, transferred, sold, expired, recalled] = await Promise.all([
      NFTInfo.countDocuments(filter),
      NFTInfo.countDocuments({ ...filter, chainTxHash: { $exists: true, $ne: null } }),
      NFTInfo.countDocuments({ ...filter, status: "minted" }),
      NFTInfo.countDocuments({ ...filter, status: "transferred" }),
      NFTInfo.countDocuments({ ...filter, status: "sold" }),
      NFTInfo.countDocuments({ ...filter, status: "expired" }),
      NFTInfo.countDocuments({ ...filter, status: "recalled" }),
    ]);

    return {
      totalNFTs,
      nftsWithTxHash,
      blockchainCoverage: `${calculatePercentage(nftsWithTxHash, totalNFTs)}%`,
      nftsByStatus: {
        minted,
        transferred,
        sold,
        expired,
        recalled,
      },
    };
  }

  async getMonthlyTrends(months = 6) {
    await this.validate();

    const monthsData = getMonthsInRange(months);
    const trends = [];

    for (const { start, end, month } of monthsData) {
      const [productions, transfers, receipts] = await Promise.all([
        ProofOfProduction.countDocuments({ createdAt: { $gte: start, $lte: end } }),
        ManufacturerInvoice.countDocuments({ createdAt: { $gte: start, $lte: end } }),
        ProofOfPharmacy.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      ]);

      trends.push({
        month,
        productions,
        transfers,
        receipts,
      });
    }

    return trends;
  }

  async getPerformanceMetrics(startDate, endDate) {
    await this.validate();

    const start = startDate ? new Date(startDate) : new Date();
    start.setMonth(start.getMonth() - 1);
    start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const productions = await ProofOfProduction.find({
      createdAt: { $gte: start, $lte: end },
    }).select("_id createdAt");

    const productionIds = productions.map((p) => p._id);
    const invoices = await ManufacturerInvoice.find({
      proofOfProduction: { $in: productionIds },
    }).select("proofOfProduction createdAt");

    const invoiceByProduction = new Map();
    invoices.forEach((invoice) => {
      if (invoice.proofOfProduction) {
        invoiceByProduction.set(invoice.proofOfProduction.toString(), invoice.createdAt);
      }
    });

    let productionDays = 0;
    let productionCount = 0;

    productions.forEach((production) => {
      const invoiceDate = invoiceByProduction.get(production._id.toString());
      if (invoiceDate) {
        productionDays += getDaysDifference(production.createdAt, invoiceDate);
        productionCount++;
      }
    });

    const receipts = await ProofOfPharmacy.find({
      createdAt: { $gte: start, $lte: end },
    }).select("createdAt completedAt supplyChainCompleted");

    let receiptDays = 0;
    let receiptCount = 0;

    receipts.forEach((receipt) => {
      if (receipt.supplyChainCompleted && receipt.completedAt) {
        receiptDays += getDaysDifference(receipt.createdAt, receipt.completedAt);
        receiptCount++;
      }
    });

    return {
      avgProductionToTransferDays: productionCount > 0 ? (productionDays / productionCount).toFixed(2) : "0",
      totalProductions: productions.length,
      avgReceiptToCompletionDays: receiptCount > 0 ? (receiptDays / receiptCount).toFixed(2) : "0",
      totalReceipts: receipts.length,
    };
  }

  async getComplianceStats() {
    await this.validate();

    const [productions, distributions, receipts] = await Promise.all([
      ProofOfProduction.find().select("chainTxHash batchNumber expDate"),
      ProofOfDistribution.find().select("chainTxHash transferTxHash"),
      ProofOfPharmacy.find().select("receiptTxHash qualityCheck"),
    ]);

    const productionBlockchain = productions.filter((p) => p.chainTxHash).length;
    const distributionBlockchain = distributions.filter((d) => d.chainTxHash || d.transferTxHash).length;
    const pharmacyBlockchain = receipts.filter((r) => r.receiptTxHash).length;

    const missingProductionData = [];
    const missingBatchNumber = productions.filter((p) => !p.batchNumber).length;
    const missingExpDate = productions.filter((p) => !p.expDate).length;

    if (missingBatchNumber > 0) {
      missingProductionData.push({ field: "batchNumber", count: missingBatchNumber });
    }
    if (missingExpDate > 0) {
      missingProductionData.push({ field: "expDate", count: missingExpDate });
    }

    const missingQualityCheck = receipts.filter((r) => !r.qualityCheck).length;

    return {
      production: {
        blockchainTransactions: productionBlockchain,
        totalRecords: productions.length,
        complianceRate: calculatePercentage(productionBlockchain, productions.length),
        missingData: missingProductionData,
      },
      distribution: {
        blockchainTransactions: distributionBlockchain,
        totalRecords: distributions.length,
        complianceRate: calculatePercentage(distributionBlockchain, distributions.length),
        missingData: [],
      },
      pharmacy: {
        blockchainTransactions: pharmacyBlockchain,
        totalRecords: receipts.length,
        complianceRate: calculatePercentage(pharmacyBlockchain, receipts.length),
        missingData:
          missingQualityCheck > 0 ? [{ field: "qualityCheck", count: missingQualityCheck }] : [],
      },
      overall: {
        blockchainTransactions: productionBlockchain + distributionBlockchain + pharmacyBlockchain,
        totalRecords: productions.length + distributions.length + receipts.length,
        complianceRate: calculatePercentage(
          productionBlockchain + distributionBlockchain + pharmacyBlockchain,
          productions.length + distributions.length + receipts.length
        ),
      },
    };
  }
}

export default AdminStatisticsStrategy;
