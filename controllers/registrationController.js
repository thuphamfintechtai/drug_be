import User from "../models/User.js";
import RegistrationRequest from "../models/RegistrationRequest.js";
import PharmaCompany from "../models/PharmaCompany.js";
import Distributor from "../models/Distributor.js";
import Pharmacy from "../models/Pharmacy.js";
import {
  addManufacturerToBlockchain,
  addDistributorToBlockchain,
  addPharmacyToBlockchain,
} from "../services/blockchainService.js";
import bcrypt from "bcryptjs";

// Đăng ký tài khoản người dùng thông thường
export const registerUser = async (req, res) => {
  try {
    const { username, email, password, fullName, phone, country, address } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ thông tin: username, email, password",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email hoặc username đã tồn tại",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      fullName: fullName || "",
      phone: phone || "",
      country: country || "",
      address: address || "",
      role: "user",
      status: "active",
    });

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(201).json({
      success: true,
      message: "Đăng ký tài khoản người dùng thành công",
      data: userResponse,
    });
  } catch (error) {
    console.error("Lỗi khi đăng ký người dùng:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi đăng ký người dùng",
      error: error.message,
    });
  }
};

// Đăng ký tài khoản admin (chỉ admin mới có quyền)
export const registerAdmin = async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ thông tin: username, email, password",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email hoặc username đã tồn tại",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      fullName: fullName || "",
      role: "system_admin",
      isAdmin: true,
      status: "active",
    });

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(201).json({
      success: true,
      message: "Đăng ký tài khoản admin thành công",
      data: userResponse,
    });
  } catch (error) {
    console.error("Lỗi khi đăng ký admin:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi đăng ký admin",
      error: error.message,
    });
  }
};

// Đăng ký nhà sản xuất, nhà phân phối, nhà thuốc
export const registerBusiness = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      fullName,
      role, // pharma_company, distributor, pharmacy
      walletAddress,
      taxCode,
      licenseNo,
      companyInfo,
    } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ thông tin: username, email, password",
      });
    }

    if (!["pharma_company", "distributor", "pharmacy"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role không hợp lệ. Chỉ chấp nhận: pharma_company, distributor, pharmacy",
      });
    }

    if (!walletAddress || !taxCode || !licenseNo) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ thông tin: walletAddress, taxCode, licenseNo",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email hoặc username đã tồn tại",
      });
    }

    // Check if business info already exists
    let existingBusiness;
    if (role === "pharma_company") {
      existingBusiness = await PharmaCompany.findOne({
        $or: [{ licenseNo }, { taxCode }],
      });
    } else if (role === "distributor") {
      existingBusiness = await Distributor.findOne({
        $or: [{ licenseNo }, { taxCode }],
      });
    } else if (role === "pharmacy") {
      existingBusiness = await Pharmacy.findOne({
        $or: [{ licenseNo }, { taxCode }],
      });
    }

    if (existingBusiness) {
      return res.status(400).json({
        success: false,
        message: "LicenseNo hoặc TaxCode đã được sử dụng",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      fullName: fullName || "",
      role,
      walletAddress,
      status: "pending", // Trạng thái pending chờ phê duyệt
    });

    await user.save();

    // Create registration request
    const registrationRequest = new RegistrationRequest({
      user: user._id,
      role,
      status: "pending",
      companyInfo: companyInfo || {
        licenseNo,
        taxCode,
        ...companyInfo,
      },
    });

    await registrationRequest.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(201).json({
      success: true,
      message: "Đăng ký thành công. Yêu cầu của bạn đang chờ phê duyệt",
      data: {
        user: userResponse,
        registrationRequest: {
          id: registrationRequest._id,
          status: registrationRequest.status,
        },
      },
    });
  } catch (error) {
    console.error("Lỗi khi đăng ký business:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi đăng ký business",
      error: error.message,
    });
  }
};

