import express from "express";

export const createPublicRoutes = (publicController) => {
  const router = express.Router();

  // Public routes - không cần authentication

  /**
   * @swagger
   * /api/public/track/{tokenId}:
   *   get:
   *     summary: Theo dõi thuốc theo NFT token ID (Public)
   *     tags: [Public]
   *     parameters:
   *       - in: path
   *         name: tokenId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Thông tin tracking
   *       404:
   *         description: Không tìm thấy thuốc
   */
  router.get("/track/:tokenId", (req, res) =>
    publicController.trackDrugByNFTId(req, res)
  );

  /**
   * @swagger
   * /api/public/scanQR/{tokenId}:
   *   get:
   *     summary: Quét QR code để theo dõi thuốc (Public)
   *     tags: [Public]
   *     parameters:
   *       - in: path
   *         name: tokenId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Thông tin tracking từ QR code
   */
  router.get("/scanQR/:tokenId", (req, res) =>
    publicController.trackDrugByNFTId(req, res)
  );

  /**
   * @swagger
   * /api/public/Tracking/{identifier}:
   *   get:
   *     summary: Theo dõi thuốc theo identifier (Public)
   *     tags: [Public]
   *     parameters:
   *       - in: path
   *         name: identifier
   *         required: true
   *         schema:
   *           type: string
   *         description: Token ID hoặc batch number
   *     responses:
   *       200:
   *         description: Thông tin tracking
   */
  router.get("/Tracking/:identifier", (req, res) =>
    publicController.trackingDrugsInfo(req, res)
  );

  /**
   * @swagger
   * /api/public/drugs/search:
   *   get:
   *     summary: Tìm kiếm thuốc theo mã ATC (Public)
   *     tags: [Public]
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
    publicController.searchDrugByATCCode(req, res)
  );

  return router;
};
