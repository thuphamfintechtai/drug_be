import express from "express";
import {
  authenticate,
  authorize,
} from "../../../identity-access/presentation/middleware/authMiddleware.js";

export const createDrugRoutes = (drugController) => {
  const router = express.Router();

  // Tất cả routes đều cần authenticate
  router.use(authenticate);

  /**
   * @swagger
   * /api/drugs:
   *   post:
   *     summary: Thêm thuốc mới (Pharma Company only)
   *     tags: [Drugs]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - atcCode
   *               - activeIngredient
   *             properties:
   *               name:
   *                 type: string
   *               atcCode:
   *                 type: string
   *               activeIngredient:
   *                 type: string
   *               dosageForm:
   *                 type: string
   *               strength:
   *                 type: string
   *               manufacturer:
   *                 type: string
   *     responses:
   *       201:
   *         description: Thêm thuốc thành công
   *       403:
   *         description: Không có quyền truy cập
   */
  router.post("/", authorize("pharma_company"), (req, res) =>
    drugController.addDrug(req, res)
  );

  /**
   * @swagger
   * /api/drugs:
   *   get:
   *     summary: Lấy danh sách thuốc (Pharma Company only)
   *     tags: [Drugs]
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
  router.get("/", authorize("pharma_company"), (req, res) =>
    drugController.getDrugs(req, res)
  );

  /**
   * @swagger
   * /api/drugs/{drugId}:
   *   get:
   *     summary: Lấy thông tin thuốc theo ID (Pharma Company only)
   *     tags: [Drugs]
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
   *         description: Thông tin thuốc
   *       404:
   *         description: Không tìm thấy thuốc
   */
  router.get("/:drugId", authorize("pharma_company"), (req, res) =>
    drugController.getDrugById(req, res)
  );

  /**
   * @swagger
   * /api/drugs/{drugId}:
   *   put:
   *     summary: Cập nhật thông tin thuốc (Pharma Company only)
   *     tags: [Drugs]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: drugId
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
   *               name:
   *                 type: string
   *               atcCode:
   *                 type: string
   *               activeIngredient:
   *                 type: string
   *     responses:
   *       200:
   *         description: Cập nhật thành công
   */
  router.put("/:drugId", authorize("pharma_company"), (req, res) =>
    drugController.updateDrug(req, res)
  );

  /**
   * @swagger
   * /api/drugs/{drugId}:
   *   delete:
   *     summary: Xóa thuốc (Pharma Company only)
   *     tags: [Drugs]
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
   *         description: Xóa thành công
   */
  router.delete("/:drugId", authorize("pharma_company"), (req, res) =>
    drugController.deleteDrug(req, res)
  );

  /**
   * @swagger
   * /api/drugs/search/atc:
   *   get:
   *     summary: Tìm kiếm thuốc theo mã ATC (Pharma Company only)
   *     tags: [Drugs]
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
  router.get("/search/atc", authorize("pharma_company"), (req, res) =>
    drugController.searchByATCCode(req, res)
  );

  return router;
};
