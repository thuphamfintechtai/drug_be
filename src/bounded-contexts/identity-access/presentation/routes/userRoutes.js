import express from "express";
import { authenticate, isAdmin } from "../middleware/authMiddleware.js";

export const createUserRoutes = (userController) => {
  const router = express.Router();

  /**
   * @swagger
   * /api/users/me:
   *   get:
   *     summary: Lấy thông tin người dùng hiện tại
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thông tin người dùng
   */
  router.get("/me", authenticate, (req, res) =>
    userController.getCurrentUser(req, res)
  );

  /**
   * @swagger
   * /api/users/profile:
   *   put:
   *     summary: Cập nhật thông tin profile
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               fullName:
   *                 type: string
   *               phone:
   *                 type: string
   *     responses:
   *       200:
   *         description: Cập nhật thành công
   */
  router.put("/profile", authenticate, (req, res) =>
    userController.updateProfile(req, res)
  );

  /**
   * @swagger
   * /api/users/profile/change-password:
   *   put:
   *     summary: Đổi mật khẩu
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - currentPassword
   *               - newPassword
   *             properties:
   *               currentPassword:
   *                 type: string
   *               newPassword:
   *                 type: string
   *     responses:
   *       200:
   *         description: Đổi mật khẩu thành công
   *       400:
   *         description: Mật khẩu hiện tại không đúng
   */
  router.put("/profile/change-password", authenticate, (req, res) =>
    userController.changePassword(req, res)
  );

  /**
   * @swagger
   * /api/users/stats:
   *   get:
   *     summary: Lấy thống kê người dùng (Admin only)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thống kê người dùng
   *       403:
   *         description: Không có quyền truy cập
   */
  router.get("/stats", authenticate, isAdmin, (req, res) =>
    userController.getUserStats(req, res)
  );

  /**
   * @swagger
   * /api/users:
   *   get:
   *     summary: Lấy danh sách tất cả người dùng (Admin only)
   *     tags: [Users]
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
   *         description: Danh sách người dùng
   */
  router.get("/", authenticate, isAdmin, (req, res) =>
    userController.getAllUsers(req, res)
  );

  /**
   * @swagger
   * /api/users/{id}:
   *   get:
   *     summary: Lấy thông tin người dùng theo ID
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Thông tin người dùng
   *       404:
   *         description: Không tìm thấy người dùng
   */
  router.get("/:id", authenticate, (req, res) =>
    userController.getUserById(req, res)
  );

  /**
   * @swagger
   * /api/users/{id}:
   *   put:
   *     summary: Cập nhật thông tin người dùng (Admin only)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               fullName:
   *                 type: string
   *               email:
   *                 type: string
   *               role:
   *                 type: string
   *     responses:
   *       200:
   *         description: Cập nhật thành công
   */
  router.put("/:id", authenticate, isAdmin, (req, res) =>
    userController.updateUser(req, res)
  );

  /**
   * @swagger
   * /api/users/{id}/status:
   *   put:
   *     summary: Cập nhật trạng thái người dùng (Admin only)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - status
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [active, inactive, suspended]
   *     responses:
   *       200:
   *         description: Cập nhật trạng thái thành công
   */
  router.put("/:id/status", authenticate, isAdmin, (req, res) =>
    userController.updateUserStatus(req, res)
  );

  /**
   * @swagger
   * /api/users/{id}:
   *   delete:
   *     summary: Xóa người dùng (Admin only)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Xóa thành công
   */
  router.delete("/:id", authenticate, isAdmin, (req, res) =>
    userController.deleteUser(req, res)
  );

  return router;
};
