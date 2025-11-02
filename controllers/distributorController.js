import ManufacturerInvoice from "../models/ManufacturerInvoice.js";
import ProofOfDistribution from "../models/ProofOfDistribution.js";
import CommercialInvoice from "../models/CommercialInvoice.js";
import ProofOfPharmacy from "../models/ProofOfPharmacy.js";
import Distributor from "../models/Distributor.js";
import DrugInfo from "../models/DrugInfo.js";
import NFTInfo from "../models/NFTInfo.js";
import Pharmacy from "../models/Pharmacy.js";
import User from "../models/User.js";
import { getTrackingHistory } from "../services/blockchainService.js";

// ============ QUẢN LÝ ĐƠN HÀNG TỪ PHARMA COMPANY ============

// Xem danh sách đơn hàng từ pharma company
export const getInvoicesFromManufacturer = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "distributor") {
      return res.status(403).json({
        success: false,
        message: "Chỉ có distributor mới có thể xem đơn hàng",
      });
    }

    const { page = 1, limit = 10, status, search } = req.query;

    const filter = { toDistributor: user._id };

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const invoices = await ManufacturerInvoice.find(filter)
      .populate("fromManufacturer", "username email fullName")
      .populate("proofOfProduction")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await ManufacturerInvoice.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: {
        invoices,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đơn hàng:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách đơn hàng",
      error: error.message,
    });
  }
};

// Xác nhận nhận hàng từ pharma company (Bước 1 và 2)
// Bước 1: Distributor xác nhận đã nhận hàng
// Bước 2: Lưu vào database với trạng thái "Đang chờ Manufacture xác nhận"
export const confirmReceipt = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "distributor") {
      return res.status(403).json({
        success: false,
        message: "Chỉ có distributor mới có thể xác nhận nhận hàng",
      });
    }

    const {
      invoiceId,
      receivedBy,
      deliveryAddress,
      shippingInfo,
      notes,
      distributionDate,
      distributedQuantity,
    } = req.body;

    if (!invoiceId) {
      return res.status(400).json({
        success: false,
        message: "invoiceId là bắt buộc",
      });
    }

    // Tìm invoice
    const invoice = await ManufacturerInvoice.findById(invoiceId)
      .populate("fromManufacturer", "username email fullName")
      .populate("toDistributor", "username email fullName");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy invoice",
      });
    }

    // Kiểm tra invoice thuộc về distributor này
    const toDistributorId = invoice.toDistributor._id || invoice.toDistributor;
    if (toDistributorId.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xác nhận invoice này",
      });
    }

    // Kiểm tra invoice đã được sent chưa (manufacturer đã chuyển NFT)
    if (invoice.status !== "sent") {
      return res.status(400).json({
        success: false,
        message: `Invoice chưa được gửi. Trạng thái hiện tại: ${invoice.status}`,
      });
    }

    // Tìm hoặc tạo Proof of Distribution
    let proofOfDistribution = await ProofOfDistribution.findOne({
      manufacturerInvoice: invoiceId,
    });

    if (proofOfDistribution) {
      proofOfDistribution.status = "confirmed"; // Đang chờ Manufacture xác nhận
      if (receivedBy) proofOfDistribution.receivedBy = receivedBy;
      if (deliveryAddress) proofOfDistribution.deliveryAddress = deliveryAddress;
      if (shippingInfo) proofOfDistribution.shippingInfo = shippingInfo;
      if (notes) proofOfDistribution.notes = notes;
      if (distributionDate) proofOfDistribution.distributionDate = new Date(distributionDate);
      if (distributedQuantity) proofOfDistribution.distributedQuantity = distributedQuantity;
    } else {
      // Tạo mới proof of distribution
      proofOfDistribution = new ProofOfDistribution({
        fromManufacturer: invoice.fromManufacturer._id,
        toDistributor: user._id,
        manufacturerInvoice: invoiceId,
        status: "confirmed", // Đang chờ Manufacture xác nhận
        receivedBy,
        deliveryAddress,
        shippingInfo,
        notes,
        distributionDate: distributionDate ? new Date(distributionDate) : new Date(),
        distributedQuantity: distributedQuantity || invoice.quantity,
      });
    }

    await proofOfDistribution.save();

    return res.status(200).json({
      success: true,
      message: "Đã xác nhận nhận hàng thành công. Đang chờ Manufacturer xác nhận quyền NFT.",
      data: {
        proofOfDistribution,
        invoice,
      },
    });
  } catch (error) {
    console.error("Lỗi khi xác nhận nhận hàng:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xác nhận nhận hàng",
      error: error.message,
    });
  }
};

// ============ CHUYỂN TIẾP CHO PHARMACY ============

