import { UploadIPFSDTO } from "../../application/dto/UploadIPFSDTO.js";
import { MintNFTDTO } from "../../application/dto/MintNFTDTO.js";
import { DrugNotFoundException } from "../../domain/exceptions/DrugNotFoundException.js";

export class ProductionController {
  constructor(productionService, nftRepository, manufacturerInvoiceRepository) {
    this._productionService = productionService;
    this._nftRepository = nftRepository;
    this._manufacturerInvoiceRepository = manufacturerInvoiceRepository;
  }

  async uploadIPFS(req, res) {
    try {
      const dto = UploadIPFSDTO.fromRequest(req);
      const manufacturerId =
        req.user?.pharmaCompanyId || req.pharmaCompany?._id?.toString();

      if (!manufacturerId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có nhà sản xuất mới có thể upload IPFS",
        });
      }

      dto.validate();

      const result = await this._productionService.uploadIPFS(
        dto,
        manufacturerId
      );

      return res.status(200).json({
        success: true,
        message: "Upload IPFS thành công",
        data: result,
      });
    } catch (error) {
      if (error.message && error.message.includes("phải là")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi upload IPFS:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi upload IPFS",
        error: error.message,
      });
    }
  }

  async saveMintedNFTs(req, res) {
    try {
      const dto = MintNFTDTO.fromRequest(req);
      const manufacturerId =
        req.user?.pharmaCompanyId || req.pharmaCompany?._id?.toString();

      if (!manufacturerId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có nhà sản xuất mới có thể mint NFT",
        });
      }

      dto.validate();

      const result = await this._productionService.mintNFT(dto, manufacturerId);

      return res.status(201).json({
        success: true,
        message: "Mint NFT thành công",
        data: result,
      });
    } catch (error) {
      if (error instanceof DrugNotFoundException) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (
        error.message &&
        (error.message.includes("đã tồn tại") ||
          error.message.includes("không có quyền") ||
          error.message.includes("là bắt buộc"))
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi mint NFT:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi mint NFT",
        error: error.message,
      });
    }
  }

  async transferToDistributor(req, res) {
    try {
      const {
        distributorId,
        drugId,
        tokenIds,
        invoiceNumber,
        invoiceDate,
        quantity,
        unitPrice,
        totalAmount,
        vatRate,
        vatAmount,
        finalAmount,
        notes,
      } = req.body;

      const manufacturerId =
        req.user?.pharmaCompanyId || req.pharmaCompany?._id?.toString();

      if (!manufacturerId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có nhà sản xuất mới có thể chuyển giao cho distributor",
        });
      }

      if (
        !distributorId ||
        !drugId ||
        !tokenIds ||
        !Array.isArray(tokenIds) ||
        tokenIds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "distributorId, drugId và tokenIds là bắt buộc",
        });
      }

      const result = await this._productionService.transferToDistributor(
        manufacturerId,
        distributorId,
        drugId,
        tokenIds,
        invoiceNumber,
        invoiceDate ? new Date(invoiceDate) : null,
        quantity,
        unitPrice,
        totalAmount,
        vatRate,
        vatAmount,
        finalAmount,
        notes
      );

      return res.status(201).json({
        success: true,
        message: "Chuyển giao cho distributor thành công",
        data: result,
      });
    } catch (error) {
      if (error instanceof DrugNotFoundException) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (
        error.message &&
        (error.message.includes("không có quyền") ||
          error.message.includes("không thể chuyển giao"))
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi chuyển giao cho distributor:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi chuyển giao cho distributor",
        error: error.message,
      });
    }
  }

  async saveTransferTransaction(req, res) {
    try {
      const { invoiceId, transactionHash, tokenIds } = req.body;
      const manufacturerId =
        req.user?.pharmaCompanyId || req.pharmaCompany?._id?.toString();

      if (!manufacturerId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có nhà sản xuất mới có thể lưu transaction",
        });
      }

      if (!invoiceId || !transactionHash || !tokenIds) {
        return res.status(400).json({
          success: false,
          message: "invoiceId, transactionHash và tokenIds là bắt buộc",
        });
      }

      // Find invoice
      const invoice = await this._manufacturerInvoiceRepository.findById(
        invoiceId
      );
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy invoice",
        });
      }

      // Check ownership
      if (invoice.fromManufacturerId !== manufacturerId) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền cập nhật invoice này",
        });
      }

      // Update invoice with transaction hash
      invoice.setChainTxHash(transactionHash);
      invoice.markAsDelivered(transactionHash);

      // Update NFTs with transaction hash
      const nfts = await this._nftRepository.findByTokenIds(tokenIds);
      for (const nft of nfts) {
        nft.setMintTransaction(transactionHash);
        nft.transfer(invoice.toDistributorId, transactionHash);
        await this._nftRepository.save(nft);
      }

      await this._manufacturerInvoiceRepository.save(invoice);

      return res.status(200).json({
        success: true,
        message: "Lưu transaction thành công",
        data: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          chainTxHash: invoice.chainTxHash,
        },
      });
    } catch (error) {
      console.error("Lỗi khi lưu transaction:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lưu transaction",
        error: error.message,
      });
    }
  }

  async getProductionHistory(req, res) {
    try {
      const manufacturerId =
        req.user?.pharmaCompanyId || req.pharmaCompany?._id?.toString();

      if (!manufacturerId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có nhà sản xuất mới có thể xem lịch sử sản xuất",
        });
      }

      const filters = {
        status: req.query.status,
        batchNumber: req.query.batchNumber,
        startDate: req.query.startDate ? new Date(req.query.startDate) : null,
        endDate: req.query.endDate ? new Date(req.query.endDate) : null,
      };

      const productions = await this._productionService.getProductionHistory(
        manufacturerId,
        filters
      );

      return res.status(200).json({
        success: true,
        data: productions,
        count: productions.length,
      });
    } catch (error) {
      console.error("Lỗi khi lấy lịch sử sản xuất:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy lịch sử sản xuất",
        error: error.message,
      });
    }
  }

  async getTransferHistory(req, res) {
    try {
      const manufacturerId =
        req.user?.pharmaCompanyId || req.pharmaCompany?._id?.toString();

      if (!manufacturerId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có nhà sản xuất mới có thể xem lịch sử chuyển giao",
        });
      }

      const filters = {
        status: req.query.status,
        search: req.query.search,
      };

      const invoices = await this._productionService.getTransferHistory(
        manufacturerId,
        filters
      );

      return res.status(200).json({
        success: true,
        data: invoices.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          distributorId: inv.toDistributorId,
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

  async getAvailableTokensForProduction(req, res) {
    try {
      const { productionId } = req.params;
      const manufacturerId =
        req.user?.pharmaCompanyId || req.pharmaCompany?._id?.toString();

      if (!manufacturerId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có nhà sản xuất mới có thể xem tokens khả dụng",
        });
      }

      const result =
        await this._productionService.getAvailableTokensForProduction(
          productionId
        );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message && error.message.includes("không tồn tại")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi lấy tokens khả dụng:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy tokens khả dụng",
        error: error.message,
      });
    }
  }

  async getStatistics(req, res) {
    try {
      const manufacturerId =
        req.user?.pharmaCompanyId || req.pharmaCompany?._id?.toString();

      if (!manufacturerId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có nhà sản xuất mới có thể xem thống kê",
        });
      }

      const statistics = await this._productionService.getStatistics(
        manufacturerId
      );

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

  async getProfile(req, res) {
    try {
      const manufacturerId =
        req.user?.pharmaCompanyId || req.pharmaCompany?._id?.toString();
      const user = req.user;

      if (!manufacturerId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có nhà sản xuất mới có thể xem profile",
        });
      }

      const profile = await this._productionService.getProfile(
        manufacturerId,
        user
      );

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

      console.error("Lỗi khi lấy thông tin pharma company:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thông tin pharma company",
        error: error.message,
      });
    }
  }

  async getDistributors(req, res) {
    try {
      const manufacturerId =
        req.user?.pharmaCompanyId || req.pharmaCompany?._id?.toString();

      if (!manufacturerId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có nhà sản xuất mới có thể xem danh sách distributors",
        });
      }

      const filters = {
        status: req.query.status,
        search: req.query.search,
        page: req.query.page,
        limit: req.query.limit,
      };

      const result = await this._productionService.getDistributors(filters);

      return res.status(200).json({
        success: true,
        data: {
          distributors: result.distributors,
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
          },
        },
      });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách distributors:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách distributors",
        error: error.message,
      });
    }
  }

  async getChartOneWeek(req, res) {
    try {
      const manufacturerId =
        req.user?.pharmaCompanyId || req.pharmaCompany?._id?.toString();
      const user = req.user;

      if (!manufacturerId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có nhà sản xuất mới có thể xem biểu đồ",
        });
      }

      const result = await this._productionService.getChartOneWeek(
        manufacturerId
      );

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
      const manufacturerId =
        req.user?.pharmaCompanyId || req.pharmaCompany?._id?.toString();
      const user = req.user;

      if (!manufacturerId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có nhà sản xuất mới có thể xem biểu đồ",
        });
      }

      const result = await this._productionService.getChartTodayYesterday(
        manufacturerId
      );

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

  async getProductionsByDateRange(req, res) {
    try {
      const manufacturerId =
        req.user?.pharmaCompanyId || req.pharmaCompany?._id?.toString();
      const { startDate, endDate } = req.query;

      if (!manufacturerId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có nhà sản xuất mới có thể xem thống kê",
        });
      }

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp startDate và endDate",
        });
      }

      const result = await this._productionService.getProductionsByDateRange(
        manufacturerId,
        startDate,
        endDate
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (
        error.message &&
        (error.message.includes("startDate") ||
          error.message.includes("endDate"))
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error(
        "Lỗi khi lấy thống kê productions theo khoảng thời gian:",
        error
      );
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê",
        error: error.message,
      });
    }
  }

  async getDistributionsByDateRange(req, res) {
    try {
      const manufacturerId =
        req.user?.pharmaCompanyId || req.pharmaCompany?._id?.toString();
      const { startDate, endDate } = req.query;

      if (!manufacturerId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có nhà sản xuất mới có thể xem thống kê",
        });
      }

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp startDate và endDate",
        });
      }

      const result = await this._productionService.getDistributionsByDateRange(
        manufacturerId,
        startDate,
        endDate
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (
        error.message &&
        (error.message.includes("startDate") ||
          error.message.includes("endDate"))
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error(
        "Lỗi khi lấy thống kê distributions theo khoảng thời gian:",
        error
      );
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê",
        error: error.message,
      });
    }
  }

  async getTransfersByDateRange(req, res) {
    try {
      const manufacturerId =
        req.user?.pharmaCompanyId || req.pharmaCompany?._id?.toString();
      const { startDate, endDate } = req.query;

      if (!manufacturerId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có nhà sản xuất mới có thể xem thống kê",
        });
      }

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp startDate và endDate",
        });
      }

      const result = await this._productionService.getTransfersByDateRange(
        manufacturerId,
        startDate,
        endDate
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (
        error.message &&
        (error.message.includes("startDate") ||
          error.message.includes("endDate"))
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error(
        "Lỗi khi lấy thống kê transfers theo khoảng thời gian:",
        error
      );
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê",
        error: error.message,
      });
    }
  }

  async getIPFSStatus(req, res) {
    try {
      const manufacturerId =
        req.user?.pharmaCompanyId || req.pharmaCompany?._id?.toString();
      const user = req.user;

      if (!manufacturerId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có nhà sản xuất mới có thể xem IPFS status",
        });
      }

      const result = await this._productionService.getIPFSStatus(
        manufacturerId,
        user
      );

      return res.status(200).json({
        success: true,
        message: "Đã tìm thấy thông tin IPFS của Manufacture",
        data: {
          ManufactureIPFSStatus: result.ipfsStatuses,
        },
      });
    } catch (error) {
      if (error.message && error.message.includes("Không tìm thấy")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi lấy IPFS status:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy IPFS status",
        error: error.message,
      });
    }
  }

  async getIPFSStatusUndone(req, res) {
    try {
      const manufacturerId =
        req.user?.pharmaCompanyId || req.pharmaCompany?._id?.toString();
      const user = req.user;

      if (!manufacturerId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có nhà sản xuất mới có thể xem IPFS status",
        });
      }

      const result = await this._productionService.getIPFSStatusUndone(
        manufacturerId,
        user
      );

      return res.status(200).json({
        success: true,
        message: "Đã tìm thấy thông tin IPFS của Manufacture",
        data: {
          ManufactureIPFSStatus: result.ipfsStatuses,
        },
      });
    } catch (error) {
      if (error.message && error.message.includes("Không tìm thấy")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi lấy IPFS status undone:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy IPFS status undone",
        error: error.message,
      });
    }
  }
}
