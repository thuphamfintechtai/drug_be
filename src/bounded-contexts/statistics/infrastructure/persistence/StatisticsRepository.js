import { IStatisticsRepository } from "../../domain/repositories/IStatisticsRepository.js";

export class StatisticsRepository extends IStatisticsRepository {
  async getDashboardStats(userId, role, filters) {
    // Sử dụng StatisticsFactory cũ cho đến khi migrate hoàn toàn
    const user = { _id: userId, role };
    const strategy = await StatisticsFactory.createStrategyWithRoleValidation(user, role);
    return await strategy.getDashboard();
  }

  async getSupplyChainStats(userId, role, filters) {
    const user = { _id: userId, role };
    const strategy = await StatisticsFactory.createStrategyWithRoleValidation(user, role);
    return await strategy.getSupplyChainStats();
  }

  async getAlertsStats(userId, role, filters) {
    const user = { _id: userId, role };
    const strategy = await StatisticsFactory.createStrategyWithRoleValidation(user, role);
    return await strategy.getAlertsStats();
  }

  async getBlockchainStats(userId, role, filters) {
    const user = { _id: userId, role };
    const strategy = await StatisticsFactory.createStrategyWithRoleValidation(user, role);
    return await strategy.getBlockchainStats();
  }

  async getMonthlyTrends(userId, role, months, filters) {
    const user = { _id: userId, role };
    const strategy = await StatisticsFactory.createStrategyWithRoleValidation(user, role);
    return await strategy.getMonthlyTrends(months);
  }

  async getPerformanceMetrics(userId, role, startDate, endDate, filters) {
    const user = { _id: userId, role };
    const strategy = await StatisticsFactory.createStrategyWithRoleValidation(user, role);
    return await strategy.getPerformanceMetrics(startDate, endDate);
  }

  async getComplianceStats(userId, role, filters) {
    const user = { _id: userId, role };
    const strategy = await StatisticsFactory.createStrategyWithRoleValidation(user, role);
    return await strategy.getComplianceStats();
  }
}

