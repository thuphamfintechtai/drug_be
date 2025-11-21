import express from "express";
import { authenticate, authorize } from "../../../identity-access/presentation/middleware/authMiddleware.js";

export const createStatisticsRoutes = (statisticsController) => {
  const router = express.Router();

  // Tất cả routes đều cần authenticate
  router.use(authenticate);

  // Manufacturer dashboard
  router.get("/manufacturer/dashboard", authorize("pharma_company"), (req, res) =>
    statisticsController.getManufacturerDashboard(req, res)
  );

  // Distributor dashboard
  router.get("/distributor/dashboard", authorize("distributor"), (req, res) =>
    statisticsController.getDistributorDashboard(req, res)
  );

  // Pharmacy dashboard
  router.get("/pharmacy/dashboard", authorize("pharmacy"), (req, res) =>
    statisticsController.getPharmacyDashboard(req, res)
  );

  // Supply chain stats
  router.get("/supply-chain", (req, res) =>
    statisticsController.getSupplyChainStats(req, res)
  );

  // Alerts stats
  router.get("/alerts", (req, res) =>
    statisticsController.getAlertsStats(req, res)
  );

  // Blockchain stats
  router.get("/blockchain", (req, res) =>
    statisticsController.getBlockchainStats(req, res)
  );

  // Monthly trends
  router.get("/monthly-trends", (req, res) =>
    statisticsController.getMonthlyTrends(req, res)
  );

  // Performance metrics
  router.get("/performance", (req, res) =>
    statisticsController.getPerformanceMetrics(req, res)
  );

  // Compliance stats
  router.get("/compliance", (req, res) =>
    statisticsController.getComplianceStats(req, res)
  );

  return router;
};

