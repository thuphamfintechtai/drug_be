import express from "express";
import {
  getManufacturerDashboard,
  getDistributorDashboard,
  getPharmacyDashboard,
  getManufacturerSupplyChainStats,
  getDistributorSupplyChainStats,
  getPharmacyQualityStats,
  getBlockchainStats,
  getAlertsStats,
  getMonthlyTrends,
  getProductAnalytics,
  getPerformanceMetrics,
  getComplianceStats,
} from "../controllers/statisticsController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Tất cả routes đều cần authenticate
router.use(authenticate);

// ============ DASHBOARD STATISTICS ============
router.get("/manufacturer/dashboard", authorize("pharma_company"), getManufacturerDashboard);
router.get("/distributor/dashboard", authorize("distributor"), getDistributorDashboard);
router.get("/pharmacy/dashboard", authorize("pharmacy"), getPharmacyDashboard);

// ============ SUPPLY CHAIN STATISTICS ============
router.get(
  "/manufacturer/supply-chain",
  authorize("pharma_company"),
  getManufacturerSupplyChainStats
);
router.get(
  "/distributor/supply-chain",
  authorize("distributor"),
  getDistributorSupplyChainStats
);

// ============ QUALITY STATISTICS ============
router.get("/pharmacy/quality", authorize("pharmacy"), getPharmacyQualityStats);

// ============ BLOCKCHAIN STATISTICS ============
router.get("/blockchain", getBlockchainStats);

// ============ ALERTS STATISTICS ============
router.get("/alerts", getAlertsStats);

// ============ TRENDS STATISTICS ============
router.get("/trends/monthly", getMonthlyTrends);

// ============ PRODUCT ANALYTICS ============
router.get("/manufacturer/products", authorize("pharma_company"), getProductAnalytics);

// ============ PERFORMANCE METRICS ============
router.get("/performance", getPerformanceMetrics);

// ============ COMPLIANCE STATISTICS ============
router.get("/compliance", getComplianceStats);

export default router;

