import express from "express";
import {
  authenticate,
  authorize,
} from "../../../identity-access/presentation/middleware/authMiddleware.js";

export const createPharmacyRoutes = (pharmacyController) => {
  const router = express.Router();

  // Tất cả routes đều cần authenticate và là pharmacy
  router.use(authenticate);
  router.use(authorize("pharmacy"));

  /**
   * @swagger
   * /api/pharmacy/invoices:
   *   get:
   *     summary: Lấy danh sách đơn hàng từ nhà phân phối
   *     tags: [Pharmacy]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, confirmed, rejected]
   *     responses:
   *       200:
   *         description: Danh sách đơn hàng
   */
  router.get("/invoices", (req, res) =>
    pharmacyController.getInvoicesFromDistributor(req, res)
  );

  /**
   * @swagger
   * /api/pharmacy/invoices/confirm-receipt:
   *   post:
   *     summary: Xác nhận nhận hàng từ nhà phân phối
   *     tags: [Pharmacy]
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
   *             properties:
   *               invoiceId:
   *                 type: string
   *     responses:
   *       200:
   *         description: Xác nhận nhận hàng thành công
   */
  router.post("/invoices/confirm-receipt", (req, res) =>
    pharmacyController.confirmReceipt(req, res)
  );

  /**
   * @swagger
   * /api/pharmacy/contracts/confirm:
   *   post:
   *     summary: Xác nhận hợp đồng với nhà phân phối
   *     tags: [Pharmacy]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - contractId
   *             properties:
   *               contractId:
   *                 type: string
   *     responses:
   *       200:
   *         description: Xác nhận hợp đồng thành công
   */
  router.post("/contracts/confirm", (req, res) =>
    pharmacyController.confirmContract(req, res)
  );

  /**
   * @swagger
   * /api/pharmacy/contracts:
   *   get:
   *     summary: Lấy danh sách hợp đồng
   *     tags: [Pharmacy]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, confirmed, rejected]
   *     responses:
   *       200:
   *         description: Danh sách hợp đồng
   */
  router.get("/contracts", (req, res) =>
    pharmacyController.getContracts(req, res)
  );

  /**
   * @swagger
   * /api/pharmacy/contracts/{contractId}:
   *   get:
   *     summary: Lấy chi tiết hợp đồng
   *     tags: [Pharmacy]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: contractId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Chi tiết hợp đồng
   */
  router.get("/contracts/:contractId", (req, res) =>
    pharmacyController.getContractDetail(req, res)
  );

  /**
   * @swagger
   * /api/pharmacy/contracts/blockchain/info:
   *   get:
   *     summary: Lấy thông tin hợp đồng từ blockchain
   *     tags: [Pharmacy]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thông tin hợp đồng từ blockchain
   */
  router.get("/contracts/blockchain/info", (req, res) =>
    pharmacyController.getContractInfoFromBlockchain(req, res)
  );

  /**
   * @swagger
   * /api/pharmacy/receipt/history:
   *   get:
   *     summary: Lấy lịch sử nhận hàng
   *     tags: [Pharmacy]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Lịch sử nhận hàng
   */
  router.get("/receipt/history", (req, res) =>
    pharmacyController.getReceiptHistory(req, res)
  );

  /**
   * @swagger
   * /api/pharmacy/statistics:
   *   get:
   *     summary: Lấy thống kê nhà thuốc
   *     tags: [Pharmacy]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thống kê nhà thuốc
   */
  router.get("/statistics", (req, res) =>
    pharmacyController.getStatistics(req, res)
  );

  /**
   * @swagger
   * /api/pharmacy/track/{tokenId}:
   *   get:
   *     summary: Theo dõi thuốc theo NFT token ID
   *     tags: [Pharmacy]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: tokenId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Thông tin tracking
   */
  router.get("/track/:tokenId", (req, res) =>
    pharmacyController.trackDrugByNFTId(req, res)
  );

  /**
   * @swagger
   * /api/pharmacy/drugs:
   *   get:
   *     summary: Lấy danh sách thuốc
   *     tags: [Pharmacy]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Danh sách thuốc
   */
  router.get("/drugs", (req, res) => pharmacyController.getDrugs(req, res));

  /**
   * @swagger
   * /api/pharmacy/drugs/search:
   *   get:
   *     summary: Tìm kiếm thuốc theo mã ATC
   *     tags: [Pharmacy]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: atcCode
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Danh sách thuốc tìm được
   */
  router.get("/drugs/search", (req, res) =>
    pharmacyController.searchDrugByATCCode(req, res)
  );

  /**
   * @swagger
   * /api/pharmacy/profile:
   *   get:
   *     summary: Lấy thông tin profile nhà thuốc
   *     tags: [Pharmacy]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thông tin profile
   */
  router.get("/profile", (req, res) => pharmacyController.getProfile(req, res));

  /**
   * @swagger
   * /api/pharmacy/distribution/history:
   *   get:
   *     summary: Lấy lịch sử phân phối
   *     tags: [Pharmacy]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lịch sử phân phối
   */
  router.get("/distribution/history", (req, res) =>
    pharmacyController.getDistributionHistory(req, res)
  );

  /**
   * @swagger
   * /api/pharmacy/chart/one-week:
   *   get:
   *     summary: Lấy thống kê chart 1 tuần
   *     tags: [Pharmacy]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thống kê chart 1 tuần
   */
  router.get("/chart/one-week", (req, res) =>
    pharmacyController.getChartOneWeek(req, res)
  );

  /**
   * @swagger
   * /api/pharmacy/chart/today-yesterday:
   *   get:
   *     summary: Lấy thống kê hôm nay và hôm qua
   *     tags: [Pharmacy]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thống kê hôm nay và hôm qua
   */
  router.get("/chart/today-yesterday", (req, res) =>
    pharmacyController.getChartTodayYesterday(req, res)
  );

  /**
   * @swagger
   * /api/pharmacy/chart/invoices-by-date-range:
   *   get:
   *     summary: Lấy thống kê đơn hàng theo khoảng thời gian
   *     tags: [Pharmacy]
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
   *         description: Thống kê đơn hàng theo khoảng thời gian
   */
  router.get("/chart/invoices-by-date-range", (req, res) =>
    pharmacyController.getInvoicesByDateRange(req, res)
  );

  /**
   * @swagger
   * /api/pharmacy/chart/receipts-by-date-range:
   *   get:
   *     summary: Lấy thống kê nhận hàng theo khoảng thời gian
   *     tags: [Pharmacy]
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
   *         description: Thống kê nhận hàng theo khoảng thời gian
   */
  router.get("/chart/receipts-by-date-range", (req, res) =>
    pharmacyController.getReceiptsByDateRange(req, res)
  );

  return router;
};
