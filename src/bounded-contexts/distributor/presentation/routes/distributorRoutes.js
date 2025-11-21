import express from "express";
import { authenticate, authorize } from "../../../identity-access/presentation/middleware/authMiddleware.js";

export const createDistributorRoutes = (distributorController) => {
  const router = express.Router();

  // Tất cả routes đều cần authenticate và là distributor
  router.use(authenticate);
  router.use(authorize("distributor"));

  // ============ QUẢN LÝ ĐƠN HÀNG TỪ PHARMA COMPANY ============
  router.get("/invoices", (req, res) =>
    distributorController.getInvoicesFromManufacturer(req, res)
  );
  router.get("/invoices/:invoiceId/detail", (req, res) =>
    distributorController.getInvoiceDetail(req, res)
  );
  router.post("/invoices/confirm-receipt", (req, res) =>
    distributorController.confirmReceipt(req, res)
  );

  // ============ CHUYỂN TIẾP CHO PHARMACY ============
  router.post("/transfer/pharmacy", (req, res) =>
    distributorController.transferToPharmacy(req, res)
  );
  router.post("/transfer/pharmacy/save-transaction", (req, res) =>
    distributorController.saveTransferToPharmacyTransaction(req, res)
  );

  // ============ LỊCH SỬ VÀ THỐNG KÊ ============
  router.get("/distribution/history", (req, res) =>
    distributorController.getDistributionHistory(req, res)
  );
  router.get("/transfer/history", (req, res) =>
    distributorController.getTransferToPharmacyHistory(req, res)
  );
  router.get("/statistics", (req, res) =>
    distributorController.getStatistics(req, res)
  );

  // ============ TRACKING VÀ THUỐC ============
  router.get("/track/:tokenId", (req, res) =>
    distributorController.trackDrugByNFTId(req, res)
  );
  router.get("/drugs", (req, res) =>
    distributorController.getDrugs(req, res)
  );
  router.get("/drugs/search", (req, res) =>
    distributorController.searchDrugByATCCode(req, res)
  );

  // ============ PROFILE VÀ DANH SÁCH ============
  router.get("/profile", (req, res) =>
    distributorController.getProfile(req, res)
  );
  router.get("/pharmacies", (req, res) =>
    distributorController.getPharmacies(req, res)
  );

  // ============ QUẢN LÝ HỢP ĐỒNG VỚI PHARMACY ============
  router.post("/contracts/create", (req, res) =>
    distributorController.createContractRequest(req, res)
  );
  router.post("/contracts/finalize-and-mint", (req, res) =>
    distributorController.finalizeContractAndMint(req, res)
  );
  router.get("/contracts", (req, res) =>
    distributorController.getContracts(req, res)
  );
  router.get("/contracts/:contractId", (req, res) =>
    distributorController.getContractDetail(req, res)
  );
  router.get("/contracts/blockchain/info", (req, res) =>
    distributorController.getContractInfoFromBlockchain(req, res)
  );

  // ============ THỐNG KÊ CHART ============
  router.get("/chart/one-week", (req, res) =>
    distributorController.getChartOneWeek(req, res)
  );
  router.get("/chart/today-yesterday", (req, res) =>
    distributorController.getChartTodayYesterday(req, res)
  );
  router.get("/chart/invoices-by-date-range", (req, res) =>
    distributorController.getInvoicesByDateRange(req, res)
  );
  router.get("/chart/distributions-by-date-range", (req, res) =>
    distributorController.getDistributionsByDateRange(req, res)
  );
  router.get("/chart/transfers-to-pharmacy-by-date-range", (req, res) =>
    distributorController.getTransfersToPharmacyByDateRange(req, res)
  );

  return router;
};

