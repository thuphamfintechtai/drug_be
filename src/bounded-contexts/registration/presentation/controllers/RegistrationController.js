import { SubmitRegistrationDTO } from "../../application/dto/SubmitRegistrationDTO.js";
import { ApproveRegistrationDTO } from "../../application/dto/ApproveRegistrationDTO.js";
import { RegistrationRequestNotFoundException } from "../../domain/exceptions/RegistrationRequestNotFoundException.js";
import { DuplicateLicenseNumberException } from "../../domain/exceptions/DuplicateLicenseNumberException.js";

export class RegistrationController {
  constructor(registrationApplicationService) {
    this._service = registrationApplicationService;
  }

  async submitPharmaCompanyRegistration(req, res) {
    try {
      const dto = SubmitRegistrationDTO.fromRequest(req, "pharma_company");
      const result = await this._service.submitPharmaCompanyRegistration(dto);

      return res.status(201).json({
        success: true,
        message: "Đăng ký nhà sản xuất thành công. Yêu cầu của bạn đang chờ phê duyệt",
        data: result,
      });
    } catch (error) {
      if (error instanceof DuplicateLicenseNumberException) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message && (error.message.includes("đã tồn tại") || error.message.includes("là bắt buộc"))) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi đăng ký nhà sản xuất:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi đăng ký nhà sản xuất",
        error: error.message,
      });
    }
  }

  async submitDistributorRegistration(req, res) {
    try {
      const dto = SubmitRegistrationDTO.fromRequest(req, "distributor");
      const result = await this._service.submitDistributorRegistration(dto);

      return res.status(201).json({
        success: true,
        message: "Đăng ký nhà phân phối thành công. Yêu cầu của bạn đang chờ phê duyệt",
        data: result,
      });
    } catch (error) {
      if (error instanceof DuplicateLicenseNumberException) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message && (error.message.includes("đã tồn tại") || error.message.includes("là bắt buộc"))) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi đăng ký nhà phân phối:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi đăng ký nhà phân phối",
        error: error.message,
      });
    }
  }

  async submitPharmacyRegistration(req, res) {
    try {
      const dto = SubmitRegistrationDTO.fromRequest(req, "pharmacy");
      const result = await this._service.submitPharmacyRegistration(dto);

      return res.status(201).json({
        success: true,
        message: "Đăng ký nhà thuốc thành công. Yêu cầu của bạn đang chờ phê duyệt",
        data: result,
      });
    } catch (error) {
      if (error instanceof DuplicateLicenseNumberException) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message && (error.message.includes("đã tồn tại") || error.message.includes("là bắt buộc"))) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi đăng ký nhà thuốc:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi đăng ký nhà thuốc",
        error: error.message,
      });
    }
  }

  async approveRegistration(req, res) {
    try {
      const dto = ApproveRegistrationDTO.fromRequest(req);
      const result = await this._service.approveRegistration(dto);

      return res.status(200).json({
        success: true,
        message: "Phê duyệt và đăng ký trên blockchain thành công",
        data: result,
      });
    } catch (error) {
      if (error instanceof RegistrationRequestNotFoundException) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message && error.message.includes("đã được xử lý")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message && error.message.includes("blockchain")) {
        return res.status(500).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi phê duyệt đăng ký:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi phê duyệt đăng ký",
        error: error.message,
      });
    }
  }

  async rejectRegistration(req, res) {
    try {
      const dto = ApproveRegistrationDTO.fromRequest(req);
      const { rejectionReason } = req.body;

      const result = await this._service.rejectRegistration(dto, rejectionReason || "");

      return res.status(200).json({
        success: true,
        message: "Yêu cầu đăng ký đã bị từ chối",
        data: result,
      });
    } catch (error) {
      if (error instanceof RegistrationRequestNotFoundException) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi từ chối đăng ký:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi từ chối đăng ký",
        error: error.message,
      });
    }
  }

  async getRegistrationRequests(req, res) {
    try {
      const filters = {
        status: req.query.status,
        role: req.query.role,
      };

      const requests = await this._service.getRegistrationRequests(filters);

      return res.status(200).json({
        success: true,
        data: requests.map(req => {
          const result = {
            _id: req.id,
            user: req._populatedUser || req.userId,
            role: req.role,
            status: req.status,
            companyInfo: req.companyInfo ? {
              name: req.companyInfo.name,
              licenseNo: req.companyInfo.licenseNo,
              taxCode: req.companyInfo.taxCode,
              address: req.companyInfo.address,
              country: req.companyInfo.country,
              contactEmail: req.companyInfo.contactEmail,
              contactPhone: req.companyInfo.contactPhone,
              gmpCertNo: req.companyInfo.gmpCertNo,
            } : null,
            reviewedBy: req._populatedReviewedBy || req.reviewedBy || null,
            reviewedAt: req.reviewedAt || null,
            rejectionReason: req.rejectionReason || null,
            contractAddress: req.contractAddress || null,
            transactionHash: req.transactionHash || null,
            blockchainRetryCount: req.blockchainRetryCount || 0,
            blockchainLastAttempt: req.blockchainLastAttempt || null,
            createdAt: req._createdAt || req.createdAt,
            updatedAt: req._updatedAt || req.updatedAt,
          };

          // Convert companyInfo to plain object if it's an entity
          if (req.companyInfo && typeof req.companyInfo === 'object' && 'name' in req.companyInfo) {
            // Already handled above
          }

          return result;
        }),
      });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách yêu cầu:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách yêu cầu",
        error: error.message,
      });
    }
  }

  async getRegistrationRequestById(req, res) {
    try {
      const { requestId } = req.params;

      const request = await this._service.getRegistrationRequestById(requestId);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy yêu cầu đăng ký",
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          _id: request.id,
          user: request._populatedUser || request.userId,
          role: request.role,
          status: request.status,
          companyInfo: request.companyInfo ? {
            name: request.companyInfo.name,
            licenseNo: request.companyInfo.licenseNo,
            taxCode: request.companyInfo.taxCode,
            address: request.companyInfo.address,
            country: request.companyInfo.country,
            contactEmail: request.companyInfo.contactEmail,
            contactPhone: request.companyInfo.contactPhone,
            gmpCertNo: request.companyInfo.gmpCertNo,
          } : null,
          reviewedBy: request._populatedReviewedBy || request.reviewedBy || null,
          reviewedAt: request.reviewedAt || null,
          rejectionReason: request.rejectionReason || null,
          contractAddress: request.contractAddress || null,
          transactionHash: request.transactionHash || null,
          blockchainRetryCount: request.blockchainRetryCount || 0,
          blockchainLastAttempt: request.blockchainLastAttempt || null,
          createdAt: request._createdAt || request.createdAt,
          updatedAt: request._updatedAt || request.updatedAt,
        },
      });
    } catch (error) {
      if (error.message && error.message.includes("không tìm thấy")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Lỗi khi lấy thông tin yêu cầu:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thông tin yêu cầu",
        error: error.message,
      });
    }
  }
}

