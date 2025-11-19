export class IStatisticsRepository {
  async getDashboardStats(userId, role, filters) {
    throw new Error("Method getDashboardStats() must be implemented");
  }

  async getSupplyChainStats(userId, role, filters) {
    throw new Error("Method getSupplyChainStats() must be implemented");
  }

  async getAlertsStats(userId, role, filters) {
    throw new Error("Method getAlertsStats() must be implemented");
  }

  async getBlockchainStats(userId, role, filters) {
    throw new Error("Method getBlockchainStats() must be implemented");
  }

  async getMonthlyTrends(userId, role, months, filters) {
    throw new Error("Method getMonthlyTrends() must be implemented");
  }

  async getPerformanceMetrics(userId, role, startDate, endDate, filters) {
    throw new Error("Method getPerformanceMetrics() must be implemented");
  }

  async getComplianceStats(userId, role, filters) {
    throw new Error("Method getComplianceStats() must be implemented");
  }
}