// Bước 1 & 2: Distributor chọn NFT và Pharmacy để chuyển, lưu vào database
export const transferToPharmacy = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "distributor") {
      return res.status(403).json({
        success: false,
        message: "Chỉ có distributor mới có thể chuyển giao cho pharmacy",
      });
    }

    if (!user.walletAddress) {
      return res.status(400).json({
        success: false,
        message: "User chưa có wallet address",
      });
    }

    const {
      pharmacyId,
      tokenIds,
      amounts,
      invoiceNumber,
      invoiceDate,
      quantity,
      unitPrice,
      totalAmount,
      vatRate,
      vatAmount,
      finalAmount,
      notes,
      deliveryAddress,
    } = req.body;

    if (!pharmacyId || !tokenIds || !amounts) {
      return res.status(400).json({
        success: false,
        message: "pharmacyId, tokenIds và amounts là bắt buộc",
      });
    }

    if (tokenIds.length !== amounts.length) {
      return res.status(400).json({
        success: false,
        message: "Số lượng tokenIds phải bằng số lượng amounts",
      });
    }

    // Tìm pharmacy
    const pharmacy = await Pharmacy.findById(pharmacyId).populate("user");
    if (!pharmacy || !pharmacy.user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy pharmacy",
      });
    }

    if (!pharmacy.user.walletAddress) {
      return res.status(400).json({
        success: false,
        message: "Pharmacy chưa có wallet address",
      });
    }

    // Kiểm tra quyền sở hữu NFT (NFT phải thuộc về distributor và đã được transferred)
    const nftInfos = await NFTInfo.find({
      tokenId: { $in: tokenIds },
      owner: user._id,
      status: "transferred",
    });

    if (nftInfos.length !== tokenIds.length) {
      return res.status(400).json({
        success: false,
        message: "Một số NFT không thuộc về bạn hoặc không ở trạng thái transferred",
      });
    }

    // Lấy drug từ NFT đầu tiên
    const drugId = nftInfos[0].drug;

    // Tạo Commercial Invoice với trạng thái draft (chờ frontend gọi smart contract)
    const commercialInvoice = new CommercialInvoice({
      fromDistributor: user._id,
      toPharmacy: pharmacy.user._id,
      drug: drugId,
      invoiceNumber: invoiceNumber || `CI-${Date.now()}`,
      invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
      quantity: quantity || amounts.reduce((sum, amt) => sum + amt, 0),
      unitPrice,
      totalAmount,
      vatRate,
      vatAmount,
      finalAmount,
      notes,
      deliveryAddress,
      status: "draft", // Chờ frontend gọi smart contract
    });

    await commercialInvoice.save();

    // Tạo Proof of Pharmacy với trạng thái pending
    const proofOfPharmacy = new ProofOfPharmacy({
      fromDistributor: user._id,
      toPharmacy: pharmacy.user._id,
      drug: drugId,
      receiptDate: invoiceDate ? new Date(invoiceDate) : new Date(),
      receivedQuantity: quantity || amounts.reduce((sum, amt) => sum + amt, 0),
      status: "pending", // Đang chờ
      commercialInvoice: commercialInvoice._id,
    });

    await proofOfPharmacy.save();

    return res.status(200).json({
      success: true,
      message: "Đã lưu invoice vào database với trạng thái draft. Vui lòng gọi smart contract để chuyển NFT.",
      data: {
        commercialInvoice,
        proofOfPharmacy,
        pharmacyAddress: pharmacy.user.walletAddress,
        tokenIds,
        amounts,
      },
    });
  } catch (error) {
    console.error("Lỗi khi chuyển giao cho pharmacy:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi chuyển giao cho pharmacy",
      error: error.message,
    });
  }
};

// Lưu transaction hash sau khi transfer NFT thành công trên smart contract
export const saveTransferToPharmacyTransaction = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "distributor") {
      return res.status(403).json({
        success: false,
        message: "Chỉ có distributor mới có thể lưu transaction transfer",
      });
    }

    const {
      invoiceId,
      transactionHash,
      tokenIds,
    } = req.body;

    if (!invoiceId || !transactionHash || !tokenIds) {
      return res.status(400).json({
        success: false,
        message: "invoiceId, transactionHash và tokenIds là bắt buộc",
      });
    }

    // Tìm invoice
    const commercialInvoice = await CommercialInvoice.findById(invoiceId);

    if (!commercialInvoice) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy invoice",
      });
    }

    // Kiểm tra invoice thuộc về user này
    if (commercialInvoice.fromDistributor.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền cập nhật invoice này",
      });
    }

    // Cập nhật invoice
    commercialInvoice.status = "sent";
    commercialInvoice.chainTxHash = transactionHash;
    await commercialInvoice.save();

    // Cập nhật trạng thái NFT
    await NFTInfo.updateMany(
      { tokenId: { $in: tokenIds } },
      {
        $set: {
          status: "sold",
          owner: commercialInvoice.toPharmacy,
        },
      }
    );

    // Cập nhật Proof of Pharmacy
    const proofOfPharmacy = await ProofOfPharmacy.findOne({
      commercialInvoice: invoiceId,
    });

    if (proofOfPharmacy) {
      proofOfPharmacy.receiptTxHash = transactionHash;
      proofOfPharmacy.status = "received";
      await proofOfPharmacy.save();
    }

    return res.status(200).json({
      success: true,
      message: "Lưu transaction transfer thành công",
      data: {
        commercialInvoice,
        proofOfPharmacy,
        transactionHash,
        tokenIds,
      },
    });
  } catch (error) {
    console.error("Lỗi khi lưu transaction transfer:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lưu transaction transfer",
      error: error.message,
    });
  }
};

