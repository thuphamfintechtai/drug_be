import express from "express";
import {
  authenticate,
  authorize,
} from "../../../identity-access/presentation/middleware/authMiddleware.js";

export const createProductionRoutes = (productionController) => {
  const router = express.Router();

  // Tất cả routes đều cần authenticate và là pharma_company
  router.use(authenticate);
  router.use(authorize("pharma_company"));

  /**
   * @swagger
   * /api/production/upload-ipfs:
   *   post:
   *     summary: Upload folder lên IPFS (Bước 1)
   *     tags: [Production]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               files:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: binary
   *     responses:
   *       200:
   *         description: Upload thành công
   */
  router.post("/upload-ipfs", (req, res) =>
    productionController.uploadIPFS(req, res)
  );

  /**
   * @swagger
   * /api/production/save-minted:
   *   post:
   *     summary: Lưu NFT vào DB sau khi mint thành công (Bước 2)
   *     tags: [Production]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - tokenIds
   *               - ipfsHash
   *               - drugId
   *             properties:
   *               tokenIds:
   *                 type: array
   *                 items:
   *                   type: string
   *               ipfsHash:
   *                 type: string
   *               drugId:
   *                 type: string
   *               batchNumber:
   *                 type: string
   *     responses:
   *       200:
   *         description: Lưu NFT thành công
   */
  router.post("/save-minted", (req, res) =>
    productionController.saveMintedNFTs(req, res)
  );

  /**
   * @swagger
   * /api/production/transfer:
   *   post:
   *     summary: Chuyển giao thuốc cho distributor (Bước 1 - Lưu invoice)
   *     tags: [Production]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - distributorId
   *               - tokenIds
   *             properties:
   *               distributorId:
   *                 type: string
   *               tokenIds:
   *                 type: array
   *                 items:
   *                   type: string
   *               invoiceNumber:
   *                 type: string
   *     responses:
   *       200:
   *         description: Tạo invoice thành công
   */
  router.post("/transfer", (req, res) =>
    productionController.transferToDistributor(req, res)
  );

  /**
   * @swagger
   * /api/production/save-transfer:
   *   post:
   *     summary: Lưu transactionHash sau khi chuyển giao thành công (Bước 2)
   *     tags: [Production]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - invoiceId
   *               - transactionHash
   *             properties:
   *               invoiceId:
   *                 type: string
   *               transactionHash:
   *                 type: string
   *     responses:
   *       200:
   *         description: Lưu transaction thành công
   */
  router.post("/save-transfer", (req, res) =>
    productionController.saveTransferTransaction(req, res)
  );

  /**
   * @swagger
   * /api/production/history:
   *   get:
   *     summary: Lấy lịch sử sản xuất
   *     tags: [Production]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Lịch sử sản xuất
   */
  router.get("/history", (req, res) =>
    productionController.getProductionHistory(req, res)
  );

  /**
   * @swagger
   * /api/production/transfer/history:
   *   get:
   *     summary: Lấy lịch sử chuyển giao
   *     tags: [Production]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Lịch sử chuyển giao
   */
  router.get("/transfer/history", (req, res) =>
    productionController.getTransferHistory(req, res)
  );

  /**
   * @swagger
   * /api/production/{productionId}/available-tokens:
   *   get:
   *     summary: Lấy danh sách tokenId còn khả dụng theo lô
   *     tags: [Production]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: productionId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Danh sách tokenId khả dụng
   */
  router.get("/:productionId/available-tokens", (req, res) =>
    productionController.getAvailableTokensForProduction(req, res)
  );

  /**
   * @swagger
   * /api/production/statistics:
   *   get:
   *     summary: Lấy thống kê sản xuất
   *     tags: [Production]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thống kê sản xuất
   */
  router.get("/statistics", (req, res) =>
    productionController.getStatistics(req, res)
  );

  /**
   * @swagger
   * /api/production/profile:
   *   get:
   *     summary: Lấy thông tin profile nhà sản xuất
   *     tags: [Production]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thông tin profile
   */
  router.get("/profile", (req, res) =>
    productionController.getProfile(req, res)
  );

  /**
   * @swagger
   * /api/production/distributors:
   *   get:
   *     summary: Lấy danh sách distributor
   *     tags: [Production]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Danh sách distributor
   */
  router.get("/distributors", (req, res) =>
    productionController.getDistributors(req, res)
  );

  /**
   * @swagger
   * /api/production/chart/one-week:
   *   get:
   *     summary: Lấy thống kê chart 1 tuần
   *     tags: [Production]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thống kê chart 1 tuần
   */
  router.get("/chart/one-week", (req, res) =>
    productionController.getChartOneWeek(req, res)
  );

  /**
   * @swagger
   * /api/production/chart/today-yesterday:
   *   get:
   *     summary: Lấy thống kê hôm nay và hôm qua
   *     tags: [Production]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thống kê hôm nay và hôm qua
   */
  router.get("/chart/today-yesterday", (req, res) =>
    productionController.getChartTodayYesterday(req, res)
  );

  /**
   * @swagger
   * /api/production/chart/productions-by-date-range:
   *   get:
   *     summary: Lấy thống kê sản xuất theo khoảng thời gian
   *     tags: [Production]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *     responses:
   *       200:
   *         description: Thống kê sản xuất theo khoảng thời gian
   */
  router.get("/chart/productions-by-date-range", (req, res) =>
    productionController.getProductionsByDateRange(req, res)
  );

  /**
   * @swagger
   * /api/production/chart/distributions-by-date-range:
   *   get:
   *     summary: Lấy thống kê phân phối theo khoảng thời gian
   *     tags: [Production]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *     responses:
   *       200:
   *         description: Thống kê phân phối theo khoảng thời gian
   */
  router.get("/chart/distributions-by-date-range", (req, res) =>
    productionController.getDistributionsByDateRange(req, res)
  );

  /**
   * @swagger
   * /api/production/chart/transfers-by-date-range:
   *   get:
   *     summary: Lấy thống kê chuyển giao theo khoảng thời gian
   *     tags: [Production]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *     responses:
   *       200:
   *         description: Thống kê chuyển giao theo khoảng thời gian
   */
  router.get("/chart/transfers-by-date-range", (req, res) =>
    productionController.getTransfersByDateRange(req, res)
  );

  /**
   * @swagger
   * /api/production/ipfs-status:
   *   get:
   *     summary: Lấy trạng thái IPFS
   *     tags: [Production]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Trạng thái IPFS
   */
  router.get("/ipfs-status", (req, res) =>
    productionController.getIPFSStatus(req, res)
  );

  /**
   * @swagger
   * /api/production/ipfs-status-undone:
   *   get:
   *     summary: Lấy trạng thái IPFS chưa hoàn thành
   *     tags: [Production]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Trạng thái IPFS chưa hoàn thành
   */
  router.get("/ipfs-status-undone", (req, res) =>
    productionController.getIPFSStatusUndone(req, res)
  );

  return router;
};
