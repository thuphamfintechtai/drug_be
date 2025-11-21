import express from "express";
import { authenticate, authorize } from "../../../identity-access/presentation/middleware/authMiddleware.js";

export const createProductionRoutes = (productionController) => {
  const router = express.Router();

  // Tất cả routes đều cần authenticate và là pharma_company
  router.use(authenticate);
  router.use(authorize("pharma_company"));

  // Bước 1: Upload folder lên IPFS
  router.post("/upload-ipfs", (req, res) =>
    productionController.uploadIPFS(req, res)
  );

  // Bước 2: Lưu NFT vào DB sau khi mint thành công (FE đã gọi smart contract)
  router.post("/save-minted", (req, res) =>
    productionController.saveMintedNFTs(req, res)
  );

  // Chuyển giao: Bước 1 - Lưu invoice với status pending
  router.post("/transfer", (req, res) =>
    productionController.transferToDistributor(req, res)
  );

  // Chuyển giao: Bước 2 - Lưu transactionHash sau khi FE gọi smart contract thành công
  router.post("/save-transfer", (req, res) =>
    productionController.saveTransferTransaction(req, res)
  );

  // Lịch sử sản xuất
  router.get("/history", (req, res) =>
    productionController.getProductionHistory(req, res)
  );

  // Lịch sử chuyển giao
  router.get("/transfer/history", (req, res) =>
    productionController.getTransferHistory(req, res)
  );

  // Danh sách tokenId còn khả dụng theo lô
  router.get("/:productionId/available-tokens", (req, res) =>
    productionController.getAvailableTokensForProduction(req, res)
  );

  // ============ THỐNG KÊ VÀ PROFILE ============
  router.get("/statistics", (req, res) =>
    productionController.getStatistics(req, res)
  );
  router.get("/profile", (req, res) =>
    productionController.getProfile(req, res)
  );
  router.get("/distributors", (req, res) =>
    productionController.getDistributors(req, res)
  );

  // ============ THỐNG KÊ CHART ============
  router.get("/chart/one-week", (req, res) =>
    productionController.getChartOneWeek(req, res)
  );
  router.get("/chart/today-yesterday", (req, res) =>
    productionController.getChartTodayYesterday(req, res)
  );
  router.get("/chart/productions-by-date-range", (req, res) =>
    productionController.getProductionsByDateRange(req, res)
  );
  router.get("/chart/distributions-by-date-range", (req, res) =>
    productionController.getDistributionsByDateRange(req, res)
  );
  router.get("/chart/transfers-by-date-range", (req, res) =>
    productionController.getTransfersByDateRange(req, res)
  );

  // ============ QUẢN LÝ IPFS ============
  router.get("/ipfs-status", (req, res) =>
    productionController.getIPFSStatus(req, res)
  );
  router.get("/ipfs-status-undone", (req, res) =>
    productionController.getIPFSStatusUndone(req, res)
  );

  return router;
};

