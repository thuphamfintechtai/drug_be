import { ConfirmReceiptDTO } from "../../application/dto/ConfirmReceiptDTO.js";
import { TransferToPharmacyDTO } from "../../application/dto/TransferToPharmacyDTO.js";

export class DistributorController {
  constructor(distributorService) {
    this._distributorService = distributorService;
  }

  async _loadProofOfPharmacyModel() {
    const { ProofOfPharmacyModel } = await import(
      "../../../pharmacy/infrastructure/persistence/mongoose/schemas/ProofOfPharmacySchema.js"
    );
    return ProofOfPharmacyModel;
  }

  async _loadCommercialInvoiceModel() {
    const { CommercialInvoiceModel } = await import(
      "../../infrastructure/persistence/mongoose/schemas/CommercialInvoiceSchema.js"
    );
    return CommercialInvoiceModel;
  }

  async _loadManufacturerInvoiceModel() {
    const { ManufacturerInvoiceModel } = await import(
      "../../../supply-chain/infrastructure/persistence/mongoose/schemas/ManufacturerInvoiceSchema.js"
    );
    return ManufacturerInvoiceModel;
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

  async getInvoiceStatus(req, res) {
    try {
      const { invoiceId } = req.params;
      const distributorId = req.user?._id?.toString();

      if (!distributorId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có distributor mới có thể xem invoice status",
        });
      }

      const invoiceStatus = await this._distributorService.getInvoiceStatus(distributorId, invoiceId);

      return res.status(200).json({
        success: true,
        data: invoiceStatus,
      });
    } catch (error) {
      if (error.message && (error.message.includes("không tìm thấy") || error.message.includes("không có quyền"))) {
        return res.status(error.message.includes("không tìm thấy") ? 404 : 403).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi lấy invoice status:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy invoice status",
        error: error.message,
      });
    }
  }

  async updateInvoiceStatus(req, res) {
    try {
      const { invoiceId } = req.params;
      const { status } = req.body;
      const distributorId = req.user?._id?.toString();

      if (!distributorId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có distributor mới có thể cập nhật invoice status",
        });
      }

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Trạng thái (status) là bắt buộc",
        });
      }

      const result = await this._distributorService.updateInvoiceStatus(distributorId, invoiceId, status);

      return res.status(200).json({
        success: true,
        message: "Cập nhật trạng thái invoice thành công",
        data: result,
      });
    } catch (error) {
      if (error.message && (error.message.includes("không tìm thấy") || error.message.includes("không có quyền"))) {
        return res.status(error.message.includes("không tìm thấy") ? 404 : 403).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message && (error.message.includes("không hợp lệ") || error.message.includes("Không thể chuyển"))) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi cập nhật invoice status:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật invoice status",
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
        dto.amount,
        dto.tokenIds, // Pass tokenIds if provided
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
        drugId: req.query.drugId, // Thêm filter theo drugId
      };

      const pharmacyId = req.query.pharmacyId; // Query parameter để filter theo pharmacy (optional)

      const distributions = await this._distributorService.getDistributionHistory(distributorId, filters);

      // Kiểm tra xem mỗi distribution có tồn tại trong ProofOfPharmacy không
      const ProofOfPharmacyModel = await this._loadProofOfPharmacyModel();
      const distributionIds = distributions.map(dist => dist.id);
      
      // Lấy tất cả ProofOfPharmacy có proofOfDistribution trong danh sách distributionIds
      const proofOfPharmacies = await ProofOfPharmacyModel.find({
        proofOfDistribution: { $in: distributionIds }
      }).select("proofOfDistribution");

      // Tạo Set để tra cứu nhanh
      const transferredDistributionIds = new Set(
        proofOfPharmacies.map(pop => pop.proofOfDistribution?.toString()).filter(Boolean)
      );

      // Lấy thông tin NFT availability cho mỗi distribution
      const CommercialInvoiceModel = await this._loadCommercialInvoiceModel();
      const ManufacturerInvoiceModel = await this._loadManufacturerInvoiceModel();

      // Lấy tất cả manufacturerInvoice của distributor để tính tổng NFT đã nhận theo drugId
      const manufacturerInvoices = await ManufacturerInvoiceModel.find({
        toDistributor: distributorId,
        status: "sent"
      }).populate("drug").select("_id drug tokenIds");

      // Group tokenIds theo drugId
      const tokenIdsByDrug = {};
      const drugIdByInvoiceId = {}; // Map invoiceId -> drugId để tra cứu nhanh
      for (const invoice of manufacturerInvoices) {
        const invoiceId = invoice._id?.toString();
        const drugId = invoice.drug?._id?.toString() || invoice.drug?.toString() || invoice.drug;
        
        if (invoiceId && drugId) {
          drugIdByInvoiceId[invoiceId] = drugId;
        }
        
        if (drugId && invoice.tokenIds && Array.isArray(invoice.tokenIds)) {
          if (!tokenIdsByDrug[drugId]) {
            tokenIdsByDrug[drugId] = [];
          }
          tokenIdsByDrug[drugId].push(...invoice.tokenIds.map(id => String(id).trim()));
        }
      }

      // Loại bỏ duplicate trong mỗi drug
      for (const drugId in tokenIdsByDrug) {
        tokenIdsByDrug[drugId] = [...new Set(tokenIdsByDrug[drugId])];
      }

      // Lấy commercialInvoice để tính NFT đã chuyển
      // Nếu có pharmacyId, chỉ tính cho pharmacy đó; nếu không, tính cho tất cả pharmacy
      const commercialInvoiceQuery = {
        fromDistributor: distributorId,
        status: { $in: ["draft", "issued", "sent"] }
      };
      if (pharmacyId) {
        commercialInvoiceQuery.toPharmacy = pharmacyId;
      }

      const commercialInvoices = await CommercialInvoiceModel.find(commercialInvoiceQuery)
        .populate("drug")
        .select("drug tokenIds toPharmacy");

      // Group tokenIds đã chuyển theo drugId (và pharmacyId nếu có)
      const transferredTokenIdsByDrug = {};
      for (const invoice of commercialInvoices) {
        const drugId = invoice.drug?._id?.toString() || invoice.drug?.toString() || invoice.drug;
        if (drugId && invoice.tokenIds && Array.isArray(invoice.tokenIds)) {
          if (!transferredTokenIdsByDrug[drugId]) {
            transferredTokenIdsByDrug[drugId] = [];
          }
          transferredTokenIdsByDrug[drugId].push(...invoice.tokenIds.map(id => String(id).trim()));
        }
      }

      // Loại bỏ duplicate trong mỗi drug
      for (const drugId in transferredTokenIdsByDrug) {
        transferredTokenIdsByDrug[drugId] = [...new Set(transferredTokenIdsByDrug[drugId])];
      }

      // Tính toán availability cho mỗi distribution
      const result = await Promise.all(distributions.map(async (dist) => {
        // Lấy drugId từ manufacturerInvoice
        let drugId = null;
        
        // Cách 1: Lấy từ manufacturerInvoiceId nếu có
        if (dist.manufacturerInvoiceId) {
          const invoiceId = String(dist.manufacturerInvoiceId).trim();
          drugId = drugIdByInvoiceId[invoiceId] || null;
          
          // Nếu không tìm thấy trong map, query trực tiếp
          if (!drugId) {
            const relatedInvoice = await ManufacturerInvoiceModel.findById(invoiceId)
              .populate("drug")
              .select("drug");
            if (relatedInvoice) {
              drugId = relatedInvoice.drug?._id?.toString() || relatedInvoice.drug?.toString() || relatedInvoice.drug;
            }
          }
        }

        // Cách 2: Nếu không tìm thấy từ invoice, thử lấy từ tokenIds của distribution
        if (!drugId && dist.tokenIds && dist.tokenIds.length > 0) {
          // Tìm drugId từ tokenIds đầu tiên
          const firstTokenId = String(dist.tokenIds[0]).trim();
          for (const [dId, tokenIds] of Object.entries(tokenIdsByDrug)) {
            if (tokenIds.includes(firstTokenId)) {
              drugId = dId;
              break;
            }
          }
        }

        // Tính toán NFT availability - CHỈ tính cho distribution này
        // Lấy tokenIds của distribution này (chỉ những NFT trong distribution cụ thể này)
        const distributionTokenIds = (dist.tokenIds || []).map(id => String(id).trim());
        
        // Lấy tất cả NFT đã chuyển cho pharmacy (tổng số cho drug này)
        const allTransferredTokenIds = drugId ? (transferredTokenIdsByDrug[drugId] || []) : [];
        
        // Tính NFT đã chuyển trong distribution này (chỉ những NFT thuộc distribution này)
        const transferredTokenIdsInDistribution = distributionTokenIds.filter(tid => 
          allTransferredTokenIds.includes(tid)
        );
        
        // Tính NFT còn lại trong distribution này (chưa chuyển)
        const availableTokenIdsInDistribution = distributionTokenIds.filter(tid => 
          !allTransferredTokenIds.includes(tid)
        );

        return {
          id: dist.id,
          manufacturerId: dist.fromManufacturerId,
          manufacturer: dist.manufacturerInfo || null,
          batchNumber: dist.batchNumber,
          quantity: dist.distributedQuantity,
          status: dist.status,
          distributionDate: dist.distributionDate,
          notes: dist.notes || null,
          tokenIds: dist.tokenIds,
          chainTxHash: dist.chainTxHash,
          createdAt: dist.createdAt,
          transferToPharmacy: transferredDistributionIds.has(dist.id),
          // Thông tin NFT availability - CHỈ tính cho distribution này
          drugId: drugId || null,
          totalReceivedNFTs: distributionTokenIds.length, // Số lượng NFT trong distribution này (đã nhận)
          totalTransferredNFTs: transferredTokenIdsInDistribution.length, // Số NFT đã chuyển từ distribution này
          availableNFTs: availableTokenIdsInDistribution.length, // Số NFT còn lại trong distribution này
          transferredTokenIds: transferredTokenIdsInDistribution, // Danh sách NFT đã chuyển từ distribution này
          availableTokenIds: availableTokenIdsInDistribution, // Danh sách NFT còn lại trong distribution này
        };
      }));

      return res.status(200).json({
        success: true,
        data: result,
        count: result.length,
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
          pharmacyName: inv.pharmacyName || inv.pharmacyInfo?.name || null,
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
      const errorMessage = error.message || error.toString();
      
      if (errorMessage.includes("không tìm thấy") || errorMessage.includes("Không tìm thấy") || errorMessage.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: errorMessage,
        });
      }

      console.error("Lỗi khi track drug:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi track drug",
        error: errorMessage,
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

  async getAvailablePharmacies(req, res) {
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
        signed: req.query.signed, // "true" để lấy pharmacy đã ký hợp đồng, "false" hoặc không có để lấy chưa có hợp đồng
      };

      const result = await this._distributorService.getAvailablePharmacies(distributorId, filters);

      const signed = filters.signed === "true" || filters.signed === true;
      const message = signed 
        ? "Lấy danh sách pharmacies đã ký hợp đồng thành công"
        : "Lấy danh sách pharmacies chưa có hợp đồng thành công";

      return res.status(200).json({
        success: true,
        message,
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
      const distributorPrivateKey = req.body.distributorPrivateKey || null;

      if (!distributorId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có distributor mới có thể tạo contract request",
        });
      }

      dto.validate();

      const result = await this._distributorService.createContractRequest(
        dto,
        distributorId,
        distributorPrivateKey
      );

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
      const distributorPrivateKey = req.body.distributorPrivateKey || null;

      if (!distributorId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có distributor mới có thể finalize contract",
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
      let { distributorAddress, pharmacyAddress } = req.query;
      const user = req.user;

      // Lấy distributor address từ user profile nếu không có trong query
      if (!distributorAddress && user?.walletAddress) {
        distributorAddress = user.walletAddress;
      }

      // Nếu vẫn thiếu address, trả về lỗi với thông báo rõ ràng hơn
      if (!distributorAddress) {
        return res.status(400).json({
          success: false,
          message: "Distributor address là bắt buộc. Vui lòng cung cấp distributorAddress trong query params hoặc đảm bảo user có walletAddress.",
        });
      }

      if (!pharmacyAddress) {
        return res.status(400).json({
          success: false,
          message: "Pharmacy address là bắt buộc. Vui lòng cung cấp pharmacyAddress trong query params.",
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

