import User from "../models/User.js";
import PharmaCompany from "../models/PharmaCompany.js";
import Distributor from "../models/Distributor.js";
import Pharmacy from "../models/Pharmacy.js";
import NFTInfo from "../models/NFTInfo.js";
import DrugInfo from "../models/DrugInfo.js";
import ManufacturerInvoice from "../models/ManufacturerInvoice.js";
import CommercialInvoice from "../models/CommercialInvoice.js";
import ProofOfProduction from "../models/ProofOfProduction.js";
import ProofOfDistribution from "../models/ProofOfDistribution.js";
import ProofOfPharmacy from "../models/ProofOfPharmacy.js";
import bcrypt from "bcryptjs";
import { getTrackingHistory } from "../services/blockchainService.js";
import { handleError, handleValidationError } from "../utils/errorHandler.js";

export const trackDrugByNFTId = async (req, res) => {
  try {
    const { tokenId } = req.params;

    if (!tokenId) {
      return res.status(400).json({
        success: false,
        message: "tokenId là bắt buộc",
      });
    }

    const nft = await NFTInfo.findOne({ tokenId })
      .populate("drug", "tradeName atcCode genericName dosageForm strength packaging")
      .populate("owner", "username email fullName walletAddress")
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

    // Lấy production để có batchNumber
    let production = null;
    let batchNumber = nft.batchNumber;
    let productionId = null;
    
    if (nft.proofOfProduction) {
      // Xử lý cả trường hợp đã populate (object) và chưa populate (ObjectId)
      productionId = nft.proofOfProduction._id || nft.proofOfProduction;
      
      // Nếu đã populate, dùng trực tiếp, nếu chưa thì query lại
      if (nft.proofOfProduction._id) {
        production = nft.proofOfProduction;
      } else {
        production = await ProofOfProduction.findById(productionId);
      }
      
      if (production && production.batchNumber) {
        batchNumber = production.batchNumber;
      }
    }

    // Tìm tất cả NFT trong cùng batch để có thể tìm được các invoice/proof liên quan
    let batchNFTIds = [nft._id];
    if (batchNumber) {
      const batchNFTs = await NFTInfo.find({ batchNumber }).select("_id");
      batchNFTIds = batchNFTs.map(n => n._id);
    }

    // Tìm tất cả proofOfProduction trong cùng batch
    let batchProductionIds = [];
    if (productionId) {
      batchProductionIds.push(productionId);
    }
    if (batchNumber) {
      const batchProductions = await ProofOfProduction.find({ batchNumber }).select("_id");
      const productionIds = batchProductions.map(p => p._id);
      batchProductionIds = [...batchProductionIds, ...productionIds];
      // Loại bỏ duplicate bằng cách so sánh ObjectId
      const uniqueIds = [];
      const seen = new Set();
      batchProductionIds.forEach(id => {
        const idStr = id.toString();
        if (!seen.has(idStr)) {
          seen.add(idStr);
          uniqueIds.push(id);
        }
      });
      batchProductionIds = uniqueIds;
    }

    // Tìm các invoice và proof liên quan trong supply chain (tìm theo batch)
    // Tìm tất cả, không chỉ findOne để có thể tìm được nhiều hơn
    const manufacturerInvoices = await ManufacturerInvoice.find({
      $or: [
        { nftInfo: { $in: batchNFTIds } },
        batchProductionIds.length > 0 ? { proofOfProduction: { $in: batchProductionIds } } : null,
      ].filter(Boolean),
    })
      .populate("fromManufacturer", "username email fullName walletAddress")
      .populate("toDistributor", "username email fullName walletAddress")
      .sort({ createdAt: -1 });
    
    const manufacturerInvoice = manufacturerInvoices[0] || null;
    const manufacturerInvoiceIds = manufacturerInvoices.map(inv => inv._id);

    const proofOfDistributions = await ProofOfDistribution.find({
      $or: [
        manufacturerInvoiceIds.length > 0 ? { manufacturerInvoice: { $in: manufacturerInvoiceIds } } : null,
        batchProductionIds.length > 0 ? { proofOfProduction: { $in: batchProductionIds } } : null,
        { nftInfo: { $in: batchNFTIds } },
      ].filter(Boolean),
    })
      .populate("fromManufacturer", "username email fullName")
      .populate("toDistributor", "username email fullName")
      .sort({ createdAt: -1 });
    
    const proofOfDistribution = proofOfDistributions[0] || null;
    const proofOfDistributionIds = proofOfDistributions.map(pod => pod._id);

    // Tìm ProofOfPharmacy có proofOfDistribution hoặc nftInfo trong batch
    const proofOfPharmacies = await ProofOfPharmacy.find({
      $or: [
        proofOfDistributionIds.length > 0 ? { proofOfDistribution: { $in: proofOfDistributionIds } } : null,
        { nftInfo: { $in: batchNFTIds } },
      ].filter(Boolean),
    })
      .populate("fromDistributor", "username email fullName")
      .populate("toPharmacy", "username email fullName")
      .sort({ createdAt: -1 });
    
    const proofOfPharmacy = proofOfPharmacies[0] || null;
    const proofOfPharmacyIds = proofOfPharmacies.map(pop => pop._id);

    // Tìm CommercialInvoice qua nftInfo hoặc proofOfPharmacy
    const commercialInvoices = await CommercialInvoice.find({
      $or: [
        { nftInfo: { $in: batchNFTIds } },
        proofOfPharmacyIds.length > 0 ? { proofOfPharmacy: { $in: proofOfPharmacyIds } } : null,
      ].filter(Boolean),
    })
      .populate("fromDistributor", "username email fullName walletAddress")
      .populate("toPharmacy", "username email fullName walletAddress")
      .sort({ createdAt: -1 });
    
    const commercialInvoice = commercialInvoices[0] || null;

    // Tạo chuỗi hành trình từ các thông tin đã tìm được
    const journey = [];
    
    if (production) {
      await production.populate("manufacturer", "name");
      journey.push({
        stage: "manufacturing",
        description: "Sản xuất",
        manufacturer: production.manufacturer?.name || "N/A",
        date: production.mfgDate || production.createdAt,
        details: {
          quantity: production.quantity,
          mfgDate: production.mfgDate,
        },
      });
    } else if (nft.proofOfProduction) {
      const productionData = await ProofOfProduction.findById(nft.proofOfProduction)
        .populate("manufacturer", "name");
      if (productionData) {
        journey.push({
          stage: "manufacturing",
          description: "Sản xuất",
          manufacturer: productionData.manufacturer?.name || "N/A",
          date: productionData.mfgDate || productionData.createdAt,
          details: {
            quantity: productionData.quantity,
            mfgDate: productionData.mfgDate,
          },
        });
      }
    }

    if (manufacturerInvoice) {
      journey.push({
        stage: "transfer_to_distributor",
        description: "Chuyển giao cho Nhà phân phối",
        from: manufacturerInvoice.fromManufacturer?.fullName || manufacturerInvoice.fromManufacturer?.username || "N/A",
        to: manufacturerInvoice.toDistributor?.fullName || manufacturerInvoice.toDistributor?.username || "N/A",
        date: manufacturerInvoice.createdAt,
        invoiceNumber: manufacturerInvoice.invoiceNumber,
      });
    }

    if (proofOfDistribution) {
      journey.push({
        stage: "distributor_received",
        description: "Nhà phân phối đã nhận hàng",
        date: proofOfDistribution.distributionDate || proofOfDistribution.createdAt,
        status: proofOfDistribution.status,
      });
    }

    if (commercialInvoice) {
      journey.push({
        stage: "transfer_to_pharmacy",
        description: "Chuyển giao cho Nhà thuốc",
        from: commercialInvoice.fromDistributor?.fullName || commercialInvoice.fromDistributor?.username || "N/A",
        to: commercialInvoice.toPharmacy?.fullName || commercialInvoice.toPharmacy?.username || "N/A",
        date: commercialInvoice.createdAt,
        invoiceNumber: commercialInvoice.invoiceNumber,
      });
    }

    if (proofOfPharmacy) {
      journey.push({
        stage: "pharmacy_received",
        description: "Nhà thuốc đã nhận hàng",
        date: proofOfPharmacy.receiptDate || proofOfPharmacy.createdAt,
        status: proofOfPharmacy.status,
        supplyChainCompleted: proofOfPharmacy.supplyChainCompleted,
      });
    }

    // Thông tin NFT cơ bản (public info)
    const nftInfo = {
      tokenId: nft.tokenId,
      serialNumber: nft.serialNumber,
      batchNumber: nft.batchNumber,
      drug: {
        tradeName: nft.drug?.tradeName,
        atcCode: nft.drug?.atcCode,
        genericName: nft.drug?.genericName,
        dosageForm: nft.drug?.dosageForm,
        strength: nft.drug?.strength,
        packaging: nft.drug?.packaging,
      },
      mfgDate: nft.mfgDate,
      expDate: nft.expDate,
      status: nft.status,
      currentOwner: nft.owner ? {
        username: nft.owner.username,
        fullName: nft.owner.fullName,
      } : null,
    };

    const blockchainData  = {
        nft: nftInfo,
        blockchainHistory,
        journey,
        supplyChain: {
          manufacturer: manufacturerInvoice?.fromManufacturer ? {
            name: manufacturerInvoice.fromManufacturer.fullName || manufacturerInvoice.fromManufacturer.username,
            email: manufacturerInvoice.fromManufacturer.email,
          } : null,
          distributor: commercialInvoice?.fromDistributor ? {
            name: commercialInvoice.fromDistributor.fullName || commercialInvoice.fromDistributor.username,
            email: commercialInvoice.fromDistributor.email,
          } : null,
          pharmacy: commercialInvoice?.toPharmacy ? {
            name: commercialInvoice.toPharmacy.fullName || commercialInvoice.toPharmacy.username,
            email: commercialInvoice.toPharmacy.email,
          } : null
        } 
    }

    const base64urlString = Buffer.from(JSON.stringify(blockchainData)).toString('base64url');

    const url = `https://ailusion.io.vn/verify?data=${base64urlString}`;

    return res.redirect(302, url);

  } catch (error) {
    console.error("Lỗi khi theo dõi hành trình:", error);
    const errorMessage = {
      success: false,
      message: error.message || "Lỗi server khi theo dõi hành trình",
      error: error.message,
    };
    const base64Urlstring = Buffer.from(JSON.stringify(errorMessage)).toString('base64url');
    const url = `https://ailusion.io.vn/verify?data=${base64Urlstring}`;
    return res.redirect(302, url);
  }
};

