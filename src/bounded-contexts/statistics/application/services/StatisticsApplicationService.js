import { StatisticsRepository } from "../../infrastructure/persistence/StatisticsRepository.js";

export class StatisticsApplicationService {
  constructor(statisticsRepository) {
    this._statisticsRepository = statisticsRepository;
  }

  async getDashboard(userId, role, filters = {}) {
    return await this._statisticsRepository.getDashboardStats(userId, role, filters);
  }

  async getSupplyChainStats(userId, role, filters = {}) {
    return await this._statisticsRepository.getSupplyChainStats(userId, role, filters);
  }

  async getAlertsStats(userId, role, filters = {}) {
    return await this._statisticsRepository.getAlertsStats(userId, role, filters);
  }

  async getBlockchainStats(userId, role, filters = {}) {
    return await this._statisticsRepository.getBlockchainStats(userId, role, filters);
  }

  async getMonthlyTrends(userId, role, months = 6, filters = {}) {
    return await this._statisticsRepository.getMonthlyTrends(userId, role, months, filters);
  }

  async getPerformanceMetrics(userId, role, startDate, endDate, filters = {}) {
    return await this._statisticsRepository.getPerformanceMetrics(userId, role, startDate, endDate, filters);
  }

  async getComplianceStats(userId, role, filters = {}) {
    return await this._statisticsRepository.getComplianceStats(userId, role, filters);
  }
}

