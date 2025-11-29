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

      // Get all unique distributor IDs
      const distributorIds = [...new Set(invoices.map(inv => inv.fromDistributorId).filter(Boolean))];

      // Query distributors directly from DistributorModel
      const { DistributorModel } = await import(
        "../../../registration/infrastructure/persistence/mongoose/schemas/BusinessEntitySchemas.js"
      );
      
      const distributors = distributorIds.length > 0
        ? await DistributorModel.find({ user: { $in: distributorIds } }).lean()
        : [];

      // Create a map of distributorId -> distributor info for quick lookup
      const distributorMap = new Map();
      distributors.forEach(dist => {
        const userId = dist.user ? (dist.user.toString ? dist.user.toString() : String(dist.user)) : null;
        if (userId) {
          distributorMap.set(userId, {
            id: dist._id.toString(),
            name: dist.name || null,
            code: dist.licenseNo || dist.taxCode || null,
            email: dist.contactEmail || null,
            phone: dist.contactPhone || null,
            address: dist.address || null,
            country: dist.country || null,
          });
        }
      });

      return res.status(200).json({
        success: true,
        data: invoices.map(inv => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          distributorId: inv.fromDistributorId,
          distributor: inv.fromDistributorId ? distributorMap.get(inv.fromDistributorId) || null : null,
          drugId: inv.drugId,
          quantity: inv.quantity,
          status: inv.status,
          chainTxHash: inv.chainTxHash,
          tokenIds: inv.tokenIds,
          createdAt: inv.createdAt,
          isPharmaConfirm: inv.proofOfPharmacyId != null && inv.proofOfPharmacyId !== null,
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
        search: req.query.search,
        page: req.query.page,
        limit: req.query.limit,
      };

      const result = await this._pharmacyService.getDistributionHistory(pharmacyId, filters);

      // Get Business Entity names for distributors (User may not have fullName)
      const { DistributorModel, PharmacyModel } = await import(
        "../../../registration/infrastructure/persistence/mongoose/schemas/BusinessEntitySchemas.js"
      );

      // Get all unique distributor User IDs from results
      const distributorUserIds = [...new Set(
        result.documents
          .map(doc => doc.fromDistributor?._id?.toString() || doc.fromDistributor?.toString())
          .filter(Boolean)
      )];

      // Query distributors to get their names
      const distributors = distributorUserIds.length > 0
        ? await DistributorModel.find({ user: { $in: distributorUserIds } })
            .select("user name")
            .lean()
        : [];

      // Create map: userId -> distributor name
      const distributorNameMap = new Map();
      distributors.forEach(dist => {
        const userId = dist.user ? (dist.user.toString ? dist.user.toString() : String(dist.user)) : null;
        if (userId && dist.name) {
          distributorNameMap.set(userId, dist.name);
        }
      });

      // Format response according to requirements
      // result.documents are already populated lean() objects from repository
      const formattedReceipts = result.documents.map(doc => {
        // Extract fromDistributor (User object) - already populated
        // If User doesn't have fullName, get name from Distributor entity
        let distributorFullName = null;
        let distributorName = null;
        
        if (doc.fromDistributor) {
          const userId = doc.fromDistributor._id?.toString() || doc.fromDistributor.toString();
          distributorFullName = doc.fromDistributor.fullName || distributorNameMap.get(userId) || null;
          distributorName = distributorNameMap.get(userId) || doc.fromDistributor.fullName || null;
        }

        const fromDistributor = doc.fromDistributor ? {
          _id: doc.fromDistributor._id?.toString() || doc.fromDistributor.toString(),
          fullName: distributorFullName,
          name: distributorName,
          username: doc.fromDistributor.username || null,
          email: doc.fromDistributor.email || null,
        } : null;

        // Extract drug object - already populated
        // Drug schema has: tradeName, genericName (no commercialName or name field)
        const drug = doc.drug ? {
          _id: doc.drug._id?.toString() || doc.drug.toString(),
          tradeName: doc.drug.tradeName || null,
          commercialName: doc.drug.tradeName || null, // Use tradeName as commercialName
          name: doc.drug.tradeName || doc.drug.genericName || null, // Use tradeName as name
        } : null;

        // Extract receivedBy (from verifiedBy User or embedded schema)
        let receivedBy = null;
        if (doc.verifiedBy) {
          receivedBy = {
            _id: doc.verifiedBy._id?.toString() || doc.verifiedBy.toString(),
            fullName: doc.verifiedBy.fullName || null,
            name: doc.verifiedBy.fullName || null, // User doesn't have name field, use fullName
            username: doc.verifiedBy.username || null,
            email: doc.verifiedBy.email || null,
          };
        } else if (doc.receivedBy && doc.receivedBy.name) {
          // If receivedBy is embedded schema, format it
          receivedBy = {
            name: doc.receivedBy.name || null,
            signature: doc.receivedBy.signature || null,
            idNumber: doc.receivedBy.idNumber || null,
            position: doc.receivedBy.position || null,
          };
        }

        // Extract nested values (already flattened in lean() documents)
        const receivedQuantity = doc.receivedQuantity || 0;
        const batchNumber = doc.batchNumber || null;
        const chainTxHash = doc.chainTxHash || null;
        const receivedDate = doc.receiptDate || doc.createdAt;

        // Extract receiptAddress
        const receiptAddress = doc.receiptAddress ? {
          street: doc.receiptAddress.street || null,
          city: doc.receiptAddress.city || null,
          state: doc.receiptAddress.state || null,
          postalCode: doc.receiptAddress.postalCode || null,
          country: doc.receiptAddress.country || null,
        } : null;

        // Format deliveryAddress (alias of receiptAddress)
        const deliveryAddress = receiptAddress ? {
          street: receiptAddress.street,
          city: receiptAddress.city,
        } : null;

        // Map status according to requirements
        // Schema has: pending, received, confirmed, rejected
        // Requirements accept: pending, received, verified, completed, rejected, confirmed
        // Map "confirmed" to "verified" for frontend compatibility
        let status = doc.status || "pending";
        if (status === "confirmed") {
          status = "verified"; // Map confirmed to verified as per requirements
        }

        return {
          _id: doc._id.toString(),
          status,
          receivedDate: receivedDate ? new Date(receivedDate).toISOString() : null,
          createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
          updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
          fromDistributor,
          drug,
          receivedBy,
          receivedQuantity,
          quantity: receivedQuantity, // Alias
          batchNumber,
          chainTxHash,
          transactionHash: chainTxHash, // Alias
          receiptAddress,
          deliveryAddress,
          notes: doc.notes || null,
          commercialInvoiceId: doc.commercialInvoice?._id?.toString() || doc.commercialInvoice?.toString() || doc.commercialInvoice || null,
          proofOfDistributionId: doc.proofOfDistribution?._id?.toString() || doc.proofOfDistribution?.toString() || doc.proofOfDistribution || null,
          nftInfoId: doc.nftInfo?._id?.toString() || doc.nftInfo?.toString() || doc.nftInfo || null,
        };
      });

      return res.status(200).json({
        success: true,
        data: {
          receipts: formattedReceipts,
          count: result.total,
          total: result.total,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            pages: result.pages,
          },
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

  async confirmContract(req, res) {
    try {
      const dto = (await import("../../application/dto/ConfirmContractDTO.js")).ConfirmContractDTO.fromRequest(req);
      const pharmacyId = req.user?._id?.toString();

      if (!pharmacyId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có pharmacy mới có thể xác nhận contract",
        });
      }

      dto.validate();

      // Pass the DTO and let the service/use-case decide whether a private key
      // or a signature payload is provided.
      const result = await this._pharmacyService.confirmContract(dto, pharmacyId, dto.pharmacyPrivateKey);

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      if (error.message && (error.message.includes("bắt buộc") || error.message.includes("không tìm thấy") || error.message.includes("không có quyền") || error.message.includes("PENDING"))) {
        return res.status(error.message.includes("không tìm thấy") ? 404 : 400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi xác nhận contract:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi xác nhận contract",
        error: error.message,
      });
    }
  }

  async getContracts(req, res) {
    try {
      // Bước 1: Lấy userId từ JWT (đã được giải mã trong middleware)
      const userId = req.user?._id?.toString();

      if (!userId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có pharmacy mới có thể xem contracts",
        });
      }

      // Bước 2: Query User để lấy Pharmacy ID
      const { UserModel } = await import("../../../identity-access/infrastructure/persistence/mongoose/schemas/UserSchema.js");
      const user = await UserModel.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy user",
        });
      }

      // Bước 3: Query Pharmacy để lấy Pharmacy entity ID
      const { PharmacyModel, DistributorModel } = await import(
        "../../../registration/infrastructure/persistence/mongoose/schemas/BusinessEntitySchemas.js"
      );
      const pharmacy = await PharmacyModel.findOne({ user: userId });

      if (!pharmacy) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy pharmacy entity cho user này",
        });
      }

      const pharmacyId = pharmacy._id.toString();

      const filters = {
        status: req.query.status,
      };

      // Bước 4: Query DistributorPharmacyContract với Pharmacy ID
      const contracts = await this._pharmacyService.getContracts(pharmacyId, filters);

      return res.status(200).json({
        success: true,
        data: contracts.map(contract => ({
          id: contract.id,
          distributorId: contract.distributorId,
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
      
      // Bước 1: Lấy userId từ JWT (đã được giải mã trong middleware)
      const userId = req.user?._id?.toString();

      if (!userId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có pharmacy mới có thể xem contract detail",
        });
      }

      // Bước 2: Query User để kiểm tra user tồn tại
      const { UserModel } = await import("../../../identity-access/infrastructure/persistence/mongoose/schemas/UserSchema.js");
      const user = await UserModel.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy user",
        });
      }

      // Bước 3: Query Pharmacy để lấy Pharmacy entity ID
      const { PharmacyModel, DistributorModel } = await import(
        "../../../registration/infrastructure/persistence/mongoose/schemas/BusinessEntitySchemas.js"
      );
      const pharmacy = await PharmacyModel.findOne({ user: userId });

      if (!pharmacy) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy pharmacy entity cho user này",
        });
      }

      const pharmacyId = pharmacy._id.toString();

      // Bước 4: Query DistributorPharmacyContract với Pharmacy ID
      const contract = await this._pharmacyService.getContractDetail(pharmacyId, contractId);

      // Try to fetch distributor and pharmacy wallet addresses (if available)

      let distributorWalletAddress = null;
      let pharmacyWalletAddress = pharmacy.walletAddress || null;

      try {
        if (contract.distributorId) {
          // Contract lưu distributorId = userId (từ JWT) -> thử cả _id lẫn user
          let distributorEntity = await DistributorModel.findById(contract.distributorId).lean();
          if (!distributorEntity) {
            distributorEntity = await DistributorModel.findOne({ user: contract.distributorId }).lean();
          }

          if (distributorEntity && distributorEntity.walletAddress) {
            distributorWalletAddress = distributorEntity.walletAddress;
          }
        }

        // Nếu chưa có wallet từ entity theo user, thử theo contract.pharmacyId (entity id)
        if (!pharmacyWalletAddress && contract.pharmacyId) {
          const pharmacyEntity = await PharmacyModel.findById(contract.pharmacyId).lean();
          if (pharmacyEntity && pharmacyEntity.walletAddress) {
            pharmacyWalletAddress = pharmacyEntity.walletAddress;
          }
        }
      } catch (err) {
        // ignore lookup errors and continue returning available contract data
        console.warn("Could not fetch distributor/pharmacy wallet addresses:", err.message);
      }

      return res.status(200).json({
        success: true,
        data: {
          id: contract.id,
          distributorId: contract.distributorId,
          distributorWalletAddress,
          pharmacyWalletAddress,
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
      let { pharmacyAddress, distributorAddress } = req.query;
      const user = req.user;

      // Lấy pharmacy address từ user profile nếu không có trong query
      if (!pharmacyAddress && user?.walletAddress) {
        pharmacyAddress = user.walletAddress;
      }

      // Nếu vẫn thiếu address, trả về lỗi với thông báo rõ ràng hơn
      if (!distributorAddress) {
        return res.status(400).json({
          success: false,
          message: "Distributor address là bắt buộc. Vui lòng cung cấp distributorAddress trong query params.",
        });
      }

      if (!pharmacyAddress) {
        return res.status(400).json({
          success: false,
          message: "Pharmacy address là bắt buộc. Vui lòng cung cấp pharmacyAddress trong query params hoặc đảm bảo user có walletAddress.",
        });
      }

      const contractInfo = await this._pharmacyService.getContractInfoFromBlockchain(pharmacyAddress, distributorAddress);

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
}

