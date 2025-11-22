import { ConfirmReceiptDTO } from "../../application/dto/ConfirmReceiptDTO.js";
import { TransferToPharmacyDTO } from "../../application/dto/TransferToPharmacyDTO.js";

export class DistributorController {
  constructor(distributorService) {
    this._distributorService = distributorService;
  }

  async getInvoicesFromManufacturer(req, res) {
    try {
      const distributorId = req.user?._id?.toString();
      
      if (!distributorId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có distributor mới có thể xem invoices",
        });
      }

      const filters = {
        status: req.query.status,
        search: req.query.search,
      };

      const invoices = await this._distributorService.getInvoicesFromManufacturer(distributorId, filters);

      return res.status(200).json({
        success: true,
        data: invoices.map(inv => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          manufacturerId: inv.fromManufacturerId,
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
      console.error("Lỗi khi lấy invoices từ manufacturer:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy invoices từ manufacturer",
        error: error.message,
      });
    }
  }

  async getInvoiceDetail(req, res) {
    try {
      const { invoiceId } = req.params;
      const distributorId = req.user?._id?.toString();

      if (!distributorId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có distributor mới có thể xem invoice detail",
        });
      }

      const invoice = await this._distributorService.getInvoiceDetail(distributorId, invoiceId);

      return res.status(200).json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      if (error.message && (error.message.includes("không tìm thấy") || error.message.includes("không có quyền"))) {
        return res.status(error.message.includes("không tìm thấy") ? 404 : 403).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi lấy invoice detail:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy invoice detail",
        error: error.message,
      });
    }
  }

  async confirmReceipt(req, res) {
    try {
      const dto = ConfirmReceiptDTO.fromRequest(req);
      const distributorId = req.user?._id?.toString();

      if (!distributorId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có distributor mới có thể xác nhận nhận hàng",
        });
      }

      dto.validate();

      const result = await this._distributorService.confirmReceipt(dto, distributorId);

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

  async transferToPharmacy(req, res) {
    try {
      const dto = TransferToPharmacyDTO.fromRequest(req);
      const distributorId = req.user?._id?.toString();

      if (!distributorId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có distributor mới có thể chuyển giao cho pharmacy",
        });
      }

      dto.validate();

      const result = await this._distributorService.transferToPharmacy(
        distributorId,
        dto.pharmacyId,
        dto.drugId,
        dto.tokenIds,
        dto.invoiceNumber,
        dto.invoiceDate,
        dto.quantity,
        dto.unitPrice,
        dto.totalAmount,
        dto.vatRate,
        dto.vatAmount,
        dto.finalAmount,
        dto.notes
      );

      return res.status(201).json({
        success: true,
        message: "Chuyển giao cho pharmacy thành công",
        data: result,
      });
    } catch (error) {
      if (error.message && (error.message.includes("không tìm thấy") || error.message.includes("không có quyền") || error.message.includes("không thể chuyển giao"))) {
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

      console.error("Lỗi khi chuyển giao cho pharmacy:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi chuyển giao cho pharmacy",
        error: error.message,
      });
    }
  }

  async saveTransferToPharmacyTransaction(req, res) {
    try {
      const { invoiceId, transactionHash, tokenIds } = req.body;
      const distributorId = req.user?._id?.toString();

      if (!distributorId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có distributor mới có thể lưu transaction",
        });
      }

      if (!invoiceId || !transactionHash || !tokenIds) {
        return res.status(400).json({
          success: false,
          message: "invoiceId, transactionHash và tokenIds là bắt buộc",
        });
      }

      const result = await this._distributorService.saveTransferToPharmacyTransaction(
        distributorId,
        invoiceId,
        transactionHash,
        tokenIds
      );

      return res.status(200).json({
        success: true,
        message: "Lưu transaction thành công",
        data: result,
      });
    } catch (error) {
      if (error.message && (error.message.includes("không tìm thấy") || error.message.includes("không có quyền"))) {
        return res.status(error.message.includes("không tìm thấy") ? 404 : 403).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi lưu transaction:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lưu transaction",
        error: error.message,
      });
    }
  }

  async getDistributionHistory(req, res) {
    try {
      const distributorId = req.user?._id?.toString();

      if (!distributorId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có distributor mới có thể xem lịch sử phân phối",
        });
      }

      const filters = {
        status: req.query.status,
        batchNumber: req.query.batchNumber,
      };

      const distributions = await this._distributorService.getDistributionHistory(distributorId, filters);

      return res.status(200).json({
        success: true,
        data: distributions.map(dist => ({
          id: dist.id,
          manufacturerId: dist.fromManufacturerId,
          batchNumber: dist.batchNumber,
          quantity: dist.distributedQuantity,
          status: dist.status,
          distributionDate: dist.distributionDate,
          createdAt: dist.createdAt,
        })),
        count: distributions.length,
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

  async getTransferToPharmacyHistory(req, res) {
    try {
      const distributorId = req.user?._id?.toString();

      if (!distributorId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có distributor mới có thể xem lịch sử chuyển giao",
        });
      }

      const filters = {
        status: req.query.status,
        search: req.query.search,
      };

      const invoices = await this._distributorService.getTransferToPharmacyHistory(distributorId, filters);

      return res.status(200).json({
        success: true,
        data: invoices.map(inv => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          pharmacyId: inv.toPharmacyId,
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
      console.error("Lỗi khi lấy lịch sử chuyển giao:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy lịch sử chuyển giao",
        error: error.message,
      });
    }
  }

  async getStatistics(req, res) {
    try {
      const distributorId = req.user?._id?.toString();

      if (!distributorId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có distributor mới có thể xem thống kê",
        });
      }

      const statistics = await this._distributorService.getStatistics(distributorId);

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
      const distributorId = req.user?._id?.toString();
      const { tokenId } = req.params;

      if (!distributorId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có distributor mới có thể track drug",
        });
      }

      if (!tokenId) {
        return res.status(400).json({
          success: false,
          message: "tokenId là bắt buộc",
        });
      }

      const trackingInfo = await this._distributorService.trackDrugByTokenId(distributorId, tokenId);

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
      const distributorId = req.user?._id?.toString();

      if (!distributorId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có distributor mới có thể xem danh sách thuốc",
        });
      }

      const filters = {
        status: req.query.status,
        search: req.query.search,
      };

      const drugs = await this._distributorService.getDrugs(distributorId, filters);

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
      const distributorId = req.user?._id?.toString();
      const { atcCode } = req.query;

      if (!distributorId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có distributor mới có thể tìm kiếm thuốc",
        });
      }

      if (!atcCode) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp ATC code",
        });
      }

      const drug = await this._distributorService.searchDrugByATCCode(atcCode);

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
      const distributorId = req.user?._id?.toString();
      const user = req.user;

      if (!distributorId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có distributor mới có thể xem profile",
        });
      }

      const profile = await this._distributorService.getProfile(distributorId, user);

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

      console.error("Lỗi khi lấy thông tin distributor:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thông tin distributor",
        error: error.message,
      });
    }
  }

  async getPharmacies(req, res) {
    try {
      const distributorId = req.user?._id?.toString();

      if (!distributorId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có distributor mới có thể xem danh sách pharmacies",
        });
      }

      const filters = {
        status: req.query.status,
        search: req.query.search,
        page: req.query.page,
        limit: req.query.limit,
      };

      const result = await this._distributorService.getPharmacies(filters);

      return res.status(200).json({
        success: true,
        data: {
          pharmacies: result.pharmacies,
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
          },
        },
      });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách pharmacies:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách pharmacies",
        error: error.message,
      });
    }
  }

  async getChartOneWeek(req, res) {
    try {
      const distributorId = req.user?._id?.toString();

      if (!distributorId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có distributor mới có thể xem biểu đồ",
        });
      }

      const result = await this._distributorService.getChartOneWeek(distributorId);

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
      const distributorId = req.user?._id?.toString();

      if (!distributorId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có distributor mới có thể xem biểu đồ",
        });
      }

      const result = await this._distributorService.getChartTodayYesterday(distributorId);

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
      const distributorId = req.user?._id?.toString();
      const { startDate, endDate } = req.query;

      if (!distributorId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có distributor mới có thể xem thống kê",
        });
      }

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp startDate và endDate",
        });
      }

      const result = await this._distributorService.getInvoicesByDateRange(distributorId, startDate, endDate);

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

  async getDistributionsByDateRange(req, res) {
    try {
      const distributorId = req.user?._id?.toString();
      const { startDate, endDate } = req.query;

      if (!distributorId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có distributor mới có thể xem thống kê",
        });
      }

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp startDate và endDate",
        });
      }

      const result = await this._distributorService.getDistributionsByDateRange(distributorId, startDate, endDate);

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

      console.error("Lỗi khi lấy thống kê distributions theo khoảng thời gian:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê",
        error: error.message,
      });
    }
  }

  async getTransfersToPharmacyByDateRange(req, res) {
    try {
      const distributorId = req.user?._id?.toString();
      const { startDate, endDate } = req.query;

      if (!distributorId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có distributor mới có thể xem thống kê",
        });
      }

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp startDate và endDate",
        });
      }

      const result = await this._distributorService.getTransfersToPharmacyByDateRange(distributorId, startDate, endDate);

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

      console.error("Lỗi khi lấy thống kê transfers theo khoảng thời gian:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê",
        error: error.message,
      });
    }
  }

  async createContractRequest(req, res) {
    try {
      const dto = (await import("../../application/dto/CreateContractRequestDTO.js")).CreateContractRequestDTO.fromRequest(req);
      const distributorId = req.user?._id?.toString();
      const distributorPrivateKey = req.body.distributorPrivateKey;

      if (!distributorId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có distributor mới có thể tạo contract request",
        });
      }

      if (!distributorPrivateKey) {
        return res.status(400).json({
          success: false,
          message: "Distributor private key là bắt buộc để ký trên blockchain",
        });
      }

      dto.validate();

      const result = await this._distributorService.createContractRequest(dto, distributorId, distributorPrivateKey);

      return res.status(201).json({
        success: true,
        message: "Đã tạo contract request thành công",
        data: result,
      });
    } catch (error) {
      if (error.message && (error.message.includes("bắt buộc") || error.message.includes("đã có hợp đồng"))) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi tạo contract request:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi tạo contract request",
        error: error.message,
      });
    }
  }

  async finalizeContractAndMint(req, res) {
    try {
      const dto = (await import("../../application/dto/FinalizeContractDTO.js")).FinalizeContractDTO.fromRequest(req);
      const distributorId = req.user?._id?.toString();
      const distributorPrivateKey = req.body.distributorPrivateKey;

      if (!distributorId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có distributor mới có thể finalize contract",
        });
      }

      if (!distributorPrivateKey) {
        return res.status(400).json({
          success: false,
          message: "Distributor private key là bắt buộc để ký và mint NFT",
        });
      }

      dto.validate();

      const result = await this._distributorService.finalizeContractAndMint(dto, distributorId, distributorPrivateKey);

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      if (error.message && (error.message.includes("bắt buộc") || error.message.includes("không tìm thấy") || error.message.includes("không có quyền") || error.message.includes("APPROVED"))) {
        return res.status(error.message.includes("không tìm thấy") ? 404 : 400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi finalize contract và mint NFT:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi finalize contract và mint NFT",
        error: error.message,
      });
    }
  }

  async getContracts(req, res) {
    try {
      const distributorId = req.user?._id?.toString();

      if (!distributorId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có distributor mới có thể xem contracts",
        });
      }

      const filters = {
        status: req.query.status,
      };

      const contracts = await this._distributorService.getContracts(distributorId, filters);

      return res.status(200).json({
        success: true,
        data: contracts.map(contract => ({
          id: contract.id,
          pharmacyId: contract.pharmacyId,
          contractFileUrl: contract.contractFileUrl,
          contractFileName: contract.contractFileName,
          status: contract.status,
          blockchainTxHash: contract.blockchainTxHash,
          blockchainStatus: contract.blockchainStatus,
          tokenId: contract.tokenId,
          distributorSignedAt: contract.distributorSignedAt,
          pharmacySignedAt: contract.pharmacySignedAt,
          createdAt: contract.createdAt,
          updatedAt: contract.updatedAt,
        })),
        count: contracts.length,
      });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách contracts:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách contracts",
        error: error.message,
      });
    }
  }

  async getContractDetail(req, res) {
    try {
      const { contractId } = req.params;
      const distributorId = req.user?._id?.toString();

      if (!distributorId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có distributor mới có thể xem contract detail",
        });
      }

      const contract = await this._distributorService.getContractDetail(distributorId, contractId);

      return res.status(200).json({
        success: true,
        data: {
          id: contract.id,
          pharmacyId: contract.pharmacyId,
          contractFileUrl: contract.contractFileUrl,
          contractFileName: contract.contractFileName,
          status: contract.status,
          blockchainTxHash: contract.blockchainTxHash,
          blockchainStatus: contract.blockchainStatus,
          tokenId: contract.tokenId,
          distributorSignedAt: contract.distributorSignedAt,
          pharmacySignedAt: contract.pharmacySignedAt,
          createdAt: contract.createdAt,
          updatedAt: contract.updatedAt,
        },
      });
    } catch (error) {
      if (error.message && (error.message.includes("không tìm thấy") || error.message.includes("không có quyền"))) {
        return res.status(error.message.includes("không tìm thấy") ? 404 : 403).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi lấy contract detail:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy contract detail",
        error: error.message,
      });
    }
  }

  async getContractInfoFromBlockchain(req, res) {
    try {
      const { distributorAddress, pharmacyAddress } = req.query;

      if (!distributorAddress || !pharmacyAddress) {
        return res.status(400).json({
          success: false,
          message: "Distributor address và Pharmacy address là bắt buộc",
        });
      }

      const contractInfo = await this._distributorService.getContractInfoFromBlockchain(distributorAddress, pharmacyAddress);

      return res.status(200).json({
        success: true,
        data: contractInfo,
      });
    } catch (error) {
      if (error.message && error.message.includes("không hợp lệ")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi lấy contract info từ blockchain:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy contract info từ blockchain",
        error: error.message,
      });
    }
  }

  async getMonthlyTrends(req, res) {
    try {
      const distributorId = req.user?._id?.toString();
      const { months } = req.query;

      if (!distributorId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có distributor mới có thể xem monthly trends",
        });
      }

      const result = await this._distributorService.getMonthlyTrends(distributorId, months || 6);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message && error.message.includes("Số tháng")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi lấy monthly trends:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy monthly trends",
        error: error.message,
      });
    }
  }

  async getDashboardStats(req, res) {
    try {
      const distributorId = req.user?._id?.toString();

      if (!distributorId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có distributor mới có thể xem dashboard stats",
        });
      }

      const result = await this._distributorService.getDashboardStats(distributorId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Lỗi khi lấy dashboard stats:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy dashboard stats",
        error: error.message,
      });
    }
  }
}

