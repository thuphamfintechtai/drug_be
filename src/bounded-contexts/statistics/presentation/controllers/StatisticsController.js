export class StatisticsController {
  constructor(statisticsService) {
    this._statisticsService = statisticsService;
  }

  async getManufacturerDashboard(req, res) {
    try {
      const userId = req.user?.id || req.user?._id;
      const data = await this._statisticsService.getDashboard(userId, "pharma_company");

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Lỗi khi lấy thống kê dashboard manufacturer:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Lỗi server khi lấy thống kê dashboard",
      });
    }
  }

  async getDistributorDashboard(req, res) {
    try {
      const userId = req.user?.id || req.user?._id;
      const data = await this._statisticsService.getDashboard(userId, "distributor");

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Lỗi khi lấy thống kê dashboard distributor:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Lỗi server khi lấy thống kê dashboard",
      });
    }
  }

  async getPharmacyDashboard(req, res) {
    try {
      const userId = req.user?.id || req.user?._id;
      const data = await this._statisticsService.getDashboard(userId, "pharmacy");

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Lỗi khi lấy thống kê dashboard pharmacy:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Lỗi server khi lấy thống kê dashboard",
      });
    }
  }

  async getSupplyChainStats(req, res) {
    try {
      const userId = req.user?.id || req.user?._id;
      const role = req.user?.role;
      const data = await this._statisticsService.getSupplyChainStats(userId, role);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Lỗi khi lấy thống kê supply chain:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Lỗi server khi lấy thống kê supply chain",
      });
    }
  }

  async getAlertsStats(req, res) {
    try {
      const userId = req.user?.id || req.user?._id;
      const role = req.user?.role;
      const data = await this._statisticsService.getAlertsStats(userId, role);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Lỗi khi lấy thống kê alerts:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Lỗi server khi lấy thống kê alerts",
      });
    }
  }

  async getBlockchainStats(req, res) {
    try {
      const userId = req.user?.id || req.user?._id;
      const role = req.user?.role;
      const data = await this._statisticsService.getBlockchainStats(userId, role);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Lỗi khi lấy thống kê blockchain:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Lỗi server khi lấy thống kê blockchain",
      });
    }
  }

  async getMonthlyTrends(req, res) {
    try {
      const userId = req.user?.id || req.user?._id;
      const role = req.user?.role;
      const months = parseInt(req.query.months) || 6;
      const data = await this._statisticsService.getMonthlyTrends(userId, role, months);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Lỗi khi lấy monthly trends:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Lỗi server khi lấy monthly trends",
      });
    }
  }

  async getPerformanceMetrics(req, res) {
    try {
      const userId = req.user?.id || req.user?._id;
      const role = req.user?.role;
      const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
      const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "startDate và endDate là bắt buộc",
        });
      }

      const data = await this._statisticsService.getPerformanceMetrics(userId, role, startDate, endDate);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Lỗi khi lấy performance metrics:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Lỗi server khi lấy performance metrics",
      });
    }
  }

  async getComplianceStats(req, res) {
    try {
      const userId = req.user?.id || req.user?._id;
      const role = req.user?.role;
      const data = await this._statisticsService.getComplianceStats(userId, role);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Lỗi khi lấy compliance stats:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Lỗi server khi lấy compliance stats",
      });
    }
  }
}

