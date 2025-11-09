import DrugInfo from "../models/DrugInfo.js";
import NFTInfo from "../models/NFTInfo.js";
import ProofOfProduction from "../models/ProofOfProduction.js";
import ProofOfDistribution from "../models/ProofOfDistribution.js";
import ProofOfPharmacy from "../models/ProofOfPharmacy.js";
import ManufacturerInvoice from "../models/ManufacturerInvoice.js";
import CommercialInvoice from "../models/CommercialInvoice.js";
import PharmaCompany from "../models/PharmaCompany.js";
import Distributor from "../models/Distributor.js";
import Pharmacy from "../models/Pharmacy.js";
import User from "../models/User.js";

// ============ THỐNG KÊ TỔNG QUAN DASHBOARD ============

// Thống kê tổng quan cho Manufacturer
export const getManufacturerDashboard = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== "pharma_company") {
      return res.status(403).json({
        success: false,
        message: "Chỉ có pharma company mới có thể xem thống kê",
      });
    }

    const pharmaCompany = await PharmaCompany.findOne({ user: user._id });
    if (!pharmaCompany) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy pharma company",
      });
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now);
    startOfMonth.setMonth(now.getMonth() - 1);
    const startOfYear = new Date(now);
    startOfYear.setFullYear(now.getFullYear() - 1);

    // Thống kê sản phẩm
    const totalDrugs = await DrugInfo.countDocuments({ manufacturer: pharmaCompany._id });
    const activeDrugs = await DrugInfo.countDocuments({
      manufacturer: pharmaCompany._id,
      status: "active",
    });

    // Thống kê sản xuất
    const totalProductions = await ProofOfProduction.countDocuments({
      manufacturer: pharmaCompany._id,
    });
    const productionsToday = await ProofOfProduction.countDocuments({
      manufacturer: pharmaCompany._id,
      createdAt: { $gte: startOfToday },
    });
    const productionsThisWeek = await ProofOfProduction.countDocuments({
      manufacturer: pharmaCompany._id,
      createdAt: { $gte: startOfWeek },
    });
    const productionsThisMonth = await ProofOfProduction.countDocuments({
      manufacturer: pharmaCompany._id,
      createdAt: { $gte: startOfMonth },
    });

    // Thống kê số lượng sản xuất
    const productions = await ProofOfProduction.find({
      manufacturer: pharmaCompany._id,
    });
    const totalQuantityProduced = productions.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const quantityThisMonth = productions
      .filter((p) => p.createdAt >= startOfMonth)
      .reduce((sum, p) => sum + (p.quantity || 0), 0);

    // Thống kê NFT
    const companyDrugIds = await DrugInfo.find({ manufacturer: pharmaCompany._id }).distinct("_id");
    const totalNFTs = await NFTInfo.countDocuments({ drug: { $in: companyDrugIds } });
    const nftsByStatus = {
      minted: await NFTInfo.countDocuments({
        drug: { $in: companyDrugIds },
        status: "minted",
      }),
      transferred: await NFTInfo.countDocuments({
        drug: { $in: companyDrugIds },
        status: "transferred",
      }),
      sold: await NFTInfo.countDocuments({
        drug: { $in: companyDrugIds },
        status: "sold",
      }),
      expired: await NFTInfo.countDocuments({
        drug: { $in: companyDrugIds },
        status: "expired",
      }),
      recalled: await NFTInfo.countDocuments({
        drug: { $in: companyDrugIds },
        status: "recalled",
      }),
    };

    // Thống kê chuyển giao
    const totalTransfers = await ManufacturerInvoice.countDocuments({
      fromManufacturer: user._id,
    });
    const transfersByStatus = {
      pending: await ManufacturerInvoice.countDocuments({
        fromManufacturer: user._id,
        status: "pending",
      }),
      sent: await ManufacturerInvoice.countDocuments({
        fromManufacturer: user._id,
        status: "sent",
      }),
      paid: await ManufacturerInvoice.countDocuments({
        fromManufacturer: user._id,
        status: "paid",
      }),
      cancelled: await ManufacturerInvoice.countDocuments({
        fromManufacturer: user._id,
        status: "cancelled",
      }),
    };

    // Thống kê theo thời gian (7 ngày gần nhất)
    const dailyProductions = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const count = await ProofOfProduction.countDocuments({
        manufacturer: pharmaCompany._id,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });

      const dayProductions = await ProofOfProduction.find({
        manufacturer: pharmaCompany._id,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });
      const quantity = dayProductions.reduce((sum, p) => sum + (p.quantity || 0), 0);

      dailyProductions.push({
        date: date.toISOString().split("T")[0],
        count,
        quantity,
      });
    }

    // Thống kê top sản phẩm
    const topDrugs = await DrugInfo.aggregate([
      { $match: { manufacturer: pharmaCompany._id } },
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

    return res.status(200).json({
      success: true,
      data: {
        overview: {
          totalDrugs,
          activeDrugs,
          totalProductions,
          totalQuantityProduced,
          totalNFTs,
          totalTransfers,
        },
        timeBased: {
          today: {
            productions: productionsToday,
          },
          thisWeek: {
            productions: productionsThisWeek,
          },
          thisMonth: {
            productions: productionsThisMonth,
            quantity: quantityThisMonth,
          },
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
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê dashboard manufacturer:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê",
      error: error.message,
    });
  }
};

// Thống kê tổng quan cho Distributor
export const getDistributorDashboard = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== "distributor") {
      return res.status(403).json({
        success: false,
        message: "Chỉ có distributor mới có thể xem thống kê",
      });
    }

    const distributor = await Distributor.findOne({ user: user._id });
    if (!distributor) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy distributor",
      });
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now);
    startOfMonth.setMonth(now.getMonth() - 1);

    // Thống kê đơn hàng nhận từ manufacturer
    const totalInvoicesReceived = await ManufacturerInvoice.countDocuments({
      toDistributor: user._id,
    });
    const invoicesReceivedByStatus = {
      pending: await ManufacturerInvoice.countDocuments({
        toDistributor: user._id,
        status: "pending",
      }),
      sent: await ManufacturerInvoice.countDocuments({
        toDistributor: user._id,
        status: "sent",
      }),
      paid: await ManufacturerInvoice.countDocuments({
        toDistributor: user._id,
        status: "paid",
      }),
    };

    // Thống kê phân phối
    const totalDistributions = await ProofOfDistribution.countDocuments({
      toDistributor: user._id,
    });
    const distributionsByStatus = {
      pending: await ProofOfDistribution.countDocuments({
        toDistributor: user._id,
        status: "pending",
      }),
      confirmed: await ProofOfDistribution.countDocuments({
        toDistributor: user._id,
        status: "confirmed",
      }),
      delivered: await ProofOfDistribution.countDocuments({
        toDistributor: user._id,
        status: "delivered",
      }),
    };

    // Thống kê chuyển giao cho pharmacy
    const totalTransfersToPharmacy = await CommercialInvoice.countDocuments({
      fromDistributor: user._id,
    });
    const transfersToPharmacyByStatus = {
      draft: await CommercialInvoice.countDocuments({
        fromDistributor: user._id,
        status: "draft",
      }),
      sent: await CommercialInvoice.countDocuments({
        fromDistributor: user._id,
        status: "sent",
      }),
      paid: await CommercialInvoice.countDocuments({
        fromDistributor: user._id,
        status: "paid",
      }),
    };

    // Thống kê NFT
    const totalNFTs = await NFTInfo.countDocuments({ owner: user._id });
    const nftsByStatus = {
      transferred: await NFTInfo.countDocuments({
        owner: user._id,
        status: "transferred",
      }),
      sold: await NFTInfo.countDocuments({
        owner: user._id,
        status: "sold",
      }),
    };

    // Thống kê theo thời gian (7 ngày gần nhất)
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const invoicesReceived = await ManufacturerInvoice.countDocuments({
        toDistributor: user._id,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });

      const transfersToPharmacy = await CommercialInvoice.countDocuments({
        fromDistributor: user._id,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });

      dailyStats.push({
        date: date.toISOString().split("T")[0],
        invoicesReceived,
        transfersToPharmacy,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
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
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê dashboard distributor:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê",
      error: error.message,
    });
  }
};

