import express from "express";
import {
  authenticate,
  authorize,
} from "../../../identity-access/presentation/middleware/authMiddleware.js";

export const createAdminRoutes = (adminController) => {
  const router = express.Router();

  // Tất cả routes đều cần authenticate và là admin
  router.use(authenticate);
  router.use(authorize("system_admin"));

  /**
   * @swagger
   * /api/admin/registration/statistics:
   *   get:
   *     summary: Lấy thống kê đăng ký (Admin only)
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thống kê đăng ký
   */
  router.get("/registration/statistics", (req, res) =>
    adminController.getRegistrationStatistics(req, res)
  );

  /**
   * @swagger
   * /api/admin/registration/{requestId}/retry-blockchain:
   *   post:
   *     summary: Thử lại đăng ký lên blockchain (Admin only)
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: requestId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Thử lại thành công
   */
  router.post("/registration/:requestId/retry-blockchain", (req, res) =>
    adminController.retryBlockchainRegistration(req, res)
  );

  /**
   * @swagger
   * /api/admin/system/statistics:
   *   get:
   *     summary: Lấy thống kê hệ thống (Admin only)
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thống kê hệ thống
   */
  router.get("/system/statistics", (req, res) =>
    adminController.getSystemStatistics(req, res)
  );

  /**
   * @swagger
   * /api/admin/drugs:
   *   get:
   *     summary: Lấy danh sách tất cả thuốc (Admin only)
   *     tags: [Admin]
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
   *         description: Danh sách thuốc
   */
  router.get("/drugs", (req, res) => adminController.getAllDrugs(req, res));

  /**
   * @swagger
   * /api/admin/drugs/statistics:
   *   get:
   *     summary: Lấy thống kê thuốc (Admin only)
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thống kê thuốc
   */
  router.get("/drugs/statistics", (req, res) =>
    adminController.getDrugStatistics(req, res)
  );

  /**
   * @swagger
   * /api/admin/drugs/{drugId}:
   *   get:
   *     summary: Lấy chi tiết thuốc (Admin only)
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: drugId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Chi tiết thuốc
   */
  router.get("/drugs/:drugId", (req, res) =>
    adminController.getDrugDetails(req, res)
  );

  /**
   * @swagger
   * /api/admin/supply-chain/history:
   *   get:
   *     summary: Lấy lịch sử chuỗi cung ứng (Admin only)
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Lịch sử chuỗi cung ứng
   */
  router.get("/supply-chain/history", (req, res) =>
    adminController.getSupplyChainHistory(req, res)
  );

  /**
   * @swagger
   * /api/admin/distribution/history:
   *   get:
   *     summary: Lấy lịch sử phân phối (Admin only)
   *     tags: [Admin]
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
    adminController.getDistributionHistory(req, res)
  );

  /**
   * @swagger
   * /api/admin/batches:
   *   get:
   *     summary: Lấy danh sách lô thuốc (Admin only)
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Danh sách lô thuốc
   */
  router.get("/batches", (req, res) => adminController.getBatchList(req, res));

  /**
   * @swagger
   * /api/admin/batches/{batchNumber}/journey:
   *   get:
   *     summary: Lấy hành trình của lô thuốc (Admin only)
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: batchNumber
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Hành trình của lô thuốc
   */
  router.get("/batches/:batchNumber/journey", (req, res) =>
    adminController.getBatchJourney(req, res)
  );

  /**
   * @swagger
   * /api/admin/nfts/{tokenId}/journey:
   *   get:
   *     summary: Lấy hành trình của NFT (Admin only)
   *     tags: [Admin]
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
   *         description: Hành trình của NFT
   */
  router.get("/nfts/:tokenId/journey", (req, res) =>
    adminController.getNFTJourney(req, res)
  );

  return router;
};
