/**
 * Base Strategy Interface cho Statistics
 * Định nghĩa các phương thức chung mà mọi Statistics Strategy phải implement
 */
class StatisticsStrategy {
  constructor(user, businessEntity) {
    this.user = user;
    this.businessEntity = businessEntity;
  }

  /**
   * Lấy dashboard statistics
   */
  async getDashboard() {
    throw new Error("Method getDashboard() must be implemented");
  }

  /**
   * Lấy supply chain statistics
   */
  async getSupplyChainStats() {
    throw new Error("Method getSupplyChainStats() must be implemented");
  }

  /**
   * Lấy alerts statistics
   */
  async getAlertsStats() {
    throw new Error("Method getAlertsStats() must be implemented");
  }

  /**
   * Lấy blockchain statistics
   */
  async getBlockchainStats() {
    throw new Error("Method getBlockchainStats() must be implemented");
  }

  /**
   * Lấy monthly trends
   */
  async getMonthlyTrends(months) {
    throw new Error("Method getMonthlyTrends() must be implemented");
  }

  /**
   * Lấy performance metrics
   */
  async getPerformanceMetrics(startDate, endDate) {
    throw new Error("Method getPerformanceMetrics() must be implemented");
  }

  /**
   * Lấy compliance statistics
   */
  async getComplianceStats() {
    throw new Error("Method getComplianceStats() must be implemented");
  }

  /**
   * Lấy filter cho queries dựa trên role
   */
  getFilter() {
    throw new Error("Method getFilter() must be implemented");
  }

  /**
   * Validate user và business entity
   */
  async validate() {
    if (!this.user) {
      throw new Error("User is required");
    }
    if (!this.businessEntity) {
      throw new Error("Business entity is required");
    }
    return true;
  }
}

export default StatisticsStrategy;

