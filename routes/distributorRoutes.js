import express from "express";
import {
  getInvoicesFromManufacturer,
  confirmReceipt,
  transferToPharmacy,
  saveTransferToPharmacyTransaction,
  getDistributionHistory,
  getTransferToPharmacyHistory,
  getStatistics,
  trackDrugByNFTId,
  getDrugs,
  searchDrugByATCCode,
  getDistributorInfo,
  getPharmacies,
  getInvoiceDetail,
} from "../controllers/distributorController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Middleware: chỉ distributor mới có thể truy cập
const isDistributor = authorize("distributor");

// Tất cả routes đều cần authenticate và là distributor
router.use(authenticate);
router.use(isDistributor);

// ============ QUẢN LÝ ĐƠN HÀNG TỪ PHARMA COMPANY ============
router.get("/invoices", getInvoicesFromManufacturer);
router.get("/invoices/:invoiceId/detail", getInvoiceDetail);
router.post("/invoices/confirm-receipt", confirmReceipt);

// ============ CHUYỂN TIẾP CHO PHARMACY ============
router.post("/transfer/pharmacy", transferToPharmacy);
router.post("/transfer/pharmacy/save-transaction", saveTransferToPharmacyTransaction);

// ============ LỊCH SỬ VÀ THỐNG KÊ ============
router.get("/distribution/history", getDistributionHistory);
router.get("/transfer/history", getTransferToPharmacyHistory);
router.get("/statistics", getStatistics);
router.get("/track/:tokenId", trackDrugByNFTId);

// ============ QUẢN LÝ THUỐC ============
router.get("/drugs", getDrugs);
router.get("/drugs/search", searchDrugByATCCode);

// ============ QUẢN LÝ THÔNG TIN CÁ NHÂN ============
router.get("/profile", getDistributorInfo);

// ============ DANH SÁCH PHARMACIES ============
router.get("/pharmacies", getPharmacies);

export default router;

