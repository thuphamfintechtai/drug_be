import express from "express";
import {
  authenticate,
  authorize,
} from "../../../identity-access/presentation/middleware/authMiddleware.js";

export const createStatisticsRoutes = (statisticsController) => {
  const router = express.Router();

  // Tất cả routes đều cần authenticate
  router.use(authenticate);

  /**
   * @swagger
   * /api/statistics/manufacturer/dashboard:
   *   get:
   *     summary: Lấy thống kê dashboard nhà sản xuất
   *     tags: [Statistics]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thống kê dashboard nhà sản xuất
   *       403:
   *         description: Không có quyền truy cập
   */
  router.get(
    "/manufacturer/dashboard",
    authorize("pharma_company"),
    (req, res) => statisticsController.getManufacturerDashboard(req, res)
  );

  /**
   * @swagger
   * /api/statistics/distributor/dashboard:
   *   get:
   *     summary: Lấy thống kê dashboard nhà phân phối
   *     tags: [Statistics]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thống kê dashboard nhà phân phối
   *       403:
   *         description: Không có quyền truy cập
   */
  router.get("/distributor/dashboard", authorize("distributor"), (req, res) =>
    statisticsController.getDistributorDashboard(req, res)
  );

  /**
   * @swagger
   * /api/statistics/pharmacy/dashboard:
   *   get:
   *     summary: Lấy thống kê dashboard nhà thuốc
   *     tags: [Statistics]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thống kê dashboard nhà thuốc
   *       403:
   *         description: Không có quyền truy cập
   */
  router.get("/pharmacy/dashboard", authorize("pharmacy"), (req, res) =>
    statisticsController.getPharmacyDashboard(req, res)
  );

  /**
   * @swagger
   * /api/statistics/supply-chain:
   *   get:
   *     summary: Lấy thống kê chuỗi cung ứng
   *     tags: [Statistics]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thống kê chuỗi cung ứng
   */
  router.get("/supply-chain", (req, res) =>
    statisticsController.getSupplyChainStats(req, res)
  );

  /**
   * @swagger
   * /api/statistics/alerts:
   *   get:
   *     summary: Lấy thống kê cảnh báo
   *     tags: [Statistics]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thống kê cảnh báo
   */
  router.get("/alerts", (req, res) =>
    statisticsController.getAlertsStats(req, res)
  );

  /**
   * @swagger
   * /api/statistics/blockchain:
   *   get:
   *     summary: Lấy thống kê blockchain
   *     tags: [Statistics]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thống kê blockchain
   */
  router.get("/blockchain", (req, res) =>
    statisticsController.getBlockchainStats(req, res)
  );

  /**
   * @swagger
   * /api/statistics/monthly-trends:
   *   get:
   *     summary: Lấy thống kê xu hướng hàng tháng
   *     tags: [Statistics]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thống kê xu hướng hàng tháng
   */
  router.get("/monthly-trends", (req, res) =>
    statisticsController.getMonthlyTrends(req, res)
  );

  /**
   * @swagger
   * /api/statistics/performance:
   *   get:
   *     summary: Lấy thống kê hiệu suất
   *     tags: [Statistics]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thống kê hiệu suất
   */
  router.get("/performance", (req, res) =>
    statisticsController.getPerformanceMetrics(req, res)
  );

  /**
   * @swagger
   * /api/statistics/compliance:
   *   get:
   *     summary: Lấy thống kê tuân thủ
   *     tags: [Statistics]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thống kê tuân thủ
   */
  router.get("/compliance", (req, res) =>
    statisticsController.getComplianceStats(req, res)
  );

  return router;
};