// Thống kê tổng quan cho Pharmacy
export const getPharmacyDashboard = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== "pharmacy") {
      return res.status(403).json({
        success: false,
        message: "Chỉ có pharmacy mới có thể xem thống kê",
      });
    }

    const pharmacy = await Pharmacy.findOne({ user: user._id });
    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy pharmacy",
      });
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now);
    startOfMonth.setMonth(now.getMonth() - 1);

    // Thống kê đơn hàng nhận từ distributor
    const totalInvoicesReceived = await CommercialInvoice.countDocuments({
      toPharmacy: user._id,
    });
    const invoicesReceivedByStatus = {
      draft: await CommercialInvoice.countDocuments({
        toPharmacy: user._id,
        status: "draft",
      }),
      issued: await CommercialInvoice.countDocuments({
        toPharmacy: user._id,
        status: "issued",
      }),
      sent: await CommercialInvoice.countDocuments({
        toPharmacy: user._id,
        status: "sent",
      }),
      paid: await CommercialInvoice.countDocuments({
        toPharmacy: user._id,
        status: "paid",
      }),
    };

    // Thống kê biên nhận
    const totalReceipts = await ProofOfPharmacy.countDocuments({
      toPharmacy: user._id,
    });
    const receiptsByStatus = {
      pending: await ProofOfPharmacy.countDocuments({
        toPharmacy: user._id,
        status: "pending",
      }),
      received: await ProofOfPharmacy.countDocuments({
        toPharmacy: user._id,
        status: "received",
      }),
      verified: await ProofOfPharmacy.countDocuments({
        toPharmacy: user._id,
        status: "verified",
      }),
      completed: await ProofOfPharmacy.countDocuments({
        toPharmacy: user._id,
        status: "completed",
      }),
    };

    // Thống kê NFT
    const totalNFTs = await NFTInfo.countDocuments({ owner: user._id });
    const nftsByStatus = {
      minted: await NFTInfo.countDocuments({
        owner: user._id,
        status: "minted",
      }),
      transferred: await NFTInfo.countDocuments({
        owner: user._id,
        status: "transferred",
      }),
      sold: await NFTInfo.countDocuments({
        owner: user._id,
        status: "sold",
      }),
      expired: await NFTInfo.countDocuments({
        owner: user._id,
        status: "expired",
      }),
    };

    // Thống kê chuỗi cung ứng hoàn chỉnh
    const completedSupplyChains = await CommercialInvoice.countDocuments({
      toPharmacy: user._id,
      supplyChainCompleted: true,
    });

    // Thống kê theo thời gian (7 ngày gần nhất)
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const invoicesReceived = await CommercialInvoice.countDocuments({
        toPharmacy: user._id,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });

      const receipts = await ProofOfPharmacy.countDocuments({
        toPharmacy: user._id,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });

      dailyStats.push({
        date: date.toISOString().split("T")[0],
        invoicesReceived,
        receipts,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
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
          completionRate: totalInvoicesReceived > 0
            ? ((completedSupplyChains / totalInvoicesReceived) * 100).toFixed(2)
            : 0,
        },
        trends: {
          dailyStats,
        },
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê dashboard pharmacy:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê",
      error: error.message,
    });
  }
};

