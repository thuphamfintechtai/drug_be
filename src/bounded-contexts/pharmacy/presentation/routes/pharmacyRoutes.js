import express from "express";
import { authenticate, authorize } from "../../../identity-access/presentation/middleware/authMiddleware.js";

export const createPharmacyRoutes = (pharmacyController) => {
  const router = express.Router();

  // Tất cả routes đều cần authenticate và là pharmacy
  router.use(authenticate);
  router.use(authorize("pharmacy"));

  // ============ QUẢN LÝ ĐƠN HÀNG TỪ DISTRIBUTOR ============
  router.get("/invoices", (req, res) =>
    pharmacyController.getInvoicesFromDistributor(req, res)
  );
  router.post("/invoices/confirm-receipt", (req, res) =>
    pharmacyController.confirmReceipt(req, res)
  );

  // ============ LỊCH SỬ VÀ THỐNG KÊ ============
  router.get("/receipt/history", (req, res) =>
    pharmacyController.getReceiptHistory(req, res)
  );
  router.get("/statistics", (req, res) =>
    pharmacyController.getStatistics(req, res)
  );

  // ============ TRACKING VÀ THUỐC ============
  router.get("/track/:tokenId", (req, res) =>
    pharmacyController.trackDrugByNFTId(req, res)
  );
  router.get("/drugs", (req, res) =>
    pharmacyController.getDrugs(req, res)
  );
  router.get("/drugs/search", (req, res) =>
    pharmacyController.searchDrugByATCCode(req, res)
  );

  // ============ PROFILE ============
  router.get("/profile", (req, res) =>
    pharmacyController.getProfile(req, res)
  );

  // ============ LỊCH SỬ PHÂN PHỐI ============
  router.get("/distribution/history", (req, res) =>
    pharmacyController.getDistributionHistory(req, res)
  );

  // ============ THỐNG KÊ CHART ============
  router.get("/chart/one-week", (req, res) =>
    pharmacyController.getChartOneWeek(req, res)
  );
  router.get("/chart/today-yesterday", (req, res) =>
    pharmacyController.getChartTodayYesterday(req, res)
  );
  router.get("/chart/invoices-by-date-range", (req, res) =>
    pharmacyController.getInvoicesByDateRange(req, res)
  );
  router.get("/chart/receipts-by-date-range", (req, res) =>
    pharmacyController.getReceiptsByDateRange(req, res)
  );

  return router;
};

