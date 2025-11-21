import express from "express";
import {
  authenticate,
  authorize,
} from "../../../identity-access/presentation/middleware/authMiddleware.js";

export const createDistributorRoutes = (distributorController) => {
  const router = express.Router();

  // Tất cả routes đều cần authenticate và là distributor
  router.use(authenticate);
  router.use(authorize("distributor"));

  /**
   * @swagger
   * /api/distributor/invoices:
   *   get:
   *     summary: Lấy danh sách đơn hàng từ nhà sản xuất
   *     tags: [Distributor]
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
    distributorController.getInvoicesFromManufacturer(req, res)
  );

  /**
   * @swagger
   * /api/distributor/invoices/{invoiceId}/detail:
   *   get:
   *     summary: Lấy chi tiết đơn hàng
   *     tags: [Distributor]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: invoiceId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Chi tiết đơn hàng
   */
  router.get("/invoices/:invoiceId/detail", (req, res) =>
    distributorController.getInvoiceDetail(req, res)
  );

  /**
   * @swagger
   * /api/distributor/invoices/confirm-receipt:
   *   post:
   *     summary: Xác nhận nhận hàng từ nhà sản xuất
   *     tags: [Distributor]
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
    distributorController.confirmReceipt(req, res)
  );

  /**
   * @swagger
   * /api/distributor/transfer/pharmacy:
   *   post:
   *     summary: Chuyển giao thuốc cho nhà thuốc (Bước 1)
   *     tags: [Distributor]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - pharmacyId
   *               - tokenIds
   *             properties:
   *               pharmacyId:
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
  router.post("/transfer/pharmacy", (req, res) =>
    distributorController.transferToPharmacy(req, res)
  );

  /**
   * @swagger
   * /api/distributor/transfer/pharmacy/save-transaction:
   *   post:
   *     summary: Lưu transactionHash sau khi chuyển giao thành công (Bước 2)
   *     tags: [Distributor]
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
  router.post("/transfer/pharmacy/save-transaction", (req, res) =>
    distributorController.saveTransferToPharmacyTransaction(req, res)
  );

  /**
   * @swagger
   * /api/distributor/distribution/history:
   *   get:
   *     summary: Lấy lịch sử phân phối
   *     tags: [Distributor]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Lịch sử phân phối
   */
  router.get("/distribution/history", (req, res) =>
    distributorController.getDistributionHistory(req, res)
  );

  /**
   * @swagger
   * /api/distributor/transfer/history:
   *   get:
   *     summary: Lấy lịch sử chuyển giao cho nhà thuốc
   *     tags: [Distributor]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lịch sử chuyển giao
   */
  router.get("/transfer/history", (req, res) =>
    distributorController.getTransferToPharmacyHistory(req, res)
  );

  /**
   * @swagger
   * /api/distributor/statistics:
   *   get:
   *     summary: Lấy thống kê phân phối
   *     tags: [Distributor]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thống kê phân phối
   */
  router.get("/statistics", (req, res) =>
    distributorController.getStatistics(req, res)
  );

  /**
   * @swagger
   * /api/distributor/track/{tokenId}:
   *   get:
   *     summary: Theo dõi thuốc theo NFT token ID
   *     tags: [Distributor]
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
    distributorController.trackDrugByNFTId(req, res)
  );

  /**
   * @swagger
   * /api/distributor/drugs:
   *   get:
   *     summary: Lấy danh sách thuốc
   *     tags: [Distributor]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Danh sách thuốc
   */
  router.get("/drugs", (req, res) => distributorController.getDrugs(req, res));

  /**
   * @swagger
   * /api/distributor/drugs/search:
   *   get:
   *     summary: Tìm kiếm thuốc theo mã ATC
   *     tags: [Distributor]
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
    distributorController.searchDrugByATCCode(req, res)
  );

  /**
   * @swagger
   * /api/distributor/profile:
   *   get:
   *     summary: Lấy thông tin profile nhà phân phối
   *     tags: [Distributor]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thông tin profile
   */
  router.get("/profile", (req, res) =>
    distributorController.getProfile(req, res)
  );

  /**
   * @swagger
   * /api/distributor/pharmacies:
   *   get:
   *     summary: Lấy danh sách nhà thuốc
   *     tags: [Distributor]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Danh sách nhà thuốc
   */
  router.get("/pharmacies", (req, res) =>
    distributorController.getPharmacies(req, res)
  );

  /**
   * @swagger
   * /api/distributor/contracts/create:
   *   post:
   *     summary: Tạo yêu cầu hợp đồng với nhà thuốc
   *     tags: [Distributor]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - pharmacyId
   *             properties:
   *               pharmacyId:
   *                 type: string
   *               terms:
   *                 type: string
   *     responses:
   *       200:
   *         description: Tạo hợp đồng thành công
   */
  router.post("/contracts/create", (req, res) =>
    distributorController.createContractRequest(req, res)
  );

  /**
   * @swagger
   * /api/distributor/contracts/finalize-and-mint:
   *   post:
   *     summary: Hoàn tất và mint hợp đồng lên blockchain
   *     tags: [Distributor]
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
   *               - transactionHash
   *             properties:
   *               contractId:
   *                 type: string
   *               transactionHash:
   *                 type: string
   *     responses:
   *       200:
   *         description: Hoàn tất hợp đồng thành công
   */
  router.post("/contracts/finalize-and-mint", (req, res) =>
    distributorController.finalizeContractAndMint(req, res)
  );

  /**
   * @swagger
   * /api/distributor/contracts:
   *   get:
   *     summary: Lấy danh sách hợp đồng
   *     tags: [Distributor]
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
    distributorController.getContracts(req, res)
  );

  /**
   * @swagger
   * /api/distributor/contracts/{contractId}:
   *   get:
   *     summary: Lấy chi tiết hợp đồng
   *     tags: [Distributor]
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
    distributorController.getContractDetail(req, res)
  );

  /**
   * @swagger
   * /api/distributor/contracts/blockchain/info:
   *   get:
   *     summary: Lấy thông tin hợp đồng từ blockchain
   *     tags: [Distributor]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thông tin hợp đồng từ blockchain
   */
  router.get("/contracts/blockchain/info", (req, res) =>
    distributorController.getContractInfoFromBlockchain(req, res)
  );

  /**
   * @swagger
   * /api/distributor/chart/one-week:
   *   get:
   *     summary: Lấy thống kê chart 1 tuần
   *     tags: [Distributor]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thống kê chart 1 tuần
   */
  router.get("/chart/one-week", (req, res) =>
    distributorController.getChartOneWeek(req, res)
  );

  /**
   * @swagger
   * /api/distributor/chart/today-yesterday:
   *   get:
   *     summary: Lấy thống kê hôm nay và hôm qua
   *     tags: [Distributor]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thống kê hôm nay và hôm qua
   */
  router.get("/chart/today-yesterday", (req, res) =>
    distributorController.getChartTodayYesterday(req, res)
  );

  /**
   * @swagger
   * /api/distributor/chart/invoices-by-date-range:
   *   get:
   *     summary: Lấy thống kê đơn hàng theo khoảng thời gian
   *     tags: [Distributor]
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
    distributorController.getInvoicesByDateRange(req, res)
  );

  /**
   * @swagger
   * /api/distributor/chart/distributions-by-date-range:
   *   get:
   *     summary: Lấy thống kê phân phối theo khoảng thời gian
   *     tags: [Distributor]
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
    distributorController.getDistributionsByDateRange(req, res)
  );

  /**
   * @swagger
   * /api/distributor/chart/transfers-to-pharmacy-by-date-range:
   *   get:
   *     summary: Lấy thống kê chuyển giao cho nhà thuốc theo khoảng thời gian
   *     tags: [Distributor]
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
  router.get("/chart/transfers-to-pharmacy-by-date-range", (req, res) =>
    distributorController.getTransfersToPharmacyByDateRange(req, res)
  );

  return router;
};