// ============ THỐNG KÊ CHUỖI CUNG ỨNG ============

// Thống kê chuỗi cung ứng cho Manufacturer
export const getManufacturerSupplyChainStats = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== "pharma_company") {
      return res.status(403).json({
        success: false,
        message: "Chỉ có pharma company mới có thể xem thống kê",
      });
    }

    const pharmaCompany = await PharmaCompany.findOne({ user: user._id });
    if (!pharmaCompany) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy pharma company",
      });
    }

    // Thống kê chuyển giao
    const totalTransfers = await ManufacturerInvoice.countDocuments({
      fromManufacturer: user._id,
    });

    // Thống kê số lượng distributor đã làm việc
    const uniqueDistributors = await ManufacturerInvoice.distinct("toDistributor", {
      fromManufacturer: user._id,
    });

    // Thống kê số lượng đã chuyển giao
    const invoices = await ManufacturerInvoice.find({
      fromManufacturer: user._id,
    });
    const totalQuantityTransferred = invoices.reduce((sum, inv) => sum + (inv.quantity || 0), 0);

    // Thống kê thời gian trung bình từ sản xuất đến chuyển giao
    const productions = await ProofOfProduction.find({
      manufacturer: pharmaCompany._id,
    }).populate({
      path: "manufacturer",
      select: "_id",
    });

    let totalDaysToTransfer = 0;
    let transferCount = 0;

    for (const production of productions) {
      const relatedInvoice = await ManufacturerInvoice.findOne({
        proofOfProduction: production._id,
      });
      if (relatedInvoice) {
        const daysDiff = Math.floor(
          (relatedInvoice.createdAt - production.createdAt) / (1000 * 60 * 60 * 24)
        );
        totalDaysToTransfer += daysDiff;
        transferCount++;
      }
    }

    const avgDaysToTransfer = transferCount > 0 ? totalDaysToTransfer / transferCount : 0;

    // Thống kê theo trạng thái
    const transfersByStatus = {
      pending: await ManufacturerInvoice.countDocuments({
        fromManufacturer: user._id,
        status: "pending",
      }),
      sent: await ManufacturerInvoice.countDocuments({
        fromManufacturer: user._id,
        status: "sent",
      }),
      paid: await ManufacturerInvoice.countDocuments({
        fromManufacturer: user._id,
        status: "paid",
      }),
    };

    return res.status(200).json({
      success: true,
      data: {
        totalTransfers,
        uniqueDistributors: uniqueDistributors.length,
        totalQuantityTransferred,
        avgDaysToTransfer: avgDaysToTransfer.toFixed(2),
        transfersByStatus,
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê chuỗi cung ứng:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê",
      error: error.message,
    });
  }
};