// Phê duyệt đăng ký và gửi lên blockchain (chỉ admin)
export const approveRegistration = async (req, res) => {
  try {
    const { requestId } = req.params;
    const adminId = req.user?.id; // Từ middleware auth

    // Find registration request
    const registrationRequest = await RegistrationRequest.findById(requestId).populate("user");

    if (!registrationRequest) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy yêu cầu đăng ký",
      });
    }

    if (registrationRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Yêu cầu này đã được xử lý với trạng thái: ${registrationRequest.status}`,
      });
    }

    const user = registrationRequest.user;
    const { role, companyInfo } = registrationRequest;

    // Validate required info
    if (!user.walletAddress || !companyInfo?.taxCode || !companyInfo?.licenseNo) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin cần thiết: walletAddress, taxCode, licenseNo",
      });
    }

    // Update request status to approved_pending_blockchain
    registrationRequest.status = "approved_pending_blockchain";
    registrationRequest.reviewedBy = adminId;
    registrationRequest.reviewedAt = new Date();
    await registrationRequest.save();

    // Try to add to blockchain
    let blockchainResult;
    try {
      if (role === "pharma_company") {
        blockchainResult = await addManufacturerToBlockchain(
          user.walletAddress,
          companyInfo.taxCode,
          companyInfo.licenseNo
        );
      } else if (role === "distributor") {
        blockchainResult = await addDistributorToBlockchain(
          user.walletAddress,
          companyInfo.taxCode,
          companyInfo.licenseNo
        );
      } else if (role === "pharmacy") {
        blockchainResult = await addPharmacyToBlockchain(
          user.walletAddress,
          companyInfo.taxCode,
          companyInfo.licenseNo
        );
      }

      // Update registration request with blockchain info
      registrationRequest.status = "approved";
      registrationRequest.contractAddress = blockchainResult.receipt.to; // Contract address
      registrationRequest.transactionHash = blockchainResult.transactionHash;

      // Create business profile
      let businessProfile;
      if (role === "pharma_company") {
        businessProfile = new PharmaCompany({
          user: user._id,
          name: companyInfo.name || user.fullName || "",
          licenseNo: companyInfo.licenseNo,
          taxCode: companyInfo.taxCode,
          gmpCertNo: companyInfo.gmpCertNo || "",
          country: companyInfo.country || user.country || "",
          address: companyInfo.address || user.address || "",
          contactEmail: companyInfo.contactEmail || user.email || "",
          contactPhone: companyInfo.contactPhone || user.phone || "",
          walletAddress: user.walletAddress,
          status: "active",
        });
      } else if (role === "distributor") {
        businessProfile = new Distributor({
          user: user._id,
          name: companyInfo.name || user.fullName || "",
          licenseNo: companyInfo.licenseNo,
          taxCode: companyInfo.taxCode,
          address: companyInfo.address || user.address || "",
          country: companyInfo.country || user.country || "",
          contactEmail: companyInfo.contactEmail || user.email || "",
          contactPhone: companyInfo.contactPhone || user.phone || "",
          walletAddress: user.walletAddress,
          status: "active",
        });
      } else if (role === "pharmacy") {
        businessProfile = new Pharmacy({
          user: user._id,
          name: companyInfo.name || user.fullName || "",
          licenseNo: companyInfo.licenseNo,
          taxCode: companyInfo.taxCode,
          address: companyInfo.address || user.address || "",
          country: companyInfo.country || user.country || "",
          contactEmail: companyInfo.contactEmail || user.email || "",
          contactPhone: companyInfo.contactPhone || user.phone || "",
          walletAddress: user.walletAddress,
          status: "active",
        });
      }

      await businessProfile.save();

      // Update user
      user.status = "active";
      if (role === "pharma_company") {
        user.pharmaCompany = businessProfile._id;
      } else if (role === "distributor") {
        user.distributor = businessProfile._id;
      } else if (role === "pharmacy") {
        user.pharmacy = businessProfile._id;
      }
      await user.save();

      await registrationRequest.save();

      return res.status(200).json({
        success: true,
        message: "Phê duyệt và đăng ký trên blockchain thành công",
        data: {
          registrationRequest: {
            id: registrationRequest._id,
            status: registrationRequest.status,
            transactionHash: registrationRequest.transactionHash,
          },
          businessProfile: {
            id: businessProfile._id,
            name: businessProfile.name,
          },
        },
      });
    } catch (blockchainError) {
      console.error("Lỗi khi gửi lên blockchain:", blockchainError);

      // Update request with error
      registrationRequest.status = "blockchain_failed";
      registrationRequest.blockchainRetryCount += 1;
      registrationRequest.blockchainLastAttempt = new Date();
      await registrationRequest.save();

      return res.status(500).json({
        success: false,
        message: "Phê duyệt thành công nhưng gặp lỗi khi gửi lên blockchain",
        error: blockchainError.message,
        registrationRequestId: registrationRequest._id,
      });
    }
  } catch (error) {
    console.error("Lỗi khi phê duyệt đăng ký:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi phê duyệt đăng ký",
      error: error.message,
    });
  }
};

// Từ chối đăng ký (chỉ admin)
export const rejectRegistration = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rejectionReason } = req.body;
    const adminId = req.user?.id;

    const registrationRequest = await RegistrationRequest.findById(requestId);

    if (!registrationRequest) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy yêu cầu đăng ký",
      });
    }

    if (registrationRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Yêu cầu này đã được xử lý với trạng thái: ${registrationRequest.status}`,
      });
    }

    registrationRequest.status = "rejected";
    registrationRequest.reviewedBy = adminId;
    registrationRequest.reviewedAt = new Date();
    registrationRequest.rejectionReason = rejectionReason || "";

    await registrationRequest.save();

    // Update user status
    const user = await User.findById(registrationRequest.user);
    if (user) {
      user.status = "inactive";
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: "Yêu cầu đăng ký đã bị từ chối",
      data: {
        id: registrationRequest._id,
        status: registrationRequest.status,
        rejectionReason: registrationRequest.rejectionReason,
      },
    });
  } catch (error) {
    console.error("Lỗi khi từ chối đăng ký:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi từ chối đăng ký",
      error: error.message,
    });
  }
};

// Lấy danh sách yêu cầu đăng ký (admin)
export const getRegistrationRequests = async (req, res) => {
  try {
    const { status, role } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (role) {
      filter.role = role;
    }

    const requests = await RegistrationRequest.find(filter)
      .populate("user", "username email fullName walletAddress")
      .populate("reviewedBy", "username email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách yêu cầu:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách yêu cầu",
      error: error.message,
    });
  }
};

// Lấy thông tin yêu cầu đăng ký theo ID
export const getRegistrationRequestById = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await RegistrationRequest.findById(requestId)
      .populate("user", "username email fullName walletAddress phone country address")
      .populate("reviewedBy", "username email");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy yêu cầu đăng ký",
      });
    }

    return res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin yêu cầu:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông tin yêu cầu",
      error: error.message,
    });
  }
};

