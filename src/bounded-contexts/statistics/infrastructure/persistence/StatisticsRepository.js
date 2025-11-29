import { IStatisticsRepository } from "../../domain/repositories/IStatisticsRepository.js";

export class StatisticsRepository extends IStatisticsRepository {
  async getDashboardStats(entityId, role, filters) {
    if (role === "pharma_company") {
      return await this._getManufacturerDashboardStats(entityId);
    }
    
    if (role === "pharmacy") {
      return await this._getPharmacyDashboardStats(entityId);
    }
    
    // Default empty response for other roles (can be implemented later)
    return {
      total: 0,
      byStatus: {},
      byType: {},
    };
  }

  async _getManufacturerDashboardStats(manufacturerId) {
    // Import models
    const { DrugInfoModel } = await import(
      "../../../supply-chain/infrastructure/persistence/mongoose/schemas/DrugInfoSchema.js"
    );
    const { ProofOfProductionModel } = await import(
      "../../../supply-chain/infrastructure/persistence/mongoose/schemas/ProofOfProductionSchema.js"
    );
    const { ManufacturerInvoiceModel } = await import(
      "../../../supply-chain/infrastructure/persistence/mongoose/schemas/ManufacturerInvoiceSchema.js"
    );
    const { NFTInfoModel } = await import(
      "../../../supply-chain/infrastructure/persistence/mongoose/schemas/NFTInfoSchema.js"
    );

    // Count drugs
    const totalDrugs = await DrugInfoModel.countDocuments({
      manufacturer: manufacturerId,
    });

    const drugsByStatus = {
      active: await DrugInfoModel.countDocuments({
        manufacturer: manufacturerId,
        status: "active",
      }),
      inactive: await DrugInfoModel.countDocuments({
        manufacturer: manufacturerId,
        status: "inactive",
      }),
      recalled: await DrugInfoModel.countDocuments({
        manufacturer: manufacturerId,
        status: "recalled",
      }),
    };

    // Count productions
    const totalProductions = await ProofOfProductionModel.countDocuments({
      manufacturer: manufacturerId,
    });

    const productionsByStatus = {
      pending: await ProofOfProductionModel.countDocuments({
        manufacturer: manufacturerId,
        status: "pending",
      }),
      completed: await ProofOfProductionModel.countDocuments({
        manufacturer: manufacturerId,
        status: "completed",
      }),
      distributed: await ProofOfProductionModel.countDocuments({
        manufacturer: manufacturerId,
        status: "distributed",
      }),
      failed: await ProofOfProductionModel.countDocuments({
        manufacturer: manufacturerId,
        status: "failed",
      }),
    };

    // Count NFTs - only for drugs from this manufacturer
    const companyDrugIds = await DrugInfoModel.find({
      manufacturer: manufacturerId,
    }).distinct("_id");
    
    const totalNFTs = await NFTInfoModel.countDocuments({
      drug: { $in: companyDrugIds },
    });

    const nftsByStatus = {
      minted: await NFTInfoModel.countDocuments({
        drug: { $in: companyDrugIds },
        status: "minted",
      }),
      transferred: await NFTInfoModel.countDocuments({
        drug: { $in: companyDrugIds },
        status: "transferred",
      }),
      sold: await NFTInfoModel.countDocuments({
        drug: { $in: companyDrugIds },
        status: "sold",
      }),
      expired: await NFTInfoModel.countDocuments({
        drug: { $in: companyDrugIds },
        status: "expired",
      }),
      recalled: await NFTInfoModel.countDocuments({
        drug: { $in: companyDrugIds },
        status: "recalled",
      }),
    };

    // Count transfers (invoices)
    const totalTransfers = await ManufacturerInvoiceModel.countDocuments({
      fromManufacturer: manufacturerId,
    });

    const transfersByStatus = {
      pending: await ManufacturerInvoiceModel.countDocuments({
        fromManufacturer: manufacturerId,
        status: "pending",
      }),
      issued: await ManufacturerInvoiceModel.countDocuments({
        fromManufacturer: manufacturerId,
        status: "issued",
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

    // Aggregate totals
    const total = totalDrugs + totalProductions + totalNFTs + totalTransfers;

    // Combine byStatus
    const byStatus = {
      drugs: drugsByStatus,
      productions: productionsByStatus,
      nfts: nftsByStatus,
      transfers: transfersByStatus,
    };

    // Group by type
    const byType = {
      drugs: totalDrugs,
      productions: totalProductions,
      nfts: totalNFTs,
      transfers: totalTransfers,
    };

    return {
      total,
      byStatus,
      byType,
    };
  }

  async _getPharmacyDashboardStats(userId) {
    // Normalize userId to string
    const normalizedUserId = userId ? (userId.toString ? userId.toString() : String(userId)).trim() : null;
    
    if (!normalizedUserId) {
      // Return empty stats if no userId
      return {
        overview: {
          totalInvoicesReceived: 0,
          totalReceipts: 0,
          totalNFTs: 0,
          completedSupplyChains: 0,
          invoicesReceived: {
            total: 0,
            today: 0,
            yesterday: 0,
            thisWeek: 0,
            byStatus: {
              draft: 0,
              issued: 0,
              sent: 0,
              paid: 0,
              cancelled: 0,
              pending: 0,
              confirmed: 0,
            },
          },
          nfts: {
            total: 0,
            byStatus: {
              minted: 0,
              transferred: 0,
              sold: 0,
              expired: 0,
              recalled: 0,
            },
          },
          receipts: {
            total: 0,
            byStatus: {
              pending: 0,
              received: 0,
              verified: 0,
              completed: 0,
              rejected: 0,
            },
          },
        },
        invoicesReceived: { total: 0, byStatus: {} },
        invoices: { total: 0, byStatus: {} },
        nfts: { total: 0, byStatus: {} },
        receipts: { total: 0, byStatus: {} },
        transfers: { total: 0 },
      };
    }

    // Resolve pharmacyId - userId might be User ID or Pharmacy entity ID
    let pharmacyUserIds = [normalizedUserId];
    let pharmacyEntityIds = [];
    
    const mongoose = await import("mongoose");
    if (mongoose.default.Types.ObjectId.isValid(normalizedUserId)) {
      try {
        const { PharmacyModel } = await import(
          "../../../registration/infrastructure/persistence/mongoose/schemas/BusinessEntitySchemas.js"
        );
        
        // Try to find pharmacy entity by ID (assuming normalizedUserId might be entity ID)
        let pharmacyEntity = await PharmacyModel.findById(normalizedUserId).select("user _id");
        
        if (pharmacyEntity?.user) {
          // If normalizedUserId is entity ID, add the user ID to the list
          const userStr = pharmacyEntity.user.toString ? pharmacyEntity.user.toString() : String(pharmacyEntity.user);
          pharmacyUserIds.push(userStr);
          pharmacyEntityIds.push(normalizedUserId);
        } else {
          // If normalizedUserId is not an entity ID, try to find entity by user
          pharmacyEntity = await PharmacyModel.findOne({ user: normalizedUserId }).select("_id user");
          if (pharmacyEntity) {
            const entityIdStr = pharmacyEntity._id.toString ? pharmacyEntity._id.toString() : String(pharmacyEntity._id);
            pharmacyEntityIds.push(entityIdStr);
            if (pharmacyEntity.user) {
              const userStr = pharmacyEntity.user.toString ? pharmacyEntity.user.toString() : String(pharmacyEntity.user);
              if (userStr !== normalizedUserId) {
                pharmacyUserIds.push(userStr);
              }
            }
          }
        }
      } catch (error) {
        console.warn("Error resolving pharmacy ID:", error.message);
      }
    }

    // Build query IDs - use both User ID and Pharmacy entity ID
    const pharmacyIds = [...new Set([...pharmacyUserIds, ...pharmacyEntityIds])];

    // Import models and DateHelper
    const { CommercialInvoiceModel } = await import(
      "../../../distributor/infrastructure/persistence/mongoose/schemas/CommercialInvoiceSchema.js"
    );
    const { ProofOfPharmacyModel } = await import(
      "../../../pharmacy/infrastructure/persistence/mongoose/schemas/ProofOfPharmacySchema.js"
    );
    const { NFTInfoModel } = await import(
      "../../../supply-chain/infrastructure/persistence/mongoose/schemas/NFTInfoSchema.js"
    );
    const DateHelper = (await import("../../../../shared-kernel/utils/DateHelper.js")).default;

    // Get date ranges
    const { start: startOfToday } = DateHelper.getTodayRange();
    const { start: startOfYesterday } = DateHelper.getYesterdayRange();
    const { start: sevenDaysAgo } = DateHelper.getWeekRange();

    // === INVOICES FROM DISTRIBUTOR ===
    const totalInvoicesReceived = await CommercialInvoiceModel.countDocuments({
      toPharmacy: { $in: pharmacyIds },
    });

    const todayInvoicesReceived = await CommercialInvoiceModel.countDocuments({
      toPharmacy: { $in: pharmacyIds },
      createdAt: { $gte: startOfToday },
    });

    const yesterdayInvoicesReceived = await CommercialInvoiceModel.countDocuments({
      toPharmacy: { $in: pharmacyIds },
      createdAt: { $gte: startOfYesterday, $lt: startOfToday },
    });

    const thisWeekInvoicesReceived = await CommercialInvoiceModel.countDocuments({
      toPharmacy: { $in: pharmacyIds },
      createdAt: { $gte: sevenDaysAgo },
    });

    // Invoice status distribution (all required statuses)
    // Note: CommercialInvoice schema has: draft, issued, sent, paid, cancelled
    // But requirement needs: draft, issued, sent, paid, cancelled, pending, confirmed
    // pending = draft + issued (not yet sent)
    // confirmed = invoices with proofOfPharmacy (pharmacy has confirmed receipt)
    const draftCount = await CommercialInvoiceModel.countDocuments({
      toPharmacy: { $in: pharmacyIds },
      status: "draft",
    });
    const issuedCount = await CommercialInvoiceModel.countDocuments({
      toPharmacy: { $in: pharmacyIds },
      status: "issued",
    });
    const sentCount = await CommercialInvoiceModel.countDocuments({
      toPharmacy: { $in: pharmacyIds },
      status: "sent",
    });
    const paidCount = await CommercialInvoiceModel.countDocuments({
      toPharmacy: { $in: pharmacyIds },
      status: "paid",
    });
    const cancelledCount = await CommercialInvoiceModel.countDocuments({
      toPharmacy: { $in: pharmacyIds },
      status: "cancelled",
    });
    const confirmedCount = await CommercialInvoiceModel.countDocuments({
      toPharmacy: { $in: pharmacyIds },
      proofOfPharmacy: { $exists: true, $ne: null },
    });

    const invoicesByStatus = {
      draft: draftCount,
      issued: issuedCount,
      sent: sentCount,
      paid: paidCount,
      cancelled: cancelledCount,
      pending: draftCount + issuedCount, // pending = draft + issued (not yet sent)
      confirmed: confirmedCount, // confirmed = invoices with proofOfPharmacy
    };

    // === RECEIPTS (ProofOfPharmacy) ===
    const totalReceipts = await ProofOfPharmacyModel.countDocuments({
      toPharmacy: { $in: pharmacyIds },
    });

    // Receipt status distribution
    // Note: Schema has: pending, received, confirmed, rejected
    // But requirement needs: pending, received, verified, completed, rejected
    // Map: confirmed -> verified
    // completed = confirmed (receipts that are confirmed are considered completed)
    const receiptsPending = await ProofOfPharmacyModel.countDocuments({
      toPharmacy: { $in: pharmacyIds },
      status: "pending",
    });
    const receiptsReceived = await ProofOfPharmacyModel.countDocuments({
      toPharmacy: { $in: pharmacyIds },
      status: "received",
    });
    const receiptsConfirmed = await ProofOfPharmacyModel.countDocuments({
      toPharmacy: { $in: pharmacyIds },
      status: "confirmed",
    });
    const receiptsRejected = await ProofOfPharmacyModel.countDocuments({
      toPharmacy: { $in: pharmacyIds },
      status: "rejected",
    });

    const receiptsByStatus = {
      pending: receiptsPending,
      received: receiptsReceived,
      verified: receiptsConfirmed, // Map confirmed to verified
      completed: receiptsConfirmed, // Completed = confirmed (confirmed receipts are completed)
      rejected: receiptsRejected,
    };

    // === NFTs ===
    // NFTs owned by pharmacy - owner can be either User ID or Pharmacy entity ID
    // Query with both types of IDs to ensure we find all NFTs
    const nftOwnerIds = [...new Set([...pharmacyUserIds, ...pharmacyEntityIds])];
    const totalNFTs = await NFTInfoModel.countDocuments({
      owner: { $in: nftOwnerIds },
    });

    const nftsByStatus = {
      minted: await NFTInfoModel.countDocuments({
        owner: { $in: nftOwnerIds },
        status: "minted",
      }),
      transferred: await NFTInfoModel.countDocuments({
        owner: { $in: nftOwnerIds },
        status: "transferred",
      }),
      sold: await NFTInfoModel.countDocuments({
        owner: { $in: nftOwnerIds },
        status: "sold",
      }),
      expired: await NFTInfoModel.countDocuments({
        owner: { $in: nftOwnerIds },
        status: "expired",
      }),
      recalled: await NFTInfoModel.countDocuments({
        owner: { $in: nftOwnerIds },
        status: "recalled",
      }),
    };

    // === COMPLETED SUPPLY CHAINS ===
    // Supply chains where pharmacy has confirmed receipt (has proofOfPharmacy)
    const completedSupplyChains = await CommercialInvoiceModel.countDocuments({
      toPharmacy: { $in: pharmacyIds },
      proofOfPharmacy: { $exists: true, $ne: null },
      supplyChainCompleted: true,
    });

    // Format response according to requirements
    return {
      overview: {
        totalInvoicesReceived,
        totalReceipts,
        totalNFTs,
        completedSupplyChains,
        invoicesReceived: {
          total: totalInvoicesReceived,
          today: todayInvoicesReceived,
          yesterday: yesterdayInvoicesReceived,
          thisWeek: thisWeekInvoicesReceived,
          byStatus: invoicesByStatus,
        },
        nfts: {
          total: totalNFTs,
          byStatus: nftsByStatus,
        },
        receipts: {
          total: totalReceipts,
          byStatus: receiptsByStatus,
        },
      },
      // Fallback paths
      invoicesReceived: {
        total: totalInvoicesReceived,
        byStatus: invoicesByStatus,
      },
      invoices: {
        total: totalInvoicesReceived,
        byStatus: invoicesByStatus,
      },
      nfts: {
        total: totalNFTs,
        byStatus: nftsByStatus,
      },
      receipts: {
        total: totalReceipts,
        byStatus: receiptsByStatus,
      },
      transfers: {
        total: totalReceipts,
      },
    };
  }

  async getSupplyChainStats(userId, role, filters) {
    return {
      total: 0,
      byStatus: {},
    };
  }

  async getAlertsStats(userId, role, filters) {
    return {
      total: 0,
      byType: {},
    };
  }

  async getBlockchainStats(userId, role, filters) {
    return {
      total: 0,
      byStatus: {},
    };
  }

  async getMonthlyTrends(userId, role, months, filters) {
    return {
      data: [],
      labels: [],
    };
  }

  async getPerformanceMetrics(userId, role, startDate, endDate, filters) {
    return {
      metrics: {},
    };
  }

  async getComplianceStats(userId, role, filters) {
    return {
      total: 0,
      byStatus: {},
    };
  }
}