// ============ THỐNG KÊ CHẤT LƯỢNG ============

// Thống kê chất lượng cho Pharmacy
export const getPharmacyQualityStats = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== "pharmacy") {
      return res.status(403).json({
        success: false,
        message: "Chỉ có pharmacy mới có thể xem thống kê",
      });
    }

    const pharmacy = await Pharmacy.findOne({ user: user._id });
    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy pharmacy",
      });
    }

    // Thống kê quality check
    const receipts = await ProofOfPharmacy.find({
      toPharmacy: user._id,
    });

    let totalQualityChecks = 0;
    let passedQualityChecks = 0;
    let failedQualityChecks = 0;

    receipts.forEach((receipt) => {
      if (receipt.qualityCheck) {
        totalQualityChecks++;
        if (receipt.qualityCheck.passed === true) {
          passedQualityChecks++;
        } else if (receipt.qualityCheck.passed === false) {
          failedQualityChecks++;
        }
      }
    });

    const qualityPassRate =
      totalQualityChecks > 0
        ? ((passedQualityChecks / totalQualityChecks) * 100).toFixed(2)
        : 0;

    // Thống kê thuốc hết hạn
    const now = new Date();
    const expiredNFTs = await NFTInfo.countDocuments({
      owner: user._id,
      expDate: { $lt: now },
      status: { $ne: "expired" },
    });

    // Thống kê thuốc sắp hết hạn (30 ngày)
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringSoonNFTs = await NFTInfo.countDocuments({
      owner: user._id,
      expDate: { $gte: now, $lte: thirtyDaysFromNow },
      status: { $ne: "expired" },
    });

    return res.status(200).json({
      success: true,
      data: {
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
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê chất lượng:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê",
      error: error.message,
    });
  }
};

