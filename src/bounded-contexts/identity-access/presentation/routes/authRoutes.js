import express from "express";
import { authenticate, isAdmin } from "../middleware/authMiddleware.js";

export const createAuthRoutes = (authController) => {
  const router = express.Router();

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Đăng nhập người dùng
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginRequest'
   *     responses:
   *       200:
   *         description: Đăng nhập thành công
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LoginResponse'
   *       401:
   *         description: Email hoặc mật khẩu không đúng
   */
  router.post("/login", (req, res) => authController.login(req, res));

  /**
   * @swagger
   * /api/auth/me:
   *   get:
   *     summary: Lấy thông tin người dùng hiện tại
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thông tin người dùng
   *       401:
   *         description: Chưa đăng nhập
   */
  router.get("/me", authenticate, (req, res) =>
    authController.getCurrentUser(req, res)
  );

  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     summary: Đăng xuất người dùng
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Đăng xuất thành công
   */
  router.post("/logout", authenticate, (req, res) =>
    authController.logout(req, res)
  );

  /**
   * @swagger
   * /api/auth/register/user:
   *   post:
   *     summary: Đăng ký người dùng mới
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *               - fullName
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *               fullName:
   *                 type: string
   *     responses:
   *       201:
   *         description: Đăng ký thành công
   *       400:
   *         description: Dữ liệu không hợp lệ
   */
  router.post("/register/user", (req, res) =>
    authController.register(req, res)
  );

  /**
   * @swagger
   * /api/auth/register/admin:
   *   post:
   *     summary: Đăng ký admin mới
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *               - fullName
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *               fullName:
   *                 type: string
   *     responses:
   *       201:
   *         description: Đăng ký admin thành công
   *       400:
   *         description: Dữ liệu không hợp lệ
   */
  router.post("/register/admin", (req, res) =>
    authController.registerAdmin(req, res)
  );

  /**
   * @swagger
   * /api/auth/forgot-password:
   *   post:
   *     summary: Yêu cầu reset mật khẩu
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *     responses:
   *       200:
   *         description: Yêu cầu reset mật khẩu đã được gửi
   */
  router.post("/forgot-password", (req, res) =>
    authController.forgotPassword(req, res)
  );

  /**
   * @swagger
   * /api/auth/reset-password:
   *   post:
   *     summary: Reset mật khẩu với token
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - token
   *               - newPassword
   *             properties:
   *               token:
   *                 type: string
   *               newPassword:
   *                 type: string
   *     responses:
   *       200:
   *         description: Reset mật khẩu thành công
   *       400:
   *         description: Token không hợp lệ hoặc đã hết hạn
   */
  router.post("/reset-password", (req, res) =>
    authController.resetPassword(req, res)
  );

  /**
   * @swagger
   * /api/auth/password-reset-requests:
   *   get:
   *     summary: Lấy danh sách yêu cầu reset mật khẩu (Admin only)
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Danh sách yêu cầu reset mật khẩu
   *       403:
   *         description: Không có quyền truy cập
   */
  router.get("/password-reset-requests", authenticate, isAdmin, (req, res) =>
    authController.getPasswordResetRequests(req, res)
  );

  /**
   * @swagger
   * /api/auth/password-reset-requests/{resetRequestId}/approve:
   *   post:
   *     summary: Duyệt yêu cầu reset mật khẩu (Admin only)
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: resetRequestId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Duyệt thành công
   *       403:
   *         description: Không có quyền truy cập
   */
  router.post(
    "/password-reset-requests/:resetRequestId/approve",
    authenticate,
    isAdmin,
    (req, res) => authController.approvePasswordReset(req, res)
  );

  /**
   * @swagger
   * /api/auth/password-reset-requests/{resetRequestId}/reject:
   *   post:
   *     summary: Từ chối yêu cầu reset mật khẩu (Admin only)
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: resetRequestId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Từ chối thành công
   *       403:
   *         description: Không có quyền truy cập
   */
  router.post(
    "/password-reset-requests/:resetRequestId/reject",
    authenticate,
    isAdmin,
    (req, res) => authController.rejectPasswordReset(req, res)
  );

  return router;
};