// ============ LỊCH SỬ PHÂN PHỐI ============

// Xem lịch sử phân phối thuốc
export const getDistributionHistory = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "distributor") {
      return res.status(403).json({
        success: false,
        message: "Chỉ có distributor mới có thể xem lịch sử phân phối",
      });
    }

    const { page = 1, limit = 10, status, search } = req.query;

    const filter = { toDistributor: user._id };

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const distributions = await ProofOfDistribution.find(filter)
      .populate("fromManufacturer", "username email fullName")
      .populate("manufacturerInvoice")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await ProofOfDistribution.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: {
        distributions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
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
};

// Xem lịch sử chuyển giao cho Pharmacy
export const getTransferToPharmacyHistory = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "distributor") {
      return res.status(403).json({
        success: false,
        message: "Chỉ có distributor mới có thể xem lịch sử chuyển giao",
      });
    }

    const { page = 1, limit = 10, status, search } = req.query;

    const filter = { fromDistributor: user._id };

    if (status) {
      filter.status = status;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const commercialInvoices = await CommercialInvoice.find(filter)
      .populate("toPharmacy", "username email fullName")
      .populate("drug", "tradeName atcCode")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await CommercialInvoice.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: {
        invoices: commercialInvoices,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử chuyển giao:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy lịch sử chuyển giao",
      error: error.message,
    });
  }
};

// ============ THỐNG KÊ ============

// Thống kê các trạng thái, đơn thuốc, lượt chuyển giao
export const getStatistics = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "distributor") {
      return res.status(403).json({
        success: false,
        message: "Chỉ có distributor mới có thể xem thống kê",
      });
    }

    // Thống kê đơn hàng từ manufacturer
    const totalInvoices = await ManufacturerInvoice.countDocuments({
      toDistributor: user._id,
    });

    const invoiceStatusStats = {
      pending: await ManufacturerInvoice.countDocuments({
        toDistributor: user._id,
        status: "pending",
      }),
      sent: await ManufacturerInvoice.countDocuments({
        toDistributor: user._id,
        status: "sent",
      }),
      paid: await ManufacturerInvoice.countDocuments({
        toDistributor: user._id,
        status: "paid",
      }),
    };

    // Thống kê lịch sử phân phối
    const totalDistributions = await ProofOfDistribution.countDocuments({
      toDistributor: user._id,
    });

    const distributionStatusStats = {
      pending: await ProofOfDistribution.countDocuments({
        toDistributor: user._id,
        status: "pending",
      }),
      in_transit: await ProofOfDistribution.countDocuments({
        toDistributor: user._id,
        status: "in_transit",
      }),
      delivered: await ProofOfDistribution.countDocuments({
        toDistributor: user._id,
        status: "delivered",
      }),
      confirmed: await ProofOfDistribution.countDocuments({
        toDistributor: user._id,
        status: "confirmed",
      }),
      rejected: await ProofOfDistribution.countDocuments({
        toDistributor: user._id,
        status: "rejected",
      }),
    };

    // Thống kê lượt chuyển giao cho Pharmacy
    const totalTransfersToPharmacy = await CommercialInvoice.countDocuments({
      fromDistributor: user._id,
    });

    const transferStatusStats = {
      draft: await CommercialInvoice.countDocuments({
        fromDistributor: user._id,
        status: "draft",
      }),
      sent: await CommercialInvoice.countDocuments({
        fromDistributor: user._id,
        status: "sent",
      }),
      paid: await CommercialInvoice.countDocuments({
        fromDistributor: user._id,
        status: "paid",
      }),
    };

    // Thống kê NFT
    const nfts = await NFTInfo.find({
      owner: user._id,
    });

    const nftStatusStats = {
      transferred: nfts.filter((nft) => nft.status === "transferred").length,
      sold: nfts.filter((nft) => nft.status === "sold").length,
    };

    return res.status(200).json({
      success: true,
      data: {
        invoices: {
          total: totalInvoices,
          byStatus: invoiceStatusStats,
        },
        distributions: {
          total: totalDistributions,
          byStatus: distributionStatusStats,
        },
        transfersToPharmacy: {
          total: totalTransfersToPharmacy,
          byStatus: transferStatusStats,
        },
        nfts: {
          total: nfts.length,
          byStatus: nftStatusStats,
        },
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê",
      error: error.message,
    });
  }
};

