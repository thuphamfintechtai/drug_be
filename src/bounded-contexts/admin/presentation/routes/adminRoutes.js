import express from "express";
import { authenticate, authorize } from "../../../identity-access/presentation/middleware/authMiddleware.js";

export const createAdminRoutes = (adminController) => {
  const router = express.Router();

  // Tất cả routes đều cần authenticate và là admin
  router.use(authenticate);
  router.use(authorize("admin"));

  // ============ QUẢN LÝ ĐĂNG KÝ ============
  router.get("/registration/statistics", (req, res) =>
    adminController.getRegistrationStatistics(req, res)
  );
  router.post("/registration/:requestId/retry-blockchain", (req, res) =>
    adminController.retryBlockchainRegistration(req, res)
  );

  // ============ THỐNG KÊ HỆ THỐNG ============
  router.get("/system/statistics", (req, res) =>
    adminController.getSystemStatistics(req, res)
  );

  // ============ QUẢN LÝ THUỐC ============
  router.get("/drugs", (req, res) =>
    adminController.getAllDrugs(req, res)
  );
  router.get("/drugs/:drugId", (req, res) =>
    adminController.getDrugDetails(req, res)
  );
  router.get("/drugs/statistics", (req, res) =>
    adminController.getDrugStatistics(req, res)
  );

  // ============ SUPPLY CHAIN & BATCH MANAGEMENT ============
  router.get("/supply-chain/history", (req, res) =>
    adminController.getSupplyChainHistory(req, res)
  );
  router.get("/distribution/history", (req, res) =>
    adminController.getDistributionHistory(req, res)
  );
  router.get("/batches", (req, res) =>
    adminController.getBatchList(req, res)
  );
  router.get("/batches/:batchNumber/journey", (req, res) =>
    adminController.getBatchJourney(req, res)
  );
  router.get("/nfts/:tokenId/journey", (req, res) =>
    adminController.getNFTJourney(req, res)
  );

  return router;
};

