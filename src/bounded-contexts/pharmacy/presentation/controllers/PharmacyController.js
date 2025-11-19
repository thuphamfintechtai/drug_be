import { ConfirmReceiptDTO } from "../../application/dto/ConfirmReceiptDTO.js";

export class PharmacyController {
  constructor(pharmacyService) {
    this._pharmacyService = pharmacyService;
  }

  async getInvoicesFromDistributor(req, res) {
    try {
      const pharmacyId = req.user?._id?.toString();
      
      if (!pharmacyId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có pharmacy mới có thể xem invoices",
        });
      }

      const filters = {
        status: req.query.status,
        search: req.query.search,
      };

      const invoices = await this._pharmacyService.getInvoicesFromDistributor(pharmacyId, filters);

      return res.status(200).json({
        success: true,
        data: invoices.map(inv => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          distributorId: inv.fromDistributorId,
          drugId: inv.drugId,
          quantity: inv.quantity,
          status: inv.status,
          chainTxHash: inv.chainTxHash,
          tokenIds: inv.tokenIds,
          createdAt: inv.createdAt,
        })),
        count: invoices.length,
      });
    } catch (error) {
      console.error("Lỗi khi lấy invoices từ distributor:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy invoices từ distributor",
        error: error.message,
      });
    }
  }

  async confirmReceipt(req, res) {
    try {
      const dto = ConfirmReceiptDTO.fromRequest(req);
      const pharmacyId = req.user?._id?.toString();

      if (!pharmacyId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có pharmacy mới có thể xác nhận nhận hàng",
        });
      }

      dto.validate();

      const result = await this._pharmacyService.confirmReceipt(dto, pharmacyId);

      return res.status(200).json({
        success: true,
        message: "Đã xác nhận nhận hàng thành công",
        data: result,
      });
    } catch (error) {
      if (error.message && (error.message.includes("không tìm thấy") || error.message.includes("không có quyền") || error.message.includes("chưa được gửi"))) {
        return res.status(error.message.includes("không tìm thấy") ? 404 : 400).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message && error.message.includes("là bắt buộc")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi xác nhận nhận hàng:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi xác nhận nhận hàng",
        error: error.message,
      });
    }
  }

  async getReceiptHistory(req, res) {
    try {
      const pharmacyId = req.user?._id?.toString();

      if (!pharmacyId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có pharmacy mới có thể xem lịch sử nhận hàng",
        });
      }

      const filters = {
        status: req.query.status,
        batchNumber: req.query.batchNumber,
      };

      const receipts = await this._pharmacyService.getReceiptHistory(pharmacyId, filters);

      return res.status(200).json({
        success: true,
        data: receipts.map(rec => ({
          id: rec.id,
          distributorId: rec.fromDistributorId,
          drugId: rec.drugId,
          batchNumber: rec.batchNumber,
          quantity: rec.receivedQuantity,
          status: rec.status,
          receiptDate: rec.receiptDate,
          createdAt: rec.createdAt,
        })),
        count: receipts.length,
      });
    } catch (error) {
      console.error("Lỗi khi lấy lịch sử nhận hàng:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy lịch sử nhận hàng",
        error: error.message,
      });
    }
  }

  async getStatistics(req, res) {
    try {
      const pharmacyId = req.user?._id?.toString();

      if (!pharmacyId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có pharmacy mới có thể xem thống kê",
        });
      }

      const statistics = await this._pharmacyService.getStatistics(pharmacyId);

      return res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      console.error("Lỗi khi lấy thống kê:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê",
        error: error.message,
      });
    }
  }

  async trackDrugByNFTId(req, res) {
    try {
      const pharmacyId = req.user?._id?.toString();
      const { tokenId } = req.params;

      if (!pharmacyId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có pharmacy mới có thể track drug",
        });
      }

      if (!tokenId) {
        return res.status(400).json({
          success: false,
          message: "tokenId là bắt buộc",
        });
      }

      const trackingInfo = await this._pharmacyService.trackDrugByTokenId(pharmacyId, tokenId);

      return res.status(200).json({
        success: true,
        data: trackingInfo,
      });
    } catch (error) {
      if (error.message && error.message.includes("không tìm thấy")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi track drug:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi track drug",
        error: error.message,
      });
    }
  }

  async getDrugs(req, res) {
    try {
      const pharmacyId = req.user?._id?.toString();

      if (!pharmacyId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có pharmacy mới có thể xem danh sách thuốc",
        });
      }

      const filters = {
        status: req.query.status,
        search: req.query.search,
      };

      const drugs = await this._pharmacyService.getDrugs(pharmacyId, filters);

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;

      const paginatedDrugs = drugs.slice(startIndex, endIndex);

      return res.status(200).json({
        success: true,
        data: {
          drugs: paginatedDrugs.map(drug => ({
            id: drug.id,
            tradeName: drug.drugName,
            genericName: drug.genericName,
            atcCode: drug.atcCode,
            dosageForm: drug.dosageForm,
            strength: drug.strength,
            packaging: drug.packaging,
            status: drug.status,
            manufacturerId: drug.manufacturerId,
          })),
          pagination: {
            total: drugs.length,
            page,
            limit,
            totalPages: Math.ceil(drugs.length / limit),
          },
        },
      });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách thuốc:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách thuốc",
        error: error.message,
      });
    }
  }

  async searchDrugByATCCode(req, res) {
    try {
      const pharmacyId = req.user?._id?.toString();
      const { atcCode } = req.query;

      if (!pharmacyId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có pharmacy mới có thể tìm kiếm thuốc",
        });
      }

      if (!atcCode) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp ATC code",
        });
      }

      const drug = await this._pharmacyService.searchDrugByATCCode(atcCode);

      return res.status(200).json({
        success: true,
        data: {
          id: drug.id,
          tradeName: drug.drugName,
          genericName: drug.genericName,
          atcCode: drug.atcCode,
          dosageForm: drug.dosageForm,
          strength: drug.strength,
          packaging: drug.packaging,
          status: drug.status,
        },
      });
    } catch (error) {
      if (error.message && error.message.includes("không tìm thấy")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi tìm kiếm thuốc:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi tìm kiếm thuốc",
        error: error.message,
      });
    }
  }

  async getProfile(req, res) {
    try {
      const pharmacyId = req.user?._id?.toString();
      const user = req.user;

      if (!pharmacyId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có pharmacy mới có thể xem profile",
        });
      }

      const profile = await this._pharmacyService.getProfile(pharmacyId, user);

      return res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      if (error.message && error.message.includes("không tìm thấy")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi lấy thông tin pharmacy:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thông tin pharmacy",
        error: error.message,
      });
    }
  }

  async getChartOneWeek(req, res) {
    try {
      const pharmacyId = req.user?._id?.toString();

      if (!pharmacyId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có pharmacy mới có thể xem biểu đồ",
        });
      }

      const result = await this._pharmacyService.getChartOneWeek(pharmacyId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Lỗi khi lấy biểu đồ 1 tuần:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy biểu đồ 1 tuần",
        error: error.message,
      });
    }
  }

  async getChartTodayYesterday(req, res) {
    try {
      const pharmacyId = req.user?._id?.toString();

      if (!pharmacyId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có pharmacy mới có thể xem biểu đồ",
        });
      }

      const result = await this._pharmacyService.getChartTodayYesterday(pharmacyId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Lỗi khi lấy biểu đồ hôm nay/hôm qua:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy biểu đồ hôm nay/hôm qua",
        error: error.message,
      });
    }
  }

  async getInvoicesByDateRange(req, res) {
    try {
      const pharmacyId = req.user?._id?.toString();
      const { startDate, endDate } = req.query;

      if (!pharmacyId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có pharmacy mới có thể xem thống kê",
        });
      }

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp startDate và endDate",
        });
      }

      const result = await this._pharmacyService.getInvoicesByDateRange(pharmacyId, startDate, endDate);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message && (error.message.includes("startDate") || error.message.includes("endDate"))) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi lấy thống kê invoices theo khoảng thời gian:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê",
        error: error.message,
      });
    }
  }

  async getReceiptsByDateRange(req, res) {
    try {
      const pharmacyId = req.user?._id?.toString();
      const { startDate, endDate } = req.query;

      if (!pharmacyId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có pharmacy mới có thể xem thống kê",
        });
      }

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp startDate và endDate",
        });
      }

      const result = await this._pharmacyService.getReceiptsByDateRange(pharmacyId, startDate, endDate);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message && (error.message.includes("startDate") || error.message.includes("endDate"))) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi lấy thống kê receipts theo khoảng thời gian:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê",
        error: error.message,
      });
    }
  }

  async getDistributionHistory(req, res) {
    try {
      const pharmacyId = req.user?._id?.toString();
      const user = req.user;

      if (!pharmacyId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có pharmacy mới có thể xem lịch sử phân phối",
        });
      }

      const filters = {
        status: req.query.status,
        batchNumber: req.query.batchNumber,
      };

      const result = await this._pharmacyService.getDistributionHistory(pharmacyId, filters);

      return res.status(200).json({
        success: true,
        data: {
          receipts: result,
          count: Array.isArray(result) ? result.length : 1,
        },
      });
    } catch (error) {
      console.error("Lỗi khi lấy lịch sử phân phối:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy lịch sử phân phối",
        error: error.message,
      });
    }
  }
}