// ============ THEO DÕI HÀNH TRÌNH ============

// Theo dõi hành trình thuốc qua NFT ID
export const trackDrugByNFTId = async (req, res) => {
  try {
    const user = req.user;
    const { tokenId } = req.params;

    if (!tokenId) {
      return res.status(400).json({
        success: false,
        message: "tokenId là bắt buộc",
      });
    }

    // Tìm NFT
    const nft = await NFTInfo.findOne({ tokenId })
      .populate("drug", "tradeName atcCode genericName")
      .populate("owner", "username email fullName")
      .populate("proofOfProduction");

    if (!nft) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy NFT với tokenId này",
      });
    }

    // Lấy lịch sử từ blockchain
    let blockchainHistory = [];
    try {
      blockchainHistory = await getTrackingHistory(tokenId);
    } catch (error) {
      console.error("Lỗi khi lấy lịch sử blockchain:", error);
    }

    // Tìm các invoice liên quan
    const manufacturerInvoice = await ManufacturerInvoice.findOne({
      toDistributor: user._id,
    }).populate("fromManufacturer", "username email fullName");

    const commercialInvoice = await CommercialInvoice.findOne({
      fromDistributor: user._id,
    }).populate("toPharmacy", "username email fullName");

    return res.status(200).json({
      success: true,
      data: {
        nft,
        blockchainHistory,
        manufacturerInvoice,
        commercialInvoice,
      },
    });
  } catch (error) {
    console.error("Lỗi khi theo dõi hành trình:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi theo dõi hành trình",
      error: error.message,
    });
  }
};

// ============ QUẢN LÝ THUỐC ============

// Xem danh sách thuốc
export const getDrugs = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "distributor") {
      return res.status(403).json({
        success: false,
        message: "Chỉ có distributor mới có thể xem danh sách thuốc",
      });
    }

    const { page = 1, limit = 10, search, status } = req.query;

    const filter = { status: status || "active" };

    if (search) {
      filter.$or = [
        { tradeName: { $regex: search, $options: "i" } },
        { genericName: { $regex: search, $options: "i" } },
        { atcCode: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const drugs = await DrugInfo.find(filter)
      .populate("manufacturer", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await DrugInfo.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: {
        drugs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
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
};

// Tìm kiếm thuốc theo ATC code
export const searchDrugByATCCode = async (req, res) => {
  try {
    const user = req.user;
    const { atcCode } = req.query;

    if (user.role !== "distributor") {
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

    const drug = await DrugInfo.findOne({
      atcCode: { $regex: atcCode, $options: "i" },
    }).populate("manufacturer", "name");

    if (!drug) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thuốc với ATC code này",
      });
    }

    return res.status(200).json({
      success: true,
      data: drug,
    });
  } catch (error) {
    console.error("Lỗi khi tìm kiếm thuốc:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi tìm kiếm thuốc",
      error: error.message,
    });
  }
};

// Xem thông tin distributor (chỉ xem, không chỉnh sửa)
export const getDistributorInfo = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "distributor") {
      return res.status(403).json({
        success: false,
        message: "Chỉ có distributor mới có thể xem thông tin",
      });
    }

    const distributor = await Distributor.findOne({ user: user._id });

    if (!distributor) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin distributor",
      });
    }

    const userInfo = await User.findById(user._id).select("-password");

    return res.status(200).json({
      success: true,
      data: {
        user: userInfo,
        distributor,
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin distributor:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông tin distributor",
      error: error.message,
    });
  }
};

// Lấy danh sách pharmacies để chọn khi chuyển giao
export const getPharmacies = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "distributor") {
      return res.status(403).json({
        success: false,
        message: "Chỉ có distributor mới có thể xem danh sách pharmacies",
      });
    }

    const { page = 1, limit = 10, search, status = "active" } = req.query;

    const filter = { status };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { licenseNo: { $regex: search, $options: "i" } },
        { taxCode: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const pharmacies = await Pharmacy.find(filter)
      .populate("user", "username email fullName walletAddress")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Pharmacy.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: {
        pharmacies,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
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
};

