import express from "express";
import {
  authenticate,
  isAdmin,
} from "../../../identity-access/presentation/middleware/authMiddleware.js";

export const createRegistrationRoutes = (registrationController) => {
  const router = express.Router();

  /**
   * @swagger
   * /api/registration/pharma-company:
   *   post:
   *     summary: Đăng ký nhà sản xuất (Pharma Company)
   *     tags: [Registration]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - companyName
   *               - email
   *               - password
   *               - licenseNumber
   *             properties:
   *               companyName:
   *                 type: string
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *               licenseNumber:
   *                 type: string
   *               address:
   *                 type: string
   *               phone:
   *                 type: string
   *     responses:
   *       201:
   *         description: Đăng ký thành công, chờ admin duyệt
   *       400:
   *         description: Dữ liệu không hợp lệ
   */
  router.post("/pharma-company", (req, res) =>
    registrationController.submitPharmaCompanyRegistration(req, res)
  );

  /**
   * @swagger
   * /api/registration/distributor:
   *   post:
   *     summary: Đăng ký nhà phân phối (Distributor)
   *     tags: [Registration]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - companyName
   *               - email
   *               - password
   *               - licenseNumber
   *             properties:
   *               companyName:
   *                 type: string
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *               licenseNumber:
   *                 type: string
   *               address:
   *                 type: string
   *               phone:
   *                 type: string
   *     responses:
   *       201:
   *         description: Đăng ký thành công, chờ admin duyệt
   */
  router.post("/distributor", (req, res) =>
    registrationController.submitDistributorRegistration(req, res)
  );

  /**
   * @swagger
   * /api/registration/pharmacy:
   *   post:
   *     summary: Đăng ký nhà thuốc (Pharmacy)
   *     tags: [Registration]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - pharmacyName
   *               - email
   *               - password
   *               - licenseNumber
   *             properties:
   *               pharmacyName:
   *                 type: string
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *               licenseNumber:
   *                 type: string
   *               address:
   *                 type: string
   *               phone:
   *                 type: string
   *     responses:
   *       201:
   *         description: Đăng ký thành công, chờ admin duyệt
   */
  router.post("/pharmacy", (req, res) =>
    registrationController.submitPharmacyRegistration(req, res)
  );

  /**
   * @swagger
   * /api/registration/requests:
   *   get:
   *     summary: Lấy danh sách yêu cầu đăng ký (Admin only)
   *     tags: [Registration]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, approved, rejected]
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
   *         description: Danh sách yêu cầu đăng ký
   *       403:
   *         description: Không có quyền truy cập
   */
  router.get("/requests", authenticate, isAdmin, (req, res) =>
    registrationController.getRegistrationRequests(req, res)
  );

  /**
   * @swagger
   * /api/registration/requests/{requestId}:
   *   get:
   *     summary: Lấy chi tiết yêu cầu đăng ký (Admin only)
   *     tags: [Registration]
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
   *         description: Chi tiết yêu cầu đăng ký
   *       404:
   *         description: Không tìm thấy yêu cầu
   */
  router.get("/requests/:requestId", authenticate, isAdmin, (req, res) =>
    registrationController.getRegistrationRequestById(req, res)
  );

  /**
   * @swagger
   * /api/registration/requests/{requestId}/approve:
   *   post:
   *     summary: Duyệt yêu cầu đăng ký (Admin only)
   *     tags: [Registration]
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
   *         description: Duyệt thành công
   *       400:
   *         description: Yêu cầu không hợp lệ hoặc đã được xử lý
   */
  router.post(
    "/requests/:requestId/approve",
    authenticate,
    isAdmin,
    (req, res) => registrationController.approveRegistration(req, res)
  );

  /**
   * @swagger
   * /api/registration/requests/{requestId}/reject:
   *   post:
   *     summary: Từ chối yêu cầu đăng ký (Admin only)
   *     tags: [Registration]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: requestId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               reason:
   *                 type: string
   *                 description: Lý do từ chối
   *     responses:
   *       200:
   *         description: Từ chối thành công
   */
  router.post(
    "/requests/:requestId/reject",
    authenticate,
    isAdmin,
    (req, res) => registrationController.rejectRegistration(req, res)
  );

  return router;
};
