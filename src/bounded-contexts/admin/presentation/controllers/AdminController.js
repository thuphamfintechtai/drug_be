import { GetRegistrationStatisticsDTO } from "../../application/dto/GetRegistrationStatisticsDTO.js";
import { RetryBlockchainRegistrationDTO } from "../../application/dto/RetryBlockchainRegistrationDTO.js";
import { GetSystemStatisticsDTO } from "../../application/dto/GetSystemStatisticsDTO.js";
import { GetAllDrugsDTO } from "../../application/dto/GetAllDrugsDTO.js";
import { GetDrugDetailsDTO } from "../../application/dto/GetDrugDetailsDTO.js";
import { GetSupplyChainHistoryDTO } from "../../application/dto/GetSupplyChainHistoryDTO.js";
import { GetDistributionHistoryDTO } from "../../application/dto/GetDistributionHistoryDTO.js";
import { GetBatchListDTO } from "../../application/dto/GetBatchListDTO.js";
import { GetBatchJourneyDTO } from "../../application/dto/GetBatchJourneyDTO.js";
import { GetNFTJourneyDTO } from "../../application/dto/GetNFTJourneyDTO.js";

export class AdminController {
  constructor(adminService) {
    this._adminService = adminService;
  }

  async getRegistrationStatistics(req, res) {
    try {
      const dto = GetRegistrationStatisticsDTO.fromRequest(req);
      dto.validate();

      const result = await this._adminService.getRegistrationStatistics(dto);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Lỗi khi lấy thống kê đăng ký:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê đăng ký",
        error: error.message,
      });
    }
  }

  async retryBlockchainRegistration(req, res) {
    try {
      const dto = RetryBlockchainRegistrationDTO.fromRequest(req);
      const adminId = req.user?._id?.toString();

      if (!adminId) {
        return res.status(403).json({
          success: false,
          message: "Chỉ có admin mới có thể retry blockchain registration",
        });
      }

      dto.validate();

      const result = await this._adminService.retryBlockchainRegistration(dto, adminId);

      return res.status(200).json({
        success: true,
        message: "Retry blockchain registration thành công",
        data: result,
      });
    } catch (error) {
      if (error.message && (error.message.includes("không tìm thấy") || error.message.includes("không ở trạng thái") || error.message.includes("Thiếu thông tin"))) {
        return res.status(error.message.includes("không tìm thấy") ? 404 : 400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi retry blockchain registration:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi retry blockchain registration",
        error: error.message,
      });
    }
  }

  async getSystemStatistics(req, res) {
    try {
      const dto = GetSystemStatisticsDTO.fromRequest(req);
      dto.validate();

      const result = await this._adminService.getSystemStatistics(dto);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Lỗi khi lấy thống kê hệ thống:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê hệ thống",
        error: error.message,
      });
    }
  }

  async getAllDrugs(req, res) {
    try {
      const dto = GetAllDrugsDTO.fromRequest(req);
      dto.validate();

      const result = await this._adminService.getAllDrugs(dto);

      return res.status(200).json({
        success: true,
        data: result.drugs,
        pagination: result.pagination,
      });
    } catch (error) {
      if (error.message && (error.message.includes("phải lớn hơn") || error.message.includes("phải từ"))) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi lấy danh sách thuốc:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách thuốc",
        error: error.message,
      });
    }
  }

  async getDrugDetails(req, res) {
    try {
      const dto = GetDrugDetailsDTO.fromRequest(req);
      dto.validate();

      const result = await this._adminService.getDrugDetails(dto);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message && error.message.includes("không tìm thấy")) {
        return res.status(404).json({
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

      console.error("Lỗi khi lấy chi tiết thuốc:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy chi tiết thuốc",
        error: error.message,
      });
    }
  }

  async getDrugStatistics(req, res) {
    try {
      const result = await this._adminService.getDrugStatistics();

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Lỗi khi lấy thống kê thuốc:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê thuốc",
        error: error.message,
      });
    }
  }

  async getSupplyChainHistory(req, res) {
    try {
      const dto = GetSupplyChainHistoryDTO.fromRequest(req);
      dto.validate();

      const result = await this._adminService.getSupplyChainHistory(dto);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message && (error.message.includes("phải lớn hơn") || error.message.includes("phải từ"))) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi lấy lịch sử supply chain:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy lịch sử supply chain",
        error: error.message,
      });
    }
  }

  async getDistributionHistory(req, res) {
    try {
      const dto = GetDistributionHistoryDTO.fromRequest(req);
      dto.validate();

      const result = await this._adminService.getDistributionHistory(dto);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message && (error.message.includes("phải lớn hơn") || error.message.includes("phải từ"))) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi lấy lịch sử phân phối:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy lịch sử phân phối",
        error: error.message,
      });
    }
  }

  async getBatchList(req, res) {
    try {
      const dto = GetBatchListDTO.fromRequest(req);
      dto.validate();

      const result = await this._adminService.getBatchList(dto);

      return res.status(200).json({
        success: true,
        data: result.batches,
        pagination: result.pagination,
      });
    } catch (error) {
      if (error.message && (error.message.includes("phải lớn hơn") || error.message.includes("phải từ"))) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi lấy danh sách batch:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách batch",
        error: error.message,
      });
    }
  }

  async getBatchJourney(req, res) {
    try {
      const dto = GetBatchJourneyDTO.fromRequest(req);
      dto.validate();

      const result = await this._adminService.getBatchJourney(dto);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message && error.message.includes("không tìm thấy")) {
        return res.status(404).json({
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

      console.error("Lỗi khi lấy batch journey:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy batch journey",
        error: error.message,
      });
    }
  }

  async getNFTJourney(req, res) {
    try {
      const dto = GetNFTJourneyDTO.fromRequest(req);
      dto.validate();

      const result = await this._adminService.getNFTJourney(dto);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message && error.message.includes("không tìm thấy")) {
        return res.status(404).json({
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

      console.error("Lỗi khi lấy NFT journey:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy NFT journey",
        error: error.message,
      });
    }
  }
}

