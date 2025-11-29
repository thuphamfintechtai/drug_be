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
   *           enum: [draft, pending, issued, sent, paid, cancelled]
   *         description: Lọc theo trạng thái đơn hàng
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Tìm kiếm theo số hóa đơn hoặc số lô
   *     responses:
   *       200:
   *         description: Danh sách đơn hàng
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                         description: ID của invoice
   *                         example: "507f1f77bcf86cd799439011"
   *                       invoiceNumber:
   *                         type: string
   *                         description: Số hóa đơn
   *                         example: "INV-2024-001"
   *                       manufacturerId:
   *                         type: string
   *                         description: ID nhà sản xuất
   *                       drugId:
   *                         type: string
   *                         description: ID thuốc
   *                       quantity:
   *                         type: number
   *                         description: Số lượng
   *                       status:
   *                         type: string
   *                         enum: [draft, pending, issued, sent, paid, cancelled]
   *                         description: Trạng thái đơn hàng
   *                       chainTxHash:
   *                         type: string
   *                         description: Transaction hash trên blockchain
   *                       tokenIds:
   *                         type: array
   *                         items:
   *                           type: string
   *                         description: Danh sách token ID
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                 count:
   *                   type: number
   *                   description: Tổng số invoice
   *                   example: 10
   *       500:
   *         description: Lỗi server
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
   *         description: ID của invoice (phải là MongoDB ObjectId hợp lệ)
   *     responses:
   *       200:
   *         description: Chi tiết đơn hàng
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       description: ID của invoice
   *                       example: "507f1f77bcf86cd799439011"
   *                     invoiceNumber:
   *                       type: string
   *                       description: Số hóa đơn
   *                       example: "INV-2024-001"
   *                     fromManufacturerId:
   *                       type: string
   *                       description: ID nhà sản xuất
   *                     toDistributorId:
   *                       type: string
   *                       description: ID nhà phân phối
   *                     drugId:
   *                       type: string
   *                       description: ID thuốc
   *                     quantity:
   *                       type: number
   *                       description: Số lượng
   *                     status:
   *                       type: string
   *                       enum: [draft, pending, issued, sent, paid, cancelled]
   *                       description: Trạng thái đơn hàng
   *                     chainTxHash:
   *                       type: string
   *                       description: Transaction hash trên blockchain
   *                     tokenIds:
   *                       type: array
   *                       items:
   *                         type: string
   *                       description: Danh sách token ID của NFT
   *                     invoiceDate:
   *                       type: string
   *                       format: date-time
   *                       description: Ngày tạo hóa đơn
   *                     unitPrice:
   *                       type: number
   *                       description: Đơn giá
   *                     totalAmount:
   *                       type: number
   *                       description: Tổng tiền trước VAT
   *                     vatRate:
   *                       type: number
   *                       description: Thuế VAT (%)
   *                     vatAmount:
   *                       type: number
   *                       description: Số tiền VAT
   *                     finalAmount:
   *                       type: number
   *                       description: Tổng tiền sau VAT
   *                     notes:
   *                       type: string
   *                       description: Ghi chú
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                     updatedAt:
   *                       type: string
   *                       format: date-time
   *       404:
   *         description: Không tìm thấy invoice
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Không tìm thấy invoice"
   *       403:
   *         description: Không có quyền truy cập
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Bạn không có quyền xem invoice này"
   *       500:
   *         description: Lỗi server
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Lỗi server khi lấy invoice detail"
   *                 error:
   *                   type: string
   */
  router.get("/invoices/:invoiceId/detail", (req, res) =>
    distributorController.getInvoiceDetail(req, res)
  );

  /**
   * @swagger
   * /api/distributor/invoices/{invoiceId}/status:
   *   get:
   *     summary: Lấy trạng thái đơn hàng
   *     tags: [Distributor]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: invoiceId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID của invoice
   *     responses:
   *       200:
   *         description: Trạng thái đơn hàng
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       description: ID của invoice
   *                       example: "89cec1c6-4013-4511-9432-84e29c8c2f6d"
   *                     invoiceNumber:
   *                       type: string
   *                       description: Số hóa đơn
   *                       example: "INV-2024-001"
   *                     status:
   *                       type: string
   *                       enum: [draft, pending, issued, sent, paid, cancelled]
   *                       description: Trạng thái đơn hàng
   *       404:
   *         description: Không tìm thấy invoice
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Không tìm thấy invoice"
   *       403:
   *         description: Không có quyền truy cập
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Bạn không có quyền xem invoice này"
   *       500:
   *         description: Lỗi server
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Lỗi server khi lấy invoice status"
   *                 error:
   *                   type: string
   */
  router.get("/invoices/:invoiceId/status", (req, res) =>
    distributorController.getInvoiceStatus(req, res)
  );

  /**
   * @swagger
   * /api/distributor/invoices/{invoiceId}/status:
   *   put:
   *     summary: Cập nhật trạng thái đơn hàng
   *     tags: [Distributor]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: invoiceId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID của invoice
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
   *                 enum: [draft, pending, issued, sent, confirmed, delivered, paid, cancelled]
   *                 description: Trạng thái mới của đơn hàng
   *                 example: "confirmed"
   *     responses:
   *       200:
   *         description: Cập nhật trạng thái thành công
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Cập nhật trạng thái invoice thành công"
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       description: ID của invoice
   *                     invoiceNumber:
   *                       type: string
   *                       description: Số hóa đơn
   *                     status:
   *                       type: string
   *                       description: Trạng thái mới
   *                     previousStatus:
   *                       type: string
   *                       description: Trạng thái cũ
   *       400:
   *         description: Trạng thái không hợp lệ hoặc không thể chuyển đổi
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Không thể chuyển từ trạng thái sent sang paid"
   *       404:
   *         description: Không tìm thấy invoice
   *       403:
   *         description: Không có quyền truy cập
   *       500:
   *         description: Lỗi server
   */
  router.put("/invoices/:invoiceId/status", (req, res) =>
    distributorController.updateInvoiceStatus(req, res)
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
   *     summary: Chuyển giao thuốc cho nhà thuốc (Bước 1 - Tạo Commercial Invoice)
   *     description: |
   *       API này cho phép distributor chuyển giao thuốc cho pharmacy bằng cách:
   *       1. Query manufacturerInvoice để lấy tất cả tokenIds đã nhận từ manufacturer cho drug cụ thể
   *       2. Query commercialInvoice để tính số lượng NFT đã chuyển cho pharmacy này
   *       3. Tính index bắt đầu = số lượng đã chuyển
   *       4. Lấy `amount` NFT tiếp theo từ mảng tokenIds (theo index)
   *       5. Tạo commercial invoice với các NFT đã chọn
   *       
   *       **Lưu ý**: API này sử dụng logic index-based để tự động chọn NFT, không cần truyền tokenIds cụ thể.
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
   *               - drugId
   *               - amount
   *             properties:
   *               pharmacyId:
   *                 type: string
   *                 description: ID của nhà thuốc (có thể là Business Entity ID hoặc User ID)
   *                 example: "69257a5dfe4c6c923fa00b9c"
   *               drugId:
   *                 type: string
   *                 description: ID của thuốc
   *                 example: "6922906121e225a1c222d48f"
   *               amount:
   *                 type: integer
   *                 minimum: 1
   *                 description: Số lượng NFT muốn chuyển giao. Hệ thống sẽ tự động chọn NFT tiếp theo từ danh sách NFT đã nhận từ manufacturer (theo index)
   *                 example: 20
   *               invoiceNumber:
   *                 type: string
   *                 description: Số hóa đơn (nếu không có sẽ tự động generate theo format INV-{timestamp}-{randomUUID})
   *                 example: "INV-1764258765734-4A2BA975"
   *               invoiceDate:
   *                 type: string
   *                 format: date-time
   *                 description: Ngày tạo hóa đơn (nếu không có sẽ dùng ngày hiện tại)
   *                 example: "2025-11-27T15:52:45.889Z"
   *               quantity:
   *                 type: integer
   *                 description: Số lượng (nếu không có sẽ mặc định bằng amount)
   *                 example: 20
   *               unitPrice:
   *                 type: number
   *                 format: float
   *                 description: Đơn giá
   *                 example: 100000
   *               totalAmount:
   *                 type: number
   *                 format: float
   *                 description: Tổng tiền trước VAT
   *                 example: 2000000
   *               vatRate:
   *                 type: number
   *                 format: float
   *                 description: Thuế VAT (%)
   *                 example: 10
   *               vatAmount:
   *                 type: number
   *                 format: float
   *                 description: Số tiền VAT
   *                 example: 200000
   *               finalAmount:
   *                 type: number
   *                 format: float
   *                 description: Tổng tiền sau VAT
   *                 example: 2200000
   *               notes:
   *                 type: string
   *                 description: Ghi chú
   *                 example: "Chuyển giao lần 1"
   *           example:
   *             pharmacyId: "69257a5dfe4c6c923fa00b9c"
   *             drugId: "6922906121e225a1c222d48f"
   *             amount: 20
   *             invoiceDate: "2025-11-27T15:52:45.889Z"
   *             unitPrice: 100000
   *             totalAmount: 2000000
   *             vatRate: 10
   *             vatAmount: 200000
   *             finalAmount: 2200000
   *             notes: "Chuyển giao lần 1"
   *     responses:
   *       201:
   *         description: Tạo invoice thành công
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Chuyển giao cho pharmacy thành công"
   *                 data:
   *                   type: object
   *                   properties:
   *                     invoiceId:
   *                       type: string
   *                       description: ID của commercial invoice đã tạo
   *                       example: "692873cdcbff61149aa007be"
   *                     invoiceNumber:
   *                       type: string
   *                       description: Số hóa đơn
   *                       example: "INV-1764258765734-4A2BA975"
   *                     status:
   *                       type: string
   *                       enum: [draft, issued, sent]
   *                       description: Trạng thái của invoice (mặc định là "issued")
   *                       example: "issued"
   *                     tokenIds:
   *                       type: array
   *                       items:
   *                         type: string
   *                       description: Danh sách tokenIds của NFT đã được chọn để chuyển giao (tự động chọn theo index)
   *                       example: ["194", "195", "196", "197"]
   *                     quantity:
   *                       type: integer
   *                       description: Số lượng NFT
   *                       example: 4
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                       description: Thời gian tạo invoice
   *                       example: "2025-11-27T15:52:45.889Z"
   *             example:
   *               success: true
   *               message: "Chuyển giao cho pharmacy thành công"
   *               data:
   *                 invoiceId: "692873cdcbff61149aa007be"
   *                 invoiceNumber: "INV-1764258765734-4A2BA975"
   *                 status: "issued"
   *                 tokenIds: ["194", "195", "196", "197"]
   *                 quantity: 4
   *                 createdAt: "2025-11-27T15:52:45.889Z"
   *       400:
   *         description: Dữ liệu không hợp lệ
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "pharmacyId là bắt buộc, drugId là bắt buộc, amount phải là số nguyên dương"
   *       403:
   *         description: Không có quyền truy cập
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Chỉ có distributor mới có thể chuyển giao cho pharmacy"
   *       404:
   *         description: Không tìm thấy resource
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Thuốc với ID xxx không tồn tại"
   *       500:
   *         description: Lỗi server
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Lỗi server khi chuyển giao cho pharmacy"
   *                 error:
   *                   type: string
   *                   example: "Không đủ NFT để chuyển. Đã chuyển: 20, Tổng số NFT nhận được: 50, Còn lại: 30, Yêu cầu: 40"
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
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, in_transit, delivered, confirmed, rejected]
   *         description: Lọc theo trạng thái
   *       - in: query
   *         name: batchNumber
   *         schema:
   *           type: string
   *         description: Lọc theo số lô
   *     responses:
   *       200:
   *         description: Lịch sử phân phối
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                         description: ID của proof of distribution
   *                         example: "507f1f77bcf86cd799439011"
   *                       manufacturerId:
   *                         type: string
   *                         description: ID nhà sản xuất
   *                       batchNumber:
   *                         type: string
   *                         description: Số lô
   *                       quantity:
   *                         type: number
   *                         description: Số lượng đã phân phối
   *                       status:
   *                         type: string
   *                         enum: [pending, in_transit, delivered, confirmed, rejected]
   *                         description: Trạng thái phân phối
   *                       distributionDate:
   *                         type: string
   *                         format: date-time
   *                         description: Ngày phân phối
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                 count:
   *                   type: number
   *                   description: Tổng số bản ghi
   *       500:
   *         description: Lỗi server
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
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [draft, sent, paid]
   *         description: Lọc theo trạng thái
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Tìm kiếm theo số hóa đơn hoặc số lô
   *     responses:
   *       200:
   *         description: Lịch sử chuyển giao
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                         description: ID của commercial invoice
   *                         example: "507f1f77bcf86cd799439011"
   *                       invoiceNumber:
   *                         type: string
   *                         description: Số hóa đơn
   *                       pharmacyId:
   *                         type: string
   *                         description: ID nhà thuốc
   *                       drugId:
   *                         type: string
   *                         description: ID thuốc
   *                       quantity:
   *                         type: number
   *                         description: Số lượng
   *                       status:
   *                         type: string
   *                         enum: [draft, sent, paid]
   *                         description: Trạng thái chuyển giao
   *                       chainTxHash:
   *                         type: string
   *                         description: Transaction hash trên blockchain
   *                       tokenIds:
   *                         type: array
   *                         items:
   *                           type: string
   *                         description: Danh sách token ID
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                 count:
   *                   type: number
   *                   description: Tổng số bản ghi
   *       500:
   *         description: Lỗi server
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
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Số trang
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Số lượng mỗi trang
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [active, inactive]
   *         description: Lọc theo trạng thái
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Tìm kiếm theo tên thuốc, tên chung hoặc mã ATC
   *     responses:
   *       200:
   *         description: Danh sách thuốc
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     drugs:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                             description: ID của thuốc
   *                             example: "507f1f77bcf86cd799439011"
   *                           tradeName:
   *                             type: string
   *                             description: Tên biệt dược
   *                           genericName:
   *                             type: string
   *                             description: Tên chung (hoạt chất)
   *                           atcCode:
   *                             type: string
   *                             description: Mã ATC
   *                           dosageForm:
   *                             type: string
   *                             description: Dạng bào chế
   *                           strength:
   *                             type: string
   *                             description: Hàm lượng
   *                           packaging:
   *                             type: string
   *                             description: Quy cách đóng gói
   *                           status:
   *                             type: string
   *                             enum: [active, inactive]
   *                             description: Trạng thái
   *                           manufacturerId:
   *                             type: string
   *                             description: ID nhà sản xuất
   *                     pagination:
   *                       type: object
   *                       properties:
   *                         total:
   *                           type: integer
   *                           description: Tổng số thuốc
   *                         page:
   *                           type: integer
   *                           description: Trang hiện tại
   *                         limit:
   *                           type: integer
   *                           description: Số lượng mỗi trang
   *                         totalPages:
   *                           type: integer
   *                           description: Tổng số trang
   *       500:
   *         description: Lỗi server
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
   *         description: Lọc theo trạng thái hợp đồng
   *     responses:
   *       200:
   *         description: Danh sách hợp đồng
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                         description: ID của hợp đồng
   *                         example: "507f1f77bcf86cd799439011"
   *                       pharmacyId:
   *                         type: string
   *                         description: ID nhà thuốc
   *                       contractFileUrl:
   *                         type: string
   *                         description: URL file hợp đồng
   *                       contractFileName:
   *                         type: string
   *                         description: Tên file hợp đồng
   *                       status:
   *                         type: string
   *                         enum: [pending, confirmed, rejected]
   *                         description: Trạng thái hợp đồng
   *                       blockchainTxHash:
   *                         type: string
   *                         description: Transaction hash trên blockchain
   *                       blockchainStatus:
   *                         type: string
   *                         description: Trạng thái trên blockchain
   *                       tokenId:
   *                         type: string
   *                         description: Token ID của NFT hợp đồng
   *                       distributorSignedAt:
   *                         type: string
   *                         format: date-time
   *                         description: Thời điểm distributor ký
   *                       pharmacySignedAt:
   *                         type: string
   *                         format: date-time
   *                         description: Thời điểm pharmacy ký
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                       updatedAt:
   *                         type: string
   *                         format: date-time
   *                 count:
   *                   type: number
   *                   description: Tổng số hợp đồng
   *       500:
   *         description: Lỗi server
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
   *         description: ID của hợp đồng (phải là MongoDB ObjectId hợp lệ)
   *     responses:
   *       200:
   *         description: Chi tiết hợp đồng
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       description: ID của hợp đồng
   *                       example: "507f1f77bcf86cd799439011"
   *                     pharmacyId:
   *                       type: string
   *                       description: ID nhà thuốc
   *                     contractFileUrl:
   *                       type: string
   *                       description: URL file hợp đồng
   *                     contractFileName:
   *                       type: string
   *                       description: Tên file hợp đồng
   *                     status:
   *                       type: string
   *                       enum: [pending, confirmed, rejected]
   *                       description: Trạng thái hợp đồng
   *                     blockchainTxHash:
   *                       type: string
   *                       description: Transaction hash trên blockchain
   *                     blockchainStatus:
   *                       type: string
   *                       description: Trạng thái trên blockchain
   *                     tokenId:
   *                       type: string
   *                       description: Token ID của NFT hợp đồng
   *                     distributorSignedAt:
   *                       type: string
   *                       format: date-time
   *                     pharmacySignedAt:
   *                       type: string
   *                       format: date-time
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                     updatedAt:
   *                       type: string
   *                       format: date-time
   *       404:
   *         description: Không tìm thấy hợp đồng
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Không tìm thấy contract"
   *       403:
   *         description: Không có quyền truy cập
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Bạn không có quyền xem contract này"
   *       500:
   *         description: Lỗi server
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

  /**
   * @swagger
   * /api/distributor/chart/monthly-trends:
   *   get:
   *     summary: Lấy xu hướng theo tháng
   *     tags: [Distributor]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: months
   *         schema:
   *           type: integer
   *           default: 6
   *         description: Số tháng cần xem (1-24)
   *     responses:
   *       200:
   *         description: Xu hướng theo tháng
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     dateRange:
   *                       type: object
   *                       properties:
   *                         from:
   *                           type: string
   *                           format: date-time
   *                         to:
   *                           type: string
   *                           format: date-time
   *                         months:
   *                           type: integer
   *                     summary:
   *                       type: object
   *                       properties:
   *                         totalInvoicesReceived:
   *                           type: integer
   *                         totalInvoicesReceivedQuantity:
   *                           type: integer
   *                         totalDistributions:
   *                           type: integer
   *                         totalDistributionsQuantity:
   *                           type: integer
   *                         totalTransfersToPharmacy:
   *                           type: integer
   *                         totalTransfersToPharmacyQuantity:
   *                           type: integer
   *                     trends:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           month:
   *                             type: string
   *                             example: "2024-11"
   *                           year:
   *                             type: integer
   *                           monthNumber:
   *                             type: integer
   *                           invoicesReceived:
   *                             type: integer
   *                           invoicesReceivedQuantity:
   *                             type: integer
   *                           distributions:
   *                             type: integer
   *                           distributionsQuantity:
   *                             type: integer
   *                           transfersToPharmacy:
   *                             type: integer
   *                           transfersToPharmacyQuantity:
   *                             type: integer
   *       400:
   *         description: Tham số không hợp lệ
   *       500:
   *         description: Lỗi server
   */
  router.get("/chart/monthly-trends", (req, res) =>
    distributorController.getMonthlyTrends(req, res)
  );

  /**
   * @swagger
   * /api/distributor/dashboard/stats:
   *   get:
   *     summary: Lấy thống kê tổng quan cho dashboard
   *     tags: [Distributor]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thống kê dashboard
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     overview:
   *                       type: object
   *                       properties:
   *                         invoicesReceived:
   *                           type: object
   *                           properties:
   *                             total:
   *                               type: integer
   *                             today:
   *                               type: integer
   *                             yesterday:
   *                               type: integer
   *                             thisWeek:
   *                               type: integer
   *                             todayVsYesterday:
   *                               type: object
   *                               properties:
   *                                 diff:
   *                                   type: integer
   *                                 percentChange:
   *                                   type: number
   *                             byStatus:
   *                               type: object
   *                         distributions:
   *                           type: object
   *                           properties:
   *                             total:
   *                               type: integer
   *                             today:
   *                               type: integer
   *                             yesterday:
   *                               type: integer
   *                             thisWeek:
   *                               type: integer
   *                             todayVsYesterday:
   *                               type: object
   *                             byStatus:
   *                               type: object
   *                         transfersToPharmacy:
   *                           type: object
   *                           properties:
   *                             total:
   *                               type: integer
   *                             today:
   *                               type: integer
   *                             yesterday:
   *                               type: integer
   *                             thisWeek:
   *                               type: integer
   *                             todayVsYesterday:
   *                               type: object
   *                             byStatus:
   *                               type: object
   *                         nfts:
   *                           type: object
   *                           properties:
   *                             total:
   *                               type: integer
   *                             byStatus:
   *                               type: object
   *                     recentActivities:
   *                       type: object
   *                       properties:
   *                         recentInvoices:
   *                           type: array
   *                           items:
   *                             type: object
   *                         recentTransfers:
   *                           type: array
   *                           items:
   *                             type: object
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       500:
   *         description: Lỗi server
   */
  router.get("/dashboard/stats", (req, res) =>
    distributorController.getDashboardStats(req, res)
  );

  return router;
};