// ============ THỐNG KÊ BLOCKCHAIN ============

// Thống kê blockchain cho tất cả vai trò
export const getBlockchainStats = async (req, res) => {
  try {
    const user = req.user;
    let filter = {};

    // Filter theo vai trò
    if (user.role === "pharma_company") {
      const pharmaCompany = await PharmaCompany.findOne({ user: user._id });
      if (pharmaCompany) {
        const companyDrugIds = await DrugInfo.find({
          manufacturer: pharmaCompany._id,
        }).distinct("_id");
        filter.drug = { $in: companyDrugIds };
      }
    } else if (user.role === "distributor") {
      filter.owner = user._id;
    } else if (user.role === "pharmacy") {
      filter.owner = user._id;
    }

    // Thống kê NFT có blockchain transaction
    const totalNFTs = await NFTInfo.countDocuments(filter);
    const nftsWithTxHash = await NFTInfo.countDocuments({
      ...filter,
      chainTxHash: { $exists: true, $ne: null },
    });

    // Thống kê theo trạng thái blockchain
    const nftsByStatus = {
      minted: await NFTInfo.countDocuments({ ...filter, status: "minted" }),
      transferred: await NFTInfo.countDocuments({
        ...filter,
        status: "transferred",
      }),
      sold: await NFTInfo.countDocuments({ ...filter, status: "sold" }),
      expired: await NFTInfo.countDocuments({ ...filter, status: "expired" }),
      recalled: await NFTInfo.countDocuments({ ...filter, status: "recalled" }),
    };

    // Thống kê blockchain coverage
    const blockchainCoverage =
      totalNFTs > 0 ? ((nftsWithTxHash / totalNFTs) * 100).toFixed(2) : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalNFTs,
        nftsWithTxHash,
        blockchainCoverage: `${blockchainCoverage}%`,
        nftsByStatus,
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê blockchain:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê",
      error: error.message,
    });
  }
};

// ============ THỐNG KÊ CẢNH BÁO ============

