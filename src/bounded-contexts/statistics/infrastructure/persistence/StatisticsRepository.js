import { IStatisticsRepository } from "../../domain/repositories/IStatisticsRepository.js";

export class StatisticsRepository extends IStatisticsRepository {
  async getDashboardStats(entityId, role, filters) {
    if (role === "pharma_company") {
      return await this._getManufacturerDashboardStats(entityId);
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