export const trackingDrugsInfo = async (req, res) => {
  try {
    const { identifier } = req.params;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Id là bắt buộc",
      });
    }

    // Tìm NFT
    const nft = await NFTInfo.findOne({
      $or: [
        { tokenId: identifier },
        { serialNumber: identifier },
        { batchNumber: identifier }  
      ]
    })
      .populate("drug", "tradeName atcCode genericName")
      .populate("owner", "username email fullName walletAddress")
      .populate("proofOfProduction")
      
      
    if (!nft) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy NFT với tokenId này",
      });
    }

    // Lấy lịch sử từ blockchain
    let blockchainHistory = [];
    try {
      blockchainHistory = await getTrackingHistory(nft.tokenId);
    } catch (error) {
      console.error("Lỗi khi lấy lịch sử blockchain:", error);
    }

    // Lấy production để có batchNumber
    let production = null;
    let batchNumber = nft.batchNumber;
    let productionId = null;
    
    if (nft.proofOfProduction) {
      // Xử lý cả trường hợp đã populate (object) và chưa populate (ObjectId)
      productionId = nft.proofOfProduction._id || nft.proofOfProduction;
      
      // Nếu đã populate, dùng trực tiếp, nếu chưa thì query lại
      if (nft.proofOfProduction._id) {
        production = nft.proofOfProduction;
      } else {
        production = await ProofOfProduction.findById(productionId);
      }
      
      if (production && production.batchNumber) {
        batchNumber = production.batchNumber;
      }
    }

    // Tìm tất cả NFT trong cùng batch để có thể tìm được các invoice/proof liên quan
    let batchNFTIds = [nft._id];
    if (batchNumber) {
      const batchNFTs = await NFTInfo.find({ batchNumber }).select("_id");
      batchNFTIds = batchNFTs.map(n => n._id);
    }

    // Tìm tất cả proofOfProduction trong cùng batch
    let batchProductionIds = [];
    if (productionId) {
      batchProductionIds.push(productionId);
    }
    if (batchNumber) {
      const batchProductions = await ProofOfProduction.find({ batchNumber }).select("_id");
      const productionIds = batchProductions.map(p => p._id);
      batchProductionIds = [...batchProductionIds, ...productionIds];
      // Loại bỏ duplicate bằng cách so sánh ObjectId
      const uniqueIds = [];
      const seen = new Set();
      batchProductionIds.forEach(id => {
        const idStr = id.toString();
        if (!seen.has(idStr)) {
          seen.add(idStr);
          uniqueIds.push(id);
        }
      });
      batchProductionIds = uniqueIds;
    }

    // Tìm các invoice và proof liên quan trong supply chain (tìm theo batch)
    // Tìm tất cả, không chỉ findOne để có thể tìm được nhiều hơn
    const manufacturerInvoices = await ManufacturerInvoice.find({
      $or: [
        { nftInfo: { $in: batchNFTIds } },
        batchProductionIds.length > 0 ? { proofOfProduction: { $in: batchProductionIds } } : null,
      ].filter(Boolean),
    })
      .populate("fromManufacturer", "username email fullName walletAddress")
      .populate("toDistributor", "username email fullName walletAddress")
      .sort({ createdAt: -1 });
    
    const manufacturerInvoice = manufacturerInvoices[0] || null;
    const manufacturerInvoiceIds = manufacturerInvoices.map(inv => inv._id);

    const proofOfDistributions = await ProofOfDistribution.find({
      $or: [
        manufacturerInvoiceIds.length > 0 ? { manufacturerInvoice: { $in: manufacturerInvoiceIds } } : null,
        batchProductionIds.length > 0 ? { proofOfProduction: { $in: batchProductionIds } } : null,
        { nftInfo: { $in: batchNFTIds } },
      ].filter(Boolean),
    })
      .populate("fromManufacturer", "username email fullName")
      .populate("toDistributor", "username email fullName")
      .sort({ createdAt: -1 });
    
    const proofOfDistribution = proofOfDistributions[0] || null;
    const proofOfDistributionIds = proofOfDistributions.map(pod => pod._id);

    // Tìm ProofOfPharmacy có proofOfDistribution hoặc nftInfo trong batch
    const proofOfPharmacies = await ProofOfPharmacy.find({
      $or: [
        proofOfDistributionIds.length > 0 ? { proofOfDistribution: { $in: proofOfDistributionIds } } : null,
        { nftInfo: { $in: batchNFTIds } },
      ].filter(Boolean),
    })
      .populate("fromDistributor", "username email fullName")
      .populate("toPharmacy", "username email fullName")
      .sort({ createdAt: -1 });
    
    const proofOfPharmacy = proofOfPharmacies[0] || null;
    const proofOfPharmacyIds = proofOfPharmacies.map(pop => pop._id);

    // Tìm CommercialInvoice qua nftInfo hoặc proofOfPharmacy
    const commercialInvoices = await CommercialInvoice.find({
      $or: [
        { nftInfo: { $in: batchNFTIds } },
        proofOfPharmacyIds.length > 0 ? { proofOfPharmacy: { $in: proofOfPharmacyIds } } : null,
      ].filter(Boolean),
    })
      .populate("fromDistributor", "username email fullName walletAddress")
      .populate("toPharmacy", "username email fullName walletAddress")
      .sort({ createdAt: -1 });
    
    const commercialInvoice = commercialInvoices[0] || null;

    // Tạo chuỗi hành trình từ các thông tin đã tìm được
    const journey = [];
    
    if (production) {
      await production.populate("manufacturer", "name");
      journey.push({
        stage: "manufacturing",
        description: "Sản xuất",
        manufacturer: production.manufacturer?.name || "N/A",
        date: production.mfgDate || production.createdAt,
        details: {
          quantity: production.quantity,
          mfgDate: production.mfgDate,
        },
      });
    } else if (nft.proofOfProduction) {
      const productionData = await ProofOfProduction.findById(nft.proofOfProduction)
        .populate("manufacturer", "name");
      if (productionData) {
        journey.push({
          stage: "manufacturing",
          description: "Sản xuất",
          manufacturer: productionData.manufacturer?.name || "N/A",
          date: productionData.mfgDate || productionData.createdAt,
          details: {
            quantity: productionData.quantity,
            mfgDate: productionData.mfgDate,
          },
        });
      }
    }

    if (manufacturerInvoice) {
      journey.push({
        stage: "transfer_to_distributor",
        description: "Chuyển giao cho Nhà phân phối",
        from: manufacturerInvoice.fromManufacturer?.fullName || manufacturerInvoice.fromManufacturer?.username || "N/A",
        to: manufacturerInvoice.toDistributor?.fullName || manufacturerInvoice.toDistributor?.username || "N/A",
        date: manufacturerInvoice.createdAt,
        invoiceNumber: manufacturerInvoice.invoiceNumber,
      });
    }

    if (proofOfDistribution) {
      journey.push({
        stage: "distributor_received",
        description: "Nhà phân phối đã nhận hàng",
        date: proofOfDistribution.distributionDate || proofOfDistribution.createdAt,
        status: proofOfDistribution.status,
      });
    }

    if (commercialInvoice) {
      journey.push({
        stage: "transfer_to_pharmacy",
        description: "Chuyển giao cho Nhà thuốc",
        from: commercialInvoice.fromDistributor?.fullName || commercialInvoice.fromDistributor?.username || "N/A",
        to: commercialInvoice.toPharmacy?.fullName || commercialInvoice.toPharmacy?.username || "N/A",
        date: commercialInvoice.createdAt,
        invoiceNumber: commercialInvoice.invoiceNumber,
      });
    }

    if (proofOfPharmacy) {
      journey.push({
        stage: "pharmacy_received",
        description: "Nhà thuốc đã nhận hàng",
        date: proofOfPharmacy.receiptDate || proofOfPharmacy.createdAt,
        status: proofOfPharmacy.status,
        supplyChainCompleted: proofOfPharmacy.supplyChainCompleted,
      });
    }

     // Thông tin NFT cơ bản (public info)
    const nftInfo = {
      tokenId: nft.tokenId,
      serialNumber: nft.serialNumber,
      batchNumber: nft.batchNumber,
      drug: {
        tradeName: nft.drug?.tradeName,
        atcCode: nft.drug?.atcCode,
        genericName: nft.drug?.genericName,
        dosageForm: nft.drug?.dosageForm,
        strength: nft.drug?.strength,
        packaging: nft.drug?.packaging,
      },
      mfgDate: nft.mfgDate,
      expDate: nft.expDate,
      status: nft.status,
      currentOwner: nft.owner ? {
        username: nft.owner.username,
        fullName: nft.owner.fullName,
      } : null,
    };

    return res.status(200).json({
      success: true,
      data: {
        nft: nftInfo,
        blockchainHistory,
        journey,
        supplyChain: {
          manufacturer: manufacturerInvoice?.fromManufacturer ? {
            name: manufacturerInvoice.fromManufacturer.fullName || manufacturerInvoice.fromManufacturer.username,
            email: manufacturerInvoice.fromManufacturer.email,
          } : null,
          distributor: commercialInvoice?.fromDistributor ? {
            name: commercialInvoice.fromDistributor.fullName || commercialInvoice.fromDistributor.username,
            email: commercialInvoice.fromDistributor.email,
          } : null,
          pharmacy: commercialInvoice?.toPharmacy ? {
            name: commercialInvoice.toPharmacy.fullName || commercialInvoice.toPharmacy.username,
            email: commercialInvoice.toPharmacy.email,
          } : null,
        },
      },
    });

  } catch (error) {
    return handleError(error, "Lỗi khi theo dõi hành trình:", res, "Lỗi server khi theo dõi hành trình");
  }
};

export const searchDrugByATCCode = async (req, res) => {
  try {
    const { atcCode } = req.query;

    if (!atcCode) {
      return res.status(400).json({
        success: false,
        message: "atcCode là bắt buộc",
      });
    }

    const drug = await DrugInfo.findOne(
      {
        $or: [
          { atcCode: atcCode },
          { tradeName: atcCode }
        ]
      }
    )
      .populate("manufacturer", "name licenseNo taxCode");

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
    return handleValidationError(error, "Lỗi khi tìm kiếm thuốc:", res);
  }
};