// Thống kê cảnh báo cho tất cả vai trò
export const getAlertsStats = async (req, res) => {
  try {
    const user = req.user;
    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    let alerts = {
      expired: 0,
      expiringSoon: 0,
      recalled: 0,
      pendingActions: 0,
    };

    if (user.role === "pharma_company") {
      const pharmaCompany = await PharmaCompany.findOne({ user: user._id });
      if (pharmaCompany) {
        const companyDrugIds = await DrugInfo.find({
          manufacturer: pharmaCompany._id,
        }).distinct("_id");

        alerts.expired = await NFTInfo.countDocuments({
          drug: { $in: companyDrugIds },
          expDate: { $lt: now },
          status: { $ne: "expired" },
        });

        alerts.expiringSoon = await NFTInfo.countDocuments({
          drug: { $in: companyDrugIds },
          expDate: { $gte: now, $lte: thirtyDaysFromNow },
          status: { $ne: "expired" },
        });

        alerts.recalled = await NFTInfo.countDocuments({
          drug: { $in: companyDrugIds },
          status: "recalled",
        });

        alerts.pendingActions = await ManufacturerInvoice.countDocuments({
          fromManufacturer: user._id,
          status: "pending",
        });
      }
    } else if (user.role === "distributor") {
      alerts.expired = await NFTInfo.countDocuments({
        owner: user._id,
        expDate: { $lt: now },
        status: { $ne: "expired" },
      });

      alerts.expiringSoon = await NFTInfo.countDocuments({
        owner: user._id,
        expDate: { $gte: now, $lte: thirtyDaysFromNow },
        status: { $ne: "expired" },
      });

      alerts.pendingActions =
        (await ManufacturerInvoice.countDocuments({
          toDistributor: user._id,
          status: "pending",
        })) +
        (await ProofOfDistribution.countDocuments({
          toDistributor: user._id,
          status: "pending",
        }));
    } else if (user.role === "pharmacy") {
      alerts.expired = await NFTInfo.countDocuments({
        owner: user._id,
        expDate: { $lt: now },
        status: { $ne: "expired" },
      });

      alerts.expiringSoon = await NFTInfo.countDocuments({
        owner: user._id,
        expDate: { $gte: now, $lte: thirtyDaysFromNow },
        status: { $ne: "expired" },
      });

      alerts.pendingActions = await ProofOfPharmacy.countDocuments({
        toPharmacy: user._id,
        status: "pending",
      });
    }

    const totalAlerts = Object.values(alerts).reduce((sum, val) => sum + val, 0);

    return res.status(200).json({
      success: true,
      data: {
        alerts,
        totalAlerts,
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê cảnh báo:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê",
      error: error.message,
    });
  }
};

// ============ THỐNG KÊ XU HƯỚNG ============

// Thống kê xu hướng theo tháng
export const getMonthlyTrends = async (req, res) => {
  try {
    const user = req.user;
    const { months = 6 } = req.query;
    const monthsCount = parseInt(months);

    const now = new Date();
    const trends = [];

    for (let i = monthsCount - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      let monthData = {
        month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        productions: 0,
        transfers: 0,
        receipts: 0,
      };

      if (user.role === "pharma_company") {
        const pharmaCompany = await PharmaCompany.findOne({ user: user._id });
        if (pharmaCompany) {
          monthData.productions = await ProofOfProduction.countDocuments({
            manufacturer: pharmaCompany._id,
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
          });

          monthData.transfers = await ManufacturerInvoice.countDocuments({
            fromManufacturer: user._id,
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
          });
        }
      } else if (user.role === "distributor") {
        monthData.transfers = await CommercialInvoice.countDocuments({
          fromDistributor: user._id,
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        });
      } else if (user.role === "pharmacy") {
        monthData.receipts = await ProofOfPharmacy.countDocuments({
          toPharmacy: user._id,
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        });
      }

      trends.push(monthData);
    }

    return res.status(200).json({
      success: true,
      data: {
        trends,
        period: `${monthsCount} tháng gần nhất`,
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê xu hướng:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê",
      error: error.message,
    });
  }
};

// ============ THỐNG KÊ THEO SẢN PHẨM ============

// Thống kê chi tiết theo sản phẩm cho Manufacturer
export const getProductAnalytics = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== "pharma_company") {
      return res.status(403).json({
        success: false,
        message: "Chỉ có pharma company mới có thể xem thống kê",
      });
    }

    const pharmaCompany = await PharmaCompany.findOne({ user: user._id });
    if (!pharmaCompany) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy pharma company",
      });
    }

    // Thống kê theo từng sản phẩm
    const drugs = await DrugInfo.find({ manufacturer: pharmaCompany._id });

    const productStats = await Promise.all(
      drugs.map(async (drug) => {
        const nfts = await NFTInfo.find({ drug: drug._id });
        const productions = await ProofOfProduction.find({ drug: drug._id });
        const totalQuantity = productions.reduce((sum, p) => sum + (p.quantity || 0), 0);

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

    return res.status(200).json({
      success: true,
      data: {
        products: productStats,
        totalProducts: productStats.length,
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê sản phẩm:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê",
      error: error.message,
    });
  }
};

// ============ THỐNG KÊ HIỆU SUẤT ============

// Thống kê hiệu suất chuỗi cung ứng
export const getPerformanceMetrics = async (req, res) => {
  try {
    const user = req.user;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    start.setMonth(start.getMonth() - 1);
    start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    let metrics = {};

    if (user.role === "pharma_company") {
      const pharmaCompany = await PharmaCompany.findOne({ user: user._id });
      if (pharmaCompany) {
        // Thời gian trung bình từ sản xuất đến chuyển giao
        const productions = await ProofOfProduction.find({
          manufacturer: pharmaCompany._id,
          createdAt: { $gte: start, $lte: end },
        });

        let totalDays = 0;
        let count = 0;

        for (const production of productions) {
          const invoice = await ManufacturerInvoice.findOne({
            proofOfProduction: production._id,
          });
          if (invoice) {
            const days = Math.floor(
              (invoice.createdAt - production.createdAt) / (1000 * 60 * 60 * 24)
            );
            totalDays += days;
            count++;
          }
        }

        metrics.avgProductionToTransferDays = count > 0 ? (totalDays / count).toFixed(2) : 0;
        metrics.totalProductions = productions.length;
      }
    } else if (user.role === "distributor") {
      // Thời gian trung bình từ nhận hàng đến chuyển giao
      const distributions = await ProofOfDistribution.find({
        toDistributor: user._id,
        createdAt: { $gte: start, $lte: end },
      });

      let totalDays = 0;
      let count = 0;

      for (const distribution of distributions) {
        const commercialInvoice = await CommercialInvoice.findOne({
          fromDistributor: user._id,
          createdAt: { $gte: distribution.createdAt },
        });
        if (commercialInvoice) {
          const days = Math.floor(
            (commercialInvoice.createdAt - distribution.createdAt) / (1000 * 60 * 60 * 24)
          );
          totalDays += days;
          count++;
        }
      }

      metrics.avgDistributionToTransferDays = count > 0 ? (totalDays / count).toFixed(2) : 0;
      metrics.totalDistributions = distributions.length;
    } else if (user.role === "pharmacy") {
      // Thời gian trung bình từ nhận hàng đến hoàn thành chuỗi cung ứng
      const receipts = await ProofOfPharmacy.find({
        toPharmacy: user._id,
        createdAt: { $gte: start, $lte: end },
      });

      let totalDays = 0;
      let count = 0;

      receipts.forEach((receipt) => {
        if (receipt.supplyChainCompleted && receipt.completedAt) {
          const days = Math.floor(
            (receipt.completedAt - receipt.createdAt) / (1000 * 60 * 60 * 24)
          );
          totalDays += days;
          count++;
        }
      });

      metrics.avgReceiptToCompletionDays = count > 0 ? (totalDays / count).toFixed(2) : 0;
      metrics.totalReceipts = receipts.length;
      metrics.completedSupplyChains = count;
    }

    return res.status(200).json({
      success: true,
      data: {
        period: {
          from: start,
          to: end,
        },
        metrics,
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê hiệu suất:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê",
      error: error.message,
    });
  }
};

// ============ THỐNG KÊ TUÂN THỦ ============

// Thống kê tuân thủ cho tất cả vai trò
export const getComplianceStats = async (req, res) => {
  try {
    const user = req.user;
    let compliance = {
      blockchainTransactions: 0,
      totalRecords: 0,
      complianceRate: 0,
      missingData: [],
    };

    if (user.role === "pharma_company") {
      const pharmaCompany = await PharmaCompany.findOne({ user: user._id });
      if (pharmaCompany) {
        const productions = await ProofOfProduction.find({
          manufacturer: pharmaCompany._id,
        });
        compliance.totalRecords = productions.length;

        const productionsWithTx = productions.filter((p) => p.chainTxHash);
        compliance.blockchainTransactions = productionsWithTx.length;

        // Kiểm tra dữ liệu thiếu
        const missingBatchNumber = productions.filter((p) => !p.batchNumber).length;
        const missingExpDate = productions.filter((p) => !p.expDate).length;

        if (missingBatchNumber > 0) {
          compliance.missingData.push({
            field: "batchNumber",
            count: missingBatchNumber,
          });
        }
        if (missingExpDate > 0) {
          compliance.missingData.push({
            field: "expDate",
            count: missingExpDate,
          });
        }
      }
    } else if (user.role === "distributor") {
      const distributions = await ProofOfDistribution.find({
        toDistributor: user._id,
      });
      compliance.totalRecords = distributions.length;

      const distributionsWithTx = distributions.filter((d) => d.chainTxHash);
      compliance.blockchainTransactions = distributionsWithTx.length;
    } else if (user.role === "pharmacy") {
      const receipts = await ProofOfPharmacy.find({
        toPharmacy: user._id,
      });
      compliance.totalRecords = receipts.length;

      const receiptsWithTx = receipts.filter((r) => r.receiptTxHash);
      compliance.blockchainTransactions = receiptsWithTx.length;

      // Kiểm tra quality check
      const missingQualityCheck = receipts.filter((r) => !r.qualityCheck).length;
      if (missingQualityCheck > 0) {
        compliance.missingData.push({
          field: "qualityCheck",
          count: missingQualityCheck,
        });
      }
    }

    compliance.complianceRate =
      compliance.totalRecords > 0
        ? ((compliance.blockchainTransactions / compliance.totalRecords) * 100).toFixed(2)
        : 0;

    return res.status(200).json({
      success: true,
      data: {
        compliance,
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê tuân thủ:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê",
      error: error.message,
    });
  }
};

// ============ THỐNG KÊ CHUỖI CUNG ỨNG CHI TIẾT ============

// Thống kê chuỗi cung ứng chi tiết cho Distributor
export const getDistributorSupplyChainStats = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== "distributor") {
      return res.status(403).json({
        success: false,
        message: "Chỉ có distributor mới có thể xem thống kê",
      });
    }

    const distributor = await Distributor.findOne({ user: user._id });
    if (!distributor) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy distributor",
      });
    }

    // Thống kê số lượng manufacturer đã làm việc
    const uniqueManufacturers = await ManufacturerInvoice.distinct("fromManufacturer", {
      toDistributor: user._id,
    });

    // Thống kê số lượng pharmacy đã làm việc
    const uniquePharmacies = await CommercialInvoice.distinct("toPharmacy", {
      fromDistributor: user._id,
    });

    // Thống kê số lượng đã nhận và đã chuyển
    const invoicesReceived = await ManufacturerInvoice.find({
      toDistributor: user._id,
    });
    const totalQuantityReceived = invoicesReceived.reduce(
      (sum, inv) => sum + (inv.quantity || 0),
      0
    );

    const invoicesSent = await CommercialInvoice.find({
      fromDistributor: user._id,
    });
    const totalQuantitySent = invoicesSent.reduce((sum, inv) => sum + (inv.quantity || 0), 0);

    // Thống kê thời gian trung bình
    const distributions = await ProofOfDistribution.find({
      toDistributor: user._id,
    });

    let totalDaysToTransfer = 0;
    let transferCount = 0;

    for (const distribution of distributions) {
      const commercialInvoice = await CommercialInvoice.findOne({
        fromDistributor: user._id,
        createdAt: { $gte: distribution.createdAt },
      });
      if (commercialInvoice) {
        const daysDiff = Math.floor(
          (commercialInvoice.createdAt - distribution.createdAt) / (1000 * 60 * 60 * 24)
        );
        totalDaysToTransfer += daysDiff;
        transferCount++;
      }
    }

    const avgDaysToTransfer = transferCount > 0 ? totalDaysToTransfer / transferCount : 0;

    return res.status(200).json({
      success: true,
      data: {
        uniqueManufacturers: uniqueManufacturers.length,
        uniquePharmacies: uniquePharmacies.length,
        totalQuantityReceived,
        totalQuantitySent,
        avgDaysToTransfer: avgDaysToTransfer.toFixed(2),
        inventory: totalQuantityReceived - totalQuantitySent,
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê chuỗi cung ứng distributor:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê",
      error: error.message,
    });
  }
};


