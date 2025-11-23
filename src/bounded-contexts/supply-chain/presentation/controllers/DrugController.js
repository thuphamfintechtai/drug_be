import { CreateDrugDTO } from "../../application/dto/CreateDrugDTO.js";
import { UpdateDrugDTO } from "../../application/dto/UpdateDrugDTO.js";
import { DrugNotFoundException } from "../../domain/exceptions/DrugNotFoundException.js";

export class DrugController {
  constructor(drugManagementService) {
    this._drugService = drugManagementService;
  }

  async addDrug(req, res) {
    try {
      const dto = CreateDrugDTO.fromRequest(req);
      const manufacturerId = req.user?.pharmaCompanyId || req.pharmaCompany?._id?.toString();

      if (!manufacturerId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có nhà sản xuất mới có thể thêm thuốc",
        });
      }

      const drug = await this._drugService.createDrug(dto, manufacturerId);

      return res.status(201).json({
        success: true,
        message: "Thêm thông tin thuốc thành công",
        data: {
          id: drug.id,
          tradeName: drug.drugName,
          genericName: drug.genericName,
          atcCode: drug.atcCode,
          manufacturerId: drug.manufacturerId,
          status: drug.status,
        },
      });
    } catch (error) {
      if (error.message && (error.message.includes("đã tồn tại") || error.message.includes("là bắt buộc"))) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi thêm thuốc:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi thêm thuốc",
        error: error.message,
      });
    }
  }

  async getDrugById(req, res) {
    try {
      const { drugId } = req.params;
      const manufacturerId = req.user?.pharmaCompanyId || req.pharmaCompany?._id?.toString();

      if (!manufacturerId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có nhà sản xuất mới có thể xem thuốc",
        });
      }

      const drug = await this._drugService.getDrugById(drugId, manufacturerId);

      return res.status(200).json({
        success: true,
        data: {
          id: drug.id,
          tradeName: drug.drugName,
          genericName: drug.genericName,
          atcCode: drug.atcCode,
          dosageForm: drug.dosageForm,
          strength: drug.strength,
          route: drug.route,
          packaging: drug.packaging,
          storage: drug.storage,
          warnings: drug.warnings,
          activeIngredients: drug.activeIngredients,
          status: drug.status,
          manufacturerId: drug.manufacturerId,
          createdAt: drug.createdAt,
          updatedAt: drug.updatedAt,
        },
      });
    } catch (error) {
      if (error instanceof DrugNotFoundException) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message && error.message.includes("không có quyền")) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi lấy thông tin thuốc:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thông tin thuốc",
        error: error.message,
      });
    }
  }

  async getDrugs(req, res) {
    try {
      const manufacturerId = req.user?.pharmaCompanyId || req.pharmaCompany?._id?.toString();

      if (!manufacturerId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có nhà sản xuất mới có thể xem danh sách thuốc",
        });
      }

      const filters = {
        status: req.query.status,
        search: req.query.search,
      };

      const drugs = await this._drugService.getDrugs(manufacturerId, filters);

      return res.status(200).json({
        success: true,
        data: drugs.map(drug => ({
          id: drug.id,
          tradeName: drug.drugName,
          genericName: drug.genericName,
          atcCode: drug.atcCode,
          dosageForm: drug.dosageForm,
          strength: drug.strength,
          status: drug.status,
          manufacturerId: drug.manufacturerId,
          createdAt: drug.createdAt,
          updatedAt: drug.updatedAt,
        })),
        count: drugs.length,
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

  async updateDrug(req, res) {
    try {
      const { drugId } = req.params;
      const dto = UpdateDrugDTO.fromRequest(req);
      const manufacturerId = req.user?.pharmaCompanyId || req.pharmaCompany?._id?.toString();

      if (!manufacturerId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có nhà sản xuất mới có thể cập nhật thuốc",
        });
      }

      if (!dto.hasUpdates()) {
        return res.status(400).json({
          success: false,
          message: "Không có thông tin nào để cập nhật",
        });
      }

      const drug = await this._drugService.updateDrug(drugId, dto, manufacturerId);

      return res.status(200).json({
        success: true,
        message: "Cập nhật thông tin thuốc thành công",
        data: {
          id: drug.id,
          tradeName: drug.drugName,
          genericName: drug.genericName,
          atcCode: drug.atcCode,
          status: drug.status,
          updatedAt: drug.updatedAt,
        },
      });
    } catch (error) {
      if (error instanceof DrugNotFoundException) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message && error.message.includes("không có quyền")) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi cập nhật thuốc:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật thuốc",
        error: error.message,
      });
    }
  }

  async deleteDrug(req, res) {
    try {
      const { drugId } = req.params;
      const manufacturerId = req.user?.pharmaCompanyId || req.pharmaCompany?._id?.toString();

      if (!manufacturerId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có nhà sản xuất mới có thể xóa thuốc",
        });
      }

      await this._drugService.deleteDrug(drugId, manufacturerId);

      return res.status(200).json({
        success: true,
        message: "Xóa thuốc thành công",
      });
    } catch (error) {
      if (error instanceof DrugNotFoundException) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message && error.message.includes("không có quyền")) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi xóa thuốc:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa thuốc",
        error: error.message,
      });
    }
  }

  async searchByATCCode(req, res) {
    try {
      const { atcCode } = req.query;
      const manufacturerId = req.user?.pharmaCompanyId || req.pharmaCompany?._id?.toString();

      if (!atcCode) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp ATC code",
        });
      }

      if (!manufacturerId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có nhà sản xuất mới có thể tìm kiếm thuốc",
        });
      }

      const drug = await this._drugService.searchByATCCode(atcCode, manufacturerId);

      return res.status(200).json({
        success: true,
        data: {
          id: drug.id,
          tradeName: drug.drugName,
          genericName: drug.genericName,
          atcCode: drug.atcCode,
          status: drug.status,
        },
      });
    } catch (error) {
      if (error instanceof DrugNotFoundException) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message && error.message.includes("không có quyền")) {
        return res.status(403).json({
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
}

